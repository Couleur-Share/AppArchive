## Design Context

### Users
- Primary users are technical practitioners and digital-tool enthusiasts maintaining software catalogs for personal organization and team selection workflows.
- Core usage contexts:
  - Curating and maintaining software records (including metadata such as icons, related resources, and release context).
  - Fast discovery through category-based browsing and global search.
  - Multi-software comparison and AI-assisted evaluation for decision-making.
- The product is also used for sharing curated software knowledge across others (LAN/shared access and share links).

### Tech Stack
- **Framework**: Vue 3 (Composition API + `<script setup>`) · TypeScript
- **Styling**: Tailwind CSS (utility-first) · CSS custom properties for design tokens
- **Icons**: `lucide-vue-next` (tree-shakable, import individual icons)
- **Animation**: GSAP for complex motion; CSS transitions for micro-interactions
- **Build**: Vite 5 · Biome (lint + format)
- **Token files**: `src/style.css` (global tokens) · `src/styles/base.css` (base resets & backgrounds)

### Brand Personality
- Three-word personality: precise, immersive, functional.
- Emotional goals:
  - Calm efficiency — the UI recedes so software content takes center stage.
  - Professional trustworthiness for selection decisions.
  - Subtle technology-signaling feel concentrated in AI workflows.
- Tone guidance:
  - Utility-first and compact.
  - Dark-first immersive experience — the interface disappears behind content.
  - Never noisy, playful, or trend-chasing.

### Aesthetic Direction
- Direction: Spotify-inspired "content-first darkness" with achromatic UI and functional green accent.
- Theme strategy: dark mode is the signature experience; light mode is a fully supported alternative (class-based `darkMode: "class"`).
- Color strategy:
  - Brand accent: green (`#1ed760`, `--primary-h: 141`, `--primary-s: 75%`, `--primary-l: 48%`), inspired by Spotify's palette.
  - Green is functional only — active states, CTAs, state indicators. Never decorative or used on large surfaces.
  - Dark surfaces: near-black (`#121212` → `#181818` → `#1f1f1f`), depth via shade variation.
  - Light surfaces: soft gray-greens (`#f3f5f4` → `#e8ece9`) with subtle green-tinted radial accents.
  - Text: white (`#ffffff`) primary / silver (`#b3b3b3`) secondary on dark; slate spectrum on light.
  - Semantic: negative red (`#f3727f`), warning orange (`#ffa42b`), announcement blue (`#539df5`).
  - Avoid warm high-saturation dominant palettes (large red/orange/yellow fields).
- Visual language:
  - Uniform moderate rounding: buttons, cards, inputs, tags all share a cohesive radius around `--radius: 12px`. No pill (500px+) or circle (50%) shapes.
  - Heavy shadows on dark backgrounds (`rgba(0,0,0,0.3)–rgba(0,0,0,0.5)` at 8px–24px blur).
  - Compact, dense layout — every pixel serves the task, not decorative breathing room.
  - Technology-signaling motion/effects concentrated in AI workflows, not spread everywhere.
- Reference: Spotify Web Player (dark immersion, functional green, content-as-color) — adapted with restrained modern rounding instead of pill geometry.
- Anti-reference: crowded legacy admin dashboards, over-decorated SaaS gradient-heavy UIs, light-mode-first generic dashboards.

### Typography Rules
- Font: system stack via Tailwind (no custom web fonts).
- Hierarchy through weight contrast (700 bold / 400 regular), not size variation.
- Compact sizing range: body 16px, nav/caption/button 14px, small 12px, heading up to 32px.
- Button labels: normal case by default; uppercase + wide letter-spacing reserved for special emphasis only.

### Component Patterns
- **Buttons**: rounded rectangle (`--radius: 12px`), dark surface (`#1f1f1f`), white text. Same rounding as cards.
- **Cards**: `#181818` or `#1f1f1f` on dark, `#f7f9fb` on light. Radius `--radius`. Hover: background lightening + shadow intensification.
- **Inputs**: rounded rectangle (8px), `#1f1f1f` on dark with inset border-shadow combo.
- **Elevation**: 4 levels — Base (`#121212`) → Surface (`#181818`) → Elevated (shadow 0.3 opacity) → Dialog (shadow 0.5 opacity, 24px blur).
- **Scrollbars**: thin (5px), rounded, muted thumb colors matching theme.
- **Modals**: backdrop blur, gradient panel backgrounds, green-tinted emphasis borders, radius 12px (16px on mobile).

### Spacing & Layout
- Base unit: 8px. Scale: 4px / 8px / 12px / 16px / 20px.
- Border radius scale: 2px (badges/tags) → 4px (small elements) → 8px (inputs) → 12px (buttons/cards/sections, `--radius: 12px`) → 16px (modals on mobile).
- Default transition: 150ms `cubic-bezier(0.4, 0, 0.2, 1)`.

### Quick Color Reference
| Role | Token / Dark | Light |
|------|-------------|-------|
| Background | `#121212` | `#f3f5f4` |
| Surface | `#181818` | `#f7f9fb` |
| Interactive | `#1f1f1f` | `#ffffff` |
| Accent 400 | `--theme-primary-400: #4de17e` | same |
| Accent 500 | `--theme-primary-500: #1ed760` | same |
| Accent 600 | `--theme-primary-600: #1db954` | same |
| Accent 700 | `--theme-primary-700: #169c46` | same |
| Text primary | `#ffffff` | `rgb(17 24 39)` |
| Text secondary | `#b3b3b3` | `rgb(100 116 139)` |
| Border | `rgb(255 255 255 / 0.08)` | `rgb(15 23 42 / 0.08)` |
| Error | `#f3727f` | `#f3727f` |

### Design Principles
1. Content First: the UI is achromatic by design — software icons and content provide the color. Interface recedes into dark/neutral backgrounds.
2. Functional Green: brand accent (`#1ed760`) communicates action and state only. It remains sparse for emphasis — never used decoratively or on large surfaces.
3. Compact Density: this is an app for scanning catalogs and making decisions, not a marketing site. Pack content tightly; dark backgrounds provide visual rest without large gaps.
4. Dual-Theme Support: both dark and light modes must feel intentionally designed. Dark is signature; light is not an afterthought.
5. Accessible Precision: support `prefers-reduced-motion`, maintain WCAG AA contrast targets, avoid color-only critical cues.
