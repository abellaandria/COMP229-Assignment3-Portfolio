
require("dotenv").config();

const mongoose = require("mongoose");
const readline = require("readline");
const User = require("./server/models/User");

// Ask for Admin credentials
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully!");

    // Ask for Admin account information
    const name = (await ask("Enter Admin name: ")).trim();

    const email = (await ask("Enter Admin email: "))
      .trim()
      .toLowerCase();

    const password = await ask(
      "Enter Admin password (minimum 12 characters): "
    );

    // Validate inputs
    if (!name || !email || password.length < 12) {
      throw new Error(
        "Name, email, and password of at least 12 characters are required."
      );
    }

    // Check if Admin email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("An account with this email already exists.");
      console.log("No changes were made.");
      return;
    }

    // Create Admin account
    // Password is automatically hashed by User.js
    await User.create({
      name,
      email,
      password,
      role: "admin"
    });

    console.log("Admin account created successfully!");
    console.log("Role: admin");

  } catch (error) {
    console.error("Admin setup failed:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
};

seedAdmin();
