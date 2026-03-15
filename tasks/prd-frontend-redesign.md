# PRD: Frontend Redesign — "GeekVault 2.0"

## Introduction

GeekVault's frontend is functional but built with a generic grayscale theme, monolithic page components, and no cohesive design language tied to the brand. This redesign transforms the frontend into a **bold, playful, collector-centric experience** that matches the GeekVault logo's energy — deep blues, gold accents, rounded shapes, and delightful interactions. The effort includes building a proper design system layer, restructuring components for maintainability, and adding modern UX patterns (command palette, drag-and-drop, gallery views, animated transitions) that make managing collectibles genuinely fun.

## Goals

- Establish a branded design system (colors, typography, spacing, component library) rooted in the logo's blue/gold palette
- Rebuild all screens using the design system for visual consistency
- Restructure the frontend into a scalable, feature-based architecture with shared design system components
- Add a collapsible sidebar with icon-only mode for desktop and responsive mobile navigation
- Implement smart empty states that guide new users through their first actions
- Introduce grid/gallery views for visual browsing of collectibles
- Add a command palette (Cmd+K) for fast global search and navigation
- Support drag-and-drop for reordering items and managing sets
- Add page transitions, skeleton loaders, and micro-interactions throughout
- Integrate the GeekVault logo and vault icon into the app chrome and favicon
- Maintain full i18n support (en/pt) for all new UI strings
- Maintain 90%+ test coverage

## User Stories

### US-001: Design System — Color Tokens & Typography
**Description:** As a developer, I want a branded design system with color tokens and typography scale so that all UI is visually consistent with the GeekVault brand.

**Acceptance Criteria:**
- [ ] Replace current grayscale OKLch tokens in `index.css` with a branded palette:
  - **Primary:** Deep navy blue (from logo ~`#1B3A6B`)
  - **Primary foreground:** White
  - **Accent/Secondary:** Gold/amber (from logo dial ~`#E8A838`)
  - **Background light:** Warm off-white (`#FAFAF8` or similar)
  - **Background dark:** Deep navy-black (`#0D1B2A` or similar)
  - **Surface/Card:** Slightly elevated from background
  - **Muted:** Soft blue-gray
  - **Destructive:** Keep red but harmonize with palette
  - **Success:** Emerald green
  - **Sidebar:** Navy gradient or solid dark blue in both themes
- [ ] Define a typography scale using CSS custom properties:
  - `--font-display`: Bold/black weight for headings (consider a playful sans like "Nunito", "Poppins", or "Quicksand" imported from Google Fonts)
  - `--font-body`: Clean readable sans (Inter or system stack)
  - `--font-mono`: For identifiers/codes
  - Sizes: `xs` through `3xl` with corresponding line-heights
- [ ] Define spacing scale tokens: `--space-1` through `--space-12`
- [ ] Define border-radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- [ ] Both light and dark themes use the branded palette (not just grayscale inversion)
- [ ] Dark mode sidebar remains dark navy; light mode sidebar is also dark navy (persistent brand element)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Design System — Core UI Components
**Description:** As a developer, I want a library of branded, reusable UI components built on top of shadcn/ui so that pages are composed from consistent building blocks.

**Acceptance Criteria:**
- [ ] Create `src/components/ds/` (design system) directory with the following components:
  - **Card** — Branded card with subtle shadow, hover lift animation, optional accent border-top (gold)
  - **Badge** — Multiple variants: `default`, `primary`, `accent`, `success`, `warning`, `destructive`, `outline`; sizes: `sm`, `md`
  - **DataTable** — Sortable, filterable table component with:
    - Column header click-to-sort with direction indicators
    - Optional row hover highlighting
    - Responsive: horizontal scroll on mobile
    - Empty state slot
    - Loading state with skeleton rows
  - **EmptyState** — Reusable empty state component with: icon slot, title, description, action button (CTA)
  - **PageHeader** — Page title + optional description + optional action buttons area, consistent across all pages
  - **Avatar** — User avatar with fallback initials, multiple sizes (`sm`, `md`, `lg`, `xl`)
  - **Skeleton** — Skeleton loader primitives (rectangle, circle, text lines) for loading states
  - **StatCard** — Dashboard stat card with icon, label, value, optional trend indicator
  - **Tooltip** — Styled tooltip wrapping Radix tooltip primitive
  - **DropdownMenu** — Styled dropdown wrapping Radix dropdown primitive (replace inline menus)
  - **Select** — Styled select wrapping Radix select primitive (replace native `<select>`)
  - **Textarea** — Styled textarea matching input design
  - **Tabs** — Styled tabs wrapping Radix tabs primitive
  - **ScrollArea** — Styled scroll area for overflow containers
- [ ] Each component has consistent API patterns: `className` prop for extension, `variant`/`size` props where applicable
- [ ] Each component respects light/dark theme via CSS variables
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (create a temporary storybook-like preview page at `/dev/components` behind a dev-only route)

### US-003: Design System — Animation & Transition Utilities
**Description:** As a developer, I want shared animation utilities so that all transitions and micro-interactions feel consistent and polished.

**Acceptance Criteria:**
- [ ] Add `framer-motion` as a dependency
- [ ] Create `src/components/ds/motion.tsx` with reusable motion wrappers:
  - **PageTransition** — Wraps page content with fade-in + subtle slide-up on route change
  - **FadeIn** — Simple fade-in wrapper with configurable delay
  - **SlideIn** — Slide from direction (left, right, up, down) with configurable distance
  - **ScaleIn** — Scale from 0.95 to 1 with fade (for modals/dialogs)
  - **StaggerChildren** — Parent that staggers child animations (for lists/grids)
- [ ] Create `src/components/ds/animated-number.tsx` — Smoothly animates number changes (for dashboard stats)
- [ ] Dialogs use ScaleIn animation instead of default CSS transitions
- [ ] Page route changes use PageTransition wrapper
- [ ] Card grids use StaggerChildren for initial load
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Logo Integration & Favicon
**Description:** As a user, I want to see the GeekVault brand identity (logo, vault icon) consistently throughout the app so that the product feels polished and memorable.

**Acceptance Criteria:**
- [ ] Process the logo image (`ChatGPT Image Mar 14, 2026, 07_10_32 PM.png`):
  - Extract the vault icon (without text) as a standalone SVG or optimized PNG for use as favicon and small brand mark
  - Create the full logo (vault + "GeekVault" text) as an optimized asset for sidebar header
  - Store in `src/assets/` directory: `logo-full.png`, `vault-icon.png`
- [ ] Generate favicon set from the vault icon:
  - `favicon.ico` (16x16, 32x32 multi-size)
  - `favicon-32x32.png`
  - `favicon-16x16.png`
  - `apple-touch-icon.png` (180x180)
  - Update `index.html` with proper favicon links and meta tags
- [ ] Sidebar header displays the full logo (vault + text) when expanded, vault icon only when collapsed
- [ ] Login and Register pages display the full logo prominently above the form
- [ ] Browser tab shows vault icon favicon + page-specific title (e.g., "Dashboard | GeekVault")
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Collapsible Sidebar Navigation
**Description:** As a user, I want a sidebar that I can collapse to icon-only mode so that I get more screen space for my collections while keeping navigation accessible.

**Acceptance Criteria:**
- [ ] Desktop sidebar has two states:
  - **Expanded** (default, ~256px): Logo + text labels + nav items with icons and labels + user section at bottom
  - **Collapsed** (~64px): Vault icon only + nav icons only + avatar only at bottom
- [ ] Toggle button at the bottom of the sidebar (chevron icon) to switch between states
- [ ] Sidebar state persists to localStorage (`geekvault-sidebar-collapsed`)
- [ ] Smooth width transition animation (200-300ms ease) when toggling
- [ ] Collapsed state shows tooltips on hover for each nav item (showing the label)
- [ ] Mobile: Keep existing sheet/drawer behavior (hamburger menu opens full overlay sidebar)
- [ ] Mobile sidebar always shows expanded state (labels visible)
- [ ] Active nav item highlighted with accent (gold) left border + subtle background tint
- [ ] Sidebar background: dark navy gradient in both light and dark themes (brand consistency)
- [ ] Nav items:
  - Dashboard (LayoutDashboard icon)
  - Collections (Library icon)
  - Collection Types (Layers icon)
  - Wishlist (Heart icon)
  - Profile (User icon)
- [ ] User section at bottom: Avatar + display name (hidden when collapsed) + logout button
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Command Palette (Cmd+K)
**Description:** As a user, I want a command palette so that I can quickly search across all my collections, items, and navigate anywhere in the app without using the mouse.

**Acceptance Criteria:**
- [ ] Add `cmdk` package (https://cmdk.paco.me/) as a dependency
- [ ] Cmd+K (Mac) / Ctrl+K (Windows) opens the command palette overlay
- [ ] Command palette has a search input at the top with placeholder "Search collections, items, actions..."
- [ ] Results are grouped into sections:
  - **Navigation** — Go to Dashboard, Collections, Wishlist, Profile, Collection Types
  - **Collections** — Search across collection names (fetched from API on open)
  - **Items** — Search across catalog item names across all collections (debounced API call)
  - **Actions** — "Create Collection", "Add to Wishlist", "Toggle Theme", "Toggle Sidebar", "Change Language"
- [ ] Each result shows: icon + title + subtitle (e.g., collection name for items) + keyboard shortcut hint where applicable
- [ ] Enter key navigates to selected result
- [ ] Arrow keys navigate results, Escape closes
- [ ] Recent searches shown when input is empty (persist last 5 in localStorage)
- [ ] Loading state while fetching search results
- [ ] Empty state: "No results found" with suggestion text
- [ ] All text uses i18n translation keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Login & Register Pages Redesign
**Description:** As a new user, I want a visually appealing login/register experience that introduces me to GeekVault's brand so that I feel excited about using the product.

**Acceptance Criteria:**
- [ ] Split-screen layout on desktop:
  - **Left panel (60%):** Brand showcase area with:
    - Deep navy/blue gradient background
    - Large GeekVault logo (centered)
    - Tagline text (e.g., "Your collectibles, secured." — add i18n keys)
    - Subtle animated background (floating vault icons or gentle particle effect using CSS only)
  - **Right panel (40%):** Clean white/dark form area with:
    - Form card with shadow
    - Title ("Welcome back" for login, "Create your vault" for register)
    - Form fields with updated styling (rounded, branded focus ring in gold)
    - Submit button in primary blue with hover state
    - Toggle link ("Don't have an account? Sign up" / "Already have an account? Log in")
- [ ] Mobile: Stack vertically — compact brand header with logo + form below
- [ ] Form validation shows inline error messages below each field
- [ ] Submit button shows loading spinner during API call
- [ ] Smooth transition between login/register (if navigating between them)
- [ ] All text uses i18n translation keys (add new keys for tagline, headings)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Smart Empty States
**Description:** As a new user, I want helpful empty states on every page so that I know exactly what to do next without reading documentation.

**Acceptance Criteria:**
- [ ] Use the `EmptyState` design system component (from US-002) across all pages
- [ ] Each empty state includes:
  - A relevant illustration or large icon (using Lucide icons, styled with brand colors)
  - A friendly title explaining what this page is for
  - A description with 1-2 sentences of guidance
  - A primary CTA button to take the first action
- [ ] Empty states per page:
  - **Dashboard (no collections):** Vault icon, "Your vault is empty", "Start by creating your first collection to track your collectibles", CTA: "Create Collection" (navigates to /collections with create dialog auto-opened via URL param `?create=true`)
  - **Collections (no collections):** Library icon, "No collections yet", "Collections organize your items by type — comics, cards, figures, and more", CTA: "Create Your First Collection"
  - **Collection Detail (no items):** Package icon, "No items in this collection", "Add your first catalog item to start tracking what you own", CTA: "Add Item"
  - **Collection Detail (no owned copies for an item):** Box icon, "No copies owned yet", "Track your owned copies with condition, purchase price, and photos", CTA: "Add Owned Copy"
  - **Wishlist (empty):** Heart icon, "Your wishlist is empty", "Save items you're looking for and track target prices", CTA: "Add to Wishlist"
  - **Collection Types (none):** Layers icon, "No collection types defined", "Collection types let you customize fields for different kinds of collectibles", CTA: "Create Collection Type"
- [ ] All empty state text uses i18n translation keys (add to both en.json and pt.json)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Dashboard Redesign
**Description:** As a user, I want a rich, visually engaging dashboard so that I get an at-a-glance view of my vault and feel motivated to keep collecting.

**Acceptance Criteria:**
- [ ] Use `PageHeader` component: "Dashboard" title with welcome message ("Welcome back, {displayName}")
- [ ] **Stats row** using `StatCard` components (horizontal scroll on mobile):
  - Total Collections (Library icon, blue)
  - Total Items (Package icon, blue)
  - Owned Copies (Box icon, gold/accent)
  - Estimated Value (DollarSign icon, green)
  - Total Invested (TrendingUp icon, gold)
  - Each stat uses `AnimatedNumber` for value changes
- [ ] **Charts section** (2-column grid on desktop, stacked on mobile):
  - Pie chart: Items by condition — use branded colors (blues, gold, teals)
  - Bar chart: Condition breakdown — match branded colors
  - Charts wrapped in branded `Card` components with headers
- [ ] **Recent Acquisitions** section:
  - Use `DataTable` component with sortable columns
  - Columns: Item thumbnail (small), Name, Collection, Condition (badge), Date, Price
  - Click row to navigate to item detail
  - Show max 10 items, link to "View all" if more exist
- [ ] **Collection Summaries** section:
  - Grid of collection cards (using branded `Card`)
  - Each shows: cover image (or colored placeholder with collection type icon), name, item count, total value
  - Click navigates to collection detail
  - StaggerChildren animation on load
- [ ] **Quick Actions** floating section or integrated into header:
  - "Add Item" button, "Create Collection" button
- [ ] Dashboard uses skeleton loaders while data is loading (not just a spinner)
- [ ] All text uses i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Collections Page Redesign
**Description:** As a user, I want a polished collections page with visual cards so that browsing my collections is enjoyable.

**Acceptance Criteria:**
- [ ] Use `PageHeader`: "Collections" + "Create Collection" button (accent/gold colored)
- [ ] Collection cards redesigned:
  - Cover image fills top portion (aspect-ratio 16/9), fallback: gradient background with collection type icon
  - Card body: Collection name (bold), type badge, item count, description (2 lines truncated)
  - Card footer: "View" button + overflow menu (Edit, Delete)
  - Hover: Subtle lift + shadow animation
- [ ] Grid layout: 1 column mobile, 2 columns tablet, 3 columns desktop
- [ ] Cards animate in with StaggerChildren on page load
- [ ] Create/Edit collection dialog:
  - Uses branded dialog with ScaleIn animation
  - Cover image upload with drag-and-drop zone (visual dropzone with dashed border)
  - Image preview before upload
  - Type selector uses `Select` component (not native select)
- [ ] Delete confirmation uses `ConfirmDialog` with destructive styling
- [ ] Search/filter bar above the grid: search by name, filter by type (dropdown)
- [ ] Skeleton card placeholders while loading
- [ ] All text uses i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Collection Detail Page Redesign
**Description:** As a user, I want a powerful, visually rich collection detail page with grid/gallery and table views so that I can browse my items the way I prefer.

**Acceptance Criteria:**
- [ ] Use `PageHeader`: Collection name + type badge + action buttons (Add Item, Export, Import)
- [ ] **View toggle**: Grid view (default) vs. Table view — toggle buttons in header area
- [ ] **Grid/Gallery View:**
  - Image-first cards in a masonry or uniform grid
  - Each card: Primary image (or placeholder), item name, identifier, key custom fields (2-3 max), owned copies count badge
  - Hover: Reveal quick actions (View, Edit, Add to Wishlist)
  - Click: Navigate to item detail
  - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop
- [ ] **Table View:**
  - Use `DataTable` component
  - Columns: Thumbnail, Name, Identifier, condition summary, owned copies count, estimated value
  - Sortable by name, value, date added
  - Click row to navigate to item detail
- [ ] **Toolbar** above content:
  - Search input (search by name/identifier)
  - Filter by condition (Select component)
  - Filter by owned status (all / owned / not owned)
  - Sort dropdown
- [ ] **Sets section** below items:
  - Collapsible accordion-style sections for each set
  - Set header: Name, completion percentage progress bar (gold fill), item count
  - Set items: Compact list with checkbox-style owned indicators
- [ ] **Import flow** redesigned:
  - Step 1: File upload (drag-and-drop zone)
  - Step 2: Preview data in table
  - Step 3: Confirm import
- [ ] Drag-and-drop: Reorder items within the grid view (saves order to API if supported, otherwise local only)
- [ ] Skeleton loaders for both grid and table views
- [ ] All text uses i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Catalog Item Detail Page Redesign
**Description:** As a user, I want a rich item detail page that showcases my collectible with images, details, and owned copies so that it feels like a proper catalog entry.

**Acceptance Criteria:**
- [ ] **Hero section** at top:
  - Large primary image (or image carousel if multiple images) on the left
  - Item name (large heading), identifier (subtitle), collection breadcrumb
  - Key custom field values displayed as labeled badges or key-value pairs
  - Action buttons: Edit, Delete, Add Owned Copy
- [ ] **Image gallery** (if multiple images):
  - Thumbnail strip below main image
  - Click thumbnail to switch main image
  - Lightbox on click of main image (full-screen overlay with zoom)
- [ ] **Description section**: Rendered text with proper formatting
- [ ] **Custom Fields section**:
  - Clean key-value grid layout
  - Field types displayed appropriately (dates formatted, booleans as toggle indicators, enums as badges, image_url as thumbnail)
- [ ] **Owned Copies section**:
  - Card-based layout (one card per copy)
  - Each card: Condition badge (colored), purchase date, purchase price, estimated value, source, notes
  - Copy images shown as small gallery within card
  - Actions per copy: Edit, Delete (with confirmation)
  - "Add Copy" button uses accent styling
- [ ] **Wishlist indicator**: If item is on wishlist, show a gold heart badge/banner
- [ ] Breadcrumb navigation at top: Collections > {Collection Name} > {Item Name}
- [ ] Skeleton loader for initial page load
- [ ] All text uses i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Wishlist Page Redesign
**Description:** As a user, I want a visually organized wishlist that helps me track what I'm hunting for so that I stay focused on my collecting goals.

**Acceptance Criteria:**
- [ ] Use `PageHeader`: "Wishlist" + "Add Item" button
- [ ] Items displayed as cards (not just a table):
  - Card shows: Item name, collection badge, priority (color-coded badge: high=red, medium=gold, low=gray), target price, notes preview
  - If linked to catalog item: Show item thumbnail + link icon
  - Actions: Edit, Delete, "Mark as Acquired" (moves to owned with pre-filled data)
- [ ] **Grouping**: Group by collection with collapsible sections
- [ ] **Filter/Sort toolbar**:
  - Filter by priority (All, High, Medium, Low)
  - Filter by collection
  - Sort by: Priority, Price, Date Added, Name
- [ ] **Priority quick-toggle**: Click priority badge to cycle through priorities inline
- [ ] Drag-and-drop to reorder within priority groups
- [ ] Cards use StaggerChildren animation
- [ ] Skeleton loaders while fetching
- [ ] All text uses i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Collection Types Page Redesign
**Description:** As a user, I want a clear, well-organized collection types management page so that I can define custom field schemas for different kinds of collectibles.

**Acceptance Criteria:**
- [ ] Use `PageHeader`: "Collection Types" + "Create Type" button
- [ ] Type cards redesigned:
  - Large emoji icon at top
  - Type name (bold heading)
  - Description (2 lines truncated)
  - Custom fields shown as compact tag list (field name + type icon)
  - Badge showing "X collections using this type"
  - Actions: Edit, Delete (with confirmation — warn if collections exist using this type)
- [ ] Create/Edit dialog redesigned:
  - Tabbed interface: "General" (name, description, icon) + "Custom Fields" (field builder)
  - Custom field builder:
    - Drag-and-drop reordering of fields (using `@dnd-kit`)
    - Each field row: Drag handle, field name input, type select, required toggle, delete button
    - Enum type: Inline tag-style option editor (type + enter to add, x to remove)
    - Visual preview of how fields will appear
    - Max 10 fields indicator ("3/10 fields")
- [ ] Grid layout: 1 col mobile, 2 cols tablet, 3 cols desktop
- [ ] All text uses i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-015: Profile Page Redesign
**Description:** As a user, I want a clean profile page where I can manage my account settings and preferences.

**Acceptance Criteria:**
- [ ] Use `PageHeader`: "Profile"
- [ ] **Avatar section** redesigned:
  - Large circular avatar (120px) with camera icon overlay on hover
  - Click to upload, drag-and-drop support
  - Crop/resize preview before upload (optional — if too complex, skip for MVP)
  - Loading indicator during upload
- [ ] **Form sections** organized with visual dividers:
  - **Account Info**: Email (disabled, shown as text), Display Name
  - **About**: Bio textarea
  - **Preferences**: Language selector (Select component with flag icons), Currency selector (Select component)
  - **Appearance**: Theme toggle (light/dark/system) shown as a segmented control or radio group with icons
- [ ] Save button: Primary blue, fixed at bottom or sticky
- [ ] Success feedback: Toast notification instead of inline message (introduce a toast system — see US-016)
- [ ] All text uses i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-016: Toast Notification System
**Description:** As a user, I want non-intrusive toast notifications for success/error feedback so that I know my actions completed without blocking my workflow.

**Acceptance Criteria:**
- [ ] Add `sonner` package as a dependency (lightweight toast library that works with shadcn/ui)
- [ ] Create `src/components/ds/toaster.tsx` wrapping Sonner's Toaster with branded styling
- [ ] Toast variants: `success` (green), `error` (red), `info` (blue), `warning` (gold)
- [ ] Toasts appear at bottom-right, stack vertically, auto-dismiss after 4s
- [ ] Create a `useToast()` hook or simple `toast.success("message")` utility
- [ ] Replace all existing inline success/error messages across pages with toasts:
  - Collection CRUD operations
  - Item CRUD operations
  - Owned copy CRUD operations
  - Wishlist operations
  - Profile save
  - Auth errors (login/register failures)
- [ ] All toast messages use i18n keys
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-017: Frontend Architecture Restructure
**Description:** As a developer, I want the frontend organized into a design system + feature-based folder structure so that the codebase is maintainable and scalable.

**Acceptance Criteria:**
- [ ] New folder structure:
  ```
  src/
  ├── assets/                    # Logo, favicon, static images
  │   ├── logo-full.png
  │   └── vault-icon.png
  ├── components/
  │   ├── ds/                    # Design system components (US-002, US-003)
  │   │   ├── card.tsx
  │   │   ├── badge.tsx
  │   │   ├── data-table.tsx
  │   │   ├── empty-state.tsx
  │   │   ├── page-header.tsx
  │   │   ├── avatar.tsx
  │   │   ├── skeleton.tsx
  │   │   ├── stat-card.tsx
  │   │   ├── tooltip.tsx
  │   │   ├── dropdown-menu.tsx
  │   │   ├── select.tsx
  │   │   ├── textarea.tsx
  │   │   ├── tabs.tsx
  │   │   ├── scroll-area.tsx
  │   │   ├── toaster.tsx
  │   │   ├── motion.tsx
  │   │   ├── animated-number.tsx
  │   │   └── index.ts            # Barrel export
  │   ├── ui/                     # Low-level shadcn/ui primitives (keep existing)
  │   │   ├── button.tsx
  │   │   ├── dialog.tsx
  │   │   ├── input.tsx
  │   │   ├── label.tsx
  │   │   ├── sheet.tsx
  │   │   └── confirm-dialog.tsx
  │   ├── layout/                 # App shell components
  │   │   ├── sidebar.tsx         # Collapsible sidebar
  │   │   ├── header.tsx          # Top header bar (mobile)
  │   │   ├── app-layout.tsx      # Main layout wrapper
  │   │   └── command-palette.tsx  # Cmd+K palette
  │   ├── auth-provider.tsx
  │   └── theme-provider.tsx
  ├── features/                   # Feature modules
  │   ├── auth/
  │   │   ├── login-page.tsx
  │   │   ├── register-page.tsx
  │   │   └── components/         # Auth-specific sub-components
  │   ├── dashboard/
  │   │   ├── dashboard-page.tsx
  │   │   └── components/
  │   │       ├── stats-row.tsx
  │   │       ├── charts-section.tsx
  │   │       ├── recent-acquisitions.tsx
  │   │       └── collection-summaries.tsx
  │   ├── collections/
  │   │   ├── collections-page.tsx
  │   │   ├── collection-detail-page.tsx
  │   │   ├── catalog-item-detail-page.tsx
  │   │   └── components/
  │   │       ├── collection-card.tsx
  │   │       ├── collection-form-dialog.tsx
  │   │       ├── item-card.tsx
  │   │       ├── item-grid-view.tsx
  │   │       ├── item-table-view.tsx
  │   │       ├── item-form-dialog.tsx
  │   │       ├── owned-copy-card.tsx
  │   │       ├── owned-copy-form-dialog.tsx
  │   │       ├── sets-section.tsx
  │   │       ├── import-wizard.tsx
  │   │       └── image-gallery.tsx
  │   ├── collection-types/
  │   │   ├── collection-types-page.tsx
  │   │   └── components/
  │   │       ├── type-card.tsx
  │   │       ├── type-form-dialog.tsx
  │   │       └── custom-field-builder.tsx
  │   ├── wishlist/
  │   │   ├── wishlist-page.tsx
  │   │   └── components/
  │   │       ├── wishlist-card.tsx
  │   │       └── wishlist-form-dialog.tsx
  │   └── profile/
  │       ├── profile-page.tsx
  │       └── components/
  │           └── avatar-upload.tsx
  ├── hooks/                      # Shared hooks
  │   ├── use-api.ts              # Shared fetch wrapper with auth token
  │   ├── use-debounce.ts
  │   └── use-media-query.ts
  ├── i18n/                       # Keep existing structure
  ├── lib/
  │   ├── utils.ts                # Keep cn() helper
  │   └── api.ts                  # API client with base URL, auth headers, error handling
  ├── App.tsx
  ├── main.tsx
  └── index.css
  ```
- [ ] Move all existing page components into their respective `features/` directories
- [ ] Extract sub-components from monolithic pages (e.g., Dashboard charts, Collection Detail toolbar)
- [ ] Create shared `hooks/use-api.ts` to centralize API calls with auth token injection and error handling
- [ ] Create `lib/api.ts` with typed API client functions (instead of raw fetch in every component)
- [ ] Update all imports and routing in `App.tsx`
- [ ] Barrel exports (`index.ts`) for design system components
- [ ] All existing tests pass after restructure
- [ ] No circular dependencies
- [ ] Typecheck passes

### US-018: Drag-and-Drop Infrastructure
**Description:** As a developer, I want a drag-and-drop system so that users can reorder items, sets, and wishlist entries interactively.

**Acceptance Criteria:**
- [ ] Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` as dependencies
- [ ] Create reusable `SortableList` wrapper component in `src/components/ds/sortable-list.tsx`:
  - Accepts items array + render function
  - Handles DndContext, SortableContext, drag overlay
  - Returns new order via `onReorder` callback
  - Supports both vertical lists and grid layouts
  - Visual feedback: Dragged item has shadow + slight rotation, drop target highlighted
- [ ] Integrate into:
  - Collection Detail grid view: Reorder items (persist order if API supports, otherwise visual only)
  - Custom field builder in Collection Types: Reorder fields
  - Wishlist: Reorder items within groups
- [ ] Accessible: Keyboard support for drag operations (built into dnd-kit)
- [ ] Touch-friendly: Works on mobile (dnd-kit supports touch)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-019: Responsive Polish & Mobile Experience
**Description:** As a mobile user, I want the app to feel native-like on small screens so that I can manage my collections on the go.

**Acceptance Criteria:**
- [ ] All pages tested and polished at 3 breakpoints: mobile (375px), tablet (768px), desktop (1280px)
- [ ] Mobile-specific adjustments:
  - Bottom action bar on collection detail (sticky, with main actions) instead of header buttons
  - Swipe gestures on cards for quick actions (edit/delete) — optional, CSS-only if possible
  - Full-width dialogs on mobile (no side margins)
  - Touch-friendly tap targets (minimum 44x44px)
- [ ] No horizontal overflow/scroll issues on any page at mobile width
- [ ] Images lazy-loaded with proper aspect ratios (no layout shift)
- [ ] Command palette adapts: full-width on mobile, centered modal on desktop
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-020: Update All i18n Translation Keys
**Description:** As a developer, I want all new UI strings added to both translation files so that the app remains fully bilingual.

**Acceptance Criteria:**
- [ ] Audit all new and modified components for hardcoded strings
- [ ] Add all new translation keys to both `en.json` and `pt.json`
- [ ] New key namespaces added as needed:
  - `emptyStates.*` — All empty state titles, descriptions, CTAs
  - `commandPalette.*` — Palette placeholder, section headers, action labels
  - `toast.*` — Toast messages for all CRUD operations
  - `auth.tagline` — Brand tagline on login/register
  - `profile.sections.*` — Section headers in redesigned profile
- [ ] No untranslated strings visible when switching to Portuguese
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (check both languages)

### US-021: Update Test Suite
**Description:** As a developer, I want all tests updated to work with the restructured components and new features so that we maintain 90%+ coverage.

**Acceptance Criteria:**
- [ ] Update all existing test imports to reflect new file locations (`features/` structure)
- [ ] Add tests for new design system components (`src/components/ds/`):
  - Each DS component has at least a render test and a variant/prop test
- [ ] Add tests for new features:
  - Command palette: Opens on Cmd+K, search filtering, navigation
  - Toast system: Renders toasts, auto-dismiss
  - Sidebar collapse: Toggle state, localStorage persistence
  - Empty states: Render correct content per page
- [ ] Update page component tests for redesigned pages
- [ ] All tests pass: `npm test`
- [ ] Coverage >= 90%: `npm run test:coverage`
- [ ] Typecheck passes: `npx tsc -b`

## Functional Requirements

- FR-1: The design system must define branded color tokens (navy blue primary, gold accent) used consistently across all components in both light and dark themes
- FR-2: The sidebar must be collapsible between expanded (256px) and icon-only (64px) modes, with state persisted to localStorage
- FR-3: The sidebar must remain dark navy in both light and dark themes as a persistent brand element
- FR-4: Cmd+K / Ctrl+K must open a command palette overlay that searches collections, items, and app actions
- FR-5: All pages must show skeleton loading states instead of spinner-only loading
- FR-6: All pages must show contextual empty states with icon, guidance text, and CTA when no data exists
- FR-7: Login and register pages must display the full GeekVault logo and use a split-screen branded layout
- FR-8: The vault icon from the logo must be used as the browser favicon
- FR-9: Collection detail must support both grid/gallery and table view modes with a toggle
- FR-10: Grid/gallery view must display items image-first with hover interactions
- FR-11: Drag-and-drop must be available for reordering in collection items, custom field builder, and wishlist
- FR-12: All CRUD feedback must use toast notifications instead of inline messages
- FR-13: Page transitions must use subtle fade/slide animations on route changes
- FR-14: Card lists must use staggered entrance animations on initial load
- FR-15: Dashboard stat numbers must animate when values change
- FR-16: All new UI strings must be added to both en.json and pt.json translation files
- FR-17: The frontend must be restructured into a `components/ds/` + `features/` folder architecture
- FR-18: All touch targets must be at least 44x44px on mobile
- FR-19: All images must be lazy-loaded with proper aspect ratios

## Non-Goals (Out of Scope)

- **Backend API changes** — This PRD covers frontend only; all existing API endpoints remain unchanged
- **Real-time/WebSocket features** — No live updates, notifications, or collaborative editing
- **PWA/offline support** — No service worker, offline caching, or install prompt
- **User onboarding wizard** — Guided multi-step setup flow (empty states serve this purpose for MVP)
- **Social features** — No sharing, public profiles, or community features
- **Advanced image editing** — No in-app crop, rotate, or filter tools for uploaded images (basic upload only)
- **Custom CSS themes** — Users cannot create their own color themes
- **E2E tests** — Only unit/integration tests with Vitest; no Playwright/Cypress

## Design Considerations

### Brand Color Palette (derived from logo)

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | Deep Navy `#1B3A6B` | Lighter Navy `#3B6CB5` | Buttons, links, sidebar |
| `--primary-foreground` | White | White | Text on primary |
| `--accent` | Gold `#E8A838` | Gold `#E8A838` | Highlights, active states, CTAs |
| `--accent-foreground` | Navy `#1B3A6B` | Dark `#1A1A1A` | Text on accent |
| `--background` | Warm white `#FAFAF8` | Deep navy-black `#0D1B2A` | Page background |
| `--card` | White `#FFFFFF` | Dark card `#142237` | Card surfaces |
| `--muted` | Blue-gray `#E8EDF3` | Muted navy `#1E3250` | Secondary backgrounds |
| `--sidebar` | Navy gradient | Navy gradient | Always dark, brand anchor |

### Typography
- **Display/Headings:** "Nunito" or "Poppins" (bold, rounded, playful — matches logo vibe)
- **Body:** "Inter" (clean, readable)
- **Mono:** "JetBrains Mono" (for item identifiers, codes)

### Component Patterns
- Cards have subtle shadow + hover lift (transform + shadow transition)
- Active navigation items use a gold left border accent
- Dialogs use scale animation on open/close
- Lists stagger-animate children on mount
- Empty states are centered with generous padding and large icons
- Buttons: Primary (navy fill), Accent (gold fill for key CTAs), Ghost, Outline, Destructive

### Visual Inspirations
- Sidebar: Discord/VS Code collapsible feel with brand colors
- Command palette: Linear/Raycast-style modal
- Card grids: Raindrop.io / Pinterest for collection browsing
- Dashboard: Vercel dashboard for clean stat cards
- Empty states: Figma/Notion for friendly, helpful guidance

## Technical Considerations

- **New dependencies:**
  - `framer-motion` — Page transitions, animations, layout animations
  - `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` — Drag-and-drop
  - `cmdk` — Command palette
  - `sonner` — Toast notifications
  - `@radix-ui/react-tooltip` — Tooltip primitive
  - `@radix-ui/react-dropdown-menu` — Dropdown primitive
  - `@radix-ui/react-select` — Select primitive
  - `@radix-ui/react-tabs` — Tabs primitive
  - `@radix-ui/react-scroll-area` — Scroll area primitive
- **Font loading:** Google Fonts (Nunito/Poppins + Inter) loaded via `<link>` in index.html or `@fontsource` packages
- **Image optimization:** Use native `loading="lazy"` on all `<img>` tags; consider `aspect-ratio` CSS for layout stability
- **Bundle impact:** framer-motion is ~30KB gzipped; mitigate with tree-shaking and lazy loading of heavy pages
- **Favicon generation:** Use a tool like `realfavicongenerator.net` or manually create from the logo's vault icon
- **File migration:** Use a careful, incremental approach — move files one feature at a time, updating imports as you go, running tests after each move

## Success Metrics

- All pages visually consistent with the branded design system (no raw/unstyled elements)
- Sidebar toggles smoothly between expanded and collapsed states
- Command palette returns relevant results within 300ms
- Page transitions are smooth (no flicker or layout jumps)
- Empty states guide users to their first action without external help
- All existing tests pass with 90%+ coverage maintained
- Typecheck passes with zero errors
- Both English and Portuguese translations complete for all new strings
- Lighthouse performance score remains above 80

## Suggested Implementation Order

1. **US-017** — Architecture restructure (move files first, get tests passing)
2. **US-001** — Design tokens (colors, typography, spacing)
3. **US-002** — Design system core components
4. **US-003** — Animation utilities
5. **US-004** — Logo & favicon integration
6. **US-016** — Toast notification system
7. **US-005** — Collapsible sidebar
8. **US-006** — Command palette
9. **US-007** — Login/Register redesign
10. **US-008** — Empty states (all pages)
11. **US-009** — Dashboard redesign
12. **US-010** — Collections page redesign
13. **US-011** — Collection Detail redesign
14. **US-012** — Catalog Item Detail redesign
15. **US-013** — Wishlist redesign
16. **US-014** — Collection Types redesign
17. **US-015** — Profile redesign
18. **US-018** — Drag-and-drop infrastructure
19. **US-019** — Responsive polish
20. **US-020** — i18n audit
21. **US-021** — Test suite update

## Open Questions

1. **Font choice:** Should we go with Nunito (rounder, more playful) or Poppins (geometric, slightly more professional)? Both match the logo's personality. - I don't have an opinion at this point.
2. **Image lightbox:** Should the item detail image gallery include zoom functionality, or is a simple full-screen overlay sufficient for MVP? - Simple full-screen is enough.
3. **Drag-and-drop persistence:** Should reordered items persist their order to the backend API (requires API changes) or stay client-side only for this iteration? - Yes, please, they need to persist.
4. **Sidebar default state:** Should the sidebar default to expanded or collapsed on first visit? (Recommendation: expanded on desktop, auto-collapsed on tablet) - Recommended is okay and makes sense.
5. **Animation intensity:** Should we provide a "reduced motion" preference that disables page transitions and stagger animations for accessibility? (Recommendation: Yes, respect `prefers-reduced-motion` media query) - Yes please.
6. **Dashboard widget customization:** Should users be able to rearrange or hide dashboard sections? (Recommendation: Not for MVP, but design cards with this in mind) - Yes, recommended is fine.
