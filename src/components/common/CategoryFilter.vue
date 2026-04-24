<template>
  <SegmentedControl
    :model-value="modelValue"
    :items="categoryItems"
    aria-label="分类筛选"
    :show-arrows="showArrows"
    :show-animation="showAnimation"
    :animation-delay-base="animationDelayBase"
    :animation-stagger="animationStagger"
    :indicator-padding="indicatorPadding"
    :fade-width="fadeWidth"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import SegmentedControl from './SegmentedControl.vue'

const props = defineProps<{
  modelValue: string
  categories: string[]
  categoryCounts?: Record<string, number>
  categoryIcons?: Record<string, Component>
  showArrows?: boolean
  showAnimation?: boolean
  animationDelayBase?: number
  animationStagger?: number
  indicatorPadding?: number
  /** Tabs 渐隐遮罩宽度（像素）。当未溢出时不生效 */
  fadeWidth?: number
}>()

defineEmits<(e: 'update:modelValue', value: string) => void>()

const catKey = (value: string) => (value === 'all' ? 'all' : value)

const categoryItems = computed(() =>
  ['all', ...props.categories].map((category) => {
    const key = catKey(category)
    const count = props.categoryCounts?.[key]

    return {
      value: category,
      label: category === 'all' ? '全部' : category,
      icon: props.categoryIcons?.[key],
      badge: count !== undefined ? count : undefined
    }
  })
)
</script>
