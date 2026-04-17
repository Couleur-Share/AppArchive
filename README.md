# AppArchive — 软件记录管理系统

一个基于 Vue 3 + TypeScript 开发的软件记录管理系统，用于管理和展示各类软件信息。

---

## 🚀 技术栈


| 层级       | 技术                                       |
| -------- | ---------------------------------------- |
| **前端**   | Vue 3 · TypeScript · Tailwind CSS · GSAP |
| **后端**   | Express 5 · Node.js                      |
| **数据库**  | PostgreSQL                               |
| **认证**   | JWT（bcrypt + jsonwebtoken）               |
| **对象存储** | 腾讯云 COS                                  |
| **构建工具** | Vite 5                                   |
| **代码质量** | Biome                                    |


## ✨ 主要功能

- 📦 软件信息管理（增删改查）
- 🔍 分类筛选与全局搜索
- ⚖️ 软件对比分析
- 🤖 AI 辅助分析（多供应商支持）
- 🔐 用户认证系统（JWT）
- 🌗 响应式设计 + 暗色模式
- 🔔 **GitHub 订阅推送** — 订阅开源项目的 Release 更新，AI 自动生成中文摘要，通过 MeoW 等通道实时推送

---

## 📁 项目结构

```text
AppArchive/
├── public/                 # 静态资源（Favicon / PWA Manifest / Logo）
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── composables/        # 组合式函数
│   ├── config/             # 前端配置
│   ├── directives/         # 自定义指令
│   ├── lib/                # 通用库封装
│   ├── plugins/            # Vue 插件
│   ├── router/             # 路由配置
│   ├── services/           # 业务逻辑服务
│   ├── styles/             # 全局样式
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── views/              # 页面视图
│   ├── App.vue             # 主应用组件
│   └── main.ts             # 入口文件
├── server/                 # 后端源码
│   ├── index.js            # Express 服务器入口
│   ├── database.js         # 数据库配置
│   ├── auth.js             # 认证模块
│   ├── ai.js               # AI 分析模块
│   ├── cos.js              # 腾讯云 COS 集成
│   └── prompts.js          # AI 提示词
├── scripts/                # 运维迁移脚本
├── docs/                   # 项目文档
└── package.json            # 项目配置
```

---

## 🛠️ 快速开始

### 环境要求

- **Node.js** ≥ 18
- **pnpm**（推荐）或 npm
- **PostgreSQL** 实例

### 1. 安装依赖

```bash
pnpm install
# 或
npm install
```

### 2. 配置环境变量

参照 `env.example` 创建 `.env` 或 `.env.local`：

```env
# ── 后端服务 ──────────────────────────────────────
PORT=3001
JSON_LIMIT=1mb
CORS_ORIGINS=http://localhost:5173,https://your-domain.com   # 多个来源用逗号分隔

# ── PostgreSQL ────────────────────────────────────
PGHOST=localhost
PGPORT=5432
PGDATABASE=Softwares
PGUSER=postgres
PGPASSWORD=your_password
PGSSL=false

# ── 腾讯云 COS ────────────────────────────────────
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=ap-guangzhou
COS_STORAGE_PATH=AppArchive/
COS_DOMAIN=https://<bucket>.cos.<region>.myqcloud.com

# ── 认证（JWT） ───────────────────────────────────
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# ── 前端 API 地址 ─────────────────────────────────
# 生产环境推荐同源 /api（需反向代理 /api → 后端 3001）
VITE_API_BASE_URL=/api
```

> [!WARNING]
> 密钥若曾提交到 Git 历史，请立即**吊销旧密钥**并使用 `git filter-repo` 等工具清理历史记录。

### 3. 数据库迁移

首次使用前执行以下迁移脚本：

```bash
# 创建 users 表和初始管理员账户
node scripts/migrate-users.js

# 创建 AI 配置表
node scripts/migrate-ai-config.js

# 补齐 related_articles 字段（按需）
node scripts/migrate-related-articles.js

# 补齐结构化洞察字段（tagline / highlights / best_for / avoid_if）
node scripts/migrate-software-structured-fields.js

# GitHub 订阅推送（user_channels / subscriptions / release_ai_summaries / notification_logs）
node scripts/migrate-subscriptions.js
```

> 若后端日志出现 `[SCHEMA]` 提示，请按日志中的缺失字段执行对应迁移脚本或手动 SQL。

### 4. 启动开发服务

```bash
# 前后端并行启动（推荐）
pnpm dev      # 后端 → :3001 / 前端 → :5173

# 仅启动后端
pnpm server
```

### 5. 访问应用


| 访问方式      | 地址                                             |
| --------- | ---------------------------------------------- |
| 本地        | [http://localhost:5173](http://localhost:5173) |
| 局域网 / 移动端 | http://你的本机IP:5173（需同一网络）                      |


> 前后端均已配置监听所有网络接口，支持通过 IP 地址访问。

---

## 🧰 常用脚本


| 命令                  | 说明          |
| ------------------- | ----------- |
| `pnpm dev`          | 并行启动前后端开发服务 |
| `pnpm server`       | 仅启动后端服务     |
| `pnpm build`        | 构建前端生产包     |
| `pnpm start`        | 启动后端（生产环境）  |
| `pnpm lint`         | Biome 代码检查  |
| `pnpm format`       | Biome 代码格式化 |
| `pnpm deploy:local` | 本地部署脚本      |
| `pnpm full-rebuild` | 全量重建脚本      |
| `pnpm migrate:structured` | 执行结构化字段迁移（tagline / highlights / best_for / avoid_if） |
| `pnpm migrate:subscriptions` | 创建 GitHub 订阅推送相关的四张表 |
| `pnpm rerun:analyze` | 批量为存量软件刷新结构化洞察（需要 `AUTH_TOKEN` 环境变量） |


---

## 🔒 认证与限流

- 所有**写接口**（新增 / 更新 / 删除 / 上传 / AI）均需 JWT 认证：
  ```
  Authorization: Bearer <token>
  ```
- 速率限制已启用（默认 15 分钟窗口），可通过环境变量调整：
  - `UPLOAD_MAX` — 上传请求上限
  - `AI_MAX` — AI 请求上限
  - `WRITE_MAX` — 写请求上限
  - `BATCH_MAX` / `BATCH_WINDOW_MS` — 批量重跑控制接口（start / cancel / reset）上限，默认 60 秒 10 次
  - `RERUN_SLEEP_MS` — 批量重跑任务内部条目间节流，默认 20000ms（20 秒）
- 上传 MIME 类型及文件大小在后端复核，日志会记录耗时与失败原因。

---

## 🤖 AI 功能

### 配置方式

AI 功能**通过界面配置**，无需手动编辑环境变量。

1. 登录后进入 **设置 → AI 设置**
2. 选择供应商、模型并填写 API Key
3. 点击「测试连接」验证配置

### 支持的供应商

Perplexity · OpenAI · Moonshot (Kimi) · DeepSeek · 自定义 (OpenAI 兼容)

### API 端点


| 方法     | 路径                    | 说明                      |
| ------ | --------------------- | ----------------------- |
| `POST` | `/api/ai/analyze`     | 软件优缺点分析 `{ software }`  |
| `POST` | `/api/ai/compare`     | 多软件对比分析 `{ softwares }` |
| `GET`  | `/api/ai/providers`   | 获取支持的供应商列表              |
| `GET`  | `/api/ai/config`      | 获取当前 AI 配置（脱敏）          |
| `PUT`  | `/api/ai/config`      | 保存 AI 配置                |
| `POST` | `/api/ai/config/test` | 测试 AI 配置连通性             |
| `POST` | `/api/admin/rerun/start`  | 启动批量重跑 `{ mode, ids? }`，mode 为 `all` / `missing_structured` / `selected`；返回当前 status 快照，409 表示已有任务在跑 |
| `GET`  | `/api/admin/rerun/status` | 查询当前批量重跑任务状态（前端 2 秒轮询，不限流） |
| `POST` | `/api/admin/rerun/cancel` | 协作式取消，当前条目处理完后停止 |
| `POST` | `/api/admin/rerun/reset`  | 清空累计 `processedIds` 与磁盘进度文件，仅 idle 状态允许 |

### 迁移说明（AI 分析模型追溯）

为支持在详情页展示“最后一次 AI 分析模型”，请执行一次迁移脚本：

```bash
node scripts/migrate-software-analysis-meta.js
```

迁移会在 `softwares` 表新增以下可空字段：

- `analysis_provider`（分析供应商）
- `analysis_model`（分析模型名）
- `analysis_at`（分析时间，`TIMESTAMPTZ`）

### 结构化洞察迁移（概览与详细信息页升级）

概览页的「核心亮点」与详细信息页的「适合谁用」「什么情况下别用」依赖以下结构化字段。
首次部署本特性时需要执行迁移并批量刷新：

```bash
# 1) 新增 tagline / highlights / best_for / avoid_if 列
pnpm migrate:structured

# 2) 为存量软件批量刷新结构化洞察 —— 任选其一：

# 方式 A（推荐）：Web 入口
#    登录后打开「设置 → 维护工具」，选择运行模式（全部 / 只补缺失 / 手动多选），点击开始。
#    任务在后端运行，关闭浏览器、切换设备都不会中断；完成进度可在页面实时观察。

# 方式 B：CLI（适合服务器后台跑或自动化）
#    AUTH_TOKEN 为登录后浏览器 localStorage 中的 auth_token：
#    DevTools → Application → Local Storage → 复制 auth_token 的 Value
AUTH_TOKEN=<your-jwt> pnpm rerun:analyze
```

无论 Web 还是 CLI，都共用 `logs/rerun-progress.json` 进度文件，相互可以续跑：
- 串行调用 + 默认 20 秒节流（CLI 默认 2 秒，可用 `SLEEP_MS` / `RERUN_SLEEP_MS` 调整）
- 中途中断后再次启动会自动跳过已处理的软件
- 仅回写 `tagline / highlights / best_for / avoid_if / warnings` 与 `analysis_*` 元数据，
  绝不覆盖用户手动编辑过的 `description / pros / cons / 链接 / 图标` 等字段
- Web 维护工具支持三种运行模式：
  - **全部软件**：为所有软件刷新分析结果
  - **只补缺失**：仅处理 `tagline / highlights / best_for / avoid_if` 任一为空的软件
  - **手动多选**：从软件列表勾选指定条目（每条都附带字段完整度徽章方便挑选）


> API Key 在数据库中以 **AES-256-GCM** 加密存储，前端不会接触明文密钥。

---

## 🎨 品牌与图标资源


| 资源类型         | 路径                                                                            |
| ------------ | ----------------------------------------------------------------------------- |
| 站点 Logo      | `public/logo-header.svg`                                                      |
| Favicon      | `public/favicon.{ico,svg}` · `public/favicon-{16,32,96}x{16,32,96}.png`       |
| PWA Manifest | `public/site.webmanifest` · `public/web-app-manifest-{192,512}x{192,512}.png` |


---

## 📝 数据模型

```typescript
interface Software {
  id: number
  name: string
  category: string
  description: string
  icon: string
  license: '免费' | '收费' | '开源' | '已购'
  systems: ('Windows' | 'Android')[]
  website: string
  pros: string[]
  cons: string[]
  warnings?: string[]
  // 结构化洞察（详情页概览/详细信息 Tab 直接渲染）
  tagline?: string
  highlights?: Array<{
    title: string
    detail: string
    kind?: 'performance' | 'privacy' | 'security' | 'ecosystem' | 'ux' | 'integration' | 'pricing' | 'other'
  }>
  best_for?: Array<{ persona: string; reason: string }>
  avoid_if?: Array<{ situation: string; reason: string }>
  analysis_provider?: string
  analysis_model?: string
  analysis_at?: string
  related_articles: RelatedArticle[]
}

interface RelatedArticle {
  id: string
  title: string
  url: string
  type: 'document' | 'tips' | 'faq' | 'changelog' | 'other'
  description?: string
  sortOrder: number
}
```

---

## 🔔 GitHub 订阅推送

订阅 GitHub 开源项目的 Release 更新，新版本发布时系统会调用 AI 生成中文摘要并通过已配置的推送通道推送给用户。

### 架构要点

- **通道抽象**：`user_channels` 表以加密 JSONB 存储配置，首发支持 **MeoW**，代码里 `server/notifier.js` 注册新通道即可扩展（Bark / Telegram / 邮件等）。
- **调度器**：进程内 `setInterval` 每 1 分钟 tick 一次，按 `next_check_at` 捞到期订阅，按 `software_id` 分组后软件级并发扫描（复用 `github_releases_cache` + ETag）。
- **AI 摘要**：`release_ai_summaries` 表按 `(software_id, tag_name)` 缓存，同一版本全站只生成一次；失败降级截取 release body 前 200 字，保证推送不阻塞。
- **失败兜底**：连续 3 次失败自动 `paused_reason='channel_error'`，前端显示警告；用户在编辑对话框中再次保存即恢复。
- **订阅上限**：每用户 **100** 条。
- **冷启动防补推**：创建订阅时立即把当前 `latest_version` 写入 `last_notified_version`，避免刚订阅就收到老版本。

### 环境变量

| 变量 | 说明 | 默认 |
| ---- | ---- | ---- |
| `APP_SECRET_KEY` | AES-256-GCM 加密密钥（32 字节 hex / base64，复用 AI 模块） | **必须配置** |
| `GITHUB_TOKEN` | GitHub Personal Access Token（强烈建议配置，否则未认证限流 60/小时） | 未配置 |
| `GITHUB_CACHE_TTL` | GitHub Releases 缓存有效期（秒） | `21600` |
| `MEOW_API_BASE` | MeoW 推送网关 | `https://api.chuckfang.com` |
| `MEOW_HTML_HEIGHT` | MeoW HTML 消息高度 | `400` |
| `SUBSCRIPTION_TICK_INTERVAL_MS` | 调度器 tick 间隔（毫秒） | `60000` |

### 使用流程

1. 管理员执行 `pnpm migrate:subscriptions` 创建四张表
2. 用户登录后进入「设置 → 通知渠道」添加 MeoW 昵称，点击「测试推送」确认连通
3. 在任意 GitHub 软件详情页点击「订阅更新」，选择检查频率（15m / 1h / 6h / 12h / 1d）
4. 在顶部用户菜单的「我的订阅」进入管理页，可查看投递日志、立即检查、修改频率与通道

---

## ✅ 手动验证清单

- 启动后端后无 `[SCHEMA]` 迁移警告
- 未登录请求写接口返回 `401`；登录后正常
- 上传非图片或超限文件返回 `400`；频繁上传返回 `429`
- 「对比结果」弹窗默认展示详情，不出现空白
- 图片多次加载后无 `localStorage` 满额报错（已改用 IndexedDB 缓存）
- 新增软件后触发 AI 分析并保存，详情页可见"最后一次AI分析：供应商/模型"
- 编辑软件重新 AI 分析并保存后，详情页模型信息会更新
- 切换全局 AI 设置后，历史软件仍显示各自记录的分析模型（不串号）
- 历史旧数据（无分析元数据）详情页显示"未记录"，且页面不报错
- 执行 `pnpm migrate:subscriptions` 无报错，四张新表已创建
- 在"通知渠道"绑定 MeoW 并测试推送成功；昵称显示为 `ab***xy` 脱敏形态
- 对 GitHub 开源软件点击"订阅更新"，可选择五档频率并保存
- "我的订阅"页可看到订阅列表，统计卡片数值正确
- 订阅的软件发布新版本后，MeoW App 能收到含中文摘要的 HTML 推送
- 连续 3 次推送失败后订阅自动暂停，前端显示"订阅已暂停"状态
- 新增软件 AI 分析完成后，详情页概览 Tab 顶部显示 tagline hero 卡，核心亮点按分类带图标卡片渲染
- 历史软件未配置 `highlights` 时概览页降级为 split 兜底的「核心特性」卡片，不出现空状态报错
- 在表单「结构化洞察」区块手动增删 highlights / best_for / avoid_if 后，保存并重新打开详情页可正确渲染
- 登录后打开「设置 → 维护工具」可见 Tab 与面板；未登录时该 Tab 不出现
- 未登录情况下直接 `curl POST /api/admin/rerun/start` 返回 `401`
- `mode: 'all'` 启动后跑 2-3 条点取消，再次启动自动跳过这些条目（继续运行按钮）
- `mode: 'missing_structured'` 启动时 total 数量恰好等于结构化字段任一为空的软件数
- `mode: 'selected'` 勾选 2 条，启动后 total === 2，且仅这 2 条被刷新
- 任务运行中关闭浏览器标签 1 分钟后重开，进度条数字仍在前进（后端继续在跑）
- 模拟 Node 重启（`Ctrl+C` 后 `pnpm server`），UI 提示「上次任务保留了 N 条已处理记录」
- CLI `AUTH_TOKEN=... pnpm rerun:analyze` 在 Web Job 完成后运行时，自动跳过所有已处理条目
- ETA 在前 2 条显示「计算中…」，从第 3 条开始稳定显示 `mm:ss`
- 单条 AI 调用失败后，错误折叠面板出现该条记录，任务继续推进而非中断

---

## ❓ 常见问题

**端口被占用（5173 / 3001）**

结束占用进程或修改端口后重启。Windows PowerShell：

```powershell
Get-Process -Id <PID>
Stop-Process -Id <PID>
```



**HTTPS 域名出现 Mixed Content 错误**

前端通过 `https://` 访问时，若 API 请求走 `http://`，浏览器会拦截。

**推荐做法：**

1. 反向代理将域名 `:443` 的 `/api` 路径转发到后端 `:3001`
2. 构建时设置 `VITE_API_BASE_URL=/api` 并重新部署



**AI 分析提示「AI 尚未配置」**

请在 **设置 → AI 设置** 中完成配置并测试连接。



**AI 配置返回 401 认证失败**

确认 API Key 正确且未过期，可点击「测试连接」验证。



**报错 Failed to resolve import "vuenime"**

该依赖已从项目中移除。如需使用请手动安装：

```bash
pnpm add vuenime
```

并在 `src/main.ts` 中 `app.use(Vuenime)`。



---

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: 描述'`)
4. 发起 Pull Request

## 📄 许可证

[MIT License](LICENSE)