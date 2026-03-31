<template>
  <div
    v-if="active"
    class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
  >
    <!-- 背景遮罩 (适配深色/浅色模式) -->
    <div class="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl transition-colors duration-300"></div>

    <!-- 动态背景光晕 (使用系统主色) -->
    <div ref="ambientGlow" class="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-30">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" style="animation-delay: 2s"></div>
    </div>

    <!-- 主要内容 -->
    <div ref="overlayContainer" class="relative flex flex-col items-center justify-center w-full max-w-3xl px-6 z-10">
      
      <!-- 核心对比动画区域 -->
      <div ref="animationContainer" class="relative w-full h-64 mb-12 flex items-center justify-center">
        
        <!-- 左侧数据源卡片 -->
        <div ref="leftNode" class="absolute left-4 md:left-20 flex flex-col items-center gap-4 group">
          <div class="w-24 h-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg ring-1 ring-gray-100 dark:ring-gray-800 transition-all duration-300">
             <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
             </div>
             <!-- 扫描光效 -->
             <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent -translate-y-full animate-scan-fast"></div>
          </div>
          <div class="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide">数据源 A</div>
        </div>

        <!-- 右侧数据源卡片 -->
        <div ref="rightNode" class="absolute right-4 md:right-20 flex flex-col items-center gap-4 group">
          <div class="w-24 h-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg ring-1 ring-gray-100 dark:ring-gray-800 transition-all duration-300">
             <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             </div>
             <!-- 扫描光效 -->
             <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent -translate-y-full animate-scan-fast" style="animation-delay: 0.3s"></div>
          </div>
          <div class="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide">数据源 B</div>
        </div>

        <!-- 中间 AI 核心 -->
        <div ref="centerNode" class="relative z-20">
          <!-- 发光背景 -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse-fast"></div>
          
          <!-- 旋转环 -->
          <div class="relative w-32 h-32 flex items-center justify-center">
             <!-- 外环 1 -->
             <div class="absolute inset-0 rounded-full border border-primary/30 border-t-primary border-r-transparent animate-spin-slow"></div>
             <!-- 外环 2 -->
             <div class="absolute inset-2 rounded-full border border-primary/30 border-b-primary border-l-transparent animate-reverse-spin"></div>
             
             <!-- 核心球体 -->
            <div class="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-center relative overflow-hidden">
               <svg class="w-8 h-8 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
         </div>
       </div>

        <!-- 连接线 (SVG) -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(var(--primary-h), var(--primary-s), var(--primary-l), 0)" />
              <stop offset="50%" stop-color="rgba(var(--primary-h), var(--primary-s), var(--primary-l), 0.3)" />
              <stop offset="100%" stop-color="rgba(var(--primary-h), var(--primary-s), var(--primary-l), 0.8)" />
            </linearGradient>
            <linearGradient id="lineGradientCorrected" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0)" />
              <stop offset="50%" stop-color="hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.3)" />
              <stop offset="100%" stop-color="hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.8)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- 左侧流光 (隐形路径，仅用于计算) -->
          <path ref="leftPathRef" class="path-left" d="" stroke="none" fill="none" />
          
          <!-- 动态闪电 (左侧) -->
          <g filter="url(#glow)">
            <path :d="lightningState.left.main" class="stroke-primary fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path :d="lightningState.left.branch" class="stroke-primary/70 fill-none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
          </g>

          <!-- 右侧流光 (隐形路径，仅用于计算) -->
          <path ref="rightPathRef" class="path-right" d="" stroke="none" fill="none" />
          
          <!-- 动态闪电 (右侧) -->
          <g filter="url(#glow)">
             <path :d="lightningState.right.main" class="stroke-primary fill-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
             <path :d="lightningState.right.branch" class="stroke-primary/70 fill-none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
          </g>

        </svg>
      </div>

      <!-- 状态文字 -->
      <div class="text-center w-full space-y-6">
        <div class="flex flex-col items-center">
          <h3 
            ref="titleText"
            class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2"
          >
            智能分析中
          </h3>
          <p ref="subTitle" class="text-gray-500 dark:text-gray-400 text-sm md:text-base font-light">
            正在进行多维数据深度对比...
          </p>
        </div>
        
        <!-- 动态处理文本 -->
        <div class="h-8 flex items-center justify-center overflow-hidden">
           <div class="relative">
             <transition name="slide-up" mode="out-in">
                <p :key="currentMessage" class="text-primary font-mono text-sm">
                  > {{ currentMessage }}
                </p>
             </transition>
           </div>
        </div>
      </div>

      <!-- 底部进度条 -->
      <div class="w-full mt-10 max-w-md relative px-4">
        <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div ref="progressBar" class="h-full bg-primary w-0 shadow-[0_0_10px_rgba(var(--primary),0.3)] relative">
            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[2px]"></div>
          </div>
        </div>
        
        <!-- 步骤指示器 -->
        <div class="flex justify-between mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
           <span :class="{ 'text-primary transition-colors duration-300': progress > 10 }">解析数据</span>
           <span :class="{ 'text-primary transition-colors duration-300': progress > 50 }">提取特征</span>
           <span :class="{ 'text-primary transition-colors duration-300': progress > 85 }">生成报告</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, ref, watch, onUnmounted } from 'vue'

// TextPlugin 已在 plugins/gsap.ts 中全局注册，无需重复注册

const props = defineProps<{ active: boolean }>()

const leftNode = ref<HTMLElement | null>(null)
const rightNode = ref<HTMLElement | null>(null)
const centerNode = ref<HTMLElement | null>(null)
const titleText = ref<HTMLElement | null>(null)
const subTitle = ref<HTMLElement | null>(null)
const progressBar = ref<HTMLElement | null>(null)
const currentMessage = ref("初始化...")
const progress = ref(0)
const overlayContainer = ref<HTMLElement | null>(null)
const animationContainer = ref<HTMLElement | null>(null)

const leftPathRef = ref<SVGPathElement | null>(null)
const rightPathRef = ref<SVGPathElement | null>(null)
const lightningState = ref<{ left: { main: string, branch: string }, right: { main: string, branch: string } }>({
  left: { main: '', branch: '' },
  right: { main: '', branch: '' }
})

let ctx: gsap.Context | null = null
let messageInterval: any = null
let resizeObserver: ResizeObserver | null = null

const messages = [
  "正在解析软件架构...",
  "正在对比功能特性...",
  "正在分析性能指标...",
  "正在综合优缺点...",
  "正在生成最终见解..."
]

const updatePaths = () => {
  if (!leftNode.value || !rightNode.value || !centerNode.value || !leftPathRef.value || !rightPathRef.value || !animationContainer.value) return

  // 使用 offsetLeft/Top 获取不受 transform 影响的布局坐标
  // 且坐标系直接相对于 animationContainer (父级/OffsetParent)
  const getRelativePos = (el: HTMLElement, anchor: 'right' | 'left' | 'center') => {
    let x = el.offsetLeft
    let y = el.offsetTop + el.offsetHeight / 2
    
    if (anchor === 'right') x += el.offsetWidth
    if (anchor === 'center') x += el.offsetWidth / 2
    
    return { x, y }
  }

  const leftPos = getRelativePos(leftNode.value, 'right')
  const rightPos = getRelativePos(rightNode.value, 'left')
  const centerPos = getRelativePos(centerNode.value, 'center')

  // 更新左侧路径 (起点: 左卡片右侧 -> 终点: 中心左侧)
  // 使用二次贝塞尔曲线，控制点在两者之间略微偏下，产生弧度
  const leftControlX = (leftPos.x + centerPos.x) / 2
  const leftControlY = leftPos.y // 保持水平或者微调
  const leftD = `M ${leftPos.x} ${leftPos.y} C ${leftControlX} ${leftControlY}, ${leftControlX} ${centerPos.y}, ${centerPos.x - 40} ${centerPos.y}`
  leftPathRef.value.setAttribute('d', leftD)

  // 更新右侧路径 (起点: 右卡片左侧 -> 终点: 中心右侧)
  const rightControlX = (rightPos.x + centerPos.x) / 2
  const rightControlY = rightPos.y
  const rightD = `M ${rightPos.x} ${rightPos.y} C ${rightControlX} ${rightControlY}, ${rightControlX} ${centerPos.y}, ${centerPos.x + 40} ${centerPos.y}`
  rightPathRef.value.setAttribute('d', rightD)
}

const generateBolt = (pathEl: SVGPathElement, progress: number) => {
  if (!pathEl) return { main: '', branch: '' }
  const totalLen = pathEl.getTotalLength()
  const boltLen = 80 // 闪电长度
  
  // 计算当前显示范围
  const end = progress * (totalLen + boltLen)
  const start = Math.max(0, end - boltLen)
  const actualEnd = Math.min(totalLen, end)
  
  if (start >= totalLen || end <= 0) return { main: '', branch: '' }
  
  // 生成主路径点
  const segments = 8
  let d = `M ${pathEl.getPointAtLength(start).x} ${pathEl.getPointAtLength(start).y}`
  
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    const currentLen = start + (actualEnd - start) * t
    const point = pathEl.getPointAtLength(currentLen)
    const jitter = (Math.random() - 0.5) * 15 // 增加抖动幅度
    d += ` L ${point.x} ${point.y + jitter}`
  }
  
  // 生成分支 (随机出现)
  let branchD = ''
  if (Math.random() > 0.6) {
     const branchStartLen = start + (actualEnd - start) * 0.5
     const branchStartPoint = pathEl.getPointAtLength(branchStartLen)
     const bx = branchStartPoint.x + (Math.random() - 0.5) * 30
     const by = branchStartPoint.y + (Math.random() - 0.5) * 30
     branchD = `M ${branchStartPoint.x} ${branchStartPoint.y} L ${bx} ${by}`
  }
  
  return { main: d, branch: branchD }
}

const startAnimations = async () => {
  await nextTick()
  
  // 重置状态
  progress.value = 0
  currentMessage.value = "初始化..."
  
  ctx = gsap.context(() => {
    // 0. 初始化状态
    gsap.set([leftNode.value, rightNode.value], { 
      x: (i) => i === 0 ? -50 : 50, 
      opacity: 0,
      scale: 0.9
    })
    gsap.set(centerNode.value, { scale: 0, rotation: -180, opacity: 0 })
    gsap.set([titleText.value, subTitle.value], { y: 20, opacity: 0 })
    gsap.set(progressBar.value, { width: '0%' })

    const tl = gsap.timeline()

    // 1. 核心入场
    tl.to(centerNode.value, { 
      scale: 1, 
      rotation: 0, 
      opacity: 1, 
      duration: 1, 
      ease: 'elastic.out(1, 0.6)' 
    })
    
    // 2. 两侧卡片入场
    .to([leftNode.value, rightNode.value], { 
      x: 0, 
      opacity: 1, 
      scale: 1,
      duration: 0.8, 
      stagger: 0.2,
      ease: 'power3.out' 
    }, '-=0.6')

    // 3. 文字入场
    .to([titleText.value, subTitle.value], {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out'
    }, '-=0.4')

    // 4. 进度条动画
    gsap.to(progressBar.value, {
      width: '100%',
      duration: 5,
      ease: 'power1.inOut',
      onUpdate: function() {
        progress.value = Math.round(this.progress() * 100)
      }
    })

    // 5. 闪电动画循环
    const lightningProgress = { value: 0 }
    
    // 初始化路径
    updatePaths()
    
    // 监听尺寸变化
    if (animationContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        updatePaths()
      })
      resizeObserver.observe(animationContainer.value)
    }

    gsap.to(lightningProgress, {
      value: 1,
      duration: 2,
      repeat: -1,
      ease: "none",
      onUpdate: () => {
        if (leftPathRef.value && rightPathRef.value) {
          // 每次更新都确保路径是最新的 (防止快速 resize 时错位)
          // updatePaths() // 过于频繁，改为 ResizeObserver 触发
          lightningState.value.left = generateBolt(leftPathRef.value, lightningProgress.value)
          lightningState.value.right = generateBolt(rightPathRef.value, lightningProgress.value)
        }
      }
    })

    // 6. 消息循环
    let msgIndex = 0
    messageInterval = setInterval(() => {
      if (msgIndex < messages.length) {
        currentMessage.value = messages[msgIndex]
        msgIndex++
      }
    }, 1000)

  })
}

watch(
  () => props.active,
  (v) => {
    if (v) {
      startAnimations()
    } else {
      ctx?.revert()
      if (messageInterval) clearInterval(messageInterval)
      resizeObserver?.disconnect()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  ctx?.revert()
  if (messageInterval) clearInterval(messageInterval)
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.animate-pulse-fast {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
.animate-reverse-spin {
  animation: spin 6s linear infinite reverse;
}
.animate-scan-fast {
  animation: scan 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(200%); }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>