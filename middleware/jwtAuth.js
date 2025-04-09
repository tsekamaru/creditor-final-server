const jwt = require('jsonwebtoken');
const db = require('../db');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists in database
        const result = await db.query(
            'SELECT id, role, phone_number, email, created_at, updated_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (!result.rows[0]) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin only.' 
        });
    }
    next();
};

const isEmployee = (req, res, next) => {
    if (req.user.role !== 'employee') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Employee only.' 
        });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    isEmployee
}; 