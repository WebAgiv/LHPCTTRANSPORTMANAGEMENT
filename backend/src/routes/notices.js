'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/noticeController');
const { authenticate, authorize, TRANSPORT_ROLES } = require('../middleware/auth');

router.use(authenticate);
router.get   ('/',           ctrl.get);
router.post  ('/',           authorize(...TRANSPORT_ROLES, 'finance'), ctrl.create);
router.put   ('/:id',        authorize(...TRANSPORT_ROLES), ctrl.update);
router.delete('/:id',        authorize(...TRANSPORT_ROLES), ctrl.remove);
router.patch ('/:id/read',   ctrl.markRead);
router.patch ('/:id/pin',    authorize(...TRANSPORT_ROLES), ctrl.pin);

module.exports = router;
