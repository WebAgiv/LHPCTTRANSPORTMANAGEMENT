'use strict';
const { query } = require('../config/db');

const stats = async (req, res, next) => {
  try {
    const [[s]]   = await query("SELECT COUNT(*) t, SUM(pass_status='active') a, SUM(pass_status='pending') p FROM students");
    const [[rev]] = await query("SELECT COALESCE(SUM(amount),0) total, COUNT(*) txns FROM payments WHERE status='success' AND academic_year='2025-26'");
    const [[rt]]  = await query('SELECT COUNT(*) t, SUM(is_active) a FROM routes');
    const [[dr]]  = await query("SELECT COUNT(*) t, SUM(status='on-duty') od FROM drivers");
    const [[nt]]  = await query('SELECT COUNT(*) c FROM notices WHERE is_active=1');
    const [[al]]  = await query('SELECT COUNT(*) c FROM activity_log WHERE is_read=0');
    res.json({ success: true, data: {
      students: s.t||0, active_passes: s.a||0, pending_students: s.p||0,
      total_collected: rev.total||0, txn_count: rev.txns||0,
      routes: rt.t||0, active_routes: rt.a||0,
      drivers: dr.t||0, on_duty: dr.od||0,
      active_notices: nt.c||0, unread_activity: al.c||0,
    }});
  } catch (e) { next(e); }
};

const recentPayments = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT p.*,s.full_name,s.student_code,r.route_name FROM payments p
       LEFT JOIN students s ON p.student_id=s.id LEFT JOIN routes r ON p.route_id=r.id
       ORDER BY p.payment_date DESC LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const routeCollection = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT r.route_name, r.annual_fare_typical, r.capacity,
              COUNT(s.id) enrolled, COALESCE(SUM(p.amount),0) collected
       FROM routes r
       LEFT JOIN students s ON s.route_id=r.id AND s.pass_status!='suspended'
       LEFT JOIN payments p ON p.student_id=s.id AND p.status='success'
       WHERE r.is_active=1 GROUP BY r.id ORDER BY collected DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

module.exports = { stats, recentPayments, routeCollection };
