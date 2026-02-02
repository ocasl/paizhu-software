<template>
  <el-button
    v-if="hasPermission"
    v-bind="$attrs"
    @click="handleClick"
  >
    <slot></slot>
  </el-button>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../stores/user'

const props = defineProps({
  // 允许的角色列表
  roles: {
    type: Array,
    default: () => []
  },
  // 自定义权限检查函数
  permission: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['click'])

const userStore = useUserStore()

// 检查是否有权限
const hasPermission = computed(() => {
  // 如果提供了自定义权限函数，使用它
  if (props.permission) {
    return props.permission(userStore.userInfo)
  }
  
  // 如果没有指定角色，默认显示
  if (!props.roles || props.roles.length === 0) {
    return true
  }
  
  // 检查用户角色是否在允许列表中
  return props.roles.includes(userStore.userRole)
})

const handleClick = (event) => {
  emit('click', event)
}
</script>

<style scoped>
/* 按钮样式继承 Element Plus */
</style>
