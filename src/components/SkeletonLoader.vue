<template>
  <div class="animate-pulse">
    <!-- 网格骨架 -->
    <div v-if="variant === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6">
      <div 
        v-for="n in count" 
        :key="n"
        class="bg-white/30 dark:bg-gray-800/30 rounded-2xl p-6 min-h-[280px] flex flex-col"
      >
        <!-- 顶部：图标 + 标题 -->
        <div class="flex items-start gap-4 mb-4">
          <div class="w-16 h-16 rounded-full bg-gray-200/70 dark:bg-gray-700/60"></div>
          <div class="flex-1 min-w-0 pt-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>

        <!-- 中部：描述 -->
        <div class="space-y-2 mb-4">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>

        <!-- 底部：标签 + 系统 -->
        <div class="mt-auto flex items-center justify-between pt-4 border-t border-gray-200/40 dark:border-gray-700/40">
          <div class="flex items-center gap-2">
            <div class="h-5 w-10 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div class="h-5 w-10 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div class="flex items-center gap-1">
            <div class="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div class="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div class="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表骨架 -->
    <div v-else class="flex flex-col gap-3">
      <div 
        v-for="n in count" 
        :key="n"
        class="bg-white/30 dark:bg-gray-800/30 rounded-xl p-3 flex items-center gap-4"
      >
        <div class="w-12 h-12 rounded-lg bg-gray-200/70 dark:bg-gray-700/60"></div>
        <div class="flex-1 min-w-0">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div class="h-6 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number
  // 骨架布局类型：网格 or 列表
  variant?: 'grid' | 'list'
}>()
</script> 