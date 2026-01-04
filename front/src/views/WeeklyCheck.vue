<script setup>
import { ref, reactive } from 'vue'
import { useOfflineStore } from '../stores/offline'
import { ElMessage } from 'element-plus'
import { Plus, Document, User } from '@element-plus/icons-vue'

const offlineStore = useOfflineStore()

// 活动标签页
const activeTab = ref('hospital')

// 医院/禁闭室检察表单
const hospitalForm = reactive({
  date: new Date(),
  hospitalChecked: false,
  hospitalIssues: '',
  confinementChecked: false,
  confinementCount: 0,
  confinementIssues: '',
  policeWeaponChecked: false,
  policeWeaponIssues: ''
})

// 罪犯外伤排查
const injuryForm = reactive({
  date: new Date(),
  checkedCount: 0,
  injuries: []
})

// 罪犯谈话记录
const talkRecords = ref([])
const showTalkDialog = ref(false)
const talkForm = reactive({
  type: 'newPrisoner', // newPrisoner, release, injury, confinement
  prisonerName: '',
  prisonerId: '',
  date: new Date(),
  content: '',
  transcript: null
})

// 检察官信箱
const mailboxForm = reactive({
  openCount: 0,
  receivedCount: 0,
  caseClues: []
})

// 违禁品排查
const contrabandForm = reactive({
  date: new Date(),
  checked: false,
  foundItems: []
})

// 谈话类型选项
const talkTypes = [
  { value: 'newPrisoner', label: '新入监罪犯' },
  { value: 'release', label: '刑释前罪犯' },
  { value: 'injury', label: '外伤罪犯' },
  { value: 'confinement', label: '禁闭罪犯' }
]

// 添加谈话记录
function addTalkRecord() {
  if (!talkForm.prisonerName || !talkForm.content) {
    ElMessage.warning('请填写罪犯姓名和谈话内容')
    return
  }
  
  talkRecords.value.push({
    id: Date.now(),
    ...talkForm,
    typeLabel: talkTypes.find(t => t.value === talkForm.type)?.label
  })
  
  resetTalkForm()
  showTalkDialog.value = false
  ElMessage.success('谈话记录已添加')
}

// 删除谈话记录
function removeTalkRecord(index) {
  talkRecords.value.splice(index, 1)
}

// 重置谈话表单
function resetTalkForm() {
  talkForm.type = 'newPrisoner'
  talkForm.prisonerName = ''
  talkForm.prisonerId = ''
  talkForm.content = ''
  talkForm.transcript = null
}

// 提交周检察数据
async function submitWeeklyData() {
  try {
    const weeklyData = {
      hospital: hospitalForm,
      injury: injuryForm,
      talks: talkRecords.value,
      mailbox: mailboxForm,
      contraband: contrabandForm
    }
    
    if (offlineStore.isOnline) {
      // TODO: 调用 API 提交
      ElMessage.success('周检察数据提交成功')
    } else {
      await offlineStore.saveFormOffline('weekly-check', weeklyData)
      ElMessage.success('数据已保存到本地，联网后自动同步')
    }
  } catch (error) {
    ElMessage.error('提交失败: ' + error.message)
  }
}
</script>

<template>
  <div class="weekly-check-page">
    <el-tabs v-model="activeTab" type="border-card" class="weekly-tabs">
      <!-- 医院/禁闭室检察 -->
      <el-tab-pane label="医院/禁闭室" name="hospital">
        <el-card shadow="never">
          <template #header>
            <span>监狱医院与禁闭室检察</span>
          </template>
          
          <el-form :model="hospitalForm" label-width="120px" label-position="top">
            <el-form-item label="检察日期">
              <el-date-picker v-model="hospitalForm.date" type="date" style="width: 100%" />
            </el-form-item>
            
            <el-divider content-position="left">监狱医院</el-divider>
            
            <el-form-item>
              <el-checkbox v-model="hospitalForm.hospitalChecked" border size="large">
                已检察监狱医院
              </el-checkbox>
            </el-form-item>
            
            <el-form-item label="发现问题" v-if="hospitalForm.hospitalChecked">
              <el-input 
                v-model="hospitalForm.hospitalIssues" 
                type="textarea" 
                :rows="3"
                placeholder="如无问题可留空"
              />
            </el-form-item>
            
            <el-divider content-position="left">禁闭室</el-divider>
            
            <el-form-item>
              <el-checkbox v-model="hospitalForm.confinementChecked" border size="large">
                已检察禁闭室
              </el-checkbox>
            </el-form-item>
            
            <el-row :gutter="16" v-if="hospitalForm.confinementChecked">
              <el-col :span="12">
                <el-form-item label="禁闭人数">
                  <el-input-number v-model="hospitalForm.confinementCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发现问题">
                  <el-input v-model="hospitalForm.confinementIssues" placeholder="如无问题可留空" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-divider content-position="left">警械使用</el-divider>
            
            <el-form-item>
              <el-checkbox v-model="hospitalForm.policeWeaponChecked" border size="large">
                已检察警械使用情况
              </el-checkbox>
            </el-form-item>
            
            <el-form-item label="发现问题" v-if="hospitalForm.policeWeaponChecked">
              <el-input 
                v-model="hospitalForm.policeWeaponIssues" 
                type="textarea" 
                :rows="2"
                placeholder="如无问题可留空"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 罪犯谈话 -->
      <el-tab-pane label="罪犯谈话" name="talk">
        <el-card shadow="never">
          <template #header>
            <div class="card-header-flex">
              <span>罪犯谈话记录</span>
              <el-button type="primary" :icon="Plus" @click="showTalkDialog = true">
                添加谈话
              </el-button>
            </div>
          </template>
          
          <div v-if="talkRecords.length === 0" class="empty-state">
            <el-empty description="暂无谈话记录" />
          </div>
          
          <div v-else class="talk-list">
            <el-card 
              v-for="(record, index) in talkRecords" 
              :key="record.id"
              class="talk-card"
              shadow="hover"
            >
              <div class="talk-header">
                <el-tag :type="record.type === 'newPrisoner' ? 'primary' : 
                              record.type === 'release' ? 'success' : 
                              record.type === 'injury' ? 'warning' : 'danger'">
                  {{ record.typeLabel }}
                </el-tag>
                <span class="talk-name">
                  <el-icon><User /></el-icon>
                  {{ record.prisonerName }}
                </span>
                <span class="talk-id" v-if="record.prisonerId">编号: {{ record.prisonerId }}</span>
                <el-button type="danger" text @click="removeTalkRecord(index)">删除</el-button>
              </div>
              <p class="talk-content">{{ record.content }}</p>
              <div class="talk-footer">
                <span>{{ new Date(record.date).toLocaleDateString('zh-CN') }}</span>
                <el-tag v-if="record.transcript" type="info" size="small">
                  <el-icon><Document /></el-icon> 已上传笔录
                </el-tag>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 检察官信箱 -->
      <el-tab-pane label="检察官信箱" name="mailbox">
        <el-card shadow="never">
          <template #header>
            <span>检察官信箱</span>
          </template>
          
          <el-form :model="mailboxForm" label-width="120px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="开启次数">
                  <el-input-number v-model="mailboxForm.openCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="收到信件数">
                  <el-input-number v-model="mailboxForm.receivedCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="案件线索">
              <el-input 
                type="textarea" 
                :rows="4"
                placeholder="记录检察官信箱中收到的案件线索..."
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 违禁品排查 -->
      <el-tab-pane label="违禁品排查" name="contraband">
        <el-card shadow="never">
          <template #header>
            <span>罪犯违禁品排查</span>
          </template>
          
          <el-form :model="contrabandForm" label-width="120px">
            <el-form-item label="排查日期">
              <el-date-picker v-model="contrabandForm.date" type="date" style="width: 100%" />
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="contrabandForm.checked" border size="large">
                已进行违禁品排查
              </el-checkbox>
            </el-form-item>
            
            <el-form-item label="发现物品" v-if="contrabandForm.checked">
              <el-input 
                type="textarea" 
                :rows="3"
                placeholder="如有发现违禁品，请详细描述..."
              />
              
              <el-upload
                action="#"
                :auto-upload="false"
                list-type="picture-card"
                :limit="10"
                class="contraband-upload"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">上传违禁品照片</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" @click="submitWeeklyData">
        提交本周检察数据
      </el-button>
    </div>

    <!-- 谈话记录对话框 -->
    <el-dialog 
      v-model="showTalkDialog" 
      title="添加罪犯谈话记录"
      width="600px"
    >
      <el-form :model="talkForm" label-width="100px">
        <el-form-item label="谈话类型" required>
          <el-radio-group v-model="talkForm.type">
            <el-radio-button 
              v-for="type in talkTypes" 
              :key="type.value" 
              :value="type.value"
            >
              {{ type.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="罪犯姓名" required>
              <el-input v-model="talkForm.prisonerName" placeholder="输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="罪犯编号">
              <el-input v-model="talkForm.prisonerId" placeholder="输入编号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="谈话日期">
          <el-date-picker v-model="talkForm.date" type="date" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="谈话内容" required>
          <el-input 
            v-model="talkForm.content" 
            type="textarea" 
            :rows="4"
            placeholder="记录谈话要点..."
          />
        </el-form-item>
        
        <el-form-item label="谈话笔录">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.doc,.docx"
          >
            <el-button type="primary">上传笔录扫描件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTalkDialog = false">取消</el-button>
        <el-button type="primary" @click="addTalkRecord">确定添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.weekly-check-page {
  max-width: 1000px;
  margin: 0 auto;
}

.weekly-tabs {
  border-radius: 12px;
  overflow: hidden;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
}

.talk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.talk-card {
  border-left: 4px solid #409EFF;
}

.talk-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.talk-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.talk-id {
  color: #909399;
  font-size: 13px;
  flex: 1;
}

.talk-content {
  color: #606266;
  margin: 8px 0;
  line-height: 1.6;
}

.talk-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.contraband-upload {
  margin-top: 12px;
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}

.submit-section .el-button {
  min-width: 200px;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .talk-header {
    flex-wrap: wrap;
  }
}
</style>
