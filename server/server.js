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
dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5001;
const app = express();

app.use(
  cors({ origin: "*", })
);

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});