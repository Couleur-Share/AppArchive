<template>
  <div class="space-y-6">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 gap-4">
      <div class="w-10 h-10 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
      <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">正在获取版本信息...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMsg" class="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div class="w-16 h-16 mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle class="w-8 h-8 text-red-400" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">获取失败</h3>
      <p class="text-gray-500 max-w-md text-sm">{{ errorMsg }}</p>
      <button @click="loadReleases" class="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
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
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
            <Tag class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span class="text-sm font-bold text-green-700 dark:text-green-300">{{ latestVersion }}</span>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            共 {{ releases.length }} 个版本
          </span>
          <!-- 缓存/过期提示 -->
          <span v-if="isStale" class="text-xs text-amber-500 flex items-center gap-1">
            <AlertCircle class="w-3 h-3" /> 缓存数据
          </span>
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
                ? 'bg-green-500 border-green-400 dark:bg-green-400 dark:border-green-500 shadow-sm shadow-green-500/30'
                : release.prerelease
                  ? 'bg-amber-400 border-amber-300 dark:bg-amber-500 dark:border-amber-600'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'"
            />

            <!-- Release 卡片 -->
            <div
              class="group mb-4 p-5 rounded-xl bg-white dark:bg-gray-800 border transition-all duration-200"
              :class="index === 0
                ? 'border-green-200 dark:border-green-800/50 shadow-sm'
                : 'border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'"
            >
              <!-- 标题行 -->
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-center flex-wrap gap-2 min-w-0">
                  <span class="font-bold text-gray-900 dark:text-white text-base truncate">
                    {{ release.name || release.tag_name }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                    :class="index === 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : release.prerelease
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                  >
                    {{ release.tag_name }}
                  </span>
                  <span v-if="release.prerelease" class="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 ring-1 ring-inset ring-amber-200 dark:ring-amber-700">
                    预发布
                  </span>
                  <span v-if="index === 0" class="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 ring-1 ring-inset ring-green-200 dark:ring-green-700">
                    最新
                  </span>
                </div>
                <a
                  :href="release.html_url"
                  target="_blank"
                  class="shrink-0 p-1 rounded text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>

              <!-- 发布时间 -->
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <Clock class="w-3.5 h-3.5" />
                <span>{{ formatDate(release.published_at) }}</span>
                <span v-if="index === 0" class="text-gray-400">·</span>
                <span v-if="index === 0" class="text-green-600 dark:text-green-400 font-medium">
                  {{ timeAgo(release.published_at) }}
                </span>
              </div>

              <!-- Release 正文（Markdown 渲染） -->
              <div v-if="release.body" class="relative">
                <div
                  v-html="renderMarkdown(release.body)"
                  class="prose prose-sm prose-gray dark:prose-invert max-w-none release-markdown"
                  :class="{ 'max-h-[200px] overflow-hidden': !expandedReleases.has(release.tag_name) && isLongBody(release.body) }"
                />
                <!-- 渐变遮罩 -->
                <div
                  v-if="!expandedReleases.has(release.tag_name) && isLongBody(release.body)"
                  class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"
                />
                <button
                  v-if="isLongBody(release.body)"
                  @click="toggleExpand(release.tag_name)"
                  class="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
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
                    class="group/asset flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/30 transition-all text-xs"
                  >
                    <Download class="w-4 h-4 text-gray-400 group-hover/asset:text-blue-500 shrink-0 transition-colors" />
                    <span class="font-mono text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">{{ asset.name }}</span>
                    <span class="text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">{{ formatSize(asset.size) }}</span>
                    <span v-if="asset.download_count > 0" class="text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
                      {{ formatCount(asset.download_count) }} 次
                    </span>
                  </a>
                  <button
                    v-if="release.assets.length > 3 && !showAllAssets.has(release.tag_name)"
                    @click.prevent="showAllAssets.add(release.tag_name)"
                    class="w-full text-center py-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
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
import MarkdownIt from 'markdown-it'
import { computed, onMounted, ref, watch } from 'vue'
import type { GitHubRelease } from '../../types/software'
import { githubService } from '../../services/github'
import { isSignedIn } from '../../lib/auth'
import logger from '../../utils/logger'

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

// Markdown renderer (lazy init)
let md: MarkdownIt | null = null
const getMarkdownRenderer = () => {
  if (!md) {
    md = new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true,
    })
  }
  return md
}

// Computed
const repoUrl = computed(() => {
  const parsed = githubService.parseRepo(props.website)
  if (!parsed) return props.website
  return `https://github.com/${parsed.owner}/${parsed.repo}`
})

const visibleReleases = computed(() => releases.value.slice(0, visibleCount.value))

// Methods
const renderMarkdown = (body: string) => {
  if (!body) return ''
  return getMarkdownRenderer().render(body)
}

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
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`
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

<style scoped>
.release-markdown :deep(h1),
.release-markdown :deep(h2),
.release-markdown :deep(h3) {
  @apply font-bold text-gray-900 dark:text-white mt-4 mb-2 text-sm;
}
.release-markdown :deep(h1) { @apply text-base; }
.release-markdown :deep(h2) { @apply text-sm; }

.release-markdown :deep(p) {
  @apply my-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300;
}

.release-markdown :deep(ul) {
  @apply list-disc pl-5 my-1.5 text-sm text-gray-700 dark:text-gray-300;
}
.release-markdown :deep(ol) {
  @apply list-decimal pl-5 my-1.5 text-sm text-gray-700 dark:text-gray-300;
}

.release-markdown :deep(li) {
  @apply my-0.5;
}

.release-markdown :deep(code) {
  @apply px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-800 dark:text-gray-200;
}

.release-markdown :deep(pre) {
  @apply my-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 overflow-x-auto border border-gray-100 dark:border-gray-700;
}
.release-markdown :deep(pre code) {
  @apply bg-transparent p-0;
}

.release-markdown :deep(a) {
  @apply text-blue-500 hover:underline;
}

.release-markdown :deep(blockquote) {
  @apply border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-2 italic text-gray-600 dark:text-gray-400;
}

.release-markdown :deep(hr) {
  @apply my-4 border-gray-200 dark:border-gray-700;
}

.release-markdown :deep(img) {
  @apply max-w-full h-auto rounded-lg my-2;
}

.release-markdown :deep(table) {
  @apply w-full text-sm my-2;
}
.release-markdown :deep(th),
.release-markdown :deep(td) {
  @apply px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-left;
}
.release-markdown :deep(th) {
  @apply bg-gray-50 dark:bg-gray-800 font-medium;
}
</style>
