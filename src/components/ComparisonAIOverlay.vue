<template>
  <div
    v-if="active"
    class="fixed inset-0 z-[100] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

    <!-- 主要内容 -->
    <div class="relative flex flex-col items-center px-4">
      <!-- 对比动画：两个元素合并 -->
      <div class="relative w-48 h-32 mb-8">
        <!-- 左侧软件卡片 -->
        <div
          ref="leftCardRef"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-20 bg-gray-700 rounded-xl shadow-lg flex flex-col items-center justify-center"
        >
          <div class="w-8 h-8 bg-gray-600 rounded-lg mb-1"></div>
          <div class="w-10 h-1.5 bg-gray-500 rounded"></div>
        </div>

        <!-- 右侧软件卡片 -->
        <div
          ref="rightCardRef"
          class="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-20 bg-gray-700 rounded-xl shadow-lg flex flex-col items-center justify-center"
        >
          <div class="w-8 h-8 bg-gray-600 rounded-lg mb-1"></div>
          <div class="w-10 h-1.5 bg-gray-500 rounded"></div>
        </div>

        <!-- 中心连接线 -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12">
          <div
            ref="connectLine1Ref"
            class="h-0.5 bg-emerald-500/60 rounded-full mb-2 origin-left scale-x-0"
          ></div>
          <div
            ref="connectLine2Ref"
            class="h-0.5 bg-gray-400/60 rounded-full mb-2 origin-left scale-x-0"
          ></div>
          <div
            ref="connectLine3Ref"
            class="h-0.5 bg-emerald-400/60 rounded-full origin-left scale-x-0"
          ></div>
        </div>

        <!-- 中心分析图标 -->
        <div
          ref="centerIconRef"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center shadow-xl opacity-0 scale-50"
        >
          <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        <!-- 数据流动粒子 -->
        <div
          ref="particle1Ref"
          class="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 opacity-0"
        ></div>
        <div
          ref="particle2Ref"
          class="absolute w-1.5 h-1.5 bg-gray-300 rounded-full opacity-0"
        ></div>
        <div
          ref="particle3Ref"
          class="absolute w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-lg shadow-emerald-300/50 opacity-0"
        ></div>
      </div>

      <!-- 标题与状态 -->
      <div class="text-center mb-6">
        <h3 class="text-lg font-semibold text-white mb-1">
          AI 对比分析
        </h3>
        <p
          ref="statusTextRef"
          class="text-sm text-gray-400"
        >
          正在对比软件特性
        </p>
      </div>

      <!-- 进度条 -->
      <div class="w-64 sm:w-80">
        <div class="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            ref="progressBarRef"
            class="h-full w-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
          ></div>
        </div>
        
        <!-- 步骤指示 -->
        <div class="flex justify-between mt-3 text-xs text-gray-500">
          <div ref="step1Ref" class="flex items-center gap-1.5 opacity-40">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>收集</span>
          </div>
          <div ref="step2Ref" class="flex items-center gap-1.5 opacity-40">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>对比</span>
          </div>
          <div ref="step3Ref" class="flex items-center gap-1.5 opacity-40">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>分析</span>
          </div>
          <div ref="step4Ref" class="flex items-center gap-1.5 opacity-40">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>报告</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ active: boolean }>()

const leftCardRef = ref<HTMLElement | null>(null)
const rightCardRef = ref<HTMLElement | null>(null)
const connectLine1Ref = ref<HTMLElement | null>(null)
const connectLine2Ref = ref<HTMLElement | null>(null)
const connectLine3Ref = ref<HTMLElement | null>(null)
const centerIconRef = ref<HTMLElement | null>(null)
const particle1Ref = ref<HTMLElement | null>(null)
const particle2Ref = ref<HTMLElement | null>(null)
const particle3Ref = ref<HTMLElement | null>(null)
const statusTextRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const step1Ref = ref<HTMLElement | null>(null)
const step2Ref = ref<HTMLElement | null>(null)
const step3Ref = ref<HTMLElement | null>(null)
const step4Ref = ref<HTMLElement | null>(null)

let animations: (gsap.core.Tween | gsap.core.Timeline)[] = []

const stopAnimations = () => {
  animations.forEach((anim) => anim.kill())
  animations = []
}

const startAnimations = async () => {
  await nextTick()
  stopAnimations()

  const leftCard = leftCardRef.value
  const rightCard = rightCardRef.value
  const connectLines = [connectLine1Ref.value, connectLine2Ref.value, connectLine3Ref.value]
  const centerIcon = centerIconRef.value
  const particles = [particle1Ref.value, particle2Ref.value, particle3Ref.value]
  const statusText = statusTextRef.value
  const progressBar = progressBarRef.value
  const steps = [step1Ref.value, step2Ref.value, step3Ref.value, step4Ref.value]

  // 左右卡片呼吸动画
  if (leftCard) {
    const anim = gsap.to(leftCard, {
      x: 8,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  if (rightCard) {
    const anim = gsap.to(rightCard, {
      x: -8,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 连接线依次展开
  connectLines.forEach((line, i) => {
    if (line) {
      const anim = gsap.timeline({ repeat: -1, delay: i * 0.3 })
        .to(line, { scaleX: 1, duration: 0.8, ease: 'power2.out' })
        .to(line, { opacity: 0.3, duration: 1 })
        .to(line, { scaleX: 0, opacity: 1, duration: 0.5 })
      animations.push(anim)
    }
  })

  // 中心图标动画
  if (centerIcon) {
    const anim = gsap.timeline({ repeat: -1 })
      .to(centerIcon, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' })
      .to(centerIcon, { rotation: 5, duration: 0.3, ease: 'sine.inOut' })
      .to(centerIcon, { rotation: -5, duration: 0.6, ease: 'sine.inOut' })
      .to(centerIcon, { rotation: 0, duration: 0.3, ease: 'sine.inOut' })
      .to(centerIcon, { scale: 1.1, duration: 0.5 })
      .to(centerIcon, { scale: 1, opacity: 0, duration: 0.5, delay: 0.5 })
      .set(centerIcon, { scale: 0.5 })
    animations.push(anim)
  }

  // 粒子流动动画
  particles.forEach((particle, i) => {
    if (particle) {
      const startX = 16
      const endX = 176
      const y = 56 + i * 8
      
      gsap.set(particle, { left: startX, top: y })
      
      const anim = gsap.timeline({ repeat: -1, delay: i * 0.8 })
        .set(particle, { left: startX, opacity: 0 })
        .to(particle, { opacity: 1, duration: 0.2 })
        .to(particle, { left: endX, duration: 1.5, ease: 'power1.inOut' })
        .to(particle, { opacity: 0, duration: 0.2 })
      animations.push(anim)
    }
  })

  // 状态文本循环
  if (statusText) {
    const messages = [
      '正在对比软件特性',
      '分析功能差异',
      '评估性能指标',
      '生成对比报告',
    ]

    const textAnim = gsap.timeline({ repeat: -1 })
    messages.forEach((msg, i) => {
      textAnim
        .to(statusText, { opacity: 0, duration: 0.2 }, i * 2.5)
        .call(() => { statusText.textContent = msg }, [], i * 2.5 + 0.2)
        .to(statusText, { opacity: 1, duration: 0.2 }, i * 2.5 + 0.2)
        .to({}, { duration: 2.1 }, i * 2.5 + 0.4)
    })
    animations.push(textAnim)
  }

  // 进度条无限循环
  if (progressBar) {
    const anim = gsap.timeline({ repeat: -1 })
      .to(progressBar, { width: '100%', duration: 4, ease: 'power1.inOut' })
      .to(progressBar, { opacity: 0.5, duration: 0.3 })
      .set(progressBar, { width: '0%' })
      .to(progressBar, { opacity: 1, duration: 0.3 })
    animations.push(anim)
  }

  // 步骤依次高亮
  steps.forEach((step, i) => {
    if (step) {
      const anim = gsap.timeline({ repeat: -1, delay: i * 1 })
        .to(step, { opacity: 1, duration: 0.3 })
        .to(step, { opacity: 0.4, duration: 0.3, delay: 3 })
      animations.push(anim)
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
