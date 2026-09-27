import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

import {
  addProduct,
  getAllProducts,
  getCatalogStats,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  addProductReview,
} from "../controllers/productController.js";

const router = express.Router();

// ================= PUBLIC ROUTES =================

// Get all products
router.get("/", getAllProducts);

// Counts per category (verify seed loaded; same DB as server)
router.get("/catalog-stats", getCatalogStats);

// Add product to wishlist (user must login)
router.post("/wishlist/:id", protect, addToWishlist);

// Get wishlist
router.get("/wishlist", protect, getWishlist);

// Remove product from wishlist
router.delete("/wishlist/:productId", protect, removeFromWishlist);

// Get single product
router.get("/:id", getSingleProduct);
router.post("/:id/reviews", protect, addProductReview);

// ================= ADMIN ROUTES =================

// Add product
router.post("/", protect, adminOnly, addProduct);

// Update product
router.put("/:id", protect, adminOnly, updateProduct);

// Delete product
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;