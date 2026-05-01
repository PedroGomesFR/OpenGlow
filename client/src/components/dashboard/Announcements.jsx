import { useState, useEffect } from 'react';
import { IoMegaphone, IoAdd, IoTrash, IoPencil, IoCalendar, IoCheckmarkCircle, IoCloseCircle, IoCut } from 'react-icons/io5';
import { useToast } from '../common/ToastContext';
import { useConfirm } from '../common/ConfirmContext';
import { useTranslation } from 'react-i18next';

function Announcements({ user }) {
    const toast = useToast();
    const confirm = useConfirm();
    const { t } = useTranslation();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountPercent: '',
        startDate: '',
        endDate: '',
        type: 'promotion',
        serviceId: ''
    });

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/announcements/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const proId = user._id || user.id;
            const response = await fetch(`${window.API_URL}/services/professional/${proId}`);
            if (response.ok) {
                const data = await response.json();
                setServices(data.filter(s => s.isActive));
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
        fetchServices();
    }, []);

    const handleOpenModal = (announcement = null) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                description: announcement.description,
                discountPercent: announcement.discountPercent || '',
                startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
                endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
                type: announcement.type || 'promotion',
                serviceId: announcement.serviceId || ''
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                description: '',
                discountPercent: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                type: 'promotion',
                serviceId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAnnouncement(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingAnnouncement 
            ? `${window.API_URL}/announcements/${editingAnnouncement._id}`
            : `${window.API_URL}/announcements`;
        const method = editingAnnouncement ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchAnnouncements();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                toast(errorData.error || t('announcement_save_error'), 'error');
            }
        } catch (error) {
            console.error('Error saving announcement:', error);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: t('announcement_delete_title'),
            message: t('announcement_delete_message'),
            confirmLabel: t('action_delete'),
            danger: true,
        });
        if (!confirmed) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${window.API_URL}/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setAnnouncements(announcements.filter(a => a._id !== id));
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const toggleActive = async (announcement) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${window.API_URL}/announcements/${announcement._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !announcement.isActive })
            });
            if (response.ok) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    return (
        <div className="announcements-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ marginBottom: '5px' }}>{t('announcements_title')}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('announcements_subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <IoAdd size={20} /> {t('announcement_new')}
                </button>
            </div>

            {loading ? (
                <div className="flex-center" style={{ minHeight: '200px' }}>
                    <div className="loading-spinner"></div>
                </div>
            ) : announcements.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', color: 'var(--gray-300)', marginBottom: '20px' }}>
                        <IoMegaphone />
                    </div>
                    <h3>{t('announcement_none_title')}</h3>
                    <p style={{ maxWidth: '400px', margin: '0 auto 24px auto' }}>
                        {t('announcement_none_desc')}
                    </p>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        {t('announcement_create')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-1" style={{ gap: '20px' }}>
                    {announcements.map((announcement) => (
                        <div key={announcement._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderLeft: `5px solid ${announcement.isActive ? 'var(--primary)' : 'var(--gray-300)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                        <h3 style={{ margin: 0 }}>{announcement.title}</h3>
                                        <span className={`badge ${announcement.isActive ? 'badge-primary' : 'badge-gray'}`}>
                                            {announcement.isActive ? t('status_active') : t('status_inactive')}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0 }}>{announcement.description}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="icon-btn" onClick={() => toggleActive(announcement)} title={announcement.isActive ? t('deactivate') : t('activate')}>
                                        {announcement.isActive ? <IoCloseCircle size={20} color="var(--danger)" /> : <IoCheckmarkCircle size={20} color="var(--primary)" />}
                                    </button>
                                    <button className="icon-btn" onClick={() => handleOpenModal(announcement)} title={t('edit')}>
                                        <IoPencil size={18} />
                                    </button>
                                    <button className="icon-btn" onClick={() => handleDelete(announcement._id)} title={t('action_delete')}>
                                        <IoTrash size={18} color="var(--danger)" />
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--gray-100)', paddingTop: '15px' }}>
                                {announcement.discountPercent && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <strong>{t('discount_label')}:</strong> {announcement.discountPercent}%
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <IoCalendar size={14} />
                                    <span>{t('from_label')} {new Date(announcement.startDate).toLocaleDateString()}</span>
                                    {announcement.endDate && <span>{t('to_label')} {new Date(announcement.endDate).toLocaleDateString()}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{announcement.type}</span>
                                </div>
                                {announcement.serviceId && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <IoCut size={14} />
                                        <span>{services.find(s => s._id === announcement.serviceId)?.name || t('linked_service')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingAnnouncement ? t('announcement_edit') : t('announcement_new')}</h3>
                            <button className="modal-close" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('announcement_title_label')}</label>
                                <input 
                                    className="form-input" 
                                    type="text" 
                                    placeholder={t('announcement_title_placeholder')} 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('label_description')}</label>
                                <textarea 
                                    className="form-textarea" 
                                    rows="3" 
                                    placeholder={t('announcement_desc_placeholder')}
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    required
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('announcement_service_optional')}</label>
                                <select 
                                    className="form-select"
                                    value={formData.serviceId}
                                    onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                                >
                                    <option value="">{t('announcement_all_services')}</option>
                                    {services.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.price}€)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">{t('label_type')}</label>
                                    <select 
                                        className="form-select"
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="promotion">{t('type_promotion')}</option>
                                        <option value="news">{t('type_news')}</option>
                                        <option value="event">{t('type_event')}</option>
                                        <option value="other">{t('type_other')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('announcement_discount_optional')}</label>
                                    <input 
                                        className="form-input" 
                                        type="number" 
                                        placeholder={t('announcement_discount_placeholder')}
                                        value={formData.discountPercent}
                                        onChange={(e) => setFormData({...formData, discountPercent: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">{t('start_date')}</label>
                                    <input 
                                        className="form-input" 
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('end_date_optional')}</label>
                                    <input 
                                        className="form-input" 
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingAnnouncement ? t('save_changes') : t('announcement_create')}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                    {t('action_cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Announcements;
