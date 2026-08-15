'use strict';
const { query } = require('../config/db');
const logger = require('../utils/logger');

const scan = async (req, res, next) => {
  try {
    const { qr_data, action = 'entry' } = req.body;
    if (!qr_data) return res.status(400).json({ success: false, message: 'QR data is required' });

    const parts = qr_data.split('|');
    let result = 'invalid', student = null;

    if (parts[0] === 'AITRC' && parts[1]) {
      const [rows] = await query(
        `SELECT s.*, r.route_name, b.bus_number FROM students s
         LEFT JOIN routes r ON s.route_id=r.id
         LEFT JOIN buses  b ON r.bus_id=b.id
         WHERE s.student_code=? LIMIT 1`,
        [parts[1]]
      );
      if (rows.length) {
        student = rows[0];
        const validTo = new Date(student.pass_valid_to || '2000-01-01');
        result = student.pass_status === 'suspended' ? 'suspended'
               : (student.pass_status === 'expired' || validTo < new Date()) ? 'expired'
               : student.pass_status === 'active'  ? 'valid'
               : 'invalid';
      }
    }

    await query(
      'INSERT INTO security_logs (student_id,scanned_by,action,result,qr_data,ip_address) VALUES (?,?,?,?,?,?)',
      [student?.id || null, req.user.id, action, result, qr_data, req.ip]
    );
    await query('INSERT INTO activity_log (type,title,body,user_id) VALUES (?,?,?,?)',
      ['security', `Gate ${action.toUpperCase()} — ${result.toUpperCase()}`, student?.student_code || 'Unknown', req.user.id]);

    logger.info(`QR Scan: ${student?.student_code || 'unknown'} → ${result}`);
    res.json({ success: true, data: { result, student, action } });
  } catch (e) { next(e); }
};

const logs = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT l.*, s.full_name, s.student_code, u.full_name AS scanned_by_name
       FROM security_logs l
       LEFT JOIN students s ON l.student_id=s.id
       LEFT JOIN users    u ON l.scanned_by=u.id
       ORDER BY l.scan_time DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

module.exports = { scan, logs };
