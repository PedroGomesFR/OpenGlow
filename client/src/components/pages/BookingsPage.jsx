import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoCalendar, IoMail, IoCall } from 'react-icons/io5';
import '../css/AppleDesign.css';

function BookingsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [user, setUser] = useState(null); // Define user state

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (!storedUser || !storedToken) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        loadBookings();
        if (!parsedUser.isClient) {
            loadStats();
        }
    }, [navigate]);

    const loadBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(window.API_URL + '/bookings/my-bookings', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(window.API_URL + '/bookings/stats', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/bookings/update-status/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                await loadBookings();
                if (!user.isClient) await loadStats();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (bookingId) => {
        if (!window.confirm(t('confirm_delete_booking'))) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/bookings/delete/${bookingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                await loadBookings();
                if (!user.isClient) await loadStats();
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
        }
    };

    const filteredBookings = filterStatus === 'all'
        ? bookings
        : bookings.filter(b => b.status === filterStatus);

    if (loading || !user) {
        return <div className="text-center p-5">{t('loading')}</div>;
    }

    return (
        <div className="bookings-page" style={{ background: '#F5F5F7', minHeight: '100vh', padding: '20px' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="bookings-header card" style={{ marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><IoCalendar color="var(--primary)" /> {user.isClient ? t('bookings_title_client') : t('bookings_title_pro')}</h1>
                        <p className="text-secondary">{user.isClient ? t('bookings_subtitle_client') : t('bookings_subtitle_pro')}</p>
                    </div>
                </div>

                {stats && !user.isClient && (
                    <div className="grid grid-3" style={{ marginBottom: '20px' }}>
                        <div className="card text-center">
                            <h3 style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>{stats.pending || 0}</h3>
                            <div className="text-secondary">{t('status_pending')}</div>
                        </div>
                        <div className="card text-center">
                            <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.confirmed || 0}</h3>
                            <div className="text-secondary">{t('status_confirmed')}</div>
                        </div>
                        <div className="card text-center">
                            <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.totalRevenue || 0}€</h3>
                            <div className="text-secondary">{t('status_revenue')}</div>
                        </div>
                    </div>
                )}

                <div className="filters-bar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                        <button
                            key={status}
                            className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterStatus(status)}
                            style={{ borderRadius: '20px', padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
                        >
                            {status === 'all' && t('filter_all')}
                            {status === 'pending' && t('filter_pending')}
                            {status === 'confirmed' && t('filter_confirmed')}
                            {status === 'completed' && t('filter_completed')}
                            {status === 'cancelled' && t('filter_cancelled')}
                        </button>
                    ))}
                </div>

                <div className="bookings-list">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map(booking => (
                            <div key={booking._id} className="card booking-item" style={{ marginBottom: '15px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{user.isClient ? booking.professionalName : booking.clientName}</h3>
                                        <div className="text-secondary" style={{ fontSize: '14px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
                                            {booking.clientEmail && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoMail /> {booking.clientEmail} </span>}
                                            {booking.clientPhone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoCall /> {booking.clientPhone}</span>}
                                        </div>
                                    </div>
                                    <span className={`badge ${booking.status === 'confirmed' || booking.status === 'completed' ? 'badge-success' :
                                        booking.status === 'cancelled' ? 'badge-error' : 'badge-primary'
                                        }`}>
                                        {booking.status === 'pending' && t('badge_pending')}
                                        {booking.status === 'confirmed' && t('badge_confirmed')}
                                        {booking.status === 'completed' && t('badge_completed')}
                                        {booking.status === 'cancelled' && t('badge_cancelled')}
                                    </span>
                                </div>

                                <div className="grid grid-3" style={{ fontSize: '14px', marginBottom: '15px' }}>
                                    <div><strong>{t('label_service')}:</strong> {booking.serviceName}</div>
                                    <div><strong>{t('label_date')}:</strong> {new Date(booking.date).toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'fr-FR')}</div>
                                    <div><strong>{t('label_time')}:</strong> {booking.time}</div>
                                    <div><strong>{t('label_duration')}:</strong> {booking.serviceDuration} min</div>
                                    <div><strong>{t('label_price')}:</strong> {booking.servicePrice}€</div>
                                </div>

                                {booking.notes && (
                                    <div style={{ background: '#F5F5F7', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }}>
                                        <strong>{t('label_notes')}:</strong> {booking.notes}
                                    </div>
                                )}

                                <div className="booking-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    {!user.isClient && booking.status === 'pending' && (
                                        <button className="btn btn-primary btn-sm" onClick={() => {
                                            if (window.confirm(t('confirm_accept_booking') || 'Confirmer ce rendez-vous ?')) handleStatusUpdate(booking._id, 'confirmed');
                                        }}>{t('action_confirm')}</button>
                                    )}
                                    {!user.isClient && booking.status === 'confirmed' && (
                                        <button className="btn btn-primary btn-sm" onClick={() => {
                                            if (window.confirm(t('confirm_complete_booking') || 'Marquer ce rendez-vous comme terminé ?')) handleStatusUpdate(booking._id, 'completed');
                                        }}>{t('action_complete')}</button>
                                    )}
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                        <button className="btn btn-danger btn-sm" onClick={() => {
                                            if (window.confirm(t('confirm_cancel_booking') || 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) handleStatusUpdate(booking._id, 'cancelled');
                                        }}>{t('action_cancel')}</button>
                                    )}
                                    {!user.isClient && (
                                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(booking._id)}>{t('action_delete')}</button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card text-center" style={{ padding: '50px 20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px', color: 'var(--text-tertiary)' }}><IoCalendar /></div>
                            <h3>{t('no_bookings_title')}</h3>
                            <p className="text-secondary">{t('no_bookings_desc')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookingsPage;
