import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add/:productId", protect, addToCart);
router.get("/", protect, getCart);
router.put("/update/:productId", protect, updateCartItem);
router.delete("/:productId", protect, removeCartItem);

export default router;