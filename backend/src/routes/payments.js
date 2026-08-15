'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/paymentController');
const { authenticate, authorize, FINANCE_ROLES } = require('../middleware/auth');

router.use(authenticate);
router.get  ('/',                  ctrl.get);
router.post ('/',                  authorize(...FINANCE_ROLES, 'transport', 'superadmin'), ctrl.create);
router.get  ('/summary',           ctrl.summary);
router.get  ('/overdue',           ctrl.overdue);
router.get  ('/plan-check/:annual_fare', ctrl.planCheck);
router.get  ('/student/:id',       ctrl.forStudent);

module.exports = router;
