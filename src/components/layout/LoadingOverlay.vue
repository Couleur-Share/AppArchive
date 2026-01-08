<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[60] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

    <!-- 背景粒子效果 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        v-for="i in 20"
        :key="i"
        :ref="el => setBgParticleRef(el, i)"
        class="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
      ></div>
    </div>

    <!-- 主要内容 -->
    <div class="relative flex flex-col items-center px-4">
      <!-- Logo 动画区域 -->
      <div class="relative w-32 h-32 mb-8">
        <!-- 外层旋转环 -->
        <div
          ref="outerRingRef"
          class="absolute inset-0 rounded-full border-2 border-emerald-500/20"
        ></div>
        
        <!-- 中层脉冲环 -->
        <div
          ref="pulseRing1Ref"
          class="absolute inset-2 rounded-full border border-emerald-500/40"
        ></div>
        <div
          ref="pulseRing2Ref"
          class="absolute inset-2 rounded-full border border-emerald-400/30"
        ></div>
        
        <!-- 内层旋转环 -->
        <div
          ref="innerRingRef"
          class="absolute inset-4 rounded-full border-2 border-dashed border-gray-600"
        ></div>

        <!-- 进度弧线 -->
        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="rgba(16, 185, 129, 0.1)"
            stroke-width="4"
          />
          <circle
            ref="progressArcRef"
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="url(#arcGradient)"
            stroke-width="4"
            stroke-linecap="round"
            stroke-dasharray="352"
            stroke-dashoffset="352"
          />
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10B981"/>
              <stop offset="50%" stop-color="#34D399"/>
              <stop offset="100%" stop-color="#10B981"/>
            </linearGradient>
          </defs>
        </svg>

        <!-- 中心图标 -->
        <div
          ref="centerLogoRef"
          class="absolute inset-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl border border-gray-700/50"
        >
          <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              ref="logoPathRef"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>

        <!-- 轨道粒子 -->
        <div
          ref="orbitParticle1Ref"
          class="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
          style="top: 0; left: 50%; transform: translateX(-50%)"
        ></div>
        <div
          ref="orbitParticle2Ref"
          class="absolute w-1.5 h-1.5 bg-emerald-300 rounded-full"
          style="top: 50%; right: 0; transform: translateY(-50%)"
        ></div>
      </div>

      <!-- 标题 -->
      <div class="text-center mb-6">
        <h2 ref="titleRef" class="text-2xl font-bold text-white mb-2">
          <span class="text-emerald-400">软件</span>清单
        </h2>
        <p
          ref="statusTextRef"
          class="text-sm text-gray-400 h-5"
        >
          正在初始化应用
        </p>
      </div>

      <!-- 底部进度条 -->
      <div class="w-64 sm:w-72">
        <div class="relative h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            ref="progressBarRef"
            class="absolute inset-y-0 left-0 w-0 rounded-full"
            style="background: linear-gradient(90deg, #10B981, #34D399, #10B981)"
          ></div>
          <div
            ref="progressShineRef"
            class="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full opacity-0"
          ></div>
        </div>
        
        <!-- 加载步骤 -->
        <div class="flex justify-between mt-4 text-xs text-gray-500">
          <div ref="step1Ref" class="flex items-center gap-1.5 opacity-30">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>数据加载</span>
          </div>
          <div ref="step2Ref" class="flex items-center gap-1.5 opacity-30">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>资源准备</span>
          </div>
          <div ref="step3Ref" class="flex items-center gap-1.5 opacity-30">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>界面渲染</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const outerRingRef = ref<HTMLElement | null>(null)
const pulseRing1Ref = ref<HTMLElement | null>(null)
const pulseRing2Ref = ref<HTMLElement | null>(null)
const innerRingRef = ref<HTMLElement | null>(null)
const progressArcRef = ref<SVGCircleElement | null>(null)
const centerLogoRef = ref<HTMLElement | null>(null)
const logoPathRef = ref<SVGPathElement | null>(null)
const orbitParticle1Ref = ref<HTMLElement | null>(null)
const orbitParticle2Ref = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const statusTextRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const progressShineRef = ref<HTMLElement | null>(null)
const step1Ref = ref<HTMLElement | null>(null)
const step2Ref = ref<HTMLElement | null>(null)
const step3Ref = ref<HTMLElement | null>(null)

const bgParticleRefs: (HTMLElement | null)[] = []
const setBgParticleRef = (el: unknown, index: number) => {
  bgParticleRefs[index - 1] = el as HTMLElement | null
}

let animations: (gsap.core.Tween | gsap.core.Timeline)[] = []

const stopAnimations = () => {
  animations.forEach((anim) => anim.kill())
  animations = []
}

const startAnimations = async () => {
  await nextTick()
  stopAnimations()

  // 背景粒子漂浮
  bgParticleRefs.forEach((particle, i) => {
    if (particle) {
      const startX = Math.random() * 100
      const startY = Math.random() * 100
      const size = 1 + Math.random() * 2
      
      gsap.set(particle, {
        left: `${startX}%`,
        top: `${startY}%`,
        width: size,
        height: size,
        opacity: 0.1 + Math.random() * 0.3,
      })
      
      const anim = gsap.to(particle, {
        y: -30 - Math.random() * 50,
        x: (Math.random() - 0.5) * 30,
        opacity: 0,
        duration: 3 + Math.random() * 2,
        ease: 'none',
        repeat: -1,
        delay: Math.random() * 2,
      })
      animations.push(anim)
    }
  })

  // 外环旋转
  if (outerRingRef.value) {
    const anim = gsap.to(outerRingRef.value, {
      rotation: 360,
      duration: 20,
      ease: 'none',
      repeat: -1,
    })
    animations.push(anim)
  }

  // 脉冲环
  if (pulseRing1Ref.value) {
    const anim = gsap.to(pulseRing1Ref.value, {
      scale: 1.3,
      opacity: 0,
      duration: 2,
      ease: 'power1.out',
      repeat: -1,
    })
    animations.push(anim)
  }

  if (pulseRing2Ref.value) {
    const anim = gsap.to(pulseRing2Ref.value, {
      scale: 1.3,
      opacity: 0,
      duration: 2,
      ease: 'power1.out',
      repeat: -1,
      delay: 1,
    })
    animations.push(anim)
  }

  // 内环反向旋转
  if (innerRingRef.value) {
    const anim = gsap.to(innerRingRef.value, {
      rotation: -360,
      duration: 10,
      ease: 'none',
      repeat: -1,
    })
    animations.push(anim)
  }

  // 进度弧线
  if (progressArcRef.value) {
    const anim = gsap.timeline({ repeat: -1 })
      .to(progressArcRef.value, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' })
      .to(progressArcRef.value, { strokeDashoffset: -352, duration: 2, ease: 'power2.inOut' })
    animations.push(anim)
  }

  // 中心 Logo 呼吸
  if (centerLogoRef.value) {
    const anim = gsap.to(centerLogoRef.value, {
      scale: 1.05,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 轨道粒子
  const orbitParticles = [
    { el: orbitParticle1Ref.value, duration: 3 },
    { el: orbitParticle2Ref.value, duration: 4 },
  ]

  orbitParticles.forEach(({ el, duration }) => {
    if (el) {
      gsap.set(el, { transformOrigin: '64px 64px' })
      const anim = gsap.to(el, {
        rotation: 360,
        duration,
        ease: 'none',
        repeat: -1,
      })
      animations.push(anim)
    }
  })

  // 状态文本
  if (statusTextRef.value) {
    const messages = [
      '正在初始化应用',
      '加载软件数据',
      '准备用户界面',
      '即将完成',
    ]

    const textAnim = gsap.timeline({ repeat: -1 })
    messages.forEach((msg, i) => {
      textAnim
        .to(statusTextRef.value!, { opacity: 0, y: -5, duration: 0.2 }, i * 2.5)
        .call(() => { if (statusTextRef.value) statusTextRef.value.textContent = msg }, [], i * 2.5 + 0.2)
        .to(statusTextRef.value!, { opacity: 1, y: 0, duration: 0.2 }, i * 2.5 + 0.2)
        .to({}, { duration: 2.1 }, i * 2.5 + 0.4)
    })
    animations.push(textAnim)
  }

  // 进度条
  if (progressBarRef.value) {
    const anim = gsap.timeline({ repeat: -1 })
      .to(progressBarRef.value, { width: '100%', duration: 3, ease: 'power1.inOut' })
      .to(progressBarRef.value, { opacity: 0.5, duration: 0.2 })
      .set(progressBarRef.value, { width: '0%' })
      .to(progressBarRef.value, { opacity: 1, duration: 0.2 })
    animations.push(anim)
  }

  // 进度条光泽
  if (progressShineRef.value) {
    const anim = gsap.timeline({ repeat: -1, delay: 0.5 })
      .set(progressShineRef.value, { left: '-10%', opacity: 0 })
      .to(progressShineRef.value, { opacity: 1, duration: 0.2 })
      .to(progressShineRef.value, { left: '100%', duration: 1.5, ease: 'power1.inOut' })
      .to(progressShineRef.value, { opacity: 0, duration: 0.2 })
    animations.push(anim)
  }

  // 步骤指示器
  const steps = [step1Ref.value, step2Ref.value, step3Ref.value]
  steps.forEach((step, i) => {
    if (step) {
      const anim = gsap.timeline({ repeat: -1, delay: i * 1 })
        .to(step, { opacity: 1, duration: 0.3 })
        .to(step, { opacity: 0.3, duration: 0.3, delay: 2.5 })
      animations.push(anim)
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
