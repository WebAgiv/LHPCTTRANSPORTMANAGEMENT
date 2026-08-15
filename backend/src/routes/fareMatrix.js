'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/fareMatrixController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.get);

module.exports = router;
