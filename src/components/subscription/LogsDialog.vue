<template>
  <TransitionRoot appear :show="show" as="Fragment">
    <Dialog
      as="div"
      class="relative z-50"
      @close="close"
    >
      <TransitionChild>
        <div class="fixed inset-0 app-modal-backdrop" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild>
            <DialogPanel class="relative transform overflow-hidden rounded-xl app-modal-panel app-modal-panel--interactive p-6 text-left shadow-level3 w-full max-w-2xl">
              <DialogTitle as="h3" class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText class="w-5 h-5 text-primary" />
                通知日志
                <span v-if="subscription" class="ml-1 text-sm text-gray-500 dark:text-gray-400 font-normal">
                  · {{ subscription.software_snapshot.name }}
                </span>
              </DialogTitle>

              <!-- 加载 -->
              <div v-if="loading" class="py-12 flex justify-center">
                <div class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary animate-spin" />
              </div>

              <!-- 空 -->
              <div
                v-else-if="logs.length === 0"
                class="py-12 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                暂无推送记录
              </div>

              <!-- 列表 -->
              <div
                v-else
                class="mt-4 space-y-2 max-h-[60vh] overflow-y-auto"
              >
                <div
                  v-for="log in logs"
                  :key="log.id"
                  class="px-3 py-2 rounded-lg border text-sm"
                  :class="[
                    log.status === 'success'
                      ? 'border-green-200 dark:border-green-900/50 bg-green-50/60 dark:bg-green-900/10'
                      : log.status === 'failed'
                      ? 'border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30'
                  ]"
                >
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                      <TagBadge
                        size="xs"
                        :variant="log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'neutral'"
                      >
                        {{ statusLabel(log.status) }}
                      </TagBadge>
                      <span v-if="log.tag_name" class="font-mono text-xs text-gray-700 dark:text-gray-300">
                        {{ log.tag_name }}
                      </span>
                      <span class="text-xs text-gray-400">{{ log.channel_type }}</span>
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ formatTime(log.sent_at) }}
                      <span v-if="log.latency_ms" class="ml-1">· {{ log.latency_ms }}ms</span>
                    </div>
                  </div>
                  <div
                    v-if="log.error"
                    class="mt-1 text-xs text-red-600 dark:text-red-400 break-all"
                  >
                    {{ log.error }}
                  </div>
                </div>
              </div>

              <div class="mt-4 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                <BaseButton v-if="subscription" size="sm" variant="ghost" :loading="loading" @click="reload">
                  <RefreshCw class="w-4 h-4" />
                  刷新
                </BaseButton>
                <BaseButton size="sm" variant="primary" @click="close">关闭</BaseButton>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { FileText, RefreshCw } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { subscriptionService } from '../../services/subscription'
import type { NotificationLog, Subscription } from '../../types/subscription'
import BaseButton from '../common/BaseButton.vue'
import TagBadge from '../common/TagBadge.vue'

const props = defineProps<{
  show: boolean
  subscription: Subscription | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const { showToast } = useToast()

const logs = ref<NotificationLog[]>([])
const loading = ref(false)

async function reload() {
  if (!props.subscription) return
  loading.value = true
  try {
    logs.value = await subscriptionService.logs(props.subscription.id, 100)
  } catch (err) {
    showToast((err as Error).message || '加载日志失败', 'error')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (v) => {
    if (v && props.subscription) reload()
  },
)

function close() {
  emit('update:show', false)
}

function statusLabel(status: string): string {
  if (status === 'success') return '成功'
  if (status === 'failed') return '失败'
  if (status === 'skipped') return '跳过'
  return status
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>
