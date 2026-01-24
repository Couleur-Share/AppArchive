<template>
  <!-- AI 对比分析全屏动画 -->
  <ComparisonAIOverlay :active="isAnalyzing" />

  <TransitionRoot appear :show="isOpen" as="div">
    <Dialog as="div" class="relative z-50" @close="$emit('update:isOpen', false)">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel 
              class="w-full max-w-6xl h-[85vh] transform overflow-hidden rounded-lg bg-white dark:bg-[#171f2e] shadow-2xl transition-all flex flex-col ring-1 ring-gray-900/5"
            >
              <!-- 顶部标题栏 -->
              <div class="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#171f2e] z-10">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                    <LayoutDashboard class="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle as="h3" class="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      管理软件对比
                    </DialogTitle>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      选择软件进行全方位对比分析，支持智能总结
                    </p>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <!-- AI 分析按钮 -->
                  <button
                    @click="startAIAnalysis"
                    class="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm border"
                    :class="[
                        isAnalyzing 
                            ? 'bg-gray-100 text-gray-500 border-transparent cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:shadow-md active:scale-95'
                    ]"
                    :disabled="isAnalyzing"
                  >
                    <Sparkles class="w-4 h-4" :class="{'animate-spin': isAnalyzing}" />
                    {{ isAnalyzing ? '正在分析...' : '智能分析' }}
                  </button>

                  <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

                  <!-- 导出/分享按钮组 -->
                  <Tooltip content="导出为图片">
                    <button
                        @click="exportAsImage"
                        class="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                    >
                        <Download class="w-5 h-5" />
                    </button>
                  </Tooltip>

                  <Tooltip content="关闭 (Esc)">
                    <button
                        @click="$emit('update:isOpen', false)"
                        class="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                    >
                        <X class="w-5 h-5" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <!-- 主体内容区：左右分栏 -->
              <div class="flex-1 flex overflow-hidden">
                <!-- 左侧：软件选择 (30%) -->
                <div class="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#171f2e] z-10">
                    <!-- 搜索框 -->
                    <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                        <div class="relative">
                            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                v-model="searchQuery"
                                type="text" 
                                placeholder="搜索添加软件..." 
                                class="w-full pl-9 pr-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 border-none text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50"
                            >
                        </div>
                    </div>
                    
                    <!-- 软件列表 -->
                    <div class="flex-1 overflow-hidden relative">
                         <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-[#171f2e]/50 z-10 backdrop-blur-[1px]">
                            <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
                         </div>
                         <ComparableSoftwareList
                            :items="filteredSoftware"
                            :is-selected="isSelected"
                            :disabled="isLoading"
                            :row-height="72"
                            @toggle="toggleComparison"
                          />
                    </div>
                    
                    <!-- 底部统计 -->
                    <div class="p-3 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#171f2e]">
                        共 {{ comparableSoftware.length }} 个可选软件
                    </div>
                </div>

                <!-- 右侧：对比结果 (70%) -->
                <div class="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-transparent relative">
                    <!-- 已选软件 Chip 栏 -->
                    <div class="flex-shrink-0 p-4 bg-white dark:bg-[#171f2e] border-b border-gray-200/50 dark:border-gray-700/30 overflow-x-auto no-scrollbar">
                        <div class="flex items-center gap-2">
                            <div 
                               v-for="comp in selectedComparisons" 
                               :key="comp.id"
                               class="flex-shrink-0 flex items-center gap-2 pl-2 pr-1 py-1 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            >
                               <img :src="getIconUrl(comp.target.icon)" class="w-5 h-5 rounded-md bg-white object-cover" />
                               <span class="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[120px] truncate">{{ comp.target.name }}</span>
                               <button 
                                   @click="removeComparison(comp.id)"
                                   class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                               >
                                   <X class="w-3.5 h-3.5" />
                               </button>
                            </div>
                             
                             <div v-if="selectedComparisons.length === 0" class="text-sm text-gray-400 flex items-center gap-2 px-2">
                                <ArrowLeft class="w-4 h-4" />
                                请从左侧列表选择软件进行对比
                             </div>
                             
                             <button
                                v-if="selectedComparisons.length > 0"
                                @click="clearAllComparisons"
                                class="ml-auto flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors px-2"
                             >
                                清空全部
                             </button>
                        </div>
                    </div>

                    <!-- 编辑器区域 -->
                    <div class="flex-1 overflow-hidden" ref="exportContentRef">
                        <ComparisonEditor
                          v-model="summary"
                          :preview-html="formattedSummary"
                          :saving-state="savingState"
                          :disabled="isSaving"
                        />
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
import { 
    LayoutDashboard, X, Sparkles, Search, Loader2, ArrowLeft, Download
} from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useComparisonManager } from '../composables/useComparisonManager'
import { useToast } from '../composables/useToast'
import { getIconUrl } from '../services/localIconCache'
import type { Software } from '../types'
import logger from '../utils/logger'
import ComparisonAIOverlay from './ComparisonAIOverlay.vue'
import ComparableSoftwareList from './comparison/ComparableSoftwareList.vue'
import ComparisonEditor from './comparison/ComparisonEditor.vue'
import Tooltip from './common/Tooltip.vue'

// @ts-expect-error: html-to-image 类型声明缺失
import { toPng } from 'html-to-image'

// Markdown 配置
let md: MarkdownIt | null = null
const getMarkdownRenderer = () => {
  if (!md) md = new MarkdownIt({ html: false, breaks: true, linkify: true })
  return md
}

// ... DOMPurify hook (保持原有逻辑) ...
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

const mdToSafeHtml = (content: string): string => {
  // 预处理 Markdown 内容，修复常见格式问题 (与 SoftwareDetail.vue 保持一致)
  let processed = content
  processed = processed.replace(/([^\n])\s*(#{1,6}\s)/g, '$1\n\n$2')
  processed = processed.replace(/([^\n])\s*-\s*(\*\*)/g, '$1\n- $2')
  processed = processed.replace(/([^\n])\s*-\s*(优点|缺点)/g, '$1\n  - $2')
  processed = processed.replace(/(#{1,6}\s+.*?)(\s*-\s)/g, '$1\n$2')

  const rawHtml = getMarkdownRenderer().render(processed)
  return DOMPurify.sanitize(rawHtml, { RETURN_DOM_FRAGMENT: false, RETURN_DOM: false })
}

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
  summary,
  savingState,
  isSaving,
  isAnalyzing,
  initLoad,
  toggleComparison,
  removeComparison,
  startAIAnalysis,
  isSelected,
  flushDebouncedSave
} = useComparisonManager(computed(() => props.software))

// 搜索过滤
const searchQuery = ref('')
const filteredSoftware = computed(() => {
    let items = comparableSoftware.value || []
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        items = items.filter(s => 
            s.name.toLowerCase().includes(q) || 
            s.category.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q)
        )
    }
    // 排序：已选的在前
    const selectedIds = new Set(selectedComparisons.value.map(c => c.target_id))
    return [...items].sort((a, b) => {
        const aSelected = selectedIds.has(a.id)
        const bSelected = selectedIds.has(b.id)
        if (aSelected === bSelected) return 0
        return aSelected ? -1 : 1
    })
})

const clearAllComparisons = async () => {
  if (selectedComparisons.value.length === 0) return
  const ids = [...selectedComparisons.value.map(c => c.id)]
  for (const id of ids) await removeComparison(id)
}

const { showToast } = useToast()

onMounted(async () => {
  if (props.isOpen && props.software?.id) {
    try { await initLoad() } catch (error) { logger.error('初始化加载失败:', error); showToast('加载数据失败，请重试', 'error') }
  }
})

watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.software?.id) {
    try { await initLoad() } catch (error) { logger.error('监听加载失败:', error); showToast('加载数据失败，请重试', 'error') }
  } else {
    flushDebouncedSave()
    searchQuery.value = '' // 重置搜索
  }
})

onBeforeUnmount(() => { flushDebouncedSave() })

const formattedSummary = computed(() => {
  if (!summary.value) return ''
  return mdToSafeHtml(summary.value)
})

// 导出功能
const exportContentRef = ref<HTMLElement | null>(null)
const exportAsImage = async () => {
    if (!exportContentRef.value) return
    try {
        const dataUrl = await toPng(exportContentRef.value, {
            cacheBust: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
            style: {
                height: 'auto',
                overflow: 'visible' // 确保导出全部内容
            }
        })
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `对比分析-${props.software.name}.png`
        a.click()
        showToast('导出成功', 'success')
    } catch (error) {
        logger.error('导出失败:', error)
        showToast('导出图片失败', 'error')
    }
}

</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
