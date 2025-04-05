const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { verifyToken, isAdmin } = require('../middleware/jwtAuth');

// GET /api/users - Get all users (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT id, role, phone_number, email, created_at, updated_at FROM users ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/users - Create new user (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const { role, phone_number, email, password } = req.body;

        // Validation - email is optional
        if (!role || !phone_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'Role, phone number, and password are required.'
            });
        }

        // Check if phone number already exists
        const phoneCheck = await db.query(
            'SELECT * FROM users WHERE phone_number = $1',
            [phone_number]
        );

        if (phoneCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already exists.'
            });
        }

        // If email is provided, check if it exists
        if (email) {
            const emailCheck = await db.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            if (emailCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            `INSERT INTO users 
             (role, phone_number, email, password_hash) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, role, phone_number, email, created_at, updated_at`,
            [role, phone_number, email || null, hashedPassword]
        );

        res.status(201).json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/users/:id - Get single user
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        // Users can only view their own profile unless they're admin
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You can only view your own profile.' 
            });
        }

        const result = await db.query(
            'SELECT id, role, phone_number, email, created_at, updated_at FROM users WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        // Users can only update their own profile unless they're admin
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You can only update your own profile.' 
            });
        }

        const { phone_number, email } = req.body;
        
        // Basic validation - only phone number is required
        if (!phone_number) {
            return res.status(400).json({ 
                success: false,
                message: 'Phone number is required.' 
            });
        }

        // If email is provided, check if it exists for other users
        if (email) {
            const emailCheck = await db.query(
                'SELECT * FROM users WHERE email = $1 AND id != $2',
                [email, req.params.id]
            );

            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Email already exists for another user.' 
                });
            }
        }

        const result = await db.query(
            `UPDATE users 
             SET phone_number = $1, email = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 
             RETURNING id, role, phone_number, email, created_at, updated_at`,
            [phone_number, email || null, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, role, phone_number, email, created_at, updated_at',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true,
            message: 'User deleted successfully',
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 