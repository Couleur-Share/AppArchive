<template>
  <footer class="mt-8 border-t border-gray-200/60 dark:border-gray-800/60">
    <div class="container mx-auto px-6 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
      <span>© {{ currentYear }} Couleur X. All rights reserved.</span>
      <span class="mx-2">|</span>
      <a 
        href="https://beian.miit.gov.cn/" 
        target="_blank" 
        rel="noopener noreferrer"
        class="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        粤ICP备2026000260号
      </a>
    </div>
  </footer>
  
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
</style>