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

## ✅ 手动验证清单

- 启动后端后无 `[SCHEMA]` 迁移警告
- 未登录请求写接口返回 `401`；登录后正常
- 上传非图片或超限文件返回 `400`；频繁上传返回 `429`
- 「对比结果」弹窗默认展示详情，不出现空白
- 图片多次加载后无 `localStorage` 满额报错（已改用 IndexedDB 缓存）

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