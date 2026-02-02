<script setup>
/**
 * 管理员 - 用户管理页面
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Key, Search, User, OfficeBuilding, Setting } from '@element-plus/icons-vue'
import axios from 'axios'

// 用户列表
const users = ref([])
const loading = ref(false)

// 筛选条件
const filters = reactive({
  prison_name: '',
  role: '',
  status: ''
})

// 派驻单位列表
const prisons = ref([])

// 弹窗控制
const showUserDialog = ref(false)
const dialogMode = ref('add') // add | edit
const userForm = reactive({
  id: null,
  username: '',
  password: '',
  name: '',
  prison_name: '',
  role: 'inspector',
  phone: '',
  status: 'active',
  prisonScopes: [] // 分管领导的监狱范围
})

// 密码重置弹窗
const showPasswordDialog = ref(false)
const passwordForm = reactive({
  userId: null,
  userName: '',
  newPassword: ''
})

// 角色选项
const roleOptions = [
  { value: 'admin', label: '管理员', desc: '系统配置管理' },
  { value: 'inspector', label: '派驻检察官', desc: '填报数据' },
  { value: 'leader', label: '业务分管领导', desc: '审核数据' },
  { value: 'top_viewer', label: '院领导', desc: '查看统计' }
]

// 状态选项
const statusOptions = [
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '禁用' }
]

// API 基础路径
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 获取 token
function getToken() {
  return localStorage.getItem('token')
}

// API 请求
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 加载用户列表
async function loadUsers() {
  loading.value = true
  try {
    const params = {}
    if (filters.prison_name) params.prison_name = filters.prison_name
    if (filters.role) params.role = filters.role
    if (filters.status) params.status = filters.status

    const res = await api.get('/api/admin/users', { params })
    if (res.data.success) {
      users.value = res.data.data
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 加载派驻单位列表
async function loadPrisons() {
  try {
    const res = await api.get('/api/admin/prisons')
    if (res.data.success) {
      prisons.value = res.data.data
    }
  } catch (error) {
    console.error('加载派驻单位失败:', error)
  }
}

// 打开新增用户弹窗
function openAddDialog() {
  dialogMode.value = 'add'
  Object.assign(userForm, {
    id: null,
    username: '',
    password: '',
    name: '',
    prison_name: '',
    role: 'inspector',
    phone: '',
    status: 'active',
    prisonScopes: []
  })
  showUserDialog.value = true
}

// 打开编辑用户弹窗
async function openEditDialog(user) {
  dialogMode.value = 'edit'
  Object.assign(userForm, {
    id: user.id,
    username: user.username,
    password: '',
    name: user.name,
    prison_name: user.prison_name || '',
    role: user.role,
    phone: user.phone || '',
    status: user.status,
    prisonScopes: []
  })
  
  // 如果是分管领导，加载监狱范围
  if (user.role === 'leader') {
    try {
      const res = await api.get(`/api/admin/users/${user.id}/prison-scopes`)
      if (res.data.success) {
        userForm.prisonScopes = res.data.data.map(s => s.prison_name)
      }
    } catch (error) {
      console.error('加载监狱范围失败:', error)
    }
  }
  
  showUserDialog.value = true
}

// 保存用户
async function saveUser() {
  if (!userForm.name) {
    ElMessage.warning('请输入用户姓名')
    return
  }

  // 派驻检察官必须选择监狱
  if (userForm.role === 'inspector' && !userForm.prison_name) {
    ElMessage.warning('派驻检察官必须选择派驻单位')
    return
  }

  // 分管领导必须选择监狱范围
  if (userForm.role === 'leader' && userForm.prisonScopes.length === 0) {
    ElMessage.warning('业务分管领导必须选择至少一个分管监狱')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      if (!userForm.username || !userForm.password) {
        ElMessage.warning('请输入用户名和密码')
        return
      }
      await api.post('/api/admin/users', userForm)
      ElMessage.success('用户创建成功')
    } else {
      await api.put(`/api/admin/users/${userForm.id}`, userForm)
      ElMessage.success('用户信息已更新')
    }
    showUserDialog.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

// 打开密码重置弹窗
function openPasswordDialog(user) {
  passwordForm.userId = user.id
  passwordForm.userName = user.name
  passwordForm.newPassword = ''
  showPasswordDialog.value = true
}

// 重置密码
async function resetPassword() {
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    ElMessage.warning('密码至少需要6位')
    return
  }

  try {
    await api.put(`/api/admin/users/${passwordForm.userId}/password`, {
      password: passwordForm.newPassword
    })
    ElMessage.success('密码已重置')
    showPasswordDialog.value = false
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '重置密码失败')
  }
}

// 删除用户
async function deleteUser(user) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.name}" 吗？此操作不可恢复。`,
      '确认删除',
      { type: 'warning' }
    )
    
    await api.delete(`/api/admin/users/${user.id}`)
    ElMessage.success('用户已删除')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 获取角色标签类型
function getRoleType(role) {
  const types = {
    admin: 'danger',
    inspector: 'primary',
    leader: 'warning',
    top_viewer: 'success'
  }
  return types[role] || 'info'
}

// 获取角色名称
function getRoleName(role) {
  const names = {
    admin: '管理员',
    inspector: '派驻检察官',
    leader: '业务分管领导',
    top_viewer: '院领导'
  }
  return names[role] || role
}

onMounted(() => {
  loadUsers()
  loadPrisons()
})
</script>

<template>
  <div class="admin-users-page">
    <div class="page-header">
      <h2>
        <el-icon><Setting /></el-icon>
        系统设置
      </h2>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        新增用户
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-select 
          v-model="filters.prison_name" 
          placeholder="派驻单位" 
          clearable 
          style="width: 200px"
          @change="loadUsers"
        >
          <el-option 
            v-for="prison in prisons" 
            :key="prison" 
            :label="prison" 
            :value="prison" 
          />
        </el-select>
        
        <el-select 
          v-model="filters.role" 
          placeholder="角色" 
          clearable 
          style="width: 150px"
          @change="loadUsers"
        >
          <el-option 
            v-for="opt in roleOptions" 
            :key="opt.value" 
            :label="opt.label" 
            :value="opt.value" 
          />
        </el-select>
        
        <el-select 
          v-model="filters.status" 
          placeholder="状态" 
          clearable 
          style="width: 120px"
          @change="loadUsers"
        >
          <el-option 
            v-for="opt in statusOptions" 
            :key="opt.value" 
            :label="opt.label" 
            :value="opt.value" 
          />
        </el-select>
        
        <el-button :icon="Search" @click="loadUsers">查询</el-button>
      </div>
    </el-card>

    <!-- 用户列表 -->
    <el-card shadow="never">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="prison_name" label="派驻单位/分管监狱" min-width="200">
          <template #default="{ row }">
            <!-- 派驻检察官显示派驻单位 -->
            <span v-if="row.role === 'inspector' && row.prison_name">
              <el-icon><OfficeBuilding /></el-icon>
              {{ row.prison_name }}
            </span>
            <!-- 分管领导显示分管监狱列表 -->
            <div v-else-if="row.role === 'leader' && row.prisonScopes && row.prisonScopes.length > 0">
              <el-tag 
                v-for="prison in row.prisonScopes" 
                :key="prison" 
                size="small" 
                style="margin: 2px"
              >
                {{ prison }}
              </el-tag>
            </div>
            <!-- 院领导不需要显示 -->
            <el-text v-else-if="row.role === 'top_viewer'" type="info">全部监狱</el-text>
            <el-text v-else type="info">未设置</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" size="small">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button type="warning" link :icon="Key" @click="openPasswordDialog(row)">
              重置密码
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteUser(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog 
      v-model="showUserDialog" 
      :title="dialogMode === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
    >
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input 
            v-model="userForm.username" 
            placeholder="登录用户名"
            :disabled="dialogMode === 'edit'"
          />
        </el-form-item>
        
        <el-form-item label="密码" :required="dialogMode === 'add'">
          <el-input 
            v-model="userForm.password" 
            type="password" 
            :placeholder="dialogMode === 'add' ? '登录密码' : '留空则不修改密码'"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="姓名" required>
          <el-input v-model="userForm.name" placeholder="用户真实姓名" />
        </el-form-item>
        
        <el-form-item label="派驻单位" v-if="userForm.role === 'inspector'">
          <el-select v-model="userForm.prison_name" placeholder="选择或输入派驻单位" filterable allow-create style="width: 100%">
            <el-option v-for="prison in prisons" :key="prison" :label="prison" :value="prison" />
          </el-select>
          <el-text type="info" size="small">派驻检察官必须选择所属监狱</el-text>
        </el-form-item>
        
        <el-form-item label="分管监狱" v-if="userForm.role === 'leader'">
          <el-select 
            v-model="userForm.prisonScopes" 
            placeholder="选择分管的监狱（可多选）" 
            multiple
            filterable 
            allow-create 
            style="width: 100%"
          >
            <el-option v-for="prison in prisons" :key="prison" :label="prison" :value="prison" />
          </el-select>
          <el-text type="info" size="small">业务分管领导可以审核这些监狱的数据</el-text>
        </el-form-item>
        
        <el-form-item v-if="userForm.role === 'top_viewer'">
          <el-alert 
            title="院领导可以查看所有监狱的数据，无需配置范围" 
            type="success" 
            :closable="false"
            show-icon
          />
        </el-form-item>
        
        <el-form-item v-if="userForm.role === 'admin'">
          <el-alert 
            title="管理员只负责系统配置，不参与业务流程" 
            type="warning" 
            :closable="false"
            show-icon
          />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-radio-group v-model="userForm.role">
            <el-radio 
              v-for="opt in roleOptions" 
              :key="opt.value" 
              :value="opt.value"
              style="display: block; margin-bottom: 8px;"
            >
              <strong>{{ opt.label }}</strong>
              <el-text type="info" size="small" style="margin-left: 8px;">{{ opt.desc }}</el-text>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="电话">
          <el-input v-model="userForm.phone" placeholder="联系电话" />
        </el-form-item>
        
        <el-form-item label="状态" v-if="dialogMode === 'edit'">
          <el-switch 
            v-model="userForm.status" 
            active-value="active" 
            inactive-value="inactive"
            active-text="正常"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showUserDialog = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="showPasswordDialog" title="重置密码" width="400px">
      <el-form :model="passwordForm">
        <el-form-item label="用户">
          <el-text>{{ passwordForm.userName }}</el-text>
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="resetPassword">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-users-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 20px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
