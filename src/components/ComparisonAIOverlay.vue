<template>
  <div
    v-if="active"
    class="fixed inset-0 z-[100] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>

    <!-- 主要内容 -->
    <div class="relative flex flex-col items-center px-4">
      <!-- 对比战场 -->
      <div class="relative w-72 sm:w-80 h-44 mb-6">
        <!-- 能量场背景 -->
        <div
          ref="energyFieldRef"
          class="absolute inset-0 rounded-3xl opacity-0"
          style="background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)"
        ></div>

        <!-- 左侧软件卡片 -->
        <div
          ref="leftCardRef"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-20 sm:w-24 h-28 sm:h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl shadow-2xl flex flex-col items-center justify-center border border-gray-600/50 overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent"></div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-xl mb-2 flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div class="w-12 sm:w-14 h-2 bg-gray-600 rounded-full"></div>
          <div class="w-8 sm:w-10 h-1.5 bg-gray-700 rounded-full mt-1.5"></div>
          <!-- 扫描线效果 -->
          <div
            ref="scanLineLeftRef"
            class="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
            style="top: 0"
          ></div>
        </div>

        <!-- 右侧软件卡片 -->
        <div
          ref="rightCardRef"
          class="absolute right-0 top-1/2 -translate-y-1/2 w-20 sm:w-24 h-28 sm:h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl shadow-2xl flex flex-col items-center justify-center border border-gray-600/50 overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent"></div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-xl mb-2 flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div class="w-12 sm:w-14 h-2 bg-gray-600 rounded-full"></div>
          <div class="w-8 sm:w-10 h-1.5 bg-gray-700 rounded-full mt-1.5"></div>
          <!-- 扫描线效果 -->
          <div
            ref="scanLineRightRef"
            class="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
            style="top: 0"
          ></div>
        </div>

        <!-- 中心 VS 徽章 -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <!-- 外层光环 -->
          <div
            ref="outerGlowRef"
            class="absolute -inset-4 rounded-full opacity-0"
            style="background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)"
          ></div>
          <!-- 旋转光环 -->
          <div
            ref="rotatingRingRef"
            class="absolute -inset-2 rounded-full border-2 border-dashed border-emerald-500/30"
          ></div>
          <!-- VS 核心 -->
          <div
            ref="vsCoreRef"
            class="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-2xl border-2 border-emerald-500/60"
          >
            <span
              ref="vsTextRef"
              class="text-emerald-400 font-black text-xl sm:text-2xl tracking-tighter"
            >VS</span>
          </div>
        </div>

        <!-- 左侧能量线 -->
        <svg class="absolute left-20 sm:left-24 top-1/2 -translate-y-1/2 w-16 sm:w-20 h-8" viewBox="0 0 80 32">
          <path
            ref="energyLineLeftRef"
            d="M0 16 Q20 16 40 8 T80 16"
            fill="none"
            stroke="url(#lineGradientLeft)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="80"
            stroke-dashoffset="80"
          />
          <defs>
            <linearGradient id="lineGradientLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
            </linearGradient>
          </defs>
        </svg>

        <!-- 右侧能量线 -->
        <svg class="absolute right-20 sm:right-24 top-1/2 -translate-y-1/2 w-16 sm:w-20 h-8 rotate-180" viewBox="0 0 80 32">
          <path
            ref="energyLineRightRef"
            d="M0 16 Q20 16 40 8 T80 16"
            fill="none"
            stroke="url(#lineGradientRight)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="80"
            stroke-dashoffset="80"
          />
          <defs>
            <linearGradient id="lineGradientRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
            </linearGradient>
          </defs>
        </svg>

        <!-- 数据粒子容器 -->
        <div ref="particleContainerRef" class="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div v-for="i in 8" :key="i" :ref="el => setParticleRef(el, i)" class="absolute w-1 h-1 rounded-full opacity-0"></div>
        </div>
      </div>

      <!-- 标题与状态 -->
      <div class="text-center mb-5">
        <h3 ref="titleRef" class="text-xl font-bold text-white mb-2">
          <span class="text-emerald-400">AI</span> 对比分析
        </h3>
        <p
          ref="statusTextRef"
          class="text-sm text-gray-400 h-5"
        >
          正在深度对比软件特性
        </p>
      </div>

      <!-- 进度条 -->
      <div class="w-64 sm:w-80">
        <div class="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            ref="progressBarRef"
            class="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 rounded-full"
          ></div>
          <div
            ref="progressGlowRef"
            class="absolute inset-y-0 left-0 w-0 bg-emerald-400/50 rounded-full blur-sm"
          ></div>
        </div>
        
        <!-- 步骤指示 -->
        <div class="flex justify-between mt-4 text-xs">
          <div ref="step1Ref" class="flex flex-col items-center gap-1 opacity-30 transition-opacity">
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span class="text-gray-400">收集</span>
          </div>
          <div ref="step2Ref" class="flex flex-col items-center gap-1 opacity-30 transition-opacity">
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span class="text-gray-400">对比</span>
          </div>
          <div ref="step3Ref" class="flex flex-col items-center gap-1 opacity-30 transition-opacity">
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span class="text-gray-400">分析</span>
          </div>
          <div ref="step4Ref" class="flex flex-col items-center gap-1 opacity-30 transition-opacity">
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span class="text-gray-400">报告</span>
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
const scanLineLeftRef = ref<HTMLElement | null>(null)
const scanLineRightRef = ref<HTMLElement | null>(null)
const energyFieldRef = ref<HTMLElement | null>(null)
const outerGlowRef = ref<HTMLElement | null>(null)
const rotatingRingRef = ref<HTMLElement | null>(null)
const vsCoreRef = ref<HTMLElement | null>(null)
const vsTextRef = ref<HTMLElement | null>(null)
const energyLineLeftRef = ref<SVGPathElement | null>(null)
const energyLineRightRef = ref<SVGPathElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const statusTextRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const progressGlowRef = ref<HTMLElement | null>(null)
const step1Ref = ref<HTMLElement | null>(null)
const step2Ref = ref<HTMLElement | null>(null)
const step3Ref = ref<HTMLElement | null>(null)
const step4Ref = ref<HTMLElement | null>(null)

const particleRefs: (HTMLElement | null)[] = []
const setParticleRef = (el: unknown, index: number) => {
  particleRefs[index - 1] = el as HTMLElement | null
}

let animations: (gsap.core.Tween | gsap.core.Timeline)[] = []

const stopAnimations = () => {
  animations.forEach((anim) => anim.kill())
  animations = []
}

const startAnimations = async () => {
  await nextTick()
  stopAnimations()

  // 左右卡片对峙动画
  if (leftCardRef.value) {
    const anim = gsap.to(leftCardRef.value, {
      x: 8,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  if (rightCardRef.value) {
    const anim = gsap.to(rightCardRef.value, {
      x: -8,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 卡片扫描线
  if (scanLineLeftRef.value) {
    const anim = gsap.to(scanLineLeftRef.value, {
      top: '100%',
      duration: 1.5,
      ease: 'power1.inOut',
      repeat: -1,
      repeatDelay: 0.5,
    })
    animations.push(anim)
  }

  if (scanLineRightRef.value) {
    const anim = gsap.to(scanLineRightRef.value, {
      top: '100%',
      duration: 1.5,
      ease: 'power1.inOut',
      repeat: -1,
      repeatDelay: 0.5,
      delay: 0.75,
    })
    animations.push(anim)
  }

  // 能量场呼吸
  if (energyFieldRef.value) {
    const anim = gsap.to(energyFieldRef.value, {
      opacity: 0.8,
      scale: 1.05,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // VS 外层光晕
  if (outerGlowRef.value) {
    const anim = gsap.to(outerGlowRef.value, {
      opacity: 1,
      scale: 1.2,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 旋转光环
  if (rotatingRingRef.value) {
    const anim = gsap.to(rotatingRingRef.value, {
      rotation: 360,
      duration: 8,
      ease: 'none',
      repeat: -1,
    })
    animations.push(anim)
  }

  // VS 核心脉冲
  if (vsCoreRef.value) {
    const anim = gsap.to(vsCoreRef.value, {
      scale: 1.08,
      duration: 0.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // VS 文字闪烁
  if (vsTextRef.value) {
    const anim = gsap.to(vsTextRef.value, {
      textShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
      duration: 0.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 能量线动画
  if (energyLineLeftRef.value) {
    const anim = gsap.timeline({ repeat: -1 })
      .to(energyLineLeftRef.value, { strokeDashoffset: 0, duration: 1, ease: 'power2.out' })
      .to(energyLineLeftRef.value, { strokeDashoffset: -80, duration: 1, ease: 'power2.in' })
    animations.push(anim)
  }

  if (energyLineRightRef.value) {
    const anim = gsap.timeline({ repeat: -1, delay: 0.5 })
      .to(energyLineRightRef.value, { strokeDashoffset: 0, duration: 1, ease: 'power2.out' })
      .to(energyLineRightRef.value, { strokeDashoffset: -80, duration: 1, ease: 'power2.in' })
    animations.push(anim)
  }

  // 粒子动画
  const colors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
  particleRefs.forEach((particle, i) => {
    if (particle) {
      const isLeft = i < 4
      const startX = isLeft ? 80 : 200
      const endX = isLeft ? 140 : 140
      const y = 60 + (i % 4) * 15
      const color = colors[i % colors.length]
      
      gsap.set(particle, { 
        left: startX, 
        top: y, 
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`
      })
      
      const anim = gsap.timeline({ repeat: -1, delay: i * 0.3 })
        .set(particle, { left: startX, opacity: 0, scale: 0 })
        .to(particle, { opacity: 1, scale: 1.5, duration: 0.2 })
        .to(particle, { left: endX, duration: 0.6, ease: 'power2.inOut' })
        .to(particle, { opacity: 0, scale: 0, duration: 0.2 })
      animations.push(anim)
    }
  })

  // 状态文本循环
  if (statusTextRef.value) {
    const messages = [
      '正在深度对比软件特性',
      '分析核心功能差异',
      '评估性能与稳定性',
      '智能生成对比报告',
    ]

    const textAnim = gsap.timeline({ repeat: -1 })
    messages.forEach((msg, i) => {
      textAnim
        .to(statusTextRef.value!, { opacity: 0, y: -5, duration: 0.25 }, i * 3)
        .call(() => { if (statusTextRef.value) statusTextRef.value.textContent = msg }, [], i * 3 + 0.25)
        .to(statusTextRef.value!, { opacity: 1, y: 0, duration: 0.25 }, i * 3 + 0.25)
        .to({}, { duration: 2.5 }, i * 3 + 0.5)
    })
    animations.push(textAnim)
  }

  // 进度条动画
  if (progressBarRef.value && progressGlowRef.value) {
    const anim = gsap.timeline({ repeat: -1 })
      .to([progressBarRef.value, progressGlowRef.value], { width: '100%', duration: 5, ease: 'power1.inOut' })
      .to([progressBarRef.value, progressGlowRef.value], { opacity: 0.5, duration: 0.3 })
      .set([progressBarRef.value, progressGlowRef.value], { width: '0%' })
      .to([progressBarRef.value, progressGlowRef.value], { opacity: 1, duration: 0.3 })
    animations.push(anim)
  }

  // 步骤指示器
  const steps = [step1Ref.value, step2Ref.value, step3Ref.value, step4Ref.value]
  steps.forEach((step, i) => {
    if (step) {
      const anim = gsap.timeline({ repeat: -1, delay: i * 1.25 })
        .to(step, { opacity: 1, scale: 1.1, duration: 0.4, ease: 'back.out(1.5)' })
        .to(step, { scale: 1, duration: 0.2 })
        .to(step, { opacity: 0.3, duration: 0.4, delay: 3.5 })
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
