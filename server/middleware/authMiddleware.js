
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify the user's JWT token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found or account no longer exists."
      });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user"
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
};

// Allow only Admin users
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required."
    });
  }

  next();
};

// Export authentication middleware
module.exports = {
  protect,
  adminOnly
};
