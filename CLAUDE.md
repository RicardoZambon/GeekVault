# GeekVault

A collectible management application with a .NET 8.0 API backend and React frontend, running in a containerized development environment with MS SQL Server 2019.

## Tech Stack

- **.NET 8.0** (C#) — base image: `mcr.microsoft.com/devcontainers/dotnet:1-8.0-bookworm`
- **Node.js LTS** with **TypeScript** (installed globally via nvm)
- **MS SQL Server 2019** — `mcr.microsoft.com/mssql/server:2019-latest`

## Dev Environment

Runs as a VS Code dev container using Docker Compose with two services:

- **app** — .NET 8.0 + Node.js dev container (uses `network_mode: service:db` so SQL is reachable at `localhost`)
- **db** — MS SQL Server 2019

On container creation, `postCreateCommand` runs `.devcontainer/mssql/postCreateCommand.sh` which waits for SQL Server to be ready, then executes `.devcontainer/mssql/setup.sql` (creates `ApplicationDB`).

## Database

- **Host:** `localhost,1433` (from within the app container)
- **User:** `sa`
- **Password:** `P@ssw0rd`
- **Database:** `ApplicationDB` (created automatically on container start)
- **CLI:** `/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'P@ssw0rd'`

## Key Files

```
.devcontainer/
├── devcontainer.json          # Dev container config, VS Code settings, extensions
├── docker-compose.yml         # app + db service definitions
├── Dockerfile                 # .NET 8.0 base + SQL tools + Node.js LTS + TypeScript
└── mssql/
    ├── installSQLtools.sh     # Installs sqlcmd and sqlpackage
    ├── postCreateCommand.sh   # Waits for SQL Server, runs .sql files and .dacpac deploys
    └── setup.sql              # Creates ApplicationDB
```

## Build / Test / Lint

- **Build API:** `cd src/api/GeekVault.Api && dotnet build`
- **Run API:** `cd src/api/GeekVault.Api && dotnet run`
- **Test API:** `cd src/api/GeekVault.Api.Tests && dotnet test`
- **Build Frontend:** `cd src/web && npm run build`
- **Dev Frontend:** `cd src/web && npm run dev`
- **Typecheck Frontend:** `cd src/web && npx tsc -b`

## API Project Structure

```
src/api/GeekVault.Api/
├── Controllers/
│   ├── Security/          # AuthController, ProfileController
│   └── Vault/             # Collections, CatalogItems, Sets, OwnedCopies, Wishlist, Dashboard, CollectionTypes
├── Services/
│   ├── Security/          # Auth, Profile services + interfaces
│   └── Vault/             # Business logic for each domain + interfaces
├── Repositories/
│   ├── Security/          # UsersRepository + interface
│   └── Vault/             # Data access for each domain + interfaces
├── Entities/
│   ├── Security/          # User
│   └── Vault/             # CatalogItem, Collection, CollectionType, Set, SetItem, OwnedCopy, OwnedCopyImage, WishlistItem, etc.
├── Models/                # Legacy/unused — original entity classes before migration to Entities/ (not referenced by any code)
├── DTOs/
│   ├── Common/            # PaginatedResponse
│   ├── Security/          # Auth, Profile DTOs
│   └── Vault/             # Request/Response DTOs per domain (Collection, CatalogItem, Set, OwnedCopy, Wishlist, Dashboard, CollectionType, CustomField, ImportExport)
├── Data/
│   └── ApplicationDbContext.cs   # EF Core DbContext with Identity
├── Extensions/
│   ├── ServiceCollectionExtensions.cs  # DI registration
│   └── FileValidationExtensions.cs     # Image file type validation
├── Migrations/            # EF Core migrations
├── wwwroot/uploads/       # File uploads (images)
├── Program.cs             # Minimal API entry point
├── appsettings.json       # Connection strings, config
└── GeekVault.Api.csproj   # .NET 8 project file

src/api/GeekVault.Api.Tests/
├── TestFactory.cs                    # WebApplicationFactory for integration tests
├── *EndpointsTests.cs                # Integration tests per domain (Auth, Collections, CatalogItems, Sets, OwnedCopies, Wishlist, Dashboard, CollectionTypes, Import, Export)
├── CatalogItemSearchTests.cs         # Catalog item search-specific tests
└── GeekVault.Api.Tests.csproj
```

- Uses **minimal API** style — Controllers are static classes with `Map*Endpoints()` extension methods, not MVC controllers
- EF Core with SQL Server provider + ASP.NET Identity
- Swagger enabled in development
- File uploads stored in `wwwroot/uploads/` and served via `UseStaticFiles()`

## Frontend Project Structure

```
src/web/
├── src/
│   ├── components/
│   │   ├── layout/              # App shell — sidebar, header, toolbar, command palette
│   │   │   ├── app-layout.tsx   # Main layout wrapper (sidebar + header + content)
│   │   │   ├── sidebar.tsx      # Collapsible desktop sidebar, persistent state
│   │   │   ├── header.tsx       # Mobile header with menu toggle
│   │   │   ├── top-toolbar.tsx  # Top toolbar with breadcrumbs and actions
│   │   │   ├── user-menu.tsx    # User avatar dropdown (profile, theme, logout)
│   │   │   ├── command-palette.tsx  # Cmd+K navigation & actions (cmdk)
│   │   │   └── animated-outlet.tsx  # Page transition wrapper (Framer Motion)
│   │   ├── ds/                  # Design system — reusable UI components
│   │   │   ├── motion.tsx       # PageTransition, FadeIn, StaggerChildren, ScaleIn
│   │   │   ├── animated-number.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── stat-card.tsx, badge.tsx, empty-state.tsx
│   │   │   ├── card.tsx, page-header.tsx, scroll-area.tsx
│   │   │   ├── select.tsx, textarea.tsx
│   │   │   ├── dropdown-menu.tsx, tabs.tsx, tooltip.tsx
│   │   │   ├── sortable-list.tsx  # Drag-and-drop (@dnd-kit)
│   │   │   ├── skeleton.tsx, toaster.tsx
│   │   │   └── index.ts          # Barrel export
│   │   ├── ui/                  # shadcn/ui primitives (button, dialog, confirm-dialog, input, label, sheet)
│   │   ├── auth-provider.tsx    # Auth context (JWT token, login/logout)
│   │   └── theme-provider.tsx   # Dark/light theme context
│   ├── features/                # Feature-based pages, organized by domain
│   │   ├── auth/                # login-page, register-page, auth-layout
│   │   ├── collections/         # collections-page, collection-detail-page, catalog-item-detail-page
│   │   │   └── components/      # import-wizard
│   │   ├── dashboard/           # dashboard-page
│   │   │   └── components/      # stats-row, charts-section, collection-summaries, recent-acquisitions
│   │   ├── collection-types/    # collection-types-page
│   │   ├── wishlist/            # wishlist-page
│   │   └── profile/             # profile-page
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-debounce.ts      # Debounce input values
│   │   ├── use-media-query.ts   # Responsive breakpoint detection
│   │   └── index.ts             # Barrel export
│   ├── i18n/              # i18n config and translation files
│   │   ├── index.ts       # i18next initialization
│   │   └── locales/       # en.json, pt.json translation files
│   ├── lib/
│   │   ├── api.ts         # API client utilities (fetch wrapper, error handling)
│   │   └── utils.ts       # cn() helper for class merging
│   ├── App.tsx            # React Router routes
│   ├── main.tsx           # Entry point with BrowserRouter
│   ├── test-utils.tsx     # Render helpers for tests (providers, router)
│   ├── test-setup.ts      # Vitest global setup
│   └── index.css          # Tailwind CSS v4 + semantic color tokens (incl. sidebar-specific)
├── components.json        # shadcn/ui config
├── postcss.config.js      # Tailwind CSS v4 via PostCSS
├── vite.config.ts         # Vite config with @/ alias and API proxy
└── package.json
```

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 via `@tailwindcss/postcss` (not vite plugin — incompatible with Vite 8)
- shadcn/ui set up manually (CLI incompatible with Node 24)
- Feature-based folder structure — pages organized by domain in `features/`, with co-located sub-components
- Design system in `components/ds/` — shared components with barrel export via `index.ts`
- Sidebar-first responsive layout — collapsible desktop sidebar, mobile sheet via header toggle
- Animation — Framer Motion for page transitions and micro-interactions
- Command palette — `cmdk` (Cmd+K) for keyboard-driven navigation
- Charts — `recharts` for dashboard visualizations
- Drag-and-drop — `@dnd-kit` for sortable lists
- Toast notifications — `sonner`
- Path alias: `@/` maps to `src/`
- API proxy: `/api` and `/uploads` -> `http://localhost:5099`
- i18n: `react-i18next` — translations in `src/i18n/locales/{en,pt}.json`, add keys to both files when adding UI strings
- Testing: Vitest + `@vitest/coverage-v8` + jsdom — `npm test` to run, `npm run test:coverage` for coverage report. Every component has a co-located `.test.tsx` file.

## Conventional Commits

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) format. The CI/CD pipeline uses commit messages to calculate semantic versions automatically.

**Format:** `<type>(<optional scope>): <description>`

| Prefix | Version Bump | Example |
|--------|-------------|---------|
| `feat:` | MINOR (0.x.0) | `feat: add wishlist export` |
| `fix:` | PATCH (0.0.x) | `fix: correct date parsing in imports` |
| `<any>!:` | MAJOR (x.0.0) | `feat!: redesign collection API` |
| `BREAKING CHANGE` in body | MAJOR (x.0.0) | (any type with breaking change footer) |
| `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `ci:` | No bump | `chore: update dependencies` |

Only `feat`, `fix`, and breaking changes trigger a new version and Docker image build. All other prefixes (chore, docs, refactor, test, ci, style, etc.) do **not** create a release.

## CI/CD

### GitHub Actions Pipelines

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `ci-backend.yml` | PR → main (changes in `src/api/`) | Build + test + 90% line coverage gate |
| `ci-frontend.yml` | PR → main (changes in `src/web/`) | Typecheck + test + 90% coverage gate |
| `release.yml` | Push to main (merged PR) | Semantic version → test → Docker build + push → git tag |

### Required Secrets (set in GitHub repo settings)

- `DOCKERHUB_USERNAME` — Docker Hub username
- `DOCKERHUB_TOKEN` — Docker Hub access token

### Docker Images

- **Backend:** `<DOCKERHUB_USERNAME>/geekvault-api:<version>`
- **Frontend:** `<DOCKERHUB_USERNAME>/geekvault-web:<version>`

Both are also tagged `:latest` on each release.

### Versioning

Handled by `scripts/version.sh`. Reads conventional commit messages since the last `v*` git tag and determines the next version. If no version-bumping commits exist, the release is skipped entirely.

## Deployment (Docker)

```bash
# Production build
docker compose -f docker-compose.prod.yml up --build

# With custom secrets
SA_PASSWORD=<strong-password> JWT_KEY=<secret-key> docker compose -f docker-compose.prod.yml up --build
```

Services: `db` (SQL Server 2019), `api` (.NET, dev port 5099), `web` (nginx on port 80 proxying `/api` to backend)
