<template>
  <div class="comparison-structured flex flex-col gap-5">
    <!-- 总结判定 -->
    <section v-if="analysis.verdict" class="verdict-card">
      <div class="verdict-indicator"></div>
      <div class="flex flex-col gap-1.5">
        <div class="verdict-label">综合判定</div>
        <p class="verdict-text">{{ analysis.verdict }}</p>
      </div>
    </section>

    <!-- 维度对比 -->
    <section v-if="analysis.dimensions.length" class="software-detail-card dimension-section rounded-lg">
      <header class="dimension-header">
        <h4 class="section-title">维度对比</h4>
        <span class="section-hint">1-5 分，绿点为单维度最高分</span>
      </header>

      <!-- 表头：软件名 -->
      <div class="dimension-grid" :style="gridStyle">
        <div class="dim-col-header"></div>
        <div
          v-for="name in softwareNames"
          :key="`h-${name}`"
          class="dim-sw-header"
        >
          <img
            v-if="iconMap[name]"
            :src="iconMap[name]"
            :alt="name"
            class="dim-sw-icon"
          />
          <span class="dim-sw-name">{{ name }}</span>
        </div>

        <!-- 每个维度一行 -->
        <template v-for="dim in analysis.dimensions" :key="`row-${dim.name}`">
          <div class="dim-name-cell">
            <span class="dim-name">{{ dim.name }}</span>
          </div>
          <div
            v-for="name in softwareNames"
            :key="`${dim.name}-${name}`"
            class="dim-rating-cell"
            :class="{ 'is-top': isTop(dim, name) }"
          >
            <div class="dim-dots" :aria-label="`${name} 评分 ${scoreOf(dim, name)} / 5`">
              <span
                v-for="n in 5"
                :key="n"
                class="dim-dot"
                :class="{
                  'dim-dot-filled': n <= scoreOf(dim, name),
                  'dim-dot-top': n <= scoreOf(dim, name) && isTop(dim, name),
                }"
              ></span>
            </div>
            <p v-if="commentOf(dim, name)" class="dim-comment">
              {{ commentOf(dim, name) }}
            </p>
          </div>
        </template>
      </div>
    </section>

    <!-- 核心差异 -->
    <section v-if="analysis.key_differences.length" class="difference-section">
      <header class="difference-header">
        <h4 class="section-title">核心差异</h4>
      </header>
      <div class="difference-grid">
        <article
          v-for="(diff, idx) in analysis.key_differences"
          :key="`diff-${idx}`"
          class="software-detail-card difference-card rounded-lg"
        >
          <div class="difference-index">{{ String(idx + 1).padStart(2, '0') }}</div>
          <h5 class="difference-title">{{ diff.title }}</h5>
          <p class="difference-desc">{{ diff.description }}</p>
        </article>
      </div>
    </section>

    <!-- 适用场景 -->
    <section v-if="analysis.scenarios.length" class="scenario-section">
      <header class="scenario-header">
        <h4 class="section-title">适用场景</h4>
      </header>
      <div class="scenario-list">
        <article
          v-for="(sc, idx) in analysis.scenarios"
          :key="`sc-${idx}`"
          class="software-detail-card scenario-card rounded-lg"
        >
          <div class="scenario-main">
            <div class="scenario-label">场景</div>
            <p class="scenario-text">{{ sc.scenario }}</p>
          </div>
          <div class="scenario-arrow">
            <ArrowRight class="w-4 h-4" />
          </div>
          <div class="scenario-reco">
            <div class="scenario-label">推荐</div>
            <div class="scenario-reco-line">
              <img
                v-if="iconMap[sc.recommendation]"
                :src="iconMap[sc.recommendation]"
                :alt="sc.recommendation"
                class="scenario-reco-icon"
              />
              <span class="scenario-reco-name">{{ sc.recommendation }}</span>
            </div>
            <p class="scenario-reason">{{ sc.reason }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { getIconUrl } from '../../services/localIconCache'
import type { ComparisonAnalysis, ComparisonDimension } from '../../types/comparison'
import { getDimensionTopScore } from '../../utils/comparison-parser'

interface SoftwareMinimal {
  name: string
  icon?: string | null
}

const props = defineProps<{
  analysis: ComparisonAnalysis
  softwares?: SoftwareMinimal[]
}>()

// 汇总全部出现过的软件名（从 dimensions.ratings 的 key 和 softwares 属性取并集，保持顺序）
const softwareNames = computed<string[]>(() => {
  const ordered: string[] = []
  const seen = new Set<string>()

  if (props.softwares) {
    for (const sw of props.softwares) {
      if (sw?.name && !seen.has(sw.name)) {
        ordered.push(sw.name)
        seen.add(sw.name)
      }
    }
  }

  for (const dim of props.analysis.dimensions) {
    for (const name of Object.keys(dim.ratings)) {
      if (!seen.has(name)) {
        ordered.push(name)
        seen.add(name)
      }
    }
  }

  return ordered
})

// 软件名 → 图标 URL 的映射
const iconMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  if (!props.softwares) return map
  for (const sw of props.softwares) {
    if (sw?.name && sw.icon) {
      map[sw.name] = getIconUrl(sw.icon)
    }
  }
  return map
})

// 网格列数：左侧维度名 1 列 + 每个软件 1 列
const gridStyle = computed(() => ({
  gridTemplateColumns: `minmax(120px, 160px) repeat(${softwareNames.value.length}, minmax(140px, 1fr))`,
}))

const scoreOf = (dim: ComparisonDimension, name: string): number => {
  return dim.ratings[name]?.score ?? 0
}

const commentOf = (dim: ComparisonDimension, name: string): string => {
  return dim.ratings[name]?.comment ?? ''
}

const isTop = (dim: ComparisonDimension, name: string): boolean => {
  const top = getDimensionTopScore(dim)
  if (top <= 0) return false
  return scoreOf(dim, name) === top
}
</script>

<style scoped>
/* ==================== 卡片通用 ==================== */
.software-detail-card {
  border: 1px solid var(--modal-card-border-light);
  background: var(--modal-card-bg-light);
  box-shadow: var(--modal-card-shadow-light);
}
.dark .software-detail-card {
  border-color: var(--modal-card-border-dark);
  background: var(--modal-card-bg-dark);
  box-shadow: var(--modal-card-shadow-dark);
}

.section-title {
  @apply text-base font-bold text-gray-900 dark:text-white m-0;
}
.section-hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

/* ==================== 总结判定 ==================== */
.verdict-card {
  display: grid;
  grid-template-columns: 3px 1fr;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--theme-primary-500, #1ed760) 22%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--theme-primary-500, #1ed760) 8%, transparent) 0%,
    color-mix(in srgb, var(--theme-primary-500, #1ed760) 2%, transparent) 100%
  );
}
.dark .verdict-card {
  border-color: color-mix(in srgb, var(--theme-primary-500, #1ed760) 28%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--theme-primary-500, #1ed760) 12%, transparent) 0%,
    color-mix(in srgb, var(--theme-primary-500, #1ed760) 3%, transparent) 100%
  );
}
.verdict-indicator {
  background: var(--theme-primary-500, #1ed760);
  border-radius: 2px;
}
.verdict-label {
  @apply text-xs font-semibold uppercase tracking-wider;
  color: var(--theme-primary-600, #1db954);
}
.dark .verdict-label {
  color: var(--theme-primary-400, #4de17e);
}
.verdict-text {
  @apply text-sm leading-7 text-gray-800 dark:text-gray-100 font-medium m-0;
}

/* ==================== 维度对比 ==================== */
.dimension-section {
  padding: 18px 20px 20px;
}
.dimension-header {
  @apply flex items-baseline justify-between mb-4 gap-3;
}
.dimension-grid {
  display: grid;
  row-gap: 14px;
  column-gap: 16px;
  overflow-x: auto;
}
.dim-col-header {
  /* 占位，左上角空 */
}
.dim-sw-header {
  @apply flex items-center gap-2 pb-3;
  border-bottom: 1px solid var(--modal-card-border-light);
}
.dark .dim-sw-header {
  border-bottom-color: var(--modal-card-border-dark);
}
.dim-sw-icon {
  @apply w-6 h-6 rounded-md flex-shrink-0 object-cover;
  background: color-mix(in srgb, currentColor 6%, transparent);
}
.dim-sw-name {
  @apply text-sm font-semibold text-gray-900 dark:text-white truncate;
}

.dim-name-cell {
  @apply flex items-start pt-2;
}
.dim-name {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200;
}

.dim-rating-cell {
  @apply flex flex-col gap-1.5 pt-1 px-2 py-2 rounded-md transition-colors;
}
.dim-rating-cell.is-top {
  background: color-mix(in srgb, var(--theme-primary-500, #1ed760) 8%, transparent);
}
.dark .dim-rating-cell.is-top {
  background: color-mix(in srgb, var(--theme-primary-500, #1ed760) 10%, transparent);
}

.dim-dots {
  @apply flex items-center gap-1;
}
.dim-dot {
  @apply w-1.5 h-1.5 rounded-full block;
  background: color-mix(in srgb, currentColor 12%, transparent);
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.dim-dot-filled {
  background: color-mix(in srgb, currentColor 45%, transparent);
}
.dim-dot-top {
  background: var(--theme-primary-500, #1ed760);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary-500, #1ed760) 15%, transparent);
}
.dim-comment {
  @apply text-xs leading-5 text-gray-500 dark:text-gray-400 m-0;
}
.is-top .dim-comment {
  @apply text-gray-700 dark:text-gray-200;
}

/* ==================== 核心差异 ==================== */
.difference-header {
  @apply flex items-baseline justify-between mb-3 gap-3;
}
.difference-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 768px) {
  .difference-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.difference-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}
.difference-index {
  @apply text-xs font-mono font-bold;
  color: var(--theme-primary-600, #1db954);
  letter-spacing: 0.04em;
}
.dark .difference-index {
  color: var(--theme-primary-400, #4de17e);
}
.difference-title {
  @apply text-sm font-bold text-gray-900 dark:text-white m-0;
}
.difference-desc {
  @apply text-sm leading-6 text-gray-600 dark:text-gray-300 m-0;
}

/* ==================== 适用场景 ==================== */
.scenario-header {
  @apply flex items-baseline justify-between mb-3 gap-3;
}
.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.scenario-card {
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr auto 1.2fr;
  gap: 16px;
  align-items: center;
}
@media (max-width: 640px) {
  .scenario-card {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .scenario-arrow {
    display: none;
  }
}
.scenario-main,
.scenario-reco {
  @apply flex flex-col gap-1;
  min-width: 0;
}
.scenario-label {
  @apply text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500;
}
.scenario-text {
  @apply text-sm font-medium text-gray-800 dark:text-gray-100 m-0 leading-6;
}
.scenario-arrow {
  @apply flex items-center justify-center rounded-full w-7 h-7 flex-shrink-0;
  background: color-mix(in srgb, var(--theme-primary-500, #1ed760) 12%, transparent);
  color: var(--theme-primary-600, #1db954);
}
.dark .scenario-arrow {
  color: var(--theme-primary-400, #4de17e);
}
.scenario-reco-line {
  @apply flex items-center gap-2;
}
.scenario-reco-icon {
  @apply w-5 h-5 rounded-md flex-shrink-0 object-cover;
}
.scenario-reco-name {
  @apply text-sm font-bold truncate;
  color: var(--theme-primary-700, #169c46);
}
.dark .scenario-reco-name {
  color: var(--theme-primary-400, #4de17e);
}
.scenario-reason {
  @apply text-xs leading-5 text-gray-600 dark:text-gray-400 m-0;
}

@media (prefers-reduced-motion: reduce) {
  .dim-dot {
    transition: none;
  }
}
</style>
