<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  // 是否显示弹窗
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'capture'])

// 视频元素引用
const videoRef = ref(null)
const canvasRef = ref(null)

// 状态
const stream = ref(null)
const isReady = ref(false)
const capturedImage = ref(null)
const facingMode = ref('environment') // 默认使用后置摄像头

// 初始化摄像头
async function initCamera() {
  try {
    // 停止之前的流
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
    }
    
    // 请求摄像头权限
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      videoRef.value.onloadedmetadata = () => {
        isReady.value = true
      }
    }
  } catch (error) {
    console.error('无法访问摄像头:', error)
    ElMessage.error('无法访问摄像头，请检查权限设置')
  }
}

// 切换摄像头
async function switchCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  await initCamera()
}

// 拍照
function takePhoto() {
  if (!videoRef.value || !canvasRef.value) return
  
  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  // 设置画布尺寸与视频一致
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // 绘制视频帧到画布
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  // 获取图片数据
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)
}

// 重新拍照
function retake() {
  capturedImage.value = null
}

// 确认使用照片
function confirmPhoto() {
  if (!capturedImage.value) return
  
  // 将 base64 转换为 File 对象
  const blob = dataURLtoBlob(capturedImage.value)
  const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
  
  emit('capture', file)
  closeDialog()
}

// base64 转 Blob
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

// 关闭弹窗
function closeDialog() {
  // 停止摄像头
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
  isReady.value = false
  capturedImage.value = null
  emit('update:visible', false)
}

// 监听弹窗打开
onMounted(() => {
  if (props.visible) {
    initCamera()
  }
})

// 清理资源
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="拍照上传"
    width="600px"
    @close="closeDialog"
    @open="initCamera"
    :close-on-click-modal="false"
  >
    <div class="camera-container">
      <!-- 预览区域 -->
      <div class="preview-area">
        <!-- 实时视频 -->
        <video 
          v-show="!capturedImage"
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="camera-video"
        />
        
        <!-- 拍摄的照片 -->
        <img 
          v-if="capturedImage"
          :src="capturedImage"
          class="captured-image"
        />
        
        <!-- 隐藏的画布用于截图 -->
        <canvas ref="canvasRef" style="display: none;" />
        
        <!-- 加载提示 -->
        <div v-if="!isReady && !capturedImage" class="loading-overlay">
          <el-icon class="is-loading" :size="32"><i-ep-loading /></el-icon>
          <span>正在启动摄像头...</span>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="controls">
        <template v-if="!capturedImage">
          <el-button 
            circle 
            size="large"
            @click="switchCamera"
            :disabled="!isReady"
          >
            <el-icon><i-ep-refresh-right /></el-icon>
          </el-button>
          
          <el-button 
            type="primary" 
            circle 
            size="large"
            class="capture-btn"
            @click="takePhoto"
            :disabled="!isReady"
          >
            <el-icon :size="28"><i-ep-camera /></el-icon>
          </el-button>
          
          <el-button 
            circle 
            size="large"
            @click="closeDialog"
          >
            <el-icon><i-ep-close /></el-icon>
          </el-button>
        </template>
        
        <template v-else>
          <el-button size="large" @click="retake">
            重新拍摄
          </el-button>
          <el-button type="primary" size="large" @click="confirmPhoto">
            使用照片
          </el-button>
        </template>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.preview-area {
  position: relative;
  width: 100%;
  max-width: 540px;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.camera-video,
.captured-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.capture-btn {
  width: 64px !important;
  height: 64px !important;
}

/* 平板适配 */
@media (max-width: 768px) {
  .preview-area {
    max-width: 100%;
  }
}
</style>
