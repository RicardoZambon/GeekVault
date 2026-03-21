# GeekVault SaaS-Grade Redesign — Final Implementation PRD

## Introduction

This PRD defines the complete implementation plan for GeekVault's transformation into a premium SaaS experience. It encompasses two major workstreams:

1. **Frontend Visual Redesign** — Replacing the Navy + Gold aesthetic with the **Warm Obsidian** design language across every surface (tokens, motion, layout, all pages)
2. **Admin Backend + Frontend** — Building the role-based authorization system, admin APIs, and admin UI pages from scratch

**Branch:** All work for this PRD is done on `ralph/saas-redesign-plan`. Do not create new branches — commit directly to this branch.

The design phase produced six specification documents that serve as the source of truth:

| Document | Covers |
|----------|--------|
| `tasks/design-audit.md` | Current state assessment, gaps, priorities |
| `tasks/design-tokens.md` | Color palette, typography, spacing, border-radius, elevation |
| `tasks/design-motion.md` | Durations, easings, springs, page transitions, micro-interactions, reduced motion |
| `tasks/design-layout.md` | App shell, sidebar, toolbar, user menu, command palette |
| `tasks/design-pages.md` | Dashboard, collections, collection detail, catalog item, owned copies, sets, wishlist, collection types, profile, auth |
| `tasks/design-admin.md` | Admin layout, user management, system settings, analytics, audit log |

---

## Goals

1. **Premium identity** — Replace Navy + Gold with the Warm Obsidian design language (warm stone neutrals, deep amber accent)
2. **Dark mode excellence** — Fix all dark mode issues (invisible charts, missing shadows, hardcoded colors)
3. **Motion coherence** — Unified motion system (5 durations, 4 springs, reduced-motion support)
4. **Accessibility** — Fix keyboard navigation, `focus-visible`, ARIA attributes, `prefers-reduced-motion`
5. **Responsive polish** — Fix tablet orphan cards, intermediate breakpoints, mobile touch targets
6. **Typography upgrade** — Plus Jakarta Sans for headings, formalized type scale
7. **Component consistency** — Standardize empty states, hover effects, card patterns, spacing
8. **Admin platform** — Role-based access, user management, system settings, analytics, and audit logging

---

## Non-Goals

- **No marketing pages** — No landing page, pricing page, or public-facing content
- **No dependency upgrades** — React 19, Vite 8, Tailwind CSS v4 stay as-is; only add `@fontsource/plus-jakarta-sans`
- **No i18n restructuring** — Add keys to existing `en.json`/`pt.json`; don't restructure the system
- **No notification infrastructure** — Deferred to future
- **No onboarding flow** — Deferred to future
- **No bulk actions or global search** — Deferred to future

---

## Functional Requirements

### Theme Modes
- FR-1: Light and dark modes fully supported with no hardcoded colors
- FR-2: All color values use CSS custom properties (`hsl(var(--*))` pattern)
- FR-3: Theme toggle works instantly via React context (no reload)
- FR-4: System preference detection for "system" theme option

### Responsive Breakpoints
- FR-5: Mobile (< 768px) — hamburger nav, stacked layouts, 44px min touch targets
- FR-6: Tablet (768px – 1023px) — collapsed sidebar, adapted grids (no orphan cards)
- FR-7: Desktop (≥ 1024px) — full sidebar, multi-column layouts, hover interactions

### Accessibility
- FR-8: WCAG 2.1 AA color contrast (4.5:1 text, 3:1 large text/UI)
- FR-9: `focus-visible` (not `focus`) for all focus rings
- FR-10: Keyboard navigation for all interactive elements (no onClick-only divs)
- FR-11: `aria-label` on all icon-only buttons
- FR-12: `prefers-reduced-motion` respected everywhere

### Animation & Reduced Motion
- FR-13: All Framer Motion animations use motion system tokens
- FR-14: Custom `skeleton-pulse` keyframe replaces Tailwind `animate-pulse`
- FR-15: Reduced motion removes transforms, keeps 50ms opacity fades and spinner rotation

### Admin & Authorization
- FR-16: Role-based identity system with `Admin` and `User` roles via ASP.NET Identity
- FR-17: JWT tokens include role claims
- FR-18: Admin API endpoints require `Admin` role authorization policy
- FR-19: Admin routes guarded on frontend — silent redirect to `/` for non-admin users
- FR-20: Audit log captures all CRUD operations and auth events automatically

### Testing
- FR-21: All existing tests continue to pass
- FR-22: Modified components have updated co-located `.test.tsx` files
- FR-23: New backend endpoints have integration tests
- FR-24: `npx tsc -b` passes (zero type errors)
- FR-25: 90% line coverage maintained (both frontend and backend)

### i18n
- FR-26: Every UI string in both `en.json` and `pt.json`
- FR-27: Use `useTranslation()` hook — no hardcoded English in JSX
- FR-28: Portuguese translations machine-translated during implementation, flagged for human review later

### Browser Support
- FR-29: Modern evergreen browsers only — Chrome, Edge, Firefox, Safari (last 2 versions)

---

## Technical Considerations

### Frontend
- **React 19** + TypeScript + **Vite 8**
- **Tailwind CSS v4** via `@tailwindcss/postcss`, `@theme inline` for custom properties
- **shadcn/ui** manually set up (CLI incompatible with Node 24)
- **Framer Motion** for page transitions, entrances, micro-interactions
- **recharts** for charts — must use `hsl(var(--chart-N))` fills
- **cmdk** for command palette
- **@dnd-kit** for drag-and-drop sortable lists
- **sonner** for toast notifications
- **react-i18next** for internationalization
- **@fontsource/plus-jakarta-sans** — new display font (to be installed)
- Path alias: `@/` → `src/`; API proxy: `/api` → `http://localhost:5099`

### Backend
- **.NET 8.0** with minimal API style (static classes with `Map*Endpoints()`)
- **EF Core** with SQL Server + **ASP.NET Identity**
- Current `IdentityUserContext<User>` must be upgraded to `IdentityDbContext<User, IdentityRole, string>` to restore role support (role tables were previously removed)
- JWT Bearer authentication — role claims must be added to token generation
- Admin authorization policy: `builder.Services.AddAuthorizationBuilder().AddPolicy("AdminOnly", p => p.RequireRole("Admin"))`
- New entities: `AuditLog`, `SystemSetting`
- Repository + Service pattern (matches existing codebase)

### Backend Current State (Clean Slate for Admin)
- No role field on User entity, no role tables in DB
- No admin controllers, middleware, or policies
- No audit log entity or infrastructure
- No system settings entity
- JWT tokens contain only NameIdentifier, Email, Jti (no role claims)

---

## Design Considerations

### Color Philosophy
Warm Obsidian uses Tailwind's "stone" scale (warm grays) — never slate, zinc, or gray. Amber accent (#D97706 light / #F59E0B dark). Dark mode surfaces use progressive elevation with warm-tinted shadows.

### Typography Philosophy
Plus Jakarta Sans (display/headings) + Inter (body/UI). Tight line-heights for headings (1.1–1.35), relaxed for body (1.5–1.6). `tabular-nums` on all numeric data.

### Motion Philosophy
Purposeful, fast, physics-based. Springs for interactive, cubic-bezier for non-interactive. Enter from below/right, exit upward/left. Reduced motion preserves opacity and spinners.

### Layout Philosophy
Persistent sidebar + slim top toolbar. Sidebar context-switches for admin (nav items swap). Mobile: hamburger → sheet. No breadcrumbs except catalog item detail (3 levels deep).

---

## Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse on dashboard page |
| TBT (Total Blocking Time) | < 200ms | Lighthouse on dashboard page |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse on all pages |
| Bundle size delta | < +15% over current | `npm run build` output comparison |
| Page transition duration | < 400ms perceived | Manual verification |

Measure baseline before Phase 1 begins. Re-measure after Phase 6 and Phase 10.

---

## Success Metrics

- Zero TypeScript errors (`npx tsc -b`)
- All tests pass — frontend (`npm test`) and backend (`dotnet test`)
- 90% line coverage on both frontend and backend
- WCAG AA contrast on all text/UI elements
- No hardcoded color values in any component
- Dark mode verified on every page
- Reduced motion verified (no transforms when `prefers-reduced-motion: reduce`)
- Every UI string in both `en.json` and `pt.json`
- All admin endpoints require `Admin` role — verified by integration tests
- Audit log captures CRUD + auth events — verified by integration tests
- Performance budget met (LCP < 2.5s, TBT < 200ms, CLS < 0.1)

---

## User Stories

Stories are ordered by dependency. Each phase must be completed before the next begins. Stories within a phase can be parallelized.

**Total: 41 stories across 10 phases**

---

### Phase 1: Foundation — Design Tokens & CSS (3 stories)

#### US-IMPL-001: Install Plus Jakarta Sans and update font tokens
**Spec:** `tasks/design-tokens.md` → Typography section

**Acceptance Criteria:**
- [ ] Install `@fontsource/plus-jakarta-sans` (weights 400, 500, 600, 700)
- [ ] Update `src/web/src/index.css`: replace `@fontsource/nunito` import with `@fontsource/plus-jakarta-sans`
- [ ] Update `--font-display` from `"Nunito"` to `"Plus Jakarta Sans"`
- [ ] Verify `--font-body` remains `"Inter"`
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser that headings use Plus Jakarta Sans

#### US-IMPL-002: Implement new color palette tokens (light + dark)
**Spec:** `tasks/design-tokens.md` → Color Palette section

**Acceptance Criteria:**
- [ ] Replace all color values in `:root` (light mode) with Warm Obsidian light palette
- [ ] Replace all color values in `.dark` with Warm Obsidian dark palette
- [ ] Add new tokens: `--warning`, `--warning-foreground`, `--info`, `--info-foreground`
- [ ] Update sidebar tokens (`--sidebar-*`) for both modes
- [ ] Add chart tokens (`--chart-1` through `--chart-8`) for both modes
- [ ] Update focus ring color to amber (`--ring`)
- [ ] Update text selection (`::selection` styles)
- [ ] Typecheck passes
- [ ] Verify in browser: light mode, dark mode, sidebar colors
- [ ] Update i18n keys in both `en.json` and `pt.json` if any UI strings change

#### US-IMPL-003: Implement spacing, border-radius, and elevation tokens
**Spec:** `tasks/design-tokens.md` → Spacing, Border Radius, Elevation sections

**Acceptance Criteria:**
- [ ] Add spacing tokens to `@theme inline`: `--space-0.5` (2px), `--space-1.5` (6px), `--space-16` (64px), `--space-20` (80px), `--space-24` (96px)
- [ ] Update border-radius: `--radius-md` → 8px, `--radius-lg` → 12px; add `--radius-2xl` (24px)
- [ ] Add shadow tokens to `:root` and `.dark`: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` with warm-tinted light and high-opacity dark values
- [ ] Reference shadow tokens in `@theme inline` for Tailwind integration
- [ ] Typecheck passes
- [ ] Verify in browser: shadows visible in both modes, radius changes applied

---

### Phase 2: Motion System (1 story)

#### US-IMPL-004: Implement motion tokens and update motion.tsx
**Spec:** `tasks/design-motion.md` → Duration Tokens, Easing Curves, Spring Configs

**Acceptance Criteria:**
- [ ] Add CSS custom properties to `:root`: `--duration-instant` (50ms), `--duration-fast` (150ms), `--duration-normal` (250ms), `--duration-slow` (400ms), `--duration-deliberate` (600ms), `--ease-standard`, `--ease-enter`, `--ease-exit`, `--ease-emphasized`
- [ ] Update `src/web/src/components/ds/motion.tsx`: export `springs` (default, gentle, bouncy, stiff), `durations`, `easings` objects
- [ ] Update existing variants (PageTransition, FadeIn, StaggerChildren, ScaleIn) to use new tokens
- [ ] Add `getVariants()` factory returning noop variants when `prefers-reduced-motion` is set
- [ ] Replace Tailwind `animate-pulse` with custom `@keyframes skeleton-pulse` respecting reduced motion
- [ ] Add `@media (prefers-reduced-motion: reduce)` block in `index.css`
- [ ] Typecheck passes
- [ ] Verify in browser: transitions work, reduced motion disables transforms

---

### Phase 3: App Shell & Navigation (4 stories)

#### US-IMPL-005: Redesign sidebar component
**Spec:** `tasks/design-layout.md` → App Shell & Navigation

**Acceptance Criteria:**
- [ ] Update `sidebar.tsx`: dark background, nav groups (Overview, Collections, Account, Admin conditional), 260px/72px widths
- [ ] Nav item states: default, hover (`bg-sidebar-accent/50`), active (amber left border + icon), focus-visible ring
- [ ] Collapse/expand: motion tokens (250ms), text fade timing, edge toggle with group-hover
- [ ] Min-height 44px on nav items (WCAG touch target)
- [ ] Navigation: Dashboard, Collections, Collection Types, Wishlist, Profile, Admin (conditional on `user.role === "admin"`)
- [ ] Tooltip on collapsed items (side="right", delayDuration=0)
- [ ] Typecheck passes; update tests; update i18n keys
- [ ] Verify in browser: expanded, collapsed, transition states

#### US-IMPL-006: Redesign top toolbar and mobile header
**Spec:** `tasks/design-layout.md` → Top Toolbar, Mobile Header

**Acceptance Criteria:**
- [ ] Update `top-toolbar.tsx`: 72px height, search trigger (opens command palette), action buttons (help, notifications, language, theme, user avatar)
- [ ] Update `header.tsx` (mobile): 56px, hamburger, brand icon + "GeekVault", language/theme toggles
- [ ] Search trigger styled as fake input with ⌘K hint
- [ ] Theme toggle icon transition (Sun/Moon rotation)
- [ ] All toolbar buttons: ghost variant, 36×36px, wrapped in Tooltip
- [ ] Typecheck passes; update tests; update i18n keys
- [ ] Verify at desktop, tablet, and mobile breakpoints

#### US-IMPL-007: Redesign user menu dropdown
**Spec:** `tasks/design-layout.md` → User Menu

**Acceptance Criteria:**
- [ ] Update `user-menu.tsx`: w-56, bg-popover, `--shadow-lg`, `--radius-lg`
- [ ] Items: profile, theme cycle, language toggle, logout; min-h-36px, hover `bg-accent/10`
- [ ] Menu stays open after theme/language toggle
- [ ] Logout: close menu, navigate with `replace=true`
- [ ] Placement: `side="top"` from sidebar, `side="bottom"` from toolbar
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-008: Update app layout and animated outlet
**Spec:** `tasks/design-layout.md` → Responsive Breakpoints, Animated Page Transitions

**Acceptance Criteria:**
- [ ] Update `app-layout.tsx`: responsive padding (px-4/py-4 mobile, px-4/py-6 tablet, px-6/py-6 desktop)
- [ ] Update `animated-outlet.tsx`: enter y 12→0, 250ms springGentle; exit y 0→-8, 150ms ease-exit
- [ ] Z-index layers: sidebar z-0, dropdowns z-50, sheet z-50, command palette z-50, toasts z-[100]
- [ ] Typecheck passes; update tests
- [ ] Verify: transitions smooth, layout correct at all breakpoints

---

### Phase 4: Command Palette (1 story)

#### US-IMPL-009: Redesign command palette
**Spec:** `tasks/design-layout.md` → Command Palette

**Acceptance Criteria:**
- [ ] Update `command-palette.tsx`: backdrop blur(8px), 25% from top, `--radius-xl`, `--shadow-xl`, 560px width
- [ ] Search input: 52px, Search icon, placeholder "Search pages, collections, actions..."
- [ ] Result groups: Navigation (static), Collections (dynamic), Recent Items (sessionStorage), Actions, Settings
- [ ] Items: 44px min-height, icon + label + description + keyboard hint
- [ ] Selected: `bg-accent/10`, `text-accent`
- [ ] Footer keyboard hints (hidden on mobile)
- [ ] Enter: scale 0.95→1, y -8→0, 250ms springGentle; Exit: scale 1→0.97, 150ms ease-exit
- [ ] Reduced motion: opacity only at 50ms
- [ ] Typecheck passes; update tests; update i18n keys

---

### Phase 5: Core Page Redesigns (13 stories)

#### US-IMPL-010: Redesign dashboard — greeting and stats row
**Spec:** `tasks/design-pages.md` → Dashboard (Greeting, Stats Row)

**Acceptance Criteria:**
- [ ] Time-aware greeting with user name and collection stats subtitle
- [ ] 5 stat cards (Collections, Items, Owned Copies, Total Value, Total Invested) with 40×40px icons, animated numbers, hover lift (-2px)
- [ ] Grid: 5-col desktop → 3-col tablet → 2-col mobile (no orphans)
- [ ] StaggerChildren entrance (60ms stagger)
- [ ] Typecheck passes; update tests; update i18n keys
- [ ] Verify at all breakpoints

#### US-IMPL-011: Redesign dashboard — charts section
**Spec:** `tasks/design-pages.md` → Dashboard (Charts)

**Acceptance Criteria:**
- [ ] Donut pie chart (Items by Condition) + bar chart (Condition Breakdown)
- [ ] All fills use `hsl(var(--chart-N))` — no hardcoded hex
- [ ] Custom tooltip: `--card` bg, `--border`, `--radius-md`, `--shadow-md`
- [ ] 2-col desktop, stacked mobile; card containers with `--radius-lg`, `--shadow-sm`
- [ ] Typecheck passes; update tests
- [ ] Verify charts visible and legible in both light and dark modes

#### US-IMPL-012: Redesign dashboard — collection summaries and recent acquisitions
**Spec:** `tasks/design-pages.md` → Dashboard (Collection Summaries, Recent Acquisitions)

**Acceptance Criteria:**
- [ ] Collection summary cards: 3-col grid (max 6), cover image with gradient fallback (`index % 4`), hover lift, "View all" link
- [ ] Cards: `tabIndex={0}`, `role="link"`, `onKeyDown` for keyboard access
- [ ] Recent acquisitions: DataTable with condition badges, max 8 rows, responsive column hiding
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-013: Redesign dashboard — empty state and loading skeleton
**Spec:** `tasks/design-pages.md` → Dashboard (Empty State, Loading State)

**Acceptance Criteria:**
- [ ] Empty state: Sparkles icon, message, CTA to create first collection
- [ ] StaggerChildren reveal on empty state
- [ ] Loading skeleton matching content structure (greeting, stats, charts, summaries)
- [ ] Skeleton pulse uses custom keyframe (not Tailwind `animate-pulse`)
- [ ] All sub-sections show EmptyState instead of returning `null`
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-014: Redesign collections list — grid view and toolbar
**Spec:** `tasks/design-pages.md` → Collections List

**Acceptance Criteria:**
- [ ] Toolbar: search, type filter, sort, view toggle (grid/list), create button
- [ ] Grid cards: 4:3 aspect ratio, cover image full-bleed, gradient metadata overlay, type badge, hover (-4px lift, shadow-lg, amber border, image zoom)
- [ ] Action buttons: frosted glass, `sm:opacity-0 sm:group-hover:opacity-100`
- [ ] Gradient fallback: `index % 4` rotation
- [ ] Cards: `--radius-xl` (16px); grid: 3-col desktop, 2-col tablet, 1-col mobile
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-015: Redesign collections list — list view, dialogs, states
**Spec:** `tasks/design-pages.md` → Collections List (List View, Dialogs, Empty State, Drag)

**Acceptance Criteria:**
- [ ] List view: DataTable with 40×40px thumbnail, type, items count, last updated
- [ ] Create/edit dialog: name, description, type select, cover image dropzone with preview
- [ ] Delete confirmation with destructive button
- [ ] Empty state, no-results state, loading skeleton
- [ ] Drag-to-reorder only when sort = "custom"
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-016: Redesign collection detail — header and tabs
**Spec:** `tasks/design-pages.md` → Collection Detail (Header, Tabs)

**Acceptance Criteria:**
- [ ] Back navigation (ghost button), cover banner (240px desktop, 192px tablet, 160px mobile) with gradient overlay
- [ ] Metadata overlay: name, description, stats (items, value, completion %)
- [ ] Gradient fallback: `collection.id % 4`
- [ ] Frosted glass action buttons; mobile: buttons below banner
- [ ] Tabs: All Items, Sets, Stats — amber underline indicator, fade + y shift on switch
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-017: Redesign collection detail — items tab
**Spec:** `tasks/design-pages.md` → Collection Detail (Items Tab)

**Acceptance Criteria:**
- [ ] Search/filter toolbar (search, condition, sort), grid/list toggle, add item + import/export buttons
- [ ] Item grid: image, name, attributes, condition badge, `--radius-lg`
- [ ] Item list: DataTable with thumbnail, name, condition, rarity, actions
- [ ] Add item dialog: identifier, name, description, release date, manufacturer, reference code, rarity, image, custom fields
- [ ] Empty state, drag-to-reorder when sort = "custom"
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-018: Redesign collection detail — sets tab and stats tab
**Spec:** `tasks/design-pages.md` → Collection Detail (Sets Tab, Stats Tab)

**Acceptance Criteria:**
- [ ] Sets tab: accordion cards with completion progress, item checklist, add-to-wishlist on missing
- [ ] Completion colors: <50% muted, 50-99% accent, 100% success
- [ ] Accordion: Framer Motion height animation
- [ ] Stats tab: StatCards + charts (condition, rarity) using `hsl(var(--chart-N))`
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-019: Redesign catalog item detail — hero and metadata
**Spec:** `tasks/design-pages.md` → Catalog Item Detail

**Acceptance Criteria:**
- [ ] Breadcrumb trail: Collections > Collection > Item (only page with breadcrumbs)
- [ ] Hero: 5-col grid — 2/5 image (warm fallback) + 3/5 identity panel
- [ ] Identity: name (h1), identifier, action buttons (edit, delete, add copy)
- [ ] Metadata grid: manufacturer, release date, reference, rarity (3-col desktop, 1-col mobile)
- [ ] Custom fields card, set membership indicators
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-020: Redesign catalog item detail — owned copies section
**Spec:** `tasks/design-pages.md` → Catalog Item Detail (Owned Copies), Owned Copies section

**Acceptance Criteria:**
- [ ] Copy cards: condition badge (3-tier: Mint/NearMint→success, Excellent/Good→primary, Fair/Poor→warning), financial values with `tabular-nums`, image thumbnails (max 4 + overflow)
- [ ] Action buttons: `sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100`
- [ ] Add/edit dialog: condition with color indicators, date picker, currency-prefixed price, notes, multi-image upload with @dnd-kit reorder
- [ ] Delete confirmation with image count warning
- [ ] Empty state
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-021: Create image gallery lightbox component
**Spec:** `tasks/design-pages.md` → Owned Copies (Image Gallery Lightbox)

**Acceptance Criteria:**
- [ ] Create `src/web/src/components/ds/image-gallery-lightbox.tsx` using `createPortal`
- [ ] Navigation arrows (hidden on mobile), close button, image counter, dot indicators
- [ ] Keyboard: left/right arrows, Escape to close; focus trap
- [ ] Direction-aware slide transitions; backdrop black/90 + blur
- [ ] Reduced motion: instant swap
- [ ] Export from `components/ds/index.ts`; create co-located test
- [ ] Typecheck passes; update i18n keys

#### US-IMPL-022: Create set progress ring component
**Spec:** `tasks/design-pages.md` → Sets (Completion Visualization)

**Acceptance Criteria:**
- [ ] Create `src/web/src/components/ds/set-progress-ring.tsx`: SVG circular progress
- [ ] Sizes: 36×36px (card), 64×64px (hero)
- [ ] `stroke-dasharray` fill calculation, rotate -90deg for 12 o'clock start
- [ ] Color tiers: <50% muted, 50-99% accent, 100% success with `drop-shadow` glow
- [ ] 100% completion: scale pulse via Framer Motion spring
- [ ] Reduced motion: instant fill
- [ ] Export from `components/ds/index.ts`; create co-located test
- [ ] Typecheck passes

---

### Phase 6: Secondary Page Redesigns (5 stories)

#### US-IMPL-023: Redesign sets page
**Spec:** `tasks/design-pages.md` → Sets

**Acceptance Criteria:**
- [ ] Set cards use SetProgressRing; collapsed: chevron, name, fraction, ring, action buttons
- [ ] Expanded: item checklist — owned (solid border, green left stripe) vs missing (dashed, `bg-card/50`)
- [ ] Missing items: "Add to Wishlist" with optimistic UI
- [ ] Chevron rotation: Framer Motion rotate (-90° → 0°)
- [ ] Set detail page (if route exists): hero header, filter tabs, item grid
- [ ] Empty states: no sets, no items, all-owned celebration
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-024: Redesign wishlist page
**Spec:** `tasks/design-pages.md` → Wishlist

**Acceptance Criteria:**
- [ ] Page header with add button; filter/sort toolbar (priority, sort, date range, count)
- [ ] Collection groups: collapsible with chevron animation, item count badge
- [ ] Wishlist cards: drag handle, name, priority badge (High→destructive, Medium→accent, Low→muted), target price, notes (2-line clamp), catalog link, actions
- [ ] Cards: `hover:shadow-md` (no lift — data cards)
- [ ] Create/edit dialog; drag-to-reorder within groups
- [ ] Empty state (Heart icon), no-results state
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-025: Redesign collection types page
**Spec:** `tasks/design-pages.md` → Collection Types

**Acceptance Criteria:**
- [ ] Card grid: icon hero (40×40px), name, description, custom field type badges (color-coded), usage count
- [ ] Cards: no lift (management cards), border + shadow shift on hover
- [ ] Two-tab dialog: General (icon picker from 25 Lucide icons) + Custom Fields (draggable rows, type select, enum tag editor)
- [ ] Delete confirmation with usage warning; max 10 fields
- [ ] Responsive: 4→3→2→1 columns
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-026: Redesign profile page
**Spec:** `tasks/design-pages.md` → Profile

**Acceptance Criteria:**
- [ ] Card-per-section: 2-col desktop (1/3 avatar, 2/3 forms), 1-col mobile
- [ ] Avatar card: 96×96px with hover upload overlay
- [ ] Account Info: editable display name, read-only email with lock icon
- [ ] About: bio textarea; Preferences: language + currency selects
- [ ] Appearance: 3 visual theme toggles (Light/Dark/System) — applies immediately
- [ ] Save: right-aligned desktop, sticky bottom mobile; loading skeleton
- [ ] Typecheck passes; update tests; update i18n keys

#### US-IMPL-027: Redesign auth pages (login + register)
**Spec:** `tasks/design-pages.md` → Auth Pages

**Acceptance Criteria:**
- [ ] Split-screen: 55% decorative + 45% form
- [ ] Decorative: `bg-stone-900`, amber radial gradients, floating blurred circles (CSS `@keyframes float`, 20s)
- [ ] Decorative hidden below `lg:` — compact brand header on mobile
- [ ] Login: "Welcome back", email + password, submit with loading, error banner, register link
- [ ] Register: "Create your vault", display name + email + password, submit with loading, error banner, login link
- [ ] No hardcoded gradient colors — use CSS variables / stone scale
- [ ] Typecheck passes; update tests; update i18n keys

---

### Phase 7: Admin Backend — Foundation (3 stories)

#### US-IMPL-028: Add role-based identity system
**Spec:** `tasks/design-admin.md` → Admin route guard requirements

**Description:** As a platform owner, I need role-based access control so that admin features are restricted to authorized users.

**Acceptance Criteria:**
- [ ] Change `ApplicationDbContext` from `IdentityUserContext<User>` to `IdentityDbContext<User, IdentityRole, string>`
- [ ] Create EF Core migration to add role tables (`AspNetRoles`, `AspNetUserRoles`, `AspNetRoleClaims`)
- [ ] Update `ServiceCollectionExtensions`: change `AddIdentityCore<User>()` to `AddIdentityCore<User>().AddRoles<IdentityRole>().AddEntityFrameworkStores<ApplicationDbContext>()`
- [ ] Add authorization policy: `builder.Services.AddAuthorizationBuilder().AddPolicy("AdminOnly", p => p.RequireRole("Admin"))`
- [ ] Update `AuthService` JWT generation: add `ClaimTypes.Role` claim from user's roles
- [ ] Seed `Admin` and `User` roles on startup via backend data seeding (seed migration or `DbContext` seed logic that promotes a configured user to Admin)
- [ ] Add `GET /api/auth/me` enhancement: include `role` in the response DTO
- [ ] Integration tests: verify admin role assignment, JWT includes role claim, admin policy rejects non-admin users
- [ ] `dotnet build` and `dotnet test` pass

#### US-IMPL-029: Create audit log infrastructure
**Spec:** `tasks/design-admin.md` → Audit Log

**Description:** As an admin, I need an audit trail of all system activity so I can monitor usage and investigate issues.

**Acceptance Criteria:**
- [ ] Create `Entities/Admin/AuditLog.cs`: Id (int), Timestamp (DateTime), UserId (string, FK), Action (string — "Create", "Update", "Delete", "Login", "Logout", "Export", "Import", "SettingsChange"), TargetType (string — "Collection", "CatalogItem", "OwnedCopy", "Set", "WishlistItem", "User", "SystemSetting"), TargetId (string, nullable), Details (string, JSON — stores changes/metadata), IpAddress (string, nullable)
- [ ] Add `DbSet<AuditLog>` to `ApplicationDbContext`; create migration
- [ ] Create `IAuditLogRepository` + `AuditLogRepository` with methods: `LogAsync(AuditLog entry)`, `GetPagedAsync(filter, page, pageSize)`, `GetAllFilteredAsync(filter)` (for CSV export)
- [ ] Create `IAuditLogService` + `AuditLogService` with `LogActionAsync(userId, action, targetType, targetId, details, ipAddress)`
- [ ] Register in DI (`ServiceCollectionExtensions`)
- [ ] Wire audit logging into existing services: Collections (create/update/delete), CatalogItems (CRUD), OwnedCopies (CRUD), Sets (CRUD), WishlistItems (CRUD)
- [ ] Wire into AuthService: Login (success/failure), Register
- [ ] Integration tests for audit log creation on CRUD operations
- [ ] `dotnet build` and `dotnet test` pass

#### US-IMPL-030: Create system settings infrastructure
**Spec:** `tasks/design-admin.md` → System Settings

**Description:** As an admin, I need configurable system settings so I can customize the platform behavior without code changes.

**Acceptance Criteria:**
- [ ] Create `Entities/Admin/SystemSetting.cs`: Id (int), Key (string, unique), Value (string), Category (string — "General", "Security", "Features", "Storage"), UpdatedAt (DateTime), UpdatedById (string, FK)
- [ ] Add `DbSet<SystemSetting>` to `ApplicationDbContext`; create migration
- [ ] Create `ISystemSettingsRepository` + `SystemSettingsRepository`: `GetByCategoryAsync(category)`, `GetByKeyAsync(key)`, `UpsertAsync(key, value, category, userId)`, `GetAllAsync()`
- [ ] Create `ISystemSettingsService` + `SystemSettingsService`: `GetSettingsByCategory(category)`, `UpdateSettings(category, settings, userId)`
- [ ] Seed default settings on startup: General (appName: "GeekVault", language: "en", currency: "USD"), Security (minPasswordLength: 8, requireUppercase: true, requireNumber: true, requireSpecial: false, sessionTimeoutMinutes: 60, registrationEnabled: true), Features (wishlistEnabled: true, importExportEnabled: true, imageUploadsEnabled: true, publicProfilesEnabled: false, valueTrackingEnabled: true), Storage (maxUploadSizeMb: 5, allowedFileTypes: "jpeg,png,webp,gif")
- [ ] Register in DI
- [ ] Integration tests for settings CRUD
- [ ] `dotnet build` and `dotnet test` pass

---

### Phase 8: Admin Backend — API Endpoints (4 stories)

#### US-IMPL-031: Implement admin user management API
**Spec:** `tasks/design-admin.md` → User Management

**Description:** As an admin, I need API endpoints to manage platform users so I can change roles, disable accounts, and view user activity.

**Acceptance Criteria:**
- [ ] Create `Controllers/Admin/AdminUsersController.cs` (minimal API style, `MapAdminUsersEndpoints()`)
- [ ] All endpoints require `.RequireAuthorization("AdminOnly")`
- [ ] `GET /api/admin/users` — paginated, searchable (name/email), filterable (role, status), sortable (name, email, lastActive)
- [ ] `GET /api/admin/users/{id}` — user detail with collection stats (count, total items, total value)
- [ ] `PUT /api/admin/users/{id}/role` — change role (Admin/User); prevent removing last admin
- [ ] `PUT /api/admin/users/{id}/status` — enable/disable user (add `IsDisabled` bool to User entity + migration)
- [ ] `DELETE /api/admin/users/{id}` — soft-delete (`IsDeleted` flag + `DeletedAt` timestamp on User entity); prevent self-deletion; soft-deleted users excluded from all queries by default
- [ ] Create DTOs: `AdminUserListResponse`, `AdminUserDetailResponse`, `ChangeRoleRequest`, `ChangeStatusRequest`
- [ ] Create `IAdminUsersRepository` + `AdminUsersRepository`, `IAdminUsersService` + `AdminUsersService`
- [ ] All actions logged via `AuditLogService`
- [ ] Integration tests for all endpoints (happy path + authorization + edge cases)
- [ ] `dotnet build` and `dotnet test` pass

#### US-IMPL-032: Implement admin system settings API
**Spec:** `tasks/design-admin.md` → System Settings

**Description:** As an admin, I need API endpoints to read and update system settings.

**Acceptance Criteria:**
- [ ] Create `Controllers/Admin/AdminSettingsController.cs`
- [ ] All endpoints require `.RequireAuthorization("AdminOnly")`
- [ ] `GET /api/admin/settings` — returns all settings grouped by category
- [ ] `GET /api/admin/settings/{category}` — returns settings for one category
- [ ] `PUT /api/admin/settings/{category}` — update settings for a category (validates known keys, rejects unknown)
- [ ] Create DTOs: `SettingsCategoryResponse`, `UpdateSettingsRequest`
- [ ] Settings changes logged via `AuditLogService` with before/after values in details
- [ ] Integration tests for CRUD + authorization
- [ ] `dotnet build` and `dotnet test` pass

#### US-IMPL-033: Implement admin analytics API
**Spec:** `tasks/design-admin.md` → Analytics Dashboard

**Description:** As an admin, I need analytics endpoints to view platform usage statistics and growth trends.

**Acceptance Criteria:**
- [ ] Create `Controllers/Admin/AdminAnalyticsController.cs`
- [ ] All endpoints require `.RequireAuthorization("AdminOnly")`
- [ ] `GET /api/admin/analytics/stats?range=30d` — Total Users, Active Users (within range), Total Collections, Total Items
- [ ] `GET /api/admin/analytics/growth?range=30d` — daily user signups and collections created (for chart data), grouped by day
- [ ] `GET /api/admin/analytics/usage?range=30d` — most active users (top 5 by item count), largest collections (top 5), popular collection types (with counts)
- [ ] Range parameter: `7d`, `30d`, `90d`, `all` (default `30d`)
- [ ] Create DTOs: `PlatformStatsResponse`, `GrowthDataResponse`, `UsageBreakdownResponse`
- [ ] Create `IAdminAnalyticsRepository` + `AdminAnalyticsRepository`, `IAdminAnalyticsService` + `AdminAnalyticsService`
- [ ] Integration tests for all endpoints with range filtering
- [ ] `dotnet build` and `dotnet test` pass

#### US-IMPL-034: Implement admin audit log API
**Spec:** `tasks/design-admin.md` → Audit Log

**Description:** As an admin, I need to query and export the audit log for compliance and troubleshooting.

**Acceptance Criteria:**
- [ ] Create `Controllers/Admin/AdminAuditLogController.cs`
- [ ] All endpoints require `.RequireAuthorization("AdminOnly")`
- [ ] `GET /api/admin/audit-log` — paginated, filterable: search (free text on action/target), action type, userId, fromDate, toDate; sortable by timestamp (desc default)
- [ ] `GET /api/admin/audit-log/{id}` — single entry detail with full metadata
- [ ] `GET /api/admin/audit-log/export?format=csv` — returns CSV of all filtered entries (same filter params as list), filename `geekvault-audit-log-{yyyy-MM-dd}.csv`
- [ ] Create DTOs: `AuditLogEntryResponse`, `AuditLogListResponse`, `AuditLogFilterRequest`
- [ ] Integration tests for pagination, filtering, and CSV export
- [ ] `dotnet build` and `dotnet test` pass

---

### Phase 9: Admin Frontend (5 stories)

#### US-IMPL-035: Implement admin layout and sidebar context switch
**Spec:** `tasks/design-admin.md` → Admin Layout & Navigation

**Acceptance Criteria:**
- [ ] Update sidebar: define `adminNavGroups`, switch based on `location.pathname.startsWith("/admin")`
- [ ] Admin nav: Back to GeekVault (header link), Management (Users, Settings), Insights (Analytics, Audit Log)
- [ ] AnimatePresence fast fade (100ms) on nav group swap
- [ ] Visual: sidebar "ADMIN" badge (Shield icon), toolbar admin pill badge (amber)
- [ ] Mobile header: "Admin" text when on admin routes
- [ ] Route guard: check `user.role === "admin"`, silent redirect to `/`
- [ ] `/admin` redirects to `/admin/users`
- [ ] Create `src/web/src/features/admin/` directory; add routes to `App.tsx`
- [ ] Typecheck passes; update i18n keys
- [ ] Verify: admin nav, back link, context switch, mobile header

#### US-IMPL-036: Implement admin user management page
**Spec:** `tasks/design-admin.md` → User Management

**Acceptance Criteria:**
- [ ] Create `src/web/src/features/admin/users-page.tsx`
- [ ] DataTable: avatar+name+email, role badge (Admin→accent, User→secondary), status dot (Active→success, Disabled→muted), last active, actions dropdown
- [ ] 56px row height, hover overlay, click opens user detail Sheet (`sm:max-w-md`)
- [ ] Search + filter bar (debounced search, role, status); result count
- [ ] User detail Sheet: profile info, collection stats, action buttons
- [ ] Confirmation dialogs: role change, enable/disable, delete (typed name required)
- [ ] Pagination: summary + page controls + page size
- [ ] Empty/no-results states; responsive column hiding
- [ ] Create co-located test; typecheck passes; update i18n keys

#### US-IMPL-037: Implement admin system settings page
**Spec:** `tasks/design-admin.md` → System Settings

**Acceptance Criteria:**
- [ ] Create `src/web/src/features/admin/settings-page.tsx`
- [ ] Card-per-section (General, Security, Features, Storage), max-w-3xl centered
- [ ] Independent save per section with unsaved amber dot
- [ ] General: app name, description, language, currency
- [ ] Security: password length, uppercase/number/special toggles, session timeout, registration toggle
- [ ] Features: 5 toggle flags with descriptions
- [ ] Storage: max upload size, file type checkboxes
- [ ] `beforeunload` for unsaved changes; toasts; inline validation; loading skeletons
- [ ] Create co-located test; typecheck passes; update i18n keys

#### US-IMPL-038: Implement admin analytics dashboard page
**Spec:** `tasks/design-admin.md` → Analytics Dashboard

**Acceptance Criteria:**
- [ ] Create `src/web/src/features/admin/analytics-page.tsx`
- [ ] Time range segmented control (7d, 30d, 90d, All) in URL params, default 30d
- [ ] 4 StatCards (Total Users, Active Users, Total Collections, Total Items)
- [ ] Growth charts (2-col): user signups line (--chart-1), collections bar (--chart-2)
- [ ] Usage (3-col): most active users table, largest collections table, collection types horizontal bar
- [ ] `hsl(var(--chart-N))` for all charts; custom tooltip
- [ ] Loading skeletons; individual empty states; responsive grid collapse
- [ ] Create co-located test; typecheck passes; update i18n keys

#### US-IMPL-039: Implement admin audit log page
**Spec:** `tasks/design-admin.md` → Audit Log

**Acceptance Criteria:**
- [ ] Create `src/web/src/features/admin/audit-log-page.tsx`
- [ ] Filter bar: search, action type select, user combobox, date range, CSV export button
- [ ] DataTable: timestamp, user (avatar+name), action badge (Create→success, Update→info, Delete→destructive, Login/Logout→muted, Export/Import→accent, Settings→warning), target, details
- [ ] Row click: inline accordion expansion (AnimatePresence, 200ms)
- [ ] Detail panel: event metadata, changes mini-table (field, before w/ line-through, after w/ font-medium)
- [ ] Server-side pagination; CSV export (`geekvault-audit-log-{YYYY-MM-DD}.csv`)
- [ ] Responsive column hiding; stacking filters; empty/no-results states
- [ ] Create co-located test; typecheck passes; update i18n keys

---

### Phase 10: Polish & Review (2 stories)

#### US-IMPL-040: Global accessibility and dark mode audit
**Spec:** `tasks/design-audit.md` → Accessibility Gaps, Dark Mode Assessment

**Acceptance Criteria:**
- [ ] Replace all `:focus` with `:focus-visible` in CSS and component classes
- [ ] Add `aria-label` to all icon-only buttons across all pages
- [ ] Add `tabIndex={0}`, `role`, `onKeyDown` to all clickable divs
- [ ] Verify WCAG AA contrast on all text/accent combos in both modes
- [ ] Verify no hardcoded colors remain (grep for hex, `rgb()`, `hsl()` without `var()`)
- [ ] Verify dark mode on every page — no invisible elements, proper shadows, chart legibility
- [ ] Test `prefers-reduced-motion: reduce` — no transforms, spinners work
- [ ] Measure performance budget (LCP, TBT, CLS) — compare to baseline
- [ ] Typecheck passes; all tests pass

#### US-IMPL-041: Final cross-page consistency review
**Spec:** All design documents

**Acceptance Criteria:**
- [ ] Section spacing consistent: `--space-8` desktop, `--space-6` mobile
- [ ] Empty states use EmptyState component (no pages returning null)
- [ ] Card radius: `--radius-xl` for collection gallery, `--radius-lg` for others
- [ ] Hover patterns: lift on navigable cards, shadow-only on data cards
- [ ] Skeleton loading uses custom pulse keyframe
- [ ] All chart fills use `hsl(var(--chart-N))`
- [ ] All UI strings in both `en.json` and `pt.json`
- [ ] Run `npm test` — all pass
- [ ] Run `npm run test:coverage` — 90% line coverage
- [ ] Run `npx tsc -b` — zero errors
- [ ] Run `dotnet test` — all pass
- [ ] Run `dotnet build` — success
- [ ] Performance budget met (LCP < 2.5s, TBT < 200ms, CLS < 0.1)
- [ ] Navigate every page in light mode, dark mode, and mobile viewport

---

## Resolved Decisions

1. **Portuguese translations** — Machine-translated during implementation; human review deferred to post-implementation
2. **Admin seeding** — Admin role assigned via backend seeding (seed migration or startup logic)
3. **User deletion** — Always soft-delete (`IsDeleted` flag + `DeletedAt` timestamp); soft-deleted users excluded from queries by default

## Open Questions

1. **Audit log retention** — No retention policy for now. Revisit if table size becomes a concern post-launch

---

## Phase Summary

| Phase | Stories | Scope | Type |
|-------|---------|-------|------|
| 1. Foundation | 3 | Font, colors, spacing/radius/shadow tokens | Frontend |
| 2. Motion | 1 | Duration/easing/spring tokens, reduced motion | Frontend |
| 3. App Shell | 4 | Sidebar, toolbar, user menu, layout | Frontend |
| 4. Command Palette | 1 | Visual redesign | Frontend |
| 5. Core Pages | 13 | Dashboard, Collections, Collection Detail, Catalog Item, Lightbox, Progress Ring | Frontend |
| 6. Secondary Pages | 5 | Sets, Wishlist, Collection Types, Profile, Auth | Frontend |
| 7. Admin Backend Foundation | 3 | Roles, audit log, system settings (entities + infra) | Backend |
| 8. Admin Backend APIs | 4 | Users, settings, analytics, audit log endpoints | Backend |
| 9. Admin Frontend | 5 | Admin layout, users, settings, analytics, audit log pages | Frontend |
| 10. Polish | 2 | Accessibility audit, cross-page consistency, performance | Both |
| **Total** | **41** | | |

---

## Dependency Graph

```
Phase 1 (tokens) → Phase 2 (motion) → Phase 3 (shell) → Phase 4 (palette)
                                                       → Phase 5 (core pages) → Phase 6 (secondary)
Phase 7 (admin backend foundation) → Phase 8 (admin APIs) → Phase 9 (admin frontend)
Phase 6 + Phase 9 → Phase 10 (polish)
```

**Note:** Phases 7-8 (backend) can run in parallel with Phases 5-6 (frontend) since they have no dependencies on each other. This enables two-track parallel development.
