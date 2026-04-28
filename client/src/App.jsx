import './App.css'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from 'react';
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

import AdminPage from './components/pages/AdminPage.jsx';
import Footer from './components/common/Footer.jsx';
import MentionsLegales from './components/pages/MentionsLegales.jsx';

function App() {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // Handle RTL for Arabic
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <>
      <Router>
        <Header user={user} />

        <div className="container" style={{ paddingTop: '80px' }}>
          <Routes>

            <Route path="/" element={<MainPage />} />

            <Route path="/home" element={<MainPage />} />

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

            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </div>
        <Footer />
      </Router>
    </>
  )
}

export default App
