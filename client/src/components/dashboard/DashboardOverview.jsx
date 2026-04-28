import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoCard,
    IoCalendar,
    IoStar,
    IoArrowForward,
    IoHelpCircle,
    IoCalendarNumber,
    IoAddCircle
} from 'react-icons/io5';
import '../css/AppleDesign.css';

function DashboardOverview({ user, setActiveTab }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(window.API_URL + '/bookings/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="loading-spinner"></div>;

    return (
        <div className="dashboard-overview">
            <h1 style={{ marginBottom: '10px' }}>Bonjour, {user.prenom}</h1>
            <p className="text-secondary" style={{ marginBottom: '30px' }}>Voici un aperçu de votre activité.</p>

            {stats && (
                <div className="grid grid-3">
                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoCard /> Chiffre d'Affaires
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0', color: 'var(--primary)' }}>
                            {stats.totalRevenue ? `${stats.totalRevenue}€` : '0€'}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '13px' }}>Total gagné (terminés)</div>
                    </div>

                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoCalendar /> Réservations
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>
                            {stats.confirmed + stats.pending}
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{stats.pending} en attente</span> • <span style={{ color: 'var(--primary)' }}>{stats.confirmed} confirmées</span>
                        </div>
                    </div>

                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoStar /> Avis Clients
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>
                            {user.averageRating ? user.averageRating.toFixed(1) : '-'} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>/ 5</span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '13px' }}>Basé sur vos avis</div>
                    </div>
                </div>
            )}

            <div className="dashboard-bottom-grid" style={{ marginTop: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div className="card" style={{ flex: '2 1 400px' }}>
                    <h3>Actions Rapides</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        <button className="btn btn-secondary" onClick={() => setActiveTab && setActiveTab('bookings')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <IoCalendar /> Mes réservations
                        </button>
                        <button className="btn btn-secondary" onClick={() => setActiveTab && setActiveTab('planning')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <IoCalendarNumber /> Gérer mon planning
                        </button>
                        <button className="btn btn-secondary" onClick={() => setActiveTab && setActiveTab('services')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <IoAddCircle /> Mes prestations
                        </button>
                    </div>
                </div>

                <div className="card" style={{ background: 'var(--primary)', color: 'white', flex: '1 1 250px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                        <IoHelpCircle size={24} /> Besoin d'aide ?
                    </h3>
                    <p style={{ opacity: 0.9, fontSize: '14px', margin: '15px 0', color: 'white' }}>Consultez notre guide dédié pour améliorer l'attractivité de votre page et mieux gérer.</p>
                    <button onClick={() => navigate('/help')} className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        Voir le guide <IoArrowForward />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DashboardOverview;
