<template>
  <TransitionRoot :show="isOpen" as="template" @after-leave="afterLeave">
    <Dialog 
      as="div" 
      class="relative z-50" 
      @close="handleDetailClose"
      :open="isOpen"
      :initialFocus="initialFocusRef"
    >
      <button
        ref="initialFocusRef"
        type="button"
        class="sr-only"
        @click="handleDetailClose"
      >
        关闭详情弹窗
      </button>
      
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 app-modal-backdrop" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <TransitionChild
            as="template"
            enter="ease-[cubic-bezier(0.25,1,0.5,1)] duration-320"
            enter-from="opacity-0 translate-y-4 scale-[0.985]"
            enter-to="opacity-100 translate-y-0 scale-100"
            leave="ease-[cubic-bezier(0.32,0,0.67,0)] duration-180"
            leave-from="opacity-100 translate-y-0 scale-100"
            leave-to="opacity-0 translate-y-2 scale-[0.992]"
          >
            <DialogPanel 
              ref="dialogPanelRef"
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
                     app-modal-panel app-modal-panel--interactive
                     text-left shadow-2xl ring-1 ring-gray-900/5
                     w-screen sm:w-[90vw] sm:max-w-[1000px] h-[96dvh] sm:h-[min(88dvh,920px)]
                     rounded-t-lg sm:rounded-lg
                     flex flex-col will-change-transform"
            >
              <!-- 顶部区域：头部信息与标签页 -->
              <div class="flex-shrink-0 bg-white dark:bg-[#181818] z-10 relative">
                <!-- 头部信息 -->
                <div class="p-5 sm:p-8 pb-0 sm:pb-0">
                  <div class="flex flex-col sm:flex-row gap-5 sm:gap-8">
                    <!-- 图标 -->
                    <div class="flex-shrink-0 mx-auto sm:mx-0">
                      <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 relative">
                        <img
                          :src="getIconUrl(software.icon || '')"
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
                              type="button"
                              @click="handleDetailCloseLogged"
                              class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors app-modal-close-btn"
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
                            <span>{{ software.category || '未分类' }}</span>
                         </div>

                         <!-- AI 分析溯源标签 -->
                         <div class="flex items-center gap-1.5 flex-wrap">
                            <Bot class="w-4 h-4 text-gray-400 shrink-0" />
                            <span v-if="!analysisModelTag" class="text-gray-400 dark:text-gray-500">未记录</span>
                            <template v-else>
                              <TagBadge size="xs" variant="primary">
                                {{ analysisModelTag }}
                              </TagBadge>
                              <TagBadge v-if="tavilyIssueLabel" size="xs" variant="warning">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                {{ tavilyIssueLabel }}
                              </TagBadge>
                              <TagBadge v-if="hasWarnings" size="xs" variant="danger">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                安全警示
                              </TagBadge>
                              <span v-if="analysisTimeLabel" class="text-xs text-gray-400 dark:text-gray-500">
                                {{ analysisTimeLabel }}
                              </span>
                            </template>
                         </div>
                      </div>

                      <!-- 标签与操作行 -->
                      <div class="mt-5 flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
                         <div class="flex flex-wrap items-center justify-center gap-2">
                            <!-- 授权标签 -->
                            <TagBadge size="sm" :variant="getLicenseVariant(software.license)" strong>
                              {{ licenseLabel }}
                            </TagBadge>
                            
                            <!-- 系统标签 -->
                            <TagBadge size="sm" variant="neutral">
                                <Monitor class="w-3.5 h-3.5" />
                                <span>{{ (software.systems || []).slice(0, 3).join(' · ') }}</span>
                            </TagBadge>
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

                            <Tooltip content="复制分享链接">
                                <BaseButton
                                    @click="copyShareLink"
                                    variant="secondary"
                                    size="md"
                                    class="rounded-md"
                                >
                                    <Link2 class="w-4 h-4" />
                                </BaseButton>
                            </Tooltip>

                            <Tooltip content="生成分享卡片">
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
                                type="button"
                                @click="handleDetailCloseLogged"
                                class="sm:hidden p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 app-modal-close-btn"
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
                        class="pb-3 text-sm font-medium transition-colors duration-200 relative whitespace-nowrap outline-none select-none px-1"
                        :class="[
                            activeTab === tab.id
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        ]"
                        >
                        {{ tab.label }}
                        <Transition
                          enter-active-class="transition duration-220 ease-[cubic-bezier(0.25,1,0.5,1)]"
                          enter-from-class="opacity-0 scale-x-0"
                          enter-to-class="opacity-100 scale-x-100"
                          leave-active-class="transition duration-160 ease-[cubic-bezier(0.32,0,0.67,0)]"
                          leave-from-class="opacity-100 scale-x-100"
                          leave-to-class="opacity-0 scale-x-0"
                        >
                          <span
                              v-if="activeTab === tab.id"
                              class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white rounded-t-full origin-center"
                          ></span>
                        </Transition>
                      </button>
                   </div>
                </div>
              </div>

              <!-- 内容滚动区域 -->
              <div class="flex-1 overflow-y-auto p-5 sm:p-8 bg-gray-50/50 dark:bg-transparent scroll-smooth" :key="software.id">
                
                <!-- 内容页切换动画 -->
                <Transition
                    mode="out-in"
                    enter-active-class="transition duration-240 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    enter-from-class="opacity-0 translate-y-1.5 scale-[0.995]"
                    enter-to-class="opacity-100 translate-y-0 scale-100"
                    leave-active-class="transition duration-150 ease-[cubic-bezier(0.32,0,0.67,0)]"
                    leave-from-class="opacity-100 translate-y-0 scale-100"
                    leave-to-class="opacity-0 translate-y-1 scale-[0.997]"
                >
                <div v-if="activeTab === 'overview'" class="space-y-8 max-w-4xl mx-auto">
                  <!-- 产品描述 -->
                  <section class="software-detail-card rounded-lg p-6">
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
                            class="mt-2 text-sm font-medium text-primary hover:underline flex items-center gap-1"
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
                        class="software-detail-card software-detail-card--interactive rounded-lg p-5"
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
                        class="software-detail-card col-span-full rounded-lg border-dashed py-8 text-center text-gray-500 dark:text-gray-400"
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
                        <div class="software-detail-card rounded-lg p-6">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                优点
                            </h3>
                            <ul class="space-y-3">
                                <li v-for="(pro, idx) in (software.pros || [])" :key="idx" class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                    <CheckCircle2 class="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span>{{ pro }}</span>
                                </li>
                                <li v-if="!(software.pros || []).length" class="text-gray-400 italic">暂无记录</li>
                            </ul>
                        </div>
                        
                        <!-- 劣势 -->
                        <div class="software-detail-card rounded-lg p-6">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                缺点
                            </h3>
                            <ul class="space-y-3">
                                <li v-for="(con, idx) in (software.cons || [])" :key="idx" class="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                    <XCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <span>{{ con }}</span>
                                </li>
                                <li v-if="!(software.cons || []).length" class="text-gray-400 italic">暂无记录</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 安全审查 —— 只要有 AI 分析记录就展示此区块 -->
                    <div v-if="software.analysis_model" :class="hasWarnings ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' : 'bg-primary/10 dark:bg-primary/[0.14] border-primary/20 dark:border-primary/24'" class="rounded-lg p-6 shadow-sm border">
                        <h3 :class="hasWarnings ? 'text-amber-800 dark:text-amber-300' : 'text-[hsl(var(--primary-h)_72%_28%)] dark:text-[hsl(var(--primary-h)_74%_82%)]'" class="text-lg font-bold mb-4 flex items-center gap-2">
                            <svg v-if="hasWarnings" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                            {{ hasWarnings ? '安全风险与争议事件' : '安全审查' }}
                        </h3>

                        <template v-if="hasWarnings">
                            <ul class="space-y-3">
                                <li v-for="(warning, idx) in software.warnings" :key="idx" class="flex items-start gap-3 text-amber-900 dark:text-amber-200">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5 text-amber-500"><circle cx="12" cy="12" r="10"/><path d="M12 16h.01"/><path d="M12 8v4"/></svg>
                                    <span>{{ warning }}</span>
                                </li>
                            </ul>
                            <p class="mt-4 text-xs text-amber-600 dark:text-amber-400/70">
                                以上信息基于网络公开资料和 AI 分析，仅供参考，请自行验证。
                            </p>
                        </template>

                        <div v-else class="flex items-center gap-3 text-[hsl(var(--primary-h)_72%_28%)] dark:text-[hsl(var(--primary-h)_74%_82%)]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                            <span>未发现已知安全风险或争议事件</span>
                        </div>
                        <p v-if="!hasWarnings" class="mt-3 text-xs text-primary/80 dark:text-primary/60">
                            基于 AI 知识库{{ hasSafetySource ? '与 Tavily 安全搜索' : '' }}综合审查
                        </p>
                    </div>
                </div>

                <!-- 相关资源页 -->
                <div v-else-if="activeTab === 'articles'" class="space-y-8 max-w-4xl mx-auto">
                    <div v-if="groupedArticles.length > 0" class="space-y-8">
                        <div v-for="group in groupedArticles" :key="group.label" class="space-y-4">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
                                <component :is="group.icon" class="w-5 h-5 text-gray-400" />
                                {{ group.label }}
                            </h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <a
                                    v-for="article in group.items"
                                    :key="article.id"
                                    :href="article.url"
                                    target="_blank"
                                class="software-detail-card software-detail-card--interactive group rounded-xl p-5 transition-all duration-300"
                                >
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="space-y-1.5">
                                <div class="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                                                {{ article.title }}
                                            </div>
                                            <div v-if="article.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                {{ article.description }}
                                            </div>
                                        </div>
                                <ExternalLink class="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div v-else class="software-detail-card flex flex-col items-center justify-center rounded-lg border-dashed py-20 text-center">
                        <div class="w-16 h-16 mb-6 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center">
                            <Link class="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">暂无相关资源</h3>
                        <p class="text-gray-500 max-w-md">该软件暂未配置相关的帮助文档或资源链接。</p>
                    </div>
                </div>

                <!-- 更新日志页 (GitHub Releases) -->
                <div v-else-if="activeTab === 'releases'" class="max-w-4xl mx-auto">
                    <GitHubReleases
                      :software-id="software.id"
                      :website="software.website || ''"
                    />
                </div>

                <!-- 对比分析页 -->
                <div v-else-if="activeTab === 'comparison'" class="max-w-6xl mx-auto">
                   <!-- 保留原有对比逻辑，优化样式 -->
                   <div v-if="isLoadingComparison" class="flex items-center justify-center py-24">
                        <div class="flex flex-col items-center gap-4">
                            <div class="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <span class="text-gray-500 font-medium">正在分析对比数据...</span>
                        </div>
                   </div>

                   <div v-else-if="!comparedSoftwares.length" class="software-detail-card flex flex-col items-center justify-center rounded-lg border-dashed py-20 text-center">
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
                                  class="software-detail-card software-detail-card--interactive flex-none w-[300px] rounded-lg p-5"
                                >
                                   <div class="flex items-center gap-3 mb-4">
                                  <img :src="getIconUrl(sw.icon || '')" class="w-10 h-10 rounded-lg bg-gray-100" />
                                        <div class="truncate font-bold text-gray-900 dark:text-white">{{ sw.name }}</div>
                                   </div>
                                   <div class="space-y-3 text-sm">
                                        <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                                            <span class="text-gray-500">授权</span>
                                            <TagBadge size="xs" strong :variant="getLicenseVariant(sw.license)">
                                              {{ sw.license || '未知' }}
                                            </TagBadge>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-gray-500 text-xs">支持系统</div>
                                            <div class="flex flex-wrap gap-1">
                                                <TagBadge v-for="s in (sw.systems || [])" :key="s" size="xs" variant="neutral">{{ s }}</TagBadge>
                                            </div>
                                        </div>
                                   </div>
                                </div>
                            </div>
                        </div>

                        <!-- 综合分析 -->
                        <div v-if="parsedComparisonAnalysis" class="software-detail-card rounded-lg p-6 sm:p-8">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                综合分析
                            </h3>
                            <ComparisonStructuredView
                                :analysis="parsedComparisonAnalysis"
                                :softwares="comparisonSoftwareList"
                            />
                        </div>
                   </template>
                </div>

                <!-- 私密信息页 -->
                <div v-else-if="activeTab === 'private'" class="space-y-8 max-w-4xl mx-auto">
                    <div class="grid gap-6">
                        <!-- 下载链接 -->
                        <div class="software-detail-card rounded-lg p-6">
                             <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                下载资源
                             </h3>
                             <div v-if="hasDownloadLinks" class="space-y-3">
                                <div v-for="link in software.download_links" :key="link.id" 
                                     class="software-detail-subcard software-detail-subcard--interactive rounded-lg p-4 transition-colors group">
                                     <div class="flex items-start justify-between gap-4">
                                        <div class="space-y-1">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold text-gray-900 dark:text-white">{{ getProviderLabel(link.provider) }}</span>
                                                <TagBadge v-if="link.versionLabel" size="xs" variant="neutral">{{ link.versionLabel }}</TagBadge>
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
                        <div v-if="hasSecrets" class="software-detail-card rounded-lg p-6">
                             <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                私密数据
                             </h3>
                             <div class="space-y-3">
                                <div v-for="sec in software.secrets" :key="sec.id" class="software-detail-subcard flex items-center justify-between rounded-lg p-4">
                                    <div>
                                        <div class="flex items-center gap-2 mb-1">
                                            <TagBadge size="xs" variant="neutral" strong class="uppercase">{{ getSecretKindLabel(sec.kind) }}</TagBadge>
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
              <div class="flex-shrink-0 p-4 sm:p-5 bg-white dark:bg-[#181818] border-t border-gray-100 dark:border-gray-800 z-10">
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

  <InlineToast :show="showToast" message="操作成功" />
  
  <ShareCardPreview
    v-model:is-open="showSharePreview"
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
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  DownloadCloud,
  Edit,
  ExternalLink,
  FileSearch,
  FileText,
  FolderOpen,
  GitBranch,
  HelpCircle,
  History,
  Lightbulb,
  Link,
  Link2,
  Monitor,
  Plus,
  Share2,
  Star,
  Tag,
  X,
  XCircle
} from 'lucide-vue-next'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { copyToClipboard } from '@/utils/clipboard'
import { isSignedIn } from '../lib/auth'
import { buildApiUrl } from '../services/apiBase'
import { comparisonService } from '../services/comparison'
import { githubService } from '../services/github'
import { getIconUrl } from '../services/localIconCache'
import { softwareService } from '../services/software'
import type { DownloadLink, SecretItem, Software, SoftwareListItem } from '../types'
import { parseComparisonContent } from '../utils/comparison-parser'
import { getLicenseTagVariant as getLicenseVariant } from '../utils/license'
import logger from '../utils/logger'
import { getSecretKindClass, getSecretKindLabel } from '../utils/secret'
import TagBadge from './common/TagBadge.vue'
import Tooltip from './common/Tooltip.vue'
import SystemIcon from './SystemIcon.vue'
import ComparisonStructuredView from './comparison/ComparisonStructuredView.vue'
import GitHubReleases from './software/GitHubReleases.vue'
import InlineToast from './InlineToast.vue'

const props = defineProps<{
  isOpen: boolean
  software: Software | SoftwareListItem
  softwareList?: SoftwareListItem[]
}>()

const software = ref<Software | SoftwareListItem>(props.software)
const isLoadingDetails = ref(false)
const previousFocusedElement = ref<HTMLElement | null>(null)

// 监听 props.software 变化，重新获取详情
watch(() => props.software, async (newSoftware) => {
  if (!newSoftware) return
  
  // 先更新基本信息，避免闪烁
  software.value = { ...newSoftware }
  
  // 如果需要，获取完整详情
  // 检查是否缺少 download_links, secrets 等字段
  // 列表接口返回的对象通常没有 download_links (undefined)，而详情接口会返回 [] 或 [...]
  // 但为了保险，我们总是尝试获取一次详情，除非已经有了详细数据
  
  // 这里可以做一个简单的判断，例如检查 pros/cons 是否存在，或者 download_links 是否存在
  // 但最稳妥的是每次打开/切换都获取最新详情
  
  if (props.isOpen) {
    await fetchFullDetails(newSoftware.id)
  }
}, { immediate: true, deep: true })

// 监听 isOpen 变化，打开时获取详情
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.software) {
    previousFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await fetchFullDetails(props.software.id)
    await nextTick()
    initialFocusRef.value?.focus()
  } else {
    const restoreTarget = previousFocusedElement.value
    if (restoreTarget) {
      nextTick(() => restoreTarget.focus())
    }
  }
})

async function fetchFullDetails(id: number) {
  try {
    isLoadingDetails.value = true
    const details = await softwareService.getSoftwareById(id)
    software.value = details
  } catch (error) {
    logger.error(`获取软件详情失败 (ID: ${id}):`, error)
  } finally {
    isLoadingDetails.value = false
  }
}

// ... existing code ...
// 在后续代码中，使用 software.value 而不是 props.software
// 需要替换所有 props.software 为 software (除了 watch 里面)


const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'navigate': [software: SoftwareListItem]
  'closed': []
}>()

// Tabs
type TabId = 'overview' | 'comparison' | 'details' | 'articles' | 'releases' | 'private'
const activeTab = ref<TabId>('overview')

// 检测是否为 GitHub 仓库
const isGitHubRepo = computed(() => githubService.isGitHubRepo(software.value.website))

const tabs = computed(() => {
  const baseTabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: '概览' },
    { id: 'details', label: '详细信息' },
  ]
  // 仅当 website 为 GitHub 仓库时显示「更新日志」
  if (isGitHubRepo.value) {
    baseTabs.push({ id: 'releases', label: '更新日志' })
  }
  baseTabs.push(
    { id: 'articles', label: '相关资源' },
    { id: 'comparison', label: '对比分析' },
  )
  if (isSignedIn.value) {
    baseTabs.push({ id: 'private', label: '私密信息' })
  }
  return baseTabs
})

// Description Expand
const isDescriptionExpanded = ref(false)
const descriptionThreshold = 200
const showExpandButton = computed(() => (software.value.description?.length || 0) > descriptionThreshold)

const licenseLabel = computed(() => software.value.license || '未知')

function formatModelName(model: string): string {
  const raw = model.toLowerCase().replace(/[_-]/g, ' ')
  const rules: [RegExp, string][] = [
    [/^claude (.+)$/i, 'Claude $1'],
    [/^gpt (.+)$/i, 'GPT-$1'],
    [/^o(\d.*)$/i, 'o$1'],
    [/^deepseek (.+)$/i, 'DeepSeek $1'],
    [/^moonshot v1 (\w+)$/i, 'Kimi $1'],
    [/^sonar (.*)$/i, 'Sonar $1'],
    [/^sonar$/i, 'Sonar'],
    [/^gemini (.+)$/i, 'Gemini $1'],
  ]
  for (const [pattern, replacement] of rules) {
    if (pattern.test(raw)) {
      return raw.replace(pattern, replacement)
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  }
  return model
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const analysisModelTag = computed(() => {
  const model = typeof software.value.analysis_model === 'string' ? software.value.analysis_model.trim() : ''
  if (!model) return ''
  return formatModelName(model)
})

const analysisSources = computed(() => {
  const raw = software.value.analysis_sources
  return Array.isArray(raw) ? raw : []
})
const tavilyIssueLabel = computed(() => {
  if (analysisSources.value.includes('tavily-error')) return '搜索异常'
  if (analysisSources.value.includes('tavily-empty')) return '搜索未命中'
  return ''
})
const hasSafetySource = computed(() => analysisSources.value.includes('tavily-safety'))
const hasWarnings = computed(() => (software.value.warnings || []).length > 0)

const analysisTimeLabel = computed(() => {
  const raw = software.value.analysis_at
  if (!raw || typeof raw !== 'string') return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
})

// Number formatter
const formatNumber = (num: number) => {
    if (num >= 10000) {
        return `${(num / 10000).toFixed(1)}w`
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
  const pros = software.value.pros || []
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
const loadComparisons = async () => {
  try {
    isLoadingComparison.value = true
    if (!software.value?.id) return
    const comparisons = await comparisonService.getComparisons(software.value.id)
    comparedSoftwares.value = comparisons
    if (comparisons.length > 0 && comparisons[0].groupInfo?.id) {
      const analysis = await comparisonService.getComparisonAnalysis(comparisons[0].groupInfo.id)
      comparisonSummary.value = analysis || ''
    }
  } catch (error) { logger.error('加载对比数据失败:', error) } 
  finally { isLoadingComparison.value = false }
}
// 结构化对比分析：解析数据库中保存的 JSON
const parsedComparisonAnalysis = computed(() => {
  if (!comparisonSummary.value) return null
  return parseComparisonContent(comparisonSummary.value)
})

// 传给结构化视图的软件列表：基础软件 + 已比较软件，用于匹配图标
const comparisonSoftwareList = computed(() => {
  return [software.value, ...comparedSoftwares.value].map((sw) => ({
    name: sw?.name || '',
    icon: (sw as any)?.icon || '',
  }))
})
watch(activeTab, (newTab) => {
  if (newTab === 'comparison' && !comparedSoftwares.value.length && !isLoadingComparison.value) loadComparisons()
})
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) activeTab.value = 'overview'
  else { comparedSoftwares.value = []; comparisonSummary.value = '' }
}, { immediate: true })
watch(() => software.value.id, () => {
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
        if (!software.value?.id) return
        const comparisons = await comparisonService.getComparisons(software.value.id)
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
const openWebsite = () => { if (software.value.website) window.open(software.value.website, '_blank') }
const showToast = ref(false)
const hasDownloadLinks = computed(() => Array.isArray(software.value.download_links) && software.value.download_links.length > 0)

// 关联文章分组
const groupedArticles = computed(() => {
  const articles = [...(software.value.related_articles || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  const groups: Record<string, { label: string; icon: any; items: typeof articles }> = {
    document: { label: '使用文档', icon: FileText, items: [] },
    tips: { label: '使用技巧', icon: Lightbulb, items: [] },
    faq: { label: '常见问题', icon: HelpCircle, items: [] },
    changelog: { label: '更新日志', icon: History, items: [] },
    other: { label: '其他资源', icon: Link, items: [] }
  }
  
  articles.forEach(article => {
    const type = article.type || 'other'
    if (groups[type]) {
      groups[type].items.push(article)
    } else {
      groups.other.items.push(article)
    }
  })
  
  return Object.values(groups).filter(g => g.items.length > 0)
})

const getProviderLabel = (provider: DownloadLink['provider']) => {
    const map: Record<string, string> = { baidu: '百度网盘', quark: '夸克网盘', lanzou: '蓝奏云', aliyun: '阿里云盘', '115': '115网盘', magnet: '磁力链接', ed2k: 'ED2K', official: '官方直链' }
    return map[provider] || '其他'
}
const buildShareText = (link: DownloadLink) => {
  const parts: string[] = [software.value.name, `链接：${link.url}`]
  if (link.code) parts.push(`提取码：${link.code}`)
  if (link.password) parts.push(`解压密码：${link.password}`)
  return parts.join('\n')
}
const copyLinkShare = async (link: DownloadLink) => {
  try { await copyToClipboard(buildShareText(link)); showToast.value = true; setTimeout(() => { showToast.value = false }, 2000) } catch (err) { logger.error('复制失败:', err) }
}
const hasSecrets = computed(() => isSignedIn.value && Array.isArray(software.value.secrets) && software.value.secrets.length > 0)
const fetchSecretValue = async (secretId: string) => {
  const res = await fetch(buildApiUrl(`/software/${software.value.id}/secret/${secretId}`))
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
const showSharePreview = ref(false)
const generateShareImage = async () => { showSharePreview.value = true }
const copyShareLink = async () => {
  const shareUrl = `${window.location.origin}/share/software/${software.value.id}`
  try {
    await copyToClipboard(shareUrl)
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 2000)
  } catch (err) {
    logger.error('复制链接失败:', err)
  }
}
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

<style>
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

.software-detail-card--interactive {
  transition:
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (hover: hover) and (pointer: fine) {
  .software-detail-card--interactive:hover {
    transform: translateY(-1px);
    border-color: var(--modal-card-border-emphasis-light);
    box-shadow: var(--modal-card-shadow-hover-light);
  }

  .dark .software-detail-card--interactive:hover {
    border-color: var(--modal-card-border-emphasis-dark);
    box-shadow: var(--modal-card-shadow-hover-dark);
  }
}

.software-detail-subcard {
  border: 1px solid var(--modal-card-border-light);
  background: var(--modal-card-subtle-bg-light);
  transition:
    border-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
    background-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .software-detail-subcard {
  border-color: var(--modal-card-border-dark);
  background: var(--modal-card-subtle-bg-dark);
}

@media (hover: hover) and (pointer: fine) {
  .software-detail-subcard--interactive:hover {
    border-color: var(--modal-card-border-emphasis-light);
    background: color-mix(in srgb, var(--modal-card-subtle-bg-light) 92%, white);
    box-shadow: 0 16px 24px -24px rgb(15 23 42 / 0.2);
  }

  .dark .software-detail-subcard--interactive:hover {
    border-color: var(--modal-card-border-emphasis-dark);
    background: color-mix(in srgb, var(--modal-card-subtle-bg-dark) 88%, rgb(255 255 255 / 0.06));
    box-shadow: 0 16px 24px -24px rgb(0 0 0 / 0.44);
  }
}

.scroll-mask {
  scrollbar-width: none;
}
.scroll-mask::-webkit-scrollbar { display: none; }
</style>
