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
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
import BookingsPage from './components/pages/BookingsPage.jsx';
import ServiceManagement from './components/pages/ServiceManagement.jsx';
import ReviewsPage from './components/pages/ReviewsPage.jsx';
import MapView from './components/pages/MapView.jsx';
import CGP from './components/pages/cgp.jsx';
import HelpPage from './components/pages/HelpPage.jsx';
import PolitiqueConfidentialite from './components/pages/PolitiqueConfidentialite.jsx';
import AdminPage from './components/pages/AdminPage.jsx';
import Footer from './components/common/Footer.jsx';
import MentionsLegales from './components/pages/MentionsLegales.jsx';
import CookieBanner from './components/common/CookieBanner.jsx';
import { ToastProvider } from './components/common/ToastContext.jsx';
import { ConfirmProvider } from './components/common/ConfirmContext.jsx';
import { useToast } from './components/common/ToastContext.jsx';
import UserNotifications from './components/common/UserNotifications.jsx';

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
  const currentUserId = user?.id || user?._id || null;

  // Handle RTL for Arabic
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

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
        <Header user={user} notificationCount={notifications.filter((notification) => !(notification.readByUserIds || []).includes(currentUserId)).length} />
        {user && (
          <UserNotifications
            notifications={notifications}
            userId={currentUserId}
            onRead={handleNotificationRead}
            onDismiss={handleNotificationDismiss}
          />
        )}

        <main className="app-content container">
          <Routes>

            <Route path="/" element={user && user.isClient === false ? <Navigate to="/profile" /> : <MainPage />} />

            <Route path="/home" element={user && user.isClient === false ? <Navigate to="/profile" /> : <MainPage />} />

            <Route path="/login" element={<LoginPage user={user} setUser={setUser} />} />

            <Route path="/register" element={<RegisterPage user={user} setUser={setUser} />} />

            <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />

            <Route path="/planning" element={<PlanningPage />} />

            <Route path="/recherche" element={<RecherchePage />} />

            <Route path="/professional/:id" element={<ProfessionalDetailPage />} />

            <Route path="/bookings" element={<BookingsPage />} />

            <Route path="/services" element={<ServiceManagement user={user} />} />
            <Route path="/reviews/:professionalId" element={<ReviewsPage user={user} />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgp" element={<CGP />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />

            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </main>
        <Footer />
        <CookieBanner />
      </Router>
    </>
  )
}

export default App
