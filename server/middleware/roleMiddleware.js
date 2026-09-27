import { protect } from "./authMiddleware.js";

// Alias for adminOnly (matches prompt structure)
export const adminOnly = protect((req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
});

// Role checker middleware
export const authorizeRole = (roles) => {
  return protect((req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Role not authorized" });
    }
    next();
  });
};

