<template>
  <TransitionRoot :show="isOpen" as="template" @after-leave="afterLeave">
    <Dialog 
      as="div" 
      class="relative z-50" 
      @close="handleDetailClose"
      :open="isOpen"
    >
      <!-- 使用一个视觉不可见但可聚焦的元素作为初始焦点，避免 focus trap 问题 -->
      <div ref="initialFocusRef" tabindex="0" class="fixed top-0 left-0 w-px h-px opacity-0 overflow-hidden outline-none" aria-hidden="true" />
      
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel 
              ref="dialogPanelRef"
              :initialFocus="initialFocusRef"
              :class="isOpen ? '!opacity-100 !translate-y-0 !sm:scale-100' : ''"
              @click.stop
              @mousedown.stop
              @mouseup.stop
              @pointerdown.stop
              @pointerup.stop
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
              class="relative transform overflow-hidden 
                     bg-white dark:bg-[#171f2e] 
                     text-left shadow-2xl ring-1 ring-gray-900/5
                     w-screen sm:w-[90vw] sm:max-w-[1000px] h-[95vh] sm:h-[85vh]
                     rounded-t-lg sm:rounded-lg
                     flex flex-col will-change-transform"
            >
              <!-- 顶部区域：头部信息与标签页 -->
              <div class="flex-shrink-0 bg-white dark:bg-[#171f2e] z-10 relative">
                <!-- 头部信息 -->
                <div class="p-5 sm:p-8 pb-0 sm:pb-0">
                  <div class="flex flex-col sm:flex-row gap-5 sm:gap-8">
                    <!-- 图标 -->
                    <div class="flex-shrink-0 mx-auto sm:mx-0">
                      <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 relative">
                        <img
                          :src="getIconUrl(software.icon)"
                          :alt="software.name"
                          class="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          referrerpolicy="origin"
                        />
                      </div>
                    </div>

                    <!-- 主要信息 -->
                    <div class="flex-1 text-center sm:text-left min-w-0">
                      <div class="flex items-center justify-center sm:justify-between gap-4">
                        <DialogTitle as="h3" class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate tracking-tight">
                          {{ software.name }}
                        </DialogTitle>
                        
                        <!-- 桌面端关闭按钮 -->
                        <div class="hidden sm:flex items-center gap-2">
                           <Tooltip content="关闭 (Esc)">
                            <button
                              @click="handleDetailCloseLogged"
                              class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                              <X class="w-6 h-6" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>

                      <!-- 元数据行 -->
                      <div class="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                         <!-- 版本 (Mock if needed, or from download link) -->
                         <div v-if="software.version" class="flex items-center gap-1.5">
                            <Tag class="w-4 h-4 text-gray-400" />
                            <span class="font-medium">{{ software.version }}</span>
                         </div>
                         
                         <!-- 评分 (Mock data or real if added) -->
                         <div v-if="software.rating" class="flex items-center gap-1.5">
                            <Star class="w-4 h-4 text-gray-400" />
                            <span class="font-medium text-gray-900 dark:text-gray-200">{{ software.rating }}</span>
                         </div>
                         
                         <!-- 下载量 (Mock data or real if added) -->
                         <div v-if="software.downloads" class="flex items-center gap-1.5">
                            <DownloadCloud class="w-4 h-4 text-gray-400" />
                            <span>{{ formatNumber(software.downloads) }} 次下载</span>
                         </div>

                         <!-- 类别 -->
                         <div class="flex items-center gap-1.5">
                            <FolderOpen class="w-4 h-4 text-gray-400" />
                            <span>{{ software.category }}</span>
                         </div>
                      </div>

                      <!-- 标签与操作行 -->
                      <div class="mt-5 flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
                         <div class="flex flex-wrap items-center justify-center gap-2">
                            <!-- 授权标签 -->
                            <span class="px-3 py-1 rounded-md text-xs font-semibold ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                              {{ software.license }}
                            </span>
                            
                            <!-- 系统标签 -->
                            <div class="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                                <Monitor class="w-3.5 h-3.5" />
                                <span>{{ (software.systems || []).slice(0, 3).join(' · ') }}</span>
                            </div>
                         </div>

                         <!-- 主要操作按钮 -->
                         <div class="flex items-center gap-3">
                            <Tooltip v-if="software.website" content="访问官方网站">
                                <BaseButton
                                    @click="openWebsite"
                                    variant="primary"
                                    size="md"
                                    class="rounded-md shadow-sm"
                                >
                                    <ExternalLink class="w-4 h-4" />
                                    <span class="hidden sm:inline">访问官网</span>
                                </BaseButton>
                            </Tooltip>

                            <Tooltip content="分享软件信息">
                                <BaseButton
                                    @click="generateShareImage"
                                    variant="secondary"
                                    size="md"
                                    class="rounded-md"
                                >
                                    <Share2 class="w-4 h-4" />
                                </BaseButton>
                            </Tooltip>
                            
                            <!-- 移动端关闭按钮 (放在操作栏右侧) -->
                            <button
                                @click="handleDetailCloseLogged"
                                class="sm:hidden p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            >
                                <X class="w-5 h-5" />
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 导航标签页 -->
                <div class="mt-6 px-5 sm:px-8 border-b border-gray-200 dark:border-gray-800">
                   <div class="flex items-center gap-6 overflow-x-auto no-scrollbar">
                      <button
                        v-for="tab in tabs"
                        :key="tab.id"
                        @click="activeTab = tab.id"
                        class="pb-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap outline-none select-none"
                        :class="[
                            activeTab === tab.id
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        ]"
                        >
                        {{ tab.label }}
                        <span
                            v-if="activeTab === tab.id"
                            class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white rounded-t-full"
                            layoutId="activeTabIndicator"
                        ></span>
                      </button>
                   </div>
                </div>
              </div>

              <!-- 内容滚动区域 -->
              <div class="flex-1 overflow-y-auto p-5 sm:p-8 bg-gray-50/50 dark:bg-transparent scroll-smooth" :key="software.id">
                
                <!-- 概览页 -->
                <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="opacity-0 translate-y-4"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition duration-200 ease-in absolute w-full"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 translate-y-4"
                >
                <div v-if="activeTab === 'overview'" class="space-y-8 max-w-4xl mx-auto">
                  <!-- 产品描述 -->
                  <section class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        关于软件
                    </h3>
                    <div class="relative">
                        <p class="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-base"
                           :class="{'line-clamp-4': !isDescriptionExpanded && showExpandButton}">
                           {{ software.description || '暂无描述' }}
                        </p>
                        <button 
                            v-if="showExpandButton"
                            @click="isDescriptionExpanded = !isDescriptionExpanded"
                            class="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            {{ isDescriptionExpanded ? '收起描述' : '展开全部' }}
                            <ChevronDown class="w-4 h-4 transition-transform" :class="{'rotate-180': isDescriptionExpanded}" />
                        </button>
                    </div>
                  </section>

                  <!-- 核心特性 -->
                  <section>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 px-1">
                        核心特性
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        v-for="(feature, index) in coreFeatures"
                        :key="index"
                        class="p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow duration-300"
                      >
                        <div class="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                          {{ feature.title }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          {{ feature.subtitle }}
                        </div>
                      </div>
                      <div
                        v-if="coreFeatures.length === 0"
                        class="col-span-full py-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700"
                      >
                        暂无核心特性记录
                      </div>
                    </div>
                  </section>
                </div>

                <!-- 详细信息页 -->
                <div v-else-if="activeTab === 'details'" class="space-y-8 max-w-4xl mx-auto">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- 优势 -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                优点
                            </h3>
                            <ul class="space-y-3">
                                <li v-for="(pro, idx) in software.pros" :key="idx" class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                    <CheckCircle2 class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                    <span>{{ pro }}</span>
                                </li>
                                <li v-if="!software.pros?.length" class="text-gray-400 italic">暂无记录</li>
                            </ul>
                        </div>
                        
                        <!-- 劣势 -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                缺点
                            </h3>
                            <ul class="space-y-3">
                                <li v-for="(con, idx) in software.cons" :key="idx" class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                    <XCircle class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                    <span>{{ con }}</span>
                                </li>
                                <li v-if="!software.cons?.length" class="text-gray-400 italic">暂无记录</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- 对比分析页 -->
                <div v-else-if="activeTab === 'comparison'" class="max-w-6xl mx-auto">
                   <!-- 保留原有对比逻辑，优化样式 -->
                   <div v-if="isLoadingComparison" class="flex items-center justify-center py-24">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-10 h-10 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span class="text-gray-500 font-medium">正在分析对比数据...</span>
                        </div>
                   </div>

                   <div v-else-if="!comparedSoftwares.length" class="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        <div class="w-16 h-16 mb-6 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center">
                            <FileSearch class="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">暂无对比信息</h3>
                        <p class="text-gray-500 max-w-md mb-8">还没有与该软件相关的对比数据，您可以创建新的对比组。</p>
                        <BaseButton v-if="isSignedIn" @click="showComparisonManager = true" variant="primary" size="lg">
                            <Plus class="w-5 h-5" />
                            创建对比
                        </BaseButton>
                   </div>

                   <template v-else>
                        <!-- 对比卡片滚动区 -->
                        <div class="mb-8">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-bold text-gray-900 dark:text-white">对比概览</h3>
                                <BaseButton v-if="isSignedIn" @click="showComparisonManager = true" variant="ghost" size="sm">
                                    <Edit class="w-4 h-4" />
                                    编辑
                                </BaseButton>
                            </div>
                            
                            <div 
                                ref="cardScrollRef"
                                class="scroll-mask flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing"
                                @pointerdown="onDragStart"
                                @pointermove="onDragMove"
                                @pointerup="onDragEnd"
                                @pointerleave="onDragEnd"
                            >
                                <!-- 原有的对比卡片渲染逻辑，这里保留结构但优化样式 -->
                                <div
                                  v-for="sw in [software, ...comparedSoftwares]"
                                  :key="sw.id"
                                  class="flex-none w-[300px] bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
                                >
                                   <div class="flex items-center gap-3 mb-4">
                                        <img :src="getIconUrl(sw.icon)" class="w-10 h-10 rounded-lg bg-gray-100" />
                                        <div class="truncate font-bold text-gray-900 dark:text-white">{{ sw.name }}</div>
                                   </div>
                                   <div class="space-y-3 text-sm">
                                        <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                                            <span class="text-gray-500">授权</span>
                                            <span class="font-medium">{{ sw.license }}</span>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-gray-500 text-xs">支持系统</div>
                                            <div class="flex flex-wrap gap-1">
                                                <span v-for="s in sw.systems" :key="s" class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{{ s }}</span>
                                            </div>
                                        </div>
                                   </div>
                                </div>
                            </div>
                        </div>

                        <!-- 综合分析 -->
                        <div v-if="comparisonSummary" class="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700/50">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                综合分析
                            </h3>
                            <div v-html="renderedSummary" class="prose prose-blue dark:prose-invert max-w-none markdown-content"></div>
                        </div>
                   </template>
                </div>

                <!-- 私密信息页 -->
                <div v-else-if="activeTab === 'private'" class="space-y-8 max-w-4xl mx-auto">
                    <div class="grid gap-6">
                        <!-- 下载链接 -->
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                             <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                下载资源
                             </h3>
                             <div v-if="hasDownloadLinks" class="space-y-3">
                                <div v-for="link in software.download_links" :key="link.id" 
                                     class="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
                                     <div class="flex items-start justify-between gap-4">
                                        <div class="space-y-1">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-gray-900 dark:text-white">{{ getProviderLabel(link.provider) }}</span>
                                                <span v-if="link.versionLabel" class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{{ link.versionLabel }}</span>
                                            </div>
                                            <div class="text-xs text-gray-500 font-mono break-all">{{ link.url }}</div>
                                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                <span v-if="link.code">提取码: <span class="font-mono font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 px-1 rounded">{{ link.code }}</span></span>
                                                <span v-if="link.password">密码: <span class="font-mono font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 px-1 rounded">{{ link.password }}</span></span>
                                            </div>
                                        </div>
                                        <div class="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Tooltip content="复制链接信息">
                                                <IconButton @click="copyLinkShare(link)" icon="copy" />
                                            </Tooltip>
                                            <Tooltip content="打开链接">
                                                <BaseButton :href="link.url" tag="a" target="_blank" variant="primary" size="sm" class="!p-2 rounded-md">
                                                    <ExternalLink class="w-4 h-4" />
                                                </BaseButton>
                                            </Tooltip>
                                        </div>
                                     </div>
                                </div>
                             </div>
                             <div v-else class="text-center py-8 text-gray-400">暂无下载资源</div>
                        </div>

                        <!-- 敏感信息 -->
                        <div v-if="hasSecrets" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                             <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                私密数据
                             </h3>
                             <div class="space-y-3">
                                <div v-for="sec in software.secrets" :key="sec.id" class="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-900/10 border border-gray-100 dark:border-gray-700/50">
                                    <div>
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-xs font-bold uppercase px-1.5 py-0.5 rounded text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/40">{{ getSecretKindLabel(sec.kind) }}</span>
                                            <span class="font-medium text-gray-900 dark:text-white">{{ sec.label }}</span>
                                        </div>
                                        <div class="text-xs text-gray-500">{{ sec.notes || '点击复制查看明文' }}</div>
                                    </div>
                                    <BaseButton @click="copySecret(sec)" variant="secondary" size="sm" class="rounded-md">
                                        <Copy class="w-4 h-4" />
                                        复制
                                    </BaseButton>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
                </Transition>
              </div>

              <!-- 底部导航栏 -->
              <div class="flex-shrink-0 p-4 sm:p-5 bg-white dark:bg-[#171f2e] border-t border-gray-100 dark:border-gray-800 z-10">
                <div class="flex items-center justify-between max-w-5xl mx-auto w-full">
                    <Tooltip :content="hasPrev ? `上一个: ${prevSoftware?.name}` : '没有了'">
                        <button 
                            @click="navigateToPrev"
                            :disabled="!hasPrev"
                            class="group flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <div class="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors">
                                <ChevronLeft class="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div class="hidden sm:block text-left">
                                <div class="text-xs text-gray-500">上一个</div>
                                <div class="text-sm font-bold text-gray-900 dark:text-white max-w-[120px] truncate">{{ prevSoftware?.name || '无' }}</div>
                            </div>
                        </button>
                    </Tooltip>

                    <div class="text-xs font-medium text-gray-400 tabular-nums">
                        {{ currentIndex + 1 }} <span class="mx-1">/</span> {{ softwareList?.length || 1 }}
                    </div>

                    <Tooltip :content="hasNext ? `下一个: ${nextSoftware?.name}` : '没有了'">
                        <button 
                            @click="navigateToNext"
                            :disabled="!hasNext"
                            class="group flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <div class="hidden sm:block text-right">
                                <div class="text-xs text-gray-500">下一个</div>
                                <div class="text-sm font-bold text-gray-900 dark:text-white max-w-[120px] truncate">{{ nextSoftware?.name || '无' }}</div>
                            </div>
                            <div class="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors">
                                <ChevronRight class="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                        </button>
                    </Tooltip>
                </div>
              </div>
              
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>

  <Toast :show="showToast" message="操作成功" />
  
  <!-- 隐藏的分享卡片容器 (保持原有功能) -->
  <div ref="shareCardRef" class="fixed -left-[9999px] top-0 w-[720px] p-8 bg-white text-gray-900">
     <!-- ... content kept for html-to-image ... -->
      <div class="flex items-center gap-4 mb-6">
      <div class="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-gray-200">
        <img :src="getIconUrl(software.icon)" crossorigin="anonymous" alt="icon" class="w-full h-full object-cover" referrerpolicy="origin" />
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

  <ShareCardPreview
    v-model:is-open="showSharePreview"
    mode="detail"
    :detail="{ software }"
    default-theme="classic"
    :default-show-website="false"
    :default-show-systems="false"
  />

  <ComparisonManager
    :isOpen="showComparisonManager"
    :software="software"
    @update:isOpen="handleComparisonManagerClose"
  />
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { 
    CheckCircle2, ChevronLeft, ChevronRight, Copy, Edit, ExternalLink, 
    FileSearch, Plus, X, XCircle, Share2, Star, DownloadCloud, 
    FolderOpen, Monitor, ChevronDown, Tag
} from 'lucide-vue-next'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { copyToClipboard } from '@/utils/clipboard'
import { getIconUrl } from '../services/localIconCache'
import { buildApiUrl } from '../services/apiBase'
import type { DownloadLink, SecretItem, Software } from '../types'
import logger from '../utils/logger'
import { getSecretKindClass, getSecretKindLabel } from '../utils/secret'
import SystemIcon from './SystemIcon.vue'
import Toast from './Toast.vue'
import Tooltip from './common/Tooltip.vue' // New Component

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
  softwareList?: Software[]
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'navigate': [software: Software]
  'closed': []
}>()

// Tabs
type TabId = 'overview' | 'comparison' | 'details' | 'private'
const activeTab = ref<TabId>('overview')

const tabs = computed(() => {
  const baseTabs = [
    { id: 'overview' as TabId, label: '概览' },
    { id: 'details' as TabId, label: '详细信息' },
    { id: 'comparison' as TabId, label: '对比分析' }
  ]
  if (isSignedIn.value) {
    baseTabs.push({ id: 'private' as TabId, label: '私密信息' })
  }
  return baseTabs
})

// Description Expand
const isDescriptionExpanded = ref(false)
const descriptionThreshold = 200
const showExpandButton = computed(() => (props.software.description?.length || 0) > descriptionThreshold)

// Number formatter
const formatNumber = (num: number) => {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w'
    }
    return num.toString()
}

// ... existing navigation logic ...
const currentIndex = computed(() => {
  if (!props.softwareList || props.softwareList.length === 0) return -1
  return props.softwareList.findIndex(s => s.id === props.software.id)
})
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => props.softwareList && currentIndex.value >= 0 && currentIndex.value < props.softwareList.length - 1)
const prevSoftware = computed(() => hasPrev.value && props.softwareList ? props.softwareList[currentIndex.value - 1] : null)
const nextSoftware = computed(() => hasNext.value && props.softwareList ? props.softwareList[currentIndex.value + 1] : null)
const showNavigation = computed(() => props.softwareList && props.softwareList.length > 1)

const navigateToPrev = () => { if (prevSoftware.value) emit('navigate', prevSoftware.value) }
const navigateToNext = () => { if (nextSoftware.value) emit('navigate', nextSoftware.value) }

// ... keyboard logic ...
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen || showSharePreview.value || showComparisonManager.value) return
  const activeElement = document.activeElement
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) return
  
  switch (e.key) {
    case 'ArrowLeft': e.preventDefault(); navigateToPrev(); break;
    case 'ArrowRight': e.preventDefault(); navigateToNext(); break;
  }
}
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', handleKeydown)
  else window.removeEventListener('keydown', handleKeydown)
}, { immediate: true })
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// ... touch logic ...
const dialogPanelRef = ref<HTMLElement | null>(null)
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0
let isSwiping = false
const SWIPE_THRESHOLD = 80
const SWIPE_VELOCITY_THRESHOLD = 0.3
const handleTouchStart = (e: TouchEvent) => {
  if (!showNavigation.value) return
  if (showSharePreview.value || showComparisonManager.value) return
  const target = e.target as HTMLElement
  if (target.closest('.scroll-mask') || target.closest('.no-scrollbar')) return
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartTime = Date.now()
  isSwiping = true
}
const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping) return
  const touch = e.touches[0]
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  if (Math.abs(deltaY) > Math.abs(deltaX) * 0.5 && Math.abs(deltaY) > 10) isSwiping = false
}
const handleTouchEnd = (e: TouchEvent) => {
  if (!isSwiping) return
  isSwiping = false
  const touch = e.changedTouches[0]
  const deltaX = touch.clientX - touchStartX
  const deltaTime = Date.now() - touchStartTime
  const velocity = Math.abs(deltaX) / deltaTime
  if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && (Math.abs(deltaX) >= SWIPE_THRESHOLD || velocity >= SWIPE_VELOCITY_THRESHOLD)) {
    if (deltaX > 0) navigateToPrev()
    else navigateToNext()
  }
}

// ... Core Features logic ...
const coreFeatures = computed(() => {
  const pros = props.software.pros || []
  return pros.slice(0, 4).map((pro, _index) => {
    const parts = pro.split('：')
    if (parts.length >= 2) return { title: parts[0], subtitle: parts.slice(1).join('：') }
    const commaParts = pro.split('，')
    if (commaParts.length >= 2) return { title: commaParts[0], subtitle: commaParts.slice(1).join('，') }
    const title = pro.length > 20 ? `${pro.substring(0, 20)}...` : pro
    const subtitle = pro.length > 20 ? pro.substring(20) : ''
    return { title, subtitle: subtitle || '核心功能特性' }
  })
})

// ... Comparison Logic ...
const isLoadingComparison = ref(false)
const comparedSoftwares = ref<Software[]>([])
const comparisonSummary = ref('')
const showComparisonManager = ref(false)
const cardScrollRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let dragStartX = 0
let dragStartScrollLeft = 0
let md: MarkdownIt | null = null
const getMarkdownRenderer = () => {
  if (!md) md = new MarkdownIt({ html: false, breaks: true, linkify: true })
  return md
}
const loadComparisons = async () => {
  try {
    isLoadingComparison.value = true
    if (!props.software?.id) return
    const comparisons = await comparisonService.getComparisons(props.software.id)
    comparedSoftwares.value = comparisons
    if (comparisons.length > 0 && comparisons[0].groupInfo?.id) {
      const analysis = await comparisonService.getComparisonAnalysis(comparisons[0].groupInfo.id)
      comparisonSummary.value = analysis || ''
    }
  } catch (error) { logger.error('加载对比数据失败:', error) } 
  finally { isLoadingComparison.value = false }
}
const renderedSummary = computed(() => {
  if (!comparisonSummary.value) return ''
  let content = comparisonSummary.value
  content = content.replace(/([^\n])\s*(#{1,6}\s)/g, '$1\n\n$2')
  content = content.replace(/([^\n])\s*-\s*(\*\*)/g, '$1\n- $2')
  content = content.replace(/([^\n])\s*-\s*(优点|缺点)/g, '$1\n  - $2')
  content = content.replace(/(#{1,6}\s+.*?)(\s*-\s)/g, '$1\n$2')
  return getMarkdownRenderer().render(content)
})
watch(activeTab, (newTab) => {
  if (newTab === 'comparison' && !comparedSoftwares.value.length && !isLoadingComparison.value) loadComparisons()
})
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) activeTab.value = 'overview'
  else { comparedSoftwares.value = []; comparisonSummary.value = '' }
}, { immediate: true })
watch(() => props.software.id, () => {
  activeTab.value = 'overview'
  comparedSoftwares.value = []
  comparisonSummary.value = ''
  isLoadingComparison.value = false
  isDescriptionExpanded.value = false // Reset description expand state
})

watch(() => isSignedIn.value, (signedIn) => {
  if (!signedIn && activeTab.value === 'private') activeTab.value = 'overview'
})
const refreshComparisonsSilently = async () => {
    try {
        if (!props.software?.id) return
        const comparisons = await comparisonService.getComparisons(props.software.id)
        comparedSoftwares.value = comparisons
        if (comparisons.length > 0 && comparisons[0].groupInfo?.id) {
            const analysis = await comparisonService.getComparisonAnalysis(comparisons[0].groupInfo.id)
            comparisonSummary.value = analysis || ''
        } else { comparisonSummary.value = '' }
    } catch (error) { logger.error('刷新对比数据失败:', error) }
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
  if (!isDragging.value || !cardScrollRef.value) return
  e.preventDefault()
  cardScrollRef.value.scrollLeft = dragStartScrollLeft - (e.clientX - dragStartX)
}
const onDragEnd = (e: PointerEvent) => {
  if (!isDragging.value) return
  const el = cardScrollRef.value
  if (el && e.pointerId) try { el.releasePointerCapture(e.pointerId) } catch {}
  isDragging.value = false
}
const handleComparisonManagerClose = async (isOpen: boolean) => {
  const wasOpen = showComparisonManager.value
  showComparisonManager.value = isOpen
  if (!isOpen && wasOpen && activeTab.value === 'comparison') {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 300))
    if (props.isOpen && activeTab.value === 'comparison') await refreshComparisonsSilently()
  }
}

// ... Actions ...
const openWebsite = () => { if (props.software.website) window.open(props.software.website, '_blank') }
const showToast = ref(false)
const hasDownloadLinks = computed(() => Array.isArray(props.software.download_links) && props.software.download_links.length > 0)
const getProviderLabel = (provider: DownloadLink['provider']) => {
    const map: Record<string, string> = { baidu: '百度网盘', quark: '夸克网盘', lanzou: '蓝奏云', aliyun: '阿里云盘', '115': '115网盘', magnet: '磁力链接', ed2k: 'ED2K', official: '官方直链' }
    return map[provider] || '其他'
}
const buildShareText = (link: DownloadLink) => {
  const parts: string[] = [props.software.name, `链接：${link.url}`]
  if (link.code) parts.push(`提取码：${link.code}`)
  if (link.password) parts.push(`解压密码：${link.password}`)
  return parts.join('\n')
}
const copyLinkShare = async (link: DownloadLink) => {
  try { await copyToClipboard(buildShareText(link)); showToast.value = true; setTimeout(() => { showToast.value = false }, 2000) } catch (err) { logger.error('复制失败:', err) }
}
const hasSecrets = computed(() => isSignedIn.value && Array.isArray(props.software.secrets) && props.software.secrets.length > 0)
const fetchSecretValue = async (secretId: string) => {
  const res = await fetch(buildApiUrl(`/software/${props.software.id}/secret/${secretId}`))
  if (!res.ok) throw new Error('获取密钥失败')
  const data = await res.json()
  return data.value as string
}
const copySecret = async (sec: SecretItem) => {
  try {
    const value = await fetchSecretValue(sec.id)
    await copyToClipboard(value)
    showToast.value = true; setTimeout(() => { showToast.value = false }, 2000)
  } catch (err) { logger.error('复制密钥失败:', err) }
}

// ... Share ...
const shareCardRef = ref<HTMLElement | null>(null)
const showSharePreview = ref(false)
const generateShareImage = async () => { showSharePreview.value = true }
const initialFocusRef = ref<HTMLElement | null>(null)
const handleDetailClose = () => {
  if (showSharePreview.value) return;
  emit('update:isOpen', false)
}
const handleDetailCloseLogged = () => {
  handleDetailClose()
}
const afterLeave = () => {
  emit('closed')
}


</script>

<style scoped>
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3) { @apply font-bold text-gray-900 dark:text-white my-3; }
.markdown-content :deep(p) { @apply my-2 leading-relaxed text-gray-700 dark:text-gray-300; }
.markdown-content :deep(ul) { @apply list-disc pl-5 my-2 text-gray-700 dark:text-gray-300; }
.markdown-content :deep(li) { @apply my-1; }
.markdown-content :deep(a) { @apply text-blue-500 hover:underline; }

.scroll-mask {
  scrollbar-width: none;
}
.scroll-mask::-webkit-scrollbar { display: none; }
</style>
