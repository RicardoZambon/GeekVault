# PRD: Sidebar & Top Toolbar Redesign (Frontend Phase 2)

## Introduction

Redesign the sidebar navigation and introduce a desktop top toolbar to bring GeekVault's layout up to modern SaaS standards. The current sidebar has a flat navigation structure, bottom-stacked utility buttons (logout, collapse), and a collapsed state that feels like a squeezed menu rather than a dock. This phase transforms the sidebar into a grouped, hierarchical navigation with a user profile block at the bottom, and adds a persistent desktop toolbar with search, help, notifications, and a user menu dropdown.

**Visual reference:** `image.png` in the project root shows the target design for expanded sidebar, collapsed sidebar, top toolbar, user menu dropdown, and mobile bottom bar concepts.

## Goals

- Establish brand presence with a proper logo/product identity block in the sidebar header
- Introduce navigation grouping (Overview, Collections, Account) for better scannability
- Remove utility buttons (logout, collapse, help) from the sidebar bottom
- Add a user profile block at the sidebar bottom with avatar, name, and email
- Create a persistent desktop top toolbar with search, help, notifications, and user menu
- Move the sidebar collapse toggle to a hover-reveal chevron at the sidebar edge
- Fix collapsed sidebar to behave like a dock: centered icons, tooltips, proper active states
- Increase sidebar width from 256px to 260px and improve spacing/icon sizing

## User Stories

### US-001: Rebuild Sidebar Header with Brand Identity Block
**Description:** As a user, I want the sidebar header to prominently display the GeekVault logo and tagline so the app feels like a polished product.

**Acceptance Criteria:**
- [ ] Expanded sidebar header shows logo icon + "GeekVault" title + "Collection Manager" subtitle
- [ ] Header height is 72px with proper vertical centering
- [ ] Collapsed sidebar shows only the vault icon, centered horizontally
- [ ] Logo area has consistent padding and no unbalanced empty space
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Add Navigation Groups to Sidebar
**Description:** As a user, I want sidebar navigation items grouped by category so I can quickly scan and find what I need.

**Acceptance Criteria:**
- [ ] Navigation is split into three groups: "Overview" (Dashboard), "Collections" (Collections, Collection Types, Wishlist), "Account" (Profile)
- [ ] Group labels are rendered as small, muted, uppercase text above each group
- [ ] Group labels are hidden when sidebar is collapsed
- [ ] Gap of 16px between groups
- [ ] Each nav item has a height of 44px
- [ ] i18n keys added for group labels in both `en.json` and `pt.json`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Improve Active Navigation Item State
**Description:** As a user, I want the active navigation item to be clearly highlighted so I always know where I am.

**Acceptance Criteria:**
- [ ] Active item has a soft accent background fill
- [ ] Active item has a 3px left border highlight using `sidebar-primary` color
- [ ] Active item icon is colored (not muted) when active
- [ ] Hover state is visually distinct from active state
- [ ] Works correctly in both expanded and collapsed modes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Remove Bottom Utility Buttons from Sidebar
**Description:** As a user, I want the sidebar to contain only navigation and user profile — no logout, help, or collapse buttons cluttering the bottom.

**Acceptance Criteria:**
- [ ] Logout button removed from sidebar (both desktop and mobile)
- [ ] Collapse/expand toggle button removed from sidebar bottom
- [ ] No orphaned imports (LogOut, ChevronLeft, ChevronRight removed from sidebar if unused)
- [ ] Sidebar bottom section only contains the user profile block (US-005)
- [ ] Typecheck passes

### US-005: Add User Profile Block at Sidebar Bottom
**Description:** As a user, I want to see my avatar, name, and email at the bottom of the sidebar so I know which account I'm using, and I want to click it to access account actions.

**Acceptance Criteria:**
- [ ] Expanded sidebar bottom shows: avatar circle (initials or image), display name, email — separated from nav by a top border
- [ ] Clicking the user profile block opens a dropdown menu with: Profile, Settings (placeholder), Help (placeholder), Logout
- [ ] Dropdown menu items have appropriate icons
- [ ] "Profile" navigates to `/profile`, "Logout" logs out and redirects to `/login`
- [ ] "Settings" and "Help" are rendered but disabled/placeholder (no destination yet)
- [ ] Collapsed sidebar shows only the avatar circle, centered; clicking opens the same dropdown
- [ ] i18n keys added for menu items in both `en.json` and `pt.json`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Create Desktop Top Toolbar
**Description:** As a user, I want a persistent top toolbar on desktop that provides global actions (search, help, notifications, user menu) so the sidebar stays focused on navigation.

**Acceptance Criteria:**
- [ ] Top toolbar is visible on desktop (`md:` breakpoint and above), spanning the content area to the right of the sidebar
- [ ] Toolbar height matches the sidebar header (72px) for visual alignment
- [ ] Toolbar has a bottom border consistent with the app's design tokens
- [ ] Layout in `app-layout.tsx` updated to include the toolbar above the main content area
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Add Search Bar to Top Toolbar
**Description:** As a user, I want a search input in the top toolbar so I can quickly find collections and items.

**Acceptance Criteria:**
- [ ] Search input on the left side of the toolbar with placeholder text "Search collections..." (i18n)
- [ ] Clicking the search input opens the existing command palette (Cmd+K)
- [ ] Search input shows the keyboard shortcut hint (e.g., "Ctrl+K" or "⌘K") inside the input
- [ ] Search input is styled as a subtle, rounded field (not a full-width bar)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Add Help and Notifications Icons to Top Toolbar
**Description:** As a user, I want help and notification icons in the toolbar so I can access support and see updates.

**Acceptance Criteria:**
- [ ] Help icon button (`CircleHelp` or `HelpCircle` from lucide) on the right side of toolbar
- [ ] Notifications bell icon button (`Bell` from lucide) on the right side of toolbar, to the left of the user menu
- [ ] Notifications bell shows a small dot/badge indicator (no count, just presence indicator — always hidden for now since no notification system exists)
- [ ] Help button is a placeholder — clicking does nothing or shows a tooltip "Coming soon"
- [ ] Notifications button is a placeholder — clicking shows an empty popover "No notifications"
- [ ] Both icons use `ghost` button variant, sized consistently
- [ ] i18n keys added for tooltips/labels in both `en.json` and `pt.json`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Add User Menu to Top Toolbar
**Description:** As a user, I want a user avatar/menu in the top toolbar so I can access my profile and account actions from anywhere.

**Acceptance Criteria:**
- [ ] User avatar (initials circle or profile image) displayed at the far right of the toolbar
- [ ] Clicking avatar opens a dropdown showing: user name + email at top, then Profile, Settings, Help, Logout
- [ ] This dropdown reuses the same menu structure as the sidebar user profile dropdown (US-005)
- [ ] Consider extracting a shared `UserMenu` component used by both sidebar and toolbar
- [ ] Theme toggle (light/dark) and language toggle moved into this menu or kept as toolbar icons — at minimum, they must remain accessible on desktop
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Move Sidebar Collapse Toggle to Sidebar Edge
**Description:** As a user, I want to collapse/expand the sidebar by clicking a chevron at the sidebar edge so the toggle is discoverable but not visually cluttering.

**Acceptance Criteria:**
- [ ] Small chevron button appears at the right edge of the sidebar (vertically centered or near the top)
- [ ] Chevron is hidden by default and appears on hover over the sidebar edge area
- [ ] Clicking chevron toggles sidebar between expanded (260px) and collapsed (72px)
- [ ] Collapsed state persists in localStorage (existing `STORAGE_KEY` behavior preserved)
- [ ] The `toggle-sidebar` custom event still works (for command palette integration)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Fix Collapsed Sidebar Dock Behavior
**Description:** As a user, I want the collapsed sidebar to behave like a dock — centered icons, proper tooltips, and clear active states — so it feels intentional, not broken.

**Acceptance Criteria:**
- [ ] Collapsed sidebar width is exactly 72px
- [ ] All nav icons are perfectly centered horizontally and vertically (`flex`, `justify-center`, `items-center`)
- [ ] Icon size increased from 16px (`h-4 w-4`) to ~20-22px (`h-5 w-5`) for better visibility
- [ ] Every nav item shows a tooltip on hover (right side) with the page name — already implemented, verify it works
- [ ] Active item in collapsed mode has the same visual treatment as expanded (background + left border + colored icon)
- [ ] Navigation group separators are visible as subtle horizontal lines or increased gaps
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Update Sidebar Dimensions and Spacing
**Description:** As a user, I want the sidebar to feel more spacious and premium with proper sizing.

**Acceptance Criteria:**
- [ ] Expanded sidebar width changed from 256px (`w-64`) to 260px (custom value or closest Tailwind utility)
- [ ] Nav item height is 44px (currently ~36px with `py-2`)
- [ ] Gap between navigation groups is 16px
- [ ] Icon size is 20-22px (up from 16px)
- [ ] Overall padding and spacing feels balanced — not cramped
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Update Mobile Sidebar Content
**Description:** As a user on mobile, I want the sheet-based sidebar to reflect the same grouped navigation and user profile block as the desktop sidebar.

**Acceptance Criteria:**
- [ ] `MobileSidebarContent` updated with the same navigation groups (Overview, Collections, Account)
- [ ] User profile block at bottom with avatar, name, email
- [ ] Tapping user profile block shows the same menu (Profile, Settings, Help, Logout)
- [ ] Logout removed from being a standalone button — only accessible via user menu
- [ ] Existing mobile header remains (hamburger + logo + theme/language toggles)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Add i18n Keys for All New UI Strings
**Description:** As a developer, I need all new UI strings to be translatable in both English and Portuguese.

**Acceptance Criteria:**
- [ ] New keys added to `en.json` and `pt.json` for: navigation group labels (Overview, Collections, Account), toolbar placeholders (search, help, notifications), user menu items (Settings, Help), "Collection Manager" subtitle, notification empty state, etc.
- [ ] No hardcoded strings in any new or modified components
- [ ] Typecheck passes

### US-015: Update Existing Tests and Add Tests for New Components
**Description:** As a developer, I need tests updated so the test suite passes with the new layout structure.

**Acceptance Criteria:**
- [ ] Existing sidebar tests updated to reflect grouped navigation and removed bottom buttons
- [ ] Existing header tests still pass (mobile header unchanged in behavior)
- [ ] New `TopToolbar` component has a co-located `.test.tsx` file
- [ ] New `UserMenu` component (if extracted) has a co-located `.test.tsx` file
- [ ] All tests pass: `npm test` exits cleanly
- [ ] Typecheck passes: `npx tsc -b` exits cleanly

## Functional Requirements

- FR-1: Sidebar header must display logo + "GeekVault" + "Collection Manager" when expanded, and centered logo icon when collapsed
- FR-2: Sidebar header height must be 72px
- FR-3: Navigation items must be grouped into three sections: Overview, Collections, Account — with muted group labels
- FR-4: Active nav item must have accent background, 3px left border, and colored icon
- FR-5: Sidebar bottom must contain a user profile block (avatar + name + email) with a click-to-open dropdown menu
- FR-6: User profile dropdown must contain: Profile, Settings (placeholder), Help (placeholder), Logout
- FR-7: Desktop top toolbar must span the content area with height matching sidebar header (72px)
- FR-8: Toolbar must contain: search trigger (left), help icon, notifications bell, user avatar menu (right)
- FR-9: Search trigger in toolbar must open the existing command palette
- FR-10: Notifications bell must show an empty state popover; help button must show a "Coming soon" tooltip
- FR-11: Sidebar collapse toggle must be a hover-reveal chevron at the sidebar right edge
- FR-12: Collapsed sidebar must be 72px wide with perfectly centered icons and tooltips on hover
- FR-13: Expanded sidebar must be 260px wide with 44px item height and 16px group gaps
- FR-14: Nav icons must be 20-22px (up from 16px)
- FR-15: Mobile sidebar (sheet) must mirror the grouped navigation and user profile block
- FR-16: All new strings must have i18n keys in both `en.json` and `pt.json`
- FR-17: Theme and language toggles must remain accessible (via toolbar icons or user menu)

## Non-Goals

- No mobile bottom tab bar in this phase (keep existing sheet sidebar)
- No functional notifications system — bell is a visual placeholder only
- No functional settings page — menu item is a placeholder
- No functional help system — just a placeholder
- No changes to the command palette logic (only wiring the toolbar search to open it)
- No backend API changes
- No changes to routing or page content

## Design Considerations

- Follow the visual mockup in `image.png` closely for layout, spacing, and proportions
- Reuse existing design tokens: `sidebar-background`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, etc.
- Reuse existing shadcn/ui primitives: `Button`, `DropdownMenu` (or add if not present), `Tooltip`
- Consider extracting a `UserMenu` component shared between sidebar bottom and toolbar
- Consider extracting a `TopToolbar` component in `components/layout/`
- Sidebar transition animation (expand/collapse) must remain smooth (existing `transition-all duration-250` pattern)
- The hover-reveal chevron for collapse should use a subtle fade-in animation

## Technical Considerations

- Sidebar width change from `w-64` (256px) to 260px may require a custom Tailwind value (e.g., `w-[260px]`) or a theme extension
- Collapsed width change from `w-16` (64px) to 72px needs `w-[72px]`
- The `app-layout.tsx` structure needs to accommodate the new toolbar between the header area and main content
- The `toggle-sidebar` custom event must continue working for command palette integration
- The `DropdownMenu` component from shadcn/ui may need to be added if not already present — check `components/ui/`
- `MobileSidebarContent` and `Sidebar` should ideally share the navigation group data structure to avoid duplication
- The search trigger in the toolbar should dispatch the same keyboard event or use a shared state to open the command palette

## Success Metrics

- Sidebar visually matches the mockup in `image.png` in both expanded and collapsed states
- All existing navigation still works — no broken links or missing pages
- Collapsed sidebar feels like a dock, not a squeezed menu — icons centered, tooltips work, active state clear
- Top toolbar provides quick access to search, help, notifications, and user actions
- All tests pass, typecheck passes, no regressions
- Both English and Portuguese translations complete for all new strings

## Open Questions

- Should the "Settings" placeholder in the user menu navigate to the profile page (as a temporary destination) or do nothing? - Let's show the option, but disabled since we currently don't have the Settings page.
- Should the theme/language toggles live as standalone toolbar icons, inside the user menu dropdown, or both? - Keep as toolbar icon - HELP | Notifications | Language | User
- Should the sidebar edge chevron appear on hover over the entire sidebar, or just a narrow trigger zone at the edge? - Do as your best judgement as a designer.
- What avatar image should be used when the user has no profile photo — keep initials circle, or use a default avatar icon? - You can use a default avatar icon
