import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";


// ================= ADD PRODUCT (Admin) =================
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      image,
      images,
      tags,
      rating,
      numReviews,
      brand,
      subcategory,
      discount,
      soldCount,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      image,
      images,
      tags,
      rating,
      numReviews,
      brand,
      subcategory,
      discount,
      soldCount,
    });

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ALL PRODUCTS =================
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { isActive: { $ne: false } };

    const cat = category != null ? String(category).trim() : "";
    if (cat) {
      query.category = { $regex: new RegExp(`^${escapeRegex(cat)}$`, "i") };
    }

    const q = search != null ? String(search).trim() : "";
    if (q) query.name = { $regex: q, $options: "i" };

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Debug / health: counts so you can verify seed vs API use the same DB */
export const getCatalogStats = async (req, res) => {
  try {
    const total = await Product.countDocuments({ isActive: { $ne: false } });
    const byCategory = await Product.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({
      total,
      byCategory: byCategory.map((x) => ({ category: x._id || "unknown", count: x.count })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET SINGLE PRODUCT =================
export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🔥 increase product views automatically
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE PRODUCT (Admin) =================
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    Object.assign(product, req.body);
    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE PRODUCT (Admin) =================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getMostViewedProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ views: -1 })
      .limit(5);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ purchases: -1 })
      .limit(5);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const productId = req.params.id;

    // avoid duplicates
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res.json({ message: "Product added to wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");

    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // remove product from wishlist
    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== req.params.productId
    );

    await user.save();

    res.json({ message: "Product removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const hasPurchased = await Order.exists({
      user: userId,
      "items.product": productId,
      status: { $ne: "Cancelled" },
    });

    if (!hasPurchased) {
      return res.status(403).json({ message: "You can review only purchased products" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const user = await User.findById(userId).select("name");

    const existingReview = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReview) {
      existingReview.rating = Number(rating);
      existingReview.comment = comment || "";
      existingReview.createdAt = new Date();
    } else {
      product.reviews.push({
        user: userId,
        name: user?.name || "User",
        rating: Number(rating),
        comment: comment || "",
      });
    }

    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      (product.reviews.length || 1);

    await product.save();
    res.json({ message: "Review submitted successfully", reviews: product.reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};