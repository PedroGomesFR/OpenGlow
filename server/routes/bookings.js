import express from 'express';
import connectDB from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';

const bookingRouter = express.Router();

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
    const { professionalId, serviceId, date, time, notes } = req.body;

    if (!professionalId || !serviceId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await connectDB();
    
    // Get service details
    const service = await db.collection('services').findOne({ _id: new ObjectId(serviceId) });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

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
      serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.duration,
      date,
      time,
      notes: notes || '',
      status: 'pending', // pending, confirmed, cancelled, completed
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(newBooking);
    
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
    const { clientName, clientEmail, clientPhone, serviceId, date, time, notes } = req.body;

    if (!clientName || !serviceId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields (Name, service, date, time)' });
    }

    const db = await connectDB();
    
    // Verify professional
    const professional = await db.collection('users').findOne({ _id: new ObjectId(professionalId) });
    if (!professional || professional.isClient) {
      return res.status(403).json({ error: 'Only professionals can use this endpoint' });
    }

    // Get service details
    const service = await db.collection('services').findOne({ _id: new ObjectId(serviceId) });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const newBooking = {
      clientId: null, // No client ID for walk-ins
      clientName,
      clientEmail: clientEmail || '',
      clientPhone: clientPhone || '',
      professionalId,
      professionalName: professional.companyName || `${professional.prenom} ${professional.nom}`,
      serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.duration,
      date,
      time,
      notes: notes || '',
      status: 'confirmed', // Automatically confirmed
      isWalkIn: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(newBooking);
    
    res.status(201).json({ 
      message: 'Booking created successfully',
      booking: { id: result.insertedId, ...newBooking } 
    });
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
    
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.servicePrice, 0),
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default bookingRouter;
