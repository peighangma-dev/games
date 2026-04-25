# 江湖聊天室 - 生产环境部署完成

## 部署时间

2026-04-23

## 环境信息

| 组件 | 版本 | 状态 |
|------|------|------|
| MySQL | 5.7.42 | ✅ 运行中 |
| Nginx | 1.22.1-9 | ✅ 运行中 |
| Node.js | v22.22.0 | ✅ 运行中 |
| 后端服务 | 1.0.0 | ✅ 运行中 (端口 3001) |
| 前端构建 | 1.0.0 | ✅ 已构建 |

## 数据库配置

```
数据库名：jhchat
用户名：jhchat
密码：JhChat@2026Secure!
主机：localhost:3306
字符集：utf8mb4
```

### 已导入数据

- ✅ 表结构：75 个表（包含所有游戏功能表）
- ✅ 初始数据：房间、动作、用户等

### 数据库恢复/备份

**推荐备份文件**：`/workspace/jhchat/database/jhchat_clean_backup.sql` (265KB)

这个文件是干净的备份，只包含 jhchat 数据库，不包含 MySQL 系统表。

**恢复命令**：
```bash
# 使用 jhchat 用户恢复（推荐）
mysql -ujhchat -p'JhChat@2026Secure!' jhchat < /workspace/jhchat/database/jhchat_clean_backup.sql

# 或使用 root 用户
mysql -uroot -p jhchat < /workspace/jhchat/database/jhchat_clean_backup.sql
```

**⚠️ 注意**：不要使用 `database_full.sql` (2.7MB)，它包含 MySQL 系统表，会导致权限错误！

## Nginx 配置

配置文件：`/etc/nginx/conf.d/jhchat.conf`

- 前端静态文件：`/workspace/jhchat/frontend/dist`
- API 反向代理：`http://127.0.0.1:3001`
- Socket.IO 支持：已配置 WebSocket 升级
- 静态资源缓存：30 天

## 访问地址

- 前端：http://localhost/
- API：http://localhost/api/
- Socket.IO：http://localhost/socket.io/

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| testadmin | admin123 | 管理员 (grade=10) | 推荐测试用 |
| install | admin123 | 普通用户 | 安装账号 |
| 站长 | (需要重置密码) | 管理员 | 初始管理员 |

## API 测试

```bash
# 健康检查
curl http://localhost/api/ping
# 响应：{"status":"ok","message":"pong",...}

# 服务器信息
curl http://localhost/api/server-info
# 响应：{"success":true,"data":{...}}
```

## 服务管理

### 后端服务

```bash
# 查看状态
ps aux | grep "node src/server.js"

# 重启
cd /workspace/jhchat/backend
pm2 restart jhchat
# 或直接运行
node src/server.js
```

### Nginx

```bash
# 重启
service nginx restart

# 重新加载配置
nginx -s reload

# 查看状态
service nginx status
```

### MySQL

```bash
# 重启
service mysql restart

# 查看状态
service mysql status
```

## 备份信息

原始 MariaDB 备份位置：
```
/workspace/backup/mysql_backup_20260423_074112/
```

包含：
- 完整数据库备份 (198MB)
- 卸载报告文档

## 目录结构

```
/workspace/jhchat/
├── backend/
│   ├── .env              # 环境变量
│   ├── src/
│   │   ├── server.js     # 入口文件
│   │   ├── config/db.js  # 数据库配置
│   │   ├── routes/       # API 路由
│   │   └── controllers/  # 业务逻辑
│   └── logs/             # 日志目录
├── frontend/
│   ├── dist/             # 构建输出
│   │   ├── index.html
│   │   └── assets/
│   └── nginx.conf        # Nginx 模板
├── database/
│   ├── 01-schema.sql     # 表结构
│   └── 02-seed-data.sql  # 初始数据
└── DEPLOYMENT_PRODUCTION.md  # 详细部署文档
```

## 注意事项

1. **数据库字符集**：已配置 utf8mb4，支持 emoji 和特殊字符
2. **跨域配置**：后端 CORS 已配置为信任 Nginx 反向代理
3. **WebSocket**：Socket.IO 已配置支持实时聊天
4. **日志目录**：确保 `/workspace/jhchat/backend/logs` 可写
5. **上传目录**：确保 `/workspace/jhchat/backend/uploads` 可写

## 下一步建议

- [ ] 配置 SSL 证书 (HTTPS)
- [ ] 配置域名解析
- [ ] 设置自动备份
- [ ] 配置监控告警
- [ ] 性能优化（Redis 缓存等）

## 快速验证命令

```bash
# 1. 检查前端
curl -s http://localhost/ | grep "笑傲江湖"

# 2. 检查 API
curl -s http://localhost/api/ping

# 3. 检查数据库连接
mysql -ujhchat -p'JhChat@2026Secure!' -e "SELECT 'Database OK' AS status;"

# 4. 检查 Socket.IO
curl -s "http://localhost/socket.io/?EIO=4&transport=polling"
```

## 联系信息

如有问题，请查看日志：
- 后端日志：`/workspace/jhchat/backend/logs/`
- Nginx 访问日志：`/var/log/nginx/access.log`
- Nginx 错误日志：`/var/log/nginx/error.log`
- MySQL 日志：`/var/log/mysql/`
