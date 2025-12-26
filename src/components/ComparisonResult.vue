<template>
  <TransitionRoot appear :show="isOpen" as="div">
    <!-- 加载状态指示器 -->
    <div v-if="isLoading" 
         class="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[60]">
      <div class="flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-xl rounded-2xl">
        <div class="animate-spin rounded-full h-12 w-12 border-4 
                    border-blue-500/30 border-t-blue-500"></div>
        <span class="text-sm text-white/90 font-medium">正在加载比较数据...</span>
      </div>
    </div>

    <Dialog as="div" class="relative z-50" :open="isOpen" @close="handleMainDialogClose">
      <div class="fixed inset-0">
        <TransitionChild
          as="div"
          enter="ease-out duration-100"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-100"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50" />
        </TransitionChild>
      </div>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="div"
            enter="ease-out duration-100"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-100"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel 
              @click.stop
              @mousedown.stop
              @mouseup.stop
              @pointerdown.stop
              @pointerup.stop
              class="relative transform overflow-hidden rounded-lg 
                     bg-white/90 dark:bg-gray-800/90 backdrop-blur 
                     text-left shadow-level3 transition-all duration-100 w-full max-w-6xl
                     border border-gray-200/50 dark:border-gray-700/30"
            >
              <!-- 标题栏 -->
              <div class="flex items-center justify-between px-8 py-6 
                          border-b border-gray-200/50 dark:border-gray-600/30
                          bg-white/30 dark:bg-gray-800/50 backdrop-blur-sm">
                <DialogTitle as="h3" class="text-2xl font-bold bg-gradient-to-r 
                                    from-blue-600 to-blue-400 
                                    dark:from-blue-400 dark:to-blue-300 
                                    bg-clip-text text-transparent">
                  软件对比分析
                </DialogTitle>
                <div class="flex items-center gap-2">
                  <!-- 全尺寸极简：仅保留右侧“更多”菜单（分享/管理/视图切换均在菜单中） -->

                  <!-- sm~lg：精简为仅保留“更多”菜单（不再显示图标按钮） -->

                  <!-- <sm: 使用更多菜单收纳动作 -->
                  <Menu as="div" class="relative">
                    <MenuButton
                      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="更多操作"
                    >
                      <MoreVertical class="w-5 h-5" />
                    </MenuButton>
                    <MenuItems
                      class="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 focus:outline-none z-10"
                    >
                        <div class="py-1">
                          <!-- 分享/管理：所有尺寸均放入菜单 -->
                          <MenuItem v-if="comparedSoftwares.length" v-slot="{ active }">
                            <button
                              @click="generateShareImage"
                              :class="[active ? 'bg-gray-100 dark:bg-gray-700' : '', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2']"
                            >
                              <Image class="w-4 h-4" /> 分享预览
                            </button>
                          </MenuItem>
                          <MenuItem v-if="canEdit" v-slot="{ active }">
                            <button
                              @click="$emit('edit')"
                              :class="[active ? 'bg-gray-100 dark:bg-gray-700' : '', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2']"
                            >
                              <Settings class="w-4 h-4" /> 管理比较
                            </button>
                          </MenuItem>
                          <div class="my-1 h-px bg-gray-100 dark:bg-gray-700"></div>
                          <!-- 视图模式：单个开关项（更极简） -->
                          <MenuItem v-slot="{ active }">
                            <button @click="toggleViewMode" :class="[active ? 'bg-gray-100 dark:bg-gray-700' : '', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
                              <component :is="viewMode==='hidden' ? Eye : EyeOff" class="w-4 h-4" />
                              <span>{{ viewMode === 'hidden' ? '显示详情' : '隐藏详情' }}</span>
                              <span class="sr-only">切换显示详情</span>
                              <span class="ml-auto inline-flex items-center">
                                <span
                                  class="relative inline-flex items-center w-9 h-5 rounded-full transition-colors"
                                  :class="viewMode==='full' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
                                  aria-hidden="true"
                                >
                                  <span
                                    class="inline-block w-4 h-4 bg-white rounded-full transform transition-transform translate-x-0"
                                    :class="viewMode==='full' ? 'translate-x-4' : 'translate-x-0'"
                                  ></span>
                                </span>
                              </span>
                            </button>
                          </MenuItem>
                        </div>
                    </MenuItems>
                  </Menu>

                  <!-- 关闭按钮始终可见 -->
                  <button
                    @click="$emit('update:isOpen', false)"
                    class="p-2 rounded-lg transition-all duration-200 
                           text-gray-600 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 
                           hover:text-gray-900 dark:hover:text-white
                           focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                    aria-label="关闭"
                    title="关闭"
                  >
                    <X class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- 内容区域 -->
              <div class="p-8">
                <!-- 空状态 -->
                <div v-if="!comparedSoftwares.length" 
                     class="flex flex-col items-center justify-center py-16 text-center">
                  <div class="w-28 h-28 mb-8 rounded-full bg-gradient-to-br 
                              from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 
                              flex items-center justify-center animate-float">
                    <div class="relative">
                      <FileSearch class="w-14 h-14 text-blue-500 dark:text-blue-400" />
                      <div class="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 dark:bg-blue-800 
                                  rounded-full flex items-center justify-center">
                        <Plus class="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-3
                             bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300
                             bg-clip-text text-transparent">
                    暂无比较信息
                  </h3>
                  <p
                    v-if="canEdit"
                    class="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed"
                  >
                    目前还没有与 "{{ software.name }}" 的比较信息，点击下方按钮开始创建比较。
                  </p>
                  <button
                    v-if="canEdit"
                    @click="$emit('edit')"
                    class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 
                           hover:from-blue-700 hover:to-blue-600
                           text-white rounded-xl transition-all duration-300
                           flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20"
                  >
                    <Plus class="w-5 h-5" />
                    创建比较
                  </button>
                </div>

                <!-- 比较表格 -->
                <template v-else>
                  <!-- 顶部信息卡与内容视觉衔接：增加渐变过渡与边角呼应 -->
                  <div class="overflow-x-auto rounded-t-xl border border-b-0 border-gray-200/50 dark:border-gray-700/30 bg-white/60 dark:bg-gray-800/40">
                    <table class="w-full">
                      <thead>
                        <tr class="bg-gray-50/50 dark:bg-gray-800/50">
                          <th class="p-5 text-left font-medium text-gray-600 dark:text-gray-400 w-[120px]">
                            <span class="whitespace-nowrap">对比项目</span>
                          </th>
                          <!-- 所有软件的表头 -->
                          <th v-for="sw in [software, ...comparedSoftwares]" :key="sw.id" 
                              class="p-5 text-left min-w-[220px]">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                                  <img :src="sw.icon" :alt="sw.name" 
                                       class="w-full h-full object-cover">
                                </div>
                                <div class="flex flex-col">
                                  <span class="font-semibold text-gray-900 dark:text-white">
                                    {{ sw.name }}
                                  </span>
                                  <!-- 添加网址跳转按钮 -->
                                  <button
                                    v-if="sw.website"
                                    @click="openWebsite(sw.website)"
                                    class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 
                                           dark:hover:text-blue-300 flex items-center gap-1 mt-1 icon-link"
                                  >
                                    <ExternalLink class="w-3 h-3 icon-link" />
                                    <span>访问官网</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- 授权类型 -->
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                          <td class="p-4 text-gray-600 dark:text-gray-400">
                            <span class="whitespace-nowrap">授权类型</span>
                          </td>
                          <td v-for="sw in [software, ...comparedSoftwares]" :key="sw.id" class="p-4">
                            <span class="px-3 py-1 rounded-full text-xs"
                                  :class="{
                                    'bg-cyan-100/70 dark:bg-cyan-900/70 text-cyan-700 dark:text-cyan-200 border-cyan-200/50 dark:border-cyan-700/50': sw.license === '免费',
                                    'bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50': sw.license === '收费',
                                    'bg-green-100/50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-700/50': sw.license === '开源',
                                    'bg-purple-100/50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/50': sw.license === '已购'
                                  }">
                              {{ sw.license }}
                            </span>
                          </td>
                        </tr>
                        <!-- 支持系统 -->
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                          <td class="p-4 text-gray-600 dark:text-gray-400">
                            <span class="whitespace-nowrap">支持系统</span>
                          </td>
                          <td v-for="sw in [software, ...comparedSoftwares]" :key="sw.id" class="p-4">
                            <div class="flex gap-1">
                              <div v-for="sys in sw.systems" :key="sys"
                                   class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">
                                {{ sys }}
                              </div>
                            </div>
                          </td>
                        </tr>
                        <!-- 优点 -->
                        <tr v-if="viewMode !== 'hidden'" class="border-b border-gray-200 dark:border-gray-700">
                          <td class="p-4 text-gray-600 dark:text-gray-400">
                            <span class="whitespace-nowrap">优点</span>
                          </td>
                          <td v-for="sw in [software, ...comparedSoftwares]" :key="sw.id" class="p-4">
                            <div class="relative">
                              <!-- 内容容器 -->
                              <div class="space-y-2">
                                <template v-if="getVisiblePros(sw).length">
                                  <div v-for="(pro, index) in getVisiblePros(sw)" :key="index" 
                                     class="flex items-start gap-2 text-sm leading-relaxed">
                                  <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0"></div>
                                  <span class="text-gray-700 dark:text-gray-300">{{ pro }}</span>
                                  </div>
                                </template>
                                <template v-else>
                                  <div class="text-xs text-gray-400 dark:text-gray-500">暂无独有优势</div>
                                </template>
                              </div>
                              
                              <!-- 移除遮罩与展开按钮，始终全部显示 -->
                            </div>
                          </td>
                        </tr>
                        <!-- 缺点 -->
                        <tr v-if="viewMode !== 'hidden'" class="border-b border-gray-200 dark:border-gray-700">
                          <td class="p-4 text-gray-600 dark:text-gray-400">
                            <span class="whitespace-nowrap">缺点</span>
                          </td>
                          <td v-for="sw in [software, ...comparedSoftwares]" :key="sw.id" class="p-4">
                            <div class="relative">
                              <!-- 修改内容容器，确保正确处理长文本 -->
                              <div class="space-y-2">
                                <template v-if="getVisibleCons(sw).length">
                                  <div v-for="(con, index) in getVisibleCons(sw)" :key="index" 
                                     class="flex items-start gap-2 text-sm leading-relaxed">
                                  <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 flex-shrink-0"></div>
                                  <span class="text-gray-700 dark:text-gray-300">{{ con }}</span>
                                  </div>
                                </template>
                                <template v-else>
                                  <div class="text-xs text-gray-400 dark:text-gray-500">暂无独有短板</div>
                                </template>
                              </div>
                              
                              <!-- 移除遮罩与展开按钮，始终全部显示 -->
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 综合分析：与上方表格做“卡片一体化” -->
                  <div class="px-6 pt-2 pb-6 bg-gradient-to-br from-blue-50/70 to-blue-100/70 
                              dark:from-blue-900/20 dark:to-blue-800/20 
                              rounded-b-xl border border-t-0 border-blue-100 dark:border-blue-800/30">
                    <div class="prose prose-blue dark:prose-invert max-w-none">
                      <div v-html="renderedSummary" class="markdown-content"></div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- 统一分享预览组件 -->
              <ShareCardPreview
                v-model:is-open="showSharePreview"
                mode="comparison"
                :comparison="{ softwares: [software, ...comparedSoftwares], recommendationLines: recommendationLinesForShare, summaryHtml: renderedSummaryForShare }"
                default-theme="classic"
                :default-show-website="false"
                :default-show-systems="false"
              />

            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { X, Settings, Plus, FileSearch, ExternalLink, MoreVertical, Image, Eye, EyeOff, Check } from 'lucide-vue-next'
import { comparisonService } from '../services/comparison'
import type { Software } from '../types'
import { isSignedIn } from '../lib/clerk'
import MarkdownIt from 'markdown-it'
import logger from '../utils/logger'
import { getIconUrl } from '../services/localIconCache'
import ShareCardPreview from './ShareCardPreview.vue'
// @ts-ignore: html-to-image has no bundled types in our setup
import { toPng } from 'html-to-image'

const props = defineProps<{
  isOpen: boolean
  software: Software
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'edit': []
  'error': [message: string]
}>()

const canEdit = computed(() => isSignedIn.value)
const isLoading = ref(false)
const comparedSoftwares = ref<Software[]>([])
const comparisonSummary = ref('')
// 展开/收起逻辑已移除
const showSharePreview = ref(false)
const selectedTheme = ref<'classic' | 'dark' | 'gradient'>('classic')
const sharePreviewRef = ref<HTMLElement | null>(null)
const shareExportRef = ref<HTMLElement | null>(null)
const allSoftwareNames = computed(() => [props.software, ...comparedSoftwares.value].map(s => s.name))

// 视图模式：完整/隐藏
type ViewMode = 'full' | 'hidden'
const VIEW_MODE_KEY = 'comparison:viewMode'
const viewMode = ref<ViewMode>('full')
const setViewMode = (mode: ViewMode) => {
  viewMode.value = mode
  try { localStorage.setItem(VIEW_MODE_KEY, mode) } catch {}
}
const toggleViewMode = () => setViewMode(viewMode.value === 'hidden' ? 'full' : 'hidden')
// 初始化视图模式
try {
  const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null
  if (saved === 'full' || saved === 'hidden') viewMode.value = saved
  else if (saved === 'diff') viewMode.value = 'full'
} catch {}

const md = new MarkdownIt({
  html: false, // 禁用HTML标签以防止XSS
  breaks: true, // 转换换行符为 <br>
  linkify: true // 自动转换URL为链接
})

// 修改加载比较数据的方法，使用 comparisonService 而不是直接使用 supabase
const loadComparisons = async () => {
  try {
    isLoading.value = true
    if (!props.software?.id) return

    // 使用 comparisonService 获取比较数据
    const comparisons = await comparisonService.getComparisons(props.software.id)
    comparedSoftwares.value = comparisons

    // 如果有比较数据，获取第一个组的分析内容
    if (comparisons.length > 0 && comparisons[0].groupInfo?.id) {
      const analysis = await comparisonService.getComparisonAnalysis(comparisons[0].groupInfo.id)
      comparisonSummary.value = analysis || ''
    }

  } catch (error) {
    logger.error('加载比较数据失败:', error)
    emit('error', '加载比较数据失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// 不再需要切换展开/收起

// 添加网址跳转方法
const openWebsite = (url: string) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// 添加计算属性来处理Markdown
const renderedSummary = computed(() => {
  return comparisonSummary.value 
    ? md.render(comparisonSummary.value)
    : '暂无综合分析'
})

// 分享卡片用：过滤掉“对比要点/要点/关键点”整段（从该标题或段落开始到下一个标题为止），避免重复
const renderedSummaryForShare = computed(() => {
  if (!comparisonSummary.value) return '暂无综合分析'

  const removeKeypointSections = (mdText: string): string => {
    const lines = mdText.split(/\r?\n/)
    const out: string[] = []
    const isHeading = (line: string) => /^\s*#{1,6}\s+/.test(line)
    const normalize = (line: string) => line.trim().replace(/^[-*·•]\s*/, '')
    const isTargetTitle = (text: string) => /^(对比要点|要点|关键点|选择建议|建议|最终建议)\s*[:：]?\s*$/i.test(text)

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      const norm = normalize(isHeading(line) ? line.replace(/^\s*#{1,6}\s+/, '') : line)
      if (isTargetTitle(norm)) {
        // 跳过该段落，直到遇到下一个标题或文本结束
        i++
        while (i < lines.length && !isHeading(lines[i])) i++
        continue
      }
      out.push(line)
      i++
    }
    return out.join('\n')
  }

  const filtered = removeKeypointSections(comparisonSummary.value)
  return md.render(filtered)
})

// 从 Markdown 摘取“选择建议”段落（忽略标题等格式），做简单条目化
const recommendationLinesForShare = computed(() => {
  if (!comparisonSummary.value) return [] as string[]
  let text = comparisonSummary.value
  // 去掉 ** 粗体标记，避免出现 **
  text = text.replace(/\*\*(.*?)\*\*/g, '$1')
  const lines = text.split(/\r?\n/)
  const result: string[] = []
  let capturing = false
  let startLevel = 0

  const isHeading = (line: string) => /^\s*(#{1,6})\s+/.test(line)
  const headingLevel = (line: string) => (line.match(/^\s*(#{1,6})\s+/)?.[1].length ?? 0)
  const isRecTitle = (txt: string) => /^(选择建议|建议|最终建议)\s*[:：]?\s*$/i.test(txt.trim())

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!capturing) {
      if (isHeading(line)) {
        const title = line.replace(/^\s*#{1,6}\s+/, '')
        if (isRecTitle(title)) {
          capturing = true
          startLevel = headingLevel(line)
        }
      } else if (isRecTitle(line)) {
        capturing = true
        startLevel = 0
      }
    } else {
      if (isHeading(line)) {
        const level = headingLevel(line)
        if (startLevel === 0 || level <= startLevel) break
      }
      const content = line.trim()
      if (!content) continue
      // 去掉列表前缀
      const clean = content.replace(/^[-*·\u2022]\s*/, '')
      result.push(clean)
    }
  }
  return result
})

// 将文本按软件名切分，便于高亮（简单匹配）
type Token = { type: 'text' | 'name'; value: string }
const tokenizeByNames = (line: string): Token[] => {
  const names = allSoftwareNames.value.filter(Boolean).sort((a, b) => b.length - a.length)
  if (names.length === 0) return [{ type: 'text', value: line }]
  let remaining = line
  const tokens: Token[] = []
  while (remaining.length) {
    let matched = false
    for (const name of names) {
      const idx = remaining.indexOf(name)
      if (idx === 0) {
        tokens.push({ type: 'name', value: name })
        remaining = remaining.slice(name.length)
        matched = true
        break
      } else if (idx > 0) {
        tokens.push({ type: 'text', value: remaining.slice(0, idx) })
        tokens.push({ type: 'name', value: name })
        remaining = remaining.slice(idx + name.length)
        matched = true
        break
      }
    }
    if (!matched) {
      tokens.push({ type: 'text', value: remaining })
      break
    }
  }
  return tokens
}

onMounted(() => {
  if (props.isOpen) {
    loadComparisons()
  }
})

// 按视图模式返回可见的优/缺点（仅完整/隐藏两种）
const getVisiblePros = (sw: Software): string[] => {
  const list = (sw.pros || [])
  if (viewMode.value === 'hidden') return []
  return list
}

const getVisibleCons = (sw: Software): string[] => {
  const list = (sw.cons || [])
  if (viewMode.value === 'hidden') return []
  return list
}

// 统一处理主弹窗关闭：若预览打开，先关闭预览
const handleMainDialogClose = () => {
  if (showSharePreview.value) {
    showSharePreview.value = false
    return
  }
  emit('update:isOpen', false)
}

// 分享图片：打开预览
const generateShareImage = async () => {
  showSharePreview.value = true
}

// 资源就绪（字体 + 图片）
const ensureAssetsReady = async (el: HTMLElement) => {
  try {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready
    }
  } catch {}
  const imgs = Array.from(el.querySelectorAll('img'))
    .filter(img => !img.complete)
  if (imgs.length) {
    await Promise.all(imgs.map(img => new Promise<void>(res => {
      img.onload = () => res()
      img.onerror = () => res()
    })))
  }
}

// 分享图片：使用 html-to-image 导出，优先使用“专用导出容器”
const saveSharePreviewImage = async () => {
  try {
    const el = (shareExportRef.value || sharePreviewRef.value) as HTMLElement | null
    if (!el) return
    await ensureAssetsReady(el)
    const dataUrl = await toPng(el, {
      cacheBust: true,
      pixelRatio: Math.max(2, window.devicePixelRatio || 1),
      style: { transform: 'none', zoom: '1' }
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${props.software.name}-对比分析.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) {
    logger.error('生成分享图片失败:', err)
  }
}
</script>

<style scoped>
.border-4 {
  border-width: 4px;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* 添加Markdown样式 */
.markdown-content {
  @apply text-gray-700 dark:text-gray-300;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  @apply font-semibold text-gray-900 dark:text-white my-4;
}

.markdown-content p {
  @apply my-3;
}

.markdown-content ul,
.markdown-content ol {
  @apply pl-6 my-3;
}

.markdown-content ul {
  @apply list-disc;
}

.markdown-content ol {
  @apply list-decimal;
}

.markdown-content a {
  @apply text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300;
}

.markdown-content code {
  @apply bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm;
}

.markdown-content pre code {
  @apply block p-4 my-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto;
}

.markdown-content blockquote {
  @apply border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic;
}
</style> 