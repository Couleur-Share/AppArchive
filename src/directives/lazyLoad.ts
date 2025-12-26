import type { Directive } from 'vue'

export const vLazyLoad: Directive<HTMLImageElement, string> = {
  mounted(el: HTMLImageElement, binding: { value: string }) {
    const loadImage = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 设置图片源
          el.src = binding.value
          // 添加加载动画类
          el.classList.add('lazy-image-loading')
          
          // 图片加载完成后移除加载动画
          el.onload = () => {
            el.classList.remove('lazy-image-loading')
            el.classList.add('lazy-image-loaded')
          }
          
          // 图片加载失败时显示占位图
          el.onerror = () => {
            el.src = 'https://via.placeholder.com/150?text=Error'
            el.classList.remove('lazy-image-loading')
            el.classList.add('lazy-image-error')
          }
          
          // 取消观察
          observer.unobserve(el)
        }
      })
    }

    // 创建观察者
    const observer = new IntersectionObserver(loadImage, {
      root: null,
      threshold: 0.1
    })

    // 设置默认占位图
    el.src = 'https://via.placeholder.com/150?text=Loading'
    
    // 添加原生懒加载属性
    el.loading = 'lazy'
    
    // 开始观察元素
    observer.observe(el)
  }
} 