const express = require('express');
const router = express.Router();
const sectCtrl = require('../controllers/sect');
const { auth } = require('../middleware/auth');

router.get('/', auth, sectCtrl.list);
router.get('/:name', auth, sectCtrl.detail);
router.get('/:name/members', auth, sectCtrl.members);
router.put('/:name', auth, sectCtrl.update);
router.post('/salary', auth, sectCtrl.salary);

module.exports = router;
