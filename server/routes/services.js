import express from 'express';
import connectDB from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';

const serviceRouter = express.Router();

// Get service categories (Public route)
serviceRouter.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Coiffure',
      'Coupe Femme',
      'Coupe Homme',
      'Coupe Enfant',
      'Barbier',
      'Coloration',
      'Mèches & Balayage',
      'Lissage & Défrisage',
      'Soins Capillaires',
      'Extensions Capillaires',
      'Manucure',
      'Pédicure',
      'Onglerie',
      'Épilation',
      'Épilation Définitive',
      'Beauté du Regard',
      'Maquillage',
      'Soins du Visage',
      'Soins du Corps',
      'Massage',
      'Spa & Balnéo',
      'Tatouage',
      'Piercing',
      'Bien-être',
      'Autre'
    ];
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all services for a professional (PUBLIC route - no auth required)
serviceRouter.get('/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;

    const db = await connectDB();
    const services = await db.collection('services').find({
      professionalId: professionalId
    }).toArray();

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Require a valid JWT for all other service routes
serviceRouter.use(verifyToken);

// Get all services for the authenticated professional
serviceRouter.get('/my-services', async (req, res) => {
  try {
    const userId = req.userId;

    const db = await connectDB();
    const services = await db.collection('services').find({
      professionalId: userId
    }).toArray();

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new service (only for professionals)
serviceRouter.post('/add', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, description, duration, price, category } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({ error: 'Name, duration, and price are required' });
    }

    // Verify user is a professional
    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user || user.isClient) {
      return res.status(403).json({ error: 'Only professionals can add services' });
    }

    const newService = {
      professionalId: userId,
      name,
      description: description || '',
      duration: parseInt(duration), // in minutes
      price: parseFloat(price),
      category: category || 'Autre',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('services').insertOne(newService);
    res.status(201).json({ service: { id: result.insertedId, ...newService } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a service
serviceRouter.put('/update/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, description, duration, price, category, isActive } = req.body;

    const db = await connectDB();

    // Verify ownership
    const service = await db.collection('services').findOne({
      _id: new ObjectId(id),
      professionalId: userId
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found or unauthorized' });
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (duration) updateData.duration = parseInt(duration);
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await db.collection('services').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.status(200).json({ message: 'Service updated successfully', service: updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a service
serviceRouter.delete('/delete/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const db = await connectDB();
    const result = await db.collection('services').deleteOne({
      _id: new ObjectId(id),
      professionalId: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Service not found or unauthorized' });
    }

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default serviceRouter;
