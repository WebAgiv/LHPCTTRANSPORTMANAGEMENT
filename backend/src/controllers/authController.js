'use strict';
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { query } = require('../config/db');
const logger = require('../utils/logger');

function signToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password are required' });

    const user = await User.findByUsername(username);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const payload      = { id: user.id, username: user.username, role: user.role, name: user.full_name };
    const accessToken  = signToken(payload, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '24h');
    const refreshToken = signToken({ id: user.id }, process.env.JWT_REFRESH_SECRET, '30d');

    await query(
      'INSERT INTO sessions (user_id,refresh_token,ip_address,expires_at) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL 30 DAY))',
      [user.id, refreshToken, req.ip]
    );
    await User.updateLastLogin(user.id);
    await query('INSERT INTO activity_log (type,title,body,user_id) VALUES (?,?,?,?)',
      ['login', `${user.full_name} logged in`, `Role:${user.role} IP:${req.ip}`, user.id]);

    logger.info(`Login: ${user.username} (${user.role}) from ${req.ip}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, username: user.username, role: user.role, name: user.full_name, email: user.email },
      },
    });
  } catch (err) { next(err); }
}

/** POST /api/auth/refresh */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    let decoded;
    try { decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
    catch { return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' }); }

    const [sessions] = await query(
      'SELECT * FROM sessions WHERE user_id=? AND refresh_token=? AND expires_at > NOW()',
      [decoded.id, refreshToken]
    );
    if (!sessions.length) return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const accessToken = signToken(
      { id: user.id, username: user.username, role: user.role, name: user.full_name },
      process.env.JWT_SECRET, '24h'
    );
    res.json({ success: true, data: { accessToken } });
  } catch (err) { next(err); }
}

/** POST /api/auth/logout */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await query('DELETE FROM sessions WHERE refresh_token=?', [refreshToken]);
    await query('DELETE FROM sessions WHERE user_id=? AND expires_at < NOW()', [req.user.id]);
    logger.info(`Logout: ${req.user.username}`);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

/** POST /api/auth/change-password */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const [rows] = await query('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    const valid = await User.verifyPassword(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    await User.updatePassword(req.user.id, newPassword);
    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (err) { next(err); }
}

/** POST /api/auth/student-first-login */
async function studentFirstLogin(req, res, next) {
  try {
    const { college_id, phone, password, route_id, stop_id } = req.body;
    if (!college_id || !phone || !password || !route_id)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const [students] = await query(
      'SELECT * FROM students WHERE student_code=? AND phone=?',
      [college_id.toUpperCase(), phone]
    );
    if (!students.length)
      return res.status(404).json({ success: false, message: 'Student not found. Verify your College ID and mobile number.' });

    const s = students[0];
    if (s.user_id)
      return res.status(409).json({ success: false, message: 'Account already exists. Please login normally.' });

    const userId = await User.create({ username: college_id.toLowerCase(), password, role: 'student', full_name: s.full_name, email: s.email, phone });
    await query('UPDATE students SET user_id=?,route_id=?,stop_id=? WHERE id=?', [userId, route_id, stop_id || null, s.id]);
    await query('INSERT INTO activity_log (type,title,body,user_id,related_id) VALUES (?,?,?,?,?)',
      ['registration', `New Account: ${s.full_name}`, `First login: ${college_id}`, userId, college_id]);

    logger.info(`Student first login: ${college_id}`);
    res.status(201).json({ success: true, message: 'Account created! You can now login.', data: { username: college_id.toLowerCase() } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Username already taken. Please login.' });
    next(err);
  }
}

/** GET /api/auth/me */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

module.exports = { login, refresh, logout, changePassword, studentFirstLogin, me };
