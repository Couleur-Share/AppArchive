<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[60] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black/80 backdrop-blur-sm"
    ></div>

    <!-- 主要动画容器 -->
    <div class="relative flex flex-col items-center">
      <!-- 卡片容器 -->
      <div class="relative w-80 h-48 mb-8">
        <!-- 主加载卡片 -->
        <div
          ref="mainCardRef"
          class="absolute inset-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg shadow-level3 border border-white/20 p-6 transform-gpu"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                ref="loadingIconRef"
                class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  正在加载
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  请稍候...
                </p>
              </div>
            </div>
            <div
              ref="statusDotRef"
              class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
            ></div>
          </div>

          <div class="space-y-3">
            <div
              ref="progressLine1Ref"
              class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transform -translate-x-full"
              ></div>
            </div>
            <div
              ref="progressLine2Ref"
              class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transform -translate-x-full"
              ></div>
            </div>
            <div
              ref="progressLine3Ref"
              class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transform -translate-x-full"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文本信息 -->
      <div class="text-center">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          加载中<span ref="dotsRef" class="text-blue-600">...</span>
        </h3>
        <p
          ref="statusTextRef"
          class="text-sm text-gray-600 dark:text-gray-400 mb-4"
        >
          正在初始化应用
        </p>

        <!-- 主进度条 -->
        <div
          class="w-80 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            ref="mainProgressRef"
            class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transform -translate-x-full"
          ></div>
        </div>

        <!-- 状态指示器 -->
        <div
          class="flex justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400"
        >
          <div class="flex items-center gap-1">
            <div
              ref="indicator1Ref"
              class="w-2 h-2 bg-blue-500 rounded-full opacity-30"
            ></div>
            <span>数据加载</span>
          </div>
          <div class="flex items-center gap-1">
            <div
              ref="indicator2Ref"
              class="w-2 h-2 bg-purple-500 rounded-full opacity-30"
            ></div>
            <span>资源准备</span>
          </div>
          <div class="flex items-center gap-1">
            <div
              ref="indicator3Ref"
              class="w-2 h-2 bg-pink-500 rounded-full opacity-30"
            ></div>
            <span>界面渲染</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = defineProps<{
  show: boolean
}>()

// 引用所有动画元素
const mainCardRef = ref<HTMLElement | null>(null)
const loadingIconRef = ref<HTMLElement | null>(null)
const statusDotRef = ref<HTMLElement | null>(null)
const progressLine1Ref = ref<HTMLElement | null>(null)
const progressLine2Ref = ref<HTMLElement | null>(null)
const progressLine3Ref = ref<HTMLElement | null>(null)
const dotsRef = ref<HTMLElement | null>(null)
const statusTextRef = ref<HTMLElement | null>(null)
const mainProgressRef = ref<HTMLElement | null>(null)
const indicator1Ref = ref<HTMLElement | null>(null)
const indicator2Ref = ref<HTMLElement | null>(null)
const indicator3Ref = ref<HTMLElement | null>(null)

let animations: (gsap.core.Tween | gsap.core.Timeline)[] = []

const stopAnimations = () => {
  animations.forEach((anim) => anim.kill())
  animations = []
}

const startAnimations = async () => {
  await nextTick()
  stopAnimations()

  const mainCard = mainCardRef.value
  const loadingIcon = loadingIconRef.value
  const progressLine1 = progressLine1Ref.value
  const progressLine2 = progressLine2Ref.value
  const progressLine3 = progressLine3Ref.value
  const dots = dotsRef.value
  const statusText = statusTextRef.value
  const mainProgress = mainProgressRef.value
  const indicator1 = indicator1Ref.value
  const indicator2 = indicator2Ref.value
  const indicator3 = indicator3Ref.value

  // 设置初始状态
  if (mainCard) {
    gsap.set(mainCard, { scale: 0.8, opacity: 0, y: 20 })
  }

  // 主卡片入场动画
  if (mainCard) {
    const cardAnim = gsap.to(mainCard, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'back.out(1.7)',
    })
    animations.push(cardAnim)
  }

  // 加载图标旋转动画
  if (loadingIcon) {
    const iconAnim = gsap.to(loadingIcon, {
      rotation: 360,
      duration: 2,
      ease: 'none',
      repeat: -1,
    })
    animations.push(iconAnim)
  }

  // 进度条动画
  const progressBars = [progressLine1, progressLine2, progressLine3]
  progressBars.forEach((bar, i) => {
    if (bar) {
      const progressBar = bar.querySelector('div')
      if (progressBar) {
        const progressAnim = gsap
          .timeline({ repeat: -1, delay: i * 0.5 })
          .to(progressBar, { x: '0%', duration: 2, ease: 'power2.inOut' })
          .to(progressBar, { x: '100%', duration: 0.5, ease: 'power2.in' })
          .set(progressBar, { x: '-100%' })
        animations.push(progressAnim)
      }
    }
  })

  // 点点点动画
  if (dots) {
    const dotsAnim = gsap
      .timeline({ repeat: -1 })
      .to(dots, { opacity: 0.3, duration: 0.5 })
      .to(dots, { opacity: 1, duration: 0.5 })
    animations.push(dotsAnim)
  }

  // 状态文本动画
  if (statusText) {
    const messages = [
      '正在初始化应用',
      '加载应用数据',
      '准备用户界面',
      '优化性能设置',
      '检查网络连接',
      '加载完成',
    ]

    const textAnim = gsap.timeline({ repeat: -1 })
    messages.forEach((message, i) => {
      textAnim
        .to(
          statusText,
          {
            duration: 0.1,
            onStart: () => {
              statusText.textContent = message
            },
          },
          i * 2
        )
        .to(statusText, { duration: 1.9 }, i * 2 + 0.1)
    })
    animations.push(textAnim)
  }

  // 主进度条动画
  if (mainProgress) {
    const mainProgressAnim = gsap
      .timeline({ repeat: -1 })
      .to(mainProgress, { x: '0%', duration: 3, ease: 'power2.inOut' })
      .to(mainProgress, { x: '100%', duration: 1, ease: 'power2.in' })
      .set(mainProgress, { x: '-100%' })
    animations.push(mainProgressAnim)
  }

  // 状态指示器动画
  const indicators = [indicator1, indicator2, indicator3]
  indicators.forEach((indicator, i) => {
    if (indicator) {
      const indicatorAnim = gsap
        .timeline({ repeat: -1, delay: i * 1.5 })
        .to(indicator, {
          opacity: 1,
          scale: 1.2,
          duration: 0.5,
          ease: 'power2.out',
        })
        .to(indicator, { scale: 1, duration: 0.3, ease: 'power2.out' })
        .to(indicator, { opacity: 0.3, duration: 2 })
      animations.push(indicatorAnim)
    }
  })
}

watch(
  () => props.show,
  async (v) => {
    if (v) {
      await startAnimations()
    } else {
      stopAnimations()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopAnimations()
})
</script>

<style scoped>
.transform-gpu {
  transform: translateZ(0);
  backface-visibility: hidden;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style> 