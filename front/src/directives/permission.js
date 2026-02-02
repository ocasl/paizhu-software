/**
 * 权限指令
 * 用法：v-permission="['admin', 'leader']"
 */
import { useUserStore } from '../stores/user'

export default {
    mounted(el, binding) {
        const { value } = binding
        const userStore = useUserStore()
        const userRole = userStore.userRole

        if (value && value instanceof Array && value.length > 0) {
            const hasPermission = value.includes(userRole)
            
            if (!hasPermission) {
                // 移除元素
                el.parentNode && el.parentNode.removeChild(el)
            }
        } else {
            throw new Error('需要指定角色数组，如 v-permission="[\'admin\', \'leader\']"')
        }
    }
}
