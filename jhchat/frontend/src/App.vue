<template>
  <div id="app">
    <!-- 全局错误边界 -->
    <ErrorHandler>
      <router-view />
    </ErrorHandler>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import ErrorHandler from './components/ErrorHandler.vue'

const userStore = useUserStore()

onMounted(async () => {
  // 恢复用户登录状态
  await userStore.restoreSession()
  
  // 初始化 Socket 连接
  const token = localStorage.getItem('token')
  if (token) {
    const socketManager = require('@/utils/socket').default
    socketManager.connect(token)
  }
})
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #fff;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow-x: hidden;
}
</style>
