import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ObjectId } from 'mongodb';
import connectDB from '../db/connection.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "mycontacts_jwt_secret";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "24h" });
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No token provided");

      return res
        .status(401)
        .json({ error: "No token provided, authorization denied" });
    }
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) }, {
      projection: {
        password: 0,
        passwordResetCodeHash: 0,
        passwordResetCodeExpires: 0,
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable ou supprimé." });
    }

    if (user.isSuspended) {
      // Auto-lift if the scheduled lift date has passed
      if (user.suspensionLiftAt && new Date(user.suspensionLiftAt) <= new Date()) {
        await db.collection('users').updateOne(
          { _id: new ObjectId(decoded.id) },
          { $set: { isSuspended: false, suspensionLiftAt: null, suspendedReason: null, suspensionMessage: null, updatedAt: new Date() } }
        );
      } else {
        return res.status(403).json({
          error: user.suspensionMessage || "Votre compte a été suspendu. Contactez le support.",
          suspended: true,
          suspensionLiftAt: user.suspensionLiftAt || null,
        });
      }
    }

    req.userId = decoded.id;
    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token is invalid or expired" });
  }
};

export default verifyToken;
export { generateToken, verifyToken };