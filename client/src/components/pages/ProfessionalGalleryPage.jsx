import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    IoArrowBack,
    IoArrowForward,
    IoBusiness,
    IoClose,
    IoGridOutline,
    IoImages,
    IoLocation,
    IoPersonCircle,
} from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';
import '../css/ProfessionalGalleryPage.css';

const getProfessionalName = (professional) => (
    professional?.companyName || `${professional?.prenom || ''} ${professional?.nom || ''}`.trim() || 'Salon'
);

const getProfessionalPath = (professional, fallbackId) => (
    professional?.slug ? `/pro/${professional.slug}` : `/professional/${professional?._id || fallbackId}`
);

function ProfessionalGalleryPage() {
    const { id, slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [professional, setProfessional] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const loadProfessional = async () => {
            setLoading(true);
            try {
                let proData = null;

                if (slug) {
                    const response = await fetch(`${window.API_URL}/records/professional/slug/${encodeURIComponent(slug)}`);
                    if (response.ok) {
                        const payload = await response.json();
                        proData = payload.professional;

                        if (payload.redirectTo && payload.redirectTo !== slug) {
                            navigate(`/pro/${payload.redirectTo}/galerie`, { replace: true });
                        }
                    }
                }

                if (!proData && id) {
                    const response = await fetch(`${window.API_URL}/records/professional/${id}`);
                    if (response.ok) {
                        proData = await response.json();
                    }
                }

                setProfessional(proData);
            } catch (error) {
                console.error('Error loading professional gallery:', error);
                setProfessional(null);
            } finally {
                setLoading(false);
            }
        };

        loadProfessional();
    }, [id, slug, navigate]);

    const photos = useMemo(() => (
        Array.isArray(professional?.salonPhotos) ? professional.salonPhotos : []
    ), [professional]);

    useEffect(() => {
        if (loading || photos.length === 0) return;
        const requestedPhoto = Number(searchParams.get('photo'));
        if (Number.isInteger(requestedPhoto) && requestedPhoto >= 0 && requestedPhoto < photos.length) {
            setActiveIndex(requestedPhoto);
        }
    }, [loading, photos.length, searchParams]);

    const professionalName = getProfessionalName(professional);
    const profilePath = getProfessionalPath(professional, id);

    const openPhoto = (index) => {
        setActiveIndex(index);
        setSearchParams({ photo: String(index) });
    };

    const closePhoto = () => {
        setActiveIndex(null);
        setSearchParams({});
    };

    const showPrevious = () => {
        setActiveIndex((current) => {
            if (current === null || current <= 0) return current;
            const next = current - 1;
            setSearchParams({ photo: String(next) });
            return next;
        });
    };

    const showNext = () => {
        setActiveIndex((current) => {
            if (current === null || current >= photos.length - 1) return current;
            const next = current + 1;
            setSearchParams({ photo: String(next) });
            return next;
        });
    };

    if (loading) {
        return <div className="professional-gallery-loading">{t('loading')}</div>;
    }

    if (!professional) {
        return <div className="professional-gallery-loading">{t('pro_not_found')}</div>;
    }

    return (
        <div className="professional-gallery-page">
            <header className="professional-gallery-header">
                <button type="button" className="btn btn-secondary" onClick={() => navigate(profilePath)}>
                    <IoArrowBack />
                    Retour au profil
                </button>

                <div className="professional-gallery-identity">
                    {professional.profilePhoto ? (
                        <img src={`${window.BASE_URL}${professional.profilePhoto}`} alt={professionalName} />
                    ) : (
                        <span><IoPersonCircle size={46} /></span>
                    )}
                    <div>
                        <div className="professional-gallery-eyebrow">
                            <IoImages size={15} />
                            Galerie du salon
                        </div>
                        <h1>{professionalName}</h1>
                        <p>
                            {professional.profession || 'Professionnel'}
                            {professional.address ? (
                                <>
                                    <span> • </span>
                                    <IoLocation size={13} />
                                    {professional.address}
                                </>
                            ) : null}
                        </p>
                    </div>
                </div>

                <button type="button" className="btn btn-outline" onClick={() => navigate(profilePath)}>
                    <IoBusiness />
                    Voir le profil
                </button>
            </header>

            {photos.length > 0 ? (
                <section className="professional-gallery-grid" aria-label={`Galerie de ${professionalName}`}>
                    {photos.map((photo, index) => (
                        <button
                            type="button"
                            key={`${photo}-${index}`}
                            className="professional-gallery-tile"
                            onClick={() => openPhoto(index)}
                        >
                            <img src={`${window.BASE_URL}${photo}`} alt={`${professionalName} - photo ${index + 1}`} />
                            <span>
                                <IoGridOutline size={16} />
                                {index + 1} / {photos.length}
                            </span>
                        </button>
                    ))}
                </section>
            ) : (
                <section className="professional-gallery-empty">
                    <IoImages size={48} />
                    <h2>Aucune photo dans cette galerie</h2>
                    <p>Ce professionnel n'a pas encore ajouté de photos de salon.</p>
                </section>
            )}

            {activeIndex !== null && photos[activeIndex] && (
                <div className="professional-gallery-modal" role="dialog" aria-modal="true">
                    <button
                        type="button"
                        className="professional-gallery-modal-close"
                        onClick={closePhoto}
                        aria-label="Fermer la photo"
                    >
                        <IoClose size={22} />
                    </button>

                    <button
                        type="button"
                        className="professional-gallery-modal-nav professional-gallery-modal-prev"
                        onClick={showPrevious}
                        disabled={activeIndex <= 0}
                        aria-label="Photo précédente"
                    >
                        <IoArrowBack size={22} />
                    </button>

                    <figure className="professional-gallery-modal-content">
                        <img
                            src={`${window.BASE_URL}${photos[activeIndex]}`}
                            alt={`${professionalName} - photo ${activeIndex + 1}`}
                        />
                        <figcaption>
                            <strong>{professionalName}</strong>
                            <span>{activeIndex + 1} / {photos.length}</span>
                        </figcaption>
                    </figure>

                    <button
                        type="button"
                        className="professional-gallery-modal-nav professional-gallery-modal-next"
                        onClick={showNext}
                        disabled={activeIndex >= photos.length - 1}
                        aria-label="Photo suivante"
                    >
                        <IoArrowForward size={22} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProfessionalGalleryPage;
