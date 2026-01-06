<template>
  <button
    ref="toggleBtn"
    @click="handleToggle"
    class="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60"
  >
    <div class="relative w-5 h-5">
      <Sun
        class="h-5 w-5 text-amber-500 dark:text-gray-400 absolute transform transition-transform duration-500 rotate-0 dark:-rotate-180 dark:opacity-0"
      />
      <Moon
        class="h-5 w-5 text-gray-700 dark:text-blue-300 absolute transform transition-transform duration-500 rotate-180 opacity-0 dark:rotate-0 dark:opacity-100"
      />
    </div>
  </button>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

const toggleBtn = ref<HTMLButtonElement | null>(null)

const handleToggle = async (event: MouseEvent) => {
  const rect = toggleBtn.value?.getBoundingClientRect()
  if (!rect) {
    emit('update:modelValue', !props.modelValue)
    return
  }

  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const supportsViewTransition = 'startViewTransition' in document

  if (supportsViewTransition) {
    const transition = (document as any).startViewTransition(() => {
      emit('update:modelValue', !props.modelValue)
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]

      document.documentElement.animate(
        {
          clipPath: props.modelValue ? clipPath : clipPath.reverse(),
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: props.modelValue
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)',
        }
      )
    })
  } else {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>
