const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer.model');
const { verifyToken, isAdmin } = require('../middleware/jwtAuth');

// GET /api/customers - Get all customers (Admin and Employee only)
router.get('/', verifyToken, async (req, res, next) => {
    try {
        // Only admin and employees can see all customers
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can view all customers.'
            });
        }

        const customers = await Customer.getAllCustomers();
        res.json({
            success: true,
            customers
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        // Customers can only view their own profile
        // Admin and employees can view any customer
        if (req.user.role === 'customer' && req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own profile.'
            });
        }

        const customer = await Customer.getCustomerById(req.params.id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        res.json({
            success: true,
            customer
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/customers/:id/loans - Get all loans for a specific customer
router.get('/:id/loans', verifyToken, async (req, res, next) => {
    try {
        const customerId = req.params.id;
        
        // Customers can only view their own loans
        // Admin and employees can view any customer's loans
        if (req.user.role === 'customer' && req.user.id !== parseInt(customerId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own loans.'
            });
        }
        
        // First check if the customer exists
        const customer = await Customer.getCustomerById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // Get all loans for the customer
        const loans = await Customer.getCustomerLoans(customerId);
        res.json({
            success: true,
            loans
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/customers - Create new customer (Admin and Employee only)
router.post('/', verifyToken, async (req, res, next) => {
    try {
        // Only admin and employees can create customers
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can create customers.'
            });
        }

        const newCustomer = await Customer.createCustomer(req.body);
        res.status(201).json({
            success: true,
            customer: newCustomer
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/customers/:id - Update customer (Admin and Employee only)
router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        // Only admin and employees can update customers
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can update customers.'
            });
        }

        const updatedCustomer = await Customer.updateCustomer(req.params.id, req.body);
        if (!updatedCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        res.json({
            success: true,
            customer: updatedCustomer
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/customers/:id - Delete customer (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const deletedCustomer = await Customer.deleteCustomer(req.params.id);
        if (!deletedCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        res.json({
            success: true,
            message: 'Customer deleted successfully',
            customer: deletedCustomer
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 