# 系统更新推送功能 - 本地开发测试

## 📦 新增文件

### 后端文件
- `backend/src/controllers/admin/UpdateController.js` - 更新管理控制器
- `backend/src/routes/admin.js` - 更新管理路由（已修改）
- `backend/src/controllers/admin/index.js` - 控制器聚合（已修改）
- `backend/scripts/generate-changelog.js` - Git 日志自动生成脚本
- `database/updates_table.sql` - 数据库表结构

### 前端文件
- `frontend/src/views/admin/Updates.vue` - 更新管理界面
- `frontend/src/router/index.js` - 路由配置（已修改）

### 文档
- `UPDATE_SYSTEM_GUIDE.md` - 系统使用指南
- `PRODUCTION_UPDATE_GUIDE.md` - 生产环境更新指南

---

## 🚀 本地部署步骤

### 1. 初始化数据库表

```bash
# 方式 1: 使用自动脚本
cd /workspace/jhchat
chmod +x scripts/init-update-system.sh
./scripts/init-update-system.sh

# 方式 2: 手动执行 SQL
mysql -u jhchat -p jhchat < database/updates_table.sql
```

### 2. 重启后端服务

```bash
cd /workspace/jhchat/backend

# 如果使用 PM2
pm2 restart jhchat-backend --update-env

# 如果直接运行
node src/server.js
```

### 3. 访问管理界面

打开浏览器访问：`http://localhost:5173/admin/updates`

---

## 🧪 功能测试

### 测试 1: 创建更新记录

1. 访问 `/admin/updates`
2. 点击「创建更新」
3. 填写信息：
   ```
   版本号：v1.2.0
   标题：测试更新
   描述：测试更新推送功能
   更新内容:
   - 新增功能 A
   - 修复 bug B
   - 优化性能 C
   类型：patch
   优先级：normal
   ```
4. 点击保存

### 测试 2: 发布更新

1. 在列表中找到刚创建的更新
2. 点击「发布」按钮
3. 确认发布

### 测试 3: 检查更新 API

```bash
# 测试检查更新接口
curl "http://localhost:3001/api/admin/updates/check?currentVersion=v1.0.0"

# 测试获取更新列表（需要认证）
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3001/api/admin/updates
```

### 测试 4: 使用 Git 生成更新日志

```bash
cd /workspace/jhchat/backend

# 生成从 v1.1.0 到现在的更新日志
node scripts/generate-changelog.js v1.2.0 v1.1.0

# 输出 JSON 格式，可复制到创建表单
```

---

## 📊 API 接口测试

### 获取更新列表

```bash
curl -X GET "http://localhost:3001/api/admin/updates?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 创建更新

```bash
curl -X POST "http://localhost:3001/api/admin/updates" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "v1.2.0",
    "title": "新增游戏系统",
    "description": "添加了新的游戏功能",
    "changes": ["新增钓鱼系统", "新增挖矿系统"],
    "type": "minor",
    "priority": "normal"
  }'
```

### 发布更新

```bash
curl -X POST "http://localhost:3001/api/admin/updates/1/release" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"release_date": "'$(date -Iseconds)'"}'
```

### 检查更新

```bash
curl "http://localhost:3001/api/admin/updates/check?currentVersion=v1.0.0"
```

---

## 🎨 界面预览

访问 `/admin/updates` 后可以看到：

1. **更新列表** - 表格显示所有版本更新
2. **筛选栏** - 按状态、类型、优先级筛选
3. **创建按钮** - 打开创建/编辑弹窗
4. **操作按钮** - 详情、编辑、发布、推送、删除

---

## ⚠️ 注意事项

1. **数据库表必须先创建** - 否则 API 会报错
2. **版本号格式** - 必须是 `v1.0.0` 格式
3. **版本号唯一** - 不能重复
4. **发布后才能推送** - draft 状态不能推送

---

## 🔧 故障排查

### 问题 1: 访问页面 404

**解决**: 检查路由是否添加到 `router/index.js`

### 问题 2: API 返回 500 错误

**解决**: 
1. 检查数据库表是否存在：`SHOW TABLES LIKE 'system%';`
2. 查看后端日志：`pm2 logs jhchat-backend`

### 问题 3: 无法创建更新

**解决**: 检查版本号格式，确保符合 `v\d+\.\d+\.\d+` 正则

---

## 📝 下一步

1. 测试完功能后，可以推送到生产环境
2. 生产环境执行数据库初始化脚本
3. 在管理后台创建生产环境的第一个更新记录
