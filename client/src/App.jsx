import './App.css'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IoNotificationsOutline, IoCalendarOutline, IoClose } from 'react-icons/io5';

//pages
import MainPage from './components/pages/MainPage.jsx'
import NotFoundPage from './components/pages/NotFoundPage.jsx'
import Header from './components/common/Header.jsx'
import LoginPage from './components/pages/LoginPage.jsx'
import RegisterPage from './components/pages/RegisterPage.jsx'
import ProfilePage from './components/pages/ProfilePage.jsx';
import PlanningPage from './components/pages/PlanningPage.jsx';
import RecherchePage from './components/pages/RecherchePage.jsx';
import ProfessionalDetailPage from './components/pages/ProfessionalDetailPage.jsx';
import ProfessionalGalleryPage from './components/pages/ProfessionalGalleryPage.jsx';
import BookingsPage from './components/pages/BookingsPage.jsx';
import ServiceManagement from './components/pages/ServiceManagement.jsx';
import ReviewsPage from './components/pages/ReviewsPage.jsx';
import MapView from './components/pages/MapView.jsx';
import CGP from './components/pages/cgp.jsx';
import HelpPage from './components/pages/HelpPage.jsx';
import PolitiqueConfidentialite from './components/pages/PolitiqueConfidentialite.jsx';
import AdminPage from './components/pages/AdminPage.jsx';
import SettingsPage from './components/pages/SettingsPage.jsx';
import Footer from './components/common/Footer.jsx';
import MentionsLegales from './components/pages/MentionsLegales.jsx';
import CGU from './components/pages/CGU.jsx';
import QuiSommesNous from './components/pages/QuiSommesNous.jsx';
import BlogListPage from './components/pages/BlogListPage.jsx';
import BlogArticlePage from './components/pages/BlogArticlePage.jsx';
import CookieBanner from './components/common/CookieBanner.jsx';
import FeedbackWidget from './components/common/FeedbackWidget.jsx';
import { ToastProvider } from './components/common/ToastContext.jsx';
import { ConfirmProvider } from './components/common/ConfirmContext.jsx';
import { useToast } from './components/common/ToastContext.jsx';
import UserNotifications from './components/common/UserNotifications.jsx';
import { SETTINGS_EVENT, applyTheme, getStoredSettings } from './utils/preferences';

function BookingAlertCard({ alert, onDismiss, onView }) {
  const [progress, setProgress] = useState(100);
  const DURATION = 7000;

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / DURATION) * 100));
    }, 50);
    const auto = setTimeout(onDismiss, DURATION);
    return () => { clearInterval(tick); clearTimeout(auto); };
  }, [onDismiss]);

  const serviceLabel = Array.isArray(alert.services) && alert.services.length > 0
    ? alert.services.map((s) => s.name).join(', ')
    : (alert.serviceName || '');

  const dateLabel = alert.date
    ? new Date(alert.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  return (
    <div style={{
      pointerEvents: 'all',
      background: 'var(--bg-primary, #fff)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
      width: '320px',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.07)',
      animation: 'bookingAlertIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 14px 10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #16693f, #1e9455)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IoCalendarOutline size={18} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '13px', color: '#16693f' }}>Nouveau rendez-vous</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #666)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {alert.clientName}
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', color: 'var(--text-secondary, #888)', flexShrink: 0 }}
        >
          <IoClose size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {serviceLabel && (
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary, #111)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {serviceLabel}
          </div>
        )}
        {(dateLabel || alert.hour) && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
            {dateLabel}{dateLabel && alert.hour ? ' · ' : ''}{alert.hour}
          </div>
        )}
        <button
          onClick={onView}
          style={{
            marginTop: '8px', width: '100%', padding: '8px',
            background: '#16693f', color: 'white', border: 'none',
            borderRadius: '10px', fontWeight: '600', fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Voir la demande
        </button>
      </div>

      {/* Countdown bar */}
      <div style={{ height: '3px', background: 'var(--gray-200, #eee)' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #16693f, #1e9455)',
          transition: 'width 0.05s linear',
        }} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppShell />
      </ConfirmProvider>
    </ToastProvider>
  )
}

function AppShell() {
  const { i18n } = useTranslation();
  const toast = useToast();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [bookingAlerts, setBookingAlerts] = useState([]);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const knownBookingIdsRef = useRef(null);
  const currentUserId = user?.id || user?._id || null;
  const isPro = user?.isClient === false;

  // Handle RTL for Arabic
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    const syncTheme = (event) => {
      const nextTheme = event?.detail?.theme || getStoredSettings().theme;
      applyTheme(nextTheme);
    };

    syncTheme();
    window.addEventListener(SETTINGS_EVENT, syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const playBookingSound = useCallback(() => {
    const settings = getStoredSettings();
    if (!settings.bookingSound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playNote = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playNote(880, ctx.currentTime, 0.35);
      playNote(1100, ctx.currentTime + 0.2, 0.45);
    } catch {}
  }, []);

  const dismissBookingAlert = useCallback((alertId) => {
    setBookingAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  useEffect(() => {
    if (!isPro || !currentUserId) {
      knownBookingIdsRef.current = null;
      setNewBookingCount(0);
      return;
    }

    const checkNewBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(window.API_URL + '/bookings/my-bookings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const bookings = await res.json();
        const pending = bookings.filter((b) => b.status === 'pending');
        const currentIds = new Set(pending.map((b) => b._id));

        if (knownBookingIdsRef.current === null) {
          knownBookingIdsRef.current = currentIds;
          setNewBookingCount(pending.length);
          return;
        }

        const newOnes = pending.filter((b) => !knownBookingIdsRef.current.has(b._id));
        knownBookingIdsRef.current = currentIds;
        setNewBookingCount(pending.length);

        if (newOnes.length > 0) {
          playBookingSound();
          setBookingAlerts((prev) => [
            ...newOnes.map((b) => ({
              id: b._id,
              clientName: b.clientName || 'Client',
              services: b.services,
              serviceName: b.serviceName,
              date: b.date,
              hour: b.hour,
            })),
            ...prev,
          ].slice(0, 4));
        }
      } catch {}
    };

    checkNewBookings();
    const interval = setInterval(checkNewBookings, 30000);
    return () => clearInterval(interval);
  }, [currentUserId, isPro, playBookingSound]);

  const refreshUserContext = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !currentUserId) {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch(window.API_URL + '/records/me/context', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        if (data?.suspended || response.status === 401 || response.status === 403) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          setNotifications([]);
          toast(data?.error || 'Session expirée.', 'error');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return;
        }

        throw new Error(data?.error || 'Impossible de récupérer votre contexte utilisateur.');
      }

      const normalizedUser = {
        ...data.user,
        id: data.user?.id || data.user?._id,
      };

      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error while refreshing user context:', error);
    }
  }, [currentUserId, toast]);

  useEffect(() => {
    refreshUserContext();
  }, [refreshUserContext, currentUserId]);

  const handleNotificationRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${window.API_URL}/records/me/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((current) => current.map((notification) => (
        notification._id === notificationId
          ? { ...notification, readByUserIds: Array.from(new Set([...(notification.readByUserIds || []), currentUserId])) }
          : notification
      )));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationDismiss = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${window.API_URL}/records/me/notifications/${notificationId}/dismiss`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((current) => current.filter((notification) => notification._id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <>
      <Router>
        <ScrollToTop />
        <Header
          user={user}
          notificationCount={notifications.filter((n) => !(n.readByUserIds || []).includes(currentUserId)).length}
          newBookingCount={newBookingCount}
        />
        {user && (
          <UserNotifications
            notifications={notifications}
            userId={currentUserId}
            onRead={handleNotificationRead}
            onDismiss={handleNotificationDismiss}
          />
        )}

        {/* Booking alert popups */}
        <div style={{
          position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none',
        }}>
          {bookingAlerts.map((alert) => (
            <BookingAlertCard
              key={alert.id}
              alert={alert}
              onDismiss={() => dismissBookingAlert(alert.id)}
              onView={() => { dismissBookingAlert(alert.id); window.location.href = '/bookings'; }}
            />
          ))}
        </div>

        <main className="app-content container">
          <Routes>

            <Route path="/" element={user && user.isClient === false ? <Navigate to="/profile" /> : <MainPage />} />

            <Route path="/home" element={<Navigate to="/" replace />} />

            <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />

            <Route path="/register" element={<RegisterPage user={user} setUser={setUser} />} />

            <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />

            <Route path="/planning" element={<PlanningPage />} />

            <Route path="/recherche" element={<RecherchePage />} />

            <Route path="/pro/:slug/galerie" element={<ProfessionalGalleryPage />} />
            <Route path="/professional/:id/galerie" element={<ProfessionalGalleryPage />} />
            <Route path="/pro/:slug" element={<ProfessionalDetailPage />} />
            <Route path="/professional/:id" element={<ProfessionalDetailPage />} />

            <Route path="/bookings" element={<BookingsPage />} />

            <Route path="/services" element={<ServiceManagement user={user} />} />
            <Route path="/reviews/:professionalId" element={<ReviewsPage user={user} />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage user={user} />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/qui-sommes-nous" element={<QuiSommesNous />} />
            <Route path="/cgp" element={<CGP />} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />

            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogArticlePage />} />

            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </main>
        <Footer />
        <CookieBanner />
        {user && <FeedbackWidget user={user} />}
      </Router>
    </>
  )
}

export default App
