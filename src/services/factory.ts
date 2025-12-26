import { aiService } from './ai'
import { softwareService } from './software'
import { comparisonService } from './comparison'
import type { AIService, SoftwareService, ComparisonService } from '../types/services'

export const serviceFactory = {
  getAIService(): AIService {
    return aiService
  },

  getSoftwareService(): SoftwareService {
    return softwareService
  },

  getComparisonService(): ComparisonService {
    return comparisonService
  }
}

// 导出服务实例
export const services = {
  ai: serviceFactory.getAIService(),
  software: serviceFactory.getSoftwareService(),
  comparison: serviceFactory.getComparisonService()
} 