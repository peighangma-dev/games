# 江湖聊天室 (JHChat) - Agent 指南

## 项目概述

Vue 3 + Express + MySQL 5.7 + Socket.IO 的 MUD 风格武侠聊天室系统，含管理后台、游戏系统、经济系统。

**重要**：MySQL 5.7 兼容，避免使用 MySQL 8.0+ 特有语法。

## 快速启动

### 后端
```bash
cd /workspace/jhchat/backend
npm run dev
```
- 端口：`3001`，绑定 `0.0.0.0`
- 依赖：MySQL 5.7+、Redis（可选）
- 入口：`src/server.js`

### 前端
```bash
cd /workspace/jhchat/frontend
npm run dev
```
- 端口：`5173`
- 反向代理：`/api`、`/uploads`、`/socket.io`、`/assets` → `localhost:3001`
- 允许主机：`*.monkeycode-ai.online`

### 数据库初始化（首次启动必做）
```bash
cd /workspace/jhchat/backend
npm run init-db        # 创建表结构
npm run seed           # 填充初始数据（41 武功秘籍、34 任务）
npm run migrate        # 创建管理员日志表
```

### 环境变量
后端需要 `.env` 文件配置：
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `FRONTEND_URL`（默认 `http://localhost:5173`）
- `JWT_SECRET`
- `PORT`（默认 3001）

## 项目结构

```
/workspace/jhchat/
├── backend/
│   ├── src/
│   │   ├── controllers/     # admin/ 为管理后台控制器
│   │   ├── routes/          # admin.js 集中管理后台路由
│   │   ├── middleware/      # adminAuth.js 权限验证
│   │   ├── socket/          # Socket.IO 事件 + 随机事件定时器
│   │   └── server.js        # 服务器入口（191 行）
│   ├── migrations/          # 数据库迁移脚本
│   ├── uploads/avatars/     # 头像上传目录
│   └── logs/                # Winston 日志
├── frontend/
│   ├── src/views/admin/     # 管理后台页面
│   ├── src/stores/          # Pinia 状态管理
│   └── electron/            # Electron 桌面端
├── .monkeycode/
│   ├── docs/                # ADMIN_MANUAL.md, ADMIN_API_REFERENCE.md
│   └── specs/*/             # 功能规格（requirements.md + design.md）
└── database/                # 数据库备份和 SQL 脚本
```

## 管理员权限系统

| 等级 | 称号 | 权限 |
|------|------|------|
| 6-7 | 护法 | 用户管理、聊天室管理、新闻发布 |
| 8-9 | 长老 | 物品管理、活动管理、IP 管理、经济调控 |
| 10 | 掌门 | 全部权限（包括管理员任免） |

**关键约束**：
- 所有管理员必须属于 **"六扇门"** 才能行使权限
- 前端判断：`userStore.isAdmin` = `grade >= 6 && faction === '六扇门'`

## 开发命令

### 后端
```bash
npm run lint      # ESLint 检查
npm run lint:fix  # 自动修复
npm run format    # Prettier 格式化
npm run check     # lint + format
npm run init-db   # 初始化数据库表
npm run seed      # 填充初始数据
npm run migrate   # 运行数据库迁移
```

### 前端
```bash
npm run dev       # 启动开发服务器
npm run build     # 生产构建
npm run preview   # 预览生产构建
```

### 代码风格
- 后端：JavaScript (ES6+) + `mysql2/promise` 异步操作
- 前端：Vue 3 + Composition API + Pinia
- 响应格式：`{ success, data, message, code }`
- 中文注释和文档

## 常见问题与陷阱

1. **数据库字段不匹配**：控制器字段名须与表结构一致（如 `level` vs `grade`）
2. **缺失的表**：新增功能时检查 `scripts/migrations/` 创建迁移
3. **前端编译错误**：检查重复函数定义或孤立 `return` 语句
4. **修改后需重启**：后端修改代码后必须重启 `npm run dev`
5. **中文用户名验证**：使用 `/^[\u4e00-\u9fff]+$/` 正则
6. **性别字段**：数据库期望 `male/female` 而非中文
7. **vite.config.js 已配置** `allowedHosts: ['.monkeycode-ai.online']`，无需重复添加

## 重要文档

- `.monkeycode/docs/ADMIN_API_REFERENCE.md` - 管理后台 API（13 模块，861 行）
- `.monkeycode/docs/ADMIN_MANUAL.md` - 管理员使用手册
- `.monkeycode/docs/ERROR_MESSAGES_GUIDE.md` - 错误提示指南
- `backend/src/scripts/schema.sql` - 完整数据库表结构（1033 行）
- `ONLINE_UPDATE_SYSTEM_DESIGN.md` - 在线更新系统设计方案

## 关键数据表

**核心表**：`users`、`sects`、`messages`、`admin_action_logs`

**游戏系统**：
- `quests` - 34 任务（主线 10/支线 8/日常 8/隐藏 8）
- `secret_skills` - 41 武功秘籍（丙/乙/甲/绝四级）
- `sect_positions` - 6 级职位（掌门→入门弟子）
- `sect_logs` / `sect_fund_logs` - 门派日志和资金

## Git 工作流

当前分支：`260413-feat-jhchat-refactor`

提交前检查：
1. 确认 `.monkeycode` 外文件需要提交
2. 验证前后端服务正常启动
3. 运行 `npm run check`

## 在线更新系统（进行中）

**目标**：生产端通过 HTTPS API 一键检测/下载/安装更新

**设计文档**：`ONLINE_UPDATE_SYSTEM_DESIGN.md`

**待实施**：
- 创建数据库表 `system_updates`、`update_push_logs`
- 实现 `UpdateController.js` 和 `update.js` 控制器
- 创建前端更新管理页面 `admin/Updates.vue`
- 部署生产端 `auto-update.sh` 脚本

## 部署注意事项

- MySQL：字符集 `utf8mb4`，排序规则 `utf8mb4_unicode_ci`
- 避免使用 MySQL 8.0+ 特有语法
- 确保 `uploads/avatars/` 目录可写
- 后端环境变量 `HOST=0.0.0.0` 支持外网访问
- 生产端路径：`/www/wwwroot/jhchat`（Git 同步目标）

## API 路由验证（2026-04-30）

- ✅ 27 个路由文件全部正常（309 个端点）
- ✅ 24 个控制器全部正常
- ✅ 4 个中间件全部正常
- ✅ 7 个工具模块全部正常
- ✅ 前端反向代理配置正确
- ✅ HTTP 测试通过（ping, server-info, health）
