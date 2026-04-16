# Agent 指令 - 笑傲江湖聊天室

## 快速启动

### Docker 部署（推荐）
```bash
docker-compose up -d
docker-compose exec backend node src/scripts/init-db.js
docker-compose exec backend node src/scripts/seed.js
```
访问：http://localhost | 管理员：站长 / admin123

### 本地开发
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE jhchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 后端 (端口 3001)
cd backend && npm install && cp .env.example .env
npm run init-db && npm run seed && npm run dev

# 前端 (端口 5173)
cd frontend && npm install && npm run dev
```

## 命令参考

| 命令 | 说明 |
|------|------|
| `npm run init-db` | 初始化数据库表结构 |
| `npm run seed` | 插入基础数据（8 门派、系统配置、房间等） |
| `npm run dev` | 启动开发服务器 |

## 核心文件

- `backend/src/scripts/schema.sql` - 39 张表 DDL
- `backend/src/scripts/init-db.js` - 数据库初始化脚本
- `backend/src/scripts/seed.js` - 种子数据脚本
- `backend/.env.example` - 环境变量模板
- `backend/src/socket/commands.js` - 39 个斜杠命令处理
- `frontend/src/utils/api.js` - API 封装
- `frontend/src/utils/socket.js` - Socket.IO 封装

## 技术栈

- **后端**：Node.js 20 + Express + Socket.IO + MySQL2 + JWT + bcrypt
- **前端**：Vue 3 + Vite + Pinia + Element Plus + Axios
- **数据库**：MySQL 8.0 / MariaDB 10.11（utf8mb4）

## 数据库配置

```
数据库：jhchat
字符集：utf8mb4
用户：root (Docker: jhchat_root_pass)
```

## 项目结构

```
jhchat/
├── backend/
│   └── src/
│       ├── config/        # 数据库配置
│       ├── controllers/   # 业务逻辑
│       ├── middleware/    # 认证中间件 (auth.js, adminAuth.js)
│       ├── routes/        # RESTful API
│       ├── scripts/       # 初始化脚本
│       ├── socket/        # Socket.IO 实时通信
│       └── server.js      # 入口
├── frontend/
│   └── src/
│       ├── stores/        # Pinia 状态管理
│       ├── views/         # 页面组件
│       │   └── admin/     # 管理后台 (10 个页面)
│       └── utils/         # API/Socket 封装
└── docker-compose.yml
```

## 重要约定

1. **前端 API 代理**：Vite 已配置 `/api` 代理到后端 3001 端口
2. **管理员权限**：`grade >= 6`，使用 `adminAuth` 中间件验证
3. **bcrypt 加密**：原 ASP 密码无法迁移，需重置为 admin123
4. **图片素材**：已复用至 `frontend/public/assets/`（29 头像/320 表情/307 聊天图片）

## 常见问题

- **首次运行**：必须先执行 `init-db.js` 和 `seed.js`
- **密码错误**：bcrypt 加密后需重置密码
- **端口占用**：后端 3001，前端 5173

## 文档位置

- 详细说明：`README.md`
- 重构设计：`.monkeycode/specs/refactor-design.md`
- 用户指令记忆：`.monkeycode/MEMORY.md`
