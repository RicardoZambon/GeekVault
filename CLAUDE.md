# GeekVault

Dev container template repository — no application code exists yet. Provides a containerized development environment for .NET 8.0 (C#) + Node.js/TypeScript with MS SQL Server 2019.

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
├── Data/
│   └── ApplicationDbContext.cs   # EF Core DbContext
├── Program.cs                     # Minimal API entry point
├── appsettings.json               # Connection strings, config
└── GeekVault.Api.csproj           # .NET 8 project file
```

- Uses **minimal API** style (not controllers)
- EF Core with SQL Server provider
- Swagger enabled in development

## Frontend Project Structure

```
src/web/
├── src/
│   ├── components/ui/    # shadcn/ui components
│   ├── i18n/             # i18n config and translation files
│   │   ├── index.ts      # i18next initialization
│   │   └── locales/      # en.json, pt.json translation files
│   ├── lib/utils.ts      # cn() helper for class merging
│   ├── pages/            # Page components
│   ├── App.tsx            # React Router routes
│   ├── main.tsx           # Entry point with BrowserRouter
│   └── index.css          # Tailwind CSS + shadcn/ui theme variables
├── components.json        # shadcn/ui config
├── postcss.config.js      # Tailwind CSS v4 via PostCSS
├── vite.config.ts         # Vite config with @/ alias and API proxy
└── package.json
```

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 via `@tailwindcss/postcss` (not vite plugin — incompatible with Vite 8)
- shadcn/ui set up manually (CLI incompatible with Node 24)
- Path alias: `@/` maps to `src/`
- API proxy: `/api` -> `http://localhost:5000`
- i18n: `react-i18next` — translations in `src/i18n/locales/{en,pt}.json`, add keys to both files when adding UI strings
- Testing: Vitest + `@vitest/coverage-v8` + jsdom — `npm test` to run, `npm run test:coverage` for coverage report

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

Services: `db` (SQL Server 2019), `api` (.NET on port 5000), `web` (nginx on port 80 proxying `/api` to backend)
