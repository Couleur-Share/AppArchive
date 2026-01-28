<template>
  <div class="space-y-4">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">相关文章/链接</label>
    
    <div v-for="(article, idx) in localArticles" :key="article.id" class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 space-y-3 relative group">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 space-y-3">
          <!-- 标题与链接 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="space-y-1">
              <input
                v-model="article.title"
                :disabled="disabled"
                placeholder="文章标题，如：使用文档"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div class="space-y-1">
              <input
                v-model="article.url"
                :disabled="disabled"
                placeholder="链接地址 https://..."
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <!-- 类型、描述与排序 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              v-model="article.type"
              :disabled="disabled"
              class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm"
            >
              <option value="document">使用文档</option>
              <option value="tips">使用技巧</option>
              <option value="faq">常见问题</option>
              <option value="changelog">更新日志</option>
              <option value="other">其他</option>
            </select>
            <input
              v-model="article.description"
              :disabled="disabled"
              placeholder="简短描述（可选）"
              class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm"
            />
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 whitespace-nowrap">排序：</span>
              <input
                v-model.number="article.sortOrder"
                type="number"
                :disabled="disabled"
                placeholder="序号"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="removeArticle(idx)"
          :disabled="disabled"
          class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="删除"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <button
      type="button"
      @click="addArticle"
      :disabled="disabled"
      class="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
    >
      <Plus class="w-4 h-4" />
      <span>添加关联文章链接</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import type { RelatedArticle } from '@/types/software'

const props = defineProps<{
  modelValue: RelatedArticle[] | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RelatedArticle[]]
}>()

const localArticles = ref<RelatedArticle[]>(Array.isArray(props.modelValue) ? [...props.modelValue] : [])

watch(() => props.modelValue, (v) => {
  localArticles.value = Array.isArray(v) ? [...v] : []
}, { deep: true })

watch(localArticles, (v) => {
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
}
</script>
