module.exports = (app) => {
  // Handle 404 errors
  app.use((req, res, next) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found',
      path: req.path,
      method: req.method
    });
  });

  // Handle all other errors
  app.use((err, req, res, next) => {
    // Log the error for debugging
    console.error("ERROR: ", req.method, req.path, err);

    // Determine the status code
    const statusCode = err.status || 500;

    // Send JSON response
    res.status(statusCode).json({
      error: err.name || 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
      path: req.path,
      method: req.method,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });
};
