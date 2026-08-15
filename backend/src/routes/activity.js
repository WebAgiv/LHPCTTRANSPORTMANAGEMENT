'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get ('/',               ctrl.get);
router.patch('/mark-all-read', ctrl.markAllRead);
router.patch('/:id/read',      ctrl.markRead);

module.exports = router;
