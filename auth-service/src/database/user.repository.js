const { v4: uuidv4 } = require('uuid');
const { getPool } = require('./mysql');

function mapDbError(err) {
  const msg = (err && err.code) ? `Database error (${err.code})` : 'Database error';
  const e = new Error(msg);
  e.original = err;
  return e;
}

async function createUser({ email, passwordHash, name }) {
  try {
    const pool = getPool();
    const id = uuidv4();
    const sql = `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`;
    await pool.execute(sql, [id, email, passwordHash, name || null]);
    return findById(id);
  } catch (err) {
    throw mapDbError(err);
  }
}

async function findById(id) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
    return rows[0] || null;
  } catch (err) {
    throw mapDbError(err);
  }
}

async function findByEmail(email) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    return rows[0] || null;
  } catch (err) {
    throw mapDbError(err);
  }
}

async function updateUser(id, updates) {
  try {
    const pool = getPool();
    const fields = [];
    const values = [];
    if (typeof updates.email === 'string') { fields.push('email = ?'); values.push(updates.email); }
    if (typeof updates.passwordHash === 'string') { fields.push('password_hash = ?'); values.push(updates.passwordHash); }
    if (typeof updates.name !== 'undefined') { fields.push('name = ?'); values.push(updates.name); }
    if (typeof updates.account_status === 'string') { fields.push('account_status = ?'); values.push(updates.account_status); }
    if (fields.length === 0) return findById(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await pool.execute(sql, values);
    return findById(id);
  } catch (err) {
    throw mapDbError(err);
  }
}

async function deleteUser(id) {
  try {
    const pool = getPool();
    const [res] = await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
    return res.affectedRows > 0;
  } catch (err) {
    throw mapDbError(err);
  }
}

module.exports = {
  createUser,
  findById,
  findByEmail,
  updateUser,
  deleteUser,
};

