## Design Context

### Users
- Primary users are technical practitioners and digital-tool enthusiasts maintaining software catalogs for personal organization and team selection workflows.
- Core usage contexts:
  - Curating and maintaining software records (including metadata such as icons, related resources, and release context).
  - Fast discovery through category-based browsing and global search.
  - Multi-software comparison and AI-assisted evaluation for decision-making.
- The product is also used for sharing curated software knowledge across others (LAN/shared access and share links).

### Brand Personality
- Three-word personality: rational, refined, restrained.
- Emotional goals:
  - Calm efficiency for daily management.
  - Professional trustworthiness for selection decisions.
  - Subtle technology exploration feel, especially in AI-related moments.
- Tone guidance:
  - Utility-first and precise.
  - Detailed and polished in interaction quality.
  - Never noisy, playful, or trend-chasing.

### Aesthetic Direction
- Direction: minimal foundation with subtle tech accents.
- Theme strategy: light and dark are equally first-class (no secondary mode).
- Color strategy:
  - Required primary accent: HSL 160-degree green family (`--primary-h: 160`).
  - Neutral grays/slates dominate overall surfaces and typography.
  - Avoid warm high-saturation dominant palettes (large red/orange/yellow fields).
- Visual language:
  - Clean structure, restrained glass/blur usage, soft borders, measured depth.
  - Technology-signaling motion/effects should be concentrated in AI workflows, not spread everywhere.
- References:
  - Positive: Nuxt UI/Nuxt visual language, Linear, Raycast (precision, polish, restraint).
  - Anti-reference: crowded legacy admin dashboards and over-decorated SaaS gradient-heavy UIs.

### Design Principles
1. Information First: prioritize scanability, findability, and decision clarity over decorative novelty.
2. Calm by Default, Expressive by Context: keep base UI restrained; reserve high-impact motion/effects for AI and comparison moments.
3. Accent Discipline: neutrals carry hierarchy; green accent communicates action/state and remains sparse for emphasis.
4. Dual-Theme Parity: every screen/component must feel intentionally designed in both light and dark modes.
5. Accessible Precision: support reduced motion, maintain at least WCAG AA contrast targets, and avoid color-only critical cues.
