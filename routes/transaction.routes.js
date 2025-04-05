const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction.model');
const { verifyToken, isAdmin } = require('../middleware/jwtAuth');

// Get all transactions (Admin and Employee only)
router.get('/', verifyToken, async (req, res) => {
    try {
        // Only admin and employees can see all transactions
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can view all transactions.'
            });
        }

        const transactions = await Transaction.getAllTransactions();
        res.json({
            success: true,
            transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get transaction by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const transaction = await Transaction.getTransactionById(req.params.id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Customers can only view their own transactions
        if (req.user.role === 'customer' && req.user.id !== transaction.customer_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own transactions.'
            });
        }

        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all transactions for a specific customer
router.get('/customer/:customerId', verifyToken, async (req, res) => {
    try {
        // Customers can only view their own transactions
        if (req.user.role === 'customer' && req.user.id !== parseInt(req.params.customerId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own transactions.'
            });
        }

        const transactions = await Transaction.getCustomerTransactions(req.params.customerId);
        res.json({
            success: true,
            transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all transactions for a specific loan
router.get('/loan/:loanId', verifyToken, async (req, res) => {
    try {
        // First get the loan to check ownership
        const loan = await Loan.getLoanById(req.params.loanId);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Customers can only view transactions for their own loans
        if (req.user.role === 'customer' && req.user.id !== loan.customer_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view transactions for your own loans.'
            });
        }

        const transactions = await Transaction.getLoanTransactions(req.params.loanId);
        res.json({
            success: true,
            transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new transaction (Admin and Employee only)
router.post('/', verifyToken, async (req, res) => {
    try {
        // Only admin and employees can create transactions
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can create transactions.'
            });
        }

        const transaction = await Transaction.createTransaction(req.body);
        res.status(201).json({
            success: true,
            transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update transaction (Admin and Employee only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        // Only admin and employees can update transactions
        if (req.user.role !== 'admin' && req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators and employees can update transactions.'
            });
        }

        const transaction = await Transaction.updateTransaction(req.params.id, req.body);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete transaction (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.deleteTransaction(req.params.id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        res.json({
            success: true,
            message: 'Transaction deleted successfully',
            transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 