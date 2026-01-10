<template>
  <div
    v-if="active"
    class="fixed inset-0 z-[100] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-md"></div>

    <!-- 背景网格 -->
    <div 
      ref="gridBg" 
      class="absolute inset-0 opacity-10 pointer-events-none"
      style="background-image: linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px); background-size: 40px 40px;"
    ></div>

    <!-- 主要内容 -->
    <div class="relative flex flex-col items-center justify-center w-full max-w-lg px-6">
      
      <!-- 核心对比动画区域 -->
      <div class="relative w-full h-48 mb-8 flex items-center justify-center">
        <!-- 左侧数据源 -->
        <div ref="leftNode" class="absolute left-4 sm:left-10 flex flex-col items-center gap-2">
          <div class="w-16 h-20 bg-gray-900 border border-emerald-500/30 rounded-lg flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <svg class="w-8 h-8 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <!-- 扫描线 -->
            <div class="absolute inset-x-0 h-1 bg-emerald-400/50 top-0 animate-scan"></div>
          </div>
          <div class="text-xs font-mono text-emerald-500/50">SRC_A</div>
        </div>

        <!-- 右侧数据源 -->
        <div ref="rightNode" class="absolute right-4 sm:right-10 flex flex-col items-center gap-2">
          <div class="w-16 h-20 bg-gray-900 border border-emerald-500/30 rounded-lg flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <svg class="w-8 h-8 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <!-- 扫描线 -->
            <div class="absolute inset-x-0 h-1 bg-emerald-400/50 top-0 animate-scan" style="animation-delay: 0.5s"></div>
          </div>
          <div class="text-xs font-mono text-emerald-500/50">SRC_B</div>
        </div>

        <!-- 中间处理核心 -->
        <div ref="centerNode" class="relative z-10">
          <!-- 旋转外环 -->
          <div class="absolute inset-[-10px] border border-dashed border-emerald-500/20 rounded-full animate-spin-slow"></div>
          <!-- 核心 -->
          <div class="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <span class="text-2xl font-black text-emerald-400 tracking-tighter">VS</span>
          </div>
        </div>

        <!-- 数据传输线 (SVG) -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <!-- 左侧线路 -->
          <path class="path-left" d="M80 96 L 150 96" stroke="#10B981" stroke-width="2" stroke-opacity="0.2" fill="none" />
          <circle r="3" fill="#34D399">
            <animateMotion dur="1.5s" repeatCount="indefinite" path="M80 96 L 190 96" />
          </circle>

          <!-- 右侧线路 -->
          <path class="path-right" d="M320 96 L 250 96" stroke="#10B981" stroke-width="2" stroke-opacity="0.2" fill="none" />
          <circle r="3" fill="#34D399">
            <animateMotion dur="1.5s" repeatCount="indefinite" path="M320 96 L 210 96" />
          </circle>
        </svg>
      </div>

      <!-- 状态文字 -->
      <div class="text-center w-full space-y-4">
        <h3 
          ref="titleText"
          class="text-xl font-bold text-white tracking-widest font-mono"
        >
          COMPARING_DATA
        </h3>
        
        <!-- 代码流解码效果 -->
        <div class="h-12 flex items-center justify-center">
           <p 
            ref="decodeText" 
            class="text-sm text-emerald-400/80 font-mono"
          >
            Initializing...
          </p>
        </div>
      </div>

      <!-- 底部进度条 -->
      <div class="w-full mt-8 max-w-sm relative">
        <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div ref="progressBar" class="h-full bg-emerald-500 w-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
        <!-- 步骤点 -->
        <div class="flex justify-between mt-2 px-1">
          <div ref="step1" class="w-1.5 h-1.5 rounded-full bg-gray-700 transition-colors duration-300"></div>
          <div ref="step2" class="w-1.5 h-1.5 rounded-full bg-gray-700 transition-colors duration-300"></div>
          <div ref="step3" class="w-1.5 h-1.5 rounded-full bg-gray-700 transition-colors duration-300"></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ active: boolean }>()

const gridBg = ref<HTMLElement | null>(null)
const leftNode = ref<HTMLElement | null>(null)
const rightNode = ref<HTMLElement | null>(null)
const centerNode = ref<HTMLElement | null>(null)
const titleText = ref<HTMLElement | null>(null)
const decodeText = ref<HTMLElement | null>(null)
const progressBar = ref<HTMLElement | null>(null)
const step1 = ref<HTMLElement | null>(null)
const step2 = ref<HTMLElement | null>(null)
const step3 = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null

const startAnimations = async () => {
  await nextTick()
  
  ctx = gsap.context(() => {
    // 0. 初始化
    gsap.set([leftNode.value, rightNode.value], { x: (i) => i === 0 ? -20 : 20, opacity: 0 })
    gsap.set(centerNode.value, { scale: 0, rotation: -90 })
    gsap.set(gridBg.value, { opacity: 0 })

    const tl = gsap.timeline()

    // 1. 入场序列
    tl.to(gridBg.value, { opacity: 0.1, duration: 1 })
      .to(centerNode.value, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.5)' }, '-=0.5')
      .to([leftNode.value, rightNode.value], { x: 0, opacity: 1, duration: 0.5, stagger: 0.2 }, '-=0.3')

    // 2. 循环动画
    // 核心脉冲
    gsap.to(centerNode.value, {
      boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
      scale: 1.05,
      duration: 0.8,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    })

    // 3. 文字打字机效果
    const messages = [
      "LOADING_SPECS...",
      "ANALYZING_DIFF...",
      "GENERATING_REPORT..."
    ]
    const textTl = gsap.timeline({ repeat: -1 })
    
    messages.forEach((msg, index) => {
      // 切换文字
      textTl.to(decodeText.value, {
        duration: 0.8,
        text: { value: msg, delimiter: "" },
        ease: "none",
        onStart: () => {
          // 同步点亮步骤灯
          const steps = [step1.value, step2.value, step3.value]
          if (steps[index]) {
            gsap.to(steps[index], { backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' })
          }
        }
      })
      .to({}, { duration: 1.2 }) // 停留
      .to(decodeText.value, {
        duration: 0.4,
        text: { value: "", delimiter: "" },
        ease: "none"
      })
    })

    // 4. 进度条
    gsap.to(progressBar.value, {
      width: '100%',
      duration: 6, // 总时长
      ease: 'power1.inOut'
    })

    // 背景移动
    gsap.to(gridBg.value, {
      backgroundPosition: '40px 0px',
      duration: 3,
      repeat: -1,
      ease: 'none'
    })

  })
}

watch(
  () => props.active,
  (v) => {
    if (v) {
      startAnimations()
    } else {
      ctx?.revert()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  ctx?.revert()
})
</script>

<style scoped>
.animate-scan {
  animation: scan 2s linear infinite;
  background: linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.5), transparent);
}
@keyframes scan {
  0% { top: -100%; }
  100% { top: 200%; }
}
.animate-spin-slow {
  animation: spin 10s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>