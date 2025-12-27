<template>
  <div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
    <!-- 标题栏：显示模式切换和保存状态 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ isEditMode ? '编辑' : '预览' }}
        </h4>
        <button
          @click="toggleMode"
          class="px-3 py-1.5 text-xs rounded-lg transition-colors duration-200
                 border border-gray-200 dark:border-gray-600
                 hover:bg-gray-100 dark:hover:bg-gray-700
                 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200
                 flex items-center gap-1.5"
          :disabled="disabled"
        >
          <Edit v-if="!isEditMode" class="w-3.5 h-3.5" />
          <Eye v-else class="w-3.5 h-3.5" />
          {{ isEditMode ? '预览' : '编辑' }}
        </button>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span v-if="savingState === 'saving'">保存中...</span>
        <span v-else-if="savingState === 'saved'" class="text-green-500">已保存</span>
        <span v-else-if="savingState === 'error'" class="text-red-500">保存失败</span>
      </div>
    </div>

    <!-- 编辑模式：显示文本编辑器 -->
    <div v-if="isEditMode" class="space-y-4">
      <textarea
        v-model="modelValue"
        rows="12"
        class="w-full px-4 py-3 rounded-lg border transition-colors duration-200
               focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
               disabled:opacity-50 disabled:cursor-not-allowed
               border-gray-200 dark:border-gray-600 
               bg-gray-50/90 dark:bg-gray-900/50
               resize-none font-mono text-sm"
        placeholder="支持 Markdown 格式，输入对比分析内容..."
        :disabled="disabled"
        @blur="handleBlur"
      ></textarea>
      <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
        <span>💡 提示：支持 Markdown 格式，点击"预览"按钮查看渲染效果</span>
      </div>
    </div>

    <!-- 预览模式：显示渲染后的内容（可点击切换到编辑） -->
    <div v-else>
      <div 
        v-if="previewHtml"
        @click="handlePreviewClick"
        class="relative group cursor-pointer"
      >
        <!-- 预览内容 -->
        <div 
          class="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg
                 bg-gray-50/90 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/30
                 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm
                 transition-all duration-200"
          v-html="previewHtml"
        ></div>
        <!-- 点击提示覆盖层 -->
        <div class="absolute inset-0 bg-transparent group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 rounded-lg transition-colors duration-200 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div class="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Edit class="w-3.5 h-3.5" />
            点击编辑
          </div>
        </div>
      </div>
      <div 
        v-else
        @click="toggleMode"
        class="p-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700
               bg-gray-50/50 dark:bg-gray-900/30
               cursor-pointer hover:border-blue-300 dark:hover:border-blue-600
               transition-colors duration-200 text-center group"
      >
        <div class="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
          <Edit class="w-8 h-8 mb-2 opacity-50 group-hover:opacity-75 transition-opacity" />
          <p class="text-sm">点击此处开始编辑对比分析内容</p>
          <p class="text-xs mt-1">支持 Markdown 格式</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Eye } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  modelValue: string
  previewHtml: string
  savingState: 'saving' | 'saved' | 'error' | null
  disabled?: boolean
}>()

const emit = defineEmits<(e: 'update:modelValue', value: string) => void>()

// v-model 透传
const modelValue = defineModel<string>()

// 编辑/预览模式切换
const isEditMode = ref(false)

// 切换模式
const toggleMode = () => {
  if (props.disabled) return
  isEditMode.value = !isEditMode.value
}

// 处理文本域失焦事件
const handleBlur = () => {
  // 保持编辑模式，让用户主动切换
}

// 处理预览区域点击：如果点击的是链接，不切换模式；否则切换
const handlePreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  // 如果点击的是链接或其子元素，不切换模式，让链接正常跳转
  // 检查目标元素及其所有父元素
  let current: HTMLElement | null = target
  while (current) {
    if (current.tagName === 'A') {
      return // 点击的是链接，不切换模式
    }
    current = current.parentElement
  }
  // 点击的不是链接，切换到编辑模式
  toggleMode()
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>

