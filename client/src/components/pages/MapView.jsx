import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { SiGooglemaps, SiWaze } from 'react-icons/si';
import { IoLocation, IoStar, IoBusiness, IoLocationOutline, IoLayers, IoChevronDown } from 'react-icons/io5';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../css/AppleDesign.css';
import '../css/MapView.css';
import { useTranslation } from 'react-i18next';

// Fix for default Leaflet icon issues in React
const iconUrl = new URL('../../assets/marker-icon.png', import.meta.url).href;
const iconShadow = new URL('../../assets/marker-shadow.png', import.meta.url).href;

let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const createProIcon = (color, size, isSelected = false) => {
    // Elegant SVG map marker
    const svgIcon = `<svg viewBox="0 0 24 24" fill="white" width="${size * 0.55}" height="${size * 0.55}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
            background-color: ${color}; 
            width: ${size}px; 
            height: ${size}px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 2px solid white; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ${isSelected ? 'transform: translateY(-4px) scale(1.1); z-index: 1000; box-shadow: 0 8px 20px rgba(0,0,0,0.25);' : ''}
        ">${svgIcon}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size + 10]
    });
};

const createUserIcon = () => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
            position: relative;
            width: 18px;
            height: 18px;
            background-color: #007AFF;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.2), 0 2px 8px rgba(0,0,0,0.2);
            z-index: 999;
        ">
            <div style="position: absolute; top:0; left:0; right:0; bottom:0; border-radius: 50%; animation: pulse 2s infinite; box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.6);"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const userIcon = createUserIcon();
const defaultProIcon = createProIcon('#1C1C1E', 36); // Apple Dark Gray 
const selectedProIcon = createProIcon('#000000', 48, true); // Pure Black & Larger for selection

const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };

const MAP_STYLES = {
    standard: {
        label: 'Standard',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    },
    light: {
        label: 'Clair',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
    },
    dark: {
        label: 'Sombre',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
    },
    terrain: {
        label: 'Relief',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
        maxZoom: 17
    }
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

const getProfessionTranslationKey = (value = '') => {
    const canonical = canonicalProfession(value);
    if (canonical === 'coiffeur') return 'profession_hairdresser';
    if (canonical === 'estheticien') return 'profession_esthetician';
    if (canonical === 'barbier') return 'profession_barber';
    if (canonical === 'manucure') return 'profession_manicure';
    if (canonical === 'masse') return 'profession_masseur';
    return null;
};

const getTranslatedProfessionLabel = (value, t) => {
    const key = getProfessionTranslationKey(value);
    if (!key) {
        return formatProfessionLabel(value);
    }
    const translated = t(key);
    return translated === key ? formatProfessionLabel(value) : formatProfessionLabel(translated);
};

const isValidLatLng = (lat, lng) => (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
);

// Component to recenter map with animation
function FlyToView({ center }) {
    const map = useMap();
    const lastCenterKeyRef = useRef(null);

    useEffect(() => {
        const lat = toFiniteNumber(center?.[0]);
        const lng = toFiniteNumber(center?.[1]);
        if (!isValidLatLng(lat, lng) || !map || typeof map.flyTo !== 'function') {
            return;
        }

        // Avoid recenter loops: only update when target center actually changes.
        const centerKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (lastCenterKeyRef.current === centerKey) {
            return;
        }
        lastCenterKeyRef.current = centerKey;

        // On mobile/responsive transitions, Leaflet may not be fully ready yet.
        if (!map._loaded) {
            return;
        }

        const size = map.getSize?.();
        if (!size || size.x <= 0 || size.y <= 0) {
            return;
        }

        try {
            const currentZoom = Number.isFinite(map.getZoom?.()) ? map.getZoom() : 13;
            map.setView([lat, lng], currentZoom, { animate: false });
        } catch (error) {
            console.warn('Map flyTo skipped due to invalid coordinates:', { lat, lng, error });
        }
    }, [center, map]);
    return null;
}

// Force Leaflet to recalculate size after the container becomes visible
function InvalidateSize({ trigger }) {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 50);
    }, [trigger, map]);
    return null;
}

function MapView() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const tx = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };
    const [professionals, setProfessionals] = useState([]);
    const [selectedPro, setSelectedPro] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterText, setFilterText] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [maxDistance, setMaxDistance] = useState(100);
    const [sortBy, setSortBy] = useState('distance');
    const [mapStyle, setMapStyle] = useState('standard');
    const [isMapStyleMenuOpen, setIsMapStyleMenuOpen] = useState(false);
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
    const [selectedPriceTiers, setSelectedPriceTiers] = useState([]);
    const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'

    const getProfessionalPath = (pro) => (pro?.slug ? `/pro/${pro.slug}` : `/professional/${pro?._id}`);

    useEffect(() => {
        loadProfessionals();
        getUserLocation();
    }, []);

    const loadProfessionals = async () => {
        try {
            const response = await fetch(window.API_URL + '/records/professionals');
            if (response.ok) {
                const data = await response.json();
                // Normalize and keep only professionals with valid coordinates
                const prosWithLocation = data
                    .map((p) => {
                        const lat = toFiniteNumber(p.latitude);
                        const lng = toFiniteNumber(p.longitude);
                        return {
                            ...p,
                            latitude: lat,
                            longitude: lng
                        };
                    })
                    .filter((p) => isValidLatLng(p.latitude, p.longitude));
                setProfessionals(prosWithLocation);
            }
        } catch (error) {
            console.error('Error loading professionals:', error);
        }
    };

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = toFiniteNumber(position?.coords?.latitude);
                    const lng = toFiniteNumber(position?.coords?.longitude);

                    if (isValidLatLng(lat, lng)) {
                        const nextLocation = { lat, lng };
                        setUserLocation(nextLocation);
                        setMapCenter(nextLocation);
                    }
                },
                (error) => {
                    console.log('Geolocation error, using default:', error);
                }
            );
        }
    };

    const safeMapCenter = isValidLatLng(mapCenter?.lat, mapCenter?.lng)
        ? [mapCenter.lat, mapCenter.lng]
        : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

    const selectedCenter = isValidLatLng(selectedPro?.latitude, selectedPro?.longitude)
        ? [selectedPro.latitude, selectedPro.longitude]
        : safeMapCenter;

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const renderStars = (rating) => {
        return (
            <div className="rating-stars-mini" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <IoStar key={star} color={star <= Math.round(rating) ? '#FFCC00' : '#EAEAEA'} size={14} />
                ))}
            </div>
        );
    };

    const normalizedFilterText = String(filterText || '').toLowerCase().trim();

    const filteredProfessionals = professionals.filter((pro) => {
        if (filterCategory !== 'all' && !professionMatches(pro.profession, filterCategory)) {
            return false;
        }

        if (Number(minRating) > 0 && Number(pro.averageRating || 0) < Number(minRating)) {
            return false;
        }

        if (normalizedFilterText) {
            const offeredServices = Array.isArray(pro.offeredServices) ? pro.offeredServices : [];
            const hasMatch = [
                pro.companyName,
                pro.profession,
                pro.address,
                pro.description,
                ...offeredServices
            ].some((field) => String(field || '').toLowerCase().includes(normalizedFilterText));

            if (!hasMatch) {
                return false;
            }
        }

        if (userLocation && Number(maxDistance) < 100) {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, pro.latitude, pro.longitude);
            if (distance > Number(maxDistance)) {
                return false;
            }
        }

        if (selectedPriceTiers.length > 0) {
            const tier = getPriceTier(pro.minPrice);
            if (tier === null || !selectedPriceTiers.includes(tier)) {
                return false;
            }
        }

        return true;
    });

    const mappableProfessionals = filteredProfessionals.filter((pro) =>
        isValidLatLng(pro?.latitude, pro?.longitude)
    );

    const sortedProfessionals = [...mappableProfessionals].sort((a, b) => {
        if (sortBy === 'distance') {
            if (!userLocation) {
                return String(a.companyName || '').localeCompare(String(b.companyName || ''));
            }
            const aDistance = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
            const bDistance = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
            return aDistance - bDistance;
        }

        if (sortBy === 'rating') {
            return Number(b.averageRating || 0) - Number(a.averageRating || 0);
        }

        if (sortBy === 'reviews') {
            return Number(b.totalReviews || 0) - Number(a.totalReviews || 0);
        }

        return String(a.companyName || '').localeCompare(String(b.companyName || ''));
    });

    const categories = [...new Set(professionals.map(p => p.profession))].filter(Boolean);
    const currentMapStyle = MAP_STYLES[mapStyle] || MAP_STYLES.standard;
    const minRatingProgress = Math.min(Math.max((Number(minRating) / 5) * 100, 0), 100);
    const maxDistanceProgress = Math.min(Math.max((Number(maxDistance) / 100) * 100, 0), 100);

    return (
        <div className="map-view-page">
            {/* Mobile tab switcher */}
            <div className="mobile-tab-switcher">
                <button
                    className={`mobile-tab-btn ${mobileTab === 'list' ? 'active' : ''}`}
                    onClick={() => setMobileTab('list')}
                >
                    ☰ Liste ({mappableProfessionals.length})
                </button>
                <button
                    className={`mobile-tab-btn ${mobileTab === 'map' ? 'active' : ''}`}
                    onClick={() => setMobileTab('map')}
                >
                    🗺 Carte
                </button>
            </div>

            {/* Sidebar */}
            <div className={`map-sidebar ${mobileTab === 'map' ? 'mobile-hidden' : ''}`}>
                <div className="sidebar-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoLocation color="var(--primary)" /> {t('map_title')}</h2>
                    <p className="text-secondary">
                        {t('map_nearby_count', { count: mappableProfessionals.length })}
                    </p>
                </div>

                <div className="map-filters-header">
                    <span>{tx('filter_sort', 'Filtres')}</span>
                    <button
                        type="button"
                        className={`map-filters-arrow ${isFiltersCollapsed ? 'collapsed' : ''}`}
                        onClick={() => setIsFiltersCollapsed((prev) => !prev)}
                        aria-label={isFiltersCollapsed ? tx('show_filters', 'Afficher les filtres') : tx('hide_filters', 'Masquer les filtres')}
                    >
                        <IoChevronDown size={16} />
                    </button>
                </div>

                <div className={`map-filters-panel ${isFiltersCollapsed ? 'collapsed' : ''}`}>
                    {/* Filters */}
                    <div className="category-filters">
                        <button
                            className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('all')}
                        >
                            {t('filters_all')}
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                                onClick={() => setFilterCategory(cat)}
                            >
                                {getTranslatedProfessionLabel(cat, t)}
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

                    <div className="map-advanced-filters">
                        <label className="map-filter-field map-filter-field-full">
                            <span>{tx('search_action', 'Rechercher')}</span>
                            <input
                                type="search"
                                value={filterText}
                                onChange={(event) => setFilterText(event.target.value)}
                                placeholder={tx('search_placeholder', 'Nom, adresse, prestation...')}
                            />
                        </label>

                        <label className="map-filter-field map-filter-field-full">
                            <span>{tx('filter_sort', 'Trier')}</span>
                            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                                <option value="distance">{tx('filter_distance_nearest', 'Distance: plus proche')}</option>
                                <option value="rating">{tx('filter_rating_highest', 'Note: meilleure')}</option>
                                <option value="reviews">{tx('filter_reviews_most', 'Avis: plus nombreux')}</option>
                                <option value="name">{tx('filter_name_az', 'Nom: A-Z')}</option>
                            </select>
                        </label>

                        <label className="map-filter-field map-filter-field-full map-slider-field">
                            <span>{tx('filter_min_rating', 'Note min')}</span>
                            <div className="map-slider-head">
                                <strong className="map-value-badge">
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
                                className="map-filter-range"
                                style={{ '--slider-progress': `${minRatingProgress}%` }}
                            />
                        </label>

                        <label className="map-filter-field map-filter-field-full map-slider-field">
                            <span>{tx('filter_max_distance', 'Distance max')}</span>
                            <div className="map-slider-head">
                                <strong className="map-value-badge">
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
                                className="map-filter-range"
                                style={{ '--slider-progress': `${maxDistanceProgress}%` }}
                                disabled={!userLocation}
                            />
                            {!userLocation && <small className="map-filter-help">{tx('map_enable_location_filter', 'Active la localisation pour le filtre distance')}</small>}
                        </label>
                    </div>
                </div>

                {/* List */}
                <div className="professionals-list">
                    {sortedProfessionals.map(pro => {
                        const distance = userLocation
                            ? calculateDistance(userLocation.lat, userLocation.lng, pro.latitude, pro.longitude)
                            : null;

                        return (
                            <div
                                key={pro._id}
                                className={`pro-card ${selectedPro?._id === pro._id ? 'selected' : ''}`}
                                onClick={() => setSelectedPro(pro)}
                            >
                                <div className="pro-photo">
                                    {pro.profilePhoto ? (
                                        <img src={`${window.BASE_URL}${pro.profilePhoto}`} alt={pro.companyName} />
                                    ) : (
                                        <div className="photo-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f5f5f7' }}>
                                            <IoBusiness size={24} color="#86868b" />
                                        </div>
                                    )}
                                </div>

                                <div className="pro-info">
                                    <div className="pro-info-header">
                                        <h3>{pro.companyName || `${pro.prenom} ${pro.nom}`}</h3>
                                        {getPriceTier(pro.minPrice) && (
                                            <span className="card-price-tier">{getPriceTier(pro.minPrice)}</span>
                                        )}
                                    </div>
                                    <p className="pro-profession">{getTranslatedProfessionLabel(pro.profession, t)}</p>

                                    <div className="pro-rating-distance">
                                        {pro.averageRating > 0 && (
                                            <div className="pro-rating">
                                                {renderStars(pro.averageRating)}
                                                <span className="rating-value">{pro.averageRating.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {distance && (
                                            <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <IoLocationOutline size={13} /> {distance.toFixed(1)} km
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        className="btn btn-primary btn-sm pro-card-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(getProfessionalPath(pro));
                                        }}
                                    >
                                        {t('view_profile')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map */}
            <div className={`map-container ${mobileTab === 'list' ? 'mobile-hidden' : ''}`}>
                <div className="map-style-control">
                    <button
                        type="button"
                        className="map-style-toggle-btn"
                        onClick={() => setIsMapStyleMenuOpen((prev) => !prev)}
                        aria-label={tx('map_style', 'Style de carte')}
                    >
                        <IoLayers size={16} /> {tx('map_style', 'Style')}
                    </button>

                    {isMapStyleMenuOpen && (
                        <div className="map-style-menu">
                            {Object.entries(MAP_STYLES).map(([value, style]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`map-style-option ${mapStyle === value ? 'active' : ''}`}
                                    onClick={() => {
                                        setMapStyle(value);
                                        setIsMapStyleMenuOpen(false);
                                    }}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <MapContainer
                    center={safeMapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution={currentMapStyle.attribution}
                        url={currentMapStyle.url}
                        maxZoom={currentMapStyle.maxZoom}
                    />

                    <FlyToView center={selectedCenter} />
                    <InvalidateSize trigger={mobileTab} />

                    {/* User Marker */}
                    <Marker position={safeMapCenter} icon={userIcon}>
                        <Popup>
                            <b>{t('map_you_are_here')}</b>
                        </Popup>
                    </Marker>

                    {/* Professionals Markers */}
                    {sortedProfessionals.map(pro => (
                        <Marker
                            key={pro._id}
                            position={[pro.latitude, pro.longitude]}
                            icon={selectedPro?._id === pro._id ? selectedProIcon : defaultProIcon}
                            eventHandlers={{
                                click: () => {
                                    setSelectedPro(pro);
                                },
                            }}
                        >
                            <Popup>
                                <div style={{ width: '200px' }}>
                                    <h3 style={{ margin: '0 0 5px', fontSize: '14px' }}>{pro.companyName}</h3>
                                    <p style={{ margin: '0 0 5px', fontSize: '12px', color: '#666' }}>{pro.profession}</p>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => navigate(getProfessionalPath(pro))}
                                            style={{
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                flex: 1
                                            }}
                                        >
                                            {t('view_profile')}
                                        </button>
                                        <a 
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${pro.latitude},${pro.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                background: '#eee', color: '#333', textDecoration: 'none', padding: '5px 8px', borderRadius: '5px', fontSize: '12px', display: 'flex', alignItems: 'center'
                                            }}
                                            title={t('map_google_maps')}
                                        >
                                            <SiGooglemaps color="#4285F4" size={16} />
                                        </a>
                                        <a 
                                            href={`https://waze.com/ul?ll=${pro.latitude},${pro.longitude}&navigate=yes`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                background: '#eee', color: '#333', textDecoration: 'none', padding: '5px 8px', borderRadius: '5px', fontSize: '12px', display: 'flex', alignItems: 'center'
                                            }}
                                            title={t('map_waze')}
                                        >
                                            <SiWaze color="#33CCFF" size={16} />
                                        </a>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {selectedPro && (
                    <div className="selected-pro-overlay card" style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        left: '20px',
                        maxWidth: '400px',
                        margin: '0 auto',
                        zIndex: 1000, // Above map
                        padding: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: '#eee', overflow: 'hidden', flexShrink: 0
                        }}>
                            {selectedPro.profilePhoto ? (
                                <img src={`${window.BASE_URL}${selectedPro.profilePhoto}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e5ea' }}>
                                    <IoBusiness size={24} color="#86868b" />
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedPro.companyName}</h3>
                            <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>{selectedPro.address}</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate(getProfessionalPath(selectedPro))}>{t('view_profile')}</button>
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPro.latitude},${selectedPro.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline btn-sm"
                                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <SiGooglemaps color="#4285F4" size={16} /> G.Maps
                                </a>
                                <a 
                                    href={`https://waze.com/ul?ll=${selectedPro.latitude},${selectedPro.longitude}&navigate=yes`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline btn-sm"
                                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <SiWaze color="#33CCFF" size={16} /> Waze
                                </a>
                                <button className="btn btn-outline btn-sm" onClick={() => setSelectedPro(null)}>{t('action_close')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MapView;
