import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/fortune',
    name: 'Fortune',
    component: () => import('../views/Fortune.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/fishing',
    name: 'Fishing',
    component: () => import('../views/Fishing.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/main',
    name: 'Main',
    component: () => import('../views/Main.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/Messages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/sect',
    name: 'Sect',
    component: () => import('../views/Sect.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/marriage',
    name: 'Marriage',
    component: () => import('../views/Marriage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/skills',
    name: 'Skills',
    component: () => import('../views/Skills.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/items',
    name: 'Items',
    component: () => import('../views/Items.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/market',
    name: 'Market',
    component: () => import('../views/Market.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('../views/Shop.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('../views/Games.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pets',
    name: 'Pets',
    component: () => import('../views/Pets.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/alchemy',
    name: 'Alchemy',
    component: () => import('../views/Alchemy.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rankings',
    name: 'Rankings',
    component: () => import('../views/Rankings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wishes',
    name: 'Wishes',
    component: () => import('../views/Wishes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'AdminHome', component: () => import('../views/admin/Home.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/Users.vue') },
      { path: 'managers', name: 'AdminManagers', component: () => import('../views/admin/Managers.vue') },
      { path: 'news', name: 'AdminNews', component: () => import('../views/admin/News.vue') },
      { path: 'config', name: 'AdminConfig', component: () => import('../views/admin/Config.vue') },
      { path: 'rooms', name: 'AdminRooms', component: () => import('../views/admin/Rooms.vue') },
      { path: 'ip-locks', name: 'AdminIpLocks', component: () => import('../views/admin/IpLocks.vue') },
      { path: 'logs', name: 'AdminLogs', component: () => import('../views/admin/Logs.vue') },
      { path: 'items', name: 'AdminItems', component: () => import('../views/admin/Items.vue') },
      { path: 'statistics', name: 'AdminStatistics', component: () => import('../views/admin/Statistics.vue') },
      { path: 'random-events', name: 'AdminRandomEvents', component: () => import('../views/admin/RandomEvents.vue') }
    ]
  },
  {
    path: '/',
    redirect: '/main'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresAdmin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.grade < 6 || user.faction !== '逍遥派') {
      next('/main')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
