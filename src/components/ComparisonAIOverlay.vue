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
        <div class="absolute inset-0 bg-white/[0.82] dark:bg-slate-950/[0.84] backdrop-blur-[12px]"></div>
        <div class="comparison-overlay-grid absolute inset-0"></div>
        <div class="comparison-overlay-glow absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
      </div>

      <div ref="panelRef" class="relative z-10 w-full max-w-5xl">
        <div class="comparison-panel overflow-hidden rounded-[32px] border border-white/60 bg-white/[0.84] shadow-[0_36px_120px_-60px_rgba(15,23,42,0.6)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-slate-950/[0.88] dark:shadow-[0_40px_120px_-56px_rgba(2,6,23,0.95)]">
          <div class="flex items-center justify-between gap-4 border-b border-slate-900/[0.06] px-6 py-4 dark:border-white/[0.08]">
            <div class="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
              <span class="comparison-panel-dot h-2 w-2 rounded-full"></span>
              Comparison Analysis
            </div>
            <div class="rounded-full border border-slate-900/[0.08] bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900/[0.88] dark:text-slate-300">
              {{ Math.round(visualProgress) }}%
            </div>
          </div>

          <div class="grid gap-8 px-6 py-7 lg:px-8 lg:py-8">
            <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_72px_minmax(260px,320px)_72px_minmax(0,1fr)] md:items-center">
              <div ref="leftNodeRef" class="comparison-node md:justify-self-end">
                <div class="comparison-node-card rounded-2xl border border-slate-900/[0.08] bg-white/[0.72] p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_18px_40px_-30px_rgba(2,6,23,0.72)]">
                  <div class="flex items-center gap-3">
                    <div class="comparison-node-icon flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M4 7.5h16M7.5 4v16M8 15l2.5-2.5 2 2L16 11" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">候选 01</p>
                      <p class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">校验上下文与结构</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="comparison-flow hidden md:block">
                <span class="comparison-flow-dot"></span>
              </div>

              <div
                ref="centerNodeRef"
                class="comparison-center rounded-[28px] border border-primary/[0.18] bg-primary/[0.06] p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.34)] dark:border-primary/20 dark:bg-primary/[0.07] dark:shadow-[0_24px_62px_-40px_rgba(2,6,23,0.82)]"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="relative flex h-14 w-14 items-center justify-center rounded-[22px] border border-primary/20 bg-white/[0.78] dark:border-white/[0.08] dark:bg-slate-900/[0.92]">
                      <div class="comparison-core-aura absolute inset-0 rounded-[inherit]"></div>
                      <svg class="relative z-10 h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 6h8m-7 6h6m-8 6h10M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">汇总中</p>
                      <h3 class="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                        构建对比结论
                      </h3>
                    </div>
                  </div>

                  <div class="rounded-full border border-slate-900/[0.08] bg-white/[0.72] px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    主流程
                  </div>
                </div>

                <div class="mt-6 space-y-3">
                  <div class="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <span>Difference Map</span>
                    <span>{{ Math.round(visualProgress) }}%</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.08]">
                    <div
                      class="comparison-progress h-full rounded-full"
                      :style="{ transform: `scaleX(${Math.min(Math.max(visualProgress, 0), 100) / 100})` }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="comparison-flow comparison-flow--reverse hidden md:block">
                <span class="comparison-flow-dot comparison-flow-dot--reverse"></span>
              </div>

              <div ref="rightNodeRef" class="comparison-node md:justify-self-start">
                <div class="comparison-node-card rounded-2xl border border-slate-900/[0.08] bg-white/[0.72] p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_18px_40px_-30px_rgba(2,6,23,0.72)]">
                  <div class="flex items-center gap-3">
                    <div class="comparison-node-icon flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M6 7h12M6 12h8m-8 5h12" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">候选 02</p>
                      <p class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">归纳关键差异维度</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref="textBlockRef" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
              <div class="space-y-3 text-center lg:text-left">
                <p class="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Comparison Analysis
                </p>
                <h4 class="text-[1.75rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  正在整理多软件对比结论
                </h4>
                <div class="relative h-6 overflow-hidden">
                  <TransitionGroup name="comparison-status">
                    <p
                      v-if="currentMessage"
                      :key="currentMessage"
                      class="absolute inset-x-0 text-sm text-slate-600 dark:text-slate-300 lg:inset-x-auto"
                    >
                      {{ currentMessage }}
                    </p>
                  </TransitionGroup>
                </div>
                <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  会先归纳候选软件的共同点与关键差异，再生成推荐和最终总结。
                </p>
              </div>

              <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <div
                  v-for="phase in phaseItems"
                  :key="phase.label"
                  class="rounded-2xl border px-3 py-2 text-left transition-colors duration-200"
                  :class="phase.current
                    ? 'border-primary/[0.28] bg-primary/10 text-[hsl(var(--primary-h)_70%_24%)] dark:border-primary/[0.34] dark:bg-primary/[0.16] dark:text-[hsl(var(--primary-h)_72%_80%)]'
                    : phase.active
                      ? 'border-slate-900/10 bg-slate-900/[0.03] text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200'
                      : 'border-slate-900/[0.06] bg-white/[0.55] text-slate-400 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-500'"
                >
                  <p class="text-[11px] font-medium uppercase tracking-[0.18em]">Stage {{ phase.index }}</p>
                  <p class="mt-1 text-sm font-medium tracking-tight">{{ phase.label }}</p>
                </div>
              </div>
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

const MAX_PROCESS_PROGRESS = 96

const backdropLayer = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const leftNodeRef = ref<HTMLElement | null>(null)
const centerNodeRef = ref<HTMLElement | null>(null)
const rightNodeRef = ref<HTMLElement | null>(null)
const textBlockRef = ref<HTMLElement | null>(null)

const currentMessage = ref('正在校验候选软件集合...')
const visualProgress = ref(0)
const prefersReducedMotion = ref(false)

const steps = [
  '正在校验候选软件集合...',
  '正在归纳共同能力与边界...',
  '正在提炼关键差异与适配场景...',
  '正在整理推荐结论与总结...'
]

const phases = ['校验候选', '归纳差异', '形成建议']

const currentPhaseIndex = computed(() => {
  if (visualProgress.value >= 70) return 2
  if (visualProgress.value >= 32) return 1
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

const pulseCenterCard = () => {
  if (prefersReducedMotion.value || !centerNodeRef.value) return
  pulseTween?.kill()
  pulseTween = gsap.fromTo(
    centerNodeRef.value,
    { scale: 1.02 },
    { scale: 1, duration: 0.22, ease: 'power2.out' }
  )
}

const startProcess = () => {
  killProcessTweens()
  visualProgress.value = 0
  currentMessage.value = steps[0]

  progressTween = gsap.to(visualProgress, {
    value: MAX_PROCESS_PROGRESS,
    duration: prefersReducedMotion.value ? 3.2 : 7.2,
    ease: prefersReducedMotion.value ? 'none' : 'sine.inOut',
    onUpdate: () => {
      const progressValue = clampProgress(visualProgress.value)
      const stepIndex = Math.min(
        steps.length - 1,
        Math.floor((progressValue / MAX_PROCESS_PROGRESS) * steps.length)
      )

      if (steps[stepIndex] && currentMessage.value !== steps[stepIndex]) {
        currentMessage.value = steps[stepIndex]
        pulseCenterCard()
      }
    }
  })
}

const finishProcess = () => {
  progressTween?.kill()
  progressTween = null
  settleTween?.kill()

  if (prefersReducedMotion.value) {
    visualProgress.value = 100
    return
  }

  settleTween = gsap.to(visualProgress, {
    value: 100,
    duration: 0.34,
    ease: 'power2.out'
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
      { y: isReduced ? 0 : 18, scale: isReduced ? 1 : 0.986, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: isReduced ? 0.14 : 0.34, ease: isReduced ? 'none' : 'power2.out' },
      '-=0.06'
    )
    .fromTo(
      [leftNodeRef.value, rightNodeRef.value],
      { x: (index) => (index === 0 ? -12 : 12), opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: isReduced ? 0.14 : 0.28,
        stagger: isReduced ? 0 : 0.05,
        ease: isReduced ? 'none' : 'power2.out'
      },
      '-=0.18'
    )
    .fromTo(
      [centerNodeRef.value, textBlockRef.value],
      { y: isReduced ? 0 : 8, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: isReduced ? 0.14 : 0.28,
        stagger: isReduced ? 0 : 0.05,
        ease: isReduced ? 'none' : 'power2.out'
      },
      '-=0.22'
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

<style scoped>
.comparison-overlay-grid {
  background-image:
    linear-gradient(rgb(15 23 42 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(15 23 42 / 0.05) 1px, transparent 1px);
  background-size: 36px 36px;
  opacity: 0.42;
  -webkit-mask-image: radial-gradient(circle at center, rgb(0 0 0 / 0.88) 24%, transparent 82%);
  mask-image: radial-gradient(circle at center, rgb(0 0 0 / 0.88) 24%, transparent 82%);
}

:global(.dark) .comparison-overlay-grid {
  background-image:
    linear-gradient(rgb(255 255 255 / 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.055) 1px, transparent 1px);
}

.comparison-overlay-glow {
  background: radial-gradient(
    circle at center,
    hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.14) 0%,
    transparent 72%
  );
}

:global(.dark) .comparison-overlay-glow {
  background: radial-gradient(
    circle at center,
    hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.09) 0%,
    transparent 72%
  );
}

.comparison-panel {
  position: relative;
}

.comparison-panel::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(135deg, rgb(255 255 255 / 0.22), transparent 48%);
  content: '';
}

:global(.dark) .comparison-panel::before {
  background: linear-gradient(135deg, rgb(255 255 255 / 0.045), transparent 44%);
}

.comparison-panel-dot {
  background: hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.82);
  box-shadow: 0 0 0 5px hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.12);
}

.comparison-node {
  display: flex;
}

.comparison-center {
  position: relative;
}

.comparison-center::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.12),
    transparent 62%
  );
  content: '';
}

.comparison-core-aura {
  background: radial-gradient(
    circle at center,
    hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.16) 0%,
    transparent 72%
  );
  animation: comparison-core-breathe 4.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.comparison-progress {
  transform-origin: left center;
  background: linear-gradient(
    90deg,
    hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.28),
    hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.94)
  );
  box-shadow: 0 10px 24px -18px hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.72);
}

.comparison-flow {
  --flow-distance: 88px;
  position: relative;
  height: 1px;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgb(15 23 42 / 0.14), transparent);
}

:global(.dark) .comparison-flow {
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.12), transparent);
}

.comparison-flow-dot {
  position: absolute;
  left: 0;
  top: 50%;
  height: 10px;
  width: 10px;
  border-radius: 999px;
  background: hsl(var(--primary-h) var(--primary-s) var(--primary-l));
  box-shadow: 0 0 0 4px hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.16);
  animation: comparison-flow-forward 2.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  transform: translate(-16px, -50%);
}

.comparison-flow-dot--reverse {
  animation-name: comparison-flow-reverse;
}

.comparison-status-enter-active,
.comparison-status-leave-active {
  transition:
    opacity 180ms cubic-bezier(0.25, 1, 0.5, 1),
    transform 180ms cubic-bezier(0.25, 1, 0.5, 1);
}

.comparison-status-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.comparison-status-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes comparison-flow-forward {
  0% {
    opacity: 0;
    transform: translate(-16px, -50%);
  }
  18% {
    opacity: 1;
  }
  82% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--flow-distance), -50%);
  }
}

@keyframes comparison-flow-reverse {
  0% {
    opacity: 0;
    transform: translate(var(--flow-distance), -50%);
  }
  18% {
    opacity: 1;
  }
  82% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-16px, -50%);
  }
}

@keyframes comparison-core-breathe {
  0%,
  100% {
    opacity: 0.32;
    transform: scale(1);
  }
  50% {
    opacity: 0.48;
    transform: scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .comparison-core-aura,
  .comparison-flow-dot,
  .comparison-flow-dot--reverse {
    animation: none !important;
  }

  .comparison-status-enter-active,
  .comparison-status-leave-active {
    transition-duration: 1ms;
  }
}
</style>
