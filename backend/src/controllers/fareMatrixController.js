'use strict';
const { query } = require('../config/db');

const get = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT s.id, s.stop_name, s.acop_fare, s.monthly_fare, s.stop_order,
              r.route_name, r.id AS route_id, b.bus_number,
              CASE WHEN s.acop_fare<=10000 AND s.acop_fare>0 THEN 'single' ELSE 'two' END AS payment_plan,
              CASE WHEN s.acop_fare>10000 THEN CEIL(s.acop_fare/2) ELSE s.acop_fare END AS inst1,
              CASE WHEN s.acop_fare>10000 THEN s.acop_fare-CEIL(s.acop_fare/2) ELSE 0 END AS inst2
       FROM stops s
       JOIN routes r ON s.route_id=r.id
       LEFT JOIN buses b ON r.bus_id=b.id
       WHERE s.acop_fare > 0
       ORDER BY s.acop_fare DESC`
    );
    const single = rows.filter(r => r.payment_plan === 'single').length;
    const two    = rows.filter(r => r.payment_plan === 'two').length;
    res.json({ success: true, data: rows, count: rows.length, stats: { single, two } });
  } catch (e) { next(e); }
};

module.exports = { get };
