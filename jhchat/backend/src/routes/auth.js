const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth');
const { auth } = require('../middleware/auth');
const validateInput = require('../middleware/validateInput');
const { schemas } = require('../middleware/validateInput');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// 登录 - 添加频率限制和输入验证
router.post('/login', loginLimiter, validateInput(schemas.login), authCtrl.login);

// 注册 - 添加频率限制和输入验证
router.post('/register', registerLimiter, validateInput(schemas.register), authCtrl.register);

// 登出
router.post('/logout', auth, authCtrl.logout);
router.put('/password', auth, authCtrl.changePassword);
router.post('/revive', auth, authCtrl.revive);
router.post('/suicide', auth, authCtrl.suicide);

module.exports = router;
