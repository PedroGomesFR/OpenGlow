import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import {
    IoArrowBack,
    IoCalendarClear,
    IoCheckmarkCircle,
    IoDocumentText,
    IoDownload,
    IoInformationCircle,
    IoLockClosed,
    IoLockOpen,
    IoMail,
    IoMegaphone,
    IoPeople,
    IoRefresh,
    IoSearch,
    IoShieldCheckmark,
    IoStatsChart,
    IoTime,
    IoTrash,
    IoWarning,
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import '../css/AppleDesign.css';
import '../css/AdminConsole.css';
import { useToast } from '../common/ToastContext';
import { useConfirm } from '../common/ConfirmContext';
import { useTranslation } from 'react-i18next';

const EMPTY_SUMMARY = {
    totalUsers: 0,
    totalClients: 0,
    totalProfessionals: 0,
    totalAdmins: 0,
    pendingRegistrations: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    activeAnnouncements: 0,
    emailsSentLast30Days: 0,
};

const CAMPAIGN_PURPOSES = [
    { value: 'service_update', label: 'Mise à jour de service' },
    { value: 'support_followup', label: 'Suivi support' },
    { value: 'security_notice', label: 'Notification sécurité' },
    { value: 'booking_issue', label: 'Incident de réservation' },
    { value: 'billing_notice', label: 'Information facturation' },
    { value: 'other_operational', label: 'Autre communication opérationnelle' },
];

const formatDate = (value, options = {}) => {
    if (!value) return 'Non renseigné';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Non renseigné';

    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: options.withTime ? 'short' : undefined,
    }).format(date);
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const roleLabel = (user) => {
    if (user?.isAdmin) return 'Admin';
    return user?.isClient ? 'Client' : 'Professionnel';
};

const bookingStatusLabel = (status) => {
    const labels = {
        pending: 'En attente',
        confirmed: 'Confirmé',
        completed: 'Terminé',
        cancelled: 'Annulé',
    };

    return labels[status] || status;
};

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (filename, rows) => {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const content = [
        headers.map(csvEscape).join(','),
        ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

function AdminPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const confirm = useConfirm();
    const { t } = useTranslation();
    const tx = useCallback((key, defaultValue, options = {}) => t(key, { defaultValue, ...options }), [t]);

    const [dashboard, setDashboard] = useState({
        summary: EMPTY_SUMMARY,
        recentUsers: [],
        recentBookings: [],
        recentPendingRegistrations: [],
        recentCommunications: [],
    });
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [communicationLogs, setCommunicationLogs] = useState([]);
    const [internalNotifications, setInternalNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);
    const [processingStatus, setProcessingStatus] = useState(false);
    const [exportingUserId, setExportingUserId] = useState(null);
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [bookingSearch, setBookingSearch] = useState('');
    const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [emailForm, setEmailForm] = useState({
        audience: 'clients',
        purpose: 'service_update',
        purposeDetails: '',
        subject: '',
        message: '',
    });
    const [accountActionForm, setAccountActionForm] = useState({
        reason: '',
        message: '',
        suspensionLiftAt: '',
    });
    const [notificationForm, setNotificationForm] = useState({
        audience: 'all',
        type: 'info',
        title: '',
        message: '',
        showBanner: true,
        expiresAt: '',
        segment: { role: 'all', cities: '', serviceCategories: '', minSeniority: '' },
    });

    const deferredUserSearch = useDeferredValue(userSearch);
    const deferredBookingSearch = useDeferredValue(bookingSearch);

    const adminFetch = useCallback(async (path, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
        };

        const response = await fetch(`${window.API_URL}/admin${path}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorMessage = 'Erreur admin';

            try {
                const errorData = await response.json();
                errorMessage = errorData?.error || errorMessage;
            } catch {
                errorMessage = 'Erreur admin';
            }

            throw new Error(errorMessage);
        }

        return response.json();
    }, []);

    const loadAdminData = useCallback(async ({ silent = false } = {}) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [dashboardData, usersData, bookingsData, pendingData, logsData, notificationsData] = await Promise.all([
                adminFetch('/dashboard'),
                adminFetch('/users'),
                adminFetch('/bookings'),
                adminFetch('/pending-registrations'),
                adminFetch('/communications/logs'),
                adminFetch('/notifications'),
            ]);

            setDashboard({
                summary: dashboardData.summary || EMPTY_SUMMARY,
                recentUsers: dashboardData.recentUsers || [],
                recentBookings: dashboardData.recentBookings || [],
                recentPendingRegistrations: dashboardData.recentPendingRegistrations || [],
                recentCommunications: dashboardData.recentCommunications || [],
            });
            setUsers(usersData || []);
            setBookings(bookingsData || []);
            setPendingRegistrations(pendingData || []);
            setCommunicationLogs(logsData || []);
            setInternalNotifications(notificationsData || []);
        } catch (error) {
            toast(error.message || tx('admin_load_error', 'Impossible de charger les données administrateur.'), 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [adminFetch, toast, tx]);

    const validateAccessAndLoad = useCallback(async () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            window.location.href = '/login';
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (!user.isAdmin) {
                toast(t('admin_access_denied'), 'error');
                window.location.href = '/';
                return;
            }

            await loadAdminData();
        } catch {
            window.location.href = '/';
        }
    }, [loadAdminData, t, toast]);

    useEffect(() => {
        validateAccessAndLoad();
    }, [validateAccessAndLoad]);

    const filteredUsers = users.filter((user) => {
        const searchValue = normalizeText(deferredUserSearch);
        const matchesSearch = !searchValue || [
            user.prenom,
            user.nom,
            user.email,
            user.companyName,
            user.profession,
        ].some((field) => normalizeText(field).includes(searchValue));

        const matchesRole = roleFilter === 'all'
            || (roleFilter === 'admins' && user.isAdmin)
            || (roleFilter === 'clients' && user.isClient)
            || (roleFilter === 'professionals' && !user.isClient && !user.isAdmin);

        return matchesSearch && matchesRole;
    });

    const filteredBookings = bookings.filter((booking) => {
        const searchValue = normalizeText(deferredBookingSearch);
        const matchesSearch = !searchValue || [
            booking.clientName,
            booking.clientEmail,
            booking.professionalName,
            booking.serviceName,
        ].some((field) => normalizeText(field).includes(searchValue));

        const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const customRecipients = users.filter((user) => selectedUserIds.includes(String(user._id)));
    const selectedPrimaryUser = customRecipients.length === 1 ? customRecipients[0] : null;

    const selectedAudienceCount = emailForm.audience === 'clients'
        ? users.filter((user) => user.isClient).length
        : emailForm.audience === 'professionals'
            ? users.filter((user) => !user.isClient && !user.isAdmin).length
            : emailForm.audience === 'all'
                ? users.length
                : customRecipients.length;

    const handleRefresh = async () => {
        await loadAdminData({ silent: true });
    };

    const handleDeleteUser = async (userId) => {
        const confirmed = await confirm({
            title: t('admin_delete_user_title'),
            message: t('admin_delete_user_message'),
            confirmLabel: t('action_delete'),
            danger: true,
        });
        if (!confirmed) return;

        try {
            await adminFetch(`/users/${userId}`, { method: 'DELETE' });
            setSelectedUserIds((current) => current.filter((id) => id !== userId));
            toast(t('admin_user_deleted'), 'success');
            await loadAdminData({ silent: true });
        } catch (error) {
            toast(error.message || t('admin_delete_error'), 'error');
        }
    };

    const handleToggleUser = (userId) => {
        setSelectedUserIds((current) => (
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        ));
    };

    const handleToggleAllFilteredUsers = () => {
        const filteredIds = filteredUsers.map((user) => String(user._id));
        const everySelected = filteredIds.every((id) => selectedUserIds.includes(id));

        setSelectedUserIds((current) => {
            if (everySelected) {
                return current.filter((id) => !filteredIds.includes(id));
            }

            return Array.from(new Set([...current, ...filteredIds]));
        });
    };

    const handleExportUsers = () => {
        if (!filteredUsers.length) {
            toast(tx('admin_no_users_export', 'Aucun utilisateur à exporter avec les filtres actuels.'), 'error');
            return;
        }

        downloadCsv('admin-utilisateurs.csv', filteredUsers.map((user) => ({
            prenom: user.prenom,
            nom: user.nom,
            email: user.email,
            role: roleLabel(user),
            entreprise: user.companyName || '',
            profession: user.profession || '',
            telephone: user.phone || '',
            cree_le: formatDate(user.createdAt, { withTime: true }),
            maj_le: formatDate(user.updatedAt, { withTime: true }),
        })));
    };

    const handleExportBookings = () => {
        if (!filteredBookings.length) {
            toast(tx('admin_no_bookings_export', 'Aucune réservation à exporter avec les filtres actuels.'), 'error');
            return;
        }

        downloadCsv('admin-reservations.csv', filteredBookings.map((booking) => ({
            client: booking.clientName,
            email_client: booking.clientEmail || '',
            professionnel: booking.professionalName,
            prestation: booking.serviceName,
            date: formatDate(booking.date),
            heure: booking.time,
            statut: bookingStatusLabel(booking.status),
            montant: booking.servicePrice || '',
            notes: booking.notes || '',
            cree_le: formatDate(booking.createdAt, { withTime: true }),
        })));
    };

    const handleEmailFieldChange = (field, value) => {
        setEmailForm((current) => ({ ...current, [field]: value }));
    };

    const handleAccountActionFieldChange = (field, value) => {
        setAccountActionForm((current) => ({ ...current, [field]: value }));
    };

    const handleNotificationFieldChange = (field, value) => {
        setNotificationForm((current) => ({ ...current, [field]: value }));
    };

    const handleSendEmail = async (event) => {
        event.preventDefault();

        if (emailForm.audience === 'custom' && !customRecipients.length) {
            toast(tx('admin_select_recipients', 'Sélectionnez au moins un destinataire pour un envoi personnalisé.'), 'error');
            return;
        }

        const purposeLabel = CAMPAIGN_PURPOSES.find((item) => item.value === emailForm.purpose)?.label || emailForm.purpose;
        const purpose = emailForm.purposeDetails
            ? `${purposeLabel} - ${emailForm.purposeDetails.trim()}`
            : purposeLabel;

        try {
            setSendingEmail(true);
            const result = await adminFetch('/communications/email', {
                method: 'POST',
                body: JSON.stringify({
                    audience: emailForm.audience,
                    subject: emailForm.subject.trim(),
                    message: emailForm.message.trim(),
                    purpose,
                    recipientIds: customRecipients.map((user) => String(user._id)),
                }),
            });

            toast(
                tx(
                    'admin_email_sent_result',
                    `Campagne traitée: ${result.successCount} envois réussis sur ${result.recipientCount}.`
                ),
                result.failedCount ? 'warning' : 'success'
            );

            setEmailForm((current) => ({
                ...current,
                subject: '',
                message: '',
                purposeDetails: '',
            }));
            await loadAdminData({ silent: true });
        } catch (error) {
            toast(error.message || tx('admin_email_error', 'Impossible d’envoyer la campagne email.'), 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleToggleSuspension = async (shouldSuspend) => {
        if (!selectedPrimaryUser) {
            toast(tx('admin_select_one_user', 'Sélectionnez un seul utilisateur pour gérer son statut.'), 'warning');
            return;
        }

        if (shouldSuspend && !accountActionForm.reason.trim()) {
            toast(tx('admin_suspend_reason_required', 'Renseignez un motif de suspension.'), 'warning');
            return;
        }

        try {
            setProcessingStatus(true);
            await adminFetch(`/users/${selectedPrimaryUser._id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({
                    isSuspended: shouldSuspend,
                    reason: accountActionForm.reason.trim(),
                    message: accountActionForm.message.trim(),
                    suspensionLiftAt: shouldSuspend && accountActionForm.suspensionLiftAt
                        ? accountActionForm.suspensionLiftAt
                        : null,
                }),
            });

            toast(
                shouldSuspend
                    ? tx('admin_user_suspended', 'Compte suspendu avec succès.')
                    : tx('admin_user_reactivated', 'Compte réactivé avec succès.'),
                'success'
            );

            setAccountActionForm({ reason: '', message: '', suspensionLiftAt: '' });
            await loadAdminData({ silent: true });
        } catch (error) {
            toast(error.message || tx('admin_status_error', 'Impossible de mettre à jour le statut du compte.'), 'error');
        } finally {
            setProcessingStatus(false);
        }
    };

    const handleExportGdprZip = async () => {
        if (!selectedPrimaryUser) {
            toast(tx('admin_select_one_user_export', 'Sélectionnez un seul utilisateur pour exporter sa fiche RGPD.'), 'warning');
            return;
        }

        try {
            setExportingUserId(String(selectedPrimaryUser._id));
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/admin/users/${selectedPrimaryUser._id}/export-zip`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.error || 'Erreur export ZIP');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rgpd-${selectedPrimaryUser.email || selectedPrimaryUser._id}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast(tx('admin_gdpr_zip_success', 'Archive ZIP RGPD générée avec succès.'), 'success');
        } catch (error) {
            toast(error.message || tx('admin_gdpr_zip_error', 'Impossible de générer l\'archive ZIP.'), 'error');
        } finally {
            setExportingUserId(null);
        }
    };

    const handleExportGdpr = async () => {
        if (!selectedPrimaryUser) {
            toast(tx('admin_select_one_user_export', 'Sélectionnez un seul utilisateur pour exporter sa fiche RGPD.'), 'warning');
            return;
        }

        try {
            setExportingUserId(String(selectedPrimaryUser._id));
            const data = await adminFetch(`/users/${selectedPrimaryUser._id}/export`);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rgpd-${selectedPrimaryUser.email || selectedPrimaryUser._id}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast(tx('admin_gdpr_export_success', 'Export RGPD généré avec succès.'), 'success');
        } catch (error) {
            toast(error.message || tx('admin_gdpr_export_error', 'Impossible de générer l’export RGPD.'), 'error');
        } finally {
            setExportingUserId(null);
        }
    };

    const handleSendInternalNotification = async (event) => {
        event.preventDefault();

        if (notificationForm.audience === 'custom' && !customRecipients.length) {
            toast(tx('admin_notification_select_recipients', 'Sélectionnez au moins un utilisateur pour une notification personnalisée.'), 'warning');
            return;
        }

        const segmentPayload = notificationForm.audience === 'segment'
            ? {
                role: notificationForm.segment.role,
                cities: notificationForm.segment.cities
                    ? notificationForm.segment.cities.split(',').map((c) => c.trim()).filter(Boolean)
                    : [],
                serviceCategories: notificationForm.segment.serviceCategories
                    ? notificationForm.segment.serviceCategories.split(',').map((s) => s.trim()).filter(Boolean)
                    : [],
                minSeniority: notificationForm.segment.minSeniority
                    ? Number(notificationForm.segment.minSeniority)
                    : null,
            }
            : {};

        try {
            setSendingNotification(true);
            await adminFetch('/notifications', {
                method: 'POST',
                body: JSON.stringify({
                    audience: notificationForm.audience,
                    type: notificationForm.type,
                    title: notificationForm.title.trim(),
                    message: notificationForm.message.trim(),
                    showBanner: notificationForm.showBanner,
                    expiresAt: notificationForm.expiresAt || null,
                    recipientIds: customRecipients.map((user) => String(user._id)),
                    segment: segmentPayload,
                }),
            });

            toast(tx('admin_notification_created', 'Notification interne publiée.'), 'success');
            setNotificationForm({
                audience: 'all',
                type: 'info',
                title: '',
                message: '',
                showBanner: true,
                expiresAt: '',
                segment: { role: 'all', cities: '', serviceCategories: '', minSeniority: '' },
            });
            await loadAdminData({ silent: true });
        } catch (error) {
            toast(error.message || tx('admin_notification_error', 'Impossible de publier la notification.'), 'error');
        } finally {
            setSendingNotification(false);
        }
    };

    const handleToggleNotificationStatus = async (notification) => {
        try {
            await adminFetch(`/notifications/${notification._id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !notification.isActive }),
            });
            await loadAdminData({ silent: true });
        } catch (error) {
            toast(error.message || tx('admin_notification_status_error', 'Impossible de modifier cette notification.'), 'error');
        }
    };

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="admin-console-page">
            <div className="admin-console-shell">
                <section className="admin-console-hero card">
                    <div className="admin-console-hero__content">
                        <button onClick={() => navigate('/')} className="btn btn-outline admin-console-hero__back">
                            <IoArrowBack /> {t('return_btn')}
                        </button>
                        <div>
                            <div className="admin-console-kicker">
                                <IoShieldCheckmark /> {t('admin_title')}
                            </div>
                            <h1>{tx('admin_complete_title', 'Console administrateur complète')}</h1>
                            <p>
                                {tx(
                                    'admin_complete_subtitle',
                                    'Pilotez les comptes, les réservations, les inscriptions en attente et les communications opérationnelles depuis une seule interface.'
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="admin-console-hero__actions">
                        <button onClick={handleRefresh} className="btn btn-secondary" disabled={refreshing}>
                            <IoRefresh /> {refreshing ? tx('admin_refreshing', 'Actualisation...') : tx('admin_refresh', 'Actualiser')}
                        </button>
                    </div>
                </section>

                <section className="admin-console-stats">
                    <article className="admin-stat-card card">
                        <div className="admin-stat-card__label">{t('admin_total_users')}</div>
                        <div className="admin-stat-card__value">{dashboard.summary.totalUsers}</div>
                        <div className="admin-stat-card__meta"><IoPeople /> {dashboard.summary.totalAdmins} admins</div>
                    </article>
                    <article className="admin-stat-card card">
                        <div className="admin-stat-card__label">{t('admin_clients')}</div>
                        <div className="admin-stat-card__value">{dashboard.summary.totalClients}</div>
                        <div className="admin-stat-card__meta">{dashboard.summary.pendingRegistrations} inscriptions en attente</div>
                    </article>
                    <article className="admin-stat-card card">
                        <div className="admin-stat-card__label">{t('admin_professionals')}</div>
                        <div className="admin-stat-card__value">{dashboard.summary.totalProfessionals}</div>
                        <div className="admin-stat-card__meta">{dashboard.summary.activeAnnouncements} annonces actives</div>
                    </article>
                    <article className="admin-stat-card card">
                        <div className="admin-stat-card__label">{tx('admin_bookings_label', 'RÉSERVATIONS')}</div>
                        <div className="admin-stat-card__value">{dashboard.summary.totalBookings}</div>
                        <div className="admin-stat-card__meta">{dashboard.summary.pendingBookings} en attente</div>
                    </article>
                    <article className="admin-stat-card card">
                        <div className="admin-stat-card__label">{tx('admin_emails_30d', 'EMAILS 30 JOURS')}</div>
                        <div className="admin-stat-card__value">{dashboard.summary.emailsSentLast30Days}</div>
                        <div className="admin-stat-card__meta">Traçabilité activée</div>
                    </article>
                </section>

                <section className="admin-console-section admin-console-grid admin-console-grid--summary">
                    <article className="card admin-console-panel">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoStatsChart /> {tx('admin_recent_activity', 'Activité récente')}</h2>
                                <p>{tx('admin_recent_activity_desc', 'Vue rapide des derniers comptes et réservations créés.')}</p>
                            </div>
                        </div>
                        <div className="admin-mini-columns">
                            <div>
                                <h3>{tx('admin_recent_users', 'Derniers utilisateurs')}</h3>
                                <div className="admin-mini-list">
                                    {dashboard.recentUsers.map((user) => (
                                        <div key={user._id} className="admin-mini-list__item">
                                            <div>
                                                <strong>{user.prenom} {user.nom}</strong>
                                                <span>{user.email}</span>
                                            </div>
                                            <span className="admin-badge">{roleLabel(user)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3>{tx('admin_recent_bookings', 'Dernières réservations')}</h3>
                                <div className="admin-mini-list">
                                    {dashboard.recentBookings.map((booking) => (
                                        <div key={booking._id} className="admin-mini-list__item">
                                            <div>
                                                <strong>{booking.clientName}</strong>
                                                <span>{booking.serviceName} chez {booking.professionalName}</span>
                                            </div>
                                            <span className={`admin-badge admin-badge--${booking.status}`}>{bookingStatusLabel(booking.status)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </article>

                    <article className="card admin-console-panel admin-console-panel--compact">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoTime /> {tx('admin_pending_title', 'File d’attente')}</h2>
                                <p>{tx('admin_pending_desc', 'Inscriptions non encore finalisées et à surveiller.')}</p>
                            </div>
                        </div>
                        <div className="admin-mini-list">
                            {pendingRegistrations.length ? pendingRegistrations.map((pendingUser) => (
                                <div key={pendingUser._id} className="admin-mini-list__item">
                                    <div>
                                        <strong>{pendingUser.prenom} {pendingUser.nom}</strong>
                                        <span>{pendingUser.email}</span>
                                    </div>
                                    <div className="admin-mini-list__meta">
                                        <span className="admin-badge">{pendingUser.isClient ? 'Client' : 'Professionnel'}</span>
                                        <span>{formatDate(pendingUser.expiresAt, { withTime: true })}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="admin-empty-state">{tx('admin_no_pending', 'Aucune inscription en attente actuellement.')}</div>
                            )}
                        </div>
                    </article>
                </section>

                <section className="admin-console-section">
                    <article className="card admin-console-panel">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoPeople /> {t('admin_users_count', { count: filteredUsers.length })}</h2>
                                <p>{tx('admin_users_desc', 'Filtrez, exportez, sélectionnez des destinataires et supprimez les comptes obsolètes.')}</p>
                            </div>
                            <div className="admin-toolbar">
                                <label className="admin-search-field">
                                    <IoSearch />
                                    <input
                                        type="search"
                                        value={userSearch}
                                        onChange={(event) => setUserSearch(event.target.value)}
                                        placeholder={tx('admin_search_users', 'Rechercher nom, email, société...')}
                                    />
                                </label>
                                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                                    <option value="all">Tous les rôles</option>
                                    <option value="clients">Clients</option>
                                    <option value="professionals">Professionnels</option>
                                    <option value="admins">Admins</option>
                                </select>
                                <button onClick={handleExportUsers} className="btn btn-secondary">
                                    <IoDownload /> {tx('admin_export_users', 'Exporter CSV')}
                                </button>
                            </div>
                        </div>

                        <div className="admin-toolbar admin-toolbar--selection">
                            <button onClick={handleToggleAllFilteredUsers} className="btn btn-outline btn-sm">
                                {filteredUsers.every((user) => selectedUserIds.includes(String(user._id)))
                                    ? tx('admin_deselect_all', 'Tout désélectionner')
                                    : tx('admin_select_filtered', 'Sélectionner les filtrés')}
                            </button>
                            <span>{tx('admin_selected_count', '{{count}} utilisateur(s) sélectionné(s)', { count: selectedUserIds.length })}</span>
                        </div>

                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>{tx('admin_select', 'SÉLECTION')}</th>
                                        <th>{t('admin_name_email')}</th>
                                        <th>{t('admin_role')}</th>
                                        <th>{tx('admin_status', 'STATUT')}</th>
                                        <th>{t('admin_company')}</th>
                                        <th>{tx('admin_created_at', 'CRÉÉ LE')}</th>
                                        <th>{t('admin_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const userId = String(user._id);

                                        return (
                                            <tr key={userId}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.includes(userId)}
                                                        onChange={() => handleToggleUser(userId)}
                                                        aria-label={tx('admin_select_user', 'Sélectionner cet utilisateur')}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <strong>{user.prenom} {user.nom}</strong>
                                                        <span>{user.email}</span>
                                                    </div>
                                                </td>
                                                <td><span className={`admin-badge admin-badge--${user.isAdmin ? 'admin' : user.isClient ? 'client' : 'professional'}`}>{roleLabel(user)}</span></td>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <span className={`admin-badge admin-badge--${user.isSuspended ? 'cancelled' : 'completed'}`}>
                                                            {user.isSuspended ? 'Suspendu' : 'Actif'}
                                                        </span>
                                                        {user.isSuspended && user.suspendedReason && (
                                                            <span>{user.suspendedReason}</span>
                                                        )}
                                                        {user.isSuspended && user.suspensionLiftAt && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
                                                                Levée : {formatDate(user.suspensionLiftAt, { withTime: true })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{user.companyName || 'Non renseignée'}</td>
                                                <td>{formatDate(user.createdAt, { withTime: true })}</td>
                                                <td>
                                                    <div className="admin-actions-stack">
                                                        <button
                                                            onClick={() => handleDeleteUser(userId)}
                                                            className="admin-icon-button"
                                                            title={t('action_delete')}
                                                        >
                                                            <IoTrash />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserIds([userId]);
                                                                setAccountActionForm({
                                                                    reason: user.suspendedReason || '',
                                                                    message: user.suspensionMessage || '',
                                                                    suspensionLiftAt: user.suspensionLiftAt
                                                                        ? new Date(user.suspensionLiftAt).toISOString().slice(0, 16)
                                                                        : '',
                                                                });
                                                            }}
                                                            className="admin-icon-button admin-icon-button--neutral"
                                                            title={tx('admin_prepare_user_actions', 'Préparer les actions compte')}
                                                        >
                                                            <IoDocumentText />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {!filteredUsers.length && (
                                <div className="admin-empty-state">{tx('admin_no_users', 'Aucun utilisateur ne correspond aux filtres actifs.')}</div>
                            )}
                        </div>
                    </article>
                </section>

                <section className="admin-console-section admin-console-grid admin-console-grid--two-columns">
                    <article className="card admin-console-panel">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoLockClosed /> {tx('admin_account_control', 'Pilotage des comptes')}</h2>
                                <p>{tx('admin_account_control_desc', 'Suspendez, réactivez ou exportez la fiche RGPD d’un compte sélectionné.')}</p>
                            </div>
                        </div>

                        {selectedPrimaryUser ? (
                            <div className="admin-form admin-inline-form">
                                <div className="admin-selected-user-card">
                                    <strong>{selectedPrimaryUser.prenom} {selectedPrimaryUser.nom}</strong>
                                    <span>{selectedPrimaryUser.email}</span>
                                    <span className={`admin-badge admin-badge--${selectedPrimaryUser.isSuspended ? 'cancelled' : 'completed'}`}>
                                        {selectedPrimaryUser.isSuspended ? 'Suspendu' : 'Actif'}
                                    </span>
                                </div>

                                <label>
                                    <span>{tx('admin_account_reason', 'Motif admin')}</span>
                                    <input
                                        type="text"
                                        value={accountActionForm.reason}
                                        onChange={(event) => handleAccountActionFieldChange('reason', event.target.value)}
                                        placeholder={tx('admin_account_reason_placeholder', 'Ex: abus, fraude, non respect des CGU...')}
                                    />
                                </label>

                                <label>
                                    <span>{tx('admin_account_message', 'Message visible par l’utilisateur')}</span>
                                    <textarea
                                        rows="5"
                                        value={accountActionForm.message}
                                        onChange={(event) => handleAccountActionFieldChange('message', event.target.value)}
                                        placeholder={tx('admin_account_message_placeholder', 'Message qui sera visible dans le centre de notifications et utilisé pour la suspension/réactivation.')}
                                    />
                                </label>

                                <label>
                                    <span>{tx('admin_suspension_lift_at', 'Levée automatique de la suspension (optionnel)')}</span>
                                    <input
                                        type="datetime-local"
                                        value={accountActionForm.suspensionLiftAt}
                                        onChange={(event) => handleAccountActionFieldChange('suspensionLiftAt', event.target.value)}
                                    />
                                </label>

                                <div className="admin-form__actions admin-form__actions--split">
                                    <button type="button" className="btn btn-danger" onClick={() => handleToggleSuspension(true)} disabled={processingStatus || selectedPrimaryUser.isAdmin}>
                                        <IoLockClosed /> Suspendre
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => handleToggleSuspension(false)} disabled={processingStatus}>
                                        <IoLockOpen /> Réactiver
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={handleExportGdpr} disabled={!!exportingUserId}>
                                        <IoDocumentText /> {exportingUserId ? 'Export...' : 'Export JSON'}
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={handleExportGdprZip} disabled={!!exportingUserId}>
                                        <IoDownload /> {exportingUserId ? 'Export...' : 'Export ZIP'}
                                    </button>
                                </div>
                                {selectedPrimaryUser.isAdmin && (
                                    <div className="admin-empty-inline">La suspension d’un autre admin n’est pas autorisée depuis cette console.</div>
                                )}
                            </div>
                        ) : (
                            <div className="admin-empty-state">{tx('admin_select_single_user_hint', 'Sélectionnez exactement un utilisateur pour gérer son statut ou générer son export RGPD.')}</div>
                        )}
                    </article>

                    <article className="card admin-console-panel admin-console-panel--compact">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoDocumentText /> {tx('admin_data_export_scope', 'Contenu de l’export')}</h2>
                                <p>{tx('admin_data_export_scope_desc', 'Ce fichier JSON rassemble les données directement liées au compte sélectionné.')}</p>
                            </div>
                        </div>
                        <div className="admin-mini-list">
                            {['Profil utilisateur (JSON)', 'Réservations (CSV)', 'Avis liés (CSV)', 'Prestations (JSON)', 'Annonces (JSON)', 'Notifications internes (JSON)', 'Traces d’audit (CSV)'].map((item) => (
                                <div key={item} className="admin-mini-list__item">
                                    <div>
                                        <strong>{item}</strong>
                                        <span>Inclus si disponible pour la personne concernée</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>

                <section className="admin-console-section admin-console-grid admin-console-grid--two-columns">
                    <article className="card admin-console-panel">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoCalendarClear /> {tx('admin_booking_monitoring', 'Supervision des réservations')}</h2>
                                <p>{tx('admin_booking_monitoring_desc', 'Suivez les flux clients et professionnels avec export immédiat.')}</p>
                            </div>
                            <div className="admin-toolbar">
                                <label className="admin-search-field">
                                    <IoSearch />
                                    <input
                                        type="search"
                                        value={bookingSearch}
                                        onChange={(event) => setBookingSearch(event.target.value)}
                                        placeholder={tx('admin_search_bookings', 'Rechercher client, pro, prestation...')}
                                    />
                                </label>
                                <select value={bookingStatusFilter} onChange={(event) => setBookingStatusFilter(event.target.value)}>
                                    <option value="all">Tous les statuts</option>
                                    <option value="pending">En attente</option>
                                    <option value="confirmed">Confirmés</option>
                                    <option value="completed">Terminés</option>
                                    <option value="cancelled">Annulés</option>
                                </select>
                                <button onClick={handleExportBookings} className="btn btn-secondary">
                                    <IoDownload /> {tx('admin_export_bookings', 'Exporter CSV')}
                                </button>
                            </div>
                        </div>

                        <div className="admin-table-wrapper">
                            <table className="admin-table admin-table--dense">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th>Professionnel</th>
                                        <th>Prestation</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.slice(0, 120).map((booking) => (
                                        <tr key={booking._id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <strong>{booking.clientName}</strong>
                                                    <span>{booking.clientEmail || 'Sans email'}</span>
                                                </div>
                                            </td>
                                            <td>{booking.professionalName}</td>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <strong>{booking.serviceName}</strong>
                                                    <span>{booking.time} • {booking.servicePrice ? `${booking.servicePrice} EUR` : 'Prix non défini'}</span>
                                                </div>
                                            </td>
                                            <td>{formatDate(booking.date)} </td>
                                            <td><span className={`admin-badge admin-badge--${booking.status}`}>{bookingStatusLabel(booking.status)}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!filteredBookings.length && (
                                <div className="admin-empty-state">{tx('admin_no_bookings', 'Aucune réservation ne correspond aux filtres actifs.')}</div>
                            )}
                        </div>
                    </article>

                    <article className="card admin-console-panel admin-console-panel--compact">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoInformationCircle /> {tx('admin_health_title', 'État opérationnel')}</h2>
                                <p>{tx('admin_health_desc', 'Indicateurs rapides pour décider des actions prioritaires.')}</p>
                            </div>
                        </div>
                        <div className="admin-health-grid">
                            <div className="admin-health-item">
                                <span>{tx('admin_health_pending', 'Réservations en attente')}</span>
                                <strong>{dashboard.summary.pendingBookings}</strong>
                            </div>
                            <div className="admin-health-item">
                                <span>{tx('admin_health_confirmed', 'Réservations confirmées')}</span>
                                <strong>{dashboard.summary.confirmedBookings}</strong>
                            </div>
                            <div className="admin-health-item">
                                <span>{tx('admin_health_completed', 'Réservations terminées')}</span>
                                <strong>{dashboard.summary.completedBookings}</strong>
                            </div>
                            <div className="admin-health-item">
                                <span>{tx('admin_health_cancelled', 'Réservations annulées')}</span>
                                <strong>{dashboard.summary.cancelledBookings}</strong>
                            </div>
                        </div>
                    </article>
                </section>

                <section className="admin-console-section admin-console-grid admin-console-grid--two-columns">
                    <article className="card admin-console-panel">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoMail /> {tx('admin_email_center', 'Centre d’emailing admin')}</h2>
                                <p>{tx('admin_email_center_desc', 'Envois strictement opérationnels avec motif obligatoire et journalisation automatique.')}</p>
                            </div>
                        </div>

                        <form className="admin-form" onSubmit={handleSendEmail}>
                            <div className="admin-form-grid">
                                <label>
                                    <span>{tx('admin_email_audience', 'Audience')}</span>
                                    <select value={emailForm.audience} onChange={(event) => handleEmailFieldChange('audience', event.target.value)}>
                                        <option value="clients">Tous les clients</option>
                                        <option value="professionals">Tous les professionnels</option>
                                        <option value="all">Tous les comptes</option>
                                        <option value="custom">Sélection personnalisée</option>
                                    </select>
                                </label>

                                <label>
                                    <span>{tx('admin_email_purpose', 'Motif')}</span>
                                    <select value={emailForm.purpose} onChange={(event) => handleEmailFieldChange('purpose', event.target.value)}>
                                        {CAMPAIGN_PURPOSES.map((purpose) => (
                                            <option key={purpose.value} value={purpose.value}>{purpose.label}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label>
                                <span>{tx('admin_email_purpose_detail', 'Précision du motif')}</span>
                                <input
                                    type="text"
                                    value={emailForm.purposeDetails}
                                    onChange={(event) => handleEmailFieldChange('purposeDetails', event.target.value)}
                                    placeholder={tx('admin_email_purpose_detail_placeholder', 'Ex: indisponibilité du 14 mai, incident paiement, maintenance...')}
                                />
                            </label>

                            <label>
                                <span>{tx('admin_email_subject', 'Objet')}</span>
                                <input
                                    type="text"
                                    value={emailForm.subject}
                                    onChange={(event) => handleEmailFieldChange('subject', event.target.value)}
                                    placeholder={tx('admin_email_subject_placeholder', 'Objet de l’email envoyé')}
                                    required
                                />
                            </label>

                            <label>
                                <span>{tx('admin_email_message', 'Message')}</span>
                                <textarea
                                    value={emailForm.message}
                                    onChange={(event) => handleEmailFieldChange('message', event.target.value)}
                                    placeholder={tx('admin_email_message_placeholder', 'Rédigez ici le contenu opérationnel à envoyer...')}
                                    rows="8"
                                    required
                                />
                            </label>

                            <div className="admin-notice admin-notice--info">
                                <IoInformationCircle />
                                <div>
                                    <strong>{tx('admin_rgpd_notice_title', 'Cadre RGPD')}</strong>
                                    <p>{tx('admin_rgpd_notice_body', 'Utilisez ce module uniquement pour des communications nécessaires au service, au support, à la sécurité ou à la relation contractuelle. Le contenu n’est pas archivé, seule une trace d’envoi minimale est conservée.')}</p>
                                    <p>{tx('admin_rgpd_notice_recipients', 'Destinataires estimés')}: {selectedAudienceCount}</p>
                                </div>
                            </div>

                            {emailForm.audience === 'custom' && (
                                <div className="admin-selected-users">
                                    {customRecipients.length ? customRecipients.map((user) => (
                                        <span key={user._id} className="admin-chip">{user.prenom} {user.nom}</span>
                                    )) : (
                                        <span className="admin-empty-inline">{tx('admin_no_custom_recipients', 'Aucun utilisateur sélectionné pour un envoi personnalisé.')}</span>
                                    )}
                                </div>
                            )}

                            <div className="admin-form__actions">
                                <button type="submit" className="btn btn-primary" disabled={sendingEmail}>
                                    <IoMail /> {sendingEmail ? tx('admin_sending_email', 'Envoi en cours...') : tx('admin_send_email', 'Envoyer la campagne')}
                                </button>
                            </div>
                        </form>
                    </article>

                    <article className="card admin-console-panel admin-console-panel--compact">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoCheckmarkCircle /> {tx('admin_audit_title', 'Journal des actions')}</h2>
                                <p>{tx('admin_audit_desc', 'Dernières suppressions de comptes et campagnes email.')}</p>
                            </div>
                        </div>
                        <div className="admin-mini-list">
                            {communicationLogs.length ? communicationLogs.map((log) => (
                                <div key={log._id} className="admin-mini-list__item">
                                    <div>
                                        <strong>{log.type === 'email_campaign' ? log.subject : 'Suppression utilisateur'}</strong>
                                        <span>
                                            {log.type === 'email_campaign'
                                                ? `${log.audience} • ${log.successCount || 0}/${log.recipientCount || 0} réussis`
                                                : `${log.targetEmail || 'Compte supprimé'} • ${log.targetRole || 'utilisateur'}`}
                                        </span>
                                    </div>
                                    <div className="admin-mini-list__meta">
                                        <span>{log.senderName || 'Admin'}</span>
                                        <span>{formatDate(log.createdAt, { withTime: true })}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="admin-empty-state">{tx('admin_no_logs', 'Aucune action journalisée pour le moment.')}</div>
                            )}
                        </div>
                    </article>
                </section>

                <section className="admin-console-section admin-console-grid admin-console-grid--two-columns">
                    <article className="card admin-console-panel">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoMegaphone /> {tx('admin_internal_notifications', 'Notifications internes')}</h2>
                                <p>{tx('admin_internal_notifications_desc', 'Publiez un message visible dans l’application, en bannière ou dans le centre de notifications.')}</p>
                            </div>
                        </div>

                        <form className="admin-form" onSubmit={handleSendInternalNotification}>
                            <div className="admin-form-grid">
                                <label>
                                    <span>Audience</span>
                                    <select value={notificationForm.audience} onChange={(event) => handleNotificationFieldChange('audience', event.target.value)}>
                                        <option value="all">Tous les comptes</option>
                                        <option value="clients">Clients</option>
                                        <option value="professionals">Professionnels</option>
                                        <option value="custom">Sélection personnalisée</option>
                                        <option value="segment">Segment avancé</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Type</span>
                                    <select value={notificationForm.type} onChange={(event) => handleNotificationFieldChange('type', event.target.value)}>
                                        <option value="info">Info</option>
                                        <option value="success">Succès</option>
                                        <option value="warning">Alerte</option>
                                        <option value="security">Sécurité</option>
                                    </select>
                                </label>
                            </div>

                            <label>
                                <span>Titre</span>
                                <input
                                    type="text"
                                    value={notificationForm.title}
                                    onChange={(event) => handleNotificationFieldChange('title', event.target.value)}
                                    placeholder="Titre visible dans le centre de notifications"
                                    required
                                />
                            </label>

                            <label>
                                <span>Message</span>
                                <textarea
                                    rows="6"
                                    value={notificationForm.message}
                                    onChange={(event) => handleNotificationFieldChange('message', event.target.value)}
                                    placeholder="Contenu interne à afficher dans l’application"
                                    required
                                />
                            </label>

                            <div className="admin-form-grid">
                                <label>
                                    <span>Expiration</span>
                                    <input
                                        type="datetime-local"
                                        value={notificationForm.expiresAt}
                                        onChange={(event) => handleNotificationFieldChange('expiresAt', event.target.value)}
                                    />
                                </label>
                                <label className="admin-checkbox-row">
                                    <span>Afficher en bannière</span>
                                    <input
                                        type="checkbox"
                                        checked={notificationForm.showBanner}
                                        onChange={(event) => handleNotificationFieldChange('showBanner', event.target.checked)}
                                    />
                                </label>
                            </div>

                            {notificationForm.audience === 'custom' && (
                                <div className="admin-selected-users">
                                    {customRecipients.length ? customRecipients.map((user) => (
                                        <span key={user._id} className="admin-chip">{user.prenom} {user.nom}</span>
                                    )) : (
                                        <span className="admin-empty-inline">Sélectionnez des utilisateurs dans le tableau ci-dessus.</span>
                                    )}
                                </div>
                            )}

                            {notificationForm.audience === 'segment' && (
                                <div className="admin-segment-builder">
                                    <div className="admin-form-grid">
                                        <label>
                                            <span>Rôle ciblé</span>
                                            <select
                                                value={notificationForm.segment.role}
                                                onChange={(event) => handleNotificationFieldChange('segment', { ...notificationForm.segment, role: event.target.value })}
                                            >
                                                <option value="all">Tous les rôles</option>
                                                <option value="clients">Clients uniquement</option>
                                                <option value="professionals">Professionnels uniquement</option>
                                            </select>
                                        </label>
                                        <label>
                                            <span>Ancienneté minimale (jours)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={notificationForm.segment.minSeniority}
                                                onChange={(event) => handleNotificationFieldChange('segment', { ...notificationForm.segment, minSeniority: event.target.value })}
                                                placeholder="Ex: 30 (inscrits depuis ≥ 30 jours)"
                                            />
                                        </label>
                                    </div>
                                    <label>
                                        <span>Villes (séparées par des virgules)</span>
                                        <input
                                            type="text"
                                            value={notificationForm.segment.cities}
                                            onChange={(event) => handleNotificationFieldChange('segment', { ...notificationForm.segment, cities: event.target.value })}
                                            placeholder="Ex: Paris, Lyon, Marseille"
                                        />
                                    </label>
                                    <label>
                                        <span>Professions / catégories de service (séparées par des virgules)</span>
                                        <input
                                            type="text"
                                            value={notificationForm.segment.serviceCategories}
                                            onChange={(event) => handleNotificationFieldChange('segment', { ...notificationForm.segment, serviceCategories: event.target.value })}
                                            placeholder="Ex: Coiffeur, Esthéticienne, Nail artist"
                                        />
                                    </label>
                                    <div className="admin-notice admin-notice--info" style={{ marginTop: 0 }}>
                                        <IoInformationCircle />
                                        <p>Le segment sera résolu côté serveur. Seuls les utilisateurs correspondant à <strong>tous</strong> les critères renseignés recevront la notification.</p>
                                    </div>
                                </div>
                            )}

                            <div className="admin-form__actions">
                                <button type="submit" className="btn btn-primary" disabled={sendingNotification}>
                                    <IoMegaphone /> {sendingNotification ? 'Publication...' : 'Publier la notification'}
                                </button>
                            </div>
                        </form>
                    </article>

                    <article className="card admin-console-panel admin-console-panel--compact">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoCheckmarkCircle /> {tx('admin_notification_feed', 'Flux publié')}</h2>
                                <p>{tx('admin_notification_feed_desc', 'Activez ou désactivez les notifications déjà publiées.')}</p>
                            </div>
                        </div>
                        <div className="admin-mini-list">
                            {internalNotifications.length ? internalNotifications.map((notification) => (
                                <div key={notification._id} className="admin-mini-list__item">
                                    <div>
                                        <strong>{notification.title}</strong>
                                        <span>{notification.audience} • {notification.showBanner ? 'Bannière' : 'Centre seulement'}</span>
                                    </div>
                                    <div className="admin-mini-list__meta admin-mini-list__meta--actions">
                                        <span className={`admin-badge admin-badge--${notification.isActive ? 'completed' : 'cancelled'}`}>{notification.isActive ? 'Active' : 'Inactive'}</span>
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleToggleNotificationStatus(notification)}>
                                            {notification.isActive ? 'Désactiver' : 'Réactiver'}
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="admin-empty-state">Aucune notification interne publiée pour le moment.</div>
                            )}
                        </div>
                    </article>
                </section>

                <section className="admin-console-section">
                    <article className="card admin-console-panel admin-console-panel--rgpd">
                        <div className="admin-console-panel__header">
                            <div>
                                <h2><IoWarning /> {tx('admin_rgpd_panel_title', 'Garde-fous RGPD intégrés')}</h2>
                                <p>{tx('admin_rgpd_panel_desc', 'Rappels pratiques pour garder une administration proportionnée et traçable.')}</p>
                            </div>
                        </div>
                        <div className="admin-rgpd-grid">
                            <div className="admin-rgpd-item">
                                <strong>Minimisation</strong>
                                <p>Les exports CSV excluent les mots de passe et les secrets de réinitialisation. La vue admin consomme uniquement les champs nécessaires au pilotage.</p>
                            </div>
                            <div className="admin-rgpd-item">
                                <strong>Traçabilité</strong>
                                <p>Chaque suppression d’utilisateur et chaque campagne email génèrent une trace d’audit avec auteur, motif, portée et volumétrie.</p>
                            </div>
                            <div className="admin-rgpd-item">
                                <strong>Finalité</strong>
                                <p>Le centre d’envoi impose un motif d’envoi pour limiter l’usage à des communications opérationnelles ou contractuelles.</p>
                            </div>
                            <div className="admin-rgpd-item">
                                <strong>Supervision</strong>
                                <p>Les inscriptions en attente et les réservations sensibles restent visibles sans exposer les codes de vérification ni les mots de passe.</p>
                            </div>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
}

export default AdminPage;
