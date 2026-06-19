import express from 'express';
import connectDB from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';
import { sendEmail } from '../utils/sendEmail.js';

const bookingRouter = express.Router();

const normalizeServiceIdsInput = (serviceId, serviceIds) => {
  const fromArray = Array.isArray(serviceIds) ? serviceIds : [];
  const merged = [...fromArray, serviceId].filter(Boolean).map((id) => String(id));
  return [...new Set(merged)];
};

const buildBookingServices = (services) =>
  services.map((service) => ({
    id: String(service._id),
    name: service.name,
    price: Number(service.price) || 0,
    duration: Number(service.duration) || 0,
    category: service.category || '',
  }));

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Récupère les promotions actives d'un professionnel (annonces de type 'promotion')
const fetchActivePromos = async (db, professionalId) => {
  const now = new Date();
  return db.collection('announcements').find({
    professionalId: new ObjectId(professionalId),
    type: 'promotion',
    isActive: true,
    discountPercent: { $gt: 0 },
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  }).toArray();
};

// Sélectionne la meilleure promo applicable à une prestation
// (promo ciblée sur ce service, sinon promo globale serviceId=null)
const bestPromoForService = (promos, serviceId) => {
  const applicable = promos.filter((p) => !p.serviceId || String(p.serviceId) === String(serviceId));
  if (applicable.length === 0) return null;
  return applicable.reduce((best, p) => (p.discountPercent > (best?.discountPercent || 0) ? p : best), null);
};

// Applique la remise à chaque prestation et conserve le prix d'origine
const applyPromosToBookingServices = (bookingServices, promos) =>
  bookingServices.map((service) => {
    const originalPrice = Number(service.price) || 0;
    const promo = bestPromoForService(promos, service.id);
    if (!promo) return { ...service, originalPrice };
    const discountPercent = Number(promo.discountPercent) || 0;
    return {
      ...service,
      originalPrice,
      price: round2(originalPrice * (1 - discountPercent / 100)),
      discountPercent,
      promoId: String(promo._id),
      promoTitle: promo.title || null,
    };
  });

const summarizeBookingServices = (bookingServices) => {
  const totalPrice = round2(bookingServices.reduce((sum, item) => sum + (Number(item.price) || 0), 0));
  const totalOriginal = round2(bookingServices.reduce((sum, item) => sum + (Number(item.originalPrice ?? item.price) || 0), 0));
  const totalDuration = bookingServices.reduce((sum, item) => sum + (Number(item.duration) || 0), 0);
  return {
    serviceId: bookingServices[0]?.id || null,
    serviceName: bookingServices.map((item) => item.name).join(' + '),
    servicePrice: totalPrice,
    originalServicePrice: totalOriginal,
    totalDiscount: round2(totalOriginal - totalPrice),
    serviceDuration: totalDuration,
  };
};

// Require authentication for booking routes
bookingRouter.use(verifyToken);

// Get all bookings for a user (client or professional)
bookingRouter.get('/my-bookings', async (req, res) => {
  try {
    const userId = req.userId;
    const db = await connectDB();
    
    // Get user to check if client or professional
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    let bookings;
    if (user.isClient) {
      // Get bookings made by the client
      bookings = await db.collection('bookings').find({ clientId: userId }).toArray();
    } else {
      // Get bookings for the professional
      bookings = await db.collection('bookings').find({ professionalId: userId }).toArray();
    }

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new booking
bookingRouter.post('/create', async (req, res) => {
  try {
    const clientId = req.userId;
    const { professionalId, serviceId, serviceIds, date, time, notes } = req.body;
    const selectedServiceIds = normalizeServiceIdsInput(serviceId, serviceIds);

    if (!professionalId || selectedServiceIds.length === 0 || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await connectDB();

    const serviceObjectIds = selectedServiceIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    if (serviceObjectIds.length !== selectedServiceIds.length) {
      return res.status(400).json({ error: 'Invalid service IDs' });
    }

    const services = await db.collection('services').find({ _id: { $in: serviceObjectIds }, professionalId }).toArray();
    if (services.length !== selectedServiceIds.length) {
      return res.status(404).json({ error: 'One or more services not found' });
    }

    const servicesById = new Map(services.map((service) => [String(service._id), service]));
    const orderedServices = selectedServiceIds.map((id) => servicesById.get(id)).filter(Boolean);
    const bookingServices = buildBookingServices(orderedServices);
    const promos = await fetchActivePromos(db, professionalId);
    const pricedServices = applyPromosToBookingServices(bookingServices, promos);
    const serviceSummary = summarizeBookingServices(pricedServices);

    // Get professional details
    const professional = await db.collection('users').findOne({ _id: new ObjectId(professionalId) });
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Get client details
    const client = await db.collection('users').findOne({ _id: new ObjectId(clientId) });

    const newBooking = {
      clientId,
      clientName: `${client.prenom} ${client.nom}`,
      clientEmail: client.email,
      clientPhone: client.phone || null,
      professionalId,
      professionalName: professional.companyName || `${professional.prenom} ${professional.nom}`,
      services: pricedServices,
      serviceId: serviceSummary.serviceId,
      serviceName: serviceSummary.serviceName,
      servicePrice: serviceSummary.servicePrice,
      originalServicePrice: serviceSummary.originalServicePrice,
      totalDiscount: serviceSummary.totalDiscount,
      serviceDuration: serviceSummary.serviceDuration,
      date,
      time,
      notes: notes || '',
      status: 'pending', // pending, confirmed, cancelled, completed
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(newBooking);
    
    // Send email to client
    sendEmail({
      email: client.email,
      subject: 'Confirmation de demande de rendez-vous - OpenGlow',
      html: `
        <h1>Bonjour ${client.prenom},</h1>
        <p>Votre demande de rendez-vous avec <strong>${newBooking.professionalName}</strong> a bien été enregistrée.</p>
        <p><strong>Prestations :</strong> ${bookingServices.map((item) => item.name).join(', ')}</p>
        <p><strong>Date :</strong> ${new Date(date).toLocaleDateString()}</p>
        <p><strong>Heure :</strong> ${time}</p>
        <br>
        <p>Le professionnel doit maintenant valider votre demande. Vous recevrez un email dès que celle-ci sera confirmée.</p>
        <p>L'équipe OpenGlow</p>
      `
    });

    // Send email to professional
    sendEmail({
      email: professional.email,
      subject: 'Nouvelle demande de rendez-vous - OpenGlow',
      html: `
        <h1>Bonjour ${professional.prenom || professional.companyName},</h1>
        <p>Vous avez reçu une nouvelle demande de rendez-vous de la part de <strong>${newBooking.clientName}</strong>.</p>
        <p><strong>Prestations :</strong> ${bookingServices.map((item) => item.name).join(', ')}</p>
        <p><strong>Date :</strong> ${new Date(date).toLocaleDateString()}</p>
        <p><strong>Heure :</strong> ${time}</p>
        <br>
        <p>Vous pouvez valider ou refuser ce rendez-vous depuis votre tableau de bord.</p>
        <p>L'équipe OpenGlow</p>
      `
    });
    
    res.status(201).json({ 
      message: 'Booking created successfully',
      booking: { id: result.insertedId, ...newBooking } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a booking as a professional (for walk-ins)
bookingRouter.post('/professional/create', async (req, res) => {
  try {
    const professionalId = req.userId;
    const { clientName, clientEmail, clientPhone, serviceId, serviceIds, date, time, notes } = req.body;
    const selectedServiceIds = normalizeServiceIdsInput(serviceId, serviceIds);

    if (!clientName || selectedServiceIds.length === 0 || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields (Name, service, date, time)' });
    }

    const db = await connectDB();
    
    // Verify professional
    const professional = await db.collection('users').findOne({ _id: new ObjectId(professionalId) });
    if (!professional || professional.isClient) {
      return res.status(403).json({ error: 'Only professionals can use this endpoint' });
    }

    const serviceObjectIds = selectedServiceIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    if (serviceObjectIds.length !== selectedServiceIds.length) {
      return res.status(400).json({ error: 'Invalid service IDs' });
    }

    const services = await db.collection('services').find({ _id: { $in: serviceObjectIds }, professionalId }).toArray();
    if (services.length !== selectedServiceIds.length) {
      return res.status(404).json({ error: 'One or more services not found' });
    }

    const servicesById = new Map(services.map((service) => [String(service._id), service]));
    const orderedServices = selectedServiceIds.map((id) => servicesById.get(id)).filter(Boolean);
    const bookingServices = buildBookingServices(orderedServices);
    const promos = await fetchActivePromos(db, professionalId);
    const pricedServices = applyPromosToBookingServices(bookingServices, promos);
    const serviceSummary = summarizeBookingServices(pricedServices);

    const newBooking = {
      clientId: null, // No client ID for walk-ins
      clientName,
      clientEmail: clientEmail || '',
      clientPhone: clientPhone || '',
      professionalId,
      professionalName: professional.companyName || `${professional.prenom} ${professional.nom}`,
      services: pricedServices,
      serviceId: serviceSummary.serviceId,
      serviceName: serviceSummary.serviceName,
      servicePrice: serviceSummary.servicePrice,
      originalServicePrice: serviceSummary.originalServicePrice,
      totalDiscount: serviceSummary.totalDiscount,
      serviceDuration: serviceSummary.serviceDuration,
      date,
      time,
      notes: notes || '',
      status: 'confirmed', // Automatically confirmed
      isWalkIn: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(newBooking);
    
    // Send email to client if email is provided
    if (clientEmail) {
      sendEmail({
        email: clientEmail,
        subject: 'Nouveau rendez-vous - OpenGlow',
        html: `
          <h1>Bonjour ${clientName},</h1>
          <p>Un rendez-vous a été ajouté pour vous chez <strong>${newBooking.professionalName}</strong>.</p>
          <p><strong>Prestations :</strong> ${bookingServices.map((item) => item.name).join(', ')}</p>
          <p><strong>Date :</strong> ${new Date(date).toLocaleDateString()}</p>
          <p><strong>Heure :</strong> ${time}</p>
          <br>
          <p>À bientôt,</p>
          <p>L'équipe OpenGlow</p>
        `
      });
    }
    
    res.status(201).json({ 
      message: 'Booking created successfully',
      booking: { id: result.insertedId, ...newBooking } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

bookingRouter.put('/:id/add-services', async (req, res) => {
  try {
    const professionalId = req.userId;
    const { id } = req.params;
    const { serviceIds } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'serviceIds is required' });
    }

    const uniqueServiceIds = [...new Set(serviceIds.filter(Boolean).map((serviceId) => String(serviceId)))];
    const serviceObjectIds = uniqueServiceIds
      .filter((serviceId) => ObjectId.isValid(serviceId))
      .map((serviceId) => new ObjectId(serviceId));

    if (serviceObjectIds.length !== uniqueServiceIds.length) {
      return res.status(400).json({ error: 'Invalid service IDs' });
    }

    const db = await connectDB();
    const booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.professionalId !== professionalId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot add services to completed or cancelled bookings' });
    }

    const services = await db.collection('services').find({ _id: { $in: serviceObjectIds }, professionalId }).toArray();
    if (services.length !== uniqueServiceIds.length) {
      return res.status(404).json({ error: 'One or more services not found' });
    }

    const existingServices = Array.isArray(booking.services) && booking.services.length > 0
      ? booking.services.map((item) => ({
          id: String(item.id || item._id || item.serviceId),
          name: item.name || booking.serviceName || '',
          price: Number(item.price) || 0,
          duration: Number(item.duration) || 0,
          category: item.category || '',
          originalPrice: Number(item.originalPrice ?? item.price) || 0,
          ...(item.discountPercent ? { discountPercent: item.discountPercent } : {}),
          ...(item.promoId ? { promoId: item.promoId } : {}),
          ...(item.promoTitle ? { promoTitle: item.promoTitle } : {}),
        }))
      : [{
          id: String(booking.serviceId),
          name: booking.serviceName || '',
          price: Number(booking.servicePrice) || 0,
          duration: Number(booking.serviceDuration) || 0,
          category: '',
          originalPrice: Number(booking.originalServicePrice ?? booking.servicePrice) || 0,
        }].filter((item) => item.id && ObjectId.isValid(item.id));

    const existingIds = new Set(existingServices.map((service) => String(service.id)));
    const promos = await fetchActivePromos(db, professionalId);
    const newServices = applyPromosToBookingServices(
      buildBookingServices(services).filter((service) => !existingIds.has(String(service.id))),
      promos
    );

    if (newServices.length === 0) {
      return res.status(400).json({ error: 'Selected services are already attached to this booking' });
    }

    const updatedServices = [...existingServices, ...newServices];
    const serviceSummary = summarizeBookingServices(updatedServices);

    await db.collection('bookings').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          services: updatedServices,
          serviceId: serviceSummary.serviceId,
          serviceName: serviceSummary.serviceName,
          servicePrice: serviceSummary.servicePrice,
          originalServicePrice: serviceSummary.originalServicePrice,
          totalDiscount: serviceSummary.totalDiscount,
          serviceDuration: serviceSummary.serviceDuration,
          updatedAt: new Date(),
        },
      }
    );

    if (booking.clientEmail) {
      sendEmail({
        email: booking.clientEmail,
        subject: 'Mise à jour de votre réservation - OpenGlow',
        html: `
          <h1>Bonjour ${booking.clientName?.split(' ')[0] || ''},</h1>
          <p>Votre réservation avec <strong>${booking.professionalName}</strong> a été mise à jour.</p>
          <p><strong>Prestations :</strong> ${updatedServices.map((item) => item.name).join(', ')}</p>
          <p><strong>Date :</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Heure :</strong> ${booking.time}</p>
          <br>
          <p>L'équipe OpenGlow</p>
        `,
      });
    }

    res.status(200).json({ message: 'Services added to booking', services: updatedServices, ...serviceSummary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status
bookingRouter.put('/update-status/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = await connectDB();
    
    // Verify that user is either the client or the professional
    const booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.clientId !== userId && booking.professionalId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        } 
      }
    );

    // Send notification to client if status changed
    if (status === 'confirmed' && booking.clientEmail) {
      sendEmail({
        email: booking.clientEmail,
        subject: 'Rendez-vous confirmé ! - OpenGlow',
        html: `
          <h1>Bonne nouvelle ${booking.clientName.split(' ')[0]} !</h1>
          <p>Votre rendez-vous avec <strong>${booking.professionalName}</strong> a été <strong>confirmé</strong>.</p>
          <p><strong>Prestation :</strong> ${booking.serviceName}</p>
          <p><strong>Date :</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Heure :</strong> ${booking.time}</p>
          <br>
          <p>À très bientôt,</p>
          <p>L'équipe OpenGlow</p>
        `
      });
    } else if (status === 'cancelled' && booking.clientEmail) {
      sendEmail({
        email: booking.clientEmail,
        subject: 'Rendez-vous annulé - OpenGlow',
        html: `
          <h1>Bonjour,</h1>
          <p>Nous vous informons que votre rendez-vous avec <strong>${booking.professionalName}</strong> prévu le ${new Date(booking.date).toLocaleDateString()} a été annulé.</p>
          <br>
          <p>L'équipe OpenGlow</p>
        `
      });
    }

    res.status(200).json({ message: 'Booking status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete booking
bookingRouter.delete('/delete/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const db = await connectDB();
    
    // Verify ownership
    const booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.clientId !== userId && booking.professionalId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.collection('bookings').deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking statistics for professionals
bookingRouter.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    const db = await connectDB();
    
    // Verify user is professional
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user.isClient) {
      return res.status(403).json({ error: 'Only professionals can access stats' });
    }

    const bookings = await db.collection('bookings').find({ professionalId: userId }).toArray();

    const today = new Date();
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfLast7Days = new Date(startOfToday);
    startOfLast7Days.setDate(startOfLast7Days.getDate() - 6);

    const startOfPrev7Days = new Date(startOfLast7Days);
    startOfPrev7Days.setDate(startOfPrev7Days.getDate() - 7);

    const startOfLast30Days = new Date(startOfToday);
    startOfLast30Days.setDate(startOfLast30Days.getDate() - 29);

    const bookingsLast7Days = bookings.filter((b) => b.createdAt && new Date(b.createdAt) >= startOfLast7Days).length;
    const bookingsPrev7Days = bookings.filter((b) => b.createdAt && new Date(b.createdAt) >= startOfPrev7Days && new Date(b.createdAt) < startOfLast7Days).length;

    const bookingsLast30Days = bookings.filter((b) => b.createdAt && new Date(b.createdAt) >= startOfLast30Days);
    const completedLast30Days = bookingsLast30Days.filter((b) => b.status === 'completed').length;
    const cancelledLast30Days = bookingsLast30Days.filter((b) => b.status === 'cancelled').length;

    const conversionRateLast30Days = bookingsLast30Days.length
      ? Math.round((completedLast30Days / bookingsLast30Days.length) * 100)
      : 0;
    const cancellationRateLast30Days = bookingsLast30Days.length
      ? Math.round((cancelledLast30Days / bookingsLast30Days.length) * 100)
      : 0;

    const trendVsPrev7DaysPct = bookingsPrev7Days
      ? Math.round(((bookingsLast7Days - bookingsPrev7Days) / bookingsPrev7Days) * 100)
      : (bookingsLast7Days > 0 ? 100 : 0);

    const dailyBookingsLast7Days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startOfLast7Days);
      day.setDate(startOfLast7Days.getDate() + index);
      const key = day.toISOString().slice(0, 10);
      return { key, label: day.toLocaleDateString('fr-FR', { weekday: 'short' }), count: 0 };
    });

    bookings.forEach((booking) => {
      if (!booking.createdAt) return;
      const createdAt = new Date(booking.createdAt);
      if (Number.isNaN(createdAt.getTime())) return;
      if (createdAt < startOfLast7Days || createdAt > endOfToday) return;

      const key = createdAt.toISOString().slice(0, 10);
      const bucket = dailyBookingsLast7Days.find((entry) => entry.key === key);
      if (bucket) bucket.count += 1;
    });
    
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.servicePrice, 0),
      bookingsLast7Days,
      bookingsPrev7Days,
      trendVsPrev7DaysPct,
      conversionRateLast30Days,
      cancellationRateLast30Days,
      dailyBookingsLast7Days,
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default bookingRouter;
