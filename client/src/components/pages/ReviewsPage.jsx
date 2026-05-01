import { useState, useEffect, useEffectEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { useTranslation } from 'react-i18next';

function ReviewsPage({ user, professionalId: propProfessionalId }) {
    const { professionalId: paramProfessionalId } = useParams();
    const professionalId = propProfessionalId || paramProfessionalId;
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const { t } = useTranslation();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [professional, setProfessional] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [reviewEligibility, setReviewEligibility] = useState({
        loading: false,
        canLeaveReview: false,
        totalCompletedBookings: 0,
        reviewedCompletedBookings: 0,
        nextBooking: null,
    });
    const [reviewData, setReviewData] = useState({
        rating: 5,
        comment: '',
        serviceId: null,
        bookingId: null
    });
    const [services, setServices] = useState([]);
    const [hoveredStar, setHoveredStar] = useState(0);

    async function loadProfessional() {
        try {
            const response = await fetch(`${window.API_URL}/records/professional/${professionalId}`);
            if (response.ok) {
                const data = await response.json();
                setProfessional(data);
            }
        } catch (error) {
            console.error('Error loading professional:', error);
        }
    }

    async function loadReviews() {
        try {
            const response = await fetch(`${window.API_URL}/reviews/professional/${professionalId}`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    async function loadStats() {
        try {
            const response = await fetch(`${window.API_URL}/reviews/stats/${professionalId}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async function loadServices() {
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
    }

    async function loadReviewEligibility() {
        if (!user || user.isClient === false) {
            setReviewEligibility({
                loading: false,
                canLeaveReview: false,
                totalCompletedBookings: 0,
                reviewedCompletedBookings: 0,
                nextBooking: null,
            });
            return;
        }

        try {
            setReviewEligibility((prev) => ({ ...prev, loading: true }));
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.API_URL}/reviews/eligibility/${professionalId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                setReviewEligibility({
                    loading: false,
                    canLeaveReview: false,
                    totalCompletedBookings: 0,
                    reviewedCompletedBookings: 0,
                    nextBooking: null,
                });
                return;
            }

            const data = await response.json();
            setReviewEligibility({
                loading: false,
                canLeaveReview: Boolean(data.canLeaveReview),
                totalCompletedBookings: data.totalCompletedBookings || 0,
                reviewedCompletedBookings: data.reviewedCompletedBookings || 0,
                nextBooking: data.nextBooking || null,
            });
        } catch (error) {
            console.error('Error loading review eligibility:', error);
            setReviewEligibility({
                loading: false,
                canLeaveReview: false,
                totalCompletedBookings: 0,
                reviewedCompletedBookings: 0,
                nextBooking: null,
            });
        }
    }

    const loadPageData = useEffectEvent(() => {
        loadProfessional();
        loadReviews();
        loadStats();
        loadServices();
        loadReviewEligibility();
    });

    const openReviewFromNavigation = useEffectEvent((reviewState) => {
        setEditingReview(null);
        setReviewData({
            rating: 5,
            comment: '',
            serviceId: reviewState?.serviceId || null,
            bookingId: reviewState?.bookingId || null,
        });
        setShowModal(true);
    });

    function openCreateReviewModal() {
        if (!reviewEligibility.canLeaveReview) {
            toast(t('reviews_eligible_after_completed'), 'warning');
            return;
        }

        setEditingReview(null);
        setReviewData({
            rating: 5,
            comment: '',
            serviceId: reviewEligibility.nextBooking?.serviceId || null,
            bookingId: reviewEligibility.nextBooking?.bookingId || null,
        });
        setShowModal(true);
    }

    useEffect(() => {
        if (professionalId) {
            loadPageData();
        }
    }, [professionalId, user]);

    useEffect(() => {
        if (!location.state?.openReviewModal) {
            return;
        }

        openReviewFromNavigation(location.state);
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast(t('reviews_login_required'), 'warning');
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

            const data = await response.json();

            if (!response.ok) {
                toast(data.message || t('network_error_retry'), 'error');
                return;
            }

            setShowModal(false);
            setEditingReview(null);
            setReviewData({ rating: 5, comment: '', serviceId: null, bookingId: null });
            loadReviews();
            loadStats();
            loadProfessional();
        } catch (error) {
            console.error('Error saving review:', error);
            toast(t('network_error_retry'), 'error');
        }
    };

    const handleDelete = async (reviewId) => {
        if (!confirm(t('reviews_delete_confirm'))) return;

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
                        <IoArrowBack /> {t('return_btn')}
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
                                    <span className="review-count">({stats.total} {t('reviews_count')})</span>
                                </span>
                            </div>
                        )}
                    </div>
                    {user && user.isClient !== false && reviewEligibility.canLeaveReview && (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => openCreateReviewModal()}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <IoCreate /> {t('reviews_leave')}
                        </button>
                    )}
                </div>

                {user && user.isClient !== false && !reviewEligibility.loading && !reviewEligibility.canLeaveReview && (
                    <div className="card" style={{ marginBottom: '24px', background: '#FFF7ED', border: '1px solid #F6AD55' }}>
                        <strong style={{ display: 'block', marginBottom: '6px' }}>{t('reviews_locked_title')}</strong>
                        <span className="text-secondary">{t('reviews_eligible_after_completed')}</span>
                    </div>
                )}

                {/* Statistics */}
                {stats && stats.total > 0 && (
                    <div className="stats-section card">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoBarChart /> {t('reviews_stats_title')}</h2>
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
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoChatbubbles /> {t('reviews_clients_count', { count: reviews.length })}</h2>
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
                                                        serviceId: review.serviceId,
                                                        bookingId: review.bookingId || null,
                                                    });
                                                    setShowModal(true);
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <IoPencil /> {t('edit')}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => handleDelete(review._id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <IoTrash /> {t('action_delete')}
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
                            <h3>{t('reviews_none_title')}</h3>
                            <p>{t('reviews_none_desc')}</p>
                            {user && user.isClient !== false && reviewEligibility.canLeaveReview && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => openCreateReviewModal()}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}
                                >
                                    <IoCreate /> {t('reviews_leave')}
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
                                {editingReview ? <><IoPencil /> {t('reviews_edit')}</> : <><IoCreate /> {t('reviews_leave')}</>}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><IoClose /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('reviews_rating_label')}</label>
                                <div className="rating-input">
                                    {renderStars(reviewData.rating, true, true)}
                                    <span className="rating-label">
                                        {reviewData.rating === 5 ? t('rating_5') :
                                            reviewData.rating === 4 ? t('rating_4') :
                                                reviewData.rating === 3 ? t('rating_3') :
                                                    reviewData.rating === 2 ? t('rating_2') : t('rating_1')}
                                    </span>
                                </div>
                            </div>

                            {services.length > 0 && !reviewData.bookingId && (
                                <div className="form-group">
                                    <label className="form-label">{t('reviews_service_optional')}</label>
                                    <select
                                        className="form-select"
                                        value={reviewData.serviceId || ''}
                                        onChange={(e) => setReviewData({ ...reviewData, serviceId: e.target.value || null })}
                                    >
                                        <option value="">{t('reviews_no_specific_service')}</option>
                                        {services.map(service => (
                                            <option key={service._id} value={service._id}>
                                                {service.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">{t('reviews_comment')}</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder={t('reviews_comment_placeholder')}
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    rows="5"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {editingReview ? <><IoSave /> {t('reviews_update')}</> : <><IoCreate /> {t('reviews_publish')}</>}
                                </button>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
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

export default ReviewsPage;
