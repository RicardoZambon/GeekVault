# PRD: Backend Restructure — Schema Organization & Architecture

## Introduction

Reorganize the GeekVault backend from a single-file minimal API with flat `dbo` schema into a well-structured, domain-driven architecture. This includes: organizing database tables under meaningful schemas (`Security`, `Vault`, `EF`), removing unused ASP.NET Identity tables, introducing repositories and services, splitting the monolithic `Program.cs` into controllers/services/DTOs per domain, renaming `Models` to `Entities` with domain subfolders, and resetting migrations to a clean `InitialCreate`.

## Goals

- Organize database tables under domain-specific schemas (`Security`, `Vault`, `EF`)
- Remove unused ASP.NET Identity infrastructure (roles, claims, logins, tokens)
- Switch from `AddIdentity` to `AddIdentityCore` for a leaner identity setup
- Introduce a repository pattern with domain-organized folders
- Split the 1656-line `Program.cs` into controllers, services, and DTOs per domain
- Rename `Models/` to `Entities/` with schema-matching subfolders
- Reset all migrations to a single clean `InitialCreate`
- Maintain 90% test coverage — update all existing tests to match the new structure

## User Stories

### US-001: Remove unused ASP.NET Identity tables and switch to AddIdentityCore
**Description:** As a developer, I want to remove unused Identity infrastructure so that the database only contains tables we actually use.

**Acceptance Criteria:**
- [ ] Switch `AddIdentity<ApplicationUser, IdentityRole>()` to `AddIdentityCore<ApplicationUser>()` in `Program.cs`
- [ ] Configure `AddIdentityCore` with `AddEntityFrameworkStores<ApplicationDbContext>()` and `AddDefaultTokenProviders()`
- [ ] Remove `IdentityRole` type parameter — no role support needed
- [ ] Change `ApplicationDbContext` base class from `IdentityDbContext<ApplicationUser>` to `IdentityDbContext<ApplicationUser, IdentityRole, string>` or use `IdentityUserContext<ApplicationUser>` to exclude role tables
- [ ] Verify the following tables are NOT created: `AspNetRoles`, `AspNetRoleClaims`, `AspNetUserClaims`, `AspNetUserLogins`, `AspNetUserRoles`, `AspNetUserTokens`
- [ ] Only the users table remains (to be renamed in US-002)
- [ ] Auth endpoints (register, login, profile) still work correctly
- [ ] `dotnet build` succeeds

### US-002: Reorganize database schemas and table names
**Description:** As a developer, I want database tables organized under domain-specific schemas so the database structure reflects the application architecture.

**Acceptance Criteria:**
- [ ] Create `Security` schema — contains: `Security.Users` (was `dbo.AspNetUsers`)
- [ ] Create `Vault` schema — contains:
  - `Vault.CollectionTypes` (was `dbo.CollectionTypes`)
  - `Vault.Collections` (was `dbo.Collections`)
  - `Vault.CatalogItems` (was `dbo.CatalogItems`)
  - `Vault.OwnedCopies` (was `dbo.OwnedCopies`)
  - `Vault.Sets` (was `dbo.Sets`)
  - `Vault.SetItems` (was `dbo.SetItems`)
  - `Vault.WishlistItems` (was `dbo.WishlistItems`)
- [ ] Configure `EF` schema for migrations history — `EF.MigrationsHistory` (was `dbo.__EFMigrationsHistory`)
- [ ] All schema and table name mappings configured in `ApplicationDbContext.OnModelCreating` using `entity.ToTable("TableName", "Schema")`
- [ ] Configure migrations history table via `optionsBuilder.UseSqlServer(..., x => x.MigrationsHistoryTable("MigrationsHistory", "EF"))`
- [ ] All foreign keys and indexes reference correct new table names
- [ ] `dotnet build` succeeds

### US-003: Rename Models to Entities with domain subfolders
**Description:** As a developer, I want entity classes organized in domain subfolders matching the database schemas so that the code structure mirrors the data architecture.

**Acceptance Criteria:**
- [ ] Rename `Models/` folder to `Entities/`
- [ ] Create `Entities/Security/` subfolder containing:
  - `User.cs` (rename `ApplicationUser` class to `User`, keep internal EF mapping to identity table)
- [ ] Create `Entities/Vault/` subfolder containing:
  - `CollectionType.cs`
  - `Collection.cs`
  - `CatalogItem.cs`
  - `OwnedCopy.cs`
  - `OwnedCopyImage.cs`
  - `Set.cs`
  - `SetItem.cs`
  - `WishlistItem.cs`
  - `CustomFieldDefinition.cs`
  - `CustomFieldValue.cs`
  - `Visibility.cs` (enum)
  - `Condition.cs` (enum)
- [ ] Update all `using` statements and namespaces across the project
- [ ] Update `ApplicationDbContext` to reference new entity locations
- [ ] `dotnet build` succeeds

### US-004: Introduce repository pattern with domain subfolders
**Description:** As a developer, I want data access encapsulated in repositories so that the API endpoints don't depend directly on EF Core queries.

**Acceptance Criteria:**
- [ ] Create `Repositories/` folder with domain subfolders matching schemas
- [ ] Create `Repositories/Security/UsersRepository.cs` with interface `IUsersRepository`:
  - `FindByIdAsync(string id)`
  - `FindByEmailAsync(string email)`
  - `UpdateAsync(User user)`
  - Wraps `UserManager<User>` operations used in auth/profile endpoints
- [ ] Create `Repositories/Vault/CollectionTypesRepository.cs` with interface `ICollectionTypesRepository`:
  - CRUD operations for collection types scoped by userId
- [ ] Create `Repositories/Vault/CollectionsRepository.cs` with interface `ICollectionsRepository`:
  - CRUD operations for collections scoped by userId
  - Include summary/stats queries used by dashboard
- [ ] Create `Repositories/Vault/CatalogItemsRepository.cs` with interface `ICatalogItemsRepository`:
  - CRUD operations for catalog items scoped by collectionId
  - Search/filter functionality
  - Import operations (bulk create)
- [ ] Create `Repositories/Vault/OwnedCopiesRepository.cs` with interface `IOwnedCopiesRepository`:
  - CRUD operations for owned copies scoped by catalogItemId
- [ ] Create `Repositories/Vault/SetsRepository.cs` with interface `ISetsRepository`:
  - CRUD for sets and set items scoped by collectionId
- [ ] Create `Repositories/Vault/WishlistRepository.cs` with interface `IWishlistRepository`:
  - CRUD for wishlist items scoped by collectionId
- [ ] All interfaces registered in DI container (`AddScoped`)
- [ ] Repositories inject `ApplicationDbContext` and encapsulate all EF Core queries
- [ ] `dotnet build` succeeds

### US-005: Create service layer with domain subfolders
**Description:** As a developer, I want business logic encapsulated in services so that controllers remain thin and logic is reusable.

**Acceptance Criteria:**
- [ ] Create `Services/` folder with domain subfolders
- [ ] Create `Services/Security/AuthService.cs` with interface `IAuthService`:
  - `RegisterAsync(RegisterRequest)` — user creation + JWT generation
  - `LoginAsync(LoginRequest)` — credential validation + JWT generation
  - JWT token generation logic extracted from `Program.cs`
- [ ] Create `Services/Security/ProfileService.cs` with interface `IProfileService`:
  - `GetProfileAsync(string userId)`
  - `UpdateProfileAsync(string userId, UpdateProfileRequest)`
  - `UploadAvatarAsync(string userId, IFormFile)`
- [ ] Create `Services/Vault/CollectionTypesService.cs` with interface `ICollectionTypesService`:
  - CRUD operations delegating to repository
- [ ] Create `Services/Vault/CollectionsService.cs` with interface `ICollectionsService`:
  - CRUD operations delegating to repository
- [ ] Create `Services/Vault/CatalogItemsService.cs` with interface `ICatalogItemsService`:
  - CRUD, search, import/export operations
- [ ] Create `Services/Vault/OwnedCopiesService.cs` with interface `IOwnedCopiesService`:
  - CRUD operations delegating to repository
- [ ] Create `Services/Vault/SetsService.cs` with interface `ISetsService`:
  - CRUD for sets and set items
- [ ] Create `Services/Vault/WishlistService.cs` with interface `IWishlistService`:
  - CRUD for wishlist items
- [ ] Create `Services/Vault/DashboardService.cs` with interface `IDashboardService`:
  - Dashboard aggregation logic
- [ ] All interfaces registered in DI container (`AddScoped`)
- [ ] Services inject repositories (not DbContext directly)
- [ ] `dotnet build` succeeds

### US-006: Extract DTOs into domain-organized folders
**Description:** As a developer, I want DTOs organized by domain so they are easy to find and maintain separately from entities.

**Acceptance Criteria:**
- [ ] Create `DTOs/` folder (or `Models/` since `Models` is freed up) with domain subfolders
- [ ] Create `DTOs/Security/` containing:
  - `RegisterRequest.cs`
  - `LoginRequest.cs`
  - `AuthResponse.cs`
  - `UpdateProfileRequest.cs`
  - `ProfileResponse.cs`
- [ ] Create `DTOs/Vault/` containing:
  - `CollectionTypeRequest.cs` (Create + Update DTOs)
  - `CollectionTypeResponse.cs`
  - `CollectionRequest.cs` (Create + Update DTOs)
  - `CollectionResponse.cs`
  - `CatalogItemRequest.cs` (Create + Update DTOs)
  - `CatalogItemResponse.cs`
  - `OwnedCopyRequest.cs` (Create + Update DTOs)
  - `OwnedCopyResponse.cs`
  - `SetRequest.cs` (Create + Update + SetItem DTOs)
  - `SetResponse.cs` (Set + SetItem responses)
  - `WishlistItemRequest.cs` (Create + Update DTOs)
  - `WishlistItemResponse.cs`
  - `DashboardResponse.cs` (includes summary, condition count, recent acquisition DTOs)
  - `ImportExportDtos.cs` (import row, preview, confirm DTOs)
  - `CustomFieldDto.cs`
  - `CustomFieldValueDto.cs`
- [ ] Create `DTOs/Common/` containing:
  - `PaginatedResponse.cs`
- [ ] All record definitions extracted from `Program.cs` into these files
- [ ] Update all references across services and controllers
- [ ] `dotnet build` succeeds

### US-007: Split Program.cs into controllers per domain
**Description:** As a developer, I want API endpoints organized in controller files per domain so the codebase is navigable and maintainable.

**Acceptance Criteria:**
- [ ] Create `Controllers/` folder with domain subfolders
- [ ] Create `Controllers/Security/AuthController.cs`:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - Maps to `IAuthService`
- [ ] Create `Controllers/Security/ProfileController.cs`:
  - `GET /api/profile`
  - `PUT /api/profile`
  - `POST /api/profile/avatar`
  - Maps to `IProfileService`
- [ ] Create `Controllers/Vault/CollectionTypesController.cs`:
  - Full CRUD for `/api/collection-types`
  - Maps to `ICollectionTypesService`
- [ ] Create `Controllers/Vault/CollectionsController.cs`:
  - Full CRUD for `/api/collections`
  - Maps to `ICollectionsService`
- [ ] Create `Controllers/Vault/CatalogItemsController.cs`:
  - Full CRUD + search for `/api/collections/{id}/items`
  - Import/export endpoints
  - Maps to `ICatalogItemsService`
- [ ] Create `Controllers/Vault/OwnedCopiesController.cs`:
  - Full CRUD for `/api/catalog-items/{id}/copies`
  - Maps to `IOwnedCopiesService`
- [ ] Create `Controllers/Vault/SetsController.cs`:
  - Full CRUD for `/api/collections/{id}/sets` and set items
  - Maps to `ISetsService`
- [ ] Create `Controllers/Vault/WishlistController.cs`:
  - Full CRUD for `/api/collections/{id}/wishlist`
  - Maps to `IWishlistService`
- [ ] Create `Controllers/Vault/DashboardController.cs`:
  - `GET /api/dashboard`
  - Maps to `IDashboardService`
- [ ] Use minimal API `MapGroup` with `RouteGroupBuilder` or static extension methods (e.g., `app.MapAuthEndpoints()`) — keep minimal API style, not MVC controllers
- [ ] `Program.cs` reduced to: builder config, DI registration, middleware pipeline, and `app.MapXxxEndpoints()` calls
- [ ] Health check endpoint remains in `Program.cs`
- [ ] All API routes unchanged (no breaking changes to frontend)
- [ ] Swagger still works and shows all endpoints
- [ ] `dotnet build` succeeds

### US-008: Delete all existing migrations and create clean InitialCreate
**Description:** As a developer, I want a single clean migration that creates the database with the new schema organization from scratch.

**Acceptance Criteria:**
- [ ] Delete all files in `Migrations/` folder
- [ ] Create new migration: `dotnet ef migrations add InitialCreate`
- [ ] Migration creates schemas: `Security`, `Vault`, `EF`
- [ ] Migration creates tables with correct schema prefixes:
  - `Security.Users` with all Identity user columns + custom columns (DisplayName, Avatar, Bio, PreferredLanguage, PreferredCurrency)
  - All `Vault.*` tables with correct columns, FKs, and indexes
- [ ] Migrations history stored in `EF.MigrationsHistory`
- [ ] `dotnet ef database update` succeeds against a fresh database
- [ ] Verify all tables created with correct schemas using `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES`
- [ ] `dotnet build` succeeds

### US-009: Update DI registration and Program.cs wiring
**Description:** As a developer, I want all new services and repositories registered in the DI container so the application starts and routes correctly.

**Acceptance Criteria:**
- [ ] All repository interfaces registered as `AddScoped` in `Program.cs`
- [ ] All service interfaces registered as `AddScoped` in `Program.cs`
- [ ] DI registrations organized using extension methods (e.g., `services.AddSecurityServices()`, `services.AddVaultServices()`)
- [ ] `Program.cs` is clean and under 100 lines
- [ ] Application starts without DI resolution errors
- [ ] All endpoints respond correctly (manual smoke test or automated)
- [ ] `dotnet build` succeeds

### US-010: Update unit tests for new architecture
**Description:** As a developer, I want all existing tests passing against the restructured codebase so we maintain quality and coverage.

**Acceptance Criteria:**
- [ ] Update `TestFactory.cs` to work with new `ApplicationDbContext` configuration (EF schema, entity changes)
- [ ] Update `AuthEndpointsTests.cs` — fix namespace references, entity name changes (`ApplicationUser` → `User`)
- [ ] Update `ProfileEndpointsTests.cs` — fix namespace references
- [ ] Update `CollectionTypeEndpointsTests.cs` — fix namespace references
- [ ] Update `CollectionEndpointsTests.cs` — fix namespace references
- [ ] Update `CatalogItemEndpointsTests.cs` — fix namespace references
- [ ] Update `CatalogItemSearchTests.cs` — fix namespace references
- [ ] Update `OwnedCopyEndpointsTests.cs` — fix namespace references
- [ ] Update `SetEndpointsTests.cs` — fix namespace references
- [ ] Update `WishlistEndpointsTests.cs` — fix namespace references
- [ ] Update `DashboardEndpointsTests.cs` — fix namespace references
- [ ] Update `ImportEndpointsTests.cs` — fix namespace references
- [ ] Update `ExportEndpointsTests.cs` — fix namespace references
- [ ] All existing tests pass: `dotnet test` succeeds
- [ ] Coverage remains at or above 90% line coverage
- [ ] `dotnet build` succeeds for both API and test projects

## Functional Requirements

- FR-1: The system must use `AddIdentityCore<User>()` instead of `AddIdentity<ApplicationUser, IdentityRole>()`, removing role-based identity infrastructure
- FR-2: The `Security` schema must contain only the `Users` table (renamed from `AspNetUsers`)
- FR-3: The `Vault` schema must contain all collection-related tables: `CollectionTypes`, `Collections`, `CatalogItems`, `OwnedCopies`, `Sets`, `SetItems`, `WishlistItems`
- FR-4: The EF migrations history table must be stored as `EF.MigrationsHistory`
- FR-5: Entity classes must live under `Entities/Security/` and `Entities/Vault/` matching their database schema
- FR-6: Each domain must have its own repository interface and implementation under `Repositories/{Domain}/`
- FR-7: Each domain must have its own service interface and implementation under `Services/{Domain}/`
- FR-8: DTOs must be organized under `DTOs/Security/`, `DTOs/Vault/`, and `DTOs/Common/`
- FR-9: API endpoints must be organized into separate files under `Controllers/{Domain}/` using minimal API extension methods
- FR-10: `Program.cs` must only contain builder configuration, DI registration calls, middleware pipeline, and endpoint mapping calls
- FR-11: All API routes must remain unchanged — no breaking changes to the frontend
- FR-12: All existing tests must pass after refactoring with 90%+ coverage maintained
- FR-13: A single `InitialCreate` migration must replace all existing migrations

## Non-Goals (Out of Scope)

- No new API endpoints or features
- No frontend changes (all API routes stay the same)
- No `Config` schema — will be added when config tables are needed
- No role-based authorization (RBAC) — removed with Identity simplification
- No change to authentication mechanism (JWT stays as-is)
- No change to database engine or connection configuration
- No change to Docker, CI/CD, or deployment setup
- No performance optimization or caching
- No API versioning

## Technical Considerations

- **Entity rename:** `ApplicationUser` → `User` requires updating all references in Program.cs, services, DTOs, and tests. The EF Core mapping (`entity.ToTable("Users", "Security")`) handles the DB side.
- **IdentityUserContext vs IdentityDbContext:** Using `IdentityUserContext<User>` (or manually configuring only user-related Identity tables) is the cleanest way to exclude role tables entirely.
- **Migrations history table:** Must be configured in the `UseSqlServer` call: `options.UseSqlServer(conn, x => x.MigrationsHistoryTable("MigrationsHistory", "EF"))` — this must be set before creating the migration.
- **InMemory database in tests:** The `TestFactory` uses `UseInMemoryDatabase` which doesn't support schemas. Tests will continue to work since schemas are a SQL Server concept, but schema configuration won't be validated by unit tests.
- **Minimal API organization:** Use `IEndpointRouteBuilder` extension methods (e.g., `public static void MapAuthEndpoints(this IEndpointRouteBuilder app)`) rather than MVC controllers, to stay consistent with the minimal API pattern.
- **Build order:** US-001 through US-003 (Identity + schema + entities) should be done first, then US-004/005/006 (repositories + services + DTOs), then US-007 (controllers), then US-008 (migration reset), and finally US-009/010 (wiring + tests).

## Target Folder Structure

```
src/api/GeekVault.Api/
├── Controllers/
│   ├── Security/
│   │   ├── AuthController.cs
│   │   └── ProfileController.cs
│   └── Vault/
│       ├── CatalogItemsController.cs
│       ├── CollectionsController.cs
│       ├── CollectionTypesController.cs
│       ├── DashboardController.cs
│       ├── OwnedCopiesController.cs
│       ├── SetsController.cs
│       └── WishlistController.cs
├── Data/
│   └── ApplicationDbContext.cs
├── DTOs/
│   ├── Common/
│   │   └── PaginatedResponse.cs
│   ├── Security/
│   │   ├── AuthDtos.cs
│   │   └── ProfileDtos.cs
│   └── Vault/
│       ├── CatalogItemDtos.cs
│       ├── CollectionDtos.cs
│       ├── CollectionTypeDtos.cs
│       ├── CustomFieldDtos.cs
│       ├── DashboardDtos.cs
│       ├── ImportExportDtos.cs
│       ├── OwnedCopyDtos.cs
│       ├── SetDtos.cs
│       └── WishlistDtos.cs
├── Entities/
│   ├── Security/
│   │   └── User.cs
│   └── Vault/
│       ├── CatalogItem.cs
│       ├── Collection.cs
│       ├── CollectionType.cs
│       ├── Condition.cs
│       ├── CustomFieldDefinition.cs
│       ├── CustomFieldValue.cs
│       ├── OwnedCopy.cs
│       ├── OwnedCopyImage.cs
│       ├── Set.cs
│       ├── SetItem.cs
│       ├── Visibility.cs
│       └── WishlistItem.cs
├── Migrations/
│   └── <timestamp>_InitialCreate.cs
├── Repositories/
│   ├── Security/
│   │   └── UsersRepository.cs
│   └── Vault/
│       ├── CatalogItemsRepository.cs
│       ├── CollectionsRepository.cs
│       ├── CollectionTypesRepository.cs
│       ├── OwnedCopiesRepository.cs
│       ├── SetsRepository.cs
│       └── WishlistRepository.cs
├── Services/
│   ├── Security/
│   │   ├── AuthService.cs
│   │   └── ProfileService.cs
│   └── Vault/
│       ├── CatalogItemsService.cs
│       ├── CollectionsService.cs
│       ├── CollectionTypesService.cs
│       ├── DashboardService.cs
│       ├── OwnedCopiesService.cs
│       ├── SetsService.cs
│       └── WishlistService.cs
├── Program.cs
├── appsettings.json
└── GeekVault.Api.csproj
```

### Database Schema Map

```
Security schema:
  └── Security.Users         (was dbo.AspNetUsers)

Vault schema:
  ├── Vault.CollectionTypes   (was dbo.CollectionTypes)
  ├── Vault.Collections       (was dbo.Collections)
  ├── Vault.CatalogItems      (was dbo.CatalogItems)
  ├── Vault.OwnedCopies       (was dbo.OwnedCopies)
  ├── Vault.Sets              (was dbo.Sets)
  ├── Vault.SetItems          (was dbo.SetItems)
  └── Vault.WishlistItems     (was dbo.WishlistItems)

EF schema:
  └── EF.MigrationsHistory    (was dbo.__EFMigrationsHistory)

Dropped tables:
  ✗ dbo.AspNetRoles
  ✗ dbo.AspNetRoleClaims
  ✗ dbo.AspNetUserClaims
  ✗ dbo.AspNetUserLogins
  ✗ dbo.AspNetUserRoles
  ✗ dbo.AspNetUserTokens
```

## Success Metrics

- All 13 existing test files pass with 90%+ line coverage
- `Program.cs` reduced from ~1656 lines to under 100 lines
- Zero breaking changes to API routes (frontend works without modification)
- Database contains only 8 tables across 2 schemas (+ 1 EF schema), down from 14 tables in `dbo`
- Application starts and all endpoints respond correctly

## Open Questions

- None — all decisions resolved during planning.
