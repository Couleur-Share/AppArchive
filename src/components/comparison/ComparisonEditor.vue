<template>
  <div class="flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-transparent">
    <!-- 工具栏/标题栏 -->
    <div class="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200/50 dark:border-gray-700/30 bg-white dark:bg-[#171f2e]">
      <div class="flex items-center gap-3">
        <!-- 模式切换 -->
        <div class="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-md">
          <button
            v-for="mode in ['preview', 'edit']"
            :key="mode"
            @click="setMode(mode as 'preview' | 'edit')"
            class="px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1.5"
            :class="[
              (mode === 'edit' ? isEditMode : !isEditMode)
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            ]"
            :disabled="disabled"
          >
            <Eye v-if="mode === 'preview'" class="w-3.5 h-3.5" />
            <Edit2 v-else class="w-3.5 h-3.5" />
            {{ mode === 'preview' ? '预览结果' : '编辑内容' }}
          </button>
        </div>
      </div>

      <!-- 状态指示 -->
      <div class="flex items-center gap-3">
        <div class="text-xs font-medium transition-colors duration-300 flex items-center gap-1.5"
             :class="{
               'text-gray-400': !savingState,
               'text-primary': savingState === 'saving',
               'text-green-500': savingState === 'saved',
               'text-red-500': savingState === 'error'
             }">
          <Loader2 v-if="savingState === 'saving'" class="w-3 h-3 animate-spin" />
          <CheckCircle2 v-else-if="savingState === 'saved'" class="w-3 h-3" />
          <AlertCircle v-else-if="savingState === 'error'" class="w-3 h-3" />
          
          <span v-if="savingState === 'saving'">保存中...</span>
          <span v-else-if="savingState === 'saved'">已自动保存</span>
          <span v-else-if="savingState === 'error'">保存失败</span>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto custom-scrollbar relative">
      <!-- 编辑模式 -->
      <div v-if="isEditMode" class="h-full flex flex-col p-6">
        <textarea
          v-model="modelValue"
          class="flex-1 w-full px-5 py-4 rounded-md border transition-all duration-200
                 focus:ring-2 focus:ring-primary/20 focus:border-primary
                 disabled:opacity-50 disabled:cursor-not-allowed
                 border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-[#171f2e]
                 resize-none font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 shadow-sm"
          placeholder="# 开始编写对比分析...&#10;&#10;支持 Markdown 格式&#10;- 列表&#10;**加粗**"
          :disabled="disabled"
          spellcheck="false"
        ></textarea>
        <div class="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between">
            <span>支持 Markdown 语法</span>
            <span>{{ modelValue?.length || 0 }} 字符</span>
        </div>
      </div>

      <!-- 预览模式 -->
      <div v-else class="h-full p-6 sm:p-8">
        <div 
          v-if="previewHtml"
          class="prose prose-blue dark:prose-invert max-w-none markdown-content
                 bg-white dark:bg-[#171f2e] p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700/50"
          v-html="previewHtml"
          @click="handlePreviewClick"
        ></div>
        
        <!-- 空状态 -->
        <div 
          v-else
          @click="isEditMode = true"
          class="h-full flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700
                 bg-gray-50 dark:bg-[#171f2e]/30
                 cursor-pointer hover:border-primary/30 dark:hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10
                 transition-all duration-200 group"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 group-hover:scale-[1.04] dark:bg-[#171f2e]">
            <Edit3 class="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无分析内容</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs text-center">
            点击此处开始手动编写，或者点击右上角的 "智能分析" 自动生成对比报告。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit2, Edit3, Eye, Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'
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

const setMode = (mode: 'preview' | 'edit') => {
  if (props.disabled) return
  isEditMode.value = mode === 'edit'
}

// 处理预览区域点击：如果点击的是链接，不切换模式；否则切换
const handlePreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  let current: HTMLElement | null = target
  while (current) {
    if (current.tagName === 'A') {
      return // 点击的是链接，不切换模式
    }
    // 也不响应表格内的点击，方便复制
    if (current.tagName === 'TABLE') {
        return 
    }
    current = current.parentElement
  }
  // 点击其他区域，切换到编辑模式
  // 暂时禁用点击即编辑，防止误触，改为必须点击按钮切换
  // isEditMode.value = true
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* 优化 Markdown 样式，与 SoftwareDetail.vue 保持一致 */
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3) { @apply font-bold text-gray-900 dark:text-white my-3; }
.markdown-content :deep(p) { @apply my-2 leading-relaxed text-gray-700 dark:text-gray-300; }
.markdown-content :deep(ul) { @apply list-disc pl-5 my-2 text-gray-700 dark:text-gray-300; }
.markdown-content :deep(li) { @apply my-1; }
.markdown-content :deep(a) { @apply text-primary hover:opacity-80; }
.markdown-content :deep(table) { @apply w-full my-4 border-collapse text-sm; }
.markdown-content :deep(th) { @apply bg-gray-50 dark:bg-gray-800 font-semibold text-left px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white; }
.markdown-content :deep(td) { @apply px-4 py-3 border-b border-gray-200 dark:border-gray-700 align-top text-gray-700 dark:text-gray-300; }
.markdown-content :deep(blockquote) { @apply border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 text-gray-500 dark:text-gray-400 italic; }
</style>
