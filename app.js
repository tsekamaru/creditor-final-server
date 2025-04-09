// ℹ️ Core imports
const express = require("express");                // Express framework
const dotenv = require("dotenv");                 // Environment variables
const hbs = require("hbs");                       // Handlebars view engine
const cors = require('cors');
const cookieParser = require('cookie-parser');

// ℹ️ Core functionality imports
const db = require("./db/index");                 // Database connection
const config = require("./config/index");         // Application configuration
const { errorHandler, notFoundHandler } = require('./error-handling');

// Environment variables are now loaded in server.js

// Create and configure Express application
const app = express();

// Basic configuration
config(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Handle favicon requests with 204 No Content
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ℹ️ Route imports
const index = require("./routes/index.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const employeeRoutes = require("./routes/employee.routes");
const customerRoutes = require("./routes/customer.routes");
const loanRoutes = require("./routes/loan.routes");
const transactionRoutes = require("./routes/transaction.routes");

// ℹ️ Route setup
app.use("/", index);
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/transactions", transactionRoutes);

// Database connection
db.connect()
    .then(() => console.log("Successfully connected to database"))
    .catch(err => {
        console.error("Failed to connect to database:", err);
        process.exit(1);
    });

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
