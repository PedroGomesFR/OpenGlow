import express from 'express';
import connectDB from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { verifyToken } from "../middleware/auth.js";
import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

const USER_PROJECTION = {
    password: 0,
    passwordResetCodeHash: 0,
    passwordResetCodeExpires: 0,
    verificationCode: 0,
    verificationCodeExpires: 0,
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatEmailBody = ({ message, purpose, senderName }) => {
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
    const safePurpose = escapeHtml(purpose);
    const safeSender = escapeHtml(senderName || 'Administration OpenGlow');

    return `
        <div style="font-family: Arial, sans-serif; color: #1c1c1e; line-height: 1.6;">
            <h1 style="font-size: 24px; margin-bottom: 16px;">Message de l'administration OpenGlow</h1>
            <p style="margin-bottom: 12px;"><strong>Motif de l'envoi :</strong> ${safePurpose}</p>
            <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                ${safeMessage}
            </div>
            <p style="font-size: 14px; color: #636366;">Cet e-mail est envoyé dans le cadre du fonctionnement du service ou du support utilisateur.</p>
            <p style="font-size: 14px; color: #636366;">Émis par : ${safeSender}</p>
        </div>
    `;
};

const chunk = (items, size) => {
    const batches = [];
    for (let index = 0; index < items.length; index += size) {
        batches.push(items.slice(index, index + size));
    }
    return batches;
};

const toCsvRow = (row) => Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');

const arrayToCsv = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    return [headers.map((h) => `"${h}"`).join(','), ...rows.map(toCsvRow)].join('\n');
};

const buildSegmentFilter = (segment = {}) => {
    const filter = {};
    if (Array.isArray(segment.cities) && segment.cities.length) {
        const sanitized = segment.cities.map((c) => String(c).trim()).filter(Boolean);
        if (sanitized.length) {
            filter.city = { $in: sanitized.map((c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) };
        }
    }
    if (Array.isArray(segment.serviceCategories) && segment.serviceCategories.length) {
        const sanitized = segment.serviceCategories.map((s) => String(s).trim()).filter(Boolean);
        if (sanitized.length) {
            filter.profession = { $in: sanitized.map((s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) };
        }
    }
    if (segment.minSeniority && Number.isFinite(Number(segment.minSeniority))) {
        const days = Math.max(0, Number(segment.minSeniority));
        filter.createdAt = { $lte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
    return filter;
};

const buildRecipientFilter = ({ audience, recipientIds }) => {
    if (audience === 'clients') {
        return { isClient: true };
    }

    if (audience === 'professionals') {
        return { isClient: false, isAdmin: { $ne: true } };
    }

    if (audience === 'custom') {
        const sanitizedIds = (Array.isArray(recipientIds) ? recipientIds : [])
            .filter((id) => ObjectId.isValid(id))
            .map((id) => new ObjectId(id));

        return sanitizedIds.length ? { _id: { $in: sanitizedIds } } : null;
    }

    return {};
};

const getAdminUser = async (db, userId) => {
    if (!ObjectId.isValid(userId)) {
        return null;
    }

    return db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: USER_PROJECTION });
};

const createAuditLog = async (db, payload) => {
    await db.collection('admin_audit_logs').insertOne({
        ...payload,
        createdAt: new Date(),
    });
};

const toSerializable = (value) => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value instanceof ObjectId) {
        return value.toString();
    }

    if (Array.isArray(value)) {
        return value.map(toSerializable);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, toSerializable(entry)]));
    }

    return value;
};

const getAdminDisplayName = (adminUser) => adminUser?.companyName || `${adminUser?.prenom || ''} ${adminUser?.nom || ''}`.trim() || 'Administration OpenGlow';

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
    try {
        const db = await connectDB();
        const user = await getAdminUser(db, req.userId);

        if (!user || user.isAdmin !== true) {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        req.adminUser = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error during admin verification' });
    }
};

router.get('/dashboard', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');
        const bookingsCollection = db.collection('bookings');
        const pendingCollection = db.collection('pending_registrations');
        const announcementsCollection = db.collection('announcements');
        const logsCollection = db.collection('admin_audit_logs');
        const now = new Date();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            totalClients,
            totalProfessionals,
            totalAdmins,
            pendingRegistrations,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            cancelledBookings,
            activeAnnouncements,
            emailsSentLast30Days,
            recentUsers,
            recentBookings,
            recentPendingRegistrations,
            recentCommunications,
        ] = await Promise.all([
            usersCollection.countDocuments(),
            usersCollection.countDocuments({ isClient: true }),
            usersCollection.countDocuments({ isClient: false, isAdmin: { $ne: true } }),
            usersCollection.countDocuments({ isAdmin: true }),
            pendingCollection.countDocuments(),
            bookingsCollection.countDocuments(),
            bookingsCollection.countDocuments({ status: 'pending' }),
            bookingsCollection.countDocuments({ status: 'confirmed' }),
            bookingsCollection.countDocuments({ status: 'completed' }),
            bookingsCollection.countDocuments({ status: 'cancelled' }),
            announcementsCollection.countDocuments({
                isActive: true,
                $or: [
                    { endDate: null },
                    { endDate: { $exists: false } },
                    { endDate: { $gte: now } },
                ],
            }),
            logsCollection.countDocuments({ type: 'email_campaign', createdAt: { $gte: monthAgo } }),
            usersCollection.find({}, { projection: USER_PROJECTION }).sort({ createdAt: -1, _id: -1 }).limit(8).toArray(),
            bookingsCollection.find({}).sort({ createdAt: -1, _id: -1 }).limit(10).toArray(),
            pendingCollection.find({}, {
                projection: {
                    password: 0,
                    verificationCode: 0,
                    verificationCodeExpires: 0,
                },
            }).sort({ createdAt: -1, _id: -1 }).limit(8).toArray(),
            logsCollection.find({}).sort({ createdAt: -1, _id: -1 }).limit(10).toArray(),
        ]);

        res.json({
            summary: {
                totalUsers,
                totalClients,
                totalProfessionals,
                totalAdmins,
                pendingRegistrations,
                totalBookings,
                pendingBookings,
                confirmedBookings,
                completedBookings,
                cancelledBookings,
                activeAnnouncements,
                emailsSentLast30Days,
            },
            recentUsers,
            recentBookings,
            recentPendingRegistrations,
            recentCommunications,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users (Protected)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = await connectDB();
        const users = await db.collection('users').find({}, { projection: USER_PROJECTION }).sort({ createdAt: -1, _id: -1 }).toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/bookings', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = await connectDB();
        const { status, limit } = req.query;
        const query = {};

        if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            query.status = status;
        }

        const parsedLimit = Math.min(Number(limit) || 200, 500);
        const bookings = await db.collection('bookings').find(query).sort({ createdAt: -1, _id: -1 }).limit(parsedLimit).toArray();

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/pending-registrations', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = await connectDB();
        const pendingRegistrations = await db.collection('pending_registrations').find({}, {
            projection: {
                password: 0,
                verificationCode: 0,
                verificationCodeExpires: 0,
            },
        }).sort({ createdAt: -1, _id: -1 }).limit(200).toArray();

        res.json(pendingRegistrations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/communications/logs', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = await connectDB();
        const logs = await db.collection('admin_audit_logs').find({}).sort({ createdAt: -1, _id: -1 }).limit(100).toArray();

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/notifications', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = await connectDB();
        const notifications = await db.collection('internal_notifications').find({}).sort({ createdAt: -1, _id: -1 }).limit(100).toArray();

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/notifications', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const {
            title,
            message,
            audience = 'all',
            type = 'info',
            showBanner = false,
            startsAt = null,
            expiresAt = null,
            recipientIds = [],
            segment = {},
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required.' });
        }

        if (!['all', 'clients', 'professionals', 'custom', 'segment'].includes(audience)) {
            return res.status(400).json({ error: 'Invalid audience.' });
        }

        const db = await connectDB();

        let targetUserIds = [];

        if (audience === 'custom') {
            targetUserIds = (Array.isArray(recipientIds) ? recipientIds : []).filter((id) => ObjectId.isValid(id));
            if (!targetUserIds.length) {
                return res.status(400).json({ error: 'At least one recipient is required for a custom notification.' });
            }
        } else if (audience === 'segment') {
            const segmentFilter = buildSegmentFilter(segment);
            const audienceBaseFilter = segment.role === 'clients'
                ? { isClient: true }
                : segment.role === 'professionals'
                    ? { isClient: false, isAdmin: { $ne: true } }
                    : {};
            const combinedFilter = { ...audienceBaseFilter, ...segmentFilter };
            const matchedUsers = await db.collection('users').find(combinedFilter, { projection: { _id: 1 } }).toArray();
            targetUserIds = matchedUsers.map((u) => String(u._id));
            if (!targetUserIds.length) {
                return res.status(400).json({ error: 'Aucun utilisateur ne correspond aux critères de segmentation.' });
            }
        }

        const notification = {
            title: title.trim(),
            message: message.trim(),
            audience,
            type,
            showBanner: Boolean(showBanner),
            isActive: true,
            targetUserIds,
            segment: audience === 'segment' ? segment : null,
            startsAt: startsAt ? new Date(startsAt) : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            readByUserIds: [],
            dismissedByUserIds: [],
            createdBy: new ObjectId(req.userId),
            createdByName: getAdminDisplayName(req.adminUser),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('internal_notifications').insertOne(notification);

        await createAuditLog(db, {
            type: 'internal_notification',
            notificationId: result.insertedId,
            audience,
            title: notification.title,
            senderId: new ObjectId(req.userId),
            senderName: notification.createdByName,
        });

        res.status(201).json({ ...notification, _id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/notifications/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid notification id.' });
        }

        const db = await connectDB();
        await db.collection('internal_notifications').updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: Boolean(isActive), updatedAt: new Date() } }
        );

        await createAuditLog(db, {
            type: 'internal_notification_status',
            notificationId: new ObjectId(id),
            isActive: Boolean(isActive),
            senderId: new ObjectId(req.userId),
            senderName: getAdminDisplayName(req.adminUser),
        });

        res.status(200).json({ message: 'Notification updated.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/communications/email', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { subject, message, purpose, audience = 'custom', recipientIds = [] } = req.body;

        if (!subject || !message || !purpose) {
            return res.status(400).json({ error: 'Subject, message and purpose are required.' });
        }

        if (!['all', 'clients', 'professionals', 'custom'].includes(audience)) {
            return res.status(400).json({ error: 'Invalid audience.' });
        }

        const db = await connectDB();
        const recipientFilter = buildRecipientFilter({ audience, recipientIds });

        if (recipientFilter === null) {
            return res.status(400).json({ error: 'At least one recipient is required for a custom audience.' });
        }

        const recipients = await db.collection('users').find({
            ...recipientFilter,
            email: { $exists: true, $nin: [null, ''] },
        }, {
            projection: USER_PROJECTION,
        }).toArray();

        if (!recipients.length) {
            return res.status(404).json({ error: 'No recipients found.' });
        }

        const senderName = getAdminDisplayName(req.adminUser);
        const emailHtml = formatEmailBody({ message, purpose, senderName });

        const batches = chunk(recipients, 20);
        let sentCount = 0;
        const failedRecipients = [];

        for (const batch of batches) {
            const results = await Promise.allSettled(batch.map((recipient) => sendEmail({
                email: recipient.email,
                subject,
                html: emailHtml,
            })));

            results.forEach((result, index) => {
                const recipient = batch[index];
                if (result.status === 'fulfilled' && result.value) {
                    sentCount += 1;
                } else {
                    failedRecipients.push({
                        userId: recipient._id,
                        email: recipient.email,
                    });
                }
            });
        }

        await createAuditLog(db, {
            type: 'email_campaign',
            audience,
            purpose,
            subject,
            recipientCount: recipients.length,
            successCount: sentCount,
            failedCount: failedRecipients.length,
            failedRecipients,
            recipientUserIds: recipients.map((recipient) => recipient._id),
            senderId: new ObjectId(req.userId),
            senderName,
        });

        res.status(200).json({
            message: 'Emails processed.',
            recipientCount: recipients.length,
            successCount: sentCount,
            failedCount: failedRecipients.length,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user (Protected)
router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await connectDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id.' });
        }

        const targetUser = await db.collection('users').findOne({ _id: new ObjectId(id) }, { projection: USER_PROJECTION });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (String(targetUser._id) === String(req.userId)) {
            return res.status(400).json({ error: 'You cannot delete your own admin account.' });
        }

        // Delete user
        await db.collection('users').deleteOne({ _id: new ObjectId(id) });

        // Also delete associated bookings
        await db.collection('bookings').deleteMany({
            $or: [{ clientId: id }, { professionalId: id }]
        });

        await createAuditLog(db, {
            type: 'user_deletion',
            targetUserId: targetUser._id,
            targetEmail: targetUser.email,
            targetRole: targetUser.isAdmin ? 'admin' : targetUser.isClient ? 'client' : 'professional',
            senderId: new ObjectId(req.userId),
            senderName: getAdminDisplayName(req.adminUser),
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/users/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isSuspended, reason = '', message = '', suspensionLiftAt = null } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id.' });
        }

        const db = await connectDB();
        const targetUser = await db.collection('users').findOne({ _id: new ObjectId(id) }, { projection: USER_PROJECTION });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (String(targetUser._id) === String(req.userId)) {
            return res.status(400).json({ error: 'You cannot suspend or reactivate your own admin account.' });
        }

        const suspensionMessage = message?.trim() || (isSuspended ? 'Votre compte a été suspendu temporairement. Contactez le support.' : 'Votre compte a été réactivé.');
        const parsedLiftAt = isSuspended && suspensionLiftAt ? new Date(suspensionLiftAt) : null;
        const update = isSuspended
            ? {
                isSuspended: true,
                suspendedAt: new Date(),
                suspendedReason: reason?.trim() || 'Suspension administrative',
                suspensionMessage,
                suspensionLiftAt: parsedLiftAt,
                suspendedBy: req.userId,
                updatedAt: new Date(),
            }
            : {
                isSuspended: false,
                suspendedAt: null,
                suspendedReason: null,
                suspensionMessage,
                suspensionLiftAt: null,
                suspendedBy: null,
                updatedAt: new Date(),
            };

        await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: update });

        await db.collection('internal_notifications').insertOne({
            title: isSuspended ? 'Compte suspendu' : 'Compte réactivé',
            message: suspensionMessage,
            audience: 'custom',
            type: isSuspended ? 'warning' : 'success',
            showBanner: true,
            isActive: true,
            targetUserIds: [String(targetUser._id)],
            startsAt: new Date(),
            expiresAt: null,
            readByUserIds: [],
            dismissedByUserIds: [],
            createdBy: new ObjectId(req.userId),
            createdByName: getAdminDisplayName(req.adminUser),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await createAuditLog(db, {
            type: isSuspended ? 'user_suspension' : 'user_reactivation',
            targetUserId: targetUser._id,
            targetEmail: targetUser.email,
            reason: update.suspendedReason,
            message: suspensionMessage,
            senderId: new ObjectId(req.userId),
            senderName: getAdminDisplayName(req.adminUser),
        });

        res.status(200).json({
            message: isSuspended ? 'User suspended.' : 'User reactivated.',
            data: update,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/:id/export', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id.' });
        }

        const db = await connectDB();
        const targetId = new ObjectId(id);
        const targetUser = await db.collection('users').findOne({ _id: targetId }, { projection: USER_PROJECTION });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const [bookings, reviews, services, announcements, notifications, auditLogs] = await Promise.all([
            db.collection('bookings').find({
                $or: [
                    { clientId: id },
                    { professionalId: id },
                    { clientId: targetId },
                    { professionalId: targetId },
                ],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('reviews').find({
                $or: [
                    { clientId: targetId },
                    { professionalId: targetId },
                    { clientId: id },
                    { professionalId: id },
                ],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('services').find({
                $or: [
                    { professionalId: id },
                    { professionalId: targetId },
                ],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('announcements').find({
                $or: [
                    { professionalId: targetId },
                    { professionalId: id },
                ],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('internal_notifications').find({
                $or: [
                    { targetUserIds: id },
                    { readByUserIds: id },
                    { dismissedByUserIds: id },
                ],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('admin_audit_logs').find({
                $or: [
                    { targetUserId: targetId },
                    { recipientUserIds: targetId },
                    { targetEmail: targetUser.email },
                ],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
        ]);

        const exportPayload = {
            exportedAt: new Date().toISOString(),
            exportedBy: {
                id: req.userId,
                name: getAdminDisplayName(req.adminUser),
            },
            user: targetUser,
            relatedData: {
                bookings,
                reviews,
                services,
                announcements,
                notifications,
                auditLogs,
            },
            summary: {
                bookings: bookings.length,
                reviews: reviews.length,
                services: services.length,
                announcements: announcements.length,
                notifications: notifications.length,
                auditLogs: auditLogs.length,
            },
        };

        await createAuditLog(db, {
            type: 'gdpr_export',
            targetUserId: targetUser._id,
            targetEmail: targetUser.email,
            senderId: new ObjectId(req.userId),
            senderName: getAdminDisplayName(req.adminUser),
        });

        res.status(200).json(toSerializable(exportPayload));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/:id/export-zip', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const archiver = (await import('archiver')).default;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id.' });
        }

        const db = await connectDB();
        const targetId = new ObjectId(id);
        const targetUser = await db.collection('users').findOne({ _id: targetId }, { projection: USER_PROJECTION });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const [bookings, reviews, services, announcements, notifications, auditLogs] = await Promise.all([
            db.collection('bookings').find({
                $or: [{ clientId: id }, { professionalId: id }, { clientId: targetId }, { professionalId: targetId }],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('reviews').find({
                $or: [{ clientId: targetId }, { professionalId: targetId }, { clientId: id }, { professionalId: id }],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('services').find({
                $or: [{ professionalId: id }, { professionalId: targetId }],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('announcements').find({
                $or: [{ professionalId: targetId }, { professionalId: id }],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('internal_notifications').find({
                $or: [{ targetUserIds: id }, { readByUserIds: id }, { dismissedByUserIds: id }],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
            db.collection('admin_audit_logs').find({
                $or: [
                    { targetUserId: targetId },
                    { recipientUserIds: targetId },
                    { targetEmail: targetUser.email },
                ],
            }).sort({ createdAt: -1, _id: -1 }).toArray(),
        ]);

        const serialize = (arr) => toSerializable(arr);

        const metaJson = JSON.stringify({
            exportedAt: new Date().toISOString(),
            exportedBy: { id: req.userId, name: getAdminDisplayName(req.adminUser) },
            summary: {
                bookings: bookings.length,
                reviews: reviews.length,
                services: services.length,
                announcements: announcements.length,
                notifications: notifications.length,
                auditLogs: auditLogs.length,
            },
        }, null, 2);

        const bookingsCsv = arrayToCsv(serialize(bookings).map((b) => ({
            client: b.clientName || '',
            email_client: b.clientEmail || '',
            professionnel: b.professionalName || '',
            prestation: b.serviceName || '',
            date: b.date || '',
            heure: b.time || '',
            statut: b.status || '',
            montant: b.servicePrice || '',
            notes: b.notes || '',
            cree_le: b.createdAt || '',
        })));

        const reviewsCsv = arrayToCsv(serialize(reviews).map((r) => ({
            auteur: r.clientName || '',
            destinataire: r.professionalName || '',
            note: r.rating ?? '',
            commentaire: r.comment || '',
            date: r.createdAt || '',
        })));

        const auditCsv = arrayToCsv(serialize(auditLogs).map((a) => ({
            type: a.type || '',
            sujet: a.targetEmail || a.subject || '',
            expediteur: a.senderName || '',
            date: a.createdAt || '',
        })));

        const safeEmail = (targetUser.email || id).replace(/[^a-z0-9._@-]/gi, '_');
        const filename = `rgpd-${safeEmail}-${new Date().toISOString().slice(0, 10)}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.on('error', (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); });
        archive.pipe(res);

        archive.append(JSON.stringify(toSerializable(targetUser), null, 2), { name: 'utilisateur.json' });
        archive.append(metaJson, { name: 'meta.json' });
        archive.append(bookingsCsv, { name: 'reservations.csv' });
        archive.append(reviewsCsv, { name: 'avis.csv' });
        archive.append(JSON.stringify(serialize(services), null, 2), { name: 'services.json' });
        archive.append(JSON.stringify(serialize(announcements), null, 2), { name: 'annonces.json' });
        archive.append(JSON.stringify(serialize(notifications), null, 2), { name: 'notifications.json' });
        archive.append(auditCsv, { name: 'audit.csv' });

        await archive.finalize();

        await createAuditLog(db, {
            type: 'gdpr_export_zip',
            targetUserId: targetUser._id,
            targetEmail: targetUser.email,
            senderId: new ObjectId(req.userId),
            senderName: getAdminDisplayName(req.adminUser),
        });
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: error.message });
    }
});

export default router;
