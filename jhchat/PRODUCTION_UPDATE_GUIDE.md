# 生产环境更新指南

**更新日期**: 2026-04-24  
**分支**: `260413-feat-jhchat-refactor`  
**提交**: `4c03bcd`

---

## 📋 问题概述

本次修复解决了管理后台的多个关键 API 缺失和配置错误问题：

### 修复内容

1. **用户管理 API 缺失** - 前端调用 `PUT /api/admin/users/:id` 返回 404
2. **服务器状态 API 映射错误** - `getServerInfo` 调用了错误的控制器方法
3. **Vue Router 警告** - Mobile 路由的子路由缺少名称导致控制台警告
4. **数据库连接失败** - 密码不匹配导致 500 错误

---

## 🔧 生产环境更新步骤

### 方式一：自动部署（推荐）

如果生产环境配置了 Git 自动拉取：

```bash
# 进入项目目录
cd /path/to/jhchat

# 拉取最新代码
git pull origin 260413-feat-jhchat-refactor

# 重启后端服务
pm2 restart jhchat-backend --update-env

# 验证服务状态
pm2 status
```

### 方式二：手动部署

#### 1. 拉取代码更新

```bash
cd /path/to/jhchat
git pull origin 260413-feat-jhchat-refactor
```

#### 2. 检查数据库连接（关键）

如果生产环境数据库密码与 `.env` 文件中的密码不一致，需要更新：

```bash
# 方法 A：使用 root 用户重置密码
mysql -u root <<'EOF'
ALTER USER 'jhchat'@'localhost' IDENTIFIED BY 'JhChat@2026Secure!';
ALTER USER 'jhchat'@'%' IDENTIFIED BY 'JhChat@2026Secure!';
FLUSH PRIVILEGES;
EOF

# 方法 B：或更新 .env 文件中的密码（如果生产环境使用不同密码）
cd /path/to/jhchat/backend
vim .env
# 修改 DB_PASSWORD 为生产环境实际密码
```

#### 3. 停止现有服务

```bash
# 停止 PM2 服务
pm2 stop jhchat-backend

# 或者如果使用 system
systemctl stop jhchat-backend

# 如果端口仍被占用，强制清理
fuser -k 3001/tcp
```

#### 4. 启动新服务

```bash
# 使用 PM2（推荐）
cd /path/to/jhchat/backend
pm2 start src/server.js --name jhchat-backend --update-env

# 或使用 system
systemctl start jhchat-backend
```

#### 5. 验证服务状态

```bash
# 检查 PM2 状态
pm2 status
pm2 logs jhchat-backend --lines 20

# 检查端口监听
netstat -tlnp | grep 3001
# 或
ss -tlnp | grep 3001

# 测试 API 响应
curl http://localhost:3001/api/ping
```

---

## ✅ 验证清单

更新完成后，请按以下步骤验证：

### 1. 基础服务检查

```bash
# 服务进程运行
pm2 status
# 应显示 jhchat-backend 状态为 online

# 端口正常监听
curl http://localhost:3001/api/ping
# 应返回：{"success":true,"message":"pong"}
```

### 2. 管理后台 API 测试

需要管理员 token（通过登录接口获取）：

```bash
# 设置 token 变量
TOKEN="你的管理员_token"

# 测试仪表盘数据
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/dashboard

# 测试用户列表
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/users

# 测试服务器状态
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/server/status
```

### 3. 前端功能测试

1. 打开浏览器访问前端页面
2. 使用管理员账号登录
3. 进入管理后台 `/admin`
4. 验证以下功能：
   - ✅ 仪表盘数据正常加载（用户统计、聊天统计、经济数据）
   - ✅ 服务器状态正常显示
   - ✅ 用户列表正常加载
   - ✅ 用户编辑功能（选择用户 → 修改信息 → 保存）
   - ✅ 用户管理操作（封禁、解封、踢出等）
   - ✅ 控制台无 Vue Router 警告

### 4. 日志检查

```bash
# 查看后端日志（无数据库连接错误）
pm2 logs jhchat-backend --lines 50 | grep error

# 应只看到业务逻辑错误，不应看到：
# - "Access denied for user"
# - "EADDRINUSE"
# - "Database connection error"
```

---

## 🚨 常见问题处理

### 问题 1：数据库连接失败

**错误**: `Access denied for user 'jhchat'@'localhost'`

**解决**:
```bash
# 1. 检查 .env 文件密码
cat /path/to/jhchat/backend/.env | grep DB_PASSWORD

# 2. 使用 root 重置密码
mysql -u root -e "ALTER USER 'jhchat'@'localhost' IDENTIFIED BY '密码'; FLUSH PRIVILEGES;"

# 3. 重启服务
pm2 restart jhchat-backend --update-env
```

### 问题 2：端口被占用

**错误**: `Error: listen EADDRINUSE: address already in use :::3001`

**解决**:
```bash
# 1. 查找占用进程
lsof -i :3001

# 2. 杀掉旧进程
kill -9 <PID>

# 3. 重启服务
pm2 restart jhchat-backend --update-env
```

### 问题 3：前端仍然报错

**原因**: 浏览器缓存了旧代码

**解决**:
```bash
# 方法 1：强制刷新页面
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)

# 方法 2：清除浏览器缓存

# 方法 3：重新构建前端（如果需要）
cd /path/to/jhchat/frontend
npm run build
```

### 问题 4：PM2 服务无法启动

**解决**:
```bash
# 1. 查看 PM2 详细日志
pm2 logs jhchat-backend --err --lines 100

# 2. 尝试前台运行调试
cd /path/to/jhchat/backend
node src/server.js

# 3. 检查 Node.js 依赖
npm install

# 4. 验证环境变量
cat .env
```

---

## 📊 性能监控建议

部署后建议监控以下指标：

### 1. 数据库连接数

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
```

### 2. API 响应时间

```bash
# 使用 ab 或 wrk 进行压力测试
ab -n 1000 -c 10 http://localhost:3001/api/admin/dashboard
```

### 3. 服务器资源使用

```bash
# 内存使用
pm2 monit

# CPU 和内存
top -p $(pgrep -f 'node src/server.js')
```

---

## 📝 回滚方案

如果更新后出现问题，可以快速回滚：

```bash
# 1. 回退到上一个提交
cd /path/to/jhchat
git reset --hard <上一个稳定版本提交 hash>

# 2. 重启服务
pm2 restart jhchat-backend --update-env

# 3. 验证回滚成功
curl http://localhost:3001/api/ping
```

---

## 📞 技术支持

如果更新过程中遇到问题，请提供以下信息：

1. **错误日志**: `pm2 logs jhchat-backend --lines 100`
2. **服务状态**: `pm2 status`
3. **端口状态**: `netstat -tlnp | grep 3001`
4. **数据库连接**: `mysql -u jhchat -p -e "SELECT 1"`

---

## 🔄 后续优化建议

1. **环境变量管理**: 使用密钥管理工具管理数据库密码
2. **自动化部署**: 配置 CI/CD 自动部署
3. **监控告警**: 配置服务监控和告警通知
4. **日志收集**: 配置日志集中收集和分析

---

**更新完成时间**: ______________  
**验证人**: ______________  
**备注**: ______________
