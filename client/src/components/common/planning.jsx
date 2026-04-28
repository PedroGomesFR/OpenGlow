import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";
import { IoCalendar, IoSettings, IoSave, IoClipboardOutline } from 'react-icons/io5';
import '../css/AppleDesign.css'; // Ensure this path is correct based on file structure

function Planning() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user ? user.id : null;

  const [activeTab, setActiveTab] = useState('agenda');
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
  const [bookings, setBookings] = useState({});
  const [settings, setSettings] = useState({
    workingDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
    hours: { start: '09:00', end: '19:00' },
    slotDuration: 60,
    breakStart: '12:00',
    breakEnd: '14:00'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !userId) {
      navigate('/login');
      return;
    }
    if (user.isClient) {
      navigate('/profile'); // Clients don't manage planning this way usually
      return;
    }
    fetchData();
    fetchSettings();
  }, [token, userId, currentWeek]);

  const fetchData = async () => {
    try {
      // Fetch bookings instead of generic events for now
      const response = await fetch(`${window.API_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const bookingMap = {};
        data.forEach(booking => {
          // Assuming booking has date (YYYY-MM-DD) and time (HH:MM)
          const key = `${booking.date}-${booking.time}`;
          if (!bookingMap[key]) bookingMap[key] = [];
          bookingMap[key].push({
            id: booking._id,
            name: booking.clientName || 'Réservation',
            service: booking.serviceName,
            status: booking.status
          });
        });
        setBookings(bookingMap);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${window.API_URL}/availability/settings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.workingDays) {
          setSettings(data);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(window.API_URL + '/availability/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        alert('Paramètres enregistrés avec succès !');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const toggleDay = (day) => {
    const days = settings.workingDays.includes(day)
      ? settings.workingDays.filter(d => d !== day)
      : [...settings.workingDays, day];
    setSettings({ ...settings, workingDays: days });
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate time slots based on settings
  const generateTimeSlots = () => {
    const slots = [];
    let startHour = parseInt(settings.hours.start.split(':')[0]);
    let endHour = parseInt(settings.hours.end.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      // Add half hour if needed, or based on slot duration. Simple daily view for now.
      if (settings.slotDuration < 60) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`); // Simplification
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="planning-page" style={{ background: '#F5F5F7', minHeight: '100vh', padding: '20px' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header with Tabs */}
        <div className="header-card card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><IoClipboardOutline color="var(--primary)" /> Mon Planning</h1>
            <p className="text-secondary">Gérez votre emploi du temps et vos disponibilités</p>
          </div>
          <div className="tabs" style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${activeTab === 'agenda' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('agenda')}
            >
              <IoCalendar /> Agenda
            </button>
            <button
              className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('settings')}
            >
              <IoSettings /> Disponibilités
            </button>
          </div>
        </div>

        {/* Agenda Tab */}
        {activeTab === 'agenda' && (
          <div className="card">
            <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button className="btn btn-outline" onClick={() => setCurrentWeek(currentWeek.subtract(1, 'week'))}>‹ Précédent</button>
              <h2 style={{ textTransform: 'capitalize' }}>{currentWeek.format('MMMM YYYY')}</h2>
              <button className="btn btn-outline" onClick={() => setCurrentWeek(currentWeek.add(1, 'week'))}>Suivant ›</button>
            </div>

            <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: '1px', background: '#E5E5E7', border: '1px solid #E5E5E7', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header Row */}
              <div style={{ background: 'white', padding: '10px' }}></div>
              {weekDays.map((day, index) => (
                <div key={day} style={{ background: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                  {day}<br />
                  <span style={{ fontSize: '0.8em', color: '#86868b' }}>
                    {currentWeek.add(index, 'day').format('DD')}
                  </span>
                </div>
              ))}

              {/* Time Slots */}
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div style={{ background: 'white', padding: '10px', textAlign: 'right', fontSize: '12px', color: '#86868b' }}>
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const date = currentWeek.add(dayIndex, 'day').format('YYYY-MM-DD');
                    const key = `${date}-${time}`;
                    const dayBookings = bookings[key] || [];

                    return (
                      <div key={key} style={{ background: 'white', padding: '5px', minHeight: '50px', borderTop: '1px solid #f5f5f7' }}>
                        {dayBookings.map((booking, idx) => (
                          <div key={idx} style={{
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            marginBottom: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            <strong>{booking.time}</strong> {booking.name}
                            <div style={{ opacity: 0.8 }}>{booking.service}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoSettings color="var(--primary)" /> Configuration des Disponibilités</h2>
            <p className="text-secondary" style={{ marginBottom: '30px' }}>Définissez vos jours et horaires de travail habituels.</p>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Jours travaillés</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {days.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`btn ${settings.workingDays.includes(day) ? 'btn-primary' : 'btn-outline'}`}
                      style={{ borderRadius: '20px', padding: '8px 16px' }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div className="form-group">
                  <label className="form-label">Heure de début</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.hours.start}
                    onChange={(e) => setSettings({ ...settings, hours: { ...settings.hours, start: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Heure de fin</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.hours.end}
                    onChange={(e) => setSettings({ ...settings, hours: { ...settings.hours, end: e.target.value } })}
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div className="form-group">
                  <label className="form-label">Début pause</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.breakStart}
                    onChange={(e) => setSettings({ ...settings, breakStart: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fin pause</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.breakEnd}
                    onChange={(e) => setSettings({ ...settings, breakEnd: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label className="form-label">Durée moyenne d'un créneau (min)</label>
                <select
                  className="form-input"
                  value={settings.slotDuration}
                  onChange={(e) => setSettings({ ...settings, slotDuration: parseInt(e.target.value) })}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 heure</option>
                  <option value="90">1 heure 30</option>
                  <option value="120">2 heures</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <IoSave size={20} /> Enregistrer les préférences
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Planning;