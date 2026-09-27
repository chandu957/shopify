import Order from "../models/Order.js";
import Cart from "../models/cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// ================= PLACE ORDER =================
export const placeOrder = async (req, res) => {
  try {
    const { paymentMethod = "COD", shippingAddress: clientAddress } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Build shipping address: prefer what the client sent, else build from user's saved profile
    let shippingAddress = clientAddress || "";
    const user = await User.findById(req.user.id);
    if (!shippingAddress || shippingAddress === "Default Address") {
      if (user) {
        const parts = [
          user.addressLine1,
          user.addressLine2,
          user.city,
          user.state,
          user.country,
          user.postalCode,
        ].filter(Boolean);
        shippingAddress = parts.length > 0 ? parts.join(", ") : "Address not set";
      } else {
        shippingAddress = "Address not set";
      }
    }

    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    let total = 0;

    cart.items.forEach((item) => {
      const product = productMap.get(item.product.toString());
      total += item.quantity * (product?.price || 0);
    });

    const order = new Order({
      user: req.user.id,
      items: cart.items,
      totalPrice: total,
      paymentMethod,
      shippingAddress,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      trackingId: `TRK-${Date.now().toString().slice(-8)}`,
    });

    await order.save();

    // Save purchase history for user analytics.
    if (user) {
      cart.items.forEach((item) => {
        const p = productMap.get(item.product.toString());
        user.purchaseHistory.push({
          productId: item.product,
          category: p?.category || "",
          price: p?.price || 0,
        });
      });
      await user.save();
    }

    // clear cart after order
    cart.items = [];
    await cart.save();

    res.json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET USER ORDERS =================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = req.body.status || order.status;
    if (order.status === "Delivered") {
      order.paymentStatus = "Paid";
    }

    await order.save();

    res.json({ message: "Order updated", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
    await order.save();

    res.json({ message: "Payment status updated", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};