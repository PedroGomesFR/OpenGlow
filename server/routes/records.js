import express from 'express';
import connectDB from '../db/connection.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { generateToken, verifyToken } from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";
import rateLimit from 'express-rate-limit';
import { createHash, randomInt } from 'crypto';

const router = express.Router();

// Rate limiter — 30 tentatives / 15 min par IP sur le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de demandes. Veuillez réessayer dans 15 minutes.' }
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' }
});

// ─── Helper: verify reCAPTCHA token ──────────────────────────────────────────
const verifyCaptcha = async (token, req) => {
  // Skip in local development (localhost)
  const host = req?.headers?.host || '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return true;

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // No key configured → bypass

  // No token sent from client
  if (!token) return false;

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
      { method: 'POST' }
    );
    const data = await response.json();

    if (!data.success) {
      // Log to understand what Google says, but fail-open on config errors
      const configErrors = ['invalid-input-secret', 'missing-input-secret'];
      const hasConfigError = (data['error-codes'] || []).some(e => configErrors.includes(e));
      if (hasConfigError) {
        console.warn('[reCAPTCHA] Config error (check secret key on Render):', data['error-codes']);
        return true; // Fail-open on misconfiguration — don't block users
      }
      console.warn('[reCAPTCHA] Verification failed:', data['error-codes']);
      return false; // Real invalid token (bot)
    }

    return true;
  } catch (e) {
    // Network error reaching Google → fail-open
    console.error('[reCAPTCHA] Network error during verification:', e.message);
    return true;
  }
};

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

// ─── Helper: validate GDPR/CNIL compliant password ─────────────────────────
const isPasswordStrong = (password) => {
  if (!password || password.length < 12) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

const hashResetCode = (code) => createHash('sha256').update(String(code)).digest('hex');

// Register route
router.post('/register', async (req, res) => {
  try {
    const { prenom, nom, dateDeNaissance, email, password, profession, companyName, siret, type, address, latitude, longitude, captchaToken } = req.body;

    // Verify CAPTCHA
    const captchaOk = await verifyCaptcha(captchaToken, req);
    if (!captchaOk) {
      return res.status(400).json({ error: 'CAPTCHA invalide. Veuillez réessayer.' });
    }

    // Validate password strength (CNIL requirements)
    if (!isPasswordStrong(password)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
    }

    // Age 18+ verification (RGPD art. 8)
    if (dateDeNaissance) {
      const birth = new Date(dateDeNaissance);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear() -
        (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
      if (isNaN(age) || age < 18) {
        return res.status(400).json({ error: 'Vous devez avoir au moins 18 ans pour vous inscrire.' });
      }
    }

    const db = await connectDB();
    const users = db.collection('users');
    const pendingRegistrations = db.collection('pending_registrations');

    // Auto-clean pending registrations after 30 minutes
    await pendingRegistrations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Check if email already exists in final users collection
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ emailUsed: true });
    }

    // Keep only the latest pending request for this email
    await pendingRegistrations.deleteMany({ email });

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

    const pendingUser = {
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
      verificationCode,
      verificationCodeExpires,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await pendingRegistrations.insertOne(pendingUser);

    // Send Verification Email (Async)
    const emailSubject = isClient ? 'Code de vérification OpenGlow' : 'Code de vérification OpenGlow';
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
    const pendingRegistrations = db.collection('pending_registrations');

    const existingUser = await users.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Account already verified' });

    const pendingUser = await pendingRegistrations.findOne({ email });
    if (!pendingUser) return res.status(400).json({ error: 'User not found' });

    if (pendingUser.verificationCode !== code) return res.status(400).json({ error: 'Invalid verification code' });
    if (pendingUser.verificationCodeExpires < new Date()) return res.status(400).json({ error: 'Verification code expired' });

    const userToInsert = {
      prenom: pendingUser.prenom,
      nom: pendingUser.nom,
      dateDeNaissance: pendingUser.dateDeNaissance,
      email: pendingUser.email,
      password: pendingUser.password,
      profession: pendingUser.profession || null,
      companyName: pendingUser.companyName || null,
      siret: pendingUser.siret || null,
      isClient: pendingUser.isClient,
      profilePhoto: pendingUser.profilePhoto || null,
      salonPhotos: pendingUser.salonPhotos || [],
      description: pendingUser.description || null,
      address: pendingUser.address || null,
      phone: pendingUser.phone || null,
      openingHours: pendingUser.openingHours || null,
      location: pendingUser.location || null,
      latitude: pendingUser.latitude || null,
      longitude: pendingUser.longitude || null,
      averageRating: pendingUser.averageRating || 0,
      totalReviews: pendingUser.totalReviews || 0,
      isVerified: true,
      createdAt: pendingUser.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await users.insertOne(userToInsert);
    await pendingRegistrations.deleteOne({ _id: pendingUser._id });

    const token = generateToken(insertResult.insertedId);

    res.json({
      user: {
        id: insertResult.insertedId,
        prenom: userToInsert.prenom,
        nom: userToInsert.nom,
        dateDeNaissance: userToInsert.dateDeNaissance,
        email: userToInsert.email,
        isClient: userToInsert.isClient,
        isAdmin: false,
        companyName: userToInsert.companyName,
        profilePhoto: userToInsert.profilePhoto,
        salonPhotos: userToInsert.salonPhotos,
        address: userToInsert.address,
        description: userToInsert.description,
        phone: userToInsert.phone,
        openingHours: userToInsert.openingHours,
        profession: userToInsert.profession,
        latitude: userToInsert.latitude,
        longitude: userToInsert.longitude
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    // Verify CAPTCHA
    const captchaOk = await verifyCaptcha(captchaToken, req);
    if (!captchaOk) {
      return res.status(400).json({ error: 'CAPTCHA invalide. Veuillez réessayer.' });
    }

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
        dateDeNaissance: user.dateDeNaissance,
        email: user.email,
        isClient: user.isClient,
        isAdmin: user.isAdmin || false, // Return isAdmin status
        companyName: user.companyName,
        profilePhoto: user.profilePhoto,
        salonPhotos: user.salonPhotos,
        address: user.address,
        description: user.description,
        phone: user.phone,
        openingHours: user.openingHours,
        profession: user.profession,
        latitude: user.latitude,
        longitude: user.longitude
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ask for password reset code by email
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email, captchaToken } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis.' });
    }

    const captchaOk = await verifyCaptcha(captchaToken, req);
    if (!captchaOk) {
      return res.status(400).json({ error: 'CAPTCHA invalide. Veuillez réessayer.' });
    }

    const db = await connectDB();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    // Return success even if user does not exist to avoid account enumeration
    if (!user) {
      return res.status(200).json({ message: 'Si un compte existe, un code de réinitialisation a été envoyé.' });
    }

    const resetCode = String(randomInt(100000, 1000000));
    const resetCodeHash = hashResetCode(resetCode);
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetCodeHash: resetCodeHash,
          passwordResetCodeExpires: resetCodeExpires,
          updatedAt: new Date()
        }
      }
    );

    const emailHtml = `<h1>Bonjour ${user.prenom || ''},</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe OpenGlow.</p>
      <p>Votre code est : <b><span style="font-size:24px; color:#1a5c6b;">${resetCode}</span></b></p>
      <p>Ce code expire dans 15 minutes.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`;

    sendEmail({
      email,
      subject: 'Réinitialisation de mot de passe OpenGlow',
      html: emailHtml
    });

    return res.status(200).json({ message: 'Si un compte existe, un code de réinitialisation a été envoyé.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Reset password with email + code
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  try {
    const { email, code, newPassword, captchaToken } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code et nouveau mot de passe requis.' });
    }

    const captchaOk = await verifyCaptcha(captchaToken, req);
    if (!captchaOk) {
      return res.status(400).json({ error: 'CAPTCHA invalide. Veuillez réessayer.' });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
    }

    const db = await connectDB();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    if (!user || !user.passwordResetCodeHash || !user.passwordResetCodeExpires) {
      return res.status(400).json({ error: 'Code invalide ou expiré.' });
    }

    if (new Date(user.passwordResetCodeExpires) < new Date()) {
      return res.status(400).json({ error: 'Code invalide ou expiré.' });
    }

    const submittedHash = hashResetCode(code);
    if (submittedHash !== user.passwordResetCodeHash) {
      return res.status(400).json({ error: 'Code invalide ou expiré.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          passwordResetCodeHash: '',
          passwordResetCodeExpires: ''
        }
      }
    );

    return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Change password for logged-in users (client and professional)
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
    }

    const db = await connectDB();
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'ancien.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          passwordResetCodeHash: '',
          passwordResetCodeExpires: ''
        }
      }
    );

    return res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

// Delete account (RGPD - Right to erasure art. 17)
router.delete('/delete-account', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const db = await connectDB();

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé.' });

    // 1. Delete bookings (as client or professional)
    await db.collection('bookings').deleteMany({
      $or: [
        { clientId: userId },
        { clientId: new ObjectId(userId) },
        { professionalId: userId },
        { professionalId: new ObjectId(userId) }
      ]
    });

    // 2. Delete reviews left by or about this user
    await db.collection('reviews').deleteMany({
      $or: [
        { clientId: userId },
        { clientId: new ObjectId(userId) },
        { professionalId: userId },
        { professionalId: new ObjectId(userId) }
      ]
    });

    // 3. Delete services of this professional
    await db.collection('services').deleteMany({
      $or: [
        { professionalId: userId },
        { professionalId: new ObjectId(userId) }
      ]
    });

    // 4. Delete the user account
    await db.collection('users').deleteOne({ _id: new ObjectId(userId) });

    res.status(200).json({ message: 'Votre compte et toutes vos données ont été supprimés.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update professional profile
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      description,
      address,
      phone,
      openingHours,
      companyName,
      latitude,
      longitude,
      prenom,
      nom,
      dateDeNaissance
    } = req.body;

    const db = await connectDB();
    const updateData = { updatedAt: new Date() };

    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) {
      const normalizedPhone = phone ? String(phone).trim() : '';
      if (normalizedPhone && !/^\+?[0-9\s().-]{6,20}$/.test(normalizedPhone)) {
        return res.status(400).json({ error: 'Numéro de téléphone invalide.' });
      }
      updateData.phone = normalizedPhone || null;
    }
    if (openingHours !== undefined) updateData.openingHours = openingHours;
    if (companyName !== undefined) updateData.companyName = companyName;

    if (prenom !== undefined) {
      const cleanedPrenom = String(prenom).trim();
      if (!cleanedPrenom || cleanedPrenom.length > 80) {
        return res.status(400).json({ error: 'Prénom invalide.' });
      }
      updateData.prenom = cleanedPrenom;
    }

    if (nom !== undefined) {
      const cleanedNom = String(nom).trim();
      if (!cleanedNom || cleanedNom.length > 80) {
        return res.status(400).json({ error: 'Nom invalide.' });
      }
      updateData.nom = cleanedNom;
    }

    if (dateDeNaissance !== undefined) {
      if (!dateDeNaissance) {
        updateData.dateDeNaissance = null;
      } else {
        const birthDate = new Date(dateDeNaissance);
        if (Number.isNaN(birthDate.getTime())) {
          return res.status(400).json({ error: 'Date de naissance invalide.' });
        }
        updateData.dateDeNaissance = dateDeNaissance;
      }
    }

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