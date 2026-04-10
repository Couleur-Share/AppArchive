<template>
  <!-- 外层容器：负责边框、背景、圆角和阴影，不受遮罩影响 -->
  <div class="relative w-full box-border overflow-hidden rounded-xl border border-gray-200/70 bg-white/70 shadow-[0_10px_26px_-20px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-gray-600/[0.45] dark:bg-gray-800/[0.62]">
    <div
      ref="scrollEl"
      :class="[
        'relative w-full flex items-center gap-1.5 sm:gap-2 overflow-x-auto p-1.5 pe-16 sm:pe-[4.5rem] no-scrollbar',
        { 'scroll-mask': hasOverflow }
      ]"
      :style="scrollStyle"
    >
      <!-- 优化的背景滑块 - 使用CSS transition替代GSAP -->
      <div
        ref="indicatorRef"
        class="tab-indicator absolute top-1.5 bottom-1.5 rounded-lg bg-primary"
      ></div>

      <!-- Tabs -->
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
              checked
                ? 'text-slate-950'
                : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-white/[0.9] dark:hover:bg-gray-700/[0.68]',
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
                  checked
                    ? 'bg-white/[0.56] text-slate-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)]'
                    : 'bg-gray-100/90 text-gray-700 dark:bg-gray-700/[0.85] dark:text-gray-200',
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

defineEmits<(e: 'update:modelValue', value: string) => void>()

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

// 使用CSS transition更新指示器位置（比GSAP更快，无JS开销）
const updateIndicator = (activeTab: HTMLElement, animate = true) => {
  const indicator = indicatorRef.value
  if (!indicator) return
  
  const newWidth = activeTab.offsetWidth
  const newLeft = activeTab.offsetLeft
  
  if (!animate || !indicatorInitialized) {
    // 初始化：禁用transition直接到位
    indicator.style.transition = 'none'
    indicator.style.width = `${newWidth}px`
    indicator.style.transform = `translateX(${newLeft}px)`
    indicator.style.opacity = '1'
    // 强制reflow使transition=none生效，然后恢复transition
    indicator.offsetWidth // force reflow
    indicator.style.transition = ''
    indicatorInitialized = true
  } else {
    // 后续切换：CSS transition自动处理动画
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
  /* 渐隐遮罩，提示可横向滚动 */
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
  /* 隐藏横向滚动条（保留滚动能力） */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Edge/IE */
}
.scroll-mask::-webkit-scrollbar {
  /* WebKit */
  display: none; /* 彻底隐藏滚动条 */
}

:where(.tab-item, .tab-badge, .tab-indicator, .nav-btn) {
  --tab-motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --ui-focus-ring:
    0 0 0 2px rgb(255 255 255 / 0.42),
    0 0 0 5px hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.45);
  --ui-accent-shadow: 0 10px 18px -12px hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.95);
  --ui-hover-shadow: 0 10px 16px -12px hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.78);
  --ui-hover-brightness: 1.03;
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
  border-radius: 9999px;
  color: hsl(0 0% 100%);
  background:
    linear-gradient(
      135deg,
      hsl(var(--primary-h) var(--primary-s) calc(var(--primary-l) + 6%)),
      hsl(var(--primary-h) var(--primary-s) var(--primary-l))
    );
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.2),
    var(--ui-accent-shadow);
  border: 1px solid hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.38);
  backdrop-filter: blur(8px);
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
      0 0 0 1px rgb(255 255 255 / 0.22),
      var(--ui-hover-shadow);
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

/* 指示器 - CSS transition 动画（替代GSAP，零JS开销） */
.tab-indicator {
  position: absolute;
  width: 0;
  transform: translateX(0);
  opacity: 0;
  box-shadow: var(--ui-accent-shadow);
  will-change: transform, width;
  transition:
    transform 220ms var(--tab-motion-ease),
    width 220ms var(--tab-motion-ease),
    opacity 150ms var(--tab-motion-ease);
  contain: layout style;
  overflow: hidden;
}

.tab-indicator::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.22), rgb(255 255 255 / 0.02) 60%);
  pointer-events: none;
}

/* Tab项 - 轻量级颜色过渡 + 入场动画 */
.tab-item {
  transition:
    color 150ms var(--tab-motion-ease),
    background-color 150ms var(--tab-motion-ease),
    box-shadow 180ms var(--tab-motion-ease),
    transform 150ms var(--tab-motion-ease);
  contain: layout style;
  animation: tabFadeIn 0.4s ease-out both;
  line-height: 1;
}

.tab-item[data-checked='true'] {
  text-shadow: 0 1px 0 rgb(255 255 255 / 0.18);
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

@media (hover: hover) and (pointer: fine) {
  .tab-item[data-checked='false']:hover {
    box-shadow: inset 0 0 0 1px rgb(148 163 184 / 0.22);
  }

  .dark .tab-item[data-checked='false']:hover {
    box-shadow: inset 0 0 0 1px rgb(148 163 184 / 0.28);
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
