const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer.model');

// GET /api/customers - Get all customers
router.get('/', async (req, res, next) => {
    try {
        const customers = await Customer.getAllCustomers();
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', async (req, res, next) => {
    try {
        const customer = await Customer.getCustomerById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        next(error);
    }
});

// GET /api/customers/:id/loans - Get all loans for a specific customer
router.get('/:id/loans', async (req, res, next) => {
    try {
        const customerId = req.params.id;
        
        // First check if the customer exists
        const customer = await Customer.getCustomerById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        // Get all loans for the customer
        const loans = await Customer.getCustomerLoans(customerId);
        res.json(loans);
    } catch (error) {
        next(error);
    }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res, next) => {
    try {
        const newCustomer = await Customer.createCustomer(req.body);
        res.status(201).json(newCustomer);
    } catch (error) {
        next(error);
    }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res, next) => {
    try {
        const updatedCustomer = await Customer.updateCustomer(req.params.id, req.body);
        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(updatedCustomer);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res, next) => {
    try {
        const deletedCustomer = await Customer.deleteCustomer(req.params.id);
        if (!deletedCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully', customer: deletedCustomer });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 