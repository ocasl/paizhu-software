<script setup>
import { ref, reactive } from 'vue'
import { useOfflineStore } from '../stores/offline'
import { ElMessage } from 'element-plus'

const offlineStore = useOfflineStore()

// 活动标签页
const activeTab = ref('visit')

// 会见检察表单
const visitForm = reactive({
  date: new Date(),
  checked: false,
  visitCount: 0,
  illegalCount: 0,
  issues: ''
})

// 犯情分析会表单
const meetingForm = reactive({
  participated: false,
  meetingDate: null,
  meetingType: '',
  notes: ''
})

// 罪犯处分监督
const punishmentForm = reactive({
  recordCount: 0,
  confinementCount: 0,
  records: []
})

// 勤杂岗位统计
const positionForm = reactive({
  miscellaneousIncrease: 0,
  miscellaneousDecrease: 0,
  productionIncrease: 0,
  productionDecrease: 0
})

// 会议类型选项
const meetingTypes = [
  { value: 'lifeSentence', label: '无期死缓评审会' },
  { value: 'parole', label: '减刑假释评审会' },
  { value: 'analysis', label: '犯情分析会' },
  { value: 'other', label: '其他会议' }
]

// 提交月检察数据
async function submitMonthlyData() {
  try {
    const monthlyData = {
      visit: visitForm,
      meeting: meetingForm,
      punishment: punishmentForm,
      position: positionForm
    }
    
    if (offlineStore.isOnline) {
      ElMessage.success('月检察数据提交成功')
    } else {
      await offlineStore.saveFormOffline('monthly-check', monthlyData)
      ElMessage.success('数据已保存到本地，联网后自动同步')
    }
  } catch (error) {
    ElMessage.error('提交失败: ' + error.message)
  }
}
</script>

<template>
  <div class="monthly-check-page">
    <el-tabs v-model="activeTab" type="border-card" class="monthly-tabs">
      <!-- 会见检察 -->
      <el-tab-pane label="会见检察" name="visit">
        <el-card shadow="never">
          <template #header>
            <span>监狱会见场所检察</span>
          </template>
          
          <el-form :model="visitForm" label-width="120px" label-position="top">
            <el-form-item label="检察日期">
              <el-date-picker v-model="visitForm.date" type="date" style="width: 100%" />
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="visitForm.checked" border size="large">
                已检察会见场所
              </el-checkbox>
            </el-form-item>
            
            <el-row :gutter="16" v-if="visitForm.checked">
              <el-col :span="12">
                <el-form-item label="会见检察次数">
                  <el-input-number v-model="visitForm.visitCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发现违法问题数">
                  <el-input-number v-model="visitForm.illegalCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="问题描述" v-if="visitForm.checked && visitForm.illegalCount > 0">
              <el-input 
                v-model="visitForm.issues" 
                type="textarea" 
                :rows="3"
                placeholder="详细描述发现的问题..."
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 犯情分析会 -->
      <el-tab-pane label="会议参加" name="meeting">
        <el-card shadow="never">
          <template #header>
            <span>参加监狱会议/活动</span>
          </template>
          
          <el-form :model="meetingForm" label-width="120px" label-position="top">
            <el-form-item>
              <el-checkbox v-model="meetingForm.participated" border size="large">
                本月参加了会议/活动
              </el-checkbox>
            </el-form-item>
            
            <template v-if="meetingForm.participated">
              <el-form-item label="会议类型">
                <el-select v-model="meetingForm.meetingType" style="width: 100%">
                  <el-option 
                    v-for="type in meetingTypes" 
                    :key="type.value" 
                    :label="type.label" 
                    :value="type.value" 
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="会议日期">
                <el-date-picker v-model="meetingForm.meetingDate" type="date" style="width: 100%" />
              </el-form-item>
              
              <el-form-item label="会议记录">
                <el-input 
                  v-model="meetingForm.notes" 
                  type="textarea" 
                  :rows="4"
                  placeholder="记录会议要点..."
                />
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 罪犯处分 -->
      <el-tab-pane label="处分监督" name="punishment">
        <el-card shadow="never">
          <template #header>
            <span>罪犯记过以上处分监督</span>
          </template>
          
          <el-form :model="punishmentForm" label-width="140px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="记过处分人数">
                  <el-input-number v-model="punishmentForm.recordCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="禁闭处分人数">
                  <el-input-number v-model="punishmentForm.confinementCount" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="处分原因">
              <el-input 
                type="textarea" 
                :rows="3"
                placeholder="记录主要处分原因..."
              />
            </el-form-item>
            
            <el-form-item label="证据材料">
              <el-upload
                action="#"
                :auto-upload="false"
                :limit="10"
                accept=".pdf,.doc,.docx,.jpg,.png"
              >
                <el-button type="primary">上传证据/笔录</el-button>
                <template #tip>
                  <div class="el-upload__tip">支持 PDF、Word、图片格式</div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 岗位统计 -->
      <el-tab-pane label="岗位统计" name="position">
        <el-card shadow="never">
          <template #header>
            <span>狱内勤杂/辅助生产岗位罪犯增减情况</span>
          </template>
          
          <el-form :model="positionForm" label-width="140px">
            <el-divider content-position="left">勤杂岗位</el-divider>
            
            <el-row :gutter="16}>
              <el-col :span="12">
                <el-form-item label="新增人数">
                  <el-input-number v-model="positionForm.miscellaneousIncrease" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="减少人数">
                  <el-input-number v-model="positionForm.miscellaneousDecrease" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-divider content-position="left">辅助生产岗位</el-divider>
            
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="新增人数">
                  <el-input-number v-model="positionForm.productionIncrease" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="减少人数">
                  <el-input-number v-model="positionForm.productionDecrease" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button type="primary" size="large" @click="submitMonthlyData">
        提交本月检察数据
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.monthly-check-page {
  max-width: 1000px;
  margin: 0 auto;
}

.monthly-tabs {
  border-radius: 12px;
  overflow: hidden;
}

.submit-section {
  margin-top: 24px;
  text-align: center;
}

.submit-section .el-button {
  min-width: 200px;
}
</style>
