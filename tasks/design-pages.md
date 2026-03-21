# GeekVault Page Designs

## Dashboard

### Design Philosophy

The dashboard is the collector's **command center** — a warm, inviting overview that makes users feel proud of their collection and excited to engage. It draws from the "Warm Obsidian" identity: amber accents glow like display case lighting against warm stone surfaces, typography feels refined and premium, and every section enters with purposeful motion.

**Key aesthetic decisions:**
- **Time-aware greeting** creates emotional connection (not just "Dashboard")
- **Stats row uses display typography** — large animated numbers feel like a trophy case counter
- **Charts use the full warm palette** — not the old hardcoded navy/gold; pulls from `--chart-1` through `--chart-8` tokens
- **Collection summaries are visual cards** with gradient fallbacks — not text-heavy list items
- **Recent acquisitions use a refined data table** — clean typography with condition badges adding color pops
- **Empty state is a compelling onboarding moment** — not an afterthought
- **Every section staggers in** using Framer Motion — the page "assembles" on load, creating a sense of crafted quality

---

### Overall Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Greeting Section                                            │
│  "Good morning, Ralph" + subtitle                            │
│  gap: --space-8 (32px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Stats Row (5 cards)                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                        │
│  │Coll│ │Item│ │Own │ │Val │ │Inv │                          │
│  └────┘ └────┘ └────┘ └────┘ └────┘                        │
│  gap: --space-8 (32px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Charts Section (2-column grid)                              │
│  ┌─────────────────┐ ┌─────────────────┐                    │
│  │  Pie: Items by   │ │  Bar: Condition  │                    │
│  │  Condition        │ │  Breakdown       │                    │
│  └─────────────────┘ └─────────────────┘                    │
│  gap: --space-8 (32px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Collection Summaries (3-column grid)                        │
│  ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │  Col 1 │ │  Col 2 │ │  Col 3 │                           │
│  └────────┘ └────────┘ └────────┘                           │
│  gap: --space-8 (32px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Recent Acquisitions (data table)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Name  │ Condition │ Price │ Value │ Date │ Source   │   │
│  │  ...   │  ...      │ ...   │  ...  │ ...  │  ...     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- **Section spacing**: `--space-8` (32px) between all major sections — consistent vertical rhythm
- **Page container**: Uses the standard content area from design-layout.md (padding `px-6 py-6` desktop, `px-4 py-6` tablet, `px-4 py-4` mobile)
- **Max content width**: None — content stretches to fill available space within the content area. Grids and cards handle their own sizing.

---

### Greeting / Welcome Section

**Purpose**: Creates a personal, time-aware welcome that sets an emotional tone. This is the first thing the user sees — it should feel warm and intentional.

#### Content

- **Primary text**: Time-aware greeting with user's display name
  - 5:00–11:59 → "Good morning, {name}"
  - 12:00–16:59 → "Good afternoon, {name}"
  - 17:00–4:59 → "Good evening, {name}"
  - Fallback (no name): "Welcome back" / "Welcome to GeekVault"
- **Subtitle**: Dynamic context line showing collection count
  - With data: "You have {n} collections with {m} items" (using i18n interpolation)
  - No data yet: "Start building your collection today"

#### Typography

- **Greeting**: `display-lg` (2.25rem / 36px, weight 700, Plus Jakarta Sans, letter-spacing -0.02em)
- **Subtitle**: `body-lg` (1.125rem / 18px, weight 400, Inter) in `--muted-foreground` color

#### Spacing

- Gap between greeting and subtitle: `--space-1.5` (6px)
- Bottom margin of the greeting section: `--space-2` (8px) — the section gap `--space-8` handles the rest

#### Animation

- Greeting text: `fade` entrance (opacity 0→1, 250ms, ease-enter)
- Subtitle: `fade` entrance with 60ms stagger delay after greeting

#### i18n Keys

- `dashboard.greeting.morning`: "Good morning, {{name}}"
- `dashboard.greeting.afternoon`: "Good afternoon, {{name}}"
- `dashboard.greeting.evening`: "Good evening, {{name}}"
- `dashboard.greeting.welcomeBack`: "Welcome back"
- `dashboard.subtitle.withData`: "You have {{collections}} collections with {{items}} items"
- `dashboard.subtitle.empty`: "Start building your collection today"

---

### Stats Row

**Purpose**: At-a-glance metrics that make the collector feel the weight and value of their collection. Large animated numbers create visual impact.

#### Metrics (5 cards)

| Position | Metric | Icon | Format |
|----------|--------|------|--------|
| 1 | Total Collections | `Library` (lucide) | Integer with AnimatedNumber |
| 2 | Total Items | `Package` (lucide) | Integer with AnimatedNumber |
| 3 | Owned Copies | `Box` (lucide) | Integer with AnimatedNumber |
| 4 | Total Value | `DollarSign` (lucide) | Currency with AnimatedNumber |
| 5 | Total Invested | `TrendingUp` (lucide) | Currency with AnimatedNumber |

#### Card Design

Each stat card uses the existing `StatCard` component from `ds/` with these visual specifications:

- **Container**: `--radius-lg` (12px), `--border` border, `--card` background, `--shadow-sm` resting shadow
- **Padding**: `--space-5` (20px) all sides
- **Layout**: Horizontal — icon left, text right
- **Icon container**: 40×40px, `--radius-md` (8px), `--accent/10` background (subtle amber tint), icon in `--accent` color, 20px icon size
- **Label**: `body-sm` (14px, Inter, weight 400), `--muted-foreground` color, positioned above the value
- **Value**: `h2` (24px, Plus Jakarta Sans, weight 600), `--foreground` color, `font-variant-numeric: tabular-nums`
- **Hover**: `y: -2px`, shadow increases to `--shadow-md`, border color shifts to `--accent/10` — uses `springDefault` transition
- **Press**: `y: 0, scale: 0.99` — uses `springStiff` transition

#### Trend Indicator (future enhancement)

Each card has space for an optional trend indicator below the value:
- **Up trend**: Small `TrendingUp` icon (12px) + percentage in `--success` color
- **Down trend**: Small `TrendingDown` icon (12px) + percentage in `--destructive` color
- **Neutral**: No indicator shown
- **Typography**: `caption` (12px, Inter, weight 500)
- **Note**: The API does not currently return trend data. Design accommodates it for future implementation without requiring backend changes now.

#### Grid Layout

- **Desktop (≥1024px)**: `grid-cols-5` — all 5 cards in one row, gap `--space-4` (16px)
- **Tablet (768px–1023px)**: `grid-cols-3` — first row: 3 cards, second row: 2 cards centered, gap `--space-4`
- **Mobile (<768px)**: `grid-cols-2` — 2 cards per row, last card spans full width (`col-span-2`), gap `--space-3` (12px)

#### Animation

- Container: `StaggerChildren` with default 60ms stagger
- Each card: `scale` entrance variant (opacity 0→1, scale 0.95→1, 200ms)

---

### Charts Section

**Purpose**: Visual breakdown of the collection's composition. The pie chart shows condition distribution, the bar chart shows the same data as a sortable comparison.

#### Layout

- **Desktop**: `grid-cols-2`, gap `--space-6` (24px)
- **Tablet**: `grid-cols-2`, gap `--space-4` (16px)
- **Mobile**: `grid-cols-1` — charts stack vertically, gap `--space-4`

#### Chart Card Container

Both charts share the same card treatment:
- **Container**: `--radius-lg`, `--border`, `--card` background, `--shadow-sm`
- **Card header**: `h3` title (20px, Plus Jakarta Sans, weight 600), padding `--space-5` (20px) top/sides, `--space-3` bottom
- **Card content**: padding `--space-5` sides, `--space-4` bottom
- **Chart area height**: 256px (h-64)

#### Pie Chart — "Items by Condition"

- **Chart type**: `PieChart` from recharts with `Pie` component
- **Donut style**: `innerRadius={50}` `outerRadius={80}` — donut rather than full pie for a modern feel
- **Center label**: Total count displayed in the donut hole — `display-lg` size, `--foreground` color
- **Slice colors**: Use `--chart-1` through `--chart-N` tokens (mapped via CSS variable resolution in JS). Each `Cell` gets `fill={`hsl(var(--chart-${index + 1}))`}` — this ensures dark mode automatically gets the brighter variants
- **Labels**: External labels disabled (too cluttered). Use legend instead.
- **Legend**: Custom legend below the chart — horizontal flex-wrap layout, each item is a colored dot (8px circle) + condition name in `caption` typography, gap `--space-3` between items
- **Tooltip**: Custom styled tooltip with `--card` background, `--border` border, `--radius-md`, `--shadow-md`, padding `--space-2 --space-3`. Shows condition name + count + percentage.
- **Empty state**: When `itemsByCondition` is empty, show a muted message "No condition data yet" centered in the chart area with `body-sm` typography in `--muted-foreground`

#### Bar Chart — "Condition Breakdown"

- **Chart type**: `BarChart` from recharts
- **Bar styling**: Single `Bar` with `fill={`hsl(var(--chart-1))`}` (amber), `radius={[6, 6, 0, 0]}` (rounded top corners matching `--radius-sm`)
- **CartesianGrid**: `strokeDasharray="3 3"`, stroke color `hsl(var(--border))` — uses CSS variable for theme-awareness
- **XAxis**: `dataKey="condition"`, tick text in `caption` typography (12px), fill `hsl(var(--muted-foreground))`
- **YAxis**: `allowDecimals={false}`, tick text in `caption` typography, fill `hsl(var(--muted-foreground))`, hide axis line
- **Tooltip**: Same custom tooltip as pie chart
- **Bar hover**: Individual bar brightens slightly — use `onMouseEnter` to add subtle opacity change
- **Active bar**: `fill={`hsl(var(--accent))`}` on hover for a warm glow effect

#### Animation

- Chart cards enter together as a pair with `slideUp` entrance (opacity 0→1, y 16→0, 250ms)
- Charts themselves use recharts' built-in `isAnimationActive` with 800ms duration for the initial data render

---

### Collection Summaries Section

**Purpose**: Quick visual access to the user's collections. Each card is a mini-preview that invites exploration.

#### Section Header

- **Title**: "Your Collections" — `h2` typography (24px, Plus Jakarta Sans, weight 600)
- **"View all" link**: Right-aligned, `body-sm` typography, `--accent` color, hover underline animation (slides in from left). Links to `/collections`. Only shown when collections exist.
- **Layout**: `flex justify-between items-center`, margin-bottom `--space-4`

#### Collection Card Design

Each collection summary card:

- **Container**: `--radius-lg`, `--border`, `--card` background, `--shadow-sm`, overflow hidden, cursor pointer
- **Cover image area** (top):
  - Height: 120px
  - If collection has a cover image: `object-cover` filling the area with `--radius-none` (flush with card edges)
  - If no cover image: Gradient fallback — use collection index to pick from a set of warm gradient combinations:
    - Gradient 1: `linear-gradient(135deg, hsl(var(--accent)/0.15), hsl(var(--accent)/0.05))`
    - Gradient 2: `linear-gradient(135deg, hsl(var(--chart-2)/0.12), hsl(var(--chart-5)/0.08))`
    - Gradient 3: `linear-gradient(135deg, hsl(var(--chart-3)/0.12), hsl(var(--chart-6)/0.08))`
  - Fallback icon: `Library` from lucide, 32px, `--muted-foreground/40` opacity, centered in the gradient area
- **Content area** (bottom):
  - Padding: `--space-4` (16px)
  - **Title**: `h4` (18px, Plus Jakarta Sans, weight 600), `--foreground`, single line with `text-overflow: ellipsis`
  - **Metadata rows**: Three key-value pairs stacked vertically, gap `--space-1` (4px)
    - Items: label in `body-sm` `--muted-foreground`, value in `body-sm` `--foreground` weight 500
    - Owned: same treatment
    - Value: same treatment, uses currency format with `tabular-nums`
  - **Row layout**: `flex justify-between` for each key-value pair

#### Hover State

- Card lifts: `y: -2px`, shadow → `--shadow-md`, border color shifts to `--accent/10`
- Cover image area: subtle scale `1.02` with `overflow: hidden` on container to clip
- Transition: `springDefault` for Framer Motion

#### Click Action

- Navigates to `/collections/{id}`
- Entire card is clickable (not just the title)
- Keyboard accessible: `tabIndex={0}`, `role="link"`, `onKeyDown` handles Enter

#### Grid Layout

- **Desktop (≥1024px)**: `grid-cols-3`, gap `--space-6` (24px)
- **Tablet (768px–1023px)**: `grid-cols-2`, gap `--space-4`
- **Mobile (<768px)**: `grid-cols-1`, gap `--space-4`

#### Max Items and "View All"

- Show maximum **6** collection cards on the dashboard
- If more than 6 collections exist, show the "View all ({n})" link in the section header

#### Animation

- Section header: `fade` entrance
- Cards: `StaggerChildren` with `slideUp` entrance variants, 60ms stagger

#### i18n Keys

- `dashboard.yourCollections`: "Your Collections"
- `dashboard.viewAll`: "View all"
- `dashboard.viewAllCount`: "View all ({{count}})"

---

### Recent Acquisitions Section

**Purpose**: A chronological view of the latest items added to the collection. Creates a sense of momentum and recency.

#### Section Header

- **Title**: "Recent Acquisitions" — `h2` typography (24px, Plus Jakarta Sans, weight 600)
- **Margin-bottom**: `--space-4`

#### Table Design

Uses the existing `DataTable` component with these specifications:

- **Container**: `--radius-lg` border, `--card` background, overflow hidden
- **Row count limit**: Show latest **8** acquisitions maximum
- **Row height**: Minimum 48px (44px min touch target + 4px for visual comfort)

#### Columns

| Column | Header Typography | Cell Typography | Width | Notes |
|--------|------------------|-----------------|-------|-------|
| Item Name | `overline` (11px, weight 600, uppercase, Inter) | `body-sm` (14px, weight 500, Inter) | flex-2 | Primary identifier — slightly bolder weight |
| Condition | `overline` | Badge component | 100px fixed | Color-coded badge (see badge spec below) |
| Price Paid | `overline` | `body-sm`, `tabular-nums` | 110px fixed | Format: `$1,234.56` or em-dash if null |
| Est. Value | `overline` | `body-sm`, `tabular-nums` | 110px fixed | Same format as price |
| Date | `overline` | `body-sm`, `--muted-foreground` | 100px fixed | Relative date preferred: "Today", "Yesterday", "3 days ago", "Mar 15" (if >7 days) |
| Source | `overline` | `body-sm`, `--muted-foreground` | 100px fixed | Acquisition source or em-dash if null |

#### Condition Badge Colors

Using the existing `Badge` component variants:

| Condition | Variant | Background (light) | Text (light) |
|-----------|---------|-------------------|--------------|
| Mint | `success` | `--success/10` bg | `--success` text |
| Near Mint | `primary` | `--primary/10` bg | `--primary` text |
| Excellent | `primary` | `--primary/10` bg | `--primary` text |
| Good | `accent` | `--accent/10` bg | `--accent` text |
| Fair | `warning` | `--warning/10` bg | `--warning` text |
| Poor | `destructive` | `--destructive/10` bg | `--destructive` text |

#### Table Row States

- **Resting**: No background / transparent
- **Hover**: `--foreground/4` (subtle overlay) — uses `rgba` hover pattern from design-tokens
- **Alternating rows**: None — clean, minimal, use hover to identify rows
- **Separator**: 1px `--border` between rows

#### Responsive Behavior

- **Desktop**: Full table with all 6 columns visible
- **Tablet**: Hide "Source" column — 5 columns
- **Mobile**: Hide "Source" and "Est. Value" columns — 4 columns. Table gets horizontal scroll if needed with `-webkit-overflow-scrolling: touch`

#### Animation

- Section header: `fade` entrance
- Table container: `slideUp` entrance (opacity 0→1, y 16→0)
- Table rows: No individual animation (too dense — the container animation is sufficient)

---

### Empty State (No Collections)

**Purpose**: When a new user has no collections, the dashboard shows a single compelling CTA to get started. This is a critical onboarding moment.

#### When Shown

- `totalCollections === 0` after loading completes
- Replaces ALL dashboard sections (stats, charts, summaries, recent) — only the greeting section + empty state show

#### Visual Design

- **Container**: Centered on page, max-width 480px, padding `--space-10` (40px)
- **Icon**: Custom illustration or large icon — use `Sparkles` from lucide at 48px in `--accent` color, with a subtle `--accent/10` circular background (80px diameter, `--radius-full`)
- **Title**: "Start your collection" — `h1` typography (30px, Plus Jakarta Sans, weight 700)
- **Description**: "Create your first collection to begin cataloging, tracking, and valuing the things you love." — `body-lg` (18px, Inter, weight 400), `--muted-foreground`, max-width 360px, centered
- **Primary CTA button**: "Create Collection" — primary button style (`--primary` bg, `--primary-foreground` text), `--radius-md`, padding `--space-2 --space-6`, `h4` typography (18px, weight 600)
- **Secondary hint**: Below the button, `caption` text (12px): "or press ⌘K to search" — `--muted-foreground`, links to opening command palette

#### Spacing

- Icon to title: `--space-4` (16px)
- Title to description: `--space-2` (8px)
- Description to button: `--space-6` (24px)
- Button to hint: `--space-3` (12px)

#### Animation

- Icon: `scale` entrance (opacity 0→1, scale 0.9→1, 400ms deliberate duration, `springGentle`)
- Title: `fade` entrance, 100ms delay after icon
- Description: `fade` entrance, 160ms delay
- Button: `slideUp` entrance, 220ms delay
- Overall: The stagger creates a "reveal" moment that feels intentional

#### i18n Keys

- `emptyStates.dashboard.title`: "Start your collection"
- `emptyStates.dashboard.description`: "Create your first collection to begin cataloging, tracking, and valuing the things you love."
- `emptyStates.dashboard.action`: "Create Collection"
- `emptyStates.dashboard.hint`: "or press ⌘K to search"

---

### Loading State (Skeleton Layout)

**Purpose**: While dashboard data loads, show skeletons that match the exact layout of the final content. This prevents layout shift and sets user expectations.

#### Skeleton Design Rules

Per design-motion.md:
- **Background**: `hsl(var(--muted))` with pulse overlay
- **Pulse animation**: Custom keyframe `skeleton-pulse` — opacity 0.4→1.0→0.4, 1.5s cycle, `ease-in-out`
- **Shape**: Rounded with `--radius-md` (8px)
- **No Tailwind `animate-pulse`** — use the custom keyframe for `prefers-reduced-motion` respect

#### Section-by-Section Skeleton

**Greeting skeleton:**
- Title line: 280px wide, 36px tall rectangle
- Subtitle line: 200px wide, 18px tall rectangle, 6px below

**Stats row skeleton:**
- 5 cards in the same grid layout as real cards
- Each card: border + bg-card + padding, containing:
  - 40×40px square (icon) + two text lines (60% width × 14px, 40% width × 24px)

**Charts skeleton:**
- 2 cards in 2-column grid
- Each card: header skeleton (50% width × 20px) + content area skeleton (100% width × 256px)

**Collection summaries skeleton:**
- Title skeleton (200px × 24px)
- 3 cards in grid
- Each card: 120px image area + 3 text lines below

**Recent acquisitions skeleton:**
- Title skeleton (240px × 24px)
- 5 rows of full-width 20px tall rectangles, gap `--space-3`

#### Animation

- Skeletons should NOT stagger — they appear all at once (instant render) so the user sees the full page structure immediately
- Only the pulse animation runs

---

### Responsive Behavior Summary

| Section | Desktop (≥1024px) | Tablet (768px–1023px) | Mobile (<768px) |
|---------|-------------------|----------------------|-----------------|
| **Greeting** | `display-lg` (36px) | `display-lg` (36px) | `h1` (30px) |
| **Stats row** | 5-column grid | 3-column grid | 2-column grid (last spans 2) |
| **Charts** | 2-column grid | 2-column grid | 1-column stack |
| **Collection summaries** | 3-column grid | 2-column grid | 1-column stack |
| **Recent acquisitions** | 6 columns | 5 columns (hide source) | 4 columns (hide source + est. value) |
| **Empty state** | Centered, 480px max | Centered, 480px max | Full width, padding 16px |
| **Section gap** | `--space-8` (32px) | `--space-8` (32px) | `--space-6` (24px) |

#### Breakpoint-Specific Notes

- **Tablet**: Stats grid switches from 5→3 columns. Charts remain 2-column since they're compact enough. Summaries go from 3→2 columns.
- **Mobile**: Greeting text size drops one step. Stats use a 2-column grid for compact display. Charts and summaries stack to single column. Table hides two columns and enables horizontal scroll if needed. Section gap tightens from 32px→24px for less scrolling.

---

### Implementation Notes

1. **Chart colors must use CSS variables** — `hsl(var(--chart-1))` etc. — NOT hardcoded hex values. This ensures automatic dark mode support.
2. **AnimatedNumber** component already exists in `ds/` — reuse it, don't recreate.
3. **StaggerChildren** and `staggerItemVariants` already exist in `ds/motion.tsx` — wrap each section in StaggerChildren.
4. **DataTable** component exists in `ds/` — reuse for recent acquisitions.
5. **StatCard** component exists in `ds/` — reuse for stats row.
6. **Empty state**: Currently uses `Lock` icon — change to `Sparkles` for a more inviting feel.
7. **Charts section currently returns `null`** when empty — should show the muted "No data yet" message instead.
8. **Collection summaries currently return `null`** when empty — acceptable for summaries (nothing to show is nothing to show), but add the section header with "No collections yet" text.
9. **Currency formatting**: Use user's locale via `toLocaleString()` — already implemented in current code.
10. **Date formatting for recent acquisitions**: Consider using `Intl.RelativeTimeFormat` for "2 days ago" style or stick with `toLocaleDateString()` for simplicity in initial implementation.
11. **Keyboard accessibility**: Collection summary cards need `tabIndex={0}`, `role="link"`, and `onKeyDown` handling for Enter/Space.
12. **The dashboard page itself** should be wrapped in a top-level `StaggerChildren` with each major section as a stagger child — this creates the page "assembly" effect on load.
