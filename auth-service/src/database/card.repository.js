const { v4: uuidv4 } = require('uuid');
const { getPool } = require('./mysql');

function mapDbError(err) {
    const msg = (err && err.code) ? `Database error (${err.code})` : 'Database error';
    const e = new Error(msg);
    e.original = err;
    return e;
  }

  async function createCard({ userId, cardToken, lastFour, cardBrand, expiryMonth, expiryYear, spendingLimit, currency, cardNickname }) {
    try {
      const pool = getPool();
      const id = uuidv4();
      const sql = `
        INSERT INTO cards (
          id, user_id, card_token, last_four, card_brand, 
          expiry_month, expiry_year, currency, card_nickname
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await pool.execute(sql, [
        id,
        userId,
        cardToken,
        lastFour,
        cardBrand || 'visa',
        expiryMonth,
        expiryYear,
        currency || 'USD',
        cardNickname || null
      ]);
      return findById(id);
  } catch (err) {
    throw mapDbError(err);
  }
}

async function findById(id) {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(`SELECT * FROM cards WHERE id = ?`, [id]);
      return rows[0] || null;
    } catch (err) {
      throw mapDbError(err);
    }
  }

  async function findByUserId(userId) {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(
        `SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } catch (err) {
      throw mapDbError(err);
    }
  }
  
  async function countActiveCardsByUserId(userId) {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count FROM cards WHERE user_id = ? AND card_status = 'active'`,
        [userId]
      );
      return rows[0].count;
    } catch (err) {
      throw mapDbError(err);
    }
  }
  
  async function updateCard(id, updates) {
    try {
      const pool = getPool();
      const fields = [];
      const values = [];
  
      if (typeof updates.cardStatus === 'string') {
        fields.push('card_status = ?');
        values.push(updates.cardStatus);
      }

      if (typeof updates.currentBalance === 'number') {
        fields.push('current_balance = ?');
        values.push(updates.currentBalance);
      }
      if (typeof updates.cardNickname !== 'undefined') {
        fields.push('card_nickname = ?');
        values.push(updates.cardNickname);
      }
  
      if (fields.length === 0) return findById(id);
  
      const sql = `UPDATE cards SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      await pool.execute(sql, values);
      return findById(id);
    } catch (err) {
      throw mapDbError(err);
    }
  }
  
  async function deleteCard(id) {
    try {
      const pool = getPool();
      const [res] = await pool.execute(`DELETE FROM cards WHERE id = ?`, [id]);
      return res.affectedRows > 0;
    } catch (err) {
      throw mapDbError(err);
    }
  }
  
  module.exports = {
    createCard,
    findById,
    findByUserId,
    countActiveCardsByUserId,
    updateCard,
    deleteCard,
  };
  