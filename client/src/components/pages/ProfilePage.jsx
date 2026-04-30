import { useNavigate } from "react-router-dom";
import { IoCamera, IoCalendar, IoMap, IoLogOut, IoPerson } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';
import '../css/ProfilePageNew.css';
import ProfessionalDashboard from '../dashboard/ProfessionalDashboard';

function ProfilePage({ user, setUser }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // IF PROFESSIONAL -> Render Dashboard
    if (user && user.isClient === false) {
        return <ProfessionalDashboard user={user} setUser={setUser} />;
    }

    // IF CLIENT -> Render Standard Profile
    const handlePhotoUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        const token = localStorage.getItem('token');
        formData.append('profilePhoto', files[0]);

        try {
            const response = await fetch(window.API_URL + '/uploads/profile-photo', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                alert(t('photo_updated'));
                const updatedUser = { ...user, profilePhoto: data.photoUrl };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert(t('error_upload'));
        }
    };

    const deconnection = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = '/home';
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Êtes-vous sûr de vouloir supprimer votre compte ?\n\nCette action est irréversible. Toutes vos données (réservations, avis, photos) seront définitivement supprimées conformément à votre droit à l\'effacement (RGPD art. 17).'
        );
        if (!confirmed) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(window.API_URL + '/records/delete-account', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/home';
            } else {
                const data = await res.json();
                alert(data.error || 'Erreur lors de la suppression du compte.');
            }
        } catch {
            alert('Erreur réseau. Veuillez réessayer.');
        }
    };

    return (
        <div style={{ background: '#F5F5F7', minHeight: '100vh', padding: '40px 20px' }}>
            <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card" style={{ textAlign: 'center', padding: '40px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'var(--primary)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '12px',
                        letterSpacing: '0.5px'
                    }}>
                        {t('client_space')}
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                        {user?.profilePhoto ? (
                            <img
                                src={`${window.BASE_URL}${user.profilePhoto}`}
                                alt="Profile"
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '4px solid white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
                                margin: '0 auto',
                                color: '#86868b'
                            }}>
                                <IoPerson size={64} />
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
                                transition: 'all 0.2s transform'
                            }}
                            title={t('edit_photo')}
                        >
                            <IoCamera size={18} />
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        </label>
                    </div>

                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '5px' }}>
                        {user ? `${user.prenom} ${user.nom}` : 'N/A'}
                    </h1>
                    <p style={{ color: '#86868b', fontSize: '15px', marginBottom: '30px' }}>{user?.email}</p>

                    <div className="grid grid-2 mobile-col" style={{ gap: '15px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/bookings')}
                            style={{
                                background: '#F2F2F7',
                                color: '#1d1d1f',
                                border: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px',
                                height: 'auto',
                                width: '100%',
                                gap: '10px'
                            }}
                        >
                            <IoCalendar size={24} />
                            <span style={{ fontWeight: '600' }}>{t('my_bookings')}</span>
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/map')}
                            style={{
                                background: '#F2F2F7',
                                color: '#1d1d1f',
                                border: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px',
                                height: 'auto',
                                width: '100%',
                                gap: '10px'
                            }}
                        >
                            <IoMap size={24} />
                            <span style={{ fontWeight: '600' }}>{t('explore_map')}</span>
                        </button>
                    </div>

                    <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #E5E5E5' }}>
                        <button
                            className="btn btn-outline"
                            onClick={deconnection}
                            style={{
                                background: 'transparent',
                                color: '#1d1d1f',
                                border: '1px solid var(--primary)',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <IoLogOut size={18} /> {t('logout')}
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            style={{
                                marginTop: '12px',
                                background: 'transparent',
                                color: '#FF3B30',
                                border: '1px solid #FF3B30',
                                borderRadius: '10px',
                                width: '100%',
                                padding: '12px',
                                fontWeight: '600',
                                fontSize: '15px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#fff0ef'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            🗑 Supprimer mon compte
                        </button>
                        <p style={{ fontSize: '11px', color: '#86868b', textAlign: 'center', marginTop: '6px' }}>
                            Droit à l'effacement — RGPD art. 17
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
