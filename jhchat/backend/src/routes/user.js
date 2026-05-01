const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/avatars')),
  filename: (req, file, cb) => cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (/\.gif|jpg|jpeg|png$/i.test(path.extname(file.originalname))) cb(null, true);
  else cb(new Error('只允许图片文件'));
}});

router.get('/me', auth, userCtrl.getMe);
router.put('/me', auth, userCtrl.updateMe);
router.post('/avatar', auth, upload.single('avatar'), userCtrl.uploadAvatar);
router.get('/online', userCtrl.getOnlineUsers);
router.get('/members', auth, userCtrl.getMembers);
router.get('/:name', auth, userCtrl.getUser);
router.post('/bubble-exp/sync', auth, userCtrl.syncBubbleExp);

module.exports = router;
