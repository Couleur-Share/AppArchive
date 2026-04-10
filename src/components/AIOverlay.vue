<template>
  <Transition
    :css="false"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      v-if="active"
      class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-sans"
      role="status"
      aria-live="polite"
      aria-busy="true"
      style="--primary-h: 167; --primary-s: 100%; --primary-l: 50%;"
    >
      <!-- 背景层：多重叠加增强质感 -->
      <div ref="bgLayer" class="absolute inset-0 z-0">
        <!-- 基础模糊层: 使用深色品牌色调替代纯黑/灰 -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-3xl"></div>
        <!-- 暗角渐变: 使用透明度更低的深蓝/青色，避免死黑 -->
        <div class="absolute inset-0 bg-radial-gradient"></div>
        <!-- 动态网格背景 (视差效果) -->
        <div class="absolute inset-0 opacity-[0.05] bg-[url('/grid.svg')] animate-pan-background"></div>
        <!-- 氛围光晕 -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-breathe"></div>
      </div>

      <!-- 主要内容容器 -->
      <div ref="contentContainer" class="relative z-10 flex flex-col items-center justify-center w-full max-w-xl p-8">
        
        <!-- HUD 核心组件 -->
        <div class="relative w-96 h-96 mb-16 flex items-center justify-center perspective-1000">
          
          <!-- Layer 1: 外部刻度环 (逆时针慢速) -->
          <div ref="ringOuter" class="absolute inset-0 rounded-full border border-primary/10 border-dashed animate-spin-slow-reverse will-change-transform"></div>
          
          <!-- Layer 2: 扫描雷达层 -->
          <div ref="radarLayer" class="absolute inset-2 rounded-full overflow-hidden opacity-30">
             <div class="absolute inset-0 bg-conic-gradient animate-spin-medium will-change-transform"></div>
          </div>

          <!-- Layer 3: 动态进度环 SVG -->
          <svg class="absolute inset-4 w-[22rem] h-[22rem] rotate-[-90deg]" viewBox="0 0 100 100">
            <!-- 底部轨道 -->
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
            <!-- 进度条 (纯色发光) -->
            <circle 
              ref="progressRing"
              cx="50" cy="50" r="46" 
              fill="none" 
              stroke="currentColor"
              stroke-width="1.5" 
              stroke-linecap="round"
              stroke-dasharray="289"
              stroke-dashoffset="289"
              class="text-primary will-change-[stroke-dashoffset] drop-shadow-[0_0_8px_hsla(var(--primary-h),var(--primary-s),var(--primary-l),0.6)]"
            />
          </svg>

          <!-- Layer 4: 粒子轨道 -->
          <div class="absolute inset-0 animate-spin-slow">
             <div class="absolute top-4 left-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_hsla(var(--primary-h),var(--primary-s),var(--primary-l),1)]"></div>
             <div class="absolute bottom-4 left-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
          </div>

          <!-- Layer 5: 核心能量块 -->
          <div ref="coreIcon" class="relative w-28 h-28 rounded-3xl bg-primary/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group">
            <!-- 内部光效 -->
            <div class="absolute inset-0 bg-primary/10 blur-xl group-hover:bg-primary/20 transition-colors duration-500"></div>
            <!-- 扫描线 -->
            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent translate-y-[-100%] animate-scan"></div>
            
            <!-- 图标主体 -->
            <div class="relative z-10 text-primary drop-shadow-[0_0_15px_hsla(var(--primary-h),var(--primary-s),var(--primary-l),0.6)]">
               <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            
            <!-- 边框高亮 -->
            <div class="absolute inset-0 rounded-3xl border border-white/5 shadow-inner"></div>
          </div>
        </div>

        <!-- 文本与状态区域 -->
        <div ref="textContainer" class="w-full text-center space-y-8 relative z-20">
          <div class="space-y-2">
            <h3 class="text-4xl font-bold text-white tracking-tight drop-shadow-lg">
              AI 智能分析中
            </h3>
            
            <!-- 步骤切换动画 -->
            <div class="h-8 flex items-center justify-center overflow-hidden relative">
               <TransitionGroup name="slide-fade">
                  <p 
                    v-if="currentStep"
                    :key="currentStep" 
                    class="absolute text-primary font-mono text-sm tracking-[0.2em] uppercase flex items-center gap-2"
                  >
                    <span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse step-dot-pulse"></span>
                    {{ currentStep }}
                  </p>
               </TransitionGroup>
            </div>
          </div>

          <!-- 精致进度条 -->
          <div class="w-full px-4 max-w-md mx-auto">
            <div class="flex justify-between text-[10px] text-gray-400 font-mono mb-2 tracking-widest opacity-80">
              <span>PROCESSING DATA</span>
              <span>{{ Math.round(visualProgress) }}%</span>
            </div>
            
            <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative backdrop-blur-sm ring-1 ring-white/5">
              <div 
                class="absolute left-0 top-0 h-full w-full origin-left bg-gradient-to-r from-primary/40 via-primary to-primary shadow-[0_0_15px_hsla(var(--primary-h),var(--primary-s),var(--primary-l),0.8)] will-change-transform"
                :style="{ transform: `scaleX(${Math.min(Math.max(visualProgress, 0), 100) / 100})` }"
              >
                <!-- 进度条头部高光 -->
                <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/80 blur-[2px]"></div>
              </div>
            </div>
            
            <p class="text-[10px] text-gray-500 mt-4 font-light tracking-wide">
              系统将自动优化并生成预览，请稍候...
            </p>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ active: boolean }>()

const RING_CIRCUMFERENCE = 289
const MAX_PROCESS_PROGRESS = 95

// DOM Refs for GSAP
const bgLayer = ref<HTMLElement | null>(null)
const contentContainer = ref<HTMLElement | null>(null)
const ringOuter = ref<HTMLElement | null>(null)
const radarLayer = ref<HTMLElement | null>(null)
const coreIcon = ref<HTMLElement | null>(null)
const textContainer = ref<HTMLElement | null>(null)
const progressRing = ref<SVGElement | null>(null)

// State
const currentStep = ref("初始化分析引擎...")
const visualProgress = ref(0)
const prefersReducedMotion = ref(false)

let progressTween: gsap.core.Tween | null = null
let settleTween: gsap.core.Tween | null = null
let corePulseTween: gsap.core.Tween | null = null
let enterTimeline: gsap.core.Timeline | null = null
let leaveTimeline: gsap.core.Timeline | null = null
let reducedMotionMediaQuery: MediaQueryList | null = null

const steps = [
  "解析输入数据结构...",
  "特征提取与向量化...",
  "神经网络模型推理...",
  "生成优化建议...",
  "完成分析报告..."
]

const onReducedMotionChange = (event: MediaQueryListEvent) => {
  prefersReducedMotion.value = event.matches
}

const clampProgress = (value: number) => Math.min(Math.max(value, 0), 100)

const updateRingProgress = (value: number) => {
  if (!progressRing.value) return
  const clamped = clampProgress(value)
  const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE
  progressRing.value.style.strokeDashoffset = offset.toString()
}

const killProcessTweens = () => {
  progressTween?.kill()
  settleTween?.kill()
  corePulseTween?.kill()
  progressTween = null
  settleTween = null
  corePulseTween = null
}

const killTransitionTimelines = () => {
  enterTimeline?.kill()
  leaveTimeline?.kill()
  enterTimeline = null
  leaveTimeline = null
}

const pulseCoreIcon = () => {
  if (prefersReducedMotion.value || !coreIcon.value) return
  corePulseTween?.kill()
  corePulseTween = gsap.fromTo(
    coreIcon.value,
    { scale: 1.04 },
    { scale: 1, duration: 0.22, ease: 'power2.out' }
  )
}

// GSAP Animations
const onEnter = (_el: Element, done: () => void) => {
  killTransitionTimelines()
  const isReduced = prefersReducedMotion.value

  enterTimeline = gsap.timeline({ onComplete: done })
  enterTimeline
    .fromTo(
      bgLayer.value,
      { opacity: 0, scale: isReduced ? 1 : 1.05 },
      { opacity: 1, scale: 1, duration: isReduced ? 0.12 : 0.7, ease: isReduced ? 'none' : 'power2.out' }
    )
    .fromTo(
      [ringOuter.value, radarLayer.value],
      { scale: isReduced ? 1 : 0.88, opacity: 0, rotation: isReduced ? 0 : -24 },
      { scale: 1, opacity: 1, rotation: 0, duration: isReduced ? 0.14 : 0.8, ease: isReduced ? 'none' : 'expo.out', stagger: isReduced ? 0 : 0.08 },
      '-=0.45'
    )
    .fromTo(
      coreIcon.value,
      { scale: isReduced ? 1 : 0.84, opacity: 0 },
      { scale: 1, opacity: 1, duration: isReduced ? 0.14 : 0.5, ease: isReduced ? 'none' : 'power3.out' },
      '-=0.5'
    )
    .fromTo(
      textContainer.value,
      { y: isReduced ? 0 : 18, opacity: 0 },
      { y: 0, opacity: 1, duration: isReduced ? 0.14 : 0.45, ease: isReduced ? 'none' : 'power2.out' },
      '-=0.28'
    )
}

const onLeave = (_el: Element, done: () => void) => {
  killTransitionTimelines()
  const isReduced = prefersReducedMotion.value

  leaveTimeline = gsap.timeline({ onComplete: done })
  leaveTimeline
    .to(contentContainer.value, { scale: isReduced ? 1 : 0.97, opacity: 0, duration: isReduced ? 0.12 : 0.28, ease: isReduced ? 'none' : 'power2.in' })
    .to(bgLayer.value, { opacity: 0, duration: isReduced ? 0.12 : 0.24, ease: isReduced ? 'none' : 'power1.in' }, '-=0.16')
}

// Logic
const startProcess = () => {
  killProcessTweens()
  visualProgress.value = 0
  currentStep.value = steps[0]
  updateRingProgress(0)

  progressTween = gsap.to(visualProgress, {
    value: MAX_PROCESS_PROGRESS,
    duration: prefersReducedMotion.value ? 3.2 : 8,
    ease: prefersReducedMotion.value ? 'none' : 'sine.inOut',
    onUpdate: () => {
      const progressValue = clampProgress(visualProgress.value)
      const stepIndex = Math.min(
        steps.length - 1,
        Math.floor((progressValue / 100) * steps.length)
      )

      if (steps[stepIndex] && currentStep.value !== steps[stepIndex]) {
        currentStep.value = steps[stepIndex]
        pulseCoreIcon()
      }

      updateRingProgress(progressValue)
    }
  })
}

const finishProcess = () => {
  progressTween?.kill()
  progressTween = null
  settleTween?.kill()

  if (prefersReducedMotion.value) {
    visualProgress.value = 100
    updateRingProgress(100)
    return
  }

  settleTween = gsap.to(visualProgress, {
    value: 100,
    duration: 0.45,
    ease: 'power2.out',
    onUpdate: () => {
      updateRingProgress(visualProgress.value)
    }
  })
}

watch(() => props.active, (active) => {
  if (active) {
    startProcess()
  } else {
    finishProcess()
  }
})

onMounted(() => {
  if (typeof window === 'undefined' || !window.matchMedia) return
  reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = reducedMotionMediaQuery.matches

  if (typeof reducedMotionMediaQuery.addEventListener === 'function') {
    reducedMotionMediaQuery.addEventListener('change', onReducedMotionChange)
  } else {
    reducedMotionMediaQuery.addListener(onReducedMotionChange)
  }
})

onUnmounted(() => {
  killProcessTweens()
  killTransitionTimelines()

  if (!reducedMotionMediaQuery) return
  if (typeof reducedMotionMediaQuery.removeEventListener === 'function') {
    reducedMotionMediaQuery.removeEventListener('change', onReducedMotionChange)
  } else {
    reducedMotionMediaQuery.removeListener(onReducedMotionChange)
  }
})
</script>

<style scoped>
/* 辅助动画类 (对于简单的循环动画，CSS 仍比 JS 更高效) */
.animate-spin-slow-reverse {
  animation: spin 15s linear infinite reverse;
}
.animate-spin-medium {
  animation: spin 4s linear infinite;
}
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
.animate-pan-background {
  animation: pan 20s linear infinite alternate;
}
.animate-breathe {
  animation: breathe 4.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}
.animate-scan {
  animation: scan 2.4s cubic-bezier(0.32, 0, 0.67, 0) infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pan {
  from { background-position: 0% 0%; }
  to { background-position: 100% 100%; }
}
@keyframes breathe {
  0%, 100% { opacity: 0.18; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.3; transform: translate(-50%, -50%) scale(1.07); }
}
@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(200%); }
}

/* 视觉特效 */
.bg-radial-gradient {
  /* 使用深色品牌色调的渐变，而非纯黑 */
  background: radial-gradient(circle at center, transparent 0%, hsla(var(--primary-h),var(--primary-s),var(--primary-l), 0.15) 120%);
}
.bg-conic-gradient {
  background: conic-gradient(from 0deg at 50% 50%, transparent 0deg, hsla(var(--primary-h),var(--primary-s),var(--primary-l), 0.1) 60deg, transparent 120deg);
}
.perspective-1000 {
  perspective: 1000px;
}

/* 文本切换过渡 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
  .animate-spin-slow-reverse,
  .animate-spin-medium,
  .animate-spin-slow,
  .animate-pan-background,
  .animate-breathe,
  .animate-scan {
    animation: none !important;
  }

  .step-dot-pulse {
    animation: none !important;
  }

  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition-duration: 1ms;
  }
}
</style>
