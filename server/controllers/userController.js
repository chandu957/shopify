import User from "../models/User.js";

// ================= GET USER PROFILE =================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        location: user.location,
        phone: user.phone,
        profileImage: user.profileImage,
        dateOfBirth: user.dateOfBirth,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        purchaseHistory: user.purchaseHistory.length,
        browsingHistory: user.browsingHistory.length,
        loginCount: user.loginCount || 0,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE USER PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      location: req.body.location,
      phone: req.body.phone,
      profileImage: req.body.profileImage,
      dateOfBirth: req.body.dateOfBirth,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      postalCode: req.body.postalCode,
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        location: user.location,
        phone: user.phone,
        profileImage: user.profileImage,
        dateOfBirth: user.dateOfBirth,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET USER ACTIVITY =================
export const getUserActivity = async (req, res) => {
  try {
    // Demo activity count for dashboard
    const user = await User.findById(req.user.id);
    
    res.json({
      totalPurchases: user.purchaseHistory?.length || 0,
      totalBrowsingSessions: user.browsingHistory?.length || 0,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

