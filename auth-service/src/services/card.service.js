const cardRepository = require('../database/card.repository');
const userRepository = require('../database/user.repository');

class CardService {
    async createCard(userId, cardData) {
      // Validate user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
  
      // Check if user has verified KYC
      if (user.kyc_status !== 'verified') {
        throw new Error('KYC verification required before creating cards');
      }
  
      // Check card limit (max 5 active cards per user)
      const activeCardCount = await cardRepository.countActiveCardsByUserId(userId);
      if (activeCardCount >= 5) {
        throw new Error('Maximum card limit reached (5 cards per user)');
      }
  
      // In production, call third-party card issuer API (Stripe Issuing, etc.)
      // For now, we'll simulate card creation
      const mockCardToken = `tok_${Math.random().toString(36).substring(2, 15)}`;
      const mockLastFour = Math.floor(1000 + Math.random() * 9000).toString();
  
      // Create card in database
      const card = await cardRepository.createCard({
        userId,
        cardToken: mockCardToken,
        lastFour: mockLastFour,
        cardBrand: cardData.cardBrand || 'visa',
        expiryMonth: cardData.expiryMonth || 12,
        expiryYear: cardData.expiryYear || new Date().getFullYear() + 3,
        currency: cardData.currency || 'USD',
        cardNickname: cardData.cardNickname || null,
      });
  
      return card;
    }   
    async getCardById(cardId, userId) {
        const card = await cardRepository.findById(cardId);
        
        if (!card) {
          throw new Error('Card not found');
        }
    
        // Ensure user owns the card
        if (card.user_id !== userId) {
          throw new Error('Unauthorized access to card');
        }
    
        return card;
      }
    
      async getUserCards(userId) {
        return await cardRepository.findByUserId(userId);
      }
    
      async updateCard(cardId, userId, updates) {
        const card = await cardRepository.findById(cardId);
        
        if (!card) {
          throw new Error('Card not found');
        }
    
        if (card.user_id !== userId) {
          throw new Error('Unauthorized to update this card');
        }
    
        return await cardRepository.updateCard(cardId, updates);
      }
    
      async deleteCard(cardId, userId) {
        const card = await cardRepository.findById(cardId);
        
        if (!card) {
          throw new Error('Card not found');
        }
    
        if (card.user_id !== userId) {
          throw new Error('Unauthorized to delete this card');
        }
    
        return await cardRepository.deleteCard(cardId);
      }
    
      async freezeCard(cardId, userId) {
        return await this.updateCard(cardId, userId, { cardStatus: 'frozen' });
      }
    
      async unfreezeCard(cardId, userId) {
        return await this.updateCard(cardId, userId, { cardStatus: 'active' });
      }
    }
    
    module.exports = new CardService();