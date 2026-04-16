<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">相关文章/链接</label>

    <!-- 空状态 -->
    <div v-if="localArticles.length === 0" class="py-6 flex flex-col items-center gap-1.5">
      <FileText class="w-7 h-7 text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-400 dark:text-gray-500">暂无关联文章</p>
      <p class="text-xs text-gray-400/70 dark:text-gray-500/70">添加使用文档、教程、FAQ 等相关资源</p>
    </div>

    <!-- 文章列表 -->
    <div
      v-for="(article, idx) in localArticles"
      :key="article.id"
      class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-gray-600"
    >
      <!-- 第一行：标题 + 链接 + 操作按钮 -->
      <div class="flex items-center gap-2 px-3 py-2.5">
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-w-0">
          <input
            v-model="article.title"
            :disabled="disabled"
            placeholder="文章标题，如：使用文档"
            class="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <input
            v-model="article.url"
            :disabled="disabled"
            placeholder="链接地址 https://..."
            class="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div class="flex items-center gap-0.5 shrink-0">
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
            :disabled="disabled || idx === localArticles.length - 1"
            @click="moveDown(idx)"
            title="下移"
          >
            <ChevronDown class="w-3.5 h-3.5" />
          </IconButton>
          <IconButton
            size="xs"
            variant="danger"
            :disabled="disabled"
            @click="removeArticle(idx)"
            title="删除"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>

      <!-- 第二行：类型标签 + 描述 -->
      <div class="flex items-center gap-2 px-3 pb-2.5">
        <div class="flex items-center gap-1 shrink-0">
          <button
            v-for="t in ARTICLE_TYPES"
            :key="t.value"
            type="button"
            :disabled="disabled"
            @click="article.type = t.value"
            class="px-2 py-0.5 rounded-md text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            :class="article.type === t.value
              ? 'bg-primary/12 text-primary dark:bg-primary/[0.16] font-medium'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'"
          >
            {{ t.label }}
          </button>
        </div>
        <input
          v-model="article.description"
          :disabled="disabled"
          placeholder="简短描述（可选）"
          class="flex-1 min-w-0 px-2.5 py-1 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-gray-200 dark:focus:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 text-xs placeholder-gray-400 focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>
    </div>

    <!-- 添加按钮 -->
    <button
      type="button"
      @click="addArticle"
      :disabled="disabled"
      class="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all flex items-center justify-center gap-2 text-sm"
    >
      <Plus class="w-4 h-4" />
      <span>添加关联文章链接</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp, FileText, Plus, Trash2 } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import type { RelatedArticle, RelatedArticleType } from '@/types/software'
import IconButton from './common/IconButton.vue'

const ARTICLE_TYPES: { value: RelatedArticleType; label: string }[] = [
  { value: 'document', label: '文档' },
  { value: 'tips', label: '技巧' },
  { value: 'faq', label: '问答' },
  { value: 'changelog', label: '日志' },
  { value: 'other', label: '其他' },
]

const props = defineProps<{
  modelValue: RelatedArticle[] | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RelatedArticle[]]
}>()

const localArticles = ref<RelatedArticle[]>(Array.isArray(props.modelValue) ? [...props.modelValue] : [])
const syncing = ref(false)

watch(() => props.modelValue, async (v) => {
  syncing.value = true
  localArticles.value = Array.isArray(v) ? [...v] : []
  await nextTick()
  syncing.value = false
}, { deep: true })

watch(localArticles, (v) => {
  if (syncing.value) return
  emit('update:modelValue', [...v])
}, { deep: true })

const addArticle = () => {
  const newArticle: RelatedArticle = {
    id: (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? globalThis.crypto.randomUUID() : String(Date.now()),
    title: '',
    url: '',
    type: 'other',
    description: '',
    sortOrder: localArticles.value.length + 1,
    createdAt: new Date().toISOString()
  }
  localArticles.value.push(newArticle)
}

const removeArticle = (idx: number) => {
  localArticles.value.splice(idx, 1)
  localArticles.value.forEach((item, i) => { item.sortOrder = i + 1 })
}

const moveUp = (idx: number) => {
  if (idx <= 0) return
  const items = localArticles.value.map(a => ({ ...a }))
  ;[items[idx - 1], items[idx]] = [items[idx], items[idx - 1]]
  items.forEach((item, i) => { item.sortOrder = i + 1 })
  localArticles.value = items
}

const moveDown = (idx: number) => {
  if (idx >= localArticles.value.length - 1) return
  const items = localArticles.value.map(a => ({ ...a }))
  ;[items[idx], items[idx + 1]] = [items[idx + 1], items[idx]]
  items.forEach((item, i) => { item.sortOrder = i + 1 })
  localArticles.value = items
}
</script>
