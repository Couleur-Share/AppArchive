<template>
  <div class="inline-block">
    <BaseButton
      v-if="!isSubscribed"
      size="sm"
      :variant="variant"
      :loading="loading"
      :disabled="disabled"
      @click="handleClick"
    >
      <Bell class="w-4 h-4" />
      <span>订阅更新</span>
    </BaseButton>

    <BaseButton
      v-else-if="isPaused"
      size="sm"
      variant="secondary"
      :loading="loading"
      @click="handleClick"
    >
      <BellOff class="w-4 h-4 text-amber-500" />
      <span class="text-amber-600 dark:text-amber-400">订阅已暂停</span>
    </BaseButton>

    <BaseButton
      v-else
      size="sm"
      variant="secondary"
      :loading="loading"
      @click="handleClick"
    >
      <BellRing class="w-4 h-4 text-primary" />
      <span>已订阅</span>
    </BaseButton>

    <!-- 订阅对话框 -->
    <SubscriptionDialog
      v-model:show="dialogShow"
      :software="software"
      :initial-subscription="subscription"
      :submitting="submitting"
      @save="handleSave"
      @unsubscribe="handleUnsubscribe"
    />
  </div>
</template>

<script setup lang="ts">
import { Bell, BellOff, BellRing } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { isSignedIn } from '../../lib/auth'
import { subscriptionService } from '../../services/subscription'
import type {
  CheckIntervalMinutes,
  Subscription,
} from '../../types/subscription'
import BaseButton from '../common/BaseButton.vue'
import SubscriptionDialog from './SubscriptionDialog.vue'

const props = defineProps<{
  software: { id: number; name: string; icon?: string; website?: string }
  variant?: 'primary' | 'secondary' | 'ghost'
}>()

const { showToast } = useToast()

const subscription = ref<Subscription | null>(null)
const loading = ref(false)
const submitting = ref(false)
const dialogShow = ref(false)

const isSubscribed = computed(() => subscription.value !== null)
const isPaused = computed(() => Boolean(subscription.value?.paused_reason))

const variant = computed(() => props.variant || 'secondary')

// 仅 GitHub 仓库才允许订阅；非 GitHub 的完全不显示（由父组件判断）
const disabled = computed(() => {
  if (!props.software.website) return true
  try {
    const url = new URL(props.software.website)
    return url.hostname !== 'github.com'
  } catch {
    return true
  }
})

async function loadState() {
  if (!isSignedIn.value) {
    subscription.value = null
    return
  }
  loading.value = true
  try {
    subscription.value = await subscriptionService.getForSoftware(props.software.id)
  } finally {
    loading.value = false
  }
}

function handleClick() {
  if (!isSignedIn.value) {
    showToast('请先登录再订阅', 'error')
    return
  }
  if (disabled.value) {
    showToast('仅支持订阅 GitHub 开源项目', 'info')
    return
  }
  dialogShow.value = true
}

async function handleSave(payload: {
  channel_id: number | null
  check_interval_minutes: CheckIntervalMinutes
  include_prerelease: boolean
}) {
  submitting.value = true
  try {
    if (subscription.value) {
      const patch: Parameters<typeof subscriptionService.update>[1] = {
        channel_id: payload.channel_id,
        check_interval_minutes: payload.check_interval_minutes,
        include_prerelease: payload.include_prerelease,
      }
      // 若曾被暂停，保存即恢复
      if (subscription.value.paused_reason) {
        patch.resume = true
      }
      subscription.value = await subscriptionService.update(
        subscription.value.id,
        patch,
      )
      showToast('订阅已更新', 'success')
    } else {
      subscription.value = await subscriptionService.create({
        software_id: props.software.id,
        channel_id: payload.channel_id,
        check_interval_minutes: payload.check_interval_minutes,
        include_prerelease: payload.include_prerelease,
      })
      showToast('订阅成功，新版本发布时会推送通知', 'success')
    }
    dialogShow.value = false
  } catch (err) {
    showToast((err as Error).message || '操作失败', 'error')
  } finally {
    submitting.value = false
  }
}

async function handleUnsubscribe() {
  if (!subscription.value) return
  submitting.value = true
  try {
    await subscriptionService.remove(subscription.value.id)
    subscription.value = null
    dialogShow.value = false
    showToast('已取消订阅', 'success')
  } catch (err) {
    showToast((err as Error).message || '取消订阅失败', 'error')
  } finally {
    submitting.value = false
  }
}

// 登录状态变化时重新加载
watch(isSignedIn, loadState)
watch(() => props.software.id, loadState)

onMounted(loadState)

defineExpose({ reload: loadState })
</script>
