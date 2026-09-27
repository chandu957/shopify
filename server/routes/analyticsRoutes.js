import express from "express";
import {
  getMostViewedProducts,
  getTrendingProducts,
} from "../controllers/productController.js";
import { getDashboardStats, getAdminAnalytics, getUserAnalytics } from "../controllers/analyticsController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/most-viewed", getMostViewedProducts);
router.get("/trending", getTrendingProducts);
router.get("/dashboard", protect, adminOnly, getDashboardStats);
router.get("/admin", protect, adminOnly, getAdminAnalytics);
router.get("/user", protect, getUserAnalytics);

export default router;