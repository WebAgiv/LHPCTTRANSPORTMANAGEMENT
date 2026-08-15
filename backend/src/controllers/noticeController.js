'use strict';
const { query } = require('../config/db');
const logger = require('../utils/logger');

const get = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT n.*, u.full_name AS sender_name,
              (SELECT COUNT(*) FROM notice_reads nr WHERE nr.notice_id=n.id AND nr.user_id=?) AS is_read
       FROM notices n LEFT JOIN users u ON n.created_by=u.id
       WHERE n.is_active=1 ORDER BY n.pinned DESC, n.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { title, category, body, urgency='medium', target='All Students', route_id, channels=['portal'], expiry_date } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body are required' });
    const code = 'N' + Date.now().toString().slice(-8);
    const [r] = await query(
      'INSERT INTO notices (notice_code,title,category,body,urgency,target,route_id,channels,expiry_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [code, title, category, body, urgency, target, route_id||null, JSON.stringify(channels), expiry_date||null, req.user.id]
    );
    await query('INSERT INTO activity_log (type,title,body,user_id) VALUES (?,?,?,?)',
      ['notice', `Notice: ${title}`, `Urgency:${urgency}`, req.user.id]);
    logger.info(`Notice posted: ${code} by ${req.user.username}`);
    res.status(201).json({ success: true, message: 'Notice published', data: { id: r.insertId, notice_code: code } });
  } catch (e) { next(e); }
};

const markRead = async (req, res, next) => {
  try {
    await query('INSERT IGNORE INTO notice_reads (notice_id,user_id) VALUES (?,?)', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};

const pin    = async (req, res, next) => { try { await query('UPDATE notices SET pinned=NOT pinned WHERE id=?', [req.params.id]); res.json({ success: true }); } catch (e) { next(e); } };
const update = async (req, res, next) => {
  try {
    const { title, body, urgency, category, expiry_date } = req.body;
    await query('UPDATE notices SET title=?,body=?,urgency=?,category=?,expiry_date=? WHERE id=?', [title, body, urgency, category, expiry_date, req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};
const remove = async (req, res, next) => { try { await query('UPDATE notices SET is_active=0 WHERE id=?', [req.params.id]); res.json({ success: true }); } catch (e) { next(e); } };

module.exports = { get, create, markRead, pin, update, remove };
