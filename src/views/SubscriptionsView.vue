<template>
  <div class="min-h-screen bg-[#f3f5f4] dark:bg-[#121212] transition-colors duration-300">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-30 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/" class="text-lg font-bold text-gray-900 dark:text-white hover:text-primary transition-colors">
            软件清单
          </router-link>
          <span class="text-gray-400 dark:text-gray-600">/</span>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">我的订阅</span>
        </div>
        <router-link
          to="/"
          class="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
        >
          <Home class="w-4 h-4" />
          <span class="hidden sm:inline">返回首页</span>
        </router-link>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell class="w-6 h-6 text-primary" />
            我的订阅
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            订阅 GitHub 开源项目，发布新版本时通过已绑定的推送通道通知你
          </p>
        </div>
        <BaseButton variant="ghost" size="sm" :loading="loading" @click="loadAll">
          <RefreshCw class="w-4 h-4" />
          刷新
        </BaseButton>
      </div>

      <!-- 状态卡片 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="订阅总数" :value="stats.total" :max="100" />
        <StatCard label="正常运行" :value="stats.active" variant="success" />
        <StatCard label="已暂停" :value="stats.paused" variant="warning" />
        <StatCard label="未设通道" :value="stats.noChannel" variant="info" />
      </div>

      <!-- 主体 -->
      <div v-if="loading" class="py-16 flex justify-center">
        <div class="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary animate-spin" />
      </div>

      <div
        v-else-if="subscriptions.length === 0"
        class="py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/30"
      >
        <Bell class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">还没有订阅任何软件</p>
        <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
          在软件详情页点击"订阅更新"即可开始
        </p>
      </div>

      <div v-else class="space-y-3">
        <SubscriptionCard
          v-for="sub in subscriptions"
          :key="sub.id"
          :subscription="sub"
          @edit="openEdit"
          @check-now="handleCheckNow"
          @remove="confirmRemove"
          @view-logs="openLogs"
        />
      </div>
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
import { Bell, Home, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '../components/common/BaseButton.vue'
import DeleteConfirmDialog from '../components/common/DeleteConfirmDialog.vue'
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

const subscriptions = ref<Subscription[]>([])
const loading = ref(false)
const submitting = ref(false)
const removing = ref(false)

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
    else active += 1
    if (!s.channel_snapshot) noChannel += 1
  }
  return { total, active, paused, noChannel }
})

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
