import Cart from "../models/cart.js";

// ================= ADD TO CART =================
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    const quantityToAdd = Math.max(Number(req.body.quantity || 1), 1);

    let cart = await Cart.findOne({ user: userId });

    // If cart not found create new
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity: quantityToAdd }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantityToAdd;
      } else {
        cart.items.push({ product: productId, quantity: quantityToAdd });
      }
    }

    await cart.save();

    res.json({ message: "Product added to cart successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) return res.json({ items: [] });

    const items = cart.items.map((item) => ({
      _id: item.product?._id,
      name: item.product?.name,
      price: item.product?.price || 0,
      image: item.product?.image || "",
      category: item.product?.category || "",
      quantity: item.quantity,
    }));

    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (itemIndex === -1) return res.status(404).json({ message: "Item not found in cart" });

    cart.items[itemIndex].quantity = Number(quantity) || 1;
    await cart.save();

    res.json({ message: "Cart updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};