'use strict';
const { query } = require('../config/db');

const get = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const type  = req.query.type;
    let w = ['1=1'], p = [];
    if (type) { w.push('a.type=?'); p.push(type); }
    const [rows] = await query(
      `SELECT a.*, u.full_name AS user_name FROM activity_log a
       LEFT JOIN users u ON a.user_id=u.id
       WHERE ${w.join(' AND ')} ORDER BY a.created_at DESC LIMIT ?`,
      [...p, limit]
    );
    const [[{ unread }]] = await query('SELECT COUNT(*) AS unread FROM activity_log WHERE is_read=0');
    res.json({ success: true, data: rows, unread });
  } catch (e) { next(e); }
};

const markAllRead = async (req, res, next) => { try { await query('UPDATE activity_log SET is_read=1'); res.json({ success: true }); } catch (e) { next(e); } };
const markRead    = async (req, res, next) => { try { await query('UPDATE activity_log SET is_read=1 WHERE id=?', [req.params.id]); res.json({ success: true }); } catch (e) { next(e); } };

module.exports = { get, markAllRead, markRead };
