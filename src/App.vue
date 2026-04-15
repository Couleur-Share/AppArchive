<template>
  <div class="app-home min-h-screen flex flex-col transition-colors duration-300 font-sans">
    <AppHeader
      :is-signed-in="isSignedIn"
      :user="user"
      :is-loading="isLoading"
      v-model:is-dark="isDark"
      @refresh="handleRefresh"
      @settings="showSettings = true"
      @search="handleSearch"
      @change-password="openPasswordDialog"
    />

    <main class="w-full relative z-30 flex-1">
      <div class="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5 mb-6 sm:mb-9">
          <nav class="flex-1 min-w-0" aria-label="软件分类">
            <CategoryFilter
              v-model="activeCategory"
              :categories="categories"
              :category-counts="categoryCounts"
              :category-icons="categoryIcons"
              :show-arrows="true"
              class="w-full"
            />
          </nav>

          <!-- 布局切换按钮 -->
          <div class="top-actions-bar hidden sm:flex items-center gap-1.5 shrink-0 rounded-xl border p-1.5">
            <button
              v-if="shouldHideNewArrivalRadar"
              @click="handleExpandNewArrivalRadar"
              class="top-action-btn inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg border active:scale-[0.97]"
              title="打开新增筛选"
              aria-label="打开新增筛选"
            >
              <Sparkles class="h-5 w-5" />
            </button>

            <!-- 移动端隐藏切换按钮，默认使用列表模式 -->
            <button
              @click="toggleViewMode"
              class="top-action-btn hidden sm:inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg border active:scale-[0.97]"
              :title="viewMode === 'grid' ? '切换为列表布局' : '切换为网格布局'"
              :aria-label="viewMode === 'grid' ? '切换为列表布局' : '切换为网格布局'"
              :aria-pressed="viewMode === 'grid'"
            >
              <LayoutGrid v-if="viewMode === 'grid'" class="h-5 w-5" />
              <List v-else class="h-5 w-5" />
            </button>

            <button
              v-if="canEditSoftware"
              @click="showAddDialog = true"
              class="top-action-btn hidden sm:inline-flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg border active:scale-[0.97]"
              title="添加软件"
              aria-label="添加软件"
            >
              <Plus class="h-5 w-5" />
            </button>
          </div>
        </div>

        <Transition name="new-arrival-panel">
          <div v-if="!shouldHideNewArrivalRadar" class="mb-4 sm:mb-7">
            <NewArrivalRadar
              :mode="newArrivalMode"
              :only-new="showNewOnly"
              :new-count="newArrivalsCount"
              :can-collapse="canCollapseNewArrivalRadar"
              @update:mode="handleNewArrivalModeChange"
              @update:only-new="handleNewOnlyChange"
              @collapse="handleCollapseNewArrivalRadar"
            />
          </div>
        </Transition>

        <SkeletonLoader
          v-if="shouldShowSkeleton"
          :count="skeletonCount"
          :variant="viewMode"
          class="transition-all duration-300"
        />
        <SoftwareGrid
          v-else-if="paginatedSoftwares.length > 0"
          :items="paginatedSoftwares"
          :can-edit="canEditSoftware"
          :has-comparisons="softwareComparisons"
          :view-mode="viewMode"
          :defer-icons="isIconsDeferred"
          :new-since="activeNewSince"
          @edit="editSoftware"
          @delete="deleteSoftware"
          @click="showSoftwareDetail"
          class="transition-all duration-300"
          v-gsap="'list'"
        />
      </div>

      <!-- 分页组件 -->
      <div class="mt-7 sm:mt-9 mb-9 sm:mb-12 flex justify-center px-4">
        <BlurFade :delay="0.06" :offset="6" direction="up" inView>
        <nav class="pagination-shell inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2 py-2 sm:px-3 sm:py-3" v-gsap="'fade'">
          <!-- 上一页按钮 -->
          <button
            @click="onPageChange(currentPage - 1)"
            :disabled="currentPage === 0"
            class="pagination-nav-btn inline-flex items-center justify-center h-10 w-10 rounded-lg disabled:cursor-not-allowed group shrink-0"
            aria-label="上一页"
          >
            <ChevronLeft class="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <!-- 页码按钮 -->
          <div class="inline-flex items-center gap-1 sm:gap-2">
            <template v-for="page in Math.ceil(totalItems / pageSize)" :key="page">
              <button
                v-if="shouldShowPageButton(page)"
                @click="onPageChange(page - 1)"
                class="pagination-page-btn flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-3 text-sm font-semibold transition-all duration-200"
                :class="[
                  currentPage === page - 1
                    ? 'pagination-page-btn--active'
                    : 'pagination-page-btn--idle'
                ]"
              >
                <span>{{ page }}</span>
              </button>
              <BlurFade
                v-else-if="isEllipsis(page)"
                tag="span"
                class="flex items-center justify-center w-8 sm:w-10"
                :duration="0.3"
                :offset="4"
                direction="up"
                inView
              >
                ...
              </BlurFade>
            </template>
          </div>

          <!-- 下一页按钮 -->
          <button
            @click="onPageChange(currentPage + 1)"
            :disabled="currentPage >= Math.ceil(totalItems / pageSize) - 1"
            class="pagination-nav-btn inline-flex items-center justify-center h-10 w-10 rounded-lg disabled:cursor-not-allowed group shrink-0"
            aria-label="下一页"
          >
            <ChevronRight class="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </nav>
        </BlurFade>
      </div>
    </main>

    <AppFooter />
  </div>

  <SoftwareForm
    v-if="showAddDialog || showEditDialog"
    :is-open="showAddDialog || showEditDialog"
    :software="editingSoftware"
    :categories="categories"
    @update:is-open="closeDialog"
    @submit="handleFormSubmit"
  />

  <SoftwareDetail
    v-if="selectedSoftware"
    v-model:is-open="showDetailDialog"
    :software="selectedSoftware"
    :software-list="paginatedSoftwares"
    @navigate="handleSoftwareNavigate"
    @closed="handleDetailClosed"
  />

  <LoadingOverlay :show="isLoading" />
  <Toast :toasts="toasts" />

  <SettingsDialog
    v-model:is-open="showSettings"
    :initial-systems="filterSystems"
    :initial-sort="{ field: sortBy, order: sortOrder }"
    :initial-view-mode="viewMode"
    @update:settings="updateSettings"
  />

  <ComparisonManager
    v-if="showCompareDialog"
    v-model:is-open="showCompareDialog"
    :software="softwareToCompare!"
    @error="message => showToast(message, 'error')"
  />

  <LoginDialog
    :is-open="showLoginDialog"
    @success="handleLoginSuccess"
  />

  <ChangePasswordDialog
    :is-open="showPasswordDialog"
  />

  <DeleteConfirmDialog
    v-model:show="showDeleteDialog"
    :item-name="softwareToDelete?.name"
    :is-deleting="isDeleting"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { ChevronLeft, ChevronRight, LayoutGrid, List, Plus, Sparkles } from 'lucide-vue-next'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BlurFade from './components/animations/BlurFade.vue'
import CategoryFilter from './components/common/CategoryFilter.vue'
import NewArrivalRadar from './components/common/NewArrivalRadar.vue'
import AppHeader from './components/layout/AppHeader.vue'
import SkeletonLoader from './components/SkeletonLoader.vue'
import SoftwareDetailLoading from './components/SoftwareDetailLoading.vue'
import { isSignedIn, logout, openPasswordDialog, showLoginDialog, showPasswordDialog, user } from './lib/auth'
import { initImageCache } from './services/imageCache'
import { softwareService } from './services/software'
import { type LicenseType, type Software, type SoftwareListItem, type SystemType } from './types'
import logger from './utils/logger'
import { devPerformanceTips, performanceChecker } from './utils/performance'

// 异步导入组件
const AppFooter = defineAsyncComponent(() => import('./components/layout/AppFooter.vue'))
// 主列表组件预加载状态：避免骨架结束后短暂白屏
const softwareGridModulePromise = ref<Promise<typeof import('./components/software/SoftwareGrid.vue')> | null>(null)
const softwareGridModuleLoaded = ref(false)

const SOFTWARE_CACHE_KEY = 'software-cache-v1'
const SOFTWARE_CACHE_TTL = 10 * 60 * 1000

const loadSoftwareGridModule = () => {
  if (softwareGridModulePromise.value) {
    return softwareGridModulePromise.value
  }

  softwareGridModulePromise.value = import('./components/software/SoftwareGrid.vue').then((module) => {
    softwareGridModuleLoaded.value = true
    return module
  })

  return softwareGridModulePromise.value
}

const requestSoftwareGridModule = () => loadSoftwareGridModule()

const SoftwareGrid = defineAsyncComponent({
  loader: async () => {
    const module = await requestSoftwareGridModule()
    return module
  },
  delay: 0,
})

// 立即开始预加载 SoftwareGrid 模块，不等待 onMounted
void requestSoftwareGridModule()

const SoftwareForm = defineAsyncComponent(() => import('./components/SoftwareForm.vue'))

const softwareDetailModuleState = {
  promise: null as Promise<typeof import('./components/SoftwareDetail.vue')> | null,
  loaded: false,
}

const loadSoftwareDetailModule = () => {
  if (softwareDetailModuleState.promise) {
    return softwareDetailModuleState.promise
  }

  softwareDetailModuleState.promise = import('./components/SoftwareDetail.vue').then((module) => {
    softwareDetailModuleState.loaded = true
    return module
  })

  return softwareDetailModuleState.promise
}

const requestSoftwareDetailModule = () => loadSoftwareDetailModule()

const SoftwareDetail = defineAsyncComponent({
  loader: async () => {
    const module = await requestSoftwareDetailModule()
    return module
  },
  loadingComponent: SoftwareDetailLoading,
  delay: 0,
})
const LoadingOverlay = defineAsyncComponent(() => import('./components/layout/LoadingOverlay.vue'))
const Toast = defineAsyncComponent(() => import('./components/common/Toast.vue'))
const DeleteConfirmDialog = defineAsyncComponent(() => import('./components/common/DeleteConfirmDialog.vue'))
const SettingsDialog = defineAsyncComponent(() => import('./components/SettingsDialog.vue'))
const ComparisonManager = defineAsyncComponent(() => import('./components/ComparisonManager.vue'))
const LoginDialog = defineAsyncComponent(() => import('./components/auth/LoginDialog.vue'))
const ChangePasswordDialog = defineAsyncComponent(() => import('./components/auth/ChangePasswordDialog.vue'))

import { usePagination } from './composables/usePagination'
import { useTheme } from './composables/useTheme'
// 导入组合式函数
import { useToast } from './composables/useToast'

const categories = [
  '社交',
  '生活',
  '购物',
  '影音',
  '阅读',
  '休闲',
  '旅行',
  '办公',
  '工具',
  '编程',
]

type NewArrivalMode = '7d' | '30d'

const NEW_ARRIVAL_SETTINGS_KEY = 'new-arrival-settings-v1'


// 状态管理
// const softwares = ref<Software[]>([]) // 移除全量数据
const paginatedSoftwares = ref<SoftwareListItem[]>([]) // 直接存储当前页数据
const searchTerm = ref('')
const activeCategory = ref('all')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDetailDialog = ref(false)
const editingSoftware = ref<Software | undefined>(undefined)
const showSettings = ref(false)
const filterSystems = ref<string[]>([])
const sortBy = ref<keyof Software>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const showDeleteDialog = ref(false)
const softwareToDelete = ref<SoftwareListItem | null>(null)
const isDeleting = ref(false)
const showCompareDialog = ref(false)
const softwareToCompare = ref<Software | null>(null)
const softwareComparisons = ref<Record<number, boolean>>({})
const isLoading = ref(false)
const isSubmitting = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const gridColumns = ref(4)
const isIconsDeferred = ref(true)
const newArrivalMode = ref<NewArrivalMode>('7d')
const showNewOnly = ref(false)
const newArrivalsCount = ref(0)
const isNewArrivalPanelExpanded = ref(false)
const isMobileViewport = ref(
  typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false
)

const shouldShowSkeleton = computed(() => {
  // 1. 如果组件还没加载完，必须显示骨架（避免空白）
  if (!isSoftwareGridReady.value) return true
  
  // 2. 如果正在加载且当前没有显示数据，显示骨架
  if (isLoading.value && paginatedSoftwares.value.length === 0) return true
  
  return false
})

const activeNewSince = computed(() => {
  const days = newArrivalMode.value === '7d' ? 7 : 30

  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
})

const shouldHideNewArrivalRadar = computed(() =>
  !isMobileViewport.value &&
  !showNewOnly.value &&
  !isNewArrivalPanelExpanded.value
)

const canCollapseNewArrivalRadar = computed(() =>
  !isMobileViewport.value &&
  !showNewOnly.value &&
  isNewArrivalPanelExpanded.value
)

// Tabs 图标映射（可按需自定义）
const categoryIcons: Record<string, string> = {
  all: '✨',
  '社交': '👥',
  '生活': '🏠',
  '购物': '🛍️',
  '影音': '🎬',
  '阅读': '📚',
  '休闲': '🎮',
  '旅行': '✈️',
  '办公': '💼',
  '工具': '🧰',
  '编程': '💻',
}

// 内存缓存配置
const runtimeCache = new Map<string, { data: SoftwareListItem[], total: number, timestamp: number }>()
const CACHE_VALID_TIME = 2 * 60 * 1000 // 2分钟缓存有效期

const invalidateSoftwareCaches = () => {
  runtimeCache.clear()
  localStorage.removeItem(SOFTWARE_CACHE_KEY)
}

// 分类数量徽章 - 显示当前选中分类的数量
const categoryCounts = computed<Record<string, number>>(() => {
  return { [activeCategory.value]: totalItems.value }
})

// 使用组合式函数
const route = useRoute()
const router = useRouter()
const { isDark } = useTheme()
const { showToast, toasts } = useToast()
const { currentPage, totalItems, pageSize, handlePageChange, setPageSize } = usePagination(20)

// 移除 filteredSoftwares，改为直接使用 paginatedSoftwares
// 移除 getGridColumnsByWidth, updateGridColumns (如果不需要动态计算骨架屏数量)
// 保留 gridColumns 用于骨架屏

const getGridColumnsByWidth = (width: number) => {
  if (width < 640) return 1
  if (width < 1024) return 2
  if (width < 1280) return 3
  return 4
}

const updateGridColumns = () => {
  gridColumns.value = getGridColumnsByWidth(window.innerWidth)
  isMobileViewport.value = window.matchMedia('(max-width: 640px)').matches
}

// 根据屏幕宽度自动计算骨架数量（固定 3 行）
const skeletonCount = computed(() =>
  viewMode.value === 'grid' ? gridColumns.value * 3 : 6
)
// 列表组件是否已加载完成
const isSoftwareGridReady = computed(() => softwareGridModuleLoaded.value)

const scheduleIconLoad = () => {
  if (!isIconsDeferred.value) return
  // 使用 requestAnimationFrame 确保在下一帧开始加载图标
  // 由于现在有可见的占位符图标，无需额外延迟
  nextTick(() => {
    requestAnimationFrame(() => {
      isIconsDeferred.value = false
    })
  })
}

const persistNewArrivalSettings = () => {
  localStorage.setItem(
    NEW_ARRIVAL_SETTINGS_KEY,
    JSON.stringify({
      mode: newArrivalMode.value,
      onlyNew: showNewOnly.value,
    })
  )
}

const loadNewArrivalSettings = () => {
  const rawSettings = localStorage.getItem(NEW_ARRIVAL_SETTINGS_KEY)
  if (!rawSettings) return

  try {
    const parsed = JSON.parse(rawSettings)
    if (parsed?.mode === '7d' || parsed?.mode === '30d') {
      newArrivalMode.value = parsed.mode
    } else if (typeof parsed?.mode === 'string') {
      newArrivalMode.value = '7d'
    }
    if (typeof parsed?.onlyNew === 'boolean') {
      showNewOnly.value = parsed.onlyNew
    }
  } catch (error) {
    logger.debug('读取新增雷达设置失败:', error)
  }
}

const fetchNewArrivalsCount = async () => {
  try {
    const result = await softwareService.getSoftwareList({
      page: 1,
      limit: 1,
      sortField: 'created_at',
      sortOrder: 'desc',
      addedSince: activeNewSince.value,
    })
    newArrivalsCount.value = result.pagination.total
  } catch (error) {
    newArrivalsCount.value = 0
    logger.debug('获取新增数量失败:', error)
  }
}

const handleNewArrivalModeChange = (mode: NewArrivalMode) => {
  newArrivalMode.value = mode
}

const handleNewOnlyChange = (value: boolean) => {
  showNewOnly.value = value
  if (value) {
    isNewArrivalPanelExpanded.value = true
  } else if (newArrivalsCount.value === 0) {
    isNewArrivalPanelExpanded.value = false
  }
}

const handleExpandNewArrivalRadar = () => {
  isNewArrivalPanelExpanded.value = true
}

const handleCollapseNewArrivalRadar = () => {
  isNewArrivalPanelExpanded.value = false
}

const loadCachedSoftwares = (options: { allowStale?: boolean } = {}) => {
  const { allowStale = false } = options
  const cached = localStorage.getItem(SOFTWARE_CACHE_KEY)
  if (!cached) return false

  try {
    const parsed = JSON.parse(cached)
    const cachedAt = Number(parsed?.cachedAt)
    const cachedData = parsed?.data
    const cachedTotal = Number(parsed?.total)

    if (!cachedAt || !Array.isArray(cachedData)) return false
    const isExpired = Date.now() - cachedAt > SOFTWARE_CACHE_TTL
    if (isExpired && !allowStale) return false

    totalItems.value = Number.isFinite(cachedTotal) && cachedTotal > 0 ? cachedTotal : cachedData.length
    paginatedSoftwares.value = cachedData // 缓存数据作为第一页显示
    // 先显示卡片，再加载图标
    scheduleIconLoad()
    return true
  } catch (error) {
    logger.debug('读取缓存失败:', error)
    return false
  }
}

// 包装翻页方法
const onPageChange = (page: number) => {
  handlePageChange(page)
  fetchSoftwares({ showLoading: true })
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateGridColumns)
})

// 浏览器后退时自动关闭详情弹窗
watch(() => route.name, (newName, oldName) => {
  if (oldName === 'software-detail' && newName === 'home' && showDetailDialog.value) {
    showDetailDialog.value = false
    selectedSoftware.value = null
  }
})

// 监听搜索词变化
watch(searchTerm, () => {
  currentPage.value = 0
  fetchSoftwares({ showLoading: true })
})

// 监听系统过滤变化
watch(filterSystems, () => {
  currentPage.value = 0
  fetchSoftwares({ showLoading: true })
})

// 监听排序变化
watch([sortBy, sortOrder], () => {
  currentPage.value = 0
  fetchSoftwares({ showLoading: true })
})

watch(newArrivalMode, () => {
  void fetchNewArrivalsCount()
  if (showNewOnly.value) {
    currentPage.value = 0
    fetchSoftwares({ showLoading: true })
  }
})

watch(showNewOnly, () => {
  currentPage.value = 0
  fetchSoftwares({ showLoading: true })
})

watch(newArrivalsCount, (count) => {
  if (count > 0) {
    isNewArrivalPanelExpanded.value = true
  }
})

watch([newArrivalMode, showNewOnly], () => {
  persistNewArrivalSettings()
})

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const editSoftware = async (software: SoftwareListItem) => {
  if (!canEditSoftware.value) {
    showToast('请先登录后再进行操作', 'error')
    return
  }
  try {
    isLoading.value = true
    const details = await softwareService.getSoftwareById(software.id)
    editingSoftware.value = { ...details }
    showEditDialog.value = true
  } catch (error) {
    logger.error('获取软件详情失败:', error)
    showToast(error instanceof Error ? error.message : '获取详情失败', 'error')
  } finally {
    isLoading.value = false
  }
}

const deleteSoftware = (id: number) => {
  if (!canEditSoftware.value) {
    showToast('请先登录后再进行操作', 'error')
    return
  }
  const software = paginatedSoftwares.value.find((s) => s.id === id)
  if (software) {
    softwareToDelete.value = software
    showDeleteDialog.value = true
  }
}

const closeDialog = () => {
  showAddDialog.value = false
  showEditDialog.value = false
  editingSoftware.value = undefined
}

// 修改 handleFormSubmit 方法
const handleFormSubmit = async (software: Partial<Software>) => {
  try {
    isSubmitting.value = true
    const softwareData = {
      ...software,
      license: software.license as LicenseType,
      systems: (software.systems || []) as SystemType[],
      pros: Array.isArray(software.pros) ? software.pros : [],
      cons: Array.isArray(software.cons) ? software.cons : []
    }

    // 兼容判断：优先使用正在编辑的条目ID；若未设置，则尝试使用表单自身携带的ID
    const idToUpdate = editingSoftware.value?.id ?? (software as any)?.id

    if (idToUpdate) {
      // 更新现有软件
      await softwareService.updateSoftware(idToUpdate, softwareData)
      showToast('更新成功', 'success')
    } else {
      // 添加新软件
      await softwareService.addSoftware(softwareData)
      showToast('添加成功', 'success')
    }

    // 写操作后先失效缓存，再强制刷新，避免命中旧数据导致列表不更新
    invalidateSoftwareCaches()
    await fetchSoftwares({ forceRefresh: true })
    void fetchNewArrivalsCount()
    
    // 关闭对话框
    closeDialog()
  } catch (error) {
    logger.error('表单提交错误:', error)
    showToast(error instanceof Error ? error.message : '操作失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}

watch(
  activeCategory,
  () => {
    currentPage.value = 0
    fetchSoftwares({ showLoading: true })
  },
  { immediate: true }
)

// 修改 confirmDelete 函数
const confirmDelete = async () => {
  if (softwareToDelete.value) {
    isDeleting.value = true
    try {
      await softwareService.deleteSoftware(softwareToDelete.value.id)
      paginatedSoftwares.value = paginatedSoftwares.value.filter(
        (s) => s.id !== softwareToDelete.value?.id
      )
      invalidateSoftwareCaches()
      await fetchSoftwares({ forceRefresh: true })
      void fetchNewArrivalsCount()
      showToast(`已删除 "${softwareToDelete.value.name}"`, 'success')
      showDeleteDialog.value = false
      softwareToDelete.value = null
    } catch (error) {
      showToast('删除失败，请重试', 'error')
      logger.error(error)
    } finally {
      isDeleting.value = false
    }
  }
}

// 预加载弹窗组件，提升首次打开速度
const preloadDialogComponents = () => {
  // 在空闲时间预加载弹窗组件
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // 预加载软件详情和添加软件弹窗组件
      Promise.all([
        requestSoftwareDetailModule(),
        import('./components/SoftwareForm.vue')
      ]).catch(err => {
        logger.debug('预加载组件失败:', err)
      })
    })
  } else {
    // 如果不支持 requestIdleCallback，延迟执行
    setTimeout(() => {
      Promise.all([
        requestSoftwareDetailModule(),
        import('./components/SoftwareForm.vue')
      ]).catch(err => {
        logger.debug('预加载组件失败:', err)
      })
    }, 1000)
  }
}

// 在组件挂载时初始化设置并获取数据
onMounted(async () => {
  // 尽早触发弹窗预加载，减少首次点击等待
  preloadDialogComponents()
  void requestSoftwareDetailModule()
  // SoftwareGrid 模块已在 script setup 顶层预加载，无需重复调用
  updateGridColumns()
  window.addEventListener('resize', updateGridColumns, { passive: true })

  loadNewArrivalSettings()
  void fetchNewArrivalsCount()

  // 读取设置
  const savedSettings = localStorage.getItem('app-settings')
  let hasViewModePreference = false
  
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      if (settings.systems) filterSystems.value = settings.systems
      if (settings.sort) {
        sortBy.value = settings.sort.field
        sortOrder.value = settings.sort.order
      }
      if (settings.viewMode) {
        viewMode.value = settings.viewMode
        hasViewModePreference = true
      }
    } catch (e) {
      logger.error('读取设置失败', e)
    }
  }
  
  // 移动端默认使用列表模式（仅当没有保存的偏好时）
  if (!hasViewModePreference) {
    const isMobile = window.matchMedia('(max-width: 640px)').matches
    if (isMobile) {
      viewMode.value = 'list'
    }
  }

  // 优先尝试读取缓存，缩短冷启动骨架屏时间
  const hasCachedSoftwares = loadCachedSoftwares({ allowStale: true })
  // 初始化图片缓存放到后台，不阻塞首屏数据
  void initImageCache()
  // 有缓存时后台更新数据，无缓存则正常加载
  await fetchSoftwares({ showLoading: !hasCachedSoftwares })
  
  // 直接链接访问：URL 包含软件 ID 时自动打开详情弹窗
  if (route.name === 'software-detail' && route.params.id) {
    const targetId = Number(route.params.id)
    if (!Number.isNaN(targetId)) {
      try {
        const sw = await softwareService.getSoftwareById(targetId)
        selectedSoftware.value = sw
        showDetailDialog.value = true
      } catch (error) {
        logger.error('从链接打开软件详情失败:', error)
        showToast('该软件不存在或已被删除', 'error')
        router.replace({ name: 'home' })
      }
    }
  }

  // 启动性能检查：开发环境默认开启，或者通过环境变量显式开启
  const shouldEnablePerfCheck = import.meta.env.DEV && import.meta.env.VITE_ENABLE_PERF_CHECK !== 'false'
  
  if (shouldEnablePerfCheck || import.meta.env.VITE_ENABLE_PERF_CHECK === 'true') {
    setTimeout(() => {
      devPerformanceTips.checkForCommonIssues()
      performanceChecker.runFullCheck()
    }, 3000)
  }
})

// 添加获取数据的方法
async function fetchSoftwares (options: { showLoading?: boolean, forceRefresh?: boolean } = {}) {
  const { showLoading = true, forceRefresh = false } = options

  // 生成缓存 key
  const params = {
    page: currentPage.value + 1,
    limit: pageSize.value,
    search: searchTerm.value,
    category: activeCategory.value,
    systems: filterSystems.value,
    sortField: sortBy.value,
    sortOrder: sortOrder.value,
    addedSince: showNewOnly.value ? activeNewSince.value : undefined,
  }
  const cacheKey = JSON.stringify(params)
  let usedCache = false

  // 检查缓存
  if (!forceRefresh) {
    const cached = runtimeCache.get(cacheKey)
    if (cached) {
      // 命中缓存，立即显示
      paginatedSoftwares.value = cached.data
      totalItems.value = cached.total
      
      // 检查是否过期
      const isExpired = Date.now() - cached.timestamp > CACHE_VALID_TIME
      
      if (!isExpired) {
        // 缓存有效，直接返回，不需要加载
        isLoading.value = false
        scheduleIconLoad()
        logger.debug('命中内存缓存，跳过请求')
        return
      }
      
      // 缓存过期，标记为使用缓存但需要更新
      usedCache = true
      logger.debug('缓存已过期，正在后台更新...')
    }
  }

  try {
    if (showLoading && !usedCache) {
      isLoading.value = true
      isIconsDeferred.value = true
    }
    logger.debug('开始加载软件列表...')
    
    const loadData = async () => {
      logger.debug('正在从服务器获取数据...')
      const result = await softwareService.getSoftwareList(params)
      
      logger.debug('获取到的数据:', result.data)
      paginatedSoftwares.value = result.data
      totalItems.value = result.pagination.total
      // 先渲染卡片，再加载图标
      scheduleIconLoad()
      
      // 更新内存缓存
      runtimeCache.set(cacheKey, {
        data: result.data,
        total: result.pagination.total,
        timestamp: Date.now()
      })
      
      // 缓存第一页数据 (仅当没有筛选条件时)
      if (
        currentPage.value === 0 &&
        !showNewOnly.value &&
        !searchTerm.value &&
        activeCategory.value === 'all' &&
        filterSystems.value.length === 0
      ) {
        localStorage.setItem(
          SOFTWARE_CACHE_KEY,
          JSON.stringify({ cachedAt: Date.now(), data: result.data, total: result.pagination.total })
        )
      }
      logger.debug('数据加载完成，本页:', result.data.length, '总数:', result.pagination.total)
    }

    await loadData()
    if (showLoading) {
      isLoading.value = false
    }
    
  } catch (error) {
    logger.error('获取数据失败:', error)
    if (!usedCache) {
      showToast('获取数据失败', 'error')
    }
    if (showLoading) {
      isLoading.value = false
    }
  }
}

// 添加刷新方法
const handleRefresh = async () => {
  if (currentPage.value !== 0) {
    currentPage.value = 0 // 重置页码
  }
  await fetchSoftwares({ forceRefresh: true }) // 强制重新获取数据
  void fetchNewArrivalsCount()
  showToast('刷新成功', 'success')
}

// 添加权限检查的计算属性
const canEditSoftware = computed(() => isSignedIn.value)

// 退出登录
const handleSignOut = () => {
  logout()
  showToast('已退出登录', 'success')
}

// 登录成功回调
const handleLoginSuccess = () => {
  showToast('登录成功', 'success')
}

const selectedSoftware = ref<SoftwareListItem | null>(null)

useHead({
  title: computed(() => {
    if (selectedSoftware.value?.name) {
      return `${selectedSoftware.value.name} - 软件清单`
    }
    return '软件清单 - 发现和管理优质软件'
  }),
  meta: [
    {
      name: 'description',
      content: computed(() => {
        if (selectedSoftware.value) {
          const sw = selectedSoftware.value
          const parts = [sw.category, sw.license, (sw.systems || []).join(' / ')].filter(Boolean).join(' · ')
          const desc = (sw.description || '').slice(0, 160)
          return parts ? `${parts} — ${desc}` : desc
        }
        return '发现、记录和管理优质软件应用，涵盖社交、工具、编程、办公等多个分类。'
      }),
    },
  ],
})

const handleDetailClosed = () => {
  selectedSoftware.value = null
  if (route.name === 'software-detail') {
    router.replace({ name: 'home' })
  }
}

const showSoftwareDetail = (software: SoftwareListItem) => {
  selectedSoftware.value = { ...software }
  showDetailDialog.value = true
  router.push({ name: 'software-detail', params: { id: software.id } })
}

// 处理详情弹窗中的软件导航切换
const handleSoftwareNavigate = (software: SoftwareListItem) => {
  selectedSoftware.value = { ...software }
  router.replace({ name: 'software-detail', params: { id: software.id } })
}

// 添加更新设置的方法
const updateSettings = (settings: {
  systems: string[]
  sort: {
    field: string
    order: 'asc' | 'desc'
  }
  viewMode: 'grid' | 'list'
}) => {
  // 检查系统筛选是否改变（使用集合比较，忽略顺序）
  const oldSystemsSet = new Set(filterSystems.value)
  const newSystemsSet = new Set(settings.systems)
  const systemsChanged = 
    oldSystemsSet.size !== newSystemsSet.size ||
    ![...oldSystemsSet].every(sys => newSystemsSet.has(sys))
  
  filterSystems.value = settings.systems
  sortBy.value = settings.sort.field as keyof Software
  sortOrder.value = settings.sort.order
  viewMode.value = settings.viewMode
  
  // 如果系统筛选改变，重置页码到第一页
  if (systemsChanged) {
    currentPage.value = 0
  }
  
  // 保存设置到 localStorage
  localStorage.setItem('app-settings', JSON.stringify({
    systems: settings.systems,
    sort: settings.sort,
    viewMode: settings.viewMode
  }))
  
  showToast('设置已保存', 'success')
  showSettings.value = false
}


// 添加搜索处理方法
const handleSearch = (term: string) => {
  searchTerm.value = term
  // watcher 会处理数据获取
}

// 添加分页显示逻辑
const shouldShowPageButton = (page: number) => {
  const totalPages = Math.ceil(totalItems.value / pageSize.value)
  const current = currentPage.value + 1

  // 始终显示第一页和最后一页
  if (page === 1 || page === totalPages) return true
  
  // 显示当前页码前后各2页
  if (Math.abs(page - current) <= 2) return true
  
  return false
}

const isEllipsis = (page: number) => {
  const totalPages = Math.ceil(totalItems.value / pageSize.value)
  const current = currentPage.value + 1
  
  // 在当前页码和首页之间显示省略号
  if (page === 3 && current > 5) return true
  
  // 在当前页码和末页之间显示省略号
  if (page === totalPages - 2 && current < totalPages - 4) return true
  
  return false
}
</script>

<style>
.dark {
  color-scheme: dark;
}

:root {
  transition: background-color 0.3s ease, color 0.3s ease,
    border-color 0.3s ease;
  background-color: var(--app-bg-start);
  min-height: 100vh;

  --gradient-light-start: #f7f8fb;
  --gradient-light-end: #e5eaf0;
  --gradient-light-accent1: rgba(148, 163, 184, 0.08);
  --gradient-light-accent2: rgba(15, 23, 42, 0.05);

  --gradient-dark-start: #0f1115;
  --gradient-dark-end: #161a21;
  --gradient-dark-accent1: rgba(148, 163, 184, 0.08);
  --gradient-dark-accent2: rgba(255, 255, 255, 0.035);
}

:root.dark {
  background-color: var(--app-bg-end);
}

* {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

img,
.transition-none {
  transition: none !important;
}

button {
  transition:
    color var(--dur) var(--ease),
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease),
    opacity var(--dur) var(--ease);
}

.top-actions-bar {
  --top-action-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.top-actions-bar,
.pagination-shell {
  --ui-focus-ring: var(--home-focus-ring);
  --ui-accent-shadow: var(--home-accent-shadow);
  --ui-hover-shadow: var(--home-shadow);
  --ui-hover-brightness: 1.03;
  --ui-hover-surface-light: var(--home-surface-hover);
  --ui-hover-surface-dark: var(--home-surface-hover);
  background: var(--home-surface);
  border-color: var(--home-border);
  box-shadow: var(--home-shadow-strong);
  backdrop-filter: blur(12px);
}

.top-actions-bar {
  background: var(--home-tab-rail-bg);
  border-color: var(--home-tab-rail-border);
  box-shadow: var(--home-tab-rail-shadow);
}

.pagination-shell {
  background: var(--home-tab-rail-bg);
  border-color: var(--home-tab-rail-border);
  box-shadow: var(--home-tab-rail-shadow);
}

.app-home {
  color: var(--home-text);
  background:
    radial-gradient(circle at 14% -4%, var(--app-bg-accent1), transparent 26%),
    radial-gradient(circle at 100% 10%, var(--app-bg-accent2), transparent 30%),
    radial-gradient(circle at 50% 112%, var(--app-bg-accent3), transparent 38%),
    linear-gradient(180deg, var(--app-bg-top-glow) 0%, var(--app-bg-top-veil) 12%, transparent 24%),
    linear-gradient(180deg, transparent 66%, var(--app-bg-bottom-glow) 88%, var(--app-bg-bottom-shade) 100%),
    linear-gradient(180deg, var(--app-bg-start) 0%, var(--app-bg-mid) 18%, var(--app-bg-end) 74%, var(--app-bg-bottom-end) 100%);
  background-repeat: no-repeat;
}

.dark .app-home {
  background:
    radial-gradient(circle at 16% -6%, var(--app-bg-accent1), transparent 24%),
    radial-gradient(circle at 100% 0%, var(--app-bg-accent2), transparent 22%),
    radial-gradient(circle at 50% 110%, var(--app-bg-accent3), transparent 30%),
    linear-gradient(180deg, var(--app-bg-top-glow) 0%, var(--app-bg-top-veil) 16%, transparent 30%),
    linear-gradient(180deg, transparent 64%, var(--app-bg-bottom-glow) 86%, var(--app-bg-bottom-shade) 100%),
    linear-gradient(180deg, var(--app-bg-start) 0%, var(--app-bg-mid) 18%, var(--app-bg-end) 74%, var(--app-bg-bottom-end) 100%);
}

.top-action-btn {
  transition:
    transform 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    color 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    border-color 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1));
  background: var(--home-surface-strong);
  border-color: var(--home-border);
  color: var(--home-text);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 12px 24px -22px rgb(15 23 42 / 0.28);
}

.top-action-btn > svg {
  transition: transform 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1));
}

@media (hover: hover) and (pointer: fine) {
  .top-action-btn:hover > svg {
    transform: scale(1.05);
  }

  .top-action-btn:not(:disabled):hover,
  .pagination-nav-btn:not(:disabled):hover,
  .pagination-page-btn--idle:hover {
    background-color: var(--ui-hover-surface-light);
    box-shadow: var(--ui-hover-shadow);
  }

  .dark .top-action-btn:not(:disabled):hover,
  .dark .pagination-nav-btn:not(:disabled):hover,
  .dark .pagination-page-btn--idle:hover {
    background-color: var(--ui-hover-surface-dark);
  }

  .pagination-page-btn--active:hover {
    box-shadow: var(--home-tab-badge-active-shadow);
  }
}

.top-action-btn:active > svg {
  transform: scale(0.94);
}

.top-action-btn:focus-visible,
.pagination-nav-btn:focus-visible,
.pagination-page-btn:focus-visible {
  outline: none;
  box-shadow: var(--ui-focus-ring);
}

.pagination-nav-btn {
  transition:
    color 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    transform 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1));
  background: transparent;
  color: var(--home-text-muted) !important;
}

.pagination-page-btn {
  transition:
    color 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    background-color 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    box-shadow 180ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1)),
    transform 160ms var(--top-action-ease, cubic-bezier(0.22, 1, 0.36, 1));
  border: 1px solid transparent;
}

.pagination-page-btn--active {
  background: var(--home-tab-badge-active-bg);
  color: var(--home-tab-badge-active-text);
  border-color: transparent;
  box-shadow: var(--home-tab-badge-active-shadow);
}

.pagination-page-btn--idle {
  color: var(--home-text);
  background-color: transparent;
}

.pagination-nav-btn:disabled {
  color: var(--home-text-subtle) !important;
  opacity: 0.42;
}

/* 只针对图标链接的样式 */
.icon-link > svg {
  animation: none !important;
  transform: none !important;
  background: none !important;
}

/* animate.css 自定义持续时间（Toast 组件使用） */
.animate__animated {
  --animate-duration: 0.5s;
  --animate-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.animate__faster {
  --animate-duration: 0.3s;
}


@media (prefers-reduced-motion: reduce) {
  .animate__animated {
    animation: none !important;
  }

  .top-action-btn,
  .top-action-btn > svg,
  .pagination-nav-btn,
  .pagination-page-btn {
    transition: none !important;
  }

  .top-action-btn:active,
  .top-action-btn:active > svg {
    transform: none !important;
  }

  .top-action-btn:focus-visible,
  .pagination-nav-btn:focus-visible,
  .pagination-page-btn:focus-visible {
    outline: 2px solid var(--home-tab-badge-active-bg);
    outline-offset: 2px;
    box-shadow: none !important;
  }
}


/* 移除数字输入框的上下箭头 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* 新增雷达展开/收起过渡 */
.new-arrival-panel-enter-active,
.new-arrival-panel-leave-active {
  transition:
    max-height 260ms ease,
    opacity 220ms ease,
    transform 220ms ease;
  overflow: hidden;
}

.new-arrival-panel-enter-from,
.new-arrival-panel-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.new-arrival-panel-enter-to,
.new-arrival-panel-leave-from {
  max-height: 420px;
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .new-arrival-panel-enter-active,
  .new-arrival-panel-leave-active {
    transition: opacity 120ms ease;
  }

  .new-arrival-panel-enter-from,
  .new-arrival-panel-leave-to,
  .new-arrival-panel-enter-to,
  .new-arrival-panel-leave-from {
    max-height: none;
    transform: none;
  }
}
</style>
