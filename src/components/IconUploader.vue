<template>
  <div class="flex gap-4">
    <!-- 左侧预览区域 -->
    <div class="relative group">
      <div
        class="w-20 h-20 rounded-lg border-2 border-dashed 
                   border-gray-200 dark:border-gray-600
                   flex items-center justify-center
                   bg-gray-50 dark:bg-gray-800/50 overflow-hidden
                   transition-colors duration-100
                   group-hover:border-blue-500/50 dark:group-hover:border-blue-400/50
                   cursor-default"
        @dragover.prevent
        @drop="onDrop"
        title="拖拽图片到此上传"
      >
        <!-- 加载状态 -->
        <div v-if="isLoading" class="absolute inset-0 bg-gray-50/90 dark:bg-gray-800/90 flex items-center justify-center backdrop-blur-sm">
          <Loader2 class="w-4 h-4 animate-spin text-blue-500" />
        </div>

        <!-- 图标预览 -->
        <img v-if="previewUrl && !errorMessage"
             :src="previewUrl"
             @load="onLoad"
             @error="onError"
             class="w-14 h-14 object-contain"
             alt="图标预览" />

        <!-- 默认状态 -->
        <div v-else class="text-center">
          <ImageIcon class="w-5 h-5 mx-auto mb-1 text-gray-400" />
        </div>
      </div>

      <button
        v-if="hasIcon && !disabled"
        type="button"
        class="absolute -top-2 -right-2 p-1 rounded-full bg-gray-900/80 text-white shadow-level2 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600"
        @click="clearIcon"
        title="移除图标"
        aria-label="移除图标"
      >
        <X class="w-3.5 h-3.5" />
      </button>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap px-3 py-1.5 rounded-lg text-xs bg-red-500 text-white shadow-level2 flex items-center gap-1.5">
        <AlertCircle class="w-3.5 h-3.5" />
        {{ errorMessage }}
      </div>
    </div>

    <!-- 右侧上传按钮 -->
    <div class="flex-1 space-y-1.5">
      <div class="relative">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/png, image/jpeg, image/webp, image/svg+xml, image/x-icon"
          class="hidden"
          @change="onFileChange"
        />
        <button
          type="button"
          @click="trigger"
          :disabled="disabled"
          class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-100 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-100 disabled:opacity-50"
        >
          <Upload class="w-4 h-4" />
          <span>{{ previewFile || modelValue ? '重新选择图标' : '选择图标' }}</span>
        </button>
      </div>

      <!-- 提示文字 -->
      <div class="flex items-center gap-1.5 px-1">
        <Info class="w-3.5 h-3.5 text-gray-400" />
        <span class="text-xs text-gray-500 dark:text-gray-400">选择后将预览，提交时上传到COS，格式：PNG/JPEG/WebP/SVG/ICO</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, ImageIcon, Info, Loader2, Upload, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | File | null]
}>()

const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const hasIcon = computed(() => Boolean(previewFile.value || previewUrl.value))

// 清理预览URL（释放内存）
const cleanupPreview = () => {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

const trigger = () => {
  if (props.disabled) return
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  handleFileSelect(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  if (props.disabled) return
  const file = e.dataTransfer?.files?.[0]
  if (file?.type.startsWith('image/')) {
    handleFileSelect(file)
  }
}

const handleFileSelect = (file: File) => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    // 验证文件类型
    const okType = /^(image\/(png|jpeg|webp|svg\+xml|x-icon))$/i.test(file.type)
    if (!okType) {
      throw new Error('仅支持 PNG/JPEG/WebP/SVG/ICO 格式')
    }
    
    // 验证文件大小
    const maxSize = 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('图片过大，请控制在 1MB 以内')
    }
    
    // 清理之前的预览
    cleanupPreview()
    
    // 存储File对象
    previewFile.value = file
    
    // 创建本地预览URL
    previewUrl.value = URL.createObjectURL(file)
    
    // 发出File对象，让父组件知道有文件待上传
    emit('update:modelValue', file)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '文件选择失败'
    previewFile.value = null
    previewUrl.value = null
  } finally {
    isLoading.value = false
  }
}

const onLoad = () => {
  isLoading.value = false
  errorMessage.value = ''
}

const onError = () => {
  isLoading.value = false
  errorMessage.value = '无法加载图片'
}

const clearIcon = () => {
  if (props.disabled) return
  errorMessage.value = ''
  cleanupPreview()
  previewFile.value = null
  previewUrl.value = null
  emit('update:modelValue', '')
}

// 监听modelValue变化，如果是已有的COS URL，显示预览
watch(() => props.modelValue, (newValue) => {
  // 如果是字符串URL（COS URL），直接使用
  if (typeof newValue === 'string' && newValue.startsWith('http')) {
    cleanupPreview()
    previewFile.value = null
    previewUrl.value = newValue
  } else if (!newValue) {
    // 清空预览
    cleanupPreview()
    previewFile.value = null
    previewUrl.value = null
  }
}, { immediate: true })

// 组件卸载时清理预览URL
onUnmounted(() => {
  cleanupPreview()
})

// 粘贴选择（在组件挂载期间生效）
let pasteHandler: ((e: ClipboardEvent) => void) | null = null
onMounted(() => {
  pasteHandler = (e: ClipboardEvent) => {
    if (props.disabled) return
    const file = e.clipboardData?.files?.[0]
    if (file?.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }
  window.addEventListener('paste', pasteHandler)
})

onUnmounted(() => {
  if (pasteHandler) window.removeEventListener('paste', pasteHandler)
  cleanupPreview()
})
</script>

<style scoped>
</style>


