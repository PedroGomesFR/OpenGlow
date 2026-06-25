import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import router from "./routes/records.js";
import eventRouter from "./routes/events.js";
import serviceRouter from "./routes/services.js";
import uploadRouter from "./routes/uploads.js";
import bookingRouter from "./routes/bookings.js";
import reviewRouter from "./routes/reviews.js";
import availabilityRouter from "./routes/availability.js";
import adminRouter from "./routes/admin.js";
import professionalRouter from "./routes/professional.js";
import productRouter from "./routes/products.js";
import announcementRouter from "./routes/announcements.js";
import feedbackRouter from "./routes/feedback.js";
import connectDB from "./db/connection.js";
dotenv.config({ path: ".env" });

if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5001;
const bindHost = process.env.HOST || process.env.IP || "::";
const app = express();
const httpServer = createServer(app);
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://www.openglow.fr').replace(/\/$/, '');

// Origines autorisées (CORS whitelist)
const ALLOWED_ORIGINS = [
  'https://openglow.alwaysdata.net',
  'https://openglow.netlify.app',
  'https://openglow.onrender.com',
  'https://openglow.fr',
  'https://www.openglow.fr',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:1234',
  'http://127.0.0.1:3000',
];

const EXTRA_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const ALL_ALLOWED_ORIGINS = [...new Set([...ALLOWED_ORIGINS, ...EXTRA_ALLOWED_ORIGINS])];

const isOriginAllowed = (origin) => {
  if (!origin) return false;
  if (ALL_ALLOWED_ORIGINS.includes(origin)) return true;

  // Optional preview/staging domains
  return /\.onrender\.com$/i.test(origin) || /\.netlify\.app$/i.test(origin);
};

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

// Socket.io JWT auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = String(decoded.id);
    socket.isAdmin = !!decoded.isAdmin;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Each user joins their personal room + admin room if admin
  socket.join(`chat:${socket.userId}`);
  if (socket.isAdmin) socket.join('admin');
});

// Expose io for use in route handlers
app.set('io', io);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Security headers (OWASP)
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.header('Content-Security-Policy', "default-src 'self'; connect-src 'self' https://api.openglow.fr https://openglow.onrender.com; img-src 'self' data: blob: https:; font-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self'");
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // CORS — whitelist only
  if (isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use("/api/records", router);
app.use("/api/events", eventRouter);
app.use("/api/services", serviceRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/admin", adminRouter);
app.use("/api/professionals", professionalRouter);
app.use("/api/products", productRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/feedback", feedbackRouter);

// SPA fallback: redirect non-API browser routes to the frontend app.
app.get(/^\/(?!api).*/, (req, res) => {
  const acceptsHtml = req.headers.accept?.includes('text/html');
  if (!acceptsHtml) {
    return res.status(404).send('Not Found');
  }

  return res.redirect(302, `${FRONTEND_URL}${req.originalUrl}`);
});

app.use("/api/keepAlive/Health", async (req, res) => {
  try {
    const db = await connectDB();
    // Simple query to verify connection
    await db.collection("bookings").findOne({});
    res.status(200).json({ message: "Server is running", database: "connected" });
  } catch (error) {
    res.status(500).json({ message: "Health check failed", error: error.message });
  }
})

const server = httpServer.listen(port, bindHost, () => {
  const addr = server.address();
  console.log(`Server is running on port: ${port}`);
  console.log(`Bind host env: ${process.env.HOST || "(not set)"}`);
  console.log(`Listening on: ${typeof addr === "string" ? addr : `${addr?.address}:${addr?.port}`}`);
});

// Handlers pour les erreurs non-capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});