import express from 'express';
import multer from 'multer';
import { ObjectId, GridFSBucket } from 'mongodb';
import connectDB from '../db/connection.js';
import { verifyToken } from '../middleware/auth.js';
import sharp from 'sharp';
import { Readable } from 'stream';

const uploadRouter = express.Router();

// Multer: stockage en mémoire (on passe par sharp avant GridFS)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper: upload buffer vers GridFS, retourne l'ObjectId du fichier
async function uploadToGridFS(db, buffer, filename, contentType = 'image/webp') {
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  return new Promise((resolve, reject) => {
    const readable = Readable.from(buffer);
    const uploadStream = bucket.openUploadStream(filename, { contentType });
    readable.pipe(uploadStream);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });
}

// Helper: supprimer un fichier de GridFS par son ID stocké dans l'URL
async function deleteFromGridFS(db, fileId) {
  try {
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    await bucket.delete(new ObjectId(fileId));
  } catch (e) {
    console.warn('Could not delete old GridFS file:', e.message);
  }
}

// Authentification requise pour toutes les routes sauf GET image
uploadRouter.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/image/')) return next();
  verifyToken(req, res, next);
});

// ─── Servir une image depuis GridFS ───────────────────────────────────────────
uploadRouter.get('/image/:fileId', async (req, res) => {
  try {
    const db = await connectDB();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    const fileId = new ObjectId(req.params.fileId);

    // Vérifier que le fichier existe
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ error: 'Image not found' });

    res.set('Content-Type', files[0].contentType || 'image/webp');
    res.set('Cache-Control', 'public, max-age=31536000'); // cache 1 an
    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Upload photo de profil ───────────────────────────────────────────────────
uploadRouter.post('/profile-photo', upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const db = await connectDB();
    const userId = req.userId;

    // Compresser avec sharp
    const webpBuffer = await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;

    // Supprimer l'ancienne photo si elle existe
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user?.profilePhotoId) {
      await deleteFromGridFS(db, user.profilePhotoId);
    }

    // Stocker dans GridFS
    const fileId = await uploadToGridFS(db, webpBuffer, filename);
    const photoUrl = `/api/uploads/image/${fileId}`;

    // Mettre à jour l'utilisateur
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profilePhoto: photoUrl, profilePhotoId: fileId.toString(), updatedAt: new Date() } }
    );

    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      photoUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Upload photos du salon (pros) ───────────────────────────────────────────
uploadRouter.post('/salon-photos', upload.array('salonPhotos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const db = await connectDB();
    const userId = req.userId;

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || user.isClient) {
      return res.status(403).json({ error: 'Only professionals can upload salon photos' });
    }

    const photoUrls = [];
    const photoIds = [];

    await Promise.all(req.files.map(async (file) => {
      const webpBuffer = await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const filename = `salon-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const fileId = await uploadToGridFS(db, webpBuffer, filename);
      photoUrls.push(`/api/uploads/image/${fileId}`);
      photoIds.push(fileId.toString());
    }));

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: { salonPhotos: { $each: photoUrls }, salonPhotoIds: { $each: photoIds } },
        $set: { updatedAt: new Date() }
      }
    );

    res.status(200).json({
      message: 'Salon photos uploaded successfully',
      photoUrls
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Supprimer une photo du salon ─────────────────────────────────────────────
uploadRouter.delete('/salon-photo', async (req, res) => {
  try {
    const db = await connectDB();
    const userId = req.userId;
    const { photoUrl } = req.body;

    if (!photoUrl) return res.status(400).json({ error: 'Photo URL is required' });

    // Extraire le fileId depuis l'URL /api/uploads/image/:fileId
    const fileId = photoUrl.split('/').pop();
    await deleteFromGridFS(db, fileId);

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: { salonPhotos: photoUrl, salonPhotoIds: fileId },
        $set: { updatedAt: new Date() }
      }
    );

    res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Récupérer les photos d'un utilisateur ────────────────────────────────────
uploadRouter.get('/user-photos/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.params.userId) },
      { projection: { profilePhoto: 1, salonPhotos: 1 } }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      profilePhoto: user.profilePhoto || null,
      salonPhotos: user.salonPhotos || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default uploadRouter;
