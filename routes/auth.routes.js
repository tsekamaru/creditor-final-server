const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the database connection
const db = require("../db");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

// GET /auth/signup
router.get("/signup", isLoggedOut, (req, res) => {
  res.render("auth/signup");
});

// POST /auth/signup - Step 1: Phone verification
router.post("/signup", isLoggedOut, async (req, res) => {
  const { phone_number, otp } = req.body;

  // Validation
  if (!phone_number || !otp) {
    return res.status(400).render("auth/signup", {
      errorMessage: "Phone number and OTP are required."
    });
  }

  try {
    // Check if phone number already exists
    const phoneCheck = await db.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone_number]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).render("auth/signup", {
        errorMessage: "Phone number already exists."
      });
    }

    // Verify OTP (placeholder - implement actual OTP verification)
    if (otp !== "123456") { // Replace with actual OTP verification
      return res.status(400).render("auth/signup", {
        errorMessage: "Invalid OTP."
      });
    }

    // Store verified phone number in session for password creation
    req.session.verifiedPhone = phone_number;
    res.redirect("/auth/create-password");
  } catch (error) {
    console.error('Error during phone verification:', error);
    res.status(500).render("auth/signup", {
      errorMessage: "An error occurred during verification."
    });
  }
});

// GET /auth/create-password
router.get("/create-password", isLoggedOut, (req, res) => {
  if (!req.session.verifiedPhone) {
    return res.redirect("/auth/signup");
  }
  res.render("auth/create-password");
});

// POST /auth/create-password - Step 2: Password creation
router.post("/create-password", isLoggedOut, async (req, res) => {
  const { password, confirmPassword } = req.body;
  const phone_number = req.session.verifiedPhone;

  if (!phone_number) {
    return res.redirect("/auth/signup");
  }

  // Validation
  if (!password || !confirmPassword) {
    return res.status(400).render("auth/create-password", {
      errorMessage: "Password and confirmation are required."
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).render("auth/create-password", {
      errorMessage: "Passwords do not match."
    });
  }

  if (password.length < 6) {
    return res.status(400).render("auth/create-password", {
      errorMessage: "Password must be at least 6 characters long."
    });
  }

  try {
    // Hash password
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default role 'customer'
    const result = await db.query(
      `INSERT INTO users 
       (role, phone_number, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, role, phone_number, created_at, updated_at`,
      ['customer', phone_number, hashedPassword]
    );

    const user = result.rows[0];
    // Remove password from session data
    const { password: _, ...userWithoutPassword } = user;
    req.session.currentUser = userWithoutPassword;
    
    // Clear the verified phone from session
    delete req.session.verifiedPhone;
    
    res.redirect("/");
  } catch (error) {
    console.error('Error during password creation:', error);
    res.status(500).render("auth/create-password", {
      errorMessage: "An error occurred during account creation."
    });
  }
});

// GET /auth/login
router.get("/login", isLoggedOut, (req, res) => {
  res.render("auth/login");
});

// POST /auth/login
router.post("/login", isLoggedOut, async (req, res) => {
  const { phone_number, password } = req.body;

  // Validate input
  if (!phone_number || !password) {
    return res.status(400).render("auth/login", {
      errorMessage: "Phone number and password are required."
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
      return res.status(400).render("auth/login", {
        errorMessage: "User not found."
      });
    }

    // Verify password using password_hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).render("auth/login", {
        errorMessage: "Invalid password."
      });
    }

    // Remove password_hash from session data
    const { password_hash: _, ...userWithoutPassword } = user;
    req.session.currentUser = userWithoutPassword;
    
    // Pass user data to the layout
    res.locals.user = userWithoutPassword;
    res.redirect("/");
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render("auth/login", {
      errorMessage: "An error occurred during login."
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
    // This is a placeholder response
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
router.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).render("auth/logout", {
        errorMessage: "An error occurred during logout."
      });
      return;
    }
    res.redirect("/");
  });
});

module.exports = router;
