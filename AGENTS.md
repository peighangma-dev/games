# 江湖聊天室 (JHChat) - Agent 指南

## 项目概述

江湖聊天室是一个基于 Vue 3 + Express + MySQL + Socket.IO 的 MUD 风格武侠聊天室系统，包含完整的管理后台、游戏系统、经济系统和社交系统。

## 快速启动命令

### 后端服务
```bash
cd /workspace/jhchat/backend
npm run dev
```
- 运行在端口 `3001`
- 依赖 MySQL 5.7+ 和 Redis（可选）
- 环境变量：`.env` 文件配置数据库连接和 JWT 密钥

### 前端服务
```bash
cd /workspace/jhchat/frontend
npm run dev
```
- 运行在端口 `5173`
- Vite 配置了到后端的反向代理（`/api`、`/uploads`、`/socket.io`）
- 允许的主机：`*.monkeycode-ai.online`

### 数据库初始化
```bash
# 创建数据库和表结构
node src/scripts/init-db.js

# 填充初始数据（41 个武功秘籍、34 个任务等）
node src/scripts/seed.js

# 创建管理员操作日志表
node scripts/create-admin-action-logs-table.js
```

## 项目结构

```
/workspace/jhchat/
├── backend/
│   ├── src/
│   │   ├── controllers/     # 控制器（按模块分组，admin/ 为管理后台）
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/      # 中间件（adminAuth.js 权限验证、upload.js 文件上传）
│   │   ├── models/          # 数据模型
│   │   ├── socket/          # Socket.IO 事件处理
│   │   ├── utils/           # 工具函数（logger、monitor）
│   │   ├── scripts/         # 数据库脚本（init-db.js、seed.js）
│   │   └── server.js        # 服务器入口
│   ├── scripts/             # 独立脚本
│   ├── migrations/          # 数据库迁移
│   ├── uploads/             # 上传文件（头像等）
│   └── logs/                # 日志目录
├── frontend/
│   ├── src/
│   │   ├── views/           # 页面组件（admin/ 为管理后台页面）
│   │   ├── components/      # 通用组件
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── router/          # 路由配置
│   │   ├── utils/           # 工具函数（api.js 封装 axios）
│   │   └── assets/          # 静态资源
│   ├── electron/            # Electron 桌面端
│   └── public/assets/       # 公共资源
└── .monkeycode/             # 项目文档和规格说明
    ├── docs/                # 系统文档（ADMIN_MANUAL.md、ADMIN_API_REFERENCE.md）
    └── specs/               # 功能规格（需求 + 设计）
```

## 管理员权限系统

### 权限等级
| 等级 | 称号 | 权限范围 |
|------|------|----------|
| 6-7 | 护法 | 用户管理、聊天室管理、新闻发布 |
| 8-9 | 长老 | 物品管理、活动管理、IP 管理、经济调控 |
| 10 | 掌门 | 全部权限（包括管理员任免、系统配置） |

### 关键约束
- **所有管理员必须属于 "六扇门"** 才能行使管理权限
- 权限验证中间件：`backend/src/middleware/adminAuth.js`
- 前端权限判断：`userStore.isAdmin` = `grade >= 6 && faction === '六扇门'`

### 管理后台页面
- `/admin` - 管理后台入口
- 主要页面：Users、Sects、Items、Quests、SecretSkills、IpLocks、Audit（日志审计）

## 数据库关键表

### 核心表
- `users` - 用户表（`sect_position`、`sect_contribution` 用于门派管理）
- `sects` - 门派表（`fund` 字段存储门派资金）
- `messages` - 聊天消息
- `admin_action_logs` - 管理员操作日志

### 游戏系统表
- `quests` - 任务（34 个：主线 10/支线 8/日常 8/隐藏 8）
- `secret_skills` - 武功秘籍（41 个，分丙/乙/甲/绝四级）
- `items` / `shop_items` - 物品和商店
- `sect_applications` - 入派申请
- `sect_positions` - 门派职位（每个门派 6 级：掌门、长老、护法、核心弟子、普通弟子、入门弟子）
- `sect_logs` - 门派日志
- `sect_fund_logs` - 门派资金日志

## 开发注意事项

### 环境变量
后端 `.env` 必需配置：
```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=jhchat
DB_PASSWORD=<password>
DB_NAME=jhchat
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 代码风格
- 后端：JavaScript (ES6+)，使用 `mysql2/promise` 异步数据库操作
- 前端：Vue 3 + Composition API + Pinia
- 中文注释和文档
- 错误处理：统一的响应格式 `{ success, data, message, code }`

### 常见问题
1. **数据库字段不匹配**：控制器中的字段名必须与数据库表结构一致（如 `level` vs `grade`）
2. **缺失的表**：新增功能时需检查是否需要创建新表，参考 `scripts/migrations/`
3. **前端编译错误**：检查是否有重复的函数定义或孤立的 `return` 语句
4. **服务未加载最新代码**：修改后端代码后需重启 `npm run dev`

### 测试
```bash
# 后端 lint
npm run lint
npm run lint:fix

# 格式化
npm run format
```

## 部署相关

### 上传目录
- 头像：`backend/uploads/avatars/`（需确保目录存在且可写）
- 静态资源：`frontend/public/assets/`

### 日志
- 目录：`backend/logs/`
- 使用 Winston 进行日志轮转（DailyRotateFile）

### MySQL 兼容性
- 使用 MySQL 5.7，注意字符集 `utf8mb4` 和排序规则 `utf8mb4_unicode_ci`
- 避免使用 MySQL 8.0+ 特有的语法

## 重要文档

- `.monkeycode/docs/ADMIN_MANUAL.md` - 管理员使用手册
- `.monkeycode/docs/ADMIN_API_REFERENCE.md` - 管理后台 API 接口文档
- `.monkeycode/docs/ERROR_MESSAGES_GUIDE.md` - 错误提示指南
- `backend/src/scripts/schema.sql` - 完整数据库表结构（1033 行）

## Git 工作流

当前分支：`260413-feat-jhchat-refactor`

提交代码前：
1. 检查是否有 `.monkeycode` 目录外的文件需要提交
2. 确保前后端服务能正常启动
3. 运行 `npm run check` 进行代码检查
