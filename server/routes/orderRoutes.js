import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  placeOrder,
  getMyOrders,
  getAllOrdersAdmin,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/place", protect, placeOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/", protect, adminOnly, getAllOrdersAdmin);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);
router.put("/:id/payment", protect, adminOnly, updatePaymentStatus);

export default router;