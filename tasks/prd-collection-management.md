# GeekVault --- Collection Management System

## Product Requirements Document (PRD)

------------------------------------------------------------------------

## 1. Introduction

GeekVault is a collection management platform that allows collectors to
organize, catalog, and track collectible items across any category.

Users can define collection types with custom fields, create
collections, register catalog items, and track the physical copies they
own.

The system distinguishes between:

**Catalog Item** -- official collectible that exists in a collection\
**Owned Copy** -- physical экземпляar owned by the user

This distinction enables tracking:

-   duplicate items
-   item condition
-   acquisition history
-   investment per item
-   completion progress

The system provides visual catalog browsing, checklist-style tracking,
and analytics dashboards.

------------------------------------------------------------------------

## 2. Product Goals

-   Allow collectors to organize any collectible category
-   Track ownership and duplicates
-   Track completion of collectible sets
-   Provide visual browsing and gallery views
-   Provide collection analytics dashboards
-   Enable sharing and community discovery

------------------------------------------------------------------------

## 3. Product Scope by Phase

### Phase 1 --- MVP (Core Collection Management)

Goal: allow collectors to fully catalog their collections.

Includes:

-   Authentication
-   User profile
-   Multilanguage support (English / Portuguese)
-   Collection types with custom fields
-   Collections
-   Catalog items
-   Owned copies
-   Set definitions
-   Completion tracking
-   Wishlist
-   Visual gallery
-   Search/filter/sort
-   Dashboard analytics
-   Import/export
-   Modern UI
-   Light/Dark theme

------------------------------------------------------------------------

### Phase 2 --- Sharing and Community

Goal: enable collectors to share and discover collections.

Includes:

-   Collection visibility (Private / Public / Shared)
-   Public profiles
-   Shareable collection pages
-   Follow collectors
-   Activity feed
-   Explore page

------------------------------------------------------------------------

### Phase 3 --- Advanced Features

Future ecosystem features:

-   Collection templates marketplace
-   Collaborative collections
-   Advanced analytics
-   Tagging across collections
-   Barcode scanning
-   External pricing APIs
-   Cloud image storage

------------------------------------------------------------------------

## 4. Core Domain Model

### User

-   id
-   email
-   password hash
-   display name
-   avatar
-   bio
-   preferred language
-   preferred currency

------------------------------------------------------------------------

### Collection Type

Defines schema for collections.

Fields:

-   id
-   name
-   description
-   icon
-   custom field schema

Supported field types:

-   text
-   number
-   date
-   enum
-   boolean
-   image URL

------------------------------------------------------------------------

### Collection

-   id
-   user id
-   collection type id
-   name
-   description
-   cover image
-   visibility

------------------------------------------------------------------------

### Catalog Item

Official collectible.

-   id
-   collection id
-   identifier
-   name
-   description
-   release date
-   manufacturer
-   reference code
-   image
-   rarity
-   custom fields

------------------------------------------------------------------------

### Owned Copy

Physical экземпляar.

-   id
-   catalog item id
-   condition
-   purchase price
-   estimated value
-   acquisition date
-   acquisition source
-   notes
-   images

Condition values:

-   Mint
-   Near Mint
-   Excellent
-   Good
-   Fair
-   Poor

------------------------------------------------------------------------

### Set

Checklist of expected items.

-   id
-   collection id
-   name
-   expected item count

------------------------------------------------------------------------

### Wishlist Item

-   id
-   collection id
-   catalog item id
-   name
-   priority
-   target price
-   notes

------------------------------------------------------------------------

## 5. User Stories

### Authentication

-   User can register account
-   User can login
-   User can logout
-   Authenticated routes require valid token

### Profile

-   User can edit display name
-   User can upload avatar
-   User can edit bio
-   Profile page shows public collections

### Multilanguage

-   User can select preferred language
-   UI supports English
-   UI supports Portuguese
-   Language preference persists

### Collection Types

-   User can create collection type
-   User can add custom fields
-   User can edit custom fields
-   Custom field types include text, number, date, enum, boolean

### Collections

-   User can create collection
-   User can edit collection metadata
-   User can delete collection
-   User can upload collection cover image

### Catalog Items

-   User can create catalog item
-   User can edit catalog item
-   User can delete catalog item
-   Catalog items support images

### Owned Copies

-   User can register owned copy
-   User can edit owned copy
-   User can delete owned copy
-   System supports duplicate copies

### Sets

-   User can create set
-   User can add expected items
-   User can bulk import set items

### Completion Tracking

-   System tracks owned status
-   Completion percentage calculated
-   Progress bar displayed

### Wishlist

-   User can add item to wishlist
-   Wishlist supports priority
-   Wishlist item removed when acquired

### Visual Catalog

-   Items displayed in gallery grid
-   Lazy image loading supported
-   Item click opens detail view

### Search / Filter / Sort

-   Search item names
-   Filter by condition
-   Filter by owned status
-   Sort by price/value/date

### Dashboard

-   Dashboard shows total collections
-   Dashboard shows total items
-   Dashboard shows estimated value
-   Dashboard shows charts

### Import / Export

-   Export CSV
-   Export JSON
-   Import CSV
-   Import preview validation

### Sharing (Phase 2)

-   Collection visibility private/public/shared
-   Public collections accessible without login
-   Shared collections accessible by invited users

### Social (Phase 2)

-   Follow collectors
-   Unfollow collectors
-   Activity feed
-   Explore public collections

------------------------------------------------------------------------

## 6. Functional Requirements

-   Authentication and session management
-   Customizable collection types
-   Collections management
-   Catalog item management
-   Owned copies tracking
-   Duplicate copy support
-   Set completion tracking
-   Visual gallery browsing
-   Search/filter/sort
-   Dashboard analytics
-   Wishlist management
-   Import/export support
-   Collection visibility controls
-   Social features
-   Data isolation per user
-   Multilanguage UI support
-   Light/Dark theme support

------------------------------------------------------------------------

## 7. Non-Goals

-   Marketplace functionality
-   Real-time chat
-   Native mobile apps
-   AI item recognition
-   Multi-currency support
-   External pricing APIs
-   Item version history

------------------------------------------------------------------------

## 8. Design Requirements

Frontend must provide:

-   Modern UI
-   Responsive layout
-   Gallery view
-   Sidebar navigation
-   Global search
-   Light/Dark theme
-   Lazy image loading

------------------------------------------------------------------------

## 9. Technical Requirements

Backend:

-   .NET 8 Web API
-   C#
-   Entity Framework Core

Frontend:

-   TypeScript
-   React or similar framework

Database:

-   SQL Server

Authentication:

-   ASP.NET Identity or JWT

Images:

-   Local storage (MVP)

Search:

-   SQL full-text search

------------------------------------------------------------------------

## 10. Testing Requirements

Backend tests must use **BDD with Gherkin syntax**.

Example:

``` gherkin
Feature: Add owned copy

Scenario: User adds owned copy
  Given a user is logged in
  And a catalog item exists
  When the user registers an owned copy
  Then the copy should be saved
  And the collection completion should update
```

Unit tests must cover:

-   API endpoints
-   domain logic
-   completion tracking
-   custom field validation
-   permissions

------------------------------------------------------------------------

## 11. Success Metrics

-   Create collection and add 10 items in under 5 minutes
-   Dashboard loads under 2 seconds with 1000 items
-   Gallery renders smoothly with 500+ items
-   Import/export preserves data integrity
-   Public collection accessible via URL

------------------------------------------------------------------------

## 12. Open Questions

-   Should financial fields be hidden in public collections? - YES
-   Should collections support collaborative editing? - NO
-   Should templates be shareable? - YES
-   Should tagging work across collections? - YES
-   Maximum number of custom fields? - Let's keep 10
