import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoGrid,
    IoCalendar,
    IoCalendarNumber,
    IoCut,
    IoStar,
    IoPerson,
    IoLogOut,
    IoBusiness,
    IoCall,
    IoLocation,
    IoTime,
    IoCamera,
    IoMegaphone,
    IoEye,
    IoEyeOff
} from 'react-icons/io5';
import '../css/AppleDesign.css';
import DashboardOverview from './DashboardOverview';
import Planning from '../common/planning';
import ServiceManagement from '../pages/ServiceManagement';
import ReviewsPage from '../pages/ReviewsPage';
import BookingsPage from '../pages/BookingsPage';
import Announcements from './Announcements';
import { useToast } from '../common/ToastContext';
import { useTranslation } from 'react-i18next';

const DAYS_FR = [
    { key: 'lun', label: 'Lundi' },
    { key: 'mar', label: 'Mardi' },
    { key: 'mer', label: 'Mercredi' },
    { key: 'jeu', label: 'Jeudi' },
    { key: 'ven', label: 'Vendredi' },
    { key: 'sam', label: 'Samedi' },
    { key: 'dim', label: 'Dimanche' },
];

const TIME_SLOTS = Array.from({ length: 35 }, (_, i) => {
    const totalMin = 360 + i * 30;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

const DEFAULT_HOURS = {
    lun: { open: true,  from: '09:00', to: '19:00', break: false, breakFrom: '12:00', breakTo: '14:00' },
    mar: { open: true,  from: '09:00', to: '19:00', break: false, breakFrom: '12:00', breakTo: '14:00' },
    mer: { open: true,  from: '09:00', to: '19:00', break: false, breakFrom: '12:00', breakTo: '14:00' },
    jeu: { open: true,  from: '09:00', to: '19:00', break: false, breakFrom: '12:00', breakTo: '14:00' },
    ven: { open: true,  from: '09:00', to: '19:00', break: false, breakFrom: '12:00', breakTo: '14:00' },
    sam: { open: true,  from: '10:00', to: '18:00', break: false, breakFrom: '12:00', breakTo: '14:00' },
    dim: { open: false, from: '10:00', to: '18:00', break: false, breakFrom: '12:00', breakTo: '14:00' },
};

const parseHoursData = (str) => {
    try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed === 'object' && 'lun' in parsed) return parsed;
    } catch {}
    return { ...DEFAULT_HOURS };
};

function ProfessionalDashboard({ user, setUser }) {
    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('planning');
    const [profileData, setProfileData] = useState({
        description: user?.description || '',
        address: user?.address || '',
        phone: user?.phone || '',
        openingHours: user?.openingHours || '',
        companyName: user?.companyName || '',
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showPwds, setShowPwds] = useState({ current: false, new: false, confirm: false });
    const [hoursData, setHoursData] = useState(() => parseHoursData(user?.openingHours));
    
    // Sync form data with user prop when it changes
    useEffect(() => {
        if (user) {
            setProfileData({
                description: user.description || '',
                address: user.address || '',
                phone: user.phone || '',
                openingHours: user.openingHours || '',
                companyName: user.companyName || '',
            });
            setHoursData(parseHoursData(user.openingHours));
        }
    }, [user]);

    const menuItems = [
        { id: 'overview', label: t('pro_tab_overview'), icon: <IoGrid size={18} /> },
        { id: 'bookings', label: t('pro_tab_bookings'), icon: <IoCalendarNumber size={18} /> },
        { id: 'planning', label: t('pro_tab_planning'), icon: <IoCalendar size={18} /> },
        { id: 'services', label: t('pro_tab_services'), icon: <IoCut size={18} /> },
        { id: 'reviews', label: t('pro_tab_reviews'), icon: <IoStar size={18} /> },
        { id: 'announcements', label: t('pro_tab_announcements'), icon: <IoMegaphone size={18} /> },
        { id: 'settings', label: t('pro_tab_profile'), icon: <IoPerson size={18} /> },
    ];

    const deconnection = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        navigate('/', { replace: true });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            // Geocoding logic
            let lat = null;
            let lon = null;

            if (profileData.address && profileData.address.length > 5) {
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(profileData.address)}&format=json&limit=1`);
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                        lat = geoData[0].lat;
                        lon = geoData[0].lon;
                    }
                } catch (geoError) {
                    console.error("Geocoding failed:", geoError);
                }
            }

            const token = localStorage.getItem('token');
            const serializedHours = JSON.stringify(hoursData);
            const bodyData = {
                ...profileData,
                openingHours: serializedHours,
                latitude: lat,
                longitude: lon
            };

            const response = await fetch(window.API_URL + '/records/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });

            if (response.ok) {
                const resData = await response.json();
                toast(t('profile_update_success'), 'success');

                // Merge response data to ensure we have the lat/lon if server processed it
                const updatedUser = {
                    ...user,
                    ...profileData,
                    openingHours: serializedHours,
                    latitude: lat || user.latitude,
                    longitude: lon || user.longitude
                };

                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast(t('profile_update_error'), 'error');
        }
    };

    const handlePhotoUpload = async (e, type) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        const token = localStorage.getItem('token');

        if (type === 'profile') {
            formData.append('profilePhoto', files[0]);
            try {
                const response = await fetch(window.API_URL + '/uploads/profile-photo', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (response.ok) {
                    const data = await response.json();
                    const updatedUser = { ...user, profilePhoto: data.photoUrl };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    toast(t('photo_updated'), 'success');
                }
            } catch (error) { console.error(error); }
        } else if (type === 'salon') {
            for (let file of files) { formData.append('salonPhotos', file); }
            try {
                const response = await fetch(window.API_URL + '/uploads/salon-photos', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (response.ok) {
                    const data = await response.json();
                    const updatedUser = { ...user, salonPhotos: [...(user.salonPhotos || []), ...data.photoUrls] };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    toast(t('pro_photos_added'), 'success');
                }
            } catch (error) { console.error(error); }
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast(t('reset_required_fields'), 'warning');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast(t('passwords_mismatch'), 'warning');
            return;
        }

        setIsChangingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(window.API_URL + '/records/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                toast(data.error || t('password_change_error'), 'error');
                return;
            }

            toast(t('password_change_success'), 'success');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            toast(t('network_error_retry'), 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <DashboardOverview user={user} setActiveTab={setActiveTab} />;
            case 'bookings':
                return <BookingsPage />;
            case 'planning':
                return <Planning />;
            case 'services':
                return <ServiceManagement user={user} />;
            case 'reviews':
                return <ReviewsPage user={user} professionalId={user._id || user.id} />;
            case 'announcements':
                return <Announcements user={user} />;
            case 'settings':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {/* Section Visuel - Photos */}
                        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
                                    <IoCamera color="var(--primary)" /> {t('pro_visuals_title')}
                                </h3>
                            </div>
                            
                            <div style={{ padding: '24px' }}>
                                {/* Profile Photo Area */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px' }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        {user?.profilePhoto ? (
                                            <img
                                                src={`${window.BASE_URL}${user.profilePhoto}`}
                                                alt="Profile"
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    border: '4px solid white'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '120px',
                                                height: '120px',
                                                borderRadius: '50%',
                                                background: '#E5E5E7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#86868b'
                                            }}>
                                                <IoPerson size={48} />
                                            </div>
                                        )}
                                        <label
                                            style={{
                                                position: 'absolute',
                                                bottom: '0',
                                                right: '0',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s'
                                            }}
                                            title={t('edit_photo')}
                                        >
                                            <IoCamera size={18} />
                                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'profile')} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0' }}>{t('pro_profile_photo')}</h4>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '400px' }}>
                                            {t('pro_profile_photo_desc')}
                                        </p>
                                    </div>
                                </div>

                                {/* Salon Photos Area */}
                                <div>
                                    <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E5E5', paddingTop: '30px', margin: '0 0 16px 0' }}>
                                        {t('pro_gallery_title')}
                                        <label className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', gap: '6px', margin: 0 }}>
                                            <IoCamera size={16} /> {t('pro_add_photos')}
                                            <input type="file" multiple accept="image/*" onChange={(e) => handlePhotoUpload(e, 'salon')} style={{ display: 'none' }} />
                                        </label>
                                    </h4>
                                    
                                    {user?.salonPhotos && user.salonPhotos.length > 0 ? (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                            gap: '16px'
                                        }}>
                                            {user.salonPhotos.map((photo, index) => (
                                                <div key={index} style={{
                                                    aspectRatio: '1',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    position: 'relative'
                                                }}>
                                                    <img 
                                                        src={`${window.BASE_URL}${photo}`} 
                                                        alt={`Salon gallery ${index + 1}`} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: '#F5F5F7',
                                            borderRadius: '12px',
                                            padding: '40px',
                                            textAlign: 'center',
                                            color: '#86868b'
                                        }}>
                                            <IoBusiness size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
                                            <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>{t('pro_no_photos')}</p>
                                            <p style={{ fontSize: '13px', margin: 0 }}>{t('pro_no_photos_desc')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section Textes - Formulaire */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
                                    <IoBusiness color="var(--primary)" /> {t('pro_business_info')}
                                </h3>
                            </div>
                            
                            <form onSubmit={handleProfileUpdate} style={{ padding: '24px' }}>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                         {t('pro_company_public_name')}
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={profileData.companyName}
                                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                                        placeholder={t('pro_company_placeholder')}
                                    />
                                </div>
                                
                                <div className="grid grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IoCall /> {t('pro_phone_number')}
                                        </label>
                                        <input
                                            className="form-input"
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            placeholder={t('pro_phone_placeholder')}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IoLocation /> {t('pro_full_address')}
                                        </label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            placeholder={t('pro_address_placeholder')}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <IoTime /> {t('pro_opening_hours')}
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {DAYS_FR.map(({ key, label }) => {
                                            const day = hoursData[key] || { open: false, from: '09:00', to: '19:00', break: false, breakFrom: '12:00', breakTo: '14:00' };
                                            return (
                                                <div key={key} style={{
                                                    borderRadius: '10px',
                                                    border: `1px solid ${day.open ? '#C6F6D5' : '#E5E5EA'}`,
                                                    background: day.open ? '#F0FFF4' : '#F5F5F7',
                                                    overflow: 'hidden',
                                                }}>
                                                    {/* Ligne principale */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '110px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={day.open}
                                                                onChange={(e) => setHoursData(prev => ({ ...prev, [key]: { ...prev[key], open: e.target.checked } }))}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                            />
                                                            {label}
                                                        </label>
                                                        {day.open ? (
                                                            <>
                                                                <select
                                                                    className="form-input"
                                                                    value={day.from}
                                                                    onChange={(e) => setHoursData(prev => ({ ...prev, [key]: { ...prev[key], from: e.target.value } }))}
                                                                    style={{ padding: '6px 10px', fontSize: '14px', flex: 1 }}
                                                                >
                                                                    {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                                                </select>
                                                                <span style={{ color: '#86868b', fontWeight: '600' }}>→</span>
                                                                <select
                                                                    className="form-input"
                                                                    value={day.to}
                                                                    onChange={(e) => setHoursData(prev => ({ ...prev, [key]: { ...prev[key], to: e.target.value } }))}
                                                                    style={{ padding: '6px 10px', fontSize: '14px', flex: 1 }}
                                                                >
                                                                    {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                                                </select>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '4px' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!day.break}
                                                                        onChange={(e) => setHoursData(prev => ({ ...prev, [key]: { ...prev[key], break: e.target.checked } }))}
                                                                        style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                                    />
                                                                    Pause midi
                                                                </label>
                                                            </>
                                                        ) : (
                                                            <span style={{ color: '#86868b', fontSize: '14px', fontStyle: 'italic' }}>Fermé</span>
                                                        )}
                                                    </div>
                                                    {/* Ligne pause midi */}
                                                    {day.open && day.break && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px 10px 134px', borderTop: '1px dashed #C6F6D5', background: '#E6FFED' }}>
                                                            <span style={{ fontSize: '13px', color: '#2D6A4F', fontWeight: '500', whiteSpace: 'nowrap' }}>☕ Pause :</span>
                                                            <select
                                                                className="form-input"
                                                                value={day.breakFrom || '12:00'}
                                                                onChange={(e) => setHoursData(prev => ({ ...prev, [key]: { ...prev[key], breakFrom: e.target.value } }))}
                                                                style={{ padding: '6px 10px', fontSize: '14px', flex: 1 }}
                                                            >
                                                                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                                            </select>
                                                            <span style={{ color: '#86868b', fontWeight: '600' }}>→</span>
                                                            <select
                                                                className="form-input"
                                                                value={day.breakTo || '14:00'}
                                                                onChange={(e) => setHoursData(prev => ({ ...prev, [key]: { ...prev[key], breakTo: e.target.value } }))}
                                                                style={{ padding: '6px 10px', fontSize: '14px', flex: 1 }}
                                                            >
                                                                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{t('pro_description_expertise')}</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="5"
                                        value={profileData.description}
                                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                                        placeholder={t('pro_description_placeholder')}
                                    ></textarea>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginTop: '30px', paddingTop: '24px', borderTop: '1px solid #E5E5E5' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
                                        {t('save_changes')}
                                    </button>
                                    <button type="button" className="btn btn-outline" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigate(`/professional/${user._id || user.id}`)}>
                                        {t('public_preview')}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA' }}>
                                <h3 style={{ margin: 0, fontSize: '18px' }}>{t('change_password_title')}</h3>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowPasswordForm((prev) => !prev)}
                                    style={{
                                        background: '#F2F2F7',
                                        color: '#1d1d1f',
                                        border: '1px solid #E5E5EA',
                                        width: '100%'
                                    }}
                                >
                                    {showPasswordForm ? t('action_close') : t('change_password_title')}
                                </button>
                            </div>
                            {showPasswordForm && (
                                <form onSubmit={handleChangePassword} style={{ padding: '0 24px 24px 24px' }}>
                                    <div className="grid grid-3" style={{ gap: '16px' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">{t('current_password_label')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    className="form-input"
                                                    type={showPwds.current ? 'text' : 'password'}
                                                    autoComplete="current-password"
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                    style={{ paddingRight: '44px' }}
                                                />
                                                <button type="button" onClick={() => setShowPwds(p => ({ ...p, current: !p.current }))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#86868b', padding: 0 }}>
                                                    {showPwds.current ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">{t('new_password_label')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    className="form-input"
                                                    type={showPwds.new ? 'text' : 'password'}
                                                    autoComplete="new-password"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    style={{ paddingRight: '44px' }}
                                                />
                                                <button type="button" onClick={() => setShowPwds(p => ({ ...p, new: !p.new }))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#86868b', padding: 0 }}>
                                                    {showPwds.new ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">{t('confirm_new_password_label')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    className="form-input"
                                                    type={showPwds.confirm ? 'text' : 'password'}
                                                    autoComplete="new-password"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    style={{ paddingRight: '44px' }}
                                                />
                                                <button type="button" onClick={() => setShowPwds(p => ({ ...p, confirm: !p.confirm }))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#86868b', padding: 0 }}>
                                                    {showPwds.confirm ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', marginTop: '20px' }}>
                                        <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>
                                            {isChangingPassword ? t('saving') : t('change_password_btn')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                );
            default:
                return <DashboardOverview user={user} />;
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <div className="dashboard-sidebar">
                <div style={{ marginBottom: '40px' }} className="desktop-only">
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        background: '#1d1d1f',
                        color: 'white',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '11px',
                        marginBottom: '10px'
                    }}>
                        <IoBusiness size={12} /> {t('pro_space')}
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>OpenGlow</h2>
                    <div style={{ fontSize: '13px', color: '#86868b', marginTop: '6px' }}>{user.companyName || t('pro_my_salon')}</div>
                </div>

                {/* Mobile Header (simplified) */}
                <div className="mobile-only" style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <strong>{t('pro_mobile_header')}</strong>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                borderRadius: '12px',
                                background: activeTab === item.id ? '#1d1d1f' : 'transparent',
                                color: activeTab === item.id ? 'white' : '#1d1d1f',
                                fontSize: '14px',
                                fontWeight: activeTab === item.id ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left',
                                gap: '12px',
                                justifyContent: 'flex-start' // Reset for mobile override in CSS if needed
                            }}
                        >
                            {item.icon}
                            {/* Label logic handled by CSS or kept simple */}
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="logout-btn" style={{ borderTop: '1px solid #E5E5E5', paddingTop: '20px' }}>
                    <button
                        onClick={deconnection}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: '#1d1d1f',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            gap: '10px'
                        }}
                    >
                        <IoLogOut />
                        {t('logout')}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default ProfessionalDashboard;
