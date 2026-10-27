
const express = require("express");
const router = express.Router();

// Import all six Contact controller functions
const {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  deleteAllContacts
} = require("../controllers/contactController");

// Import authentication and Admin middleware
const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

// GET - Retrieve all contact messages
// Admin only
router.get("/", protect, adminOnly, getContacts);

// GET - Retrieve one contact message by ID
// Admin only
router.get("/:id", protect, adminOnly, getContactById);

// POST - Submit a contact form
// Public visitors can send messages
router.post("/", createContact);

// PUT - Update a contact by ID
// Admin only
router.put("/:id", protect, adminOnly, updateContact);

// DELETE - Remove all contacts
// Admin only
router.delete("/", protect, adminOnly, deleteAllContacts);

// DELETE - Remove one contact by ID
// Admin only
router.delete("/:id", protect, adminOnly, deleteContact);

// Export the router
module.exports = router;
