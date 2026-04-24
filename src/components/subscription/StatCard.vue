<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="stat-card"
    :class="[
      variantClass,
      {
        'stat-card--interactive': interactive,
        'stat-card--active': active,
      },
    ]"
    :type="interactive ? 'button' : undefined"
    :aria-pressed="interactive ? active : undefined"
    :aria-label="interactive ? ariaLabel || label : undefined"
    @click="handleSelect"
  >
    <div class="stat-card__topline">
      <span class="stat-card__label">{{ label }}</span>
      <span v-if="max" class="stat-card__meta">上限 {{ max }}</span>
    </div>

    <div class="stat-card__value-row">
      <span class="stat-card__value">{{ value }}</span>
      <span v-if="max" class="stat-card__max">/ {{ max }}</span>
    </div>

    <p v-if="caption" class="stat-card__caption">
      {{ caption }}
    </p>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'neutral' | 'success' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    max?: number
    caption?: string
    variant?: Variant
    interactive?: boolean
    active?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: 'neutral',
    caption: '',
    interactive: false,
    active: false,
    ariaLabel: '',
  },
)

const emit = defineEmits<{
  select: []
}>()

const variantClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'stat-card--success'
    case 'warning':
      return 'stat-card--warning'
    case 'info':
      return 'stat-card--info'
    default:
      return 'stat-card--neutral'
  }
})

function handleSelect() {
  if (props.interactive) emit('select')
}
</script>

<style scoped>
.stat-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  text-align: left;
  font: inherit;
  min-height: 122px;
  padding: 15px 16px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--home-border-strong) 88%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-surface-strong) 96%, transparent), color-mix(in srgb, var(--home-surface) 92%, transparent));
  box-shadow: var(--home-shadow);
  transition:
    transform var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease),
    background-color var(--dur) var(--ease);
}

.stat-card--interactive {
  cursor: pointer;
}

.stat-card--interactive:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--home-border-strong) 96%, var(--theme-primary-500));
  box-shadow: var(--home-card-shadow-hover);
}

.stat-card--interactive:focus-visible {
  outline: none;
  border-color: var(--home-accent-border);
  box-shadow: var(--home-focus-ring-soft);
}

.stat-card--active {
  border-color: color-mix(in srgb, var(--home-accent-border) 86%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-accent-soft) 26%, var(--home-surface-strong)), color-mix(in srgb, var(--home-surface) 94%, transparent));
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--stat-accent) 50%, transparent 100%);
  opacity: 0.72;
}

.stat-card::after {
  content: '';
  position: absolute;
  inset: auto 14px 14px auto;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--stat-accent) 16%, transparent) 0%, transparent 72%);
  pointer-events: none;
}

.stat-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stat-card__label {
  color: var(--stat-accent-text);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.stat-card__meta {
  color: var(--home-text-subtle);
  font-size: 11px;
}

.stat-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 12px;
}

.stat-card__value {
  color: var(--home-text-strong);
  font-size: 2.05rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.stat-card__max {
  color: var(--home-text-subtle);
  font-size: 13px;
  font-weight: 600;
}

.stat-card__caption {
  max-width: 24ch;
  margin-top: 10px;
  color: var(--home-text-muted);
  font-size: 12px;
  line-height: 1.55;
}

.stat-card--neutral {
  --stat-accent: rgb(148 163 184 / 0.4);
  --stat-accent-text: var(--home-text-muted);
}

.stat-card--success {
  --stat-accent: rgb(30 215 96 / 0.66);
  --stat-accent-text: var(--theme-primary-400);
}

.stat-card--warning {
  --stat-accent: rgb(255 164 43 / 0.72);
  --stat-accent-text: #ffa42b;
}

.stat-card--info {
  --stat-accent: rgb(83 157 245 / 0.72);
  --stat-accent-text: #7cb6ff;
}

@media (max-width: 640px) {
  .stat-card {
    min-height: auto;
    padding: 14px 15px;
    border-radius: 14px;
  }

  .stat-card__value-row {
    margin-top: 10px;
  }

  .stat-card__caption {
    max-width: none;
  }
}
</style>
