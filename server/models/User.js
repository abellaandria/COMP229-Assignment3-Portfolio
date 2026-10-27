
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the structure of a user account
const userSchema = new mongoose.Schema({

  // User's full name
  name: {
    type: String,
    required: true,
    trim: true
  },

  // User's email address
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // User's password
  password: {
    type: String,
    required: true,
    select: false
  },

  // User role: Admin or regular User
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },

  // Date the account was created
  created: {
    type: Date,
    default: Date.now
  },

  // Date the account was last updated
  updated: {
    type: Date,
    default: Date.now
  }

});

// Hash the password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare login password with stored hashed password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Export the User model
// This model uses the "users" collection
module.exports = mongoose.model("User", userSchema);
