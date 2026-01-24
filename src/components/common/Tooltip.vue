<template>
  <TooltipProvider>
    <TooltipRoot :delay-duration="200">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="z-[100] px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-md will-change-[transform,opacity] data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade dark:bg-gray-700"
          :side-offset="5"
        >
          {{ content }}
          <TooltipArrow class="fill-gray-900 dark:fill-gray-700" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'radix-vue'

defineProps<{
  content: string
}>()
</script>

<style scoped>
@keyframes slideUpAndFade {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideRightAndFade {
  from {
    opacity: 0;
    transform: translateX(-2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeftAndFade {
  from {
    opacity: 0;
    transform: translateX(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideUpAndFade {
  animation: slideUpAndFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slideRightAndFade {
  animation: slideRightAndFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slideDownAndFade {
  animation: slideDownAndFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slideLeftAndFade {
  animation: slideLeftAndFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
