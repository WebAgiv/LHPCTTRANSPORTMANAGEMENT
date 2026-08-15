'use strict';
const Payment  = require('../models/Payment');
const { query }  = require('../config/db');
const { paginate, calcPaymentPlan } = require('../utils/helpers');
const logger   = require('../utils/logger');

const get        = async (req, res, next) => {
  try {
    const { offset, limit, page } = paginate(req.query.page, req.query.limit);
    const rows = await Payment.findAll({ ...req.query, offset, limit });
    res.json({ success: true, data: rows, meta: { page, limit, count: rows.length } });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const result = await Payment.create({ ...req.body, collected_by: req.user.id });
    const [[stu]] = await query('SELECT full_name FROM students WHERE id=?', [req.body.student_id]);
    await query('INSERT INTO activity_log (type,title,body,user_id,related_id) VALUES (?,?,?,?,?)',
      ['payment',
       `Payment ₹${result.amount.toLocaleString('en-IN')} — ${stu?.full_name}`,
       `${result.plan === 'single' ? 'Single' : `Inst ${result.installment_no}/${result.installment_of}`} | ${(req.body.method||'cash').toUpperCase()} | ${result.payment_ref}`,
       req.user.id, result.payment_ref]);
    logger.info(`Payment: ${result.payment_ref} ₹${result.amount} by ${req.user.username}`);
    res.status(201).json({ success: true, message: 'Payment recorded', data: result });
  } catch (e) { next(e); }
};

const summary      = async (req, res, next) => { try { res.json({ success: true, data: await Payment.summary() }); } catch (e) { next(e); } };
const overdue      = async (req, res, next) => { try { const d = await Payment.overdue(); res.json({ success: true, data: d, count: d.length }); } catch (e) { next(e); } };
const forStudent   = async (req, res, next) => { try { res.json({ success: true, ...(await Payment.forStudent(req.params.id)) }); } catch (e) { next(e); } };
const planCheck    = (req, res)              => res.json({ success: true, data: calcPaymentPlan(parseInt(req.params.annual_fare) || 0) });

module.exports = { get, create, summary, overdue, forStudent, planCheck };
