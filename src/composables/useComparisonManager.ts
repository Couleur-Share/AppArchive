import { ref, watch, computed, toValue, type Ref } from 'vue'
import { debounce } from 'lodash-es'
import type { Software, LicenseType } from '../types'
import type { ComparisonGroup, ComparisonTarget } from '../types/comparison'
import { comparisonService } from '../services/comparison'
import { aiService } from '../services/ai'
import { cacheService } from '../services/cache'
import { useToast } from './useToast'
import logger from '../utils/logger'

// 类型移动到 src/types/comparison.ts

export function useComparisonManager(baseSoftware: Ref<Software | null | undefined>) {
  const comparableSoftware = ref<Software[]>([])
  const selectedComparisons = ref<ComparisonTarget[]>([])
  const isLoading = ref(false)
  const loadingText = ref('加载数据...')

  const summary = ref('')
  const savingState = ref<'saving' | 'saved' | 'error' | null>(null)
  const isSaving = ref(false)
  const isHydratingSummary = ref(false)
  const isAnalyzing = ref(false)
  // 记录初始加载的 summary 值，用于判断是否有实际修改
  const initialSummary = ref('')

  const { showToast } = useToast()

  const debouncedSaveSummary = debounce(async (content: string) => {
    try {
      if (selectedComparisons.value.length === 0) {
        logger.warn('没有选中的比较组')
        return
      }
      const groupId = selectedComparisons.value[0].group?.id
      if (!groupId) {
        logger.warn('比较组 ID 无效')
        return
      }
      savingState.value = 'saving'
      isSaving.value = true
      await comparisonService.updateComparisonSummary(groupId, content)
      savingState.value = 'saved'
      // 保存成功后，更新初始值，避免重复显示"已保存"
      initialSummary.value = content
      setTimeout(() => {
        if (savingState.value === 'saved') savingState.value = null
      }, 3000)
    } catch (error) {
      logger.error('保存失败:', error)
      savingState.value = 'error'
    } finally {
      isSaving.value = false
    }
  }, 500)

  const flushDebouncedSave = () => {
    const maybe = debouncedSaveSummary as unknown as { flush?: () => void }
    maybe.flush?.()
  }

  // 监听 summary 改变自动保存（只有在用户真正修改时才保存）
  watch(summary, (newValue) => {
    // 如果正在加载初始内容，不触发保存
    if (isHydratingSummary.value) return
    // 如果内容与初始值相同，说明没有实际修改，不触发保存
    if (newValue === initialSummary.value) return
    // 只有在内容真正发生变化时才保存
    debouncedSaveSummary(newValue)
  })

  const loadComparableSoftware = async () => {
    const software = toValue(baseSoftware)
    if (!software?.id) {
      logger.warn('软件ID无效')
      comparableSoftware.value = []
      return
    }
    try {
      isLoading.value = true
      loadingText.value = '加载可比较软件...'
      const data = await comparisonService.getComparableSoftware(software.id)
      comparableSoftware.value = data
    } catch (error) {
      logger.error('加载可比较软件失败:', error)
      comparableSoftware.value = []
      showToast('加载可比较软件失败，请重试', 'error')
    } finally {
      isLoading.value = false
      loadingText.value = '加载数据...'
    }
  }

  const loadExistingComparisons = async () => {
    const software = toValue(baseSoftware)
    try {
      isLoading.value = true
      loadingText.value = '加载现有比较...'
      const comparisons = await comparisonService.getComparisons(software?.id || 0)
      selectedComparisons.value = comparisons
        .map((item) => {
          try {
            if (!item || !(item as any).groupInfo) {
              logger.warn('数据不完整:', item)
              return null
            }
            const groupInfo = (item as any).groupInfo as ComparisonGroup
            return {
              id: item.id,
              target_id: item.id,
              group_id: groupInfo.id,
              created_at: (item as any).created_at,
              target: {
                id: item.id,
                name: item.name,
                category: item.category,
                description: item.description,
                icon: item.icon,
                website: item.website,
                license: item.license as LicenseType,
                systems: (item as any).systems || [],
                pros: (item as any).pros || [],
                cons: (item as any).cons || [],
                created_at: (item as any).created_at
              },
              group: {
                id: groupInfo.id,
                name: groupInfo.name,
                description: groupInfo.description || '',
                created_at: groupInfo.created_at,
                updated_at: groupInfo.updated_at || groupInfo.created_at
              }
            } as ComparisonTarget
          } catch (error) {
            logger.warn('映射数据失败:', error)
            return null
          }
        })
        .filter((x): x is ComparisonTarget => x !== null)
    } catch (error) {
      logger.error('加载现有比较失败:', error)
      selectedComparisons.value = []
      showToast('加载比较关系失败', 'error')
    } finally {
      isLoading.value = false
      loadingText.value = '加载数据...'
    }
  }

  const loadAnalysisContent = async () => {
    try {
      if (selectedComparisons.value.length === 0) {
        logger.debug('没有选中的比较组')
        summary.value = ''
        initialSummary.value = ''
        return
      }
      const groupId = selectedComparisons.value[0].group?.id
      if (!groupId) {
        logger.debug('比较组 ID 无效')
        summary.value = ''
        initialSummary.value = ''
        return
      }
      isHydratingSummary.value = true
      try {
        const content = await comparisonService.getComparisonAnalysis(groupId)
        const loadedContent = content ?? ''
        summary.value = loadedContent
        // 记录初始值，用于后续判断是否有修改
        initialSummary.value = loadedContent
      } catch (error: any) {
        logger.error('加载分析内容:', error)
        summary.value = ''
        initialSummary.value = ''
      } finally {
        isHydratingSummary.value = false
      }
    } catch (error) {
      logger.error('加载分析内容失败:', error)
      summary.value = ''
      initialSummary.value = ''
      showToast('加载分析内容失败', 'error')
    }
  }

  const toggleComparison = async (software: Software) => {
    try {
      isLoading.value = true
      loadingText.value = '更新比较关系...'

      const existing = selectedComparisons.value.find(c => c.target_id === software.id)
      const base = toValue(baseSoftware) as Software
      if (existing) {
        const groupId = existing.group?.id
        if (groupId) {
          await comparisonService.removeSoftwareFromGroup(groupId, existing.target_id)
          selectedComparisons.value = selectedComparisons.value.filter(c => c.id !== existing.id)
          showToast('已移除比较关系', 'success')
        }
      } else {
        // 复用策略：优先使用名称包含基准软件名的组；否则选择最近更新的组；若都没有，创建新组
        const ensureBaseInGroup = async (gid: number) => {
          const members = await comparisonService.getGroupSoftwares(gid)
          if (!members.some((s) => s.id === base.id)) {
            await comparisonService.addSoftwareToGroup(gid, base.id)
          }
        }

        const pickReusableGroupId = async (): Promise<number | null> => {
          const groups = await comparisonService.getComparisonGroups()
          if (!groups || groups.length === 0) return null
          // 名称包含基准名的组优先
          const nameMatched = groups.find(g => g.name?.includes(base.name))
          if (nameMatched) return nameMatched.id
          // 其次选择最近更新的组
          const sorted = [...groups].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
          return sorted[0]?.id ?? null
        }

        // 分支策略：
        // - 若当前会话还未选择任何比较项（selectedComparisons 为空），默认新建一个全新的组，避免误复用上一次的比较组
        // - 若已存在选中项，则沿用当前组；若当前组缺失时再尝试复用策略
        let groupId = selectedComparisons.value[0]?.group?.id ?? null
        if (!groupId) {
          if (selectedComparisons.value.length === 0) {
            const group = await comparisonService.createComparisonGroup(
              `${base.name} 对比组`,
              `比较 ${base.name} 和其他软件的异同`
            )
            groupId = group.id
          } else {
            groupId = await pickReusableGroupId()
            if (!groupId) {
              const group = await comparisonService.createComparisonGroup(
                `${base.name} 对比组`,
                `比较 ${base.name} 和其他软件的异同`
              )
              groupId = group.id
            }
          }
        }

        await ensureBaseInGroup(groupId)

        // 避免重复添加
        const members = await comparisonService.getGroupSoftwares(groupId)
        if (members.some((s) => s.id === software.id)) {
          showToast('该软件已在当前比较组中', 'info')
        } else {
          await comparisonService.addSoftwareToGroup(groupId, software.id)
          showToast('已添加比较关系', 'success')
        }
        await loadExistingComparisons()
      }
    } catch (error) {
      logger.error('切换比较关系失败:', error)
      showToast(error instanceof Error ? error.message : '操作失败，请重试', 'error')
    } finally {
      isLoading.value = false
      loadingText.value = '加载数据...'
    }
  }

  const removeComparison = async (id: number) => {
    try {
      isLoading.value = true
      loadingText.value = '删除比较...'
      const comparison = selectedComparisons.value.find(c => c.id === id)
      if (comparison?.group?.id) {
        await comparisonService.removeSoftwareFromGroup(comparison.group.id, comparison.target_id)
        selectedComparisons.value = selectedComparisons.value.filter(c => c.id !== id)
      }
    } catch (error) {
      logger.error('删除比较失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const startAIAnalysis = async () => {
    const base = toValue(baseSoftware)
    if (!base || selectedComparisons.value.length === 0) {
      showToast('请先选择要比较的软件', 'error')
      return
    }
    try {
      isAnalyzing.value = true
      const softwaresToCompare = [base, ...selectedComparisons.value.map(c => c.target)]
      const softwareIds = softwaresToCompare.map(s => s.id)
      const cached = await cacheService.getComparisonCache(softwareIds)
      if (cached) {
        // 设置 isHydratingSummary 标志，避免触发自动保存
        isHydratingSummary.value = true
        summary.value = cached
        initialSummary.value = cached
        isHydratingSummary.value = false
        // AI 分析的结果需要保存到数据库
        await debouncedSaveSummary(cached)
        showToast('分析完成（来自缓存）', 'success')
        return
      }
      const result = await aiService.generateComparison(softwaresToCompare)
      // 设置 isHydratingSummary 标志，避免触发自动保存
      isHydratingSummary.value = true
      summary.value = result
      initialSummary.value = result
      isHydratingSummary.value = false
      await cacheService.setComparisonCache(softwareIds, result)
      // AI 分析的结果需要保存到数据库
      await debouncedSaveSummary(result)
      showToast('AI 分析完成', 'success')
    } catch (error) {
      logger.error('AI 分析失败:', error)
      showToast(error instanceof Error ? error.message : 'AI 分析失败，请重试', 'error')
    } finally {
      isAnalyzing.value = false
    }
  }

  const initLoad = async () => {
    // 重置保存状态，避免显示错误的"已保存"状态
    savingState.value = null
    // 恢复加载历史比较：若该软件已有比较，则左侧应显示；若没有，则 selectedComparisons 为空
    await Promise.all([loadExistingComparisons(), loadComparableSoftware()])
    await loadAnalysisContent()
  }

  const isSelected = (id: number) => selectedComparisons.value.some(c => c.target_id === id)

  return {
    comparableSoftware,
    selectedComparisons,
    isLoading,
    loadingText,
    summary,
    savingState,
    isSaving,
    isHydratingSummary,
    isAnalyzing,
    // methods
    loadComparableSoftware,
    loadExistingComparisons,
    loadAnalysisContent,
    toggleComparison,
    removeComparison,
    startAIAnalysis,
    initLoad,
    isSelected,
    flushDebouncedSave
  }
}


