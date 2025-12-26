import type { App, DirectiveBinding } from 'vue'
import { gsap } from 'gsap'

// 预设动画
const presets: Record<string, (el: Element) => gsap.core.Tween | gsap.core.Timeline> = {
  fade: (el) => gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }),
  up: (el) => gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }),
  down: (el) => gsap.fromTo(el, { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }),
  scale: (el) => gsap.fromTo(el, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' }),
  list: (el) => gsap.fromTo((el as HTMLElement).children, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' }),
}

// 进入视口触发
function animateInView(el: HTMLElement, play: () => void) {
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          play()
          io.disconnect()
        }
      })
    }, { threshold: 0.1 })
    io.observe(el)
  } else {
    // 回退：直接播放
    play()
  }
}

// v-gsap 指令
const gsapDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const val = binding.value

    const doPlay = () => {
      if (typeof val === 'string') {
        const preset = presets[val]
        if (preset) preset(el)
      } else if (val && typeof val === 'object') {
        // 支持自定义 from 配置；确保最终可见
        const fromCfg = { autoAlpha: 0, ...val }
        gsap.fromTo(el, fromCfg as any, { autoAlpha: 1, ...(val?.to || {} as any) })
      } else {
        presets.fade(el)
      }
    }

    const trigger = (el.dataset.gsapInview === 'true')
      ? () => animateInView(el, doPlay)
      : doPlay

    // 延迟以避免与初始渲染冲突
    requestAnimationFrame(() => trigger())
  },
}

export default {
  install(app: App) {
    app.directive('gsap', gsapDirective)
  }
}
