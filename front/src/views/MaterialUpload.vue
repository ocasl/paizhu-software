<script setup>
import { ref, reactive, computed } from 'vue'
import { useOfflineStore } from '../stores/offline'
import { ElMessage } from 'element-plus'
import { Upload, Document, FolderOpened, Check, Close } from '@element-plus/icons-vue'

const offlineStore = useOfflineStore()

// 上传类别
const uploadCategories = [
  {
    id: 'roster',
    name: '人员花名册',
    desc: '入监/出监/严管/涉黑等花名册',
    accept: '.xls,.xlsx,.doc,.docx',
    icon: Document,
    color: '#409EFF',
    files: []
  },
  {
    id: 'transcript',
    name: '谈话笔录',
    desc: '新收/外伤/严管/非常规会见罪犯谈话笔录',
    accept: '.pdf,.doc,.docx,.jpg,.png',
    icon: FolderOpened,
    color: '#67C23A',
    files: []
  },
  {
    id: 'questionnaire',
    name: '调查问卷',
    desc: '出监问卷调查表、异常调查问卷',
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    icon: Document,
    color: '#E6A23C',
    files: []
  },
  {
    id: 'report',
    name: '情况报告',
    desc: '事故报告、死亡处理报告、活动报告',
    accept: '.pdf,.doc,.docx',
    icon: Document,
    color: '#F56C6C',
    files: []
  },
  {
    id: 'parole',
    name: '减刑假释',
    desc: '减刑假释花名册、暂予监外执行材料',
    accept: '.xls,.xlsx,.doc,.docx,.pdf',
    icon: FolderOpened,
    color: '#7B68EE',
    files: []
  },
  {
    id: 'other',
    name: '其他材料',
    desc: '其他需要上传的材料',
    accept: '*',
    icon: Upload,
    color: '#909399',
    files: []
  }
]

// 上传文件列表
const categoryFiles = reactive(
  Object.fromEntries(uploadCategories.map(c => [c.id, []]))
)

// 总上传数量
const totalFilesCount = computed(() => {
  return Object.values(categoryFiles).reduce((sum, files) => sum + files.length, 0)
})

// 处理文件变化
function handleFileChange(categoryId, file, fileList) {
  categoryFiles[categoryId] = fileList
}

// 移除文件
function handleFileRemove(categoryId, file, fileList) {
  categoryFiles[categoryId] = fileList
}

// 上传前验证
function beforeUpload(file) {
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    ElMessage.warning('文件大小不能超过 50MB')
    return false
  }
  return true
}

// 提交所有上传
async function submitAllUploads() {
  if (totalFilesCount.value === 0) {
    ElMessage.warning('请至少选择一个文件上传')
    return
  }
  
  try {
    const allFiles = []
    for (const [categoryId, files] of Object.entries(categoryFiles)) {
      for (const file of files) {
        allFiles.push({
          category: categoryId,
          file: file.raw
        })
      }
    }
    
    if (offlineStore.isOnline) {
      // TODO: 实际上传到服务器
      ElMessage.success(`成功上传 ${totalFilesCount.value} 个文件`)
    } else {
      // 离线保存
      for (const { category, file } of allFiles) {
        await offlineStore.saveAttachmentOffline(file, { category })
      }
      ElMessage.success('文件已保存到本地，联网后自动上传')
    }
    
    // 清空文件列表
    for (const key of Object.keys(categoryFiles)) {
      categoryFiles[key] = []
    }
  } catch (error) {
    ElMessage.error('上传失败: ' + error.message)
  }
}
</script>

<template>
  <div class="material-upload-page">
    <div class="page-header">
      <h2>材料上传中心</h2>
      <p>上传各类花名册、谈话笔录、调查问卷等材料</p>
    </div>

    <!-- 上传类别卡片 -->
    <div class="upload-grid">
      <el-card 
        v-for="category in uploadCategories" 
        :key="category.id"
        class="upload-card"
        :body-style="{ padding: '20px' }"
      >
        <div class="card-header" :style="{ '--accent-color': category.color }">
          <div class="category-icon" :style="{ background: category.color }">
            <el-icon :size="24" color="#fff"><component :is="category.icon" /></el-icon>
          </div>
          <div class="category-info">
            <h4>{{ category.name }}</h4>
            <p>{{ category.desc }}</p>
          </div>
          <el-badge 
            v-if="categoryFiles[category.id].length > 0"
            :value="categoryFiles[category.id].length" 
            type="primary"
          />
        </div>
        
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :accept="category.accept"
          multiple
          :file-list="categoryFiles[category.id]"
          :before-upload="beforeUpload"
          :on-change="(file, fileList) => handleFileChange(category.id, file, fileList)"
          :on-remove="(file, fileList) => handleFileRemove(category.id, file, fileList)"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处，或 <em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持格式：{{ category.accept === '*' ? '所有格式' : category.accept }}
            </div>
          </template>
        </el-upload>
      </el-card>
    </div>

    <!-- 上传汇总 -->
    <div class="upload-summary" v-if="totalFilesCount > 0">
      <el-card>
        <div class="summary-content">
          <div class="summary-info">
            <el-icon :size="32" color="#67C23A"><Check /></el-icon>
            <div>
              <h4>已选择 {{ totalFilesCount }} 个文件</h4>
              <p>
                <span v-for="(files, key) in categoryFiles" :key="key" v-if="files.length > 0">
                  {{ uploadCategories.find(c => c.id === key)?.name }}: {{ files.length }}个 &nbsp;
                </span>
              </p>
            </div>
          </div>
          <el-button type="primary" size="large" @click="submitAllUploads">
            上传所有文件
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 离线状态提示 -->
    <el-alert
      v-if="!offlineStore.isOnline"
      title="当前处于离线模式"
      type="warning"
      description="文件将保存到本地，待网络恢复后自动上传到服务器"
      show-icon
      :closable="false"
      class="offline-alert"
    />
  </div>
</template>

<style scoped>
.material-upload-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.page-header p {
  color: #909399;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.upload-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.upload-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--accent-color, #409EFF);
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
}

.category-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.category-info p {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 20px;
  border-radius: 8px;
}

.upload-summary {
  margin-top: 24px;
  position: sticky;
  bottom: 24px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-info h4 {
  margin: 0 0 4px;
  font-size: 16px;
}

.summary-info p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.offline-alert {
  margin-top: 24px;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .upload-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
