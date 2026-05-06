import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';
import '../css/MainPage.css';
import { IoArrowForward, IoBusiness, IoCalendar, IoLocation, IoSearch, IoSparkles, IoStar } from 'react-icons/io5';

const salonImage = new URL('../assets/hero_beauty_salon.png', import.meta.url).href;


function MainPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [featuredPros, setFeaturedPros] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/recherche?q=${encodeURIComponent(q)}` : '/recherche');
  };

  useEffect(() => {
    loadFeaturedPros();
  }, []);

  const loadFeaturedPros = async () => {
    try {
      const response = await fetch(window.API_URL + '/professionals/feature');
      if (response.ok) {
        const data = await response.json();
        setFeaturedPros(data);
      }
    } catch (error) {
      console.error('Error loading featured pros:', error);
    }
  };

  return (
    <div className="page-container">

      {/* Hero Section - No Image Variant */}
      <div className="main-hero" style={{
        position: 'relative',
        minHeight: '80vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundImage: `url(${salonImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginBottom: '60px',
      }}>

        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%)',
          zIndex: 0
        }} />

        {/* Content */}
        <div className="container main-hero-content" style={{ position: 'relative', zIndex: 1, maxWidth: '900px', padding: '0 20px' }}>
          <h2 className="main-hero-eyebrow" style={{
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '20px',
          }}>
            {t('hero_welcome')}
          </h2>

          <h1 className="main-hero-title" style={{
            fontWeight: '700',
            letterSpacing: '-1.5px',
            lineHeight: '1.05',
            color: '#ffffff',
            marginBottom: '30px',
            textShadow: '0 2px 16px rgba(0,0,0,0.5)'
          }}>
            {t('hero_slogan')}
          </h1>

          <p className="main-hero-desc" style={{
            lineHeight: '1.5',
            color: '#ffffff',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
            fontWeight: '400'
          }}>
            {t('hero_desc')}
          </p>
          <form
            onSubmit={handleSearch}
            className="main-hero-actions"
            style={{ display: 'flex', gap: '0', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '580px', margin: '0 auto' }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder') || 'Coiffeur, esthéticienne, barbier…'}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '15px 22px',
                borderRadius: '30px 0 0 30px',
                border: 'none',
                fontSize: '16px',
                outline: 'none',
                background: 'rgba(255,255,255,0.97)',
                color: '#1d1d1f',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '15px 28px', borderRadius: '0 30px 30px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}
            >
              <IoSearch size={20} />
              {t('search_btn') || 'Rechercher'}
            </button>
          </form>
        </div>
      </div>

      <div className="container">
        {/* Features Grid */}
        <div className="grid grid-3 main-feature-grid" style={{ marginBottom: '100px', gap: '30px' }}>
          <div className="card text-center" style={{
            padding: '40px 24px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              color: '#1d1d1f'
            }}>
              <IoSearch />
            </div>
            <h3>{t('feature_search_title')}</h3>
            <p className="text-secondary">{t('feature_search_desc')}</p>
          </div>

          <div className="card text-center" style={{
            padding: '40px 24px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              color: '#1d1d1f'
            }}>
              <IoCalendar />
            </div>
            <h3>{t('feature_book_title')}</h3>
            <p className="text-secondary">{t('feature_book_desc')}</p>
          </div>

          <div className="card text-center" style={{
            padding: '40px 24px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              color: '#1d1d1f'
            }}>
              <IoSparkles />
            </div>
            <h3>{t('feature_enjoy_title')}</h3>
            <p className="text-secondary">{t('feature_enjoy_desc')}</p>
          </div>
        </div>

        {/* Featured Pros Section */}
        {featuredPros.length > 0 && (
          <div className="main-featured-section" style={{ marginBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 className="main-featured-title" style={{ marginBottom: '16px' }}>{t('featured_pros_title')}</h2>
              <p className="text-secondary" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                {t('featured_pros_desc')}
              </p>
            </div>

            <div className="grid grid-3">
              {featuredPros.map(pro => (
                <div
                  key={pro._id}
                  className="card pro-card-hover"
                  onClick={() => navigate(`/professional/${pro._id}`)}
                  style={{
                    cursor: 'pointer',
                    overflow: 'hidden',
                    padding: 0,
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={{
                    height: '240px',
                    background: pro.profilePhoto
                      ? `url(${window.BASE_URL}${pro.profilePhoto}) center/cover`
                      : '#f5f5f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {!pro.profilePhoto && <IoBusiness size={64} color="#86868b" />}
                    {pro.totalReviews > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <IoStar color="#FFD700" /> {pro.averageRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '24px' }}>
                    <div className="badge badge-primary" style={{ marginBottom: '12px' }}>
                      {pro.profession}
                    </div>
                    <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>
                      {pro.companyName || `${pro.prenom} ${pro.nom}`}
                    </h3>
                    <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IoLocation /> {pro.address || t('default_location')}
                    </p>
                    <div style={{ width: '100%', borderTop: '1px solid #f5f5f7', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-secondary" style={{ fontSize: '14px' }}>
                        {pro.totalReviews || 0} {t('verified_reviews')}
                      </span>
                      <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {t('book_verb')} <IoArrowForward />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div >
  );
}

export default MainPage;