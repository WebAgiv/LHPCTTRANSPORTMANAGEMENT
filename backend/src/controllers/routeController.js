'use strict';
const { query } = require('../config/db');

const get = async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT r.*, b.bus_number, d.full_name AS driver_name, d.phone AS driver_phone,
              COUNT(s.id) AS enrolled_students
       FROM routes r
       LEFT JOIN buses   b  ON r.bus_id    = b.id
       LEFT JOIN drivers d  ON r.driver_id = d.id
       LEFT JOIN students s ON s.route_id  = r.id AND s.pass_status != 'suspended'
       WHERE r.is_active=1 GROUP BY r.id ORDER BY r.id`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

const getOne = async (req, res, next) => {
  try {
    const [[route]] = await query(
      `SELECT r.*, b.bus_number, d.full_name AS driver_name FROM routes r
       LEFT JOIN buses b ON r.bus_id=b.id LEFT JOIN drivers d ON r.driver_id=d.id
       WHERE r.id=?`, [req.params.id]
    );
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    const [stops] = await query(
      `SELECT *, CASE WHEN acop_fare<=10000 AND acop_fare>0 THEN 'single' ELSE 'two' END AS payment_plan,
              CASE WHEN acop_fare>10000 THEN CEIL(acop_fare/2) ELSE acop_fare END AS inst1,
              CASE WHEN acop_fare>10000 THEN acop_fare-CEIL(acop_fare/2) ELSE 0 END AS inst2
       FROM stops WHERE route_id=? ORDER BY stop_order`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...route, stops } });
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const { route_name, bus_id, driver_id, capacity, morning_departure, annual_fare_typical } = req.body;
    await query('UPDATE routes SET route_name=?,bus_id=?,driver_id=?,capacity=?,morning_departure=?,annual_fare_typical=? WHERE id=?',
      [route_name, bus_id, driver_id, capacity, morning_departure, annual_fare_typical, req.params.id]);
    res.json({ success: true, message: 'Route updated' });
  } catch (e) { next(e); }
};

module.exports = { get, getOne, update };
