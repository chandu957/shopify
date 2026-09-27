import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const getUserGrowth = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const users = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  return users;
};

export const getRevenueStats = async () => {
  const orders = await Order.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        total: { $sum: "$totalAmount" }
      }
    }
  ]);
  return orders;
};

