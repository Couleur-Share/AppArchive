<template>
  <section
    class="relative overflow-hidden rounded-[22px] border border-slate-200/70 bg-[#f7f8f7] shadow-[0_18px_36px_-30px_rgba(18,18,18,0.18)] dark:border-white/[0.08] dark:bg-[#181818]"
  >
    <div class="relative space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
      <div class="flex items-start justify-between gap-2 sm:gap-3">
        <div class="space-y-0.5 sm:space-y-1 min-w-0">
          <p class="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:block sm:text-xs">
            New Radar
          </p>
          <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight sm:hidden">
            {{ compactHeaderText }}
          </h2>
          <h2 class="hidden sm:block text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            {{ headerText }}
          </h2>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 truncate sm:hidden">
            {{ compactHintText }}
          </p>
          <p class="hidden sm:block text-xs text-slate-600 dark:text-slate-300">
            {{ hintText }}
          </p>
        </div>

        <div class="inline-flex items-center self-start gap-2 shrink-0">
          <TagBadge
            size="sm"
            strong
            :variant="newCount > 0 ? 'success' : 'neutral'"
            class="h-7 sm:h-8 rounded-lg sm:rounded-xl px-2.5 sm:px-3 gap-1.5 sm:gap-2 text-[11px] sm:text-xs"
          >
            <span class="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span
                class="relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full"
                :class="newCount > 0 ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-500'"
              />
            </span>
            <span>
              {{ newCount }} 个新增
            </span>
          </TagBadge>

          <button
            v-if="canCollapse"
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:text-slate-700 dark:border-white/[0.08] dark:bg-[#1f1f1f] dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:text-slate-200 sm:h-8 sm:w-8"
            title="收起新增面板"
            aria-label="收起新增面板"
            @click="emit('collapse')"
          >
            <ChevronsUp class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-0.5">
        <button
          v-for="item in modeOptions"
          :key="item.value"
          type="button"
          class="shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:px-3 sm:text-sm"
          :class="mode === item.value
            ? 'border-primary bg-primary text-[rgb(18_18_18)] shadow-[0_10px_22px_-16px_rgba(30,215,96,0.55)]'
            : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#1f1f1f] dark:text-slate-300 dark:hover:border-white/[0.12] dark:hover:bg-[#252525]'"
          @click="$emit('update:mode', item.value)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="border-t border-slate-200/70 pt-1.5 dark:border-white/[0.08] sm:pt-2">
        <button
          type="button"
          class="group inline-flex items-center gap-2 text-[11px] sm:text-sm font-medium text-slate-700 dark:text-slate-200"
          role="switch"
          :aria-checked="onlyNew"
          @click="$emit('update:onlyNew', !onlyNew)"
        >
          <span
            class="relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-200"
            :class="onlyNew ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
              class="inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
              :class="onlyNew ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0.5'"
            />
          </span>
          仅看新增应用
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronsUp } from 'lucide-vue-next'
import { computed } from 'vue'
import TagBadge from './TagBadge.vue'

type NewArrivalMode = '7d' | '30d'

const props = defineProps<{
  mode: NewArrivalMode
  onlyNew: boolean
  newCount: number
  canCollapse?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:mode', value: NewArrivalMode): void
  (e: 'update:onlyNew', value: boolean): void
  (e: 'collapse'): void
}>()

const allModeOptions: Array<{ value: NewArrivalMode; label: string }> = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
]
const modeOptions = allModeOptions

const headerText = computed(() => {
  if (props.newCount === 0) {
    return '近期没有新增应用'
  }
  return `近期新增 ${props.newCount} 个应用`
})

const compactHeaderText = computed(() => {
  if (props.newCount === 0) {
    return '暂无新增'
  }
  return `新增 ${props.newCount} 个应用`
})

const hintText = computed(() => {
  if (props.mode === '7d') {
    return '聚焦最近 7 天，适合高频回访快速浏览。'
  }
  return '查看近 30 天新增，适合阶段性集中筛选。'
})

const compactHintText = computed(() => {
  if (props.mode === '7d') {
    return '聚焦最近 7 天，快速浏览新增。'
  }
  return '查看近 30 天新增。'
})
</script>
