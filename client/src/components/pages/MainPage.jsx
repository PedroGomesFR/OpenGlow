import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';
import { IoArrowForward, IoBusiness, IoCalendar, IoLocation, IoSearch, IoSparkles, IoStar } from 'react-icons/io5';

const salonImage = new URL('../assets/hero_beauty_salon.png', import.meta.url).href;


function MainPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [featuredPros, setFeaturedPros] = useState([]);

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
      <div style={{
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

        {/* Abstract Background Shapes */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,113,227,0.05) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />

        {/* Content */}
        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '900px', padding: '0 20px' }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#0071e3', // Apple Blue
            marginBottom: '20px',
            opacity: 0.9
          }}>
            {t('hero_welcome')}
          </h2>

          <h1 style={{
            fontSize: '56px',
            fontWeight: '700',
            letterSpacing: '-1.5px',
            lineHeight: '1.05',
            color: '#1d1d1f',
            marginBottom: '30px',
            background: 'linear-gradient(180deg, #1d1d1f 0%, #434344 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {t('hero_slogan')}
          </h1>

          <p style={{
            fontSize: '21px',
            lineHeight: '1.5',
            color: '#ffffff',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
            fontWeight: '400'
          }}>
            {t('hero_desc')}
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/recherche')}
              style={{ padding: '15px 35px', fontSize: '17px', borderRadius: '30px', display: 'flex', alignItems: 'center' }}
            >
              <IoSearch size={20} style={{ marginRight: '8px' }} />
              {t('find_pro') || "Trouver un professionnel"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/register')}
              style={{
                padding: '15px 35px',
                fontSize: '17px',
                borderRadius: '30px',
                background: '#FFFFFF',
                color: '#1d1d1f',
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center',
                fontWeight: '500'
              }}
            >
              <IoBusiness size={20} style={{ marginRight: '8px' }} />
              {t('i_am_pro')}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Features Grid */}
        <div className="grid grid-3" style={{ marginBottom: '100px', gap: '30px' }}>
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
          <div style={{ marginBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{t('featured_pros_title')}</h2>
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
                      <IoStar color="#FFD700" /> {pro.averageRating ? pro.averageRating.toFixed(1) : '5.0'}
                    </div>
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