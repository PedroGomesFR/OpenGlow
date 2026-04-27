import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { SiGooglemaps, SiWaze } from 'react-icons/si';
import { IoLocation, IoStar, IoBusiness, IoLocationOutline } from 'react-icons/io5';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../css/AppleDesign.css';
import '../css/MapView.css';

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

// Component to recenter map with animation
function FlyToView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.flyTo(center, 14, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

function MapView() {
    const navigate = useNavigate();
    const [professionals, setProfessionals] = useState([]);
    const [selectedPro, setSelectedPro] = useState(null);
    const [userLocation, setUserLocation] = useState({ lat: 48.8566, lng: 2.3522 }); // Default Paris
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        loadProfessionals();
        getUserLocation();
    }, []);

    const loadProfessionals = async () => {
        try {
            const response = await fetch(window.API_URL + '/records/professionals');
            if (response.ok) {
                const data = await response.json();
                // Filter pros with location
                const prosWithLocation = data.filter(p => p.latitude && p.longitude);
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
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('Geolocation error, using default:', error);
                }
            );
        }
    };

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

    const filteredProfessionals = professionals.filter(pro => {
        if (filterCategory === 'all') return true;
        return pro.profession === filterCategory;
    });

    const categories = [...new Set(professionals.map(p => p.profession))].filter(Boolean);

    return (
        <div className="map-view-page">
            {/* Sidebar */}
            <div className="map-sidebar">
                <div className="sidebar-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoLocation color="var(--primary)" /> Carte des Professionnels</h2>
                    <p className="text-secondary">
                        {filteredProfessionals.length} salon{filteredProfessionals.length > 1 ? 's' : ''} à proximité
                    </p>
                </div>

                {/* Filters */}
                <div className="category-filters">
                    <button
                        className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                    >
                        Tous
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="professionals-list">
                    {filteredProfessionals.map(pro => {
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
                                    <h3>{pro.companyName || `${pro.prenom} ${pro.nom}`}</h3>
                                    <p className="pro-profession">{pro.profession}</p>

                                    {pro.averageRating > 0 && (
                                        <div className="pro-rating">
                                            {renderStars(pro.averageRating)}
                                            <span className="rating-value">{pro.averageRating.toFixed(1)}</span>
                                        </div>
                                    )}

                                    <div className="pro-meta">
                                        {distance && (
                                            <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IoLocationOutline /> {distance.toFixed(1)} km</span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/professional/${pro._id}`);
                                    }}
                                >
                                    Voir
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Map */}
            <div className="map-container">
                <MapContainer
                    center={[userLocation.lat, userLocation.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FlyToView center={selectedPro ? [selectedPro.latitude, selectedPro.longitude] : [userLocation.lat, userLocation.lng]} />

                    {/* User Marker */}
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                        <Popup>
                            <b>Vous êtes ici</b>
                        </Popup>
                    </Marker>

                    {/* Professionals Markers */}
                    {filteredProfessionals.map(pro => (
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
                                            onClick={() => navigate(`/professional/${pro._id}`)}
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
                                            Profil
                                        </button>
                                        <a 
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${pro.latitude},${pro.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                background: '#eee', color: '#333', textDecoration: 'none', padding: '5px 8px', borderRadius: '5px', fontSize: '12px', display: 'flex', alignItems: 'center'
                                            }}
                                            title="Google Maps"
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
                                            title="Waze"
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
                                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/professional/${selectedPro._id}`)}>Voir profil</button>
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
                                <button className="btn btn-outline btn-sm" onClick={() => setSelectedPro(null)}>Fermer</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MapView;
