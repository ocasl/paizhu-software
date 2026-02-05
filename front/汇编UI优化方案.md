# 汇编功能 UI 优化方案

## 🎨 设计目标
将当前的卡片式布局改为 Typora 风格的左右分栏布局，提升用户体验。

## 📐 布局设计

```
┌─────────────────────────────────────────────────────────────┐
│  📚 汇编 - 检察工作文档资料库          [管理分类] [上传文档]  │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│  🔍 搜索框        │                                          │
│  ─────────────   │                                          │
│                  │                                          │
│  📂 法律法规 (5)  │         📄 文档预览区域                   │
│    📄 文档1 ⭐    │                                          │
│    📄 文档2      │    [文档标题]                             │
│    📄 文档3      │                                          │
│                  │    文档内容在这里显示...                   │
│  📂 工作指引 (3)  │    - PDF: iframe 预览                    │
│    📄 文档4      │    - DOCX: HTML 预览                     │
│    📄 文档5      │                                          │
│                  │                                          │
│  📂 案例汇编 (8)  │                                          │
│    📄 文档6      │                                          │
│                  │                                          │
│                  │    [下载] [编辑] [删除] [置顶]            │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

## ✨ 核心特性

### 1. 左侧文档树
- **分类折叠/展开**：点击分类名称展开/折叠
- **文档列表**：显示文档标题、图标、置顶标识
- **搜索高亮**：搜索结果高亮显示
- **选中状态**：当前选中的文档高亮
- **快速操作**：右键菜单（编辑、删除、置顶）

### 2. 右侧预览区
- **文档信息**：标题、分类、大小、日期、统计
- **预览内容**：
  - PDF：使用 iframe 直接显示
  - DOCX：转换为 HTML 显示
- **操作按钮**：下载、编辑、删除、置顶
- **空状态**：未选择文档时显示提示

### 3. 搜索功能
- **实时搜索**：输入即搜索
- **搜索范围**：标题 + 描述
- **结果过滤**：只显示匹配的文档
- **清空搜索**：一键清空

### 4. 响应式设计
- **宽屏**：左侧 300px，右侧自适应
- **窄屏**：左侧可折叠，全屏预览

## 🎯 交互流程

### 查看文档
1. 用户点击左侧文档列表中的文档
2. 右侧立即加载并显示预览
3. 显示文档信息和操作按钮

### 搜索文档
1. 用户在搜索框输入关键词
2. 左侧文档树实时过滤
3. 只显示匹配的分类和文档
4. 清空搜索恢复完整列表

### 管理文档（管理员）
1. 点击文档右键或操作按钮
2. 选择编辑/删除/置顶
3. 操作完成后自动刷新列表

## 🎨 样式设计

### 颜色方案
- **主色**：#409EFF（蓝色）
- **成功**：#67C23A（绿色）
- **警告**：#E6A23C（橙色）
- **危险**：#F56C6C（红色）
- **背景**：#F5F7FA（浅灰）
- **边框**：#DCDFE6（灰色）

### 左侧文档树
```css
.document-tree {
  width: 300px;
  background: white;
  border-right: 1px solid #DCDFE6;
  overflow-y: auto;
}

.category-item {
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 600;
  border-bottom: 1px solid #EBEEF5;
}

.document-item {
  padding: 10px 16px 10px 32px;
  cursor: pointer;
  transition: all 0.3s;
}

.document-item:hover {
  background: #F5F7FA;
}

.document-item.active {
  background: #ECF5FF;
  border-left: 3px solid #409EFF;
}
```

### 右侧预览区
```css
.preview-area {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 20px;
  border-bottom: 1px solid #EBEEF5;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
```

## 📝 实现步骤

### 步骤 1：重构数据结构
```javascript
// 按分类组织文档
const documentsByCategory = computed(() => {
  const grouped = {}
  documents.value.forEach(doc => {
    const catName = doc.category?.name || '未分类'
    if (!grouped[catName]) {
      grouped[catName] = {
        category: doc.category,
        documents: []
      }
    }
    grouped[catName].documents.push(doc)
  })
  return grouped
})
```

### 步骤 2：创建左侧文档树组件
```vue
<div class="document-tree">
  <div class="search-box">
    <el-input v-model="keyword" placeholder="搜索文档..." clearable />
  </div>
  
  <div v-for="(group, catName) in filteredDocuments" :key="catName" class="category-group">
    <div class="category-item" @click="toggleCategory(catName)">
      <el-icon><Folder /></el-icon>
      <span>{{ catName }} ({{ group.documents.length }})</span>
    </div>
    
    <div v-show="expandedCategories.includes(catName)">
      <div
        v-for="doc in group.documents"
        :key="doc.id"
        class="document-item"
        :class="{ active: selectedDoc?.id === doc.id }"
        @click="selectDocument(doc)"
      >
        <el-icon v-if="doc.file_type === 'pdf'"><Document /></el-icon>
        <el-icon v-else><DocumentCopy /></el-icon>
        <span>{{ doc.title }}</span>
        <el-icon v-if="doc.is_pinned" color="#F56C6C"><Star /></el-icon>
      </div>
    </div>
  </div>
</div>
```

### 步骤 3：创建右侧预览区组件
```vue
<div class="preview-area">
  <div v-if="!selectedDoc" class="empty-state">
    <el-empty description="请选择一个文档查看" />
  </div>
  
  <template v-else>
    <div class="preview-header">
      <h2>{{ selectedDoc.title }}</h2>
      <div class="doc-meta">
        <el-tag>{{ selectedDoc.category?.name }}</el-tag>
        <span>{{ selectedDoc.file_type.toUpperCase() }}</span>
        <span>{{ formatFileSize(selectedDoc.file_size) }}</span>
        <span>{{ formatDate(selectedDoc.created_at) }}</span>
      </div>
      <div class="doc-actions">
        <el-button @click="downloadDocument(selectedDoc)">下载</el-button>
        <el-button v-if="isAdmin" @click="editDocument(selectedDoc)">编辑</el-button>
        <el-button v-if="isAdmin" @click="togglePin(selectedDoc)">
          {{ selectedDoc.is_pinned ? '取消置顶' : '置顶' }}
        </el-button>
        <el-button v-if="isAdmin" type="danger" @click="deleteDocument(selectedDoc)">删除</el-button>
      </div>
    </div>
    
    <div class="preview-content" v-loading="previewLoading">
      <iframe v-if="previewType === 'pdf'" :src="previewContent" />
      <div v-else-if="previewType === 'html'" v-html="previewContent" class="docx-preview" />
    </div>
  </template>
</div>
```

### 步骤 4：实现预览逻辑
```javascript
async function selectDocument(doc) {
  selectedDoc.value = doc
  previewLoading.value = true
  
  try {
    if (doc.file_type === 'pdf') {
      const token = getToken()
      const url = `${API_BASE}/api/compilation/documents/${doc.id}/preview`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
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
```

## 🚀 优势

1. **更直观**：左右布局，一目了然
2. **更快速**：点击即预览，无需弹窗
3. **更高效**：搜索、浏览、预览一气呵成
4. **更美观**：现代化设计，类似专业文档管理工具

## 📦 需要的依赖

无需额外依赖，使用现有的 Element Plus 组件即可。

## ⏱️ 预计工作量

- 重构 UI 布局：1-2 小时
- 实现交互逻辑：1 小时
- 样式优化：30 分钟
- 测试调试：30 分钟

**总计：3-4 小时**

## 🎯 下一步

需要我现在就开始实现这个新 UI 吗？我会创建一个全新的文件，你可以测试后决定是否替换。
