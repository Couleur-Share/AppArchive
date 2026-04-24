<template>
  <SegmentedControl
    :model-value="modelValue"
    :items="kindItems"
    aria-label="软件形态切换"
    :show-animation="showAnimation"
    :animation-delay-base="animationDelayBase"
    :animation-stagger="animationStagger"
    @update:model-value="onChange"
  />
</template>

<script setup lang="ts">
import { Package, Puzzle, ScrollText } from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed } from 'vue'
import type { SoftwareKind } from '@/types'
import { KINDS } from '@/types/constants'
import SegmentedControl from './SegmentedControl.vue'

const props = defineProps<{
  modelValue: SoftwareKind
  showAnimation?: boolean
  animationDelayBase?: number
  animationStagger?: number
}>()

const emit = defineEmits<(e: 'update:modelValue', value: SoftwareKind) => void>()

// 形态标签与图标
const kindLabelMap: Record<SoftwareKind, string> = {
  app: '应用',
  extension: '插件',
  userscript: '脚本'
}
const kindIconMap: Record<SoftwareKind, Component> = {
  app: Package,
  extension: Puzzle,
  userscript: ScrollText
}

const kindItems = computed(() =>
  KINDS.map((kind) => ({
    value: kind,
    label: kindLabelMap[kind],
    icon: kindIconMap[kind]
  }))
)

const onChange = (value: SoftwareKind) => {
  emit('update:modelValue', value)
}
</script>
