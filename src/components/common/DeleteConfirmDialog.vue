<template>
  <TransitionRoot appear :show="show" as="Fragment">
    <Dialog
      as="div"
      class="relative z-50"
      :initialFocus="cancelButtonEl"
      @close="$emit('update:show', false)"
    >
      <TransitionChild>
        <div class="fixed inset-0 app-modal-backdrop"
             v-gsap="{ duration: 0.18, to: { duration: 0.18, ease: 'power1.out' } }" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild>
            <DialogPanel
              class="relative transform overflow-hidden rounded-xl app-modal-panel app-modal-panel--interactive p-6 text-left shadow-level3 will-change-transform will-change-opacity w-full max-w-md"
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
                <BaseButton :ref="setCancelButtonRef" size="sm" variant="secondary" :disabled="isDeleting" @click="$emit('update:show', false)">取消</BaseButton>
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
import { nextTick, ref, watch } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  show: boolean
  itemName?: string
  isDeleting: boolean
}>()

defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
}>()

const cancelButtonEl = ref<HTMLElement | null>(null)
const previousFocusedElement = ref<HTMLElement | null>(null)

const setCancelButtonRef = (instance: unknown) => {
  if (instance && typeof instance === 'object' && '$el' in instance) {
    const element = (instance as { $el?: unknown }).$el
    cancelButtonEl.value = element instanceof HTMLElement ? element : null
    return
  }
  cancelButtonEl.value = instance instanceof HTMLElement ? instance : null
}

watch(
  () => props.show,
  async (open) => {
    if (open) {
      previousFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      cancelButtonEl.value?.focus()
      return
    }
    const restoreTarget = previousFocusedElement.value
    if (restoreTarget) {
      nextTick(() => restoreTarget.focus())
    }
  }
)
</script> 