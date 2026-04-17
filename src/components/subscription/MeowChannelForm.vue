<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- 标签 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        通道标签（可选）
      </label>
      <input
        v-model="labelLocal"
        type="text"
        maxlength="64"
        placeholder="如：我的 iPhone"
        class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </div>

    <!-- MeoW 昵称 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        MeoW 昵称 <span class="text-red-500">*</span>
        <span v-if="initial" class="ml-2 text-xs text-gray-400 font-normal">
          当前：{{ initial.config_masked?.nickname_masked || '(未设置)' }}
        </span>
      </label>
      <input
        v-model="nicknameLocal"
        type="text"
        maxlength="64"
        :placeholder="initial ? '留空则保持不变' : '请在 MeoW App 中查看你的昵称'"
        class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 font-mono"
      />
      <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
        <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          MeoW 是一款开源推送服务，下载 App 后会生成一个唯一昵称，即可通过本系统接收推送。
          <a href="https://www.chuckfang.com/MeoW/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">了解更多</a>
        </span>
      </p>
    </div>

    <!-- 是否设为主通道 -->
    <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
      <input
        v-model="isPrimaryLocal"
        type="checkbox"
        class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary/60"
      />
      <span>设为主通道（新订阅默认使用此通道）</span>
    </label>

    <!-- 错误提示 -->
    <div
      v-if="errorMsg"
      class="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400"
    >
      {{ errorMsg }}
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
      <BaseButton variant="ghost" size="sm" @click="$emit('cancel')">
        取消
      </BaseButton>
      <BaseButton type="submit" variant="primary" size="sm" :loading="submitting">
        <Save class="w-4 h-4" />
        {{ initial ? '保存修改' : '添加通道' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { Info, Save } from 'lucide-vue-next'
import { ref } from 'vue'
import type { ChannelCreateInput, UserChannel } from '../../types/subscription'
import BaseButton from '../common/BaseButton.vue'

const props = defineProps<{
  initial?: UserChannel | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  save: [input: ChannelCreateInput]
  cancel: []
}>()

const labelLocal = ref(props.initial?.label || '')
const nicknameLocal = ref('')
const isPrimaryLocal = ref(props.initial?.is_primary ?? true)
const errorMsg = ref('')

function handleSubmit() {
  errorMsg.value = ''

  const nickname = nicknameLocal.value.trim()

  // 新建模式：昵称必填
  if (!props.initial && !nickname) {
    errorMsg.value = 'MeoW 昵称不能为空'
    return
  }

  // 编辑模式：昵称留空表示保持不变
  if (nickname) {
    if (nickname.includes('/')) {
      errorMsg.value = 'MeoW 昵称不允许包含斜杠'
      return
    }
    if (nickname.length > 64) {
      errorMsg.value = 'MeoW 昵称长度不能超过 64'
      return
    }
  }

  const input: ChannelCreateInput = {
    channel_type: 'meow',
    label: labelLocal.value.trim(),
    is_primary: isPrimaryLocal.value,
    config: nickname ? { nickname } : {},
  }
  emit('save', input)
}
</script>
