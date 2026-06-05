import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoCalendar, IoMail, IoCall, IoAdd } from 'react-icons/io5';
import '../css/AppleDesign.css';
import { useConfirm } from '../common/ConfirmContext';

function BookingsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const confirm = useConfirm();
    const [bookings, setBookings] = useState([]);
    const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [user, setUser] = useState(null); // Define user state
    const [proServices, setProServices] = useState([]);
    const [editingServicesBookingId, setEditingServicesBookingId] = useState(null);
    const [selectedServiceIdsToAdd, setSelectedServiceIdsToAdd] = useState([]);
    const [addingServices, setAddingServices] = useState(false);

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
        if (parsedUser.isClient) {
            loadReviewedBookings();
        }
        if (!parsedUser.isClient) {
            loadStats();
            loadProfessionalServices();
        }
    }, [navigate]);

    const getBookingServices = (booking) => {
        if (Array.isArray(booking.services) && booking.services.length > 0) {
            return booking.services;
        }
        if (!booking.serviceId) {
            return [];
        }
        return [{
            id: booking.serviceId,
            name: booking.serviceName,
            price: booking.servicePrice,
            duration: booking.serviceDuration,
        }];
    };

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

    const loadReviewedBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/reviews/my-reviews`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setReviewedBookingIds(new Set(data.map((review) => review.bookingId).filter(Boolean)));
            }
        } catch (error) {
            console.error('Error loading reviewed bookings:', error);
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

    const loadProfessionalServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/services/my-services`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setProServices((data || []).filter((service) => service.isActive !== false));
            }
        } catch (error) {
            console.error('Error loading professional services:', error);
        }
    };

    const toggleServiceToAdd = (serviceId) => {
        setSelectedServiceIdsToAdd((prev) => (
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        ));
    };

    const openAddServicesPanel = (booking) => {
        const existingIds = new Set(getBookingServices(booking).map((service) => String(service.id || service._id || service.serviceId)));
        setEditingServicesBookingId(booking._id);
        setSelectedServiceIdsToAdd(
            proServices
                .map((service) => String(service._id))
                .filter((serviceId) => !existingIds.has(serviceId))
        );
    };

    const handleAddServices = async (bookingId) => {
        if (selectedServiceIdsToAdd.length === 0) return;
        setAddingServices(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/bookings/${bookingId}/add-services`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ serviceIds: selectedServiceIdsToAdd }),
            });

            if (response.ok) {
                setEditingServicesBookingId(null);
                setSelectedServiceIdsToAdd([]);
                await loadBookings();
                await loadStats();
            }
        } catch (error) {
            console.error('Error adding services to booking:', error);
        } finally {
            setAddingServices(false);
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
        const confirmed = await confirm({
            title: t('delete_booking_title'),
            message: t('confirm_delete_booking_message'),
            confirmLabel: t('action_delete'),
            danger: true,
        });
        if (!confirmed) return;

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
                            <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.completed || 0}</h3>
                            <div className="text-secondary">{t('filter_completed')}</div>
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
                                    <div>
                                        <strong>{t('label_service')}:</strong>{' '}
                                        {getBookingServices(booking).map((service) => service.name).join(', ') || booking.serviceName}
                                    </div>
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
                                    {user.isClient && booking.status === 'completed' && !reviewedBookingIds.has(booking._id) && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => navigate(`/reviews/${booking.professionalId}`, {
                                                state: {
                                                    openReviewModal: true,
                                                    bookingId: booking._id,
                                                    serviceId: booking.serviceId || null,
                                                },
                                            })}
                                        >
                                            {t('reviews_leave')}
                                        </button>
                                    )}
                                    {user.isClient && booking.status === 'completed' && reviewedBookingIds.has(booking._id) && (
                                        <span className="badge badge-primary">
                                            {t('reviews_already_left')}
                                        </span>
                                    )}
                                    {!user.isClient && booking.status === 'pending' && (
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            const ok = await confirm({ title: t('confirm_booking_title'), message: t('confirm_accept_booking'), confirmLabel: t('action_confirm') });
                                            if (ok) handleStatusUpdate(booking._id, 'confirmed');
                                        }}>{t('action_confirm')}</button>
                                    )}
                                    {!user.isClient && booking.status === 'confirmed' && (
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            const ok = await confirm({ title: t('complete_booking_title'), message: t('confirm_complete_booking'), confirmLabel: t('action_complete') });
                                            if (ok) handleStatusUpdate(booking._id, 'completed');
                                        }}>{t('action_complete')}</button>
                                    )}
                                    {!user.isClient && ['pending', 'confirmed'].includes(booking.status) && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openAddServicesPanel(booking)}
                                        >
                                            <IoAdd /> {t('bookings_add_services', { defaultValue: 'Ajouter des prestations' })}
                                        </button>
                                    )}
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                        <button className="btn btn-danger btn-sm" onClick={async () => {
                                            const ok = await confirm({ title: t('cancel_booking_title'), message: t('confirm_cancel_booking'), confirmLabel: t('cancel_booking_confirm'), danger: true });
                                            if (ok) handleStatusUpdate(booking._id, 'cancelled');
                                        }}>{t('action_cancel')}</button>
                                    )}
                                    {!user.isClient && (
                                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(booking._id)}>{t('action_delete')}</button>
                                    )}
                                </div>

                                {!user.isClient && editingServicesBookingId === booking._id && (
                                    <div style={{ marginTop: '12px', borderTop: '1px solid #ececec', paddingTop: '12px' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                                            {t('bookings_add_services', { defaultValue: 'Ajouter des prestations' })}
                                        </div>
                                        <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                                            {proServices.map((service) => {
                                                const alreadyInBooking = getBookingServices(booking).some(
                                                    (item) => String(item.id || item._id || item.serviceId) === String(service._id)
                                                );
                                                return (
                                                    <label
                                                        key={service._id}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '8px 10px',
                                                            border: '1px solid #E5E5E7',
                                                            borderRadius: '8px',
                                                            opacity: alreadyInBooking ? 0.55 : 1,
                                                        }}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                type="checkbox"
                                                                disabled={alreadyInBooking}
                                                                checked={alreadyInBooking || selectedServiceIdsToAdd.includes(String(service._id))}
                                                                onChange={() => toggleServiceToAdd(String(service._id))}
                                                            />
                                                            <span>{service.name}</span>
                                                        </span>
                                                        <strong>{service.price}€</strong>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => {
                                                    setEditingServicesBookingId(null);
                                                    setSelectedServiceIdsToAdd([]);
                                                }}
                                            >
                                                {t('action_cancel')}
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                disabled={addingServices || selectedServiceIdsToAdd.length === 0}
                                                onClick={() => handleAddServices(booking._id)}
                                            >
                                                {addingServices ? t('saving') : t('action_confirm')}
                                            </button>
                                        </div>
                                    </div>
                                )}
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