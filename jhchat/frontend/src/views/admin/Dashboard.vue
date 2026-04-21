<template>
  <div class="dashboard-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><DataAnalysis /></el-icon>
        仪表盘
      </h1>
      <div class="page-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card online">
        <div class="stat-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.onlineUsers }}</div>
          <div class="stat-label">在线用户</div>
          <div class="stat-trend positive">
            <el-icon><Top /></el-icon>
            {{ stats.roomCount }} 个房间
          </div>
        </div>
      </el-card>

      <el-card class="stat-card total">
        <div class="stat-icon">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalUsers.toLocaleString() }}</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-trend">
            今日：+{{ stats.newToday }} | 本月：+{{ stats.newThisMonth }}
          </div>
        </div>
      </el-card>

      <el-card class="stat-card chat">
        <div class="stat-icon">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.messagesToday.toLocaleString() }}</div>
          <div class="stat-label">今日消息</div>
          <div class="stat-trend">
            总计：{{ stats.messagesTotal.toLocaleString() }}
          </div>
        </div>
      </el-card>

      <el-card class="stat-card economy">
        <div class="stat-icon">
          <el-icon><Coin /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.totalSilver / 10000).toFixed(1) }}万</div>
          <div class="stat-label">流通银两</div>
          <div class="stat-trend">
            人均：{{ stats.avgSilver }} | 存款：{{ (stats.totalDeposit / 10000).toFixed(1) }}万
          </div>
        </div>
      </el-card>
    </div>

    <!-- 服务器状态 -->
    <el-row :gutter="20" class="mt-4">
      <el-col :span="12">
        <el-card class="server-status-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Monitor /></el-icon> 服务器状态</span>
              <el-tag :type="serverStatus === 'online' ? 'success' : 'danger'">
                {{ serverStatus === 'online' ? '运行中' : '离线' }}
              </el-tag>
            </div>
          </template>
          
          <div class="server-info">
            <div class="info-item">
              <span class="info-label">运行时间：</span>
              <span class="info-value">{{ formatUptime(serverInfo.uptime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据库：</span>
              <el-tag size="small" type="success">已连接</el-tag>
            </div>
            <div class="info-item">
              <span class="info-label">Redis：</span>
              <el-tag size="small" type="success">已连接</el-tag>
            </div>
            <div class="info-item">
              <span class="info-label">Node 版本：</span>
              <span class="info-value">{{ serverInfo.nodeVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">内存使用：</span>
              <span class="info-value">{{ formatBytes(serverInfo.memory?.used_heap_size) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="quick-actions-card">
          <template #header>
            <span><el-icon><Operation /></el-icon> 快捷操作</span>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" @click="broadcastMessage">
              <el-icon><Bell /></el-icon>
              全服公告
            </el-button>
            <el-button type="warning" @click="maintenanceMode">
              <el-icon><Tools /></el-icon>
              维护模式
            </el-button>
            <el-button type="danger" @click="emergencyShutdown">
              <el-icon><SwitchButton /></el-icon>
              紧急Shutdown
            </el-button>
            <el-button @click="clearCache">
              <el-icon><Delete /></el-icon>
              清理缓存
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="mt-4">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span><el-icon><TrendCharts /></el-icon> 用户增长趋势</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="loadChartData">
                <el-radio-button label="7d">7 天</el-radio-button>
                <el-radio-button label="30d">30 天</el-radio-button>
                <el-radio-button label="90d">90 天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div class="chart-container" ref="userChartRef">
            <div v-if="!chartLoaded" class="chart-loading">
              <el-skeleton :rows="5" animated />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span><el-icon><MessageBox /></el-icon> 聊天消息趋势</span>
              <el-radio-group v-model="chatChartPeriod" size="small" @change="loadChatChartData">
                <el-radio-button label="7d">7 天</el-radio-button>
                <el-radio-button label="30d">30 天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div class="chart-container" ref="chatChartRef">
            <div v-if="!chartLoaded" class="chart-loading">
              <el-skeleton :rows="5" animated />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时监控 -->
    <el-row :gutter="20" class="mt-4">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span><el-icon><VideoCamera /></el-icon> 实时监控</span>
          </template>
          
          <el-table :data="realtimeData.byRoom" style="width: 100%" :row-key="row => row.name">
            <el-table-column prop="name" label="房间名称" width="200" />
            <el-table-column prop="count" label="在线人数" width="150">
              <template #default="{ row }">
                <el-tag :type="row.count > 50 ? 'success' : row.count > 20 ? 'warning' : 'info'">
                  {{ row.count }} 人
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="热度" width="300">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.min(100, (row.count / maxRoomCapacity) * 100)"
                  :status="row.count > 50 ? 'success' : 'normal'"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  Refresh,
  User,
  UserFilled,
  ChatDotRound,
  Coin,
  Monitor,
  Operation,
  Bell,
  Tools,
  SwitchButton,
  Delete,
  TrendCharts,
  MessageBox,
  VideoCamera,
  Top
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import api from '../../utils/api'

const loading = ref(false)
const serverStatus = ref('online')
const serverInfo = ref({})
const stats = ref({
  onlineUsers: 0,
  totalUsers: 0,
  newToday: 0,
  newThisMonth: 0,
  messagesToday: 0,
  messagesTotal: 0,
  totalSilver: 0,
  avgSilver: 0,
  totalDeposit: 0,
  roomCount: 0
})

const realtimeData = ref({
  byRoom: []
})

const chartPeriod = ref('7d')
const chatChartPeriod = ref('7d')
const chartLoaded = ref(false)
const userChartRef = ref(null)
const chatChartRef = ref(null)
const maxRoomCapacity = ref(100)

let userChart = null
let chatChart = null
let refreshTimer = null

const formatUptime = (seconds) => {
  if (!seconds) return '0 分钟'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 MB'
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(1)} MB`
}

const loadDashboardData = async () => {
  try {
    const [overviewRes, realtimeRes, serverRes] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/dashboard/realtime?online=' + stats.value.onlineUsers),
      api.get('/admin/server/status')
    ])

    if (overviewRes.data.success) {
      stats.value = {
        ...overviewRes.data.data.users,
        ...overviewRes.data.data.chat,
        ...overviewRes.data.data.economy,
        roomCount: realtimeRes.data?.data?.byRoom?.length || 0
      }
    }

    if (realtimeRes.data.success) {
      realtimeData.value = realtimeRes.data.data
    }

    if (serverRes.data.success) {
      serverInfo.value = serverRes.data.data
      serverStatus.value = serverRes.data.data.http?.status === 'online' ? 'online' : 'offline'
    }

    chartLoaded.value = true
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}

const loadChartData = async () => {
  try {
    const res = await api.get(`/admin/dashboard/charts?type=register&period=${chartPeriod.value}`)
    if (res.data.success && userChartRef.value) {
      if (!userChart) {
        userChart = echarts.init(userChartRef.value)
      }
      
      userChart.setOption({
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: res.data.data.labels || [],
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '新增用户',
          type: 'line',
          smooth: true,
          data: res.data.data.datasets?.[0]?.data || [],
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.01)' }
            ])
          },
          itemStyle: {
            color: '#409EFF'
          }
        }]
      })
      
      window.addEventListener('resize', () => userChart.resize())
    }
  } catch (error) {
    console.error('加载用户图表数据失败:', error)
  }
}

const loadChatChartData = async () => {
  try {
    const res = await api.get(`/admin/dashboard/charts?type=chat&period=${chatChartPeriod.value}`)
    if (res.data.success && chatChartRef.value) {
      if (!chatChart) {
        chatChart = echarts.init(chatChartRef.value)
      }
      
      chatChart.setOption({
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: res.data.data.labels || [],
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '聊天消息',
          type: 'line',
          smooth: true,
          data: res.data.data.datasets?.[0]?.data || [],
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.01)' }
            ])
          },
          itemStyle: {
            color: '#667eea'
          }
        }]
      })
      
      window.addEventListener('resize', () => chatChart.resize())
    }
  } catch (error) {
    console.error('加载聊天图表数据失败:', error)
  }
}

const refreshData = () => {
  loading.value = true
  loadDashboardData().finally(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  })
}

const broadcastMessage = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入公告内容', '全服公告', {
      inputType: 'textarea',
      confirmButtonText: '发送',
      cancelButtonText: '取消'
    })
    
    if (value) {
      await api.post('/admin/news/broadcast', { content: value })
      ElMessage.success('公告已发送')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发送公告失败：' + error.message)
    }
  }
}

const maintenanceMode = async () => {
  try {
    await ElMessageBox.confirm('确定要开启维护模式吗？开启后普通用户将无法登录', '提示', {
      type: 'warning'
    })
    ElMessage.info('维护模式功能开发中')
  } catch (error) {}
}

const emergencyShutdown = async () => {
  try {
    await ElMessageBox.confirm('⚠️ 紧急Shutdown 将立即停止所有服务！确定继续吗？', '高危操作', {
      type: 'error',
      distinguishCancelAndClose: true,
      confirmButtonText: '确认Shutdown',
      cancelButtonText: '取消'
    })
    ElMessage.info('紧急Shutdown 功能开发中')
  } catch (error) {}
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm('确定要清理系统缓存吗？', '提示', {
      type: 'warning'
    })
    ElMessage.info('清理缓存功能开发中')
  } catch (error) {}
}

onMounted(() => {
  loadDashboardData()
  loadChartData()
  loadChatChartData()
  
  refreshTimer = setInterval(() => {
    loadDashboardData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (userChart) userChart.dispose()
  if (chatChart) chatChart.dispose()
})
</script>

<style scoped>
.dashboard-page {
  padding: 0;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-card.online .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-card.chat .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-card.economy .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: #fff;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 6px;
}

.stat-trend {
  font-size: 12px;
  color: #808080;
}

.stat-trend.positive {
  color: #67c23a;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
}

.card-header .el-icon {
  margin-right: 8px;
}

.server-info {
  padding: 8px 0;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #a0a0a0;
  font-size: 14px;
}

.info-value {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-actions .el-button {
  width: 100%;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-loading {
  padding: 20px;
}

.mt-4 {
  margin-top: 20px;
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
  --el-table-fixed-box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);
}
</style>
