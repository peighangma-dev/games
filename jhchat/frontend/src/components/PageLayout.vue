<template>
  <div class="page-layout">
    <TopNav />
    <div class="page-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import TopNav from './TopNav.vue'
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: #0f1a26;
}

.page-content {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .page-content {
    padding: 12px;
  }
}
</style>
