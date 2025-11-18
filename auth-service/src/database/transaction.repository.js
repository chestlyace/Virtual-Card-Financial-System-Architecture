const { v4: uuidv4 } = require('uuid');
const { getPool } = require('./mysql');

function mapDbError(err) {
  const msg = (err && err.code) ? `Database error (${err.code})` : 'Database error';
  const e = new Error(msg);
  e.original = err;
  return e;
}

async function createTransaction({
  userId,
  cardId,
  amount,
  currency,
  merchantName,
  transactionType,
  status,
  description,
}) {
  try {
    const pool = getPool();
    const id = uuidv4();
    const sql = `
      INSERT INTO transactions (
        id, user_id, card_id, amount, currency, merchant_name,
         transaction_type, status, description,
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(sql, [
      id,
      userId,
      cardId,
      amount,
      currency,
      merchantName,
      transactionType || 'payment',
      status || 'pending',
      description || null,
    ]);
    return findById(id);
  } catch (err) {
    throw mapDbError(err);
  }
}

async function findById(id) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(`SELECT * FROM transactions WHERE id = ?`, [id]);
    return rows[0] || null;
  } catch (err) {
    throw mapDbError(err);
  }
}

async function findByUserId(userId, filters = {}) {
  try {
    const pool = getPool();
    let sql = `SELECT * FROM transactions WHERE user_id = ?`;
    const values = [userId];

    // Apply filters
    if (filters.status) {
      sql += ` AND status = ?`;
      values.push(filters.status);
    }

    if (filters.cardId) {
      sql += ` AND card_id = ?`;
      values.push(filters.cardId);
    }

    if (filters.startDate) {
      sql += ` AND timestamp >= ?`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND timestamp <= ?`;
      values.push(filters.endDate);
    }

    sql += ` ORDER BY timestamp DESC`;

    if (filters.limit) {
      sql += ` LIMIT ?`;
      values.push(parseInt(filters.limit));
    }

    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (err) {
    throw mapDbError(err);
  }
}

async function findAll(filters = {}) {
  try {
    const pool = getPool();
    let sql = `SELECT * FROM transactions WHERE 1=1`;
    const values = [];

    if (filters.status) {
      sql += ` AND status = ?`;
      values.push(filters.status);
    }

    sql += ` ORDER BY timestamp DESC LIMIT 100`;

    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (err) {
    throw mapDbError(err);
  }
}

async function updateTransaction(id, updates) {
  try {
    const pool = getPool();
    const fields = [];
    const values = [];

    if (typeof updates.status === 'string') {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (typeof updates.fraudScore === 'number') {
      fields.push('fraud_score = ?');
      values.push(updates.fraudScore);
    }
    if (typeof updates.description !== 'undefined') {
      fields.push('description = ?');
      values.push(updates.description);
    }

    if (fields.length === 0) return findById(id);

    const sql = `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await pool.execute(sql, values);
    return findById(id);
  } catch (err) {
    throw mapDbError(err);
  }
}

async function deleteTransaction(id) {
  try {
    const pool = getPool();
    const [res] = await pool.execute(`DELETE FROM transactions WHERE id = ?`, [id]);
    return res.affectedRows > 0;
  } catch (err) {
    throw mapDbError(err);
  }
}

async function getStatsByUserId(userId) {
  try {
    const pool = getPool();
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount
      FROM transactions
      WHERE user_id = ?
    `;
    const [rows] = await pool.execute(sql, [userId]);
    return rows[0];
  } catch (err) {
    throw mapDbError(err);
  }
}

module.exports = {
  createTransaction,
  findById,
  findByUserId,
  findAll,
  updateTransaction,
  deleteTransaction,
  getStatsByUserId,
};