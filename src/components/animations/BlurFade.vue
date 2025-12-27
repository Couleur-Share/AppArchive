<template>
  <component
    :is="tag"
    ref="elRef"
    :class="[$attrs.class]"
    :style="computedStyle"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Direction = 'up' | 'down' | 'left' | 'right'

const props = withDefaults(defineProps<{
  tag?: string
  duration?: number // seconds
  delay?: number // seconds
  offset?: number // px
  direction?: Direction
  inView?: boolean // 是否基于进入视口触发
  inViewMargin?: string // rootMargin
  blur?: string // e.g. '6px'
  once?: boolean // 只触发一次
}>(), {
  tag: 'div',
  duration: 0.4,
  delay: 0,
  offset: 6,
  direction: 'down',
  inView: true,
  inViewMargin: '-50px',
  blur: '6px',
  once: true,
})

const elRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const computeTransform = (visible: boolean) => {
  if (visible) return 'translate3d(0,0,0)'
  switch (props.direction) {
    case 'left':
      return `translate3d(${props.offset}px, 0, 0)`
    case 'right':
      return `translate3d(-${props.offset}px, 0, 0)`
    case 'up':
      return `translate3d(0, ${props.offset}px, 0)`
    default:
      return `translate3d(0, -${props.offset}px, 0)`
  }
}

const computedStyle = computed(() => {
  const t = props.duration
  const d = props.delay
  return {
    opacity: isVisible.value ? '1' : '0',
    transform: computeTransform(isVisible.value),
    filter: isVisible.value ? 'blur(0px)' : `blur(${props.blur})`,
    transition: `opacity ${t}s ease-out ${d}s, transform ${t}s ease-out ${d}s, filter ${t}s ease-out ${d}s`,
    willChange: 'opacity, transform, filter',
  } as Record<string, string>
})

const observeIfNeeded = () => {
  if (!props.inView) {
    // 不基于可视触发，直接在下一帧显示以产生过渡
    requestAnimationFrame(() => { isVisible.value = true })
    return
  }
  if (!('IntersectionObserver' in window)) {
    // 兜底：直接显示
    isVisible.value = true
    return
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry?.isIntersecting) {
      isVisible.value = true
      if (props.once && observer) {
        observer.disconnect()
        observer = null
      }
    } else if (!props.once) {
      isVisible.value = false
    }
  }, { root: null, rootMargin: props.inViewMargin, threshold: 0.01 })

  if (elRef.value) observer.observe(elRef.value)
}

onMounted(() => {
  // 确保初始状态为不可见，然后设置观察
  isVisible.value = false
  observeIfNeeded()
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})

watch(() => props.inView, () => {
  // 切换策略时重新观察
  nextTick(() => observeIfNeeded())
})
</script>

<style scoped>
/* 无额外样式，全部通过内联 style 控制，便于按需调整 */
</style>
