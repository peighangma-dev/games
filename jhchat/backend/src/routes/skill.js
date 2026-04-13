const express = require('express');
const router = express.Router();
const skillCtrl = require('../controllers/skill');
const { auth } = require('../middleware/auth');

router.get('/', auth, skillCtrl.list);
router.post('/:id/practice', auth, skillCtrl.practice);
router.get('/secret', auth, skillCtrl.secret);
router.post('/secret/:id/learn', auth, skillCtrl.learn);
router.get('/learned', auth, skillCtrl.learned);

module.exports = router;
