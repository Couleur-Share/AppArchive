<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog 
      as="div" 
      class="relative z-50" 
      @close="() => {}"
      :open="isOpen"
      :initialFocus="initialFocusRef"
    >
      <div ref="initialFocusRef" tabindex="-1" class="hidden" />
      
      <TransitionChild>
        <div class="fixed inset-0 bg-black/50"
             v-gsap="{ duration: 0.18, to: { duration: 0.18, ease: 'power1.out' } }" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild>
            <DialogPanel 
              @click.stop
              @mousedown.stop
              @mouseup.stop
              @pointerdown.stop
              @pointerup.stop
              class="relative transform overflow-hidden rounded-lg 
                     bg-white dark:bg-gray-800 
                     text-left shadow-level3 will-change-transform will-change-opacity
                     w-full min-h-[400px] max-h-[90vh]
                     flex flex-col"
              :class="{
                'max-w-2xl': activeTab !== 'comparison',
                'max-w-[95vw] lg:max-w-6xl xl:max-w-7xl': activeTab === 'comparison'
              }"
              v-gsap="{ y: 10, duration: 0.24, ease: 'power2.out', force3D: true, to: { y: 0, duration: 0.24, ease: 'power2.out', force3D: true } }"
            >
              <!-- 标题栏 -->
              <div class="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-4 flex-1">
                  <div class="w-12 h-12 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                    <img :src="getIconUrl(software.icon)" :alt="software.name" class="w-full h-full object-cover" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <DialogTitle as="h3" class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ software.name }}
                    </DialogTitle>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {{ software.category }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3 ml-4">
                  <!-- 授权类型标签 -->
                  <span class="px-3 py-1.5 rounded-full text-sm font-medium"
                    :class="{
                      'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300': software.license === '收费' || software.license === '已购',
                      'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-200': software.license === '免费',
                      'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300': software.license === '开源'
                    }">
                    {{ software.license }}
                  </span>
                  <!-- 支持系统 -->
                  <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{{ (software.systems || []).slice(0, 2).join(' · ') }}</span>
                  </div>
                  <!-- 关闭按钮 -->
                  <button
                    @click="$emit('update:isOpen', false)"
                    class="p-2 rounded-lg transition-all duration-200 
                           text-gray-600 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 
                           hover:text-gray-900 dark:hover:text-white
                           focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                    title="关闭"
                    aria-label="关闭"
                  >
                    <X class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- 导航标签页 -->
              <div class="flex items-center gap-1 px-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  class="px-4 py-3 text-sm font-medium transition-colors duration-200 relative"
                  :class="[
                    activeTab === tab.id
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                >
                  {{ tab.label }}
                  <span
                    v-if="activeTab === tab.id"
                    class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                  ></span>
                </button>
              </div>

              <!-- 内容区域 -->
              <div class="flex-1 overflow-y-auto p-6">
                <!-- 概览页 -->
                <div v-if="activeTab === 'overview'" class="space-y-6">
                  <!-- 产品描述 -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">产品描述</h3>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                      {{ software.description || '暂无描述' }}
                    </p>
                  </div>

                  <!-- 核心特性 -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">核心特性</h3>
                    <div class="grid grid-cols-2 gap-4">
                      <div
                        v-for="(feature, index) in coreFeatures"
                        :key="index"
                        class="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                      >
                        <div class="text-base font-medium text-gray-900 dark:text-white mb-1">
                          {{ feature.title }}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          {{ feature.subtitle }}
                        </div>
                      </div>
                      <div
                        v-if="coreFeatures.length === 0"
                        class="col-span-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400"
                      >
                        暂无核心特性
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 对比分析页 -->
                <div v-if="activeTab === 'comparison'" class="space-y-4">
                  <!-- 加载状态 -->
                  <div v-if="isLoadingComparison" class="flex items-center justify-center py-16">
                    <div class="flex flex-col items-center gap-3">
                      <div class="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
                      <span class="text-sm text-gray-500 dark:text-gray-400">正在加载对比数据...</span>
                    </div>
                  </div>

                  <!-- 空状态 -->
                  <div v-else-if="!comparedSoftwares.length" class="flex flex-col items-center justify-center py-16 text-center">
                    <div class="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                      <FileSearch class="w-10 h-10 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无对比信息</h3>
                  <p
                    v-if="isSignedIn"
                    class="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6"
                  >
                    目前还没有与 "{{ software.name }}" 的对比信息，点击下方按钮开始创建对比。
                  </p>
                  <BaseButton
                    v-if="isSignedIn"
                      @click="showComparisonManager = true"
                      variant="primary"
                      size="md"
                    >
                      <Plus class="w-4 h-4" />
                      创建比较
                    </BaseButton>
                  </div>

                  <!-- 对比表格 -->
                  <template v-else>
                    <!-- 操作栏 -->
                    <div v-if="isSignedIn" class="flex items-center justify-between mb-4 px-1">
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        共 {{ comparedSoftwares.length + 1 }} 个软件参与对比
                      </div>
                      <BaseButton
                        @click="showComparisonManager = true"
                        variant="secondary"
                        size="sm"
                      >
                        <Edit class="w-4 h-4" />
                        编辑对比分析
                      </BaseButton>
                    </div>
                    <div class="relative">
                      <div
                        ref="cardScrollRef"
                        class="scroll-mask flex flex-nowrap gap-4 overflow-x-auto py-2 pl-3 pr-4 cursor-grab"
                        :class="{'dragging': isDragging}"
                        @pointerdown="onDragStart"
                        @pointermove="onDragMove"
                        @pointerup="onDragEnd"
                        @pointercancel="onDragEnd"
                        @pointerleave="onDragEnd"
                      >
                        <div class="shrink-0 w-1"></div>
                        <div
                          v-for="sw in [software, ...comparedSoftwares]"
                          :key="sw.id"
                          :class="[
                            'compare-card flex-none flex flex-col gap-4 p-5 rounded-2xl border shadow-sm transition-shadow bg-white dark:bg-gray-800 min-w-[320px] max-w-[360px]',
                            'border-gray-200 dark:border-gray-700'
                          ]"
                        >
                          <div class="flex items-start gap-3">
                            <div class="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                              <img 
                                :src="getIconUrl(sw.icon)" 
                                :alt="sw.name" 
                                class="w-full h-full object-cover" 
                              />
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-start justify-between gap-2">
                                <div class="font-semibold text-base text-gray-900 dark:text-white leading-tight truncate">
                                  {{ sw.name }}
                                </div>
                                <span class="flex-shrink-0 inline-flex px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
                                  :class="{
                                    'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200': sw.license === '免费',
                                    'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200': sw.license === '收费',
                                    'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200': sw.license === '开源',
                                    'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200': sw.license === '已购'
                                  }">
                                  {{ sw.license }}
                                </span>
                              </div>
                              <a
                                v-if="sw.website"
                                :href="sw.website"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mt-1"
                              >
                                <ExternalLink class="w-3.5 h-3.5" />
                                访问官网
                              </a>
                            </div>
                          </div>

                          <div class="space-y-2">
                            <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              支持系统
                            </div>
                            <div class="flex flex-wrap gap-2">
                              <span 
                                v-for="sys in sw.systems" 
                                :key="sys"
                                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/70 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
                              >
                                <SystemIcon :system="sys" class="w-4 h-4" />
                                {{ sys }}
                              </span>
                              <span v-if="!sw.systems?.length" class="text-xs text-gray-400 dark:text-gray-500">
                                暂无
                              </span>
                            </div>
                          </div>

                          <div class="space-y-2">
                            <div class="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                              <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              优点
                            </div>
                            <div class="space-y-2">
                              <div 
                                v-for="(pro, index) in (sw.pros || [])" 
                                :key="index" 
                                class="flex items-start gap-2 text-sm leading-relaxed"
                              >
                                <div class="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                                <span class="text-gray-800 dark:text-gray-200 flex-1">{{ pro }}</span>
                              </div>
                              <div v-if="!sw.pros?.length" class="text-xs text-gray-400 dark:text-gray-500">
                                暂无
                              </div>
                            </div>
                          </div>

                          <div class="space-y-2">
                            <div class="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                              <span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              缺点
                            </div>
                            <div class="space-y-2">
                              <div 
                                v-for="(con, index) in (sw.cons || [])" 
                                :key="index" 
                                class="flex items-start gap-2 text-sm leading-relaxed"
                              >
                                <div class="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                                <span class="text-gray-800 dark:text-gray-200 flex-1">{{ con }}</span>
                              </div>
                              <div v-if="!sw.cons?.length" class="text-xs text-gray-400 dark:text-gray-500">
                                暂无
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-if="comparisonSummary" class="mt-2">
                      <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                        <div class="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700/70">
                          <div class="h-4 w-1.5 rounded-full bg-blue-500"></div>
                          <h4 class="text-base font-semibold text-gray-900 dark:text-white leading-tight">综合分析</h4>
                        </div>
                        <div class="px-5 pb-5 pt-4">
                          <div v-html="renderedSummary" class="prose prose-sm dark:prose-invert max-w-none markdown-content"></div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- 详细信息页 -->
                <div v-if="activeTab === 'details'" class="space-y-6">
                  <!-- 详细优势 -->
                  <div>
                    <h3 class="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 class="w-5 h-5" />
                      详细优势
                    </h3>
                    <ol class="space-y-3 list-decimal list-inside">
                      <li
                        v-for="(pro, index) in software.pros"
                        :key="index"
                        class="text-gray-600 dark:text-gray-400"
                      >
                        {{ pro }}
                      </li>
                      <li v-if="!software.pros?.length" class="text-gray-500 dark:text-gray-400 italic">
                        暂无优势记录
                      </li>
                    </ol>
                  </div>

                  <!-- 详细劣势 -->
                  <div>
                    <h3 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                      <XCircle class="w-5 h-5" />
                      详细劣势
                    </h3>
                    <ol class="space-y-3 list-decimal list-inside">
                      <li
                        v-for="(con, index) in software.cons"
                        :key="index"
                        class="text-gray-600 dark:text-gray-400"
                      >
                        {{ con }}
                      </li>
                      <li v-if="!software.cons?.length" class="text-gray-500 dark:text-gray-400 italic">
                        暂无劣势记录
                      </li>
                    </ol>
                  </div>
                </div>

                <!-- 私密信息标签页 -->
                <div v-if="activeTab === 'private'" class="space-y-6">
                  <!-- 安装包 / 下载链接 -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">安装包 / 下载链接</h3>
                    <div v-if="hasDownloadLinks" class="space-y-3">
                      <div v-for="(link, idx) in (software.download_links || [])" :key="link.id" class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div class="flex flex-col gap-3">
                          <div class="flex items-center justify-between gap-2">
                            <div class="text-sm text-gray-700 dark:text-gray-300">
                              <span class="font-semibold">{{ getProviderLabel(link.provider) }}</span>
                              <span v-if="link.versionLabel" class="ml-2 text-gray-500 dark:text-gray-400">{{ link.versionLabel }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <BaseButton
                                @click="copyLinkShare(link)"
                                variant="secondary"
                                size="sm"
                              >
                                <Copy class="w-4 h-4" />
                                复制
                              </BaseButton>
                              <BaseButton
                                :href="link.url"
                                tag="a"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="primary"
                                size="sm"
                              >
                                <ExternalLink class="w-4 h-4" />
                                打开
                              </BaseButton>
                            </div>
                          </div>
                          <div class="text-xs text-gray-600 dark:text-gray-400 break-all">
                            链接：<a :href="link.url" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-600 dark:hover:text-blue-400">{{ link.url }}</a>
                          </div>
                          <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div v-if="link.code" class="flex items-center gap-1">
                              <span class="font-medium">提取码：</span>
                              <span class="font-mono">{{ link.code }}</span>
                            </div>
                            <div v-if="link.password" class="flex items-center gap-1">
                              <span class="font-medium">解压密码：</span>
                              <span class="font-mono">{{ link.password }}</span>
                            </div>
                            <div v-if="link.notes" class="md:col-span-3">
                              <span class="font-medium">备注：</span>
                              {{ link.notes }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="p-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center">
                      <div class="text-gray-500 dark:text-gray-400">暂无下载链接</div>
                    </div>
                  </div>

                  <!-- 私密信息 -->
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">私密信息</h3>
                    <div v-if="hasSecrets" class="space-y-3">
                      <div v-for="sec in (software.secrets || [])" :key="sec.id" class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div class="flex items-center justify-between mb-2">
                          <div class="flex items-center gap-2">
                            <span
                              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              :class="getSecretKindClass(sec.kind)"
                            >
                              {{ getSecretKindLabel(sec.kind) }}
                            </span>
                            <span v-if="sec.expiresAt" class="text-xs text-gray-500 dark:text-gray-400">到期：{{ sec.expiresAt }}</span>
                          </div>
                          <BaseButton
                            @click="copySecret(sec)"
                            variant="secondary"
                            size="sm"
                          >
                            <Copy class="w-4 h-4" />
                            复制
                          </BaseButton>
                        </div>
                        <div v-if="sec.label" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {{ sec.label }}
                        </div>
                        <div v-if="sec.notes" class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          备注：{{ sec.notes }}
                        </div>
                      </div>
                    </div>
                    <div v-else class="p-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center">
                      <div class="text-gray-500 dark:text-gray-400">暂无私密信息</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 底部操作区 -->
              <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                  <BaseButton
                    v-if="software.website"
                    @click="openWebsite"
                    variant="primary"
                    class="rounded-full"
                  >
                    <ExternalLink class="w-4 h-4" />
                    访问官网
                  </BaseButton>
                  <BaseButton
                    @click="copyMarkdownCard"
                    variant="secondary"
                  >
                    <Copy class="w-4 h-4" />
                    复制 Markdown
                  </BaseButton>
                  <BaseButton
                    @click="generateShareImage"
                    variant="secondary"
                  >
                    预览分享图片
                  </BaseButton>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
  <Toast :show="showToast" message="复制成功" />
  <slot name="after-content"></slot>
  <!-- 隐藏的分享卡片，用于截图导出图片 -->
  <div ref="shareCardRef" class="fixed -left-[9999px] top-0 w-[720px] p-8 bg-white text-gray-900">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-gray-200">
        <img :src="getIconUrl(software.icon)" crossorigin="anonymous" alt="icon" class="w-full h-full object-cover" />
      </div>
      <div>
        <div class="text-2xl font-bold">{{ software.name }}</div>
        <div class="text-sm text-gray-500 mt-1">{{ software.category }} · {{ software.license }} · {{ (software.systems||[]).join(' / ') }}</div>
        <div v-if="software.website" class="text-sm text-blue-600 mt-1">{{ software.website }}</div>
      </div>
    </div>
    <div v-if="software.description" class="mb-6">
      <div class="text-sm text-gray-700 whitespace-pre-wrap">{{ software.description }}</div>
    </div>
    <div class="grid grid-cols-2 gap-6">
      <div>
        <div class="font-semibold text-green-600 mb-2">优点</div>
        <ul class="list-disc list-inside text-sm text-gray-800 space-y-1">
          <li v-for="(pro, i) in (software.pros || [])" :key="'pro-'+i">{{ pro }}</li>
          <li v-if="!(software.pros||[]).length" class="text-gray-400">暂无</li>
        </ul>
      </div>
      <div>
        <div class="font-semibold text-red-600 mb-2">缺点</div>
        <ul class="list-disc list-inside text-sm text-gray-800 space-y-1">
          <li v-for="(con, i) in (software.cons || [])" :key="'con-'+i">{{ con }}</li>
          <li v-if="!(software.cons||[]).length" class="text-gray-400">暂无</li>
        </ul>
      </div>
    </div>
    <div class="mt-8 text-xs text-gray-400">由 AppArchive 生成 · {{ new Date().toLocaleDateString() }}</div>
  </div>

  <!-- 统一分享预览组件 -->
  <ShareCardPreview
    v-model:is-open="showSharePreview"
    mode="detail"
    :detail="{ software }"
    default-theme="classic"
    :default-show-website="false"
    :default-show-systems="false"
  />

  <!-- 对比管理弹窗 -->
  <ComparisonManager
    :isOpen="showComparisonManager"
    :software="software"
    @update:isOpen="handleComparisonManagerClose"
  />
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { CheckCircle2, Copy, Edit, ExternalLink, FileSearch, Plus, X, XCircle } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { copyToClipboard } from '@/utils/clipboard'
import { getIconUrl } from '../services/localIconCache'
import type { DownloadLink, SecretItem, Software } from '../types'
import logger from '../utils/logger'
import { getSecretKindClass, getSecretKindLabel } from '../utils/secret'
import SystemIcon from './SystemIcon.vue'
import Toast from './Toast.vue'

// 延迟加载 html-to-image，只在需要时加载（提升首次打开速度）
// @ts-expect-error: html-to-image 类型声明在当前环境缺失
let toPng: typeof import('html-to-image').toPng | null = null
const loadToPng = async () => {
  if (!toPng) {
    const module = await import('html-to-image')
    toPng = module.toPng
  }
  return toPng
}

import MarkdownIt from 'markdown-it'
import { isSignedIn } from '../lib/clerk'
import { comparisonService } from '../services/comparison'
import ComparisonManager from './ComparisonManager.vue'
import BaseButton from './common/BaseButton.vue'
import IconButton from './common/IconButton.vue'
import ShareCardPreview from './ShareCardPreview.vue'

const props = defineProps<{
  isOpen: boolean
  software: Software
}>()

// 标签页管理
type TabId = 'overview' | 'comparison' | 'details' | 'private'
const activeTab = ref<TabId>('overview')

const tabs = computed(() => {
  const baseTabs = [
    { id: 'overview' as TabId, label: '概览' },
    { id: 'details' as TabId, label: '详细信息' },
    { id: 'comparison' as TabId, label: '对比分析' }
  ]
  // 如果用户已登录，添加私密信息标签页
  if (isSignedIn.value) {
    baseTabs.push({ id: 'private' as TabId, label: '私密信息' })
  }
  return baseTabs
})

// 核心特性：将前4个pros转换为特性卡片格式
const coreFeatures = computed(() => {
  const pros = props.software.pros || []
  // 取前4个作为核心特性
  return pros.slice(0, 4).map((pro, _index) => {
    // 尝试从pros文本中提取标题和副标题
    // 如果包含"："，则分割；否则使用整个文本作为标题
    const parts = pro.split('：')
    if (parts.length >= 2) {
      return {
        title: parts[0],
        subtitle: parts.slice(1).join('：')
      }
    }
    // 如果没有分隔符，尝试用逗号分割
    const commaParts = pro.split('，')
    if (commaParts.length >= 2) {
      return {
        title: commaParts[0],
        subtitle: commaParts.slice(1).join('，')
      }
    }
    // 默认：前20个字符作为标题，剩余作为副标题
    const title = pro.length > 20 ? `${pro.substring(0, 20)}...` : pro
    const subtitle = pro.length > 20 ? pro.substring(20) : ''
    return {
      title,
      subtitle: subtitle || '核心功能特性'
    }
  })
})

// 对比分析数据
const isLoadingComparison = ref(false)
const comparedSoftwares = ref<Software[]>([])
const comparisonSummary = ref('')
const showComparisonManager = ref(false)
const cardScrollRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let dragStartX = 0
let dragStartScrollLeft = 0

// Markdown渲染器 - 延迟初始化，只在需要时创建（提升首次打开速度）
let md: MarkdownIt | null = null
const getMarkdownRenderer = () => {
  if (!md) {
    md = new MarkdownIt({
      html: false,
      breaks: true,
      linkify: true
    })
  }
  return md
}

// 加载对比数据
const loadComparisons = async () => {
  try {
    isLoadingComparison.value = true
    if (!props.software?.id) return

    // 获取与该软件相关的其他软件
    const comparisons = await comparisonService.getComparisons(props.software.id)
    comparedSoftwares.value = comparisons

    // 如果有比较数据，获取第一个组的分析内容
    if (comparisons.length > 0 && comparisons[0].groupInfo?.id) {
      const analysis = await comparisonService.getComparisonAnalysis(comparisons[0].groupInfo.id)
      comparisonSummary.value = analysis || ''
    }
  } catch (error) {
    logger.error('加载对比数据失败:', error)
  } finally {
    isLoadingComparison.value = false
  }
}

// 渲染Markdown
const renderedSummary = computed(() => {
  return comparisonSummary.value 
    ? getMarkdownRenderer().render(comparisonSummary.value)
    : ''
})

// 监听标签页切换，切换到对比分析时加载数据
watch(activeTab, (newTab) => {
  if (newTab === 'comparison' && !comparedSoftwares.value.length && !isLoadingComparison.value) {
    loadComparisons()
  }
})

// 监听弹窗打开，重置为概览标签页
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // 每次打开弹窗时，重置为概览标签页
    activeTab.value = 'overview'
  } else {
    // 关闭弹窗时，清空对比数据
    comparedSoftwares.value = []
    comparisonSummary.value = ''
  }
})

// 监听登录状态，如果未登录且当前在私密信息标签页，则切换回概览
watch(() => isSignedIn.value, (signedIn) => {
  if (!signedIn && activeTab.value === 'private') {
    activeTab.value = 'overview'
  }
})

// 静默刷新对比数据（不显示加载状态）
const refreshComparisonsSilently = async () => {
  try {
    if (!props.software?.id) return

    // 获取与该软件相关的其他软件
    const comparisons = await comparisonService.getComparisons(props.software.id)
    comparedSoftwares.value = comparisons

    // 如果有比较数据，获取第一个组的分析内容
    if (comparisons.length > 0 && comparisons[0].groupInfo?.id) {
      const analysis = await comparisonService.getComparisonAnalysis(comparisons[0].groupInfo.id)
      comparisonSummary.value = analysis || ''
    } else {
      comparisonSummary.value = ''
    }
  } catch (error) {
    logger.error('刷新对比数据失败:', error)
  }
}

const onDragStart = (e: PointerEvent) => {
  const el = cardScrollRef.value
  if (!el || e.button !== 0) return
  isDragging.value = true
  dragStartX = e.clientX
  dragStartScrollLeft = el.scrollLeft
  el.setPointerCapture(e.pointerId)
}

const onDragMove = (e: PointerEvent) => {
  if (!isDragging.value) return
  const el = cardScrollRef.value
  if (!el) return
  e.preventDefault()
  const delta = e.clientX - dragStartX
  el.scrollLeft = dragStartScrollLeft - delta
}

const onDragEnd = (e: PointerEvent) => {
  if (!isDragging.value) return
  const el = cardScrollRef.value
  if (el && e.pointerId) {
    try { el.releasePointerCapture(e.pointerId) } catch {}
  }
  isDragging.value = false
  // 结束时将滚动位置约束到范围内
  if (el) {
    if (el.scrollLeft < 0) el.scrollLeft = 0
    const max = el.scrollWidth - el.clientWidth
    if (el.scrollLeft > max) el.scrollLeft = max
  }
}

// 处理对比管理弹窗关闭
const handleComparisonManagerClose = async (isOpen: boolean) => {
  const wasOpen = showComparisonManager.value
  showComparisonManager.value = isOpen
  
  // 如果弹窗关闭且当前在对比分析标签页，静默刷新对比数据
  if (!isOpen && wasOpen && activeTab.value === 'comparison') {
    // 等待 DOM 更新和关闭动画完成
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 300))
    // 再次检查状态，确保弹窗仍然打开且仍在对比分析标签页
    if (props.isOpen && activeTab.value === 'comparison') {
      await refreshComparisonsSilently()
    }
  }
}

// 统一按钮样式已提取为通用组件 BaseButton / IconButton

const openWebsite = () => {
  if (props.software.website) {
    window.open(props.software.website, '_blank')
  }
}

const showToast = ref(false)

const copySoftwareName = async () => {
  try {
    await copyToClipboard(props.software.name)
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000) // 2秒后自动隐藏
  } catch (err) {
    logger.error('复制失败:', err)
  }
}

// ===== 下载/网盘：展示与操作 =====
const hasDownloadLinks = computed(() => Array.isArray(props.software.download_links) && props.software.download_links.length > 0)

const getProviderLabel = (provider: DownloadLink['provider']) => {
  switch (provider) {
    case 'baidu': return '百度网盘'
    case 'quark': return '夸克网盘'
    case 'lanzou': return '蓝奏云'
    case 'aliyun': return '阿里云盘'
    case '115': return '115网盘'
    case 'magnet': return '磁力链接'
    case 'ed2k': return 'ED2K'
    case 'official': return '官方直链'
    default: return '其他'
  }
}

const buildShareText = (link: DownloadLink) => {
  const parts: string[] = [props.software.name, `链接：${link.url}`]
  if (link.code) parts.push(`提取码：${link.code}`)
  if (link.password) parts.push(`解压密码：${link.password}`)
  if (link.versionLabel) parts.push(`版本：${link.versionLabel}`)
  if (link.notes) parts.push(`备注：${link.notes}`)
  return parts.join('\n')
}

const copyLinkShare = async (link: DownloadLink) => {
  try {
    await copyToClipboard(buildShareText(link))
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 2000)
  } catch (err) {
    logger.error('复制失败:', err)
  }
}

// ===== 私密信息：展示与解锁复制（未登录隐藏） =====
const hasSecrets = computed(() => isSignedIn.value && Array.isArray(props.software.secrets) && props.software.secrets.length > 0)

const masked = (sec: SecretItem) => {
  // 前端不持有明文，只做展示占位
  return sec.hasValue ? '••••••••' : '（无）'
}

// 使用 utils/secret 中的通用函数

const showSecretToast = () => {
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2000)
}

const fetchSecretValue = async (secretId: string) => {
  const res = await fetch(`${location.origin.replace(/:\d+$/, '')}:${import.meta.env.VITE_SERVER_PORT || '3001'}/api/software/${props.software.id}/secret/${secretId}`)
  if (!res.ok) throw new Error('获取密钥失败')
  const data = await res.json()
  return data.value as string
}

const copySecret = async (sec: SecretItem) => {
  try {
    const value = await fetchSecretValue(sec.id)
    await copyToClipboard(value)
    showSecretToast()
  } catch (err) {
    logger.error('复制密钥失败:', err)
  }
}

// ===== 分享：Markdown 与 图片快照 =====
const shareCardRef = ref<HTMLElement | null>(null)
const sharePreviewRef = ref<HTMLElement | null>(null)
const shareExportRef = ref<HTMLElement | null>(null)
const showSharePreview = ref(false)
const selectedTheme = ref<'classic' | 'dark' | 'gradient'>('classic')
const showWebsiteInShare = ref(true)
const showSystemsInShare = ref(true)
const coverStyle = ref<'none' | 'texture' | 'brand'>('none')

// 标签功能暂不启用

// 顶部元信息行：是否展示系统由开关控制
const metaLine = computed(() => {
  const base = `${props.software.category} · ${props.software.license}`
  const sys = Array.isArray(props.software.systems) ? props.software.systems.join(' / ') : ''
  return showSystemsInShare.value && sys ? `${base} · ${sys}` : base
})

// 背景纹理/品牌感（简易实现）：
const coverStyleCss = computed(() => {
  if (coverStyle.value === 'texture') {
    return {
      backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.15), transparent 40%), radial-gradient(circle at 80% 30%, rgba(255,255,255,.12), transparent 45%), radial-gradient(circle at 30% 80%, rgba(255,255,255,.1), transparent 40%)'
    }
  }
  if (coverStyle.value === 'brand') {
    return {
      backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,.20), rgba(236,72,153,.15))'
    }
  }
  return {}
})

const buildMarkdownCard = (s: Software) => {
  const lines: string[] = []
  lines.push(`### ${s.name}`)
  if (s.website) lines.push(`- 官网: ${s.website}`)
  lines.push(`- 类别: ${s.category}`)
  lines.push(`- 授权: ${s.license}`)
  if (Array.isArray(s.systems) && s.systems.length) lines.push(`- 系统: ${s.systems.join(', ')}`)
  lines.push('')
  lines.push('#### 优点')
  if (Array.isArray(s.pros) && s.pros.length) {
    s.pros.forEach(p => lines.push(`- ${p}`))
  } else {
    lines.push('- 暂无')
  }
  lines.push('')
  lines.push('#### 缺点')
  if (Array.isArray(s.cons) && s.cons.length) {
    s.cons.forEach(c => lines.push(`- ${c}`))
  } else {
    lines.push('- 暂无')
  }
  return lines.join('\n')
}

const copyMarkdownCard = async () => {
  try {
    const md = buildMarkdownCard(props.software)
    await copyToClipboard(md)
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 2000)
  } catch (err) {
    logger.error('复制 Markdown 失败:', err)
  }
}

const generateShareImage = async () => {
  showSharePreview.value = true
}

// 等待字体与图片资源就绪，减少导出差异
const ensureAssetsReady = async (el: HTMLElement) => {
  try {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready
    }
  } catch {}
  const imgs = Array.from(el.querySelectorAll('img')).filter(img => !img.complete)
  if (imgs.length) {
    await Promise.all(imgs.map(img => new Promise<void>(res => {
      img.onload = () => res()
      img.onerror = () => res()
    })))
  }
}

const saveSharePreviewImage = async () => {
  try {
    const el = (shareExportRef.value || sharePreviewRef.value) as HTMLElement | null
    if (!el) return
    await ensureAssetsReady(el)
    // 动态加载 toPng 函数
    const toPngFn = await loadToPng()
    const dataUrl = await toPngFn(el, {
      cacheBust: true,
      pixelRatio: Math.max(2, window.devicePixelRatio || 1),
      style: { transform: 'none', zoom: '1' }
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${props.software.name}-分享卡片.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) {
    logger.error('生成分享图片失败:', err)
  }
}

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const initialFocusRef = ref<HTMLElement | null>(null)

// 名称展示逻辑已简化为仅显示类型，不再显示 label，故移除相关辅助函数
const handleDetailClose = () => {
  // 关键：当子预览打开时，忽略父弹窗的外点/ESC 关闭事件，避免误关子弹窗
  if (showSharePreview.value) return
  emit('update:isOpen', false)
}
</script>

<style scoped>
/* Markdown内容样式 */
.markdown-content {
  @apply text-gray-700 dark:text-gray-300;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  @apply font-semibold text-gray-900 dark:text-white my-3;
}

.markdown-content :deep(p) {
  @apply my-2 leading-relaxed;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  @apply pl-6 my-2;
}

.markdown-content :deep(ul) {
  @apply list-disc;
}

.markdown-content :deep(ol) {
  @apply list-decimal;
}

.markdown-content :deep(a) {
  @apply text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline;
}

.markdown-content :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono;
}

.markdown-content :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-3;
}

.markdown-content :deep(pre code) {
  @apply bg-transparent p-0;
}

.markdown-content :deep(blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-3 italic;
}

.scroll-mask {
  /* 渐隐遮罩，提示可横向滚动 */
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    black 12px,
    black calc(100% - 12px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    black 12px,
    black calc(100% - 12px),
    transparent 100%
  );
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Edge/IE */
  scroll-padding-inline: 12px;
}
.scroll-mask::-webkit-scrollbar {
  height: 0;
  width: 0;
  background: transparent;
}

.scroll-mask {
  cursor: grab;
}
.scroll-mask.dragging {
  cursor: grabbing;
  user-select: none;
}

.summary-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
}
.summary-scroll::-webkit-scrollbar {
  width: 8px;
}
.summary-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.5);
  border-radius: 9999px;
}
.summary-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.7);
}
</style> 