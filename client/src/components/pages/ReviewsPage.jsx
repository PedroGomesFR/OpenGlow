import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    IoArrowBack,
    IoBusiness,
    IoCreate,
    IoBarChart,
    IoStar,
    IoChatbubbles,
    IoPerson,
    IoCut,
    IoPencil,
    IoTrash,
    IoChatbubbleEllipses,
    IoClose,
    IoSave
} from 'react-icons/io5';
import '../css/AppleDesign.css';
import '../css/ReviewsPage.css';
import { useToast } from '../common/ToastContext';

function ReviewsPage({ user, professionalId: propProfessionalId }) {
    const { professionalId: paramProfessionalId } = useParams();
    const professionalId = propProfessionalId || paramProfessionalId;
    const navigate = useNavigate();
    const toast = useToast();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [professional, setProfessional] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [reviewData, setReviewData] = useState({
        rating: 5,
        comment: '',
        serviceId: null
    });
    const [services, setServices] = useState([]);
    const [hoveredStar, setHoveredStar] = useState(0);

    useEffect(() => {
        if (professionalId) {
            loadProfessional();
            loadReviews();
            loadStats();
            loadServices();
        }
    }, [professionalId]);

    const loadProfessional = async () => {
        try {
            const response = await fetch(`${window.API_URL}/records/professional/${professionalId}`);
            if (response.ok) {
                const data = await response.json();
                setProfessional(data);
            }
        } catch (error) {
            console.error('Error loading professional:', error);
        }
    };

    const loadReviews = async () => {
        try {
            const response = await fetch(`${window.API_URL}/reviews/professional/${professionalId}`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch(`${window.API_URL}/reviews/stats/${professionalId}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/services/professional/${professionalId}`, {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast('Vous devez être connecté pour laisser un avis', 'warning');
            navigate('/login');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = editingReview
                ? `${window.API_URL}/reviews/update/${editingReview._id}`
                : window.API_URL + '/reviews/add';

            const response = await fetch(url, {
                method: editingReview ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...reviewData,
                    professionalId
                }),
            });

            if (response.ok) {
                setShowModal(false);
                setEditingReview(null);
                setReviewData({ rating: 5, comment: '', serviceId: null });
                loadReviews();
                loadStats();
                loadProfessional();
            }
        } catch (error) {
            console.error('Error saving review:', error);
        }
    };

    const handleDelete = async (reviewId) => {
        if (!confirm('Supprimer cet avis ?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/reviews/delete/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                loadReviews();
                loadStats();
                loadProfessional();
            }
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const renderStars = (rating, interactive = false, large = false) => {
        return (
            <div className={`rating-stars ${large ? 'large' : ''}`} style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={`star ${star <= (interactive ? (hoveredStar || rating) : rating) ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                        onClick={() => interactive && setReviewData({ ...reviewData, rating: star })}
                        onMouseEnter={() => interactive && setHoveredStar(star)}
                        onMouseLeave={() => interactive && setHoveredStar(0)}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <IoStar
                            color={star <= (interactive ? (hoveredStar || rating) : rating) ? "#FFD700" : "#E0E0E0"}
                            size={large ? 24 : 16}
                        />
                    </span>
                ))}
            </div>
        );
    };

    const renderDistributionBar = (count) => {
        const maxCount = Math.max(...Object.values(stats.distribution));
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return (
            <div className="distribution-bar">
                <div className="distribution-fill" style={{ width: `${percentage}%` }}></div>
            </div>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    if (!professional) {
        return (
            <div className="reviews-page">
                <div className="container">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="reviews-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IoArrowBack /> Retour
                    </button>
                </div>

                {/* Professional Info */}
                <div className="professional-header card">
                    <div className="professional-photo">
                        {professional.profilePhoto ? (
                            <img src={`${window.BASE_URL}${professional.profilePhoto}`} alt={professional.companyName} />
                        ) : (
                            <div className="photo-placeholder">
                                <IoBusiness size={40} color="#86868b" />
                            </div>
                        )}
                    </div>
                    <div className="professional-info">
                        <h1>{professional.companyName || `${professional.prenom} ${professional.nom}`}</h1>
                        <p className="text-secondary">{professional.address}</p>
                        {stats && (
                            <div className="rating-summary">
                                {renderStars(Math.round(stats.average), false, true)}
                                <span className="rating-text">
                                    <strong>{stats.average.toFixed(1)}</strong> / 5
                                    <span className="review-count">({stats.total} avis)</span>
                                </span>
                            </div>
                        )}
                    </div>
                    {user && user.isClient !== false && (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => {
                                setEditingReview(null);
                                setReviewData({ rating: 5, comment: '', serviceId: null });
                                setShowModal(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <IoCreate /> Laisser un avis
                        </button>
                    )}
                </div>

                {/* Statistics */}
                {stats && stats.total > 0 && (
                    <div className="stats-section card">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoBarChart /> Statistiques des avis</h2>
                        <div className="distribution-grid">
                            {[5, 4, 3, 2, 1].map(star => (
                                <div key={star} className="distribution-row">
                                    <div className="distribution-label">
                                        {renderStars(star)}
                                    </div>
                                    {renderDistributionBar(stats.distribution[star])}
                                    <span className="distribution-count">{stats.distribution[star]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews List */}
                <div className="reviews-section">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoChatbubbles /> Avis clients ({reviews.length})</h2>
                    {reviews.length > 0 ? (
                        <div className="reviews-list">
                            {reviews.map(review => (
                                <div key={review._id} className="review-card card">
                                    <div className="review-header">
                                        <div className="reviewer-info">
                                            <div className="reviewer-photo">
                                                {review.client?.profilePhoto ? (
                                                    <img src={`${window.BASE_URL}${review.client.profilePhoto}`} alt={review.client.prenom} />
                                                ) : (
                                                    <div className="photo-placeholder">
                                                        <IoPerson color="#86868b" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4>{review.client?.prenom} {review.client?.nom}</h4>
                                                <p className="review-date">{formatDate(review.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="review-rating">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>

                                    {review.service && (
                                        <div className="service-badge badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <IoCut /> {review.service.name}
                                        </div>
                                    )}

                                    {review.comment && (
                                        <p className="review-comment">{review.comment}</p>
                                    )}

                                    {user && review.clientId === user._id && (
                                        <div className="review-actions">
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => {
                                                    setEditingReview(review);
                                                    setReviewData({
                                                        rating: review.rating,
                                                        comment: review.comment || '',
                                                        serviceId: review.serviceId
                                                    });
                                                    setShowModal(true);
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <IoPencil /> Modifier
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => handleDelete(review._id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <IoTrash /> Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state card">
                            <div className="empty-state-icon">
                                <IoChatbubbleEllipses size={48} color="#86868b" />
                            </div>
                            <h3>Aucun avis pour le moment</h3>
                            <p>Soyez le premier à partager votre expérience</p>
                            {user && user.isClient !== false && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowModal(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}
                                >
                                    <IoCreate /> Laisser un avis
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editingReview ? <><IoPencil /> Modifier votre avis</> : <><IoCreate /> Laisser un avis</>}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><IoClose /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Note *</label>
                                <div className="rating-input">
                                    {renderStars(reviewData.rating, true, true)}
                                    <span className="rating-label">
                                        {reviewData.rating === 5 ? 'Excellent' :
                                            reviewData.rating === 4 ? 'Très bien' :
                                                reviewData.rating === 3 ? 'Bien' :
                                                    reviewData.rating === 2 ? 'Moyen' : 'Décevant'}
                                    </span>
                                </div>
                            </div>

                            {services.length > 0 && (
                                <div className="form-group">
                                    <label className="form-label">Prestation (optionnel)</label>
                                    <select
                                        className="form-select"
                                        value={reviewData.serviceId || ''}
                                        onChange={(e) => setReviewData({ ...reviewData, serviceId: e.target.value || null })}
                                    >
                                        <option value="">Aucune prestation spécifique</option>
                                        {services.map(service => (
                                            <option key={service._id} value={service._id}>
                                                {service.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Commentaire</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Partagez votre expérience..."
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    rows="5"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {editingReview ? <><IoSave /> Mettre à jour</> : <><IoCreate /> Publier</>}
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

export default ReviewsPage;
