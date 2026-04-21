<template>
  <div class="security-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Warning /></el-icon>
        反作弊监控
      </h1>
      <div class="page-actions">
        <el-button type="danger" @click="clearAllCheats">
          <el-icon><Delete /></el-icon>
          清理所有作弊者
        </el-button>
      </div>
    </div>

    <!-- 监控指标 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-statistic title="可疑用户" :value="stats.suspiciousUsers" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="今日警告" :value="stats.todayWarnings" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="今日封禁" :value="stats.todayBans" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="监控中" :value="stats.monitoring" />
      </el-col>
    </el-row>

    <!-- 可疑行为列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>可疑行为监控</span>
          <el-switch v-model="autoBan" active-text="自动封禁" />
        </div>
      </template>
      
      <el-table :data="suspiciousUsers" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="behavior" label="可疑行为" min-width="200" />
        <el-table-column prop="count" label="次数" width="100">
          <template #default="{ row }">
            <el-tag :type="row.count > 10 ? 'danger' : 'warning'">
              {{ row.count }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_detected" label="最后检测" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">查看详情</el-button>
            <el-button size="small" type="warning" @click="warnUser(row)">警告</el-button>
            <el-button size="small" type="danger" @click="banUser(row)">封禁</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="dialogVisible" title="可疑行为详情" width="800px">
      <div v-if="selectedUser" class="detail-content">
        <p><strong>用户：</strong>{{ selectedUser.username }}</p>
        <p><strong>ID：</strong>{{ selectedUser.user_id }}</p>
        <p><strong>可疑行为：</strong>{{ selectedUser.behavior }}</p>
        <p><strong>检测次数：</strong>{{ selectedUser.count }}</p>
        <p><strong>首次检测：</strong>{{ selectedUser.first_detected }}</p>
        <p><strong>最后检测：</strong>{{ selectedUser.last_detected }}</p>
        
        <el-divider>行为日志</el-divider>
        <el-table :data="selectedUser.logs" size="small">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="action" label="行为" min-width="200" />
          <el-table-column prop="details" label="详情" min-width="200" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Delete } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const autoBan = ref(false)
const dialogVisible = ref(false)
const selectedUser = ref(null)

const stats = reactive({
  suspiciousUsers: 0,
  todayWarnings: 0,
  todayBans: 0,
  monitoring: 0
})

const suspiciousUsers = ref([])

const loadSecurityData = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/security/suspicious')
    if (res.data.success) {
      suspiciousUsers.value = res.data.data?.users || []
      stats.suspiciousUsers = suspiciousUsers.value.length
      stats.todayWarnings = res.data.data?.today_warnings || 0
      stats.todayBans = res.data.data?.today_bans || 0
    }
  } catch (error) {
    console.error('加载安全数据失败:', error)
  } finally {
    loading.value = false
  }
}

const viewDetails = (row) => {
  selectedUser.value = row
  dialogVisible.value = true
}

const warnUser = async (row) => {
  try {
    await api.post(`/admin/security/warn/${row.user_id}`)
    ElMessage.success(`已警告用户 ${row.username}`)
    loadSecurityData()
  } catch (error) {
    ElMessage.error('警告失败')
  }
}

const banUser = async (row) => {
  try {
    await api.post(`/admin/security/ban/${row.user_id}`)
    ElMessage.success(`已封禁用户 ${row.username}`)
    loadSecurityData()
  } catch (error) {
    ElMessage.error('封禁失败')
  }
}

const clearAllCheats = async () => {
  try {
    await api.post('/admin/security/clear-all')
    ElMessage.success('已清理所有作弊者')
    loadSecurityData()
  } catch (error) {
    ElMessage.error('清理失败')
  }
}

onMounted(() => {
  loadSecurityData()
})
</script>

<style scoped>
.security-page {
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

.detail-content {
  line-height: 2;
  color: #e0e0e0;
}

.detail-content strong {
  color: #fff;
}

:deep(.el-statistic__title) {
  color: #a0a0a0;
}

:deep(.el-statistic__content) {
  color: #fff;
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

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.05);
  --el-table-text-color: #e0e0e0;
  --el-table-header-text-color: #a0a0a0;
  --el-table-border-color: rgba(255, 255, 255, 0.05);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);
}

:deep(.el-dialog) {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-dialog__title) {
  color: #fff;
}
</style>
