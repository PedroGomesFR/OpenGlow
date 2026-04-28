import express from 'express';
import connectDB from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET all active announcements for a professional (public route)
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;
    const db = await connectDB();

    const now = new Date();
    const announcements = await db.collection('announcements').find({
      professionalId: new ObjectId(professionalId),
      isActive: true,
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all announcements for the logged-in professional (private)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const db = await connectDB();

    const announcements = await db.collection('announcements').find({
      professionalId: new ObjectId(userId)
    }).sort({ createdAt: -1 }).toArray();

    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a new announcement
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { title, description, discountPercent, startDate, endDate, type } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Le titre et la description sont requis.' });
    }

    const db = await connectDB();

    // Verify the user is a professional
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || user.isClient !== false) {
      return res.status(403).json({ error: 'Accès réservé aux professionnels.' });
    }

    const newAnnouncement = {
      professionalId: new ObjectId(userId),
      title: title.trim(),
      description: description.trim(),
      discountPercent: discountPercent ? Number(discountPercent) : null,
      type: type || 'promotion', // 'promotion', 'news', 'event'
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('announcements').insertOne(newAnnouncement);
    res.status(201).json({ ...newAnnouncement, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update an announcement
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, description, discountPercent, startDate, endDate, type, isActive } = req.body;

    const db = await connectDB();

    const existing = await db.collection('announcements').findOne({
      _id: new ObjectId(id),
      professionalId: new ObjectId(userId)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }

    const updateData = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent ? Number(discountPercent) : null;
    if (type !== undefined) updateData.type = type;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.collection('announcements').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.status(200).json({ message: 'Annonce mise à jour.', data: updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE an announcement
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const db = await connectDB();

    const result = await db.collection('announcements').deleteOne({
      _id: new ObjectId(id),
      professionalId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }

    res.status(200).json({ message: 'Annonce supprimée.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
