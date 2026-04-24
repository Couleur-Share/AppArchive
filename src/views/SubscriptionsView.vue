<template>
  <div class="subscriptions-page min-h-[100dvh] transition-colors duration-300">
    <header class="subscriptions-header pt-safe sticky top-0 z-40 w-full border-b backdrop-blur-xl">
      <div class="container mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm">
            <router-link to="/" class="subscriptions-breadcrumb-link">
              软件清单
            </router-link>
            <span class="subscriptions-breadcrumb-separator">/</span>
            <span class="subscriptions-breadcrumb-current">我的订阅</span>
          </div>
          <p class="subscriptions-breadcrumb-caption hidden md:block">
            管理 GitHub 项目的版本订阅、推送通道与检查状态
          </p>
        </div>

        <div class="flex items-center gap-2">
          <router-link to="/" class="subscriptions-toolbar-link">
            <ArrowLeft class="h-4 w-4" />
            <span class="hidden sm:inline">返回首页</span>
          </router-link>
          <BaseButton
            variant="secondary"
            size="sm"
            :loading="loading"
            class="subscriptions-refresh-btn"
            @click="loadAll"
          >
            <RefreshCw class="h-4 w-4" />
            刷新
          </BaseButton>
        </div>
      </div>
    </header>

    <main class="container relative z-10 mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <section class="subscriptions-hero">
        <div class="subscriptions-hero__eyebrow">
          <Bell class="h-4 w-4" />
          订阅中心
        </div>

        <div class="subscriptions-hero__main">
          <div class="min-w-0">
            <h1 class="subscriptions-hero__title">我的订阅</h1>
            <p class="subscriptions-hero__description">
              {{ heroSummary }}
            </p>
          </div>

          <div class="subscriptions-hero__badges">
            <TagBadge size="xs" variant="success" strong>
              运行中 {{ stats.active }}
            </TagBadge>
            <TagBadge v-if="attentionCount > 0" size="xs" variant="warning" strong>
              待处理 {{ attentionCount }}
            </TagBadge>
            <TagBadge v-else size="xs" variant="primary" strong>
              全部正常
            </TagBadge>
          </div>
        </div>
      </section>

      <section class="subscriptions-stats-grid" aria-label="订阅概览">
        <StatCard
          label="订阅总数"
          :value="stats.total"
          :max="100"
          caption="当前账户保存的版本跟踪数量"
          interactive
          :active="activeFilter === 'all'"
          aria-label="查看全部订阅"
          @select="activeFilter = 'all'"
        />
        <StatCard
          label="正常运行"
          :value="stats.active"
          variant="success"
          caption="检查与通知链路都处于可用状态"
          interactive
          :active="activeFilter === 'active'"
          aria-label="只查看正常运行的订阅"
          @select="activeFilter = 'active'"
        />
        <StatCard
          label="已暂停"
          :value="stats.paused"
          variant="warning"
          caption="不会自动检查，也不会推送更新通知"
          interactive
          :active="activeFilter === 'paused'"
          aria-label="只查看已暂停的订阅"
          @select="activeFilter = 'paused'"
        />
        <StatCard
          label="未设通道"
          :value="stats.noChannel"
          variant="info"
          caption="缺少可用推送通道，需要补齐通知链路"
          interactive
          :active="activeFilter === 'noChannel'"
          aria-label="只查看未设通道的订阅"
          @select="activeFilter = 'noChannel'"
        />
      </section>

      <section class="subscriptions-list-section" aria-labelledby="subscriptions-list-heading">
        <div class="subscriptions-list-head">
          <div>
            <h2 id="subscriptions-list-heading" class="subscriptions-list-head__title">
              {{ listHeading }}
            </h2>
            <p class="subscriptions-list-head__description">
              {{ listDescription }}
            </p>
          </div>
          <TagBadge size="xs" variant="neutral">
            {{ listCountLabel }}
          </TagBadge>
        </div>

        <div v-if="loading" class="subscriptions-state subscriptions-state--loading">
          <div class="subscriptions-state__spinner" />
          <p class="subscriptions-state__title">正在同步订阅状态</p>
          <p class="subscriptions-state__description">刷新版本检查计划与推送通道信息。</p>
        </div>

        <div v-else-if="subscriptions.length === 0" class="subscriptions-state subscriptions-state--empty">
          <div class="subscriptions-state__icon-shell">
            <Bell class="h-6 w-6" />
          </div>
          <p class="subscriptions-state__title">还没有订阅任何软件</p>
          <p class="subscriptions-state__description">
            在软件详情里点击“订阅更新”，就能把常用项目放进这里持续跟踪。
          </p>
          <router-link to="/" class="subscriptions-empty-link">
            去软件列表看看
          </router-link>
        </div>

        <div v-else-if="visibleSubscriptions.length === 0" class="subscriptions-state subscriptions-state--empty">
          <div class="subscriptions-state__icon-shell subscriptions-state__icon-shell--muted">
            <BellOff class="h-6 w-6" />
          </div>
          <p class="subscriptions-state__title">{{ emptyFilterTitle }}</p>
          <p class="subscriptions-state__description">
            {{ emptyFilterDescription }}
          </p>
          <button type="button" class="subscriptions-empty-link" @click="activeFilter = 'all'">
            查看全部订阅
          </button>
        </div>

        <div v-else class="subscriptions-list">
          <SubscriptionCard
            v-for="sub in visibleSubscriptions"
            :key="sub.id"
            :subscription="sub"
            :busy="subscriptionBusyIds.has(sub.id)"
            @edit="openEdit"
            @check-now="handleCheckNow"
            @pause="handlePauseSubscription"
            @remove="confirmRemove"
            @resume="handleResumeSubscription"
            @view-logs="openLogs"
          />
        </div>
      </section>
    </main>

    <!-- 编辑对话框 -->
    <SubscriptionDialog
      v-if="editingSub"
      v-model:show="dialogShow"
      :software="{
        id: editingSub.software_id,
        name: editingSub.software_snapshot.name,
        icon: editingSub.software_snapshot.icon,
      }"
      :initial-subscription="editingSub"
      :submitting="submitting"
      @save="handleSaveEdit"
      @unsubscribe="handleUnsubscribeInDialog"
    />

    <!-- 日志对话框 -->
    <LogsDialog
      v-model:show="logsDialogShow"
      :subscription="logsSubscription"
    />

    <!-- 删除确认 -->
    <DeleteConfirmDialog
      :show="removeTarget !== null"
      :item-name="removeTarget ? removeTarget.software_snapshot.name : ''"
      :is-deleting="removing"
      @update:show="(v) => { if (!v) removeTarget = null }"
      @confirm="handleRemove"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Bell, BellOff, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '../components/common/BaseButton.vue'
import DeleteConfirmDialog from '../components/common/DeleteConfirmDialog.vue'
import TagBadge from '../components/common/TagBadge.vue'
import LogsDialog from '../components/subscription/LogsDialog.vue'
import StatCard from '../components/subscription/StatCard.vue'
import SubscriptionCard from '../components/subscription/SubscriptionCard.vue'
import SubscriptionDialog from '../components/subscription/SubscriptionDialog.vue'
import { useToast } from '../composables/useToast'
import { isSignedIn } from '../lib/auth'
import { subscriptionService } from '../services/subscription'
import type {
  CheckIntervalMinutes,
  Subscription,
} from '../types/subscription'

const router = useRouter()
const { showToast } = useToast()

type SubscriptionFilter = 'all' | 'active' | 'paused' | 'noChannel'

const subscriptions = ref<Subscription[]>([])
const loading = ref(false)
const submitting = ref(false)
const removing = ref(false)
const activeFilter = ref<SubscriptionFilter>('all')
const subscriptionBusyIds = ref<Set<number>>(new Set())

const editingSub = ref<Subscription | null>(null)
const dialogShow = ref(false)

const logsSubscription = ref<Subscription | null>(null)
const logsDialogShow = ref(false)

const removeTarget = ref<Subscription | null>(null)

const stats = computed(() => {
  const total = subscriptions.value.length
  let paused = 0
  let noChannel = 0
  let active = 0
  for (const s of subscriptions.value) {
    if (s.paused_reason) paused += 1
    else if (s.channel_snapshot && s.consecutive_failures === 0) active += 1
    if (!s.channel_snapshot) noChannel += 1
  }
  return { total, active, paused, noChannel }
})

const attentionCount = computed(() =>
  subscriptions.value.filter(
    (s) => s.paused_reason || !s.channel_snapshot || s.consecutive_failures > 0,
  ).length,
)

const visibleSubscriptions = computed(() => {
  switch (activeFilter.value) {
    case 'active':
      return subscriptions.value.filter(
        (s) => !s.paused_reason && s.channel_snapshot && s.consecutive_failures === 0,
      )
    case 'paused':
      return subscriptions.value.filter((s) => Boolean(s.paused_reason))
    case 'noChannel':
      return subscriptions.value.filter((s) => !s.channel_snapshot)
    default:
      return subscriptions.value
  }
})

const listHeading = computed(() => {
  switch (activeFilter.value) {
    case 'active':
      return '正常运行'
    case 'paused':
      return '已暂停订阅'
    case 'noChannel':
      return '未设通道'
    default:
      return '订阅列表'
  }
})

const listDescription = computed(() => {
  switch (activeFilter.value) {
    case 'active':
      return '检查计划、推送通道与最近任务都处于可用状态的项目。'
    case 'paused':
      return '这些项目不会自动检查或推送，可直接在卡片中恢复订阅。'
    case 'noChannel':
      return '这些项目缺少可用推送通道，需要先补齐通知链路。'
    default:
      return '查看每个项目的轮询频率、当前版本、通道绑定与最近检查状态。'
  }
})

const listCountLabel = computed(() => {
  if (activeFilter.value === 'all') return `${stats.value.total} 项`
  return `${visibleSubscriptions.value.length} / ${stats.value.total} 项`
})

const emptyFilterTitle = computed(() => `${listHeading.value}为空`)

const emptyFilterDescription = computed(() => {
  switch (activeFilter.value) {
    case 'active':
      return '当前没有同时满足检查、通知和失败计数都正常的订阅。'
    case 'paused':
      return '当前没有暂停中的订阅。'
    case 'noChannel':
      return '当前所有订阅都已经拥有可用推送通道。'
    default:
      return '当前筛选条件下没有订阅。'
  }
})

const heroSummary = computed(() => {
  if (stats.value.total === 0) {
    return '把需要持续关注版本变化的 GitHub 项目收进这里，后续更新会通过已绑定通道主动提醒。'
  }

  if (attentionCount.value > 0) {
    return `当前共有 ${stats.value.total} 项订阅，其中 ${attentionCount.value} 项需要处理通道或恢复状态，其余项目仍在持续检查。`
  }

  return `当前已稳定跟踪 ${stats.value.total} 个项目，所有订阅都处于正常运行状态，适合把常用工具长期挂在这里。`
})

function setSubscriptionBusy(id: number, busy: boolean) {
  const next = new Set(subscriptionBusyIds.value)
  if (busy) next.add(id)
  else next.delete(id)
  subscriptionBusyIds.value = next
}

function replaceSubscription(updated: Subscription) {
  const index = subscriptions.value.findIndex((sub) => sub.id === updated.id)
  if (index >= 0) {
    subscriptions.value.splice(index, 1, updated)
  }
}

async function loadAll() {
  if (!isSignedIn.value) {
    router.replace('/')
    return
  }
  loading.value = true
  try {
    subscriptions.value = await subscriptionService.list()
  } catch (err) {
    showToast((err as Error).message || '加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function openEdit(sub: Subscription) {
  editingSub.value = sub
  dialogShow.value = true
}

async function handleSaveEdit(payload: {
  channel_id: number | null
  check_interval_minutes: CheckIntervalMinutes
  include_prerelease: boolean
}) {
  if (!editingSub.value) return
  submitting.value = true
  try {
    const patch: Parameters<typeof subscriptionService.update>[1] = {
      channel_id: payload.channel_id,
      check_interval_minutes: payload.check_interval_minutes,
      include_prerelease: payload.include_prerelease,
    }
    if (editingSub.value.paused_reason) patch.resume = true
    await subscriptionService.update(editingSub.value.id, patch)
    showToast('订阅已更新', 'success')
    dialogShow.value = false
    editingSub.value = null
    await loadAll()
  } catch (err) {
    showToast((err as Error).message || '保存失败', 'error')
  } finally {
    submitting.value = false
  }
}

async function handleUnsubscribeInDialog() {
  if (!editingSub.value) return
  submitting.value = true
  try {
    await subscriptionService.remove(editingSub.value.id)
    showToast('已取消订阅', 'success')
    dialogShow.value = false
    editingSub.value = null
    await loadAll()
  } catch (err) {
    showToast((err as Error).message || '取消订阅失败', 'error')
  } finally {
    submitting.value = false
  }
}

async function handleCheckNow(sub: Subscription) {
  if (sub.paused_reason) {
    showToast('订阅已暂停，恢复后才能立即检查', 'info')
    return
  }
  setSubscriptionBusy(sub.id, true)
  try {
    const result = await subscriptionService.checkNow(sub.id)
    if (result.triggered) {
      showToast(`已触发检查：${result.message}`, 'success')
    } else {
      showToast(result.message || '未触发检查', 'info')
    }
    await loadAll()
  } catch (err) {
    showToast((err as Error).message || '立即检查失败', 'error')
  } finally {
    setSubscriptionBusy(sub.id, false)
  }
}

async function handlePauseSubscription(sub: Subscription) {
  if (sub.paused_reason) return
  setSubscriptionBusy(sub.id, true)
  try {
    const updated = await subscriptionService.pause(sub.id)
    replaceSubscription(updated)
    showToast(`已暂停 ${sub.software_snapshot.name}`, 'success')
  } catch (err) {
    showToast((err as Error).message || '暂停订阅失败', 'error')
  } finally {
    setSubscriptionBusy(sub.id, false)
  }
}

async function handleResumeSubscription(sub: Subscription) {
  if (!sub.paused_reason) return
  setSubscriptionBusy(sub.id, true)
  try {
    const updated = await subscriptionService.resume(sub.id)
    replaceSubscription(updated)
    showToast(`已恢复 ${sub.software_snapshot.name}`, 'success')
  } catch (err) {
    showToast((err as Error).message || '恢复订阅失败', 'error')
  } finally {
    setSubscriptionBusy(sub.id, false)
  }
}

function confirmRemove(sub: Subscription) {
  removeTarget.value = sub
}

async function handleRemove() {
  if (!removeTarget.value) return
  removing.value = true
  try {
    await subscriptionService.remove(removeTarget.value.id)
    showToast('已取消订阅', 'success')
    removeTarget.value = null
    await loadAll()
  } catch (err) {
    showToast((err as Error).message || '取消订阅失败', 'error')
  } finally {
    removing.value = false
  }
}

function openLogs(sub: Subscription) {
  logsSubscription.value = sub
  logsDialogShow.value = true
}

onMounted(loadAll)
</script>

<style scoped>
.subscriptions-page {
  color: var(--home-text);
  background:
    radial-gradient(circle at 12% -4%, var(--app-bg-accent1), transparent 26%),
    radial-gradient(circle at 100% 6%, var(--app-bg-accent2), transparent 24%),
    radial-gradient(circle at 50% 108%, var(--app-bg-accent3), transparent 32%),
    linear-gradient(180deg, var(--app-bg-top-glow) 0%, var(--app-bg-top-veil) 14%, transparent 28%),
    linear-gradient(180deg, transparent 66%, var(--app-bg-bottom-glow) 88%, var(--app-bg-bottom-shade) 100%),
    linear-gradient(180deg, var(--app-bg-start) 0%, var(--app-bg-mid) 16%, var(--app-bg-end) 74%, var(--app-bg-bottom-end) 100%);
}

.subscriptions-header {
  border-color: color-mix(in srgb, var(--home-border) 82%, transparent);
  background: var(--app-header-shell-bg);
  box-shadow: var(--app-header-shadow);
}

.subscriptions-breadcrumb-link,
.subscriptions-toolbar-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--home-text-muted);
  transition:
    color var(--dur) var(--ease),
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.subscriptions-breadcrumb-link:hover,
.subscriptions-toolbar-link:hover {
  color: var(--home-text-strong);
}

.subscriptions-breadcrumb-separator {
  color: var(--home-text-subtle);
}

.subscriptions-breadcrumb-current {
  color: var(--home-text-strong);
  font-weight: 600;
}

.subscriptions-breadcrumb-caption {
  margin-top: 2px;
  color: var(--home-text-subtle);
  font-size: 12px;
}

.subscriptions-toolbar-link,
.subscriptions-refresh-btn {
  min-height: 38px;
  padding-inline: 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--home-border) 82%, transparent);
  background: color-mix(in srgb, var(--home-surface-soft) 82%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.subscriptions-toolbar-link:focus-visible {
  outline: none;
  border-color: var(--home-accent-border);
  box-shadow: var(--home-focus-ring-soft);
}

.subscriptions-hero {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--home-border-strong) 88%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-surface-strong) 92%, transparent), color-mix(in srgb, var(--home-surface) 88%, transparent));
  box-shadow: var(--home-shadow-strong);
  padding: 18px 20px;
}

.subscriptions-hero::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgb(30 215 96 / 0.08) 20%,
    rgb(30 215 96 / 0.22) 50%,
    transparent 100%
  );
}

.subscriptions-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--theme-primary-400);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.subscriptions-hero__main {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.subscriptions-hero__title {
  color: var(--home-text-strong);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: 0;
}

.subscriptions-hero__description {
  max-width: 70ch;
  margin-top: 8px;
  color: var(--home-text-muted);
  font-size: 14px;
  line-height: 1.62;
}

.subscriptions-hero__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subscriptions-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.subscriptions-list-section {
  margin-top: 24px;
}

.subscriptions-list-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.subscriptions-list-head__title {
  color: var(--home-text-strong);
  font-size: 1.04rem;
  font-weight: 700;
  letter-spacing: 0;
}

.subscriptions-list-head__description {
  margin-top: 4px;
  color: var(--home-text-subtle);
  font-size: 13px;
  line-height: 1.55;
}

.subscriptions-list {
  display: grid;
  gap: 12px;
}

.subscriptions-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 48px 20px;
  border-radius: 14px;
  border: 1px dashed color-mix(in srgb, var(--home-border-strong) 78%, transparent);
  background: color-mix(in srgb, var(--home-surface-soft) 72%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
  text-align: center;
}

.subscriptions-state__spinner {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--home-border-strong) 88%, transparent);
  border-top-color: var(--theme-primary-500);
  animation: subscriptions-spin 0.9s linear infinite;
}

.subscriptions-state__icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  color: var(--theme-primary-400);
  background: color-mix(in srgb, var(--home-accent-soft) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--home-accent-border) 92%, transparent);
  box-shadow: 0 16px 34px -24px rgb(30 215 96 / 0.28);
}

.subscriptions-state__icon-shell--muted {
  color: var(--home-text-muted);
  background: color-mix(in srgb, var(--home-surface-soft) 88%, transparent);
  border-color: color-mix(in srgb, var(--home-border) 88%, transparent);
  box-shadow: none;
}

.subscriptions-state__title {
  color: var(--home-text-strong);
  font-size: 1.05rem;
  font-weight: 700;
}

.subscriptions-state__description {
  max-width: 52ch;
  color: var(--home-text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.subscriptions-empty-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  margin-top: 6px;
  padding: 0 16px;
  border-radius: 12px;
  border: 0;
  color: rgb(18 18 18);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  background: var(--theme-primary-500);
  box-shadow: 0 18px 34px -24px rgb(30 215 96 / 0.32);
  transition:
    transform var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease),
    background-color var(--dur) var(--ease);
}

.subscriptions-empty-link:hover {
  background: var(--theme-primary-600);
  box-shadow: 0 22px 42px -24px rgb(30 215 96 / 0.34);
}

.subscriptions-empty-link:focus-visible {
  outline: none;
  box-shadow: var(--home-focus-ring);
}

@keyframes subscriptions-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .subscriptions-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .subscriptions-hero {
    padding: 16px 18px;
    border-radius: 14px;
  }

  .subscriptions-hero__title {
    font-size: 1.7rem;
  }

  .subscriptions-stats-grid {
    grid-template-columns: 1fr;
  }

  .subscriptions-list-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .subscriptions-state {
    padding: 40px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .subscriptions-empty-link,
  .subscriptions-breadcrumb-link,
  .subscriptions-toolbar-link {
    transition: none;
  }

  .subscriptions-state__spinner {
    animation: none;
  }
}
</style>
