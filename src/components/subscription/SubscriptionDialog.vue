<template>
  <TransitionRoot appear :show="show" as="Fragment">
    <Dialog
      as="div"
      class="relative z-50"
      @close="$emit('update:show', false)"
    >
      <TransitionChild>
        <div class="fixed inset-0 app-modal-backdrop" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild>
            <DialogPanel class="relative transform overflow-hidden rounded-xl app-modal-panel app-modal-panel--interactive p-6 text-left shadow-level3 w-full max-w-md">
              <DialogTitle as="h3" class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell class="w-5 h-5 text-primary" />
                {{ isEdit ? '编辑订阅' : '订阅更新' }}
              </DialogTitle>

              <!-- 软件名称 -->
              <div class="mt-3 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <img v-if="software.icon" :src="software.icon" class="w-5 h-5 rounded" alt="" />
                <span class="font-medium">{{ software.name }}</span>
              </div>

              <!-- 无通道提示 -->
              <div
                v-if="!loadingChannels && channels.length === 0"
                class="mt-4 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2"
              >
                <AlertTriangle class="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>你还没有绑定任何推送通道。</p>
                  <p class="mt-0.5 text-xs">请先到设置 → 通知渠道 添加至少一个通道。</p>
                </div>
              </div>

              <!-- 表单 -->
              <form v-else @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                <!-- 检查频率 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    检查频率
                  </label>
                  <div class="grid grid-cols-5 gap-1.5">
                    <button
                      v-for="preset in INTERVAL_PRESETS"
                      :key="preset.value"
                      type="button"
                      @click="intervalLocal = preset.value"
                      :class="[
                        'px-2 py-2 rounded-md text-xs transition-all',
                        intervalLocal === preset.value
                          ? 'bg-primary text-[rgb(18_18_18)] font-medium shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      ]"
                    >
                      {{ preset.label }}
                    </button>
                  </div>
                </div>

                <!-- 通道选择 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    推送通道
                  </label>
                  <select
                    v-model="channelLocal"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                  >
                    <option :value="null">
                      默认主通道{{ primaryChannel ? ` (${primaryChannel.label || channelLabel(primaryChannel.channel_type)})` : '' }}
                    </option>
                    <option
                      v-for="ch in channels"
                      :key="ch.id"
                      :value="ch.id"
                    >
                      {{ ch.label || channelLabel(ch.channel_type) }}
                      <template v-if="ch.is_primary"> · 主通道</template>
                      <template v-if="!ch.enabled"> · 已禁用</template>
                    </option>
                  </select>
                </div>

                <!-- 选项 -->
                <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    v-model="includePrereleaseLocal"
                    type="checkbox"
                    class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary/60"
                  />
                  <span>包含预发布版本（Pre-release）</span>
                </label>

                <!-- 错误消息 -->
                <div
                  v-if="errorMsg"
                  class="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400"
                >
                  {{ errorMsg }}
                </div>

                <!-- 操作按钮 -->
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <BaseButton
                    v-if="isEdit"
                    type="button"
                    variant="ghost"
                    size="sm"
                    :disabled="submitting"
                    @click="$emit('unsubscribe')"
                  >
                    <Trash2 class="w-4 h-4 text-red-500" />
                    <span class="text-red-500">取消订阅</span>
                  </BaseButton>
                  <div class="flex-1" />
                  <BaseButton variant="ghost" size="sm" type="button" @click="$emit('update:show', false)">
                    关闭
                  </BaseButton>
                  <BaseButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    :loading="submitting"
                  >
                    {{ isEdit ? '保存修改' : '订阅' }}
                  </BaseButton>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { AlertTriangle, Bell, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { channelsService } from '../../services/channels'
import {
  CHANNEL_TYPE_LABELS,
  type ChannelType,
  type CheckIntervalMinutes,
  INTERVAL_PRESETS,
  type Subscription,
  type UserChannel,
} from '../../types/subscription'
import BaseButton from '../common/BaseButton.vue'

const props = defineProps<{
  show: boolean
  software: { id: number; name: string; icon?: string }
  initialSubscription?: Subscription | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [payload: {
    channel_id: number | null
    check_interval_minutes: CheckIntervalMinutes
    include_prerelease: boolean
  }]
  unsubscribe: []
}>()

const { showToast } = useToast()

const channels = ref<UserChannel[]>([])
const loadingChannels = ref(false)

const intervalLocal = ref<CheckIntervalMinutes>(60)
const channelLocal = ref<number | null>(null)
const includePrereleaseLocal = ref(false)
const errorMsg = ref('')

const isEdit = computed(() => Boolean(props.initialSubscription))

const primaryChannel = computed(
  () => channels.value.find((c) => c.is_primary) || null,
)

function channelLabel(type: string): string {
  return CHANNEL_TYPE_LABELS[type as ChannelType] || type
}

async function loadChannels() {
  loadingChannels.value = true
  try {
    channels.value = await channelsService.list()
  } catch (err) {
    showToast((err as Error).message || '加载通道失败', 'error')
  } finally {
    loadingChannels.value = false
  }
}

function resetFromSubscription() {
  if (props.initialSubscription) {
    intervalLocal.value = props.initialSubscription.check_interval_minutes
    channelLocal.value = props.initialSubscription.channel_id
    includePrereleaseLocal.value = props.initialSubscription.include_prerelease
  } else {
    intervalLocal.value = 60
    channelLocal.value = null
    includePrereleaseLocal.value = false
  }
  errorMsg.value = ''
}

// 对话框打开时同步数据
watch(
  () => props.show,
  (v) => {
    if (v) {
      resetFromSubscription()
      loadChannels()
    }
  },
)

// 监听初始值变化
watch(() => props.initialSubscription, resetFromSubscription)

function handleSubmit() {
  errorMsg.value = ''
  if (!props.initialSubscription && channels.value.length === 0) {
    errorMsg.value = '请先绑定至少一个推送通道'
    return
  }
  emit('save', {
    channel_id: channelLocal.value,
    check_interval_minutes: intervalLocal.value,
    include_prerelease: includePrereleaseLocal.value,
  })
}
</script>
