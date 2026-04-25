# 📦 江湖聊天室 - 生产环境更新指南

**版本**: v1.0.1 - 系统更新管理功能  
**更新日期**: 2026-04-25  
**分支**: `260413-feat-jhchat-refactor`

---

## 🚀 快速更新（3 步完成）

### 方式一：自动更新（推荐）

```bash
# 1. 下载更新脚本
cd /path/to/jhchat/deployment

# 2. 执行更新脚本
sudo ./update.sh

# 3. 验证更新
# 访问管理后台 http://your-domain.com/admin
# 检查是否显示更新管理菜单
```

### 方式二：手动更新

```bash
# 1. 拉取最新代码
cd /path/to/jhchat
git pull origin 260413-feat-jhchat-refactor

# 2. 执行数据库迁移
mysql -u jhchat -p jhchat < backend/migrations/20260425_create_system_updates_tables.sql

# 3. 重启服务
pm2 restart all
# 或
sudo ./deployment/update.sh
```

---

## ✅ 验证清单

更新完成后，请按顺序验证：

- [ ] **访问管理后台**：http://your-domain.com/admin
- [ ] **检查菜单**：系统配置下应有「更新管理」菜单
- [ ] **查看仪表盘**：应显示 v1.0.1 更新提示
- [ ] **点击进入**：能正常跳转到更新管理页面
- [ ] **检查记录**：页面显示至少 4 条更新记录

---

## 🔧 常用命令

### 检查更新状态

```bash
# 查看数据库表
mysql -u jhchat -p jhchat -e "SELECT version, title FROM system_updates ORDER BY version_code DESC"

# 后端服务状态
pm2 status jhchat-backend

# 前端服务状态
pm2 status jhchat-frontend

# 查看更新日志
tail -f /var/log/jhchat_update_*.log
```

### 故障排查

```bash
# 检查后端 API
curl http://localhost:3001/api/health

# 检查管理后台
curl http://localhost:5173/admin

# 查看后端日志
tail -f /path/to/jhchat/backend/logs/error.log

# 查看 PM2 日志
pm2 logs jhchat-backend --lines 100
```

---

## ⚠️ 回滚方案

如果更新失败，可以执行回滚：

```bash
# 自动回滚（推荐）
sudo ./deployment/rollback.sh

# 手动回滚
# 1. 恢复数据库
mysql -u jhchat -p jhchat < /backup/jhchat_YYYYMMDD_HHMMSS.sql

# 2. 恢复代码
cd /path/to/jhchat
git checkout <previous_version>

# 3. 重启服务
pm2 restart all
```

---

## 📋 文件清单

```
deployment/
├── PRODUCTION_UPDATE_PLAN.md    # 详细更新方案
├── update.sh                     # 自动更新脚本
└── rollback.sh                   # 回滚脚本

backend/migrations/
└── 20260425_create_system_updates_tables.sql  # 数据库迁移脚本
```

---

## 📞 获取帮助

### 文档

- 详细更新方案：`deployment/PRODUCTION_UPDATE_PLAN.md`
- 功能说明文档：`backend/migrations/README_SYSTEM_UPDATES.md`
- 实现总结：`.monkeycode/docs/SYSTEM_UPDATE_FEATURE.md`

### 联系方式

- 开发团队：[联系方式]
- 运维团队：[联系方式]

---

## 🎯 更新成功标准

更新被认为成功，当所有以下条件满足：

1. ✅ 管理后台可正常访问
2. ✅ 「系统配置」下显示「更新管理」菜单
3. ✅ 仪表盘显示更新提示卡片
4. ✅ 更新管理页面显示 4 条以上记录
5. ✅ 后端服务正常运行
6. ✅ 前端资源加载成功
7. ✅ 数据库表创建成功
8. ✅ 错误日志无异常

---

**祝更新顺利！** 🎉
