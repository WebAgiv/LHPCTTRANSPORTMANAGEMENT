'use strict';
const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT b.*,d.full_name AS driver_name,r.route_name FROM buses b LEFT JOIN drivers d ON d.bus_id=b.id LEFT JOIN routes r ON r.bus_id=b.id ORDER BY b.bus_number');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

module.exports = router;
