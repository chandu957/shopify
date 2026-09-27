import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    // 🔹 Role (admin / user)
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // 🔹 Wishlist feature
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // 🔹 Login tracking (optional but professional)
    lastLogin: {
      type: Date,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    // AI Recommendation fields
    age: Number,
    gender: String,
    location: String,
    phone: String,
    profileImage: String,
    dateOfBirth: Date,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,

    purchaseHistory: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        category: String,
        price: Number,
        date: { type: Date, default: Date.now },
      },
    ],

    browsingHistory: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        timeSpent: Number,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);


export default mongoose.model("User", userSchema);