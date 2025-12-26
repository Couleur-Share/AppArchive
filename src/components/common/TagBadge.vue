<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-lg text-xs transition-colors duration-100', klass]">
    <slot>{{ label }}</slot>
  </span>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  class?: string
}>(), {
  label: '',
  class: ''
})

const klass = computed(() => props.class)
</script>

<style scoped>
</style>


