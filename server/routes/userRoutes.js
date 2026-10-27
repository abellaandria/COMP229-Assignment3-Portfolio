
const express = require("express");
const router = express.Router();

// Import all six User controller functions
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteAllUsers
} = require("../controllers/userController");

// Import authentication and Admin middleware
const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

// GET - Retrieve all users (Admin only)
router.get("/", protect, adminOnly, getUsers);

// GET - Retrieve one user (Admin only)
router.get("/:id", protect, adminOnly, getUserById);

// POST - Create a new user (Admin only)
router.post("/", protect, adminOnly, createUser);

// PUT - Update a user (Admin only)
router.put("/:id", protect, adminOnly, updateUser);

// DELETE - Remove all users (Admin only)
router.delete("/", protect, adminOnly, deleteAllUsers);

// DELETE - Remove one user (Admin only)
router.delete("/:id", protect, adminOnly, deleteUser);

// Export the router
module.exports = router;
