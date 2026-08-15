'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stats',            ctrl.stats);
router.get('/recent-payments',  ctrl.recentPayments);
router.get('/route-collection', ctrl.routeCollection);

module.exports = router;
