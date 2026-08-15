'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/route-wise',       ctrl.routeWise);
router.get('/monthly',          ctrl.monthly);
router.get('/expense-summary',  ctrl.expenseSummary);

module.exports = router;
