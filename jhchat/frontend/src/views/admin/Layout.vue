<template>
  <div class="admin-container">
    <!-- 顶部导航栏 -->
    <header class="admin-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⚔️</span>
          <span class="logo-text">笑傲江湖 · 管理后台</span>
        </div>
      </div>
      <div class="header-right">
        <div class="header-item">
          <el-tooltip content="返回前台" placement="bottom">
            <el-button circle @click="goToMain">
              <el-icon><HomeFilled /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
        <div class="header-item user-info">
          <el-avatar :size="32" :src="userStore.avatar">
            {{ userStore.username?.charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="username">{{ userStore.username }}</span>
          <el-tag size="small" type="warning">管理员</el-tag>
        </div>
        <div class="header-item">
          <el-tooltip content="退出登录" placement="bottom">
            <el-button circle @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </header>

    <div class="admin-body">
      <!-- 侧边栏导航 -->
      <aside class="admin-sidebar">
        <div class="sidebar-content">
          <el-menu
            :default-active="activeMenu"
            background-color="#1a1a2e"
            text-color="#a0a0a0"
            active-text-color="#409EFF"
            router
          >
            <!-- 概览 -->
            <el-sub-menu index="1">
              <template #title>
                <el-icon><DataAnalysis /></el-icon>
                <span>数据概览</span>
              </template>
              <el-menu-item index="/admin">仪表盘</el-menu-item>
              <el-menu-item index="/admin/statistics">统计分析</el-menu-item>
            </el-sub-menu>

            <!-- 用户管理 -->
            <el-sub-menu index="2">
              <template #title>
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </template>
              <el-menu-item index="/admin/users">用户列表</el-menu-item>
              <el-menu-item index="/admin/managers">管理员管理</el-menu-item>
            </el-sub-menu>

            <!-- 内容管理 -->
            <el-sub-menu index="3">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>内容管理</span>
              </template>
              <el-menu-item index="/admin/news">公告管理</el-menu-item>
              <el-menu-item index="/admin/random-events">随机事件</el-menu-item>
            </el-sub-menu>

            <!-- 游戏管理 -->
            <el-sub-menu index="4">
              <template #title>
                <el-icon><VideoCamera /></el-icon>
                <span>游戏管理</span>
              </template>
              <el-menu-item index="/admin/items">物品管理</el-menu-item>
              <el-menu-item index="/admin/shop-items">商店管理</el-menu-item>
              <el-menu-item index="/admin/secret-skills">武功秘籍</el-menu-item>
              <el-menu-item index="/admin/quests">任务管理</el-menu-item>
              <el-menu-item index="/admin/pets">宠物管理</el-menu-item>
              <el-menu-item index="/admin/sects">门派管理</el-menu-item>
            </el-sub-menu>

            <!-- 经济系统 -->
            <el-sub-menu index="5">
              <template #title>
                <el-icon><Coin /></el-icon>
                <span>经济系统</span>
              </template>
              <el-menu-item index="/admin/economy">经济监控</el-menu-item>
              <el-menu-item index="/admin/market">市场管理</el-menu-item>
            </el-sub-menu>

            <!-- 系统配置 -->
            <el-sub-menu index="6">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>系统配置</span>
              </template>
              <el-menu-item index="/admin/config">全局配置</el-menu-item>
              <el-menu-item index="/admin/rooms">房间管理</el-menu-item>
              <el-menu-item index="/admin/cache">清理缓存</el-menu-item>
            </el-sub-menu>

            <!-- 安全管控 -->
            <el-sub-menu index="7">
              <template #title>
                <el-icon><Lock /></el-icon>
                <span>安全管控</span>
              </template>
              <el-menu-item index="/admin/ip-locks">IP 封锁</el-menu-item>
              <el-menu-item index="/admin/ip-logs">IP 日志</el-menu-item>
              <el-menu-item index="/admin/security">反作弊监控</el-menu-item>
            </el-sub-menu>

            <!-- 日志审计 -->
            <el-sub-menu index="8">
              <template #title>
                <el-icon><Files /></el-icon>
                <span>日志审计</span>
              </template>
              <el-menu-item index="/admin/logs">操作日志</el-menu-item>
              <el-menu-item index="/admin/login-logs">登录日志</el-menu-item>
              <el-menu-item index="/admin/chat-logs">聊天记录</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="admin-main">
        <div class="admin-content">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../stores/user'
import {
  HomeFilled,
  SwitchButton,
  DataAnalysis,
  User,
  UserFilled,
  Document,
  VideoCamera,
  Coin,
  Setting,
  Lock,
  Files
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => {
  // 对于子路由，返回完整路径以正确高亮菜单项
  return route.path
})

const goToMain = () => {
  router.push('/main')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #0f0f1a;
}

.admin-header {
  height: 60px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-item {
  display: flex;
  align-items: center;
}

.user-info {
  gap: 8px;
  padding: 0 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.username {
  color: #e0e0e0;
  font-size: 14px;
}

.admin-body {
  display: flex;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
}

.admin-sidebar {
  width: 240px;
  background: #1a1a2e;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  overflow-y: auto;
}

.sidebar-content {
  padding-top: 16px;
}

.admin-sidebar :deep(.el-menu) {
  border-right: none;
}

.admin-sidebar :deep(.el-sub-menu__title) {
  padding: 16px 24px;
  font-size: 14px;
  font-weight: 500;
}

.admin-sidebar :deep(.el-menu-item) {
  padding: 12px 24px 12px 48px;
  font-size: 13px;
  min-width: 240px;
}

.admin-sidebar :deep(.el-menu-item:hover),
.admin-sidebar :deep(.el-menu-item.is-active) {
  background: rgba(64, 158, 255, 0.1) !important;
}

.admin-main {
  margin-left: 240px;
  flex: 1;
  background: #0f0f1a;
}

.admin-content {
  padding: 24px;
  min-height: calc(100vh - 60px);
}
</style>
