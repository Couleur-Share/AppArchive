<template>
  <div
    v-if="active"
    class="fixed inset-0 z-[60] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>

    <!-- 动态网格背景 -->
    <div 
      ref="gridBg" 
      class="absolute inset-0 opacity-20"
      style="background-image: radial-gradient(#10B981 1px, transparent 1px); background-size: 30px 30px;"
    ></div>

    <!-- 主要内容 -->
    <div class="relative flex flex-col items-center justify-center w-full max-w-md px-6">
      
      <!-- 核心 AI 动画 -->
      <div class="relative w-40 h-40 mb-10 flex items-center justify-center">
        <!-- 外部数据流环 -->
        <div ref="dataRing" class="absolute inset-0 rounded-full border border-emerald-500/30"></div>
        
        <!-- 旋转片段 -->
        <svg class="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#10B981" stroke-width="2" stroke-dasharray="20 160" stroke-linecap="round" opacity="0.5" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#34D399" stroke-width="1" stroke-dasharray="60 180" stroke-linecap="round" opacity="0.3" />
        </svg>

        <!-- 中心核心 -->
        <div ref="core" class="relative z-10 w-20 h-20 bg-gray-900 rounded-xl flex items-center justify-center border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <div ref="coreIcon" class="text-emerald-400">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <!-- 浮动粒子 -->
        <div ref="particles" class="absolute inset-0 pointer-events-none"></div>
      </div>

      <!-- 状态文字 -->
      <div class="text-center w-full space-y-4">
        <h3 
          ref="titleText"
          class="text-xl font-bold text-white tracking-widest font-mono"
        >
          AI_ANALYSIS_INIT
        </h3>
        
        <!-- 代码流解码效果 -->
        <div class="h-16 flex items-center justify-center">
           <p 
            ref="decodeText" 
            class="text-sm text-emerald-400/80 font-mono h-full flex flex-col items-center justify-center gap-1"
          >
            <span>Wait...</span>
          </p>
        </div>
      </div>

      <!-- 进度指示器 -->
      <div class="w-full mt-6 bg-gray-800/50 h-1 rounded-full overflow-hidden">
        <div ref="progressBar" class="h-full bg-emerald-500 w-0"></div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ active: boolean }>()

const gridBg = ref<HTMLElement | null>(null)
const dataRing = ref<HTMLElement | null>(null)
const core = ref<HTMLElement | null>(null)
const coreIcon = ref<HTMLElement | null>(null)
const particles = ref<HTMLElement | null>(null)
const titleText = ref<HTMLElement | null>(null)
const decodeText = ref<HTMLElement | null>(null)
const progressBar = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null

const startAnimations = async () => {
  await nextTick()
  
  ctx = gsap.context(() => {
    // 0. 初始化
    gsap.set(gridBg.value, { scale: 1.2, opacity: 0 })
    gsap.set(core.value, { scale: 0, rotation: 180 })
    gsap.set(dataRing.value, { scale: 0.8, opacity: 0 })
    
    // 1. 入场
    const tl = gsap.timeline()
    
    tl.to(gridBg.value, { opacity: 0.15, duration: 1 })
      .to(core.value, { 
        scale: 1, 
        rotation: 0, 
        duration: 0.8, 
        ease: 'elastic.out(1, 0.5)' 
      }, '-=0.5')
      .to(dataRing.value, {
        scale: 1,
        opacity: 1,
        duration: 0.5
      }, '-=0.4')

    // 2. 核心呼吸与脉冲
    gsap.to(coreIcon.value, {
      scale: 1.2,
      opacity: 0.8,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    })
    
    gsap.to(dataRing.value, {
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
      duration: 1,
      yoyo: true,
      repeat: -1
    })

    // 3. 文字解码特效 (模拟黑客帝国效果)
    const messages = [
      "SCANNING_SOFTWARE_ARCH...",
      "EXTRACTING_FEATURES...",
      "IDENTIFYING_PROS_CONS...",
      "GENERATING_INSIGHTS..."
    ]
    
    const textTl = gsap.timeline({ repeat: -1 })
    messages.forEach(msg => {
      // 使用 TextPlugin 的标准打字机效果 (免费)
      textTl.to(decodeText.value, {
        duration: 1,
        text: {
          value: msg,
          delimiter: ""
        },
        ease: "none"
      })
      .to({}, { duration: 1.5 }) // 停留
      .to(decodeText.value, {
        duration: 0.5,
        text: {
          value: "", // 清空
          delimiter: ""
        },
        ease: "none"
      })
    })

    // 4. 标题Glitch效果
    const glitchTl = gsap.timeline({ repeat: -1, repeatDelay: 3 })
    glitchTl.to(titleText.value, { skewX: 20, duration: 0.1, color: '#34D399' })
            .to(titleText.value, { skewX: -20, duration: 0.1, color: '#F87171' })
            .to(titleText.value, { skewX: 0, duration: 0.1, color: '#fff' })

    // 5. 进度条
    gsap.to(progressBar.value, {
      width: '100%',
      duration: 8, // 假设分析大概8秒
      ease: 'power1.inOut'
    })
    
    // 背景网格移动
    gsap.to(gridBg.value, {
      backgroundPosition: '30px 30px',
      duration: 2,
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
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>