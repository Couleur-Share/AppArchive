<template>
  <div
    class="segmented-control-shell relative box-border overflow-hidden rounded-xl border"
    :class="scrollable ? 'w-full' : 'inline-flex shrink-0'"
  >
    <div
      ref="scrollEl"
      :class="[
        'segmented-control-viewport no-scrollbar relative flex items-center overflow-x-auto p-1.5',
        scrollable ? 'w-full gap-1 pe-16 sm:gap-1.5 sm:pe-[4.5rem]' : 'gap-1',
        { 'scroll-mask': scrollable && hasOverflow }
      ]"
      :style="scrollStyle"
    >
      <div
        ref="indicatorRef"
        class="segmented-control-indicator pointer-events-none absolute top-1.5 bottom-1.5 rounded-lg"
      ></div>

      <RadioGroup
        :model-value="modelValue"
        @update:model-value="onChange"
        :aria-label="ariaLabel"
        class="segmented-control-list relative z-10 flex items-center gap-1 sm:gap-1.5"
        :class="{ 'min-w-max': scrollable }"
      >
        <RadioGroupOption
          v-for="(item, idx) in items"
          :key="item.value"
          :value="item.value"
          v-slot="{ checked }"
          as="template"
        >
          <div
            :ref="setItemRef(item.value)"
            :data-checked="checked ? 'true' : 'false'"
            :data-segment-value="item.value"
            class="segmented-control-item relative inline-flex h-11 items-center rounded-lg px-3.5 text-center text-sm font-semibold whitespace-nowrap select-none sm:h-10 sm:px-4"
            :class="[
              checked
                ? 'segmented-control-item--active'
                : 'segmented-control-item--inactive',
              { 'segmented-control-item--animated': showAnimationLocal }
            ]"
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
            <span class="segmented-control-content inline-flex items-center gap-2">
              <span
                v-if="item.icon || item.glyph"
                class="segmented-control-icon"
                aria-hidden="true"
              >
                <component
                  v-if="item.icon"
                  :is="item.icon"
                  class="segmented-control-icon-svg"
                  :stroke-width="2.25"
                />
                <span v-else>{{ item.glyph }}</span>
              </span>
              <span class="segmented-control-label">{{ item.label }}</span>
              <span
                v-if="item.badge !== undefined"
                :class="[
                  'segmented-control-badge ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1.5 text-[0.7rem] font-bold',
                  checked
                    ? 'segmented-control-badge--active'
                    : 'segmented-control-badge--inactive'
                ]"
              >
                {{ item.badge }}
              </span>
            </span>
          </div>
        </RadioGroupOption>
      </RadioGroup>

      <div v-if="scrollable" class="w-8 shrink-0 sm:w-10 md:w-12"></div>
    </div>

    <button
      v-if="scrollable && showArrows && showPrev"
      type="button"
      class="segmented-control-nav segmented-control-nav--prev left-1"
      aria-label="向左滚动"
      @click="scrollByDirection(-1)"
    >
      <ChevronLeft class="h-4 w-4" aria-hidden="true" />
    </button>
    <button
      v-if="scrollable && showArrows && showNext"
      type="button"
      class="segmented-control-nav segmented-control-nav--next right-1"
      aria-label="向右滚动"
      @click="scrollByDirection(1)"
    >
      <ChevronRight class="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { RadioGroup, RadioGroupOption } from '@headlessui/vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { Component, ComponentPublicInstance } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface SegmentedControlItem {
  value: string
  label: string
  icon?: Component
  glyph?: string
  badge?: string | number
}

const props = defineProps<{
  modelValue: string
  items: SegmentedControlItem[]
  ariaLabel: string
  showArrows?: boolean
  showAnimation?: boolean
  animationDelayBase?: number
  animationStagger?: number
  indicatorPadding?: number
  fadeWidth?: number
  scrollable?: boolean
}>()

const emit = defineEmits<(e: 'update:modelValue', value: string) => void>()

const scrollEl = ref<HTMLElement | null>(null)
const indicatorRef = ref<HTMLElement | null>(null)
const showPrev = ref(false)
const showNext = ref(false)
const hasOverflow = ref(false)
const prefersReducedMotion = ref(false)
const itemRefMap = new Map<string, HTMLElement>()

const showAnimationLocal = computed(() => props.showAnimation ?? true)
const animationDelayBase = computed(() => props.animationDelayBase ?? 0.06)
const animationStagger = computed(() => props.animationStagger ?? 0.025)
const indicatorInset = computed(() => props.indicatorPadding ?? 0)
const fadeWidth = computed(() => props.fadeWidth ?? 10)
const scrollable = computed(() => props.scrollable ?? false)
const showArrows = computed(() => props.showArrows ?? false)
const itemsSignature = computed(() =>
  props.items
    .map((item) => `${item.value}:${item.label}:${item.glyph ?? ''}:${item.badge ?? ''}`)
    .join('|')
)
const scrollStyle = computed<Record<string, string>>(() => ({
  '--segment-fade-left': showPrev.value ? `${fadeWidth.value}px` : '0px',
  '--segment-fade-right': showNext.value ? `${fadeWidth.value}px` : '0px'
}))

let indicatorInitialized = false
let layoutRafId: number | null = null
let resizeObserver: ResizeObserver | null = null
let reducedMotionMediaQuery: MediaQueryList | null = null

const onChange = (value: string) => {
  emit('update:modelValue', value)
}

const setItemRef =
  (value: string) => (el: Element | ComponentPublicInstance | null) => {
    if (el instanceof HTMLElement) {
      itemRefMap.set(value, el)
      return
    }

    itemRefMap.delete(value)
  }

const pruneItemRefs = () => {
  const currentValues = new Set(props.items.map((item) => item.value))
  for (const value of itemRefMap.keys()) {
    if (!currentValues.has(value)) {
      itemRefMap.delete(value)
    }
  }
}

const getActiveItem = () => {
  pruneItemRefs()
  return itemRefMap.get(props.modelValue)
}

const onReducedMotionChange = (event: MediaQueryListEvent) => {
  prefersReducedMotion.value = event.matches
}

const updateScrollState = () => {
  const el = scrollEl.value
  if (!el || !scrollable.value) {
    showPrev.value = false
    showNext.value = false
    hasOverflow.value = false
    return
  }

  const max = Math.max(0, el.scrollWidth - el.clientWidth - 2)
  showPrev.value = el.scrollLeft > 2
  showNext.value = el.scrollLeft < max
  hasOverflow.value = el.scrollWidth > el.clientWidth + 1
}

const centerActiveItem = () => {
  const el = scrollEl.value
  if (!el || !scrollable.value) return

  const activeItem = getActiveItem()
  if (!activeItem) return

  const target =
    activeItem.offsetLeft - (el.clientWidth - activeItem.offsetWidth) / 2
  const max = Math.max(0, el.scrollWidth - el.clientWidth)
  const nextLeft = Math.min(max, Math.max(0, target))

  el.scrollTo({
    left: nextLeft,
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth'
  })
}

const updateIndicator = (target: HTMLElement, animate = true) => {
  const indicator = indicatorRef.value
  if (!indicator) return

  const inset = Math.max(0, indicatorInset.value)
  const nextWidth = Math.max(0, target.offsetWidth - inset * 2)
  const nextLeft = target.offsetLeft + inset

  if (!animate || !indicatorInitialized) {
    indicator.style.transition = 'none'
    indicator.style.width = `${nextWidth}px`
    indicator.style.transform = `translateX(${nextLeft}px)`
    indicator.style.opacity = '1'
    void indicator.offsetWidth
    indicator.style.transition = ''
    indicatorInitialized = true
    return
  }

  indicator.style.width = `${nextWidth}px`
  indicator.style.transform = `translateX(${nextLeft}px)`
  indicator.style.opacity = '1'
}

const requestLayoutSync = (
  options: { center?: boolean; animateIndicator?: boolean } = {}
) => {
  const { center = false, animateIndicator = false } = options

  if (layoutRafId !== null) {
    cancelAnimationFrame(layoutRafId)
  }

  layoutRafId = requestAnimationFrame(() => {
    layoutRafId = null

    const activeItem = getActiveItem()
    if (activeItem) {
      updateIndicator(activeItem, animateIndicator)
    }

    if (center) {
      centerActiveItem()
    }

    updateScrollState()
  })
}

const scrollByDirection = (direction: number) => {
  const el = scrollEl.value
  if (!el) return

  const amount = Math.round(el.clientWidth * 0.6)
  el.scrollBy({
    left: direction * amount,
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth'
  })
}

const handleResize = () => {
  requestLayoutSync()
}

watch(
  () => props.modelValue,
  (next, prev) => {
    if (next === prev) return
    requestLayoutSync({ center: true, animateIndicator: true })
  },
  { flush: 'post' }
)

watch(itemsSignature, () => {
  pruneItemRefs()
  indicatorInitialized = false
  requestLayoutSync({ center: true, animateIndicator: false })
}, { flush: 'post' })

onMounted(() => {
  const el = scrollEl.value

  if (el) {
    el.addEventListener('scroll', updateScrollState, { passive: true })
  }
  window.addEventListener('resize', handleResize)

  if (typeof ResizeObserver !== 'undefined' && el) {
    resizeObserver = new ResizeObserver(() => requestLayoutSync())
    resizeObserver.observe(el)
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = reducedMotionMediaQuery.matches
    if (typeof reducedMotionMediaQuery.addEventListener === 'function') {
      reducedMotionMediaQuery.addEventListener('change', onReducedMotionChange)
    } else {
      reducedMotionMediaQuery.addListener(onReducedMotionChange)
    }
  }

  requestLayoutSync({ center: scrollable.value, animateIndicator: false })
})

onBeforeUnmount(() => {
  const el = scrollEl.value
  if (el) {
    el.removeEventListener('scroll', updateScrollState)
  }
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (layoutRafId !== null) {
    cancelAnimationFrame(layoutRafId)
    layoutRafId = null
  }

  if (!reducedMotionMediaQuery) return
  if (typeof reducedMotionMediaQuery.removeEventListener === 'function') {
    reducedMotionMediaQuery.removeEventListener('change', onReducedMotionChange)
  } else {
    reducedMotionMediaQuery.removeListener(onReducedMotionChange)
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none !important;
}

.no-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.scroll-mask {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--segment-fade-left, 0px),
    black calc(100% - var(--segment-fade-right, 0px)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--segment-fade-left, 0px),
    black calc(100% - var(--segment-fade-right, 0px)),
    transparent 100%
  );
}

.segmented-control-shell {
  background: var(--home-tab-rail-bg);
  border-color: var(--home-tab-rail-border);
  box-shadow: var(--home-tab-rail-shadow);
  color: var(--home-text);
  isolation: isolate;
}

.segmented-control-viewport {
  isolation: isolate;
}

.segmented-control-indicator {
  width: 0;
  opacity: 0;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--home-surface-strong) 92%, rgb(30 215 96 / 0.08)),
      color-mix(in srgb, var(--home-surface-soft) 92%, rgb(30 215 96 / 0.04))
    );
  box-shadow:
    var(--home-tab-indicator-shadow),
    0 14px 26px -22px rgb(0 0 0 / 0.62);
  contain: layout style;
  overflow: hidden;
  transform: translateX(0);
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    width 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 140ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, width;
}

.segmented-control-indicator::after {
  position: absolute;
  right: 12px;
  bottom: 3px;
  left: 12px;
  height: 2px;
  border-radius: 2px;
  background: var(--home-tab-indicator-beam);
  box-shadow: var(--home-tab-indicator-glow);
  content: '';
}

.segmented-control-item {
  cursor: pointer;
  letter-spacing: 0;
  line-height: 1;
  transition:
    color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.segmented-control-item--animated {
  animation: segmentedItemIn 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.segmented-control-item--active {
  color: var(--home-tab-active-text);
  font-weight: 700;
}

.segmented-control-item--inactive {
  color: color-mix(in srgb, var(--home-text) 78%, var(--home-text-subtle));
}

.segmented-control-item:active {
  transform: scale(0.985);
}

.segmented-control-item:focus-visible {
  outline: none;
  box-shadow: var(--home-focus-ring);
}

.segmented-control-content {
  min-width: 0;
}

.segmented-control-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.95rem;
  height: 0.95rem;
  color: var(--home-text-muted);
  filter: saturate(0.88);
  font-size: 0.95em;
  line-height: 1;
  opacity: 0.86;
  transition:
    filter 150ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.segmented-control-icon-svg {
  width: 0.95rem;
  height: 0.95rem;
}

.segmented-control-item--active .segmented-control-icon {
  color: color-mix(in srgb, var(--home-tab-active-text) 86%, var(--theme-primary-500));
  filter: saturate(1);
  opacity: 1;
}

.segmented-control-badge {
  letter-spacing: 0;
  transition:
    color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.segmented-control-badge--active {
  background: var(--home-tab-badge-active-bg);
  color: var(--home-tab-badge-active-text);
  box-shadow: var(--home-tab-badge-active-shadow);
}

.segmented-control-badge--inactive {
  background: color-mix(in srgb, var(--home-surface-soft) 92%, transparent);
  color: color-mix(in srgb, var(--home-text-muted) 90%, var(--home-text-subtle));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--home-border) 72%, transparent);
}

.segmented-control-nav {
  position: absolute;
  top: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--home-accent-border);
  border-radius: 8px;
  background: var(--home-nav-btn-bg);
  box-shadow: var(--home-accent-shadow);
  color: var(--home-nav-btn-color);
  transform: translateY(-50%);
  transition:
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.segmented-control-nav svg {
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.segmented-control-nav:active {
  transform: translateY(-50%) scale(0.97);
}

.segmented-control-nav:focus-visible {
  outline: none;
  box-shadow: var(--home-focus-ring);
}

@media (hover: hover) and (pointer: fine) {
  .segmented-control-item--inactive:hover {
    background: var(--home-tab-hover);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--home-border-strong) 82%, transparent);
    color: var(--home-text-strong);
    transform: translateY(-1px);
  }

  .segmented-control-nav:hover {
    filter: brightness(1.04);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--home-accent-border) 82%, transparent),
      var(--home-accent-shadow);
    transform: translateY(-50%) scale(1.04);
  }

  .segmented-control-nav--prev:hover svg {
    transform: translateX(-1.5px);
  }

  .segmented-control-nav--next:hover svg {
    transform: translateX(1.5px);
  }
}

@media (pointer: coarse) {
  .segmented-control-nav {
    width: 44px;
    height: 44px;
  }
}

@keyframes segmentedItemIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .segmented-control-indicator,
  .segmented-control-item,
  .segmented-control-badge,
  .segmented-control-nav,
  .segmented-control-nav svg {
    transition: none !important;
  }

  .segmented-control-item {
    animation: none !important;
  }

  .segmented-control-item:hover,
  .segmented-control-item:active {
    transform: none !important;
  }

  .segmented-control-nav:hover,
  .segmented-control-nav:active {
    transform: translateY(-50%) !important;
  }

  .segmented-control-nav--prev:hover svg,
  .segmented-control-nav--next:hover svg {
    transform: none !important;
  }
}
</style>
