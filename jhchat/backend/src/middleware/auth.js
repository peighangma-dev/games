const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' });
  }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.grade < 6 || req.user.faction !== '六扇门') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  });
}

function superAdminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.grade < 10 || req.user.faction !== '六扇门') {
      return res.status(403).json({ success: false, message: '需要站长权限' });
    }
    next();
  });
}

function gradeAuth(minGrade) {
  return (req, res, next) => {
    auth(req, res, () => {
      if (req.user.grade < minGrade) {
        return res.status(403).json({ success: false, message: `需要等级${minGrade}以上` });
      }
      next();
    });
  };
}

module.exports = { auth, adminAuth, superAdminAuth, gradeAuth };
