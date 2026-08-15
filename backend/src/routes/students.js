'use strict';
const router  = require('express').Router();
const ctrl    = require('../controllers/studentController');
const { authenticate, authorize, TRANSPORT_ROLES } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');
const upload  = multer({ dest: path.join(__dirname, '../../../uploads/bills') });

router.use(authenticate);
router.get ('/',                ctrl.get);
router.post('/',                authorize(...TRANSPORT_ROLES), ctrl.create);
router.get ('/:id',             ctrl.getOne);
router.put ('/:id',             authorize(...TRANSPORT_ROLES), ctrl.update);
router.delete('/:id',           authorize('superadmin'), ctrl.remove);
router.get ('/:id/qr-pass',     ctrl.getQR);
router.post('/bulk/import',     authorize(...TRANSPORT_ROLES), ctrl.bulkImport);

module.exports = router;
