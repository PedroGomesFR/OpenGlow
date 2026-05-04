import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
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
import connectDB from "./db/connection.js";
dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5001;
const bindHost = process.env.HOST || process.env.IP || "::";
const app = express();
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

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Security headers (OWASP)
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const server = app.listen(port, bindHost, () => {
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