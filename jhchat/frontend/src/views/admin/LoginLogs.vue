<template>
  <div class="login-logs-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><List /></el-icon>
        登录日志
      </h1>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="搜索用户名" clearable />
        </el-form-item>
        <el-form-item label="IP 地址">
          <el-input v-model="filterForm.ip" placeholder="搜索 IP" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
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
        <el-table-column prop="ip" label="IP 地址" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.ip }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地理位置" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="失败原因" width="200" />
        <el-table-column prop="created_at" label="登录时间" width="180" />
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
import { List, Search } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const logs = ref([])

const filterForm = reactive({
  username: '',
  ip: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...filterForm
    }
    const res = await api.get('/admin/login-logs', { params })
    if (res.data.success) {
      logs.value = res.data.data?.items || res.data.data || []
      pagination.total = res.data.data?.total || logs.value.length
    }
  } catch (error) {
    ElMessage.error('加载登录日志失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.login-logs-page {
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
