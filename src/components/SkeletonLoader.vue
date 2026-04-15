<template>
  <div class="animate-pulse">
    <!-- 网格骨架 -->
    <div v-if="variant === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6">
      <div 
        v-for="n in count" 
        :key="n"
        class="skeleton-card rounded-xl p-6 min-h-[280px] flex flex-col"
      >
        <div class="flex items-start gap-4 mb-4">
          <div class="w-16 h-16 rounded-full skeleton-bone-strong"></div>
          <div class="flex-1 min-w-0 pt-1">
            <div class="h-4 skeleton-bone rounded w-3/4 mb-2"></div>
            <div class="h-3 skeleton-bone rounded w-1/2"></div>
          </div>
        </div>

        <div class="space-y-2 mb-4">
          <div class="h-3 skeleton-bone rounded w-full"></div>
          <div class="h-3 skeleton-bone rounded w-5/6"></div>
          <div class="h-3 skeleton-bone rounded w-2/3"></div>
        </div>

        <div class="mt-auto flex items-center justify-between pt-4 border-t skeleton-divider">
          <div class="flex items-center gap-2">
            <div class="h-5 w-10 rounded skeleton-bone"></div>
            <div class="h-5 w-10 rounded skeleton-bone"></div>
          </div>
          <div class="flex items-center gap-1">
            <div class="h-5 w-5 rounded skeleton-bone"></div>
            <div class="h-5 w-5 rounded skeleton-bone"></div>
            <div class="h-5 w-5 rounded skeleton-bone"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表骨架 -->
    <div v-else class="flex flex-col gap-3">
      <div 
        v-for="n in count" 
        :key="n"
        class="skeleton-card rounded-xl p-3 flex items-center gap-4"
      >
        <div class="w-12 h-12 rounded-lg skeleton-bone-strong"></div>
        <div class="flex-1 min-w-0">
          <div class="h-4 skeleton-bone rounded w-2/3 mb-2"></div>
          <div class="h-3 skeleton-bone rounded w-1/2"></div>
        </div>
        <div class="h-6 w-12 rounded skeleton-bone"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number
  variant?: 'grid' | 'list'
}>()
</script>

<style scoped>
.skeleton-card {
  background: color-mix(in srgb, var(--home-card-bg) 62%, transparent);
  border: 1px solid color-mix(in srgb, var(--home-card-border) 50%, transparent);
}

.skeleton-bone {
  background: color-mix(in srgb, var(--home-text-subtle) 16%, transparent);
}

.skeleton-bone-strong {
  background: color-mix(in srgb, var(--home-text-subtle) 22%, transparent);
}

.skeleton-divider {
  border-color: color-mix(in srgb, var(--home-card-divider) 50%, transparent);
}
</style>