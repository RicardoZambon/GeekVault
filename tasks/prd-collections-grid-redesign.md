# PRD: Collections Grid Redesign (Phase 3)

## Introduction

Redesign the Collections page from a blog-style card layout to a Netflix/Steam-inspired visual cover grid. Collections become clickable visual tiles with cover images, overlay metadata, and a unified toolbar — creating a SaaS-grade, collectible-oriented browsing experience. This phase also adds server-side sorting and an `updatedAt` timestamp to the Collection model.

## Goals

- Transform collection cards into visual cover tiles (Netflix/Steam pattern) with gradient overlay metadata
- Replace the current search/filter area with a unified horizontal toolbar (search + type filter + sort + CTA)
- Add server-side sort support to the collections API (`name`, `updatedAt`, `itemCount`, `createdAt`)
- Add `UpdatedAt` / `CreatedAt` timestamps to the Collection entity and expose in the API response
- Implement responsive 3-column grid (desktop) / 2-column (tablet) / 1-column (mobile)
- Remove redundant UI elements: subtitle, "View" button, overly wide search
- Add collapsible mobile filter toolbar behind a "Filters" toggle
- Display collection completion percentage on cover cards
- Allow users to set a catalog item's image as the collection cover
- Support drag-to-reorder collections in grid view

## User Stories

### US-001: Add timestamps to Collection entity
**Description:** As a developer, I need `CreatedAt` and `UpdatedAt` timestamps on collections so the frontend can display "Updated X days ago" metadata and support date-based sorting.

**Acceptance Criteria:**
- [ ] Add `CreatedAt` (DateTime, default UTC now) and `UpdatedAt` (DateTime, nullable) to the `Collection` model
- [ ] Generate and apply EF Core migration (existing rows get `CreatedAt = UTC now`, `UpdatedAt = null`)
- [ ] `UpdatedAt` is set on every PUT to `/api/collections/{id}` (in `CollectionsService.UpdateAsync`)
- [ ] `UpdatedAt` is set on cover upload (in `CollectionsService.UploadCoverAsync`)
- [ ] `UpdatedAt` is set when catalog items are added/removed — update `CatalogItemsService.CreateAsync` and `CatalogItemsService.DeleteAsync` to load the parent Collection and set `UpdatedAt = DateTime.UtcNow` before saving
- [ ] `UpdatedAt` is set when catalog items are reordered — update `CatalogItemsService.ReorderAsync` to touch the parent Collection
- [ ] `UpdatedAt` is set when owned copies are added/removed — update `OwnedCopiesService.CreateAsync` and `OwnedCopiesService.DeleteAsync` to propagate `UpdatedAt` to the parent Collection (via CatalogItem → Collection)
- [ ] `CreatedAt` is set on POST to `/api/collections`
- [ ] Both fields included in `CollectionResponse` DTO
- [ ] `CollectionTypeName` included in `CollectionResponse` DTO — requires adding `.Include(c => c.CollectionType)` to `CollectionsRepository.GetByUserIdAsync()` and mapping `c.CollectionType.Name` in the service
- [ ] Existing integration tests still pass
- [ ] Typecheck passes (`dotnet build`)

### US-002: Add server-side sort to collections API
**Description:** As a user, I want to sort my collections by name, last updated, most items, or recently added so I can quickly find what I need.

**Acceptance Criteria:**
- [ ] `GET /api/collections` accepts optional query params: `sortBy` (name | updatedAt | itemCount | createdAt) and `sortDir` (asc | desc)
- [ ] Default sort: `name` ascending
- [ ] Sorting is performed in the database query (not in-memory)
- [ ] Refactor `CollectionsService.GetAllAsync` to eliminate the N+1 item count query — replace the per-collection `GetItemCountAsync()` loop with a single projected query (e.g., `GroupJoin` or subquery) that returns collections with their item counts in one database round-trip
- [ ] The `itemCount` sort option must use the DB-level count (not fetch all items to count in-memory)
- [ ] Integration tests cover each sort option (name asc/desc, updatedAt, itemCount, createdAt)
- [ ] Typecheck passes (`dotnet build`)

### US-003: Remove page subtitle and restructure header
**Description:** As a user, I want a cleaner page header that shows just the title and the "New Collection" CTA button, without the redundant subtitle.

**Acceptance Criteria:**
- [ ] Remove `description` prop from `PageHeader` on collections page (removes "Manage your collectible collections.")
- [ ] "New Collection" button remains in the `actions` slot, right-aligned
- [ ] i18n key `collections.description` can remain in locale files (no breaking change) but is no longer rendered
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-004: Build collection toolbar
**Description:** As a user, I want a unified toolbar with search, type filter, sort dropdown, and CTA so I can efficiently browse collections.

**Acceptance Criteria:**
- [ ] Toolbar is a horizontal flex container below the page header
- [ ] Contains: search input (max-width 420px, search icon left), type filter dropdown, sort dropdown, "New Collection" button (right-aligned via `margin-left: auto`)
- [ ] Search filters collections by name (existing debounced behavior preserved)
- [ ] Type filter options: "All Types" (default), plus all collection types from API
- [ ] Sort dropdown options: "Name", "Last Updated", "Most Items", "Recently Added" — triggers server-side sort via API query params
- [ ] Sort default: "Name" ascending
- [ ] Sort preference (sortBy + sortDir) persisted to `localStorage` and restored on page load
- [ ] "New Collection" button moves from header `actions` slot into the toolbar (right side)
- [ ] New i18n keys added to both `en.json` and `pt.json`: sort options, toolbar labels
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-005: Collapsible mobile filter toolbar
**Description:** As a mobile user, I want filters hidden behind a "Filters" toggle button so the toolbar doesn't consume too much vertical space.

**Acceptance Criteria:**
- [ ] On mobile (< `sm` breakpoint): search input shown full-width; a "Filters" toggle button is shown next to it
- [ ] Tapping "Filters" reveals/hides the type filter + sort dropdown row with smooth animation
- [ ] "New Collection" button remains always visible (either in toolbar or as a floating/sticky element)
- [ ] On desktop (>= `sm`): all toolbar items shown inline, no toggle needed
- [ ] New i18n keys for "Filters" label in both `en.json` and `pt.json`
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-006: Collection cover card component
**Description:** As a user, I want each collection displayed as a visual cover tile (Netflix-style) so I can visually identify collections at a glance.

**Acceptance Criteria:**
- [ ] New `CollectionCoverCard` component (or refactored inline) replaces current card markup
- [ ] Card structure: full-bleed cover image (aspect-ratio 4/3, object-fit cover) with gradient overlay at the bottom
- [ ] Overlay contains: collection name (18px, semibold, white), metadata line (13px, white/85% opacity)
- [ ] Gradient overlay: `linear-gradient(transparent, rgba(0,0,0,0.7))`
- [ ] Fallback when no cover image: gradient placeholder with Library icon (existing behavior adapted)
- [ ] Entire card is clickable — navigates to `/collections/{id}`
- [ ] Card has `border-radius: 12px` and `overflow: hidden`
- [ ] Remove: "View" button, `CardFooter`, `CardContent` wrapper, type `Badge` from card body
- [ ] Remove `Eye` icon import if no longer used
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-007: Card metadata line
**Description:** As a user, I want to see item count and last updated time on each collection cover so I have context at a glance.

**Acceptance Criteria:**
- [ ] Metadata line below title in overlay: `"{count} items · Updated {timeAgo}"`
- [ ] Time displayed as relative (e.g., "2 days ago", "just now") — use a lightweight relative-time formatter or `Intl.RelativeTimeFormat`
- [ ] If `updatedAt` is null, show only item count
- [ ] Metadata styled: 13px, white text, 85% opacity
- [ ] New i18n keys for "Updated" and time-ago patterns in both `en.json` and `pt.json`
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-008: Card hover interactions and quick actions
**Description:** As a user, I want hover feedback and quick action buttons revealed on hover so I can quickly open or edit a collection.

**Acceptance Criteria:**
- [ ] On hover: card lifts with `translateY(-4px)` and increased box-shadow
- [ ] On hover: quick action buttons appear over the cover (e.g., "Open", "Edit", three-dot menu)
- [ ] "Open" navigates to collection detail
- [ ] "Edit" opens the edit dialog
- [ ] Three-dot menu provides "Delete" option (existing behavior)
- [ ] Quick actions have a semi-transparent backdrop so they're readable over any image
- [ ] On non-hover devices (touch), the three-dot menu is always visible
- [ ] Transition duration: ~200ms ease
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-009: Responsive grid layout
**Description:** As a user, I want the collection grid to show 3 columns on desktop, 2 on tablet, and 1 on mobile for optimal density.

**Acceptance Criteria:**
- [ ] Grid container: `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px`
- [ ] Effectively shows: ~3 cols on desktop, ~2 on tablet, 1 on mobile
- [ ] Page padding: 32px (or equivalent Tailwind spacing)
- [ ] Stagger animation preserved (Framer Motion `StaggerChildren`)
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-010: Grid vs. list view toggle
**Description:** As a user, I want to switch between a visual cover grid and a compact list view so I can choose the density that suits me.

**Acceptance Criteria:**
- [ ] Toggle button (grid icon / list icon) in the toolbar, next to sort dropdown
- [ ] Grid view: cover tile layout (default, as designed in US-006–009)
- [ ] List view: compact table/row layout showing collection name, type, item count, updated date — reuse `DataTable` DS component (similar pattern to collection-detail-page)
- [ ] Active view persisted to `localStorage` (key: `collections-view-mode`), restored on page load
- [ ] Default: grid view
- [ ] New i18n keys for view toggle tooltip in both `en.json` and `pt.json`
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-011: Skeleton loading state for cover grid

**Description:** As a user, I want skeleton placeholders that match the new cover card shape while collections load.

**Acceptance Criteria:**
- [ ] Loading state shows 6 skeleton cards in the same grid layout
- [ ] Each skeleton: aspect-ratio 4/3, rounded-xl, animated pulse
- [ ] Skeleton includes faint overlay area at bottom to mimic text placement
- [ ] Typecheck passes (`npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-012: Collection completion percentage on cover card
**Description:** As a user, I want to see how complete my collection is at a glance so I can prioritize which collections need attention.

**Acceptance Criteria:**
- [ ] `CollectionResponse` DTO includes `OwnedCount` (int) and `CompletionPercentage` (double, 0–100)
- [ ] Completion calculated as `(OwnedCount / ItemCount) * 100` — reuse the pattern from `SetsService` (completedCount / expectedItemCount)
- [ ] Computed in the same projected query as item count (no extra round-trip)
- [ ] If `ItemCount` is 0, `CompletionPercentage` is 0 (avoid division by zero)
- [ ] Displayed on the cover card overlay metadata line: `"28 items · 65% complete · Updated 2 days ago"`
- [ ] Optional: subtle progress bar at the bottom of the card (thin, semi-transparent white)
- [ ] New i18n keys for "complete" in both `en.json` and `pt.json`
- [ ] Integration tests verify completion calculation
- [ ] Typecheck passes (`dotnet build` and `npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-013: Select catalog item image as collection cover
**Description:** As a user, I want to pick one of my catalog item's images as the collection cover so I don't have to upload a separate image.

**Acceptance Criteria:**
- [ ] New endpoint: `POST /api/collections/{id}/cover-from-item/{itemId}` — copies the item's image file to a new collection cover path and sets `Collection.CoverImage`
- [ ] Image is **copied** (not referenced) so deleting the catalog item doesn't break the cover
- [ ] Validates that the item belongs to the collection and the collection belongs to the user
- [ ] Returns 404 if item has no image
- [ ] Sets `UpdatedAt` on the collection
- [ ] On the **collection detail page**: add "Use as Cover" option to the catalog item's context menu / dropdown (existing three-dot menu per item)
- [ ] Clicking "Use as Cover" calls the new endpoint and shows a success toast
- [ ] Collection cover updates immediately in the detail page header
- [ ] Integration test for the new endpoint (happy path + item-not-in-collection + item-has-no-image)
- [ ] Typecheck passes (`dotnet build` and `npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-014: Drag-to-reorder collections
**Description:** As a user, I want to drag collections to reorder them so I can prioritize my most important collections visually.

**Acceptance Criteria:**
- [ ] Add `SortOrder` (int, default 0) to `Collection` entity; generate EF Core migration
- [ ] New endpoint: `POST /api/collections/reorder` accepting `ReorderCollectionsRequest(List<int> CollectionIds)` — follows the existing `CatalogItemsService.ReorderAsync` pattern
- [ ] Default sort when `sortBy` is not specified changes from `name` to `sortOrder` (preserving user's manual arrangement)
- [ ] When user explicitly selects a sort option (name, updatedAt, etc.), drag reorder is disabled and a visual indicator shows sorting is active
- [ ] Frontend: wrap grid in `SortableList` component (already exists in DS) in grid view only
- [ ] Drag handle visible on hover (use `GripVertical` icon, same as collection-detail-page items)
- [ ] Reorder calls API endpoint, with optimistic UI update and rollback on error
- [ ] Drag-to-reorder disabled in list view (list view uses the selected sort)
- [ ] Integration test for reorder endpoint
- [ ] Typecheck passes (`dotnet build` and `npx tsc -b`)
- [ ] Verify in browser using dev-browser skill

### US-015: Update existing tests
**Description:** As a developer, I need the existing collections page tests to pass with the new UI structure.

**Acceptance Criteria:**
- [ ] All existing test scenarios in `collections-page.test.tsx` updated to work with new markup
- [ ] Tests cover: cover card rendering, card click navigation, hover quick actions, toolbar search/filter/sort, empty state, create/edit/delete dialogs
- [ ] New test for sort dropdown triggering API call with query params
- [ ] New test for mobile filter toggle
- [ ] New test for grid/list view toggle and localStorage persistence
- [ ] New test for completion percentage display on card
- [ ] New test for drag-to-reorder (SortableList interaction)
- [ ] Backend integration tests for: reorder endpoint, cover-from-item endpoint, completion % in response
- [ ] All tests pass (`npm test` and `dotnet test`)
- [ ] Typecheck passes (`npx tsc -b`)

## Functional Requirements

- FR-1: Add `CreatedAt` (DateTime) and `UpdatedAt` (DateTime?) columns to `Collection` entity; generate EF Core migration
- FR-2: `UpdatedAt` set automatically on collection update, cover upload, catalog item create/delete/reorder, and owned copy create/delete
- FR-3: `CollectionResponse` DTO includes `CreatedAt`, `UpdatedAt`, and `CollectionTypeName`
- FR-4: `GET /api/collections` accepts `sortBy` (name | updatedAt | itemCount | createdAt) and `sortDir` (asc | desc) query parameters; default: name asc
- FR-5: Sorting is performed at the database level via EF Core OrderBy; item count computed via subquery (not N+1)
- FR-6: Page header shows title only — no subtitle
- FR-7: Toolbar layout: search (max-width 420px) | type filter | sort dropdown | "New Collection" button (right-aligned)
- FR-8: Sort dropdown options: Name, Last Updated, Most Items, Recently Added
- FR-9: Mobile toolbar: search + "Filters" toggle; tapping toggle reveals/hides filter + sort row
- FR-10: Collection cards use cover tile pattern — full-bleed image (4:3 aspect ratio) with bottom gradient overlay containing title + metadata
- FR-11: Metadata line: `"{count} items · Updated {relativeTime}"`
- FR-12: Cover image fallback: user cover → gradient placeholder with icon (auto-collage deferred to future phase)
- FR-13: Card hover: translateY(-4px), shadow increase, quick action buttons revealed (Open, Edit, three-dot menu)
- FR-14: Entire card clickable — navigates to collection detail page
- FR-15: Grid: `repeat(auto-fill, minmax(320px, 1fr))` with 24px gap
- FR-16: Remove "View" button, card footer, type badge from card
- FR-17: Skeleton loading matches new cover card dimensions (4:3, rounded-xl)
- FR-18: All new UI strings added to both `en.json` and `pt.json`
- FR-19: Sort preference (sortBy + sortDir) persisted to `localStorage` and restored on page load
- FR-20: Grid vs. list view toggle in toolbar; active view persisted to `localStorage`; list view uses `DataTable` component
- FR-21: `CatalogItemsService` and `OwnedCopiesService` propagate `UpdatedAt` to parent Collection on create/delete/reorder
- FR-22: `CollectionResponse` includes `OwnedCount` and `CompletionPercentage` (computed as `OwnedCount / ItemCount * 100`)
- FR-23: Cover card metadata shows completion percentage: `"{count} items · {percent}% complete · Updated {time}"`
- FR-24: `POST /api/collections/{id}/cover-from-item/{itemId}` copies item image to collection cover path and updates `CoverImage`
- FR-25: "Use as Cover" option added to catalog item context menu on collection detail page
- FR-26: Add `SortOrder` (int) to `Collection` entity; `POST /api/collections/reorder` endpoint follows existing item reorder pattern
- FR-27: Grid view supports drag-to-reorder via `SortableList` when no explicit sort is selected; disabled when sorting by name/date/etc.

## Non-Goals

- Infinite scroll or pagination (current behavior: load all user collections)
- Changes to the collection detail page layout (only change: adding "Use as Cover" to item context menu)

## Future Enhancements (Out of Scope)

Features investigated and explicitly deferred. Included here for traceability.

### Auto-collage cover generation
**What:** When a collection has no user-defined cover, automatically generate a 2x2 grid collage from the first 4 catalog item images.
**Approach:** Client-side CSS grid of 4 item thumbnails rendered inside the card (no server-side image processing). Confirmed client-side approach.
**Why deferred:** Requires fetching item images in the collections list query (adds complexity to the projected query). The "select item as cover" feature (US-013) provides a good manual alternative. Gradient placeholder is acceptable for v1.
**Prerequisites:** US-013 (select item as cover) covers the most common case. Auto-collage becomes a polish item.
**Estimated effort:** ~1 day backend (add item image URLs to collection list response), ~1 day frontend (CSS grid fallback component).

### Bulk actions on collections
**What:** Multi-select collections to perform batch operations (delete, change type, export).
**Why deferred:** Significant missing infrastructure — no Checkbox component in the design system, no multi-select state management, `DataTable` has no selection support, no batch API endpoints. This is a cross-cutting feature that would benefit multiple pages (collections, catalog items, wishlist) and deserves its own PRD.
**Prerequisites:** Checkbox DS component, selection state hook, batch delete endpoint, confirmation UX for destructive batch operations.
**Estimated effort:** ~2-3 days backend (batch endpoints), ~3-4 days frontend (selection UI, toolbar, state management). Recommend a dedicated PRD.

## Design Considerations

- **Visual reference:** Netflix library, Steam game grid, Plex media covers, Notion database covers
- **Cover image aspect ratio:** 4:3 (320×240 effective) — balances visual impact with grid density
- **Gradient overlay:** `linear-gradient(transparent, rgba(0,0,0,0.7))` ensures white text readability over any image
- **Card border-radius:** 12px for modern, rounded feel
- **Reuse existing DS components:** `StaggerChildren`, `staggerItemVariants`, `Select`, `DropdownMenu`, `EmptyState`, `PageHeader`, `SkeletonRect`
- **Tailwind classes preferred** over custom CSS — use utilities like `aspect-[4/3]`, `rounded-xl`, `line-clamp-2`, `group-hover:opacity-100`
- **Cover fallback:** Gradient background (`from-primary/10 to-accent/10`) with centered Library icon — existing pattern, adapted to 4:3

## Technical Considerations

- **Backend migration:** Adding `CreatedAt`/`UpdatedAt` requires an EF Core migration. Existing rows get `CreatedAt = UTC now` and `UpdatedAt = null` as defaults
- **N+1 query fix:** `CollectionsService.GetAllAsync` currently calls `GetItemCountAsync()` per collection (N+1). Refactor to a single projected query using `.Select()` with a subquery for `CatalogItems.Count()`, returning all data in one round-trip. This is required for DB-level sort-by-itemCount to work
- **UpdatedAt propagation:** `CatalogItemsService` and `OwnedCopiesService` don't currently touch the `Collection` entity. They need to load the parent Collection (via `CollectionsRepository`) and set `UpdatedAt` before `SaveChangesAsync`. For `OwnedCopiesService`, the chain is OwnedCopy → CatalogItem → Collection (two hops)
- **CollectionTypeName:** `CollectionsRepository.GetByUserIdAsync()` does not currently `.Include(c => c.CollectionType)`. Add the include and map `c.CollectionType.Name` to the response DTO
- **Sort query params:** Frontend sends `?sortBy=name&sortDir=asc` to `GET /api/collections`; backend applies `IQueryable.OrderBy` before `ToListAsync`
- **Relative time formatting:** Use `Intl.RelativeTimeFormat` or a small utility function — avoid adding a heavy library like `date-fns` just for this
- **localStorage keys:** `collections-sort` (stores `{sortBy, sortDir}`) and `collections-view-mode` (stores `"grid"` | `"list"`)
- **i18n:** All new strings (sort options, "Filters" toggle, "Updated" label, time-ago patterns, view toggle tooltips) must be added to both `en.json` and `pt.json`
- **Test updates:** The test file `collections-page.test.tsx` heavily queries by current card structure (CardFooter, View button, etc.) — tests must be updated to match new markup
- **Performance:** Cover images should use `loading="lazy"` for off-screen cards
- **Completion %:** Compute in the same projected query as item count (add `OwnedCopies.Count()` subquery). Reuse the `SetsService` pattern: `completedCount / expectedItemCount * 100`. Guard against division by zero
- **Cover from item — image copy:** Copy the file to a new path (`collection-{id}-{timestamp}.{ext}`) rather than referencing the item's image URL. This avoids broken covers when items are deleted. Reuse `CollectionsService.UploadCoverAsync` file-saving logic
- **Collection SortOrder:** New EF Core migration. Existing rows get `SortOrder = 0` (will sort by creation order as tiebreaker). Frontend uses `SortableList` component (already integrated with `@dnd-kit`) — follows exact pattern from collection-detail-page item reorder
- **Drag vs. sort interaction:** When user selects an explicit sort (name, date, etc.), `SortableList` is replaced with a plain grid and drag handles are hidden. Default sort uses `SortOrder` to respect manual arrangement

## Success Metrics

- Collections page shows 3+ collections above the fold on desktop (vs. ~1 currently)
- All existing CRUD flows (create, edit, delete, cover upload) still work
- Sort by any option returns correctly ordered results
- Mobile toolbar is compact — filters hidden by default, revealable
- Hover interactions feel responsive (< 200ms transition)
- 90%+ test coverage maintained

## Resolved Decisions

- **Sort persistence:** Yes — sort preference persisted to `localStorage` (see US-004, FR-19)
- **Grid vs. list toggle:** Yes — view toggle added to toolbar, persisted to `localStorage` (see US-010, FR-20)
- **Auto-collage cover (future):** Client-side CSS grid approach confirmed — deferred to future phase (see Future Enhancements)
- **Completion % on card:** Included in this phase — data already computed in backend, just needs surfacing (see US-012)
- **Select item as cover:** Included — image is **copied** to collection cover path to avoid broken covers on item deletion (see US-013)
- **Drag-to-reorder:** Included — all infrastructure exists (`@dnd-kit`, `SortableList`, reorder pattern). Disabled when explicit sort is active (see US-014)
- **Bulk actions:** Deferred — missing cross-cutting infrastructure (Checkbox, multi-select, batch APIs). Deserves own PRD (see Future Enhancements)

## Open Questions

- For the list view, should rows be clickable (navigate to detail) or should they have explicit action buttons?
- Should the "New Collection" button in mobile become a FAB (floating action button) to save toolbar space?
- Should the completion % progress bar on the card be a thin bar at the bottom, or a circular/radial indicator in the overlay?
