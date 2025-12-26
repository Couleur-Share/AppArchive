<template>
  <footer class="mt-8 border-t border-gray-200/60 dark:border-gray-800/60">
    <div class="container mx-auto px-6 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
      <span>© {{ currentYear }} Couleur X. All rights reserved.</span>
    </div>
  </footer>
  
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
</style>