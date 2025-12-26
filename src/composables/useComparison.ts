import { ref } from 'vue'
import type { Software } from '../types'
import { comparisonService } from '../services/comparison'
import { useToast } from './useToast'
import logger from '../utils/logger'

export function useComparison() {
  const showCompareDialog = ref(false)
  const showCompareResult = ref(false)
  const softwareToCompare = ref<Software | null>(null)
  const softwareComparisons = ref<Record<number, boolean>>({})
  const { showToast } = useToast()

  const loadComparisons = async (softwares: Software[]) => {
    logger.debug('开始加载比较信息...')
    const comparisonsPromises = softwares.map(async software => {
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

  const showSoftwareCompare = (software: Software) => {
    softwareToCompare.value = software
    showCompareResult.value = true
  }

  const handleComparisonEdit = () => {
    showCompareResult.value = false
    showCompareDialog.value = true
  }

  const handleViewResults = () => {
    showCompareDialog.value = false
    showCompareResult.value = true
  }

  const handleComparisonError = (message: string) => {
    showToast(message, 'error')
  }

  return {
    showCompareDialog,
    showCompareResult,
    softwareToCompare,
    softwareComparisons,
    loadComparisons,
    showSoftwareCompare,
    handleComparisonEdit,
    handleViewResults,
    handleComparisonError
  }
} 