<template>
  <!-- AI 对比分析全屏动画 -->
  <ComparisonAIOverlay :active="isAnalyzing" />

  <TransitionRoot appear :show="isOpen" as="div">
    <!-- 加载状态指示器 -->
    <div v-if="isLoading" 
         class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-10 w-10 border-3 
                    border-blue-500 border-t-transparent"></div>
        <span class="text-sm text-white">{{ loadingText }}</span>
      </div>
    </div>

    <Dialog as="div" class="relative z-[60]" @close="$emit('update:isOpen', false)">
      <div class="fixed inset-0">
        <TransitionChild
          as="div"
          enter="ease-out duration-100"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-100"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50" />
        </TransitionChild>
      </div>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="div"
            enter="ease-out duration-100"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-100"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel 
              class="relative transform overflow-hidden rounded-lg 
                     bg-white/90 dark:bg-gray-800/90 backdrop-blur 
                     text-left shadow-level3 transition-all duration-100
                     w-full sm:w-[1000px] max-h-[85vh] flex flex-col"
            >
              <!-- 标题栏 -->
              <div class="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-600/30">
                <DialogTitle as="h3" class="text-xl font-bold text-gray-900 dark:text-white">
                  管理软件对比
                </DialogTitle>
                <div class="flex items-center gap-2">
                  <button
                    @click="startAIAnalysis"
                    class="px-4 py-2 rounded-lg transition-colors duration-100 flex items-center gap-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    :disabled="isAnalyzing"
                  >
                    <Bot class="w-4 h-4" />
                    {{ isAnalyzing ? 'AI 分析中...' : 'AI 分析' }}
                  </button>
                  <button
                    @click="$emit('update:isOpen', false)"
                    class="p-2 rounded-lg transition-all duration-200 
                           text-gray-600 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 
                           hover:text-gray-900 dark:hover:text-white
                           focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                    title="关闭"
                    aria-label="关闭"
                  >
                    <X class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- 内容区域 - 卡片式布局 -->
              <div class="flex-1 flex overflow-hidden flex-col">
                <!-- 主内容区域 -->
                <div class="flex-1 flex overflow-hidden">
                  <!-- 左侧主内容 -->
                  <div class="flex-1 flex flex-col overflow-hidden">
                    <!-- 已选择的软件 - 徽章形式 -->
                    <div class="p-6 border-b border-gray-200/50 dark:border-gray-600/30">
                      <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">已选择的软件</h4>
                          <span v-if="selectedComparisons.length > 0" 
                                class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {{ selectedComparisons.length }}
                          </span>
                        </div>
                        <button
                          v-if="selectedComparisons.length > 0"
                          @click="clearAllComparisons"
                          class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          清空全部
                        </button>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <div
                          v-for="comp in selectedComparisons"
                          :key="comp.id"
                          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                        >
                          <img 
                            :src="getIconUrl(comp.target.icon)" 
                            :alt="comp.target.name" 
                            class="w-5 h-5 rounded"
                            loading="lazy"
                            decoding="async"
                            referrerpolicy="no-referrer"
                          />
                          <span class="text-sm font-medium text-gray-900 dark:text-white">{{ comp.target.name }}</span>
                          <button
                            @click="removeComparison(comp.id)"
                            class="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <X class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                        <div v-if="selectedComparisons.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
                          暂无选择的软件
                        </div>
                      </div>
                    </div>

                    <!-- 对比结果区域 -->
                    <div class="flex-1 flex flex-col overflow-hidden">
                      <!-- 对比结果编辑和预览 -->
                      <div class="flex-1 overflow-y-auto custom-scrollbar">
                        <ComparisonEditor
                          v-model="summary"
                          :preview-html="formattedSummary"
                          :saving-state="savingState"
                          :disabled="isSaving"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 底部：添加更多软件（可折叠） -->
                <div class="border-t border-gray-200/50 dark:border-gray-600/30">
                  <button
                    @click="showAddMore = !showAddMore"
                    class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Plus class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div class="text-left">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">添加更多软件</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {{ comparableSoftware.length }} 个可选软件
                        </div>
                      </div>
                    </div>
                    <ChevronUp v-if="showAddMore" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <ChevronDown v-else class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <div v-if="showAddMore" class="border-t border-gray-200/50 dark:border-gray-600/30 p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <ComparableSoftwareList
                      :items="sortedComparableSoftware"
                      :is-selected="isSelected"
                      :disabled="isLoading"
                      :row-height="rowHeight"
                      @toggle="toggleComparison"
                    >
                      <template #addIcon>
                        <Plus class="w-4 h-4" />
                      </template>
                      <template #checkedIcon>
                        <Check class="w-4 h-4" />
                      </template>
                    </ComparableSoftwareList>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import DOMPurify from 'dompurify'
import { Bot, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Plus, Trash2, X } from 'lucide-vue-next'
import { marked } from 'marked'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useComparisonManager } from '../composables/useComparisonManager'
import { useToast } from '../composables/useToast'
import { getIconUrl } from '../services/localIconCache'
import type { Software } from '../types'
import type { ComparisonGroup, ComparisonTarget } from '../types/comparison'
import logger from '../utils/logger'
import ComparisonAIOverlay from './ComparisonAIOverlay.vue'
import ComparableSoftwareList from './comparison/ComparableSoftwareList.vue'
import ComparisonEditor from './comparison/ComparisonEditor.vue'

// 统一 Markdown 渲染：开启常用选项，并通过 DOMPurify hook 为链接加 target/rel
marked.setOptions({ gfm: true, breaks: true })

let dompurifyLinkHookInstalled = false
if (!dompurifyLinkHookInstalled && typeof DOMPurify?.addHook === 'function') {
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
  dompurifyLinkHookInstalled = true
}

const mdToSafeHtml = (md: string): string => {
  const rawHtml = marked(md) as string
  return DOMPurify.sanitize(rawHtml, {
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false
  })
}

// Comparison 类型改为从 types 引入，移除本地定义

const props = defineProps<{
  isOpen: boolean
  software: Software
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'error': [message: string]
}>()

const {
  comparableSoftware,
  selectedComparisons,
  isLoading,
  loadingText,
  summary,
  savingState,
  isSaving,
  isHydratingSummary,
  isAnalyzing,
  loadComparableSoftware,
  loadExistingComparisons,
  loadAnalysisContent,
  toggleComparison,
  removeComparison,
  startAIAnalysis,
  initLoad,
  isSelected,
  flushDebouncedSave
} = useComparisonManager(computed(() => props.software))

const selectedIds = computed(() =>
  new Set(selectedComparisons.value.map((c) => c.target_id))
)

const sortedComparableSoftware = computed(() => {
  if (!comparableSoftware.value) return []
  const ids = selectedIds.value
  return [...comparableSoftware.value].sort((a, b) => {
    const aSelected = ids.has(a.id)
    const bSelected = ids.has(b.id)
    if (aSelected === bSelected) return 0
    return aSelected ? -1 : 1
  })
})

// 清空所有对比
const clearAllComparisons = async () => {
  if (selectedComparisons.value.length === 0) return
  const ids = [...selectedComparisons.value.map(c => c.id)]
  for (const id of ids) {
    await removeComparison(id)
  }
}

// 虚拟列表参数
const rowHeight = 72

// 底部添加软件区域折叠状态
const showAddMore = ref(false)

// 综合分析相关状态由 useComparisonManager 管理

// 添加 toast 相关
const { showToast } = useToast()

// 保存逻辑已抽离

// 逻辑已抽离：loadComparableSoftware 由 useComparisonManager 提供

// 逻辑已抽离：toggleComparison 由 useComparisonManager 提供

// 逻辑已抽离：removeComparison 由 useComparisonManager 提供

// 逻辑已抽离：isSelected 由 useComparisonManager 提供

// 内容加载逻辑已抽离

// 逻辑已抽离：映射与加载由 useComparisonManager 提供

// 修改 onMounted 钩子
onMounted(async () => {
  if (props.isOpen && props.software?.id) {
    try {
      await initLoad()
    } catch (error) {
      logger.error('初始化加载失败:', error)
      showToast('加载数据失败，请重试', 'error')
    }
  }
})

// 修改 watch
watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.software?.id) {
    try {
      await initLoad()
    } catch (error) {
      logger.error('监听加载失败:', error)
      showToast('加载数据失败，请重试', 'error')
    }
  } else {
    // 关闭对话框时，确保防抖保存被冲刷，避免丢失最后一次编辑
    flushDebouncedSave()
  }
})

onBeforeUnmount(() => {
  // 组件卸载前冲刷一次防抖保存
  flushDebouncedSave()
})

// AI 分析逻辑已抽离：isAnalyzing 与 startAIAnalysis 由 useComparisonManager 提供

// 移除未使用的 sanitizeContent，统一用 mdToSafeHtml 进行转换

// 本组件不再需要本地类型守卫

// 修改 formattedSummary 计算属性
const formattedSummary = computed(() => {
  if (!summary.value) return ''
  return mdToSafeHtml(summary.value)
})

</script>

<style scoped>
.border-3 {
  border-width: 3px;
}

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

:deep(.prose) {
  @apply text-gray-700 dark:text-gray-300;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  @apply text-gray-900 dark:text-white;
}

:deep(.prose a) {
  @apply text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300;
}

:deep(.prose code) {
  @apply bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm;
}

:deep(.prose pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg;
}

:deep(.prose blockquote) {
  @apply border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic;
}

:deep(.prose ul),
:deep(.prose ol) {
  @apply my-2;
}

:deep(.prose li) {
  @apply my-1;
}

:deep(.prose table) {
  @apply border-collapse border border-gray-200 dark:border-gray-700;
}

:deep(.prose th),
:deep(.prose td) {
  @apply border border-gray-200 dark:border-gray-700 px-4 py-2;
}

:deep(.prose thead) {
  @apply bg-gray-100 dark:bg-gray-800;
}
</style> 