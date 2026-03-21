# PRD: Plan the GeekVault SaaS-Grade Frontend Redesign

## Introduction

GeekVault's current frontend is functional but lacks the polish, cohesion, and "wow factor" of top-tier SaaS products. Before implementing any code changes, we need a comprehensive **design planning phase** that audits the current state, explores design directions using the **frontend-design skill**, and produces a detailed implementation PRD.

This PRD covers the **planning work only**. The deliverable of each story is design documentation, not code — mockup descriptions, design tokens, component specs, layout decisions, and interaction definitions. The final output is a complete, implementation-ready PRD (`tasks/prd-saas-redesign-implementation.md`) that can be handed off for execution.

**Strategy:** Visual impact first (theme exploration + motion language), then layout decisions, then page-by-page design for each section, then admin area design, and finally assembly into the implementation PRD.

## Goals

- Audit the current frontend implementation to identify design gaps and inconsistencies
- Use the **frontend-design skill** to explore and propose a distinctive premium visual identity — unconstrained by the current Navy + Gold scheme
- Define the complete design language: palette, typography, spacing, elevation, motion, and interaction patterns
- Produce page-by-page design specs for every section of the app
- Design a full admin area (user management, system settings, analytics dashboards, audit logs)
- Resolve all open design decisions before any implementation begins
- Deliver a single, comprehensive implementation PRD as the final artifact

## User Stories

---

### Phase 1: Visual Foundation (Impact First)

---

### US-001: Audit Current Design & Identify Gaps

**Description:** As a designer, I want a thorough audit of the current frontend so that I know exactly what exists, what works, and what needs to change.

**Scope:** Review every page, component, and interaction in the current app. Document the current design system (tokens, components, patterns), identify inconsistencies, and catalog what's missing for a premium SaaS experience.

**Deliverable:** Design audit document covering current state, strengths, weaknesses, and gap analysis.

**Acceptance Criteria:**
- [ ] Current color palette, typography, spacing, and elevation documented
- [ ] Every page screenshotted or described with current layout and components used
- [ ] Design inconsistencies cataloged (spacing, color usage, component patterns)
- [ ] Missing components or patterns identified (what top-tier SaaS apps have that GeekVault doesn't)
- [ ] Responsive behavior gaps documented (mobile, tablet, desktop)
- [ ] Accessibility gaps identified
- [ ] Dark mode quality assessed
- [ ] Document saved to `tasks/design-audit.md`

---

### US-002: Design System & Theme Exploration (Light + Dark)

**Description:** As a designer, I want to explore and define a new visual identity so that GeekVault feels like a premium product from the first moment a user sees it.

**Scope:** Use the **frontend-design skill** to propose color palettes, typography pairings, spacing scales, shadow/elevation systems, and border-radius tokens for both light and dark modes. Present options, select one, and document the full token specification.

**Deliverable:** Complete design token specification for the new identity.

**Acceptance Criteria:**
- [ ] Frontend-design skill invoked to propose 2-3 palette directions with rationale
- [ ] Selected palette defined: primary, accent, semantic (success/warning/destructive/info), neutrals — for both light and dark modes
- [ ] Typography scale defined: font families (display + body), sizes, weights, line-heights
- [ ] Spacing scale defined (base unit, scale progression)
- [ ] Border-radius tokens defined (sm, md, lg, xl, full)
- [ ] Shadow/elevation scale defined (sm, md, lg, xl) for both modes
- [ ] Sidebar-specific tokens defined
- [ ] Chart color palette (6-8 harmonious colors) defined
- [ ] Focus ring, selection, and highlight colors defined
- [ ] Side-by-side light vs dark comparison described for key surfaces (background, card, sidebar, input)
- [ ] Document saved to `tasks/design-tokens.md`

---

### US-003: Animation & Motion Language Definition

**Description:** As a designer, I want a defined motion language so that every animation in the app feels intentional, consistent, and premium.

**Scope:** Define animation principles, timing curves, duration tokens, and specific animation patterns for every type of interaction (page transitions, component entrances, hover/press states, loading, drag-and-drop, modals, toasts).

**Deliverable:** Motion system specification.

**Acceptance Criteria:**
- [ ] Animation principles defined (e.g., "purposeful, fast, physics-based")
- [ ] Duration tokens: instant, fast, normal, slow, deliberate — with ms values
- [ ] Easing curves: standard, enter, exit, spring — with bezier/spring values
- [ ] Page transition pattern defined (enter, exit, between-page)
- [ ] Component entrance patterns: stagger timing, individual entrance (fade, scale, slide)
- [ ] Hover/press micro-interaction patterns for buttons, cards, links, icons
- [ ] Loading/skeleton animation pattern
- [ ] Modal/dialog/sheet entrance and exit patterns
- [ ] Toast notification entrance pattern
- [ ] Drag-and-drop feedback pattern (lift, move, drop)
- [ ] Reduced-motion fallback strategy
- [ ] Document saved to `tasks/design-motion.md`

---

### Phase 2: Layout Decisions

---

### US-004: App Shell & Navigation Design

**Description:** As a designer, I want to decide the optimal navigation layout so that users can move through the app effortlessly on any device.

**Scope:** Use the **frontend-design skill** to evaluate layout paradigms (sidebar, top-nav, hybrid, novel) and propose the best approach for GeekVault. Define the navigation structure, responsive behavior, and key layout components.

**Deliverable:** Navigation and layout specification.

**Acceptance Criteria:**
- [ ] Frontend-design skill invoked to propose layout paradigm with rationale
- [ ] Layout paradigm selected and justified (sidebar, top-nav, hybrid, or other)
- [ ] Desktop layout defined: navigation placement, content area, toolbar/header
- [ ] Tablet adaptation defined
- [ ] Mobile layout defined: navigation approach (bottom nav, drawer, sheet, etc.)
- [ ] Navigation item hierarchy: primary, secondary, utility — with groupings
- [ ] Items: Dashboard, Collections, Collection Types, Wishlist, Profile, Admin (conditional)
- [ ] Active/hover/focus states for nav items described
- [ ] Breadcrumbs or location awareness strategy defined
- [ ] Collapse/expand behavior and persistence described
- [ ] User menu design: avatar, links, theme toggle, logout
- [ ] Document saved to `tasks/design-layout.md`

---

### US-005: Command Palette Design

**Description:** As a designer, I want to design an enhanced command palette so that power users can navigate and act quickly.

**Scope:** Define the command palette's visual design, search behavior, result grouping, and keyboard interactions.

**Deliverable:** Command palette specification.

**Acceptance Criteria:**
- [ ] Visual design: backdrop, container, search input, result list — matching new theme
- [ ] Result groups defined: Navigation, Collections, Recent Items, Actions, Settings
- [ ] Result item layout: icon + label + description + shortcut hint
- [ ] Keyboard interaction: open (Cmd/Ctrl+K), navigate (arrows), select (Enter), dismiss (Esc)
- [ ] Search behavior: fuzzy match, what gets indexed
- [ ] Empty state and no-results state defined
- [ ] Entrance/exit animation described
- [ ] Document appended to `tasks/design-layout.md`

---

### Phase 3: Page-by-Page Design

---

### US-006: Dashboard / Home Screen Design

**Description:** As a designer, I want to design a dashboard that gives users an at-a-glance overview and makes them excited to engage with the app.

**Scope:** Use the **frontend-design skill** to design the dashboard layout, stats display, charts, collection summaries, and recent acquisitions. Define empty state and loading state.

**Deliverable:** Dashboard page design specification.

**Acceptance Criteria:**
- [ ] Frontend-design skill invoked for dashboard design
- [ ] Overall layout defined: section order, grid structure, spacing
- [ ] Welcome/greeting section designed (personalized or time-aware)
- [ ] Stats row: card layout, which metrics to show, animated number behavior, trend indicators
- [ ] Charts section: chart types, layout, color usage, legends, tooltips, responsive behavior
- [ ] Collection summaries: card design, cover images, key metrics shown
- [ ] Recent acquisitions: layout choice (table vs cards), columns/fields shown
- [ ] Empty state (no collections): onboarding CTA design
- [ ] Loading state: skeleton layout matching final design
- [ ] Responsive behavior: desktop → tablet → mobile described
- [ ] Document saved to `tasks/design-pages.md` under "Dashboard" section

---

### US-007: Collections List Page Design

**Description:** As a designer, I want to design the collections browsing experience so that managing the vault feels enjoyable and premium.

**Scope:** Design grid view, list view, toolbar, filters, search, create/edit dialogs, and empty state.

**Deliverable:** Collections page design specification.

**Acceptance Criteria:**
- [ ] Grid view card design: cover image treatment, metadata overlay, hover effects, action buttons
- [ ] List view design: table columns, row layout, inline actions
- [ ] Toolbar design: search, filters (type, sort), view toggle, create button — layout and styling
- [ ] Create/edit dialog: form layout, image upload dropzone, validation states
- [ ] Delete confirmation design
- [ ] Empty state: CTA to create first collection
- [ ] Drag-to-reorder: visual feedback during drag
- [ ] Responsive behavior described for each view mode
- [ ] Document appended to `tasks/design-pages.md` under "Collections List" section

---

### US-008: Collection Detail Page Design

**Description:** As a designer, I want to design a rich collection detail view showing items, sets, and stats in one place.

**Scope:** Design the collection header, catalog item grid/list, filtering, tabs/sections, and import entry point.

**Deliverable:** Collection detail page design specification.

**Acceptance Criteria:**
- [ ] Collection header: cover image/banner treatment, title, description, metadata, action buttons
- [ ] Catalog items view: grid card design and list row design
- [ ] Item card: image, name, key attributes, condition indicator
- [ ] Search and filter bar for items within collection
- [ ] Stats summary: what metrics, where positioned
- [ ] Tab/section structure: All Items, Sets, Stats (or alternative organization)
- [ ] Import wizard entry point placement
- [ ] Responsive layout described
- [ ] Document appended to `tasks/design-pages.md` under "Collection Detail" section

---

### US-009: Catalog Item Detail Page Design

**Description:** As a designer, I want to design a detailed item page that showcases all information and owned copies beautifully.

**Scope:** Design the item hero, metadata display, owned copies section, and related navigation.

**Deliverable:** Catalog item detail page design specification.

**Acceptance Criteria:**
- [ ] Item hero layout: image(s) placement, name, key attributes
- [ ] Metadata display: how custom fields are organized and shown
- [ ] Owned copies section: copy cards, add/edit flow entry points
- [ ] Set membership indicator design
- [ ] Back navigation and breadcrumb integration
- [ ] Responsive: side-by-side (desktop) vs stacked (mobile) described
- [ ] Document appended to `tasks/design-pages.md` under "Catalog Item Detail" section

---

### US-010: Owned Copies Design

**Description:** As a designer, I want to design owned copy management so users can track condition, value, and images with rich detail.

**Scope:** Design copy cards, image gallery, create/edit forms, and inline editing patterns.

**Deliverable:** Owned copies design specification.

**Acceptance Criteria:**
- [ ] Copy card design: condition badge, purchase date, price, thumbnail
- [ ] Image gallery: grid layout, lightbox/zoom interaction
- [ ] Create/edit form: field layout, multi-image upload, validation
- [ ] Delete confirmation design
- [ ] Inline editing pattern (quick update for condition or price)
- [ ] Document appended to `tasks/design-pages.md` under "Owned Copies" section

---

### US-011: Sets Page & Set Detail Design

**Description:** As a designer, I want to design set tracking so users can visualize their completion progress.

**Scope:** Design the sets listing and set detail view with completion tracking.

**Deliverable:** Sets design specification.

**Acceptance Criteria:**
- [ ] Sets list: card/table design with set name, collection, completion progress
- [ ] Completion visualization: progress bar, ring, or other visual — with percentage
- [ ] Set detail: header with progress, item list with owned/missing visual distinction
- [ ] Owned vs missing item visual treatment
- [ ] Quick action design: add missing item to wishlist
- [ ] Responsive layout described
- [ ] Document appended to `tasks/design-pages.md` under "Sets" section

---

### US-012: Wishlist Page Design

**Description:** As a designer, I want to design a polished wishlist that helps users prioritize and track desired items.

**Scope:** Design grouped layout, priority system, filters, cards, and create/edit dialogs.

**Deliverable:** Wishlist page design specification.

**Acceptance Criteria:**
- [ ] Grouped layout: collection sections with collapse/expand
- [ ] Priority badge design: high (urgent visual), medium (normal), low (subtle)
- [ ] Item card: name, priority, target price, notes, catalog item link
- [ ] Filter and sort bar design
- [ ] Create/edit dialog: form layout and field arrangement
- [ ] Drag-to-reorder: visual feedback within priority groups
- [ ] Empty state design
- [ ] Responsive grid described
- [ ] Document appended to `tasks/design-pages.md` under "Wishlist" section

---

### US-013: Collection Types Page Design

**Description:** As a designer, I want to design collection type management with the new visual identity.

**Scope:** Design the types list, create/edit dialog, and empty state.

**Deliverable:** Collection types design specification.

**Acceptance Criteria:**
- [ ] Types list: card or table design with type name, icon/color, collection count
- [ ] Create/edit dialog: name, icon picker or color assignment
- [ ] Delete confirmation with usage warning
- [ ] Empty state with CTA
- [ ] Document appended to `tasks/design-pages.md` under "Collection Types" section

---

### US-014: User Profile Page Design

**Description:** As a designer, I want to design a polished profile page for account and preference management.

**Scope:** Design profile header, form sections, avatar management, and appearance controls.

**Deliverable:** Profile page design specification.

**Acceptance Criteria:**
- [ ] Profile header: avatar (with upload overlay), display name, email
- [ ] Form sections: Account Info, About, Preferences, Appearance
- [ ] Theme toggle design: light/dark/system with visual preview or toggle style
- [ ] Save action: button placement, feedback states
- [ ] Loading skeleton layout
- [ ] Responsive layout described
- [ ] Document appended to `tasks/design-pages.md` under "Profile" section

---

### US-015: Auth Pages Design (Login + Register)

**Description:** As a designer, I want to design beautiful auth pages that make a premium first impression.

**Scope:** Design auth layout, login form, register form, and error states.

**Deliverable:** Auth pages design specification.

**Acceptance Criteria:**
- [ ] Auth layout: split-screen or full-bleed concept with brand storytelling
- [ ] Decorative panel: gradients, patterns, or imagery
- [ ] Login form: field layout, error states, links
- [ ] Register form: field layout, validation, links
- [ ] Loading state on submit
- [ ] Responsive: mobile adaptation (hide decorative panel, center form)
- [ ] Document appended to `tasks/design-pages.md` under "Auth Pages" section

---

### Phase 4: Admin Area Design

---

### US-016: Admin Layout & Navigation Design

**Description:** As a designer, I want to design the admin area layout so it feels connected to the main app but clearly differentiated.

**Scope:** Design admin layout, navigation structure, and visual differentiation from the user-facing app.

**Deliverable:** Admin layout design specification.

**Acceptance Criteria:**
- [ ] Layout approach: shared shell with admin section vs separate admin layout
- [ ] Navigation items: Users, Settings, Analytics, Audit Log
- [ ] Visual differentiation strategy: accent color, badge, section header, or other
- [ ] Back-to-app navigation design
- [ ] Responsive admin layout described
- [ ] Route structure: `/admin/*` with sub-routes
- [ ] Document saved to `tasks/design-admin.md` under "Admin Layout" section

---

### US-017: Admin — User Management Design

**Description:** As a designer, I want to design user management so admins can control access and roles efficiently.

**Scope:** Design user list, search/filter, user detail, role editing, and account enable/disable.

**Deliverable:** User management design specification.

**Acceptance Criteria:**
- [ ] User list: table design with columns (avatar, name, email, role, status, last active)
- [ ] Search and filter bar design
- [ ] User detail view: profile info, collection stats summary
- [ ] Edit user: role change, enable/disable — with confirmation dialogs
- [ ] Pagination design
- [ ] Document appended to `tasks/design-admin.md` under "User Management" section

---

### US-018: Admin — System Settings Design

**Description:** As a designer, I want to design a settings page with grouped configuration options.

**Scope:** Design settings categories, form layouts, and save behavior.

**Deliverable:** System settings design specification.

**Acceptance Criteria:**
- [ ] Settings categories: General, Security, Features, Storage
- [ ] Each category: fields listed with input types (text, toggle, select, number)
- [ ] Per-section save behavior and feedback design
- [ ] Responsive layout described
- [ ] Document appended to `tasks/design-admin.md` under "System Settings" section

---

### US-019: Admin — Analytics Dashboard Design

**Description:** As a designer, I want to design analytics dashboards so admins can understand platform usage at a glance.

**Scope:** Design metrics display, growth charts, usage breakdown, and time range controls.

**Deliverable:** Analytics dashboard design specification.

**Acceptance Criteria:**
- [ ] Platform stats: which metrics, card layout
- [ ] Growth charts: chart types, axes, time range selector design
- [ ] Usage breakdown: most active users, largest collections, popular types — display format
- [ ] Time range selector: 7d, 30d, 90d, all time — design and placement
- [ ] Loading and empty state designs
- [ ] Responsive layout described
- [ ] Document appended to `tasks/design-admin.md` under "Analytics" section

---

### US-020: Admin — Audit Log Design

**Description:** As a designer, I want to design an audit log for tracking platform actions.

**Scope:** Design the log table, filtering, search, detail expansion, and export.

**Deliverable:** Audit log design specification.

**Acceptance Criteria:**
- [ ] Log table: columns (timestamp, user, action, target, details)
- [ ] Filter design: action type, user, date range
- [ ] Search bar design and placement
- [ ] Detail expansion interaction (row click or expand icon)
- [ ] Export button design and placement
- [ ] Pagination design
- [ ] Document appended to `tasks/design-admin.md` under "Audit Log" section

---

### Phase 5: Assemble Implementation PRD

---

### US-021: Compile Implementation PRD

**Description:** As a project lead, I want all design decisions compiled into a single implementation PRD so that the redesign can be executed systematically.

**Scope:** Take all design documents produced in US-001 through US-020 and assemble them into a comprehensive, implementation-ready PRD with user stories that reference the design specs.

**Deliverable:** `tasks/prd-saas-redesign-implementation.md` — the "real" PRD.

**Acceptance Criteria:**
- [ ] All design decisions from US-001–US-020 incorporated
- [ ] Implementation user stories written for each section (with code-level acceptance criteria)
- [ ] Stories reference specific design spec documents for visual details
- [ ] Stories ordered by dependency (theme → layout → pages → admin → review)
- [ ] Each story scoped to be implementable in one focused session using the frontend-design skill
- [ ] Functional requirements, non-goals, technical considerations included
- [ ] Open questions resolved or explicitly deferred
- [ ] PRD reviewed for completeness and internal consistency
- [ ] Document saved to `tasks/prd-saas-redesign-implementation.md`

---

### US-022: Design Review & Sign-Off

**Description:** As a stakeholder, I want to review the complete design plan before implementation begins so that I can catch issues and approve the direction.

**Scope:** Present the full design plan for review — visual identity, layout, every page, admin area — and incorporate feedback before finalizing.

**Acceptance Criteria:**
- [ ] Full design walkthrough prepared (can reference all design-*.md documents)
- [ ] Key design decisions highlighted with rationale
- [ ] Trade-offs and alternatives documented
- [ ] Feedback incorporated into design specs and implementation PRD
- [ ] Final sign-off recorded
- [ ] Implementation PRD marked as approved and ready for execution

---

## Functional Requirements

- FR-1: Every design story must invoke the **frontend-design skill** for creative direction
- FR-2: Design specs must cover both light and dark mode for every surface
- FR-3: Design specs must describe responsive behavior for mobile (320px+), tablet (768px+), and desktop (1024px+)
- FR-4: Design specs must define loading, empty, and error states for every page
- FR-5: Design specs must include accessibility considerations (focus, ARIA, keyboard, reduced motion)
- FR-6: The implementation PRD must contain stories small enough for one focused session each
- FR-7: Admin area design must cover user management, system settings, analytics, and audit logs
- FR-8: All design documents must be saved to `tasks/` for reference during implementation

## Non-Goals (Out of Scope)

- Writing any implementation code (this PRD is planning only)
- Backend API changes or new endpoint design
- Functional changes to existing features (this is a visual redesign)
- User research or usability testing (we're designing based on SaaS best practices)
- Marketing, landing pages, or email templates
- Mobile native app or PWA considerations

## Design Considerations

- The **frontend-design skill** has full creative freedom — not constrained by the current Navy + Gold palette
- Current tech stack (React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, recharts) is fixed — designs must work within these tools
- Existing component library should be evolved, not replaced
- Feature-based folder structure (`features/`) must be maintained
- Designs should be opinionated — propose one strong direction, not multiple weak options

## Technical Considerations

- Design documents should reference existing file paths where components live
- Note where new files/components will be needed vs existing ones to modify
- Flag any designs that might require new npm dependencies
- Consider the 90% test coverage gate — designs should be testable
- i18n: note any new UI strings that will need translation entries

## Success Metrics

- Complete set of design specification documents covering every section of the app
- A single implementation PRD (`prd-saas-redesign-implementation.md`) that is detailed enough for execution without further design decisions
- Every open question resolved or explicitly deferred with rationale
- Stakeholder sign-off on design direction before implementation begins

## Open Questions

- Are there any brand assets (logo SVG, icon set, illustrations) that should be incorporated into the designs?
- What specific admin role(s) exist in the backend? (Needed for admin area route protection design)
- Are there any competitive apps or SaaS products whose design should be used as explicit inspiration?
- Should the admin area backend endpoints be designed alongside the frontend, or handled in a separate PRD?

## Output Documents

| Document | Created By | Description |
|----------|-----------|-------------|
| `tasks/design-audit.md` | US-001 | Current state audit and gap analysis |
| `tasks/design-tokens.md` | US-002 | Color, typography, spacing, elevation, and theme tokens |
| `tasks/design-motion.md` | US-003 | Animation principles, timing, and interaction patterns |
| `tasks/design-layout.md` | US-004, US-005 | Navigation, app shell, and command palette specs |
| `tasks/design-pages.md` | US-006 → US-015 | Page-by-page design specs (all user-facing pages) |
| `tasks/design-admin.md` | US-016 → US-020 | Admin area design specs |
| `tasks/prd-saas-redesign-implementation.md` | US-021 | The final implementation PRD |
