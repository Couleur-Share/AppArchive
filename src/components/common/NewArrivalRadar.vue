<template>
  <section
    class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/[0.76] shadow-[0_22px_50px_-36px_rgba(15,23,42,0.32)] backdrop-blur-xl dark:border-slate-700/45 dark:bg-[#081220]/[0.86]"
  >
    <div class="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-gradient-to-br from-emerald-400/20 via-emerald-300/12 to-slate-200/4 dark:from-emerald-400/24 dark:via-emerald-500/14 dark:to-slate-300/6 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-gradient-to-tr from-emerald-300/18 via-teal-300/10 to-slate-200/4 dark:from-emerald-500/18 dark:via-teal-400/12 dark:to-slate-300/6 blur-3xl" />

    <div class="relative px-3 py-3 sm:px-5 sm:py-5 space-y-3 sm:space-y-4">
      <div class="flex items-start justify-between gap-2 sm:gap-3">
        <div class="space-y-0.5 sm:space-y-1 min-w-0">
          <p class="hidden sm:block text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-emerald-600/90 dark:text-emerald-300/90">
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
              <span v-if="newCount > 0" class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping motion-reduce:hidden" />
              <span
                class="relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full"
                :class="newCount > 0 ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-500'"
              />
            </span>
            <span>
              {{ newCount }} 个新增
            </span>
          </TagBadge>

          <button
            v-if="canCollapse"
            type="button"
            class="inline-flex w-7 h-7 sm:w-8 sm:h-8 items-center justify-center rounded-lg
                   bg-white/80 dark:bg-slate-900/80
                   border border-slate-200/80 dark:border-slate-700/70
                   text-slate-500 dark:text-slate-400
                   hover:text-slate-700 dark:hover:text-slate-200
                   hover:bg-white dark:hover:bg-slate-800
                   transition-all duration-200"
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
          class="px-2.5 sm:px-3 py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-sm font-medium transition-all duration-200 border shrink-0"
          :class="mode === item.value
            ? 'bg-[#00c16a] dark:bg-[#00dc82] text-white dark:text-emerald-950 border-[#00c16a] dark:border-[#00dc82] shadow-[0_16px_32px_-24px_rgba(0,193,106,0.75)] dark:shadow-[0_16px_32px_-24px_rgba(0,220,130,0.8)]'
            : 'bg-white/60 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300'"
          @click="$emit('update:mode', item.value)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="pt-1.5 sm:pt-2 border-t border-white/40 dark:border-slate-700/50">
        <button
          type="button"
          class="group inline-flex items-center gap-2 text-[11px] sm:text-sm font-medium text-slate-700 dark:text-slate-200"
          role="switch"
          :aria-checked="onlyNew"
          @click="$emit('update:onlyNew', !onlyNew)"
        >
          <span
            class="relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-200"
            :class="onlyNew ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'"
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
