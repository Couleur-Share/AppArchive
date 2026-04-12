<template>
  <Transition :css="false" @enter="onEnter" @leave="onLeave">
    <div
      v-if="active"
      class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6 py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div ref="backdropLayer" class="absolute inset-0">
        <div class="analysis-overlay-backdrop absolute inset-0"></div>
      </div>

      <div ref="panelRef" class="relative z-10 w-full max-w-3xl">
        <div class="analysis-panel overflow-hidden rounded-[24px] border">
          <div class="flex items-center justify-between gap-4 border-b border-slate-900/[0.06] px-6 py-4 dark:border-white/[0.08]">
            <div class="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              <span class="analysis-panel-dot h-2 w-2 rounded-full"></span>
              Analysis Queue
            </div>
            <div class="analysis-progress-chip rounded-full px-3 py-1 text-[11px] font-semibold">
              {{ Math.round(visualProgress) }}%
            </div>
          </div>

          <div class="grid gap-6 px-6 py-7 md:grid-cols-[156px_minmax(0,1fr)] md:items-center lg:px-8 lg:py-8">
            <div ref="visualRef" class="relative mx-auto h-40 w-40 shrink-0">
              <div class="absolute inset-0 rounded-full border border-slate-900/[0.08] dark:border-white/[0.08]"></div>
              <div class="absolute inset-[12px] rounded-full border border-slate-900/[0.06] dark:border-white/[0.05]"></div>

              <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  class="text-slate-300/70 dark:text-white/[0.08]"
                />
                <circle
                  ref="progressRing"
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4.5"
                  stroke-linecap="round"
                  stroke-dasharray="314"
                  stroke-dashoffset="314"
                  class="text-primary"
                />
              </svg>

              <div
                ref="coreRef"
                class="analysis-core absolute inset-[40px] flex items-center justify-center rounded-full border border-slate-900/[0.08] bg-white dark:border-white/[0.08] dark:bg-[#121212]"
              >
                <svg class="relative z-10 h-11 w-11 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 4.5V10h5L11 19.5V14H6l7-9.5Z" />
                </svg>
              </div>
            </div>

            <div ref="contentRef" class="space-y-5 text-center md:text-left">
              <div class="space-y-2.5">
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Software Analysis
                </p>
                <h3 class="text-[1.65rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  正在整理软件分析结果
                </h3>
                <div class="relative h-6 overflow-hidden">
                  <TransitionGroup name="analysis-status">
                    <p
                      v-if="currentStep"
                      :key="currentStep"
                      class="absolute inset-x-0 text-sm text-slate-600 dark:text-slate-300 md:inset-x-auto"
                    >
                      {{ currentStep }}
                    </p>
                  </TransitionGroup>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  <span>Pipeline</span>
                  <span>{{ Math.round(visualProgress) }}%</span>
                </div>
                <div class="analysis-progress-track h-1.5 overflow-hidden rounded-full">
                  <div
                    class="analysis-progress h-full rounded-full"
                    :style="{ transform: `scaleX(${Math.min(Math.max(visualProgress, 0), 100) / 100})` }"
                  ></div>
                </div>
              </div>

              <div class="grid gap-2 sm:grid-cols-3">
                <div
                  v-for="phase in phaseItems"
                  :key="phase.label"
                  class="rounded-xl border px-3 py-2.5 text-left transition-colors duration-200"
                  :class="phase.current
                    ? 'border-primary/[0.3] bg-primary/[0.08] text-[hsl(var(--primary-h)_72%_26%)] dark:border-primary/[0.28] dark:bg-primary/[0.12] dark:text-[hsl(var(--primary-h)_72%_80%)]'
                    : phase.active
                      ? 'border-slate-900/[0.08] bg-slate-900/[0.03] text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200'
                      : 'border-slate-900/[0.06] bg-white/70 text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-500'"
                >
                  <p class="text-[11px] font-semibold uppercase tracking-[0.16em]">Stage {{ phase.index }}</p>
                  <p class="mt-1 text-sm font-medium tracking-tight">{{ phase.label }}</p>
                </div>
              </div>

              <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">
                系统会自动补全简介、优缺点与分析元数据，完成后直接回填到当前表单。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ active: boolean }>()

const RING_CIRCUMFERENCE = 314
const MAX_PROCESS_PROGRESS = 94

const backdropLayer = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const visualRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const coreRef = ref<HTMLElement | null>(null)
const progressRing = ref<SVGCircleElement | null>(null)

const currentStep = ref('正在读取软件上下文...')
const visualProgress = ref(0)
const prefersReducedMotion = ref(false)

const steps = [
  '正在读取软件上下文...',
  '正在提炼核心能力与边界...',
  '正在整理优缺点与风险...',
  '正在校对结构与元数据...'
]

const phases = ['收集语义', '提炼要点', '生成结果']

const currentPhaseIndex = computed(() => {
  if (visualProgress.value >= 68) return 2
  if (visualProgress.value >= 34) return 1
  return 0
})

const phaseItems = computed(() =>
  phases.map((label, index) => ({
    label,
    index: index + 1,
    active: index <= currentPhaseIndex.value,
    current: index === currentPhaseIndex.value
  }))
)

let progressTween: gsap.core.Tween | null = null
let settleTween: gsap.core.Tween | null = null
let pulseTween: gsap.core.Tween | null = null
let enterTimeline: gsap.core.Timeline | null = null
let leaveTimeline: gsap.core.Timeline | null = null
let reducedMotionMediaQuery: MediaQueryList | null = null

const clampProgress = (value: number) => Math.min(Math.max(value, 0), 100)

const updateRingProgress = (value: number) => {
  if (!progressRing.value) return
  const clamped = clampProgress(value)
  const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE
  progressRing.value.style.strokeDashoffset = offset.toString()
}

const onReducedMotionChange = (event: MediaQueryListEvent) => {
  prefersReducedMotion.value = event.matches
}

const killProcessTweens = () => {
  progressTween?.kill()
  settleTween?.kill()
  pulseTween?.kill()
  progressTween = null
  settleTween = null
  pulseTween = null
}

const killTransitionTimelines = () => {
  enterTimeline?.kill()
  leaveTimeline?.kill()
  enterTimeline = null
  leaveTimeline = null
}

const pulseCore = () => {
  if (prefersReducedMotion.value || !coreRef.value) return
  pulseTween?.kill()
  pulseTween = gsap.fromTo(
    coreRef.value,
    { scale: 1.028 },
    { scale: 1, duration: 0.22, ease: 'power2.out' }
  )
}

const startProcess = () => {
  killProcessTweens()
  visualProgress.value = 0
  currentStep.value = steps[0]
  updateRingProgress(0)

  progressTween = gsap.to(visualProgress, {
    value: MAX_PROCESS_PROGRESS,
    duration: prefersReducedMotion.value ? 3 : 7,
    ease: prefersReducedMotion.value ? 'none' : 'sine.inOut',
    onUpdate: () => {
      const progressValue = clampProgress(visualProgress.value)
      const stepIndex = Math.min(
        steps.length - 1,
        Math.floor((progressValue / MAX_PROCESS_PROGRESS) * steps.length)
      )

      if (steps[stepIndex] && currentStep.value !== steps[stepIndex]) {
        currentStep.value = steps[stepIndex]
        pulseCore()
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
    duration: 0.32,
    ease: 'power2.out',
    onUpdate: () => {
      updateRingProgress(visualProgress.value)
    }
  })
}

const onEnter = (_element: Element, done: () => void) => {
  killTransitionTimelines()
  const isReduced = prefersReducedMotion.value

  enterTimeline = gsap.timeline({ onComplete: done })
  enterTimeline
    .fromTo(
      backdropLayer.value,
      { opacity: 0 },
      { opacity: 1, duration: isReduced ? 0.12 : 0.24, ease: isReduced ? 'none' : 'power1.out' }
    )
    .fromTo(
      panelRef.value,
      { y: isReduced ? 0 : 16, scale: isReduced ? 1 : 0.986, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: isReduced ? 0.14 : 0.34, ease: isReduced ? 'none' : 'power2.out' },
      '-=0.06'
    )
    .fromTo(
      [visualRef.value, contentRef.value],
      { y: isReduced ? 0 : 8, opacity: 0 },
      { y: 0, opacity: 1, duration: isReduced ? 0.14 : 0.28, stagger: isReduced ? 0 : 0.04, ease: isReduced ? 'none' : 'power2.out' },
      '-=0.2'
    )
}

const onLeave = (_element: Element, done: () => void) => {
  killTransitionTimelines()
  const isReduced = prefersReducedMotion.value

  leaveTimeline = gsap.timeline({ onComplete: done })
  leaveTimeline
    .to(panelRef.value, {
      y: isReduced ? 0 : 10,
      scale: isReduced ? 1 : 0.992,
      opacity: 0,
      duration: isReduced ? 0.12 : 0.2,
      ease: isReduced ? 'none' : 'power1.in'
    })
    .to(
      backdropLayer.value,
      { opacity: 0, duration: isReduced ? 0.1 : 0.18, ease: isReduced ? 'none' : 'power1.in' },
      '-=0.12'
    )
}

watch(
  () => props.active,
  (active) => {
    if (active) {
      startProcess()
    } else {
      finishProcess()
    }
  }
)

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

<style>
.analysis-overlay-backdrop {
  background: rgb(18 18 18 / 0.34);
  backdrop-filter: blur(6px);
}

.dark .analysis-overlay-backdrop {
  background: rgb(0 0 0 / 0.72);
}

.analysis-panel {
  background: linear-gradient(180deg, rgb(248 250 248 / 0.98), rgb(241 244 241 / 0.98));
  border-color: rgb(15 23 42 / 0.08);
  box-shadow: 0 28px 64px -32px rgb(15 23 42 / 0.28);
}

.dark .analysis-panel {
  background: linear-gradient(180deg, rgb(31 31 31 / 0.98), rgb(24 24 24 / 0.98));
  border-color: rgb(255 255 255 / 0.08);
  box-shadow: 0 28px 64px -30px rgb(0 0 0 / 0.78);
}

.analysis-progress-chip {
  border: 1px solid rgb(15 23 42 / 0.08);
  background: rgb(255 255 255 / 0.72);
  color: rgb(71 85 105);
}

.dark .analysis-progress-chip {
  border-color: rgb(255 255 255 / 0.08);
  background: rgb(18 18 18 / 0.88);
  color: rgb(203 203 203);
}

.analysis-panel-dot {
  background: hsl(var(--primary-h) var(--primary-s) var(--primary-l));
}

.analysis-core {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.46),
    0 16px 32px -24px rgb(15 23 42 / 0.22);
}

.dark .analysis-core {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    0 18px 36px -28px rgb(0 0 0 / 0.74);
}

.analysis-progress-track {
  background: rgb(15 23 42 / 0.08);
}

.dark .analysis-progress-track {
  background: rgb(255 255 255 / 0.08);
}

.analysis-progress {
  transform-origin: left center;
  background: hsl(var(--primary-h) var(--primary-s) var(--primary-l));
}

.analysis-status-enter-active,
.analysis-status-leave-active {
  transition:
    opacity 180ms cubic-bezier(0.25, 1, 0.5, 1),
    transform 180ms cubic-bezier(0.25, 1, 0.5, 1);
}

.analysis-status-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.analysis-status-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .analysis-status-enter-active,
  .analysis-status-leave-active {
    transition-duration: 1ms;
  }
}
</style>
