import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoCard,
    IoCalendar,
    IoStar,
    IoArrowForward,
    IoHelpCircle,
    IoCalendarNumber,
    IoAddCircle,
    IoStatsChart
} from 'react-icons/io5';
import '../css/AppleDesign.css';
import { useTranslation } from 'react-i18next';

function DashboardOverview({ user, setActiveTab }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
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

    const trendLabel = stats?.trendVsPrev7DaysPct > 0
        ? `+${stats.trendVsPrev7DaysPct}% vs 7j précédents`
        : `${stats?.trendVsPrev7DaysPct || 0}% vs 7j précédents`;

    const trendColor = stats?.trendVsPrev7DaysPct >= 0 ? '#16693f' : '#ba4f3b';

    const maxDailyTraffic = Math.max(
        1,
        ...(stats?.dailyBookingsLast7Days || []).map((entry) => entry.count)
    );

    return (
        <div className="dashboard-overview">
            <h1 style={{ marginBottom: '10px' }}>{t('pro_greeting', { name: user.prenom })}</h1>
            <p className="text-secondary" style={{ marginBottom: '30px' }}>{t('pro_overview_subtitle')}</p>

            {stats && (
                <div className="grid grid-3">
                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoCard /> {t('pro_revenue')}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0', color: 'var(--primary)' }}>
                            {stats.totalRevenue ? `${stats.totalRevenue}€` : '0€'}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '13px' }}>{t('pro_total_earned')}</div>
                    </div>

                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoCalendar /> {t('pro_bookings')}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>
                            {stats.confirmed + stats.pending}
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{stats.pending} {t('filter_pending').toLowerCase()}</span> • <span style={{ color: 'var(--primary)' }}>{stats.confirmed} {t('filter_confirmed').toLowerCase()}</span>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: trendColor, fontWeight: 600 }}>
                            {trendLabel}
                        </div>
                    </div>

                    <div className="card">
                        <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoStar /> {t('pro_reviews_clients')}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', margin: '10px 0' }}>
                            {user.averageRating ? user.averageRating.toFixed(1) : '-'} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>/ 5</span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '13px' }}>{t('pro_based_on_reviews')}</div>
                    </div>
                </div>
            )}

            {stats && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoStatsChart /> {t('pro_traffic_title', { defaultValue: 'Trafic & performance' })}
                        </h3>
                        <span className="text-secondary" style={{ fontSize: '13px' }}>
                            {t('pro_last_7_days', { defaultValue: '7 derniers jours' })}
                        </span>
                    </div>

                    <div className="grid grid-3" style={{ marginBottom: '18px' }}>
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(26, 92, 107, 0.06)' }}>
                            <div className="text-secondary" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {t('pro_demand_7d', { defaultValue: 'Demandes (7j)' })}
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{stats.bookingsLast7Days || 0}</div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(22, 105, 63, 0.08)' }}>
                            <div className="text-secondary" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {t('pro_conversion_30d', { defaultValue: 'Conversion (30j)' })}
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{stats.conversionRateLast30Days || 0}%</div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(244, 128, 104, 0.08)' }}>
                            <div className="text-secondary" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {t('pro_cancellation_30d', { defaultValue: 'Annulation (30j)' })}
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{stats.cancellationRateLast30Days || 0}%</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px' }}>
                        {(stats.dailyBookingsLast7Days || []).map((day) => (
                            <div key={day.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '100%', maxWidth: '34px', height: '70px', display: 'flex', alignItems: 'flex-end' }}>
                                    <div
                                        title={`${day.count} réservation(s)`}
                                        style={{
                                            width: '100%',
                                            borderRadius: '8px 8px 4px 4px',
                                            background: 'linear-gradient(180deg, #1a5c6b 0%, #14495c 100%)',
                                            minHeight: day.count > 0 ? '10px' : '4px',
                                            height: `${Math.max(8, Math.round((day.count / maxDailyTraffic) * 70))}px`,
                                            transition: 'height 220ms ease',
                                        }}
                                    />
                                </div>
                                <strong style={{ fontSize: '12px' }}>{day.count}</strong>
                                <span className="text-secondary" style={{ fontSize: '11px' }}>{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="dashboard-bottom-grid" style={{ marginTop: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div className="card" style={{ flex: '2 1 400px' }}>
                    <h3>{t('pro_quick_actions')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        <button className="btn btn-secondary" onClick={() => setActiveTab && setActiveTab('bookings')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <IoCalendar /> {t('my_bookings')}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setActiveTab && setActiveTab('planning')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <IoCalendarNumber /> {t('pro_manage_planning')}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setActiveTab && setActiveTab('services')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <IoAddCircle /> {t('pro_my_services')}
                        </button>
                    </div>
                </div>

                <div className="card" style={{ background: 'var(--primary)', color: 'white', flex: '1 1 250px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                        <IoHelpCircle size={24} /> {t('pro_need_help')}
                    </h3>
                    <p style={{ opacity: 0.9, fontSize: '14px', margin: '15px 0', color: 'white' }}>{t('pro_help_text')}</p>
                    <button onClick={() => navigate('/help')} className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {t('pro_view_guide')} <IoArrowForward />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DashboardOverview;
