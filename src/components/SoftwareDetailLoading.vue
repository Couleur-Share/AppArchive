<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div
      class="absolute inset-0 app-modal-backdrop"
      @click="handleClose"
    ></div>
    <div class="relative w-[92vw] sm:w-[90vw] sm:max-w-[640px] rounded-xl app-modal-panel app-modal-panel--interactive shadow-2xl ring-1 ring-gray-900/5">
      <div class="p-6 sm:p-8">
        <div class="flex items-center gap-4">
      <div class="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <div class="min-w-0">
            <div class="text-base font-semibold text-gray-900 dark:text-white truncate">
              正在打开详情
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
              {{ software?.name || '请稍候...' }}
            </div>
          </div>
        </div>
        <div class="mt-5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div class="h-full w-1/3 animate-pulse rounded-full bg-primary/70"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Software } from '../types'

const props = defineProps<{
  isOpen: boolean
  software: Software
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const handleClose = () => {
  emit('update:isOpen', false)
}
</script>
