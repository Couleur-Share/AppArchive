<template>
  <footer class="app-footer-shell mt-10">
    <div class="app-footer-inner container mx-auto px-6 py-6 text-center text-xs">
      <span>© {{ currentYear }} Couleur X. All rights reserved.</span>
      <span class="mx-2">|</span>
      <a 
        href="https://beian.miit.gov.cn/" 
        target="_blank" 
        rel="noopener noreferrer"
        class="app-footer-link"
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
.app-footer-shell {
  position: relative;
  border-top: 1px solid var(--app-footer-border);
  background: var(--app-footer-bg);
}

.app-footer-shell::before {
  content: '';
  position: absolute;
  inset: -72px 0 auto;
  height: 72px;
  background: var(--app-footer-top-fade);
  pointer-events: none;
}

.app-footer-inner {
  position: relative;
  color: var(--app-footer-text);
}

.app-footer-link {
  color: inherit;
  transition: color 150ms var(--ease);
}

.app-footer-link:hover {
  color: var(--app-footer-text-strong);
}
</style>
