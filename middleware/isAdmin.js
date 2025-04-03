// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    // Check if user is logged in
    if (!req.session.currentUser) {
        return res.status(401).json({
            message: "Unauthorized. Please log in first."
        });
    }

    // Check if user has admin role
    if (req.session.currentUser.role !== 'admin') {
        return res.status(403).json({
            message: "Forbidden. Admin privileges required."
        });
    }

    // User is admin, proceed to the next middleware/route handler
    next();
};

module.exports = isAdmin; 