<template>
  <div
    v-if="active"
    class="fixed inset-0 z-[60] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

    <!-- 主要内容 -->
    <div class="relative flex flex-col items-center px-4">
      <!-- 动态圆环动画 -->
      <div class="relative w-32 h-32 mb-8">
        <!-- 外圈旋转 -->
        <div
          ref="outerRingRef"
          class="absolute inset-0 rounded-full border-2 border-emerald-500/30"
        ></div>
        
        <!-- 中圈旋转（反向） -->
        <div
          ref="middleRingRef"
          class="absolute inset-2 rounded-full border-2 border-dashed border-gray-400/40"
        ></div>
        
        <!-- 内圈 -->
        <div
          ref="innerRingRef"
          class="absolute inset-4 rounded-full border-2 border-emerald-400/50"
        ></div>
        
        <!-- 中心图标 -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div
            ref="centerIconRef"
            class="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center shadow-xl"
          >
            <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        
        <!-- 轨道粒子 -->
        <div
          ref="particle1Ref"
          class="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
          style="top: 0; left: 50%; transform: translateX(-50%)"
        ></div>
        <div
          ref="particle2Ref"
          class="absolute w-1.5 h-1.5 bg-gray-300 rounded-full"
          style="top: 50%; right: 0; transform: translateY(-50%)"
        ></div>
        <div
          ref="particle3Ref"
          class="absolute w-2 h-2 bg-emerald-300 rounded-full shadow-lg shadow-emerald-300/50"
          style="bottom: 0; left: 50%; transform: translateX(-50%)"
        ></div>
      </div>

      <!-- 标题与状态 -->
      <div class="text-center mb-6">
        <h3 class="text-lg font-semibold text-white mb-1">
          AI 智能填充
        </h3>
        <p
          ref="statusTextRef"
          class="text-sm text-gray-400"
        >
          正在分析软件信息
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
            <span>解析</span>
          </div>
          <div ref="step2Ref" class="flex items-center gap-1.5 opacity-40">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>提取</span>
          </div>
          <div ref="step3Ref" class="flex items-center gap-1.5 opacity-40">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>生成</span>
          </div>
          <div ref="step4Ref" class="flex items-center gap-1.5 opacity-40">
            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span>完成</span>
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

const outerRingRef = ref<HTMLElement | null>(null)
const middleRingRef = ref<HTMLElement | null>(null)
const innerRingRef = ref<HTMLElement | null>(null)
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

  const outerRing = outerRingRef.value
  const middleRing = middleRingRef.value
  const innerRing = innerRingRef.value
  const centerIcon = centerIconRef.value
  const particle1 = particle1Ref.value
  const particle2 = particle2Ref.value
  const particle3 = particle3Ref.value
  const statusText = statusTextRef.value
  const progressBar = progressBarRef.value
  const steps = [step1Ref.value, step2Ref.value, step3Ref.value, step4Ref.value]

  // 外圈旋转
  if (outerRing) {
    const anim = gsap.to(outerRing, {
      rotation: 360,
      duration: 8,
      ease: 'none',
      repeat: -1,
    })
    animations.push(anim)
  }

  // 中圈反向旋转
  if (middleRing) {
    const anim = gsap.to(middleRing, {
      rotation: -360,
      duration: 12,
      ease: 'none',
      repeat: -1,
    })
    animations.push(anim)
  }

  // 内圈缩放呼吸
  if (innerRing) {
    const anim = gsap.to(innerRing, {
      scale: 1.05,
      opacity: 0.8,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 中心图标呼吸
  if (centerIcon) {
    const anim = gsap.to(centerIcon, {
      scale: 1.08,
      duration: 1.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    animations.push(anim)
  }

  // 粒子轨道运动
  const particles = [
    { el: particle1, duration: 3, delay: 0 },
    { el: particle2, duration: 4, delay: 1 },
    { el: particle3, duration: 3.5, delay: 0.5 },
  ]

  particles.forEach(({ el, duration, delay }) => {
    if (el) {
      gsap.set(el, { transformOrigin: '64px 64px' })
      const anim = gsap.to(el, {
        rotation: 360,
        duration,
        ease: 'none',
        repeat: -1,
        delay,
      })
      animations.push(anim)
    }
  })

  // 状态文本循环
  if (statusText) {
    const messages = [
      '正在分析软件信息',
      '提取核心特征',
      '识别优缺点',
      '生成智能建议',
    ]
    let index = 0

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
