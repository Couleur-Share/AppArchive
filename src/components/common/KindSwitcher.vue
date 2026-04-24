<template>
  <div
    class="kind-switcher relative inline-flex items-center rounded-xl border p-1.5 shrink-0 box-border"
    role="radiogroup"
    aria-label="软件形态切换"
  >
    <!-- 段式控件内部滑动指示器 -->
    <div
      ref="indicatorRef"
      class="kind-indicator pointer-events-none absolute top-1.5 bottom-1.5 rounded-lg"
    ></div>

    <RadioGroup
      :model-value="modelValue"
      @update:model-value="onChange"
      class="flex items-center gap-1 relative z-10"
    >
      <RadioGroupOption
        v-for="(k, idx) in KINDS"
        :key="k"
        :value="k"
        v-slot="{ checked }"
        as="template"
      >
        <div
          ref="itemRefs"
          :data-checked="checked ? 'true' : 'false'"
          class="kind-item relative inline-flex h-11 sm:h-10 items-center rounded-lg px-3 sm:px-3.5 text-sm whitespace-nowrap cursor-pointer text-center select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-900 active:scale-[0.98]"
          :class="[checked ? 'kind-item--active' : 'kind-item--inactive']"
          :style="
            showAnimationLocal
              ? {
                  animationDelay: `${
                    (animationDelayBase + idx * animationStagger) * 1000
                  }ms`
                }
              : undefined
          "
        >
          <span class="inline-flex items-center gap-1.5">
            <span aria-hidden="true" class="kind-icon">{{ kindIconMap[k] }}</span>
            <span>{{ kindLabelMap[k] }}</span>
          </span>
        </div>
      </RadioGroupOption>
    </RadioGroup>
  </div>
</template>

<script setup lang="ts">
import { RadioGroup, RadioGroupOption } from '@headlessui/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SoftwareKind } from '@/types'
import { KINDS } from '@/types/constants'

const props = defineProps<{
  modelValue: SoftwareKind
  showAnimation?: boolean
  animationDelayBase?: number
  animationStagger?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SoftwareKind): void
}>()

// 形态标签与图标
const kindLabelMap: Record<SoftwareKind, string> = {
  app: '应用',
  extension: '插件',
  userscript: '脚本'
}
const kindIconMap: Record<SoftwareKind, string> = {
  app: '📦',
  extension: '🧩',
  userscript: '📜'
}

const onChange = (value: SoftwareKind) => {
  emit('update:modelValue', value)
}

const showAnimationLocal = computed(() => props.showAnimation ?? true)
const animationDelayBase = computed(() => props.animationDelayBase ?? 0.06)
const animationStagger = computed(() => props.animationStagger ?? 0.03)

const indicatorRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
let indicatorInitialized = false
let layoutRafId: number | null = null
let resizeObserver: ResizeObserver | null = null

const updateIndicator = (target: HTMLElement, animate = true) => {
  const indicator = indicatorRef.value
  if (!indicator) return

  const newWidth = target.offsetWidth
  const newLeft = target.offsetLeft

  if (!animate || !indicatorInitialized) {
    indicator.style.transition = 'none'
    indicator.style.width = `${newWidth}px`
    indicator.style.transform = `translateX(${newLeft}px)`
    indicator.style.opacity = '1'
    // 强制回流保证无动画初始化
    void indicator.offsetWidth
    indicator.style.transition = ''
    indicatorInitialized = true
  } else {
    indicator.style.width = `${newWidth}px`
    indicator.style.transform = `translateX(${newLeft}px)`
    indicator.style.opacity = '1'
  }
}

const requestLayoutSync = (animate = false) => {
  if (layoutRafId !== null) {
    cancelAnimationFrame(layoutRafId)
  }
  layoutRafId = requestAnimationFrame(() => {
    layoutRafId = null
    const idx = KINDS.indexOf(props.modelValue)
    const target = itemRefs.value[idx]
    if (target) updateIndicator(target, animate)
  })
}

watch(
  () => props.modelValue,
  (next, prev) => {
    if (next === prev) return
    requestLayoutSync(true)
  }
)

onMounted(() => {
  const container = indicatorRef.value?.parentElement as HTMLElement | null
  if (container && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => requestLayoutSync(false))
    resizeObserver.observe(container)
  }
  requestLayoutSync(false)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (layoutRafId !== null) {
    cancelAnimationFrame(layoutRafId)
    layoutRafId = null
  }
})
</script>

<style scoped>
.kind-switcher {
  background: var(--home-tab-rail-bg);
  border-color: var(--home-tab-rail-border);
  box-shadow: var(--home-tab-rail-shadow);
  color: var(--home-text);
  isolation: isolate;
}

/* 段式控件的滑动指示器：高对比 surface 填充 + 轻浮起阴影 + 中性内边 */
.kind-indicator {
  position: absolute;
  width: 0;
  transform: translateX(0);
  opacity: 0;
  background: var(--home-surface-strong);
  box-shadow:
    0 1px 2px color-mix(in srgb, rgb(0 0 0) 18%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--home-border-strong) 40%, transparent);
  will-change: transform, width;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    width 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 150ms cubic-bezier(0.22, 1, 0.36, 1);
  contain: layout style;
}

.kind-item {
  transition:
    color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
  animation: kindFadeIn 0.4s ease-out both;
  line-height: 1;
  z-index: 1;
}

.kind-item--active {
  color: var(--home-text-strong);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.kind-item--inactive {
  color: color-mix(in srgb, var(--home-text) 78%, var(--home-text-subtle));
}

.kind-icon {
  font-size: 0.95em;
  line-height: 1;
}

@media (hover: hover) and (pointer: fine) {
  .kind-item--inactive:hover {
    color: var(--home-text-strong);
    background: var(--home-tab-hover);
  }
}

@keyframes kindFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kind-item,
  .kind-indicator {
    transition: none !important;
    animation: none !important;
  }
}
</style>
