<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="$emit('update:isOpen', false)">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel 
              class="relative transform overflow-hidden rounded-xl 
                     bg-white/60 dark:bg-gray-800/70 backdrop-blur-xl 
                     text-left shadow-xl transition-all
                     w-[900px] max-h-[80vh]"
            >
              <!-- 标题栏 -->
              <div class="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-600/30">
                <DialogTitle as="h3" class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ software.category }} 软件比较
                </DialogTitle>
                <button
                  @click="$emit('update:isOpen', false)"
                  class="p-2 rounded-lg transition-all duration-200 
                         text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-700 
                         hover:text-gray-900 dark:hover:text-white
                         focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  title="关闭"
                  aria-label="关闭"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- 比较内容 -->
              <div class="p-6 overflow-y-auto">
                <!-- 软件卡片列表 -->
                <div class="grid grid-cols-3 gap-6 mb-8">
                  <div v-for="sw in similarSoftwares" :key="sw.id"
                    class="relative bg-white/40 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/30">
                    <div class="flex items-center gap-3 mb-4">
                      <img :src="getIconUrl(sw.icon)" :alt="sw.name" class="w-12 h-12 rounded-lg" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                      <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white">{{ sw.name }}</h4>
                        <p class="text-sm text-gray-500">{{ sw.license }}</p>
                      </div>
                    </div>
                    
                    <!-- 优点列表 -->
                    <div class="mb-4">
                      <h5 class="text-sm font-medium text-green-600 dark:text-green-400 mb-2">优点</h5>
                      <ul class="space-y-1">
                        <li v-for="(pro, idx) in sw.pros" :key="idx"
                          class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle2 class="w-4 h-4 text-green-500 mt-0.5" />
                          {{ pro }}
                        </li>
                      </ul>
                    </div>

                    <!-- 缺点列表 -->
                    <div class="mb-4">
                      <h5 class="text-sm font-medium text-red-600 dark:text-red-400 mb-2">缺点</h5>
                      <ul class="space-y-1">
                        <li v-for="(con, idx) in sw.cons" :key="idx"
                          class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <XCircle class="w-4 h-4 text-red-500 mt-0.5" />
                          {{ con }}
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
import { CheckCircle2, X, XCircle } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'
import { getIconUrl } from '../services/localIconCache'
import type { Software } from '../types'

const props = defineProps<{
  isOpen: boolean
  software: Software
  similarSoftwares: Software[]
}>()

defineEmits<{
  'update:isOpen': [value: boolean]
}>()
</script> 