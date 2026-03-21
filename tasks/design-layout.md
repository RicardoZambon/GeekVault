# GeekVault Layout & Navigation Design

## App Shell & Navigation

### Layout Paradigm Evaluation

#### Option A: Persistent Sidebar + Slim Top Toolbar (Current / Recommended)

A fixed left sidebar for primary navigation with a horizontal toolbar at the top for search, actions, and user controls.

**Pros:**
- Navigation is always visible — zero-click access to any section
- Content area gets maximum vertical space (no tall nav bar eating real estate)
- Sidebar provides strong spatial anchoring — users always know where they are
- Natural home for brand identity (logo at top, user at bottom)
- Collapsible to icon-only mode preserves screen real estate when needed
- Industry standard for management/admin SaaS (Notion, Linear, Stripe Dashboard)

**Cons:**
- Eats ~260px horizontal space (mitigated by collapse)
- Mobile requires separate navigation pattern

#### Option B: Top Navigation Bar

A horizontal nav bar across the top of the viewport.

**Pros:**
- Familiar web pattern, full content width
- Works well for 3-5 top-level items

**Cons:**
- Doesn't scale well with grouped navigation items
- Wastes vertical space on every page (collectible images need vertical room)
- No natural place for brand identity + user section simultaneously
- Breaks down with admin expansion

#### Option C: Bottom Tab Navigation (Mobile-first)

Navigation tabs fixed to the bottom of the viewport.

**Pros:**
- Thumb-friendly on mobile
- Always visible

**Cons:**
- Only works for 4-5 items — cannot accommodate groups or admin nav
- Doesn't translate to desktop without a separate desktop pattern
- Feels like a mobile app, not a premium web SaaS

#### Option D: Hybrid — Sidebar Desktop + Bottom Nav Mobile

Sidebar on desktop/tablet, bottom tab bar on mobile.

**Pros:**
- Best of both worlds per viewport

**Cons:**
- Two completely separate navigation systems to maintain
- Navigation mental model shifts between devices

---

### Selected Paradigm: **Persistent Sidebar + Slim Top Toolbar** (Option A, refined)

**Rationale:** GeekVault is a content-management tool where users navigate frequently between sections during long sessions. The sidebar provides constant spatial orientation — users can see all sections at once and switch instantly. For a collectibles app, the content area benefits most from maximum *vertical* space (scrolling through item grids, detail pages with images) rather than maximum *horizontal* space. The 260px sidebar cost is negligible on modern screens and mitigated by collapse.

The "Warm Obsidian" identity maps perfectly to a sidebar: an always-dark sidebar with amber accents evokes the interior of a wooden display cabinet — the navigation *is* the frame around the collection.

**Mobile strategy:** Hamburger-triggered sheet (slide-from-left) rather than bottom nav. Rationale: consistent mental model with desktop sidebar content, supports grouped navigation and user section, and the hamburger+sheet pattern is well-understood for management apps. Bottom nav would require trimming navigation items and losing the curio-cabinet identity.

---

### Desktop Layout (≥768px)

```
┌──────────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌──────────────────────────────────────────────┐ │
│ │         │ │  Top Toolbar (72px)                          │ │
│ │         │ │  [🔍 Search...  ⌘K]          [?][🔔][🌐][☀][👤]│ │
│ │ Sidebar │ ├──────────────────────────────────────────────┤ │
│ │ (260px  │ │                                              │ │
│ │  or     │ │  Page Content Area                           │ │
│ │  72px   │ │  (flex-1, overflow-y-auto)                   │ │
│ │ collapsed│ │                                              │ │
│ │  )      │ │  padding: 24px (desktop), 16px (tablet)      │ │
│ │         │ │                                              │ │
│ │         │ │                                              │ │
│ │         │ │                                              │ │
│ └─────────┘ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- **Sidebar**: Fixed left, full viewport height, 260px expanded / 72px collapsed
- **Top Toolbar**: Fixed row, 72px height, stretches remaining width
- **Content Area**: `flex-1` with `overflow-y-auto`, padding `px-6 py-6`
- **Total minimum viewport**: 768px (sidebar auto-collapses on tablet 768–1024px)

### Tablet Adaptation (768px–1023px)

- Sidebar **auto-collapses to 72px** (icon-only mode) — user can expand manually
- Top toolbar remains at 72px height
- Content area padding reduces to `px-4 py-6`
- Search input in toolbar shrinks to icon-only button (opens command palette on click)
- All toolbar action buttons remain visible

### Mobile Layout (<768px)

```
┌────────────────────────────┐
│ Header (56px)              │
│ [☰] [🔒 GeekVault]   [🌐][☀]│
├────────────────────────────┤
│                            │
│  Page Content Area         │
│  (flex-1, overflow-y-auto) │
│                            │
│  padding: 16px             │
│                            │
│                            │
└────────────────────────────┘
```

- **Header**: 56px height, `md:hidden` — visible only on mobile
- **Hamburger button** (left): Opens sidebar sheet (slide from left)
- **Brand** (center-left): Vault icon + "GeekVault" text
- **Quick actions** (right): Language toggle + theme toggle (compact)
- **No bottom nav**: Sheet-based sidebar keeps navigation grouped and branded
- **Content padding**: `px-4 py-4`
- **Sheet width**: `75vw` max `288px` — same content as desktop sidebar but always expanded

---

### Navigation Item Hierarchy

Navigation is organized into semantic groups with clear visual separation:

```
┌─────────────────────────┐
│  [🔒] GeekVault          │  ← Brand + tagline (expanded) / Icon only (collapsed)
│       Your vault awaits  │
├─────────────────────────┤
│                         │
│  OVERVIEW               │  ← Group label (uppercase, xs, muted)
│  ● Dashboard            │
│                         │
│  COLLECTIONS            │  ← Group label
│  ○ Collections          │
│  ○ Collection Types     │
│  ○ Wishlist             │
│                         │
│  ACCOUNT                │  ← Group label
│  ○ Profile              │
│                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ← Divider (only when admin section exists)
│  ADMIN                  │  ← Group label (conditionally rendered)
│  ○ Admin Panel          │  ← Single entry point to admin area
│                         │
├─────────────────────────┤
│  [👤] Ralph Largo        │  ← User section (always at bottom)
│       ralph@example.com  │
└─────────────────────────┘
```

**Group definitions (exported as `navGroups`):**

| Group | Label Key | Items |
|-------|-----------|-------|
| Overview | `nav.groups.overview` | Dashboard |
| Collections | `nav.groups.collections` | Collections, Collection Types, Wishlist |
| Account | `nav.groups.account` | Profile |
| Admin | `nav.groups.admin` | Admin Panel (conditional on `user.role === "admin"`) |

**Icons (Lucide):**

| Item | Icon | Rationale |
|------|------|-----------|
| Dashboard | `LayoutDashboard` | Standard dashboard icon |
| Collections | `Library` | Bookshelf/vault metaphor |
| Collection Types | `Layers` | Stacked categories |
| Wishlist | `Heart` | Desire/want list |
| Profile | `User` | User silhouette |
| Admin Panel | `Shield` | Authority/administration |

**Collapsed mode (72px):** Group labels replaced by subtle horizontal dividers (`border-t border-sidebar-border`) between groups. Each item shows only its icon centered in a 48×48px hit area with tooltip on hover (side="right", delay=0).

---

### Navigation Item States

Each navigation item has five distinct visual states:

#### Expanded Mode (260px sidebar)

| State | Visual Treatment |
|-------|-----------------|
| **Default** | `text-sidebar-foreground/70`, no background, `border-l-[3px] border-transparent` |
| **Hover** | `bg-sidebar-accent/50` (amber at 50% opacity), `text-sidebar-accent-foreground`, smooth 150ms transition |
| **Active (current page)** | `bg-sidebar-accent` (amber at 15% opacity), `text-sidebar-accent-foreground`, `border-l-[3px] border-sidebar-primary` (solid amber left border), icon colored `text-sidebar-primary` (amber) |
| **Focus-visible** | `outline-2 outline-offset-2 outline-sidebar-ring` (amber focus ring), only on keyboard navigation (`focus-visible`, not `focus`) |
| **Disabled** | `opacity-40 cursor-not-allowed pointer-events-none` |

#### Collapsed Mode (72px sidebar)

| State | Visual Treatment |
|-------|-----------------|
| **Default** | Icon `text-sidebar-foreground/70`, no background |
| **Hover** | `bg-sidebar-accent/50`, icon `text-sidebar-accent-foreground` |
| **Active** | `bg-sidebar-accent`, icon `text-sidebar-primary` (amber), rounded-md container |
| **Focus-visible** | Same ring as expanded |
| **Tooltip** | Appears on hover, side="right", contains translated label, 0ms delay |

#### Mobile Sheet

Identical to expanded desktop mode. No collapsed state in mobile sheet.

#### Sizing

- **Expanded item height**: `min-h-[44px]` (meets WCAG 2.5.8 target size)
- **Collapsed item height**: `h-[48px]` (slightly larger for icon-only tap targets)
- **Icon size**: `h-5 w-5` (expanded), `h-6 w-6` (collapsed — larger for clarity)
- **Text**: `text-sm font-medium`
- **Gap between icon and label**: `gap-3` (12px)
- **Left border indicator**: `3px` wide, only on active state

#### Transition

All state changes use `transition-colors duration-150` (fast token from motion system). No layout-shifting transitions on state change.

---

### Breadcrumbs / Location Awareness Strategy

**Approach: No dedicated breadcrumb bar.** Instead, location awareness is provided through three complementary mechanisms:

1. **Active sidebar highlight** — The current section is always visible in the sidebar with an amber left-border indicator. This is the primary wayfinding mechanism.

2. **Page header with back navigation** — Detail pages (collection detail, catalog item detail) include a "back" link at the top of the page content area:
   - Format: `← Collections` or `← Vinyl Records` (parent name)
   - Typography: `text-sm text-muted-foreground hover:text-foreground`
   - Icon: `ChevronLeft` (h-4 w-4) + parent page name
   - Clicking navigates to parent page

3. **Command palette recent navigation** — The command palette shows recently visited pages, providing quick "go back" capability.

**Rationale:** A full breadcrumb bar adds visual noise to every page and uses vertical space. The sidebar already provides constant navigation context. For the 2-3 pages that are deep (collection → item → copy), a simple back link is clearer and more direct than breadcrumbs. This is the pattern used by Linear, Notion, and other modern SaaS apps.

**Exception:** If future analytics/audit pages in admin go 3+ levels deep, revisit breadcrumbs for admin area only.

---

### Collapse/Expand Behavior

#### Trigger

- **Edge toggle button**: A 24×24px circular button positioned at the sidebar's right edge, vertically centered (`top-1/2 -translate-y-1/2 translate-x-1/2`). Contains `ChevronLeft` (when expanded) or `ChevronRight` (when collapsed).
  - Hidden by default (`opacity-0`)
  - Appears on sidebar hover (`group-hover/sidebar:opacity-100`)
  - Background: `bg-sidebar-background`, border: `border-sidebar-border`
  - Hover: `text-sidebar-foreground` (brightens from 50% opacity)

- **Keyboard shortcut**: `[` key (when not in an input/textarea) toggles sidebar — matches Linear convention.

- **Command palette**: "Toggle sidebar" action available via Cmd+K.

- **Custom event**: `window.dispatchEvent(new Event("toggle-sidebar"))` for programmatic control.

#### Animation

- Width transitions from 260px → 72px (or reverse) over **250ms** (`duration-normal` token)
- Easing: `ease-in-out` (CSS) — smooth deceleration at both ends
- Content within sidebar:
  - **Expanding**: Text labels fade in with 100ms delay (after width has mostly expanded), using `opacity 150ms ease-in`
  - **Collapsing**: Text labels fade out immediately (0ms delay), width then transitions — text disappears before the container shrinks so text never wraps awkwardly
- The edge toggle button chevron icon rotates 180° during the transition

#### Persistence

- State saved to `localStorage` key `"geekvault-sidebar-collapsed"` (existing behavior)
- Written on every toggle (`useEffect` on `collapsed` state)
- Read on mount: if key exists, use stored value; if not, default to expanded on desktop (≥1024px) and collapsed on tablet (768–1023px)

#### Tooltip Behavior (Collapsed)

- When collapsed, every nav item wraps in a `Tooltip` with `side="right"` and `delayDuration={0}`
- Tooltip content: translated label text (`t(item.labelKey)`)
- Tooltip does **not** appear when expanded (label is visible)

---

### User Menu

#### Trigger

- **Desktop (sidebar)**: Bottom section of sidebar, separated by `border-t`. Shows avatar (or initial circle) + name + email when expanded, avatar only when collapsed. The entire row is a button that triggers the dropdown.
  - Avatar: 32×32px (expanded), 36×36px (collapsed — larger for visual weight)
  - Initial circle: `bg-sidebar-primary text-sidebar-primary-foreground` (amber on dark)
  - Name: `text-sm font-medium text-sidebar-foreground`, truncated
  - Email: `text-xs text-sidebar-foreground/50`, truncated

- **Desktop (toolbar)**: Redundant trigger in the top toolbar's right section — avatar button (28×28px) opening the same dropdown. This allows quick access without moving to the sidebar.
  - Initial circle: `bg-primary text-primary-foreground` (adapts to page theme, not sidebar theme)

- **Mobile (header)**: No user trigger in header — user menu accessed through the mobile sheet sidebar's bottom section (same as desktop sidebar expanded).

#### Dropdown Content

The dropdown menu opens from the trigger with these items:

```
┌─────────────────────────┐
│ Ralph Largo              │  ← DropdownMenuLabel (name)
│ ralph@example.com        │  ← DropdownMenuLabel (email, muted)
├─────────────────────────┤
│ 👤 Profile               │  ← Navigate to /profile
│ ⚙️ Settings              │  ← Disabled (coming soon), opacity-50
│ ❓ Help                  │  ← Disabled (coming soon), opacity-50
├─────────────────────────┤
│ 🌐 Language: English     │  ← Toggle language (en ↔ pt)
│ ☀ Theme: Light           │  ← Toggle theme (light ↔ dark ↔ system)
├─────────────────────────┤
│ 🚪 Log out               │  ← Destructive: text-destructive on hover
└─────────────────────────┘
```

**Placement:**
- From sidebar (bottom): `side="top" align="start"` — opens upward from the user section
- From toolbar avatar: `side="bottom" align="end"` — drops down aligned to right edge

**Dropdown styling:**
- Width: `w-56` (224px)
- Background: `bg-popover` with `border border-border`
- Shadow: `--shadow-lg` (new elevation token)
- Border radius: `--radius-lg` (12px)
- Item height: `min-h-[36px]`
- Item gap between icon and label: `gap-2` (8px)
- Item icons: `h-4 w-4 text-muted-foreground`
- Hover: `bg-accent/10` (subtle amber tint)
- Destructive hover (logout): `text-destructive` with `bg-destructive/10`

**Behavior:**
- Profile: navigates to `/profile`, closes menu
- Language toggle: immediately switches language, menu stays open (users may want to toggle theme too)
- Theme toggle: cycles through light → dark → system, menu stays open
- Log out: calls `logout()`, navigates to `/login` with `replace: true`

---

### Top Toolbar Design (Desktop, ≥768px)

```
┌──────────────────────────────────────────────────────────────────┐
│  [🔍 Search collections, items...  ⌘K]           [?] [🔔] [🌐] [☀] [👤] │
│  ← Search trigger (280px)              Spacer →   Action buttons →    │
└──────────────────────────────────────────────────────────────────────┘
```

- **Height**: 72px, `items-center`
- **Background**: `bg-background` (matches content area, not sidebar)
- **Bottom border**: `border-b border-border`
- **Horizontal padding**: `px-6`

**Search trigger (left):**
- Looks like an input but is actually a button that opens the command palette
- Width: `280px` on desktop, shrinks to icon-only button on tablet (<1024px)
- Height: `36px` (h-9)
- Appearance: `rounded-lg border border-input bg-muted/50` with `hover:bg-muted`
- Content: Search icon (h-4 w-4) + placeholder text ("Search collections, items...") + keyboard hint (`⌘K` or `Ctrl+K`)
- Keyboard hint: `<kbd>` element with `border bg-background rounded px-1.5 font-mono text-[10px]`
- On tablet (768–1024px): Collapses to a 36×36px icon button (Search icon only)

**Action buttons (right):**
- All are `variant="ghost" size="icon"` buttons (36×36px)
- Gap between buttons: `gap-1` (4px)
- Each wrapped in `Tooltip` with `delayDuration={0}` for accessibility
- Order: Help → Notifications → Language → Theme → User avatar

**Help button:**
- Icon: `HelpCircle` (h-4 w-4)
- Tooltip: "Help (coming soon)"
- Currently disabled/placeholder

**Notifications button:**
- Icon: `Bell` (h-4 w-4)
- Opens dropdown with "No notifications" placeholder
- Future: notification badge (red dot, top-right of icon) when unread

**Language toggle:**
- Icon: `Languages` (h-4 w-4)
- Tooltip: shows the *other* language name ("Português" when in English, "English" when in Portuguese)
- Click: immediately toggles language

**Theme toggle:**
- Icon: `Sun` / `Moon` with CSS rotation transition between them
- Sun visible in light mode, Moon visible in dark mode
- Transition: `rotate-0 scale-100` ↔ `rotate-90 scale-0` with `transition-all`
- Tooltip: "Toggle theme"

**User avatar:**
- Marginally separated: `ml-1` from other buttons
- 28×28px avatar image or initial circle
- Opens UserMenu dropdown

---

### Mobile Header Design (<768px)

```
┌────────────────────────────────────────┐
│  [☰]  [🔒] GeekVault      [🌐] [☀]    │
└────────────────────────────────────────┘
```

- **Height**: 56px (h-14)
- **Background**: `bg-background`
- **Bottom border**: `border-b`
- **Padding**: `px-4`
- **Visibility**: `md:hidden` (hidden on tablet+)

**Hamburger (left):**
- `variant="ghost" size="icon"` button
- Icon: `Menu` (h-5 w-5)
- Opens Sheet with sidebar content

**Brand (center-left):**
- Vault icon (28×28px) + "GeekVault" text
- Text: `text-lg font-bold font-display`
- Gap: `gap-2`

**Quick actions (right):**
- `ml-auto flex items-center gap-2`
- Language toggle + Theme toggle (same icons as toolbar but without tooltips — tooltips don't work well on touch)
- No user avatar, notifications, or help on mobile header (accessed via sidebar sheet)

**Sheet (sidebar):**
- Triggered by hamburger
- `side="left"` slide-in animation
- Width: `75vw` max `288px` (max-w-72)
- Background: `bg-sidebar-background` (dark, matching desktop sidebar)
- Border: `border-sidebar-border`
- Contains: `MobileSidebarContent` — identical to desktop expanded sidebar (logo, grouped nav, user section)
- Close: tap outside, swipe left, or tap a nav item (auto-closes via `onClose` callback)
- Animation: Slide from left with `duration-normal` (250ms), ease-out deceleration

---

### Animated Page Transitions

The content area uses `AnimatePresence` with `mode="wait"` (sequential exit → enter):

- **Container**: `AnimatedOutlet` wraps `useOutlet()` with `PageTransition` keyed on `location.pathname`
- **Enter**: Fade in + subtle slide up (y: 8px → 0) over 250ms with `spring.default` easing
- **Exit**: Fade out over 150ms (fast — don't make users wait)
- **Reduced motion**: Instant cut (opacity 1 → 1, no movement)

This is already implemented in `animated-outlet.tsx` and `ds/motion.tsx` — no changes needed for the layout redesign, only token alignment.

---

### Responsive Breakpoint Summary

| Viewport | Sidebar | Header | Toolbar | Content Padding | Nav Pattern |
|----------|---------|--------|---------|-----------------|-------------|
| <768px (mobile) | Hidden (Sheet) | Visible (56px) | Hidden | `px-4 py-4` | Hamburger → Sheet |
| 768–1023px (tablet) | Collapsed (72px) | Hidden | Visible (72px) | `px-4 py-6` | Icon sidebar + tooltips |
| ≥1024px (desktop) | Expanded (260px) | Hidden | Visible (72px) | `px-6 py-6` | Full sidebar |

### Z-Index Layers

| Element | Z-Index | Notes |
|---------|---------|-------|
| Sidebar | `z-0` | Normal document flow (flex sibling) |
| Sidebar edge toggle | `z-10` | Floats over sidebar/content boundary |
| Mobile header | `z-0` | Normal document flow |
| Top toolbar | `z-0` | Normal document flow |
| Dropdown menus | `z-50` | Via Radix UI portal |
| Mobile sheet overlay | `z-50` | Via Radix UI Sheet |
| Command palette overlay | `z-50` | Via cmdk dialog |
| Toast notifications | `z-[100]` | Always on top (sonner) |
