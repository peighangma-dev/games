# 笑傲江湖聊天室 - 重构版

基于原ASP笑傲江湖XP聊天室系统的现代技术栈重构版本。

## 技术栈

- **数据库**：MySQL 8.0
- **后端**：Node.js + Express + Socket.IO
- **前端**：Vue 3 + Vite + Pinia + Element Plus
- **实时通信**：Socket.IO (WebSocket)
- **认证**：JWT + bcrypt

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
docker-compose up -d
```

初始化数据库（仅首次）：

```bash
docker-compose exec backend node src/scripts/init-db.js
docker-compose exec backend node src/scripts/seed.js
```

访问：http://localhost

默认管理员：站长 / admin123

### 方式二：本地开发

#### 前提条件

- Node.js 20+
- MySQL 8.0+

#### 1. 创建数据库

```bash
mysql -u root -p -e "CREATE DATABASE jhchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

#### 2. 后端

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 设置数据库连接信息
npm run init-db
npm run seed
npm run dev
```

后端运行在 http://localhost:3001

#### 3. 前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173

## 项目结构

```
jhchat/
  backend/               # 后端服务
    src/
      config/            # 数据库配置
      controllers/       # 业务逻辑
      middleware/         # 认证/权限中间件
      routes/            # 路由定义
      scripts/           # 数据库初始化/种子脚本
        schema.sql       # 数据库建表脚本
      socket/            # Socket.IO实时通信
        commands.js      # 39个斜杠命令处理
      utils/             # 工具函数
      server.js          # 入口文件
  frontend/              # 前端应用
    public/assets/       # 静态资源（原图片素材）
      avatars/           # 29个用户头像
      emoticons/         # 320个表情图片
      chat-images/       # 307个聊天图片
      logos/             # 20个Logo图标
      cards/             # 54个扑克牌图片
    src/
      router/            # 路由配置
      stores/            # Pinia状态管理
      utils/             # API/Socket工具
      views/             # 页面组件
        admin/           # 管理后台页面
      styles/            # 全局样式
  docker-compose.yml     # Docker编排
```

## 功能清单

### 用户端

| 模块 | 功能 | 对应原ASP |
|------|------|-----------|
| 认证 | 注册/登录/修改密码/自杀/复生 | login.asp / CHECK.ASP / MODIFY.ASP |
| 聊天 | 实时聊天/多房间/私聊/分屏/表情/动作/39个斜杠命令 | CHAT/SAY.ASP |
| 邮件 | 收发邮件/未读标记 | jhyj/ |
| 门派 | 加入/离开/篡位/册封/管理 | MYPAI.ASP / BBS/ |
| 婚姻 | 征婚/结婚/离婚/客栈/生育 | YUELAO.ASP / JHKZ/ |
| 武功 | 练功/藏经阁/打坐 | WG/ / jhqc/ |
| 物品 | 背包/使用/丢弃/二手市场/卡片/保险/打工 | Wupinxp.asp / BUYWUPIN/ |
| 酒店 | 菜单/点菜 | jiudian/ |
| 医院 | 治疗/怀孕/生子/打胎 | yiyuan/ |
| 面馆 | 做面/卖面/吃面 | qmg/ |
| 游戏 | 21点/骰子/猜大小/钓鱼/打猎/比山论剑 | BET/ / 21point/ / diaoyu/ |
| 宠物 | 宠物羊/星河宠物/小宠 | myhome/sheep/ / XH/ |
| 配药 | 12种药方炼制 | peiyao/ |
| 排行 | 多维度排行 | TOP/ |
| 其他 | 许愿墙/投票/温泉/照片/悬赏/监狱/烟花院 | 各子目录 |

### 管理后台

| 模块 | 功能 | 对应原ASP |
|------|------|-----------|
| 用户管理 | 查看/编辑/封禁/解封/批量删除 | xajhxp_wen/manuser.asp |
| 管理员管理 | 招聘/开除/等级调整 | ADMIN.ASP / ADMIN1.ASP |
| 系统配置 | 34项系统参数配置 | xajhxp_wen/mansys.asp |
| 房间管理 | 房间CRUD/PK开关 | xajhxp_wen/manroom.asp |
| IP管理 | 临时/永久封锁 | CHAT/MANLOCK.ASP / MANIP.ASP |
| 内容管理 | 公告/投票/照片审核 | YAMEN/ / POLL/ |
| 物品管理 | 武器/药品/卡片CRUD | xajhxp_wen/binqi.asp等 |
| 数据统计 | 在线/注册/聊天/经济/门派统计 | - |
| 操作日志 | 查看/清除 | xajhxp_wen/manlog.asp |

## API文档

后端提供RESTful API，基础路径：`/api`

认证头：`Authorization: Bearer <token>`

主要端点：

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/users/me` - 当前用户
- `GET /api/chat/rooms` - 房间列表
- `GET /api/chat/rooms/:id/messages` - 历史消息
- `GET /api/messages/inbox` - 收件箱
- `GET /api/sects` - 门派列表
- `GET /api/admin/users` - 用户管理（管理员）
- `GET /api/admin/config` - 系统配置（管理员）

完整API列表见 `.monkeycode/specs/refactor-design.md` 第三章。

## 数据库

共39张表，完整DDL见 `backend/src/scripts/schema.sql`。

核心表：users, system_config, sects, chat_rooms, chat_messages, online_users, messages, items, news 等。

## 特别说明

- 本项目为重构基准代码，**不包含原生安装包**
- 原图片素材已复用至 `frontend/public/assets/` 目录
- 缺失素材位置已标注灰色占位
- 密码使用bcrypt加密，原自定义加密无法迁移，需重置

## 许可

本项目基于原"笑傲江湖XP"ASP源码重构，仅供学习和研究使用。
