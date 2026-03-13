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
