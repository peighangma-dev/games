/**
 * 统一响应格式中间件
 * 确保所有 API 响应都遵循相同的格式
 */

module.exports = (req, res, next) => {
  // 保存原始 json 方法
  const originalJson = res.json.bind(res);
  
  // 重写 json 方法
  res.json = (data) => {
    // 如果数据已经有了 success 字段，直接返回
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson(data);
    }
    
    // 否则自动包装
    return originalJson({
      success: true,
      data: data
    });
  };
  
  next();
};
