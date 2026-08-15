'use strict';
const bcrypt   = require('bcryptjs');
const { query } = require('../config/db');

class User {
  static async findByUsername(username) {
    const [rows] = await query('SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1', [username.toLowerCase()]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await query('SELECT id,username,role,full_name,email,phone,last_login,created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ username, password, role, full_name, email, phone }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await query(
      'INSERT INTO users (username,password_hash,role,full_name,email,phone) VALUES (?,?,?,?,?,?)',
      [username.toLowerCase(), hash, role, full_name, email, phone]
    );
    return result.insertId;
  }

  static async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
    await query('DELETE FROM sessions WHERE user_id = ?', [id]);
  }

  static async verifyPassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  }

  static async updateLastLogin(id) {
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
  }
}

module.exports = User;
