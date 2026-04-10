<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#020618] transition-colors duration-300">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <router-link to="/" class="text-lg font-bold text-gray-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
          软件清单
        </router-link>
        <div class="flex items-center gap-3">
          <button
            @click="toggleTheme"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Moon v-if="!isDark" class="w-4 h-4" />
            <Sun v-else class="w-4 h-4" />
          </button>
          <router-link
            to="/"
            class="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Home class="w-4 h-4" />
            <span class="hidden sm:inline">返回首页</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div class="animate-pulse space-y-6">
        <div class="flex items-start gap-6">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0"></div>
          <div class="flex-1 space-y-3 pt-2">
            <div class="h-7 bg-gray-200 dark:bg-gray-800 rounded-lg w-48"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
            <div class="flex gap-2">
              <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
              <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
            </div>
          </div>
        </div>
        <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
      <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <AlertCircle class="w-8 h-8 text-gray-400" />
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">未找到该软件</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-8">该软件可能已被删除或链接无效。</p>
      <router-link
        to="/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
      >
        <Home class="w-4 h-4" />
        返回首页
      </router-link>
    </div>

    <!-- 软件详情 -->
    <main v-else-if="software" class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <!-- 头部信息 -->
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8 mb-8">
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <img
            :src="getIconUrl(software.icon || '')"
            :alt="software.name"
            class="w-full h-full object-cover"
            loading="eager"
            referrerpolicy="origin"
          />
        </div>
        <div class="flex-1 text-center sm:text-left min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ software.name }}
          </h1>
          <div class="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <TagBadge size="sm" variant="neutral" strong>
              {{ software.category || '未分类' }}
            </TagBadge>
            <TagBadge
              size="sm"
              strong
              :variant="getLicenseVariant(software.license)"
            >
              {{ software.license || '未知' }}
            </TagBadge>
            <TagBadge
              v-if="software.systems && software.systems.length"
              size="sm"
              variant="neutral"
            >
              <Monitor class="w-3.5 h-3.5" />
              {{ software.systems.join(' · ') }}
            </TagBadge>
            <TagBadge
              v-if="hasWarnings"
              size="sm"
              variant="danger"
              strong
            >
              <AlertCircle class="w-3.5 h-3.5" />
              安全警示
            </TagBadge>
          </div>
          <!-- 操作按钮 -->
          <div class="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <a
              v-if="software.website"
              :href="software.website"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm transition-colors"
            >
              <ExternalLink class="w-4 h-4" />
              访问官网
            </a>
            <router-link
              :to="{ name: 'software-detail', params: { id: software.id } }"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 hover:text-emerald-500 shadow-sm transition-colors"
            >
              <ArrowRight class="w-4 h-4" />
              在应用中查看
            </router-link>
            <button
              @click="copyShareLink"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 hover:text-emerald-500 shadow-sm transition-colors"
            >
              <Link2 class="w-4 h-4" />
              {{ copySuccess ? '已复制' : '复制链接' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 描述 -->
      <section v-if="software.description" class="mb-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-3">关于软件</h2>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{{ software.description }}</p>
      </section>

      <!-- 优点 / 缺点 -->
      <div v-if="hasProsOrCons" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section v-if="software.pros && software.pros.length" class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">优点</h2>
          <ul class="space-y-3">
            <li v-for="(pro, i) in software.pros" :key="i" class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <CheckCircle2 class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{{ pro }}</span>
            </li>
          </ul>
        </section>
        <section v-if="software.cons && software.cons.length" class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">缺点</h2>
          <ul class="space-y-3">
            <li v-for="(con, i) in software.cons" :key="i" class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <XCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{{ con }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- 安全风险与争议事件 -->
      <section
        v-if="hasWarnings"
        class="mb-8 bg-amber-50 dark:bg-amber-950/25 rounded-xl p-6 shadow-sm border border-amber-200 dark:border-amber-800/50"
      >
        <h2 class="text-lg font-bold text-amber-800 dark:text-amber-300 mb-4 inline-flex items-center gap-2">
          <AlertCircle class="w-5 h-5" />
          安全风险与争议事件
        </h2>
        <ul class="space-y-3">
          <li
            v-for="(warning, i) in software.warnings"
            :key="i"
            class="flex items-start gap-3 text-amber-900 dark:text-amber-200"
          >
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>{{ warning }}</span>
          </li>
        </ul>
        <p class="mt-4 text-xs text-amber-700/80 dark:text-amber-400/70">
          风险信息基于公开资料与 AI 分析，仅供参考，请结合官方公告自行核验。
        </p>
      </section>

      <!-- 相关文章 -->
      <section v-if="publicArticles.length" class="mb-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">相关资源</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            v-for="article in publicArticles"
            :key="article.id"
            :href="article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-emerald-500/50 hover:shadow-md transition-all"
          >
            <div class="font-medium text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors line-clamp-1">
              {{ article.title }}
            </div>
            <div v-if="article.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {{ article.description }}
            </div>
          </a>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-400 dark:text-gray-600">
      软件清单 &middot; 分享页面
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import {
  AlertCircle, ArrowRight, CheckCircle2, ExternalLink,
  Home, Link2, Monitor, Moon, Sun, XCircle
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import TagBadge from '../components/common/TagBadge.vue'
import { useTheme } from '../composables/useTheme'
import { getIconUrl } from '../services/localIconCache'
import { softwareService } from '../services/software'
import type { Software } from '../types'
import { getLicenseTagVariant as getLicenseVariant } from '../utils/license'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const software = ref<Software | null>(null)
const isLoading = ref(true)
const error = ref(false)
const copySuccess = ref(false)

useHead({
  title: computed(() => {
    if (software.value?.name) return `${software.value.name} - 软件清单`
    return '软件清单'
  }),
  meta: [
    {
      name: 'description',
      content: computed(() => {
        if (!software.value) return ''
        const sw = software.value
        const parts = [sw.category, sw.license, (sw.systems || []).join(' / ')].filter(Boolean).join(' · ')
        const desc = (sw.description || '').slice(0, 160)
        return parts ? `${parts} — ${desc}` : desc
      }),
    },
  ],
})

const hasProsOrCons = computed(() =>
  (software.value?.pros && software.value.pros.length > 0) ||
  (software.value?.cons && software.value.cons.length > 0)
)

const hasWarnings = computed(() =>
  Array.isArray(software.value?.warnings) && software.value.warnings.length > 0
)

const publicArticles = computed(() =>
  (software.value?.related_articles || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
)

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch {
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = window.location.href
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (Number.isNaN(id)) {
    error.value = true
    isLoading.value = false
    return
  }
  try {
    software.value = await softwareService.getSoftwareById(id)
  } catch {
    error.value = true
  } finally {
    isLoading.value = false
  }
})
</script>
