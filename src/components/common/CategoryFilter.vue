<template>
  <!-- 外层容器：负责边框、背景、圆角和阴影，不受遮罩影响 -->
  <div class="category-filter-shell relative w-full box-border overflow-hidden rounded-xl border">
    <div
      ref="scrollEl"
      :class="[
        'tab-scroll relative w-full flex items-center gap-1 sm:gap-2 overflow-x-auto p-1.5 pe-16 sm:pe-[4.5rem] no-scrollbar',
        { 'scroll-mask': hasOverflow }
      ]"
      :style="scrollStyle"
    >
      <!-- Category 区段指示器 -->
      <div
        ref="indicatorRef"
        class="tab-indicator pointer-events-none absolute top-1.5 bottom-1.5 rounded-[11px]"
      ></div>

      <!-- Category 区段 -->
      <RadioGroup
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        aria-label="分类筛选"
        class="flex items-center gap-1 sm:gap-2 relative z-10"
      >
        <RadioGroupOption
          v-for="(cat, idx) in ['all', ...categories]"
          :key="cat"
          :value="cat"
          v-slot="{ checked }"
          as="template"
        >
          <div
            ref="tabRefs"
            :data-checked="checked ? 'true' : 'false'"
            class="tab-item relative inline-flex h-11 sm:h-10 items-center rounded-lg px-3.5 sm:px-4 font-semibold whitespace-nowrap cursor-pointer text-center select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-900 active:scale-[0.98]"
            :class="[
              checked ? 'tab-item--active' : 'tab-item--inactive',
            ]"
            :style="showAnimationLocal ? { animationDelay: `${(animationDelayBase + idx * animationStagger) * 1000}ms` } : undefined"
          >
            <span class="inline-flex items-center gap-2">
              <span>{{ cat === 'all' ? '全部' : cat }}</span>
              <span
                v-if="
                  categoryCounts && categoryCounts[catKey(cat)] !== undefined
                "
                :class="[
                  'ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-md text-[0.7rem] font-bold tab-badge',
                  checked ? 'tab-badge--active' : 'tab-badge--inactive',
                ]"
              >
                {{ categoryCounts[catKey(cat)] }}
              </span>
            </span>
          </div>
        </RadioGroupOption>
      </RadioGroup>
      <!-- 尾部安全间距，避免最后一项被遮挡 -->
      <div class="shrink-0 w-8 sm:w-10 md:w-12"></div>
    </div>

    <!-- 左右滚动按钮（可选） -->
    <button
      v-if="showArrows && showPrev"
      type="button"
      class="nav-btn nav-btn-prev left-1"
      aria-label="向左滚动"
      @click="scrollBy(-1)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="h-4 w-4"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
    <button
      v-if="showArrows && showNext"
      type="button"
      class="nav-btn nav-btn-next right-1"
      aria-label="向右滚动"
      @click="scrollBy(1)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="h-4 w-4"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { RadioGroup, RadioGroupOption } from '@headlessui/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  categories: string[]
  categoryCounts?: Record<string, number>
  categoryIcons?: Record<string, string>
  showArrows?: boolean
  showAnimation?: boolean
  animationDelayBase?: number
  animationStagger?: number
  indicatorPadding?: number
  /** Tabs 渐隐遮罩宽度（像素）。当未溢出时不生效 */
  fadeWidth?: number
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const tabRefs = ref<HTMLElement[]>([])
const activeTabWidth = ref(0)
const activeTabLeft = ref(0)

// 指示器相关
const indicatorRef = ref<HTMLElement | null>(null)
let indicatorInitialized = false

const catKey = (v: string) => (v === 'all' ? 'all' : v)

// 动画与指示器的安全默认值
const animationDelayBase = computed(() => props.animationDelayBase ?? 0.06)
const animationStagger = computed(() => props.animationStagger ?? 0.03)
const showAnimationLocal = computed(() => props.showAnimation ?? true)
const fadeWidth = computed(() => props.fadeWidth ?? 8)
const indicatorInset = computed(() => props.indicatorPadding ?? 6)
const scrollStyle = computed<Record<string, string>>(() => ({
  '--tab-fade-width': `${fadeWidth.value}px`,
  '--tab-mask-left': showPrev.value ? `${fadeWidth.value}px` : '0px',
  '--tab-mask-right': showNext.value ? `${fadeWidth.value}px` : '0px'
}))

// 滚动与箭头可见性
const scrollEl = ref<HTMLElement | null>(null)
const showPrev = ref(false)
const showNext = ref(false)
const hasOverflow = ref(false)
const prefersReducedMotion = ref(false)
let reducedMotionMediaQuery: MediaQueryList | null = null
let resizeObserver: ResizeObserver | null = null
let layoutRafId: number | null = null

const onReducedMotionChange = (event: MediaQueryListEvent) => {
  prefersReducedMotion.value = event.matches
}

const updateArrows = () => {
  const el = scrollEl.value
  if (!el) return
  const max = Math.max(0, el.scrollWidth - el.clientWidth - 2)
  showPrev.value = el.scrollLeft > 2
  showNext.value = el.scrollLeft < max
  hasOverflow.value = el.scrollWidth > el.clientWidth + 1
}

const centerActiveTab = () => {
  const el = scrollEl.value
  if (!el) return
  const activeIndex = ['all', ...props.categories].indexOf(
    props.modelValue
  )
  const activeTab = tabRefs.value[activeIndex]
  if (!activeTab) return
  const target =
    activeTab.offsetLeft - (el.clientWidth - activeTab.offsetWidth) / 2
  const max = Math.max(0, el.scrollWidth - el.clientWidth)
  const nextLeft = Math.min(max, Math.max(0, target))
  el.scrollTo({
    left: nextLeft,
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth'
  })
}

const scrollBy = (dir: number) => {
  const el = scrollEl.value
  if (!el) return
  const amount = Math.round(el.clientWidth * 0.6)
  el.scrollBy({
    left: dir * amount,
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth'
  })
}

// 使用CSS transition更新指示器位置
const updateIndicator = (activeTab: HTMLElement, animate = true) => {
  const indicator = indicatorRef.value
  if (!indicator) return

  const inset = Math.max(0, indicatorInset.value)
  const newWidth = Math.max(0, activeTab.offsetWidth - inset * 2)
  const newLeft = activeTab.offsetLeft + inset

  if (!animate || !indicatorInitialized) {
    indicator.style.transition = 'none'
    indicator.style.width = `${newWidth}px`
    indicator.style.transform = `translateX(${newLeft}px)`
    indicator.style.opacity = '1'
    indicator.offsetWidth // force reflow
    indicator.style.transition = ''
    indicatorInitialized = true
  } else {
    indicator.style.width = `${newWidth}px`
    indicator.style.transform = `translateX(${newLeft}px)`
    indicator.style.opacity = '1'
  }

  activeTabWidth.value = newWidth
  activeTabLeft.value = newLeft
}

const requestLayoutSync = (options: { center?: boolean, animateIndicator?: boolean } = {}) => {
  const { center = false, animateIndicator = false } = options

  if (layoutRafId !== null) {
    cancelAnimationFrame(layoutRafId)
  }

  layoutRafId = requestAnimationFrame(() => {
    layoutRafId = null

    const activeIndex = ['all', ...props.categories].indexOf(props.modelValue)
    const activeTab = tabRefs.value[activeIndex]
    if (activeTab) {
      updateIndicator(activeTab, animateIndicator)
    }

    if (center) {
      centerActiveTab()
    }

    updateArrows()
  })
}

const handleResize = () => {
  requestLayoutSync()
}

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue === oldValue) return

    requestLayoutSync({
      center: true,
      animateIndicator: true
    })
  },
  { immediate: true }
)

watch(
  () => props.categories.length,
  () => {
    requestLayoutSync()
  }
)

watch(
  () => props.categoryCounts,
  () => {
    requestLayoutSync()
  },
  { deep: true }
)

onMounted(() => {
  const el = scrollEl.value
  if (el) {
    el.addEventListener('scroll', updateArrows, { passive: true })
  }
  window.addEventListener('resize', handleResize)

  if (typeof ResizeObserver !== 'undefined' && el) {
    resizeObserver = new ResizeObserver(() => {
      requestLayoutSync()
    })
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

  requestLayoutSync({
    center: true,
    animateIndicator: false
  })
})

onBeforeUnmount(() => {
  const el = scrollEl.value
  if (el) el.removeEventListener('scroll', updateArrows)
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
    black var(--tab-mask-left, 0px),
    black calc(100% - var(--tab-mask-right, 0px)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--tab-mask-left, 0px),
    black calc(100% - var(--tab-mask-right, 0px)),
    transparent 100%
  );
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-mask::-webkit-scrollbar {
  display: none;
}

:where(.tab-item, .tab-badge, .tab-indicator, .nav-btn) {
  --tab-motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --ui-focus-ring: var(--home-focus-ring);
  --ui-indicator-shadow: var(--home-tab-indicator-shadow);
  --ui-hover-shadow: var(--home-shadow);
  --ui-hover-brightness: 1.03;
}

.category-filter-shell {
  background: var(--home-tab-rail-bg);
  border-color: var(--home-tab-rail-border);
  box-shadow: var(--home-tab-rail-shadow);
}

.tab-scroll {
  color: var(--home-text);
  isolation: isolate;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 36px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--home-nav-btn-color);
  background: var(--home-nav-btn-bg);
  box-shadow: var(--home-accent-shadow);
  border: 1px solid var(--home-accent-border);
  transition:
    transform 180ms var(--tab-motion-ease),
    box-shadow 180ms var(--tab-motion-ease),
    filter 180ms var(--tab-motion-ease);
}

.nav-btn svg {
  transition: transform 180ms var(--tab-motion-ease);
}
.nav-btn:active {
  transform: translateY(-50%) scale(0.97);
}
.nav-btn:focus-visible {
  outline: none;
  box-shadow: var(--ui-focus-ring);
}

@media (hover: hover) and (pointer: fine) {
  .nav-btn:hover {
    transform: translateY(-50%) scale(1.06);
    filter: brightness(var(--ui-hover-brightness));
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--home-accent-border) 82%, transparent),
      var(--ui-accent-shadow);
  }

  .nav-btn-prev:hover svg {
    transform: translateX(-1.5px);
  }

  .nav-btn-next:hover svg {
    transform: translateX(1.5px);
  }
}

@media (pointer: coarse) {
  .nav-btn {
    height: 44px;
    width: 44px;
  }
}

/* Category 指示器：经典 tab 下划线——只有底部光束，无底色填充、无描边 */
.tab-indicator {
  position: absolute;
  width: 0;
  transform: translateX(0);
  opacity: 0;
  background: transparent;
  will-change: transform, width;
  transition:
    transform 240ms var(--tab-motion-ease),
    width 240ms var(--tab-motion-ease),
    opacity 150ms var(--tab-motion-ease);
  contain: layout style;
  overflow: visible;
}

.tab-indicator::before {
  content: none;
}

.tab-indicator::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 4px;
  height: 2.5px;
  border-radius: 999px;
  background: var(--home-tab-indicator-beam);
  box-shadow: var(--home-tab-indicator-glow);
  pointer-events: none;
}

.tab-item {
  transition:
    color 150ms var(--tab-motion-ease),
    background-color 150ms var(--tab-motion-ease),
    box-shadow 180ms var(--tab-motion-ease),
    transform 150ms var(--tab-motion-ease);
  contain: layout style;
  animation: tabFadeIn 0.4s ease-out both;
  line-height: 1;
  z-index: 1;
}

/* 经典 tab 下划线惯例：激活文字与底部光束呼应，但不填充背景 */
.tab-item--active {
  color: color-mix(
    in srgb,
    var(--home-tab-active-text) 88%,
    rgb(30 215 96)
  );
  font-weight: 700;
  letter-spacing: 0.01em;
}

.tab-item--inactive {
  color: color-mix(in srgb, var(--home-text) 78%, var(--home-text-subtle));
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 徽章颜色过渡 */
.tab-badge {
  transition:
    color 150ms var(--tab-motion-ease),
    background-color 150ms var(--tab-motion-ease),
    box-shadow 180ms var(--tab-motion-ease);
}

.tab-badge--active {
  background: color-mix(in srgb, var(--home-accent-soft) 80%, var(--home-surface-strong));
  color: var(--home-nav-btn-color);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--home-accent-border) 52%, transparent);
}

.tab-badge--inactive {
  background: color-mix(in srgb, var(--home-surface-soft) 92%, transparent);
  color: color-mix(in srgb, var(--home-text-muted) 90%, var(--home-text-subtle));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--home-border) 72%, transparent);
}

@media (hover: hover) and (pointer: fine) {
  .tab-item--inactive:hover {
    color: var(--home-text-strong);
    background: var(--home-tab-hover);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--home-border-strong) 82%, transparent);
    transform: translateY(-1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-item,
  .tab-badge,
  .tab-indicator,
  .nav-btn,
  .nav-btn svg {
    transition: none !important;
  }

  .tab-item {
    animation: none !important;
  }

  .nav-btn:hover,
  .nav-btn:active {
    transform: translateY(-50%) !important;
  }

  .nav-btn-prev:hover svg,
  .nav-btn-next:hover svg {
    transform: none !important;
  }
}

</style>
