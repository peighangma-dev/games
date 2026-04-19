<template>
  <div class="top-nav">
    <div class="nav-left">
      <router-link to="/main" class="nav-logo">
        <span class="logo-icon">⚔️</span>
        <span class="logo-text">笑傲江湖</span>
      </router-link>
    </div>
    
    <div class="nav-center">
      <router-link to="/main" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首页</span>
      </router-link>
      <router-link to="/chat" class="nav-item">
        <span class="nav-icon">💬</span>
        <span class="nav-label">聊天</span>
      </router-link>
      <router-link to="/messages" class="nav-item">
        <span class="nav-icon">✉️</span>
        <span class="nav-label">邮件</span>
      </router-link>
      <router-link to="/sect" class="nav-item">
        <span class="nav-icon">⚔️</span>
        <span class="nav-label">门派</span>
      </router-link>
      <router-link to="/marriage" class="nav-item">
        <span class="nav-icon">❤️</span>
        <span class="nav-label">婚姻</span>
      </router-link>
      <router-link to="/skills" class="nav-item">
        <span class="nav-icon">📜</span>
        <span class="nav-label">武功</span>
      </router-link>
      <div class="nav-dropdown">
        <button class="nav-item dropdown-toggle">
          <span class="nav-icon">🎮</span>
          <span class="nav-label">游乐</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="dropdown-menu">
          <router-link to="/items" class="dropdown-item">🎒 物品</router-link>
          <router-link to="/shop" class="dropdown-item">🏪 商店</router-link>
          <router-link to="/market" class="dropdown-item">💰 商城</router-link>
          <router-link to="/games" class="dropdown-item">🎲 游戏</router-link>
          <router-link to="/pets" class="dropdown-item">🐾 宠物</router-link>
          <router-link to="/alchemy" class="dropdown-item">🧪 配药</router-link>
          <router-link to="/fishing" class="dropdown-item">🎣 钓鱼</router-link>
          <router-link to="/fortune" class="dropdown-item">🔮 求签</router-link>
        </div>
      </div>
      <router-link to="/rankings" class="nav-item">
        <span class="nav-icon">🏆</span>
        <span class="nav-label">排行</span>
      </router-link>
      <router-link to="/wishes" class="nav-item">
        <span class="nav-icon">🌟</span>
        <span class="nav-label">许愿</span>
      </router-link>
    </div>
    
    <div class="nav-right">
      <span class="nav-user-info">
        <span class="user-silver">💰 {{ userStore.silver }}两</span>
      </span>
      <router-link to="/profile" class="nav-item nav-profile">
        <span class="nav-icon">👤</span>
        <span class="nav-label">{{ userStore.username }}</span>
      </router-link>
      <button @click="handleLogout" class="nav-item nav-logout">
        <span class="nav-icon">🚪</span>
        <span class="nav-label">退出</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #1a3a5c 0%, #2d5a7c 100%);
  padding: 0 20px;
  height: 56px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-logo:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  color: #7eb8da;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  text-decoration: none;
  color: #c0d8e8;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(126, 184, 218, 0.15);
  color: #fff;
}

.nav-item.router-link-active {
  background: rgba(126, 184, 218, 0.25);
  color: #7eb8da;
}

.nav-icon {
  font-size: 16px;
}

.nav-label {
  white-space: nowrap;
}

.nav-dropdown {
  position: relative;
}

.dropdown-toggle {
  position: relative;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 4px;
  opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #1a3a5c;
  border: 1px solid rgba(126, 184, 218, 0.3);
  border-radius: 8px;
  padding: 8px 0;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s;
}

.nav-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  text-decoration: none;
  color: #c0d8e8;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: rgba(126, 184, 218, 0.15);
  color: #fff;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  font-size: 13px;
  color: #ffd700;
}

.nav-profile {
  background: rgba(126, 184, 218, 0.1);
}

.nav-logout:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
}

@media (max-width: 1200px) {
  .nav-center {
    gap: 2px;
  }
  
  .nav-item {
    padding: 8px 10px;
    font-size: 13px;
  }
}

@media (max-width: 992px) {
  .top-nav {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
    gap: 12px;
  }
  
  .nav-center {
    width: 100%;
    justify-content: center;
    order: 3;
  }
  
  .nav-item {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
