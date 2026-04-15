<template>
  <section
    class="new-arrival-card relative overflow-hidden rounded-xl border"
  >
    <div class="relative px-3.5 py-3.5 sm:px-5 sm:py-4">
      <div class="flex flex-col gap-3.5 sm:gap-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 space-y-1.5">
            <p class="radar-kicker">
              近期新增
            </p>
            <h2 class="radar-title text-base font-semibold leading-tight sm:hidden">
              {{ compactHeaderText }}
            </h2>
            <h2 class="radar-title hidden text-lg font-semibold leading-tight sm:block">
              {{ headerText }}
            </h2>
            <p class="radar-hint text-[12px] leading-5 sm:hidden">
              {{ compactHintText }}
            </p>
            <p class="radar-hint hidden text-sm leading-6 sm:block">
              {{ hintText }}
            </p>
          </div>

          <div class="inline-flex items-center self-start gap-2 shrink-0">
            <span
              class="radar-status-chip h-8 rounded-xl px-3 text-[11px] font-semibold sm:h-9 sm:text-xs"
              :class="newCount > 0 ? 'radar-status-chip--active' : 'radar-status-chip--idle'"
            >
              <span class="relative flex h-2.5 w-2.5">
                <span
                  class="radar-dot relative inline-flex h-2.5 w-2.5 rounded-full"
                  :class="{ 'radar-dot--active': newCount > 0 }"
                />
              </span>
              <span>
                {{ newCount }} 个新增
              </span>
            </span>

            <button
              v-if="canCollapse"
              type="button"
              class="radar-icon-btn inline-flex h-8 w-8 items-center justify-center rounded-xl border sm:h-9 sm:w-9"
              title="收起新增筛选"
              aria-label="收起新增筛选"
              @click="emit('collapse')"
            >
              <ChevronsUp class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="radar-controls flex flex-col gap-2.5 border-t pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div class="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5">
            <button
              v-for="item in modeOptions"
              :key="item.value"
              type="button"
              class="radar-pill shrink-0 rounded-xl border px-3 py-2 text-[12px] font-semibold sm:text-sm"
              :class="mode === item.value ? 'radar-pill--active' : 'radar-pill--inactive'"
              :aria-pressed="mode === item.value"
              @click="$emit('update:mode', item.value)"
            >
              {{ item.label }}
            </button>
          </div>

          <button
            type="button"
            class="radar-toggle group inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-[12px] font-medium sm:min-w-[176px] sm:text-sm"
            :class="onlyNew ? 'radar-toggle--active' : 'radar-toggle--inactive'"
            role="switch"
            :aria-checked="onlyNew"
            @click="$emit('update:onlyNew', !onlyNew)"
          >
            <span>仅看新增应用</span>
            <span
              class="radar-switch relative inline-flex h-6 w-11 items-center rounded-full"
              :class="{ 'radar-switch--active': onlyNew }"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
                :class="onlyNew ? 'translate-x-5' : 'translate-x-0.5'"
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronsUp } from 'lucide-vue-next'
import { computed } from 'vue'

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

const periodLabel = computed(() => (
  props.mode === '7d' ? '最近 7 天' : '最近 30 天'
))

const compactPeriodLabel = computed(() => (
  props.mode === '7d' ? '近 7 天' : '近 30 天'
))

const headerText = computed(() => {
  if (props.newCount === 0) {
    return `${periodLabel.value}暂无新增`
  }
  return `${periodLabel.value}新增 ${props.newCount} 个应用`
})

const compactHeaderText = computed(() => {
  if (props.newCount === 0) {
    return `${compactPeriodLabel.value}暂无新增`
  }
  return `${compactPeriodLabel.value}新增 ${props.newCount} 个`
})

const hintText = computed(() => {
  if (props.mode === '7d') {
    return '聚焦最近 7 天新增，适合快速回看。'
  }
  return '查看近 30 天收录，适合集中筛选。'
})

const compactHintText = computed(() => {
  if (props.mode === '7d') {
    return '聚焦最近 7 天新增。'
  }
  return '查看近 30 天收录。'
})
</script>

<style scoped>
.new-arrival-card {
  background: color-mix(in srgb, var(--home-surface) 84%, var(--home-card-bg));
  border-color: color-mix(in srgb, var(--home-border) 88%, transparent);
  box-shadow: var(--home-card-shadow);
  backdrop-filter: blur(10px) saturate(108%);
}

.new-arrival-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--home-accent-border) 46%, transparent) 0%,
    color-mix(in srgb, var(--home-border-strong) 78%, transparent) 18%,
    transparent 60%
  );
  pointer-events: none;
}

:global(.dark) .new-arrival-card {
  background: color-mix(in srgb, var(--home-surface-strong) 86%, var(--home-card-bg));
}

.radar-kicker {
  color: color-mix(in srgb, var(--home-text-muted) 84%, var(--home-text-subtle));
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1;
}

.radar-title {
  color: var(--home-text-strong);
}

.radar-hint {
  color: color-mix(in srgb, var(--home-text-muted) 88%, var(--home-text-subtle));
}

.radar-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--home-border) 82%, transparent);
  transition:
    border-color 180ms var(--ease),
    background-color 180ms var(--ease),
    color 180ms var(--ease),
    box-shadow 180ms var(--ease);
}

.radar-status-chip--idle {
  background: color-mix(in srgb, var(--home-surface-strong) 92%, transparent);
  color: var(--home-text-muted);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.radar-status-chip--active {
  background: color-mix(in srgb, var(--home-accent-soft) 80%, var(--home-surface-strong));
  border-color: color-mix(in srgb, var(--home-accent-border) 72%, transparent);
  color: var(--home-text-strong);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 14px 22px -20px color-mix(in srgb, var(--home-tab-badge-active-bg) 22%, transparent);
}

.radar-controls {
  border-color: color-mix(in srgb, var(--home-border) 72%, transparent);
}

.radar-icon-btn,
.radar-pill,
.radar-toggle {
  transition:
    color 180ms var(--ease),
    background-color 180ms var(--ease),
    border-color 180ms var(--ease),
    box-shadow 180ms var(--ease),
    transform 180ms var(--ease);
}

.radar-icon-btn:focus-visible,
.radar-pill:focus-visible,
.radar-toggle:focus-visible {
  outline: none;
  border-color: var(--home-accent-border);
  box-shadow: var(--home-focus-ring-soft);
}

.radar-icon-btn {
  background: color-mix(in srgb, var(--home-surface-strong) 92%, transparent);
  border-color: color-mix(in srgb, var(--home-border) 82%, transparent);
  color: var(--home-text-muted);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.radar-pill--active,
.radar-toggle--active {
  background: color-mix(in srgb, var(--home-accent-soft) 82%, var(--home-surface-strong));
  border-color: color-mix(in srgb, var(--home-accent-border) 72%, transparent);
  color: var(--home-text-strong);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--home-accent-border) 42%, transparent);
}

.radar-pill--inactive,
.radar-toggle--inactive {
  background: color-mix(in srgb, var(--home-surface-soft) 92%, transparent);
  border-color: color-mix(in srgb, var(--home-border) 82%, transparent);
  color: var(--home-text);
}

@media (hover: hover) and (pointer: fine) {
  .radar-icon-btn:hover {
    color: var(--home-text-strong);
    background: var(--home-surface-hover);
    border-color: color-mix(in srgb, var(--home-border-strong) 78%, transparent);
  }

  .radar-pill--inactive:hover,
  .radar-toggle--inactive:hover {
    background: color-mix(in srgb, var(--home-surface-hover) 88%, var(--home-accent-soft));
    border-color: color-mix(in srgb, var(--home-border-strong) 78%, transparent);
    color: var(--home-text-strong);
  }
}

.radar-dot {
  background: color-mix(in srgb, var(--home-text-subtle) 84%, transparent);
  transition:
    background-color 150ms var(--ease),
    box-shadow 150ms var(--ease);
}

.radar-dot--active {
  background: var(--home-tab-badge-active-bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-accent-soft) 68%, transparent);
}

.radar-switch {
  background: color-mix(in srgb, var(--home-text-subtle) 30%, transparent);
  transition:
    background-color 180ms var(--ease),
    box-shadow 180ms var(--ease);
}

.radar-switch--active {
  background: var(--home-tab-badge-active-bg);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.12),
    0 10px 18px -14px color-mix(in srgb, var(--home-tab-badge-active-bg) 56%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .radar-status-chip,
  .radar-icon-btn,
  .radar-pill,
  .radar-toggle,
  .radar-switch,
  .radar-dot,
  .radar-switch > span {
    transition: none !important;
  }
}
</style>
