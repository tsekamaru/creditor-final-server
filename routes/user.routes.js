const express = require('express');
const router = express.Router();
const User = require('../models/User.model');

// GET /users - Get all users (Admin only)
router.get('/', async (req, res, next) => {
    try {
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ 
        //         message: 'Access denied. Only administrators can view all users.' 
        //     });
        // }

        const users = await User.getAllUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// GET /users/:id - Get single user
router.get('/:id', async (req, res, next) => {
    try {
        // Users can only view their own profile unless they're admin
        // if (!req.user || (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin')) {
        //     return res.status(403).json({ 
        //         message: 'Access denied. You can only view your own profile.' 
        //     });
        // }

        const user = await User.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// POST /users - Create new user
router.post('/', async (req, res, next) => {
    try {
        const newUser = await User.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
});

// PUT /users/:id - Update user
router.put('/:id', async (req, res, next) => {
    try {
        // Users can only update their own profile unless they're admin
        // if (!req.user || (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin')) {
        //     return res.status(403).json({ 
        //         message: 'Access denied. You can only update your own profile.' 
        //     });
        // }

        const updatedUser = await User.updateUser(req.params.id, req.body);
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
});

// DELETE /users/:id - Delete user (Admin only)
router.delete('/:id', async (req, res, next) => {
    try {
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ 
        //         message: 'Access denied. Only administrators can delete users.' 
        //     });
        // }

        const deletedUser = await User.deleteUser(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
        next(error);
    }
});

// POST /users/login - Authenticate user
router.post('/login', async (req, res, next) => {
    try {
        const { phone_number, password } = req.body;
        const user = await User.authenticateUser(phone_number, password);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }
        
        res.json(user);
    } catch (error) {
        next(error);
    }
});

module.exports = router; 