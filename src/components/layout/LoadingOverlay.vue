<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden px-6"
    >
      <div class="absolute inset-0 loading-overlay-backdrop"></div>

      <div class="relative z-10 w-full max-w-md">
        <div class="loading-panel rounded-[24px] border px-6 py-7 sm:px-7">
          <div class="flex items-start gap-4">
            <div class="loading-indicator flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20">
              <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 4.5V10h5L11 19.5V14H6l7-9.5Z" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                System Load
              </p>
              <h3 class="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {{ title }}
              </h3>
              <div class="mt-3 h-6 overflow-hidden">
                <transition name="slide-up" mode="out-in">
                  <p :key="currentMessage" class="text-sm text-slate-600 dark:text-slate-300">
                    {{ currentMessage }}
                  </p>
                </transition>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <div class="loading-progress-track h-1.5 overflow-hidden rounded-full">
              <div ref="progressBar" class="loading-progress h-full w-0 rounded-full"></div>
            </div>
            <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">
              首次加载可能需要较长时间
            </p>
          </div>
        </div>
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

<style>
.loading-overlay-backdrop {
  background: rgb(18 18 18 / 0.36);
  backdrop-filter: blur(6px);
}

.dark .loading-overlay-backdrop {
  background: rgb(0 0 0 / 0.76);
}

.loading-panel {
  background: linear-gradient(180deg, rgb(248 250 248 / 0.98), rgb(241 244 241 / 0.98));
  border-color: rgb(15 23 42 / 0.08);
  box-shadow: 0 28px 64px -30px rgb(15 23 42 / 0.28);
}

.dark .loading-panel {
  background: linear-gradient(180deg, rgb(31 31 31 / 0.98), rgb(24 24 24 / 0.98));
  border-color: rgb(255 255 255 / 0.08);
  box-shadow: 0 28px 64px -28px rgb(0 0 0 / 0.78);
}

.loading-indicator {
  background: rgb(255 255 255 / 0.82);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.46),
    0 14px 28px -24px rgb(15 23 42 / 0.22);
}

.dark .loading-indicator {
  background: rgb(18 18 18 / 0.92);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    0 18px 32px -26px rgb(0 0 0 / 0.7);
}

.loading-progress-track {
  background: rgb(15 23 42 / 0.08);
}

.dark .loading-progress-track {
  background: rgb(255 255 255 / 0.08);
}

.loading-progress {
  background: hsl(var(--primary-h) var(--primary-s) var(--primary-l));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
