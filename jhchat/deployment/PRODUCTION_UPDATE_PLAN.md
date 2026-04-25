# 江湖聊天室 - 生产环境更新方案

**更新日期**: 2026-04-25  
**更新版本**: v1.0.1 (系统更新管理功能)  
**更新类型**: Minor (功能版本)  
**优先级**: Normal

---

## 📋 一、更新概述

### 1.1 更新内容

本次更新为江湖聊天室系统新增**在线更新管理功能**，包括：

- ✅ 管理后台更新管理界面
- ✅ 仪表盘更新提示
- ✅ 版本管理系统
- ✅ 更新推送和日志记录

### 1.2 影响范围

| 模块 | 影响程度 | 说明 |
|------|---------|------|
| 管理后台 | 🔴 高 | 新增菜单和页面 |
| 仪表盘 | 🟡 中 | 添加更新提示功能 |
| 数据库 | 🟡 中 | 新增 2 张表 |
| 前端服务 | 🟢 低 | 无需停机 |
| 后端服务 | 🟢 低 | 无需停机 |

### 1.3 更新前准备

**必需条件**:
- [ ] 已备份当前数据库
- [ ] 已备份当前代码
- [ ] 确认系统处于低峰期
- [ ] 准备回滚方案
- [ ] 通知相关人员

**预计时间**: 15-30 分钟

---

## 📦 二、更新步骤

### 2.1 方案 A：自动更新（推荐）

适用于已有更新管理功能的系统。

#### 步骤 1：登录管理后台

```bash
# 访问管理后台
https://your-domain.com/admin

# 使用管理员账号登录
# 要求：grade >= 6 且 faction = '六扇门'
```

#### 步骤 2：检查可用更新

```bash
# 方法 1：通过仪表盘查看
# 如果有更新，仪表盘会显示更新提示卡片

# 方法 2：通过 API 检查
curl -X GET "https://your-domain.com/api/admin/updates/latest" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# 预期响应
{
  "success": true,
  "data": {
    "version": "v1.0.1",
    "title": "系统更新功能上线",
    "status": "released"
  }
}
```

#### 步骤 3：执行更新

1. 进入 **管理后台 → 系统配置 → 更新管理**
2. 找到版本 `v1.0.1`
3. 点击 **🚀 发布** 按钮
4. 点击 **📦 生成更新包**
5. 等待生成完成

#### 步骤 4：更新生产环境

```bash
# 在管理后台点击"推送更新"按钮
# 输入环境：production
# 系统会生成以下命令

# 在生产服务器执行：
curl -s https://your-domain.com/api/updates/latest.sh | bash -s -- https://your-domain.com v1.0.1
```

---

### 2.2 方案 B：手动更新（通用）

适用于首次部署更新功能的系统。

#### 步骤 1：代码更新

```bash
# 进入项目目录
cd /path/to/jhchat

# 备份当前代码
cp -r /path/to/jhchat /path/to/jhchat.backup.$(date +%Y%m%d_%H%M%S)

# 拉取最新代码
git fetch origin
git checkout 260413-feat-jhchat-refactor
git pull origin 260413-feat-jhchat-refactor

# 确认代码已更新
git log --oneline -5
```

#### 步骤 2：数据库迁移

```bash
# 备份数据库
mysqldump -u jhchat -p'JhChat@2026Secure!' jhchat > /backup/jhchat_$(date +%Y%m%d_%H%M%S).sql

# 执行迁移脚本
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < /path/to/jhchat/backend/migrations/20260425_create_system_updates_tables.sql

# 验证表已创建
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SHOW TABLES LIKE 'system%'"
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SHOW TABLES LIKE 'update%'"

# 验证示例数据
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT version, title FROM system_updates ORDER BY version_code DESC"
```

#### 步骤 3：安装依赖

```bash
# 后端依赖
cd /path/to/jhchat/backend
npm install

# 前端依赖
cd /path/to/jhchat/frontend
npm install

# 构建前端
npm run build
```

#### 步骤 4：重启服务

```bash
# 方法 1：使用 PM2（推荐）
cd /path/to/jhchat/backend
pm2 restart jhchat-backend

cd /path/to/jhchat/frontend
pm2 restart jhchat-frontend

# 方法 2：直接重启
# 停止服务
pkill -f "node.*server.js"
pkill -f "vite"

# 启动后端
cd /path/to/jhchat/backend
npm run dev > /var/log/jhchat-backend.log 2>&1 &

# 启动前端
cd /path/to/jhchat/frontend
npm run dev > /var/log/jhchat-frontend.log 2>&1 &

# 验证服务已启动
ps aux | grep -E "node|vite" | grep -v grep
```

#### 步骤 5：验证更新

```bash
# 检查后端服务
curl -s http://localhost:3001/api/health

# 检查前端服务
curl -s http://localhost:5173/admin > /dev/null && echo "Frontend OK"

# 检查更新 API
curl -X GET "http://localhost:3001/api/admin/updates/latest" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 检查数据库表
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
SELECT 
  TABLE_NAME, 
  TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'jhchat' 
  AND TABLE_NAME IN ('system_updates', 'update_push_logs')
"
```

---

## 🔍 三、验证清单

### 3.1 功能验证

- [ ] **管理后台可访问**
  ```bash
  curl -I http://localhost:5173/admin
  # 应返回 200 OK
  ```

- [ ] **更新管理菜单可见**
  - 登录管理后台
  - 检查"系统配置"下是否有"更新管理"菜单
  - 点击菜单应能正常跳转

- [ ] **仪表盘更新提示**
  - 访问管理后台首页（Dashboard）
  - 应显示 v1.0.1 更新提示卡片
  - 点击"前往更新"应跳转到更新管理页面

- [ ] **更新记录正常显示**
  - 在更新管理页面
  - 应显示至少 4 条更新记录
  - v1.0.1 状态应为"已发布"

- [ ] **数据库连接正常**
  ```bash
  mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT COUNT(*) FROM system_updates"
  # 应返回 4
  ```

### 3.2 性能验证

- [ ] **后端响应时间** < 200ms
  ```bash
  curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/api/admin/updates/latest"
  ```

- [ ] **前端加载时间** < 3s
  - 使用浏览器 DevTools 查看 Network 面板

- [ ] **数据库查询正常**
  ```bash
  mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "
  SELECT 
    version, 
    title, 
    status, 
    release_date 
  FROM system_updates 
  ORDER BY version_code DESC 
  LIMIT 5"
  ```

- [ ] **内存使用正常**
  ```bash
  free -h
  ps aux | grep node | awk '{print $2, $4}'
  ```

- [ ] **CPU 使用率正常**
  ```bash
  top -bn1 | grep "Cpu(s)"
  ```

---

## ⚠️ 四、风险评估

### 4.1 风险点

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 数据库迁移失败 | 低 | 高 | 已准备回滚脚本 |
| 服务启动失败 | 低 | 高 | 保留旧版本可快速回滚 |
| 前端编译错误 | 中 | 中 | 已在测试环境验证 |
| API 接口不兼容 | 低 | 高 | 保持向后兼容 |
| 数据丢失 | 极低 | 极高 | 已备份数据库 |

### 4.2 回滚方案

#### 回滚步骤

```bash
# 1. 停止服务
pm2 stop all
# 或
pkill -f "node.*server.js"
pkill -f "vite"

# 2. 恢复代码
cd /path/to/jhchat
git checkout <previous_version>
git pull origin <previous_version>

# 3. 构建前端
cd /path/to/jhchat/frontend
npm install
npm run build

# 4. 恢复数据库（如需要）
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < /backup/jhchat_YYYYMMDD_HHMMSS.sql

# 5. 重启服务
cd /path/to/jhchat/backend
pm2 start jhchat-backend

cd /path/to/jhchat/frontend
pm2 restart jhchat-frontend

# 6. 验证回滚
curl -s http://localhost:3001/api/health
```

#### 回滚验证

- [ ] 代码回滚到旧版本
- [ ] 数据库恢复成功
- [ ] 服务正常启动
- [ ] 核心功能正常
- [ ] 用户可正常使用

---

## 📊 五、监控指标

### 5.1 更新后监控周期

- **实时监控**: 更新后 1 小时
- **密切监控**: 更新后 24 小时
- **常规监控**: 更新后 7 天

### 5.2 关键指标

| 指标 | 阈值 | 告警方式 |
|------|------|---------|
| 错误日志数 | > 10/hour | 邮件 + 短信 |
| 服务响应时间 | > 500ms | 邮件 |
| CPU 使用率 | > 80% | 邮件 + 短信 |
| 内存使用率 | > 85% | 邮件 + 短信 |
| 数据库连接数 | > 80% | 邮件 |
| 用户登录失败率 | > 5% | 邮件 + 短信 |

### 5.3 监控命令

```bash
# 查看错误日志
tail -f /path/to/jhchat/backend/logs/error.log

# 查看服务状态
pm2 status

# 查看数据库连接
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SHOW STATUS LIKE 'Threads_connected'"

# 查看系统资源
htop
```

---

## 📞 六、联系方式

### 6.1 紧急联系人

| 角色 | 联系方式 | 职责 |
|------|---------|------|
| 运维负责人 | [联系方式] | 部署和监控 |
| 开发负责人 | [联系方式] | 技术支持 |
| DBA | [联系方式] | 数据库支持 |

### 6.2 问题上报流程

1. **发现问题** → 记录错误现象和时间
2. **初步判断** → 确定问题类型和严重程度
3. **联系负责人** → 根据问题类型联系对应负责人
4. **问题处理** → 按照应急预案处理
5. **问题复盘** → 更新后 24 小时内完成复盘报告

---

## ✅ 七、检查清单

### 7.1 更新前检查

- [ ] 已备份数据库
- [ ] 已备份代码
- [ ] 已准备回滚方案
- [ ] 已通知相关人员
- [ ] 系统处于低峰期
- [ ] 监控告警已配置
- [ ] 测试环境已验证

### 7.2 更新中检查

- [ ] 代码拉取成功
- [ ] 数据库迁移成功
- [ ] 依赖安装成功
- [ ] 服务启动成功
- [ ] 功能验证通过

### 7.3 更新后检查

- [ ] 核心功能正常
- [ ] 性能指标正常
- [ ] 监控数据正常
- [ ] 用户反馈正常
- [ ] 日志无异常
- [ ] 备份已验证

---

## 📝 八、附录

### 8.1 常用命令速查

```bash
# 备份数据库
mysqldump -u jhchat -p'JhChat@2026Secure!' jhchat > backup.sql

# 执行迁移
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < migration.sql

# 查看更新记录
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT * FROM system_updates ORDER BY version_code DESC"

# 查看推送记录
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SELECT * FROM update_push_logs ORDER BY created_at DESC LIMIT 10"

# 重启后端
pm2 restart jhchat-backend

# 重启前端
pm2 restart jhchat-frontend

# 查看日志
pm2 logs jhchat-backend --lines 100

# 查看服务状态
pm2 status
```

### 8.2 相关文件路径

```
项目根目录：/path/to/jhchat
后端目录：/path/to/jhchat/backend
前端目录：/path/to/jhchat/frontend
迁移脚本：/path/to/jhchat/backend/migrations/20260425_create_system_updates_tables.sql
日志目录：/path/to/jhchat/backend/logs/
备份目录：/backup/
```

### 8.3 端口信息

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发 | 5173/5174 | Vite 开发服务器 |
| 后端 API | 3001 | Express 服务器 |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存（可选） |

---

## 🎯 九、成功标准

更新被认为成功的标准：

1. ✅ 所有服务正常启动
2. ✅ 管理后台可访问
3. ✅ 更新管理菜单可见
4. ✅ 仪表盘显示更新提示
5. ✅ 数据库表创建成功
6. ✅ 示例数据存在
7. ✅ API 接口正常响应
8. ✅ 错误日志无异常
9. ✅ 性能指标正常
10. ✅ 用户可正常使用

---

**文档版本**: v1.0  
**最后更新**: 2026-04-25  
**维护者**: 运维团队
