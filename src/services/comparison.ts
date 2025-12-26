import type { Software } from '../types'
import { isSignedIn } from '../lib/clerk'
import logger from '../utils/logger'
import { getAuthHeaders } from './auth'
import { getApiBase } from './apiBase'

const API_BASE_URL = getApiBase()

// HTTP请求辅助函数
const apiRequest = async (endpoint: string, options: RequestInit = {}, requireAuth = false) => {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(requireAuth ? getAuthHeaders() : {}),
    },
    ...options,
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '网络错误' }))
    throw new Error(errorData.message || errorData.error || '请求失败')
  }
  
  return response.json()
}

interface ComparisonGroup {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface ComparisonTarget {
  id: number
  target_id: number
  group_id: number
  created_at: string
  target: Software
  group: ComparisonGroup
}

interface ComparisonResponse {
  data: ComparisonTarget[] | null
  error: Error | null
}

interface ComparisonAnalysis {
  id: number
  group_id: number
  content: string
  created_at: string
  updated_at: string
}

export const comparisonService = {
  // 创建比较组
  async createComparisonGroup(name: string, description?: string): Promise<ComparisonGroup> {
    if (!isSignedIn.value) {
      throw new Error('请先登录后再进行操作')
    }

    const response = await apiRequest(
      '/comparison/groups',
      {
        method: 'POST',
        body: JSON.stringify({ name, description })
      },
      true
    )
    return response.data
  },

  // 获取比较组列表
  async getComparisonGroups(): Promise<ComparisonGroup[]> {
    const response = await apiRequest('/comparison/groups')
    return response.data
  },

  // 更新比较组
  async updateComparisonGroup(
    id: number, 
    updates: Partial<Pick<ComparisonGroup, 'name' | 'description'>>
  ): Promise<ComparisonGroup> {
    if (!isSignedIn.value) {
      throw new Error('请先登录后再进行操作')
    }

    const response = await apiRequest(
      `/comparison/groups/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates)
      },
      true
    )
    return response.data
  },

  // 删除比较组
  async deleteComparisonGroup(id: number): Promise<void> {
    if (!isSignedIn.value) {
      throw new Error('请先登录后再进行操作')
    }
    
    await apiRequest(
      `/comparison/groups/${id}`,
      {
        method: 'DELETE'
      },
      true
    )
  },

  // 向比较组添加软件
  async addSoftwareToGroup(groupId: number, softwareId: number): Promise<void> {
    if (!isSignedIn.value) {
      throw new Error('请先登录后再进行操作')
    }
    
    await apiRequest(
      `/comparison/groups/${groupId}/software/${softwareId}`,
      {
        method: 'POST'
      },
      true
    )
  },

  // 从比较组移除软件
  async removeSoftwareFromGroup(groupId: number, softwareId: number): Promise<void> {
    if (!isSignedIn.value) {
      throw new Error('请先登录后再进行操作')
    }
    
    await apiRequest(
      `/comparison/groups/${groupId}/software/${softwareId}`,
      {
        method: 'DELETE'
      },
      true
    )
  },

  // 获取比较组中的软件列表
  async getGroupSoftwares(groupId: number): Promise<Software[]> {
    const response = await apiRequest(`/comparison/groups/${groupId}/software`)
    return response.data
  },

  // 保存或更新比较分析
  async saveAnalysis(groupId: number, content: string): Promise<ComparisonAnalysis> {
    if (!isSignedIn.value) {
      throw new Error('请先登录后再进行操作')
    }

    // 这个API还需要在后端实现
    const response = await apiRequest(
      `/comparison/groups/${groupId}/analysis`,
      {
        method: 'POST',
        body: JSON.stringify({ content })
      },
      true
    )
    return response.data
  },

  // 获取比较分析
  async getAnalysis(groupId: number): Promise<ComparisonAnalysis | null> {
    try {
      const response = await apiRequest(`/comparison/groups/${groupId}/analysis`)
      return response.data
    } catch (error) {
      return null
    }
  },

  // 获取软件比较信息
  async getComparisons(softwareId: number): Promise<(Software & { groupInfo: ComparisonGroup })[]> {
    try {
      // 获取包含该软件的所有比较组
      const response = await apiRequest(`/comparison/software/${softwareId}/groups`)
      return response.data || []
    } catch (error) {
      logger.error('获取软件比较信息失败:', error)
      return []
    }
  },

  // 获取比较摘要
  async getComparisonSummary(groupId: number): Promise<{ content: string } | null> {
    try {
      const response = await apiRequest(`/comparison/groups/${groupId}/summary`)
      return response.data
    } catch (error) {
      return null
    }
  },

  // 获取可比较的软件
  async getComparableSoftware(softwareId: number): Promise<Software[]> {
    if (!softwareId) {
      logger.warn('未提供有效的软件ID')
      return []
    }

    try {
      // 获取当前软件信息
      const allSoftware = await apiRequest('/software')
      const currentSoftware = allSoftware.data.find((s: Software) => s.id === softwareId)
      
      if (!currentSoftware) {
        logger.warn('未找到指定的软件')
        return []
      }

      // 返回同类别的其他软件
      return allSoftware.data.filter((s: Software) => 
        s.category === currentSoftware.category && s.id !== softwareId
      ) as Software[]
    } catch (error) {
      logger.error('获取可比较软件时发生错误:', error)
      return []
    }
  },

  // 更新比较分析
  async updateComparisonSummary(groupId: number, content: string): Promise<void> {
    if (!isSignedIn.value) {
      throw new Error('请先登录后再进行操作')
    }
    
    await apiRequest(
      `/comparison/groups/${groupId}/analysis`,
      {
        method: 'PUT',
        body: JSON.stringify({ content })
      },
      true
    )
  },

  // 获取比较分析
  async getComparisonAnalysis(groupId: number): Promise<string> {
    try {
      const response = await apiRequest(`/comparison/groups/${groupId}/analysis`)
      return response.data?.content || ''
    } catch (error) {
      return ''
    }
  }
} 