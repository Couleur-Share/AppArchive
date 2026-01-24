<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
    >
      <!-- 背景遮罩 (适配深色/浅色模式) -->
      <div class="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl transition-colors duration-300"></div>

      <!-- 动态背景光晕 -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-30">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" style="animation-delay: 2s"></div>
      </div>

      <!-- 主要内容 -->
      <div class="relative flex flex-col items-center justify-center w-full max-w-md px-6 z-10">
        
        <!-- 核心动画区域 -->
        <div class="relative w-32 h-32 mb-10 flex items-center justify-center">
           <!-- 外环 1 -->
           <div class="absolute inset-0 rounded-full border border-primary/30 border-t-primary border-r-transparent animate-spin-slow"></div>
           <!-- 外环 2 -->
           <div class="absolute inset-2 rounded-full border border-primary/30 border-b-primary border-l-transparent animate-reverse-spin"></div>
           
           <!-- 核心球体 -->
           <div class="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-center relative overflow-hidden group">
              <svg class="w-8 h-8 text-primary animate-pulse group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <!-- 扫描光效 -->
              <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent -translate-y-full animate-scan-fast"></div>
           </div>
        </div>

        <!-- 状态文字 -->
        <div class="text-center w-full space-y-4">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ title }}
          </h3>
          
          <!-- 动态处理文本 -->
          <div class="h-6 flex items-center justify-center overflow-hidden">
             <div class="relative">
               <transition name="slide-up" mode="out-in">
                  <p :key="currentMessage" class="text-primary font-mono text-sm flex items-center gap-2">
                    <span class="animate-pulse">></span>
                    {{ currentMessage }}
                  </p>
               </transition>
             </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="w-full mt-8 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div ref="progressBar" class="h-full bg-primary w-0 shadow-[0_0_10px_hsla(var(--primary-h),var(--primary-s),var(--primary-l),0.3)] relative">
            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[2px]"></div>
          </div>
        </div>

        <!-- 底部提示 -->
        <p class="mt-4 text-xs text-gray-400 dark:text-gray-500 font-light">
          首次加载可能需要较长时间
        </p>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const progressBar = ref<HTMLElement | null>(null)
const currentMessage = ref("正在连接服务器...")
const title = ref("AppArchive")

let ctx: gsap.Context | null = null
let messageInterval: any = null

const messages = [
  "正在加载资源...",
  "验证用户身份...",
  "同步数据配置...",
  "准备用户界面...",
  "即将完成..."
]

const startAnimations = async () => {
  await nextTick()
  
  // 重置状态
  currentMessage.value = "正在连接服务器..."
  
  ctx = gsap.context(() => {
    // 进度条动画
    gsap.fromTo(progressBar.value, 
      { width: '0%' },
      {
        width: '90%', // 预留10%给真实完成
        duration: 2.5,
        ease: 'power2.inOut',
      }
    )

    // 消息循环
    let msgIndex = 0
    messageInterval = setInterval(() => {
      if (msgIndex < messages.length) {
        currentMessage.value = messages[msgIndex]
        msgIndex++
      }
    }, 800)
  })
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      startAnimations()
    } else {
      // 完成动画
      if (progressBar.value) {
        gsap.to(progressBar.value, {
          width: '100%',
          duration: 0.3,
          onComplete: () => {
            ctx?.revert()
            if (messageInterval) clearInterval(messageInterval)
          }
        })
      } else {
        ctx?.revert()
        if (messageInterval) clearInterval(messageInterval)
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  ctx?.revert()
  if (messageInterval) clearInterval(messageInterval)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
