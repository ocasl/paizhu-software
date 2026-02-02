<script setup>
/**
 * 电子签名组件
 * 使用 Canvas 实现手写签名
 */
import { ref, onMounted, onUnmounted } from 'vue'
import SignaturePad from 'signature_pad'

const props = defineProps({
  // 签名画布宽度
  width: {
    type: Number,
    default: 400
  },
  // 签名画布高度
  height: {
    type: Number,
    default: 200
  },
  // 画笔颜色
  penColor: {
    type: String,
    default: '#000000'
  }
})

const emit = defineEmits(['save', 'clear'])

const canvasRef = ref(null)
let signaturePad = null

// 初始化签名板
onMounted(() => {
  if (canvasRef.value) {
    signaturePad = new SignaturePad(canvasRef.value, {
      penColor: props.penColor,
      backgroundColor: 'rgb(255, 255, 255)'
    })
    
    // 设置画布尺寸
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

// 调整画布尺寸
function resizeCanvas() {
  if (!canvasRef.value || !signaturePad) return
  
  const ratio = Math.max(window.devicePixelRatio || 1, 1)
  canvasRef.value.width = props.width * ratio
  canvasRef.value.height = props.height * ratio
  canvasRef.value.getContext('2d').scale(ratio, ratio)
  signaturePad.clear()
}

// 清除签名
function clear() {
  if (signaturePad) {
    signaturePad.clear()
    emit('clear')
  }
}

// 判断是否为空
function isEmpty() {
  return signaturePad ? signaturePad.isEmpty() : true
}

// 获取签名图片（base64）
function getSignatureData() {
  if (!signaturePad || signaturePad.isEmpty()) {
    return null
  }
  return signaturePad.toDataURL('image/png')
}

// 保存签名
function save() {
  const data = getSignatureData()
  if (data) {
    emit('save', data)
  }
}

// 暴露方法供父组件调用
defineExpose({
  clear,
  isEmpty,
  getSignatureData,
  save
})
</script>

<template>
  <div class="signature-pad-wrapper">
    <div class="canvas-container">
      <canvas 
        ref="canvasRef"
        :style="{ width: width + 'px', height: height + 'px' }"
        class="signature-canvas"
      />
    </div>
    
    <div class="signature-actions">
      <el-button @click="clear">
        <el-icon><i-ep-delete /></el-icon>
        清除
      </el-button>
      <el-button type="primary" @click="save">
        <el-icon><i-ep-check /></el-icon>
        确认签名
      </el-button>
    </div>
    
    <p class="signature-hint">请在上方区域手写签名</p>
  </div>
</template>

<style scoped>
.signature-pad-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.canvas-container {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: crosshair;
}

.signature-canvas {
  display: block;
  border-radius: 6px;
}

.signature-actions {
  display: flex;
  gap: 12px;
}

.signature-hint {
  color: #909399;
  font-size: 13px;
  margin: 0;
}
</style>
