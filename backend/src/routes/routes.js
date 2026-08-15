'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/routeController');
const { authenticate, authorize, TRANSPORT_ROLES } = require('../middleware/auth');

router.use(authenticate);
router.get('/',      ctrl.get);
router.get('/:id',   ctrl.getOne);
router.put('/:id',   authorize(...TRANSPORT_ROLES), ctrl.update);

module.exports = router;
