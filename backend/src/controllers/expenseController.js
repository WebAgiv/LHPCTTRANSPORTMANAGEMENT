'use strict';
const { query } = require('../config/db');
const logger = require('../utils/logger');

const get = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT e.*, b.bus_number, d.full_name AS driver_name FROM expenses e
       LEFT JOIN buses b ON e.bus_id=b.id LEFT JOIN drivers d ON e.driver_id=d.id
       ORDER BY e.expense_date DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { bus_id, driver_id, expense_type, amount, expense_date, description, litres } = req.body;
    const doc  = req.file ? `/uploads/bills/${req.file.filename}` : null;
    const code = 'EXP' + Date.now().toString().slice(-8);
    await query(
      'INSERT INTO expenses (expense_code,bus_id,driver_id,expense_type,amount,expense_date,description,document_path,litres,submitted_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [code, bus_id, driver_id, expense_type, amount, expense_date, description, doc, litres||null, req.user.id]
    );
    logger.info(`Expense ${code} submitted by ${req.user.username}`);
    res.status(201).json({ success: true, message: 'Expense submitted for approval' });
  } catch (e) { next(e); }
};

const approve = async (req, res, next) => {
  try { await query('UPDATE expenses SET status="approved",approved_by=?,approved_at=NOW() WHERE id=?', [req.user.id, req.params.id]); res.json({ success: true, message: 'Approved' }); }
  catch (e) { next(e); }
};

const reject = async (req, res, next) => {
  try { await query('UPDATE expenses SET status="rejected",approved_by=?,approved_at=NOW() WHERE id=?', [req.user.id, req.params.id]); res.json({ success: true, message: 'Rejected' }); }
  catch (e) { next(e); }
};

module.exports = { get, create, approve, reject };
