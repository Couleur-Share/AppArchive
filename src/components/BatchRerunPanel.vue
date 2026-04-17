<template>
  <div class="batch-rerun-panel space-y-6">
    <!-- 顶部说明 -->
    <div class="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
      <Info class="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div class="text-sm text-blue-900 dark:text-blue-200 space-y-1">
        <p class="font-medium">批量重跑 AI 分析</p>
        <p class="text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
          重新拉取 AI 分析结果（tagline、核心亮点、适合谁、避免场景），仅覆盖结构化字段与分析元数据，
          不会覆盖你手动编辑过的描述、优缺点、链接。任务在后端运行，关闭本页不会中断。
        </p>
      </div>
    </div>

    <!-- 状态卡 -->
    <div
      class="status-card rounded-xl border p-5 space-y-4"
      :class="statusCardClass"
    >
      <!-- 标题行：状态徽章 + 模式 + 操作按钮 -->
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <component
            :is="statusIcon"
            class="h-6 w-6"
            :class="statusIconClass"
          />
          <div>
            <div class="text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ statusLabel }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ statusSubLabel }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <BaseButton
            v-if="status?.status === 'running'"
            variant="danger"
            size="sm"
            :loading="isCancelling"
            :disabled="isCancelling"
            @click="onCancel"
          >
            取消任务
          </BaseButton>
          <BaseButton
            v-else
            variant="primary"
            size="sm"
            :loading="isStarting"
            :disabled="isStarting || !canStart"
            @click="onStart"
          >
            {{ startButtonLabel }}
          </BaseButton>
          <BaseButton
            v-if="canReset"
            variant="ghost"
            size="sm"
            :disabled="isResetting"
            @click="onReset"
          >
            <RotateCcw class="h-4 w-4" />
            重置进度
          </BaseButton>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-700 dark:text-gray-300">
            <span class="font-mono font-semibold">{{ status?.processed ?? 0 }}</span>
            <span class="text-gray-400 mx-1">/</span>
            <span class="font-mono">{{ status?.total ?? 0 }}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-2">({{ progressPct }}%)</span>
            <span v-if="status?.failed && status.failed > 0" class="text-red-500 ml-2">失败 {{ status.failed }}</span>
            <span v-if="status?.skippedCount && status.skippedCount > 0" class="text-gray-500 ml-2">已跳过 {{ status.skippedCount }}</span>
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            <template v-if="status?.status === 'running'">
              <Clock class="h-3.5 w-3.5 inline-block mr-1" />
              <span v-if="etaLabel">预计剩余 {{ etaLabel }}</span>
              <span v-else>计算中…</span>
            </template>
            <template v-else-if="status?.startedAt">
              耗时 {{ formatDuration(elapsedMs) }}
            </template>
          </span>
        </div>

        <div class="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="progressBarClass"
            :style="{ width: `${progressPct}%` }"
          />
        </div>

        <!-- 当前正在处理的软件名 -->
        <div
          v-if="status?.status === 'running' && status.currentName"
          class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
        >
          <Loader2 class="h-3.5 w-3.5 animate-spin" />
          <span>正在分析: <span class="font-medium text-gray-800 dark:text-gray-200">{{ status.currentName }}</span></span>
        </div>
      </div>

      <!-- 上次中断提示 -->
      <div
        v-if="hasInterruptedProgress"
        class="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-sm text-amber-900 dark:text-amber-200"
      >
        <AlertCircle class="h-4 w-4 shrink-0" />
        <span>检测到上次任务保留了 {{ status?.processedIds.length ?? 0 }} 条已处理记录，再次启动会自动跳过这些条目。</span>
      </div>
    </div>

    <!-- 模式选择（仅 idle 状态可见） -->
    <div v-if="!isJobActive" class="space-y-3">
      <div class="text-sm font-medium text-gray-700 dark:text-gray-300">运行模式</div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          v-for="opt in modeOptions"
          :key="opt.value"
          type="button"
          @click="mode = opt.value"
          class="flex flex-col items-start text-left p-3 rounded-lg border transition-colors duration-150"
          :class="mode === opt.value
            ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'"
        >
          <span class="text-sm font-medium">{{ opt.label }}</span>
          <span
            class="text-xs mt-1"
            :class="mode === opt.value ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'"
          >
            {{ opt.hint }}
          </span>
        </button>
      </div>
    </div>

    <!-- 软件多选列表（仅 'selected' 模式 + idle 时可见） -->
    <div v-if="!isJobActive && mode === 'selected'" class="space-y-3">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
          选择软件
          <span class="text-gray-500 dark:text-gray-400 font-normal ml-2">已选 {{ selectedIds.size }} / {{ filteredSoftwares.length }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-xs text-gray-600 dark:text-gray-400 hover:text-primary"
            @click="selectAllVisible"
          >
            全选可见
          </button>
          <button
            type="button"
            class="text-xs text-gray-600 dark:text-gray-400 hover:text-primary"
            @click="invertSelection"
          >
            反选
          </button>
          <button
            type="button"
            class="text-xs text-gray-600 dark:text-gray-400 hover:text-primary"
            @click="selectMissingOnly"
          >
            仅选缺字段
          </button>
          <button
            type="button"
            class="text-xs text-gray-600 dark:text-gray-400 hover:text-primary"
            @click="clearSelection"
          >
            清空
          </button>
        </div>
      </div>

      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索软件名或描述…"
          class="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                 bg-white dark:bg-gray-800 text-sm
                 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500
                 text-gray-900 dark:text-gray-100
                 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <div
        class="software-list rounded-lg border border-gray-200 dark:border-gray-700 max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div v-if="loadingSoftwares" class="p-4 text-center text-sm text-gray-500">
          <Loader2 class="h-4 w-4 inline-block animate-spin mr-2" />加载中…
        </div>
        <div v-else-if="filteredSoftwares.length === 0" class="p-4 text-center text-sm text-gray-500">
          没有匹配的软件
        </div>
        <label
          v-for="sw in filteredSoftwares"
          v-else
          :key="sw.id"
          class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60"
        >
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary/40"
            :checked="selectedIds.has(sw.id)"
            @change="toggleSelect(sw.id)"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ sw.name }}</span>
              <span
                v-if="sw.category"
                class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >{{ sw.category }}</span>
              <span
                v-if="status?.processedIds.includes(sw.id)"
                class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                title="本批次已处理"
              >已跑</span>
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <Badge :ok="hasField(sw, 'tagline')" label="tagline" />
              <Badge :ok="hasArrayField(sw, 'highlights')" label="highlights" />
              <Badge :ok="hasArrayField(sw, 'best_for')" label="best_for" />
              <Badge :ok="hasArrayField(sw, 'avoid_if')" label="avoid_if" />
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- 错误清单 -->
    <div v-if="status && status.errors.length > 0" class="space-y-2">
      <button
        type="button"
        class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600"
        @click="errorsCollapsed = !errorsCollapsed"
      >
        <ChevronRight
          class="h-4 w-4 transition-transform duration-150"
          :class="{ 'rotate-90': !errorsCollapsed }"
        />
        失败记录 ({{ status.errors.length }})
      </button>
      <div
        v-if="!errorsCollapsed"
        class="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 max-h-48 overflow-y-auto divide-y divide-red-100 dark:divide-red-900/30"
      >
        <div
          v-for="(err, idx) in status.errors"
          :key="`${err.id}-${idx}`"
          class="px-3 py-2 text-xs"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium text-gray-800 dark:text-gray-200">[{{ err.id }}] {{ err.name }}</span>
            <button
              type="button"
              class="text-[10px] text-gray-500 hover:text-primary"
              @click="copyText(`[${err.id}] ${err.name}: ${err.error}`)"
            >
              复制
            </button>
          </div>
          <div class="text-red-700 dark:text-red-300 mt-0.5 break-all">{{ err.error }}</div>
        </div>
      </div>
    </div>

    <!-- 致命错误（启动期失败） -->
    <div
      v-if="status?.lastError"
      class="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-sm text-red-700 dark:text-red-300"
    >
      <AlertCircle class="h-4 w-4 inline-block mr-1" />
      {{ status.lastError }}
    </div>

    <!-- 操作反馈 -->
    <div
      v-if="actionMessage"
      class="text-sm"
      :class="actionError ? 'text-red-600' : 'text-emerald-600'"
    >
      {{ actionMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleSlash,
  Clock,
  Info,
  Loader2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-vue-next'
import { type Component, computed, h, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  cancelRerun,
  formatEta,
  getRerunStatus,
  type RerunMode,
  type RerunStatus,
  resetRerun,
  startRerun,
} from '../services/rerunJob'
import { softwareService } from '../services/software'
import type { SoftwareListItem } from '../types'
import BaseButton from './common/BaseButton.vue'

// 内嵌的小徽章组件，渲染"该字段是否存在"
const Badge = (props: { ok?: boolean; label: string }) =>
  h(
    'span',
    {
      class: [
        'text-[10px] px-1.5 py-0.5 rounded font-mono',
        props.ok
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through',
      ],
    },
    props.label,
  )

const status = ref<RerunStatus | null>(null)
const isStarting = ref(false)
const isCancelling = ref(false)
const isResetting = ref(false)
const actionMessage = ref('')
const actionError = ref(false)
const errorsCollapsed = ref(true)

const mode = ref<RerunMode>('missing_structured')
const modeOptions: { value: RerunMode; label: string; hint: string }[] = [
  { value: 'all', label: '全部软件', hint: '为所有软件刷新分析结果' },
  { value: 'missing_structured', label: '只补缺失', hint: '仅 tagline / highlights / best_for / avoid_if 任一为空' },
  { value: 'selected', label: '手动多选', hint: '从下方列表勾选要重跑的软件' },
]

// 软件列表（用于 selected 模式）
const allSoftwares = ref<SoftwareListItem[]>([])
const loadingSoftwares = ref(false)
const searchQuery = ref('')
const selectedIds = ref(new Set<number>())

const filteredSoftwares = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return allSoftwares.value
  return allSoftwares.value.filter(
    (sw) =>
      sw.name.toLowerCase().includes(q) ||
      (sw.description || '').toLowerCase().includes(q),
  )
})

const isJobActive = computed(
  () => status.value?.status === 'running',
)

const canStart = computed(() => {
  if (!status.value) return false
  if (status.value.status === 'running') return false
  if (mode.value === 'selected' && selectedIds.value.size === 0) return false
  return true
})

const canReset = computed(() => {
  if (!status.value) return false
  if (status.value.status === 'running') return false
  return status.value.processedIds.length > 0
})

const hasInterruptedProgress = computed(() => {
  if (!status.value) return false
  if (status.value.status === 'running') return false
  return status.value.processedIds.length > 0 && status.value.status !== 'completed'
})

const showProgress = computed(() => {
  if (!status.value) return false
  return status.value.status !== 'idle' || status.value.processedIds.length > 0
})

const progressPct = computed(() => {
  if (!status.value || status.value.total === 0) return 0
  const done = status.value.processed + status.value.failed
  return Math.min(100, Math.round((done / status.value.total) * 100))
})

const etaLabel = computed(() => formatEta(status.value?.etaMs ?? 0))

const elapsedMs = computed(() => {
  if (!status.value?.startedAt) return 0
  const start = new Date(status.value.startedAt).getTime()
  const end = status.value.finishedAt
    ? new Date(status.value.finishedAt).getTime()
    : Date.now()
  return Math.max(0, end - start)
})

const startButtonLabel = computed(() => {
  if (!status.value) return '开始'
  if (status.value.status === 'running') return '运行中…'
  if (status.value.processedIds.length > 0) return '继续运行'
  return '开始批量重跑'
})

// ========== 状态卡视觉映射 ==========
const statusMeta = computed<{
  icon: Component
  iconClass: string
  cardClass: string
  barClass: string
  label: string
  subLabel: string
}>(() => {
  const s = status.value?.status ?? 'idle'
  switch (s) {
    case 'running':
      return {
        icon: Loader2,
        iconClass: 'text-blue-500 animate-spin',
        cardClass: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/10',
        barClass: 'bg-blue-500 dark:bg-blue-400',
        label: '任务运行中',
        subLabel: status.value?.mode ? `模式: ${modeLabel(status.value.mode)}` : '',
      }
    case 'completed':
      return {
        icon: CheckCircle2,
        iconClass: 'text-emerald-500',
        cardClass: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/10',
        barClass: 'bg-emerald-500 dark:bg-emerald-400',
        label: '任务已完成',
        subLabel: status.value?.finishedAt ? `结束于 ${formatTime(status.value.finishedAt)}` : '',
      }
    case 'cancelled':
      return {
        icon: PauseCircle,
        iconClass: 'text-amber-500',
        cardClass: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10',
        barClass: 'bg-amber-500 dark:bg-amber-400',
        label: '任务已取消',
        subLabel: status.value?.finishedAt ? `取消于 ${formatTime(status.value.finishedAt)}` : '',
      }
    case 'failed':
      return {
        icon: XCircle,
        iconClass: 'text-red-500',
        cardClass: 'border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/10',
        barClass: 'bg-red-500 dark:bg-red-400',
        label: '任务异常退出',
        subLabel: '请查看错误日志',
      }
    default:
      return {
        icon: status.value && status.value.processedIds.length > 0 ? CircleSlash : PlayCircle,
        iconClass: 'text-gray-400',
        cardClass: 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40',
        barClass: 'bg-gray-400',
        label: status.value && status.value.processedIds.length > 0 ? '空闲（有历史进度）' : '空闲',
        subLabel: status.value?.sleepMs ? `节流: ${Math.round(status.value.sleepMs / 1000)}s / 条` : '',
      }
  }
})
const statusIcon = computed(() => statusMeta.value.icon)
const statusIconClass = computed(() => statusMeta.value.iconClass)
const statusCardClass = computed(() => statusMeta.value.cardClass)
const progressBarClass = computed(() => statusMeta.value.barClass)
const statusLabel = computed(() => statusMeta.value.label)
const statusSubLabel = computed(() => statusMeta.value.subLabel)

function modeLabel(m: RerunMode | null): string {
  if (m === 'all') return '全部'
  if (m === 'missing_structured') return '只补缺失'
  if (m === 'selected') return '手动多选'
  return ''
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  } catch {
    return iso
  }
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0s'
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h${m}m${s}s`
  if (m > 0) return `${m}m${s}s`
  return `${s}s`
}

// ========== 多选辅助 ==========
function hasField(sw: SoftwareListItem, field: 'tagline'): boolean {
  const v = sw[field]
  return typeof v === 'string' && v.trim().length > 0
}
function hasArrayField(sw: SoftwareListItem, field: 'highlights' | 'best_for' | 'avoid_if'): boolean {
  const v = sw[field]
  return Array.isArray(v) && v.length > 0
}
function isMissing(sw: SoftwareListItem): boolean {
  return (
    !hasField(sw, 'tagline') ||
    !hasArrayField(sw, 'highlights') ||
    !hasArrayField(sw, 'best_for') ||
    !hasArrayField(sw, 'avoid_if')
  )
}

function toggleSelect(id: number) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}
function selectAllVisible() {
  const next = new Set(selectedIds.value)
  for (const sw of filteredSoftwares.value) next.add(sw.id)
  selectedIds.value = next
}
function invertSelection() {
  const next = new Set<number>()
  for (const sw of filteredSoftwares.value) {
    if (!selectedIds.value.has(sw.id)) next.add(sw.id)
  }
  // 保留不可见但已选的项
  for (const id of selectedIds.value) {
    if (!filteredSoftwares.value.some((sw) => sw.id === id)) next.add(id)
  }
  selectedIds.value = next
}
function selectMissingOnly() {
  const next = new Set<number>()
  for (const sw of filteredSoftwares.value) {
    if (isMissing(sw)) next.add(sw.id)
  }
  selectedIds.value = next
}
function clearSelection() {
  selectedIds.value = new Set()
}

// ========== 异步加载软件列表 ==========
async function loadSoftwares() {
  if (allSoftwares.value.length > 0) return
  loadingSoftwares.value = true
  try {
    const result = await softwareService.getSoftwareList({
      page: 1,
      limit: 1000,
      sortField: 'id',
      sortOrder: 'asc',
    })
    allSoftwares.value = result.data || []
  } catch (err) {
    actionMessage.value = err instanceof Error ? err.message : '加载软件列表失败'
    actionError.value = true
  } finally {
    loadingSoftwares.value = false
  }
}

watch(mode, async (next) => {
  if (next === 'selected') {
    await loadSoftwares()
  }
})

// ========== 状态轮询 ==========
let pollTimer: ReturnType<typeof setInterval> | null = null

async function refreshStatus() {
  try {
    status.value = await getRerunStatus()
    if (status.value.status === 'running' && !pollTimer) startPolling()
    if (status.value.status !== 'running') stopPolling()
  } catch (err) {
    actionMessage.value = err instanceof Error ? err.message : '获取任务状态失败'
    actionError.value = true
    stopPolling()
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(() => {
    void refreshStatus()
  }, 2000)
}

function stopPolling() {
  if (!pollTimer) return
  clearInterval(pollTimer)
  pollTimer = null
}

// ========== 操作 ==========
async function onStart() {
  if (!canStart.value) return
  isStarting.value = true
  actionMessage.value = ''
  actionError.value = false
  try {
    const ids = mode.value === 'selected' ? [...selectedIds.value] : undefined
    status.value = await startRerun(mode.value, ids)
    actionMessage.value = `任务已启动，共 ${status.value.total} 条`
    actionError.value = false
    startPolling()
  } catch (err) {
    actionMessage.value = err instanceof Error ? err.message : '启动失败'
    actionError.value = true
    // 启动失败也刷一次状态（可能是 409，后端已返回当前 status）
    void refreshStatus()
  } finally {
    isStarting.value = false
  }
}

async function onCancel() {
  isCancelling.value = true
  try {
    status.value = await cancelRerun()
    actionMessage.value = '已请求取消，当前条目处理完后停止'
    actionError.value = false
  } catch (err) {
    actionMessage.value = err instanceof Error ? err.message : '取消失败'
    actionError.value = true
  } finally {
    isCancelling.value = false
  }
}

async function onReset() {
  if (!canReset.value) return
  isResetting.value = true
  try {
    status.value = await resetRerun()
    actionMessage.value = '已清空历史进度'
    actionError.value = false
  } catch (err) {
    actionMessage.value = err instanceof Error ? err.message : '重置失败'
    actionError.value = true
  } finally {
    isResetting.value = false
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    actionMessage.value = '已复制到剪贴板'
    actionError.value = false
  } catch {
    actionMessage.value = '复制失败，请手动选择'
    actionError.value = true
  }
}

onMounted(() => {
  void refreshStatus()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.batch-rerun-panel input[type='checkbox'] {
  accent-color: rgb(34 197 94);
}
.software-list {
  scrollbar-width: thin;
}
</style>
