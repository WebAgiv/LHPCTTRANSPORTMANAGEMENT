'use strict';
const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate, authorize, TRANSPORT_ROLES } = require('../middleware/auth');

router.use(authenticate);
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT d.*,b.bus_number,r.route_name FROM drivers d LEFT JOIN buses b ON d.bus_id=b.id LEFT JOIN routes r ON r.driver_id=d.id ORDER BY d.full_name');
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});
router.put('/:id', authorize(...TRANSPORT_ROLES), async (req, res, next) => {
  try {
    const { full_name,phone,license_no,license_expiry,bus_id,status } = req.body;
    await query('UPDATE drivers SET full_name=?,phone=?,license_no=?,license_expiry=?,bus_id=?,status=? WHERE id=?',[full_name,phone,license_no,license_expiry,bus_id,status,req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
