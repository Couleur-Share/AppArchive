<template>
  <VirtualSoftwareList
    :items="items"
    :can-edit="canEdit"
    :has-comparisons="hasComparisons"
    :view-mode="viewMode"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @click="$emit('click', $event)"
    @compare="$emit('compare', $event)"
  />
</template>

<script setup lang="ts">
import { type Software } from '../../types'
import VirtualSoftwareList from './VirtualSoftwareList.vue'

defineProps<{
  items: Software[]
  canEdit: boolean
  hasComparisons: Record<number, boolean>
  viewMode: 'grid' | 'list'
}>()

defineEmits<{
  (e: 'edit', software: Software): void
  (e: 'delete', id: number): void
  (e: 'click', software: Software): void
  (e: 'compare', software: Software): void
}>()
</script> 