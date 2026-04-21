<template>
  <div class="chat-logs-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><ChatLineRound /></el-icon>
        聊天记录
      </h1>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="搜索用户名" clearable />
        </el-form-item>
        <el-form-item label="房间">
          <el-select v-model="filterForm.room" placeholder="全部房间" clearable>
            <el-option label="逍遥派" value="逍遥派" />
            <el-option label="少林派" value="少林派" />
            <el-option label="武当派" value="武当派" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable>
            <el-option label="普通消息" value="normal" />
            <el-option label="系统消息" value="system" />
            <el-option label="私聊" value="private" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card>
      <el-table :data="logs" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="room" label="房间" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'system' ? 'warning' : row.type === 'private' ? 'danger' : 'info'">
              {{ messageTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="消息内容" min-width="400" show-overflow-tooltip />
        <el-table-column prop="created_at" label="发送时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="deleteMessage(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatLineRound, Search } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const logs = ref([])

const filterForm = reactive({
  username: '',
  room: '',
  type: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

const messageTypeText = (type) => {
  const map = { normal: '普通', system: '系统', private: '私聊' }
  return map[type] || type
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...filterForm
    }
    const res = await api.get('/admin/chat-logs', { params })
    if (res.data.success) {
      logs.value = res.data.data?.items || res.data.data || []
      pagination.total = res.data.data?.total || logs.value.length
    }
  } catch (error) {
    ElMessage.error('加载聊天记录失败')
  } finally {
    loading.value = false
  }
}

const deleteMessage = async (row) => {
  try {
    await api.delete(`/admin/chat-logs/${row.id}`)
    ElMessage.success('删除成功')
    loadLogs()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.chat-logs-page {
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
  color: #409EFF;
}

.filter-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
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
</style>
