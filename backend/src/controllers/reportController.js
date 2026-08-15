'use strict';
const { query } = require('../config/db');

const routeWise = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT r.id, r.route_name, r.annual_fare_typical, r.capacity,
              b.bus_number, d.full_name AS driver_name,
              COUNT(s.id) AS enrolled,
              COALESCE(SUM(CASE WHEN p.status='success' THEN p.amount END), 0) AS collected,
              COUNT(CASE WHEN s.pass_status='active' THEN 1 END) AS active_passes,
              COUNT(CASE WHEN p.installment_no=1 AND p.status='success' THEN 1 END) AS inst1_paid,
              COUNT(CASE WHEN p.installment_no=2 AND p.status='success' THEN 1 END) AS inst2_paid
       FROM routes r
       LEFT JOIN buses   b  ON r.bus_id    = b.id
       LEFT JOIN drivers d  ON r.driver_id = d.id
       LEFT JOIN students s ON s.route_id  = r.id AND s.pass_status != 'suspended'
       LEFT JOIN payments p ON p.student_id = s.id AND p.academic_year = '2025-26'
       WHERE r.is_active = 1
       GROUP BY r.id ORDER BY collected DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const monthly = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month,
              SUM(amount) AS collected, COUNT(*) AS txns
       FROM payments WHERE status='success'
       GROUP BY month ORDER BY month`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const expenseSummary = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT expense_type, SUM(amount) AS total, COUNT(*) AS count
       FROM expenses WHERE status='approved'
       GROUP BY expense_type ORDER BY total DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

module.exports = { routeWise, monthly, expenseSummary };
