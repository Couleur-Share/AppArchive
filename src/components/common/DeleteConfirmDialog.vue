<template>
  <TransitionRoot appear :show="show" as="Fragment">
    <Dialog as="div" class="relative z-50" @close="$emit('update:show', false)">
      <TransitionChild>
        <div class="fixed inset-0 bg-black/50"
             v-gsap="{ duration: 0.18, to: { duration: 0.18, ease: 'power1.out' } }" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild>
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur p-6 text-left shadow-level3 will-change-transform will-change-opacity w-full max-w-md"
              v-gsap="{ y: 12, duration: 0.28, ease: 'power2.out', to: { y: 0, duration: 0.28, ease: 'power2.out' } }"
            >
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
              >
                确认删除
              </DialogTitle>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  确定要删除 "{{ itemName }}" 吗？此操作无法撤销。
                </p>
              </div>
              <div class="mt-4 flex justify-end space-x-3">
                <BaseButton size="sm" variant="secondary" :disabled="isDeleting" @click="$emit('update:show', false)">取消</BaseButton>
                <BaseButton size="sm" variant="danger" :loading="isDeleting" @click="$emit('confirm')">删除</BaseButton>
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
import { Loader2 } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'

defineProps<{
  show: boolean
  itemName?: string
  isDeleting: boolean
}>()

defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
}>()
</script> 