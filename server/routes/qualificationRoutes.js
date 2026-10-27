
const express = require("express");
const router = express.Router();

// Import all six Qualification controller functions
const {
  getQualifications,
  getQualificationById,
  createQualification,
  updateQualification,
  deleteQualification,
  deleteAllQualifications
} = require("../controllers/qualificationController");

// Import authentication and Admin middleware
const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

// GET - Retrieve all qualifications
// Logged-in User and Admin can view
router.get("/", protect, getQualifications);

// GET - Retrieve one qualification by ID
// Logged-in User and Admin can view
router.get("/:id", protect, getQualificationById);

// POST - Create a new qualification
// Admin only
router.post("/", protect, adminOnly, createQualification);

// PUT - Update a qualification by ID
// Admin only
router.put("/:id", protect, adminOnly, updateQualification);

// DELETE - Remove all qualifications
// Admin only
router.delete("/", protect, adminOnly, deleteAllQualifications);

// DELETE - Remove one qualification by ID
// Admin only
router.delete("/:id", protect, adminOnly, deleteQualification);

// Export the router
module.exports = router;
