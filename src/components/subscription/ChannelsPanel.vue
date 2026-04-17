<template>
  <div class="space-y-4">
    <!-- 标题与新增按钮 -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">推送通道</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          绑定后即可订阅 GitHub 开源项目的版本更新推送
        </p>
      </div>
      <BaseButton
        v-if="!editing"
        variant="primary"
        size="sm"
        :disabled="loading"
        @click="startAdd"
      >
        <Plus class="w-4 h-4" />
        添加通道
      </BaseButton>
    </div>

    <!-- 表单（新建 / 编辑） -->
    <div
      v-if="editing"
      class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
    >
      <div class="mb-3 flex items-center gap-2">
        <span class="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
          {{ formMode === 'create' ? '添加 MeoW 通道' : '编辑通道' }}
        </span>
      </div>
      <MeowChannelForm
        :initial="formMode === 'edit' ? editingChannel : null"
        :submitting="submitting"
        @save="handleSave"
        @cancel="cancelEdit"
      />
    </div>

    <!-- 加载中 -->
    <div
      v-else-if="loading"
      class="flex items-center justify-center py-12 text-gray-500"
    >
      <div class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary animate-spin" />
      <span class="ml-3 text-sm">加载中...</span>
    </div>

    <!-- 空态 -->
    <div
      v-else-if="channels.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <Bell class="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        还没有配置推送通道，点击右上角"添加通道"开始
      </p>
    </div>

    <!-- 通道列表 -->
    <div v-else class="space-y-3">
      <div
        v-for="ch in channels"
        :key="ch.id"
        class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <!-- 左侧信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ ch.label || channelTypeLabel(ch.channel_type) }}
              </span>
              <TagBadge size="xs" variant="neutral">
                {{ channelTypeLabel(ch.channel_type) }}
              </TagBadge>
              <TagBadge v-if="ch.is_primary" size="xs" variant="primary" strong>
                <Star class="w-3 h-3" />
                主通道
              </TagBadge>
              <TagBadge v-if="!ch.enabled" size="xs" variant="warning">
                已禁用
              </TagBadge>
              <TagBadge
                v-if="ch.last_test_status === 'failed'"
                size="xs"
                variant="danger"
              >
                上次测试失败
              </TagBadge>
              <TagBadge
                v-else-if="ch.last_test_status === 'success'"
                size="xs"
                variant="success"
              >
                测试通过
              </TagBadge>
            </div>
            <div class="mt-1.5 text-sm text-gray-600 dark:text-gray-400 font-mono">
              {{ ch.config_masked?.nickname_masked || '(无)' }}
            </div>
            <div
              v-if="ch.last_test_error"
              class="mt-1 text-xs text-red-500 dark:text-red-400 break-all"
            >
              错误：{{ ch.last_test_error }}
            </div>
            <div
              v-if="ch.last_test_at"
              class="mt-1 text-xs text-gray-400 dark:text-gray-500"
            >
              上次测试：{{ formatTime(ch.last_test_at) }}
            </div>
          </div>

          <!-- 右侧操作 -->
          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            <BaseButton
              size="xs"
              variant="secondary"
              :loading="testingIds.has(ch.id)"
              :disabled="!ch.enabled"
              @click="handleTest(ch)"
            >
              <Send class="w-3.5 h-3.5" />
              测试推送
            </BaseButton>
            <BaseButton
              v-if="!ch.is_primary"
              size="xs"
              variant="ghost"
              @click="handleSetPrimary(ch)"
            >
              设为主通道
            </BaseButton>
            <BaseButton size="xs" variant="ghost" @click="startEdit(ch)">
              <Pencil class="w-3.5 h-3.5" />
              编辑
            </BaseButton>
            <BaseButton size="xs" variant="ghost" @click="handleDelete(ch)">
              <Trash2 class="w-3.5 h-3.5 text-red-500" />
              <span class="text-red-500">删除</span>
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 删除确认 -->
  <DeleteConfirmDialog
    :show="deleteTarget !== null"
    :item-name="deleteTarget ? (deleteTarget.label || channelTypeLabel(deleteTarget.channel_type)) : ''"
    :is-deleting="deleting"
    @update:show="(value) => { if (!value) deleteTarget = null }"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { Bell, Pencil, Plus, Send, Star, Trash2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useToast } from '../../composables/useToast'
import { channelsService } from '../../services/channels'
import {
  CHANNEL_TYPE_LABELS,
  type ChannelCreateInput,
  type ChannelType,
  type UserChannel,
} from '../../types/subscription'
import BaseButton from '../common/BaseButton.vue'
import DeleteConfirmDialog from '../common/DeleteConfirmDialog.vue'
import TagBadge from '../common/TagBadge.vue'
import MeowChannelForm from './MeowChannelForm.vue'

const { showToast } = useToast()

const channels = ref<UserChannel[]>([])
const loading = ref(false)
const submitting = ref(false)
const testingIds = ref(new Set<number>())

const editing = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingChannel = ref<UserChannel | null>(null)
const deleteTarget = ref<UserChannel | null>(null)
const deleting = ref(false)

const emit = defineEmits<{ changed: [] }>()

function channelTypeLabel(type: string): string {
  return CHANNEL_TYPE_LABELS[type as ChannelType] || type
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
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

async function loadChannels() {
  loading.value = true
  try {
    channels.value = await channelsService.list()
  } catch (err) {
    showToast((err as Error).message || '加载通道失败', 'error')
  } finally {
    loading.value = false
  }
}

function startAdd() {
  editingChannel.value = null
  formMode.value = 'create'
  editing.value = true
}

function startEdit(ch: UserChannel) {
  editingChannel.value = ch
  formMode.value = 'edit'
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editingChannel.value = null
}

async function handleSave(input: ChannelCreateInput) {
  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await channelsService.create(input)
      showToast('通道已添加', 'success')
    } else if (editingChannel.value) {
      const patch: {
        label?: string
        config?: Record<string, string>
      } = {}
      if (input.label !== undefined) patch.label = input.label
      if (input.config && Object.keys(input.config).length > 0) {
        patch.config = input.config
      }
      await channelsService.update(editingChannel.value.id, patch)
      // is_primary 需要单独调接口
      if (input.is_primary && !editingChannel.value.is_primary) {
        await channelsService.setPrimary(editingChannel.value.id)
      }
      showToast('通道已更新', 'success')
    }
    editing.value = false
    editingChannel.value = null
    await loadChannels()
    emit('changed')
  } catch (err) {
    showToast((err as Error).message || '保存失败', 'error')
  } finally {
    submitting.value = false
  }
}

async function handleTest(ch: UserChannel) {
  testingIds.value.add(ch.id)
  try {
    const result = await channelsService.test(ch.id)
    if (result.ok) {
      showToast('测试推送已发送，请查看 MeoW App', 'success')
    } else {
      showToast(result.error || '测试推送失败', 'error')
    }
    await loadChannels()
  } finally {
    testingIds.value.delete(ch.id)
  }
}

async function handleSetPrimary(ch: UserChannel) {
  try {
    await channelsService.setPrimary(ch.id)
    showToast('已设为主通道', 'success')
    await loadChannels()
    emit('changed')
  } catch (err) {
    showToast((err as Error).message || '设置失败', 'error')
  }
}

function handleDelete(ch: UserChannel) {
  deleteTarget.value = ch
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await channelsService.remove(deleteTarget.value.id)
    showToast('通道已删除', 'success')
    deleteTarget.value = null
    await loadChannels()
    emit('changed')
  } catch (err) {
    showToast((err as Error).message || '删除失败', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadChannels()
})

defineExpose({ reload: loadChannels })
</script>
