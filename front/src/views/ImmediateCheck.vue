<script setup>
import { ref, reactive } from 'vue'
import { useOfflineStore } from '../stores/offline'
import { ElMessage } from 'element-plus'
import { Warning, Plus, Delete } from '@element-plus/icons-vue'

const offlineStore = useOfflineStore()

// 事件类型
const eventTypes = [
  { value: 'escape', label: '脱逃事件', icon: 'danger' },
  { value: 'selfHarm', label: '自伤自杀', icon: 'danger' },
  { value: 'majorAccident', label: '重大事故', icon: 'danger' },
  { value: 'death', label: '罪犯死亡', icon: 'warning' },
  { value: 'majorActivity', label: '重大监管活动', icon: 'info' },
  { value: 'policeDiscipline', label: '民警受处分', icon: 'warning' },
  { value: 'paroleRequest', label: '减刑假释提请', icon: 'primary' }
]

// 事件记录列表
const eventRecords = ref([])

// 新事件表单
const showEventDialog = ref(false)
const eventForm = reactive({
  type: '',
  date: new Date(),
  title: '',
  description: '',
  attachments: [],
  // 减刑假释专用字段
  paroleData: {
    batch: '',
    count: 0,
    stage: ''
  }
})

// 减刑假释阶段选项
const paroleStages = [
  { value: 'review', label: '审查阶段' },
  { value: 'publicize', label: '公示阶段' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已通过' }
]

// 获取事件类型信息
function getEventTypeInfo(type) {
  return eventTypes.find(t => t.value === type) || {}
}

// 添加事件记录
function addEventRecord() {
  if (!eventForm.type || !eventForm.title) {
    ElMessage.warning('请选择事件类型并填写事件标题')
    return
  }
  
  eventRecords.value.push({
    id: Date.now(),
    ...eventForm,
    typeLabel: getEventTypeInfo(eventForm.type).label
  })
  
  resetEventForm()
  showEventDialog.value = false
  ElMessage.success('事件记录已添加')
}

// 删除事件记录
function removeEventRecord(index) {
  eventRecords.value.splice(index, 1)
}

// 重置事件表单
function resetEventForm() {
  eventForm.type = ''
  eventForm.date = new Date()
  eventForm.title = ''
  eventForm.description = ''
  eventForm.attachments = []
  eventForm.paroleData = { batch: '', count: 0, stage: '' }
}

// 提交及时检察数据
async function submitImmediateData() {
  try {
    if (eventRecords.value.length === 0) {
      ElMessage.warning('请至少添加一条事件记录')
      return
    }
    
    if (offlineStore.isOnline) {
      ElMessage.success('及时检察数据提交成功')
    } else {
      await offlineStore.saveFormOffline('immediate-check', eventRecords.value)
      ElMessage.success('数据已保存到本地，联网后自动同步')
    }
  } catch (error) {
    ElMessage.error('提交失败: ' + error.message)
  }
}
</script>

<template>
  <div class="immediate-check-page">
    <el-card class="main-card">
      <template #header>
        <div class="card-header-flex">
          <div class="header-left">
            <el-icon :size="24" color="#F56C6C"><Warning /></el-icon>
            <span>及时检察记录</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="showEventDialog = true">
            添加事件
          </el-button>
        </div>
      </template>

      <!-- 事件类型快捷入口 -->
      <div class="event-type-grid">
        <div 
          v-for="type in eventTypes" 
          :key="type.value"
          class="event-type-card"
          :class="type.icon"
          @click="eventForm.type = type.value; showEventDialog = true"
        >
          <span>{{ type.label }}</span>
        </div>
      </div>

      <el-divider />

      <!-- 事件记录列表 -->
      <div v-if="eventRecords.length === 0" class="empty-state">
        <el-empty description="暂无事件记录，点击上方按钮添加" />
      </div>
      
      <div v-else class="event-list">
        <el-card 
          v-for="(record, index) in eventRecords" 
          :key="record.id"
          class="event-card"
          :class="getEventTypeInfo(record.type).icon"
          shadow="hover"
        >
          <div class="event-header">
            <el-tag :type="getEventTypeInfo(record.type).icon">
              {{ record.typeLabel }}
            </el-tag>
            <h4 class="event-title">{{ record.title }}</h4>
            <span class="event-date">{{ new Date(record.date).toLocaleDateString('zh-CN') }}</span>
            <el-button type="danger" :icon="Delete" circle size="small" @click="removeEventRecord(index)" />
          </div>
          
          <p class="event-desc" v-if="record.description">{{ record.description }}</p>
          
          <!-- 减刑假释专用信息 -->
          <div v-if="record.type === 'paroleRequest'" class="parole-info">
            <el-tag type="info">批次: {{ record.paroleData.batch }}</el-tag>
            <el-tag type="info">数量: {{ record.paroleData.count }}人</el-tag>
            <el-tag type="info">阶段: {{ paroleStages.find(s => s.value === record.paroleData.stage)?.label }}</el-tag>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 提交按钮 -->
    <div class="submit-section" v-if="eventRecords.length > 0">
      <el-button type="primary" size="large" @click="submitImmediateData">
        提交及时检察数据
      </el-button>
    </div>

    <!-- 添加事件对话框 -->
    <el-dialog 
      v-model="showEventDialog" 
      title="添加事件记录"
      width="600px"
    >
      <el-form :model="eventForm" label-width="100px">
        <el-form-item label="事件类型" required>
          <el-select v-model="eventForm.type" placeholder="选择事件类型" style="width: 100%">
            <el-option 
              v-for="type in eventTypes" 
              :key="type.value" 
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发生日期">
          <el-date-picker v-model="eventForm.date" type="date" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="事件标题" required>
          <el-input v-model="eventForm.title" placeholder="简要描述事件" />
        </el-form-item>
        
        <el-form-item label="详细描述">
          <el-input 
            v-model="eventForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="详细描述事件情况..."
          />
        </el-form-item>
        
        <!-- 减刑假释专用字段 -->
        <template v-if="eventForm.type === 'paroleRequest'">
          <el-divider content-position="left">减刑假释信息</el-divider>
          
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="批次">
                <el-input v-model="eventForm.paroleData.batch" placeholder="如：2024年第3批" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="数量">
                <el-input-number v-model="eventForm.paroleData.count" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="阶段">
                <el-select v-model="eventForm.paroleData.stage" style="width: 100%">
                  <el-option 
                    v-for="stage in paroleStages" 
                    :key="stage.value" 
                    :label="stage.label" 
                    :value="stage.value" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        
        <el-form-item label="附件材料">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="10"
          >
            <el-button type="primary">上传情况报告</el-button>
            <template #tip>
              <div class="el-upload__tip">支持各种格式文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEventDialog = false">取消</el-button>
        <el-button type="primary" @click="addEventRecord">确定添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.immediate-check-page {
  max-width: 1000px;
  margin: 0 auto;
}

.main-card {
  border-radius: 12px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.event-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.event-type-card {
  padding: 16px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.event-type-card.danger {
  background: linear-gradient(135deg, #F56C6C20, #F56C6C10);
  color: #F56C6C;
  border: 1px solid #F56C6C40;
}

.event-type-card.warning {
  background: linear-gradient(135deg, #E6A23C20, #E6A23C10);
  color: #E6A23C;
  border: 1px solid #E6A23C40;
}

.event-type-card.info {
  background: linear-gradient(135deg, #909399 20, #90939910);
  color: #909399;
  border: 1px solid #90939940;
}

.event-type-card.primary {
  background: linear-gradient(135deg, #409EFF20, #409EFF10);
  color: #409EFF;
  border: 1px solid #409EFF40;
}

.event-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-state {
  padding: 40px 0;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  border-left: 4px solid #909399;
}

.event-card.danger {
  border-left-color: #F56C6C;
}

.event-card.warning {
  border-left-color: #E6A23C;
}

.event-card.primary {
  border-left-color: #409EFF;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
}

.event-date {
  color: #909399;
  font-size: 13px;
}

.event-desc {
  margin: 12px 0 0;
  color: #606266;
  line-height: 1.6;
}

.parole-info {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}

.submit-section .el-button {
  min-width: 200px;
}
</style>
