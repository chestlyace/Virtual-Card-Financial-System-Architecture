const express = require('express');
const router = express.Router();
const transactionService = require('../services/transaction.service');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// CREATE - New Transaction
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactionData = req.body;

    const transaction = await transactionService.createTransaction(userId, transactionData);

    res.status(201).json({
      status: 'success',
      data: { transaction },
      message: 'Transaction created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// READ - Get all transactions for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      status: req.query.status,
      cardId: req.query.cardId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const transactions = await transactionService.getUserTransactions(userId, filters);

    res.status(200).json({
      status: 'success',
      data: { 
        transactions,
        count: transactions.length,
      },
      message: 'Transactions retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// READ - Get transaction stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await transactionService.getTransactionStats(userId);

    res.status(200).json({
      status: 'success',
      data: { stats },
      message: 'Transaction stats retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// READ - Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactionId = req.params.id;

    const transaction = await transactionService.getTransactionById(transactionId, userId);

    res.status(200).json({
      status: 'success',
      data: { transaction },
      message: 'Transaction retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = error.message === 'Transaction not found' ? 404 : 
                       error.message.includes('Unauthorized') ? 403 : 500;
    
    res.status(statusCode).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// DELETE - Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactionId = req.params.id;

    const deleted = await transactionService.deleteTransaction(transactionId, userId);

    res.status(200).json({
      status: 'success',
      data: { deleted },
      message: 'Transaction deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = error.message === 'Transaction not found' ? 404 : 
                       error.message.includes('Unauthorized') ? 403 : 400;
    
    res.status(statusCode).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;