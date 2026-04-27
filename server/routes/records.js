import express from 'express';
import connectDB from '../db/connection.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { generateToken, verifyToken } from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// Example route
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const records = await db.collection('records').find({}).toArray();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { prenom, nom, dateDeNaissance, email, password, profession, companyName, siret, type, address, latitude, longitude } = req.body;

    const db = await connectDB();
    const users = db.collection('users');

    // Clean up any previous unverified registration attempts for this email
    await users.deleteMany({ email: email, isVerified: false });

    // Check if email already exists (and is a verified account)
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ emailUsed: true });
    }

    let isClient = null;
    if (type == 'client') {
      if (!prenom || !nom || !dateDeNaissance || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      isClient = true;
    } else if (type == 'professional') {
      if (!prenom || !nom || !dateDeNaissance || !email || !password || !profession || !companyName || !siret || !address || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'All fields including valid address are required for professionals' });
      }
      isClient = false;
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const newUser = {
      prenom,
      nom,
      dateDeNaissance,
      email,
      password: hashedPassword,
      profession: profession || null,
      companyName: companyName || null,
      siret: siret || null,
      isClient: isClient,
      profilePhoto: null,
      salonPhotos: [],
      description: null,
      address: address || null,
      phone: null,
      openingHours: null,
      location: latitude && longitude ? { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] } : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      averageRating: 0,
      totalReviews: 0,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    // Send Verification Email (Async)
    const emailSubject = isClient ? 'Code de vérification OpenGlow' : 'Code de vérification OpenGlow PRO';
    const emailHtml = `<h1>Bonjour ${prenom},</h1>
      <p>Merci de vous être inscrit sur OpenGlow.</p>
      <p>Votre code de vérification est : <b><span style="font-size:24px; color:#1a5c6b;">${verificationCode}</span></b></p>
      <br><p>Ce code expire dans 15 minutes.</p>
      <br><p>L'équipe OpenGlow</p>`;

    sendEmail({
      email: email,
      subject: emailSubject,
      html: emailHtml
    });

    res.status(200).json({
      message: "Verification code sent",
      requiresVerification: true,
      email: email
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: error.message });
  }

});

// Verify Email route
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    const db = await connectDB();
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    if (user.isVerified) return res.status(400).json({ error: 'Account already verified' });

    if (user.verificationCode !== code) return res.status(400).json({ error: 'Invalid verification code' });
    if (user.verificationCodeExpires < new Date()) return res.status(400).json({ error: 'Verification code expired' });

    // Mark as verified
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { isVerified: true },
        $unset: { verificationCode: "", verificationCodeExpires: "" }
      }
    );

    const token = generateToken(user._id);

    res.json({
      user: {
        id: user._id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        isClient: user.isClient,
        isAdmin: user.isAdmin || false,
        companyName: user.companyName,
        profilePhoto: user.profilePhoto,
        salonPhotos: user.salonPhotos
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await connectDB();
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ requiresVerification: true, error: 'Veuillez vérifier votre email avant de vous connecter', email: user.email });
    }

    const token = generateToken(user._id);

    res.json({
      user: {
        id: user._id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        isClient: user.isClient,
        isAdmin: user.isAdmin || false, // Return isAdmin status
        companyName: user.companyName,
        profilePhoto: user.profilePhoto,
        salonPhotos: user.salonPhotos
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all professionals
router.get('/professionals', async (req, res) => {
  try {
    const db = await connectDB();
    const { search, profession } = req.query;

    let query = { isClient: false };

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { profession: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (profession) {
      query.profession = profession;
    }

    const professionals = await db.collection('users').find(
      query,
      { projection: { password: 0 } }
    ).toArray();

    res.status(200).json(professionals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get professional profile details
router.get('/professional/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectDB();

    const professional = await db.collection('users').findOne(
      { _id: new ObjectId(id), isClient: false },
      { projection: { password: 0 } }
    );

    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    res.status(200).json(professional);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update professional profile
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { description, address, phone, openingHours, companyName, latitude, longitude } = req.body;

    const db = await connectDB();
    const updateData = { updatedAt: new Date() };

    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (openingHours !== undefined) updateData.openingHours = openingHours;
    if (companyName !== undefined) updateData.companyName = companyName;

    // GPS coordinates
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      updateData.latitude = parseFloat(latitude);
      updateData.longitude = parseFloat(longitude);
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    res.status(200).json({ message: 'Profile updated successfully', data: updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;