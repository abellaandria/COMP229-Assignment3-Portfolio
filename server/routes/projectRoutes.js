
const express = require("express");
const router = express.Router();

// Import Project controller functions
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  deleteAllProjects
} = require("../controllers/projectController");

// Import authentication and Admin middleware
const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

// GET - Retrieve all projects (User and Admin)
router.get("/", protect, getProjects);

// GET - Retrieve one project by ID (User and Admin)
router.get("/:id", protect, getProjectById);

// POST - Create a project (Admin only)
router.post("/", protect, adminOnly, createProject);

// PUT - Update a project (Admin only)
router.put("/:id", protect, adminOnly, updateProject);

// DELETE - Remove all projects (Admin only)
router.delete("/", protect, adminOnly, deleteAllProjects);

// DELETE - Remove one project (Admin only)
router.delete("/:id", protect, adminOnly, deleteProject);

// Export the router
module.exports = router;
