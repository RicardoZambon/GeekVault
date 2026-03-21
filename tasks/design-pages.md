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

---

## Collection Detail

### Design Philosophy

The collection detail page is the **heart of the vault** — where a collector spends the most time browsing, organizing, and admiring their items. It must balance information density (items grid, sets, stats, filters) with visual clarity. The cover image banner at the top creates an immersive "you are inside this collection" feeling, while the tabbed content below stays organized and scannable.

**Key aesthetic decisions:**
- **Cover image as cinematic banner** — not a small thumbnail; it fills the top of the page like a hero section, anchoring the collection's visual identity
- **Frosted glass metadata overlay** on the banner — collection name, type, and stats float over the cover image with a warm-tinted backdrop blur
- **Tab-based content organization** — Items, Sets, Stats as clear sections rather than a monolithic scroll. Tabs use the amber accent underline to indicate active state
- **Stats summary inline in header** — key metrics (item count, total value, completion %) are visible without switching tabs
- **Search and filter bar is persistent within Items tab** — always accessible, not hidden behind a toggle
- **Grid and list views persist per collection** — localStorage remembers the user's preference for each collection
- **Back navigation via text link** — not breadcrumbs (per design-layout.md: back links on detail pages, Linear/Notion pattern)
- **Import wizard is prominently placed** — it's a key action, not buried in a menu

---

### Overall Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Collections                                       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │         Cover Image Banner (240px desktop)               ││
│  │                                                          ││
│  │  ┌────────────────────────────────────────────┐          ││
│  │  │  [Type Badge]                               │          ││
│  │  │  Collection Name (display-lg)               │          ││
│  │  │  Description (body-base, muted)             │          ││
│  │  │  📦 42 items · 💰 $1,240 value · 🎯 85%    │          ││
│  │  └────────────────────────────────────────────┘          ││
│  │                                          [Edit] [⋯]      ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  gap: --space-6 (24px)                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  [All Items]  [Sets (3)]  [Stats]                        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ═══════════════ Tab Content Area ═══════════════            │
│                                                              │
│  Items Tab:                                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  [🔍 Search...] [Condition▾] [All|Owned|Unowned]         ││
│  │  [Sort▾] [↑↓]                [Grid|List] [↓Ex] [↑Im] [+]││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │  Item  │ │  Item  │ │  Item  │ │  Item  │               │
│  │  Card  │ │  Card  │ │  Card  │ │  Card  │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │  Item  │ │  Item  │ │  Item  │ │  Item  │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
└──────────────────────────────────────────────────────────────┘
```

- **Section spacing**: `--space-6` (24px) between banner and tabs, `--space-4` (16px) between toolbar and content
- **Page container**: Standard content area padding from design-layout.md
- **No max content width**: Content stretches to fill available space; grids handle their own sizing

---

### Back Navigation

- **Element**: Ghost button with left arrow icon
- **Text**: "Back to Collections" (i18n key: `collectionDetail.backToCollections`)
- **Icon**: `ArrowLeft` from lucide-react, `h-4 w-4`, placed before text
- **Spacing**: `mb-4` below the button before the banner begins
- **Behavior**: Navigates to `/collections`
- **Keyboard**: Focusable, Enter/Space triggers navigation

---

### Collection Header / Banner

#### Cover Image Treatment

- **Container**: Full-width, `rounded-xl` (`--radius-xl`, 16px), `overflow-hidden`, `relative`
- **Height**: `h-60` (240px) desktop, `h-48` (192px) tablet, `h-40` (160px) mobile
- **Image**: `object-cover`, `w-full`, `h-full` — fills the container entirely
- **Overlay**: Gradient from bottom — `bg-gradient-to-t from-black/70 via-black/30 to-transparent` — ensures text readability on any image
- **No cover image fallback**: When no cover image exists, show a warm gradient background using the collection's index-based rotation (same 4-gradient pattern as collections list page):
  - Gradient 0: `from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]`
  - Gradient 1: `from-[hsl(var(--chart-3))] to-[hsl(var(--chart-4))]`
  - Gradient 2: `from-[hsl(var(--chart-5))] to-[hsl(var(--chart-6))]`
  - Gradient 3: `from-[hsl(var(--chart-7))] to-[hsl(var(--chart-8))]`
  - Each at 15% opacity: `opacity-15` with a centered `Package` icon (`h-16 w-16`, `text-foreground/20`)

#### Metadata Overlay (on banner)

Positioned at the bottom-left of the banner, over the gradient overlay:

- **Container**: `absolute bottom-0 left-0 right-0 p-6` (desktop), `p-4` (mobile)
- **Collection type badge**: `Badge` component with `variant="primary"`, `size="sm"` — e.g., "Trading Cards", "Vinyl Records". Placed above the title with `mb-2`
- **Collection name**: `display-lg` (2.25rem / 36px, weight 700, Plus Jakarta Sans, letter-spacing -0.02em), `text-white`, `drop-shadow-lg`
- **Description**: `body-base` (1rem / 16px, Inter), `text-white/80`, `line-clamp-2` (max 2 lines), `mt-1`
- **Stats row**: Inline metrics below description, `mt-3`, `flex items-center gap-4 flex-wrap`
  - Each stat: `text-sm text-white/90 font-medium flex items-center gap-1.5`
  - Stats shown: `📦 {n} items` · `💰 ${value} value` · `🎯 {n}% complete` (if sets exist)
  - Icons: `Package` (items), `DollarSign` or currency icon (value), `Target` (completion) — all `h-3.5 w-3.5`
  - Separator: `·` character in `text-white/50`
  - Value and completion only show if data exists (not zero)

#### Action Buttons (on banner)

Positioned at the bottom-right of the banner:

- **Container**: `absolute bottom-6 right-6 flex items-center gap-2`
- **Edit button**: `Button` with `variant="secondary"`, `size="sm"`, glass effect: `bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30`
  - Icon: `Pencil` `h-3.5 w-3.5`
  - Label: "Edit" (i18n)
- **More actions dropdown**: `DropdownMenu` trigger — icon-only button matching edit button glass style
  - Icon: `MoreVertical` `h-4 w-4`
  - Dropdown items: "Import Items" (Upload icon), "Export Items" (Download icon), "Delete Collection" (Trash2 icon, `text-destructive`)
  - **Delete** uses destructive text color and shows `ConfirmDialog` on click

---

### Tab Navigation

#### Structure

Three tabs: **All Items**, **Sets**, **Stats**

- **Container**: `flex border-b border-border mt-6`
- **Tab button**: `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors`
  - **Active**: `border-accent text-foreground`
  - **Inactive**: `border-transparent text-muted-foreground hover:text-foreground hover:border-border`
- **Sets tab** shows count: "Sets (3)" — count from `sets.length`
- **Stats tab** only renders if collection has items (otherwise hidden)
- **Keyboard**: Arrow keys move between tabs, Enter/Space selects, `role="tablist"` + `role="tab"` + `aria-selected`
- **Animation**: Tab content uses `AnimatePresence mode="wait"` — exit old tab content (fade out, 150ms), enter new (fade in + slide-up 8px, 250ms)

---

### Items Tab

#### Toolbar Layout

Two rows:

**Row 1 — Actions bar** (between view toggle and action buttons):
```
[Grid|List]                              [Export] [Import] [+ Add Item]
```

- **View toggle**: Same segmented control pattern as current — two icon buttons in a bordered container
  - Grid icon: `LayoutGrid`, List icon: `List` — both `h-4 w-4`
  - Active state: `bg-primary text-primary-foreground`
  - Inactive: `bg-transparent text-muted-foreground hover:text-foreground`
  - Persisted in localStorage per collection: key `geekvault-view-{collectionId}`
- **Export button**: `variant="outline"`, `size="sm"`, `Download` icon + "Export" label
- **Import button**: `variant="outline"`, `size="sm"`, `Upload` icon + "Import" label
- **Add Item button**: `bg-accent text-accent-foreground hover:bg-accent/90`, `Plus` icon + "Add Item" label

**Row 2 — Search and filters** (`mt-3`):
```
[🔍 Search items...]  [Condition ▾]  [All|Owned|Unowned]  [Sort ▾] [↑↓]
```

- **Search input**: `relative flex-1 min-w-0 sm:min-w-[180px]`, `Search` icon at `left-2.5 top-2.5`, `pl-9 h-9`
  - Placeholder: "Search items..." (i18n)
  - Updates URL search param (debounced)
- **Condition filter**: `Select` component, `h-9 w-full sm:w-[160px]`
  - Options: All, Mint, Near Mint, Excellent, Good, Fair, Poor
- **Owned status toggle**: Segmented control (same pattern as view toggle)
  - Three options: All, Owned, Unowned
  - `px-3 py-1.5 text-xs font-medium`
- **Sort select**: `Select`, `h-9 w-full sm:w-[120px]`
  - Options: Custom, Name, Price, Value, Date, Rarity
- **Sort direction**: Icon-only button, `h-9 w-9`, `ArrowUp` / `ArrowDown` based on current direction

#### Grid View — Item Cards

- **Grid**: `grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, `mt-4`
- **Card container**: `Card` with `rounded-lg` (`--radius-lg`, 12px), `overflow-hidden`, `cursor-pointer`, `group`
  - Note: Item cards use `--radius-lg` (12px), not `--radius-xl` (16px) like collection cards — these are smaller, denser items
- **Image area**: `aspect-square bg-muted relative`
  - With image: `object-cover h-full w-full`, CSS `transition: transform 400ms` for hover zoom (`group-hover:scale-105`)
  - No image: Gradient placeholder `from-primary/5 to-accent/5` with centered `Image` icon (`h-10 w-10 text-muted-foreground/30`)
- **Owned indicator**: Green circle badge at `top-2 right-2`, `bg-success`, `Check` icon `h-3 w-3 text-white`
- **Drag handle**: `absolute top-2 left-2 z-10`, `bg-black/40 text-white rounded p-1`, `opacity-0 group-hover:opacity-100 transition-opacity`
  - `GripVertical` icon `h-3.5 w-3.5`
  - Only visible when sort is "custom"
- **Context menu** (use as cover): `absolute top-2 right-2 z-10` (shifts to right-10 when owned badge is present), `opacity-0 group-hover:opacity-100`
  - Only appears if item has an image
- **Hover overlay**: `absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all` with centered "View" pill
- **Card body**: `p-3 space-y-1`
  - **Item name**: `text-sm font-medium text-foreground line-clamp-1`
  - **Identifier**: `text-xs text-muted-foreground`
  - **Rarity badge** (if present): `Badge variant="outline" size="sm"`, `mt-1`
- **Hover effect**: `-translate-y-0.5`, `shadow-lg` via `transition-all`
- **Press effect**: None (card navigates on click)
- **Active ring** (owned items): `ring-2 ring-success/50`
- **Drag active**: `ring-2 ring-accent shadow-lg`
- **Keyboard**: `tabIndex={0}`, `role="link"`, `onKeyDown` Enter/Space → navigate to `/collections/{id}/items/{itemId}`

#### List View — Data Table

- **Columns**:
  1. **Thumbnail**: 40×40px image in `rounded bg-muted`, fallback `Image` icon — `w-[60px]`
  2. **Name**: Primary text, `sortable: true`
  3. **Identifier**: Secondary text
  4. **Status**: Owned = `Badge variant="success"`, Unowned = `Badge variant="outline"`
  5. **Rarity**: Text or "—" if null
  6. **Actions**: `DropdownMenu` with "Use as Cover" (only if item has image) — `w-[48px]`
- **Row click**: Navigates to item detail page
- **Row hover**: `hover:bg-muted/50`
- **Responsive column hiding**: Hide Rarity at `<1024px`, hide Identifier at `<768px`

#### Empty State

- **Icon**: `Package` from lucide-react
- **Title**: "No items yet" (i18n: `emptyStates.collectionDetail.title`)
- **Description**: "Add your first item to start building this collection" (i18n: `emptyStates.collectionDetail.description`)
- **Action button**: "Add Item" — opens add item dialog
- **No-results variant**: When search/filter returns empty but collection has items:
  - Title: "No matching items"
  - Description: "Try adjusting your search or filters"
  - Action: "Clear filters" — resets all URL search params

#### Drag-to-Reorder

- Only active when sort = "custom" (default sort)
- Uses `SortableList` from `ds/` with `layout="grid"`
- **Drag feedback**: `ring-2 ring-accent`, `shadow-xl`, `scale-1.02` (matches collections list spec)
- **Optimistic update**: Reorder items immediately in UI, revert on API error with toast notification

---

### Sets Tab

- **Header bar**: `flex items-center justify-between mt-4 mb-4`
  - **Title**: "Sets" `text-lg font-semibold`
  - **Create Set button**: `Button` with `variant="outline"`, `size="sm"`, `Plus` icon + "Create Set"
- **Sets list**: Expandable accordion-style cards
  - **Set card**: `Card` with `p-4`, `cursor-pointer`, `hover:bg-muted/30 transition-colors`
    - **Row layout**: `flex items-center justify-between`
    - **Left side**: `flex items-center gap-3`
      - Expand chevron: `ChevronDown` icon, `h-4 w-4`, rotates 180° when expanded (`transition-transform`)
      - Set name: `text-sm font-medium`
      - Completion badge: `text-xs text-muted-foreground` — e.g., "12/20 items"
    - **Right side**: `flex items-center gap-2`
      - Progress bar: `w-24 h-2 rounded-full bg-muted overflow-hidden` with inner fill `bg-accent` at `width: {completionPercentage}%`, `transition-all duration-slow`
      - Percentage text: `text-xs font-medium` — e.g., "60%"
        - Color by completion: `<50%` = `text-muted-foreground`, `50-99%` = `text-accent`, `100%` = `text-success`
      - Edit button: `Pencil` icon button, `h-8 w-8`
      - Delete button: `Trash2` icon button, `h-8 w-8`, `hover:text-destructive`
  - **Expanded content**: `AnimatePresence` with slide-down animation (`height: 0 → auto`, 250ms, ease-enter)
    - **Items list**: `mt-3 space-y-1 pl-8`
    - Each item row: `flex items-center gap-2 py-1.5 text-sm`
      - Owned indicator: `CheckCircle2` (green, `text-success`) or `Circle` (muted, `text-muted-foreground/40`)
      - Item name: `text-foreground` if owned, `text-muted-foreground` if not
      - If linked to catalog item: clickable, hover underline
    - **Add items button**: At bottom of expanded list, `text-xs text-accent hover:underline cursor-pointer`
    - **Remove item**: `Trash2` icon on hover, `h-3.5 w-3.5`, `text-muted-foreground hover:text-destructive`

- **Empty state**: When no sets exist
  - Icon: `Package` or `Layers` icon
  - Title: "No sets yet"
  - Description: "Create sets to track completion of themed subgroups"
  - Action: "Create Set" button

---

### Stats Tab

- **Layout**: `mt-4 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

#### Stats Cards

- **Total Items**: `StatCard` — icon `Package`, value = item count, label "Total Items"
- **Owned Items**: `StatCard` — icon `Check`, value = owned count, label "Owned Items", subtitle showing ownership percentage
- **Total Value**: `StatCard` — icon `DollarSign`, value = total value (formatted currency), label "Total Value"
- **Sets Completion** (if sets exist): `StatCard` — icon `Target`, value = avg completion %, label "Set Completion"
- **Card design**: Same `StatCard` component from dashboard with `--radius-lg`, `border`, `p-4`, amber icon container, animated number

#### Condition Breakdown Chart

- **Container**: `Card` with `p-6`, `col-span-1 md:col-span-2 lg:col-span-2`
- **Chart**: Donut chart (recharts `PieChart` with `innerRadius` + `outerRadius`) showing items by condition
- **Colors**: Use `hsl(var(--chart-N))` palette
- **Legend**: Custom legend below chart with condition name + count + percentage

#### Rarity Distribution Chart (if rarity data exists)

- **Container**: `Card` with `p-6`
- **Chart**: Horizontal bar chart showing items per rarity level
- **Colors**: `hsl(var(--chart-N))` palette

---

### Add Item Dialog

- **Trigger**: "Add Item" button in toolbar
- **Dialog**: `Dialog` + `DialogContent` — max-width `max-w-lg`
- **Form layout**: `space-y-4`
  - **Identifier** (required): `Label` + `Input`, full width
  - **Name** (required): `Label` + `Input`, full width
  - **Description**: `Label` + `Textarea`, full width
  - **Release Date**: `Label` + `Input type="date"`, half width
  - **Manufacturer**: `Label` + `Input`, half width (side-by-side with release date on desktop)
  - **Reference Code**: `Label` + `Input`, half width
  - **Rarity**: `Label` + `Input`, half width (side-by-side with reference code)
  - **Image upload**: Dropzone — `border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer`
    - Idle: `Upload` icon + "Click or drag image" text
    - With file: Thumbnail preview (64×64px, `object-cover rounded`) + filename + "Remove" link
  - **Custom fields** (dynamic, from collection type): Rendered based on `collectionType.customFields` — `Input` for text, `Select` for options, with required indicator `*`
- **Footer**: `flex justify-end gap-2`
  - Cancel: `variant="ghost"`
  - Submit: `bg-accent text-accent-foreground`, loading spinner when submitting
- **Error display**: `text-sm text-destructive mt-2` below form

---

### Export Dialog

- **Dialog**: `Dialog` + `DialogContent`, compact `max-w-sm`
- **Format selection**: Two radio-style cards side by side
  - CSV card: File icon + "CSV" + "Spreadsheet compatible"
  - JSON card: Code icon + "JSON" + "Full data with metadata"
  - Active: `ring-2 ring-accent`
- **Footer**: Cancel + "Export" button (with loading state)
- **Error**: Inline text below format cards

---

### Import Dialog

- Renders `ImportWizard` component in a dialog
- Entry point: "Import Items" in toolbar or "Import Items" in banner dropdown
- Full-width dialog: `max-w-2xl`

---

### Loading State

- **Banner skeleton**: `rounded-xl` container with `h-60` (desktop), custom `skeleton-pulse` animation
  - Overlay area: Two line skeletons (title + description widths) at bottom-left
- **Tab bar skeleton**: Three pill-shaped skeletons inline, `h-8 w-20` each
- **Toolbar skeleton**: Full-width `h-9` bar + row of filter skeletons
- **Grid skeleton**: 4-column grid of card skeletons — `aspect-square` image area + two text lines below
  - 8 skeleton cards total

#### Animation

- Skeletons render immediately — uses custom `skeleton-pulse` keyframe per design-motion.md
- No entrance animation on loading state — instant render so user sees structure

---

### Error / Not Found State

- **Not found**: Centered layout with `text-muted-foreground` message + "Back to Collections" outline button
- **Fetch error**: Inline error banner below the header — `rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive`

---

### Responsive Behavior Summary

| Element | Desktop (≥1024px) | Tablet (768px–1023px) | Mobile (<768px) |
|---------|-------------------|----------------------|-----------------|
| **Banner height** | `h-60` (240px) | `h-48` (192px) | `h-40` (160px) |
| **Banner padding** | `p-6` | `p-5` | `p-4` |
| **Banner text** | `display-lg` (36px) | `display-lg` (36px) | `text-xl` (20px, font-bold) |
| **Stats in banner** | Inline row, all stats | Inline row, all stats | Wrap, hide value if zero |
| **Action buttons** | On banner, glass style | On banner, glass style | Below banner, standard buttons |
| **Tab bar** | Full-width | Full-width | Full-width, scrollable if needed |
| **Toolbar row 1** | Single row | Single row | Stack: view toggle above, actions below |
| **Toolbar row 2** | Single row | Wrap naturally | Stack vertically, full-width inputs |
| **Items grid columns** | 4-col | 3-col | 1-col (or 2-col for small cards) |
| **Items grid gap** | `--space-4` (16px) | `--space-4` (16px) | `--space-3` (12px) |
| **Card aspect ratio** | `aspect-square` | `aspect-square` | `aspect-square` |
| **List view columns** | All 6 | Hide Rarity | Hide Rarity + Identifier |
| **Set card layout** | Full row with progress bar | Full row | Stack progress below name |
| **Stats tab grid** | 3-col | 2-col | 1-col |
| **Section gap** | `--space-6` (24px) | `--space-6` (24px) | `--space-4` (16px) |

---

### Implementation Notes

1. **Cover image banner** is the biggest visual change from current — current shows a small `h-48/h-56` image strip; redesign makes it a full-width hero with metadata overlay. The gradient overlay and text positioning are critical for readability on any image.
2. **Frosted glass action buttons** on the banner use `bg-white/20 backdrop-blur-sm border-white/30` — same pattern as collection grid card action buttons but adapted for the banner context.
3. **Gradient fallback** for missing covers uses the same 4-gradient rotation from collections list page — `index % 4` but here the index can be derived from `collection.id % 4` since there's only one collection.
4. **Stats in the banner** replace the old separate stats display — embedding them in the hero reduces vertical space usage and creates a more cohesive header.
5. **Tab animation** uses `AnimatePresence mode="wait"` for content switching — keep it lightweight (fade + small y offset) to avoid feeling slow when switching tabs frequently.
6. **Set accordion expand** uses Framer Motion `animate={{ height: "auto" }}` — this requires measuring content height. Consider using `layout` prop for smooth height transitions.
7. **Completion percentage color thresholds** (muted < 50%, accent 50-99%, success 100%) create visual reward as sets approach completion — this is a deliberate gamification touch.
8. **Mobile action buttons** move below the banner instead of floating on it — avoids touch target issues with absolute positioning on small screens. Use standard button variants instead of glass effect.
9. **Custom fields in add-item form** are dynamically rendered from `collectionType.customFields` — the form must handle text inputs, select dropdowns (for fields with options), and required field validation.
10. **Image hover zoom** on grid item cards uses CSS `transition: transform 400ms`, NOT Framer Motion — matches the pattern established in collections list page.
11. **Search filters persist in URL params** — current implementation already does this correctly; preserve the pattern for shareable/bookmarkable filtered views.

---

## Catalog Item Detail

### Design Philosophy

The catalog item detail page is the **collector's inspection table** — where a single item receives full attention. It draws from the experience of holding a treasured object up to the light: the image dominates, metadata is organized like a museum label, and owned copies are presented like a provenance record. The Warm Obsidian palette wraps this in amber warmth, stone surfaces, and refined typography.

**Key aesthetic decisions:**
- **Side-by-side hero layout** on desktop — large image on the left, item identity and metadata on the right, mimicking a product detail page or auction house listing
- **Image is the anchor** — square aspect ratio, generous sizing (2/5 of the grid), with a subtle warm fallback state for items without images
- **Metadata reads like a curated label** — overline labels, clean hierarchy, custom fields in a grouped card
- **Owned copies are premium cards** — condition badge with color semantics, icon-paired details, hover-reveal actions, thumbnail gallery
- **Back navigation via breadcrumb trail** — Collections > [Collection Name] > [Item Name], providing full location awareness
- **Set membership as a contextual callout** — subtle link card showing which sets this item belongs to, with completion hints

---

### Overall Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Breadcrumb: Collections > Collection Name > Item Name       │
│  gap: --space-6 (24px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Hero Section (5-column grid)                                │
│  ┌──────────────┐ ┌──────────────────────────────┐          │
│  │              │ │  Item Name (display-lg)       │          │
│  │   Item       │ │  Identifier (body, muted)     │          │
│  │   Image      │ │                               │          │
│  │  (2/5 cols)  │ │  [Edit] [Delete] [Add Copy]   │          │
│  │              │ │                               │          │
│  │  aspect-     │ │  Description (if present)     │          │
│  │  square      │ │                               │          │
│  │              │ │  Metadata fields grid          │          │
│  └──────────────┘ │  (manufacturer, date, etc.)   │          │
│                    └──────────────────────────────┘          │
│  gap: --space-6 (24px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Custom Fields Card (if any)                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Custom Fields (heading)                              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                │   │
│  │  │ Field 1 │ │ Field 2 │ │ Field 3 │                │   │
│  │  └─────────┘ └─────────┘ └─────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
│  gap: --space-6 (24px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Set Membership (if item belongs to any sets)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Part of: "Complete Saga Set" (12/20) [→]            │   │
│  └──────────────────────────────────────────────────────┘   │
│  gap: --space-6 (24px)                                       │
├──────────────────────────────────────────────────────────────┤
│  Owned Copies Section                                        │
│  PageHeader: "Owned Copies" + [Add Copy] button             │
│  ┌─────────────────┐ ┌─────────────────┐                    │
│  │  Copy Card 1     │ │  Copy Card 2     │                    │
│  │  [Mint] badge    │ │  [Good] badge    │                    │
│  │  Price, Date,    │ │  Price, Date,    │                    │
│  │  Source, Notes   │ │  Source, Notes   │                    │
│  │  [thumbnails]    │ │  [thumbnails]    │                    │
│  └─────────────────┘ └─────────────────┘                    │
│  OR                                                          │
│  EmptyState: "No copies yet" + [Add Copy]                   │
└──────────────────────────────────────────────────────────────┘
```

**Section spacing:** `--space-6` (24px) between all sections, matching the page-section spacing for detail pages (slightly tighter than dashboard's `--space-8` because detail pages are denser).

---

### Back Navigation — Breadcrumb Trail

The catalog item detail page uses a **full breadcrumb trail** rather than a simple back button. This is the one page where breadcrumbs are essential — the user is 3 levels deep (Collections > Collection > Item) and needs clear location awareness.

**Structure:**
```
Collections  ›  [Collection Name]  ›  [Item Name]
```

**Visual specification:**
- **Container:** `nav` element, `flex items-center gap-1.5`, top of page
- **Text style:** `text-sm text-muted-foreground`
- **Link segments** ("Collections", collection name): `hover:text-foreground transition-colors` — color shifts on hover, no underline
- **Separator:** `ChevronRight` icon, `h-3.5 w-3.5`, same muted color
- **Current item:** `text-foreground font-medium truncate max-w-[200px]` — highlighted as current location, truncated if long
- **Keyboard accessible:** Links are native `<Link>` elements (already focusable)

---

### Item Hero Layout

The hero section is the visual centerpiece — a **5-column grid** with the image occupying 2 columns and item identity occupying 3 columns on desktop.

#### Image Panel (Left — `lg:col-span-2`)

**Container:**
- Card with `variant="flat"`, `overflow-hidden`
- `aspect-square` aspect ratio — consistent square format for all items
- Background: `bg-muted` (warm stone surface when loading or as fallback)
- Border radius: inherits Card's `--radius-lg` (12px)

**With image:**
- `<img>` with `h-full w-full object-cover` — fills the square, crops to fit
- `loading="lazy"` for performance
- **Hover effect:** Subtle `scale(1.03)` zoom using CSS `transition: transform 400ms ease` — NOT Framer Motion (continuous hover state pattern from codebase patterns)
- Container has `overflow-hidden` to clip the zoomed image

**Without image (fallback):**
- Centered `Image` icon from lucide-react: `h-16 w-16 text-muted-foreground/30`
- `flex h-full items-center justify-center`
- The muted background creates a warm placeholder — no gradient needed (unlike collection cards, items are individual objects, not galleries)

#### Identity Panel (Right — `lg:col-span-3`)

**Item name:**
- `font-display text-3xl font-bold tracking-tight text-foreground`
- Plus Jakarta Sans display font — the item name is the hero text

**Identifier (below name):**
- `mt-1 text-base text-muted-foreground`
- Acts as a subtitle — e.g., catalog number, ISBN, SKU

**Action buttons (below identifier):**
- Container: `flex flex-wrap gap-2`, `mt-4` spacing from identifier
- **Edit button:** `variant="outline" size="sm"` — `Pencil` icon + label
- **Delete button:** `variant="outline" size="sm"` with `text-destructive hover:text-destructive` — `Trash2` icon + label
- **Add Copy button:** `size="sm"` with `bg-accent text-accent-foreground hover:bg-accent/90` — `Plus` icon + label. This is the **primary action** on this page, so it uses the accent color (amber)

**Description (conditional):**
- Only shown if `item.description` exists
- Overline label: `text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5`
- Body text: `text-sm leading-relaxed text-foreground`
- Top padding: `pt-2` to separate from actions

---

### Metadata Display

Core metadata fields are displayed as a **structured grid** of label-value pairs in the identity panel, below the description.

**Grid layout:**
- `grid gap-x-6 gap-y-3 sm:grid-cols-2`
- Fields shown conditionally — only display if the value exists (no empty slots)

**Field rendering pattern:**
- **Label:** `text-xs font-semibold uppercase tracking-wider text-muted-foreground` (overline style)
- **Value:** `text-sm text-foreground mt-0.5`

**Core fields:**

| Field | Icon | Value Treatment |
|---|---|---|
| Manufacturer | None | Plain text |
| Release Date | `Calendar` h-3.5 w-3.5, muted | `formatDate()` — e.g., "Mar 15, 2024" |
| Reference Code | None | Plain text |
| Rarity | None | `Badge variant="accent" size="sm"` — amber badge for rarity as it's a special attribute |

**Date display:** Uses locale-aware `toLocaleDateString` with `{ year: "numeric", month: "short", day: "numeric" }` format. Calendar icon inline at `flex items-center gap-1.5`.

---

### Custom Fields Card

When a catalog item has custom field values (defined by its collection type), they are displayed in a separate **Card** below the hero section.

**Card design:**
- `Card variant="flat"` — flat card with warm stone surface
- Padding: `p-6` on `CardContent`
- Heading: `font-display text-base font-semibold mb-4` — "Custom Fields" (or collection-type-specific label)

**Fields grid:**
- `grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3`
- Each field uses the same overline-label + value pattern as core metadata

**Type-specific rendering:**
- **Text/Number/Date:** Plain text `text-sm text-foreground`
- **Boolean:** `Check` icon (h-4 w-4, text-success) for true, `X` icon (h-4 w-4, text-muted-foreground) for false
- **Enum:** `Badge variant="outline" size="sm"` — outlined badge for enum values
- **Date:** Formatted via `formatDate()` helper

---

### Set Membership Indicator

When the item belongs to one or more sets, a **contextual callout card** appears between custom fields and owned copies.

**Design:**
- Card-like row: `rounded-lg border border-border bg-muted/50 px-4 py-3`
- Layout: `flex items-center justify-between`
- Left side: `flex items-center gap-3`
  - Icon: `Box` (lucide), `h-5 w-5 text-accent` — amber icon draws attention
  - Text: "Part of: **[Set Name]**" — set name in `font-medium`
  - Completion badge: `text-sm text-muted-foreground` — e.g., "(12/20 items)"
  - Completion color: follows established thresholds — `text-muted-foreground` (<50%), `text-accent` (50-99%), `text-success` (100%)
- Right side: `ChevronRight` icon, `h-4 w-4 text-muted-foreground` — indicates navigable
- **Entire row is clickable** — navigates to the set detail page within the collection
- Hover state: `hover:bg-muted hover:border-accent/30 transition-colors` — subtle amber border glow
- **Keyboard accessible:** `tabIndex={0}`, `role="link"`, `onKeyDown` for Enter/Space

**Multiple sets:** If an item belongs to multiple sets, stack multiple rows with `space-y-2` gap between them. Each row links to its respective set.

**No sets:** Section is simply not rendered — no empty state needed since set membership is informational, not actionable from this page.

---

### Owned Copies Section

The owned copies section is the **provenance record** — each copy is a card showing its condition, financial details, acquisition history, and images.

**Section header:**
- Uses `PageHeader` component with:
  - Title: "Owned Copies" (translated)
  - Action: `[Add Copy]` button — `size="sm"`, accent color, `Plus` icon
  - `className="mb-4"`

#### Empty State

When no copies exist:
- Uses `EmptyState` component
- Icon: `Box` (lucide) — represents an empty display case
- Title: "No copies yet"
- Description: "Add your first owned copy of this item"
- Action: "Add Copy" button → triggers add copy dialog
- Tone: encouraging, not empty/sad

#### Copy Card Design

Cards are rendered in a **staggered grid**: `StaggerChildren className="grid gap-4 sm:grid-cols-2"` — 2-column on sm+, 1-column on mobile.

Each card uses `motion.div` with `staggerItemVariants` for entrance animation.

**Card container:**
- `Card variant="flat"` with `group h-full`
- `CardContent` with `p-5` padding

**Card header (condition badge + actions):**
- `flex items-start justify-between mb-4`
- **Condition badge:** `Badge` with size `md` and semantic variant:
  - **Mint, Near Mint:** `variant="success"` — green, best conditions
  - **Excellent, Good:** `variant="primary"` — neutral, mid-range conditions
  - **Fair, Poor:** `variant="warning"` — amber/orange, lower conditions
- **Action buttons:** `flex gap-1` with `opacity-0 group-hover:opacity-100 transition-opacity`
  - Edit: `Button variant="ghost" size="sm"` with `Pencil` icon (h-3.5 w-3.5)
  - Delete: `Button variant="ghost" size="sm"` with `Trash2` icon, `text-destructive hover:text-destructive`
  - **Mobile:** Actions should always be visible on touch devices — use `sm:opacity-0 sm:group-hover:opacity-100` so they show by default on mobile

**Copy details grid:**
- `grid gap-3 sm:grid-cols-2` — 2-column layout for detail pairs
- Each detail pair: `flex items-start gap-2`
  - Icon: `h-4 w-4 text-muted-foreground mt-0.5 shrink-0`
  - Label: `text-xs font-medium text-muted-foreground`
  - Value: `text-sm` (or `text-sm font-semibold` for financial values)

| Detail | Icon | Value Format |
|---|---|---|
| Purchase Price | `DollarSign` | `$XX.XX` with `font-semibold`, `font-variant-numeric: tabular-nums` |
| Estimated Value | `Tag` | `$XX.XX` with `font-semibold`, `font-variant-numeric: tabular-nums` |
| Acquisition Date | `Calendar` | Formatted date via `formatDate()` |
| Acquisition Source | `ShoppingBag` | Plain text |

**Notes section (conditional):**
- `mt-3 pt-3 border-t border-border` — separated by a divider
- `flex items-start gap-2` with `FileText` icon
- Label + value pattern matching other fields
- Text can wrap naturally — no truncation

**Thumbnail gallery (conditional):**
- Appears below notes (or below details grid if no notes)
- `mt-3 pt-3 border-t border-border` — separated by a divider
- `flex gap-2 flex-wrap` — wrapping row of thumbnails
- Each thumbnail:
  - `h-16 w-16 rounded-md border object-cover`
  - `hover:ring-2 hover:ring-accent transition-shadow` — amber ring on hover
  - `loading="lazy"` for performance
  - `cursor-pointer` — clickable (future: opens lightbox)
  - Alt text: "Copy image N" (accessibility)

---

### Add/Edit Owned Copy Flow

The add/edit owned copy uses a **dialog** pattern — consistent with other CRUD operations throughout the app.

**Dialog design:**
- `DialogContent className="sm:max-w-lg"`
- Header: `DialogTitle` + `DialogDescription` — different text for add vs edit mode
- Form layout: `space-y-4`

**Error banner:**
- `rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground`
- Appears at top of form when validation or submission fails

**Form fields:**

1. **Condition select** (full width)
   - Native `<select>` styled to match input theme
   - Options: Mint, Near Mint, Excellent, Good, Fair, Poor
   - `h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm`

2. **Purchase Price + Estimated Value** (2-column grid: `grid gap-4 sm:grid-cols-2`)
   - `type="number" step="0.01" min="0"`
   - Placeholder: "0.00"

3. **Acquisition Date + Source** (2-column grid)
   - Date: `type="date"`
   - Source: text input with placeholder (e.g., "eBay, Local store, Gift...")

4. **Notes** (full width)
   - Text input with placeholder
   - Single-line currently — consider textarea in future if notes are frequently long

5. **Images** (full width)
   - `type="file" accept="image/*" multiple`
   - When editing an existing copy with images: show existing image thumbnails below the upload input
   - Existing thumbnails: `h-16 w-16 rounded border object-cover` in a flex wrap row

**Dialog actions:**
- `flex justify-end gap-2 pt-2`
- Cancel: `variant="outline"`, closes dialog
- Save: Primary button with loading spinner (`Loader2 animate-spin`) when submitting

---

### Back Navigation

The breadcrumb trail (described above) serves as the primary back navigation. Additionally:

- **Browser back button** works naturally via React Router
- **After deleting an item:** Navigates back to collection detail page (`/collections/{collectionId}`)
- **After successful edit:** Stays on the same page, data refreshes
- **Not Found state:** If the item doesn't exist, shows centered message with "Back to Collection" button

---

### Loading State (Skeleton)

The loading skeleton mirrors the final layout structure for a smooth transition:

**Breadcrumb skeleton:**
- `SkeletonRect width="240px" height="16px"`

**Hero section skeleton:**
- 5-column grid matching hero layout
- Left (2/5): `SkeletonRect className="aspect-square w-full rounded-lg"` — square image placeholder
- Right (3/5): `space-y-4`
  - Title: `SkeletonRect width="60%" height="32px"`
  - Identifier: `SkeletonRect width="40%" height="20px"`
  - Action buttons: `flex gap-2` with 3 small skeleton rects (`80px×36px`, `80px×36px`, `100px×36px`)
  - Description: `SkeletonText lines={3}` (multiple line placeholders)

**Custom fields skeleton:**
- Card with `p-6` padding
- Section heading: `SkeletonRect width="120px" height="20px" className="mb-4"`
- 3-column grid of 4 field placeholders: `SkeletonRect width="80px" height="12px"` (label) + `SkeletonRect width="120px" height="16px"` (value)

**Copies skeleton:**
- Section heading: `SkeletonRect width="160px" height="24px" className="mb-4"`
- 2-column grid of 2 copy card placeholders: `SkeletonRect className="h-40 rounded-lg"`

---

### Error / Not Found State

If the item fails to load or doesn't exist:

- **Container:** `text-center py-12`
- **Message:** `text-muted-foreground` — "Item not found" (translated)
- **Action:** `Button variant="outline" className="mt-4"` — "Back to Collection"
- Navigates to `/collections/{collectionId}`

---

### Responsive Summary

| Element | Desktop (≥1024px) | Tablet (≥640px) | Mobile (<640px) |
|---|---|---|---|
| **Breadcrumb** | Full trail, all segments | Full trail | Truncate item name at 200px |
| **Hero grid** | 5-col (2+3) | 5-col (2+3) | Stack vertically (image full width, then info) |
| **Image size** | 2/5 of grid, aspect-square | 2/5 of grid | Full width, aspect-square |
| **Action buttons** | Inline row | Inline row | Wrap naturally (`flex-wrap`) |
| **Core metadata** | 2-col grid | 2-col grid | 1-col stack |
| **Custom fields** | 3-col grid | 2-col grid | 1-col stack |
| **Set membership** | Full row | Full row | Full row (compact) |
| **Copies grid** | 2-col | 2-col | 1-col |
| **Copy actions** | Hover-reveal | Hover-reveal | Always visible |
| **Thumbnails** | 16×16 wrap row | 16×16 wrap row | 16×16 wrap row |
| **Dialog width** | `sm:max-w-2xl` (edit item) / `sm:max-w-lg` (copy) | Full width with padding | Full width |
| **Section gap** | `--space-6` (24px) | `--space-6` (24px) | `--space-6` (24px) |

**Key mobile adaptations:**
- Hero grid stacks: image takes full width, then identity panel below. Grid switches from `lg:grid-cols-5` to 1-column default.
- Custom fields grid collapses: 3-col → 2-col → 1-col
- Copy card actions are always visible on mobile (no hover on touch)
- Dialogs go full-width on mobile, with `max-h-[90vh] overflow-y-auto` for scrolling

---

### Implementation Notes

1. **Hero grid uses `lg:grid-cols-5`** — the 2/5 + 3/5 split gives the image generous but not dominant space. On mobile, it naturally collapses to a single column.
2. **Image hover zoom** uses CSS `transition: transform 400ms ease` on the `<img>`, NOT Framer Motion — matches the continuous hover state pattern from collections list page. Container needs `overflow-hidden` to clip the zoomed image.
3. **Condition badge color mapping** uses a simple conditional: Mint/NearMint → `success`, Excellent/Good → `primary`, Fair/Poor → `warning`. This creates a visual quality gradient across the conditions.
4. **Copy card action visibility** currently uses `opacity-0 group-hover:opacity-100`. For mobile/touch support, update to `sm:opacity-0 sm:group-hover:opacity-100` so actions are always visible on small screens.
5. **Financial values** should use `font-variant-numeric: tabular-nums` (Inter supports this natively) for aligned decimal columns in copy detail grids.
6. **Set membership section** is a future enhancement — current API doesn't return set membership for individual items. Design is ready; implementation depends on API support. Show the section only when the data is available.
7. **Thumbnail click behavior** — currently thumbnails are display-only. The design supports a future lightbox (US-011 will design the image gallery interaction in detail). For now, thumbnails show `hover:ring-2 hover:ring-accent` as a visual affordance.
8. **Breadcrumb vs back links** — this page uses breadcrumbs unlike most other pages (which use sidebar highlight + back links). Breadcrumbs are warranted here because the user is 3 levels deep and needs to navigate to either the collection or the collections list.
9. **Edit item dialog** uses `sm:max-w-2xl` (wider than copy dialog) because it has more fields including custom fields, which need space for the 2-column grid layout.
10. **Delete flows** are consistent: item deletion navigates back to collection; copy deletion stays on the page and refreshes the copies list.

---

## Owned Copies

### Design Philosophy

Owned copies are the **provenance records** of a collector's vault — each copy is a tangible proof of ownership, a story of acquisition, and a financial data point. This section elevates copy management from basic CRUD to a premium experience that makes collectors feel like curators documenting their treasures.

**Key aesthetic decisions:**
- **Copy cards feel like museum provenance cards** — structured layout with condition as the hero visual element, financial data in tabular alignment, and images as proof-of-condition thumbnails
- **Condition badge is the emotional anchor** — large, color-coded, immediately communicating quality tier at a glance. Green for pristine, neutral for solid, warm amber for worn
- **Image gallery is a first-class feature** — not just thumbnails; a full lightbox with navigation, zoom, and keyboard support. Collectors photograph their items meticulously; the UI should honor that care
- **Inline editing reduces friction** — quick-edit condition or price without opening a full dialog; respects the collector's flow when cataloging many copies
- **Multi-image upload feels modern** — drag-and-drop zone with instant preview grid, individual removal, and reorder capability. Not a bare file input
- **Financial values use tabular figures** — Inter's `font-variant-numeric: tabular-nums` ensures prices align in columns, creating the precision feel of an appraisal sheet

---

### Copy Card Design (Detailed)

The copy card is the primary representation of an owned copy. It appears in the Owned Copies section of the Catalog Item Detail page in a staggered 2-column grid.

#### Card Layout

```
┌─────────────────────────────────────────────────┐
│  ┌──────────┐                    [Edit] [Delete] │
│  │  MINT    │ ← condition badge (large)          │
│  └──────────┘                                    │
│                                                  │
│  ┌─────────────────┐ ┌─────────────────┐        │
│  │ 💰 Purchase Price│ │ 🏷️ Est. Value    │        │
│  │ $125.00         │ │ $180.00         │        │
│  ├─────────────────┤ ├─────────────────┤        │
│  │ 📅 Acquired      │ │ 🛍️ Source        │        │
│  │ Mar 15, 2024    │ │ eBay            │        │
│  └─────────────────┘ └─────────────────┘        │
│                                                  │
│  ─────────────────────────────────────────────   │
│  📝 Notes                                        │
│  "Original packaging, slight shelf wear on box"  │
│                                                  │
│  ─────────────────────────────────────────────   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐              [+N]  │
│  │img1│ │img2│ │img3│ │img4│                     │
│  └────┘ └────┘ └────┘ └────┘                     │
└─────────────────────────────────────────────────┘
```

#### Card Container

- `Card variant="flat"` with `group h-full` — enables hover-reveal for action buttons
- `CardContent` with `p-5` padding
- Hover state: `hover:border-accent/20 transition-colors duration-150` — subtle amber border hint
- No lift effect on copy cards (unlike collection gallery cards) — copies are data records, not navigable cards

#### Condition Badge (Hero Element)

The condition badge is the first thing the eye hits — large, color-coded, immediately communicating quality.

**Size:** `Badge` with custom size `md` — `px-3 py-1 text-sm font-semibold`

**Color mapping by condition tier:**

| Condition | Variant | Light BG | Light Text | Dark BG | Dark Text | Semantic |
|-----------|---------|----------|------------|---------|-----------|----------|
| **Mint** | `success` | `bg-success/15` | `text-success` | `bg-success/20` | `text-success` | Pristine, untouched |
| **Near Mint** | `success` | `bg-success/15` | `text-success` | `bg-success/20` | `text-success` | Excellent with minimal wear |
| **Excellent** | `primary` | `bg-primary/10` | `text-foreground` | `bg-primary/10` | `text-foreground` | High quality, minor imperfections |
| **Good** | `primary` | `bg-primary/10` | `text-foreground` | `bg-primary/10` | `text-foreground` | Solid condition, visible wear |
| **Fair** | `warning` | `bg-warning/15` | `text-warning` | `bg-warning/20` | `text-warning` | Significant wear, functional |
| **Poor** | `warning` | `bg-warning/15` | `text-warning` | `bg-warning/20` | `text-warning` | Heavy wear or damage |

**Badge rendering:** Uses `formatCondition()` to convert `"NearMint"` → `"Near Mint"` for display.

**Placement:** Top-left of card. `flex items-start justify-between mb-4` — badge left, action buttons right.

#### Action Buttons (Hover-Reveal)

- **Container:** `flex gap-1`
- **Visibility:** `sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150` — always visible on mobile (touch devices), hover-reveal on desktop
- **Edit button:** `Button variant="ghost" size="sm"` — `Pencil` icon, `h-3.5 w-3.5`
- **Delete button:** `Button variant="ghost" size="sm"` — `Trash2` icon, `h-3.5 w-3.5`, `text-destructive hover:text-destructive hover:bg-destructive/10`
- **Focus behavior:** Buttons receive focus via keyboard tab even when visually hidden — `opacity-0` doesn't affect tab order. When focused, the parent `group-focus-within:opacity-100` makes them visible.

#### Copy Details Grid

- **Layout:** `grid gap-3 sm:grid-cols-2` — 2 columns on sm+, stacked on mobile
- **Each detail cell:** `flex items-start gap-2`
  - **Icon:** `h-4 w-4 text-muted-foreground mt-0.5 shrink-0` — vertical alignment with first line of text
  - **Text container:** `min-w-0` (prevents flex overflow)
    - **Label:** `text-xs font-medium text-muted-foreground` — overline style
    - **Value:** `text-sm text-foreground` — default, or `text-sm font-semibold` for financial values

**Fields displayed (conditional — only when value exists):**

| Field | Icon | Value Format | Extra Styling |
|-------|------|-------------|---------------|
| Purchase Price | `DollarSign` (h-4 w-4) | `$XX.XX` | `font-semibold`, `font-variant-numeric: tabular-nums`, `cursor-pointer` (inline edit affordance) |
| Estimated Value | `Tag` (h-4 w-4) | `$XX.XX` | `font-semibold`, `font-variant-numeric: tabular-nums`, `cursor-pointer` (inline edit affordance) |
| Acquisition Date | `Calendar` (h-4 w-4) | `toLocaleDateString({ year: "numeric", month: "short", day: "numeric" })` — e.g., "Mar 15, 2024" | — |
| Acquisition Source | `ShoppingBag` (h-4 w-4) | Plain text | — |

**Currency formatting:** Prices use a simple `$` prefix. Future: use `Intl.NumberFormat` with user's currency preference from profile. `font-variant-numeric: tabular-nums` ensures decimal points align when multiple copies are visible in the grid.

**Date formatting:** Locale-aware via `toLocaleDateString()`. Calendar icon inline with `flex items-center gap-1.5`.

**Empty field behavior:** Fields with null/undefined values are not rendered — no "N/A" placeholders. The grid naturally collapses (fewer cells = less visual noise).

#### Notes Section (Conditional)

Only rendered when `copy.notes` exists and is non-empty.

- **Separator:** `mt-3 pt-3 border-t border-border` — thin divider separating notes from details grid
- **Layout:** `flex items-start gap-2`
  - Icon: `FileText` (h-4 w-4), `text-muted-foreground mt-0.5 shrink-0`
  - Text container:
    - Label: `text-xs font-medium text-muted-foreground` — "Notes"
    - Value: `text-sm leading-relaxed text-foreground` — natural wrapping, no truncation
- **Max height:** None — notes can be any length. The card grows to accommodate.

#### Thumbnail Gallery (Conditional)

Only rendered when `copy.images.length > 0`.

- **Separator:** `mt-3 pt-3 border-t border-border` — thin divider
- **Layout:** `flex gap-2 flex-wrap` — wrapping row
- **Each thumbnail:**
  - Container: `relative group/thumb` (nested group for individual hover)
  - Size: `h-16 w-16` (64×64px)
  - Image: `h-full w-full rounded-md border border-border object-cover`
  - Loading: `loading="lazy"` for performance
  - Alt text: `t("ownedCopy.imageAlt", { index: N })` — e.g., "Copy image 1"
  - **Hover state:** `hover:ring-2 hover:ring-accent transition-shadow duration-150` — amber ring signals clickability
  - **Click action:** Opens image gallery lightbox at the clicked image index
  - **Cursor:** `cursor-pointer`
  - **Keyboard:** `tabIndex={0}`, `role="button"`, `aria-label="View image N"`, `onKeyDown` for Enter/Space

- **Overflow indicator:** When more than 4 images exist, show first 4 thumbnails + an overflow badge:
  - `+N` badge: `absolute inset-0 flex items-center justify-center bg-black/50 rounded-md text-white text-sm font-semibold` on the 4th thumbnail position
  - Click on overflow badge opens lightbox at image 4
  - This prevents copy cards from becoming excessively tall with many images
  - On mobile (< sm), show max 3 thumbnails + overflow

---

### Image Gallery Lightbox

The lightbox is a full-screen overlay that displays copy images at full resolution with navigation, zoom, and keyboard support. It activates when a user clicks any thumbnail in the copy card gallery.

#### Visual Design

**Backdrop:**
- `fixed inset-0 z-50`
- `bg-black/90` (near-opaque dark — images need maximum contrast)
- `backdrop-filter: blur(8px)` — blurs content behind for depth
- Click backdrop to close

**Image container:**
- `fixed inset-0 z-50 flex items-center justify-center`
- Image: `max-h-[85vh] max-w-[90vw] object-contain` — fills viewport while maintaining aspect ratio
- `rounded-lg` on the image for subtle softness
- `select-none` to prevent accidental text selection on image

**Entrance animation (Framer Motion):**
```typescript
const lightboxVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  image: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
}

const lightboxTransition = {
  backdrop: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] },
  image: { type: "spring", stiffness: 300, damping: 28 }, // springGentle
  exit: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] },
}
```

- Backdrop fades in over 200ms
- Image scales up from 0.9 with gentle spring — feels like the image "expands" from the thumbnail
- Exit is faster (150ms) — snappy dismissal

**Image transition between slides:**
- `AnimatePresence mode="wait"` wrapping the image
- Direction-aware: sliding right → `x: 100 → 0` enter, `x: 0 → -100` exit. Sliding left → reverse.
- Duration: 200ms with `ease-enter` / `ease-exit`
- `key={currentImageIndex}` on the motion wrapper triggers re-animation

#### Navigation Controls

**Arrow buttons:**
- Left: `ChevronLeft` icon, `absolute left-4 top-1/2 -translate-y-1/2`
- Right: `ChevronRight` icon, `absolute right-4 top-1/2 -translate-y-1/2`
- Button style: `h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-colors`
- Icon size: `h-5 w-5`
- Hidden when at first/last image (no wrap-around)
- **Focus-visible:** `focus-visible:ring-2 focus-visible:ring-white`

**Close button:**
- `X` icon, `absolute top-4 right-4`
- Same frosted glass style as arrows: `h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10`
- Icon size: `h-5 w-5`

**Image counter:**
- `absolute bottom-4 left-1/2 -translate-x-1/2`
- `bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm`
- Content: `"2 / 5"` (current / total)
- Hidden when only 1 image (no counter needed)

**Dot indicators (below counter, when ≤ 8 images):**
- `flex gap-1.5 justify-center mt-2`
- Each dot: `h-1.5 w-1.5 rounded-full`
- Active: `bg-white`
- Inactive: `bg-white/40`
- Transition: `transition-colors duration-150`

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Escape` | Close lightbox |
| `ArrowLeft` | Previous image |
| `ArrowRight` | Next image |
| `Home` | First image |
| `End` | Last image |

- Keyboard listener attached on mount, removed on unmount
- Focus trapped within lightbox (no tabbing to background content)
- `aria-modal="true"`, `role="dialog"`, `aria-label="Image gallery"`

#### Touch/Swipe (Mobile)

- Swipe left → next image
- Swipe right → previous image
- Swipe down → close lightbox
- Minimum swipe distance: 50px (prevents accidental triggers)
- Use `onTouchStart` / `onTouchEnd` with delta calculation (or a lightweight gesture lib if already available)

#### Zoom Interaction

- **Double-tap / double-click** toggles between fit-to-screen and 2× zoom
- When zoomed: pan by dragging (touch) or mouse move
- Zoom state: `scale: 1` (fit) ↔ `scale: 2` (zoomed)
- Transition: `springDefault` — snappy zoom feel
- When zoomed in, navigation arrows are hidden (panning takes priority)
- Pinch-to-zoom on touch devices (if gesture support available)

#### Responsive Behavior

| Element | Desktop | Mobile |
|---------|---------|--------|
| Image max size | `max-h-[85vh] max-w-[90vw]` | Same (viewport-relative) |
| Navigation arrows | Side-positioned, always visible | Hidden (swipe instead) |
| Close button | Top-right | Top-right, slightly larger (`h-11 w-11`) for touch targets |
| Counter | Bottom center | Bottom center |
| Zoom | Double-click + scroll wheel | Double-tap + pinch |

---

### Create/Edit Owned Copy Form (Enhanced)

The add/edit owned copy uses an enhanced **dialog** that elevates the basic form with color-coded condition selection, currency-prefixed inputs, and a modern multi-image upload zone.

#### Dialog Container

- `DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto"`
- **Add mode header:**
  - Title: "Add Owned Copy" (translated)
  - Description: "Record a new copy of this item in your collection" (translated)
- **Edit mode header:**
  - Title: "Edit Owned Copy" (translated)
  - Description: "Update the details of this copy" (translated)

#### Error Banner

- Placement: top of form, below dialog description
- Style: `rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20`
- Icon: `AlertCircle` (h-4 w-4) inline with text
- Shows API error message or validation error

#### Form Layout

`form className="space-y-4"`

**1. Condition Select (Full Width) — With Color Indicators**

Enhanced over the basic native select: uses a custom select component (or styled native select) with color dots indicating condition tier.

- **Container:** full width
- **Label:** "Condition" — `text-sm font-medium`
- **Select styling:** `h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm`
- **Options with color indicators:**

```
  ● Mint              (green dot — success)
  ● Near Mint         (green dot — success)
  ● Excellent         (neutral dot — foreground)
  ● Good              (neutral dot — foreground)
  ● Fair              (amber dot — warning)
  ● Poor              (amber dot — warning)
```

- Color dot: `h-2 w-2 rounded-full inline-block mr-2` with the semantic color
- **Implementation note:** If using a native `<select>`, color dots aren't possible — fall back to text-only. If using a custom `Select` component (Radix-based), each `SelectItem` can include the dot as a prefix element.
- **Default value:** "Mint" for new copies (optimistic default for collectors)

**2. Financial Fields — Purchase Price + Estimated Value (2-Column Grid)**

`grid gap-4 sm:grid-cols-2`

Each field:
- **Label:** "Purchase Price" / "Estimated Value" — `text-sm font-medium`
- **Input container:** `relative` wrapper for currency prefix
- **Currency prefix:** `absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none` — shows `$` (or user's preferred currency symbol)
- **Input:** `type="number" step="0.01" min="0"` with `pl-7` (padding-left to accommodate currency prefix)
- Placeholder: `"0.00"` in muted color
- **Styling:** Standard input: `h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm`
- **Tabular nums:** `font-variant-numeric: tabular-nums` on the input for aligned decimal entry

**3. Date + Source (2-Column Grid)**

`grid gap-4 sm:grid-cols-2`

- **Acquisition Date:**
  - Label: "Acquisition Date" — `text-sm font-medium`
  - Input: `type="date"` — native date picker
  - `h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm`
  - Default: empty (not required)

- **Acquisition Source:**
  - Label: "Source" — `text-sm font-medium`
  - Input: `type="text"`
  - Placeholder: `"eBay, Local store, Gift..."` (translated)
  - `h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm`

**4. Notes (Full Width)**

- **Label:** "Notes" — `text-sm font-medium`
- **Input:** `<Textarea>` component (not single-line text input)
  - `min-h-[80px] resize-y` — allows vertical resize, minimum 2-3 lines
  - Placeholder: `"Condition details, packaging, provenance..."` (translated)
  - `w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm`
- **Rationale:** Upgrading from text input to textarea — collectors often write detailed condition notes, packaging descriptions, or provenance information

**5. Image Upload Zone (Full Width — Enhanced)**

This is the most significant upgrade from the current bare `<input type="file">`.

**Upload zone container:**
- `rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center`
- `hover:border-accent/50 hover:bg-accent/5 transition-colors duration-150` — amber tint on hover
- `cursor-pointer` — entire zone is clickable

**Drag-and-drop states:**
- **Default:** Dashed border, upload icon, instructional text
- **Drag over (file hovering):** `border-accent bg-accent/10 border-solid` — solid amber border, stronger amber tint. `scale(1.01)` subtle scale via CSS transition.
- **Uploading:** Pulsing border animation (uses skeleton-pulse keyframe on border-color)

**Upload zone content (when no images selected):**
- `Upload` icon (lucide): `h-8 w-8 text-muted-foreground mx-auto mb-2`
- Primary text: `text-sm font-medium text-foreground` — "Drop images here or click to browse"
- Secondary text: `text-xs text-muted-foreground mt-1` — "PNG, JPG up to 5MB each"
- Hidden `<input type="file" accept="image/*" multiple>` triggered by zone click

**Image preview grid (when images are selected/exist):**

Below the upload zone, existing and newly selected images appear in a preview grid.

- **Layout:** `grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3`
- **Each preview item:** `relative group/preview aspect-square`
  - Image: `h-full w-full rounded-md object-cover border border-border`
  - **Remove button:** `absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity`
    - Icon: `X` (h-3 w-3)
    - Always visible on touch: `sm:opacity-0 sm:group-hover/preview:opacity-100`
  - **New image indicator:** For newly added (not yet uploaded) images, show a subtle `ring-2 ring-accent` border to differentiate from existing images
  - **Existing image indicator:** No special ring — they're already part of the copy

**Image reorder (drag-and-drop):**
- Uses `@dnd-kit` `SortableContext` with `rectSortingStrategy`
- Each preview item wrapped in `useSortable` hook
- **Drag handle:** Entire image is draggable (small targets are hard on mobile)
- **Drag feedback:** Uses established drag-and-drop feedback from design-motion.md — `scale: 1.03`, `shadow-lg`, `rotate: 1deg`
- **Placeholder:** Dashed border rect matching preview item size
- **Reorder saves order:** Image order in the array determines display order

**File validation:**
- Max file size: 5MB per image (validated client-side, show toast error if exceeded)
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- Max images per copy: 10 (show disabled upload zone with message when reached)
- Validation error: `text-xs text-destructive mt-1` below the upload zone

#### Dialog Actions

- **Container:** `flex justify-end gap-2 pt-4 border-t border-border mt-2` — separated from form by divider
- **Cancel:** `Button variant="outline"` — "Cancel" (translated), closes dialog, resets form
- **Save:** `Button` with accent styling — "Add Copy" (add mode) or "Save Changes" (edit mode)
  - Loading state: `disabled`, `Loader2 animate-spin h-4 w-4 mr-2` spinner prefix
  - Text changes to "Adding..." / "Saving..." during submission

#### Form Behavior

- **Add mode:** All fields empty, condition defaults to "Mint"
- **Edit mode:** Fields pre-populated from existing copy data. Existing images shown in preview grid. New images can be added alongside existing ones.
- **Submit flow:**
  1. Validate required fields (condition is the only required field)
  2. POST/PUT the copy entity (JSON body)
  3. Upload new images sequentially to `/api/items/{itemId}/copies/{copyId}/images`
  4. Show progress: "Uploading images... (2/5)" in a toast or inline indicator
  5. On complete: close dialog, refresh copy list, show success toast
- **Image deletion in edit mode:** Clicking remove on an existing image shows a mini confirmation (tooltip or small popover: "Remove this image?" with Yes/No) — prevents accidental removal. New (unsaved) images remove instantly without confirmation.

---

### Delete Confirmation (Owned Copies)

Specific delete confirmation dialog for owned copies.

#### Dialog Design

- `DialogContent className="sm:max-w-md"`
- **Title:** "Delete Owned Copy" (translated)
- **Description:** `text-sm text-muted-foreground`
  - Content: "Are you sure you want to delete this [Condition] copy? This action cannot be undone." — condition is dynamically inserted and styled with the appropriate badge variant inline
  - If copy has images: additional line: "All [N] associated images will also be deleted."
- **Visual emphasis:** The condition badge is rendered inline in the description to help the user confirm they're deleting the right copy (important when multiple copies exist)

#### Dialog Actions

- `flex justify-end gap-2 pt-2`
- **Cancel:** `Button variant="outline"` — "Cancel"
- **Delete:** `Button variant="destructive"` — "Delete Copy"
  - Loading state: `disabled`, spinner, text changes to "Deleting..."
  - Uses `--destructive` background, `--destructive-foreground` text

#### Behavior

- Triggered by the delete button on a copy card
- On success: dialog closes, copy list refreshes, success toast: "Copy deleted"
- On error: dialog stays open, error banner appears in dialog
- Focus returns to the copy section after deletion (not the deleted card, which no longer exists)

---

### Inline Editing Pattern

For frequently adjusted fields, inline editing allows quick updates without opening the full edit dialog. This reduces friction when a collector is doing a valuation pass across multiple copies.

#### Editable Fields

Only two fields support inline editing — the most commonly updated values:

| Field | Trigger | Rationale |
|-------|---------|-----------|
| **Condition** | Click on condition badge | Condition changes as items age or are regraded |
| **Purchase Price** | Click on price value | Price corrections, currency adjustments |

Other fields (estimated value, date, source, notes, images) require the full edit dialog — they're less frequently changed and benefit from the full form context.

#### Inline Edit Trigger

- **Visual affordance:** Editable values show `cursor-pointer` and a subtle `hover:bg-accent/5 rounded px-1 -mx-1 transition-colors` highlight on hover — signals clickability without cluttering the default view
- **Click:** Transforms the display value into an inline editor
- **Keyboard:** `Enter` or `Space` on a focused editable value activates inline edit mode

#### Condition Inline Editor

When the condition badge is clicked:

- **Badge transforms** into a compact dropdown positioned below/beside the badge
- **Dropdown:** Uses `DropdownMenu` component from Radix
- **Menu items:** Each condition option with color dot prefix (matching the select in the create/edit form)
  - `DropdownMenuItem className="gap-2"`
  - Color dot: `h-2 w-2 rounded-full` with semantic color
  - Label: condition name
  - Check icon on currently selected condition: `Check` (h-4 w-4) on the right
- **Selection:** Click on a condition option immediately saves via API (`PUT /api/items/{itemId}/copies/{copyId}`)
- **Loading:** Badge shows a subtle pulse animation while saving
- **Success:** Badge updates to new condition with new color. No toast (inline feedback is sufficient).
- **Error:** Badge reverts to previous condition, toast error: "Failed to update condition"
- **Dismiss:** Click outside or `Escape` closes without saving

#### Price Inline Editor

When the price value is clicked:

- **Value transforms** into a compact inline input
- **Input:** `h-7 w-24` — small, fitting within the card layout
  - `type="number" step="0.01" min="0"`
  - `text-sm font-semibold font-variant-numeric: tabular-nums`
  - `border border-input rounded px-2 bg-transparent`
  - Pre-populated with current value, text selected for easy replacement
  - Currency prefix `$` shown inline (same as dialog pattern)
- **Auto-focus:** Input receives focus immediately on render
- **Save triggers:**
  - `Enter` key: saves and exits inline edit
  - `blur` (click outside): saves and exits inline edit
  - `Tab`: saves, exits, and moves focus to next focusable element
- **Cancel:** `Escape` key reverts to original value and exits inline edit
- **Loading:** Input border pulses while saving
- **Success:** Value updates inline. No toast.
- **Error:** Value reverts, toast error displayed
- **Validation:** Must be ≥ 0 or empty (null). Non-numeric input rejected by `type="number"`.

#### Inline Edit Animation

- **Enter:** Display value crossfades to editor — `opacity: 1 → 0` on display (50ms), then `opacity: 0 → 1` on editor (50ms). Uses `duration-instant` from motion tokens.
- **Exit:** Reverse crossfade. Editor fades out, updated display value fades in.
- Both animations use `ease-standard` curve.

#### Accessibility

- Inline editable values have `role="button"` and `aria-label="Edit [field name]"` when in display mode
- When editor is active: proper `<input>` with `<label>` (visually hidden) and `aria-describedby` pointing to the field label
- Screen reader announcement on save: `aria-live="polite"` region announces "Condition updated to [value]" or "Price updated to [value]"

---

### Responsive Summary

| Element | Desktop (≥1024px) | Tablet (≥640px) | Mobile (<640px) |
|---------|-------------------|-----------------|-----------------|
| **Copy grid** | 2 columns | 2 columns | 1 column |
| **Copy card padding** | `p-5` | `p-5` | `p-4` |
| **Details grid** | 2 columns | 2 columns | 1 column |
| **Action buttons** | Hover-reveal | Hover-reveal | Always visible |
| **Thumbnails shown** | 4 + overflow | 4 + overflow | 3 + overflow |
| **Lightbox arrows** | Side-positioned | Side-positioned | Hidden (swipe) |
| **Lightbox close** | `h-10 w-10` | `h-10 w-10` | `h-11 w-11` (larger touch target) |
| **Upload zone** | Full layout | Full layout | Compact (smaller icon, shorter text) |
| **Preview grid** | 5 columns | 4 columns | 4 columns |
| **Dialog width** | `sm:max-w-lg` | Full with padding | Full width |
| **Inline editing** | Supported | Supported | Supported (tap instead of click) |

---

### Implementation Notes

1. **Lightbox is a new component** — `ImageGalleryLightbox` in `components/ds/`. It takes `images: string[]`, `initialIndex: number`, `open: boolean`, `onClose: () => void`. Uses Framer Motion `AnimatePresence` for enter/exit. Portal-rendered via `createPortal` to escape any overflow containers.
2. **Image upload zone is a new component** — `ImageUploadZone` in `components/ds/`. It encapsulates the drag-and-drop zone, file validation, preview grid, and reorder logic. Accepts `existingImages: string[]`, `newFiles: File[]`, `onFilesChange`, `onExistingRemove`, `onReorder`, `maxFiles`, `maxSizeMB`.
3. **Inline editing uses optimistic updates** — the UI updates immediately on save, then rolls back if the API call fails. This makes the interaction feel instant. Use a `useMutation` pattern or simple state + fetch with rollback.
4. **Image upload is sequential after copy save** — the current API pattern (POST copy, then POST each image separately) is maintained. Show progress feedback during multi-image upload.
5. **Thumbnail overflow count** — calculate `const overflowCount = copy.images.length - maxThumbnails` where `maxThumbnails` is 4 (desktop) or 3 (mobile via `useMediaQuery`). Show `+{overflowCount}` on the last visible thumbnail.
6. **Condition color mapping** should be a shared utility function — `getConditionVariant(condition: string): "success" | "primary" | "warning"` — used by both the copy card badge and the inline editor dropdown.
7. **Focus management after lightbox close** — return focus to the thumbnail that opened the lightbox. Store the trigger element ref and call `.focus()` on close.
8. **Image gallery keyboard trap** — when lightbox is open, `Tab` cycles between close button and navigation arrows only. Use `FocusTrap` component or manual `keydown` listener.
9. **Drag-and-drop in upload preview** — `@dnd-kit` is already a project dependency (used for sortable lists). Reuse `SortableContext` + `useSortable` pattern from existing codebase.
10. **Copy card test strategy** — copy cards should have `data-testid="owned-copy-card"` with `data-copy-id={copy.id}` for integration test targeting. Inline editors should have `data-testid="inline-edit-{field}"`. Lightbox should have `data-testid="image-lightbox"`.
11. **i18n keys needed:** `ownedCopy.addTitle`, `ownedCopy.addDescription`, `ownedCopy.editTitle`, `ownedCopy.editDescription`, `ownedCopy.deleteTitle`, `ownedCopy.deleteConfirmation`, `ownedCopy.deleteImagesWarning`, `ownedCopy.uploadPrompt`, `ownedCopy.uploadHint`, `ownedCopy.imageCounter`, `ownedCopy.removeImageConfirm`, `ownedCopy.inlineEditCondition`, `ownedCopy.inlineEditPrice`, `ownedCopy.uploadProgress`.
