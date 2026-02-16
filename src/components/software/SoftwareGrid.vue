<template>
  <VirtualSoftwareList
    :items="items"
    :can-edit="canEdit"
    :has-comparisons="hasComparisons"
    :view-mode="viewMode"
    :defer-icons="deferIcons"
    :new-since="newSince"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @click="$emit('click', $event)"
    @compare="$emit('compare', $event)"
  />
</template>

<script setup lang="ts">
import { type SoftwareListItem } from '../../types'
import VirtualSoftwareList from './VirtualSoftwareList.vue'

defineProps<{
  items: SoftwareListItem[]
  canEdit: boolean
  hasComparisons: Record<number, boolean>
  viewMode: 'grid' | 'list'
  deferIcons?: boolean
  newSince?: string
}>()

defineEmits<{
  (e: 'edit', software: SoftwareListItem): void
  (e: 'delete', id: number): void
  (e: 'click', software: SoftwareListItem): void
  (e: 'compare', software: SoftwareListItem): void
}>()
</script> 