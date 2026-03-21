# GeekVault Admin Area Design

## Admin Layout & Navigation

### Layout Approach Evaluation

#### Option A: Shared Shell with Admin Nav Section
Same sidebar, admin items appear as additional group within existing navigation.

**Pros:**
- Zero learning curve — same shell, same interaction patterns
- Simple implementation — just add nav items conditionally

**Cons:**
- Blurs the boundary between user and admin contexts
- Sidebar becomes crowded with 4+ admin items added to existing 5 user items
- No clear visual signal that you're "in admin mode"
- Admin actions (disable user, change settings) feel dangerously close to personal actions

#### Option B: Completely Separate Admin Layout
Dedicated `/admin` route tree with its own shell, sidebar, and header.

**Pros:**
- Maximum separation — impossible to confuse contexts
- Admin layout can be optimized for data-heavy tasks

**Cons:**
- Duplicate shell code (sidebar, header, user menu, theme, i18n)
- Jarring context switch — feels like a different app
- Loses the Warm Obsidian identity continuity
- Overkill for 4 admin pages

#### Option C: Shared Shell with Sidebar Context Switch
Same sidebar shell, but navigation items swap when entering admin area. Back-to-app link replaces brand section. Admin badge visible in sidebar header.

**Pros:**
- Same warm obsidian shell — visual continuity, no jarring switch
- Clear context boundary — nav items change, admin badge appears
- Sidebar doesn't get crowded (admin items replace user items, not stack on top)
- Easy escape hatch (back-to-app link always visible at top)
- Single shell codebase with conditional nav rendering
- Pattern used by Stripe Dashboard, Clerk, Linear Settings

**Cons:**
- Slightly more complex sidebar logic (context-aware nav groups)
- User menu and collapse behavior need to work in both contexts

---

### Selected Approach: **Shared Shell with Sidebar Context Switch** (Option C)

**Rationale:** Admin users are primarily collectors who occasionally need admin tools. The sidebar context switch provides clear mode awareness without the cognitive overhead of a completely different layout. The Warm Obsidian identity (dark sidebar as curio cabinet frame) should persist — admin mode is a different room in the same building, not a different building entirely.

The key insight is that admin in GeekVault is lightweight (4 pages) and used intermittently. A full separate layout would be over-engineered. But simply adding admin items to the existing nav (Option A) creates a cluttered sidebar and ambiguous context. The context switch is the sweet spot.

**Reference:** Stripe Dashboard uses this exact pattern — clicking "Settings" swaps the sidebar from business tools to settings categories, with a prominent back arrow.

---

### Admin Sidebar — Visual Design

When the user navigates to any `/admin/*` route, the sidebar transforms:

#### Expanded Mode (260px)

```
┌─────────────────────────┐
│  ← Back to GeekVault    │  ← Back link (replaces brand section)
│                         │
├─────────────────────────┤
│                         │
│  🛡 ADMIN               │  ← Admin badge header (Shield icon + label)
│                         │
│  MANAGEMENT             │  ← Group label
│  ○ Users                │
│  ○ Settings             │
│                         │
│  INSIGHTS               │  ← Group label
│  ○ Analytics            │
│  ○ Audit Log            │
│                         │
├─────────────────────────┤
│  [👤] Ralph Largo        │  ← User section (unchanged — always present)
│       ralph@example.com  │
└─────────────────────────┘
```

#### Collapsed Mode (72px)

```
┌──────┐
│  ←   │  ← Back arrow icon (tooltip: "Back to GeekVault")
├──────┤
│  🛡   │  ← Shield badge (no tooltip — decorative context indicator)
│ ─── │  ← Divider
│  👥  │  ← Users (tooltip)
│  ⚙   │  ← Settings (tooltip)
│ ─── │  ← Divider
│  📊  │  ← Analytics (tooltip)
│  📋  │  ← Audit Log (tooltip)
├──────┤
│  [👤] │  ← User avatar
└──────┘
```

#### Mobile Sheet

Identical to expanded mode — back link at top, admin nav items, user section at bottom. Tapping "Back to GeekVault" navigates to `/` and closes the sheet.

---

### Admin Navigation Items

| Item | Icon (Lucide) | Route | Description | i18n Key |
|------|---------------|-------|-------------|----------|
| Users | `Users` | `/admin/users` | User management — list, roles, status | `admin.nav.users` |
| Settings | `Settings` | `/admin/settings` | System configuration — general, security, features, storage | `admin.nav.settings` |
| Analytics | `BarChart3` | `/admin/analytics` | Platform metrics — growth, usage, top users | `admin.nav.analytics` |
| Audit Log | `ScrollText` | `/admin/audit-log` | Activity trail — actions, users, timestamps | `admin.nav.auditLog` |

**Group definitions (admin context):**

| Group | Label Key | Items |
|-------|-----------|-------|
| Management | `admin.nav.groups.management` | Users, Settings |
| Insights | `admin.nav.groups.insights` | Analytics, Audit Log |

**Icon rationale:**
- `Users` (not `UserCog`) — admin manages people, not settings about people
- `Settings` (gear) — universal settings icon, instantly recognizable
- `BarChart3` (not `LineChart`) — bar charts are the primary analytics visualization
- `ScrollText` — scroll/log metaphor, distinct from other nav icons

---

### Visual Differentiation Strategy

Admin mode communicates "you're in a different context" through three subtle but clear signals:

#### 1. Admin Badge in Sidebar Header

When in admin context, the brand section is replaced by a back-to-app link. Below it, a small admin badge provides persistent context awareness:

**Expanded mode:**
```
┌─────────────────────────┐
│  ← Back to GeekVault    │  ← ArrowLeft icon + text, full width clickable
├─────────────────────────┤
│  🛡 Admin               │  ← Shield icon + "Admin" label
│                         │     text-sidebar-primary (amber) for both icon and text
│                         │     text-xs font-semibold uppercase tracking-wider
│                         │     px-3 py-2
```

**Visual treatment:**
- Back link: `h-[72px]` (matches brand section height), `flex items-center gap-2 px-4`, `text-sidebar-foreground/70 hover:text-sidebar-foreground`, `border-b border-sidebar-border`
- Back arrow icon: `ArrowLeft`, `h-4 w-4`
- Back text: `text-sm font-medium`
- Admin badge: `text-sidebar-primary` (amber), `Shield` icon `h-4 w-4` + "Admin" text
- Badge sits above the first nav group, separated by `--space-2` (8px) padding

**Collapsed mode:**
- Back link becomes arrow-only icon, centered in 72px width, `h-[72px]`, tooltip "Back to GeekVault"
- Admin badge: Shield icon only, `text-sidebar-primary`, `h-5 w-5`, centered, no tooltip (decorative)

#### 2. Top Toolbar Admin Indicator

A small pill badge appears in the top toolbar when in admin context:

- Position: Left side of toolbar, after the page title / breadcrumb area
- Design: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`
- Content: Shield icon (h-3 w-3) + "Admin" text
- Typography: `text-xs font-medium`
- Border radius: `--radius-full` (pill shape)
- Padding: `px-2 py-0.5`

This badge is visible even when the sidebar is collapsed, providing redundant context awareness.

#### 3. Active Route Styling

Admin nav items use the **same** active/hover/focus states as user nav items — amber left border, amber icon, accent background. This is intentional: admin should feel like part of the same app, not a foreign interface. The differentiation comes from the badge and back link, not from changing the interaction vocabulary.

**What we deliberately do NOT do:**
- No separate accent color for admin (e.g., red or blue) — would break the Warm Obsidian identity
- No separate sidebar background color — would feel like a different app
- No persistent banner/stripe across the content area — too heavy for 4 pages
- No icon color shift on all admin nav items — would reduce amber to a "danger" signal

---

### Back-to-App Navigation

The primary escape hatch from admin is the back link in the sidebar header:

**Expanded sidebar:**
- Full row: `← Back to GeekVault`
- `ArrowLeft` icon (h-4 w-4) + text `text-sm font-medium`
- Colors: `text-sidebar-foreground/70` default, `text-sidebar-foreground` on hover
- Height: `h-[72px]` (matches brand section — maintains layout consistency)
- Click navigates to `/` (dashboard)
- `border-b border-sidebar-border` bottom border (matches brand section)
- Transition: `transition-colors duration-150`

**Collapsed sidebar:**
- Arrow icon only, centered in 72px width
- `ArrowLeft` icon (h-5 w-5), same color states as expanded
- Tooltip: side="right", content="Back to GeekVault", delay=0
- Height: `h-[72px]` (matches brand section)

**Mobile sheet:**
- Same as expanded sidebar — `← Back to GeekVault` full row
- Tapping navigates to `/` AND closes the sheet

**Keyboard shortcut:**
- No dedicated shortcut — use command palette (Cmd+K → type "Dashboard" or "Back") for keyboard navigation
- Back link is focusable and responds to Enter/Space

**Top toolbar:**
- The toolbar does NOT have a separate back button — the sidebar back link and the admin badge pill are sufficient
- Page titles in the toolbar show the admin page name (e.g., "Users", "Analytics") without a "Admin >" prefix

---

### Responsive Admin Layout

The admin area uses the same responsive strategy as the main app — the shell adapts, admin content fills the content area:

#### Desktop (≥1024px)
- Sidebar: 260px expanded with admin nav items
- Top toolbar: 72px with admin pill badge
- Content area: `flex-1 overflow-y-auto`, `px-6 py-6`
- Admin pages render in the same content area as user pages

#### Tablet (768px–1023px)
- Sidebar: Auto-collapsed to 72px with admin icons + back arrow
- Toolbar: Admin pill badge visible (important — collapsed sidebar hides text context)
- Content area: `px-4 py-6`
- Data tables may need horizontal scroll on narrower tablets

#### Mobile (<768px)
- Header: 56px with hamburger, brand text changes to "Admin" when on admin routes
- Sheet: Opens with admin nav items (expanded mode, same as desktop expanded)
- Admin pill badge: NOT shown on mobile header (redundant with sheet nav)
- Content area: `px-4 py-4`
- Data tables: Horizontal scroll with sticky first column, or card-based responsive layout

#### Content Area — No Layout Change
Admin pages use the same `<AnimatedOutlet />` with page transitions. No special admin content wrapper, no secondary sidebar, no sub-navigation bar. Each admin page manages its own content layout.

---

### Route Structure

```
/admin                → Redirects to /admin/users (default admin landing)
/admin/users          → User management list
/admin/settings       → System settings (single page with section cards)
/admin/analytics      → Analytics dashboard
/admin/audit-log      → Audit log table
```

**Route configuration:**
- All `/admin/*` routes are wrapped in a route guard that checks `user.role === "admin"`
- Unauthorized access redirects to `/` (dashboard) with no error toast (silent redirect — admin routes shouldn't be discoverable)
- Admin routes use the same `AppLayout` component — the sidebar detects `/admin` prefix in the current path and renders admin nav items
- Each admin page is a standalone page component in `src/web/src/features/admin/`

**Feature directory structure:**
```
src/web/src/features/admin/
├── admin-users-page.tsx
├── admin-settings-page.tsx
├── admin-analytics-page.tsx
├── admin-audit-log-page.tsx
└── components/          # Shared admin sub-components
```

**Sidebar context detection:**
```typescript
// In sidebar component:
const location = useLocation()
const isAdminContext = location.pathname.startsWith("/admin")

// Render adminNavGroups when isAdminContext, else navGroups
```

This avoids URL coupling beyond the `/admin` prefix check and keeps the sidebar logic simple.

---

### Implementation Notes

- **Sidebar refactor**: The `navGroups` export in `sidebar.tsx` needs to become context-aware. Define `adminNavGroups` alongside `navGroups` and switch based on route.
- **i18n keys**: Add `admin.nav.*` keys to both `en.json` and `pt.json` — back link text, group labels, item labels, toolbar badge text.
- **Admin guard**: Create a `RequireAdmin` route wrapper (similar to existing auth guard pattern) that checks `user.role`.
- **Transition**: When navigating from user → admin or admin → user, the sidebar nav items should transition with a subtle fade (not instant swap). Use `AnimatePresence` with `mode="wait"` and a fast fade (100ms) on the nav group container.
- **Mobile brand text**: On mobile header, conditionally show "Admin" instead of "GeekVault" when on admin routes — provides context without the sidebar being visible.
- **Command palette**: Admin pages should be indexed in the command palette under an "Admin" group, but only for admin users. Quick navigation: Cmd+K → "Users" should jump to `/admin/users`.
- **Toolbar badge**: The admin pill badge should be a shared component (e.g., `AdminBadge`) placed in the top toolbar, conditionally rendered based on route prefix.
- **No additional admin-specific tokens**: Admin uses the existing Warm Obsidian palette. The amber-tinted pill badge uses existing `amber-500/600` Tailwind colors with opacity — no new CSS custom properties needed.

---

## User Management

### Design Philosophy

User management is the most-visited admin page — it should feel efficient and data-dense without being overwhelming. The design follows established admin patterns (Stripe, Clerk, Linear) where the primary view is a searchable, filterable data table with clear role and status signals. Every row gives the admin enough context to act without opening a detail view, but clicking through reveals fuller information when needed.

**Key aesthetic decisions:**
- **Data table as the hero** — no cards, no grid; tabular data for a tabular task
- **Avatar + name pair** in the primary column provides visual anchoring (humans recognize faces faster than names)
- **Role badges use subtle semantic colors** — not loud alerts, just clear identification
- **Status indicator is a colored dot**, not a badge — status is secondary to role and should be glanceable, not prominent
- **Actions are hover-reveal** on desktop, always-visible on mobile — consistent with collection card patterns
- **Pagination at the bottom**, not infinite scroll — admins need to know total scope

---

### User List — Data Table Design

Uses the existing `DataTable` component with admin-specific column configuration.

#### Table Container

- **Background**: `--card`
- **Border radius**: `--radius-lg` (12px)
- **Border**: `1px solid --border`
- **Overflow**: `overflow-hidden` on container, `overflow-x-auto` on table wrapper for mobile
- **Shadow**: `--shadow-sm` (subtle lift from page background)

#### Row Specifications

- **Row height**: Minimum 56px (accommodates avatar + two-line text)
- **Row hover**: `--foreground/4` background overlay
- **Row separator**: `1px --border` between rows
- **Row click**: Navigates to user detail (entire row is clickable — `cursor-pointer`)
- **Selected state**: None (no multi-select — actions are per-user)

#### Columns

| Column | Header | Cell Content | Width | Responsive |
|--------|--------|-------------|-------|------------|
| User | `overline` (11px, weight 600, uppercase) | Avatar (32×32, `--radius-full`) + Display Name (`body-sm`, weight 500) + Email (`caption`, `--muted-foreground`) stacked | flex-2, min 200px | Always visible |
| Role | `overline` | Role badge (see badge spec below) | 100px fixed | Always visible |
| Status | `overline` | Dot indicator + label (see spec below) | 100px fixed | Hidden on mobile |
| Last Active | `overline` | Relative date (`body-sm`, `--muted-foreground`) | 120px fixed | Hidden on mobile, hidden on tablet |
| Actions | — (no header) | 3-dot dropdown (see actions spec) | 48px fixed | Always visible |

#### User Column Cell Layout

```
┌─────────────────────────────────────┐
│ ┌────┐  Display Name                │
│ │ AV │  email@example.com           │
│ └────┘                              │
└─────────────────────────────────────┘
```

- **Avatar**: 32×32px, `--radius-full`, `object-cover`
- **Avatar fallback**: Initials on `bg-muted` with `--muted-foreground` text, `text-xs font-medium`
- **Name**: `body-sm` (14px), weight 500, `--foreground`
- **Email**: `caption` (12px), weight 400, `--muted-foreground`
- **Gap between avatar and text**: `--space-3` (12px)
- **Text stack gap**: `--space-0.5` (2px)

#### Role Badge Design

Role badges use the existing `Badge` component with semantic variants:

| Role | Label | Variant | Background (light) | Text (light) | Background (dark) | Text (dark) |
|------|-------|---------|-------------------|--------------|-------------------|-------------|
| Admin | "Admin" | `accent` | `--accent/10` | `--accent` (amber) | `--accent/15` | `--accent` (brighter amber) |
| User | "User" | `secondary` | `--muted` | `--muted-foreground` | `--muted` | `--muted-foreground` |

- **Size**: `text-xs`, `px-2 py-0.5`, `--radius-full`
- **Font weight**: 500
- **Rationale**: Admin gets the amber accent to stand out; User is intentionally muted — most rows are users, admin badges should pop via contrast

#### Status Indicator Design

Status is shown as a colored dot + short label:

| Status | Dot Color (light) | Dot Color (dark) | Label |
|--------|-------------------|-------------------|-------|
| Active | `--success` (#16A34A) | `--success` (#22C55E) | "Active" |
| Disabled | `--muted-foreground` (#78716C) | `--muted-foreground` (#A8A29E) | "Disabled" |

- **Dot**: `w-2 h-2 rounded-full` inline with label
- **Label**: `body-sm` (14px), weight 400, same color as dot
- **Layout**: `flex items-center gap-1.5`
- **Active dot pulse**: No animation — static dot is cleaner for admin tables (pulse would be distracting at scale)

#### Last Active Column

- **Format**: Relative time — "Just now", "5m ago", "2h ago", "Yesterday", "3 days ago", "Mar 15" (if >7 days), "Never" (if null)
- **Typography**: `body-sm`, `--muted-foreground`
- **"Never"**: Uses `--muted-foreground/60` — slightly more faded to signal inactive accounts

#### Actions Column

- **Trigger**: `MoreHorizontal` icon (Lucide), 16×16px
- **Button**: `ghost` variant, `h-8 w-8`, `--radius-md`
- **Hover**: `--foreground/8` background
- **Desktop visibility**: `sm:opacity-0 sm:group-hover/row:opacity-100 focus-within:opacity-100` — hover-reveal pattern
- **Mobile visibility**: Always visible (opacity 100)

**Dropdown menu items:**

| Item | Icon (Lucide) | Label | Variant |
|------|---------------|-------|---------|
| View Details | `Eye` | "View details" | default |
| Change Role | `Shield` | "Change role" | default |
| Disable/Enable | `UserX` / `UserCheck` | "Disable user" / "Enable user" | default (conditional label) |
| — | — | — | separator |
| Delete | `Trash2` | "Delete user" | destructive |

---

### Search and Filter Bar

Position: Above the data table, within the same card container or as a separate toolbar.

#### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  🔍 [Search users...          ]  [Role ▼] [Status ▼]    {n} users │
└────────────────────────────────────────────────────────────────┘
```

- **Container**: `flex items-center gap-3 flex-wrap`, `py-4 px-4`, `border-b border-border`
- **Search input**: `flex-1 min-w-[200px] max-w-[320px]`
- **Filters**: `flex items-center gap-2`
- **Count**: `ml-auto`, `body-sm`, `--muted-foreground`, "{{count}} users"

#### Search Input

- **Icon**: `Search` (Lucide), 16×16px, `--muted-foreground`, `absolute left-3`
- **Input**: `pl-9 h-9`, `--radius-md`, `border border-input`, placeholder "Search by name or email..."
- **Behavior**: Client-side filter on name and email fields, debounced 300ms (use existing `useDebounce` hook)
- **Clear**: `X` icon appears when input has value, `absolute right-3`, clears on click

#### Role Filter

- **Component**: `Select` from `components/ds/select.tsx`
- **Options**: "All roles" (default), "Admin", "User"
- **Width**: `w-[130px]`
- **Behavior**: Filters table rows by role, combinable with search and status filter

#### Status Filter

- **Component**: `Select` from `components/ds/select.tsx`
- **Options**: "All statuses" (default), "Active", "Disabled"
- **Width**: `w-[140px]`
- **Behavior**: Filters table rows by status, combinable with search and role filter

#### Responsive Behavior

- **Desktop**: Search + filters + count in single row
- **Tablet**: Same as desktop (fits within content width)
- **Mobile**: Search full width on first row, filters + count wrap to second row

---

### User Detail View

Clicking a user row opens a **side panel (Sheet)** — not a new page. This keeps the admin in the list context and avoids page navigation for quick lookups.

#### Sheet Design

- **Width**: `sm:max-w-md` (448px)
- **Side**: `right`
- **Overlay**: Standard sheet overlay from existing `Sheet` component
- **Animation**: Slide from right, `250ms`, spring easing

#### Sheet Content Layout

```
┌────────────────────────────────────────────┐
│  ✕ Close                                    │  ← Sheet header
├────────────────────────────────────────────┤
│                                            │
│         ┌────────┐                         │
│         │  Avatar │  (64×64)               │
│         └────────┘                         │
│      Display Name                          │  ← h3 typography, centered
│      email@example.com                     │  ← body-sm, muted, centered
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  Role      [Admin Badge]           │    │
│  │  Status    [● Active]              │    │
│  │  Joined    March 15, 2026          │    │
│  │  Last Active  2 hours ago          │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Collection Stats                          │  ← Section header
│  ┌──────┐ ┌──────┐ ┌──────┐               │
│  │  12  │ │  248 │ │  45  │               │
│  │Collns│ │Items │ │Copies│               │
│  └──────┘ └──────┘ └──────┘               │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  [Change Role ▼]  [Disable User]  │    │  ← Action buttons
│  └────────────────────────────────────┘    │
└────────────────────────────────────────────┘
```

#### Profile Section

- **Avatar**: 64×64px, `--radius-full`, centered
- **Avatar fallback**: Initials, larger text (`text-lg`)
- **Name**: `h3` typography (20px, Plus Jakarta Sans, weight 600), centered, `mt-3`
- **Email**: `body-sm`, `--muted-foreground`, centered, `mt-1`

#### Info Card

- **Container**: `bg-muted/50`, `--radius-lg`, `p-4`, `mt-6`
- **Rows**: `flex justify-between py-2`, separated by `border-b border-border` (except last)
- **Labels**: `body-sm`, `--muted-foreground`
- **Values**: `body-sm`, weight 500, `--foreground`
- **Role value**: Uses role badge (same as table)
- **Status value**: Dot + label (same as table)
- **Joined date**: Absolute format "March 15, 2026"
- **Last active**: Relative format (same as table)

#### Collection Stats

- **Section label**: `overline` (11px, uppercase, weight 600), `--muted-foreground`, `mt-6 mb-3`
- **Cards**: 3-column grid, `gap-3`
- **Each card**: `bg-card`, `border border-border`, `--radius-md`, `p-3`, text-center
- **Number**: `h4` typography (18px, Plus Jakarta Sans, weight 600)
- **Label**: `caption` (12px), `--muted-foreground`

#### Action Buttons

- **Container**: `flex gap-3 mt-6`, sticky at bottom of sheet with `border-t border-border pt-4`
- **Change Role**: `Select` dropdown, `flex-1`, shows current role, selecting a different role triggers confirmation dialog
- **Disable/Enable**: `Button` with `outline` variant, `flex-1`
  - When active: "Disable User" with `UserX` icon, `text-destructive` on hover
  - When disabled: "Enable User" with `UserCheck` icon, `text-success` on hover

---

### Edit Actions — Confirmation Dialogs

All admin actions that modify user state require explicit confirmation.

#### Role Change Confirmation

- **Trigger**: Selecting a different role in the Change Role dropdown
- **Dialog content**:
  - Title: "Change user role"
  - Description: "Are you sure you want to change **{displayName}**'s role from **{currentRole}** to **{newRole}**?"
  - Icon: `Shield` in amber accent container
- **Buttons**: "Cancel" (outline) + "Change Role" (primary)
- **On confirm**: API call, optimistic update, success toast

#### Enable/Disable Confirmation

- **Trigger**: Clicking Disable/Enable button
- **Dialog content (disable)**:
  - Title: "Disable user account"
  - Description: "This will prevent **{displayName}** from logging in. Their data will be preserved. You can re-enable this account at any time."
  - Icon: `UserX` in destructive container
- **Buttons**: "Cancel" (outline) + "Disable Account" (destructive variant)
- **Dialog content (enable)**:
  - Title: "Enable user account"
  - Description: "This will allow **{displayName}** to log in again."
  - Icon: `UserCheck` in success container
- **Buttons**: "Cancel" (outline) + "Enable Account" (primary variant)
- **On confirm**: API call, optimistic update, success toast

#### Delete User Confirmation

- **Trigger**: "Delete user" from actions dropdown
- **Dialog content**:
  - Title: "Delete user permanently"
  - Description: "This will permanently delete **{displayName}**'s account and all associated data ({{collectionCount}} collections, {{itemCount}} items). This action cannot be undone."
  - Icon: `Trash2` in destructive container
  - **Confirmation input**: Text input requiring user to type the display name to confirm (prevents accidental deletion)
- **Buttons**: "Cancel" (outline) + "Delete User" (destructive variant, disabled until name matches)
- **On confirm**: API call, redirect to user list, success toast

---

### Pagination

Position: Below the data table, within the table card container.

#### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Showing 1-20 of 156 users          ‹ 1 2 3 … 8 ›   20 per page │
└──────────────────────────────────────────────────────────────────┘
```

- **Container**: `flex items-center justify-between`, `px-4 py-3`, `border-t border-border`
- **Summary**: `body-sm`, `--muted-foreground`, "Showing {start}-{end} of {total} users"
- **Page controls**: `flex items-center gap-1`
- **Page buttons**: `h-8 w-8`, `--radius-md`, `ghost` variant
  - Current page: `bg-primary text-primary-foreground` (filled, stands out)
  - Other pages: `ghost` variant (just text, subtle hover)
  - Disabled (prev/next at bounds): `opacity-50 pointer-events-none`
- **Ellipsis**: "…" text when there are many pages (show first, last, and 2 around current)
- **Page size select**: `Select` component, options: 10, 20, 50 — default 20
- **Page size label**: "per page" in `body-sm`, `--muted-foreground`

#### Responsive Behavior

- **Desktop**: Full layout — summary, controls, page size
- **Tablet**: Same as desktop
- **Mobile**: Summary hidden, controls centered, page size hidden (fixed at 20)

---

### User Management — Empty State

When there are no users (unlikely but handles edge case):

- **Icon**: `Users` (Lucide), 48×48px, `--muted-foreground/50`
- **Message**: "No users found" — `h4` typography
- **Submessage**: "Users will appear here when they register." — `body-sm`, `--muted-foreground`
- **No CTA** — admin can't create users directly (users self-register)

### User Management — No Results State

When search/filter returns empty:

- **Icon**: `Search` (Lucide), 48×48px, `--muted-foreground/50`
- **Message**: "No users match your search" — `h4` typography
- **Submessage**: "Try adjusting your search or filters." — `body-sm`, `--muted-foreground`
- **Action**: "Clear filters" text button (`ghost` variant)

---

### User Management — Loading State

- **Search/filter bar**: Shows immediately (no skeleton)
- **Table**: Show `loadingRows={8}` via DataTable's built-in skeleton, matching column widths
- **Pagination**: Skeleton bar `h-10 w-full --radius-md`

---

### User Management — Responsive Summary

| Breakpoint | Layout Changes |
|------------|---------------|
| Desktop (≥1024px) | Full table, all columns visible, hover-reveal actions, side panel sheet for detail |
| Tablet (768–1023px) | Hide "Last Active" column, same sheet detail |
| Mobile (<768px) | Hide "Status" and "Last Active" columns, actions always visible, sheet full-width, pagination simplified |

---

## System Settings

### Design Philosophy

System settings should feel like a professional control panel — organized, clear, no surprises. Each setting category lives in its own card, with form controls that provide immediate feedback on validation. The design follows the "card-per-section" pattern established in the Profile page design — settings are grouped logically, each section is independently saveable, and changes within a section are tracked for unsaved-changes indicators.

**Key aesthetic decisions:**
- **Card per category** — visual separation between setting groups, clear scope boundaries
- **Section headers inside cards** — title + description gives context without external documentation
- **Save per section** — changes in "General" don't require saving "Security" too
- **Unsaved changes indicator** — amber dot appears next to section title when form is dirty
- **Success feedback via toast** — not inline success messages (they clutter the form)
- **Error feedback inline** — field-level validation errors appear immediately

---

### Overall Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header                                                  │
│  "System Settings" — h1 typography                           │
│  "Configure platform behavior and security policies"          │
│  gap: --space-8 (32px)                                       │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │  General Settings                                     │    │
│  │  App name, description, defaults...                   │    │
│  └──────────────────────────────────────────────────────┘    │
│  gap: --space-6 (24px)                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Security                                             │    │
│  │  Password policy, sessions, registration...           │    │
│  └──────────────────────────────────────────────────────┘    │
│  gap: --space-6 (24px)                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Features                                             │    │
│  │  Feature flags with descriptions...                   │    │
│  └──────────────────────────────────────────────────────┘    │
│  gap: --space-6 (24px)                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Storage                                              │    │
│  │  Upload limits, file types...                         │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

- **Page max-width**: `max-w-3xl` (768px) — settings pages should be narrow and focused, not stretched across wide screens
- **Centered**: `mx-auto`
- **Cards gap**: `--space-6` (24px)

---

### Settings Card Pattern

Each settings section follows an identical card structure:

#### Card Container

- **Background**: `--card`
- **Border**: `1px solid --border`
- **Border radius**: `--radius-lg` (12px)
- **Padding**: `p-6`
- **Shadow**: none (flat cards — settings are functional, not decorative)

#### Card Header

```
┌──────────────────────────────────────────────────────────────┐
│  General Settings  ●                                         │
│  Configure the basic platform information.                   │
│                                                              │
│  ──────────── divider ────────────                           │
```

- **Title**: `h3` typography (20px, Plus Jakarta Sans, weight 600), `--foreground`
- **Unsaved indicator**: Amber dot (`w-2 h-2 rounded-full bg-accent`) appears inline after title when form state differs from saved state, with `fade` entrance animation
- **Description**: `body-sm` (14px), `--muted-foreground`, `mt-1`
- **Divider**: `border-b border-border`, `mt-4 mb-6` — separates header from form fields

#### Form Fields Layout

- **Field stack**: `space-y-5` (20px between fields)
- **Label**: `body-sm` (14px), weight 500, `--foreground`, `mb-1.5`
- **Input/Select/Toggle**: Full width within card (no side-by-side labels on mobile)
- **Help text**: `caption` (12px), `--muted-foreground`, `mt-1.5` — appears below input
- **Error text**: `caption` (12px), `--destructive`, `mt-1.5` — replaces help text on error
- **Desktop side-by-side**: On ≥768px, labels can optionally sit left (`w-1/3`) with inputs right (`w-2/3`) in a `flex` row — but for simplicity and mobile consistency, stack vertically by default

#### Card Footer (Save)

```
│  ──────────── divider ────────────                           │
│                                              [Save Changes]  │
└──────────────────────────────────────────────────────────────┘
```

- **Divider**: `border-t border-border`, `mt-6 pt-4`
- **Button**: `Button` primary variant, aligned right (`flex justify-end`)
- **Label**: "Save Changes" (i18n: `admin.settings.save`)
- **Disabled state**: Button is disabled when form is clean (no changes) — `opacity-50 pointer-events-none`
- **Loading state**: Button shows spinner + "Saving..." while API call is in-flight
- **On success**: Toast "Settings saved" — form state resets to match new saved state, unsaved indicator disappears
- **On error**: Toast "Failed to save settings" with error detail, form state preserved

---

### General Settings Section

| Field | Type | Label | Help Text | Validation |
|-------|------|-------|-----------|------------|
| App Name | `Input` | "Application name" | "The name shown in the sidebar and page titles" | Required, max 50 chars |
| App Description | `Textarea` | "Description" | "A brief description of this GeekVault instance" | Optional, max 200 chars, `rows={3}` |
| Default Language | `Select` | "Default language" | "Language for new user accounts" | Options: English, Português |
| Default Currency | `Select` | "Default currency" | "Currency used for value and price displays" | Options: USD ($), EUR (€), GBP (£), BRL (R$) |

**i18n keys:** `admin.settings.general.title`, `admin.settings.general.description`, `admin.settings.general.appName`, `admin.settings.general.appDescription`, `admin.settings.general.defaultLanguage`, `admin.settings.general.defaultCurrency`

---

### Security Settings Section

| Field | Type | Label | Help Text | Validation |
|-------|------|-------|-----------|------------|
| Minimum Password Length | `Input` (number) | "Minimum password length" | "Minimum characters required for user passwords" | Min 6, max 128, default 8 |
| Require Uppercase | Toggle (`Switch`) | "Require uppercase letter" | "Passwords must contain at least one uppercase letter" | Boolean |
| Require Number | Toggle (`Switch`) | "Require number" | "Passwords must contain at least one number" | Boolean |
| Require Special Character | Toggle (`Switch`) | "Require special character" | "Passwords must contain at least one special character (!@#$...)" | Boolean |
| Session Timeout | `Input` (number) | "Session timeout (minutes)" | "How long before inactive sessions expire. 0 = never" | Min 0, max 10080 (7 days), default 1440 (24h) |
| Allow Registration | Toggle (`Switch`) | "Allow public registration" | "When disabled, only admins can create new accounts" | Boolean, default true |

#### Toggle (Switch) Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Require uppercase letter                      [ ○────── ]   │
│  Passwords must contain at least one uppercase letter        │
└──────────────────────────────────────────────────────────────┘
```

- **Container**: `flex items-start justify-between gap-4`
- **Left side**: Label + help text stacked vertically
- **Right side**: `Switch` component, vertically centered with label
- **Switch active color**: `bg-primary` (warm charcoal)
- **Switch track**: `w-11 h-6`, `--radius-full`

**i18n keys:** `admin.settings.security.title`, `admin.settings.security.description`, `admin.settings.security.minPasswordLength`, `admin.settings.security.requireUppercase`, `admin.settings.security.requireNumber`, `admin.settings.security.requireSpecial`, `admin.settings.security.sessionTimeout`, `admin.settings.security.allowRegistration`

---

### Features Settings Section

Feature flags presented as toggle switches with descriptions. This section is designed to be extensible — new feature flags can be added without layout changes.

| Feature | Label | Description | Default |
|---------|-------|-------------|---------|
| Wishlist | "Wishlist" | "Allow users to create and manage wishlists for desired items" | true |
| Import/Export | "Import & Export" | "Allow users to import and export collection data via CSV" | true |
| Image Uploads | "Image uploads" | "Allow users to upload images for items and owned copies" | true |
| Public Profiles | "Public profiles" | "Allow users to make their collection profiles publicly viewable" | false |
| Value Tracking | "Value tracking" | "Show estimated value and price tracking features" | true |

#### Feature Toggle Layout

Each toggle follows the same Switch layout as Security toggles:

```
┌──────────────────────────────────────────────────────────────┐
│  Wishlist                                      [ ●══════ ]   │
│  Allow users to create and manage wishlists                  │
│                                                              │
│  ─────────── divider ───────────                             │
│                                                              │
│  Import & Export                                [ ●══════ ]   │
│  Allow users to import and export collection data via CSV    │
│                                                              │
│  ─────────── divider ───────────                             │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

- **Between toggles**: `border-b border-border` divider with `py-4` spacing
- **Last toggle**: No bottom divider

**i18n keys:** `admin.settings.features.title`, `admin.settings.features.description`, `admin.settings.features.wishlist`, `admin.settings.features.importExport`, `admin.settings.features.imageUploads`, `admin.settings.features.publicProfiles`, `admin.settings.features.valueTracking` (each with `.label` and `.description` suffixes)

---

### Storage Settings Section

| Field | Type | Label | Help Text | Validation |
|-------|------|-------|-----------|------------|
| Max Upload Size | `Input` (number) | "Maximum upload size (MB)" | "Maximum file size for image uploads" | Min 1, max 50, default 5 |
| Allowed File Types | Checkbox group | "Allowed file types" | "File formats accepted for image uploads" | At least one required |

#### File Types Checkbox Group

```
┌──────────────────────────────────────────────────────────────┐
│  Allowed file types                                          │
│  File formats accepted for image uploads                     │
│                                                              │
│  ☑ JPEG (.jpg, .jpeg)      ☑ PNG (.png)                    │
│  ☑ WebP (.webp)            ☐ GIF (.gif)                    │
│  ☐ AVIF (.avif)            ☐ SVG (.svg)                    │
└──────────────────────────────────────────────────────────────┘
```

- **Layout**: `grid grid-cols-2 gap-3` on desktop, `grid-cols-1` on mobile
- **Each checkbox**: `flex items-center gap-2`
- **Checkbox**: Standard checkbox input, `h-4 w-4`, `--radius-sm`, checked color `--primary`
- **Label**: `body-sm` (14px), weight 400
- **Extension hint**: `caption` (12px), `--muted-foreground`, inline after label

**i18n keys:** `admin.settings.storage.title`, `admin.settings.storage.description`, `admin.settings.storage.maxUploadSize`, `admin.settings.storage.allowedFileTypes`

---

### System Settings — Feedback Patterns

| Event | Feedback |
|-------|----------|
| Save success | Toast: "Settings saved" (success variant) — amber checkmark icon |
| Save failure | Toast: "Failed to save settings" (error variant) with error message detail |
| Validation error | Inline below field: red text replaces help text, field border turns `--destructive` |
| Unsaved changes | Amber dot next to section title (fade in), save button becomes enabled |
| Leave with unsaved | Browser `beforeunload` prompt — "You have unsaved changes. Are you sure you want to leave?" |
| Loading initial data | Skeleton: card outlines with `SkeletonRect` for each field group |

---

### System Settings — Loading State

- **Page header**: Shows immediately (static content)
- **Each card**: Card shell renders immediately, content replaced with skeletons
- **Skeleton per card**: Title (w-1/3 h-6) + description (w-2/3 h-4) + 3-4 field skeletons (full-width h-10 with label skeletons w-1/4 h-4)
- **Stagger**: Cards use `StaggerChildren` entrance animation with 60ms stagger once data loads

---

### System Settings — Responsive Summary

| Breakpoint | Layout Changes |
|------------|---------------|
| Desktop (≥1024px) | `max-w-3xl mx-auto`, cards with `p-6`, side-by-side checkbox grid (2 cols) |
| Tablet (768–1023px) | Same as desktop — narrow layout fits naturally |
| Mobile (<768px) | Full width (`px-4`), cards with `p-4`, checkbox grid single column, sticky save button at bottom of each card |

---

### Implementation Notes

- **Component location**: `src/web/src/features/admin/admin-users-page.tsx` and `src/web/src/features/admin/admin-settings-page.tsx`
- **Shared sub-components**: `src/web/src/features/admin/components/` — consider `UserDetailSheet`, `RoleChangeDialog`, `StatusToggleDialog`, `DeleteUserDialog`, `SettingsCard`
- **DataTable reuse**: User list uses the existing `DataTable` component from `components/ds/data-table.tsx` — no new table component needed
- **Sheet reuse**: User detail uses the existing `Sheet` component from `components/ui/sheet.tsx`
- **Form state**: Use React `useState` or a lightweight form library for tracking dirty state per settings section. Each section has independent form state.
- **Unsaved changes**: Track via comparing current form values to last-saved values. The amber dot is a simple `isDirty` check per section.
- **Pagination**: Client-side for MVP (admin user counts are typically low). Upgrade to server-side pagination if user count exceeds ~500.
- **i18n**: All labels, placeholders, help text, toast messages, and dialog content need keys in both `en.json` and `pt.json`
- **Accessibility**: All form fields must have proper `label` elements with `htmlFor`, toggle switches need `aria-checked`, destructive dialogs need focus trap, delete confirmation input needs `aria-describedby` linking to the warning text
- **No new design tokens**: Both pages use existing Warm Obsidian palette, badge variants, and data table patterns. No new CSS custom properties needed.

---

## Analytics Dashboard

### Design Philosophy

The analytics dashboard is the admin's **bird's-eye view** — it answers "how is the platform doing?" at a glance. It mirrors the user dashboard's visual language (stat cards, chart cards, warm palette) but surfaces platform-wide metrics instead of personal collection data. This creates a sense of continuity: admin tools feel like a natural extension of the main app, not a foreign control panel.

**Key aesthetic decisions:**
- **Stat cards match the user dashboard** — same `StatCard` component, same amber icon containers, same hover behavior. Admins are also collectors; the visual language should feel familiar.
- **Charts use the same `--chart-*` token palette** — consistent with the user dashboard's recharts styling. No separate admin chart colors.
- **Growth charts use line + bar** — line for trends over time (user signups), bar for discrete counts (collections created). Different chart types for different data shapes.
- **Usage tables are lightweight** — no full DataTable overhead for 5-row summary tables. Simple styled `<table>` elements with the same typography and row patterns.
- **Time range selector is a segmented button group** — not a dropdown. Admins toggle between ranges frequently; visible options reduce click count.
- **Section structure flows top-to-bottom**: stats → growth charts → usage breakdown — mirroring the user dashboard's stats → charts → summaries → table flow.

---

### Overall Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header                                                  │
│  "Analytics" — h1 typography                                  │
│  "Platform metrics and usage insights"                        │
│  [7d] [30d] [90d] [All time]  ← Time range selector          │
│  gap: --space-8 (32px)                                        │
├──────────────────────────────────────────────────────────────┤
│  Stats Row (4 cards)                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│  │Users │ │Active│ │Collns│ │Items │                          │
│  └──────┘ └──────┘ └──────┘ └──────┘                        │
│  gap: --space-8 (32px)                                        │
├──────────────────────────────────────────────────────────────┤
│  Growth Charts Section (2-column grid)                        │
│  ┌─────────────────┐ ┌─────────────────┐                     │
│  │  Line: User      │ │  Bar: Collections│                    │
│  │  Signups         │ │  Created          │                    │
│  └─────────────────┘ └─────────────────┘                     │
│  gap: --space-8 (32px)                                        │
├──────────────────────────────────────────────────────────────┤
│  Usage Breakdown (3-column grid)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ Most      │ │ Largest   │ │ Popular   │                    │
│  │ Active    │ │ Collns    │ │ Types     │                    │
│  │ Users     │ │           │ │ (bar)     │                    │
│  └──────────┘ └──────────┘ └──────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

- **Section spacing**: `--space-8` (32px) between all major sections
- **Page container**: Uses the standard admin content area (padding `px-6 py-6` desktop, `px-4 py-6` tablet, `px-4 py-4` mobile)
- **No max-width constraint** — analytics benefits from horizontal space for charts and tables

---

### Page Header with Time Range Selector

#### Header Content

- **Title**: "Analytics" — `h1` typography (30px, Plus Jakarta Sans, weight 700, letter-spacing -0.02em)
- **Subtitle**: "Platform metrics and usage insights" — `body-lg` (18px, Inter, weight 400), `--muted-foreground`
- **Layout**: `flex items-start justify-between flex-wrap gap-4` — title+subtitle left, time range right

#### Time Range Selector

A segmented button group positioned to the right of the page title.

- **Options**: "7d", "30d", "90d", "All time"
- **Container**: `inline-flex`, `--radius-lg` (12px), `border border-border`, `bg-muted`, `p-1` (4px padding inside)
- **Each button**: `px-3 py-1.5`, `--radius-md` (8px), `text-xs font-medium`
  - **Default**: `text-muted-foreground`, no background, `hover:text-foreground`
  - **Active**: `bg-card text-foreground`, `--shadow-sm`, `border border-border/50` — elevated pill within the track
- **Transition**: Active pill slides between positions — `transition-all duration-150` on background/shadow
- **Default selection**: "30d" (most useful timeframe for platform health)

#### Responsive Behavior

- **Desktop**: Title left, time range right, same row
- **Tablet**: Same as desktop
- **Mobile**: Title full width, time range full width below — `flex-col`, time range `self-start`

#### i18n Keys

- `admin.analytics.title`: "Analytics"
- `admin.analytics.subtitle`: "Platform metrics and usage insights"
- `admin.analytics.range.7d`: "7d"
- `admin.analytics.range.30d`: "30d"
- `admin.analytics.range.90d`: "90d"
- `admin.analytics.range.all`: "All time"

---

### Platform Stats Row

Uses the same `StatCard` component as the user dashboard — same visual treatment, different metrics.

#### Metrics (4 cards)

| Position | Metric | Icon (Lucide) | Format | i18n Key |
|----------|--------|---------------|--------|----------|
| 1 | Total Users | `Users` | Integer with AnimatedNumber | `admin.analytics.totalUsers` |
| 2 | Active Users (30d) | `UserCheck` | Integer with AnimatedNumber | `admin.analytics.activeUsers` |
| 3 | Total Collections | `Library` | Integer with AnimatedNumber | `admin.analytics.totalCollections` |
| 4 | Total Items | `Package` | Integer with AnimatedNumber | `admin.analytics.totalItems` |

#### Card Design

Identical to user dashboard stat cards:

- **Container**: `--radius-lg` (12px), `--border` border, `--card` background, `--shadow-sm`
- **Padding**: `--space-5` (20px) all sides
- **Layout**: Horizontal — icon left, text right
- **Icon container**: 40×40px, `--radius-md` (8px), `--accent/10` background (subtle amber tint), icon in `--accent` color, 20px icon size
- **Label**: `body-sm` (14px, Inter, weight 400), `--muted-foreground`
- **Value**: `h2` (24px, Plus Jakarta Sans, weight 600), `--foreground`, `tabular-nums`
- **Hover**: `y: -2px`, shadow → `--shadow-md`, border → `--accent/10`, `springDefault` transition

#### Active Users Note

The "Active Users (30d)" metric always shows the 30-day window regardless of the time range selector — it's a rolling metric, not a filtered one. A small "30d" pill in `caption` typography and `--muted-foreground` appears next to the label to clarify this.

#### Grid Layout

- **Desktop (≥1024px)**: `grid-cols-4`, gap `--space-4` (16px) — all 4 in one row
- **Tablet (768px–1023px)**: `grid-cols-2`, gap `--space-4` — 2×2 grid
- **Mobile (<768px)**: `grid-cols-2`, gap `--space-3` (12px) — 2×2 grid

#### Animation

- Container: `StaggerChildren` with 60ms stagger
- Each card: `scale` entrance (opacity 0→1, scale 0.95→1, 200ms)

---

### Growth Charts Section

Two chart cards showing temporal trends. These respond to the time range selector — data and axis labels adjust to the selected window.

#### Layout

- **Desktop**: `grid-cols-2`, gap `--space-6` (24px)
- **Tablet**: `grid-cols-2`, gap `--space-4` (16px)
- **Mobile**: `grid-cols-1`, gap `--space-4` — charts stack vertically

#### Chart Card Container

Same card treatment as user dashboard charts:

- **Container**: `--radius-lg`, `--border`, `--card` background, `--shadow-sm`
- **Card header**: `h3` title (20px, Plus Jakarta Sans, weight 600), padding `--space-5` top/sides, `--space-3` bottom
- **Card content**: padding `--space-5` sides, `--space-4` bottom
- **Chart area height**: 256px (h-64)

#### Line Chart — "User Signups"

- **Chart type**: `LineChart` from recharts with `Line` component
- **Line styling**: `stroke={hsl(var(--chart-1))}` (amber), `strokeWidth={2}`, `dot={false}` for clean line, `activeDot={{ r: 4, fill: hsl(var(--chart-1)), stroke: hsl(var(--card)), strokeWidth: 2 }}` — amber dot with card-colored ring on hover
- **Area fill**: `AreaChart` with `Area` instead of pure `LineChart` — `fill={hsl(var(--chart-1))}`, `fillOpacity={0.08}` for subtle amber gradient under the line. Adds visual weight without clutter.
- **CartesianGrid**: `strokeDasharray="3 3"`, stroke `hsl(var(--border))` — theme-aware
- **XAxis**: Date labels in `caption` typography (12px), fill `hsl(var(--muted-foreground))`, tick format varies by range:
  - 7d: Day names ("Mon", "Tue", ...)
  - 30d: "Mar 1", "Mar 8", "Mar 15", "Mar 22" (weekly)
  - 90d: "Jan", "Feb", "Mar" (monthly)
  - All time: "2025 Q3", "2025 Q4", "2026 Q1" (quarterly)
- **YAxis**: `allowDecimals={false}`, `caption` typography, fill `hsl(var(--muted-foreground))`, hide axis line
- **Tooltip**: Custom styled — `--card` bg, `--border` border, `--radius-md`, `--shadow-md`, `--space-2 --space-3` padding. Shows date + signup count.
- **Empty state**: Dashed horizontal line at y=0 with muted message "No signup data for this period" centered

#### Bar Chart — "Collections Created"

- **Chart type**: `BarChart` from recharts with `Bar` component
- **Bar styling**: `fill={hsl(var(--chart-2))}` (blue — deliberately different from the amber line chart for visual distinction), `radius={[6, 6, 0, 0]}` (rounded top corners matching `--radius-sm`)
- **CartesianGrid**: Same as line chart
- **XAxis**: Same date formatting as line chart (responds to time range selector)
- **YAxis**: Same as line chart — `allowDecimals={false}`, hide axis line
- **Tooltip**: Same custom tooltip style. Shows date + collection count.
- **Bar hover**: Active bar shifts to `fill={hsl(var(--chart-2))}` with increased opacity — subtle brightening effect
- **Empty state**: Same pattern as line chart — "No collection data for this period"

#### Animation

- Chart cards enter together with `slideUp` entrance (opacity 0→1, y 16→0, 250ms)
- Charts use recharts `isAnimationActive` with 800ms duration for initial data render

#### i18n Keys

- `admin.analytics.userSignups`: "User Signups"
- `admin.analytics.collectionsCreated`: "Collections Created"

---

### Usage Breakdown Section

Three cards showing ranked data: top users, largest collections, and popular collection types. These provide actionable insights — who's most engaged, what's growing, and what categories dominate.

#### Layout

- **Desktop (≥1024px)**: `grid-cols-3`, gap `--space-6` (24px)
- **Tablet (768px–1023px)**: `grid-cols-2` — first row: Most Active Users + Largest Collections, second row: Popular Types spans `col-span-2`
- **Mobile (<768px)**: `grid-cols-1`, gap `--space-4` — all three stack

#### Card Container (shared)

- **Container**: `--radius-lg`, `--border`, `--card` background, `--shadow-sm`
- **Card header**: `h3` title (20px, Plus Jakarta Sans, weight 600), padding `--space-5` top/sides, `--space-3` bottom, `border-b border-border`
- **Card content**: padding `--space-0` (table/chart fills to edges, with internal padding per row)

---

#### Most Active Users Table

A compact 5-row summary table — no pagination, no filtering. This is a snapshot, not a management tool.

**Column definitions:**

| Column | Cell Content | Width |
|--------|-------------|-------|
| Rank | `#1`, `#2`, etc. — `caption` (12px), `--muted-foreground` | 32px fixed |
| User | Avatar (24×24, `--radius-full`) + Display Name (`body-sm`, weight 500) | flex-1 |
| Activity | Action count (`body-sm`, weight 600, `--foreground`, `tabular-nums`) | 64px fixed, right-aligned |

**Row specifications:**

- **Row height**: 48px
- **Row padding**: `px-5 py-0` (aligns with card header padding)
- **Row separator**: `border-b border-border/50` (lighter than table header border)
- **Last row**: No bottom border
- **Row hover**: `--foreground/4` background
- **Row click**: Navigates to `/admin/users` with that user selected (opens user detail sheet)

**Rank styling:**

- `#1`: `--accent` color (amber) + `font-medium` — gold medal treatment
- `#2`: `--muted-foreground` with `font-medium`
- `#3–#5`: `--muted-foreground` with `font-normal`

**User cell layout:**

```
┌───────────────────────────┐
│ ┌──┐  Display Name        │
│ │AV│                      │
│ └──┘                      │
└───────────────────────────┘
```

- Avatar: 24×24px, `--radius-full`
- Avatar fallback: Initials, `text-[10px] font-medium` on `bg-muted`
- Gap between avatar and name: `--space-2` (8px)

**Activity metric**: Total actions (logins + creates + edits + deletes) within the selected time range. Displayed as integer count.

**Empty state**: "No user activity in this period" — `body-sm`, `--muted-foreground`, centered in card content area, `py-8`

#### i18n Key

- `admin.analytics.mostActiveUsers`: "Most Active Users"
- `admin.analytics.activity`: "Activity"

---

#### Largest Collections Table

Same compact 5-row table pattern as Most Active Users.

**Column definitions:**

| Column | Cell Content | Width |
|--------|-------------|-------|
| Rank | `#1`, `#2`, etc. — same styling as active users | 32px fixed |
| Collection | Collection name (`body-sm`, weight 500) + Owner name (`caption`, `--muted-foreground`) stacked | flex-1 |
| Items | Item count (`body-sm`, weight 600, `--foreground`, `tabular-nums`) | 56px fixed, right-aligned |

**Row specifications**: Identical to Most Active Users table (48px height, same padding, same hover, same separators).

**Collection cell layout:**

```
┌───────────────────────────┐
│  Collection Name           │
│  by Owner Name             │
└───────────────────────────┘
```

- Name: `body-sm` (14px), weight 500, `--foreground`, single line truncate
- Owner: `caption` (12px), weight 400, `--muted-foreground`, "by {name}" format
- Stack gap: `--space-0.5` (2px)

**Rank styling**: Same amber #1 treatment as active users.

**Row click**: Navigates to the collection page (if accessible to admin).

**Empty state**: "No collections yet" — same treatment as active users empty state.

#### i18n Keys

- `admin.analytics.largestCollections`: "Largest Collections"
- `admin.analytics.items`: "Items"
- `admin.analytics.byOwner`: "by {{name}}"

---

#### Popular Collection Types — Horizontal Bar Chart

Instead of a third table, this card uses a horizontal bar chart for visual variety. Bars are ranked by collection count, providing instant visual comparison.

**Chart type**: `BarChart` from recharts with `layout="vertical"`

**Visual specifications:**

- **Bar**: `fill={hsl(var(--chart-1))}` (amber), `radius={[0, 4, 4, 0]}` (rounded right corners)
- **Bar height**: `barSize={20}` — compact bars with generous spacing
- **YAxis** (category axis, left side): Type name in `body-sm` (14px), fill `hsl(var(--foreground))`, weight 400, `width={120}`, `type="category"`, `dataKey="name"`
- **XAxis** (value axis, bottom): `allowDecimals={false}`, `caption` typography, fill `hsl(var(--muted-foreground))`, hide axis line
- **CartesianGrid**: Vertical lines only — `vertical={true} horizontal={false}`, `strokeDasharray="3 3"`, stroke `hsl(var(--border))`
- **Tooltip**: Same custom tooltip style. Shows type name + count + percentage of total.
- **Chart area height**: Fits content — `height={max(200, types.length * 40 + 40)}`, min 200px, grows with data
- **Content padding**: `--space-5` sides, `--space-4` bottom (matches other chart cards)
- **Bar label**: Count value displayed at the end of each bar — `body-sm`, `--foreground`, weight 500, `tabular-nums`, offset `8px` right of bar end
- **Max items**: Show top 5 collection types. If fewer than 5 exist, show all.

**Bar hover**: Individual bar shifts to `fill={hsl(var(--accent))}` — same warm glow effect as user dashboard bar chart.

**Empty state**: "No collection types defined yet" — `body-sm`, `--muted-foreground`, centered, `py-8`

#### i18n Keys

- `admin.analytics.popularTypes`: "Popular Collection Types"
- `admin.analytics.collections`: "Collections"

---

### Analytics — Loading State

- **Page header + time range**: Show immediately (static content)
- **Stat cards**: 4 skeleton cards matching stat card dimensions — `h-[100px]`, `--radius-lg`, pulse animation
- **Growth charts**: 2 skeleton cards matching chart card dimensions — `h-[340px]` (header + chart area), `--radius-lg`, pulse animation
- **Usage breakdown**: 3 skeleton cards — `h-[300px]`, `--radius-lg`, pulse animation
- **Stagger**: All skeleton sections use `StaggerChildren` entrance with 60ms stagger

---

### Analytics — Empty State

When the platform is brand new with zero data (no users beyond the admin, no collections):

- **Stats row**: Shows all zeros with AnimatedNumber (animate from 0 to 0 still triggers the counter entrance)
- **Charts**: Show empty states within their cards — the dashed-line/message pattern described in each chart section
- **Usage tables**: Show their individual empty states
- **No page-level empty state** — each section handles its own emptiness. The stats row with zeros still provides context ("there is a platform, it just has no data yet")

---

### Analytics — Responsive Summary

| Breakpoint | Layout Changes |
|------------|---------------|
| Desktop (≥1024px) | 4-col stats, 2-col charts, 3-col usage breakdown, time range right-aligned with title |
| Tablet (768–1023px) | 2-col stats (2×2), 2-col charts, 2-col usage (types spans 2), time range right-aligned |
| Mobile (<768px) | 2-col stats (2×2), charts stack, usage stacks, time range below title, tables scroll horizontally if needed |

---

## Audit Log

### Design Philosophy

The audit log is the admin's **accountability trail** — it answers "who did what, and when?" Every action that modifies platform state should be traceable here. The design prioritizes scannability and density: admins reviewing audit logs need to process many entries quickly, scanning for patterns, anomalies, or specific events.

**Key aesthetic decisions:**
- **Dense data table as the hero** — audit logs are inherently tabular; no cards, no grid
- **Timestamp is the leftmost column** — time is the primary axis of investigation. Admins scan chronologically.
- **User column shows avatar + name** — visual anchoring, same pattern as User Management table
- **Action verb uses color-coded badges** — Create (green), Update (blue), Delete (red), Login (muted) — instant visual classification without reading text
- **Alternating row backgrounds disabled** — borders between rows are cleaner for dense data. Alternating bg competes with action badge colors.
- **Inline detail expansion** — clicking a row reveals a detail panel below it (accordion-style), avoiding the overhead of a modal or side sheet for a read-only view
- **Filters above the table** — action type, user, and date range filters reduce the dataset before scanning
- **CSV export** — audit data has compliance value; admins need to extract it for external review

---

### Overall Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header                                                  │
│  "Audit Log" — h1 typography                                  │
│  "Track all actions performed on the platform"                │
│  gap: --space-6 (24px)                                        │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Filter Bar                                           │    │
│  │  🔍 [Search...]  [Action ▼]  [User ▼]  [Date range]  │    │
│  │                                          [Export CSV]  │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  Data Table                                           │    │
│  │  Timestamp │ User │ Action │ Target │ Details          │    │
│  │  ...       │ ...  │ ...    │ ...    │ ...              │    │
│  │  ▼ Expanded detail row                                │    │
│  │  ...       │ ...  │ ...    │ ...    │ ...              │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  Pagination                                           │    │
│  │  Showing 1-20 of 1,234 entries    ‹ 1 2 3 … 62 ›    │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

- **Table + filters + pagination are inside a single card** — same container pattern as User Management
- **No max-width constraint** — audit logs benefit from horizontal space

---

### Page Header

- **Title**: "Audit Log" — `h1` typography (30px, Plus Jakarta Sans, weight 700, letter-spacing -0.02em)
- **Subtitle**: "Track all actions performed on the platform" — `body-lg` (18px, Inter, weight 400), `--muted-foreground`
- **Gap below header**: `--space-6` (24px) before the table card

#### i18n Keys

- `admin.auditLog.title`: "Audit Log"
- `admin.auditLog.subtitle`: "Track all actions performed on the platform"

---

### Filter Bar

Position: Top of the table card, separated from table by `border-b border-border`.

#### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ 🔍 [Search entries...     ]  [Action ▼] [User ▼] [Date range 📅] │
│                                                    [Export CSV ↓] │
└──────────────────────────────────────────────────────────────────┘
```

- **Container**: `flex items-center gap-3 flex-wrap`, `py-4 px-4`
- **Search + filters**: `flex-1 flex items-center gap-3 flex-wrap`
- **Export button**: `ml-auto`, does not wrap with filters

#### Search Input

- **Icon**: `Search` (Lucide), 16×16px, `--muted-foreground`, `absolute left-3`
- **Input**: `pl-9 h-9`, `--radius-md`, `border border-input`, placeholder "Search entries..."
- **Width**: `flex-1 min-w-[200px] max-w-[300px]`
- **Behavior**: Full-text search across all log entry fields (user name, action, target entity, details), debounced 300ms with `useDebounce`
- **Clear**: `X` icon when input has value, clears on click

#### Action Type Filter

- **Component**: `Select` from `components/ds/select.tsx`
- **Options**: "All actions" (default), "Create", "Update", "Delete", "Login", "Logout", "Export", "Import", "Settings Change"
- **Width**: `w-[150px]`
- **Behavior**: Filters by action type. Combinable with all other filters.

#### User Filter

- **Component**: `Select` with search (combobox variant) from `components/ds/select.tsx`
- **Options**: "All users" (default) + list of all users (avatar + display name as option label)
- **Width**: `w-[180px]`
- **Behavior**: Filters log entries by the acting user. Search within the dropdown filters the user list.

#### Date Range Picker

- **Component**: Custom date range — two `Input` fields (type="date") or a date range picker component
- **Layout**: `flex items-center gap-1.5` — "From" input + "–" separator + "To" input
- **Each input**: `h-9 w-[130px]`, `--radius-md`, `border border-input`
- **Calendar icon**: `Calendar` (Lucide), 14×14px, `absolute right-3`, `--muted-foreground`
- **Behavior**: Filters entries within the date range (inclusive). Both dates optional — if only "from" is set, shows entries from that date onward. If only "to", shows up to that date.
- **Clear**: If either date is set, a small `X` appears on the container to clear both dates

#### Export CSV Button

- **Component**: `Button` with `outline` variant
- **Content**: `Download` icon (Lucide, 16×16px) + "Export CSV" text
- **Size**: `h-9`, `text-sm`
- **Placement**: Right-aligned, separated from filters by `ml-auto`
- **Loading state**: Icon switches to `Loader2` with `animate-spin`, text changes to "Exporting...", button disabled
- **On click**: Triggers CSV download of currently filtered entries (all pages, not just current page)
- **Filename format**: `geekvault-audit-log-{YYYY-MM-DD}.csv`
- **Success feedback**: Toast "Audit log exported" (success variant)

#### Responsive Behavior

- **Desktop**: All filters + export in single row
- **Tablet**: Search + action + user on first row, date range + export on second row
- **Mobile**: Search full width, each filter full width stacked, export full width at bottom

#### i18n Keys

- `admin.auditLog.search`: "Search entries..."
- `admin.auditLog.allActions`: "All actions"
- `admin.auditLog.allUsers`: "All users"
- `admin.auditLog.from`: "From"
- `admin.auditLog.to`: "To"
- `admin.auditLog.exportCsv`: "Export CSV"
- `admin.auditLog.exporting`: "Exporting..."
- `admin.auditLog.exportSuccess`: "Audit log exported"

---

### Audit Log — Data Table

Uses the existing `DataTable` component with audit-specific column configuration.

#### Table Container

Same card treatment as User Management table:

- **Background**: `--card`
- **Border radius**: `--radius-lg` (12px)
- **Border**: `1px solid --border`
- **Overflow**: `overflow-hidden` on container, `overflow-x-auto` on table wrapper

#### Columns

| Column | Header | Cell Content | Width | Responsive |
|--------|--------|-------------|-------|------------|
| Timestamp | `overline` | Date + time (see format below) | 160px fixed | Always visible (truncates to date-only on mobile) |
| User | `overline` | Avatar (24×24) + Display Name (`body-sm`, weight 500) | flex-1, min 140px | Always visible |
| Action | `overline` | Color-coded badge (see badge spec) | 100px fixed | Always visible |
| Target | `overline` | Entity type + name (`body-sm`) | flex-1, min 140px | Hidden on mobile |
| Details | `overline` | Summary text (`body-sm`, `--muted-foreground`) | flex-2, min 180px | Hidden on mobile, hidden on tablet |

#### Row Specifications

- **Row height**: Minimum 48px
- **Row separator**: `1px --border` between rows
- **Row hover**: `--foreground/4` background overlay
- **Row click**: Expands/collapses inline detail panel (accordion behavior)
- **Row cursor**: `cursor-pointer`
- **Expand indicator**: Small `ChevronDown` icon (12×12px, `--muted-foreground`), `absolute right-4`, rotates 180° when expanded — `transition-transform duration-150`

#### Timestamp Column

- **Format**: Two-line display
  - **Date**: `body-sm` (14px), weight 400, `--foreground` — "Mar 21, 2026"
  - **Time**: `caption` (12px), weight 400, `--muted-foreground` — "14:32:15"
- **Stack gap**: `--space-0.5` (2px)
- **Mobile**: Single line — "Mar 21, 14:32" in `body-sm`

#### User Column

Same avatar + name pattern as User Management, but smaller:

- **Avatar**: 24×24px, `--radius-full`
- **Avatar fallback**: Initials, `text-[10px]`
- **Name**: `body-sm` (14px), weight 500
- **Gap**: `--space-2` (8px)
- **System actions** (no user): Show `Bot` icon (Lucide, 24×24px, `--muted-foreground/50`) + "System" label in `--muted-foreground`

#### Action Badge Design

Action badges use the `Badge` component with semantic color variants:

| Action | Label | Background (light) | Text (light) | Background (dark) | Text (dark) |
|--------|-------|-------------------|--------------|-------------------|-------------|
| Create | "Create" | `--success/10` | `--success` (#16A34A) | `--success/15` | `--success` (#22C55E) |
| Update | "Update" | `--info/10` | `--info` (#2563EB) | `--info/15` | `--info` (#3B82F6) |
| Delete | "Delete" | `--destructive/10` | `--destructive` (#DC2626) | `--destructive/15` | `--destructive` (#EF4444) |
| Login | "Login" | `--muted` | `--muted-foreground` | `--muted` | `--muted-foreground` |
| Logout | "Logout" | `--muted` | `--muted-foreground` | `--muted` | `--muted-foreground` |
| Export | "Export" | `--accent/10` | `--accent` | `--accent/15` | `--accent` |
| Import | "Import" | `--accent/10` | `--accent` | `--accent/15` | `--accent` |
| Settings | "Settings" | `--warning/10` | `--warning` | `--warning/15` | `--warning` |

- **Size**: `text-xs`, `px-2 py-0.5`, `--radius-full`
- **Font weight**: 500
- **Rationale**: CRUD actions get semantic colors (green/blue/red) for instant visual pattern recognition. Auth actions (login/logout) are intentionally muted — they're high-volume, low-signal. Import/export use amber accent — they're significant platform actions. Settings changes use warning color — they affect platform behavior.

#### Target Column

- **Content**: Entity type prefix + entity name
  - Format: "Collection: My Comics", "User: john@example.com", "Settings: Security", "CatalogItem: Batman #1"
  - Entity type in `caption` (12px), `--muted-foreground`, uppercase
  - Entity name in `body-sm` (14px), weight 400, `--foreground`
- **Layout**: Stacked — type above, name below, gap `--space-0.5`
- **Truncation**: Name truncates with ellipsis if too long — `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`

#### Details Summary Column

- **Content**: Brief human-readable summary of the action
  - Examples: "Changed role from User to Admin", "Deleted 3 items", "Updated password policy", "Logged in from 192.168.1.1"
- **Typography**: `body-sm` (14px), `--muted-foreground`
- **Truncation**: Single line, truncates with ellipsis

---

### Inline Detail Expansion

Clicking a row reveals a detail panel below it — accordion-style, pushes subsequent rows down.

#### Expansion Animation

- **Enter**: Height from 0 → auto, opacity 0 → 1, 200ms, ease-enter curve
- **Exit**: Height auto → 0, opacity 1 → 0, 150ms, ease-exit curve
- **Implementation**: Framer Motion `AnimatePresence` with `initial={{ height: 0, opacity: 0 }}` `animate={{ height: "auto", opacity: 1 }}`

#### Detail Panel Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Full Event Details                                     │  │
│  │                                                         │  │
│  │  Timestamp    March 21, 2026 at 14:32:15 UTC           │  │
│  │  User         Ralph Largo (ralph@example.com)           │  │
│  │  Action       Update                                    │  │
│  │  Target       Collection: My Comics Collection          │  │
│  │  IP Address   192.168.1.100                             │  │
│  │  User Agent   Chrome 122 / macOS                        │  │
│  │                                                         │  │
│  │  Changes                                                │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Field        Before           After              │  │  │
│  │  │  name         "Old Name"       "New Name"         │  │  │
│  │  │  description  "Old desc..."    "New desc..."      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### Detail Panel Styling

- **Container**: `bg-muted/30`, `border-t border-border`, `px-6 py-5`
- **Inset from table edges**: `mx-4` for visual indentation from the parent row
- **Title**: "Full Event Details" — `body-sm` (14px), weight 600, `--foreground`, `mb-4`

#### Metadata Section

Key-value pairs in a two-column layout:

- **Layout**: `grid grid-cols-[120px_1fr] gap-y-2 gap-x-4`
- **Label**: `body-sm`, `--muted-foreground`
- **Value**: `body-sm`, weight 400, `--foreground`
- **Timestamp**: Full format — "March 21, 2026 at 14:32:15 UTC"
- **User**: Display name + email in parentheses
- **IP Address**: Raw IP — `font-mono text-sm` for readability
- **User Agent**: Parsed to human-readable — "Chrome 122 / macOS" (parse from full UA string)

#### Changes Section (conditional)

Only shown for Create, Update, and Delete actions where change data is available.

- **Section label**: "Changes" — `body-sm`, weight 600, `--foreground`, `mt-4 mb-2`
- **Table**: Compact mini-table within the detail panel
  - **Container**: `--radius-md`, `border border-border`, `overflow-hidden`
  - **Header row**: `bg-muted`, `px-3 py-2`, columns: "Field", "Before", "After" — `caption` typography, weight 600
  - **Data rows**: `px-3 py-2`, `border-t border-border/50`
    - Field name: `body-sm`, `--foreground`, `font-mono` (code-like for field names)
    - Before value: `body-sm`, `--muted-foreground`, `line-through` decoration for updates (struck-through old value)
    - After value: `body-sm`, `--foreground`, `font-medium`
  - **Create actions**: "Before" column shows "—" (em-dash), "After" shows the new value
  - **Delete actions**: "Before" shows the deleted value, "After" shows "—"
  - **Long values**: Truncate to 80 characters with "..." — full value visible via title attribute

#### Mobile Detail Panel

On mobile, the detail panel also shows columns hidden from the main table:
- Target entity (hidden from table on mobile)
- Details summary (hidden from table on mobile and tablet)
- All metadata + changes section as above

---

### Audit Log — Pagination

Same pagination pattern as User Management — reuse the same component.

#### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Showing 1-20 of 1,234 entries        ‹ 1 2 3 … 62 ›  20 per page │
└──────────────────────────────────────────────────────────────────┘
```

- **Container**: `flex items-center justify-between`, `px-4 py-3`, `border-t border-border`
- **Summary**: `body-sm`, `--muted-foreground`, "Showing {start}-{end} of {total} entries"
- **Page controls**: Same as User Management — `h-8 w-8` buttons, current page filled, ellipsis for many pages
- **Page size select**: Options 10, 20, 50 — default 20
- **Pagination**: **Server-side** for audit logs (unlike user management) — audit logs can be massive. API must support `page` and `pageSize` query parameters.

#### Responsive Behavior

- **Desktop**: Full layout
- **Tablet**: Same as desktop
- **Mobile**: Summary hidden, controls centered, page size hidden (fixed at 20)

#### i18n Keys

- `admin.auditLog.showing`: "Showing {{start}}-{{end}} of {{total}} entries"
- `admin.auditLog.perPage`: "per page"

---

### Audit Log — Search

The search input in the filter bar provides full-text search across all log fields:

- **Indexed fields**: User display name, user email, action type, target entity type, target entity name, details summary
- **Behavior**: Server-side search (audit logs are too large for client-side filtering). Debounced 300ms before sending API request.
- **Results**: Table updates to show only matching entries. Pagination resets to page 1 on new search.
- **Highlight**: No text highlighting in results (adds complexity for minimal value in a log view). The matching is sufficient context.

---

### Audit Log — Empty State

When the audit log has zero entries:

- **Icon**: `ScrollText` (Lucide), 48×48px, `--muted-foreground/50`
- **Message**: "No audit log entries yet" — `h4` typography
- **Submessage**: "Actions will be recorded here as users interact with the platform." — `body-sm`, `--muted-foreground`
- **No CTA** — audit logs are passive records

### Audit Log — No Results State

When search/filter returns empty:

- **Icon**: `Search` (Lucide), 48×48px, `--muted-foreground/50`
- **Message**: "No entries match your filters" — `h4` typography
- **Submessage**: "Try adjusting your search, filters, or date range." — `body-sm`, `--muted-foreground`
- **Action**: "Clear filters" text button (`ghost` variant)

---

### Audit Log — Loading State

- **Filter bar**: Shows immediately (static content, inputs are interactive but search triggers loading)
- **Table**: Show `loadingRows={10}` via DataTable's built-in skeleton, matching column widths
- **Pagination**: Skeleton bar `h-10 w-full --radius-md`

---

### Audit Log — Responsive Summary

| Breakpoint | Layout Changes |
|------------|---------------|
| Desktop (≥1024px) | All columns visible, filters in one row, inline detail expansion, full pagination |
| Tablet (768–1023px) | "Details" column hidden, date range wraps to second filter row, detail expansion shows details field |
| Mobile (<768px) | "Target" and "Details" columns hidden, timestamp shows compact format, filters stack vertically, detail expansion shows all hidden fields, export button full width, pagination simplified |

---

### Implementation Notes

- **Component location**: `src/web/src/features/admin/admin-analytics-page.tsx` and `src/web/src/features/admin/admin-audit-log-page.tsx`
- **Shared sub-components**: `src/web/src/features/admin/components/` — consider `TimeRangeSelector`, `UsageTable`, `AuditDetailPanel`, `ActionBadge`
- **Chart reuse**: Analytics charts use the same recharts patterns and custom tooltip component as the user dashboard charts. Extract the tooltip into a shared component in `components/ds/` if not already done.
- **StatCard reuse**: Analytics stat cards use the existing `StatCard` component from `components/ds/stat-card.tsx` — no new component needed
- **DataTable reuse**: Audit log uses `DataTable` from `components/ds/data-table.tsx` with expandable row support
- **Expandable rows**: May need to extend `DataTable` with an `expandedRow` render prop or implement expansion at the page level with `AnimatePresence`
- **Badge reuse**: Action badges use the existing `Badge` component with additional semantic color variants
- **Time range state**: Use URL search params (`?range=30d`) so that the selected range persists across navigation and can be bookmarked
- **CSV export**: Client-side generation using a library like `papaparse` or manual CSV string building. Fetch all filtered entries (not just current page) before generating.
- **Server-side pagination**: Audit log API must support `page`, `pageSize`, `search`, `action`, `userId`, `fromDate`, `toDate` query parameters
- **i18n**: All labels, headers, badge text, filter options, toast messages, empty states need keys in both `en.json` and `pt.json`
- **Accessibility**: Table rows with expansion need `aria-expanded`, expand icon needs `aria-label`, filters need proper labels, export button announces download via `aria-live` region
- **No new design tokens**: Both pages use existing Warm Obsidian palette, chart tokens, badge patterns, and data table patterns. The time range selector uses existing token colors (`--muted`, `--card`, `--border`). No new CSS custom properties needed.
