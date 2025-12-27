<template>
  <TransitionGroup
    tag="div"
    class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
    enter-active-class="animate__animated animate__fadeInRight"
    leave-active-class="animate__animated animate__fadeOutRight"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-level2 p-4 flex items-center gap-3 min-w-[300px]"
      :class="{
        'border-l-4 border-green-500': toast.type === 'success',
        'border-l-4 border-red-500': toast.type === 'error',
        'border-l-4 border-blue-500': toast.type === 'info',
      }"
    >
      <component
        :is="getToastIcon(toast.type)"
        class="h-5 w-5"
        :class="{
          'text-green-500': toast.type === 'success',
          'text-red-500': toast.type === 'error',
          'text-blue-500': toast.type === 'info',
        }"
      />
      <span>{{ toast.message }}</span>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { CheckCircle, Info, XCircle } from 'lucide-vue-next'
import { TransitionGroup } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

defineProps<{
  toasts: Toast[]
}>()

const getToastIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'info':
      return Info
  }
}
</script> 