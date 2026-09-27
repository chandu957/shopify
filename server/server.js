import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
dotenv.config();
connectDB();

const app = express();

// middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Handle payload too large error
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Payload too large. Maximum size allowed is 10MB.',
      error: 'PayloadTooLargeError'
    });
  }
  next(err);
});
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/chat", chatbotRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

// Keep ML service alive on free tier (ping every 14 minutes)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
setInterval(async () => {
  try {
    await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    console.log("ML service keep-alive ping sent");
  } catch (err) {
    console.log("ML service ping failed (may be sleeping):", err.message);
  }
}, 14 * 60 * 1000); // every 14 minutes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
