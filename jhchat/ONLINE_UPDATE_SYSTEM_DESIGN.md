# 在线更新系统 - 完整实施方案

**版本**: 1.0.0  
**制定日期**: 2026-04-25  
**服务端地址**: https://5173-9a706b4ab80369c3.monkeycode-ai.online

---

## 一、系统概述

### 1.1 目标

建立一套稳定、安全的在线更新系统，实现：
- ✅ 生产端一键检测更新
- ✅ 生产端一键安装更新
- ✅ 服务端集中管理版本
- ✅ 更新过程可追溯、可回滚

### 1.2 架构设计

```
┌─────────────────┐
│  管理后台        │  创建/发布更新包
│  (Admin Panel)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  服务端          │      │  文件存储        │
│  (MonkeyCode)   │◄────►│  (更新包)        │
│  5173 端口      │      │                 │
└────────┬────────┘      └─────────────────┘
         │
         │ HTTPS API
         │
         ▼
┌─────────────────┐
│  生产环境        │  检测更新 → 下载 → 安装
│  (Production)   │
└─────────────────┘
```

---

## 二、后端 API 设计

### 2.1 API 路由

在 `backend/src/routes/admin.js` 中添加：

```javascript
// 更新管理
router.get('/updates', adminAuth, adminCtrl.getUpdates);           // 获取更新列表
router.get('/updates/:id', adminAuth, adminCtrl.getUpdate);         // 获取更新详情
router.post('/updates', adminAuth, adminCtrl.createUpdate);         // 创建更新
router.put('/updates/:id', adminAuth, adminCtrl.updateUpdate);      // 更新更新记录
router.post('/updates/:id/release', adminAuth, adminCtrl.releaseUpdate); // 发布更新
router.post('/updates/:id/upload', adminAuth, upload.single('package'), adminCtrl.uploadPackage); // 上传更新包

// 生产端使用（公开或 token 认证）
router.get('/updates/check', updateCtrl.checkForUpdates);           // 检查更新
router.get('/updates/download/:version', updateCtrl.downloadPackage); // 下载更新包
router.post('/updates/acknowledge', updateCtrl.acknowledgeUpdate);  // 确认更新
```

### 2.2 核心控制器

创建 `backend/src/controllers/admin/UpdateController.js`：

```javascript
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class UpdateController {
  /**
   * 获取更新列表（管理后台）
   */
  static async getUpdates(req, res) {
    try {
      const { status, type, page = 1, limit = 20 } = req.query;
      
      let sql = `SELECT * FROM system_updates WHERE 1=1`;
      const params = [];
      
      if (status) {
        sql += ` AND status = ?`;
        params.push(status);
      }
      
      if (type) {
        sql += ` AND type = ?`;
        params.push(type);
      }
      
      sql += ` ORDER BY version_code DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
      
      const [updates] = await db.execute(sql, params);
      
      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM system_updates WHERE 1=1`;
      const [countResult] = await db.execute(countSql, status ? [status] : []);
      
      res.json({
        success: true,
        data: {
          updates,
          total: countResult[0].total,
          page: parseInt(page),
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '获取更新列表失败',
        error: err.message
      });
    }
  }

  /**
   * 创建更新记录
   */
  static async createUpdate(req, res) {
    try {
      const {
        version, title, description, changes, type, priority,
        forceUpdate, minVersion, breakingChanges, affectedModules,
        releaseNotes, changelog
      } = req.body;
      
      // 验证版本号格式
      const versionMatch = version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
      if (!versionMatch) {
        return res.status(400).json({
          success: false,
          message: '版本号格式错误，应为 v1.0.0 格式'
        });
      }
      
      // 计算版本代码
      const versionCode = parseInt(versionMatch[1]) * 10000 +
                         parseInt(versionMatch[2]) * 100 +
                         parseInt(versionMatch[3]);
      
      // 检查版本是否已存在
      const [existing] = await db.execute(
        'SELECT id FROM system_updates WHERE version = ?',
        [version]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: '该版本号已存在'
        });
      }
      
      await db.execute(`
        INSERT INTO system_updates (
          version, version_code, title, description, changes, type, priority,
          force_update, min_version, breaking_changes, affected_modules,
          release_notes, changelog, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      `, [
        version, versionCode, title, description, JSON.stringify(changes),
        type, priority, forceUpdate ? 1 : 0, minVersion, breakingChanges ? 1 : 0,
        JSON.stringify(affectedModules), releaseNotes, changelog,
        req.user?.username || 'admin'
      ]);
      
      res.json({
        success: true,
        message: '更新记录创建成功'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '创建更新失败',
        error: err.message
      });
    }
  }

  /**
   * 上传更新包
   */
  static async uploadPackage(req, res) {
    try {
      const { version } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请上传更新包文件'
        });
      }
      
      // 计算文件哈希
      const fileBuffer = fs.readFileSync(req.file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const size = fileBuffer.length;
      
      // 移动文件到存储目录
      const storageDir = path.join(__dirname, '../../updates/packages');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      
      const fileName = `update-${version}.tar.gz`;
      const destPath = path.join(storageDir, fileName);
      fs.renameSync(req.file.path, destPath);
      
      // 更新数据库记录
      await db.execute(`
        UPDATE system_updates 
        SET package_url = ?, package_hash = ?, package_size = ?, status = 'released', release_date = NOW()
        WHERE version = ?
      `, [`/api/updates/download/${version}`, hash, size, version]);
      
      res.json({
        success: true,
        message: '更新包上传成功',
        data: {
          fileName,
          hash,
          size
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '上传更新包失败',
        error: err.message
      });
    }
  }
}

module.exports = UpdateController;
```

### 2.3 生产端控制器

创建 `backend/src/controllers/update.js`：

```javascript
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

class UpdateCheckerController {
  /**
   * 检查更新（生产端调用）
   */
  static async checkForUpdates(req, res) {
    try {
      const { currentVersion, serverName, serverUrl } = req.query;
      
      if (!currentVersion) {
        return res.status(400).json({
          success: false,
          message: '缺少 currentVersion 参数'
        });
      }
      
      // 解析当前版本号
      const match = currentVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: '版本号格式错误'
        });
      }
      
      const currentCode = parseInt(match[1]) * 10000 +
                         parseInt(match[2]) * 100 +
                         parseInt(match[3]);
      
      // 查询可用更新
      const [updates] = await db.execute(`
        SELECT * FROM system_updates
        WHERE status = 'released' AND version_code > ? AND force_update = 0
        ORDER BY version_code ASC
      `, [currentCode]);
      
      // 如果没有普通更新，检查强制更新
      if (updates.length === 0) {
        const [forceUpdates] = await db.execute(`
          SELECT * FROM system_updates
          WHERE status = 'released' AND force_update = 1 AND version_code > ?
          ORDER BY version_code ASC
        `, [currentCode]);
        
        if (forceUpdates.length > 0) {
          return res.json({
            success: true,
            data: {
              hasUpdate: true,
              isForced: true,
              currentVersion: currentVersion,
              updates: forceUpdates.map(u => formatUpdate(u))
            }
          });
        }
      }
      
      // 记录检查日志
      if (serverName && serverUrl && updates.length > 0) {
        await db.execute(`
          INSERT INTO update_push_logs (version, server_name, server_url, push_status)
          VALUES (?, ?, ?, 'pending')
        `, [updates[0].version, serverName, serverUrl]);
      }
      
      res.json({
        success: true,
        data: {
          hasUpdate: updates.length > 0,
          isForced: false,
          currentVersion: currentVersion,
          updates: updates.map(u => formatUpdate(u))
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '检查更新失败',
        error: err.message
      });
    }
  }

  /**
   * 下载更新包
   */
  static async downloadPackage(req, res) {
    try {
      const { version } = req.params;
      
      const [updates] = await db.execute(
        'SELECT * FROM system_updates WHERE version = ? AND status = "released"',
        [version]
      );
      
      if (updates.length === 0) {
        return res.status(404).json({
          success: false,
          message: '更新包不存在'
        });
      }
      
      const packagePath = path.join(__dirname, '../../updates/packages', `update-${version}.tar.gz`);
      
      if (!fs.existsSync(packagePath)) {
        return res.status(404).json({
          success: false,
          message: '更新包文件不存在'
        });
      }
      
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename=update-${version}.tar.gz`);
      res.setHeader('X-Update-Hash', updates[0].package_hash);
      res.setHeader('X-Update-Size', updates[0].package_size);
      
      const fileStream = fs.createReadStream(packagePath);
      fileStream.pipe(res);
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '下载失败',
        error: err.message
      });
    }
  }

  /**
   * 确认更新完成
   */
  static async acknowledgeUpdate(req, res) {
    try {
      const { version, status, serverName, currentVersion } = req.body;
      
      await db.execute(`
        UPDATE update_push_logs
        SET push_status = ?, acknowledge_time = NOW(), acknowledge_by = ?, current_version = ?
        WHERE version = ? AND server_name = ?
        ORDER BY id DESC LIMIT 1
      `, [status, serverName, currentVersion, version, serverName]);
      
      res.json({
        success: true,
        message: '更新状态已更新'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: '更新状态失败',
        error: err.message
      });
    }
  }
}

// 格式化更新数据
function formatUpdate(update) {
  return {
    id: update.id,
    version: update.version,
    versionCode: update.version_code,
    title: update.title,
    description: update.description,
    changes: JSON.parse(update.changes || '[]'),
    type: update.type,
    priority: update.priority,
    forceUpdate: update.force_update,
    releaseDate: update.release_date,
    packageUrl: update.package_url,
    packageHash: update.package_hash,
    packageSize: update.package_size,
    breakingChanges: update.breaking_changes,
    minVersion: update.min_version
  };
}

module.exports = UpdateCheckerController;
```

---

## 三、前端管理界面

### 3.1 更新管理页面

创建 `frontend/src/views/admin/Updates.vue`（简化版）：

```vue
<template>
  <div class="updates-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统更新管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            创建更新
          </el-button>
        </div>
      </template>

      <!-- 更新列表 -->
      <el-table :data="updates" stripe>
        <el-table-column prop="version" label="版本号" width="100" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.priority)">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewUpdate(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'draft'" 
              size="small" 
              type="success"
              @click="releaseUpdate(row)"
            >
              发布
            </el-button>
            <el-button 
              v-if="row.status === 'released' && !row.package_url" 
              size="small" 
              type="warning"
              @click="uploadPackage(row)"
            >
              上传包
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建更新对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建更新" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="版本号" required>
          <el-input v-model="form.version" placeholder="v1.0.0" />
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="更新标题" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="form.type">
            <el-option label="major" value="major" />
            <el-option label="minor" value="minor" />
            <el-option label="patch" value="patch" />
            <el-option label="hotfix" value="hotfix" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" required>
          <el-select v-model="form.priority">
            <el-option label="critical" value="critical" />
            <el-option label="high" value="high" />
            <el-option label="normal" value="normal" />
            <el-option label="low" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="更新内容">
          <el-input
            v-model="form.changesText"
            type="textarea"
            :rows="6"
            placeholder="每行一个更新内容"
          />
        </el-form-item>
        <el-form-item label="发布说明">
          <el-input v-model="form.releaseNotes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createUpdate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const updates = ref([])
const showCreateDialog = ref(false)
const form = reactive({
  version: '',
  title: '',
  type: 'patch',
  priority: 'normal',
  changesText: '',
  releaseNotes: ''
})

const fetchUpdates = async () => {
  try {
    const res = await api.get('/admin/updates')
    if (res.data.success) {
      updates.value = res.data.data.updates
    }
  } catch (err) {
    ElMessage.error('获取更新列表失败')
  }
}

const createUpdate = async () => {
  try {
    const changes = form.changesText.split('\n').filter(line => line.trim())
    
    const res = await api.post('/admin/updates', {
      ...form,
      changes
    })
    
    if (res.data.success) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      fetchUpdates()
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '创建失败')
  }
}

const releaseUpdate = async (row) => {
  try {
    const res = await api.post(`/admin/updates/${row.id}/release`)
    if (res.data.success) {
      ElMessage.success('发布成功')
      fetchUpdates()
    }
  } catch (err) {
    ElMessage.error('发布失败')
  }
}

const uploadPackage = (row) => {
  // 实现文件上传逻辑
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.tar.gz'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('package', file)
    
    try {
      const res = await api.post(`/admin/updates/${row.version}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (res.data.success) {
        ElMessage.success('上传成功')
        fetchUpdates()
      }
    } catch (err) {
      ElMessage.error('上传失败')
    }
  }
  input.click()
}

const getTypeTag = (type) => {
  const map = { major: 'danger', minor: 'warning', patch: 'success', hotfix: 'info' }
  return map[type] || 'info'
}

const getPriorityTag = (priority) => {
  const map = { critical: 'danger', high: 'warning', normal: 'info', low: 'success' }
  return map[priority] || 'info'
}

const getStatusTag = (status) => {
  const map = { draft: 'info', released: 'success', archived: 'warning' }
  return map[status] || 'info'
}

onMounted(() => {
  fetchUpdates()
})
</script>

<style scoped>
.updates-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

---

## 四、生产端更新脚本

创建 `/opt/jhchat/scripts/auto-update.sh`：

```bash
#!/bin/bash

# 江湖聊天室 - 一键自动更新脚本
# 使用方法：./auto-update.sh [服务器名称]

set -e

# 配置
ADMIN_URL="https://5173-9a706b4ab80369c3.monkeycode-ai.online"
CURRENT_VERSION_FILE="./VERSION"
UPDATE_PACKAGE_DIR="./update-packages"
LOG_FILE="./auto-update.log"
SERVER_NAME="${1:-production-server}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

# 获取当前版本
get_current_version() {
  if [ -f "$CURRENT_VERSION_FILE" ]; then
    cat "$CURRENT_VERSION_FILE"
  else
    echo "v1.0.0"
  fi
}

# 检查更新
check_updates() {
  local current_version="$1"
  
  log "正在检查更新 (当前版本：$current_version)..."
  
  local response
  response=$(curl -s -w "\n%{http_code}" \
    "${ADMIN_URL}/api/updates/check?currentVersion=${current_version}&serverName=${SERVER_NAME}&serverUrl=$(hostname)")
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n -1)
  
  if [ "$http_code" != "200" ]; then
    error "检查更新失败 (HTTP $http_code)"
    return 1
  fi
  
  local has_update=$(echo "$body" | jq -r '.data.hasUpdate')
  
  if [ "$has_update" = "true" ]; then
    local is_forced=$(echo "$body" | jq -r '.data.isForced')
    local latest_version=$(echo "$body" | jq -r '.data.updates[-1].version')
    local title=$(echo "$body" | jq -r '.data.updates[-1].title')
    
    success "发现新版本！"
    echo "  版本：$latest_version"
    echo "  标题：$title"
    
    if [ "$is_forced" = "true" ]; then
      warning "⚠️  这是强制更新！"
    fi
    
    # 下载更新
    download_update "$latest_version"
    
    # 安装更新
    install_update "$latest_version"
    
    # 确认更新
    acknowledge_update "$latest_version" "success"
  else
    success "已是最新版本"
  fi
}

# 下载更新包
download_update() {
  local version="$1"
  
  log "正在下载更新包 $version..."
  
  mkdir -p "$UPDATE_PACKAGE_DIR"
  
  local package_file="${UPDATE_PACKAGE_DIR}/update-${version}.tar.gz"
  
  curl -L -o "$package_file" \
    "${ADMIN_URL}/api/updates/download/${version}" \
    --progress-bar
  
  # 验证哈希（可选）
  local expected_hash=$(curl -sI "${ADMIN_URL}/api/updates/download/${version}" | grep -i "X-Update-Hash" | cut -d' ' -f2 | tr -d '\r')
  
  if [ -n "$expected_hash" ]; then
    local actual_hash=$(sha256sum "$package_file" | cut -d' ' -f1)
    
    if [ "$expected_hash" != "$actual_hash" ]; then
      error "校验和验证失败！"
      error "预期：$expected_hash"
      error "实际：$actual_hash"
      return 1
    fi
    success "校验和验证通过"
  fi
  
  success "下载完成：$package_file"
}

# 安装更新
install_update() {
  local version="$1"
  
  log "正在安装更新 $version..."
  
  local package_file="${UPDATE_PACKAGE_DIR}/update-${version}.tar.gz"
  
  # 解压到临时目录
  local temp_dir=$(mktemp -d)
  tar -xzf "$package_file" -C "$temp_dir"
  
  # 备份当前版本
  local backup_dir="./backup/update-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$backup_dir"
  cp -r backend/src "$backup_dir/" 2>/dev/null || true
  cp -r frontend/src "$backup_dir/" 2>/dev/null || true
  success "备份完成：$backup_dir"
  
  # 停止服务
  log "停止服务..."
  fuser -k 3001/tcp 2>/dev/null || true
  sleep 2
  
  # 应用更新
  log "应用更新..."
  if [ -f "$temp_dir/update-${version}/backend/src" ]; then
    cp -r "$temp_dir/update-${version}/backend/src"/* backend/src/
  fi
  
  if [ -f "$temp_dir/update-${version}/frontend/src" ]; then
    cp -r "$temp_dir/update-${version}/frontend/src"/* frontend/src/
  fi
  
  # 执行数据库迁移（如果有）
  if [ -f "$temp_dir/update-${version}/migrations" ]; then
    log "执行数据库迁移..."
    for migration in "$temp_dir/update-${version}/migrations"/*.sql; do
      if [ -f "$migration" ]; then
        mysql -u jhchat -p'JhChat@2026Secure!' jhchat < "$migration"
        log "执行迁移：$(basename $migration)"
      fi
    done
  fi
  
  # 重启服务
  log "重启服务..."
  cd backend && nohup npm run dev > backend.log 2>&1 &
  
  sleep 5
  
  # 验证服务
  if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
    success "服务重启成功"
  else
    error "服务重启失败！"
    warning "正在回滚..."
    rollback "$backup_dir"
    return 1
  fi
  
  # 清理临时文件
  rm -rf "$temp_dir"
  
  # 更新版本号
  echo "$version" > "$CURRENT_VERSION_FILE"
  
  success "更新完成！当前版本：$version"
}

# 回滚
rollback() {
  local backup_dir="$1"
  
  error "正在回滚到备份版本..."
  
  # 停止服务
  fuser -k 3001/tcp 2>/dev/null || true
  sleep 2
  
  # 恢复备份
  cp -r "$backup_dir/backend/src"/* backend/src/ 2>/dev/null || true
  cp -r "$backup_dir/frontend/src"/* frontend/src/ 2>/dev/null || true
  
  # 重启服务
  cd backend && nohup npm run dev > backend.log 2>&1 &
  sleep 5
  
  if curl -s http://localhost:3001/api/ping | grep -q "pong"; then
    success "回滚成功"
  else
    error "回滚失败！请手动处理"
  fi
}

# 确认更新
acknowledge_update() {
  local version="$1"
  local status="$2"
  
  log "发送更新确认..."
  
  curl -s -X POST "${ADMIN_URL}/api/updates/acknowledge" \
    -H "Content-Type: application/json" \
    -d "{
      \"version\": \"$version\",
      \"status\": \"$status\",
      \"serverName\": \"$SERVER_NAME\",
      \"currentVersion\": \"$(cat $CURRENT_VERSION_FILE)\"
    }" > /dev/null
  
  success "确认发送完成"
}

# 主函数
main() {
  echo "========================================"
  echo "江湖聊天室 - 自动更新"
  echo "服务端：${ADMIN_URL}"
  echo "服务器：${SERVER_NAME}"
  echo "========================================"
  echo ""
  
  local current_version=$(get_current_version)
  log "当前版本：$current_version"
  
  check_updates "$current_version"
  
  echo ""
  echo "========================================"
  echo "更新完成"
  echo "日志：$LOG_FILE"
  echo "========================================"
}

# 执行
main "$@"
```

---

## 五、实施步骤

### 5.1 服务端配置

**步骤 1: 执行数据库迁移**

```bash
cd /workspace/jhchat/backend

# 创建数据库表
mysql -u jhchat -pJhChat@2026Secure! jhchat << 'EOF'
-- 粘贴上面数据库设计部分的 SQL
CREATE TABLE IF NOT EXISTS `system_updates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `version` VARCHAR(20) NOT NULL COMMENT '版本号 (v1.0.0)',
  `version_code` INT UNSIGNED NOT NULL COMMENT '版本代码 (10000 = v1.0.0)',
  `title` VARCHAR(200) NOT NULL COMMENT '更新标题',
  `description` TEXT COMMENT '更新描述',
  `changes` JSON COMMENT '更新内容列表',
  `type` ENUM('major', 'minor', 'patch', 'hotfix') DEFAULT 'patch',
  `priority` ENUM('critical', 'high', 'normal', 'low') DEFAULT 'normal',
  `force_update` TINYINT(1) DEFAULT 0 COMMENT '是否强制更新',
  `status` ENUM('draft', 'released', 'archived') DEFAULT 'draft',
  `release_date` DATETIME COMMENT '发布日期',
  `package_url` VARCHAR(500) COMMENT '更新包下载地址',
  `package_hash` VARCHAR(64) COMMENT '更新包 SHA256 哈希',
  `package_size` BIGINT COMMENT '更新包大小 (字节)',
  `min_version` VARCHAR(20) COMMENT '最低支持版本',
  `breaking_changes` TINYINT(1) DEFAULT 0,
  `affected_modules` JSON COMMENT '受影响的模块',
  `release_notes` TEXT COMMENT '发布说明',
  `changelog` TEXT COMMENT '变更日志',
  `created_by` VARCHAR(50) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_version` (`version`),
  KEY `idx_status` (`status`),
  KEY `idx_version_code` (`version_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

# 创建更新包存储目录
mkdir -p /workspace/jhchat/backend/updates/packages
```

**步骤 2: 添加 API 路由**

在 `/workspace/jhchat/backend/src/routes/admin.js` 中添加路由。

**步骤 3: 创建控制器文件**

创建上述设计的控制器文件。

**步骤 4: 重启后端服务**

```bash
cd /workspace/jhchat/backend
fuser -k 3001/tcp 2>/dev/null
nohup npm run dev > backend.log 2>&1 &
```

---

### 5.2 生产端配置

**步骤 1: 复制更新脚本**

```bash
# SSH 到生产服务器
ssh root@生产服务器 IP

# 下载更新脚本
cd /opt/jhchat/scripts
curl -O https://raw.githubusercontent.com/你的仓库/jhchat/main/scripts/auto-update.sh
chmod +x auto-update.sh
```

**步骤 2: 初始化版本号**

```bash
echo "v1.0.0" > /opt/jhchat/VERSION
```

**步骤 3: 测试更新**

```bash
cd /opt/jhchat/scripts
./auto-update.sh production-main
```

---

## 六、测试验证

### 6.1 服务端测试

```bash
# 测试检查更新 API
curl "http://localhost:3001/api/updates/check?currentVersion=v1.0.0"

# 预期返回
{
  "success": true,
  "data": {
    "hasUpdate": true,
    "currentVersion": "v1.0.0",
    "updates": [...]
  }
}
```

### 6.2 生产端测试

```bash
# 执行更新脚本
./auto-update.sh test-server

# 查看日志
tail -f auto-update.log
```

---

## 七、安全建议

1. **API 认证**: 生产端调用应使用 API Token 认证
2. **HTTPS**: 强制使用 HTTPS 传输
3. **文件验证**: 下载后验证 SHA256 哈希
4. **备份机制**: 更新前必须备份
5. **回滚方案**: 提供一键回滚功能
6. **权限控制**: 只有管理员可以创建更新

---

## 八、后续优化

1. **断点续传**: 大文件支持断点续传
2. **增量更新**: 支持差量更新减少下载量
3. **灰度发布**: 支持分批次发布
4. **监控告警**: 更新失败自动告警
5. **定时检查**: 生产端定时检查更新

---

**文档版本**: 1.0.0  
**更新时间**: 2026-04-25  
**负责人**: MonkeyCode Team
