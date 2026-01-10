<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[60] flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>

    <!-- 背景粒子容器 -->
    <div ref="particleContainer" class="absolute inset-0 overflow-hidden pointer-events-none"></div>

    <!-- 主要内容 -->
    <div class="relative flex flex-col items-center px-4">
      <!-- Logo 动画区域 -->
      <div class="relative w-32 h-32 mb-8">
        <!-- 装饰圆环 -->
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle 
            ref="outerRing"
            cx="50" cy="50" r="48" 
            fill="none" stroke="#10B981" stroke-width="1" stroke-opacity="0.2"
            stroke-dasharray="10 10"
          />
          <circle 
            ref="innerRing"
            cx="50" cy="50" r="40" 
            fill="none" stroke="#10B981" stroke-width="0.5" stroke-opacity="0.4"
          />
        </svg>

        <!-- 中心 Logo -->
        <div
          ref="centerLogo"
          class="absolute inset-8 bg-gray-900 rounded-2xl flex items-center justify-center shadow-2xl border border-emerald-500/20 z-10"
        >
          <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>

        <!-- 扫描线 -->
        <div 
          ref="scanner"
          class="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent z-0 opacity-0"
        ></div>
      </div>

      <!-- 标题 -->
      <div class="text-center mb-8 h-16">
        <h2 class="text-2xl font-bold text-white mb-2 tracking-wider">
          SOFTWARE<span class="text-emerald-500">LIST</span>
        </h2>
        <p
          ref="statusText"
          class="text-sm font-mono text-emerald-400/80"
        >
          INITIALIZING_SYSTEM...
        </p>
      </div>

      <!-- 进度条 -->
      <div class="w-64 relative h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          ref="progressBar"
          class="absolute inset-y-0 left-0 w-0 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        ></div>
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

const particleContainer = ref<HTMLElement | null>(null)
const outerRing = ref<SVGElement | null>(null)
const innerRing = ref<SVGElement | null>(null)
const centerLogo = ref<HTMLElement | null>(null)
const scanner = ref<HTMLElement | null>(null)
const statusText = ref<HTMLElement | null>(null)
const progressBar = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null

const initParticles = () => {
  if (!particleContainer.value) return
  
  // 清除旧粒子
  particleContainer.value.innerHTML = ''
  
  // 创建新粒子
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div')
    p.className = 'absolute bg-emerald-500 rounded-full opacity-0'
    const size = Math.random() * 3 + 1
    p.style.width = `${size}px`
    p.style.height = `${size}px`
    p.style.left = `${Math.random() * 100}%`
    p.style.top = `${Math.random() * 100}%`
    particleContainer.value.appendChild(p)
    
    gsap.to(p, {
      y: -100 - Math.random() * 100,
      opacity: Math.random() * 0.5,
      duration: 2 + Math.random() * 3,
      repeat: -1,
      ease: 'none',
      delay: Math.random() * 2
    })
  }
}

const startAnimations = async () => {
  await nextTick()
  
  // 使用 gsap.context 自动管理清理
  ctx = gsap.context(() => {
    const tl = gsap.timeline()
    
    // 0. 初始化状态
    gsap.set([outerRing.value, innerRing.value], { 
      transformOrigin: 'center center',
      opacity: 0,
      scale: 0.8 
    })
    gsap.set(centerLogo.value, { 
      scale: 0, 
      rotation: -45,
      opacity: 0 
    })
    
    // 1. 核心入场序列
    tl.to(centerLogo.value, {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out(1.7)'
    })
    .to([outerRing.value, innerRing.value], {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out'
    }, '-=0.4')
    
    // 2. 持续循环动画
    // 外环旋转
    gsap.to(outerRing.value, {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: 'none'
    })
    // 内环反向旋转
    gsap.to(innerRing.value, {
      rotation: -360,
      duration: 15,
      repeat: -1,
      ease: 'none'
    })
    // 扫描线效果
    gsap.to(scanner.value, {
      top: '100%',
      opacity: 0.5,
      duration: 2,
      repeat: -1,
      ease: 'power1.inOut',
      yoyo: true
    })
    
    // 3. 文字打字机效果
    const messages = ['LOADING_ASSETS...', 'CONNECTING_DB...', 'RENDERING_UI...', 'ALMOST_READY...']
    const textTl = gsap.timeline({ repeat: -1 })
    
    messages.forEach(msg => {
      textTl.to(statusText.value, {
        duration: 1,
        text: {
          value: msg,
          delimiter: "" 
        },
        ease: "none"
      })
      .to({}, { duration: 0.5 }) // 停顿
    })

    // 4. 进度条加载
    gsap.to(progressBar.value, {
      width: '100%',
      duration: 3.5,
      ease: 'expo.inOut',
      repeat: -1,
      yoyo: true // 让它更有动感，满了之后会缩回去再加载
    })

    // 初始化背景粒子
    initParticles()
    
  })
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      startAnimations()
    } else {
      ctx?.revert() // 清理所有动画
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  ctx?.revert()
})
</script>