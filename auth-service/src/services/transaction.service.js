const transactionRepository = require('../database/transaction.repository');
const cardRepository = require('../database/card.repository');
const userRepository = require('../database/user.repository');

class TransactionService {
    async createTransaction(userId, transactionData) {
      // Validate user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
  
      // Validate card exists and belongs to user
      const card = await cardRepository.findById(transactionData.cardId);
      if (!card) {
        throw new Error('Card not found');
      }
      if (card.user_id !== userId) {
        throw new Error('Unauthorized: Card does not belong to user');
      }
  
      // Check card status
      if (card.card_status !== 'active') {
        throw new Error(`Card is ${card.card_status}. Cannot process transaction.`);
      }
  
      // Validate amount
      if (transactionData.amount <= 0) {
        throw new Error('Transaction amount must be greater than 0');
      }
  
      // Validate currency
      const validCurrencies = ['USD', 'EUR', 'CFA'];
      if (!validCurrencies.includes(transactionData.currency)) {
        throw new Error('Invalid currency');
      }
  
    
  
      // Create transaction
      const transaction = await transactionRepository.createTransaction({
        userId,
        cardId: transactionData.cardId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        merchantName: transactionData.merchantName,
        merchantCategory: transactionData.merchantCategory,
        transactionType: 'payment',
        status,
        description: transactionData.description,
        location: transactionData.metadata?.location,
        deviceId: transactionData.metadata?.deviceId,
        ipAddress: transactionData.metadata?.ipAddress,
        fraudScore,
      });
  
      // Update card balance if transaction completed
      if (status === 'completed') {
        await cardRepository.updateCard(card.id, {
          currentBalance: parseFloat(card.current_balance) + parseFloat(transactionData.amount)
        });
      }
  
      return transaction;
    }
  

  
    async getTransactionById(transactionId, userId) {
      const transaction = await transactionRepository.findById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
  
      if (transaction.user_id !== userId) {
        throw new Error('Unauthorized access to transaction');
      }
  
      return transaction;
    }
  
    async getUserTransactions(userId, filters = {}) {
      return await transactionRepository.findByUserId(userId, filters);
    }
  
    async getAllTransactions(filters = {}) {
      // Admin only
      return await transactionRepository.findAll(filters);
    }
  
    async deleteTransaction(transactionId, userId) {
      const transaction = await transactionRepository.findById(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
  
      if (transaction.user_id !== userId) {
        throw new Error('Unauthorized to delete this transaction');
      }
  
      // Only allow deletion of pending or failed transactions
      if (transaction.status === 'completed') {
        throw new Error('Cannot delete completed transactions');
      }
  
      return await transactionRepository.deleteTransaction(transactionId);
    }
  
    async getTransactionStats(userId) {
      return await transactionRepository.getStatsByUserId(userId);
    }
  }
  
  module.exports = new TransactionService();