'use strict';
const router  = require('express').Router();
const ctrl    = require('../controllers/expenseController');
const multer  = require('multer');
const path    = require('path');
const { authenticate, authorize, FINANCE_ROLES } = require('../middleware/auth');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, f, cb) => cb(null, path.join(__dirname, '../../../uploads/bills')),
    filename:    (req, f, cb) => cb(null, Date.now() + '-' + f.originalname.replace(/\s+/g,'_')),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /jpg|jpeg|png|pdf/.test(f.mimetype)),
});

router.use(authenticate);
router.get   ('/',            ctrl.get);
router.post  ('/',            upload.single('document'), ctrl.create);
router.patch ('/:id/approve', authorize(...FINANCE_ROLES), ctrl.approve);
router.patch ('/:id/reject',  authorize(...FINANCE_ROLES), ctrl.reject);

module.exports = router;
