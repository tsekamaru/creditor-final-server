// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
const db = require("./db");

// Handles http requests (express is node js framework)
const express = require("express");

// Handles the handlebars
const hbs = require("hbs");

const logger = require("morgan");
const path = require("path");
const favicon = require("serve-favicon");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const loanRoutes = require('./routes/loan.routes');
app.use('/api/loans', loanRoutes);

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

const employeeRoutes = require('./routes/employee.routes');
app.use('/api/employees', employeeRoutes);

const customerRoutes = require('./routes/customer.routes');
app.use('/api/customers', customerRoutes);

const transactionRoutes = require('./routes/transaction.routes');
app.use('/api/transactions', transactionRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

// Test database connection
db.pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Successfully connected to PostgreSQL');
    done();
  }
});

module.exports = app;
