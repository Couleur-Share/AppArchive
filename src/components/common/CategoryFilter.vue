<template>
  <!-- 外层容器：负责边框、背景、圆角和阴影，不受遮罩影响 -->
  <div class="relative w-full box-border overflow-hidden rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
    <div
      ref="scrollEl"
      :class="[
        'relative w-full flex items-center gap-1 sm:gap-2 overflow-x-auto p-1.5 pe-14 sm:pe-16 no-scrollbar',
        { 'scroll-mask': hasOverflow }
      ]"
      :style="scrollStyle"
    >
      <!-- 优化的背景滑块 - 使用CSS transition替代GSAP -->
      <div
        ref="indicatorRef"
        class="tab-indicator absolute top-1.5 bottom-1.5 rounded-lg bg-emerald-500 shadow-sm"
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
            class="tab-item relative px-4 py-2 rounded-lg font-bold whitespace-nowrap cursor-pointer text-center select-none focus:outline-none"
            :class="[
              checked
                ? 'text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
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
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200/50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400',
                ]"
              >
                {{ categoryCounts[catKey(cat)] }}
              </span>
            </span>
          </div>
        </RadioGroupOption>
      </RadioGroup>
      <!-- 尾部安全间距，避免最后一项被遮挡 -->
      <div class="shrink-0 w-6 sm:w-8 md:w-10"></div>
    </div>

    <!-- 左右滚动按钮（可选） -->
    <button
      v-if="showArrows && showPrev"
      type="button"
      class="nav-btn left-1"
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
      class="nav-btn right-1"
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
  '--tab-fade-width': `${fadeWidth.value}px`
}))

// 滚动与箭头可见性
const scrollEl = ref<HTMLElement | null>(null)
const showPrev = ref(false)
const showNext = ref(false)
const hasOverflow = ref(false)

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
    (props as any).modelValue
  )
  const activeTab = tabRefs.value[activeIndex]
  if (!activeTab) return
  const target =
    activeTab.offsetLeft - (el.clientWidth - activeTab.offsetWidth) / 2
  const max = Math.max(0, el.scrollWidth - el.clientWidth)
  const nextLeft = Math.min(max, Math.max(0, target))
  el.scrollTo({ left: nextLeft, behavior: 'smooth' })
}

const scrollBy = (dir: number) => {
  const el = scrollEl.value
  if (!el) return
  const amount = Math.round(el.clientWidth * 0.6)
  el.scrollBy({ left: dir * amount, behavior: 'smooth' })
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

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    
    // 使用rAF代替nextTick，与浏览器渲染帧对齐，减少卡顿
    requestAnimationFrame(() => {
      const activeIndex = ['all', ...props.categories].indexOf(newValue)
      const activeTab = tabRefs.value[activeIndex]
      
      if (activeTab) {
        updateIndicator(activeTab, true)
      }
      
      centerActiveTab()
      updateArrows()
    })
  },
  { immediate: true }
)

onMounted(() => {
  const el = scrollEl.value
  if (el) {
    el.addEventListener('scroll', updateArrows, { passive: true })
  }
  window.addEventListener('resize', updateArrows)
  
  // 使用rAF确保DOM已渲染，同时避免nextTick可能的微任务堆积
  requestAnimationFrame(() => {
    updateArrows()
    centerActiveTab()
    
    // 初始化指示器位置（无动画）
    const activeIndex = ['all', ...props.categories].indexOf(props.modelValue)
    const activeTab = tabRefs.value[activeIndex]
    if (activeTab) {
      updateIndicator(activeTab, false)
    }
  })
})

onBeforeUnmount(() => {
  const el = scrollEl.value
  if (el) el.removeEventListener('scroll', updateArrows)
  window.removeEventListener('resize', updateArrows)
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
    black var(--tab-fade-width, 8px),
    black calc(100% - var(--tab-fade-width, 8px)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black var(--tab-fade-width, 8px),
    black calc(100% - var(--tab-fade-width, 8px)),
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

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 32px;
  width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: #ffffff;
  background: #10b981; /* emerald-500 */
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}
.nav-btn:hover {
  transform: translateY(-50%) scale(1.05);
}
.nav-btn:active {
  transform: translateY(-50%) scale(0.97);
}
.nav-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
}

/* 指示器 - CSS transition 动画（替代GSAP，零JS开销） */
.tab-indicator {
  width: 0;
  transform: translateX(0);
  opacity: 0;
  will-change: transform, width;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.2s ease;
  contain: layout style;
}

/* Tab项 - 轻量级颜色过渡 + 入场动画 */
.tab-item {
  transition: color 0.15s ease, background-color 0.15s ease;
  contain: layout style;
  animation: tabFadeIn 0.4s ease-out both;
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
  transition: color 0.15s ease, background-color 0.15s ease;
}

</style>
