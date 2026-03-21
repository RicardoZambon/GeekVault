# GeekVault SaaS-Grade Frontend Redesign — Implementation PRD

## Introduction

This PRD defines the implementation plan for GeekVault's frontend redesign from its current Navy + Gold aesthetic to the new **Warm Obsidian** design language. The redesign transforms every visual surface — tokens, motion, layout, and all pages — into a cohesive, premium SaaS experience while preserving all existing functionality.

The design phase produced six specification documents that serve as the source of truth for all visual decisions:

| Document | Covers |
|----------|--------|
| `tasks/design-audit.md` | Current state assessment, gaps, priorities |
| `tasks/design-tokens.md` | Color palette, typography, spacing, border-radius, elevation |
| `tasks/design-motion.md` | Durations, easings, springs, page transitions, micro-interactions, reduced motion |
| `tasks/design-layout.md` | App shell, sidebar, toolbar, user menu, command palette |
| `tasks/design-pages.md` | Dashboard, collections, collection detail, catalog item, owned copies, sets, wishlist, collection types, profile, auth |
| `tasks/design-admin.md` | Admin layout, user management, system settings, analytics, audit log |

**This is a visual redesign only.** No backend changes, no new features, no API modifications. Every page retains its current functionality — only the presentation changes.

---

## Goals

1. **Premium identity** — Replace the generic Navy + Gold palette with the distinctive Warm Obsidian design language (warm stone neutrals, deep amber accent)
2. **Dark mode excellence** — Fix all dark mode issues identified in the audit (invisible charts, missing shadows, hardcoded colors)
3. **Motion coherence** — Replace ad-hoc animation timings with a unified motion system (5 durations, 4 springs, reduced-motion support)
4. **Accessibility** — Fix keyboard navigation gaps, switch to `focus-visible`, add missing ARIA attributes, respect `prefers-reduced-motion` everywhere
5. **Responsive polish** — Fix tablet orphan cards, add intermediate breakpoints, improve mobile touch targets
6. **Typography upgrade** — Replace Nunito with Plus Jakarta Sans for headings, formalize the type scale
7. **Component consistency** — Standardize empty states, hover effects, card patterns, and spacing across all pages

---

## Non-Goals

- **No backend changes** — API endpoints, database schema, and business logic are untouched
- **No new features** — No new pages, workflows, or capabilities (admin pages are designed but not implemented here unless routes already exist)
- **No marketing pages** — No landing page, pricing page, or public-facing content
- **No dependency upgrades** — React 19, Vite 8, Tailwind CSS v4 stay as-is; only add `@fontsource/plus-jakarta-sans`
- **No i18n restructuring** — Add new keys to existing `en.json` and `pt.json` files; don't restructure the i18n system

---

## Functional Requirements

### Theme Modes
- Light and dark modes must be fully supported with no hardcoded colors
- All color values must use CSS custom properties (`hsl(var(--*))` pattern)
- Theme toggle must work instantly via React context (no page reload)
- System preference detection must work for "system" theme option

### Responsive Breakpoints
- **Mobile:** < 768px — hamburger navigation, stacked layouts, touch-friendly targets
- **Tablet:** 768px – 1023px — collapsed sidebar, adapted grids (no orphan cards)
- **Desktop:** ≥ 1024px — full sidebar, multi-column layouts, hover interactions

### Accessibility Standards
- WCAG 2.1 AA compliance for color contrast (4.5:1 text, 3:1 large text/UI)
- `focus-visible` (not `focus`) for all focus rings
- Keyboard navigation for all interactive elements (no onClick-only divs)
- `aria-label` on icon-only buttons
- `prefers-reduced-motion` respected in all animations (Framer Motion and CSS)
- Minimum 44px touch targets on mobile

### Animation & Reduced Motion
- All Framer Motion animations must use the motion system's duration/spring tokens
- CSS `animate-pulse` replaced with custom keyframe that respects `prefers-reduced-motion`
- Reduced motion: remove transforms, keep 50ms opacity fades, preserve spinner rotation

### Testing Requirements
- All existing tests must continue to pass
- Every modified component's co-located `.test.tsx` must be updated if markup changes
- `npx tsc -b` must pass (zero type errors)
- 90% line coverage gate must be maintained

### i18n Requirements
- Every new or changed UI string must have keys in both `src/web/src/i18n/locales/en.json` and `pt.json`
- Use `useTranslation()` hook — no hardcoded English strings in JSX

---

## Technical Considerations

- **React 19** — hooks, context, and concurrent features
- **Tailwind CSS v4** — `@tailwindcss/postcss` (not vite plugin), `@theme inline` for custom properties
- **shadcn/ui** — manually set up (CLI incompatible with Node 24); primitives in `components/ui/`
- **Framer Motion** — page transitions, entrance animations, micro-interactions
- **recharts** — dashboard and analytics charts; must use `hsl(var(--chart-N))` fills
- **cmdk** — command palette; wraps Radix Dialog
- **@dnd-kit** — drag-and-drop for sortable lists
- **sonner** — toast notifications
- **react-i18next** — internationalization
- **@fontsource/plus-jakarta-sans** — new display font (to be installed)
- **Path alias:** `@/` maps to `src/`
- **API proxy:** `/api` and `/uploads` → `http://localhost:5099`

---

## Design Considerations

### Color Philosophy
The Warm Obsidian palette uses Tailwind's "stone" scale (warm grays) for all neutrals — never slate, zinc, or gray. The amber accent (#D97706 light / #F59E0B dark) provides warmth and energy. Dark mode surfaces use progressive elevation (background → card → secondary → popover) with warm-tinted shadows at higher opacity.

### Typography Philosophy
Plus Jakarta Sans (display/headings) pairs with Inter (body/UI) for a warm-geometric-meets-humanist aesthetic. The type scale is precise: tight line-heights for headings (1.1–1.35), relaxed for body (1.5–1.6). Tabular figures (`font-variant-numeric: tabular-nums`) on all numeric data.

### Motion Philosophy
Purposeful, fast, physics-based. Springs for interactive elements, cubic-bezier for non-interactive. Elements enter from below/right, exit upward/left. Reduced motion preserves opacity fades and spinners, removes all transforms.

### Layout Philosophy
Persistent sidebar + slim top toolbar. Sidebar context-switches for admin (nav items swap, not stack). Mobile uses hamburger → sheet. No breadcrumbs except on catalog item detail (3 levels deep).

---

## Success Metrics

- Zero TypeScript errors (`npx tsc -b` passes)
- All existing tests pass (`npm test`)
- 90% line coverage maintained (`npm run test:coverage`)
- WCAG AA contrast ratios on all text/UI elements
- No hardcoded color values in any component (all use CSS variables)
- Dark mode visually verified on every page
- Reduced motion verified (no transforms when `prefers-reduced-motion: reduce`)
- Every UI string in both `en.json` and `pt.json`

---

## User Stories

Stories are ordered by dependency. Each story references its design specification document. Stories within a phase can be parallelized; phases must be sequential.

---

### Phase 1: Foundation — Design Tokens & CSS

#### US-IMPL-001: Install Plus Jakarta Sans and update font tokens
**Priority:** 1
**Spec:** `tasks/design-tokens.md` → Typography section

**Acceptance Criteria:**
- Install `@fontsource/plus-jakarta-sans` (weights 400, 500, 600, 700)
- Update `src/web/src/index.css`: replace `@fontsource/nunito` import with `@fontsource/plus-jakarta-sans`
- Update `--font-display` from `"Nunito"` to `"Plus Jakarta Sans"`
- Verify `--font-body` remains `"Inter"`
- Typecheck passes (`npx tsc -b`)
- Verify in browser that headings use Plus Jakarta Sans

#### US-IMPL-002: Implement new color palette tokens (light + dark)
**Priority:** 2
**Spec:** `tasks/design-tokens.md` → Color Palette section

**Acceptance Criteria:**
- Replace all color values in `:root` (light mode) block in `index.css` with Warm Obsidian light palette
- Replace all color values in `.dark` block with Warm Obsidian dark palette
- Add new tokens: `--warning`, `--warning-foreground`, `--info`, `--info-foreground`
- Update sidebar tokens (`--sidebar-*`) for both modes
- Add chart color tokens (`--chart-1` through `--chart-8`) for both modes
- Update focus ring color to amber (`--ring`)
- Update text selection color (`::selection` styles)
- Typecheck passes
- Verify in browser: light mode, dark mode, and sidebar colors all correct
- Add new i18n keys to both `en.json` and `pt.json` if any UI strings change

#### US-IMPL-003: Implement spacing, border-radius, and elevation tokens
**Priority:** 3
**Spec:** `tasks/design-tokens.md` → Spacing, Border Radius, Elevation sections

**Acceptance Criteria:**
- Add new spacing tokens to `@theme inline`: `--space-0.5` (2px), `--space-1.5` (6px), `--space-16` (64px), `--space-20` (80px), `--space-24` (96px)
- Update border-radius tokens: `--radius-md` → 8px, `--radius-lg` → 12px; add `--radius-2xl` (24px); remove `--radius` base variable (make all explicit)
- Add shadow tokens to `:root` and `.dark`: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` with warm-tinted light and high-opacity dark values
- Reference shadow tokens in `@theme inline` for Tailwind integration
- Typecheck passes
- Verify in browser: card shadows visible in both modes, radius changes applied

---

### Phase 2: Motion System

#### US-IMPL-004: Implement motion tokens and update motion.tsx
**Priority:** 4
**Spec:** `tasks/design-motion.md` → Duration Tokens, Easing Curves, Spring Configs sections

**Acceptance Criteria:**
- Add CSS custom properties to `:root` in `index.css`: `--duration-instant` (50ms), `--duration-fast` (150ms), `--duration-normal` (250ms), `--duration-slow` (400ms), `--duration-deliberate` (600ms), `--ease-standard`, `--ease-enter`, `--ease-exit`, `--ease-emphasized`
- Update `src/web/src/components/ds/motion.tsx`: export `springs` object (default, gentle, bouncy, stiff), `durations` object, `easings` object
- Update existing variants (PageTransition, FadeIn, StaggerChildren, ScaleIn) to use new tokens
- Add `getVariants()` factory that returns noop variants when `prefers-reduced-motion` is set
- Replace any Tailwind `animate-pulse` usage with custom `@keyframes skeleton-pulse` that respects reduced motion
- Add `@media (prefers-reduced-motion: reduce)` block in `index.css` that disables CSS animations but preserves spinners
- Typecheck passes
- Verify in browser: page transitions work, reduced motion disables transforms

---

### Phase 3: App Shell & Navigation

#### US-IMPL-005: Redesign sidebar component
**Priority:** 5
**Spec:** `tasks/design-layout.md` → App Shell & Navigation section

**Acceptance Criteria:**
- Update `src/web/src/components/layout/sidebar.tsx` with new visual design: dark background using sidebar tokens, navigation group structure (Overview, Collections, Account, Admin conditional), 260px/72px widths
- Implement nav item states: default, hover (bg-sidebar-accent/50), active (amber left border + amber icon), focus-visible ring
- Update collapse/expand animation to use motion tokens (250ms, text fade timing)
- Implement edge toggle button with group-hover pattern
- Ensure nav items have min-height 44px (WCAG touch target)
- Update navigation hierarchy: Dashboard, Collections, Collection Types, Wishlist, Profile, Admin (conditional)
- Implement tooltip behavior when collapsed (side="right", delayDuration=0)
- Typecheck passes
- Update co-located tests if markup changes
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser: expanded, collapsed, and transition states

#### US-IMPL-006: Redesign top toolbar and mobile header
**Priority:** 6
**Spec:** `tasks/design-layout.md` → Top Toolbar Design, Mobile Header Design sections

**Acceptance Criteria:**
- Update `src/web/src/components/layout/top-toolbar.tsx`: 72px height, search trigger button (opens command palette), action buttons (help, notifications, language, theme, user avatar)
- Update `src/web/src/components/layout/header.tsx` (mobile): 56px height, hamburger, brand icon + "GeekVault" text, language/theme toggles
- Search trigger styled as fake input with ⌘K keyboard hint
- Theme toggle icon transition (Sun/Moon with rotation)
- All toolbar buttons use ghost variant, 36×36px, wrapped in Tooltip
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser at desktop, tablet, and mobile breakpoints

#### US-IMPL-007: Redesign user menu dropdown
**Priority:** 7
**Spec:** `tasks/design-layout.md` → User Menu section

**Acceptance Criteria:**
- Update `src/web/src/components/layout/user-menu.tsx`: w-56 dropdown with profile link, theme cycle, language toggle, logout
- Style with bg-popover, --shadow-lg, --radius-lg
- Menu items: min-h-36px, hover bg-accent/10, icons h-4 w-4
- Menu stays open after toggling theme/language (don't auto-close)
- Logout closes menu and navigates with replace=true
- Placement: side="top" from sidebar, side="bottom" from toolbar
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser: both trigger points work correctly

#### US-IMPL-008: Update app layout and animated outlet
**Priority:** 8
**Spec:** `tasks/design-layout.md` → Responsive Breakpoint Summary, Animated Page Transitions sections

**Acceptance Criteria:**
- Update `src/web/src/components/layout/app-layout.tsx`: responsive layout with correct padding (px-4/py-4 mobile, px-4/py-6 tablet, px-6/py-6 desktop)
- Update `src/web/src/components/layout/animated-outlet.tsx`: page transition uses new motion tokens (enter: y 12→0, 250ms springGentle; exit: y 0→-8, 150ms ease-exit)
- Verify z-index layers: sidebar z-0, dropdowns z-50, sheet z-50, command palette z-50, toasts z-[100]
- Typecheck passes
- Update co-located tests
- Verify in browser: page transitions smooth, layout correct at all breakpoints

---

### Phase 4: Command Palette

#### US-IMPL-009: Redesign command palette
**Priority:** 9
**Spec:** `tasks/design-layout.md` → Command Palette section

**Acceptance Criteria:**
- Update `src/web/src/components/layout/command-palette.tsx`: backdrop blur(8px), container at 25% from top, --radius-xl, --shadow-xl, 560px width
- Implement search input: 52px height, Search icon, placeholder "Search pages, collections, actions..."
- Implement result groups: Navigation (static), Collections (dynamic), Recent Items (sessionStorage), Actions, Settings
- Result items: 44px min-height, icon + primary label + secondary description + optional keyboard hint
- Selected state: bg-accent/10, text-accent
- Footer hint bar with keyboard shortcuts (hidden on mobile)
- Entrance animation: scale 0.95→1, y -8→0, 250ms springGentle
- Exit animation: scale 1→0.97, 150ms ease-exit
- Reduced motion: opacity only at 50ms
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser: open/close, search, keyboard navigation

---

### Phase 5: Page Redesigns — Core Pages

#### US-IMPL-010: Redesign dashboard — greeting and stats row
**Priority:** 10
**Spec:** `tasks/design-pages.md` → Dashboard section (Greeting, Stats Row)

**Acceptance Criteria:**
- Update `src/web/src/features/dashboard/dashboard-page.tsx`: add time-aware greeting with user name and collection stats subtitle
- Update `src/web/src/features/dashboard/components/stats-row.tsx`: 5 stat cards (Collections, Items, Owned Copies, Total Value, Total Invested) with 40×40px icon containers, animated numbers, hover lift (-2px), trend indicator placeholder
- Stats grid responsive: 5-col desktop → 3-col tablet → 2-col mobile (no orphan cards)
- StaggerChildren entrance animation with 60ms stagger
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser at all breakpoints

#### US-IMPL-011: Redesign dashboard — charts section
**Priority:** 11
**Spec:** `tasks/design-pages.md` → Dashboard section (Charts)

**Acceptance Criteria:**
- Update `src/web/src/features/dashboard/components/charts-section.tsx`: donut pie chart (Items by Condition) + bar chart (Condition Breakdown)
- All chart fills use `hsl(var(--chart-N))` — no hardcoded hex colors
- Custom chart tooltip styled with --card bg, --border, --radius-md, --shadow-md
- 2-column grid desktop, stacked on mobile
- Chart card containers with --radius-lg, --shadow-sm
- Typecheck passes
- Update co-located tests
- Verify in browser: charts visible and legible in both light and dark modes

#### US-IMPL-012: Redesign dashboard — collection summaries and recent acquisitions
**Priority:** 12
**Spec:** `tasks/design-pages.md` → Dashboard section (Collection Summaries, Recent Acquisitions)

**Acceptance Criteria:**
- Update `src/web/src/features/dashboard/components/collection-summaries.tsx`: 3-column card grid (max 6), cover image with gradient fallback (`index % 4` rotation), hover lift, "View all" link
- Cards must have `tabIndex={0}`, `role="link"`, `onKeyDown` for keyboard accessibility
- Update `src/web/src/features/dashboard/components/recent-acquisitions.tsx`: DataTable with condition badges, max 8 rows, responsive column hiding
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser at all breakpoints

#### US-IMPL-013: Redesign dashboard — empty state and loading skeleton
**Priority:** 13
**Spec:** `tasks/design-pages.md` → Dashboard section (Empty State, Loading State)

**Acceptance Criteria:**
- Add empty state to dashboard: Sparkles icon, message, CTA to create first collection, keyboard hint
- StaggerChildren reveal animation on empty state
- Add loading skeleton layout matching final content structure (greeting skeleton, stats skeleton row, chart skeletons, summaries skeleton grid)
- Skeleton pulse uses custom keyframe (not Tailwind animate-pulse)
- Ensure all dashboard sub-sections show EmptyState component instead of returning null
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser: empty state and loading state

#### US-IMPL-014: Redesign collections list page — grid view and toolbar
**Priority:** 14
**Spec:** `tasks/design-pages.md` → Collections List section

**Acceptance Criteria:**
- Update `src/web/src/features/collections/collections-page.tsx`: toolbar with search, type filter, sort select, view toggle (grid/list), create button
- Grid view cards: 4:3 aspect ratio, cover image full-bleed, gradient metadata overlay, collection type badge, hover effects (-4px lift, shadow-lg, amber border glow, image zoom via CSS transition)
- Action buttons: frosted glass circles, `sm:opacity-0 sm:group-hover:opacity-100` (always visible on mobile)
- Gradient fallback: `index % 4` rotation through 4 warm gradients
- Cards use `--radius-xl` (16px)
- Responsive: 3-col desktop, 2-col tablet, 1-col mobile
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser at all breakpoints

#### US-IMPL-015: Redesign collections list page — list view, dialogs, and states
**Priority:** 15
**Spec:** `tasks/design-pages.md` → Collections List section (List View, Create/Edit Dialog, Delete, Empty State, Drag)

**Acceptance Criteria:**
- List view: DataTable with 40×40px thumbnail in name column, type, items count, last updated
- Create/edit dialog: form with name, description, type select (required), cover image dropzone with live preview
- Delete confirmation dialog with destructive button styling
- Empty state: icon, message, CTA to create first collection
- Drag-to-reorder: ring-2 ring-accent, shadow-xl, scale 1.02 (only when sort = "custom")
- No results state for search with no matches
- Loading skeleton matching grid layout
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-016: Redesign collection detail page — header and tabs
**Priority:** 16
**Spec:** `tasks/design-pages.md` → Collection Detail section (Header, Tabs)

**Acceptance Criteria:**
- Update `src/web/src/features/collections/collection-detail-page.tsx`: back navigation (ghost button with arrow), cover image banner (240px desktop, 192px tablet, 160px mobile) with gradient overlay (`bg-gradient-to-t from-black/70 via-black/30 to-transparent`)
- Metadata overlay: collection name, description, stats (items, value, completion %)
- Gradient fallback: `collection.id % 4`
- Action buttons: frosted glass (`bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30`), mobile moves below banner
- Tab navigation: All Items, Sets, Stats tabs with amber underline indicator
- Tab content animation: fade + small y shift (lightweight for frequent switching)
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser at all breakpoints

#### US-IMPL-017: Redesign collection detail page — items tab content
**Priority:** 17
**Spec:** `tasks/design-pages.md` → Collection Detail section (Items Tab)

**Acceptance Criteria:**
- Items tab: search and filter toolbar (search input, condition filter, sort), grid/list view toggle, add item + import/export buttons
- Item grid cards: image, name, key attributes, condition badge, `--radius-lg` (12px)
- Item list view: DataTable with thumbnail, name, condition, rarity, actions
- Add item dialog: form with identifier, name, description, release date, manufacturer, reference code, rarity, image upload, custom fields
- Empty state for no items
- Drag-to-reorder for items when sort = "custom"
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-018: Redesign collection detail page — sets tab and stats tab
**Priority:** 18
**Spec:** `tasks/design-pages.md` → Collection Detail section (Sets Tab, Stats Tab)

**Acceptance Criteria:**
- Sets tab: expandable accordion cards with completion progress, item checklist, add-to-wishlist on missing items
- Set completion color thresholds: <50% muted, 50-99% accent, 100% success
- Accordion expand uses Framer Motion height animation
- Stats tab: StatCards and charts (condition breakdown, rarity distribution) reusing dashboard chart patterns
- Charts use `hsl(var(--chart-N))` fills
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-019: Redesign catalog item detail page — hero and metadata
**Priority:** 19
**Spec:** `tasks/design-pages.md` → Catalog Item Detail section

**Acceptance Criteria:**
- Update `src/web/src/features/collections/catalog-item-detail-page.tsx`: breadcrumb trail (Collections > Collection Name > Item Name) — this is the only page with breadcrumbs
- Hero layout: 5-column grid, 2/5 for square image (with warm fallback), 3/5 for identity panel
- Identity panel: name (h1), identifier, action buttons (edit, delete, add copy)
- Metadata grid: manufacturer, release date, reference code, rarity (3-col desktop, 1-col mobile)
- Custom fields card: collection-type-specific fields displayed conditionally
- Set membership indicator: callout cards showing which sets item belongs to with completion badges
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser at all breakpoints

#### US-IMPL-020: Redesign catalog item detail page — owned copies section
**Priority:** 20
**Spec:** `tasks/design-pages.md` → Catalog Item Detail section (Owned Copies), `tasks/design-pages.md` → Owned Copies section

**Acceptance Criteria:**
- Owned copies section: grid of copy cards with condition badge (3-tier color: Mint/NearMint→success, Excellent/Good→primary, Fair/Poor→warning)
- Copy card: flat design (no lift on hover, just shadow-md), financial values with `tabular-nums`, notes, image thumbnails (max 4 + overflow badge)
- Action buttons: `sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100`
- Add/edit copy dialog: condition select with color indicators, date picker, price input with currency prefix (`absolute left-3` + `pl-7`), notes textarea, multi-image upload zone
- Image upload zone: drag-and-drop, preview grid (`grid-cols-4 sm:grid-cols-5`), reorder via @dnd-kit, file validation
- Delete copy confirmation with image count warning
- Empty state for no copies
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-021: Create image gallery lightbox component
**Priority:** 21
**Spec:** `tasks/design-pages.md` → Owned Copies section (Image Gallery Lightbox)

**Acceptance Criteria:**
- Create `src/web/src/components/ds/image-gallery-lightbox.tsx`: full-screen overlay using `createPortal`
- Navigation arrows (hidden on mobile — swipe only), close button, image counter, dot indicators
- Keyboard navigation: left/right arrows, Escape to close
- Focus trap: focus stays in lightbox, returns to trigger thumbnail on close
- Direction-aware slide transitions
- Backdrop: black/90 with blur
- Reduced motion: instant image swap (no slide)
- Export from `components/ds/index.ts`
- Create co-located test file
- Typecheck passes
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-022: Create set progress ring component
**Priority:** 22
**Spec:** `tasks/design-pages.md` → Sets section (Completion Visualization)

**Acceptance Criteria:**
- Create `src/web/src/components/ds/set-progress-ring.tsx`: SVG-based circular progress ring
- Two sizes: 36×36px (card) and 64×64px (hero)
- `stroke-dasharray` calculation: fill = (percentage/100) × circumference
- Rotate -90deg to start at 12 o'clock
- Color tiers: <50% muted, 50-99% accent, 100% success with glow (`filter: drop-shadow`)
- 100% completion: one-time scale pulse via Framer Motion spring
- CSS transition for smooth fill animation
- Reduced motion: instant fill (no animation)
- Export from `components/ds/index.ts`
- Create co-located test file
- Typecheck passes
- Verify in browser with various percentages

---

### Phase 6: Page Redesigns — Secondary Pages

#### US-IMPL-023: Redesign sets page
**Priority:** 23
**Spec:** `tasks/design-pages.md` → Sets section

**Acceptance Criteria:**
- Sets are displayed within collection detail page (Sets tab) — ensure set cards use the SetProgressRing component
- Set card (collapsed): chevron, name, fraction count, progress ring, action buttons (edit, delete)
- Set card (expanded): item checklist with owned (solid border, green left stripe) vs missing (dashed border, bg-card/50) visual distinction
- Missing items: Heart button "Add to Wishlist" with optimistic UI (button → "Added" → "In Wishlist" disabled)
- Chevron rotation: single ChevronDown icon + Framer Motion rotate (-90° collapsed, 0° expanded)
- Set detail page (if route exists): hero header with large ring + progress bar, filter tabs (All, Owned, Missing), item grid
- Empty states: no sets, no items, all owned celebration
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-024: Redesign wishlist page
**Priority:** 24
**Spec:** `tasks/design-pages.md` → Wishlist section

**Acceptance Criteria:**
- Update `src/web/src/features/wishlist/wishlist-page.tsx`: page header with title + add button
- Filter/sort toolbar: priority filter, sort by (priority/price/name/date), date range filter, item count
- Collection groups: collapsible sections with chevron rotation animation, item count badge
- Wishlist cards: drag handle, name, priority badge (High→destructive, Medium→accent, Low→muted), target price, notes preview (2-line clamp), catalog link, actions dropdown
- Cards: subtle `hover:shadow-md` (no translate lift — data cards, not destinations)
- Create/edit dialog: collection select, name, priority + target price grid, notes textarea, catalog item link search
- Drag-to-reorder within collection groups
- Empty state: Heart icon, encouraging message, add button
- No results state: Search icon, filter hint
- Group collapse state NOT persisted (all expanded on load)
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-025: Redesign collection types page
**Priority:** 25
**Spec:** `tasks/design-pages.md` → Collection Types section

**Acceptance Criteria:**
- Update `src/web/src/features/collection-types/collection-types-page.tsx`: card grid with icon hero (40×40px container), name, description, custom field type badges (color-coded: text→info, number→accent, date→success, enum→chart-5, boolean→muted, image_url→chart-6), usage count
- Cards: no lift on hover (management cards) — just border + shadow shift
- Two-tab create/edit dialog: General (icon picker grid popover, name, description) + Custom Fields (draggable field rows, type select, enum options tag editor)
- Icon picker: curated 25-icon subset of Lucide in 4-column grid popover
- Delete confirmation with usage warning if type is used by collections
- Field limit: max 10 custom fields, add button disabled at limit
- Responsive: 4-col desktop, 3-col tablet, 2-col mobile, 1-col small
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-026: Redesign profile page
**Priority:** 26
**Spec:** `tasks/design-pages.md` → Profile section

**Acceptance Criteria:**
- Update `src/web/src/features/profile/profile-page.tsx`: card-per-section layout (new pattern, replacing flat form)
- 2-column grid on desktop (1/3 avatar card, 2/3 form cards), single column on mobile
- Avatar card: 96×96px image with hover upload overlay, user name, email
- Account Info card: editable display name, read-only email with lock icon (`opacity-60` + Lock icon absolutely positioned)
- About card: bio textarea
- Preferences card: language + currency selects (2-column grid)
- Appearance card: 3 visual theme toggles (Light/Dark/System with icons) — applies immediately via context (no Save needed)
- Save button: right-aligned desktop, sticky bottom mobile
- Loading skeleton matching final structure
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-027: Redesign auth pages (login + register)
**Priority:** 27
**Spec:** `tasks/design-pages.md` → Auth Pages section

**Acceptance Criteria:**
- Update `src/web/src/features/auth/auth-layout.tsx`: split-screen layout — 55% decorative panel (left) + 45% form panel (right)
- Decorative panel: `bg-stone-900`, layered radial gradients with amber tones, floating blurred circles (CSS `@keyframes float`, 20s duration, staggered delays), brand content (icon, "GeekVault", tagline)
- Decorative panel hidden below `lg:` breakpoint — replaced by compact brand header above form on mobile
- Update `src/web/src/features/auth/login-page.tsx`: "Welcome back" title, email + password fields, submit with loading state, error banner, register link
- Update `src/web/src/features/auth/register-page.tsx`: "Create your vault" title, display name + email + password fields, submit with loading state, error banner, login link
- No hardcoded gradient colors — use CSS variables where possible, stone scale for non-variable colors
- Typecheck passes
- Update co-located tests
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser at desktop and mobile breakpoints

---

### Phase 7: Admin Area

#### US-IMPL-028: Implement admin layout and sidebar context switch
**Priority:** 28
**Spec:** `tasks/design-admin.md` → Admin Layout & Navigation section

**Acceptance Criteria:**
- Update sidebar to support admin context: define `adminNavGroups` alongside `navGroups`, switch based on `location.pathname.startsWith("/admin")`
- Admin nav items: Back to GeekVault (header link), Management group (Users, Settings), Insights group (Analytics, Audit Log)
- Sidebar context transition: AnimatePresence with fast fade (100ms) on nav group container
- Visual differentiation: sidebar "ADMIN" badge (Shield icon), toolbar admin pill badge (amber-tinted)
- Mobile header text: "Admin" instead of "GeekVault" when on admin routes
- Route guard: redirect non-admin users silently to `/` (no toast)
- `/admin` redirects to `/admin/users`
- Create admin page directory: `src/web/src/features/admin/`
- Add admin routes to `App.tsx`
- Typecheck passes
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser: admin nav, back link, context switch animation, mobile header

#### US-IMPL-029: Implement admin user management page
**Priority:** 29
**Spec:** `tasks/design-admin.md` → User Management section

**Acceptance Criteria:**
- Create `src/web/src/features/admin/users-page.tsx`: data table with avatar+name+email, role badge (Admin→accent, User→secondary), status dot (Active→success, Disabled→muted), last active, actions dropdown
- Row height: 56px, hover overlay, click opens user detail Sheet
- Search + filter bar: debounced search, role filter, status filter, result count
- User detail Sheet (side panel, sm:max-w-md): profile info, collection stats, action buttons
- Confirmation dialogs: role change, enable/disable, delete (requires typed name)
- Pagination: summary + page controls + page size select
- Empty and no-results states
- Responsive: hide Status/Last Active columns on mobile, simplified pagination
- Create co-located test file
- Typecheck passes
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-030: Implement admin system settings page
**Priority:** 30
**Spec:** `tasks/design-admin.md` → System Settings section

**Acceptance Criteria:**
- Create `src/web/src/features/admin/settings-page.tsx`: card-per-section pattern (General, Security, Features, Storage), max-w-3xl centered
- Independent save per section with unsaved changes amber dot indicator
- General: app name input, description textarea, language select, currency select
- Security: password length, uppercase/number/special toggles (Switch), session timeout, registration toggle
- Features: 5 feature flag toggles with descriptions, separated by border-b
- Storage: max upload size, file type checkboxes (grid-cols-2)
- Toggle layout: label+help left, switch right, `flex items-start justify-between gap-4`
- beforeunload prompt for unsaved changes
- Success/error toasts, validation errors inline
- Loading skeletons per card
- Create co-located test file
- Typecheck passes
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-031: Implement admin analytics dashboard
**Priority:** 31
**Spec:** `tasks/design-admin.md` → Analytics Dashboard section

**Acceptance Criteria:**
- Create `src/web/src/features/admin/analytics-page.tsx`: page header with time range segmented button group (7d, 30d, 90d, All time), default 30d
- Segmented button group: `bg-muted` track, `bg-card` active pill + `--shadow-sm`
- Time range stored in URL search params (`?range=30d`)
- Platform stats row: 4 StatCards (Total Users, Active Users 30d, Total Collections, Total Items)
- Growth charts (2-column): line chart for user signups (--chart-1 amber), bar chart for collections created (--chart-2 blue)
- Charts use `hsl(var(--chart-N))`, custom tooltip component
- Usage breakdown (3-column): most active users table (5 rows), largest collections table (5 rows), popular collection types horizontal bar chart
- Loading skeletons, individual empty states per section
- Responsive: stats 4→2-col, charts 2→1-col, usage 3→1-col
- Create co-located test file
- Typecheck passes
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

#### US-IMPL-032: Implement admin audit log page
**Priority:** 32
**Spec:** `tasks/design-admin.md` → Audit Log section

**Acceptance Criteria:**
- Create `src/web/src/features/admin/audit-log-page.tsx`: filter bar (search, action type select, user combobox, date range, CSV export button)
- Data table: timestamp, user (avatar+name), action badge (color-coded: Create→success, Update→info, Delete→destructive, Login/Logout→muted, Export/Import→accent, Settings→warning), target, details
- Row click: inline accordion detail expansion (AnimatePresence height 0→auto, 200ms)
- Detail panel: full event metadata, changes section with mini-table (field, before with line-through, after with font-medium)
- Server-side pagination with API parameters (page, pageSize, search, action, userId, fromDate, toDate)
- CSV export: downloads all filtered entries, filename `geekvault-audit-log-{YYYY-MM-DD}.csv`
- Responsive: hide Target/Details columns on mobile, filters stack, detail shows hidden fields
- Empty and no-results states
- Create co-located test file
- Typecheck passes
- Add new i18n keys to both `en.json` and `pt.json`
- Verify in browser

---

### Phase 8: Polish & Review

#### US-IMPL-033: Global accessibility and dark mode audit
**Priority:** 33
**Spec:** `tasks/design-audit.md` → Accessibility Gaps, Dark Mode Assessment sections

**Acceptance Criteria:**
- Replace all `:focus` with `:focus-visible` in custom CSS and component classes
- Add `aria-label` to all icon-only buttons across all pages
- Add `tabIndex={0}`, `role`, and `onKeyDown` to all clickable div elements
- Verify WCAG AA contrast ratios on all text/accent combinations in both modes
- Verify no hardcoded color values remain in any component (grep for hex values, rgb(), hsl() without var())
- Verify dark mode on every page — no invisible elements, proper shadow visibility, chart legibility
- Test with `prefers-reduced-motion: reduce` — no transforms, spinners still work
- Typecheck passes
- All tests pass

#### US-IMPL-034: Final cross-page consistency review
**Priority:** 34
**Spec:** All design documents

**Acceptance Criteria:**
- Verify section spacing is consistent: `--space-8` (32px) desktop, `--space-6` (24px) mobile across all pages
- Verify empty states use EmptyState component consistently (no pages returning null)
- Verify all cards use correct radius: `--radius-xl` for collection gallery cards, `--radius-lg` for all others
- Verify hover patterns: lift on navigable cards (collections, collection summaries), shadow-only on data cards (copies, wishlist)
- Verify all skeleton loading states use custom pulse keyframe (not Tailwind animate-pulse)
- Verify all chart fills use `hsl(var(--chart-N))` pattern
- Verify all UI strings are in both `en.json` and `pt.json`
- Run full test suite: `npm test`
- Run coverage: `npm run test:coverage` — verify 90% line coverage
- Run typecheck: `npx tsc -b` — zero errors
- Verify in browser: navigate through every page in light mode, dark mode, and mobile viewport
