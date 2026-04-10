<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" :initialFocus="closeButtonRef" @close="close">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 app-modal-backdrop" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
            @after-enter="onAfterEnter"
          >
            <DialogPanel 
              class="relative transform overflow-hidden rounded-2xl 
                     app-modal-panel app-modal-panel--interactive
                     text-left shadow-2xl transition-all
                     w-[min(900px,94vw)] max-h-[min(88dvh,920px)] border border-gray-200/50 dark:border-gray-700/50"
            >
              <!-- 标题栏 -->
              <div class="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <DialogTitle as="h3" class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span class="text-emerald-500">VS</span>
                  {{ software.category }} 软件深度对比
                </DialogTitle>
                <button
                  ref="closeButtonRef"
                  type="button"
                  @click="close"
                  class="p-2 rounded-lg transition-colors duration-200 
                         text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 
                         hover:text-gray-900 dark:hover:text-white app-modal-close-btn"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- 比较内容 -->
              <div class="p-6 overflow-y-auto custom-scrollbar max-h-[calc(85vh-80px)]">
                <!-- 软件卡片列表 (GSAP 动画容器) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" ref="cardContainer">
                  <div 
                    v-for="(sw, index) in similarSoftwares" 
                    :key="sw.id"
                    class="compare-card relative bg-white dark:bg-gray-800 rounded-xl p-5 
                           border border-gray-100 dark:border-gray-700 shadow-sm
                           hover:shadow-md transition-shadow duration-300 opacity-0 translate-y-4"
                  >
                    <!-- 头部信息 -->
                    <div class="flex items-center gap-4 mb-6">
                      <div class="relative group">
                        <div class="absolute inset-0 bg-emerald-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <img 
                          :src="getIconUrl(sw.icon)" 
                          :alt="sw.name" 
                          class="relative w-14 h-14 rounded-xl shadow-sm bg-white dark:bg-gray-700 object-contain p-1" 
                          loading="lazy"
                          referrerpolicy="origin"
                        >
                      </div>
                      <div>
                        <h4 class="font-bold text-lg text-gray-900 dark:text-white leading-tight mb-1">{{ sw.name }}</h4>
                        <TagBadge size="xs" :variant="getLicenseVariant(sw.license)">
                          {{ sw.license }}
                        </TagBadge>
                      </div>
                    </div>
                    
                    <!-- 优点列表 -->
                    <div class="mb-5">
                      <h5 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <ThumbsUp class="w-4 h-4 text-emerald-500" />
                        核心优势
                      </h5>
                      <ul class="space-y-2">
                        <li v-for="(pro, idx) in sw.pros" :key="idx"
                          class="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300 group">
                          <Check class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span class="leading-relaxed">{{ pro }}</span>
                        </li>
                      </ul>
                    </div>

                    <!-- 缺点列表 -->
                    <div>
                      <h5 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <ThumbsDown class="w-4 h-4 text-red-500" />
                        不足之处
                      </h5>
                      <ul class="space-y-2">
                        <li v-for="(con, idx) in sw.cons" :key="idx"
                          class="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300 group">
                          <Minus class="w-4 h-4 text-red-500 mt-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span class="leading-relaxed">{{ con }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { gsap } from 'gsap'
import { Check, Minus, ThumbsDown, ThumbsUp, X } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import { getIconUrl } from '../services/localIconCache'
import type { Software } from '../types'
import { getLicenseTagVariant as getLicenseVariant } from '../utils/license'
import TagBadge from './common/TagBadge.vue'

const props = defineProps<{
  isOpen: boolean
  software: Software
  similarSoftwares: Software[]
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const cardContainer = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLElement | null>(null)
const previousFocusedElement = ref<HTMLElement | null>(null)

const close = () => {
  emit('update:isOpen', false)
}

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      previousFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      closeButtonRef.value?.focus()
      return
    }
    const restoreTarget = previousFocusedElement.value
    if (restoreTarget) {
      nextTick(() => restoreTarget.focus())
    }
  }
)

// 弹窗打开且 Transition 完成后触发
const onAfterEnter = () => {
  if (!cardContainer.value) return

  const cards = cardContainer.value.querySelectorAll('.compare-card')
  
  // 重置状态（防止 Transition 造成的样式残留影响）
  gsap.set(cards, { opacity: 0, y: 30 })

  // 执行入场动画
  gsap.to(cards, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.15, // 每个卡片间隔 0.15s
    ease: 'power3.out', // 平滑减速，避免回弹造成晃动
    clearProps: 'all' // 动画结束后清除 inline style，避免干扰 hover 效果
  })
}

// 监听关闭时不需要特殊处理，TransitionRoot 会处理离场
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>