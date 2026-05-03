<template>
  <div v-if="error" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">出错了</h3>
      <p class="error-message">{{ error.message }}</p>
      <div class="error-actions">
        <button class="btn-retry" @click="retry">重试</button>
        <button class="btn-back" @click="goBack">返回</button>
      </div>
    </div>
  </div>
  
  <div v-else>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  fallbackMessage: {
    type: String,
    default: '组件加载失败，请稍后重试'
  }
})

const router = useRouter()
const instance = getCurrentInstance()
const error = ref(null)
const retryCount = ref(0)
const maxRetries = 3

onErrorCaptured((err, vm, info) => {
  console.error('组件错误:', err, info)
  
  error.value = {
    message: props.fallbackMessage,
    details: err.message,
    info
  }
  
  // 上报错误到监控服务
  reportError(err, info)
  
  return false // 阻止错误继续向上传播
})

function reportError(err, info) {
  // 可以在这里集成 Sentry 等错误监控服务
  console.error('错误报告:', {
    error: err.message,
    stack: err.stack,
    componentInfo: info,
    timestamp: new Date().toISOString()
  })
}

async function retry() {
  if (retryCount.value >= maxRetries) {
    error.value = {
      message: '重试次数过多，请稍后重试',
      details: null
    }
    return
  }
  
  retryCount.value++
  error.value = null
  
  try {
    // 尝试重新加载组件
    await instance?.proxy?.$forceUpdate()
  } catch (err) {
    error.value = {
      message: '重试失败，请刷新页面',
      details: err.message
    }
  }
}

function goBack() {
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.error-content {
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-title {
  color: #e74c3c;
  font-size: 24px;
  margin-bottom: 15px;
}

.error-message {
  color: #ccc;
  font-size: 16px;
  margin-bottom: 30px;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-retry, .btn-back {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
