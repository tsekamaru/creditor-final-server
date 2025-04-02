const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction.model');

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.getAllTransactions();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.getTransactionById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all transactions for a specific customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        const transactions = await Transaction.getCustomerTransactions(req.params.customerId);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all transactions for a specific loan
router.get('/loan/:loanId', async (req, res) => {
    try {
        const transactions = await Transaction.getLoanTransactions(req.params.loanId);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new transaction
router.post('/', async (req, res) => {
    try {
        const transaction = await Transaction.createTransaction(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update transaction
router.put('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.updateTransaction(req.params.id, req.body);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.deleteTransaction(req.params.id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 