import dotenv from "dotenv";
import express from "express";
import cors from "cors";
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

// Origines autorisées (CORS whitelist)
const ALLOWED_ORIGINS = [
  'https://openglow.alwaysdata.net',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
];

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
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
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