<template>
  <div class="comparison-editor-shell flex h-full flex-1 flex-col">
    <!-- 工具栏/标题栏 -->
    <div class="comparison-editor-toolbar flex-shrink-0 border-b border-gray-200/70 px-4 py-4 dark:border-white/10 sm:px-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-h-9 flex-wrap items-center gap-3">
          <!-- 模式切换 -->
          <div class="comparison-editor-segmented flex items-center rounded-xl border p-1">
            <button
              v-for="mode in ['preview', 'edit']"
              :key="mode"
              @click="setMode(mode as 'preview' | 'edit')"
              class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200"
              :class="[
                (mode === 'edit' ? isEditMode : !isEditMode)
                  ? 'comparison-editor-segmented-active text-gray-900 shadow-sm dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              ]"
              :disabled="disabled"
            >
              <Eye v-if="mode === 'preview'" class="w-3.5 h-3.5" />
              <Edit2 v-else class="w-3.5 h-3.5" />
              {{ mode === 'preview' ? '预览结果' : '编辑内容' }}
            </button>
          </div>

          <TagBadge
            size="xs"
            class="self-center"
            :variant="selectedCount > 0 ? 'primary' : 'neutral'"
            :label="selectedCount > 0 ? `${selectedCount} 个对比对象` : '尚未选择对比对象'"
          />
        </div>

        <!-- 状态指示 -->
        <div
          class="flex min-h-9 items-center gap-3 self-start text-xs font-medium transition-colors duration-300 lg:self-auto"
          aria-live="polite"
        >
          <div
            class="flex items-center gap-1.5"
            :class="{
              'text-gray-400 dark:text-gray-500': !savingState,
              'text-primary': savingState === 'saving',
              'text-green-600 dark:text-green-400': savingState === 'saved',
              'text-red-500 dark:text-red-400': savingState === 'error'
            }"
          >
          <Loader2 v-if="savingState === 'saving'" class="w-3 h-3 animate-spin" />
          <CheckCircle2 v-else-if="savingState === 'saved'" class="w-3 h-3" />
          <AlertCircle v-else-if="savingState === 'error'" class="w-3 h-3" />
          
            <span v-if="savingState === 'saving'">保存中...</span>
            <span v-else-if="savingState === 'saved'">已自动保存</span>
            <span v-else-if="savingState === 'error'">保存失败</span>
            <span v-else>{{ selectedCount > 0 ? '自动保存已待命' : '等待内容输入' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto custom-scrollbar relative">
      <!-- 编辑模式 -->
      <div v-if="isEditMode" class="flex h-full flex-col p-4 sm:p-6">
        <textarea
          v-model="modelValue"
          class="comparison-editor-input flex-1 w-full resize-none rounded-xl border px-5 py-4 text-sm leading-7 text-gray-800 shadow-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200"
          placeholder="# 开始编写对比分析...&#10;&#10;支持 Markdown 格式&#10;- 列表&#10;**加粗**"
          :disabled="disabled"
          spellcheck="false"
        ></textarea>
        <div class="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>支持 Markdown 语法，建议直接整理选型结论与适用场景。</span>
            <span>{{ modelValue?.length || 0 }} 字符</span>
        </div>
      </div>

      <!-- 预览模式 -->
      <div v-else class="h-full p-4 sm:p-6">
        <div 
          v-if="previewHtml"
          class="comparison-editor-preview mx-auto max-w-[78ch] rounded-2xl border p-5 sm:p-8"
          v-html="previewHtml"
          @click="handlePreviewClick"
        ></div>
        
        <!-- 空状态 -->
        <div 
          v-else
          class="comparison-editor-empty group flex h-full flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center"
        >
          <div class="comparison-editor-empty-icon mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-[1.03]">
            <Edit3 class="w-8 h-8 text-gray-400 transition-colors group-hover:text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {{ selectedCount > 0 ? '对比结果还没有生成' : '先建立比较组' }}
          </h3>
          <p class="max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            {{ selectedCount > 0
              ? `已经为 ${baseSoftwareName} 选入 ${selectedCount} 款对比对象。你可以直接启动智能分析，或切到编辑模式手动整理总结。`
              : `先在左侧挑选与 ${baseSoftwareName} 进行比较的软件，右侧才会沉淀成可编辑、可导出的分析结论。` }}
          </p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <BaseButton
              v-if="selectedCount > 0"
              variant="primary"
              size="sm"
              :disabled="disabled || isAnalyzing"
              @click="$emit('request-analysis')"
            >
              <Loader2 v-if="isAnalyzing" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              {{ isAnalyzing ? '正在分析...' : '生成智能总结' }}
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="sm"
              :disabled="disabled"
              @click="isEditMode = true"
            >
              <Edit2 class="w-4 h-4" />
              手动编辑
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, CheckCircle2, Edit2, Edit3, Eye, Loader2, Sparkles } from 'lucide-vue-next'
import { ref } from 'vue'
import BaseButton from '../common/BaseButton.vue'
import TagBadge from '../common/TagBadge.vue'

const props = defineProps<{
  modelValue: string
  previewHtml: string
  savingState: 'saving' | 'saved' | 'error' | null
  selectedCount: number
  baseSoftwareName: string
  isAnalyzing?: boolean
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'request-analysis': []
}>()

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
  scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.28);
  border-radius: 999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.4);
}

.comparison-editor-shell,
.comparison-editor-toolbar {
  background: var(--modal-card-bg-light);
}

.dark .comparison-editor-shell,
.dark .comparison-editor-toolbar {
  background: var(--modal-card-bg-dark);
}

.comparison-editor-segmented,
.comparison-editor-input,
.comparison-editor-preview,
.comparison-editor-empty,
.comparison-editor-empty-icon {
  border-color: var(--modal-card-border-light);
  box-shadow: var(--modal-card-shadow-light);
}

.dark .comparison-editor-segmented,
.dark .comparison-editor-input,
.dark .comparison-editor-preview,
.dark .comparison-editor-empty,
.dark .comparison-editor-empty-icon {
  border-color: var(--modal-card-border-dark);
  box-shadow: var(--modal-card-shadow-dark);
}

.comparison-editor-segmented,
.comparison-editor-empty,
.comparison-editor-empty-icon {
  background: var(--modal-card-subtle-bg-light);
}

.dark .comparison-editor-segmented,
.dark .comparison-editor-empty,
.dark .comparison-editor-empty-icon {
  background: var(--modal-card-subtle-bg-dark);
}

.comparison-editor-segmented-active,
.comparison-editor-input,
.comparison-editor-preview {
  background: var(--modal-card-bg-light);
}

.dark .comparison-editor-segmented-active,
.dark .comparison-editor-input,
.dark .comparison-editor-preview {
  background: var(--modal-card-bg-dark);
}

.comparison-editor-input {
  border-color: var(--modal-card-border-light);
}

.dark .comparison-editor-input {
  border-color: var(--modal-card-border-dark);
}

.comparison-editor-empty:hover {
  border-color: var(--modal-card-border-emphasis-light);
}

.dark .comparison-editor-empty:hover {
  border-color: var(--modal-card-border-emphasis-dark);
}

/* 优化 Markdown 样式，与 SoftwareDetail.vue 保持一致 */
.comparison-editor-preview :deep(h1),
.comparison-editor-preview :deep(h2),
.comparison-editor-preview :deep(h3) {
  @apply my-3 font-bold text-gray-900 dark:text-white;
}

.comparison-editor-preview :deep(p) {
  @apply my-2 leading-7 text-gray-700 dark:text-gray-300;
}

.comparison-editor-preview :deep(ul) {
  @apply my-2 list-disc pl-5 text-gray-700 dark:text-gray-300;
}

.comparison-editor-preview :deep(li) {
  @apply my-1;
}

.comparison-editor-preview :deep(a) {
  @apply text-primary hover:opacity-80;
}

.comparison-editor-preview :deep(table) {
  @apply my-4 w-full border-collapse overflow-hidden rounded-xl text-sm;
}

.comparison-editor-preview :deep(th) {
  @apply border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-900 dark:border-gray-700 dark:text-white;
  background: color-mix(in srgb, var(--modal-card-subtle-bg-light) 84%, white);
}

.dark .comparison-editor-preview :deep(th) {
  background: color-mix(in srgb, var(--modal-card-subtle-bg-dark) 92%, #181818);
}

.comparison-editor-preview :deep(td) {
  @apply border-b border-gray-200 px-4 py-3 align-top text-gray-700 dark:border-gray-700 dark:text-gray-300;
}

.comparison-editor-preview :deep(blockquote) {
  @apply my-4 rounded-xl border px-4 py-3 text-gray-600 italic dark:text-gray-300;
  background: color-mix(in srgb, var(--modal-card-subtle-bg-light) 80%, white);
  border-color: var(--modal-card-border-light);
}

.dark .comparison-editor-preview :deep(blockquote) {
  background: color-mix(in srgb, var(--modal-card-subtle-bg-dark) 92%, #181818);
  border-color: var(--modal-card-border-dark);
}

@media (prefers-reduced-motion: reduce) {
  .comparison-editor-empty-icon {
    transform: none !important;
  }
}
</style>
