<template>
  <article
    class="subscription-card"
    :class="{
      'subscription-card--paused': isPaused,
      'subscription-card--attention': hasAttention,
    }"
  >
    <div class="subscription-card__layout">
      <div class="subscription-card__lead">
        <div class="subscription-card__icon-shell">
          <img
            v-if="props.subscription.software_snapshot.icon"
            :src="props.subscription.software_snapshot.icon"
            class="subscription-card__icon"
            alt=""
          />
          <div v-else class="subscription-card__icon-fallback">
            <Box class="h-6 w-6" />
          </div>
        </div>

        <div class="subscription-card__summary">
          <p class="subscription-card__eyebrow">GitHub 版本订阅</p>

          <div class="subscription-card__title-row">
            <router-link
              :to="`/software/${props.subscription.software_id}`"
              class="subscription-card__title"
            >
              {{ props.subscription.software_snapshot.name }}
            </router-link>

            <div class="subscription-card__badges">
              <TagBadge size="xs" :variant="isPaused ? 'warning' : 'success'" strong>
                {{ statusLabel }}
              </TagBadge>

              <TagBadge v-if="props.subscription.include_prerelease" size="xs" variant="info" strong>
                含 Pre-release
              </TagBadge>

              <TagBadge v-if="!props.subscription.channel_snapshot" size="xs" variant="warning">
                未设通道
              </TagBadge>
            </div>
          </div>

          <p class="subscription-card__description">
            {{ summaryLine }}
          </p>
        </div>
      </div>

      <div class="subscription-card__details">
        <InfoItem label="检查频率">
          {{ intervalLabel(props.subscription.check_interval_minutes) }}
        </InfoItem>

        <InfoItem label="推送通道">
          <span v-if="props.subscription.channel_snapshot">
            {{ channelLabel }}
          </span>
          <span v-else class="subscription-card__value--warning">待配置</span>
        </InfoItem>

        <InfoItem label="当前版本">
          <span v-if="props.subscription.last_notified_version" class="subscription-card__mono">
            {{ props.subscription.last_notified_version }}
          </span>
          <span v-else class="subscription-card__value--muted">待首次检查</span>
        </InfoItem>

        <InfoItem label="下次检查">
          {{ formatScheduleTime(props.subscription.next_check_at) }}
        </InfoItem>

        <InfoItem label="最近检查">
          {{ formatRelativeTime(props.subscription.last_checked_at, '尚未检查') }}
        </InfoItem>

        <InfoItem label="最近通知">
          {{ formatRelativeTime(props.subscription.last_notified_at, '尚未通知') }}
        </InfoItem>
      </div>

      <div class="subscription-card__actions">
        <button
          type="button"
          class="subscription-card__action subscription-card__action--primary"
          :disabled="props.busy"
          @click="$emit('edit', props.subscription)"
        >
          <Pencil class="h-4 w-4" />
          <span>编辑</span>
        </button>

        <button
          type="button"
          class="subscription-card__action"
          :class="isPaused ? 'subscription-card__action--restore' : 'subscription-card__action--pause'"
          :disabled="props.busy"
          @click="togglePause"
        >
          <PlayCircle v-if="isPaused" class="h-4 w-4" />
          <PauseCircle v-else class="h-4 w-4" />
          <span>{{ isPaused ? '恢复订阅' : '暂停订阅' }}</span>
        </button>

        <button
          type="button"
          class="subscription-card__action"
          :disabled="isPaused || props.busy"
          @click="$emit('check-now', props.subscription)"
        >
          <Send class="h-4 w-4" />
          <span>立即检查</span>
        </button>

        <button
          type="button"
          class="subscription-card__action"
          :disabled="props.busy"
          @click="$emit('view-logs', props.subscription)"
        >
          <FileText class="h-4 w-4" />
          <span>查看日志</span>
        </button>

        <button
          type="button"
          class="subscription-card__action subscription-card__action--danger"
          :disabled="props.busy"
          @click="$emit('remove', props.subscription)"
        >
          <Trash2 class="h-4 w-4" />
          <span>取消订阅</span>
        </button>
      </div>
    </div>

    <div
      v-if="noticeText"
      class="subscription-card__notice"
      :class="noticeToneClass"
    >
      <AlertTriangle class="h-4 w-4 shrink-0" />
      <span>{{ noticeText }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Box,
  FileText,
  PauseCircle,
  Pencil,
  PlayCircle,
  Send,
  Trash2,
} from 'lucide-vue-next'
import { computed } from 'vue'
import {
  CHANNEL_TYPE_LABELS,
  type ChannelType,
  intervalLabel,
  pausedReasonLabel,
  type Subscription,
} from '../../types/subscription'
import TagBadge from '../common/TagBadge.vue'
import InfoItem from './InfoItem.vue'

const props = withDefaults(
  defineProps<{
    subscription: Subscription
    busy?: boolean
  }>(),
  {
    busy: false,
  },
)

const emit = defineEmits<{
  edit: [sub: Subscription]
  'check-now': [sub: Subscription]
  pause: [sub: Subscription]
  remove: [sub: Subscription]
  resume: [sub: Subscription]
  'view-logs': [sub: Subscription]
}>()

const isPaused = computed(() => Boolean(props.subscription.paused_reason))

const hasAttention = computed(() =>
  Boolean(props.subscription.paused_reason) ||
  !props.subscription.channel_snapshot ||
  props.subscription.consecutive_failures > 0,
)

const statusLabel = computed(() =>
  pausedReasonLabel(props.subscription.paused_reason) || '运行中',
)

const channelLabel = computed(() => {
  if (!props.subscription.channel_snapshot) return '未配置'
  const baseLabel =
    props.subscription.channel_snapshot.label ||
    channelTypeLabel(props.subscription.channel_snapshot.type)
  return props.subscription.channel_snapshot.is_default
    ? `${baseLabel}（主）`
    : baseLabel
})

const summaryLine = computed(() => {
  if (props.subscription.paused_reason === 'channel_error') {
    return '推送通道最近连续失败，订阅已自动暂停，恢复通道后即可继续跟踪。'
  }
  if (props.subscription.paused_reason === 'no_channel') {
    return '当前没有可用推送通道，补齐通道并恢复后才会继续检查和通知。'
  }
  if (props.subscription.paused_reason === 'user_paused') {
    return '该订阅已手动暂停，恢复后会继续按既定频率轮询新版本。'
  }
  if (!props.subscription.channel_snapshot) {
    return '订阅已创建，但尚未绑定推送通道；后续更新暂时不会主动通知。'
  }

  return props.subscription.include_prerelease
    ? `通过 ${channelLabel.value} 接收正式版与预发布版更新提醒。`
    : `通过 ${channelLabel.value} 接收稳定版更新提醒。`
})

const noticeText = computed(() => {
  if (props.subscription.consecutive_failures > 0 && !props.subscription.paused_reason) {
    return `最近连续 ${props.subscription.consecutive_failures} 次推送失败，建议尽快检查通道配置。`
  }

  if (props.subscription.paused_reason === 'user_paused') {
    return '暂停期间不会自动检查版本，也不会推送更新通知。'
  }

  if (props.subscription.paused_reason === 'no_channel') {
    return '当前没有默认通道可用，恢复前请先补齐推送通道。'
  }

  return ''
})

const noticeToneClass = computed(() => {
  if (props.subscription.paused_reason === 'no_channel') {
    return 'subscription-card__notice--info'
  }
  if (props.subscription.paused_reason === 'user_paused') {
    return 'subscription-card__notice--muted'
  }
  return 'subscription-card__notice--warning'
})

function togglePause() {
  if (isPaused.value) {
    emit('resume', props.subscription)
    return
  }
  emit('pause', props.subscription)
}

function channelTypeLabel(type: string): string {
  return CHANNEL_TYPE_LABELS[type as ChannelType] || type
}

function formatScheduleTime(iso: string): string {
  try {
    const target = new Date(iso)
    const now = new Date()
    const diff = target.getTime() - now.getTime()

    if (Number.isNaN(target.getTime())) return iso
    if (diff <= 0) return '即将检查'

    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes} 分钟后`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} 小时后`

    return target.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatRelativeTime(iso: string | null, fallback: string): string {
  if (!iso) return fallback

  try {
    const target = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - target.getTime()

    if (Number.isNaN(target.getTime())) return fallback
    if (diff < 0) return target.toLocaleString('zh-CN')

    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} 小时前`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} 天前`

    return target.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return fallback
  }
}
</script>

<style scoped>
.subscription-card {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--home-card-border) 90%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-surface-strong) 94%, transparent), color-mix(in srgb, var(--home-surface) 92%, transparent));
  box-shadow: var(--home-card-shadow);
  transition:
    transform 180ms var(--ease),
    box-shadow 180ms var(--ease),
    border-color 180ms var(--ease),
    background-color 180ms var(--ease);
}

.subscription-card::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgb(30 215 96 / 0.16) 45%, transparent 100%);
}

.subscription-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--home-card-border-hover) 90%, transparent);
  box-shadow: var(--home-card-shadow-hover);
}

.subscription-card__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.25fr) auto;
  gap: 16px;
  padding: 17px 18px;
}

.subscription-card__lead {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.subscription-card__icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--home-card-icon-ring) 92%, transparent);
  background: var(--home-card-icon-shell);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12);
}

.subscription-card__icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.subscription-card__icon-fallback {
  color: var(--home-text-subtle);
}

.subscription-card__summary {
  min-width: 0;
}

.subscription-card__eyebrow {
  color: var(--home-text-subtle);
  font-size: 11px;
  line-height: 1.2;
}

.subscription-card__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.subscription-card__title {
  color: var(--home-text-strong);
  font-size: 1.22rem;
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: 0;
  transition: color var(--dur) var(--ease);
}

.subscription-card__title:hover {
  color: var(--theme-primary-400);
}

.subscription-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subscription-card__description {
  max-width: 38ch;
  margin-top: 8px;
  color: var(--home-text-muted);
  font-size: 13px;
  line-height: 1.55;
}

.subscription-card__details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px 16px;
  min-width: 0;
  padding-top: 2px;
}

.subscription-card__actions {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 132px;
}

.subscription-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--home-border) 88%, transparent);
  background: color-mix(in srgb, var(--home-surface-soft) 82%, transparent);
  color: var(--home-text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  transition:
    transform var(--dur) var(--ease),
    color var(--dur) var(--ease),
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.subscription-card__action:hover {
  color: var(--home-text-strong);
  background: var(--home-surface-hover);
  border-color: color-mix(in srgb, var(--home-border-strong) 88%, transparent);
  box-shadow: 0 16px 28px -24px rgb(15 23 42 / 0.3);
}

.subscription-card__action:focus-visible {
  outline: none;
  border-color: var(--home-accent-border);
  box-shadow: var(--home-focus-ring-soft);
}

.subscription-card__action--primary {
  background: color-mix(in srgb, var(--home-accent-soft) 82%, var(--home-surface-soft));
  color: var(--home-text-strong);
  border-color: color-mix(in srgb, var(--home-accent-border) 82%, transparent);
}

.subscription-card__action--danger {
  color: #f3727f;
}

.subscription-card__action--pause {
  color: #ffc778;
}

.subscription-card__action--pause:hover {
  color: #ffd89a;
  border-color: rgb(255 164 43 / 0.28);
  background: rgb(255 164 43 / 0.08);
}

.subscription-card__action--restore {
  color: var(--theme-primary-400);
  border-color: color-mix(in srgb, var(--home-accent-border) 76%, transparent);
  background: color-mix(in srgb, var(--home-accent-soft) 72%, var(--home-surface-soft));
}

.subscription-card__action--restore:hover {
  color: var(--theme-primary-400);
  border-color: color-mix(in srgb, var(--home-accent-border) 92%, transparent);
  background: color-mix(in srgb, var(--home-accent-soft) 92%, var(--home-surface-soft));
}

.subscription-card__action--danger:hover {
  color: #ff9ca5;
  border-color: rgb(243 114 127 / 0.28);
  background: rgb(243 114 127 / 0.08);
}

.subscription-card__action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

.subscription-card__action:disabled:hover {
  color: var(--home-text);
  background: color-mix(in srgb, var(--home-surface-soft) 82%, transparent);
  border-color: color-mix(in srgb, var(--home-border) 88%, transparent);
}

.subscription-card__notice {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 18px 18px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid transparent;
}

.subscription-card__notice--warning {
  color: #ffc778;
  background: rgb(255 164 43 / 0.08);
  border-color: rgb(255 164 43 / 0.16);
}

.subscription-card__notice--info {
  color: #9bc2ff;
  background: rgb(83 157 245 / 0.08);
  border-color: rgb(83 157 245 / 0.18);
}

.subscription-card__notice--muted {
  color: var(--home-text-muted);
  background: color-mix(in srgb, var(--home-surface-soft) 72%, transparent);
  border-color: color-mix(in srgb, var(--home-border) 82%, transparent);
}

.subscription-card__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}

.subscription-card__value--muted {
  color: var(--home-text-subtle);
  font-weight: 500;
}

.subscription-card__value--warning {
  color: #ffc778;
}

.subscription-card--paused::before {
  background: linear-gradient(90deg, transparent 0%, rgb(255 164 43 / 0.22) 45%, transparent 100%);
}

.subscription-card--attention:not(.subscription-card--paused)::before {
  background: linear-gradient(90deg, transparent 0%, rgb(83 157 245 / 0.22) 45%, transparent 100%);
}

@media (max-width: 1180px) {
  .subscription-card__layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .subscription-card__details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .subscription-card__actions {
    grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .subscription-card {
    border-radius: 14px;
  }

  .subscription-card__layout {
    padding: 16px;
    gap: 14px;
  }

  .subscription-card__lead {
    gap: 12px;
  }

  .subscription-card__icon-shell {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }

  .subscription-card__title {
    font-size: 1.12rem;
  }

  .subscription-card__details {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .subscription-card__actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .subscription-card__action {
    min-height: 40px;
    justify-content: flex-start;
  }

  .subscription-card__notice {
    margin: 0 16px 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .subscription-card,
  .subscription-card__title,
  .subscription-card__action {
    transition: none;
  }

  .subscription-card:hover {
    transform: none;
  }
}
</style>
