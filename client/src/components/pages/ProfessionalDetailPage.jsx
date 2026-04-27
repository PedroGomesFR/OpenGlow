import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoArrowBack, IoCut, IoCamera, IoCalendar, IoLocation, IoStar, IoTime, IoFolder, IoPricetag } from 'react-icons/io5';
import '../css/AppleDesign.css';

function ProfessionalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [professional, setProfessional] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [bookingData, setBookingData] = useState({
        serviceId: '',
        date: '',
        hour: '', // Will be 11:00 format
    });

    useEffect(() => {
        loadProfessionalData();
    }, [id]);

    useEffect(() => {
        if (bookingData.date) {
            loadSlots(bookingData.date);
        }
    }, [bookingData.date]);

    const loadProfessionalData = async () => {
        try {
            const proResponse = await fetch(`${window.API_URL}/records/professional/${id}`);
            if (proResponse.ok) {
                const proData = await proResponse.json();
                setProfessional(proData);
            }

            const servicesResponse = await fetch(`${window.API_URL}/services/professional/${id}`);
            if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                setServices(servicesData.filter(s => s.isActive));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async (date) => {
        setLoadingSlots(true);
        try {
            const response = await fetch(`${window.API_URL}/availability/slots/${id}?date=${date}`);
            if (response.ok) {
                const data = await response.json();
                setSlots(data);
            } else {
                setSlots([]);
            }
        } catch (error) {
            console.error('Error loading slots:', error);
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!localStorage.getItem('token')) {
            alert(t('alert_login_required'));
            navigate('/login');
            return;
        }

        const selectedService = services.find(s => s._id === bookingData.serviceId);
        if (!selectedService) {
            alert(t('alert_select_service'));
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(window.API_URL + '/bookings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    professionalId: id,
                    serviceId: bookingData.serviceId,
                    date: bookingData.date,
                    time: bookingData.hour,
                    notes: '',
                }),
            });

            if (response.ok) {
                alert(t('alert_booking_success'));
                navigate('/bookings');
            } else {
                alert(t('alert_booking_error'));
            }
        } catch (error) {
            console.error('Error booking:', error);
            alert(t('alert_booking_error'));
        }
    };

    if (loading) return <div className="text-center p-5">{t('loading')}</div>;
    if (!professional) return <div className="text-center p-5">{t('pro_not_found')}</div>;

    const selectedService = services.find(s => s._id === bookingData.serviceId);

    return (
        <div className="professional-page" style={{ background: '#F5F5F7', minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Banner */}
            <div style={{
                height: '300px',
                background: professional.salonPhotos?.[0]
                    ? `url(http://localhost:5001${professional.salonPhotos[0]}) center/cover`
                    : 'linear-gradient(135deg, #1d1d1f 0%, #434344 100%)',
                position: 'relative'
            }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/recherche')}
                    style={{ position: 'absolute', top: '20px', left: '20px', borderRadius: '50px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <IoArrowBack /> {t('return_btn')}
                </button>
            </div>

            <div className="container" style={{ marginTop: '-60px', position: 'relative', zIndex: 10 }}>
                {/* Header Info */}
                <div className="card" style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <div style={{ marginTop: '-80px', marginBottom: '20px' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: `url(http://localhost:5001${professional.profilePhoto || ''}) center/cover, #eee`,
                            border: '4px solid white',
                            margin: '0 auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}></div>
                    </div>

                    <h1 style={{ margin: '0 0 10px 0' }}>{professional.companyName || `${professional.prenom} ${professional.nom}`}</h1>
                    <div className="badge badge-primary" style={{ marginBottom: '15px' }}>{professional.profession || 'Professionnel'}</div>

                    <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto 20px' }}>
                        {professional.description || t('default_pro_desc')}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '14px', flexWrap: 'wrap' }}>
                        {professional.address && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoLocation /> {professional.address}</span>}
                        {professional.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📞 {professional.phone}</span>}
                        {professional.openingHours && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoTime /> {professional.openingHours}</span>}
                        {professional.averageRating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoStar /> {professional.averageRating.toFixed(1)}/5 ({professional.totalReviews} {t('reviews_count')})</span>}
                    </div>

                    {professional.totalReviews > 0 && (
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate(`/reviews/${id}`)}
                            style={{ marginTop: '15px' }}
                        >
                            {t('view_reviews')}
                        </button>
                    )}
                </div>

                <div className="grid grid-2" style={{ alignItems: 'start' }}>
                    {/* Services and Gallery */}
                    <div className="left-column">
                        <div className="card" style={{ marginBottom: '30px' }}>
                            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><IoCut /> {t('services_title')}</h2>
                            {services.length > 0 ? (
                                <div className="services-list">
                                    {services.map(service => (
                                        <div
                                            key={service._id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                padding: '15px 0',
                                                borderBottom: '1px solid #f5f5f7',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setBookingData({ ...bookingData, serviceId: service._id })}
                                        >
                                            <div>
                                                <div style={{ fontWeight: '600', marginBottom: '4px', color: bookingData.serviceId === service._id ? 'var(--primary)' : 'inherit' }}>
                                                    {service.name}
                                                </div>
                                                <div className="text-secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoTime size={14} /> {service.duration} min</span>
                                                    <span>•</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoFolder size={14} /> {service.category}</span>
                                                </div>
                                                {service.description && <div className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>{service.description}</div>}
                                            </div>
                                            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><IoPricetag size={14} /> {service.price}€</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary">{t('no_services')}</p>
                            )}
                        </div>

                        {professional.salonPhotos?.length > 0 && (
                            <div className="card">
                                <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><IoCamera /> {t('gallery_title')}</h2>
                                <div className="grid grid-3">
                                    {professional.salonPhotos.map((photo, i) => (
                                        <div key={i} style={{ aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden' }}>
                                            <img src={`${window.BASE_URL}${photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Booking Form */}
                    <div className="booking-card card" style={{ position: 'sticky', top: '20px' }}>
                        <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><IoCalendar /> {t('booking_title')}</h2>
                        <form onSubmit={handleBooking}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label">{t('label_select_service')}</label>
                                <select
                                    className="form-input"
                                    required
                                    value={bookingData.serviceId}
                                    onChange={(e) => setBookingData({ ...bookingData, serviceId: e.target.value })}
                                >
                                    <option value="">{t('placeholder_select_service')}</option>
                                    {services.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.price}€)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label">{t('label_select_date')}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={bookingData.date}
                                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value, hour: '' })}
                                />
                            </div>

                            {bookingData.date && (
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label">{t('label_select_slot')}</label>
                                    {loadingSlots ? (
                                        <div className="text-secondary">{t('loading_slots')}</div>
                                    ) : slots.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                            {slots.map((slot, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    disabled={!slot.available}
                                                    className={`btn ${bookingData.hour === slot.time ? 'btn-primary' : 'btn-outline'}`}
                                                    style={{
                                                        padding: '8px',
                                                        fontSize: '13px',
                                                        opacity: slot.available ? 1 : 0.5,
                                                        textDecoration: slot.available ? 'none' : 'line-through'
                                                    }}
                                                    onClick={() => slot.available && setBookingData({ ...bookingData, hour: slot.time })}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-secondary">{t('no_slots_available')}</div>
                                    )}
                                </div>
                            )}

                            {selectedService && bookingData.hour && (
                                <div style={{ padding: '15px', background: '#F5F5F7', borderRadius: '12px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>{t('total_label')}</span>
                                        <strong>{selectedService.price}€</strong>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#86868b' }}>
                                        {new Date(bookingData.date).toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'fr-FR')} à {bookingData.hour}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={!bookingData.serviceId || !bookingData.date || !bookingData.hour}
                            >
                                {t('confirm_booking_btn')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfessionalDetailPage;
