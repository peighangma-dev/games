# 生产端更新步骤 - 江湖聊天室在线更新系统

## 前置条件

### 1. 生产端环境要求

- **操作系统**: Linux (Ubuntu/CentOS)
- **Node.js**: v16+ 
- **数据库**: MySQL 5.7+ 本地访问权限
- **工具**: `curl`, `jq`, `tar`, `mysql` 客户端
- **权限**: 脚本执行权限、文件系统写权限、数据库写权限

### 2. 服务端准备

- ✅ 服务端地址配置正确 (默认：`https://5173-9a706b4ab80369c3.monkeycode-ai.online`)
- ✅ 管理后台已创建并发布更新
- ✅ 更新包已生成 (状态为 released 且有 package_file)

---

## 方式一：自动更新 (推荐)

### 步骤 1: 上传更新脚本到生产端

```bash
# 在工作空间执行
scp /workspace/jhchat/scripts/auto-update.sh root@your-server:/opt/jhchat/scripts/

# 或使用 rsync
rsync -avz /workspace/jhchat/scripts/auto-update.sh root@your-server:/opt/jhchat/scripts/
```

### 步骤 2: 赋予执行权限

```bash
ssh root@your-server
cd /opt/jhchat/scripts
chmod +x auto-update.sh
```

### 步骤 3: 安装依赖工具

```bash
# Ubuntu/Debian
apt-get update && apt-get install -y jq curl

# CentOS/RHEL
yum install -y epel-release && yum install -y jq curl
```

### 步骤 4: 修改脚本配置 (可选)

编辑脚本开头的配置部分：

```bash
vim /opt/jhchat/scripts/auto-update.sh
```

```bash
# 修改这些配置
ADMIN_URL="https://5173-9a706b4ab80369c3.monkeycode-ai.online"  # 服务端地址
CURRENT_VERSION_FILE="./VERSION"  # 版本文件路径
UPDATE_PACKAGE_DIR="./update-packages"  # 更新包存储目录
LOG_FILE="./auto-update.log"  # 日志文件
BACKUP_DIR="./backup"  # 备份目录
```

### 步骤 5: 创建版本文件

```bash
cd /opt/jhchat
echo "v1.0.0" > VERSION
```

### 步骤 6: 执行更新

```bash
cd /opt/jhchat/scripts

# 执行更新 (服务器名称可选)
./auto-update.sh production-server-01

# 或简写
./auto-update.sh
```

### 步骤 7: 查看日志

```bash
# 查看实时日志
tail -f /opt/jhchat/scripts/auto-update.log

# 或查看完整日志
cat /opt/jhchat/scripts/auto-update.log
```

### 步骤 8: 验证服务

```bash
# 检查服务是否运行
curl http://localhost:3001/api/ping

# 应返回：pong
```

---

## 方式二：手动更新

### 步骤 1: 检查可用更新

```bash
curl -s 'https://5173-9a706b4ab80369c3.monkeycode-ai.online/api/admin/updates/check?currentVersion=v1.0.0'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "hasUpdate": true,
    "currentVersion": "v1.0.0",
    "updates": [
      {
        "id": 4,
        "version": "v1.0.1",
        "title": "系统更新功能上线",
        "type": "minor",
        "priority": "normal"
      }
    ]
  }
}
```

### 步骤 2: 下载更新包

```bash
cd /opt/jhchat
mkdir -p update-packages

# 下载更新包
curl -L -o update-packages/update-v1.0.1.tar.gz \
  'https://5173-9a706b4ab80369c3.monkeycode-ai.online/api/admin/updates/download/v1.0.1'
```

### 步骤 3: 备份当前版本

```bash
BACKUP_DIR="./backup/update-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份后端代码
cp -r backend/src "$BACKUP_DIR/"

# 备份前端代码
cp -r frontend/src "$BACKUP_DIR/"

# 备份版本文件
cp VERSION "$BACKUP_DIR/"

echo "备份完成：$BACKUP_DIR"
```

### 步骤 4: 停止服务

```bash
# 方法 1: 使用 fuser
fuser -k 3001/tcp

# 方法 2: 使用 pm2 (如果使用)
pm2 stop jhchat-backend

# 方法 3: 使用 systemd (如果使用)
systemctl stop jhchat-backend

# 等待进程完全停止
sleep 2
```

### 步骤 5: 解压并应用更新

```bash
# 创建临时目录
TEMP_DIR=$(mktemp -d)

# 解压更新包
tar -xzf update-packages/update-v1.0.1.tar.gz -C "$TEMP_DIR"

# 应用后端更新
if [ -d "$TEMP_DIR/update-v1.0.1/backend/src" ]; then
  cp -r "$TEMP_DIR/update-v1.0.1/backend/src"/* backend/src/
  echo "已更新后端代码"
fi

# 应用前端更新
if [ -d "$TEMP_DIR/update-v1.0.1/frontend/src" ]; then
  cp -r "$TEMP_DIR/update-v1.0.1/frontend/src"/* frontend/src/
  echo "已更新前端代码"
fi

# 清理临时目录
rm -rf "$TEMP_DIR"
```

### 步骤 6: 执行数据库迁移 (如果有)

```bash
# 检查是否有迁移文件
if [ -d "$TEMP_DIR/update-v1.0.1/migrations" ]; then
  for migration in "$TEMP_DIR/update-v1.0.1/migrations"/*.sql; do
    if [ -f "$migration" ]; then
      mysql -u jhchat -p'JhChat@2026Secure!' jhchat < "$migration"
      echo "执行迁移：$(basename $migration)"
    fi
  done
fi
```

### 步骤 7: 重启服务

```bash
cd /opt/jhchat/backend

# 方法 1: 后台运行
nohup npm run dev > backend.log 2>&1 &

# 方法 2: 使用 pm2
pm2 start jhchat-backend

# 方法 3: 使用 systemd
systemctl start jhchat-backend

cd ..
sleep 5
```

### 步骤 8: 验证服务

```bash
# 检查端口是否监听
netstat -tlnp | grep 3001

# 测试 API
curl http://localhost:3001/api/ping

# 查看日志
tail -20 backend/backend.log
```

### 步骤 9: 更新版本号

```bash
echo "v1.0.1" > VERSION
```

### 步骤 10: 发送确认到服务端

```bash
curl -s -X POST \
  'https://5173-9a706b4ab80369c3.monkeycode-ai.online/api/admin/updates/acknowledge' \
  -H 'Content-Type: application/json' \
  -d '{
    "version": "v1.0.1",
    "status": "success",
    "serverName": "production-server-01"
  }'
```

---

## 回滚流程

### 情景：更新后服务异常

```bash
cd /opt/jhchat/scripts

# 方法 1: 使用脚本回滚
./auto-update.sh --rollback

# 方法 2: 手动回滚
# 找到最新备份
LATEST_BACKUP=$(ls -t ../backup | head -1)

# 停止服务
fuser -k 3001/tcp
sleep 2

# 恢复备份
cp -r "../backup/$LATEST_BACKUP/backend/src"/* backend/src/
cp -r "../backup/$LATEST_BACKUP/frontend/src"/* frontend/src/
cp "../backup/$LATEST_BACKUP/VERSION" VERSION

# 重启服务
cd backend && nohup npm run dev > backend.log 2>&1 &

# 验证
sleep 5
curl http://localhost:3001/api/ping
```

---

## 常见问题排查

### 问题 1: 检查更新失败

**现象**:
```bash
curl: (6) Could not resolve host: 5173-9a706b4ab80369c3.monkeycode-ai.online
```

**解决**:
```bash
# 检查 DNS
cat /etc/resolv.conf

# 测试网络连通性
ping 5173-9a706b4ab80369c3.monkeycode-ai.online

# 或检查防火墙
iptables -L -n
```

### 问题 2: 权限不足

**现象**:
```bash
Permission denied
```

**解决**:
```bash
# 确保脚本有执行权限
chmod +x auto-update.sh

# 确保目录有写权限
chown -R root:root /opt/jhchat
chmod -R 755 /opt/jhchat
```

### 问题 3: 端口占用

**现象**:
```bash
fuser: No process specifying pattern
```

**解决**:
```bash
# 查找占用端口的进程
lsof -i :3001

# 强制停止
kill -9 $(lsof -t -i:3001)

# 或使用 fuser
fuser -k -9 3001/tcp
```

### 问题 4: 数据库连接失败

**现象**:
```bash
ERROR 2002 (HY000): Can't connect to local MySQL server
```

**解决**:
```bash
# 检查 MySQL 是否运行
systemctl status mysql

# 或检查 MariaDB
systemctl status mariadb

# 重启数据库
service mysql restart
```

### 问题 5: Node.js 版本问题

**现象**:
```bash
npm ERR! node version is not compatible
```

**解决**:
```bash
# 检查 Node.js 版本
node --version

# 升级 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

### 问题 6: 缺少 jq 工具

**现象**:
```bash
jq: command not found
```

**解决**:
```bash
# Ubuntu/Debian
apt-get install jq

# CentOS/RHEL
yum install jq
```

---

## 完整示例

### 从零开始部署

```bash
#!/bin/bash
# 江湖聊天室生产端部署脚本

set -e

echo "========================================"
echo "江湖聊天室 - 生产端部署"
echo "========================================"

# 1. 创建目录结构
mkdir -p /opt/jhchat/{backend,frontend,scripts,update-packages,backup}

# 2. 安装依赖
apt-get update
apt-get install -y jq curl nodejs npm mysql-client

# 3. 上传代码 (略，使用 SCP 或 Git)

# 4. 安装后端依赖
cd /opt/jhchat/backend
npm install

# 5. 安装前端依赖并构建
cd /opt/jhchat/frontend
npm install
npm run build

# 6. 配置环境变量
cat > /opt/jhchat/backend/.env << EOF
PORT=3001
DB_HOST=localhost
DB_USER=jhchat
DB_PASSWORD=your_password
DB_NAME=jhchat
JWT_SECRET=your_jwt_secret
HOST=0.0.0.0
EOF

# 7. 上传更新脚本
vim /opt/jhchat/scripts/auto-update.sh
chmod +x /opt/jhchat/scripts/auto-update.sh

# 8. 初始化版本
echo "v1.0.0" > /opt/jhchat/VERSION

# 9. 启动服务
cd /opt/jhchat/backend
nohup npm run dev > backend.log 2>&1 &

# 10. 验证服务
sleep 5
curl http://localhost:3001/api/ping

echo "========================================"
echo "部署完成！"
echo "服务地址：http://$(hostname -I | awk '{print $1}'):3001"
echo "日志文件：/opt/jhchat/backend/backend.log"
echo "========================================"
```

---

## 自动化建议

### 1. 使用 Cron 定时检查更新

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 3 点检查更新
0 3 * * * /opt/jhchat/scripts/auto-update.sh --force >> /opt/jhchat/logs/cron-update.log 2>&1
```

### 2. 使用 systemd 服务

创建 `/etc/systemd/system/jhchat-backend.service`:

```ini
[Unit]
Description=JHChat Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jhchat/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# 重载 systemd 配置
systemctl daemon-reload

# 启用服务
systemctl enable jhchat-backend

# 启动服务
systemctl start jhchat-backend

# 查看状态
systemctl status jhchat-backend
```

### 3. 使用 PM2 进程管理

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
cd /opt/jhchat/backend
pm2 start npm --name "jhchat-backend" -- run dev

# 开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs jhchat-backend
```

---

## 维护命令速查

```bash
# 查看当前版本
cat /opt/jhchat/VERSION

# 检查更新
/opt/jhchat/scripts/auto-update.sh

# 查看更新日志
tail -f /opt/jhchat/scripts/auto-update.log

# 回滚到备份版本
/opt/jhchat/scripts/auto-update.sh --rollback

# 重启服务
fuser -k 3001/tcp && cd /opt/jhchat/backend && nohup npm run dev > backend.log 2>&1 &

# 查看服务状态
curl http://localhost:3001/api/server-info

# 查看数据库连接
mysql -u jhchat -p'JhChat@2026Secure!' jhchat -e "SHOW PROCESSLIST;"

# 查看备份列表
ls -lt /opt/jhchat/backup/

# 清理旧备份 (保留最近 3 个)
cd /opt/jhchat/backup && ls -t | tail -n +4 | xargs rm -rf
```

---

## 联系与支持

如遇到问题，请收集以下信息：

1. **系统信息**: `uname -a`
2. **Node.js 版本**: `node --version`
3. **NPM 版本**: `npm --version`
4. **MySQL 版本**: `mysql --version`
5. **错误日志**: `/opt/jhchat/scripts/auto-update.log`
6. **后端日志**: `/opt/jhchat/backend/backend.log`
7. **网络连通性**: `ping 5173-9a706b4ab80369c3.monkeycode-ai.online`

---

**文档版本**: 1.0.0  
**最后更新**: 2026-04-26  
**适用版本**: 在线更新系统 v1.0.0+
