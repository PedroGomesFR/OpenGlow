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
const app = express();

// Configuration CORS manuelle (plus fiable sur Alwaysdata)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
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

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port: ${port}`);
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