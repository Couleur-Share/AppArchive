<template>
  <div class="space-y-3">
    <!-- 顶部标题 + 计数 -->
    <div v-if="label || maxItems" class="flex items-center justify-between">
      <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
      </label>
      <span v-if="maxItems" class="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
        {{ localItems.length }} / {{ maxItems }}
      </span>
    </div>

    <!-- 空状态 -->
    <div
      v-if="localItems.length === 0"
      class="py-6 flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700"
    >
      <component :is="emptyIcon" class="w-7 h-7 text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-400 dark:text-gray-500">{{ emptyTitle }}</p>
      <p v-if="emptyHint" class="text-xs text-gray-400/70 dark:text-gray-500/70">
        {{ emptyHint }}
      </p>
    </div>

    <!-- 条目列表 -->
    <div
      v-for="(item, idx) in localItems"
      :key="getItemKey(item, idx)"
      class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-gray-600"
    >
      <!-- 顶部操作条：序号 + 上下移 + 删除 -->
      <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <span class="text-xs font-mono font-bold text-primary/70 tabular-nums">
          {{ String(idx + 1).padStart(2, '0') }}
        </span>
        <div class="flex items-center gap-0.5">
          <IconButton
            size="xs"
            :disabled="disabled || idx === 0"
            @click="moveUp(idx)"
            title="上移"
          >
            <ChevronUp class="w-3.5 h-3.5" />
          </IconButton>
          <IconButton
            size="xs"
            :disabled="disabled || idx === localItems.length - 1"
            @click="moveDown(idx)"
            title="下移"
          >
            <ChevronDown class="w-3.5 h-3.5" />
          </IconButton>
          <IconButton
            size="xs"
            variant="danger"
            :disabled="disabled"
            @click="removeItem(idx)"
            title="删除"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>

      <!-- 字段编辑区 -->
      <div class="px-3 pb-3 space-y-2">
        <div
          v-for="field in fields"
          :key="`${getItemKey(item, idx)}-${field.key}`"
          class="space-y-1"
        >
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-500 dark:text-gray-400">
              {{ field.label }}
            </label>
            <span
              v-if="field.maxLength"
              class="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums"
            >
              {{ (item[field.key] || '').length }}/{{ field.maxLength }}
            </span>
          </div>
          <textarea
            v-if="field.multiline"
            :value="item[field.key] || ''"
            @input="onFieldInput(idx, field, $event)"
            :disabled="disabled"
            :placeholder="field.placeholder"
            :maxlength="field.maxLength"
            rows="2"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
          <input
            v-else
            type="text"
            :value="item[field.key] || ''"
            @input="onFieldInput(idx, field, $event)"
            :disabled="disabled"
            :placeholder="field.placeholder"
            :maxlength="field.maxLength"
            class="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <!-- 可选的分类选择器（如 highlights.kind） -->
        <div v-if="kindField && kindOptions && kindOptions.length" class="space-y-1">
          <label class="text-xs text-gray-500 dark:text-gray-400">{{ kindLabel }}</label>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="opt in kindOptions"
              :key="opt.value"
              type="button"
              :disabled="disabled"
              @click="onKindSelect(idx, opt.value)"
              class="px-2 py-0.5 rounded-md text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              :class="item[kindField] === opt.value
                ? 'bg-primary/12 text-primary dark:bg-primary/[0.16] font-medium'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加按钮 -->
    <button
      type="button"
      @click="addItem"
      :disabled="disabled || (maxItems !== undefined && localItems.length >= maxItems)"
      class="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400"
    >
      <Plus class="w-4 h-4" />
      <span>{{ addLabel }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp, List, Plus, Trash2 } from 'lucide-vue-next'
import type { FunctionalComponent } from 'vue'
import { nextTick, ref, watch } from 'vue'
import IconButton from './IconButton.vue'

export interface PairListFieldDef {
  key: string
  label: string
  placeholder: string
  maxLength?: number
  multiline?: boolean
}

export interface PairListKindOption {
  value: string
  label: string
}

type Item = Record<string, string>
type IconCmp = FunctionalComponent<Record<string, unknown>>

const props = withDefaults(defineProps<{
  modelValue: Item[] | undefined
  fields: PairListFieldDef[]
  label?: string
  addLabel?: string
  maxItems?: number
  disabled?: boolean
  emptyTitle?: string
  emptyHint?: string
  emptyIcon?: IconCmp
  kindField?: string
  kindLabel?: string
  kindOptions?: PairListKindOption[]
}>(), {
  addLabel: '添加一项',
  emptyTitle: '暂无条目',
  emptyIcon: () => List as unknown as IconCmp,
  kindLabel: '类别',
})

const emit = defineEmits<{
  'update:modelValue': [value: Item[]]
}>()

const localItems = ref<Item[]>(cloneList(props.modelValue))
const syncing = ref(false)

// 生成稳定 uuid，兼容无 crypto.randomUUID 的环境
function genId(): string {
  return globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// 克隆并为每条数据附加内部 __id 用于 v-for 稳定 key
function cloneList(raw: Item[] | undefined): Item[] {
  if (!Array.isArray(raw)) return []
  return raw.map((x) => {
    const item = { ...(x || {}) }
    if (!item.__id) item.__id = genId()
    return item
  })
}

// 外发数据时剥掉内部 __id，避免污染存储层
function stripInternal(items: Item[]): Item[] {
  return items.map((item) => {
    const { __id: _ignored, ...rest } = item
    return rest
  })
}

watch(() => props.modelValue, async (v) => {
  syncing.value = true
  localItems.value = cloneList(v)
  await nextTick()
  syncing.value = false
}, { deep: true })

watch(localItems, (v) => {
  if (syncing.value) return
  emit('update:modelValue', stripInternal(v))
}, { deep: true })

const getItemKey = (item: Item, idx: number): string => {
  // 优先使用 __id（若存在），否则回退到索引
  return (item && typeof item.__id === 'string' && item.__id) || `row-${idx}`
}

const buildEmptyItem = (): Item => {
  const empty: Item = { __id: genId() }
  for (const f of props.fields) empty[f.key] = ''
  if (props.kindField && props.kindOptions && props.kindOptions.length) {
    empty[props.kindField] = props.kindOptions[0].value
  }
  return empty
}

const addItem = () => {
  if (props.maxItems !== undefined && localItems.value.length >= props.maxItems) return
  localItems.value = [...localItems.value, buildEmptyItem()]
}

const removeItem = (idx: number) => {
  const next = [...localItems.value]
  next.splice(idx, 1)
  localItems.value = next
}

const moveUp = (idx: number) => {
  if (idx <= 0) return
  const items = localItems.value.map((a) => ({ ...a }))
  ;[items[idx - 1], items[idx]] = [items[idx], items[idx - 1]]
  localItems.value = items
}

const moveDown = (idx: number) => {
  if (idx >= localItems.value.length - 1) return
  const items = localItems.value.map((a) => ({ ...a }))
  ;[items[idx], items[idx + 1]] = [items[idx + 1], items[idx]]
  localItems.value = items
}

const onFieldInput = (idx: number, field: PairListFieldDef, ev: Event) => {
  const target = ev.target as HTMLInputElement | HTMLTextAreaElement
  const value = target?.value ?? ''
  const items = localItems.value.map((a) => ({ ...a }))
  if (!items[idx]) return
  items[idx][field.key] = value
  localItems.value = items
}

const onKindSelect = (idx: number, value: string) => {
  if (!props.kindField) return
  const items = localItems.value.map((a) => ({ ...a }))
  if (!items[idx]) return
  items[idx][props.kindField] = value
  localItems.value = items
}
</script>

<style scoped>
</style>
