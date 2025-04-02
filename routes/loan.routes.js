const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan.model');

// GET /loans - Get all loans
router.get('/', async (req, res, next) => {
    try {
        const loans = await Loan.getAllLoans();
        res.json(loans);
    } catch (error) {
        next(error);
    }
});

// GET /loans/:id - Get single loan
router.get('/:id', async (req, res, next) => {
    try {
        const loan = await Loan.getLoanById(req.params.id);
        res.json(loan);
    } catch (error) {
        next(error);
    }
});

// POST /loans - Create new loan
router.post('/', async (req, res, next) => {
    try {
        const newLoan = await Loan.createLoan(req.body);
        res.json(newLoan);
    } catch (error) {
        next(error);
    }
});

// PUT /loans/:id - Update loan (Internal use only)
router.put('/:id', async (req, res, next) => {
    try {
        const updatedLoan = await Loan.updateLoan(req.params.id, req.body);
        res.json(updatedLoan);
    } catch (error) {
        next(error);
    }
});

// PUT /loans/:id/payment - Update loan payment (Customer use)
router.put('/:id/payment', async (req, res, next) => {
    try {
        const updatedLoan = await Loan.updateLoanViaPayment(req.params.id, req.body);
        res.json(updatedLoan);
    } catch (error) {
        next(error);
    }
});

// DELETE /loans/:id - Delete a loan and its related transactions (Admin only)
router.delete('/:id', async (req, res, next) => {
    try {
        // Check if user is authenticated and has admin role
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can delete loans.' 
            });
        }

        const deletedLoan = await Loan.deleteLoan(req.params.id);
        if (!deletedLoan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        res.json({ message: 'Loan deleted successfully', loan: deletedLoan });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 