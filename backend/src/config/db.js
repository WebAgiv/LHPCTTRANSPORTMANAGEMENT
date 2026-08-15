'use strict';
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

const poolConfig = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'aitrc_transport_erp',
  waitForConnections: true,
  connectionLimit:    parseInt(process.env.DB_POOL_LIMIT || '20'),
  queueLimit:         0,
  timezone:           '+05:30',
  charset:            'utf8mb4',
  connectTimeout:     10000,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
};

const pool = mysql.createPool(poolConfig);

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    logger.info(`✅ MySQL connected → ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    conn.release();
  } catch (err) {
    logger.error(`❌ MySQL connection failed: ${err.message}`);
    process.exit(1);
  }
})();

/**
 * Execute a query with automatic connection management.
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<[Array, object]>}
 */
async function query(sql, params = []) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return [rows, fields];
  } catch (err) {
    logger.error(`DB query error: ${err.message}\nSQL: ${sql}`);
    throw err;
  }
}

module.exports = { pool, query };
