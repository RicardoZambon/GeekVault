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
