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
      class="rounded-xl border p-4 flex items-center gap-3 min-w-[300px] backdrop-blur-md shadow-level2"
      :class="{
        'bg-white/95 border-primary/20 dark:bg-[#181818]/95 dark:border-primary/24': toast.type === 'success',
        'bg-white/95 border-red-500/20 dark:bg-[#181818]/95 dark:border-red-500/24': toast.type === 'error',
        'bg-white/95 border-[#539df5]/20 dark:bg-[#181818]/95 dark:border-[#539df5]/24': toast.type === 'info',
      }"
    >
      <component
        :is="getToastIcon(toast.type)"
        class="h-5 w-5"
        :class="{
          'text-primary': toast.type === 'success',
          'text-red-500': toast.type === 'error',
          'text-[#539df5]': toast.type === 'info',
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
