import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoCut, IoColorPalette, IoSparkles, IoBody, IoHandLeft, IoBrush,
    IoStar, IoSearch, IoStatsChart, IoCheckmarkCircle, IoCash, IoPricetag,
    IoAdd, IoCreate, IoTrash, IoEye, IoEyeOff, IoTime, IoFolder,
    IoClose, IoWater, IoLeaf, IoOptions, IoRefresh
} from 'react-icons/io5';
import '../css/AppleDesign.css';
import '../css/ServiceManagement.css';

function ServiceManagement({ user }) {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [serviceData, setServiceData] = useState({
        name: '',
        description: '',
        duration: '',
        price: '',
        category: 'Coiffure',
    });

    useEffect(() => {
        loadServices();
        loadCategories();
    }, []);

    const loadServices = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Stop if no token

            const response = await fetch(window.API_URL + '/services/my-services', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data);
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch(window.API_URL + '/services/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Erreur: Vous n'êtes pas connecté. Veuillez vous reconnecter.");
                window.location.href = '/login';
                return;
            }

            const url = editingService
                ? `${window.API_URL}/services/update/${editingService._id}`
                : window.API_URL + '/services/add';

            const response = await fetch(url, {
                method: editingService ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(serviceData),
            });

            if (response.ok) {
                setShowModal(false);
                setEditingService(null);
                setServiceData({ name: '', description: '', duration: '', price: '', category: 'Coiffure' });
                loadServices();
            }
        } catch (error) {
            console.error('Error saving service:', error);
        }
    };

    const handleEdit = (service) => {
        setEditingService(service);
        setServiceData({
            name: service.name,
            description: service.description || '',
            duration: service.duration,
            price: service.price,
            category: service.category,
        });
        setShowModal(true);
    };

    const handleDelete = async (serviceId) => {
        if (!confirm('Supprimer cette prestation ?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/services/delete/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) loadServices();
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const handleToggle = async (serviceId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/services/update/${serviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) loadServices();
        } catch (error) {
            console.error('Error toggling service:', error);
        }
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'Coiffure': <IoCut />,
            'Coupe Femme': <IoCut />,
            'Coupe Homme': <IoCut />,
            'Coupe Enfant': <IoCut />,
            'Barbier': <IoCut />,
            'Coloration': <IoColorPalette />,
            'Mèches & Balayage': <IoColorPalette />,
            'Lissage & Défrisage': <IoSparkles />,
            'Soins Capillaires': <IoSparkles />,
            'Extensions Capillaires': <IoCut />,
            'Manucure': <IoHandLeft />,
            'Pédicure': <IoBody />,
            'Onglerie': <IoHandLeft />,
            'Épilation': <IoBody />,
            'Épilation Définitive': <IoSparkles />,
            'Beauté du Regard': <IoEye />,
            'Maquillage': <IoBrush />,
            'Soins du Visage': <IoSparkles />,
            'Soins du Corps': <IoBody />,
            'Massage': <IoBody />,
            'Spa & Balnéo': <IoWater />,
            'Tatouage': <IoCreate />,
            'Piercing': <IoCreate />,
            'Bien-être': <IoLeaf />,
            'Autre': <IoStar />
        };
        return icons[category] || <IoStar />;
    };

    const filteredServices = services.filter(service => {
        const matchCategory = filterCategory === 'all' || service.category === filterCategory;
        const matchSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const stats = {
        total: services.length,
        active: services.filter(s => s.isActive).length,
        minPrice: services.length > 0 ? Math.min(...services.map(s => s.price)) : 0,
        maxPrice: services.length > 0 ? Math.max(...services.map(s => s.price)) : 0,
    };

    return (
        <div className="service-management-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <IoCut /> Gestion des Prestations
                        </h1>
                        <p className="text-secondary">
                            Gérez vos services, prix et disponibilités
                        </p>
                    </div>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                            setEditingService(null);
                            setServiceData({ name: '', description: '', duration: '', price: '', category: 'Coiffure' });
                            setShowModal(true);
                        }}
                    >
                        <IoAdd size={20} /> Nouvelle Prestation
                    </button>
                </div>

                {/* Stats Cards */}
                {services.length > 0 && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon"><IoStatsChart /></div>
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Prestations</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><IoCheckmarkCircle /></div>
                            <div className="stat-value">{stats.active}</div>
                            <div className="stat-label">Actives</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><IoCash /></div>
                            <div className="stat-value">{stats.minPrice}€</div>
                            <div className="stat-label">Prix Min</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><IoPricetag /></div>
                            <div className="stat-value">{stats.maxPrice}€</div>
                            <div className="stat-label">Prix Max</div>
                        </div>
                    </div>
                )}

                {/* Filters toggle bar */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {/* Search always visible */}
                    <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
                        <span className="search-icon"><IoSearch /></span>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Rechercher une prestation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter toggle button */}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '12px', border: 'none',
                            background: showFilters ? 'var(--primary)' : '#F0F0F5',
                            color: showFilters ? 'white' : 'var(--text-primary)',
                            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}
                    >
                        <IoOptions size={18} />
                        Filtrer
                        {filterCategory !== 'all' && (
                            <span style={{
                                background: showFilters ? 'rgba(255,255,255,0.3)' : 'var(--primary)',
                                color: 'white', borderRadius: '50%',
                                width: '20px', height: '20px', fontSize: '11px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
                            }}>1</span>
                        )}
                    </button>

                    {/* Reset filter button - only when active */}
                    {(filterCategory !== 'all' || searchQuery) && (
                        <button
                            onClick={() => { setFilterCategory('all'); setSearchQuery(''); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 14px', borderRadius: '12px',
                                border: '1px solid #ddd', background: 'white',
                                color: '#888', fontSize: '13px', cursor: 'pointer'
                            }}
                        >
                            <IoRefresh size={16} /> Réinitialiser
                        </button>
                    )}
                </div>

                {/* Filters panel - collapsible */}
                {showFilters && (
                    <div className="filters-section" style={{ marginBottom: '20px', animation: 'fadeIn 0.2s ease' }}>
                        <div className="category-filters">
                            <button
                                className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterCategory('all')}
                            >
                                Toutes
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                                    onClick={() => { setFilterCategory(cat); }}
                                >
                                    {getCategoryIcon(cat)} {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Services List */}
                {filteredServices.length > 0 ? (
                    <div className="services-grid">
                        {filteredServices.map(service => (
                            <div key={service._id} className={`service-card ${!service.isActive ? 'inactive' : ''}`}>
                                <div className="service-card-header">
                                    <div className="service-title-row">
                                        <span className="category-icon">{getCategoryIcon(service.category)}</span>
                                        <div className="service-info">
                                            <h3>{service.name}</h3>
                                            {!service.isActive && (
                                                <span className="badge badge-gray" style={{ fontSize: '0.7rem', marginTop: '4px', alignSelf: 'flex-start' }}>
                                                    Inactif
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Only clear actions in header if absolutely needed, otherwise keep it clean */}
                                </div>

                                <p className="service-description">
                                    {service.description || "Aucune description"}
                                </p>

                                <div className="service-meta">
                                    <div className="meta-item">
                                        <IoTime className="text-tertiary" />
                                        <span>{service.duration} min</span>
                                    </div>
                                    <div className="meta-item">
                                        <IoFolder className="text-tertiary" />
                                        <span>{service.category}</span>
                                    </div>
                                </div>

                                <div className="service-footer">
                                    <div className="price-tag">{service.price}€</div>
                                    <div className="action-buttons">
                                        <button
                                            className={`icon-btn ${service.isActive ? 'active' : ''}`}
                                            onClick={() => handleToggle(service._id, service.isActive)}
                                            title={service.isActive ? 'Désactiver' : 'Activer'}
                                        >
                                            {service.isActive ? <IoEye size={18} /> : <IoEyeOff size={18} />}
                                        </button>
                                        <button
                                            className="icon-btn"
                                            onClick={() => handleEdit(service)}
                                            title="Modifier"
                                        >
                                            <IoCreate size={18} />
                                        </button>
                                        <button
                                            className="icon-btn danger"
                                            onClick={() => handleDelete(service._id)}
                                            title="Supprimer"
                                        >
                                            <IoTrash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state card">
                        <div className="empty-state-icon"><IoCut size={48} /></div>
                        <h3>Aucune prestation trouvée</h3>
                        <p>
                            {services.length === 0
                                ? "Ajoutez votre première prestation pour commencer"
                                : "Aucune prestation ne correspond à vos critères"
                            }
                        </p>
                        {services.length === 0 && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowModal(true)}
                            >
                                <IoAdd size={20} /> Ajouter une prestation
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {editingService ? <IoCreate /> : <IoAdd />}
                                {editingService ? 'Modifier la prestation' : 'Nouvelle prestation'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><IoClose size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nom de la prestation *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Ex: Coupe femme"
                                    value={serviceData.name}
                                    onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Catégorie *</label>
                                <select
                                    className="form-select"
                                    required
                                    value={serviceData.category}
                                    onChange={(e) => setServiceData({ ...serviceData, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Décrivez votre prestation..."
                                    value={serviceData.description}
                                    onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">Durée (minutes) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="1"
                                        placeholder="60"
                                        value={serviceData.duration}
                                        onChange={(e) => setServiceData({ ...serviceData, duration: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Prix (€) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="35.00"
                                        value={serviceData.price}
                                        onChange={(e) => setServiceData({ ...serviceData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                    {editingService ? <IoCreate /> : <IoAdd />}
                                    {editingService ? 'Mettre à jour' : 'Ajouter'}
                                </button>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServiceManagement;
