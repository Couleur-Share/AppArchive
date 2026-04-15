<template>
  <Teleport to="body">
    <Transition :css="false" @enter="onEnter" @leave="onLeave">
      <div
        v-if="active"
        class="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden px-6 py-10"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div ref="backdropLayer" class="absolute inset-0">
          <div class="comparison-overlay-backdrop absolute inset-0"></div>
        </div>

        <div ref="panelRef" class="relative z-10 w-full max-w-5xl">
          <div class="comparison-panel overflow-hidden rounded-[28px] border">
            <div class="flex items-center justify-between gap-4 border-b border-slate-900/[0.06] px-6 py-4 dark:border-white/[0.08]">
              <div class="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                <span class="comparison-panel-dot h-2 w-2 rounded-full"></span>
                Comparison Analysis
              </div>
              <div class="comparison-progress-chip rounded-full px-3 py-1 text-[11px] font-semibold">
                {{ Math.round(visualProgress) }}%
              </div>
            </div>

            <div class="grid gap-7 px-6 py-7 lg:px-8 lg:py-8">
              <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)_minmax(0,1fr)] md:items-center">
                <div ref="leftNodeRef" class="comparison-node md:justify-self-end">
                  <div class="comparison-node-card rounded-2xl p-4">
                    <div class="flex items-center gap-3">
                      <div class="comparison-node-icon flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-[#121212] dark:text-slate-300">
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

                <div
                  ref="centerNodeRef"
                  class="comparison-center rounded-[24px] p-6"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <div class="comparison-center-icon relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/20">
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

                    <div class="comparison-stage-chip rounded-full px-3 py-1 text-[11px] font-semibold">
                      主流程
                    </div>
                  </div>

                  <div class="mt-6 space-y-3">
                    <div class="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      <span>Difference Map</span>
                      <span>{{ Math.round(visualProgress) }}%</span>
                    </div>
                    <div class="comparison-progress-track h-1.5 overflow-hidden rounded-full">
                      <div
                        class="comparison-progress h-full rounded-full"
                        :style="{ transform: `scaleX(${Math.min(Math.max(visualProgress, 0), 100) / 100})` }"
                      ></div>
                    </div>
                  </div>
                </div>

                <div ref="rightNodeRef" class="comparison-node md:justify-self-start">
                  <div class="comparison-node-card rounded-2xl p-4">
                    <div class="flex items-center gap-3">
                      <div class="comparison-node-icon flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-[#121212] dark:text-slate-300">
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
                  <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Comparison Analysis
                  </p>
                  <h4 class="text-[1.65rem] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

<style>
.comparison-overlay-backdrop {
  background: rgb(18 18 18 / 0.34);
  backdrop-filter: blur(6px);
}

.dark .comparison-overlay-backdrop {
  background: rgb(0 0 0 / 0.72);
}

.comparison-panel {
  background: linear-gradient(180deg, rgb(248 250 248 / 0.98), rgb(241 244 241 / 0.98));
  border-color: rgb(15 23 42 / 0.08);
  box-shadow: 0 28px 64px -32px rgb(15 23 42 / 0.28);
}

.dark .comparison-panel {
  background: linear-gradient(180deg, rgb(31 31 31 / 0.98), rgb(24 24 24 / 0.98));
  border-color: rgb(255 255 255 / 0.08);
  box-shadow: 0 28px 64px -30px rgb(0 0 0 / 0.78);
}

.comparison-progress-chip,
.comparison-stage-chip {
  border: 1px solid rgb(15 23 42 / 0.08);
  background: rgb(255 255 255 / 0.72);
  color: rgb(71 85 105);
}

.dark .comparison-progress-chip,
.dark .comparison-stage-chip {
  border-color: rgb(255 255 255 / 0.08);
  background: rgb(18 18 18 / 0.88);
  color: rgb(203 203 203);
}

.comparison-panel-dot {
  background: hsl(var(--primary-h) var(--primary-s) var(--primary-l));
}

.comparison-node {
  display: flex;
}

.comparison-node-card {
  border: 1px solid rgb(15 23 42 / 0.08);
  background: rgb(255 255 255 / 0.74);
  box-shadow: 0 18px 36px -28px rgb(15 23 42 / 0.18);
}

.dark .comparison-node-card {
  border-color: rgb(255 255 255 / 0.08);
  background: rgb(18 18 18 / 0.88);
  box-shadow: 0 18px 36px -28px rgb(0 0 0 / 0.6);
}

.comparison-center {
  border: 1px solid hsl(var(--primary-h) var(--primary-s) var(--primary-l) / 0.18);
  background: rgb(15 23 42 / 0.03);
  box-shadow: 0 22px 42px -30px rgb(15 23 42 / 0.16);
}

.dark .comparison-center {
  background: rgb(255 255 255 / 0.03);
  box-shadow: 0 22px 42px -30px rgb(0 0 0 / 0.66);
}

.comparison-center-icon {
  background: rgb(255 255 255 / 0.82);
}

.dark .comparison-center-icon {
  background: rgb(18 18 18 / 0.92);
}

.comparison-progress-track {
  background: rgb(15 23 42 / 0.08);
}

.dark .comparison-progress-track {
  background: rgb(255 255 255 / 0.08);
}

.comparison-progress {
  transform-origin: left center;
  background: hsl(var(--primary-h) var(--primary-s) var(--primary-l));
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

@media (prefers-reduced-motion: reduce) {
  .comparison-status-enter-active,
  .comparison-status-leave-active {
    transition-duration: 1ms;
  }
}
</style>
