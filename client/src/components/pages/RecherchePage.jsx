import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IoSearch, IoBusiness, IoLocation, IoCall, IoStar, IoChevronDown } from 'react-icons/io5';
import '../css/RecherchePage.css';

const normalize = (value = '') => String(value).toLowerCase();
const normalizeText = (value = '') => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const canonicalProfession = (value = '') => {
    const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, ' ');
    if (!normalized) return '';

    if (normalized.includes('coiffeur') || normalized.includes('hairdresser')) return 'coiffeur';
    if (normalized.includes('barbier') || normalized.includes('barber')) return 'barbier';
    if (normalized.includes('estheticien') || normalized.includes('esthetician')) return 'estheticien';
    if (normalized.includes('manucure') || normalized.includes('manicure')) return 'manucure';
    if (normalized.includes('masseur') || normalized.includes('massage')) return 'masse';

    return normalized.replace(/\s+/g, ' ').trim();
};

const professionMatches = (professionalProfession, selectedCategory) => {
    const proCanonical = canonicalProfession(professionalProfession);
    const selectedCanonical = canonicalProfession(selectedCategory);

    if (!proCanonical || !selectedCanonical) return false;
    return proCanonical === selectedCanonical;
};

const formatProfessionLabel = (value = '') => {
    const normalized = normalizeText(value);
    if (normalized === 'coiffeur' || normalized === 'coiffeurse' || normalized === 'hairdresser') {
        return 'Coiffeur(se)';
    }
    return value;
};
const getPriceTier = (price) => {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return null;
    if (p <= 25) return '€';
    if (p <= 45) return '€€';
    if (p <= 80) return '€€€';
    return '€€€€';
};

const PRICE_TIERS = ['€', '€€', '€€€', '€€€€'];

const toFiniteNumber = (value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const isValidLatLng = (lat, lng) => (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
);
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

function RecherchePage() {
    const { t } = useTranslation();
    const tx = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
    const [professionals, setProfessionals] = useState([]);
    const [filteredProfessionals, setFilteredProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfession, setSelectedProfession] = useState('all');
    const [minRating, setMinRating] = useState(0);
    const [maxDistance, setMaxDistance] = useState(100);
    const [sortBy, setSortBy] = useState('distance');
    const [userLocation, setUserLocation] = useState(null);
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
    const [selectedPriceTiers, setSelectedPriceTiers] = useState([]);

    const professions = ['all', 'hairdresser', 'esthetician', 'barber', 'manicure', 'masseur'];

    useEffect(() => {
        loadProfessionals();
        getUserLocation();
    }, []);

    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    useEffect(() => {
        filterProfessionals();
    }, [searchQuery, selectedProfession, minRating, maxDistance, sortBy, professionals, userLocation, t, selectedPriceTiers]);

    const getUserLocation = () => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = toFiniteNumber(position?.coords?.latitude);
                const lng = toFiniteNumber(position?.coords?.longitude);
                if (isValidLatLng(lat, lng)) {
                    setUserLocation({ lat, lng });
                }
            },
            () => {
                setUserLocation(null);
            }
        );
    };

    const loadProfessionals = async () => {
        try {
            const response = await fetch(window.API_URL + '/records/professionals');
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
            const normalizedQuery = normalize(searchQuery);
            filtered = filtered.filter(pro =>
                normalize(pro.companyName).includes(normalizedQuery) ||
                normalize(pro.profession).includes(normalizedQuery) ||
                normalize(pro.address).includes(normalizedQuery) ||
                normalize(pro.description).includes(normalizedQuery) ||
                (Array.isArray(pro.offeredServices) && pro.offeredServices.some((serviceName) =>
                    normalize(serviceName).includes(normalizedQuery)
                ))
            );
        }

        // Filter by profession
        if (selectedProfession !== 'all') {
            const translatedProf = t(`profession_${selectedProfession}`);
            filtered = filtered.filter(pro =>
                professionMatches(pro.profession, translatedProf) ||
                professionMatches(pro.profession, selectedProfession)
            );
        }

        if (Number(minRating) > 0) {
            const min = Number(minRating);
            filtered = filtered.filter((pro) => Number(pro.averageRating || 0) >= min);
        }

        if (selectedPriceTiers.length > 0) {
            filtered = filtered.filter((pro) => {
                const tier = getPriceTier(pro.minPrice);
                return tier !== null && selectedPriceTiers.includes(tier);
            });
        }

        if (userLocation && Number(maxDistance) < 100) {
            const maxKm = Number(maxDistance);
            filtered = filtered.filter((pro) => {
                const lat = toFiniteNumber(pro.latitude);
                const lng = toFiniteNumber(pro.longitude);
                if (!isValidLatLng(lat, lng)) {
                    return false;
                }
                const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
                return distance <= maxKm;
            });
        }

        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === 'distance') {
                if (!userLocation) {
                    return normalize(a.companyName || '').localeCompare(normalize(b.companyName || ''));
                }
                const aLat = toFiniteNumber(a.latitude);
                const aLng = toFiniteNumber(a.longitude);
                const bLat = toFiniteNumber(b.latitude);
                const bLng = toFiniteNumber(b.longitude);
                const aDistance = isValidLatLng(aLat, aLng)
                    ? calculateDistance(userLocation.lat, userLocation.lng, aLat, aLng)
                    : Number.POSITIVE_INFINITY;
                const bDistance = isValidLatLng(bLat, bLng)
                    ? calculateDistance(userLocation.lat, userLocation.lng, bLat, bLng)
                    : Number.POSITIVE_INFINITY;
                return aDistance - bDistance;
            }

            if (sortBy === 'rating') {
                return Number(b.averageRating || 0) - Number(a.averageRating || 0);
            }

            if (sortBy === 'reviews') {
                return Number(b.totalReviews || 0) - Number(a.totalReviews || 0);
            }

            return normalize(a.companyName || '').localeCompare(normalize(b.companyName || ''));
        });

        setFilteredProfessionals(sorted);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        filterProfessionals();
    };

    const viewProfile = (professional) => {
        const profilePath = professional?.slug
            ? `/pro/${professional.slug}`
            : `/professional/${professional?._id}`;
        navigate(profilePath);
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

                <div className="search-filters-header">
                    <span>{tx('filter_sort', 'Filtres')}</span>
                    <button
                        type="button"
                        className={`search-filters-arrow ${isFiltersCollapsed ? 'collapsed' : ''}`}
                        onClick={() => setIsFiltersCollapsed((prev) => !prev)}
                        aria-label={isFiltersCollapsed ? tx('show_filters', 'Afficher les filtres') : tx('hide_filters', 'Masquer les filtres')}
                    >
                        <IoChevronDown size={16} />
                    </button>
                </div>

                <div className={`search-filters-panel ${isFiltersCollapsed ? 'collapsed' : ''}`}>
                    <div className="filters">
                        {professions.map((professionKey) => (
                            <button
                                key={professionKey}
                                className={`filter-btn ${selectedProfession === professionKey ? 'active' : ''}`}
                                onClick={() => setSelectedProfession(professionKey)}
                            >
                                {professionKey === 'all' ? t('filters_all') : formatProfessionLabel(t(`profession_${professionKey}`))}
                            </button>
                        ))}
                    </div>

                    <div className="price-tier-filter-row">
                        <span className="price-tier-filter-label">{tx('filter_price', 'Prix')}</span>
                        <div className="price-tier-buttons">
                            {PRICE_TIERS.map((tier) => (
                                <button
                                    key={tier}
                                    className={`price-tier-btn ${selectedPriceTiers.includes(tier) ? 'active' : ''}`}
                                    onClick={() => setSelectedPriceTiers((prev) =>
                                        prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
                                    )}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="search-advanced-filters">
                        <label className="search-filter-field">
                            <span>{tx('filter_sort', 'Trier')}</span>
                            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                                <option value="distance">{tx('filter_distance_nearest', 'Distance: plus proche')}</option>
                                <option value="rating">{tx('filter_rating_highest', 'Note: meilleure')}</option>
                                <option value="reviews">{tx('filter_reviews_most', 'Avis: plus nombreux')}</option>
                                <option value="name">{tx('filter_name_az', 'Nom: A-Z')}</option>
                            </select>
                        </label>

                        <label className="search-filter-field">
                            <span>{tx('filter_min_rating', 'Note minimale')}</span>
                            <div className="search-slider-head">
                                <strong className="search-value-badge">
                                    {Number(minRating) === 0 ? tx('filters_all', 'Tous') : `${Number(minRating).toFixed(1)}+`}
                                </strong>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.5"
                                value={minRating}
                                onChange={(event) => setMinRating(Number(event.target.value))}
                                className="search-filter-range"
                            />
                        </label>

                        <label className="search-filter-field">
                            <span>{tx('filter_max_distance', 'Distance max')}</span>
                            <div className="search-slider-head">
                                <strong className="search-value-badge">
                                    {Number(maxDistance) >= 100 ? tx('filters_all', 'Tous') : `${Number(maxDistance)} km`}
                                </strong>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="100"
                                step="5"
                                value={maxDistance}
                                onChange={(event) => setMaxDistance(Number(event.target.value))}
                                className="search-filter-range"
                                disabled={!userLocation}
                            />
                            {!userLocation && <small className="search-filter-help">{tx('map_enable_location_filter', 'Active la localisation pour le filtre distance')}</small>}
                        </label>
                    </div>
                </div>
            </div>

            <div className="results-section">
                <div className="results-header">
                    <h2>{t('available_pros')}</h2>
                    <span className="results-count">{filteredProfessionals.length} {t('results_label')}</span>
                </div>

                {filteredProfessionals.length > 0 ? (
                    <div className="professionals-grid">
                        {filteredProfessionals.map((pro) => {
                            const offeredServices = Array.isArray(pro.offeredServices) ? pro.offeredServices : [];
                            const previewServices = offeredServices.slice(0, 3);
                            const remainingServicesCount = Math.max(offeredServices.length - previewServices.length, 0);

                            return (
                            <div key={pro._id} className="professional-card" onClick={() => viewProfile(pro)}>
                                {pro.profilePhoto ? (
                                    <img
                                        src={`${window.BASE_URL}${pro.profilePhoto}`}
                                        alt={pro.companyName}
                                        className="card-image"
                                    />
                                ) : (
                                    <div className="card-image-placeholder">
                                        <IoBusiness size={48} color="#86868b" />
                                    </div>
                                )}

                                <div className="card-content">
                                    <div className="card-header-row">
                                        <h3>{pro.companyName || `${pro.prenom} ${pro.nom}`}</h3>
                                        {getPriceTier(pro.minPrice) && (
                                            <span className="card-price-tier">{getPriceTier(pro.minPrice)}</span>
                                        )}
                                    </div>
                                    <span className="profession-badge">{formatProfessionLabel(pro.profession || 'Professionnel')}</span>

                                    {pro.averageRating > 0 && (
                                        <div className="card-info-item" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#FFD700' }}>
                                            <IoStar /> <span style={{ color: '#1d1d1f', fontWeight: '600' }}>{pro.averageRating.toFixed(1)}</span>
                                            <span style={{ color: '#86868b', fontWeight: '400' }}>({pro.totalReviews} avis)</span>
                                        </div>
                                    )}
                                    {pro.description && (
                                        <p className="card-description">{pro.description}</p>
                                    )}

                                    {previewServices.length > 0 && (
                                        <div className="card-services" aria-label={t('services_title')}>
                                            {previewServices.map((serviceName) => (
                                                <span key={`${pro._id}-${serviceName}`} className="card-service-chip">
                                                    {serviceName}
                                                </span>
                                            ))}
                                            {remainingServicesCount > 0 && (
                                                <span className="card-service-chip card-service-chip-more">+{remainingServicesCount}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="card-info">
                                        {userLocation && isValidLatLng(toFiniteNumber(pro.latitude), toFiniteNumber(pro.longitude)) && (
                                            <div className="card-info-item">
                                                <IoLocation /> {calculateDistance(userLocation.lat, userLocation.lng, Number(pro.latitude), Number(pro.longitude)).toFixed(1)} km
                                            </div>
                                        )}
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

                                    </div>

                                    <div className="card-footer">
                                        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                                            {t('view_profile')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
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