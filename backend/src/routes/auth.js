'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login',               ctrl.login);
router.post('/refresh',             ctrl.refresh);
router.post('/logout',              authenticate, ctrl.logout);
router.post('/change-password',     authenticate, ctrl.changePassword);
router.post('/student-first-login', ctrl.studentFirstLogin);
router.get ('/me',                  authenticate, ctrl.me);

module.exports = router;
