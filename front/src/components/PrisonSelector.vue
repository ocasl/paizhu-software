<template>
  <el-select 
    v-if="show" 
    v-model="selectedPrison" 
    placeholder="选择监狱"
    @change="handleChange"
    :style="{ width: width }"
    size="default"
  >
    <el-option
      v-for="prison in prisons"
      :key="prison"
      :label="prison"
      :value="prison"
    />
  </el-select>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: String,
  width: {
    type: String,
    default: '200px'
  },
  autoSelect: {
    type: Boolean,
    default: true  // 默认自动选择第一个监狱
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const userStore = useUserStore()
const selectedPrison = ref(props.modelValue)
const allPrisons = ref([])

// 是否显示选择器
const show = computed(() => {
  const role = userStore.userRole
  return role === 'leader' || role === 'top_viewer' || role === 'admin'
})

// 可选监狱列表
const prisons = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // 院领导和管理员：显示所有监狱
  if (userStore.isTopViewer || userStore.isAdmin) {
    return allPrisons.value
  }
  
  // 分管领导：显示分管的监狱
  if (userStore.isAreaLeader) {
    return user.prisonScopes || []
  }
  
  return []
})

// 监听外部变化
watch(() => props.modelValue, (val) => {
  selectedPrison.value = val
})

// 监听内部变化
watch(selectedPrison, (val) => {
  emit('update:modelValue', val)
})

function handleChange(val) {
  emit('change', val)
}

// 加载所有监狱列表（院领导和管理员需要）
async function loadAllPrisons() {
  if (userStore.isTopViewer || userStore.isAdmin) {
    try {
      const token = localStorage.getItem('token')
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await fetch(`${API_BASE}/api/prisons/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('获取监狱列表失败')
      }
      
      const data = await response.json()
      allPrisons.value = data.prisons || []
    } catch (error) {
      console.error('加载监狱列表失败:', error)
      ElMessage.error('加载监狱列表失败')
    }
  }
}

// 初始化
onMounted(async () => {
  await loadAllPrisons()
  
  // 如果没有选中监狱，且 autoSelect 为 true，自动选择第一个
  if (props.autoSelect && !selectedPrison.value && prisons.value.length > 0) {
    selectedPrison.value = prisons.value[0]
    emit('update:modelValue', selectedPrison.value)
    emit('change', selectedPrison.value)
  }
})
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>
