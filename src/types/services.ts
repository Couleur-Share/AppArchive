import type { Software, ComparisonGroup, ComparisonAnalysis } from './software'

// AI 服务接口
export interface AIService {
  analyzeSoftware(software: Software): Promise<{ description?: string, pros: string[], cons: string[] }>
  generateComparison(softwares: Software[]): Promise<string>
}

// 软件服务接口
export interface SoftwareService {
  getAllSoftware(): Promise<Software[]>
  addSoftware(data: Partial<Software>): Promise<Software>
  updateSoftware(id: number, data: Partial<Software>): Promise<Software>
  deleteSoftware(id: number): Promise<void>
  searchSoftware(query: string): Promise<Software[]>
  getSoftwareByCategory(category: string): Promise<Software[]>
}

// 比较服务接口
export interface ComparisonService {
  getComparableSoftware(sourceId: number): Promise<Software[]>
  getComparisons(sourceId: number): Promise<ComparisonGroup[]>
  addComparison(sourceId: number, targetId: number): Promise<void>
  updateComparison(groupId: number, content: string): Promise<void>
  deleteComparison(groupId: number): Promise<void>
  getGroupSoftwares(groupId: number): Promise<Software[]>
  saveAnalysis(groupId: number, content: string): Promise<ComparisonAnalysis>
} 