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
    IoMegaphone
} from 'react-icons/io5';
import '../css/AppleDesign.css';
import DashboardOverview from './DashboardOverview';
import Planning from '../common/planning';
import ServiceManagement from '../pages/ServiceManagement';
import ReviewsPage from '../pages/ReviewsPage';
import BookingsPage from '../pages/BookingsPage';
import Announcements from './Announcements';
import { useToast } from '../common/ToastContext';

function ProfessionalDashboard({ user, setUser }) {
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('planning');
    const [profileData, setProfileData] = useState({
        description: user?.description || '',
        address: user?.address || '',
        phone: user?.phone || '',
        openingHours: user?.openingHours || '',
        companyName: user?.companyName || '',
    });
    
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
        }
    }, [user]);

    const menuItems = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: <IoGrid size={18} /> },
        { id: 'bookings', label: 'Réservations', icon: <IoCalendarNumber size={18} /> },
        { id: 'planning', label: 'Planning', icon: <IoCalendar size={18} /> },
        { id: 'services', label: 'Prestations', icon: <IoCut size={18} /> },
        { id: 'reviews', label: 'Avis Clients', icon: <IoStar size={18} /> },
        { id: 'announcements', label: 'Annonces', icon: <IoMegaphone size={18} /> },
        { id: 'settings', label: 'Mon Profil', icon: <IoPerson size={18} /> },
    ];

    const deconnection = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = '/home';
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
            const bodyData = {
                ...profileData,
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
                toast('Profil mis à jour avec succès !', 'success');

                // Merge response data to ensure we have the lat/lon if server processed it
                const updatedUser = {
                    ...user,
                    ...profileData,
                    latitude: lat || user.latitude,
                    longitude: lon || user.longitude
                };

                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast('Erreur lors de la mise à jour', 'error');
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
                    toast('Photo de profil mise à jour !', 'success');
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
                    toast('Photos ajoutées !', 'success');
                }
            } catch (error) { console.error(error); }
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
                                    <IoCamera color="var(--primary)" /> Photos & Visuels
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
                                            title="Modifier la photo"
                                        >
                                            <IoCamera size={18} />
                                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'profile')} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0' }}>Photo de profil</h4>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '400px' }}>
                                            Apparaît sur votre fiche publique pour que les clients vous reconnaissent facilement.
                                        </p>
                                    </div>
                                </div>

                                {/* Salon Photos Area */}
                                <div>
                                    <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E5E5', paddingTop: '30px', margin: '0 0 16px 0' }}>
                                        Galerie d'images (Salon & Réalisations)
                                        <label className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', gap: '6px', margin: 0 }}>
                                            <IoCamera size={16} /> Ajouter des photos
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
                                            <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>Aucune photo pour l'instant.</p>
                                            <p style={{ fontSize: '13px', margin: 0 }}>Ajoutez des photos de votre espace ou de vos réalisations pour attirer plus de clients.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section Textes - Formulaire */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
                                    <IoBusiness color="var(--primary)" /> Informations de l'établissement
                                </h3>
                            </div>
                            
                            <form onSubmit={handleProfileUpdate} style={{ padding: '24px' }}>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                         Mon Entreprise (Nom public)
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={profileData.companyName}
                                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                                        placeholder="Ex: Institut Beauté Plus"
                                    />
                                </div>
                                
                                <div className="grid grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IoCall /> Numéro de Téléphone
                                        </label>
                                        <input
                                            className="form-input"
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            placeholder="Ex: 01 23 45 67 89"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IoLocation /> Adresse Complète
                                        </label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            placeholder="Ex: 10 Rue de Paris, 75001 Paris"
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <IoTime /> Horaires d'ouverture (Affichage libre)
                                    </label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={profileData.openingHours}
                                        onChange={(e) => setProfileData({ ...profileData, openingHours: e.target.value })}
                                        placeholder="Ex: Lundi-Vendredi 9h-18h, Samedi 9h-12h"
                                    />
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Description / Notre Expertise</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="5"
                                        value={profileData.description}
                                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                                        placeholder="Présentez votre établissement, votre équipe et votre savoir-faire en quelques lignes..."
                                    ></textarea>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginTop: '30px', paddingTop: '24px', borderTop: '1px solid #E5E5E5' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
                                        Enregistrer les modifications
                                    </button>
                                    <button type="button" className="btn btn-outline" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigate(`/professional/${user._id || user.id}`)}>
                                        Aperçu public
                                    </button>
                                </div>
                            </form>
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
                        <IoBusiness size={12} /> ESPACE PRO
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>OpenGlow</h2>
                    <div style={{ fontSize: '13px', color: '#86868b', marginTop: '6px' }}>{user.companyName || 'Mon Salon'}</div>
                </div>

                {/* Mobile Header (simplified) */}
                <div className="mobile-only" style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <strong>OpenGlow Pro</strong>
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
                        Déconnexion
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
