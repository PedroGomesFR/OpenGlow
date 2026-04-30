import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useNavigate } from "react-router-dom";
import { IoCalendar, IoSettings, IoSave, IoClipboardOutline, IoAdd, IoClose, IoPerson, IoMail, IoCall, IoTime, IoCut } from 'react-icons/io5';
import '../css/AppleDesign.css'; // Ensure this path is correct based on file structure
import { useToast } from './ToastContext';

dayjs.locale('fr');

function Planning() {
  const navigate = useNavigate();
  const toast = useToast();
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user ? user.id : null;

  const [activeTab, setActiveTab] = useState('agenda');
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
  const [bookings, setBookings] = useState({});
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({
    workingDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
    hours: { start: '09:00', end: '19:00' },
    slotDuration: 60,
    breakStart: '12:00',
    breakEnd: '14:00'
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    date: '',
    time: '',
    notes: ''
  });

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
    fetchServices();
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
            status: booking.status,
            time: booking.time
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

  const fetchServices = async () => {
    try {
      const response = await fetch(`${window.API_URL}/services/my-services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
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
        toast('Paramètres enregistrés avec succès !', 'success');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError('');

    try {
      const response = await fetch(`${window.API_URL}/bookings/professional/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBooking)
      });

      if (response.ok) {
        setShowModal(false);
        setNewBooking({
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          serviceId: '',
          date: '',
          time: '',
          notes: ''
        });
        fetchData();
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Erreur lors de la création du rendez-vous');
      }
    } catch (error) {
      setFormError('Erreur de connexion au serveur');
    } finally {
      setModalLoading(false);
    }
  };

  const openAddBookingModal = (date, time) => {
    setNewBooking({
      ...newBooking,
      date: date,
      time: time
    });
    setShowModal(true);
  };

  const toggleDay = (day) => {
    const days = settings.workingDays.includes(day)
      ? settings.workingDays.filter(d => d !== day)
      : [...settings.workingDays, day];
    setSettings({ ...settings, workingDays: days });
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Improved Header */}
            <div className="calendar-header-new" style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px 24px',
              borderBottom: '1px solid #E5E5E7',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ textTransform: 'capitalize', margin: 0, fontSize: '20px', fontWeight: '700', color: '#1d1d1f' }}>
                  {currentWeek.format('MMMM YYYY')}
                </h2>
                <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: '10px', padding: '4px' }}>
                  <button className="icon-btn" style={{ background: 'transparent', width: '32px', height: '32px', color: '#1d1d1f' }} onClick={() => setCurrentWeek(currentWeek.subtract(1, 'week'))}>‹</button>
                  <button className="btn" style={{ background: 'white', padding: '4px 12px', fontSize: '13px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#1d1d1f', border: 'none' }} onClick={() => setCurrentWeek(dayjs().startOf('week'))}>Aujourd'hui</button>
                  <button className="icon-btn" style={{ background: 'transparent', width: '32px', height: '32px', color: '#1d1d1f' }} onClick={() => setCurrentWeek(currentWeek.add(1, 'week'))}>›</button>
                </div>
              </div>

              <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }} onClick={() => setShowModal(true)}>
                <IoAdd size={18} /> Nouveau RDV
              </button>
            </div>

            <div className="calendar-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '70px repeat(7, 1fr)', 
              gap: '0', 
              background: 'white',
              overflow: 'hidden'
            }}>
              {/* Header Row */}
              <div style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E5E7' }}></div>
              {weekDays.map((day, index) => {
                const dayDate = currentWeek.add(index, 'day');
                const isToday = dayDate.isSame(dayjs(), 'day');
                return (
                  <div key={day} style={{ 
                    background: isToday ? '#F2F9FF' : 'white', 
                    padding: '12px 5px', 
                    textAlign: 'center',
                    borderBottom: '1px solid #E5E5E7',
                    borderLeft: '1px solid #F5F5F7'
                  }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '11px', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      color: isToday ? 'var(--primary)' : '#86868b' 
                    }}>
                      {day}
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      marginTop: '2px',
                      color: isToday ? 'var(--primary)' : '#1d1d1f'
                    }}>
                      {dayDate.format('DD')}
                    </div>
                  </div>
                );
              })}

              {/* Time Slots */}
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div style={{ 
                    background: '#FAFAFA', 
                    padding: '10px', 
                    textAlign: 'right', 
                    fontSize: '11px', 
                    color: '#86868b',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    borderBottom: '1px solid #F5F5F7'
                  }}>
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const date = currentWeek.add(dayIndex, 'day').format('YYYY-MM-DD');
                    const key = `${date}-${time}`;
                    const dayBookings = bookings[key] || [];

                    return (
                      <div 
                        key={key} 
                        onClick={() => openAddBookingModal(date, time)}
                        style={{ 
                          background: 'white', 
                          padding: '6px', 
                          minHeight: '80px', 
                          borderBottom: '1px solid #F5F5F7',
                          borderLeft: '1px solid #F5F5F7',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9F9FB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        {dayBookings.map((booking, idx) => (
                          <div key={idx} style={{
                            background: booking.status === 'confirmed' ? 'var(--primary)' : '#8E8E93',
                            color: 'white',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            marginBottom: '4px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                            borderLeft: '4px solid rgba(255,255,255,0.3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={`${booking.name} - ${booking.service}`}>
                            <div style={{ fontWeight: '700' }}>{booking.name}</div>
                            <div style={{ opacity: 0.9, fontSize: '10px' }}>{booking.service}</div>
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

      {/* Add Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IoAdd /> Nouveau Rendez-vous
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleCreateBooking}>
              {formError && (
                <div style={{ background: '#FFF2F2', color: '#D70000', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                  {formError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label"><IoPerson /> Nom du Client</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ex: Jean Dupont"
                  value={newBooking.clientName}
                  onChange={e => setNewBooking({ ...newBooking, clientName: e.target.value })}
                />
              </div>

              <div className="grid grid-2" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label"><IoMail /> Email (Optionnel)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="jean@example.com"
                    value={newBooking.clientEmail}
                    onChange={e => setNewBooking({ ...newBooking, clientEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><IoCall /> Téléphone (Optionnel)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="06 12 34 56 78"
                    value={newBooking.clientPhone}
                    onChange={e => setNewBooking({ ...newBooking, clientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><IoCut /> Prestation</label>
                <select
                  className="form-input"
                  required
                  value={newBooking.serviceId}
                  onChange={e => setNewBooking({ ...newBooking, serviceId: e.target.value })}
                >
                  <option value="">Sélectionnez un service</option>
                  {services.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.duration} min - {s.price}€)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-2" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label"><IoCalendar /> Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={newBooking.date}
                    onChange={e => setNewBooking({ ...newBooking, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><IoTime /> Heure</label>
                  <input
                    type="time"
                    className="form-input"
                    required
                    value={newBooking.time}
                    onChange={e => setNewBooking({ ...newBooking, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Détails</label>
                <textarea
                  className="form-textarea"
                  placeholder="Notes particulières..."
                  value={newBooking.notes}
                  onChange={e => setNewBooking({ ...newBooking, notes: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', marginTop: '10px' }}
                disabled={modalLoading}
              >
                {modalLoading ? 'Création...' : 'Créer le rendez-vous'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Planning;