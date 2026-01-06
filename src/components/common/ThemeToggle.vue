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

  <Teleport to="body">
    <div
      v-if="isAnimating"
      class="theme-spread-overlay"
      :class="spreadClass"
      :style="spreadStyle"
    ></div>
  </Teleport>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>()

const toggleBtn = ref<HTMLButtonElement | null>(null)
const isAnimating = ref(false)
const spreadOrigin = ref({ x: 0, y: 0 })
const targetDark = ref(false)

const spreadClass = computed(() => targetDark.value ? 'to-dark' : 'to-light')

const spreadStyle = computed(() => {
  const maxSize = Math.max(window.innerWidth, window.innerHeight) * 2.5
  return {
    '--spread-x': `${spreadOrigin.value.x}px`,
    '--spread-y': `${spreadOrigin.value.y}px`,
    '--spread-size': `${maxSize}px`,
  }
})

const handleToggle = (event: MouseEvent) => {
  const rect = toggleBtn.value?.getBoundingClientRect()
  if (rect) {
    spreadOrigin.value = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  targetDark.value = !props.modelValue
  isAnimating.value = true

  setTimeout(() => {
    emit('update:modelValue', !props.modelValue)
  }, 300)

  setTimeout(() => {
    isAnimating.value = false
  }, 600)
}
</script>

<style scoped>
.theme-spread-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.theme-spread-overlay::before {
  content: '';
  position: absolute;
  left: var(--spread-x);
  top: var(--spread-y);
  width: var(--spread-size);
  height: var(--spread-size);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: spread 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.theme-spread-overlay.to-dark::before {
  background: radial-gradient(circle, #111827 0%, #030712 100%);
}

.theme-spread-overlay.to-light::before {
  background: radial-gradient(circle, #ffffff 0%, #f3f4f6 100%);
}

@keyframes spread {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}
</style>
