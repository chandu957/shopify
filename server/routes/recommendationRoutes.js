import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserRecommendations, getSimilarProducts } from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/similar/:productId", getSimilarProducts);
router.get("/user/:userId", protect, getUserRecommendations);

export default router;

