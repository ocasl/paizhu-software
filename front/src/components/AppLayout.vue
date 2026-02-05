<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOfflineStore } from '../stores/offline'
import { useUserStore } from '../stores/user'
import {
  House,
  Calendar,
  Timer,
  Document,
  Upload,
  DataAnalysis,
  Menu as IconMenu,
  Sunny,
  Cloudy,
  Setting,
  List,
  FolderOpened,
  User,
  Collection
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const offlineStore = useOfflineStore()
const userStore = useUserStore()

// 初始化用户信息 - 从localStorage恢复
onMounted(() => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr)
      userStore.login(user, token)
    } catch (e) {
      console.error('恢复用户信息失败:', e)
    }
  }
})

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 是否是首页或登录页 - 不显示侧边栏
const isHomePage = computed(() => route.path === '/' || route.path === '/login')

// 当前用户是否是管理员
const isAdminUser = computed(() => {
  return userStore.userInfo?.role === 'admin'  // 只有管理员才能访问用户管理
})

// 菜单项 - 根据角色权限过滤
const menuItems = computed(() => {
  const role = userStore.userInfo?.role
  
  // 定义所有菜单项及其权限
  const allItems = [
    { path: '/overview', title: '工作概览', icon: House, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/daily', title: '日检察', icon: Calendar, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/weekly', title: '周检察', icon: Timer, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/monthly', title: '月检察', icon: Document, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/immediate', title: '及时检察', icon: Cloudy, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/upload', title: '材料上传', icon: Upload, roles: ['admin', 'inspector'] },
    { path: '/checklist', title: '报告清单', icon: List, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/report', title: '报告预览', icon: DataAnalysis, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/archive', title: '月度归档', icon: FolderOpened, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/compilation', title: '汇编', icon: Collection, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
    { path: '/settings', title: '系统设置', icon: Setting, roles: ['admin'] }
  ]
  
  // 根据角色过滤菜单
  if (!role) return []
  return allItems.filter(item => item.roles.includes(role))
})

// 导航到指定路由
function navigateTo(path) {
  router.push(path)
}

// 切换侧边栏
function toggleSidebar() {
  isCollapse.value = !isCollapse.value
}

// 当前登录用户
const currentUser = computed(() => {
  return userStore.userInfo
})

// 处理用户菜单命令
function handleUserCommand(command) {
  if (command === 'logout') {
    logout()
  } else if (command === 'settings') {
    router.push('/settings')
  }
}

// 退出登录
function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <!-- 首页全屏布局 - 不显示侧边栏 -->
  <div v-if="isHomePage" class="home-fullscreen">
    <router-view />
  </div>

  <!-- 其他页面 - 显示侧边栏布局 -->
  <el-container v-else class="app-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="app-aside">
      <div class="logo-container" @click="navigateTo('/')" style="cursor: pointer;">
        <img src="/fEJXtC1QAV-3863889261-removebg-preview.png" alt="Logo" class="logo" />
        <span v-if="!isCollapse" class="logo-text">派驻检察</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="app-menu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
      >
        <el-menu-item 
          v-for="item in menuItems" 
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-left">
          <el-button 
            :icon="IconMenu" 
            circle 
            @click="toggleSidebar"
            class="collapse-btn"
          />
          <h2 class="page-title">{{ route.meta.title || '智慧派驻检察系统' }}</h2>
        </div>
        
        <div class="header-right">
          <!-- 网络状态指示 -->
          <el-tag 
            :type="offlineStore.isOnline ? 'success' : 'warning'"
            effect="light"
            class="network-status"
          >
            <el-icon><component :is="offlineStore.isOnline ? Sunny : Cloudy" /></el-icon>
            {{ offlineStore.isOnline ? '在线' : '离线' }}
          </el-tag>
          
          <!-- 待同步数据提示 -->
          <el-badge 
            v-if="offlineStore.hasPendingData"
            :value="offlineStore.pendingSyncCount" 
            class="sync-badge"
          >
            <el-button type="primary" size="small" @click="offlineStore.syncPendingData">
              同步数据
            </el-button>
          </el-badge>

          <!-- 用户菜单 -->
          <el-dropdown trigger="click" @command="handleUserCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" style="background: #667eea;">
                {{ currentUser?.name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ currentUser?.name || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  {{ currentUser?.prisonName || '派驻监所' }}
                </el-dropdown-item>
                <el-dropdown-item v-if="isAdminUser" divided command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item command="logout" style="color: #F56C6C;">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="app-main">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
/* 首页全屏样式 */
.home-fullscreen {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.app-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-aside {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  transition: width 0.3s ease;
  overflow: hidden;
}

.logo-container {

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 32px;
  height: 32px;
}

.logo-text {
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.app-menu {
  border-right: none;
  background: transparent;
}

.app-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.7);
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.app-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.app-menu .el-menu-item.is-active {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  border: none;
  background: transparent;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.network-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sync-badge {
  margin-right: 8px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background: rgba(102, 126, 234, 0.1);
}

.username {
  color: #303133;
  font-size: 14px;
}

.app-main {
  background: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .app-aside {
    position: fixed;
    z-index: 1000;
    height: 100vh;
  }
  
  .page-title {
    font-size: 16px;
  }
  
  .app-main {
    padding: 16px;
  }
}
</style>
