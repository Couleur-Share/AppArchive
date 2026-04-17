<template>
  <!-- AI 对比分析全屏动画 -->
  <ComparisonAIOverlay :active="isAnalyzing" />

  <Teleport to="body">
    <Transition
      enter-active-class="duration-240 ease-[cubic-bezier(0.25,1,0.5,1)]"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-180 ease-[cubic-bezier(0.32,0,0.67,0)]"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-manager-title"
      >
        <!-- 遮罩层 -->
        <div 
          class="fixed inset-0 app-modal-backdrop" 
          aria-hidden="true" 
          @click="closeDialog"
        ></div>

        <!-- 弹窗容器 -->
        <div class="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
          <Transition
            enter-active-class="duration-260 ease-[cubic-bezier(0.25,1,0.5,1)]"
            enter-from-class="opacity-0 translate-y-1.5 scale-[0.985]"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="duration-180 ease-[cubic-bezier(0.32,0,0.67,0)]"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-1 scale-[0.992]"
            appear
          >
            <div
              ref="dialogPanelRef"
              tabindex="-1"
              class="comparison-manager-panel relative z-10 flex h-[96dvh] w-screen transform flex-col overflow-hidden rounded-t-[20px] app-modal-panel app-modal-panel--interactive ring-1 ring-gray-900/5 transition-all sm:h-[min(90dvh,960px)] sm:w-full sm:max-w-[1180px] sm:rounded-2xl"
              @click.stop
            >
              <!-- 顶部标题栏 -->
              <div class="comparison-manager-surface flex-shrink-0 border-b border-gray-200/70 px-4 py-4 dark:border-white/10 sm:px-6 sm:py-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div class="flex min-w-0 items-start gap-3 sm:gap-4">
                    <div class="comparison-manager-icon-shell flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-gray-700 dark:text-gray-200">
                      <LayoutDashboard class="w-5 h-5" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 id="comparison-manager-title" class="text-lg font-bold leading-tight text-gray-900 dark:text-white sm:text-xl">
                          管理软件对比
                        </h3>
                        <TagBadge
                          size="xs"
                          variant="neutral"
                          :label="props.software.category || '未分类'"
                        />
                      </div>
                      <p class="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                        围绕
                        <span class="font-medium text-gray-700 dark:text-gray-200">{{ props.software.name }}</span>
                        管理对比对象。
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div class="flex items-center gap-2 self-end sm:self-auto">
                      <BaseButton
                        variant="primary"
                        size="sm"
                        :disabled="!canStartAnalysis"
                        @click="startAIAnalysis"
                      >
                        <Loader2 v-if="isAnalyzing" class="w-4 h-4 animate-spin" />
                        <Sparkles v-else class="w-4 h-4" />
                        {{ analysisButtonLabel }}
                      </BaseButton>

                      <Tooltip content="导出为图片">
                        <IconButton
                            type="button"
                            size="sm"
                            :disabled="!canExport"
                            aria-label="导出对比结果为图片"
                            title="导出为图片"
                            @click="exportAsImage"
                        >
                            <Download class="w-5 h-5" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip content="关闭 (Esc)">
                        <IconButton
                            type="button"
                            size="sm"
                            @click="closeDialog"
                            aria-label="关闭对比管理弹窗"
                        >
                            <X class="w-5 h-5" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 主体内容区：左右分栏 -->
              <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
                <!-- 左侧：软件选择 -->
                <aside class="comparison-manager-surface flex min-h-0 flex-col border-b border-gray-200/70 dark:border-white/10 lg:w-[352px] lg:flex-shrink-0 lg:border-b-0 lg:border-r">
                  <div class="px-4 pt-4 sm:px-5">
                    <div class="comparison-manager-base-card rounded-xl border p-4">
                      <div class="flex items-start gap-3">
                        <img
                          :src="getIconUrl(props.software.icon)"
                          :alt="props.software.name"
                          class="h-12 w-12 shrink-0 rounded-xl border border-gray-200/70 bg-white object-cover shadow-sm dark:border-white/10 dark:bg-[#1f1f1f]"
                          loading="lazy"
                          decoding="async"
                          referrerpolicy="origin"
                        >
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <TagBadge size="xs" variant="primary" label="基准软件" />
                            <TagBadge size="xs" variant="neutral" :label="props.software.category || '未分类'" />
                          </div>
                          <h4 class="mt-2 truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {{ props.software.name }}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="px-4 pb-4 pt-4 sm:px-5">
                    <div class="flex items-center justify-between gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <label for="comparison-manager-search">搜索候选软件</label>
                      <span>{{ filteredSoftware.length }} / {{ remainingComparableSoftware.length }}</span>
                    </div>
                    <div class="comparison-manager-search mt-2 flex items-center gap-2 rounded-xl border px-3 py-2">
                      <Search class="h-4 w-4 shrink-0 text-gray-400" />
                      <input
                        id="comparison-manager-search"
                        ref="searchInputRef"
                        v-model="searchQuery"
                        type="text"
                        placeholder="名称、分类或描述"
                        class="comparison-manager-search-input min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                      >
                      <button
                        v-if="hasSearchQuery"
                        type="button"
                        class="comparison-manager-inline-btn inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
                        @click="clearSearch"
                      >
                        <X class="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div class="min-h-0 flex-1 overflow-hidden px-2 pb-2 sm:px-3">
                    <div class="comparison-manager-list-shell comparison-manager-surface comparison-manager-surface--muted relative h-full overflow-hidden rounded-xl">
                      <div v-if="isLoading" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 px-6 text-center backdrop-blur-sm dark:bg-[#181818]/88">
                        <Loader2 class="h-6 w-6 animate-spin text-primary" />
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ loadingText }}</p>
                      </div>
                      <ComparableSoftwareList
                        :items="filteredSoftware"
                        :is-selected="isSelected"
                        :disabled="isLoading"
                        :row-height="82"
                        @toggle="toggleComparison"
                      />
                    </div>
                  </div>

                  <div class="comparison-manager-footer flex items-center justify-between gap-3 border-t px-4 py-3 text-xs text-gray-500 dark:text-gray-400 sm:px-5">
                    <span>{{ listMetaLabel }}</span>
                  </div>
                </aside>

                <!-- 右侧：对比结果 -->
                <section class="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div class="comparison-manager-surface comparison-manager-selection-strip border-b border-gray-200/70 px-4 py-4 dark:border-white/10 sm:px-6">
                    <div class="flex flex-col gap-3">
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div class="space-y-1">
                          <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            当前比较组
                          </p>
                          <p class="text-xs leading-5 text-gray-500 dark:text-gray-400">
                            {{ selectedComparisons.length > 0
                              ? `已纳入 ${selectedComparisons.length} 款对比对象`
                              : '先从左侧添加对比对象' }}
                          </p>
                        </div>
                        <button
                          v-if="selectedComparisons.length > 0"
                          type="button"
                          class="comparison-manager-inline-btn inline-flex items-center justify-center self-start rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                          @click="clearAllComparisons"
                        >
                          清空全部
                        </button>
                      </div>

                      <div
                        v-if="selectedComparisons.length > 0"
                        class="comparison-manager-selection-scroll flex max-h-[128px] flex-wrap gap-2 overflow-y-auto pr-1"
                      >
                        <div
                          v-for="comp in selectedComparisons"
                          :key="comp.id"
                          class="comparison-manager-chip grid min-h-[72px] min-w-0 grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 rounded-xl border px-3 py-2.5"
                        >
                          <img
                            :src="getIconUrl(comp.target.icon)"
                            :alt="comp.target.name"
                            class="h-9 w-9 shrink-0 rounded-lg border border-gray-200/70 bg-white object-cover dark:border-white/10 dark:bg-[#1f1f1f]"
                          >
                          <div class="min-w-0 self-center">
                            <p class="truncate text-sm font-medium leading-5 text-gray-900 dark:text-gray-100">
                              {{ comp.target.name }}
                            </p>
                            <p class="mt-0.5 truncate text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                              {{ comp.target.category || '未分类' }}
                            </p>
                          </div>
                          <button
                            type="button"
                            class="comparison-manager-inline-btn inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                            :aria-label="`移除 ${comp.target.name}`"
                            @click="removeComparison(comp.id)"
                          >
                            <X class="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div
                        v-else
                        class="comparison-manager-empty flex items-start gap-3 rounded-xl border border-dashed px-4 py-4"
                      >
                        <div class="comparison-manager-empty-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-gray-500 dark:text-gray-300">
                          <ArrowLeft class="h-4 w-4" />
                        </div>
                        <div class="space-y-1">
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            还没有加入对比对象
                          </p>
                          <p class="text-xs leading-5 text-gray-500 dark:text-gray-400">
                            从左侧选择软件后即可开始分析。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 编辑器区域 -->
                  <div ref="exportContentRef" class="min-h-0 flex-1 overflow-hidden">
                    <ComparisonEditor
                      v-model="summary"
                      :parsed-analysis="parsedAnalysis"
                      :comparison-softwares="comparisonSoftwareList"
                      :saving-state="savingState"
                      :disabled="isSaving"
                      :selected-count="selectedComparisons.length"
                      :base-software-name="props.software.name"
                      :is-analyzing="isAnalyzing"
                      @request-analysis="startAIAnalysis"
                    />
                  </div>
                </section>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// @ts-expect-error: html-to-image 类型声明缺失
import { toPng } from 'html-to-image'
import { ArrowLeft, Download, LayoutDashboard, Loader2, Search, Sparkles, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, Transition, watch } from 'vue'
import { useComparisonManager } from '../composables/useComparisonManager'
import { useToast } from '../composables/useToast'
import { getIconUrl } from '../services/localIconCache'
import type { Software, SoftwareListItem } from '../types'
import { parseComparisonContent } from '../utils/comparison-parser'
import logger from '../utils/logger'
import ComparisonAIOverlay from './ComparisonAIOverlay.vue'
import BaseButton from './common/BaseButton.vue'
import IconButton from './common/IconButton.vue'
import TagBadge from './common/TagBadge.vue'
import Tooltip from './common/Tooltip.vue'
import ComparableSoftwareList from './comparison/ComparableSoftwareList.vue'
import ComparisonEditor from './comparison/ComparisonEditor.vue'

const props = defineProps<{
  isOpen: boolean
  software: Software | SoftwareListItem
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
const dialogPanelRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const previousFocusedElement = ref<HTMLElement | null>(null)

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const getFocusableElements = () => {
  if (!dialogPanelRef.value) return [] as HTMLElement[]
  return Array.from(dialogPanelRef.value.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null)
}

const focusInitialElement = () => {
  if (searchInputRef.value && !searchInputRef.value.disabled) {
    searchInputRef.value.focus()
    return
  }
  const first = getFocusableElements()[0]
  first?.focus()
}

const trapTabKey = (event: KeyboardEvent) => {
  if (event.key !== 'Tab') return
  const focusable = getFocusableElements()
  if (focusable.length === 0) {
    event.preventDefault()
    dialogPanelRef.value?.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey) {
    if (!active || active === first || !dialogPanelRef.value?.contains(active)) {
      event.preventDefault()
      last.focus()
    }
    return
  }

  if (active === last) {
    event.preventDefault()
    first.focus()
  }
}

const handleWindowKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return
  if (event.key === 'Escape') {
    if (isAnalyzing.value || isSaving.value) return
    event.preventDefault()
    closeDialog()
    return
  }
  trapTabKey(event)
}
const remainingComparableSoftware = computed(() => {
  const selectedIds = new Set(selectedComparisons.value.map((c) => c.target_id))
  return (comparableSoftware.value || []).filter((s) => !selectedIds.has(s.id))
})

const filteredSoftware = computed(() => {
  let items = remainingComparableSoftware.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    )
  }
  return items
})

const hasSearchQuery = computed(() => searchQuery.value.trim().length > 0)
const canStartAnalysis = computed(() =>
  selectedComparisons.value.length > 0 && !isAnalyzing.value && !isLoading.value && !isSaving.value
)
const canExport = computed(() =>
  Boolean(summary.value.trim()) && !isLoading.value && !isAnalyzing.value
)
const analysisButtonLabel = computed(() => {
  if (isAnalyzing.value) return '正在分析...'
  if (selectedComparisons.value.length === 0) return '先选择软件'
  return '智能分析'
})
const listMetaLabel = computed(() => {
  if (hasSearchQuery.value) {
    return `当前筛出 ${filteredSoftware.value.length} 个候选项`
  }
  return `共 ${remainingComparableSoftware.value.length} 个候选项`
})

const clearSearch = async () => {
  searchQuery.value = ''
  await nextTick()
  searchInputRef.value?.focus()
}

const clearAllComparisons = async () => {
  if (selectedComparisons.value.length === 0) return
  const ids = [...selectedComparisons.value.map(c => c.id)]
  for (const id of ids) await removeComparison(id)
}

const { showToast } = useToast()

const closeDialog = () => {
  emit('update:isOpen', false)
}

onMounted(async () => {
  if (props.isOpen && props.software?.id) {
    try { await initLoad() } catch (error) { logger.error('初始化加载失败:', error); showToast('加载数据失败，请重试', 'error') }
  }
})

watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.software?.id) {
    previousFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
    window.removeEventListener('keydown', handleWindowKeydown)
    window.addEventListener('keydown', handleWindowKeydown)
    try { await initLoad() } catch (error) { logger.error('监听加载失败:', error); showToast('加载数据失败，请重试', 'error') }
    await nextTick()
    focusInitialElement()
  } else {
    window.removeEventListener('keydown', handleWindowKeydown)
    flushDebouncedSave()
    searchQuery.value = '' // 重置搜索
    const restoreTarget = previousFocusedElement.value
    if (restoreTarget) {
      nextTick(() => restoreTarget.focus())
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  flushDebouncedSave()
})

// 结构化对比分析：解析数据库中保存的 JSON
const parsedAnalysis = computed(() => {
  if (!summary.value) return null
  return parseComparisonContent(summary.value)
})

// 传给结构化视图的软件列表
const comparisonSoftwareList = computed(() => {
  return [props.software, ...selectedComparisons.value.map((c) => c.target)].map((sw) => ({
    name: sw?.name || '',
    icon: (sw as any)?.icon || '',
  }))
})

// 导出功能
const exportContentRef = ref<HTMLElement | null>(null)
const exportAsImage = async () => {
  if (!exportContentRef.value || !canExport.value) return
  try {
    const dataUrl = await toPng(exportContentRef.value, {
      cacheBust: true,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#181818' : '#f7f9fb',
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

.comparison-manager-panel {
  container-type: inline-size;
}

.comparison-manager-surface {
  background: var(--modal-card-bg-light);
}

.dark .comparison-manager-surface {
  background: var(--modal-card-bg-dark);
}

.comparison-manager-surface--muted {
  background: var(--modal-card-subtle-bg-light);
}

.dark .comparison-manager-surface--muted {
  background: var(--modal-card-subtle-bg-dark);
}

.comparison-manager-list-shell {
  border: 1px solid color-mix(in srgb, var(--modal-card-border-light) 55%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.26);
}

.dark .comparison-manager-list-shell {
  border-color: color-mix(in srgb, var(--modal-card-border-dark) 72%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.comparison-manager-footer {
  border-color: color-mix(in srgb, var(--modal-card-border-light) 52%, transparent);
}

.dark .comparison-manager-footer {
  border-color: color-mix(in srgb, var(--modal-card-border-dark) 66%, transparent);
}

.comparison-manager-icon-shell,
.comparison-manager-base-card,
.comparison-manager-chip,
.comparison-manager-search,
.comparison-manager-empty,
.comparison-manager-empty-icon {
  border-color: var(--modal-card-border-light);
  box-shadow: var(--modal-card-shadow-light);
}

.dark .comparison-manager-icon-shell,
.dark .comparison-manager-base-card,
.dark .comparison-manager-chip,
.dark .comparison-manager-search,
.dark .comparison-manager-empty,
.dark .comparison-manager-empty-icon {
  border-color: var(--modal-card-border-dark);
  box-shadow: var(--modal-card-shadow-dark);
}

.comparison-manager-icon-shell,
.comparison-manager-empty-icon {
  background: var(--modal-card-subtle-bg-light);
}

.dark .comparison-manager-icon-shell,
.dark .comparison-manager-empty-icon {
  background: var(--modal-card-subtle-bg-dark);
}

.comparison-manager-base-card,
.comparison-manager-chip {
  background: var(--modal-card-bg-light);
}

.dark .comparison-manager-base-card,
.dark .comparison-manager-chip {
  background: var(--modal-card-bg-dark);
}

.comparison-manager-chip {
  min-width: min(100%, 220px);
}

.comparison-manager-empty {
  background: var(--modal-card-subtle-bg-light);
}

.dark .comparison-manager-empty {
  background: color-mix(in srgb, var(--modal-card-subtle-bg-dark) 84%, transparent);
}

.comparison-manager-search {
  background: color-mix(in srgb, var(--modal-card-subtle-bg-light) 72%, white);
}

.dark .comparison-manager-search {
  background: color-mix(in srgb, var(--modal-card-subtle-bg-dark) 92%, #181818);
}

.comparison-manager-search-input::-webkit-search-cancel-button {
  display: none;
}

.comparison-manager-search:focus-within {
  border-color: rgb(30 215 96 / 0.3);
  box-shadow:
    0 0 0 4px rgb(30 215 96 / 0.12),
    var(--modal-card-shadow-light);
}

.dark .comparison-manager-search:focus-within {
  box-shadow:
    0 0 0 4px rgb(30 215 96 / 0.16),
    var(--modal-card-shadow-dark);
}

.comparison-manager-selection-scroll,
.no-scrollbar {
  scrollbar-width: thin;
}

.comparison-manager-selection-scroll::-webkit-scrollbar {
  width: 6px;
}

.comparison-manager-selection-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.comparison-manager-selection-scroll::-webkit-scrollbar-thumb {
  background-color: rgb(148 163 184 / 0.22);
  border-radius: 999px;
}

.comparison-manager-inline-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgb(30 215 96 / 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .comparison-manager-search,
  .comparison-manager-chip {
    transition: none !important;
  }
}
</style>
