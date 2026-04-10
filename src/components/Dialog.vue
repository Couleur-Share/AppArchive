<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="show"
        ref="dialogRef"
        class="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        @keydown.esc.stop.prevent="$emit('update:show', false)"
      >
        <div class="absolute inset-0 app-modal-backdrop" @click="$emit('update:show', false)"></div>
        <div class="relative z-10">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

defineEmits<{
  'update:show': [value: boolean]
}>()

const dialogRef = ref<HTMLElement | null>(null)
const previousFocusedElement = ref<HTMLElement | null>(null)

watch(
  () => props.show,
  async (open) => {
    if (open) {
      previousFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      dialogRef.value?.focus()
      return
    }
    const restoreTarget = previousFocusedElement.value
    if (restoreTarget) {
      nextTick(() => restoreTarget.focus())
    }
  }
)
</script>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity var(--dur) var(--ease);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>