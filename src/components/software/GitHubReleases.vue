<template>
  <div class="space-y-6">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 gap-4">
      <div class="w-10 h-10 border-4 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin"></div>
      <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">正在获取版本信息...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMsg" class="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div class="w-16 h-16 mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle class="w-8 h-8 text-red-400" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">获取失败</h3>
      <p class="text-gray-500 max-w-md text-sm">{{ errorMsg }}</p>
      <button @click="loadReleases" class="mt-4 px-4 py-2 text-sm font-medium text-primary hover:text-[#169c46] hover:bg-primary/10 dark:hover:bg-primary/[0.14] rounded-lg transition-colors">
        重试
      </button>
    </div>

    <!-- 无数据 -->
    <div v-else-if="releases.length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div class="w-16 h-16 mb-6 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center">
        <GitBranch class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">暂无版本发布</h3>
      <p class="text-gray-500 max-w-md text-sm">该仓库尚未发布任何 Release。</p>
    </div>

    <!-- Release 列表 -->
    <template v-else>
      <!-- 顶部信息栏 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <TagBadge size="sm" variant="success" strong>
            <Tag class="w-3.5 h-3.5" />
            {{ latestVersion }}
          </TagBadge>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            共 {{ releases.length }} 个版本
          </span>
          <!-- 缓存/过期提示 -->
          <TagBadge v-if="isStale" size="xs" variant="warning">
            <AlertCircle class="w-3 h-3" /> 缓存数据
          </TagBadge>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="isSignedIn"
            @click="refreshReleases"
            :disabled="isRefreshing"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
            刷新
          </button>
          <a
            :href="`${repoUrl}/releases`"
            target="_blank"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            GitHub
          </a>
        </div>
      </div>

      <!-- 时间线 -->
      <div class="relative">
        <!-- 时间轴线 -->
        <div class="absolute left-[17px] top-3 bottom-3 w-px bg-gray-200 dark:bg-gray-700"></div>

        <div class="space-y-0">
          <div
            v-for="(release, index) in visibleReleases"
            :key="release.tag_name"
            class="relative pl-10"
          >
            <!-- 时间轴圆点 -->
            <div
              class="absolute left-[10px] top-[22px] w-[15px] h-[15px] rounded-full border-2 z-10 transition-colors"
              :class="index === 0
                ? 'bg-primary border-primary dark:bg-primary dark:border-primary shadow-sm shadow-primary/30'
                : release.prerelease
                  ? 'bg-amber-400 border-amber-300 dark:bg-amber-500 dark:border-amber-600'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'"
            />

            <!-- Release 卡片 -->
            <div
              class="group mb-4 p-5 rounded-xl bg-white dark:bg-gray-800 border transition-all duration-200"
              :class="index === 0
                ? 'border-primary/20 dark:border-primary/24 shadow-sm shadow-primary/10'
                : 'border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'"
            >
              <!-- 标题行 -->
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-center flex-wrap gap-2 min-w-0">
                  <span class="font-bold text-gray-900 dark:text-white text-base truncate">
                    {{ release.name || release.tag_name }}
                  </span>
                  <TagBadge
                    size="xs"
                    strong
                    class="shrink-0"
                    :variant="getReleaseVersionVariant(index, release.prerelease)"
                  >
                    {{ release.tag_name }}
                  </TagBadge>
                  <TagBadge v-if="release.prerelease" size="xs" variant="warning">
                    预发布
                  </TagBadge>
                  <TagBadge v-if="index === 0" size="xs" variant="success">
                    最新
                  </TagBadge>
                </div>
                <a
                  :href="release.html_url"
                  target="_blank"
                  class="shrink-0 p-1 rounded text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>

              <!-- 发布时间 -->
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <Clock class="w-3.5 h-3.5" />
                <span>{{ formatDate(release.published_at) }}</span>
                <span v-if="index === 0" class="text-gray-400">·</span>
                <span v-if="index === 0" class="text-primary font-medium">
                  {{ timeAgo(release.published_at) }}
                </span>
              </div>

              <!-- Release 正文（Markdown 渲染，异步管线） -->
              <div v-if="release.body" class="relative">
                <div
                  :class="{ 'max-h-[200px] overflow-hidden': !expandedReleases.has(release.tag_name) && isLongBody(release.body) }"
                >
                  <MarkdownRenderer
                    :source="release.body"
                    :context="markdownContext"
                    container-class="prose prose-sm prose-gray dark:prose-invert max-w-none release-markdown"
                  />
                </div>
                <!-- 渐变遮罩 -->
                <div
                  v-if="!expandedReleases.has(release.tag_name) && isLongBody(release.body)"
                  class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"
                />
                <button
                  v-if="isLongBody(release.body)"
                  @click="toggleExpand(release.tag_name)"
                  class="mt-1 text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  {{ expandedReleases.has(release.tag_name) ? '收起' : '展开全部' }}
                  <ChevronDown class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': expandedReleases.has(release.tag_name) }" />
                </button>
              </div>

              <!-- 下载资产 -->
              <div v-if="release.assets && release.assets.length > 0" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <div class="flex items-center gap-1.5 mb-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Package class="w-3.5 h-3.5" />
                  <span>下载 ({{ release.assets.length }})</span>
                </div>
                <div class="space-y-1">
                  <a
                    v-for="asset in release.assets.slice(0, showAllAssets.has(release.tag_name) ? undefined : 3)"
                    :key="asset.name"
                    :href="asset.download_url"
                    target="_blank"
                    class="group/asset flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/30 hover:bg-primary/10 dark:hover:bg-primary/[0.12] border border-transparent hover:border-primary/20 dark:hover:border-primary/24 transition-all text-xs"
                  >
                    <Download class="w-4 h-4 text-gray-400 group-hover/asset:text-primary shrink-0 transition-colors" />
                    <span class="font-mono text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">{{ asset.name }}</span>
                    <span class="text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">{{ formatSize(asset.size) }}</span>
                    <span v-if="asset.download_count > 0" class="text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
                      {{ formatCount(asset.download_count) }} 次
                    </span>
                  </a>
                  <button
                    v-if="release.assets.length > 3 && !showAllAssets.has(release.tag_name)"
                    @click.prevent="showAllAssets.add(release.tag_name)"
                    class="w-full text-center py-2 text-xs text-primary hover:text-[#169c46] font-medium transition-colors"
                  >
                    查看全部 {{ release.assets.length }} 个文件
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="releases.length > visibleCount" class="relative pl-10 pt-2">
          <div class="absolute left-[14px] top-[16px] w-[7px] h-[7px] rounded-full bg-gray-300 dark:bg-gray-600 z-10" />
          <button
            @click="visibleCount += 10"
            class="w-full py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all hover:shadow-sm"
          >
            加载更多 (还有 {{ releases.length - visibleCount }} 个版本)
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle, ChevronDown, Clock, Download,
  ExternalLink, GitBranch, Package, RefreshCw, Tag
} from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { isSignedIn } from '../../lib/auth'
import { githubService } from '../../services/github'
import type { GitHubRelease } from '../../types/software'
import logger from '../../utils/logger'
import TagBadge from '../common/TagBadge.vue'

// 异步加载 MarkdownRenderer：首次进入 release tab 才触发 markdown chunk（shiki + unified）下载
const MarkdownRenderer = defineAsyncComponent(
  () => import('../common/MarkdownRenderer.vue'),
)

const props = defineProps<{
  softwareId: number
  website: string
}>()

// State
const releases = ref<GitHubRelease[]>([])
const latestVersion = ref<string | null>(null)
const isLoading = ref(false)
const isRefreshing = ref(false)
const errorMsg = ref('')
const isStale = ref(false)
const visibleCount = ref(5)
const expandedReleases = ref(new Set<string>())
const showAllAssets = ref(new Set<string>())

// Computed
const parsedRepo = computed(() => githubService.parseRepo(props.website))

const repoUrl = computed(() => {
  const parsed = parsedRepo.value
  if (!parsed) return props.website
  return `https://github.com/${parsed.owner}/${parsed.repo}`
})

// Markdown 渲染上下文：用于 remark-github 把 @user/#123/SHA 解析为对应仓库的链接
const markdownContext = computed(() => {
  const parsed = parsedRepo.value
  if (!parsed) return undefined
  return { owner: parsed.owner, repo: parsed.repo }
})

const visibleReleases = computed(() => releases.value.slice(0, visibleCount.value))

const getReleaseVersionVariant = (index: number, prerelease: boolean) => {
  if (index === 0) return 'success'
  if (prerelease) return 'warning'
  return 'neutral'
}

// Methods
const isLongBody = (body: string) => {
  if (!body) return false
  return body.length > 500 || body.split('\n').length > 10
}

const toggleExpand = (tagName: string) => {
  if (expandedReleases.value.has(tagName)) {
    expandedReleases.value.delete(tagName)
  } else {
    expandedReleases.value.add(tagName)
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const timeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天发布'
  if (days === 1) return '昨天发布'
  if (days < 30) return `${days} 天前发布`
  if (days < 365) return `${Math.floor(days / 30)} 个月前发布`
  return `${Math.floor(days / 365)} 年前发布`
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}

const formatCount = (count: number) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

const loadReleases = async () => {
  if (!githubService.isGitHubRepo(props.website)) return

  isLoading.value = true
  errorMsg.value = ''

  try {
    const result = await githubService.getReleases(props.softwareId)
    releases.value = result.data || []
    latestVersion.value = result.latestVersion || null
    isStale.value = result.stale || false
  } catch (error: any) {
    errorMsg.value = error?.message || '获取版本信息失败'
    logger.error('加载 Releases 失败:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshReleases = async () => {
  isRefreshing.value = true
  try {
    const result = await githubService.refreshReleases(props.softwareId)
    if (result.data) {
      releases.value = result.data
      latestVersion.value = result.latestVersion || null
      isStale.value = false
    }
  } catch (error: any) {
    logger.error('刷新 Releases 失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadReleases()
})

// Watch for software change
watch(() => props.softwareId, () => {
  releases.value = []
  latestVersion.value = null
  errorMsg.value = ''
  visibleCount.value = 5
  expandedReleases.value.clear()
  showAllAssets.value.clear()
  loadReleases()
})
</script>

<style>
/* ============================================================
 * Release Notes Markdown 样式
 * 依赖输出结构：unified/remark + rehype + shiki + remark-github-blockquote-alert
 * 约定：
 *   - 所有容器均带 .release-markdown 类，避免污染项目其他地方
 *   - 暗色模式统一通过 html.dark 选择器切换（tailwind darkMode: "class"）
 * ============================================================ */

/* ---------- 基础排版 ---------- */

.release-markdown h1,
.release-markdown h2,
.release-markdown h3 {
  @apply font-bold text-gray-900 dark:text-white mt-4 mb-2 text-sm;
}
.release-markdown h1 { @apply text-base; }
.release-markdown h2 { @apply text-sm; }

.release-markdown p {
  @apply my-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300;
}

.release-markdown ul {
  @apply list-disc pl-5 my-1.5 text-sm text-gray-700 dark:text-gray-300;
}
.release-markdown ol {
  @apply list-decimal pl-5 my-1.5 text-sm text-gray-700 dark:text-gray-300;
}
.release-markdown li {
  @apply my-0.5;
}

/* 行内代码：Shiki 不处理行内 code，这里保留轻量样式 */
.release-markdown :not(pre) > code {
  @apply px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-800 dark:text-gray-200;
}

.release-markdown a {
  @apply text-primary hover:underline underline-offset-2;
}

.release-markdown strong {
  @apply font-semibold text-gray-900 dark:text-white;
}

/* 普通 blockquote（非 alert） */
.release-markdown blockquote {
  @apply my-2 rounded-lg border-l-4 border-gray-300 bg-gray-50 px-4 py-2 text-gray-600
         dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-400;
}
.release-markdown blockquote p { @apply my-1; }

.release-markdown hr {
  @apply my-4 border-gray-200 dark:border-gray-700;
}

.release-markdown img {
  @apply max-w-full h-auto rounded-lg my-2;
}

.release-markdown table {
  @apply w-full text-sm my-2 border-collapse;
}
.release-markdown th,
.release-markdown td {
  @apply px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-left;
}
.release-markdown th {
  @apply bg-gray-50 dark:bg-gray-800 font-medium;
}

/* ---------- Shiki 代码块（双主题切换） ---------- */
/* Shiki 的 <pre> 会自带内联 background/color，这里只补外层装饰 */

.release-markdown pre {
  @apply my-3 p-3 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700 text-xs leading-relaxed;
}
.release-markdown pre code {
  @apply bg-transparent p-0 text-xs font-mono;
  /* 保留 shiki 的行高/letter-spacing */
  display: block;
}

/* 双主题：暗色下用 --shiki-dark / --shiki-dark-bg 覆盖内联浅色 */
html.dark .release-markdown .shiki,
html.dark .release-markdown .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  /* 加粗/斜体等 token 样式的暗色变体 */
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
/* Shiki 未识别的 <pre>（无 .shiki 类）兜底背景 */
.release-markdown pre:not(.shiki) {
  @apply bg-gray-50;
}
html.dark .release-markdown pre:not(.shiki) {
  @apply bg-gray-900/50;
}

/* ---------- GFM 任务列表 ---------- */

.release-markdown ul.contains-task-list {
  @apply list-none pl-1;
}
.release-markdown li.task-list-item {
  @apply flex items-start gap-2 my-1;
}
.release-markdown li.task-list-item input[type="checkbox"] {
  @apply mt-[3px] w-3.5 h-3.5 shrink-0 appearance-none rounded-[3px]
         border border-gray-300 dark:border-gray-600
         bg-white dark:bg-gray-800
         cursor-default relative;
}
.release-markdown li.task-list-item input[type="checkbox"]:checked {
  @apply bg-primary border-primary;
}
.release-markdown li.task-list-item input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 3px;
  top: 0px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

/* ---------- GitHub Alerts ---------- */
/* remark-github-blockquote-alert 输出结构：
 *   <div class="markdown-alert markdown-alert-{type}">
 *     <p class="markdown-alert-title"><svg class="octicon">...</svg>TYPE</p>
 *     <p>body</p>
 *   </div>
 */

.release-markdown .markdown-alert {
  @apply my-3 px-4 py-2 rounded-r-lg border-l-4 border-solid;
}
.release-markdown .markdown-alert > p {
  @apply my-1 text-sm leading-relaxed;
}
.release-markdown .markdown-alert-title {
  @apply flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide !my-1;
}
.release-markdown .markdown-alert-title .octicon {
  @apply w-4 h-4 shrink-0;
  /* octicon 默认用 currentColor，所以继承父级 color 即可 */
  fill: currentColor;
}

/* NOTE - 蓝色 */
.release-markdown .markdown-alert-note {
  @apply border-blue-400 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-500/10;
}
.release-markdown .markdown-alert-note .markdown-alert-title {
  @apply text-blue-700 dark:text-blue-300;
}

/* TIP - 绿色（映射到项目 primary 色系更自然） */
.release-markdown .markdown-alert-tip {
  @apply border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10;
}
.release-markdown .markdown-alert-tip .markdown-alert-title {
  @apply text-emerald-700 dark:text-emerald-300;
}

/* IMPORTANT - 紫色 */
.release-markdown .markdown-alert-important {
  @apply border-purple-400 bg-purple-50 dark:border-purple-500/60 dark:bg-purple-500/10;
}
.release-markdown .markdown-alert-important .markdown-alert-title {
  @apply text-purple-700 dark:text-purple-300;
}

/* WARNING - 琥珀色 */
.release-markdown .markdown-alert-warning {
  @apply border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10;
}
.release-markdown .markdown-alert-warning .markdown-alert-title {
  @apply text-amber-700 dark:text-amber-300;
}

/* CAUTION - 红色 */
.release-markdown .markdown-alert-caution {
  @apply border-red-400 bg-red-50 dark:border-red-500/60 dark:bg-red-500/10;
}
.release-markdown .markdown-alert-caution .markdown-alert-title {
  @apply text-red-700 dark:text-red-300;
}

/* ---------- <details> / <summary> ---------- */

.release-markdown details {
  @apply my-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 overflow-hidden;
}
.release-markdown details > summary {
  @apply px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300
         flex items-center gap-2 list-none select-none
         hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors;
}
/* 去掉默认三角标记，使用自定义箭头 */
.release-markdown details > summary::-webkit-details-marker { display: none; }
.release-markdown details > summary::before {
  content: "";
  width: 0;
  height: 0;
  border-left: 5px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transition: transform 0.15s ease-in-out;
  flex-shrink: 0;
}
.release-markdown details[open] > summary::before {
  transform: rotate(90deg);
}
.release-markdown details > *:not(summary) {
  @apply px-3 py-2;
}

/* ---------- <kbd> 按键外观 ---------- */

.release-markdown kbd {
  @apply inline-flex items-center px-1.5 py-[1px] mx-[1px]
         rounded border border-gray-300 dark:border-gray-600
         bg-gray-50 dark:bg-gray-800
         text-[11px] font-mono font-medium
         text-gray-700 dark:text-gray-300
         shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]
         align-baseline;
}

/* ---------- 空 Markdown 兜底 ---------- */
.release-markdown:empty { display: none; }
</style>
