import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { Readable } from 'stream';
import connectDB from '../db/connection.js';
import { ObjectId, GridFSBucket } from 'mongodb';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

const FEEDBACK_TYPES = ['feedback', 'bug', 'feature', 'chat'];
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;
const MAX_IMAGES = 3;

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Seules les images sont acceptées.'), false);
    },
    limits: { fileSize: 8 * 1024 * 1024, files: MAX_IMAGES },
});

async function storeImageInGridFS(db, buffer, originalname, mimetype) {
    const webpBuffer = await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    const filename = `feedback_${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
    return new Promise((resolve, reject) => {
        const readable = Readable.from(webpBuffer);
        const stream = bucket.openUploadStream(filename, { contentType: 'image/webp' });
        readable.pipe(stream);
        stream.on('finish', () => resolve(stream.id));
        stream.on('error', reject);
    });
}

const getUserFromAuthHeader = async (req, db) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mycontacts_jwt_secret');
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(decoded.id) },
            { projection: { isAdmin: 1, isClient: 1, prenom: 1, nom: 1, email: 1 } }
        );
        if (!user) return null;
        return {
            id: user._id,
            isAdmin: !!user.isAdmin,
            displayName: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur',
            email: user.email || null,
        };
    } catch {
        return null;
    }
};

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

// POST /feedback — Submit feedback (public, no auth required)
router.post('/', upload.array('images', MAX_IMAGES), async (req, res) => {
    try {
        const { type, message, email } = req.body;

        if (!FEEDBACK_TYPES.includes(type)) {
            return res.status(400).json({ error: 'Type de feedback invalide.' });
        }

        const cleanMessage = String(message || '').trim();
        if (!cleanMessage || cleanMessage.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ error: `Le message est requis et ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères.` });
        }

        const cleanEmail = String(email || '').trim();
        if (cleanEmail && (cleanEmail.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))) {
            return res.status(400).json({ error: 'Adresse e-mail invalide.' });
        }

        const db = await connectDB();
        const authUser = await getUserFromAuthHeader(req, db);

        // Store attached images in GridFS
        const imageIds = [];
        if (req.files?.length) {
            for (const file of req.files) {
                try {
                    const id = await storeImageInGridFS(db, file.buffer, file.originalname, file.mimetype);
                    imageIds.push(id);
                } catch (imgErr) {
                    console.warn('Could not store feedback image:', imgErr.message);
                }
            }
        }

        // Chat mode: append to user conversation instead of creating single-shot feedback rows
        if (type === 'chat') {
            if (!authUser) {
                return res.status(401).json({ error: 'Connexion requise pour utiliser le chat.' });
            }

            const chatMessage = {
                _id: new ObjectId(),
                senderId: authUser.id,
                senderRole: authUser.isAdmin ? 'admin' : 'client',
                senderName: authUser.displayName,
                message: cleanMessage,
                imageIds,
                createdAt: new Date(),
            };

            const conversation = await db.collection('feedback').findOneAndUpdate(
                {
                    type: 'chat',
                    userId: new ObjectId(String(authUser.id)),
                    status: { $in: ['open', 'in_progress'] },
                },
                {
                    $setOnInsert: {
                        type: 'chat',
                        userId: new ObjectId(String(authUser.id)),
                        email: authUser.email,
                        createdAt: new Date(),
                    },
                    $push: { messages: chatMessage },
                    $set: {
                        message: cleanMessage,
                        imageIds,
                        lastMessageAt: new Date(),
                        updatedAt: new Date(),
                        status: 'in_progress',
                    },
                },
                { upsert: true, returnDocument: 'after' }
            );

            // Emit realtime event to admin room
            const io = req.app.get('io');
            if (io) {
                io.to('admin').emit('chat:message', {
                    conversationId: String(conversation?._id),
                    userId: String(authUser.id),
                    message: chatMessage,
                });
            }

            return res.status(201).json({
                message: 'Message envoye.',
                conversationId: conversation?._id,
                chat: conversation,
            });
        }

        const entry = {
            type,
            message: cleanMessage,
            email: cleanEmail || authUser?.email || null,
            userId: authUser?.id ? new ObjectId(String(authUser.id)) : null,
            imageIds,
            status: 'open',
            createdAt: new Date(),
        };

        const result = await db.collection('feedback').insertOne(entry);

        // Notify admin by email (best-effort)
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            const typeLabels = { feedback: 'Retour utilisateur', bug: 'Signalement de bug', feature: 'Demande de fonctionnalite', chat: 'Message chat support' };
            const imageLinks = imageIds.map((id) =>
                `<p><a href="${process.env.FRONTEND_URL || 'https://www.openglow.fr'}/api/uploads/image/${id}" target="_blank">📎 Voir image jointe</a></p>`
            ).join('');
            await sendEmail({
                email: adminEmail,
                subject: `[OpenGlow] Nouveau ${typeLabels[type]}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #1c1c1e; line-height: 1.6;">
                        <h2 style="color: #6c47ff;">Nouveau message — ${escapeHtml(typeLabels[type])}</h2>
                        <p><strong>Type :</strong> ${escapeHtml(typeLabels[type])}</p>
                        ${cleanEmail ? `<p><strong>E-mail de l'expéditeur :</strong> ${escapeHtml(cleanEmail)}</p>` : ''}
                        ${authUser?.id ? `<p><strong>ID utilisateur :</strong> ${escapeHtml(String(authUser.id))}</p>` : '<p><em>Utilisateur non connecté</em></p>'}
                        <div style="background:#f5f5f7;border-radius:12px;padding:20px;margin:16px 0;">
                            ${escapeHtml(cleanMessage).replace(/\n/g, '<br>')}
                        </div>
                        ${imageLinks}
                        <p style="font-size:13px;color:#888;">Reçu le ${new Date().toLocaleString('fr-FR')}</p>
                    </div>
                `,
            });
        }

        res.status(201).json({ message: 'Merci pour votre retour !', id: result.insertedId });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi du feedback.' });
    }
});

// GET /feedback — List all feedback (admin only)
router.get('/', verifyToken, async (req, res) => {
    try {
        if (!req.currentUser?.isAdmin) {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        }

        const db = await connectDB();
        const items = await db.collection('feedback')
            .find({})
            .sort({ createdAt: -1 })
            .limit(500)
            .toArray();

        res.json(items);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des feedbacks.' });
    }
});

// GET /feedback/chat/my-current — Current user chat conversation (for client polling)
router.get('/chat/my-current', verifyToken, async (req, res) => {
    try {
        const db = await connectDB();
        const conversation = await db.collection('feedback').findOne(
            {
                type: 'chat',
                userId: new ObjectId(String(req.userId)),
            },
            { sort: { updatedAt: -1 } }
        );

        res.json(conversation || null);
    } catch (error) {
        console.error('Error fetching current chat conversation:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du chat.' });
    }
});

// GET /feedback/chat/:id/messages — Fetch messages for one chat conversation
router.get('/chat/:id/messages', verifyToken, async (req, res) => {
    try {
        let conversationId;
        try {
            conversationId = new ObjectId(req.params.id);
        } catch {
            return res.status(400).json({ error: 'ID invalide.' });
        }

        const db = await connectDB();
        const conversation = await db.collection('feedback').findOne({ _id: conversationId, type: 'chat' });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation introuvable.' });
        }

        const isOwner = String(conversation.userId) === String(req.userId);
        const isAdmin = !!req.currentUser?.isAdmin;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Accès interdit.' });
        }

        res.json({ messages: conversation.messages || [] });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des messages.' });
    }
});

// POST /feedback/chat/:id/messages — Append a message to a chat conversation (admin or owner)
router.post('/chat/:id/messages', verifyToken, upload.array('images', MAX_IMAGES), async (req, res) => {
    try {
        const cleanMessage = String(req.body.message || '').trim();
        if (!cleanMessage || cleanMessage.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ error: `Le message est requis et ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères.` });
        }

        let conversationId;
        try {
            conversationId = new ObjectId(req.params.id);
        } catch {
            return res.status(400).json({ error: 'ID invalide.' });
        }

        const db = await connectDB();
        const conversation = await db.collection('feedback').findOne({ _id: conversationId, type: 'chat' });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation introuvable.' });
        }

        const isOwner = String(conversation.userId) === String(req.userId);
        const isAdmin = !!req.currentUser?.isAdmin;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Accès interdit.' });
        }

        const imageIds = [];
        if (req.files?.length) {
            for (const file of req.files) {
                try {
                    const id = await storeImageInGridFS(db, file.buffer, file.originalname, file.mimetype);
                    imageIds.push(id);
                } catch (imgErr) {
                    console.warn('Could not store chat image:', imgErr.message);
                }
            }
        }

        const chatMessage = {
            _id: new ObjectId(),
            senderId: new ObjectId(String(req.userId)),
            senderRole: isAdmin ? 'admin' : 'client',
            senderName: `${req.currentUser?.prenom || ''} ${req.currentUser?.nom || ''}`.trim() || req.currentUser?.email || 'Utilisateur',
            message: cleanMessage,
            imageIds,
            createdAt: new Date(),
        };

        await db.collection('feedback').updateOne(
            { _id: conversationId },
            {
                $push: { messages: chatMessage },
                $set: {
                    message: cleanMessage,
                    imageIds,
                    lastMessageAt: new Date(),
                    updatedAt: new Date(),
                    status: 'in_progress',
                },
            }
        );

        // Emit realtime event to the user and admin rooms
        const io = req.app.get('io');
        if (io) {
            const targetUserId = String(conversation.userId);
            const payload = {
                conversationId: String(conversationId),
                userId: targetUserId,
                message: chatMessage,
            };
            // Notify the user
            io.to(`chat:${targetUserId}`).emit('chat:message', payload);
            // Notify all admins (so other admin tabs update)
            io.to('admin').emit('chat:message', payload);
        }

        res.status(201).json({ message: 'Message envoyé.' });
    } catch (error) {
        console.error('Error appending chat message:', error);
        res.status(500).json({ error: 'Erreur lors de l’envoi du message.' });
    }
});

// PATCH /feedback/:id/status — Update status (admin only)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        if (!req.currentUser?.isAdmin) {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        }

        const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'dismissed'];
        const { status } = req.body;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Statut invalide.' });
        }

        let feedbackId;
        try {
            feedbackId = new ObjectId(req.params.id);
        } catch {
            return res.status(400).json({ error: 'ID invalide.' });
        }

        const db = await connectDB();
        const result = await db.collection('feedback').findOneAndUpdate(
            { _id: feedbackId },
            { $set: { status, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ error: 'Feedback introuvable.' });
        }

        res.json(result);
    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
    }
});

// DELETE /feedback/:id — Delete a feedback entry (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (!req.currentUser?.isAdmin) {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
        }

        let feedbackId;
        try {
            feedbackId = new ObjectId(req.params.id);
        } catch {
            return res.status(400).json({ error: 'ID invalide.' });
        }

        const db = await connectDB();
        const result = await db.collection('feedback').deleteOne({ _id: feedbackId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Feedback introuvable.' });
        }

        res.json({ message: 'Feedback supprimé.' });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
});

export default router;
