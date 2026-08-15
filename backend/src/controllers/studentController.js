'use strict';
const Student  = require('../models/Student');
const QRCode   = require('qrcode');
const { query }  = require('../config/db');
const { paginate } = require('../utils/helpers');
const logger   = require('../utils/logger');

const get    = async (req, res, next) => {
  try {
    const { offset, limit, page } = paginate(req.query.page, req.query.limit);
    const rows = await Student.findAll({ ...req.query, offset, limit });
    res.json({ success: true, data: rows, meta: { page, limit, count: rows.length } });
  } catch (e) { next(e); }
};

const getOne = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const result = await Student.create(req.body);
    await query('INSERT INTO activity_log (type,title,body,user_id,related_id) VALUES (?,?,?,?,?)',
      ['registration', `New Student: ${req.body.full_name}`, result.student_code, req.user.id, result.student_code]);
    logger.info(`Student registered: ${result.student_code} by ${req.user.username}`);
    res.status(201).json({ success: true, message: 'Student registered', data: result });
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    await Student.update(req.params.id, req.body);
    res.json({ success: true, message: 'Student updated' });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    await Student.suspend(req.params.id);
    res.json({ success: true, message: 'Student suspended' });
  } catch (e) { next(e); }
};

const getQR = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const qrRaw    = `AITRC|${student.student_code}|${student.pass_valid_to}|${student.pass_status}`;
    const qrDataUrl = await QRCode.toDataURL(qrRaw, { width: 300, margin: 2, color: { dark: '#0D2260', light: '#ffffff' } });
    res.json({ success: true, data: { qrDataUrl, qrRaw, student } });
  } catch (e) { next(e); }
};

const bulkImport = async (req, res, next) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || !students.length)
      return res.status(400).json({ success: false, message: 'Students array is required' });
    const result = await Student.bulkInsert(students);
    await query('INSERT INTO activity_log (type,title,body,user_id) VALUES (?,?,?,?)',
      ['bulk_upload', 'Bulk Import', `${result.ok} imported, ${result.skip} skipped`, req.user.id]);
    res.json({ success: true, message: `${result.ok} imported, ${result.skip} skipped`, data: result });
  } catch (e) { next(e); }
};

module.exports = { get, getOne, create, update, remove, getQR, bulkImport };
