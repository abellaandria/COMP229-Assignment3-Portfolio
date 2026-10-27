
const express = require("express");
const router = express.Router();

// Import authentication controller functions
const {
  signupUser,
  loginUser,
  logoutUser
} = require("../controllers/authController");

// Import JWT authentication middleware
const { protect } = require("../middleware/authMiddleware");

// POST - Register a new user
router.post("/signup", signupUser);

// POST - Sign in
router.post("/signin", loginUser);

// GET - Sign out
router.get("/signout", protect, logoutUser);

// Existing routes for compatibility
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);

// Export router
module.exports = router;
