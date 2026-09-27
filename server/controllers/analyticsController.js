import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { getUserGrowth } from "../services/analyticsService.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.revenue || 0;

    const mostViewed = await Product.find().sort({ views: -1 }).limit(3);
    const trending = await Product.find().sort({ purchases: -1 }).limit(3);
    const userGrowth = await getUserGrowth();

    res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      mostViewed,
      trending,
      userGrowth,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Admin rich analytics ──────────────────────────────────────────────────
export const getAdminAnalytics = async (req, res) => {
  try {
    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const revenueByMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:     { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          count:   { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Orders by payment status
    const ordersByPayment = await Order.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Products by category (count + avg price + avg rating)
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id:       "$category",
          count:     { $sum: 1 },
          avgPrice:  { $avg: "$price" },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Rating distribution (floor to 1–5 stars)
    const ratingDist = await Product.aggregate([
      { $match: { rating: { $gt: 0 } } },
      {
        $group: {
          _id:   { $floor: "$rating" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top 5 selling products — join with products collection to get name & price
    // items.price does NOT exist in the Order schema, so we look it up from products
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id:  "$items.product",
          sold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from:         "products",
          localField:   "_id",
          foreignField: "_id",
          as:           "product",
        },
      },
      // preserveNullAndEmptyArrays is the correct option name
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name:    { $ifNull: ["$product.name", "Unknown"] },
          sold:    1,
          // compute revenue from the product's actual price
          revenue: { $multiply: ["$sold", { $ifNull: ["$product.price", 0] }] },
        },
      },
    ]);

    // User registrations per month (last 6)
    const usersByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:   { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      revenueByMonth,
      ordersByStatus,
      ordersByPayment,
      productsByCategory,
      ratingDist,
      topProducts,
      usersByMonth,
    });
  } catch (error) {
    console.error("getAdminAnalytics error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── User personal analytics ───────────────────────────────────────────────
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId }).populate(
      "items.product",
      "name category price"
    );

    // Spending by month
    const spendingByMonth = {};
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    orders.forEach((o) => {
      const d   = new Date(o.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      spendingByMonth[key] = (spendingByMonth[key] || 0) + (o.totalPrice || 0);
    });

    // Spending by category (use product.price as fallback since items.price not stored)
    const spendingByCategory = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const cat   = item.product?.category || "Other";
        const price = item.product?.price || 0;
        const spent = (item.quantity || 1) * price;
        spendingByCategory[cat] = (spendingByCategory[cat] || 0) + spent;
      });
    });

    // Orders by status
    const ordersByStatus = {};
    orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    // Totals
    const totalSpend     = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const avgOrderValue  = orders.length ? totalSpend / orders.length : 0;

    // Top spending categories (up to 5)
    const topCategories = Object.entries(spendingByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({ category: cat, amount: amt }));

    res.json({
      totalOrders: orders.length,
      totalSpend,
      avgOrderValue,
      spendingByMonth,
      spendingByCategory,
      ordersByStatus,
      topCategories,
    });
  } catch (error) {
    console.error("getUserAnalytics error:", error);
    res.status(500).json({ message: error.message });
  }
};
