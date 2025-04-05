const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { verifyToken } = require("../middleware/jwtAuth");

const saltRounds = 10;

// GET /auth/signup
router.get("/signup", (req, res) => {
  res.render("auth/signup");
});

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { phone_number, otp } = req.body;

  // Validation
  if (!phone_number || !otp) {
    return res.status(400).json({
      success: false,
      message: "Phone number and OTP are required."
    });
  }

  try {
    // Check if phone number already exists
    const phoneCheck = await db.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists."
      });
    }

    // Verify OTP (placeholder - implement actual OTP verification)
    if (otp !== "123456") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    // Store verified phone number for password creation
    res.json({
      success: true,
      message: "Phone verified. Proceed to create password.",
      phone_number
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({
      success: false,
      message: "An error occurred during signup."
    });
  }
});

// GET /auth/create-password
router.get("/create-password", (req, res) => {
  res.render("auth/create-password");
});

// POST /auth/create-password
router.post("/create-password", async (req, res) => {
  const { phone_number, password, confirmPassword } = req.body;

  // Validation
  if (!phone_number || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Phone number, password, and confirmation are required."
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match."
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long."
    });
  }

  try {
    // Hash password
    const salt = await bcrypt.genSalt(saltRounds);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user with default role 'customer'
    const result = await db.query(
      `INSERT INTO users 
       (role, phone_number, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, role, phone_number, created_at, updated_at`,
      ['customer', phone_number, password_hash]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Error during password creation:', error);
    res.status(500).json({
      success: false,
      message: "An error occurred during account creation."
    });
  }
});

// GET /auth/login
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { phone_number, password } = req.body;

  // Validate input
  if (!phone_number || !password) {
    return res.status(400).json({
      success: false,
      message: "Phone number and password are required."
    });
  }

  try {
    // Find user by phone number
    const result = await db.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone_number]
    );
    
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found."
      });
    }

    // Verify password using password_hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password."
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login."
    });
  }
});

// POST /auth/request-otp
router.post("/request-otp", async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required."
    });
  }

  try {
    // Here you would implement actual OTP sending logic
    res.json({
      success: true,
      message: "OTP sent successfully."
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP."
    });
  }
});

// GET /auth/logout
router.get("/logout", (req, res) => {
  try {
    res.render("auth/logout");
  } catch (error) {
    res.render("auth/logout", { errorMessage: "An error occurred during logout." });
  }
});

// GET /auth/validate-token - Route to validate a JWT token
router.get("/validate-token", verifyToken, (req, res) => {
  // If verifyToken middleware passes, token is valid and user is available in req.user
  res.json({
    success: true,
    message: "Token is valid",
    user: req.user
  });
});

module.exports = router;
