'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/securityController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.post('/scan', authorize('security','superadmin','transport'), ctrl.scan);
router.get ('/logs', authorize('security','superadmin','transport'), ctrl.logs);

module.exports = router;
