<template>
  <div class="cache-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Delete /></el-icon>
        清理缓存
      </h1>
    </div>

    <!-- 缓存统计 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>缓存统计</span>
          <el-button size="small" @click="loadStats" :loading="loadingStats">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="内存使用">
            <template #value>
              {{ stats.memory }}
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="总缓存键数" :value="stats.totalKeys" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="连接客户端" :value="stats.connectedClients" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="Redis 状态">
            <template #value>
              <el-tag :type="stats.status === '正常' ? 'success' : 'danger'" size="small">
                {{ stats.status }}
              </el-tag>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">用户缓存</div>
            <div class="stat-value">{{ stats.breakdown.user }} 个</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">在线用户缓存</div>
            <div class="stat-value">{{ stats.breakdown.online }} 个</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">聊天缓存</div>
            <div class="stat-value">{{ stats.breakdown.chat }} 个</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">门派缓存</div>
            <div class="stat-value">{{ stats.breakdown.sect }} 个</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">物品缓存</div>
            <div class="stat-value">{{ stats.breakdown.item }} 个</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">系统缓存</div>
            <div class="stat-value">{{ stats.breakdown.system }} 个</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-label">其他缓存</div>
            <div class="stat-value">{{ stats.breakdown.other }} 个</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 清理操作 -->
    <el-card>
      <template #header>
        <span>清理操作</span>
      </template>

      <el-alert
        title="清理缓存会影响系统性能，请谨慎操作"
        type="warning"
        :closable="false"
        class="mb-4"
      />

      <el-form>
        <el-form-item label="选择清理类型">
          <el-radio-group v-model="cleanType">
            <el-radio value="all">全部清理</el-radio>
            <el-radio value="user">用户缓存</el-radio>
            <el-radio value="online">在线用户</el-radio>
            <el-radio value="chat">聊天缓存</el-radio>
            <el-radio value="sect">门派缓存</el-radio>
            <el-radio value="item">物品缓存</el-radio>
            <el-radio value="system">系统缓存</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="danger"
            @click="showClearConfirm"
            :loading="cleaning"
            size="large"
          >
            <el-icon><Delete /></el-icon>
            开始清理
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Refresh } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loadingStats = ref(false)
const cleaning = ref(false)
const cleanType = ref('all')

const stats = reactive({
  memory: '0 MB',
  totalKeys: 0,
  connectedClients: 0,
  status: '正常',
  breakdown: {
    user: 0,
    online: 0,
    chat: 0,
    sect: 0,
    item: 0,
    system: 0,
    other: 0
  }
})

const loadStats = async () => {
  loadingStats.value = true
  try {
    const res = await api.get('/admin/server/cache-stats')
    if (res.data.success) {
      const data = res.data.data
      stats.memory = data.memory
      stats.totalKeys = data.totalKeys
      stats.connectedClients = data.connectedClients
      stats.status = '正常'
      stats.breakdown = data.breakdown
    }
  } catch (error) {
    console.error('加载缓存统计失败:', error)
    stats.status = '异常'
  } finally {
    loadingStats.value = false
  }
}

const showClearConfirm = async () => {
  const typeNames = {
    all: '全部缓存',
    user: '用户缓存',
    online: '在线用户缓存',
    chat: '聊天缓存',
    sect: '门派缓存',
    item: '物品缓存',
    system: '系统缓存'
  }

  try {
    await ElMessageBox.confirm(
      `确定要清理${typeNames[cleanType.value]}吗？此操作不可恢复，可能会导致短时间内系统性能下降。`,
      '警告',
      {
        type: 'warning',
        confirmButtonText: '确定清理',
        cancelButtonText: '取消'
      }
    )

    await clearCache()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败：' + error.message)
    }
  }
}

const clearCache = async () => {
  cleaning.value = true
  try {
    const res = await api.post('/admin/server/clear-cache', {
      type: cleanType.value
    })

    if (res.data.success) {
      ElMessage.success(res.data.message)
      if (res.data.details && res.data.details.length > 0) {
        ElMessage({
          type: 'info',
          message: res.data.details.join('，'),
          duration: 5000
        })
      }
      loadStats()
    }
  } catch (error) {
    ElMessage.error('清理失败：' + (error.message || '未知错误'))
  } finally {
    cleaning.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.cache-page {
  padding: 0;
}

.mb-4 {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  color: #fff;
  margin: 0;
}

.page-title .el-icon {
  font-size: 28px;
  color: #f56c6c;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

:deep(.el-statistic__title) {
  color: #a0a0a0;
}

:deep(.el-statistic__content) {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

:deep(.el-card) {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #fff;
}

:deep(.el-alert) {
  background: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.3);
}

:deep(.el-alert__title) {
  color: #e6a23c;
}
</style>
