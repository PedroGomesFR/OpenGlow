import { useNavigate, Link, useLocation } from 'react-router-dom';
import { IoPerson, IoLogIn, IoMenu, IoClose, IoShieldCheckmark, IoGlobeOutline, IoCalendar, IoNotifications } from 'react-icons/io5';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';
import '../css/Header.css';

function Header({ user, notificationCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Transparent header only on home page
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isTransparent = isHomePage && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header className={!isTransparent ? 'header-scrolled' : ''} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease',
      background: isTransparent ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: isTransparent ? 'none' : 'blur(20px)',
      borderBottom: isTransparent ? 'none' : '1px solid rgba(0,0,0,0.1)',
      padding: '12px 0'
    }}>
      <div className="container app-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <img
            src={new URL('../../assets/logo-new.png', import.meta.url).href}
            alt="OpenGlow Logo"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.5px', color: 'var(--primary)' }}>OpenGlow</span>
        </div>

        {/* Navigation */}
        <nav className="headerNav" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>{t('home')}</Link>
          {user?.isClient !== false && (
            <>
              <Link to="/recherche" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>{t('find_pro')}</Link>
              <Link to="/map" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>{t('explore_map')}</Link>
            </>
          )}
          {user && (
            <Link to="/bookings" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IoCalendar size={14} /> {t('my_bookings') || 'Mes RDV'}
            </Link>
          )}
          {user?.isAdmin && (
            <Link to="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IoShieldCheckmark size={16} /> {t('admin')}
            </Link>
          )}
          {user && (
            <span style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.85 }}>
              <IoNotifications size={15} /> {notificationCount}
            </span>
          )}
        </nav>

        {/* Actions */}
        <div className="headerActions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

          {/* Language Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IoGlobeOutline size={16} color="#86868b" />
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--primary)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="de">DE</option>
              <option value="it">IT</option>
              <option value="pt">PT</option>
              <option value="ar">AR</option>
            </select>
          </div>

          {user ? (
            <button
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IoPerson size={16} />
              {t('my_space')}
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/login');
                setMobileMenuOpen(false);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IoLogIn size={16} />
              {t('login')}
            </button>
          )}

          <button
            type="button"
            className="headerMobileToggle"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <IoClose size={22} /> : <IoMenu size={22} />}
          </button>
        </div>

      </div>

      {mobileMenuOpen && (
        <div className="headerMobileMenu container">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>{t('home')}</Link>
          {user?.isClient !== false && (
            <>
              <Link to="/recherche" onClick={() => setMobileMenuOpen(false)}>{t('find_pro')}</Link>
              <Link to="/map" onClick={() => setMobileMenuOpen(false)}>{t('explore_map')}</Link>
            </>
          )}
          {user && <Link to="/bookings" onClick={() => setMobileMenuOpen(false)}>{t('my_bookings') || 'Mes RDV'}</Link>}
          {user?.isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>{t('admin')}</Link>}
        </div>
      )}
    </header>
  );
}

export default Header;