
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate a JWT token for a user
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// ========================================
// POST - Register a new user (Signup)
// ========================================
const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required."
      });
    }

    // Require a reasonably strong password
    if (password.length < 12) {
      return res.status(400).json({
        message: "Password must contain at least 12 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    // Create a regular user account.
    // Never accept the role from the request body.
    // The User model hashes the password before saving.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user"
    });

    // Generate a JWT for the newly registered user
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Signup error:", error.message);

    // Handle duplicate email errors from MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid registration information."
      });
    }

    return res.status(500).json({
      message: "Unable to register user."
    });
  }
};

// ========================================
// POST - Log in a user (Signin)
// ========================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    // Find user and include password for verification
    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    // Check credentials
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in."
    });
  }
};

// ========================================
// POST/GET - Sign out a user
// ========================================
const logoutUser = (req, res) => {
  // JWT is discarded on the client side
  return res.status(200).json({
    message: "Logout successful. Please discard your token."
  });
};

// Export authentication functions
module.exports = {
  signupUser,
  loginUser,
  logoutUser
};
