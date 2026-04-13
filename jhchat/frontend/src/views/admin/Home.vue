<template>
  <div class="admin-home">
    <h2>管理后台</h2>
    <p class="welcome-text">欢迎回来，{{ userStore.username }}</p>
    <div class="quick-stats card">
      <h3 class="section-title">系统概览</h3>
      <p>请从左侧菜单选择管理功能</p>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../../stores/user'
const userStore = useUserStore()
</script>

<style scoped>
.welcome-text {
  color: #7eb8da;
  margin: 10px 0 20px;
}

.section-title {
  color: #7eb8da;
  font-size: 16px;
  margin-bottom: 12px;
  border-left: 3px solid #4B87C3;
  padding-left: 10px;
}
</style>
