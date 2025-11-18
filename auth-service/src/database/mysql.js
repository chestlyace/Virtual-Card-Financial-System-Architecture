const mysql = require('mysql2/promise');
const config = require('../config/config');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit,
      queueLimit: 0,
    });
  }
  return pool;
}

async function ensureDatabase() {
  // Connect without selecting database to ensure it exists
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } finally {
    await conn.end();
  }
}

async function initSchema() {
  // Ensure DB exists before creating tables
  await ensureDatabase();

  const sql = `
    CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NULL,
      first_name VARCHAR(100) NULL,
      last_name VARCHAR(100) NULL,
      phone_number VARCHAR(20) NULL,
      is_email_verified BOOLEAN DEFAULT FALSE,
      kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
      account_status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_email (email),
      INDEX idx_account_status (account_status),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  const pool = getPool();
  await pool.query(sql);

  // Add role column to existing tables if it doesn't exist
  try {
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);
    
    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
        AFTER account_status
      `);
      console.log('Added role column to users table');
    }
  } catch (err) {
    console.warn('Warning: Could not add role column:', err.message);
  }

   // Cards table
   await pool.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      card_token VARCHAR(255) NOT NULL,
      last_four VARCHAR(4) NOT NULL,
      card_brand VARCHAR(50) DEFAULT 'visa',
      expiry_month INT NOT NULL,
      expiry_year INT NOT NULL,
      card_status ENUM('active', 'inactive', 'frozen', 'expired') DEFAULT 'active',
      current_balance DECIMAL(10, 2) DEFAULT 0.00,
      currency VARCHAR(3) DEFAULT 'USD',
      card_nickname VARCHAR(100) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_card_status (card_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

   // Transactions table
   await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      card_id CHAR(36) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      merchant_name VARCHAR(255) NOT NULL,
      transaction_type ENUM('payment', 'refund', 'chargeback') DEFAULT 'payment',
      status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
      description TEXT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_card_id (card_id),
      INDEX idx_status (status),
      INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log(' Database schema initialized successfully');
}

module.exports = {
  getPool,
  initSchema,
};

