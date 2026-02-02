<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'

// 导入按钮图片
import btn1 from '@/assets/img/btn1.png'  // 工作概览
import btn2 from '@/assets/img/btn2.png'  // 日检察
import btn3 from '@/assets/img/btn3.png'  // 周检察
import btn4 from '@/assets/img/btn4.png'  // 月检察
import btn5 from '@/assets/img/btn5.png'  // 及时检察
import btn6 from '@/assets/img/btn6.png'  // 报告清单
import btn7 from '@/assets/img/btn7.png'  // 报告预览
import btn8 from '@/assets/img/btn8.png'  // 系统设置
import btn9 from '@/assets/img/btn9.png'  // 材料上传
import btn10 from '@/assets/img/btn10.png'  // 月度归档
import baseBg from '@/assets/img/base.png'

const router = useRouter()
const userStore = useUserStore()

// 检查登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
  }
})

// 获取当前用户信息
const currentUser = computed(() => userStore.userInfo || {})
const userRole = computed(() => {
  const roleMap = {
    'admin': '系统管理员',
    'inspector': '派驻检察官',
    'leader': '业务分管领导',
    'top_viewer': '院领导'
  }
  return roleMap[currentUser.value.role] || '未知角色'
})

// 左侧：检察监督模块（4个按钮）
const leftButtons = [
  { id: 1, path: '/immediate', title: '及时检察', img: btn5, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
  { id: 2, path: '/daily', title: '日检察', img: btn2, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
  { id: 3, path: '/weekly', title: '周检察', img: btn3, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
  { id: 4, path: '/monthly', title: '月检察', img: btn4, roles: ['admin', 'inspector', 'leader', 'top_viewer'] }
]

// 右侧：档案管理模块（4个按钮）
const rightButtons = [
  { id: 1, path: '/upload', title: '材料上传', img: btn9, roles: ['admin', 'inspector'] },
  { id: 2, path: '/checklist', title: '报告清单', img: btn6, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
  { id: 3, path: '/report', title: '报告预览', img: btn7, roles: ['admin', 'inspector', 'leader', 'top_viewer'] },
  { id: 4, path: '/archive', title: '月度归档', img: btn10, roles: ['admin', 'inspector', 'leader', 'top_viewer'] }
]

// 根据角色过滤按钮
const filteredLeftButtons = computed(() => {
  const role = currentUser.value.role
  if (!role) return []
  return leftButtons.filter(btn => btn.roles.includes(role))
})

const filteredRightButtons = computed(() => {
  const role = currentUser.value.role
  if (!role) return []
  return rightButtons.filter(btn => btn.roles.includes(role))
})

// 工作概览按钮 - 所有角色都可以看到
const showOverviewButton = computed(() => true)

// 系统设置按钮 - 只有管理员可以看到
const showSettingsButton = computed(() => currentUser.value.role === 'admin')

function navigateTo(path) {
  console.log('导航到:', path)
  router.push(path)
}

function goToOverview() {
  console.log('导航到工作概览')
  router.push('/overview')
}

function goToSettings() {
  console.log('导航到系统设置')
  router.push('/settings')
}

// 退出登录
async function handleLogout() {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}

</script>

<template>
  <div class="home-container">
    <!-- 顶部标题 -->
    <div class="page-header">
      <div class="title-wrapper">
        <h1 class="main-title">江西省南昌长堎地区人民检察院</h1>
        <h2 class="sub-title">智慧派驻检察系统</h2>
      </div>
      
      <!-- 右上角按钮组 -->
      <div class="header-actions">
        <!-- 用户信息 -->
        <div class="user-info">
          <div class="user-info-text">
            <div class="user-details-row">
              <span class="user-name">{{ currentUser.name || '用户' }}</span>
              <el-divider direction="vertical" />
              <span class="user-role">{{ userRole }}</span>
            </div>
          </div>
        </div>
        
        <!-- 系统设置按钮 - 只有管理员可见 -->
        <img 
          v-if="showSettingsButton"
          :src="btn8" 
          alt="系统设置" 
          class="action-btn" 
          @click="goToSettings" 
          title="系统设置" 
        />
        
        <!-- 退出登录按钮 -->
        <el-button type="danger" @click="handleLogout" class="logout-btn">
          退出登录
        </el-button>
      </div>
    </div>
    
    <!-- 底座背景 -->
    <img :src="baseBg" alt="背景" class="base-background" />
    
    <!-- 中心工作概览 -->
    <div v-if="showOverviewButton" class="center-overview" @click="goToOverview">
      <img :src="btn1" alt="工作概览" class="overview-icon" />
    </div>
    
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧：检察监督模块 -->
      <div class="left-panel" v-if="filteredLeftButtons.length > 0">
        <div class="panel-title">检察监督</div>
        <div class="button-grid">
          <div 
            v-for="btn in filteredLeftButtons" 
            :key="btn.id"
            class="module-btn"
            @click="navigateTo(btn.path)"
          >
            <img :src="btn.img" :alt="btn.title" class="btn-icon" />
          </div>
        </div>
      </div>

      <!-- 右侧：档案管理模块 -->
      <div class="right-panel" v-if="filteredRightButtons.length > 0">
        <div class="panel-title">档案管理</div>
        <div class="button-grid">
          <div 
            v-for="btn in filteredRightButtons" 
            :key="btn.id"
            class="module-btn"
            @click="navigateTo(btn.path)"
          >
            <img :src="btn.img" :alt="btn.title" class="btn-icon" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 整体容器 */
.home-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, #e8f4fc 0%, #d5e8f5 50%, #c8dff0 100%);
}

/* 底座背景 */
.base-background {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 1;
}

/* 顶部标题样式 */
.page-header {
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  background: linear-gradient(180deg, rgba(0, 30, 80, 0.3) 0%, transparent 100%);
}

.title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.main-title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(180deg, #ffd700 0%, #ffaa00 50%, #ff8c00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 4px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.sub-title {
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(180deg, #ffd700 0%, #ffaa00 50%, #ff8c00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 6px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

/* 系统设置按钮 - 右上角 */
.header-actions {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.user-info-text {
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-details-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-role {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.action-btn {
  width: 60px;
  height: auto;
  cursor: pointer;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 8px rgba(30, 144, 255, 0.3));
}

.action-btn:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 6px 12px rgba(30, 144, 255, 0.5));
}

.logout-btn {
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

.logout-btn:hover {
  box-shadow: 0 6px 12px rgba(245, 108, 108, 0.5);
}

/* 中心工作概览 */
.center-overview {
  position: absolute;
  top: calc(70% + 120px);
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.center-overview:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.overview-icon {
  width: 200px;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(30, 144, 255, 0.3));
  pointer-events: auto;
}

/* 主内容区域 */
.main-content {
  position: absolute;
  top: 140px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 240px;
  gap: 40px;
}

/* 左侧面板 */
.left-panel {
  flex: 0 0 auto;
}

/* 右侧面板 */
.right-panel {
  flex: 0 0 auto;
}

/* 面板标题 */
.panel-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 20px;
  letter-spacing: 3px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(180deg, rgba(30, 144, 255, 0.6) 0%, rgba(30, 144, 255, 0.4) 100%);
  padding: 12px 20px;
  border-radius: 8px;
}

/* 按钮网格 - 2x2 */
.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}

/* 模块按钮 */
.module-btn {
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-btn:hover {
  transform: scale(1.1);
}

.module-btn:active {
  transform: scale(1.05);
}

.btn-icon {
  width: 140px;
  height: auto;
  filter: drop-shadow(0 4px 8px rgba(30, 144, 255, 0.3));
}

.module-btn:hover .btn-icon {
  filter: drop-shadow(0 8px 16px rgba(30, 144, 255, 0.5));
}

/* 响应式适配 */
@media (max-width: 1400px) {
  .main-title {
    font-size: 30px;
    letter-spacing: 3px;
  }
  
  .sub-title {
    font-size: 24px;
    letter-spacing: 4px;
  }
  
  .main-content {
    gap: 60px;
    padding: 40px 40px;
  }
  
  .button-grid {
    gap: 20px;
  }
  
  .btn-icon {
    width: 120px;
  }
}

@media (max-width: 1100px) {
  .main-title {
    font-size: 24px;
    letter-spacing: 2px;
  }
  
  .sub-title {
    font-size: 20px;
    letter-spacing: 3px;
  }
  
  .main-content {
    flex-direction: column;
    gap: 40px;
    padding: 20px;
  }
  
  .panel-title {
    font-size: 20px;
  }
}
</style>
