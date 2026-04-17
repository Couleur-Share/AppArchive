<template>
  <div
    class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
  >
    <div class="flex items-start gap-4">
      <!-- 图标 -->
      <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        <img
          v-if="subscription.software_snapshot.icon"
          :src="subscription.software_snapshot.icon"
          class="w-full h-full object-cover"
          alt=""
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
          <Box class="w-6 h-6" />
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <router-link
            :to="`/software/${subscription.software_id}`"
            class="font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors"
          >
            {{ subscription.software_snapshot.name }}
          </router-link>

          <TagBadge v-if="subscription.paused_reason" size="xs" variant="warning">
            {{ pausedReasonLabel(subscription.paused_reason) }}
          </TagBadge>
          <TagBadge v-else size="xs" variant="success">
            运行中
          </TagBadge>

          <TagBadge v-if="subscription.include_prerelease" size="xs" variant="info">
            含 Pre-release
          </TagBadge>
        </div>

        <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500 dark:text-gray-400">
          <InfoItem label="检查频率">
            {{ intervalLabel(subscription.check_interval_minutes) }}
          </InfoItem>
          <InfoItem label="推送通道">
            <span v-if="subscription.channel_snapshot">
              {{ subscription.channel_snapshot.label || channelTypeLabel(subscription.channel_snapshot.type) }}
              <span v-if="subscription.channel_snapshot.is_default" class="text-gray-400">(主)</span>
            </span>
            <span v-else class="text-amber-600 dark:text-amber-400">未配置</span>
          </InfoItem>
          <InfoItem label="当前版本">
            <span v-if="subscription.last_notified_version" class="font-mono text-gray-700 dark:text-gray-300">
              {{ subscription.last_notified_version }}
            </span>
            <span v-else class="text-gray-400">待首次检查</span>
          </InfoItem>
          <InfoItem label="下次检查">
            {{ formatTime(subscription.next_check_at) }}
          </InfoItem>
        </div>

        <!-- 失败警告 -->
        <div
          v-if="subscription.consecutive_failures > 0 && !subscription.paused_reason"
          class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"
        >
          <AlertTriangle class="w-3.5 h-3.5" />
          最近连续 {{ subscription.consecutive_failures }} 次推送失败
        </div>
      </div>

      <!-- 右侧操作 -->
      <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
        <BaseButton size="xs" variant="secondary" @click="$emit('edit', subscription)">
          <Pencil class="w-3.5 h-3.5" />
          编辑
        </BaseButton>
        <BaseButton size="xs" variant="ghost" @click="$emit('check-now', subscription)">
          <Send class="w-3.5 h-3.5" />
          立即检查
        </BaseButton>
        <BaseButton size="xs" variant="ghost" @click="$emit('view-logs', subscription)">
          <FileText class="w-3.5 h-3.5" />
          查看日志
        </BaseButton>
        <BaseButton size="xs" variant="ghost" @click="$emit('remove', subscription)">
          <Trash2 class="w-3.5 h-3.5 text-red-500" />
          <span class="text-red-500">取消</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Box,
  FileText,
  Pencil,
  Send,
  Trash2,
} from 'lucide-vue-next'
import {
  CHANNEL_TYPE_LABELS,
  type ChannelType,
  intervalLabel,
  pausedReasonLabel,
  type Subscription,
} from '../../types/subscription'
import BaseButton from '../common/BaseButton.vue'
import TagBadge from '../common/TagBadge.vue'
import InfoItem from './InfoItem.vue'

defineProps<{
  subscription: Subscription
}>()

defineEmits<{
  edit: [sub: Subscription]
  'check-now': [sub: Subscription]
  remove: [sub: Subscription]
  'view-logs': [sub: Subscription]
}>()

function channelTypeLabel(type: string): string {
  return CHANNEL_TYPE_LABELS[type as ChannelType] || type
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    if (diff < 0) return '即将检查'
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes} 分钟后`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} 小时后`
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>
