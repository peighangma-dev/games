# 生产端紧急修复指南

## GitDeployController.js 重复变量声明修复

### 问题描述
生产端 `/www/wwwroot/jhchat/backend/src/controllers/admin/GitDeployController.js` 
第 246 行有重复的 `const latestCommit` 声明，导致服务无法启动。

### 原因
本地文件正常，生产端文件可能被手动修改或有额外的代码块。

### 修复步骤

#### 方法一：手动删除重复代码（推荐）

```bash
# 1. 备份文件
cp /www/wwwroot/jhchat/backend/src/controllers/admin/GitDeployController.js \
   /tmp/GitDeployController.js.backup

# 2. 查看 240-255 行的代码
sed -n '240,255p' /www/wwwroot/jhchat/backend/src/controllers/admin/GitDeployController.js

# 3. 如果看到类似以下重复代码：
#    const hasChanges = execSync(...)   # 第 240 行
#    ...
#    // 获取最新提交                     # 第 245 行
#    const latestCommit = execSync(...) # 第 246 行 <- 重复！
#
# 删除重复的第 245-250 行（根据实际行号调整）
sed -i '245,250d' /www/wwwroot/jhchat/backend/src/controllers/admin/GitDeployController.js

# 4. 验证修复（应该只有一个 latestCommit 声明）
grep -n "latestCommit" /www/wwwroot/jhchat/backend/src/controllers/admin/GitDeployController.js

# 5. 重启服务
PM2_HOME=/www/server/panel/PM2 npx pm2 restart jhchat-backend

# 6. 检查状态
sleep 5
PM2_HOME=/www/server/panel/PM2 npx pm2 status

# 7. 测试 API
curl http://localhost:3001/api/ping
```

#### 方法二：从 Git 仓库恢复（如果 Git 仓库文件正确）

```bash
# 1. 进入 Git 仓库
cd /www/wwwroot/games/jhchat

# 2. 恢复文件
git checkout HEAD -- backend/src/controllers/admin/GitDeployController.js

# 3. 复制到生产目录
cp backend/src/controllers/admin/GitDeployController.js \
   /www/wwwroot/jhchat/backend/src/controllers/admin/

# 4. 重启服务
PM2_HOME=/www/server/panel/PM2 npx pm2 restart jhchat-backend
```

#### 方法三：直接替换整个文件（最彻底）

1. 从本地上传正确的文件到生产端：

```bash
# 在本地执行
scp /workspace/jhchat/backend/src/controllers/admin/GitDeployController.js \
    root@服务器 IP:/www/wwwroot/jhchat/backend/src/controllers/admin/
```

2. 在生产端重启服务：

```bash
PM2_HOME=/www/server/panel/PM2 npx pm2 restart jhchat-backend
```

### 验证标准

✅ 服务正常启动（↺ 不再增加）
✅ `curl http://localhost:3001/api/ping` 返回成功
✅ `grep -n "latestCommit"` 只显示 2 行（1 个声明 + 1 个使用）

### 预防建议

1. **不要在生产端直接修改代码**
2. 所有修改先在本地完成，通过 Git 同步
3. 部署前先在本地测试
4. 使用自动化部署脚本

---

**修复时间**: 2026-04-26  
**影响范围**: GitDeployController.js  
**严重级别**: 🔴 高（服务无法启动）
