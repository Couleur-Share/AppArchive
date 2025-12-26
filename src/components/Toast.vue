<template>
  <TransitionRoot appear :show="show">
    <div class="fixed bottom-4 right-4 z-[100]">
      <TransitionChild
        enter="transform ease-out duration-100 transition"
        enter-from="translate-y-1 opacity-0 sm:translate-y-0 sm:translate-x-1"
        enter-to="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-level2 flex items-center gap-2">
          <Check class="w-4 h-4 text-green-400" />
          <span class="text-sm">{{ message }}</span>
        </div>
      </TransitionChild>
    </div>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { TransitionRoot, TransitionChild } from '@headlessui/vue'
import { Check } from 'lucide-vue-next'

defineProps<{
  show: boolean
  message: string
}>()
</script> 