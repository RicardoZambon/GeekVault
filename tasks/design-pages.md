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

---
---

## Collections List

### Design Philosophy

The collections list is the **vault door** — the page users see most and the one that must sell the feeling of owning something beautiful. Grid view is the hero: large image cards with cinematic aspect ratios, warm gradient fallbacks when covers are missing, and hover states that feel like pulling a prized item off the shelf. List view exists for power users who need density — clean, information-rich rows with subtle warmth.

**Key aesthetic decisions:**
- **Grid cards use 4:3 cinematic aspect ratio** — wider than typical square cards, giving cover images room to breathe and creating a gallery wall feel
- **Hover lifts cards with shadow and a subtle amber border glow** — the signature Warm Obsidian interaction: warmth radiates from your cursor
- **Action buttons reveal on hover** with frosted glass pill backgrounds — they float over the image without obscuring it
- **Gradient fallbacks are warm and varied** — not a single boring placeholder; each empty card gets a different warm gradient from the chart palette
- **Metadata lives in a bottom gradient overlay** — white text on a darkened lower band, like a museum label beneath a painting
- **Drag handles appear only in custom sort mode** — clean by default, functional when needed
- **The toolbar is dense but clear** — search gets the most space, filters collapse on mobile into an expandable section, and the create button always stays visible with an amber accent
- **The create/edit dialog uses a proper dropzone** — drag-and-drop cover image with live preview, not a hidden file input

---

### Grid View Card Design

**Purpose**: Each grid card is a visual showcase for a collection — cover image first, metadata second. The card should feel like a framed piece in a gallery.

#### Card Container

- **Shape**: `--radius-xl` (16px) — larger radius than standard cards to feel special and gallery-like
- **Border**: `--border` (1px solid), resting state
- **Background**: `--card`
- **Shadow**: `--shadow-sm` resting
- **Overflow**: `hidden` — image and gradient stay within rounded corners
- **Aspect ratio**: `4 / 3` — applied via CSS `aspect-ratio`
- **Cursor**: `pointer`
- **Position**: `relative` — for absolute-positioned overlay elements

#### Cover Image Area (Full Card)

The image fills the entire card — the card IS the image with overlays on top.

- **With cover image**: `object-cover`, fills entire card area, `loading="lazy"`
- **Without cover image**: Warm gradient fallback + centered icon
  - Cycle through gradients based on collection index (`index % 4`):
    - Gradient 0: `linear-gradient(135deg, hsl(var(--accent)/0.20), hsl(var(--chart-3)/0.10))`
    - Gradient 1: `linear-gradient(135deg, hsl(var(--chart-2)/0.15), hsl(var(--chart-5)/0.10))`
    - Gradient 2: `linear-gradient(135deg, hsl(var(--chart-4)/0.15), hsl(var(--chart-7)/0.10))`
    - Gradient 3: `linear-gradient(135deg, hsl(var(--chart-6)/0.15), hsl(var(--accent)/0.08))`
  - Fallback icon: `Library` (lucide), 48px, `--muted-foreground/40` opacity, centered vertically and horizontally

#### Bottom Metadata Overlay

- **Position**: `absolute inset-x-0 bottom-0`
- **Background**: `linear-gradient(transparent, rgba(0,0,0,0.75))` — gradient from transparent to dark overlay
- **Padding**: `--space-5` (20px) bottom and sides, `--space-10` (40px) top (extra top space so gradient has room to fade)
- **Layout**: `flex items-end` — content sits at the bottom of the gradient band

**Content:**
- **Collection name**: `h3` typography (20px, Plus Jakarta Sans, weight 600), `white`, single line with `text-overflow: ellipsis`
- **Metadata line**: `body-sm` (14px, Inter, weight 400), `white/85` opacity
  - Format: `"{itemCount} items · {completionPercentage}% complete · Updated {relativeTime}"`
  - Parts are separated by ` · ` (middle dot with spaces)
  - Only show completion if `itemCount > 0`
  - Only show updated if `updatedAt` is not null

#### Collection Type Badge

- **Position**: `absolute top-3 left-3` (inside the card, upper-left corner)
- **Design**: Pill-shaped badge (`--radius-full`), `bg-black/40 backdrop-blur-sm`, `white` text
- **Typography**: `caption` (12px, Inter, weight 500), `text-transform: uppercase`, `letter-spacing: 0.05em`
- **Padding**: `--space-0.5` (2px) vertical, `--space-2` (8px) horizontal
- **Content**: Collection type name (e.g., "TRADING CARDS", "VINYL")
- **Visibility**: Always visible (not hover-dependent) — helps users scan collection types in the grid

#### Hover State

- **Card transform**: `y: -4px` (lifts higher than dashboard cards — this is the hero page)
- **Shadow**: Transitions from `--shadow-sm` → `--shadow-lg`
- **Border**: Color shifts to `hsl(var(--accent)/0.20)` — subtle amber glow around the frame
- **Cover image**: `scale: 1.03` with `transition: transform 400ms` — slow zoom feels cinematic
- **Transition**: `springDefault` for Framer Motion lift, CSS transition for image zoom
- **Action buttons**: Fade in from `opacity: 0` to `opacity: 1` (see action buttons section)

#### Press State

- **Card transform**: `y: -2px, scale: 0.99` — compresses slightly
- **Shadow**: Stays at `--shadow-md` (between resting and hover)
- **Transition**: `springStiff` for snappy feedback

#### Action Buttons (Hover Reveal)

Action buttons appear on hover, floating in the top-right corner of the card.

- **Container position**: `absolute top-3 right-3`
- **Layout**: `flex gap-1` — horizontal row of icon buttons
- **Visibility**: `opacity: 0` by default, `opacity: 1` on card hover (`group-hover`)
- **Mobile**: Always visible (`max-[640px]:opacity-100`) since there's no hover on touch
- **Transition**: `opacity 200ms ease-in-out`
- **Click isolation**: `onClick={(e) => e.stopPropagation()}` on the container — prevents card navigation when clicking actions

**Individual button:**
- **Size**: 32×32px (`h-8 w-8`)
- **Shape**: `--radius-full` (circle)
- **Background**: `bg-black/30 backdrop-blur-sm`
- **Text color**: `white`
- **Hover**: `bg-black/50`
- **Icon size**: 16px (h-4 w-4)

**Buttons shown:**
1. **View** (`ExternalLink` icon): Navigates to `/collections/{id}` — redundant with card click but provides explicit affordance
2. **Edit** (`Pencil` icon): Opens edit dialog
3. **More** (`MoreVertical` icon): Opens dropdown menu with:
   - **Delete** (`Trash2` icon): Opens delete confirmation — styled in `--destructive` color

#### Drag Handle (Custom Sort Only)

When `sortBy === "sortOrder"` (custom order), a drag handle appears:

- **Position**: `absolute top-3 left-3` — replaces the collection type badge position (badge moves to `top-3 left-12` when drag handle is present)
- **Design**: `bg-black/40 backdrop-blur-sm`, `--radius-md`, padding `--space-1` (4px)
- **Icon**: `GripVertical` (lucide), 16px, `white`
- **Cursor**: `grab` (becomes `grabbing` during drag)
- **Visibility**: `opacity: 0`, appears on hover (`group-hover:opacity-100`) — same pattern as action buttons
- **Mobile**: Always visible (`max-[640px]:opacity-100`)

#### Drag Active State

When a card is being dragged:
- **Ring**: 2px solid `--accent` around the card
- **Shadow**: Elevated to `--shadow-xl`
- **Scale**: `1.02` — lifted slightly larger than resting
- **Opacity**: Source card (in original position) fades to `0.3`
- **Drop placeholder**: 2px dashed `--accent` line appears between cards at the drop target position

#### Grid Layout

- **Desktop (≥1280px)**: `grid-cols-3`, gap `--space-6` (24px), `minmax(320px, 1fr)`
- **Desktop (1024px–1279px)**: `grid-cols-2`, gap `--space-6`
- **Tablet (768px–1023px)**: `grid-cols-2`, gap `--space-4` (16px)
- **Mobile (<768px)**: `grid-cols-1`, gap `--space-4`
- **Alternative**: Use `auto-fill, minmax(320px, 1fr)` for fluid behavior — current implementation uses this and it works well

#### Animation

- Non-custom-sort: `StaggerChildren` with `staggerItemVariants` (`slideUp` — opacity 0→1, y 16→0)
- Custom-sort: No entrance animation (SortableList manages its own transitions)
- Stagger delay: 60ms (default)

---

### List View Design

**Purpose**: Dense, scannable view for power users who want to compare collections by attributes. Clean table with warm accents.

#### Table Design

Uses the existing `DataTable` component:

- **Container**: `--radius-lg` border, `--card` background, overflow hidden
- **Row height**: 56px minimum — slightly taller than dashboard table rows to accommodate the collection thumbnail

#### Columns

| Column | Header | Cell Content | Width | Responsive |
|--------|--------|-------------|-------|------------|
| Name | `overline` (11px, weight 600, uppercase) | Thumbnail (40×40px, `--radius-md`, `object-cover`) + name in `body-sm` (14px, weight 500) | flex-2 | Always visible |
| Type | `overline` | Collection type name in `body-sm`, `--muted-foreground` | 140px | Hide <768px |
| Items | `overline` | Integer count in `body-sm`, `tabular-nums` | 80px | Always visible |
| Last Updated | `overline` | Relative time in `body-sm`, `--muted-foreground` | 120px | Hide <640px |

**Name cell layout:**
- `flex items-center gap-3`
- Thumbnail: 40×40px square with `--radius-md` (8px), `object-cover` if image exists, gradient fallback (same as grid card) if not
- Text: Collection name, single line with `text-overflow: ellipsis`

#### Row States

- **Resting**: Transparent background
- **Hover**: `hsl(var(--foreground)/0.04)` background overlay
- **Active/Press**: `hsl(var(--foreground)/0.06)` background
- **Separator**: 1px `--border` between rows
- **Click**: Entire row navigates to `/collections/{id}`
- **Cursor**: `pointer`

#### Animation

- Table container: `slideUp` entrance (opacity 0→1, y 16→0, 250ms)
- No individual row animation (density makes per-row animation chaotic)

---

### Toolbar Design

**Purpose**: The toolbar provides search, filtering, sorting, view toggling, and the primary create action. Dense but organized — every control has a clear purpose.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ Desktop:                                                          │
│ [🔍 Search collections...    ] [Type ▾] [Sort ▾] [⊞|≡] [+ New]  │
│                                                                   │
│ Mobile:                                                           │
│ [🔍 Search collections...    ] [⚙ Filters] [+ New]               │
│ (expandable row below when Filters tapped):                       │
│ [Type ▾        ] [Sort ▾        ]                                 │
└──────────────────────────────────────────────────────────────────┘
```

#### Spacing

- **Top margin**: `--space-6` (24px) below PageHeader
- **Layout**: `flex flex-col gap-3`
- **Top row**: `flex items-center gap-3`
- **Bottom row (mobile filters)**: `grid-rows-[0fr]` collapsed / `grid-rows-[1fr]` expanded with CSS transition

#### Search Input

- **Width**: `flex-1` with `sm:max-w-[420px]` — takes available space on mobile, capped on desktop
- **Icon**: `Search` (lucide), 16px, positioned absolutely left (`left-3, top-1/2 -translate-y-1/2`), `--muted-foreground` color
- **Input**: Standard Input component with `pl-9` for icon space
- **Placeholder**: i18n key `collections.searchPlaceholder` — "Search collections..."
- **Behavior**: Client-side filtering with 300ms debounce via `useDebounce` hook

#### Filter Selects (Desktop: Inline, Mobile: Expandable)

**Collection Type filter:**
- **Component**: `Select` with `SelectTrigger` + `SelectContent`
- **Width**: `w-[200px]` on desktop
- **Default**: "All types" — `filterType === "all"`
- **Options**: Dynamically loaded from API (`/api/collection-types`), each with optional icon prefix

**Sort select:**
- **Component**: `Select` with `ArrowUpDown` icon prefix in trigger
- **Width**: `w-[200px]` on desktop
- **Options**:
  - "Custom Order" → `sortOrder:asc`
  - "Name" → `name:asc`
  - "Last Updated" → `updatedAt:desc`
  - "Most Items" → `itemCount:desc`
  - "Recently Added" → `createdAt:desc`
- **Persistence**: `sortBy` and `sortDir` stored in `localStorage`

#### Mobile Filters Toggle

- **Button**: `variant="outline"`, `size="sm"`, icon `SlidersHorizontal` + "Filters" label
- **Visibility**: `sm:hidden` — only on mobile
- **Behavior**: Toggles a collapsible row below the search bar containing the two filter selects at `flex-1` width each

#### View Toggle

- **Component**: `Button variant="outline" size="icon"`
- **Icon**: Shows the opposite view — `List` icon when in grid view (click to switch to list), `LayoutGrid` icon when in list view
- **Tooltip**: Wraps in `TooltipProvider > Tooltip > TooltipTrigger/TooltipContent` — shows "Switch to list view" or "Switch to grid view"
- **Persistence**: `viewMode` stored in `localStorage` key `"collections-view-mode"`

#### Create Collection Button

- **Style**: `bg-accent text-accent-foreground hover:bg-accent/90` — amber accent, always prominent
- **Icon**: `Plus` (lucide), 16px, `mr-1.5`
- **Label**: i18n key `collections.create` — "New Collection"
- **Position**: `ml-auto` — pushed to the right end of the toolbar row
- **Mobile**: Still visible in top row (not collapsed into filters)

---

### Create / Edit Dialog

**Purpose**: A focused form for creating or editing a collection. The dialog is premium — clean form layout with a polished cover image dropzone.

#### Dialog Container

- **Width**: `sm:max-w-lg` (512px)
- **Background**: `--card`
- **Border**: `--border`
- **Radius**: `--radius-xl` (16px)
- **Shadow**: `--shadow-xl`
- **Entrance animation**: `scale` entrance (opacity 0→1, scale 0.95→1, 250ms `springDefault`)

#### Header

- **Title**: `h3` typography (20px, Plus Jakarta Sans, weight 600)
  - Create: "Create Collection" (`collections.createTitle`)
  - Edit: "Edit Collection" (`collections.editTitle`)
- **Description**: `body-sm` (14px, Inter), `--muted-foreground`
  - Create: "Add a new collection to your vault" (`collections.createDescription`)
  - Edit: "Update your collection details" (`collections.editDescription`)

#### Form Layout

- **Spacing**: `space-y-4` between form groups
- **Each group**: `space-y-2` between label and input

#### Form Fields

1. **Name** (required):
   - `Label` + `Input`
   - Placeholder: "e.g., Marvel Comics, Pokémon Cards..." (`collections.namePlaceholder`)
   - Validation: Cannot be empty — shows error in red banner if submitted empty

2. **Description**:
   - `Label` + `Input` (single line)
   - Placeholder: "Brief description of this collection" (`collections.descriptionPlaceholder`)

3. **Collection Type** (required):
   - `Label` + `Select`
   - Options: Loaded from API, each with optional emoji icon prefix
   - Disabled when editing (`editingId !== null`) — type cannot be changed after creation
   - Validation: Must be selected — shows error if submitted without type

4. **Cover Image**:
   - `Label` + Dropzone area
   - **Dropzone design**:
     - Border: `2px dashed --muted-foreground/25`, `--radius-lg` (12px)
     - Padding: `--space-6` (24px) vertical, `--space-6` horizontal
     - Background: `transparent`, hover → `--accent/5`
     - Border hover: `--accent/50`
     - Icon: `Upload` (lucide), 32px, `--muted-foreground/50`
     - Text (no file): "Drop cover image here or click to browse" (`collections.dropCoverHere`)
     - Text (file selected): File name in `body-sm`, weight 500, `--foreground`
     - Hidden `<input type="file" accept="image/*">` triggered by click on the dropzone
     - Drag-and-drop: `onDrop` handler accepts first image file from `e.dataTransfer.files`
   - **Preview** (when file selected): Show a small preview thumbnail (80×80px, `--radius-md`, `object-cover`) alongside the filename. Add a "Remove" text button (`body-sm`, `--destructive`) to clear the selection.

#### Error Banner

- **Placement**: Top of form (below header, above first field)
- **Design**: `--radius-md`, `--destructive/10` background, `--space-3` padding horizontal, `--space-2` vertical
- **Typography**: `body-sm`, `--destructive-foreground`

#### Footer Buttons

- **Layout**: `flex justify-end gap-2`, padding-top `--space-2`
- **Cancel**: `Button variant="outline"` — "Cancel" (`collections.cancel`)
- **Submit**: `Button` (primary style)
  - Create mode: "Create" → "Creating..." (with `Loader2` spinner icon, 16px, `animate-spin`)
  - Edit mode: "Save" → "Saving..."
  - Disabled while `submitting`

---

### Delete Confirmation Dialog

Uses the existing `ConfirmDialog` component:

- **Title**: "Delete Collection" (`collections.deleteTitle`)
- **Description**: "Are you sure you want to delete this collection? This action cannot be undone and will remove all items within it." (`collections.deleteConfirm`)
- **Confirm button**: `--destructive` style — "Delete" (`collections.delete`)
- **Cancel button**: `variant="outline"` — "Cancel" (`collections.cancel`)
- **Loading state**: "Deleting..." (`collections.deleting`) with spinner
- **Destructive styling**: Confirm button uses `--destructive` bg, `--destructive-foreground` text — visually warns this is irreversible

---

### Empty State (No Collections)

**Purpose**: When the user has zero collections, show a compelling CTA that mirrors the dashboard empty state tone — inviting, not scolding.

#### Visual Design

- **Container**: Centered, `margin-top: --space-16` (64px), max-width 400px
- **Icon**: `Library` (lucide) at 48px in `--accent` color, inside an 80px diameter circle with `--accent/10` background, `--radius-full`
- **Title**: "No collections yet" — `h2` typography (24px, Plus Jakarta Sans, weight 600)
- **Description**: "Create your first collection to start cataloging your treasures" — `body-base` (16px, Inter), `--muted-foreground`, centered, max-width 320px
- **CTA button**: "Create Collection" — primary button style with `Plus` icon, amber accent (`bg-accent text-accent-foreground`)

#### Spacing

- Icon to title: `--space-4` (16px)
- Title to description: `--space-2` (8px)
- Description to button: `--space-6` (24px)

#### Animation

Uses the existing `EmptyState` component from `ds/` — it already handles entrance animation internally.

---

### Drag-to-Reorder

**Purpose**: When sort mode is "Custom Order" (`sortOrder:asc`), users can drag cards to rearrange their collections. Only active in grid view.

#### When Active

- `sortBy === "sortOrder"` AND `viewMode === "grid"`
- Uses `SortableList` component from `ds/` (built on `@dnd-kit`)

#### Visual Feedback During Drag

- **Picked-up card**: Elevated with `--shadow-xl`, `scale: 1.02`, `ring-2 ring-accent` (amber outline)
- **Source position**: Ghost of original card at 30% opacity
- **Drop target indicator**: Other cards shift smoothly (200ms) to make space — `@dnd-kit` handles this via `SortableList`
- **Cursor**: `grabbing` on the drag handle during drag

#### Grid Configuration for SortableList

- `layout="grid"`
- `gridClassName`: Same grid class as the non-sortable grid — `"mt-6 grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]"`
- `keyExtractor`: `(c) => c.id`
- `onReorder`: Optimistic update (set state immediately), then POST to `/api/collections/reorder` with new ID order. On failure, revert to previous order and show error toast.

#### Not Available In

- List view — table row reordering is not supported (too fragile for DnD in a data table)
- Any sort mode other than "Custom Order"

---

### No Results State

When search or filter produces zero matches but the user has collections:

- **Design**: Simple centered text, `margin-top: --space-12` (48px)
- **Text**: "No collections match your search" (`collections.noResults`)
- **Typography**: `body-base`, `--muted-foreground`, `text-center`

---

### Loading State (Skeleton)

When collections are loading (`loading === true`):

#### Layout

- **PageHeader**: Real `PageHeader` component with title (not skeleton — title is static)
- **Grid skeletons**: 6 skeleton cards in the same grid layout as real cards

#### Skeleton Card

- **Container**: `--radius-xl`, overflow hidden, `aspect-ratio: 4/3`
- **Background**: Full-card `SkeletonRect` with `height: 100%`, `width: 100%`
- **Bottom overlay area**: Two skeleton text lines positioned at bottom-left (`absolute inset-x-0 bottom-0 p-4`):
  - Title line: 60% width × 20px height, 30% opacity
  - Metadata line: 40% width × 14px height, 20% opacity, `margin-top: --space-2`

#### Animation

- Skeletons render immediately (no stagger) — uses custom `skeleton-pulse` keyframe per design-motion.md
- No entrance animation — instant render so user sees structure immediately

---

### Responsive Behavior Summary

| Element | Desktop (≥1024px) | Tablet (768px–1023px) | Mobile (<768px) |
|---------|-------------------|----------------------|-----------------|
| **Grid columns** | 3-col or auto-fill(320px) | 2-col | 1-col |
| **Grid gap** | `--space-6` (24px) | `--space-4` (16px) | `--space-4` (16px) |
| **Card aspect ratio** | 4:3 | 4:3 | 4:3 |
| **Toolbar filters** | Inline in top row | Inline in top row | Collapsed, expandable |
| **View toggle** | Visible | Visible | Visible |
| **Create button** | Full label + icon | Full label + icon | Full label + icon |
| **List view columns** | 4 (Name, Type, Items, Updated) | 3 (hide Updated) | 2 (Name, Items only) |
| **Action buttons** | Hover reveal | Hover reveal | Always visible |
| **Drag handles** | Hover reveal | Hover reveal | Always visible |
| **Section gap** | `--space-8` (32px) | `--space-8` (32px) | `--space-6` (24px) |

---

### Implementation Notes

1. **Grid card `onClick` on divs** needs `tabIndex={0}`, `role="link"`, and `onKeyDown` for Enter/Space → navigate. This was flagged in the audit as an accessibility gap.
2. **Cover image zoom on hover** uses CSS `transition: transform 400ms` on the `<img>`, NOT Framer Motion — CSS handles this more smoothly for continuous hover states.
3. **Collection type badge** is a new element — not in the current implementation. Add it to provide at-a-glance type identification in grid view.
4. **Gradient fallback rotation** uses `index % 4` — the index comes from `filteredCollections.map((c, index) => ...)`. This creates visual variety even when all collections lack cover images.
5. **View mode and sort persistence** already use `localStorage` — keep this pattern.
6. **Toolbar layout** matches current implementation closely — the redesign is primarily visual (spacing, typography) rather than structural.
7. **SortableList** already exists in `ds/` — the current implementation's approach to custom sort is correct; the redesign refines the visual feedback.
8. **Action buttons stop propagation** — current implementation already handles this; preserve the pattern.
9. **File upload preview** (showing thumbnail alongside filename in the dropzone) is a new enhancement for the create/edit dialog — improves UX by confirming the right image was selected.
10. **List view thumbnail** (40×40px in the name column) is new — adds visual context to the table view that the current plain-text implementation lacks.
11. **Mobile action button visibility** (`max-[640px]:opacity-100`) — current implementation uses this pattern; keep it.
