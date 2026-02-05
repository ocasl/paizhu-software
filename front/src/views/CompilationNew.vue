<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.role === 'admin')

// API 配置
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

// 创建 axios 实例并配置拦截器
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

// 数据
const categories = ref([])
const documents = ref([])
const loading = ref(false)
const selectedDoc = ref(null)
const previewLoading = ref(false)
const previewContent = ref('')
const previewType = ref('') // 'pdf' or 'html'

// 搜索
const keyword = ref('')
const selectedCategory = ref('')

// 对话框
const categoryDialogVisible = ref(false)
const categoryFormMode = ref('add')
const categoryForm = ref({
  id: null,
  name: '',
  description: '',
  sort_order: 0,
  is_active: true
})

const uploadDialogVisible = ref(false)
const uploadForm = ref({
  title: '',
  description: '',
  category_id: '',
  file: null
})
const uploadFileList = ref([])

const editDialogVisible = ref(false)
const editForm = ref({
  id: null,
  title: '',
  description: '',
  category_id: ''
})
