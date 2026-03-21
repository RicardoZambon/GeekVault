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

---

## Command Palette

### Design Philosophy

The command palette is the power user's front door — a keyboard-first interface that puts every action within two keystrokes. Visually, it should feel like a spotlight cutting through the page: a focused, elevated surface with a frosted glass backdrop that dims the world behind it. Warm Obsidian's amber accent lights up the selected result like a display case highlight.

The design works within **cmdk's component model**: `CommandDialog` (overlay + container), `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandSeparator`, and `CommandEmpty`. All styling is applied via className props — no structural changes to cmdk's DOM.

---

### Visual Design

#### Backdrop

- **Effect**: `backdrop-filter: blur(8px)` + semi-transparent overlay
- **Light mode**: `rgba(28, 25, 23, 0.4)` (warm black at 40% — `--foreground` with alpha)
- **Dark mode**: `rgba(0, 0, 0, 0.6)` (darker overlay needed on dark backgrounds)
- **Z-index**: `z-50` (same layer as other overlays)
- **Click outside**: Closes the palette

#### Container

- **Width**: `min(560px, calc(100vw - 2rem))` — generous width for comfortable scanning
- **Max height**: `min(480px, 70vh)` — tall enough for results but never overwhelming
- **Position**: Centered horizontally, offset **25% from top** of viewport (not dead-center — slightly high feels more intentional, like macOS Spotlight)
- **Background**: `bg-popover` (`#FFFFFF` light / dark equivalent)
- **Border**: `1px solid` `--border` (subtle, reinforces elevation)
- **Border radius**: `--radius-xl` (16px) — larger radius than standard dialogs to feel special
- **Shadow**: `--shadow-xl` (largest elevation token) — the palette floats above everything
- **Overflow**: Hidden on container, scroll inside `CommandList`

#### Search Input

- **Height**: `52px` (h-13) — taller than standard inputs for visual importance
- **Padding**: `px-4` with icon area
- **Icon**: `Search` (Lucide, h-5 w-5) in `text-muted-foreground`, left-aligned
- **Placeholder**: "Search pages, collections, actions..." (`commandPalette.placeholder` i18n key)
- **Typography**: `text-base font-body` (16px — larger than typical inputs for readability)
- **Color**: `text-foreground`, placeholder in `text-muted-foreground`
- **Border**: Bottom only — `border-b border-border` separating input from results
- **Background**: Transparent (inherits from container)
- **Focus**: No visible focus ring (the entire palette IS the focused element)
- **Clear behavior**: When input has text, show a subtle `X` button (h-4 w-4, `text-muted-foreground`) at the right edge, clickable to clear

#### Result List

- **Container**: `CommandList` with `overflow-y-auto`, `max-h-[360px]`
- **Padding**: `p-2` (8px all around)
- **Scroll behavior**: `scroll-smooth`, custom scrollbar styling:
  - Width: `4px`
  - Track: transparent
  - Thumb: `--muted-foreground/20` with `--radius-full`
  - Thumb hover: `--muted-foreground/40`

#### Footer Hint Bar

- **Position**: Below the result list, inside the container
- **Height**: `36px`
- **Background**: `bg-muted/50` (subtle differentiation from results area)
- **Border**: `border-t border-border`
- **Content**: Keyboard hints — `↑↓ Navigate` · `↵ Select` · `esc Dismiss`
- **Typography**: `text-xs text-muted-foreground font-mono`
- **Padding**: `px-4`
- **Layout**: `flex items-center gap-4`
- **Keyboard hint keys**: Styled as inline `<kbd>` elements with `bg-background border border-border rounded px-1 py-0.5 text-[10px] font-mono`

---

### Result Groups

Results are organized into semantic groups using `CommandGroup`. Groups appear in a fixed order, but empty groups are hidden automatically by cmdk.

| Group | Heading i18n Key | Icon Color | When Shown |
|-------|-----------------|------------|------------|
| **Navigation** | `commandPalette.navigation` | `text-muted-foreground` | Always (pages) |
| **Collections** | `commandPalette.collections` | `text-accent` (amber) | When user has collections |
| **Recent Items** | `commandPalette.recent` | `text-muted-foreground` | When user has recent history |
| **Actions** | `commandPalette.actions` | `text-muted-foreground` | Always |
| **Settings** | `commandPalette.settings` | `text-muted-foreground` | Always |

#### Group Header

- **Typography**: `text-xs font-semibold uppercase tracking-wider` (overline style from type scale)
- **Color**: `text-muted-foreground`
- **Padding**: `px-2 py-1.5`
- **Letter spacing**: `0.05em`

#### Group Separator

- `CommandSeparator` — `h-px bg-border mx-2 my-1` between groups

---

### Result Items

#### Navigation Group

Static page links — always present regardless of search query.

| Item | Icon | Label i18n Key | Shortcut Hint |
|------|------|---------------|---------------|
| Dashboard | `LayoutDashboard` | `nav.dashboard` | — |
| Collections | `Library` | `nav.collections` | — |
| Collection Types | `Layers` | `nav.collectionTypes` | — |
| Wishlist | `Heart` | `nav.wishlist` | — |
| Profile | `User` | `nav.profile` | — |

#### Collections Group

Dynamic — populated from the user's actual collections. Each item navigates to that collection's detail page.

| Item | Icon | Label | Secondary |
|------|------|-------|-----------|
| [Collection Name] | `Library` (amber tint) | Collection name | Item count (e.g., "24 items") |

- **Max items shown**: 5 (most recently accessed first)
- **Source**: Fetch from API or cache on palette open (debounced, not on every keystroke)

#### Recent Items Group

Dynamic — shows the last 5 visited pages (stored in session or localStorage).

| Item | Icon | Label | Secondary |
|------|------|-------|-----------|
| [Page/Item Name] | `Clock` | Name of page/item visited | Relative time ("2m ago", "1h ago") |

- **Max items**: 5
- **Storage**: `sessionStorage` key `"geekvault-recent-pages"` — array of `{ path, label, icon, timestamp }`
- **Shown when**: No search query (default view) — hidden during active search to prioritize search results

#### Actions Group

Functional commands that do things rather than navigate.

| Item | Icon | Label i18n Key | Shortcut Hint |
|------|------|---------------|---------------|
| Create Collection | `Plus` | `commandPalette.createCollection` | — |
| Add to Wishlist | `HeartPlus` | `commandPalette.addToWishlist` | — |
| Import Data | `Upload` | `commandPalette.importData` | — |

#### Settings Group

Preference toggles and configuration.

| Item | Icon | Label i18n Key | Current Value |
|------|------|---------------|---------------|
| Toggle Theme | `Sun` / `Moon` | `commandPalette.toggleTheme` | "Light" / "Dark" |
| Toggle Sidebar | `PanelLeftClose` | `commandPalette.toggleSidebar` | — |
| Change Language | `Languages` | `commandPalette.changeLanguage` | "English" / "Português" |

---

### Result Item Layout

Each `CommandItem` follows a consistent layout:

```
┌─────────────────────────────────────────────────────┐
│  [icon]  Primary Label              Secondary  [⌘K] │
│  16×16   text-sm font-medium        text-xs    kbd  │
│          text-foreground            muted-fg        │
└─────────────────────────────────────────────────────┘
```

**Dimensions:**
- **Min height**: `44px` (WCAG target size)
- **Padding**: `px-3 py-2.5`
- **Border radius**: `--radius-md` (8px)
- **Gap**: `gap-3` (12px) between icon and label
- **Layout**: `flex items-center`

**Icon:**
- Size: `h-4 w-4` (16px)
- Color: `text-muted-foreground` (default), `text-accent` for collection items
- Flex: `shrink-0`

**Primary Label:**
- Typography: `text-sm font-medium`
- Color: `text-foreground`
- Overflow: `truncate` (single line, ellipsis)
- Flex: `flex-1 min-w-0`

**Secondary Description (optional):**
- Typography: `text-xs`
- Color: `text-muted-foreground`
- Alignment: Right-aligned after primary label
- Flex: `shrink-0 ml-auto`
- Usage: Item counts for collections, relative times for recents, current value for settings

**Keyboard Shortcut Hint (optional):**
- Only on items with global shortcuts
- Styled as `<kbd>` with `bg-muted border border-border rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground`
- Flex: `shrink-0 ml-2`

---

### Result Item States

| State | Visual Treatment |
|-------|-----------------|
| **Default** | `bg-transparent`, `text-foreground` |
| **Selected** (`aria-selected`) | `bg-accent/10` (amber at 10% opacity), `text-accent-foreground`, icon shifts to `text-accent` (amber) |
| **Selected + hover** | Same as selected (keyboard and pointer selection are unified in cmdk) |

- Selection is managed by cmdk via arrow keys and mouse hover — both set `aria-selected="true"`
- Only one item is selected at a time
- No separate "hover" vs "keyboard focus" distinction — cmdk unifies them
- Transition: `transition-colors` with `duration-instant` (50ms) — selection highlight should feel instant

---

### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Open palette (toggles if already open) |
| `↑` / `↓` | Navigate between result items |
| `Enter` | Execute selected item's action |
| `Escape` | Close palette (clears search first if search has text, second press closes) |
| `Cmd/Ctrl + Backspace` | Clear search input |
| `Home` / `End` | Jump to first / last result |

**Focus behavior:**
- On open: Input is auto-focused (cmdk default)
- On close: Focus returns to the element that was focused before opening
- Tab key: Does NOT cycle through results — arrow keys are the navigation mechanism (cmdk convention)

---

### Search Behavior

#### What Gets Indexed

cmdk handles matching against `CommandItem`'s `value` prop. Each item's `value` should be a searchable string combining its label and keywords:

- **Navigation items**: Page name + aliases (e.g., value="dashboard home overview")
- **Collections**: Collection name + type name (e.g., value="Vinyl Records music collection")
- **Actions**: Action name + verb aliases (e.g., value="create collection new add")
- **Settings**: Setting name + aliases (e.g., value="toggle theme dark light mode appearance")

#### Matching

- cmdk uses **substring matching** by default (not fuzzy) — it matches against the `value` prop
- Case-insensitive
- Items that don't match are hidden automatically
- Groups with no visible items are hidden automatically

#### Result Ranking

cmdk preserves the DOM order of items. Ranking is achieved through group ordering:

1. Navigation (pages — most common intent)
2. Collections (user's data — personal and relevant)
3. Actions (things to do)
4. Settings (least common)

Within each group, items maintain their defined order. Recent Items group only appears when there's no active search query.

---

### Empty State (No Search Query)

When the palette opens with no search text, show:

1. **Recent Items group** (if any recent history exists) — "Pick up where you left off" feel
2. **Navigation group** — full list of pages
3. **Actions group** — quick actions
4. **Settings group** — preference toggles

This gives users immediate value without typing — the palette doubles as a quick launcher.

### No Results State

When search text matches nothing:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│          [SearchX icon, h-10 w-10, muted]           │
│                                                     │
│          No results for "query text"                │
│          text-sm text-muted-foreground              │
│                                                     │
│          Try searching for a page, collection,      │
│          or action                                  │
│          text-xs text-muted-foreground/70            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **Icon**: `SearchX` from Lucide (h-10 w-10, `text-muted-foreground/30`)
- **Primary text**: "No results for "[query]"" — `text-sm text-muted-foreground`
- **Helper text**: "Try searching for a page, collection, or action" — `text-xs text-muted-foreground/70`
- **Layout**: `flex flex-col items-center justify-center py-10 gap-2`
- **i18n keys**: `commandPalette.noResults` (with `{{query}}` interpolation) and `commandPalette.noResultsHint`

---

### Entrance / Exit Animation

Aligned with the **Modal / Dialog** pattern from `design-motion.md`:

#### Entrance

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| **Backdrop** | `opacity: 0 → 1` | `200ms` | `ease-enter` |
| **Container** | `opacity: 0 → 1, scale: 0.95 → 1, y: -8px → 0` | `250ms` | `springGentle` |

- Backdrop and container enter simultaneously
- Container slides **down** slightly (y: -8px → 0) rather than up — it enters from above like a dropdown spotlight, matching its top-biased positioning
- Input auto-focuses after container animation begins (no delay — instant keyboard readiness)

#### Exit

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| **Container** | `opacity: 1 → 0, scale: 1 → 0.97` | `150ms` | `ease-exit` |
| **Backdrop** | `opacity: 1 → 0` | `150ms` | `ease-exit` |

- Container exits first, backdrop follows (slight overlap is fine)
- Exit is faster than entrance (150ms vs 250ms) — closing should feel instant

#### Framer Motion Implementation

```typescript
const commandPaletteVariants = {
  initial: { opacity: 0, scale: 0.95, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97 },
}

const commandPaletteTransition = {
  enter: { type: "spring", stiffness: 300, damping: 28 },  // springGentle
  exit: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] },   // ease-exit
}

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const backdropTransition = {
  enter: { duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] },   // ease-enter
  exit: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] },    // ease-exit
}
```

#### Reduced Motion

- All `transform` animations (scale, y) removed
- Opacity transitions reduced to `50ms` (duration-instant)
- Palette appears/disappears with a quick fade — still readable, just no spatial motion

---

### Responsive Behavior

#### Desktop (≥768px)

- Full 560px width, 25% from top
- Footer hint bar visible
- Keyboard shortcut hints shown on items

#### Mobile (<768px)

- Width: `calc(100vw - 2rem)` (16px margin on each side)
- Position: `top-4` (16px from top, not percentage-based — avoids keyboard overlap)
- Max height: `min(480px, 60vh)` (shorter to account for virtual keyboard)
- Footer hint bar **hidden** (keyboard hints irrelevant on touch)
- Shortcut hint `<kbd>` elements **hidden** on items
- Search input height stays at 52px (large touch target)
- Close on item select (same as desktop)

---

### Implementation Notes for cmdk

The current implementation uses `CommandDialog` which wraps cmdk's `Command` in a Radix dialog. Key considerations:

1. **Overlay**: The `overlayClassName` prop on `CommandDialog` controls the backdrop — apply blur and warm overlay colors there
2. **Content**: The `contentClassName` prop controls the container — apply positioning, shadow, and border radius there
3. **Animation**: cmdk's `CommandDialog` uses Radix Dialog internally, which has its own open/close states. Framer Motion animation should be applied by wrapping the dialog content or using Radix's `forceMount` + AnimatePresence pattern
4. **Filtering**: cmdk handles filtering internally via the `value` prop on `CommandItem` — no custom filter logic needed for basic substring matching
5. **Groups**: Empty `CommandGroup` components are automatically hidden when no children match the search query — no conditional rendering needed
6. **i18n**: All user-facing strings (headings, placeholders, empty states) must use `useTranslation()` with keys in both `en.json` and `pt.json`

### Accessibility

- **Role**: cmdk provides `role="listbox"` on the list and `role="option"` on items — this is correct for a command palette pattern
- **aria-label**: The `CommandDialog` `label` prop sets `aria-label` on the combobox — use `t("commandPalette.label")`
- **Live region**: cmdk announces result count changes via an `aria-live="polite"` region — no custom implementation needed
- **Escape key**: Returns focus to the previously focused element (managed by Radix Dialog's focus trap)
- **Reduced motion**: Animations respect `prefers-reduced-motion` via the `getVariants()` pattern from `motion.tsx`
