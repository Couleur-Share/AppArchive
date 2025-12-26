<template>
  <div
    v-if="active"
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
        <!-- 主分析卡片 -->
        <div
          ref="mainCardRef"
          class="absolute inset-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg shadow-level3 border border-white/20 p-6 transform-gpu"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                ref="aiIconRef"
                class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              >
                <span class="text-white font-bold text-lg">AI</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  智能分析
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  正在处理中...
                </p>
              </div>
            </div>
            <div
              ref="statusDotRef"
              class="w-3 h-3 bg-green-500 rounded-full animate-pulse"
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

        <!-- 浮动数据卡片 -->
        <div
          ref="dataCard1Ref"
          class="absolute -top-4 -left-4 w-16 h-20 bg-blue-500 rounded-lg shadow-lg opacity-0 transform rotate-12"
        >
          <div class="p-2 text-white text-xs">
            <div class="font-bold">特征</div>
            <div class="mt-1">✓ 分析中</div>
          </div>
        </div>

        <div
          ref="dataCard2Ref"
          class="absolute -top-4 -right-4 w-16 h-20 bg-purple-500 rounded-lg shadow-lg opacity-0 transform -rotate-12"
        >
          <div class="p-2 text-white text-xs">
            <div class="font-bold">优点</div>
            <div class="mt-1">✓ 提取中</div>
          </div>
        </div>

        <div
          ref="dataCard3Ref"
          class="absolute -bottom-4 -left-4 w-16 h-20 bg-pink-500 rounded-lg shadow-lg opacity-0 transform -rotate-6"
        >
          <div class="p-2 text-white text-xs">
            <div class="font-bold">缺点</div>
            <div class="mt-1">✓ 识别中</div>
          </div>
        </div>

        <div
          ref="dataCard4Ref"
          class="absolute -bottom-4 -right-4 w-16 h-20 bg-indigo-500 rounded-lg shadow-lg opacity-0 transform rotate-6"
        >
          <div class="p-2 text-white text-xs">
            <div class="font-bold">建议</div>
            <div class="mt-1">✓ 生成中</div>
          </div>
        </div>
      </div>

      <!-- 文本信息 -->
      <div class="text-center">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          AI 智能分析中<span ref="dotsRef" class="text-blue-600">...</span>
        </h3>
        <p
          ref="statusTextRef"
          class="text-sm text-gray-600 dark:text-gray-400 mb-4"
        >
          正在启动分析引擎
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
            <span>数据收集</span>
          </div>
          <div class="flex items-center gap-1">
            <div
              ref="indicator2Ref"
              class="w-2 h-2 bg-purple-500 rounded-full opacity-30"
            ></div>
            <span>特征分析</span>
          </div>
          <div class="flex items-center gap-1">
            <div
              ref="indicator3Ref"
              class="w-2 h-2 bg-pink-500 rounded-full opacity-30"
            ></div>
            <span>结果生成</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = defineProps<{ active: boolean }>()

// 引用所有动画元素
const mainCardRef = ref<HTMLElement | null>(null)
const aiIconRef = ref<HTMLElement | null>(null)
const statusDotRef = ref<HTMLElement | null>(null)
const progressLine1Ref = ref<HTMLElement | null>(null)
const progressLine2Ref = ref<HTMLElement | null>(null)
const progressLine3Ref = ref<HTMLElement | null>(null)
const dataCard1Ref = ref<HTMLElement | null>(null)
const dataCard2Ref = ref<HTMLElement | null>(null)
const dataCard3Ref = ref<HTMLElement | null>(null)
const dataCard4Ref = ref<HTMLElement | null>(null)
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
  const aiIcon = aiIconRef.value
  const progressLine1 = progressLine1Ref.value
  const progressLine2 = progressLine2Ref.value
  const progressLine3 = progressLine3Ref.value
  const dataCard1 = dataCard1Ref.value
  const dataCard2 = dataCard2Ref.value
  const dataCard3 = dataCard3Ref.value
  const dataCard4 = dataCard4Ref.value
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

  // AI图标旋转
  if (aiIcon) {
    const iconAnim = gsap.to(aiIcon, {
      rotation: 360,
      duration: 3,
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

  // 数据卡片动画
  const dataCards = [dataCard1, dataCard2, dataCard3, dataCard4]
  dataCards.forEach((card, i) => {
    if (card) {
      const cardAnim = gsap
        .timeline({ repeat: -1, delay: i * 0.8 })
        .to(card, {
          opacity: 1,
          scale: 1.1,
          duration: 0.6,
          ease: 'back.out(2)',
        })
        .to(card, {
          scale: 1,
          duration: 0.4,
          ease: 'power2.out',
        })
        .to(card, {
          opacity: 0.7,
          duration: 1.5,
        })
        .to(card, {
          opacity: 0,
          duration: 0.5,
        })
      animations.push(cardAnim)
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
      '正在启动分析引擎',
      '收集软件数据',
      '分析功能特性',
      '提取优点信息',
      '识别潜在问题',
      '生成改进建议',
      '整理分析结果',
      '准备输出报告',
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
          i * 2.5
        )
        .to(statusText, { duration: 2.4 }, i * 2.5 + 0.1)
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
  () => props.active,
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
