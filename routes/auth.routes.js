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

// POST /auth/signup
router.post("/signup", isLoggedOut, async (req, res) => {
  const { username, email, password } = req.body;

  // Check that username, email, and password are provided
  if (username === "" || email === "" || password === "") {
    res.status(400).render("auth/signup", {
      errorMessage:
        "All fields are mandatory. Please provide your username, email and password.",
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).render("auth/signup", {
      errorMessage: "Your password needs to be at least 6 characters long.",
    });
    return;
  }

  try {
    // Check if user already exists
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userCheck.rows.length > 0) {
      res.status(400).render("auth/signup", {
        errorMessage: "Username or email already exists.",
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    req.session.currentUser = user;
    res.redirect("/");
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).render("auth/signup", {
      errorMessage: "An error occurred during signup.",
    });
  }
});

// GET /auth/login
router.get("/login", isLoggedOut, (req, res) => {
  res.render("auth/login");
});

// POST /auth/login
router.post("/login", isLoggedOut, async (req, res) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.status(400).render("auth/login", {
      errorMessage: "Please provide both email and password.",
    });
    return;
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(400).render("auth/login", {
        errorMessage: "Email not found.",
      });
      return;
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(400).render("auth/login", {
        errorMessage: "Incorrect password.",
      });
      return;
    }

    req.session.currentUser = user;
    res.redirect("/");
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render("auth/login", {
      errorMessage: "An error occurred during login.",
    });
  }
});

// POST /auth/logout
router.post("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).render("auth/login", {
        errorMessage: "An error occurred during logout.",
      });
      return;
    }
    res.redirect("/");
  });
});

module.exports = router;
