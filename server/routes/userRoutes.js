import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getUserProfile, updateProfile, getAllUsersAdmin, getUserActivity } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.get("/activity", protect, getUserActivity);
router.get("/", protect, adminOnly, getAllUsersAdmin);

export default router;

