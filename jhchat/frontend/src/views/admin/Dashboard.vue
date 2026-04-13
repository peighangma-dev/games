<template>
  <div class="admin-page">
    <div class="nav-bar">
      <router-link to="/main">首页</router-link>
      <span class="nav-spacer"></span>
      <span class="nav-user">{{ userStore.username }}</span>
    </div>
    <div class="admin-layout">
      <div class="admin-sidebar">
        <router-link to="/admin">管理首页</router-link>
        <router-link to="/admin/users">用户管理</router-link>
        <router-link to="/admin/managers">管理员</router-link>
        <router-link to="/admin/news">公告管理</router-link>
        <router-link to="/admin/config">系统配置</router-link>
        <router-link to="/admin/rooms">房间管理</router-link>
        <router-link to="/admin/ip-locks">IP锁定</router-link>
        <router-link to="/admin/logs">日志</router-link>
        <router-link to="/admin/items">物品管理</router-link>
        <router-link to="/admin/statistics">统计</router-link>
      </div>
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - 42px);
}

.admin-sidebar {
  width: 180px;
  background: rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 0;
  display: flex;
  flex-direction: column;
}

.admin-sidebar a {
  padding: 8px 16px;
  color: #aaa;
  font-size: 13px;
  transition: all 0.2s;
}

.admin-sidebar a:hover,
.admin-sidebar a.router-link-active {
  color: #7eb8da;
  background: rgba(75, 135, 195, 0.15);
}

.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.nav-spacer {
  flex: 1;
}

.nav-user {
  color: #7eb8da;
  padding: 10px 12px;
}
</style>
