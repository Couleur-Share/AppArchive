<template>
  <div class="subscription-info-item min-w-0">
    <div class="subscription-info-item__label">
      {{ label }}
    </div>
    <div class="subscription-info-item__value">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<style scoped>
.subscription-info-item {
  display: grid;
  gap: 6px;
}

.subscription-info-item__label {
  color: var(--home-text-subtle);
  font-size: 11px;
  line-height: 1;
}

.subscription-info-item__value {
  color: var(--home-text);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 600;
  word-break: break-word;
}
</style>
