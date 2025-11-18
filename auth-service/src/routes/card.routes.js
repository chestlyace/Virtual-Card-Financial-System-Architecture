const express = require('express');
const router = express.Router();
const cardService = require('../services/card.service');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// CREATE - Create new card
router.post('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const cardData = req.body;
  
      const card = await cardService.createCard(userId, cardData);
  
      res.status(201).json({
        status: 'success',
        data: { card },
        message: 'Card created successfully',
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

  // READ - Get all user's cards
router.get('/', async (req, res) => {
    try {
      const userId = req.user.userId;
      const cards = await cardService.getUserCards(userId);
  
      res.status(200).json({
        status: 'success',
        data: { cards, count: cards.length },
        message: 'Cards retrieved successfully',
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
  

  // READ - Get single card
router.get('/:id', async (req, res) => {
    try {
      const userId = req.user.userId;
      const cardId = req.params.id;
  
      const card = await cardService.getCardById(cardId, userId);
  
      res.status(200).json({
        status: 'success',
        data: { card },
        message: 'Card retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const statusCode = error.message === 'Card not found' ? 404 : 
                         error.message.includes('Unauthorized') ? 403 : 500;
      
      res.status(statusCode).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // DELETE - Delete card
router.delete('/:id', async (req, res) => {
    try {
      const userId = req.user.userId;
      const cardId = req.params.id;
  
      const deleted = await cardService.deleteCard(cardId, userId);
  
      res.status(200).json({
        status: 'success',
        data: { deleted },
        message: 'Card deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const statusCode = error.message === 'Card not found' ? 404 : 
                         error.message.includes('Unauthorized') ? 403 : 400;
      
      res.status(statusCode).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // POST - Freeze card
  router.post('/:id/freeze', async (req, res) => {
    try {
      const userId = req.user.userId;
      const cardId = req.params.id;
  
      const card = await cardService.freezeCard(cardId, userId);
  
      res.status(200).json({
        status: 'success',
        data: { card },
        message: 'Card frozen successfully',
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
  
  // POST - Unfreeze card
  router.post('/:id/unfreeze', async (req, res) => {
    try {
      const userId = req.user.userId;
      const cardId = req.params.id;
  
      const card = await cardService.unfreezeCard(cardId, userId);
  
      res.status(200).json({
        status: 'success',
        data: { card },
        message: 'Card unfrozen successfully',
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
  
  module.exports = router;