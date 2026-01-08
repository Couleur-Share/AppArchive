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
      <div class="relative w-52 h-32 mb-8">
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

        <!-- 中心 VS 图标 -->
        <div
          ref="centerIconRef"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-xl border-2 border-emerald-500/50"
        >
          <span class="text-emerald-400 font-bold text-lg tracking-tight">VS</span>
        </div>

        <!-- 左侧粒子（从左向中心） -->
        <div
          ref="particleL1Ref"
          class="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 opacity-0"
        ></div>
        <div
          ref="particleL2Ref"
          class="absolute w-1.5 h-1.5 bg-gray-300 rounded-full opacity-0"
        ></div>
        <div
          ref="particleL3Ref"
          class="absolute w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-lg shadow-emerald-300/50 opacity-0"
        ></div>

        <!-- 右侧粒子（从右向中心） -->
        <div
          ref="particleR1Ref"
          class="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 opacity-0"
        ></div>
        <div
          ref="particleR2Ref"
          class="absolute w-1.5 h-1.5 bg-gray-300 rounded-full opacity-0"
        ></div>
        <div
          ref="particleR3Ref"
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
const centerIconRef = ref<HTMLElement | null>(null)
const particleL1Ref = ref<HTMLElement | null>(null)
const particleL2Ref = ref<HTMLElement | null>(null)
const particleL3Ref = ref<HTMLElement | null>(null)
const particleR1Ref = ref<HTMLElement | null>(null)
const particleR2Ref = ref<HTMLElement | null>(null)
const particleR3Ref = ref<HTMLElement | null>(null)
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
  const centerIcon = centerIconRef.value
  const leftParticles = [particleL1Ref.value, particleL2Ref.value, particleL3Ref.value]
  const rightParticles = [particleR1Ref.value, particleR2Ref.value, particleR3Ref.value]
  const statusText = statusTextRef.value
  const progressBar = progressBarRef.value
  const steps = [step1Ref.value, step2Ref.value, step3Ref.value, step4Ref.value]

  // 左右卡片呼吸动画
  if (leftCard) {
    const anim = gsap.to(leftCard, {
      x: 6,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  if (rightCard) {
    const anim = gsap.to(rightCard, {
      x: -6,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 中心 VS 图标脉冲动画
  if (centerIcon) {
    const anim = gsap.to(centerIcon, {
      scale: 1.1,
      duration: 0.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 左侧粒子动画（从左向中心）
  const centerX = 104
  leftParticles.forEach((particle, i) => {
    if (particle) {
      const startX = 64
      const y = 56 + (i - 1) * 10
      
      gsap.set(particle, { left: startX, top: y })
      
      const anim = gsap.timeline({ repeat: -1, delay: i * 0.5 })
        .set(particle, { left: startX, opacity: 0 })
        .to(particle, { opacity: 1, duration: 0.15 })
        .to(particle, { left: centerX - 10, duration: 0.8, ease: 'power1.inOut' })
        .to(particle, { opacity: 0, duration: 0.15 })
      animations.push(anim)
    }
  })

  // 右侧粒子动画（从右向中心）
  rightParticles.forEach((particle, i) => {
    if (particle) {
      const startX = 144
      const y = 56 + (i - 1) * 10
      
      gsap.set(particle, { left: startX, top: y })
      
      const anim = gsap.timeline({ repeat: -1, delay: i * 0.5 + 0.25 })
        .set(particle, { left: startX, opacity: 0 })
        .to(particle, { opacity: 1, duration: 0.15 })
        .to(particle, { left: centerX + 10, duration: 0.8, ease: 'power1.inOut' })
        .to(particle, { opacity: 0, duration: 0.15 })
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
