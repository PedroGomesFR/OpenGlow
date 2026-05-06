import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoArrowBack, IoCut, IoCamera, IoCalendar, IoLocation, IoStar, IoTime, IoFolder, IoPricetag, IoMegaphone, IoCall } from 'react-icons/io5';
import '../css/AppleDesign.css';
import { useToast } from '../common/ToastContext';

const DAYS_LABELS = { lun: 'Lun', mar: 'Mar', mer: 'Mer', jeu: 'Jeu', ven: 'Ven', sam: 'Sam', dim: 'Dim' };

const formatOpeningHours = (str) => {
    try {
        const data = JSON.parse(str);
        if (data && typeof data === 'object' && 'lun' in data) {
            const open = Object.entries(DAYS_LABELS)
                .filter(([key]) => data[key]?.open)
                .map(([key, label]) => {
                    const d = data[key];
                    const base = `${label} ${d.from}–${d.to}`;
                    return d.break ? `${base} (pause ${d.breakFrom || '12:00'}–${d.breakTo || '14:00'})` : base;
                });
            return open.length ? open.join(' · ') : 'Fermé';
        }
    } catch {}
    return str;
};

function ProfessionalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const toast = useToast();
    const [professional, setProfessional] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [announcements, setAnnouncements] = useState([]);

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

            const annResponse = await fetch(`${window.API_URL}/announcements/professional/${id}`);
            if (annResponse.ok) {
                const annData = await annResponse.json();
                setAnnouncements(annData);
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
            toast(t('alert_login_required'), 'warning');
            navigate('/login');
            return;
        }

        const selectedService = services.find(s => s._id === bookingData.serviceId);
        if (!selectedService) {
            toast(t('alert_select_service'), 'warning');
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
                toast(t('alert_booking_success'), 'success');
                navigate('/bookings');
            } else {
                toast(t('alert_booking_error'), 'error');
            }
        } catch (error) {
            console.error('Error booking:', error);
            toast(t('alert_booking_error'), 'error');
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
                    ? `url(${window.BASE_URL}${professional.salonPhotos[0]}) center/cover`
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

                {/* ── Header card ── */}
                <div className="card" style={{ marginBottom: '30px', padding: 0, overflow: 'hidden' }}>

                    {/* ── Identity row ── */}
                    <div style={{ padding: '0 28px 24px 28px', display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ marginTop: '-50px', flexShrink: 0 }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: `url(${window.BASE_URL}${professional.profilePhoto || ''}) center/cover, #e5e5e5`,
                                border: '4px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', lineHeight: 1.2 }}>
                                    {professional.companyName || `${professional.prenom} ${professional.nom}`}
                                </h1>
                                <span className="badge badge-primary" style={{ fontSize: '12px', padding: '4px 11px' }}>
                                    {professional.profession || 'Professionnel'}
                                </span>
                            </div>
                            {professional.address && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#86868b', fontSize: '13px', marginBottom: '8px' }}>
                                    <IoLocation size={14} /> {professional.address}
                                </div>
                            )}
                            {professional.description && (
                                <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6', maxWidth: '540px' }}>
                                    {professional.description}
                                </p>
                            )}
                        </div>
                        <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                            {professional.averageRating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF9E6', color: '#92600A', padding: '7px 13px', borderRadius: '10px', fontWeight: '700', fontSize: '15px' }}>
                                    <IoStar color="#F5A623" size={16} />
                                    {professional.averageRating.toFixed(1)}
                                    <span style={{ fontWeight: '400', fontSize: '12px', color: '#B8860B' }}>/ 5 ({professional.totalReviews})</span>
                                </div>
                            )}
                            {professional.totalReviews > 0 && (
                                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/reviews/${id}`)} style={{ whiteSpace: 'nowrap' }}>
                                    {t('view_reviews')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Phone + Hours row ── */}
                    <div style={{ borderTop: '1px solid #F0F0F0', display: 'flex', flexWrap: 'wrap' }}>

                        {/* Phone block */}
                        <div style={{ padding: '20px 28px', borderRight: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86868b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                <IoCall size={13} /> Téléphone
                            </div>
                            {professional.phone ? (
                                <a href={`tel:${professional.phone}`} style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary)', textDecoration: 'none', letterSpacing: '0.3px' }}>
                                    {professional.phone}
                                </a>
                            ) : (
                                <span style={{ fontSize: '14px', color: '#bbb', fontStyle: 'italic' }}>Non renseigné</span>
                            )}
                        </div>

                        {/* Hours block */}
                        <div style={{ padding: '20px 28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86868b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                                <IoTime size={13} /> Horaires d'ouverture
                            </div>
                            {professional.openingHours ? (() => {
                                try {
                                    const data = JSON.parse(professional.openingHours);
                                    if (data && 'lun' in data) {
                                        const DAYS = [
                                            { key: 'lun', short: 'Lun' }, { key: 'mar', short: 'Mar' },
                                            { key: 'mer', short: 'Mer' }, { key: 'jeu', short: 'Jeu' },
                                            { key: 'ven', short: 'Ven' }, { key: 'sam', short: 'Sam' },
                                            { key: 'dim', short: 'Dim' },
                                        ];
                                        return (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {DAYS.map(({ key, short }) => {
                                                    const d = data[key];
                                                    const isOpen = d?.open;
                                                    return (
                                                        <div key={key} style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                            padding: '10px 12px', borderRadius: '12px', minWidth: '64px',
                                                            background: isOpen ? '#F0FFF4' : '#F8F8F8',
                                                            border: `1px solid ${isOpen ? '#C6F6D5' : '#EBEBEB'}`,
                                                            gap: '4px'
                                                        }}>
                                                            <span style={{ fontWeight: '700', fontSize: '12px', color: isOpen ? '#1B6B3A' : '#bbb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{short}</span>
                                                            {isOpen ? (
                                                                <>
                                                                    <span style={{ fontWeight: '600', fontSize: '12px', color: '#1d1d1f', whiteSpace: 'nowrap' }}>{d.from} – {d.to}</span>
                                                                    {d.break && (
                                                                        <span style={{ fontSize: '10px', color: '#86868b', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                                                            pause {d.breakFrom}–{d.breakTo}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span style={{ fontSize: '11px', color: '#bbb', fontStyle: 'italic' }}>Fermé</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }
                                } catch {}
                                return <span style={{ fontSize: '14px', color: '#555' }}>{professional.openingHours}</span>;
                            })() : (
                                <span style={{ fontSize: '14px', color: '#bbb', fontStyle: 'italic' }}>Non renseignés</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-2" style={{ alignItems: 'start' }}>
                    {/* Services and Gallery */}
                    <div className="left-column">
                        {announcements.length > 0 && (
                            <div className="card" style={{ marginBottom: '30px', borderLeft: '5px solid var(--primary)', background: 'linear-gradient(to right, #ffffff, #f9fbfc)' }}>
                                <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><IoMegaphone color="var(--primary)" /> {t('announcements_title') || 'Annonces & Promotions'}</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {announcements.map(ann => (
                                        <div key={ann._id} style={{ padding: '10px 0', borderBottom: announcements.length > 1 ? '1px solid #f5f5f7' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ann.title}</h3>
                                                {ann.discountPercent && <span className="badge badge-primary">-{ann.discountPercent}%</span>}
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{ann.description}</p>
                                            {ann.serviceId && (
                                                <div style={{ marginTop: '5px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '500' }}>
                                                    Valable sur : {services.find(s => s._id === ann.serviceId)?.name || 'Cette prestation'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
