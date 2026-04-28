import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';
import fs from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadRouter = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads - use memory storage for processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Require authentication for all routes
uploadRouter.use(verifyToken);

// Upload profile photo
uploadRouter.post('/profile-photo', upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.userId;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `profile-${uniqueSuffix}.webp`;
    const photoPath = path.join(uploadsDir, filename);
    const photoUrl = `/uploads/${filename}`;

    // Process image: resize and compress to WebP
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(photoPath);

    const db = await connectDB();
    
    // Get old photo to delete it
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user?.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update user with new profile photo
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          profilePhoto: photoUrl,
          updatedAt: new Date()
        } 
      }
    );

    res.status(200).json({ 
      message: 'Profile photo uploaded and compressed successfully',
      photoUrl: photoUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload salon photos (for professionals)
uploadRouter.post('/salon-photos', upload.array('salonPhotos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.userId;
    
    // Verify user is a professional
    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user || user.isClient) {
      return res.status(403).json({ error: 'Only professionals can upload salon photos' });
    }

    const photoUrls = [];
    const uploadPromises = req.files.map(async (file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `salon-${uniqueSuffix}.webp`;
      const photoPath = path.join(uploadsDir, filename);
      
      await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(photoPath);
      
      photoUrls.push(`/uploads/${filename}`);
    });

    await Promise.all(uploadPromises);

    // Add photos to user's salon gallery
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $push: { 
          salonPhotos: { $each: photoUrls }
        },
        $set: { updatedAt: new Date() }
      }
    );

    res.status(200).json({ 
      message: 'Salon photos uploaded and compressed successfully',
      photoUrls: photoUrls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete salon photo
uploadRouter.delete('/salon-photo', async (req, res) => {
  try {
    const userId = req.userId;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }

    const db = await connectDB();
    
    // Remove photo from database
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { salonPhotos: photoUrl },
        $set: { updatedAt: new Date() }
      }
    );

    // Delete physical file
    const photoPath = path.join(__dirname, '..', photoUrl);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user photos
uploadRouter.get('/user-photos/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { profilePhoto: 1, salonPhotos: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      profilePhoto: user.profilePhoto || null,
      salonPhotos: user.salonPhotos || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default uploadRouter;
