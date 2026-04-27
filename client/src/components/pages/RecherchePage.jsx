import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoSearch, IoBusiness, IoLocation, IoCall, IoTime, IoStar } from 'react-icons/io5';
import '../css/RecherchePage.css';

function RecherchePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [professionals, setProfessionals] = useState([]);
    const [filteredProfessionals, setFilteredProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfession, setSelectedProfession] = useState('all');

    const professions = ['all', 'hairdresser', 'esthetician', 'barber', 'manicure', 'masseur'];

    useEffect(() => {
        loadProfessionals();
    }, []);

    useEffect(() => {
        filterProfessionals();
    }, [searchQuery, selectedProfession, professionals]);

    const loadProfessionals = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/records/professionals');
            if (response.ok) {
                const data = await response.json();
                setProfessionals(data);
                setFilteredProfessionals(data);
            }
        } catch (error) {
            console.error('Error loading professionals:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterProfessionals = () => {
        let filtered = [...professionals];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(pro =>
                pro.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pro.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pro.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pro.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by profession
        if (selectedProfession !== 'all') {
            const translatedProf = t(`profession_${selectedProfession}`);
            filtered = filtered.filter(pro =>
                pro.profession?.toLowerCase() === translatedProf.toLowerCase() ||
                pro.profession?.toLowerCase() === selectedProfession.toLowerCase()
            );
        }

        setFilteredProfessionals(filtered);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        filterProfessionals();
    };

    const viewProfile = (professionalId) => {
        navigate(`/professional/${professionalId}`);
    };

    if (loading) {
        return <div className="RecherchePage"><div className="loading">{t('loading')}</div></div>;
    }

    return (
        <div className="RecherchePage">
            <div className="search-header">
                <h1>{t('search_title')}</h1>

                <form onSubmit={handleSearch} className="search-bar">
                    <IoSearch className="search-icon-marker" />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="search-btn">{t('search_action')}</button>
                </form>

                <div className="filters">
                    {professions.map((professionKey) => (
                        <button
                            key={professionKey}
                            className={`filter-btn ${selectedProfession === professionKey ? 'active' : ''}`}
                            onClick={() => setSelectedProfession(professionKey)}
                        >
                            {professionKey === 'all' ? t('filters_all') : t(`profession_${professionKey}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="results-section">
                <div className="results-header">
                    <h2>{t('available_pros')}</h2>
                    <span className="results-count">{filteredProfessionals.length} {t('results_label')}</span>
                </div>

                {filteredProfessionals.length > 0 ? (
                    <div className="professionals-grid">
                        {filteredProfessionals.map((pro) => (
                            <div key={pro._id} className="professional-card" onClick={() => viewProfile(pro._id)}>
                                {pro.profilePhoto ? (
                                    <img
                                        src={`http://localhost:5001${pro.profilePhoto}`}
                                        alt={pro.companyName}
                                        className="card-image"
                                    />
                                ) : (
                                    <div className="card-image-placeholder">
                                        <IoBusiness size={48} color="#86868b" />
                                    </div>
                                )}

                                <div className="card-content">
                                    <h3>{pro.companyName || `${pro.prenom} ${pro.nom}`}</h3>
                                    <span className="profession-badge">{pro.profession || 'Professionnel'}</span>

                                    {pro.averageRating > 0 && (
                                        <div className="card-info-item" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#FFD700' }}>
                                            <IoStar /> <span style={{ color: '#1d1d1f', fontWeight: '600' }}>{pro.averageRating.toFixed(1)}</span>
                                            <span style={{ color: '#86868b', fontWeight: '400' }}>({pro.totalReviews} avis)</span>
                                        </div>
                                    )}
                                    {pro.description && (
                                        <p className="card-description">{pro.description}</p>
                                    )}

                                    <div className="card-info">
                                        {pro.address && (
                                            <div className="card-info-item">
                                                <IoLocation /> {pro.address}
                                            </div>
                                        )}
                                        {pro.phone && (
                                            <div className="card-info-item">
                                                <IoCall /> {pro.phone}
                                            </div>
                                        )}
                                        {pro.openingHours && (
                                            <div className="card-info-item">
                                                <IoTime /> {pro.openingHours}
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-footer">
                                        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                                            {t('view_profile')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <h3>{t('no_results_title')}</h3>
                        <p>{t('no_results_desc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecherchePage;