<template>
  <div class="min-h-screen transition-colors duration-300 font-sans">
    <AppHeader
      :is-signed-in="isSignedIn"
      :user="user"
      :is-loading="isLoading"
      v-model:is-dark="isDark"
      @refresh="handleRefresh"
      @settings="showSettings = true"
      @search="handleSearch"
    />

    <div class="w-full relative z-30">
      <div class="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-12">
          <div class="flex-1 min-w-0">
            <CategoryFilter
              v-model="activeCategory"
              :categories="categories"
              :category-counts="categoryCounts"
              :category-icons="categoryIcons"
              :show-arrows="true"
              class="w-full"
            />
          </div>

          <!-- 布局切换按钮 -->
          <div class="flex items-center gap-4 shrink-0">
            <button
              @click="toggleViewMode"
              class="w-11 h-11 rounded-xl flex items-center justify-center 
                     bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800
                     border border-gray-200 dark:border-gray-800 
                     text-gray-600 dark:text-gray-300 
                     shadow-sm hover:shadow-md
                     transition-all duration-200"
              title="切换布局"
            >
              <LayoutGrid v-if="viewMode === 'grid'" class="w-5 h-5" />
              <List v-else class="w-5 h-5" />
            </button>

            <button
              v-if="canEditSoftware"
              @click="showAddDialog = true"
              class="w-11 h-11 rounded-xl flex items-center justify-center 
                     bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800
                     border border-gray-200 dark:border-gray-800 
                     text-gray-600 dark:text-gray-300 
                     shadow-sm hover:shadow-md
                     transition-all duration-200"
              title="添加软件"
            >
              <Plus class="h-5 w-5" />
            </button>
          </div>
        </div>

        <SoftwareGrid
          :items="paginatedSoftwares"
          :can-edit="canEditSoftware"
          :has-comparisons="softwareComparisons"
          :view-mode="viewMode"
          @edit="editSoftware"
          @delete="deleteSoftware"
          @click="showSoftwareDetail"
          class="transition-all duration-300"
          v-gsap="'list'"
        />
      </div>

      <!-- 分页组件 -->
      <div class="mt-6 sm:mt-8 mb-8 sm:mb-12 flex justify-center px-4">
        <BlurFade :delay="0.06" :offset="6" direction="up" inView>
        <nav class="inline-flex items-center gap-1 sm:gap-2 bg-white/60 dark:bg-gray-800/80 px-3 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/30" v-gsap="'fade'">
          <!-- 上一页按钮 -->
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 0"
            class="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group shrink-0"
            :class="currentPage === 0 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'"
          >
            <svg
              class="w-5 h-5 transform transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <!-- 页码按钮 -->
          <div class="inline-flex items-center gap-1 sm:gap-2">
            <template v-for="page in Math.ceil(totalItems / pageSize)" :key="page">
              <button
                v-if="shouldShowPageButton(page)"
                @click="handlePageChange(page - 1)"
                class="min-w-[2.5rem] h-10 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                :class="[
                  currentPage === page - 1
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= Math.ceil(totalItems / pageSize) - 1"
            class="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group shrink-0"
            :class="
              currentPage >= Math.ceil(totalItems / pageSize) - 1
                ? 'text-gray-400'
                : 'text-gray-700 dark:text-gray-300'
            "
          >
            <svg
              class="w-5 h-5 transform transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </nav>
        </BlurFade>
      </div>
    </div>
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

  <AppFooter />

  <DeleteConfirmDialog
    v-model:show="showDeleteDialog"
    :item-name="softwareToDelete?.name"
    :is-deleting="isDeleting"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { LayoutGrid, List, Plus } from 'lucide-vue-next'
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import BlurFade from './components/animations/BlurFade.vue'
import { isSignedIn, signOut, user } from './lib/clerk'
import { comparisonService } from './services/comparison'
import { initImageCache } from './services/imageCache'
import { softwareService } from './services/software'
import { type LicenseType, type Software, type SystemType } from './types'
import logger from './utils/logger'
import { devPerformanceTips, performanceChecker } from './utils/performance'

// 异步导入组件
const AppHeader = defineAsyncComponent(() => import('./components/layout/AppHeader.vue'))
const AppFooter = defineAsyncComponent(() => import('./components/layout/AppFooter.vue'))
const CategoryFilter = defineAsyncComponent(() => import('./components/common/CategoryFilter.vue'))
const SoftwareGrid = defineAsyncComponent(() => import('./components/software/SoftwareGrid.vue'))
const SoftwareForm = defineAsyncComponent(() => import('./components/SoftwareForm.vue'))
const SoftwareDetail = defineAsyncComponent(() => import('./components/SoftwareDetail.vue'))
const LoadingOverlay = defineAsyncComponent(() => import('./components/layout/LoadingOverlay.vue'))
const Toast = defineAsyncComponent(() => import('./components/common/Toast.vue'))
const DeleteConfirmDialog = defineAsyncComponent(() => import('./components/common/DeleteConfirmDialog.vue'))
const SettingsDialog = defineAsyncComponent(() => import('./components/SettingsDialog.vue'))
const ComparisonManager = defineAsyncComponent(() => import('./components/ComparisonManager.vue'))
const ComparisonResult = defineAsyncComponent(() => import('./components/ComparisonResult.vue'))

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

// 状态管理
const softwares = ref<Software[]>([])
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
const showFeedback = ref(false)
const showDeleteDialog = ref(false)
const softwareToDelete = ref<Software | null>(null)
const isDeleting = ref(false)
const showCompareDialog = ref(false)
const softwareToCompare = ref<Software | null>(null)
const softwareComparisons = ref<Record<number, boolean>>({})
const isLoading = ref(false)
const query = ref('')
const isSubmitting = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')

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

// 分类数量徽章（基于当前筛选条件统计，包括系统筛选和搜索筛选）
// 注意：这里不考虑分类筛选（activeCategory），因为Tabs本身就是为了切换分类的
const categoryCounts = computed<Record<string, number>>(() => {
  // 先应用系统筛选和搜索筛选，但不应用分类筛选
  let filtered = softwares.value

  // 应用系统筛选
  if (filterSystems.value.length > 0) {
    filtered = filtered.filter((s) => 
      s.systems.some(sys => filterSystems.value.includes(sys))
    )
  }

  // 应用搜索筛选
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search) ||
        (s.description?.toLowerCase().includes(search))
    )
  }

  // 基于筛选后的数据计算各分类的数量
  const counts: Record<string, number> = { all: filtered.length }
  for (const c of categories) {
    counts[c] = filtered.filter(s => s.category === c).length
  }
  return counts
})

// 使用组合式函数
const { isDark } = useTheme()
const { showToast, toasts } = useToast()
const { currentPage, totalItems, pageSize, handlePageChange, setPageSize } = usePagination(20)

// 计算属性
const filteredSoftwares = computed(() => {
  let result = softwares.value

  if (activeCategory.value !== 'all') {
    result = result.filter((s) => s.category === activeCategory.value)
  }

  if (filterSystems.value.length > 0) {
    result = result.filter((s) => 
      s.systems.some(sys => filterSystems.value.includes(sys))
    )
  }

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search) ||
        (s.description?.toLowerCase().includes(search))
    )
  }

  result = result.sort((a, b) => {
    const factor = sortOrder.value === 'asc' ? 1 : -1
    const aValue = a[sortBy.value]
    const bValue = b[sortBy.value]

    if (aValue === undefined || bValue === undefined) {
      return 0
    }

    return aValue > bValue ? factor : -factor
  })

  // 更新总项目数
  totalItems.value = result.length
  return result
})

const paginatedSoftwares = computed(() => {
  const total = filteredSoftwares.value.length
  
  if (total === 0) {
    return []
  }

  // 确保当前页码不超过最大页数
  const maxPage = Math.ceil(total / pageSize.value) - 1
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }

  const start = currentPage.value * pageSize.value
  const end = Math.min(start + pageSize.value, total)
  
  return filteredSoftwares.value.slice(start, end)
})

// 监听搜索词变化
watch(searchTerm, () => {
  currentPage.value = 0
  totalItems.value = filteredSoftwares.value.length
})

// 监听系统过滤变化
watch(filterSystems, () => {
  currentPage.value = 0
  totalItems.value = filteredSoftwares.value.length
})

// 监听排序变化
watch([sortBy, sortOrder], () => {
  currentPage.value = 0
  totalItems.value = filteredSoftwares.value.length
})

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const editSoftware = (software: Software) => {
  if (!canEditSoftware.value) {
    showToast('请先登录后再进行操作', 'error')
    return
  }
  editingSoftware.value = { ...software }
  showEditDialog.value = true
}

const deleteSoftware = (id: number) => {
  if (!canEditSoftware.value) {
    showToast('请先登录后再进行操作', 'error')
    return
  }
  const software = softwares.value.find((s) => s.id === id)
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

// 添加一个提取原始图片 URL 的函数
const extractOriginalImageUrl = (notionUrl: string): string => {
  try {
    // 1. 从 Notion URL 中提取编码的原始 URL
    const match = notionUrl.match(/image\/(.*?)\?/)
    if (!match || !match[1]) return notionUrl

    // 2. 解码 URL
    const decodedUrl = decodeURIComponent(match[1])

    return decodedUrl
  } catch (error) {
    logger.error('提取图片 URL 失败:', error)
    return notionUrl
  }
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

    // 重新获取软件列表
    await fetchSoftwares()
    
    // 关闭对话框
    closeDialog()
  } catch (error) {
    logger.error('表单提交错误:', error)
    showToast(error instanceof Error ? error.message : '操作失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// 添加删除处理函数
const handleDelete = (id: number) => {
  const software = softwares.value.find((s) => s.id === id)
  if (software) {
    softwares.value = softwares.value.filter((s) => s.id !== id)
    showToast(`已删除 "${software.name}"`, 'success')
  }
}

// 添加清除搜索的方法
const clearSearch = () => {
  searchTerm.value = ''
  query.value = ''
}

const tabRefs = ref<HTMLElement[]>([])
const activeTabWidth = ref(0)
const activeTabLeft = ref(0)

// 监听 activeCategory 的变化来更新指示条位置
watch(
  activeCategory,
  () => {
    // 切换分类时重置到第 1 页
    currentPage.value = 0
    totalItems.value = filteredSoftwares.value.length
    nextTick(() => {
      const activeIndex = ['all', ...categories].indexOf(activeCategory.value)
      const activeTab = tabRefs.value[activeIndex]
      if (activeTab) {
        const textWidth = activeTab.offsetWidth
        activeTabWidth.value = textWidth * 0.6
        activeTabLeft.value =
          activeTab.offsetLeft + (textWidth - activeTabWidth.value) / 2
      }
    })
  },
  { immediate: true }
)

// 修改 confirmDelete 函数
const confirmDelete = async () => {
  if (softwareToDelete.value) {
    isDeleting.value = true
    try {
      await softwareService.deleteSoftware(softwareToDelete.value.id)
      softwares.value = softwares.value.filter(
        (s) => s.id !== softwareToDelete.value?.id
      )
      await fetchSoftwares()
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
        import('./components/SoftwareDetail.vue'),
        import('./components/SoftwareForm.vue')
      ]).catch(err => {
        logger.debug('预加载组件失败:', err)
      })
    })
  } else {
    // 如果不支持 requestIdleCallback，延迟执行
    setTimeout(() => {
      Promise.all([
        import('./components/SoftwareDetail.vue'),
        import('./components/SoftwareForm.vue')
      ]).catch(err => {
        logger.debug('预加载组件失败:', err)
      })
    }, 1000)
  }
}

// 在组件挂载时获取数据
onMounted(async () => {
  // 初始化图片缓存
  await initImageCache()
  // 获取软件列表
  await fetchSoftwares()
  
  // 预加载弹窗组件（在数据加载完成后）
  preloadDialogComponents()
  
  // 通过环境变量控制是否启用性能检查，默认关闭
  if (import.meta.env.VITE_ENABLE_PERF_CHECK === 'true') {
    setTimeout(() => {
      logger.debug('🚀 启动性能检查...')
      devPerformanceTips.checkForCommonIssues()
      performanceChecker.runFullCheck()
    }, 3000)
  }
})

// 添加获取数据的方法
const fetchSoftwares = async () => {
  try {
    isLoading.value = true
    logger.debug('开始加载软件列表...')
    
    // 分批加载数据
    const loadData = async () => {
      logger.debug('正在从服务器获取数据...')
      const data = await softwareService.getAllSoftware()
      logger.debug('获取到的数据:', data)
      softwares.value = data
      totalItems.value = data.length
      logger.debug('数据加载完成，总数:', data.length)
    }

    // 延迟加载比较信息
    const loadComparisons = async () => {
      logger.debug('开始加载比较信息...')
      const comparisonsPromises = softwares.value.map(async software => {
        try {
          const comparisons = await comparisonService.getComparisons(software.id)
          softwareComparisons.value[software.id] = comparisons.length > 0
        } catch (error) {
          logger.error(`获取软件 ${software.id} 的比较信息失败:`, error)
          softwareComparisons.value[software.id] = false
        }
      })

      await Promise.all(comparisonsPromises)
      logger.debug('比较信息加载完成')
    }

    await loadData()
    isLoading.value = false
    
    // 延迟加载比较信息
    setTimeout(loadComparisons, 100)
    
  } catch (error) {
    logger.error('获取数据失败:', error)
    showToast('获取数据失败', 'error')
    isLoading.value = false
  }
}

// 添加刷新方法
const handleRefresh = async () => {
  currentPage.value = 0 // 重置页码到第一页npm run dev:full
  await fetchSoftwares() // 重新获取数据
  showToast('刷新成功', 'success')
}

// 添加权限检查的计算属性
const canEditSoftware = computed(() => isSignedIn.value)

// 添加退出登录处理方法
const handleSignOut = async () => {
  try {
    await signOut()
    showToast('已退出登录', 'success')
  } catch (error) {
    showToast('退出登录失败', 'error')
    logger.error('退出登录错误:', error)
  }
}

const handleCategoryChange = (newCategory: string) => {
  activeCategory.value = newCategory
  // 重置分页到第一页
  currentPage.value = 0
  // 重新计算总项目数
  totalItems.value = filteredSoftwares.value.length
}

const selectedSoftware = ref<Software | null>(null)

const showSoftwareDetail = (software: Software) => {
  selectedSoftware.value = {
    ...software,
    license: software.license as LicenseType,
    systems: software.systems as SystemType[]
  }
  showDetailDialog.value = true
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

// 在组件挂载时加载保存的设置
onMounted(async () => {
  // 读取设置
  const savedSettings = localStorage.getItem('app-settings')
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
      }
    } catch (e) {
      logger.error('读取设置失败', e)
    }
  }
  
  // 初始化图片缓存
  await initImageCache()
  // 获取软件列表
  await fetchSoftwares()
  
  // 预加载弹窗组件（在数据加载完成后）
  preloadDialogComponents()
  
  // 通过环境变量控制是否启用性能检查，默认关闭
  if (import.meta.env.VITE_ENABLE_PERF_CHECK === 'true') {
    setTimeout(() => {
      logger.debug('🚀 启动性能检查...')
      devPerformanceTips.checkForCommonIssues()
      performanceChecker.runFullCheck()
    }, 3000)
  }
})

// 添加搜索处理方法
const handleSearch = (term: string) => {
  searchTerm.value = term
  currentPage.value = 0
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
  background-color: var(--gradient-light-start);
  min-height: 100vh;
  /* Nuxt-like Bright Background */
  --gradient-light-start: #f0f2f5; 
  --gradient-light-end: #f1f5f9;   
  --gradient-light-accent1: rgba(16, 185, 129, 0.08); 
  --gradient-light-accent2: rgba(59, 130, 246, 0.06); 
  
  --gradient-dark-start: #020618;
  --gradient-dark-end: #020618;
  --gradient-dark-accent1: rgba(0, 220, 130, 0.08); 
  --gradient-dark-accent2: rgba(56, 189, 248, 0.04); 
}

:root.dark {
  background-color: #020618;
}

* {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* 避免特定素的过渡效果 */
img,
button,
.transition-none {
  transition: none !important;
}

/* 只针对图标链接的样式 */
.icon-link > svg {
  animation: none !important;
  transform: none !important;
  background: none !important;
}

/* 确保渐变效果不被其他样式覆盖 */
.bg-gradient-to-br {
  background-image: linear-gradient(
    to bottom right,
    var(--tw-gradient-stops)
  ) !important;
}

.category-move, /* 应用于移动中的元素 */
.category-enter-active,
.category-leave-active {
  transition: all 0.5s ease;
}

.category-enter-from,
.category-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* 确保离的项目不会影响布局 */
.category-leave-active {
  position: absolute;
}

/* 优化移动动画的持续间 */
.animate__fadeIn {
  --animate-duration: 0.2s;
}

/* 优化动画持续时间 */
.animate__animated {
  --animate-duration: 0.5s;
  --animate-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.animate__faster {
  --animate-duration: 0.3s;
}

/* 确保动画不会影响性能 */
@media (prefers-reduced-motion: reduce) {
  .animate__animated {
    animation: none !important;
  }
}

/* 自定义动画持续时间 */
.animate__duration-200 {
  --animate-duration: 0.2s;
}

.animate__duration-300 {
  --animate-duration: 0.3s;
}

/* 添加交错动画延迟 */
.animate__delay-1 {
  --animate-delay: 0.1s;
}

.animate__delay-2 {
  --animate-delay: 0.2s;
}

/* 自定义淡入上移动画 */
@keyframes smoothFadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate__smoothFadeInUp {
  animation-name: smoothFadeInUp;
}

/* 自定义淡动画 */
@keyframes smoothFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate__smoothFadeIn {
  animation-name: smoothFadeIn;
}

/* 添加动态光晕效果 */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 更新卡片样式 */
.bg-white\/30 {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .bg-gray-900\/30 {
  backdrop-filter: blur(12px);
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

@keyframes dance {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-12px) scale(1.1);
  }
  50% {
    transform: translateY(4px) scale(0.9);
  }
  75% {
    transform: translateY(-6px) scale(1.05);
  }
}

@keyframes dot {
  0%, 20% {
    opacity: 0;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-4px);
  }
  60% {
    opacity: 1;
    transform: translateY(0);
  }
  80%, 100% {
    opacity: 0;
    transform: translateY(0);
  }
}

@keyframes glow {
  0%, 100% {
    opacity: 1;
    filter: brightness(1);
  }
  50% {
    opacity: 0.7;
    filter: brightness(0.8);
  }
}

/* 替换原有的加载点样式 */
.w-3.h-3 {
  background: linear-gradient(to right, var(--dot-color-start), var(--dot-color-end));
  animation: dance 1.5s ease-in-out infinite var(--delay), glow 1.5s ease-in-out infinite;
}

/* 为每个点设置不同的渐变色 */
.w-3.h-3:nth-child(1) {
  --dot-color-start: #3b82f6;
  --dot-color-end: #60a5fa;
  --delay: 0s;
}

.w-3.h-3:nth-child(2) {
  --dot-color-start: #ec4899;
  --dot-color-end: #f472b6;
  --delay: 0.1s;
}

.w-3.h-3:nth-child(3) {
  --dot-color-start: #8b5cf6;
  --dot-color-end: #a78bfa;
  --delay: 0.2s;
}

.w-3.h-3:nth-child(4) {
  --dot-color-start: #10b981;
  --dot-color-end: #34d399;
  --delay: 0.3s;
}

.w-3.h-3:nth-child(5) {
  --dot-color-start: #f97316;
  --dot-color-end: #fb923c;
  --delay: 0.4s;
}

/* 修改 glow 动画以实现更平滑的渐变效果 */
@keyframes glow {
  0%, 100% {
    opacity: 1;
    filter: brightness(1);
  }
  50% {
    opacity: 0.7;
    filter: brightness(0.8);
  }
}

/* 更新 dance 动画使其更流畅 */
@keyframes dance {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-12px) scale(1.1);
  }
  50% {
    transform: translateY(4px) scale(0.9);
  }
  75% {
    transform: translateY(-6px) scale(1.05);
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background-size: 200% auto;
  animation: gradient 3s linear infinite;
}

/* 添加渐变动画 */
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-gradient {
  animation: gradient 3s linear infinite;
}

/* 优化分页组件样式 */
.inline-flex {
  display: inline-flex;
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

/* 添加分页按钮的激活状态样式 */
@media (hover: none) {
  .pagination-button:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

/* 优化省略号的显示 */
.ellipsis {
  @apply text-gray-400 dark:text-gray-600 font-medium select-none;
}
</style>
