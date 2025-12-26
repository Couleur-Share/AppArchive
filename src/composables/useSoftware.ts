import { ref, computed } from 'vue'
import type { Software, LicenseType, SystemType } from '../types'
import { softwareService } from '../services/software'
import { useToast } from './useToast'
import logger from '../utils/logger'

export function useSoftware() {
  const softwares = ref<Software[]>([])
  const isLoading = ref(false)
  const { showToast } = useToast()

  const fetchSoftwares = async () => {
    try {
      isLoading.value = true
      logger.debug('开始加载软件列表...')
      
      const data = await softwareService.getAllSoftware()
      logger.debug('获取到的数据:', data)
      softwares.value = data
      logger.debug('数据加载完成，总数:', data.length)
      
    } catch (error) {
      logger.error('获取数据失败:', error)
      showToast('获取数据失败', 'error')
    } finally {
      isLoading.value = false
    }
  }

  const addSoftware = async (software: Partial<Software>) => {
    try {
      const softwareData = {
        ...software,
        license: software.license as LicenseType,
        systems: (software.systems || []) as SystemType[],
        pros: Array.isArray(software.pros) ? software.pros : [],
        cons: Array.isArray(software.cons) ? software.cons : []
      }

      await softwareService.addSoftware(softwareData)
      showToast('添加成功', 'success')
      await fetchSoftwares()
    } catch (error) {
      logger.error('添加软件失败:', error)
      showToast(error instanceof Error ? error.message : '添加失败', 'error')
      throw error
    }
  }

  const updateSoftware = async (id: number, software: Partial<Software>) => {
    try {
      const softwareData = {
        ...software,
        license: software.license as LicenseType,
        systems: (software.systems || []) as SystemType[],
        pros: Array.isArray(software.pros) ? software.pros : [],
        cons: Array.isArray(software.cons) ? software.cons : []
      }

      await softwareService.updateSoftware(id, softwareData)
      showToast('更新成功', 'success')
      await fetchSoftwares()
    } catch (error) {
      logger.error('更新软件失败:', error)
      showToast(error instanceof Error ? error.message : '更新失败', 'error')
      throw error
    }
  }

  const deleteSoftware = async (id: number) => {
    try {
      await softwareService.deleteSoftware(id)
      showToast('删除成功', 'success')
      await fetchSoftwares()
    } catch (error) {
      logger.error('删除软件失败:', error)
      showToast(error instanceof Error ? error.message : '删除失败', 'error')
      throw error
    }
  }

  return {
    softwares,
    isLoading,
    fetchSoftwares,
    addSoftware,
    updateSoftware,
    deleteSoftware
  }
} 