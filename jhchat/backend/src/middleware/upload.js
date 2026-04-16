const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || 'uploads/avatars';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 文件类型验证
const allowedMimeTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// 文件大小限制 (默认 5MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查 MIME 类型
  if (!allowedMimeTypes[file.mimetype]) {
    const error = new Error('不允许的文件类型');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  const expectedExt = allowedMimeTypes[file.mimetype];
  if (ext !== expectedExt) {
    const error = new Error('文件扩展名与 MIME 类型不匹配');
    error.code = 'FILE_TYPE_MISMATCH';
    return cb(error, false);
  }
  
  cb(null, true);
};

// 创建上传中间件
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: fileFilter
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `文件过大，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超出限制'
      });
    }
    return res.status(400).json({
      success: false,
      message: `上传错误：${err.message}`
    });
  }
  
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: '不允许的文件类型，只允许 JPG, PNG, GIF, WebP'
    });
  }
  
  if (err.code === 'FILE_TYPE_MISMATCH') {
    return res.status(400).json({
      success: false,
      message: '文件类型不匹配，请重新上传'
    });
  }
  
  next(err);
};

module.exports = {
  upload,
  handleUploadError,
  uploadDir,
  MAX_FILE_SIZE
};
