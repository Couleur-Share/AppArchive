<template>
  <div class="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none font-sans">
    <!-- Toggle Button -->
    <button
      @click="isOpen = !isOpen"
      class="pointer-events-auto bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
      title="图标圆角检测工具"
    >
      <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Main Panel -->
    <div v-if="isOpen" class="pointer-events-auto mt-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all">
      <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
        <h3 class="font-bold text-sm text-gray-900 dark:text-white">图标圆角检测器</h3>
        <span class="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">DevTool</span>
      </div>

      <div class="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
        <!-- Image Input -->
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">图片 URL</label>
          <div class="flex gap-2">
             <input
                v-model="imageUrl"
                type="text"
                class="flex-1 text-xs p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="输入图片地址..."
                @input="debounceAnalyze"
              />
          </div>
        </div>

        <!-- Canvas (Hidden) -->
        <canvas ref="canvasRef" class="hidden"></canvas>

        <!-- Preview & Analysis -->
        <div v-if="imageUrl" class="space-y-4">
          <!-- Preview Box -->
          <div class="flex flex-col items-center gap-2">
            <div class="text-xs text-gray-400">预览效果 (80x80)</div>
            <div class="bg-checkered p-4 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
               <div class="w-20 h-20 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 relative overflow-hidden" :class="selectedClass">
                  <img
                      ref="imgRef"
                      :src="imageUrl"
                      class="w-full h-full object-cover"
                      crossorigin="anonymous"
                      @load="analyzeImage"
                      @error="handleError"
                  />
               </div>
               <!-- Original overlay reference -->
               <div class="absolute inset-4 pointer-events-none border border-red-500/20 rounded-none w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span class="text-[10px] text-red-500 bg-white/80 px-1">原图边界</span>
               </div>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 text-red-600 text-xs p-2 rounded border border-red-100">
            {{ error }}
          </div>

          <!-- Recommendation -->
          <div v-if="bestMatch && !error" class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">推荐 Class:</div>
                <div class="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-300">{{ bestMatch.className }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">匹配度</div>
                <div class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{{ calculateScore(bestMatch) }}%</div>
              </div>
            </div>
            <div class="mt-2 text-[10px] text-emerald-600/70 dark:text-emerald-400/70 grid grid-cols-2 gap-2">
               <div>切除像素: {{ bestMatch.cutPixels }}px</div>
               <div>空隙像素: {{ bestMatch.gapPixels }}px</div>
            </div>
          </div>

          <!-- Manual Selection -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-2">手动选择:</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in radiusOptions"
                :key="opt.className"
                @click="selectedClass = opt.className"
                class="text-[10px] py-1.5 px-1 rounded border transition-all truncate"
                :class="selectedClass === opt.className
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
              >
                {{ opt.className.replace('rounded-', '') || 'none' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

const isOpen = ref(false)
const imageUrl = ref('https://image-1252749317.cos.ap-guangzhou.myqcloud.com/AppArchive/AB_Download_Manager.png')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const error = ref('')
const selectedClass = ref('rounded-none')
const bestMatch = ref<any>(null)
let debounceTimer: any = null

interface RadiusOption {
  name: string
  className: string
  px: number
}

const radiusOptions: RadiusOption[] = [
  { name: 'none', className: 'rounded-none', px: 0 },
  { name: 'sm', className: 'rounded-sm', px: 2 },
  { name: 'base', className: 'rounded', px: 4 },
  { name: 'md', className: 'rounded-md', px: 6 },
  { name: 'lg', className: 'rounded-lg', px: 8 },
  { name: 'xl', className: 'rounded-xl', px: 12 },
  { name: '2xl', className: 'rounded-2xl', px: 16 },
  { name: '3xl', className: 'rounded-3xl', px: 24 },
  { name: 'full', className: 'rounded-full', px: 9999 },
]

const debounceAnalyze = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    error.value = ''
    // Force reload image logic if needed, but binding handles src update
  }, 500)
}

const handleError = (e: Event) => {
  console.error(e)
  error.value = '加载失败: 请检查 URL 或跨域设置 (CORS)'
  bestMatch.value = null
}

const calculateScore = (match: any) => {
  // Simple heuristic score for display
  const totalPixels = 128 * 128
  const badPixels = match.cutPixels * 5 + match.gapPixels
  const score = Math.max(0, 100 - (badPixels / totalPixels * 1000))
  return score.toFixed(1)
}

const analyzeImage = () => {
  error.value = ''
  const img = imgRef.value
  const canvas = canvasRef.value
  if (!img || !canvas) return

  // Need to ensure image is loaded
  if (!img.complete || img.naturalWidth === 0) return

  const size = 128
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  try {
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data

    let bestOption = null
    let minScore = Infinity

    // Assume rendered size is 80px (common icon size)
    const renderSize = 80
    const scale = size / renderSize

    radiusOptions.forEach(opt => {
      const radiusPx = opt.px === 9999 ? renderSize / 2 : opt.px
      const r = radiusPx * scale 

      let cutPixels = 0
      let gapPixels = 0

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4
          const alpha = data[idx + 3]
          const isContent = alpha > 30 // Threshold for "visible content"

          // Check if pixel is OUTSIDE the rounded corner mask
          let isOutside = false
          
          // Distances from corners
          const distTL = Math.sqrt((x - r) ** 2 + (y - r) ** 2)
          const distTR = Math.sqrt((x - (size - r)) ** 2 + (y - r) ** 2)
          const distBL = Math.sqrt((x - r) ** 2 + (y - (size - r)) ** 2)
          const distBR = Math.sqrt((x - (size - r)) ** 2 + (y - (size - r)) ** 2)

          if (x < r && y < r && distTL > r) isOutside = true
          else if (x > size - r && y < r && distTR > r) isOutside = true
          else if (x < r && y > size - r && distBL > r) isOutside = true
          else if (x > size - r && y > size - r && distBR > r) isOutside = true

          if (isOutside) {
            // If outside mask but has content -> BAD (Cutoff)
            if (isContent) cutPixels++
          } else {
             // If inside mask but no content -> GAP (Visual mismatch, but acceptable)
             if (!isContent) gapPixels++
          }
        }
      }

      // Weighted score: Cutting content is much worse than having a gap
      const score = (cutPixels * 50) + (gapPixels * 1)
      
      if (score < minScore) {
        minScore = score
        bestOption = { ...opt, score, cutPixels, gapPixels }
      }
    })

    if (bestOption) {
      bestMatch.value = bestOption
      selectedClass.value = bestOption.className
    }
  } catch (e) {
    error.value = '跨域错误: 无法读取图片像素数据'
  }
}
</script>

<style scoped>
.bg-checkered {
  background-image:
    linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
.dark .bg-checkered {
   background-image:
    linear-gradient(45deg, #333 25%, transparent 25%),
    linear-gradient(-45deg, #333 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #333 75%),
    linear-gradient(-45deg, transparent 75%, #333 75%);
}

/* Custom scrollbar for the panel */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>
