import { useMemo, useState } from 'react';
import {
    IoCheckmarkCircle,
    IoChevronDown,
    IoChevronUp,
    IoClose,
    IoMailUnread,
    IoNotifications,
    IoWarning,
} from 'react-icons/io5';
import '../css/UserNotifications.css';

const typeLabel = {
    info: 'Info',
    success: 'Succès',
    warning: 'Alerte',
    security: 'Sécurité',
};

const formatDate = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

function UserNotifications({ notifications, userId, onRead, onDismiss }) {
    const [open, setOpen] = useState(false);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !(notification.readByUserIds || []).includes(userId)).length,
        [notifications, userId]
    );

    const bannerNotifications = useMemo(
        () => notifications.filter((notification) => notification.showBanner).slice(0, 2),
        [notifications]
    );

    if (!notifications.length) {
        return null;
    }

    return (
        <>
            <div className="user-notifications-banners">
                {bannerNotifications.map((notification) => (
                    <div key={notification._id} className={`user-notification-banner user-notification-banner--${notification.type || 'info'}`}>
                        <div>
                            <strong>{notification.title}</strong>
                            <p>{notification.message}</p>
                        </div>
                        <button onClick={() => onDismiss(notification._id)} aria-label="Masquer la notification">
                            <IoClose />
                        </button>
                    </div>
                ))}
            </div>

            <div className="user-notifications-fab">
                <button className="user-notifications-fab__button" onClick={() => setOpen((current) => !current)}>
                    <IoNotifications />
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="user-notifications-fab__count">{unreadCount}</span>}
                    {open ? <IoChevronDown /> : <IoChevronUp />}
                </button>
            </div>

            {open && (
                <aside className="user-notifications-panel">
                    <div className="user-notifications-panel__header">
                        <div>
                            <h3>Centre de notifications</h3>
                            <p>{unreadCount} non lue(s)</p>
                        </div>
                        <button onClick={() => setOpen(false)} aria-label="Fermer le centre de notifications">
                            <IoClose />
                        </button>
                    </div>

                    <div className="user-notifications-panel__list">
                        {notifications.map((notification) => {
                            const isRead = (notification.readByUserIds || []).includes(userId);

                            return (
                                <article key={notification._id} className={`user-notification-card user-notification-card--${notification.type || 'info'} ${isRead ? 'is-read' : ''}`}>
                                    <div className="user-notification-card__meta">
                                        <span className="user-notification-card__badge">{typeLabel[notification.type] || 'Info'}</span>
                                        <span>{formatDate(notification.createdAt)}</span>
                                    </div>
                                    <strong>{notification.title}</strong>
                                    <p>{notification.message}</p>
                                    <div className="user-notification-card__actions">
                                        {!isRead && (
                                            <button onClick={() => onRead(notification._id)}>
                                                <IoCheckmarkCircle /> Marquer comme lu
                                            </button>
                                        )}
                                        <button onClick={() => onDismiss(notification._id)}>
                                            <IoMailUnread /> Masquer
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </aside>
            )}
        </>
    );
}

export default UserNotifications;