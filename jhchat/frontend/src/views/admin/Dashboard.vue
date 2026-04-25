<template>
  <div class="dashboard-page">
    <h3 class="section-title">📊 仪表盘</h3>

    <div class="stats-grid">
      <div class="stat-card online">
        <div class="stat-icon user-icon">👤</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.onlineUsers }}</div>
          <div class="stat-label">在线用户</div>
          <div class="stat-trend positive">
            📈 {{ stats.roomCount }} 个房间
          </div>
        </div>
      </div>

      <div class="stat-card total">
        <div class="stat-icon total-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalUsers.toLocaleString() }}</div>
          <div class="stat-label">总用户数</div>
          <div class="stat-trend">
            今日：+{{ stats.newToday }} | 本月：+{{ stats.newThisMonth }}
          </div>
        </div>
      </div>

      <div class="stat-card chat">
        <div class="stat-icon chat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.messagesToday.toLocaleString() }}</div>
          <div class="stat-label">今日消息</div>
          <div class="stat-trend">
            总计：{{ stats.messagesTotal.toLocaleString() }}
          </div>
        </div>
      </div>

      <div class="stat-card economy">
        <div class="stat-icon economy-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.totalSilver / 10000).toFixed(1) }}万</div>
          <div class="stat-label">流通银两</div>
          <div class="stat-trend">
            人均：{{ stats.avgSilver }} | 存款：{{ (stats.totalDeposit / 10000).toFixed(1) }}万
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card server-status-card">
        <div class="card-header">
          <span>🖥️ 服务器状态</span>
          <span :class="['status-badge', serverStatus === 'online' ? 'success' : 'danger']">
            {{ serverStatus === 'online' ? '运行中' : '离线' }}
          </span>
        </div>
        
        <div class="server-info">
          <div class="info-item">
            <span class="info-label">运行时间：</span>
            <span class="info-value">{{ formatUptime(serverInfo.uptime || 0) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">数据库：</span>
            <div class="status-info">
              <span :class="['status-badge', serverInfo.database?.status === 'connected' ? 'success' : 'danger']">
                {{ serverInfo.database?.status === 'connected' ? '已连接' : '未连接' }}
              </span>
              <span class="info-sub">{{ serverInfo.database?.host }}/{{ serverInfo.database?.name }}</span>
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">Redis：</span>
            <div class="status-info">
              <span :class="['status-badge', serverInfo.redis?.status === 'connected' ? 'success' : serverInfo.redis?.status === 'not_configured' ? 'default' : 'danger']">
                {{ serverInfo.redis?.status === 'connected' ? '已连接' : serverInfo.redis?.status === 'not_configured' ? '未配置' : '未连接' }}
              </span>
              <span class="info-sub">{{ serverInfo.redis?.host }}</span>
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">Node 版本：</span>
            <span class="info-value">{{ serverInfo.nodeVersion || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">内存使用：</span>
            <span class="info-value">{{ formatMemoryUsage(serverInfo.memory) }}</span>
          </div>
          <div class="info-item" v-if="serverInfo.pid">
            <span class="info-label">进程 ID：</span>
            <span class="info-value">{{ serverInfo.pid }}</span>
          </div>
        </div>
      </div>

      <div class="card quick-actions-card">
        <div class="card-header">
          <span>⚡ 快捷操作</span>
        </div>
        
        <div class="quick-actions">
          <button @click="broadcastMessage" class="btn btn-primary">
            🔔 全服公告
          </button>
          <button @click="maintenanceMode" class="btn btn-warning">
            🔧 维护模式
          </button>
          <button @click="emergencyShutdown" class="btn btn-danger">
            ⚠️ 紧急 Shutdown
          </button>
          <button @click="clearCache" class="btn">
            🗑️ 清理缓存
          </button>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header chart-header">
          <span>📈 用户增长趋势</span>
          <div class="period-selector">
            <button 
              :class="['period-btn', chartPeriod === '7d' ? 'active' : '']"
              @click="chartPeriod = '7d'; loadChartData()">7 天</button>
            <button 
              :class="['period-btn', chartPeriod === '30d' ? 'active' : '']"
              @click="chartPeriod = '30d'; loadChartData()">30 天</button>
            <button 
              :class="['period-btn', chartPeriod === '90d' ? 'active' : '']"
              @click="chartPeriod = '90d'; loadChartData()">90 天</button>
          </div>
        </div>
        
        <div class="chart-container" ref="userChartRef">
          <div v-if="!chartLoaded" class="chart-loading">
            加载中...
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header chart-header">
          <span>💬 聊天消息趋势</span>
          <div class="period-selector">
            <button 
              :class="['period-btn', chatChartPeriod === '7d' ? 'active' : '']"
              @click="chatChartPeriod = '7d'; loadChatChartData()">7 天</button>
            <button 
              :class="['period-btn', chatChartPeriod === '30d' ? 'active' : '']"
              @click="chatChartPeriod = '30d'; loadChatChartData()">30 天</button>
          </div>
        </div>
        
        <div class="chart-container" ref="chatChartRef">
          <div v-if="!chartLoaded" class="chart-loading">
            加载中...
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span>📺 实时监控</span>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>房间名称</th>
              <th>在线人数</th>
              <th>热度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in realtimeData.byRoom" :key="room.name">
              <td>{{ room.name }}</td>
              <td>
                <span :class="['player-count', room.count > 50 ? 'high' : room.count > 20 ? 'medium' : 'low']">
                  {{ room.count }} 人
                </span>
              </td>
              <td>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: Math.min(100, (room.count / maxRoomCapacity) * 100) + '%' }"
                    :class="room.count > 50 ? 'high' : 'normal'">
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="realtimeData.byRoom.length === 0" class="empty-text">暂无实时数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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

const formatMemoryUsage = (memory) => {
  if (!memory) return '0 MB'
  // process.memoryUsage() 返回的是字节
  const heapUsed = memory.heap_used || memory.heapUsed || 0
  const heapTotal = memory.heap_total || memory.heapTotal || 0
  const usedMb = (heapUsed / 1024 / 1024).toFixed(1)
  const totalMb = (heapTotal / 1024 / 1024).toFixed(0)
  return `${usedMb} MB / ${totalMb} MB`
}

const loadDashboardData = async () => {
  try {
    const [overviewRes, realtimeRes, serverRes] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/dashboard/realtime?online=' + stats.value.onlineUsers),
      api.get('/admin/server/status')
    ])

    if (overviewRes.success) {
      const overviewData = overviewRes.data
      stats.value = {
        onlineUsers: overviewData.users?.online || 0,
        totalUsers: overviewData.users?.total || 0,
        newToday: overviewData.users?.newToday || 0,
        newThisMonth: overviewData.users?.newThisMonth || 0,
        messagesToday: overviewData.chat?.messagesToday || 0,
        messagesTotal: overviewData.chat?.messagesTotal || 0,
        totalSilver: overviewData.economy?.totalSilver || 0,
        avgSilver: overviewData.economy?.avgSilver || 0,
        totalDeposit: overviewData.economy?.totalDeposit || 0,
        roomCount: realtimeRes.data?.byRoom?.length || 0
      }
    }

    if (realtimeRes.success) {
      realtimeData.value = realtimeRes.data
    }

    if (serverRes.success) {
      serverInfo.value = serverRes.data
      serverStatus.value = serverRes.data.http?.status === 'online' ? 'online' : 'offline'
    }

    chartLoaded.value = true
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    // 显示错误信息便于调试
    if (error.message) {
      console.error('错误详情:', error.message)
    }
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
    alert('数据已刷新')
  })
}

const broadcastMessage = async () => {
  const content = prompt('请输入公告内容：')
  if (content) {
    try {
      await api.post('/admin/news/broadcast', { content: content })
      alert('公告已发送')
    } catch (error) {
      alert('发送公告失败：' + error.message)
    }
  }
}

const maintenanceMode = async () => {
  if (confirm('确定要开启维护模式吗？开启后普通用户将无法登录')) {
    alert('维护模式功能开发中')
  }
}

const emergencyShutdown = async () => {
  if (confirm('⚠️ 紧急 Shutdown 将立即停止所有服务！确定继续吗？')) {
    alert('紧急 Shutdown 功能开发中')
  }
}

const clearCache = async () => {
  if (confirm('确定要清理系统缓存吗？')) {
    alert('清理缓存功能开发中')
  }
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
.section-title {
  color: #7eb8da;
  font-size: 18px;
  margin-bottom: 20px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
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
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: rgba(0, 0, 0, 0.35);
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

.stat-card.online .stat-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-card.total .stat-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-card.chat .stat-icon { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-card.economy .stat-icon { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: bold;
  color: #7eb8da;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.success {
  background: rgba(67, 233, 123, 0.2);
  color: #43e97b;
}

.status-badge.danger {
  background: rgba(245, 87, 108, 0.2);
  color: #f5576c;
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

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.info-sub {
  color: #808080;
  font-size: 12px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary { background: #4B87C3; }
.btn-primary:hover { background: #3a75b0; }

.btn-warning { background: #f39c12; }
.btn-warning:hover { background: #d68910; }

.btn-danger { background: #e74c3c; }
.btn-danger:hover { background: #c0392b; }

.chart-header {
  flex-wrap: wrap;
  gap: 12px;
}

.period-selector {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.period-btn.active {
  background: #4B87C3;
  color: #fff;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #888;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  font-weight: 600;
  font-size: 14px;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid rgba(243, 156, 18, 0.3);
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.player-count {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
}

.player-count.high { background: rgba(67, 233, 123, 0.2); color: #43e97b; }
.player-count.medium { background: rgba(243, 156, 18, 0.2); color: #f39c12; }
.player-count.low { background: rgba(255, 255, 255, 0.1); color: #ccc; }

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s;
}

.progress-fill.high { background: #43e97b; }
.progress-fill.normal { background: #4B87C3; }

.empty-text {
  text-align: center;
  color: #888;
  padding: 40px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
