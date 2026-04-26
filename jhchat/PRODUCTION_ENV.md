# 生产端环境配置说明

**最后更新**: 2026-04-26  
**适用版本**: v1.2.0+  
**生产服务器**: mpg22sol

---

## 一、目录结构总览

```
生产端服务器：root@mpg22sol

├── /www/wwwroot/jhchat/              # 生产环境主目录
│   ├── dist/                         # 前端编译后的静态文件 (Nginx 服务)
│   │   ├── assets/                   # 静态资源 (CSS/JS/图片)
│   │   ├── index.html                # 入口文件
│   │   └── ...                       # 其他编译产物
│   │
│   ├── frontend/                     # 前端源代码 (未编译)
│   │   ├── src/                      # 源代码目录
│   │   ├── public/                   # 公共资源
│   │   ├── package.json              # 前端依赖配置
│   │   └── vite.config.js            # Vite 配置文件
│   │
│   ├── backend/                      # 后端源代码
│   │   ├── src/                      # 后端源码
│   │   ├── .env                      # 环境变量配置
│   │   ├── package.json              # 后端依赖配置
│   │   └── logs/                     # 日志目录
│   │
│   ├── scripts/                      # 运维脚本
│   │   ├── auto-update.sh            # 自动更新脚本
│   │   ├── deploy.sh                 # 部署脚本
│   │   └── backup.sh                 # 备份脚本
│   │
│   ├── backup/                       # 备份目录
│   │   ├── deploy-20260426_xxxxx/    # 部署备份
│   │   └── update-20260426_xxxxx/    # 更新备份
│   │
│   ├── VERSION                       # 当前版本号文件
│   └── auto-update.log               # 更新日志
│
└── /www/wwwroot/games/               # Git 仓库同步路径
    └── jhchat/                       # 江湖聊天室 Git 仓库
        ├── .git/                     # Git 元数据
        ├── frontend/                 # 前端源码 (链接到 /www/wwwroot/jhchat/frontend)
        ├── backend/                  # 后端源码 (链接到 /www/wwwroot/jhchat/backend)
        └── scripts/                  # 脚本文件 (链接到 /www/wwwroot/jhchat/scripts)
```

---

## 二、路径说明

| 路径 | 用途 | 说明 |
|------|------|------|
| `/www/wwwroot/jhchat/dist` | **前端生产环境** | Nginx 指向此目录，存放 `npm run build` 编译产物 |
| `/www/wwwroot/jhchat/frontend` | **前端开发源码** | 存放 Vue3 源代码，需要编译后才能使用 |
| `/www/wwwroot/jhchat/backend` | **后端运行时** | 存放 Node.js 后端代码，直接运行 `npm run dev` |
| `/www/wwwroot/jhchat/scripts` | **运维脚本** | 存放自动更新、部署、备份等脚本 |
| `/www/wwwroot/jhchat/backup` | **备份目录** | 自动备份的历史版本，支持回滚 |
| `/www/wwwroot/games` | **Git 仓库** | 从 GitHub 拉取的源代码仓库 |

---

## 三、服务架构

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (80/443)                       │
│              /www/wwwroot/jhchat/dist/                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ 反向代理 /api → localhost:3001
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Backend (3001 端口)                 │
│         /www/wwwroot/jhchat/backend/                    │
│         npm run dev → src/server.js                     │
│         MySQL: localhost:3306/jhchat                    │
│         Redis: localhost:6379                           │
└─────────────────────────────────────────────────────────┘
```

---

## 四、部署流程

### 方式一：自动更新（推荐）

```bash
# 1. 进入生产环境目录
cd /www/wwwroot/jhchat

# 2. 执行自动更新脚本
./scripts/auto-update.sh prod-server-01

# 3. 查看更新日志
tail -f auto-update.log
```

### 方式二：手动部署

#### 步骤 1: 停止服务

```bash
# 停止后端服务
fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# 停止 Nginx (可选，通常不需要)
systemctl stop nginx
```

#### 步骤 2: 备份当前版本

```bash
cd /www/wwwroot/jhchat

# 创建备份目录
BACKUP_DIR="./backup/deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份后端
cp -r backend/src "$BACKUP_DIR/backend-src" 2>/dev/null || true

# 备份前端编译产物
cp -r dist "$BACKUP_DIR/dist" 2>/dev/null || true

# 备份版本号
cp VERSION "$BACKUP_DIR/" 2>/dev/null || true

echo "✓ 备份完成：$BACKUP_DIR"
```

#### 步骤 3: 从 Git 拉取最新代码

```bash
cd /www/wwwroot/jhchat

# 切换到前端目录，拉取最新代码
cd frontend
git fetch origin
git checkout 260413-feat-jhchat-refactor
git pull origin 260413-feat-jhchat-refactor

# 切换到后端目录，拉取最新代码
cd ../backend
git fetch origin
git checkout 260413-feat-jhchat-refactor
git pull origin 260413-feat-jhchat-refactor

# 切换到 scripts 目录，拉取最新代码
cd ../scripts
git fetch origin
git checkout 260413-feat-jhchat-refactor
git pull origin 260413-feat-jhchat-refactor
```

#### 步骤 4: 安装依赖

```bash
# 安装后端依赖
cd /www/wwwroot/jhchat/backend
npm install

# 安装前端依赖并编译
cd /www/wwwroot/jhchat/frontend
npm install
npm run build
```

#### 步骤 5: 配置环境变量

```bash
# 编辑后端环境变量（如需要）
vim /www/wwwroot/jhchat/backend/.env

# 确保以下配置正确：
PORT=3001
DB_HOST=localhost
DB_USER=jhchat
DB_PASSWORD=JhChat@2026Secure!
DB_NAME=jhchat
JWT_SECRET=jhchat-secret-key-change-in-production-2026
HOST=0.0.0.0
NODE_ENV=production
```

#### 步骤 6: 执行数据库迁移（如需要）

```bash
cd /www/wwwroot/jhchat/backend

# 检查是否有新的迁移脚本
ls -la migrations/

# 执行迁移（如果有）
node src/scripts/init-db.js
# 或手动执行 SQL
mysql -u jhchat -p'JhChat@2026Secure!' jhchat < migrations/xxxx.sql
```

#### 步骤 7: 启动服务

```bash
# 启动后端服务
cd /www/wwwroot/jhchat/backend
nohup npm run dev > backend.log 2>&1 &

# 等待 5 秒
sleep 5

# 验证后端服务
curl http://localhost:3001/api/ping
# 应返回：{"status":"ok","message":"pong",...}

# 检查端口监听
netstat -tlnp | grep 3001
```

#### 步骤 8: 验证前端

```bash
# Nginx 应该已经配置好指向 dist 目录
# 访问前端页面测试
curl -I http://localhost

# 或从浏览器访问服务器 IP
```

#### 步骤 9: 更新版本号

```bash
cd /www/wwwroot/jhchat
echo "v1.2.0" > VERSION

# 发送确认到服务端
curl -s -X POST \
  "https://5173-9a706b4ab80369c3.monkeycode-ai.online/api/admin/updates/acknowledge" \
  -H 'Content-Type: application/json' \
  -d '{"version":"v1.2.0","status":"success","serverName":"mpg22sol-prod"}'
```

#### 步骤 10: 清理旧备份（可选）

```bash
cd /www/wwwroot/jhchat/backup

# 只保留最近 3 个备份
ls -t | tail -n +4 | xargs rm -rf 2>/dev/null || true
```

---

## 五、回滚流程

### 情景：更新后出现问题，需要回滚

```bash
cd /www/wwwroot/jhchat

# 1. 查看可用备份
ls -lt backup/

# 2. 停止服务
fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# 3. 选择要回滚的备份（例如最新的）
BACKUP_TO_RESTORE=$(ls -t backup | head -1)

# 4. 恢复备份
cp -r "backup/$BACKUP_TO_RESTORE/backend-src"/* backend/src/
cp -r "backup/$BACKUP_TO_RESTORE/dist"/* dist/
cp "backup/$BACKUP_TO_RESTORE/VERSION" VERSION

# 5. 重启服务
cd backend && nohup npm run dev > backend.log 2>&1 &
sleep 5

# 6. 验证服务
curl http://localhost:3001/api/ping

# 7. 记录回滚操作
echo "v1.1.1 (rolled back at $(date))" > VERSION
echo "回滚完成"
```

---

## 六、维护命令速查

### 服务管理

```bash
# 查看服务状态
curl http://localhost:3001/api/ping
curl http://localhost:3001/api/server-info

# 重启后端服务
fuser -k 3001/tcp && cd /www/wwwroot/jhchat/backend && nohup npm run dev > backend.log 2>&1 &

# 查看后端日志
tail -f /www/wwwroot/jhchat/backend/backend.log
tail -100 /www/wwwroot/jhchat/backend/backend.log | grep ERROR

# 查看进程
lsof -i :3001
ps aux | grep node
```

### 版本管理

```bash
# 查看当前版本
cat /www/wwwroot/jhchat/VERSION

# 查看可用更新
curl -s 'https://5173-9a706b4ab80369c3.monkeycode-ai.online/api/admin/updates/check?currentVersion=v1.2.0'

# 手动更新版本
echo "v1.2.1" > /www/wwwroot/jhchat/VERSION
```

### 数据库管理

```bash
# 连接数据库
mysql -u jhchat -p'JhChat@2026Secure!' jhchat

# 查看在线用户数
SELECT COUNT(*) FROM users WHERE status = 'online';

# 查看最新日志
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

# 备份数据库
mysqldump -u jhchat -p'JhChat@2026Secure!' jhchat > /www/wwwroot/jhchat/backup/db-$(date +%Y%m%d).sql
```

### 日志管理

```bash
# 清理旧日志
find /www/wwwroot/jhchat/backend/logs -name "*.log" -mtime +30 -delete

# 日志分析
grep "ERROR" /www/wwwroot/jhchat/backend/backend.log | tail -20
grep "登录失败" /www/wwwroot/jhchat/backend/backend.log | wc -l
```

---

## 七、依赖环境

### 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+
- **Node.js**: v16+ (当前生产环境：v22.22.2)
- **npm**: v8+
- **MySQL**: 5.7+
- **Redis**: 6.0+ (可选)
- **Nginx**: 1.18+
- **Git**: 2.20+

### 必需工具

```bash
# 检查工具是否安装
node --version
npm --version
mysql --version
git --version
curl --version
jq --version  # 用于 JSON 解析

# 如果缺少 jq，安装方法：
apt-get install jq  # Ubuntu/Debian
yum install jq      # CentOS
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /www/wwwroot/jhchat/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 反向代理到后端
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 八、故障排查

### 问题 1: 前端页面无法访问

**症状**: 访问服务器 IP 或域名显示空白或 404

**排查步骤**:
```bash
# 1. 检查 Nginx 状态
systemctl status nginx

# 2. 检查 dist 目录是否存在
ls -la /www/wwwroot/jhchat/dist/

# 3. 检查 Nginx 配置
nginx -t

# 4. 查看 Nginx 日志
tail -20 /var/log/nginx/error.log
```

### 问题 2: API 请求失败

**症状**: 前端能访问但所有 API 请求失败

**排查步骤**:
```bash
# 1. 检查后端服务是否运行
curl http://localhost:3001/api/ping

# 2. 检查端口监听
netstat -tlnp | grep 3001

# 3. 查看后端日志
tail -20 /www/wwwroot/jhchat/backend/backend.log

# 4. 检查 Nginx 反向代理配置
cat /etc/nginx/sites-enabled/jhchat.conf
```

### 问题 3: 数据库连接失败

**症状**: 后端日志显示数据库连接错误

**排查步骤**:
```bash
# 1. 检查 MySQL 服务
systemctl status mysql

# 2. 测试数据库连接
mysql -u jhchat -p'JhChat@2026Secure!' -e "SELECT 1"

# 3. 检查环境变量
cat /www/wwwroot/jhchat/backend/.env | grep DB_

# 4. 查看数据库进程
netstat -tlnp | grep 3306
```

### 问题 4: 前端编译失败

**症状**: `npm run build` 报错

**排查步骤**:
```bash
# 1. 清理依赖重装
cd /www/wwwroot/jhchat/frontend
rm -rf node_modules package-lock.json
npm install
npm run build

# 2. 检查 Node.js 版本
node --version  # 应为 v16+

# 3. 查看完整错误日志
npm run build 2>&1 | tee build.log
```

---

## 九、更新记录

| 日期 | 版本 | 操作描述 | 操作人 |
|------|------|---------|--------|
| 2026-04-26 | v1.2.0 | 初始部署，在线更新系统实施 | admin |
| - | - | - | - |

---

## 十、联系与支持

**运维文档位置**: 
- 本地：`/www/wwwroot/jhchat/PRODUCTION_ENV.md`
- 远程 Git: `https://github.com/peighangma-dev/games`

**紧急联系**:
- 服务器管理员：xxx
- 技术支持：xxx

**监控工具**:
- 服务端点：`https://5173-9a706b4ab80369c3.monkeycode-ai.online`
- 日志查看：`tail -f /www/wwwroot/jhchat/backend/backend.log`
- 更新日志：`tail -f /www/wwwroot/jhchat/auto-update.log`

---

**文档版本**: 1.0.0  
**维护频率**: 每次部署后更新
