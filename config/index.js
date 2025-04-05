// ℹ️ Core middleware imports
const express = require("express");                // Express framework
const logger = require("morgan");                 // Request logging
const cookieParser = require("cookie-parser");    // Cookie parsing
const path = require("path");                     // Path utilities

// Middleware configuration
module.exports = (app) => {
  // Development logging
  app.use(logger("dev"));

  // Request body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // View engine setup
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("view engine", "hbs");
};
