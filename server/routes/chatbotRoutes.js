import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  handleChatMessage,
  getAdminTickets,
  updateTicketStatus,
} from "../controllers/chatbotController.js";

const router = express.Router();

// Public chat endpoint
router.post("/", handleChatMessage);

// Admin-only ticket endpoints
router.get("/tickets", protect, adminOnly, getAdminTickets);
router.put("/tickets/:id", protect, adminOnly, updateTicketStatus);

export default router;
