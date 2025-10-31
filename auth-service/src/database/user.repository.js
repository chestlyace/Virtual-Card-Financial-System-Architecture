const { v4: uuidv4 } = require('uuid');
const { getPool } = require('./mysql');

async function createUser({ email, passwordHash, name }) {
  const pool = getPool();
  const id = uuidv4();
  const sql = `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`;
  await pool.execute(sql, [id, email, passwordHash, name || null]);
  return findById(id);
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
  return rows[0] || null;
}

async function updateUser(id, updates) {
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
}

async function deleteUser(id) {
  const pool = getPool();
  const [res] = await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
  return res.affectedRows > 0;
}

module.exports = {
  createUser,
  findById,
  findByEmail,
  updateUser,
  deleteUser,
};


