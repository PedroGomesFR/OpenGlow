import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { IoCamera, IoCalendar, IoMap, IoLogOut, IoPerson, IoTrash } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';
import '../css/ProfilePageNew.css';
import ProfessionalDashboard from '../dashboard/ProfessionalDashboard';
import { useToast } from '../common/ToastContext';
import { useConfirm } from '../common/ConfirmContext';

function ProfilePage({ user, setUser }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const toast = useToast();
    const confirm = useConfirm();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileForm, setProfileForm] = useState({
        prenom: user?.prenom || '',
        nom: user?.nom || '',
        phone: user?.phone || '',
        dateDeNaissance: user?.dateDeNaissance ? String(user.dateDeNaissance).slice(0, 10) : '',
    });

    useEffect(() => {
        setProfileForm({
            prenom: user?.prenom || '',
            nom: user?.nom || '',
            phone: user?.phone || '',
            dateDeNaissance: user?.dateDeNaissance ? String(user.dateDeNaissance).slice(0, 10) : '',
        });
    }, [user]);

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
                toast(t('photo_updated'), 'success');
                const updatedUser = { ...user, profilePhoto: data.photoUrl };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast(t('error_upload'), 'error');
        }
    };

    const deconnection = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = '/home';
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        const prenom = profileForm.prenom.trim();
        const nom = profileForm.nom.trim();
        const phone = profileForm.phone.trim();

        if (!prenom || !nom) {
            toast(t('profile_name_required'), 'error');
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(window.API_URL + '/records/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    prenom,
                    nom,
                    phone,
                    dateDeNaissance: profileForm.dateDeNaissance || null,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                toast(data.error || t('profile_update_error'), 'error');
                return;
            }

            const updatedUser = {
                ...user,
                prenom,
                nom,
                phone,
                dateDeNaissance: profileForm.dateDeNaissance || null,
            };

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setIsEditing(false);
            toast(t('profile_update_success'), 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast(t('network_error_retry'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = await confirm({
            title: t('delete_account_title'),
            message: t('delete_account_message'),
            confirmLabel: t('delete_account_confirm'),
            cancelLabel: t('action_cancel'),
            danger: true,
        });
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
                toast(data.error || t('delete_account_error'), 'error');
            }
        } catch {
            toast(t('network_error_retry'), 'error');
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
                        {user ? `${user.prenom} ${user.nom}` : t('not_available')}
                    </h1>
                    <p style={{ color: '#86868b', fontSize: '15px', marginBottom: '30px' }}>{user?.email}</p>

                    <div style={{ marginBottom: '24px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setIsEditing((prev) => !prev)}
                            style={{
                                background: '#F2F2F7',
                                color: '#1d1d1f',
                                border: '1px solid #E5E5EA',
                                width: '100%'
                            }}
                        >
                            {isEditing ? t('profile_edit_close') : t('profile_edit_open')}
                        </button>
                    </div>

                    {isEditing && (
                        <form
                            onSubmit={handleSaveProfile}
                            style={{
                                textAlign: 'left',
                                background: '#FAFAFA',
                                border: '1px solid #E5E5EA',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px'
                            }}
                        >
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div>
                                    <label htmlFor="prenom" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>{t('firstname_label')}</label>
                                    <input
                                        id="prenom"
                                        name="prenom"
                                        type="text"
                                        value={profileForm.prenom}
                                        onChange={handleFieldChange}
                                        required
                                        style={{ width: '100%', border: '1px solid #D2D2D7', borderRadius: '8px', padding: '10px 12px' }}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="nom" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>{t('lastname_label')}</label>
                                    <input
                                        id="nom"
                                        name="nom"
                                        type="text"
                                        value={profileForm.nom}
                                        onChange={handleFieldChange}
                                        required
                                        style={{ width: '100%', border: '1px solid #D2D2D7', borderRadius: '8px', padding: '10px 12px' }}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>{t('phone_label')}</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={handleFieldChange}
                                        placeholder={t('profile_phone_placeholder')}
                                        style={{ width: '100%', border: '1px solid #D2D2D7', borderRadius: '8px', padding: '10px 12px' }}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="dateDeNaissance" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>{t('birthdate_label')}</label>
                                    <input
                                        id="dateDeNaissance"
                                        name="dateDeNaissance"
                                        type="date"
                                        value={profileForm.dateDeNaissance}
                                        onChange={handleFieldChange}
                                        style={{ width: '100%', border: '1px solid #D2D2D7', borderRadius: '8px', padding: '10px 12px' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn"
                                    disabled={isSaving}
                                    style={{ width: '100%', marginTop: '6px' }}
                                >
                                    {isSaving ? t('saving') : t('save_changes')}
                                </button>
                            </div>
                        </form>
                    )}

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
                            <IoTrash size={18} /> {t('delete_my_account')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
