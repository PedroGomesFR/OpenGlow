import { useNavigate, Link } from 'react-router-dom';
import { IoPerson, IoLogIn, IoMenu, IoClose, IoShieldCheckmark, IoGlobeOutline, IoCalendar, IoNotifications } from 'react-icons/io5';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';
import '../css/Header.css';

function Header({ user, notificationCount = 0 }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  const navStyle = {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
  };

  return (
    <header className="site-header">
      <div className="container app-header-inner">

        {/* Brand Logo */}
        <div onClick={() => navigate('/')} className="header-brand">
          <img
            src={new URL('../../assets/logo-new.png', import.meta.url).href}
            alt="OpenGlow Logo"
            className="header-brand-logo"
            style={{ width: '38px', height: '38px', objectFit: 'contain' }}
          />
          <span className="header-brand-text" style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.5px', color: 'var(--primary)' }}>OpenGlow</span>
        </div>

        {/* Navigation */}
        <nav className="headerNav">
          <Link to="/" style={navStyle}>{t('home')}</Link>
          {user?.isClient !== false && (
            <>
              <Link to="/recherche" style={navStyle}>{t('find_pro')}</Link>
              <Link to="/map" style={navStyle}>{t('explore_map')}</Link>
            </>
          )}
          {user && (
            <Link to="/bookings" style={{ ...navStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IoCalendar size={14} /> {t('my_bookings') || 'Mes RDV'}
            </Link>
          )}
          {user?.isAdmin && (
            <Link to="/admin" style={{ ...navStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IoShieldCheckmark size={16} /> {t('admin')}
            </Link>
          )}
          {user && (
            <span style={{ ...navStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IoNotifications size={15} /> {notificationCount}
            </span>
          )}
        </nav>

        {/* Actions */}
        <div className="headerActions">
          <div className="header-language" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IoGlobeOutline size={15} color="var(--primary)" />
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '500', color: 'var(--primary)', cursor: 'pointer', outline: 'none' }}
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
              onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
              className="btn btn-primary header-account-btn"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IoPerson size={16} />
              <span className="header-account-text">{t('my_space')}</span>
            </button>
          ) : (
            <button
              onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              className="btn btn-primary header-account-btn"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IoLogIn size={16} />
              <span className="header-account-text">{t('login')}</span>
            </button>
          )}

          <button
            type="button"
            className="headerMobileToggle"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMobileMenuOpen((c) => !c)}
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