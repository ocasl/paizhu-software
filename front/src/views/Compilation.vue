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
const previewType = ref('')
const keyword = ref('')
const selectedCategory = ref('')
const expandedCategories = ref([])
const searchInDoc = ref('')
const searchResults = ref([])
const currentSearchIndex = ref(0)

// 对话框
const categoryDialogVisible = ref(false)
const categoryFormMode = ref('add')
const categoryForm = ref({ id: null, name: '', description: '', sort_order: 0, is_active: true })
const uploadDialogVisible = ref(false)
const uploadForm = ref({ title: '', description: '', category_id: '', file: null })
const uploadFileList = ref([])
const editDialogVisible = ref(false)
const editForm = ref({ id: null, title: '', description: '', category_id: '' })

// 按分类组织文档
const documentsByCategory = computed(() => {
  let docs = documents.value
  if (keyword.value) {
    docs = docs.filter(doc => 
      doc.title.toLowerCase().includes(keyword.value.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(keyword.value.toLowerCase()))
    )
  }
  if (selectedCategory.value) {
    docs = docs.filter(doc => doc.category_id == selectedCategory.value)
  }
  
  const grouped = {}
  docs.forEach(doc => {
    const catName = doc.category?.name || '未分类'
    if (!grouped[catName]) {
      grouped[catName] = { category: doc.category, documents: [] }
    }
    grouped[catName].documents.push(doc)
  })
  return grouped
})

// 获取数据
async function fetchCategories() {
  try {
    const res = await api.get('/api/compilation/categories')
    if (res.data.success) {
      categories.value = res.data.data
      expandedCategories.value = categories.value.map(c => c.name)
    }
  } catch (error) {
    ElMessage.error('获取分类失败')
  }
}

async function fetchDocuments() {
  loading.value = true
  try {
    const res = await api.get('/api/compilation/documents', { params: { limit: 1000 } })
    if (res.data.success) {
      documents.value = res.data.data.documents
    }
  } catch (error) {
    ElMessage.error('获取文档失败')
  } finally {
    loading.value = false
  }
}

// 选择文档并预览
async function selectDocument(doc) {
  selectedDoc.value = doc
  searchInDoc.value = ''
  previewLoading.value = true
  try {
    if (doc.file_type === 'pdf') {
      const token = getToken()
      const url = `${API_BASE}/api/compilation/documents/${doc.id}/preview`
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      const blob = await response.blob()
      previewContent.value = window.URL.createObjectURL(blob)
      previewType.value = 'pdf'
    } else {
      const res = await api.get(`/api/compilation/documents/${doc.id}/preview-docx`)
      previewContent.value = res.data.data.html
      previewType.value = 'html'
    }
  } catch (error) {
    ElMessage.error('预览失败')
  } finally {
    previewLoading.value = false
  }
}

// 文档内搜索
function searchInDocument() {
  if (!searchInDoc.value) {
    clearSearch()
    return
  }
  
  if (previewType.value === 'html') {
    const container = document.querySelector('.docx-preview')
    if (!container) return
    
    // 清除之前的高亮
    clearSearch()
    
    // 高亮匹配的文本
    const text = searchInDoc.value
    const regex = new RegExp(`(${text})`, 'gi')
    highlightText(container, regex)
    
    // 滚动到第一个匹配项
    const firstMatch = container.querySelector('.search-highlight')
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstMatch.classList.add('search-highlight-current')
    }
  } else if (previewType.value === 'pdf') {
    // PDF 使用浏览器原生查找
    const iframe = document.querySelector('.pdf-preview')
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.find(searchInDoc.value)
    }
  }
}

function highlightText(element, regex) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false)
  const nodesToReplace = []
  
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (regex.test(node.nodeValue)) {
      nodesToReplace.push(node)
    }
  }
  
  nodesToReplace.forEach(node => {
    const span = document.createElement('span')
    span.innerHTML = node.nodeValue.replace(regex, '<mark class="search-highlight">$1</mark>')
    node.parentNode.replaceChild(span, node)
  })
}

function clearSearch() {
  const highlights = document.querySelectorAll('.search-highlight')
  highlights.forEach(mark => {
    const parent = mark.parentNode
    parent.replaceChild(document.createTextNode(mark.textContent), mark)
    parent.normalize()
  })
}

function nextSearchResult() {
  const highlights = document.querySelectorAll('.search-highlight')
  if (highlights.length === 0) return
  
  highlights.forEach(h => h.classList.remove('search-highlight-current'))
  currentSearchIndex.value = (currentSearchIndex.value + 1) % highlights.length
  highlights[currentSearchIndex.value].classList.add('search-highlight-current')
  highlights[currentSearchIndex.value].scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function prevSearchResult() {
  const highlights = document.querySelectorAll('.search-highlight')
  if (highlights.length === 0) return
  
  highlights.forEach(h => h.classList.remove('search-highlight-current'))
  currentSearchIndex.value = (currentSearchIndex.value - 1 + highlights.length) % highlights.length
  highlights[currentSearchIndex.value].classList.add('search-highlight-current')
  highlights[currentSearchIndex.value].scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function toggleCategory(catName) {
  const index = expandedCategories.value.indexOf(catName)
  if (index > -1) {
    expandedCategories.value.splice(index, 1)
  } else {
    expandedCategories.value.push(catName)
  }
}

// 分类管理
function openCategoryDialog(mode = 'add', category = null) {
  categoryFormMode.value = mode
  if (mode === 'edit' && category) {
    categoryForm.value = { ...category }
  } else {
    categoryForm.value = { id: null, name: '', description: '', sort_order: 0, is_active: true }
  }
  categoryDialogVisible.value = true
}

async function submitCategoryForm() {
  try {
    if (!categoryForm.value.name) return ElMessage.warning('请输入分类名称')
    if (categoryFormMode.value === 'add') {
      await api.post('/api/compilation/categories', categoryForm.value)
      ElMessage.success('分类添加成功')
    } else {
      await api.put(`/api/compilation/categories/${categoryForm.value.id}`, categoryForm.value)
      ElMessage.success('分类更新成功')
    }
    categoryDialogVisible.value = false
    fetchCategories()
    fetchDocuments()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存分类失败')
  }
}

async function deleteCategory(category) {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '删除确认', { type: 'warning' })
    await api.delete(`/api/compilation/categories/${category.id}`)
    ElMessage.success('分类删除成功')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '删除分类失败')
  }
}

// 文档管理
function openUploadDialog() {
  uploadForm.value = { title: '', description: '', category_id: '', file: null }
  uploadFileList.value = []
  uploadDialogVisible.value = true
}

function handleFileChange(file) {
  uploadForm.value.file = file.raw
}

async function submitUploadForm() {
  try {
    if (!uploadForm.value.title) return ElMessage.warning('请输入文档标题')
    if (!uploadForm.value.category_id) return ElMessage.warning('请选择分类')
    if (!uploadForm.value.file) return ElMessage.warning('请选择文件')
    
    const formData = new FormData()
    formData.append('title', uploadForm.value.title)
    formData.append('description', uploadForm.value.description || '')
    formData.append('category_id', uploadForm.value.category_id)
    formData.append('file', uploadForm.value.file)
    
    await api.post('/api/compilation/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    ElMessage.success('文档上传成功')
    uploadDialogVisible.value = false
    fetchDocuments()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '上传文档失败')
  }
}

function openEditDialog(doc) {
  editForm.value = { id: doc.id, title: doc.title, description: doc.description, category_id: doc.category_id }
  editDialogVisible.value = true
}

async function submitEditForm() {
  try {
    if (!editForm.value.title) return ElMessage.warning('请输入文档标题')
    await api.put(`/api/compilation/documents/${editForm.value.id}`, editForm.value)
    ElMessage.success('文档更新成功')
    editDialogVisible.value = false
    fetchDocuments()
    if (selectedDoc.value?.id === editForm.value.id) {
      selectedDoc.value = { ...selectedDoc.value, ...editForm.value }
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '更新文档失败')
  }
}

async function deleteDocument(doc) {
  try {
    await ElMessageBox.confirm(`确定要删除文档"${doc.title}"吗？`, '删除确认', { type: 'warning' })
    await api.delete(`/api/compilation/documents/${doc.id}`)
    ElMessage.success('文档删除成功')
    if (selectedDoc.value?.id === doc.id) selectedDoc.value = null
    fetchDocuments()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message || '删除文档失败')
  }
}

async function togglePin(doc) {
  try {
    await api.put(`/api/compilation/documents/${doc.id}/pin`, { is_pinned: !doc.is_pinned })
    ElMessage.success(doc.is_pinned ? '已取消置顶' : '已置顶')
    fetchDocuments()
  } catch (error) {
    ElMessage.error('置顶操作失败')
  }
}

function downloadDocument(doc) {
  const token = getToken()
  const url = `${API_BASE}/api/compilation/documents/${doc.id}/download`
  fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = doc.file_name
      link.click()
      window.URL.revokeObjectURL(blobUrl)
    })
    .catch(() => ElMessage.error('下载失败'))
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString('zh-CN') : ''
}

onMounted(() => {
  fetchCategories()
  fetchDocuments()
})

</script>

<template>
  <div class="compilation-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1 class="page-title">📚 汇编</h1>
        <span class="page-subtitle">检察工作文档资料库</span>
      </div>
      <div class="toolbar-right">
        <el-button v-if="isAdmin" @click="openCategoryDialog('add')">管理分类</el-button>
        <el-button v-if="isAdmin" type="primary" @click="openUploadDialog">上传文档</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧文档树 -->
      <div class="document-tree" v-loading="loading">
        <div class="search-box">
          <el-input v-model="keyword" placeholder="搜索文档..." clearable prefix-icon="Search" />
          <el-select v-model="selectedCategory" placeholder="筛选分类" clearable style="margin-top: 10px">
            <el-option v-for="cat in categories.filter(c => c.is_active)" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </div>

        <div class="tree-content">
          <div v-for="(group, catName) in documentsByCategory" :key="catName" class="category-group">
            <div class="category-item" @click="toggleCategory(catName)">
              <el-icon><Folder /></el-icon>
              <span class="category-name">{{ catName }}</span>
              <span class="doc-count">({{ group.documents.length }})</span>
              <el-icon class="expand-icon" :class="{ expanded: expandedCategories.includes(catName) }">
                <ArrowRight />
              </el-icon>
            </div>

            <transition name="slide">
              <div v-show="expandedCategories.includes(catName)" class="document-list">
                <div
                  v-for="doc in group.documents"
                  :key="doc.id"
                  class="document-item"
                  :class="{ active: selectedDoc?.id === doc.id, pinned: doc.is_pinned }"
                  @click="selectDocument(doc)"
                >
                  <el-icon v-if="doc.file_type === 'pdf'" color="#f56c6c"><Document /></el-icon>
                  <el-icon v-else color="#409eff"><DocumentCopy /></el-icon>
                  <span class="doc-title">{{ doc.title }}</span>
                  <el-icon v-if="doc.is_pinned" class="pin-icon" color="#f56c6c"><Star /></el-icon>
                </div>
              </div>
            </transition>
          </div>

          <el-empty v-if="Object.keys(documentsByCategory).length === 0" description="暂无文档" />
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="preview-area">
        <div v-if="!selectedDoc" class="empty-state">
          <el-empty description="请从左侧选择一个文档查看">
            <template #image>
              <el-icon :size="100" color="#909399"><Document /></el-icon>
            </template>
          </el-empty>
        </div>

        <template v-else>
          <div class="preview-header">
            <div class="doc-info">
              <h2 class="doc-title">{{ selectedDoc.title }}</h2>
              <div class="doc-meta">
                <el-tag size="small">{{ selectedDoc.category?.name }}</el-tag>
                <span>{{ selectedDoc.file_type.toUpperCase() }}</span>
                <span>{{ formatFileSize(selectedDoc.file_size) }}</span>
                <span>{{ formatDate(selectedDoc.created_at) }}</span>
                <span>👁️ {{ selectedDoc.view_count }}次</span>
                <span>📥 {{ selectedDoc.download_count }}次</span>
              </div>
              <p v-if="selectedDoc.description" class="doc-description">{{ selectedDoc.description }}</p>
            </div>
            
            <!-- 文档内搜索 -->
            <div class="doc-search">
              <el-input
                v-model="searchInDoc"
                placeholder="在文档中查找 (Ctrl+F)"
                clearable
                @keyup.enter="searchInDocument"
                @clear="clearSearch"
                style="width: 300px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #append>
                  <el-button-group>
                    <el-button @click="prevSearchResult" icon="ArrowUp" size="small" />
                    <el-button @click="nextSearchResult" icon="ArrowDown" size="small" />
                  </el-button-group>
                </template>
              </el-input>
              <el-button @click="searchInDocument" type="primary" icon="Search">查找</el-button>
            </div>
            
            <div class="doc-actions">
              <el-button @click="downloadDocument(selectedDoc)" icon="Download">下载</el-button>
              <el-button v-if="isAdmin" @click="openEditDialog(selectedDoc)" icon="Edit">编辑</el-button>
              <el-button v-if="isAdmin" @click="togglePin(selectedDoc)" :icon="selectedDoc.is_pinned ? 'StarFilled' : 'Star'">
                {{ selectedDoc.is_pinned ? '取消置顶' : '置顶' }}
              </el-button>
              <el-button v-if="isAdmin" type="danger" @click="deleteDocument(selectedDoc)" icon="Delete">删除</el-button>
            </div>
          </div>

          <div class="preview-content" v-loading="previewLoading">
            <iframe v-if="previewType === 'pdf'" :src="previewContent" class="pdf-preview" />
            <div v-else-if="previewType === 'html'" v-html="previewContent" class="docx-preview" />
          </div>
        </template>
      </div>
    </div>

    <!-- 分类管理对话框 -->
    <el-dialog v-model="categoryDialogVisible" :title="categoryFormMode === 'add' ? '添加分类' : '编辑分类'" width="600px">
      <el-form :model="categoryForm" label-width="100px">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类描述">
          <el-input v-model="categoryForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="categoryForm.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      
      <div v-if="categoryFormMode === 'add'" style="margin-top: 20px">
        <el-divider>现有分类</el-divider>
        <el-table :data="categories" size="small">
          <el-table-column prop="name" label="分类名称" />
          <el-table-column prop="doc_count" label="文档数" width="80" />
          <el-table-column prop="is_active" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                {{ row.is_active ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="openCategoryDialog('edit', row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategoryForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 上传文档对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文档" width="600px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="文档标题" required>
          <el-input v-model="uploadForm.title" placeholder="请输入文档标题" />
        </el-form-item>
        <el-form-item label="文档描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="uploadForm.category_id" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories.filter(c => c.is_active)" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件" required>
          <el-upload
            v-model:file-list="uploadFileList"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            accept=".pdf,.docx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">只支持 PDF 和 DOCX 格式，文件大小不超过 50MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUploadForm">上传</el-button>
      </template>
    </el-dialog>

    <!-- 编辑文档对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑文档" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="文档标题" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="文档描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="editForm.category_id" style="width: 100%">
            <el-option v-for="cat in categories.filter(c => c.is_active)" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.compilation-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧文档树 */
.document-tree {
  width: 320px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-box {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
}

.category-group {
  border-bottom: 1px solid #f0f0f0;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 600;
  color: #303133;
  background: #fafafa;
  transition: all 0.3s;
}

.category-item:hover {
  background: #f0f0f0;
}

.category-name {
  flex: 1;
}

.doc-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.expand-icon {
  transition: transform 0.3s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.document-list {
  background: white;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 10px 40px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.document-item:hover {
  background: #f5f7fa;
}

.document-item.active {
  background: #ecf5ff;
  border-left-color: #409eff;
}

.document-item.pinned {
  background: #fef0f0;
}

.document-item.pinned.active {
  background: #fde2e2;
  border-left-color: #f56c6c;
}

.doc-title {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pin-icon {
  flex-shrink: 0;
}

/* 右侧预览区 */
.preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-header {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.doc-info .doc-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #303133;
}

.doc-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.doc-description {
  font-size: 14px;
  color: #606266;
  margin: 12px 0 0 0;
  line-height: 1.6;
}

.doc-search {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 16px 0;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.doc-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.pdf-preview {
  width: 100%;
  height: 100%;
  border: none;
}

.docx-preview {
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.8;
  font-size: 14px;
}

.docx-preview :deep(p) {
  margin: 10px 0;
}

.docx-preview :deep(h1),
.docx-preview :deep(h2),
.docx-preview :deep(h3) {
  margin: 20px 0 10px 0;
  font-weight: 600;
}

.docx-preview :deep(img) {
  max-width: 100%;
  height: auto;
}

.docx-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
}

.docx-preview :deep(table td),
.docx-preview :deep(table th) {
  border: 1px solid #ddd;
  padding: 8px;
}

/* 搜索高亮 */
.docx-preview :deep(.search-highlight) {
  background-color: #ffeb3b;
  padding: 2px 0;
}

.docx-preview :deep(.search-highlight-current) {
  background-color: #ff9800;
  font-weight: bold;
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 滚动条样式 */
.tree-content::-webkit-scrollbar,
.preview-content::-webkit-scrollbar {
  width: 6px;
}

.tree-content::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.tree-content::-webkit-scrollbar-thumb:hover,
.preview-content::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
