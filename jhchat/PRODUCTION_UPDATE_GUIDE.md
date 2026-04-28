# 生产端一键更新指南

## 快速更新（推荐）

### 方式一：执行更新脚本
```bash
# SSH 登录生产端服务器
ssh root@your-server-ip

# 执行一键更新脚本
cd /www/wwwroot/games/jhchat
bash deploy-update.sh

# 或手动执行
curl -fsSL https://raw.githubusercontent.com/peighangma-dev/games/260413-feat-jhchat-refactor/deploy-update.sh | bash
```

### 方式二：Git 手动更新
```bash
# 1. 进入仓库目录
cd /www/wwwroot/games/jhchat

# 2. 拉取最新代码
git pull origin 260413-feat-jhchat-refactor

# 3. 执行数据库同步
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < database/production-sync-v2026.3.sql

# 4. 重启 PM2 服务
export PM2_HOME=/www/server/panel/PM2
pm2 restart jhchat-backend
pm2 restart jhchat-frontend
```

---

## 更新内容 (v2026.3.1)

### 功能增强
- ✅ 用户等级经验系统
- ✅ 聊天时长统计
- ✅ 管理员申请验证

### Bug 修复
- ✅ 用户列表查询（字段兼容性）
- ✅ 重置密码功能
- ✅ 创建门派功能
- ✅ 管理员管理（添加/调整/开除）

### 技术改进
- ✅ 数据库字段统一命名
- ✅ 向后兼容支持
- ✅ 错误处理优化

---

## 验证功能

更新后请验证以下功能：

```bash
# 1. 检查后端服务
curl http://localhost:3001/api/admin/dashboard
# 应返回：{"success":false,"message":"未登录",...} (401 表示服务正常)

# 2. 检查管理员路由
curl -X POST http://localhost:3001/api/admin/managers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"username":"test","grade":6,"faction":"六扇门"}'

# 3. 检查数据库字段
mysql -u jhchat -p -e "DESC jhchat.users;" | grep -E "total_exp|chat_minutes"
```

---

## 管理后台验证

登录管理后台后验证：

1. **用户管理** (`/admin/users`)
   - [ ] 用户列表正常加载
   - [ ] 经验字段显示正常
   - [ ] 重置密码功能可用

2. **管理员管理** (`/admin/managers`)
   - [ ] 添加管理员功能可用
   - [ ] 调整管理员功能可用
   - [ ] 开除管理员功能可用

3. **门派管理** (`/admin/sects`)
   - [ ] 创建门派功能可用
   - [ ] 编辑门派功能可用

4. **等级经验管理** (`/admin/level-exp`)
   - [ ] 等级配置列表显示
   - [ ] 用户经验详情显示

---

## 回滚方案

如需回滚到更新前的版本：

```bash
# 1. 查看备份目录
ls -la /www/backups/jhchat/

# 2. 恢复数据库
mysql -u jhchat -p jhchat < /www/backups/jhchat/最新备份/db_backup.sql

# 3. 恢复代码
cd /www/wwwroot/games/jhchat
git checkout <previous-branch-or-tag>

# 4. 重启服务
pm2 restart all
```

---

## 故障排查

### 服务无法启动
```bash
# 查看后端日志
pm2 logs jhchat-backend --lines 100

# 查看前端日志
pm2 logs jhchat-frontend --lines 100

# 检查端口占用
netstat -nlp | grep -E "3001|5173"
```

### 数据库错误
```bash
# 检查数据库连接
mysql -u jhchat -p -e "SHOW DATABASES;"

# 检查表结构
mysql -u jhchat -p -e "DESC jhchat.users;"

# 手动执行字段同步
mysql -u jhchat -p jhchat < /www/wwwroot/games/jhchat/database/production-sync-v2026.3.sql
```

### Git 拉取失败
```bash
# 检查 Git 配置
cd /www/wwwroot/games/jhchat
git remote -v
git branch -a

# 重新拉取
git fetch origin
git pull origin 260413-feat-jhchat-refactor
```

---

## 更新脚本说明

### 脚本参数
- `PROJECT_ROOT`: 项目根目录 `/www/wwwroot/games/jhchat`
- `BRANCH`: 更新分支 `260413-feat-jhchat-refactor`
- `DB_USER`: 数据库用户 `jhchat`
- `PM2_HOME`: PM2 配置目录 `/www/server/panel/PM2`

### 备份策略
- 数据库备份：`/www/backups/jhchat/YYYYMMDD_HHMMSS/db_backup.sql`
- 代码备份：`/www/backups/jhchat/YYYYMMDD_HHMMSS/code_backup.tar.gz`
- 自动清理 7 天前的旧备份

---

## 支持文档

- `UPDATES/v2026.3.1-update.md` - 详细更新日志
- `database/production-sync-v2026.3.sql` - 数据库同步脚本
- `DATABASE_DEPLOY_GUIDE.md` - 数据库部署指南
- `PRODUCTION_FIX.md` - 生产端修复指南

---

**更新时间**: 2026-04-28  
**维护团队**: 江湖聊天室开发团队
