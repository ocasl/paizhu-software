<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOfflineStore } from '../stores/offline'
import {
  House,
  Calendar,
  Timer,
  Document,
  Upload,
  DataAnalysis,
  Menu as IconMenu,
  Sunny,
  Cloudy
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const offlineStore = useOfflineStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 菜单项
const menuItems = [
  { path: '/', title: '工作概览', icon: House },
  { path: '/daily', title: '日检察', icon: Calendar },
  { path: '/weekly', title: '周检察', icon: Timer },
  { path: '/monthly', title: '月检察', icon: Document },
  { path: '/immediate', title: '及时检察', icon: Cloudy },
  { path: '/upload', title: '材料上传', icon: Upload },
  { path: '/report', title: '报告预览', icon: DataAnalysis }
]

// 导航到指定路由
function navigateTo(path) {
  router.push(path)
}

// 切换侧边栏
function toggleSidebar() {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <el-container class="app-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="app-aside">
      <div class="logo-container">
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
          <h2 class="page-title">{{ route.meta.title || '派驻检察室工作管理系统' }}</h2>
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
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
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
