# GeekVault Frontend Design Audit

## Current Design System

### Color Palette

#### Light Mode (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | #FAFAF8 (off-white) | Page background |
| `--foreground` | #1B3A6B (deep navy) | Primary text |
| `--card` | #FFFFFF | Card surfaces |
| `--card-foreground` | #1B3A6B | Card text |
| `--popover` | #FFFFFF | Popover surfaces |
| `--popover-foreground` | #1B3A6B | Popover text |
| `--primary` | #1B3A6B (deep navy) | Primary actions, buttons |
| `--primary-foreground` | #FFFFFF | Text on primary |
| `--secondary` | #F0F1F4 (light gray) | Secondary surfaces |
| `--secondary-foreground` | #1B3A6B | Secondary text |
| `--accent` | #E8A838 (gold) | Accent/highlight |
| `--accent-foreground` | #1B3A6B | Text on accent |
| `--destructive` | #DC2626 (red) | Destructive actions |
| `--destructive-foreground` | #FFFFFF | Text on destructive |
| `--success` | #16A34A (green) | Success states |
| `--success-foreground` | #FFFFFF | Text on success |
| `--muted` | #E8EBF0 | Muted backgrounds |
| `--muted-foreground` | #5A6A85 | Secondary/muted text |
| `--border` | #D4D9E2 | Borders |
| `--input` | #D4D9E2 | Input borders |
| `--ring` | #E8A838 (gold) | Focus ring |

#### Dark Mode (`.dark`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | #0D1B2A (very dark navy) | Page background |
| `--foreground` | #E8EBF0 | Primary text |
| `--card` | #142237 (dark navy-blue) | Card surfaces |
| `--card-foreground` | #E8EBF0 | Card text |
| `--popover` | #142237 | Popover surfaces |
| `--popover-foreground` | #E8EBF0 | Popover text |
| `--primary` | #3B6CB5 (lighter blue) | Primary actions |
| `--primary-foreground` | #FFFFFF | Text on primary |
| `--secondary` | #1E3250 (darker blue) | Secondary surfaces |
| `--secondary-foreground` | #E8EBF0 | Secondary text |
| `--accent` | #E8A838 (gold) | Accent (same as light) |
| `--accent-foreground` | #0D1B2A | Text on accent |
| `--destructive` | #EF4444 (brighter red) | Destructive actions |
| `--destructive-foreground` | #FFFFFF | Text on destructive |
| `--success` | #22C55E (brighter green) | Success states |
| `--success-foreground` | #FFFFFF | Text on success |
| `--muted` | #1E3250 | Muted backgrounds |
| `--muted-foreground` | #8A9BBF | Secondary text |
| `--border` | #1E3250 | Borders |
| `--input` | #1E3250 | Input borders |
| `--ring` | #E8A838 (gold) | Focus ring |

#### Sidebar Tokens (Consistent across modes)

| Token | Light Value | Dark Value |
|-------|------------|------------|
| `--sidebar-background` | #1B3A6B | #0D1B2A |
| `--sidebar-foreground` | #F0F1F4 | #E8EBF0 |
| `--sidebar-primary` | #E8A838 | #E8A838 |
| `--sidebar-primary-foreground` | #1B3A6B | #0D1B2A |
| `--sidebar-accent` | rgba(232,168,56,0.15) | rgba(232,168,56,0.15) |
| `--sidebar-accent-foreground` | #FFFFFF | #FFFFFF |
| `--sidebar-border` | rgba(255,255,255,0.1) | rgba(255,255,255,0.08) |
| `--sidebar-ring` | #E8A838 | #E8A838 |

### Typography

- **Display font**: `--font-display`: "Nunito", sans-serif (headings, brand)
- **Body font**: `--font-body`: "Inter", sans-serif (UI text, paragraphs)
- No formal type scale defined — sizes are ad-hoc via Tailwind utilities (text-xs, text-sm, text-lg, text-2xl, etc.)

### Spacing

10-step scale defined:
- `--space-1`: 0.25rem (4px) through `--space-12`: 3rem (48px)
- Steps: 1, 2, 3, 4, 5, 6, 8, 10, 12 (gaps at 7, 9, 11)
- In practice, most spacing uses Tailwind utilities directly rather than these tokens

### Border Radius

- `--radius`: 0.625rem (10px) — base
- `--radius-sm`: 0.375rem (6px)
- `--radius-md`: 0.625rem (10px)
- `--radius-lg`: 1rem (16px)
- `--radius-xl`: calc(var(--radius) + 4px) = ~14px
- `--radius-full`: 9999px

### Elevation / Shadows

**No shadow tokens defined in CSS.** Shadows are applied ad-hoc via Tailwind utilities:
- `shadow-sm` — Card default
- `shadow-md` — Card hover, dropdown menus
- `shadow-lg` — Dragging state, command palette
- `shadow-2xl` — Command palette container
- No dark mode shadow adjustments

---

## Page-by-Page Audit

### Auth Pages (Login, Register)

**Layout**: Split-screen — left brand panel (gradient navy with decorative circles) + right form panel. Brand panel hidden on mobile.

**Components**: Button, Input, Label, Loader2 spinner

**States**:
- Loading: Spinner on submit button, inputs disabled
- Error: Red error banner (bg-destructive/10)
- No empty state needed

**Issues**:
- Auth layout gradient uses **hardcoded navy colors** (#1B3A6B, #142237, #0D1B2A), not CSS variables — dark mode doesn't adapt the brand panel
- No password visibility toggle
- No "forgot password" flow
- Register has only 3 fields (name, email, password) — no confirm password field

### Dashboard

**Layout**: Vertical stack — PageHeader → StatsRow (5 cards) → ChartsSection (2 charts) → CollectionSummaries (3-col grid) → RecentAcquisitions (table)

**Components**: StatCard, AnimatedNumber, Card, DataTable, Badge, recharts (PieChart, BarChart)

**States**:
- Loading: Skeleton placeholders per section
- Empty: Lock icon with CTA to create first collection

**Issues**:
- Chart colors are **hardcoded brand values** (#1B3A6B, #E8A838, etc.), not from a chart palette token
- No chart animations
- Charts section returns `null` if empty instead of showing an empty state
- Collection summaries and recent acquisitions also return `null` if empty — inconsistent with dashboard empty state
- Stats row grid: 1-col → 2-col → 5-col (skips 3 and 4 col breakpoints, so 2-col with 5 items leaves orphan card)

### Collections List

**Layout**: PageHeader → Toolbar (search, filters, sort, view toggle, create button) → Grid or Table view

**Components**: Card, DataTable, SortableList, Badge, EmptyState, Dialog, ConfirmDialog, StaggerChildren

**States**:
- Loading: 6 skeleton cards
- Empty: Library icon with CTA
- Grid + List toggle

**Issues**:
- Grid overlay uses **hardcoded rgba(0,0,0,0.7)** for text readability over cover images — not theme-aware
- Toolbar collapses filters on mobile with expandable section — good responsive pattern
- Drag-to-reorder only active when sort = "custom" — not discoverable
- Grid uses `auto-fill minmax(320px, 1fr)` — good responsive grid
- Create/Edit dialog for collection management

### Collection Detail

**Layout**: PageHeader → Breadcrumbs → Tabs (Items / Sets) → Items grid/table with search/filters → Sets list with expand/collapse

**Components**: Card, DataTable, Badge, EmptyState, SortableList, DropdownMenu, Dialog, Tabs, AnimatePresence

**States**:
- Loading: Skeleton items
- Empty: Per-tab empty states
- Error: Error message display

**Issues**:
- Complex page with many responsibilities — items management, sets, import/export all in one
- Tab-based organization works but dense
- Import wizard is a well-designed 3-step modal

### Catalog Item Detail

**Layout**: PageHeader → Item details → Owned copies section

**Components**: Card, Badge, EmptyState, Dialog, ConfirmDialog, FadeIn, StaggerChildren

**States**:
- Loading: Skeleton with image + text placeholders
- Empty: Empty state for owned copies section

**Issues**:
- No image gallery/lightbox for item images
- Custom fields display could be better organized
- Owned copy management (add/edit/delete) happens via dialogs

### Collection Types

**Layout**: PageHeader → Types grid/list → Create/Edit dialog with custom field builder

**Components**: Card, Badge, EmptyState, Tabs, SortableList, Dialog, StaggerChildren

**States**:
- Loading: Skeleton cards
- Empty: EmptyState with CTA

**Issues**:
- Field builder uses drag-and-drop (SortableList) with motion for additions/removals — well done
- Dense form for type creation with custom field definitions

### Wishlist

**Layout**: PageHeader → Toolbar (priority filter, sort) → Grouped by collection with collapsible headers → Item cards

**Components**: Card, Badge, EmptyState, DropdownMenu, SortableList, FadeIn, AnimatePresence

**States**:
- Loading: Custom skeleton
- Empty: Heart icon with CTA

**Issues**:
- Grouped by collection with collapsible sections — good UX
- Priority badges: High/Medium/Low with color coding
- Drag-to-reorder within groups
- AnimatePresence for group expand/collapse

### Profile

**Layout**: PageHeader → Avatar section → Account info → About → Preferences → Appearance → Save button

**Components**: Card, Select, Textarea, FadeIn, Skeleton components

**States**:
- Loading: Full skeleton layout
- Avatar upload: Spinner overlay

**Issues**:
- Theme toggle (Light/Dark/System) with visual indicators — well implemented
- Language and currency selects
- Sticky save button on mobile, inline on desktop
- Avatar upload with camera icon overlay on hover

---

## Inconsistencies

### Color Usage Drift

1. **Auth layout gradient** uses hardcoded navy (#1B3A6B, #142237, #0D1B2A) instead of CSS variables — breaks theming
2. **Chart colors** in charts-section.tsx are hardcoded brand values, not from a defined chart palette
3. **Collection card overlay** uses hardcoded `rgba(0,0,0,0.7)` instead of a theme-aware overlay
4. **Badge warning variant** uses `accent/20` opacity while other variants use solid backgrounds — inconsistent opacity model
5. **Toaster** colors are well-structured (all `/10` bg, `/30` border) but success uses `success-foreground` while error uses plain `destructive` — naming inconsistency

### Component Pattern Variations

1. **Empty states vary across pages**:
   - Dashboard sub-sections return `null` when empty (no visual indication)
   - Main pages show EmptyState component
   - Inconsistent user experience
2. **EmptyState action button** uses inline styling instead of the Button component — different hover/padding behavior
3. **Card hover behavior**: Default variant lifts (`-translate-y-0.5`), but this effect is applied inconsistently across pages
4. **Button icon sizing**: All SVG icons are `size-4` regardless of button size variant — small button icons look proportionally large
5. **Menu item density**: DropdownMenuItem (`px-2 py-1.5`) vs SelectItem (`pl-8 pr-2 py-1.5`) have different padding structures

### Spacing Mismatches

1. **Dialog padding**: p-4 on mobile, sm:p-6 on desktop — defined in dialog.tsx but some dialogs add their own padding
2. **Page content padding**: `px-4 py-6 sm:px-6` — consistent at app-layout level but some pages add extra padding
3. **Spacing tokens exist** (`--space-1` through `--space-12`) but are **rarely used** — most spacing is via Tailwind utilities directly
4. **Stats row grid** jumps from 2-col to 5-col without intermediate breakpoints, leaving orphan cards at tablet size

### Animation Timing

1. **Sheet** uses 300ms/500ms (close/open) while **Dialog** uses ~200ms — inconsistent for similar overlay components
2. **Sidebar transition** uses `duration-250` (custom) while most other transitions use `duration-200` (Tailwind default)
3. No defined duration tokens — each component picks its own timing

---

## Missing Patterns

### Components Not Present

1. **Loading skeletons per page**: Some pages have them, others don't — no standardized skeleton pattern
2. **Image lightbox/gallery**: No component for viewing full-size images (needed for owned copy photos)
3. **Progress bar/ring**: No completion visualization component (needed for set tracking)
4. **Breadcrumb component**: Used in collection detail but as inline JSX, not a reusable component
5. **Step indicator**: Import wizard has one but it's inline, not reusable
6. **Date picker**: No dedicated date picker component — uses native HTML date input
7. **File upload zone**: Import wizard has drag-drop but it's not a reusable component
8. **Inline editing pattern**: No component for click-to-edit fields
9. **Error boundary**: No error boundary component for graceful failure handling

### Patterns Missing from Top-Tier SaaS Apps

1. **Onboarding flow**: No guided tour or setup wizard for new users
2. **Notification system**: Bell icon exists but dropdown shows "No notifications" — no real notification infrastructure
3. **Global search results**: Command palette searches navigation only, not actual data (collections, items)
4. **Keyboard shortcuts**: Only Cmd+K is implemented — no shortcuts for common actions
5. **Undo/redo for destructive actions**: Delete is permanent with only a confirmation dialog
6. **Bulk actions**: No multi-select for batch operations on items/collections
7. **Activity feed/timeline**: No audit trail for user actions
8. **Data export**: Limited to import wizard — no general export capability visible in the UI
9. **Collaborative features**: No sharing, commenting, or multi-user awareness

---

## Responsive Gaps

### Layout

1. **Sidebar**: Well-handled — hidden on mobile (<768px), Sheet-based mobile nav, collapsible on tablet
2. **TopToolbar vs Header**: Clean swap at md breakpoint — different content for mobile vs desktop
3. **Main content padding**: Only 2-step (`px-4` → `sm:px-6`), could use intermediate step

### Page-Specific Issues

1. **Stats row**: 1-col → 2-col (sm) → 5-col (lg) — the 2→5 jump leaves an orphan 5th card on tablet (sm-lg range)
2. **Charts section**: Stacks at <lg — good, but charts have fixed height (h-64) that may be too tall on small mobile
3. **Collection grid**: `auto-fill minmax(320px, 1fr)` — works well but 320px minimum may force single column on some tablets
4. **DataTable**: No horizontal scroll wrapper on mobile — wide tables may overflow
5. **Dialog sizing**: `w-[calc(100%-2rem)] max-w-lg` — good mobile adaptation but some dialogs (import wizard) may need more width on tablet
6. **Command palette**: `w-[calc(100%-2rem)] max-w-lg` — appropriate

### Missing Tablet Optimizations

- Most designs jump from mobile (1-col) to desktop (multi-col) with minimal tablet-specific layout
- Tablet range (768px-1024px) with collapsed sidebar gets the desktop layout in a narrower viewport
- No tablet-specific grid configurations for cards or content sections

---

## Accessibility Gaps

### Focus Management

1. **Focus rings**: Present via `ring-2 ring-ring ring-offset-2` pattern on interactive elements — good baseline
2. **Focus visible only**: Not using `:focus-visible` — focus rings show on click too, not just keyboard navigation
3. **Focus trap**: Present in Dialog and Sheet (via Radix) but not explicitly in custom overlays

### ARIA and Semantic HTML

1. **Sidebar navigation**: Uses semantic `<nav>` element — good
2. **Missing ARIA on some buttons**: Some action buttons in card grids lack `aria-label` (rely on icon-only)
3. **Data table**: No `role="table"` or ARIA table attributes — uses semantic `<table>` HTML which is correct
4. **Chart accessibility**: Recharts provides minimal ARIA — no `aria-label` on chart containers, no data table alternative for screen readers
5. **Drag-and-drop**: SortableList uses @dnd-kit which provides ARIA announcements — good

### Keyboard Navigation

1. **Tab order**: Generally follows visual order — no explicit `tabIndex` management issues found
2. **Card click handlers**: Collection cards use `onClick` on divs — not keyboard accessible (can't be tabbed to or activated with Enter)
3. **Command palette**: Full keyboard support via cmdk library — good
4. **Dropdown menus**: Full keyboard support via Radix — good

### Screen Reader Support

1. **`sr-only` class usage**: Present on mobile menu toggle — sparse elsewhere
2. **Image alt text**: Present on logo, missing on collection cover images and item images
3. **Loading state announcements**: No `aria-live` regions for loading/content updates
4. **Error announcements**: No `role="alert"` on error messages

### Reduced Motion

1. **`prefers-reduced-motion` respected** in motion.tsx (PageTransition, FadeIn, StaggerChildren, ScaleIn) — good
2. **Not respected in**: Tailwind `animate-pulse` (skeleton), `animate-spin` (loader), CSS transitions (hover effects)
3. **No fallback strategy documented** for reduced-motion users

---

## Dark Mode Assessment

### Well-Implemented

- **Semantic token system**: All major surfaces, text, and interactive elements use CSS variables that swap in dark mode
- **Sidebar**: Dedicated dark mode sidebar tokens — looks intentional
- **Component library**: All ds/ and ui/ components use semantic tokens — automatically adapt
- **Toast notifications**: Proper dark mode colors with opacity-based backgrounds
- **Profile page**: Full theme toggle (Light/Dark/System) with visual indicators

### Afterthought / Gaps

1. **Auth layout brand panel**: Hardcoded gradient colors (#1B3A6B → #142237 → #0D1B2A) — works in dark mode by coincidence (already dark), but the decorative circles don't adapt
2. **Chart colors**: Hardcoded (#1B3A6B navy, #E8A838 gold) — navy on dark navy background makes pie/bar segments nearly invisible in dark mode
3. **Collection card gradient overlay**: `rgba(0,0,0,0.7)` — adequate in both modes since it's over images, but not optimized for dark mode
4. **Shadows**: All shadow utilities (shadow-sm, shadow-md, shadow-lg) are the same in light and dark mode — in dark mode, shadows are barely visible against dark backgrounds, losing depth perception
5. **Scrollbar thumb**: `bg-border` — in dark mode, border color is #1E3250, which has low contrast against dark backgrounds
6. **No elevated surface strategy**: Dark mode doesn't use lighter surfaces for elevated elements (cards are #142237 on #0D1B2A background — only slight contrast difference)

---

## Summary of Priorities

### Critical (Must Fix)

1. **Define a chart color palette** that works in both light and dark mode — current hardcoded colors fail in dark mode
2. **Define shadow/elevation tokens** for dark mode — current shadows are invisible on dark backgrounds
3. **Standardize empty states** across all pages — dashboard sub-sections returning null is a UX gap
4. **Fix auth layout** to use CSS variables instead of hardcoded colors
5. **Make card overlays theme-aware** — replace hardcoded rgba values

### High Priority (Should Improve)

1. **Create a formal type scale** — current typography is ad-hoc via Tailwind utilities
2. **Define animation/duration tokens** — each component currently picks its own timing
3. **Add chart accessibility** — ARIA labels, data table alternatives for screen readers
4. **Improve keyboard accessibility** — card click handlers need to be keyboard-operable
5. **Add `aria-live` regions** for loading state announcements
6. **Fix stats row grid** for tablet breakpoint (orphan card issue)
7. **Add image lightbox component** for owned copy photos

### Medium Priority (Nice to Have)

1. **Use CSS custom properties for spacing** consistently instead of mixing tokens and Tailwind utilities
2. **Standardize animation timing** across Dialog, Sheet, Sidebar, and other animated components
3. **Add `:focus-visible`** instead of `:focus` for focus ring display
4. **Add breadcrumb, progress bar, and date picker** as reusable components
5. **Improve tablet-specific layouts** — most pages jump from mobile to desktop
6. **Add onboarding/first-run experience** for new users

### Low Priority (Future Enhancements)

1. **Global search** that searches actual data, not just navigation
2. **Bulk actions** for multi-item operations
3. **Keyboard shortcuts** beyond Cmd+K
4. **Notification infrastructure** (currently placeholder)
5. **Inline editing** for quick field updates
6. **Activity feed/audit log** for user actions
