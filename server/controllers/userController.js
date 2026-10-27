
const User = require("../models/User");

// GET - Retrieve all users without passwords
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// GET - Retrieve one user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

// POST - Create a new regular user
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required."
      });
    }

    // Password must have at least 12 characters
    if (password.length < 12) {
      return res.status(400).json({
        message: "Password must be at least 12 characters."
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists."
      });
    }

    // Create a regular user
    // Password hashing is handled by the User model
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user"
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

// PUT - Update a user's name and email
const updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Valid name and email are required."
      });
    }

    // Password and role cannot be changed here
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        updated: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

// DELETE - Remove one regular user
const deleteUser = async (req, res) => {
  try {
    // FIXED: authMiddleware stores the ID as req.user.id
    const loggedInUserId = req.user.id.toString();

    // Prevent Admin from deleting their own account
    if (loggedInUserId === req.params.id) {
      return res.status(403).json({
        message: "You cannot delete your own account."
      });
    }

    // Find the selected user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Protect Admin accounts from deletion
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be deleted here."
      });
    }

    // Delete the selected regular user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

// DELETE ALL - Disabled for security
const deleteAllUsers = async (req, res) => {
  return res.status(403).json({
    message: "Deleting all users is disabled for security."
  });
};

// Export all six User controller functions
module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteAllUsers
};
