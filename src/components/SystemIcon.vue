<template>
  <!-- 使用 simple-icons（单色），通过 currentColor 继承文字颜色 -->
  <i-uil-windows v-if="system === 'Windows'" class="text-current" v-bind="$attrs" />
  <i-simple-icons-apple v-else-if="system === 'macOS' || system === 'iOS'" class="text-current" v-bind="$attrs" />
  <i-simple-icons-linux v-else-if="system === 'Linux'" class="text-current" v-bind="$attrs" />
  <i-uil-android v-else-if="system === 'Android'" class="text-current" v-bind="$attrs" />
  <i-simple-icons-harmonyos v-else-if="system === 'HarmonyOS'" class="text-current" v-bind="$attrs" />
  <MonitorIcon v-else class="text-current" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { MonitorIcon } from 'lucide-vue-next'
defineProps<{ system: string }>()
</script>


