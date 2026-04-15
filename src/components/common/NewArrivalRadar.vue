<template>
  <section
    class="new-arrival-card relative overflow-hidden rounded-[22px] border"
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
                class="radar-dot relative inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full"
                :class="{ 'radar-dot--active': newCount > 0 }"
              />
            </span>
            <span>
              {{ newCount }} 个新增
            </span>
          </TagBadge>

          <button
            v-if="canCollapse"
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:text-slate-700 dark:border-white/[0.08] dark:bg-[#1f1f1f] dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:text-slate-200 sm:h-8 sm:w-8"
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
          class="radar-pill shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:px-3 sm:text-sm"
          :class="mode === item.value ? 'radar-pill--active' : 'radar-pill--inactive'"
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
            class="radar-switch relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-200"
            :class="{ 'radar-switch--active': onlyNew }"
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

<style scoped>
.new-arrival-card {
  background:
    radial-gradient(circle at 100% 0%, rgb(30 215 96 / 0.08), transparent 28%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--home-surface-strong) 94%, white) 0%,
      color-mix(in srgb, var(--home-surface-soft) 92%, transparent) 100%
    );
  border-color: color-mix(in srgb, var(--home-border) 90%, transparent);
  box-shadow:
    0 18px 36px -30px rgb(15 23 42 / 0.18),
    inset 0 1px 0 rgb(255 255 255 / 0.38);
  backdrop-filter: blur(12px) saturate(112%);
}

:global(.dark) .new-arrival-card {
  background:
    radial-gradient(circle at 100% 0%, rgb(30 215 96 / 0.12), transparent 30%),
    linear-gradient(
      180deg,
      rgb(26 31 39 / 0.96) 0%,
      rgb(19 23 30 / 0.98) 100%
    );
  border-color: color-mix(in srgb, var(--home-border) 96%, transparent);
  box-shadow:
    0 24px 44px -32px rgb(0 0 0 / 0.56),
    inset 0 1px 0 rgb(255 255 255 / 0.03);
}

.radar-dot {
  background: color-mix(in srgb, var(--home-text-subtle) 78%, transparent);
  transition:
    background-color 150ms var(--ease),
    box-shadow 150ms var(--ease);
}

.radar-dot--active {
  background: var(--home-tab-badge-active-bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-accent-soft) 68%, transparent);
}

.radar-pill--active {
  border-color: color-mix(in srgb, var(--home-accent-border) 82%, transparent);
  background: var(--home-tab-badge-active-bg);
  color: var(--home-tab-badge-active-text);
  box-shadow: var(--home-tab-badge-active-shadow);
}

.radar-pill--inactive {
  border-color: color-mix(in srgb, var(--home-border) 90%, transparent);
  background: color-mix(in srgb, var(--home-surface-strong) 96%, transparent);
  color: var(--home-text);
}

@media (hover: hover) and (pointer: fine) {
  .radar-pill--inactive:hover {
    background: color-mix(in srgb, var(--home-accent-soft) 78%, var(--home-surface-hover));
    border-color: color-mix(in srgb, var(--home-accent-border) 82%, transparent);
  }
}

.radar-switch {
  background: color-mix(in srgb, var(--home-text-subtle) 34%, transparent);
}

.radar-switch--active {
  background: var(--home-tab-badge-active-bg);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 10px 18px -14px color-mix(in srgb, var(--home-tab-badge-active-bg) 56%, transparent);
}
</style>
