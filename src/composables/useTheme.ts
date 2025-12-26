import { ref, watch } from 'vue'

export function useTheme() {
  const isDark = ref(localStorage.getItem('dark-mode') !== 'false')

  watch(
    isDark,
    (newValue) => {
      localStorage.setItem('dark-mode', newValue.toString())
      if (newValue) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    { immediate: true }
  )

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  return {
    isDark,
    toggleTheme
  }
} 