const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan.model');
const { verifyToken, isAdmin } = require('../middleware/jwtAuth');

// GET /loans - Get all loans (Admin and Employee only)
router.get('/', verifyToken, async (req, res, next) => {
    try {
        // Only admin and employees can see all loans
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can view all loans.'
            });
        }

        const loans = await Loan.getAllLoans();
        res.json({
            success: true,
            loans
        });
    } catch (error) {
        next(error);
    }
});

// GET /loans/:id - Get single loan
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const loan = await Loan.getLoanById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Customers can only view their own loans
        if (req.user.role === 'customer' && req.user.id !== loan.customer_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own loans.'
            });
        }

        res.json({
            success: true,
            loan
        });
    } catch (error) {
        next(error);
    }
});

// POST /loans - Create new loan (Admin and Employee only)
router.post('/', verifyToken, async (req, res, next) => {
    try {
        // Only admin and employees can create loans
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can create loans.'
            });
        }

        const newLoan = await Loan.createLoan(req.body);
        res.status(201).json({
            success: true,
            loan: newLoan
        });
    } catch (error) {
        next(error);
    }
});

// PUT /loans/:id - Update loan (Admin and Employee only)
router.put('/:id', verifyToken, async (req, res, next) => {
    try {
        // Only admin and employees can update loans
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can update loans.'
            });
        }

        const updatedLoan = await Loan.updateLoan(req.params.id, req.body);
        if (!updatedLoan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        res.json({
            success: true,
            loan: updatedLoan
        });
    } catch (error) {
        next(error);
    }
});

// PUT /loans/:id/payment - Update loan payment (Customer, Employee, and Admin)
router.put('/:id/payment', verifyToken, async (req, res, next) => {
    try {
        // First get the loan to check ownership
        const loan = await Loan.getLoanById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Customers can only make payments on their own loans
        if (req.user.role === 'customer' && req.user.id !== loan.customer_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only make payments on your own loans.'
            });
        }

        const updatedLoan = await Loan.updateLoanViaPayment(req.params.id, req.body);
        res.json({
            success: true,
            loan: updatedLoan
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /loans/:id - Delete a loan and its related transactions (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res, next) => {
    try {
        const deletedLoan = await Loan.deleteLoan(req.params.id);
        if (!deletedLoan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }
        res.json({
            success: true,
            message: 'Loan deleted successfully',
            loan: deletedLoan
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 