# GeekVault

A collectibles management application built with .NET 8.0 (C#) and React 19 + TypeScript, backed by MS SQL Server.

## Prerequisites

### Local Development

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js LTS](https://nodejs.org/) (v22+)
- [SQL Server 2019](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) or access to a SQL Server instance
- [EF Core CLI tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet): `dotnet tool install --global dotnet-ef`

### Docker

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Dev Container

- [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Running Locally from Source

### 1. Start SQL Server

You need a SQL Server instance running. If you have Docker, start just the database:

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=P@ssw0rd" \
  -p 1433:1433 --name geekvault-db \
  mcr.microsoft.com/mssql/server:2019-latest
```

Then create the database:

```bash
# Using sqlcmd (or any SQL client)
sqlcmd -S localhost,1433 -U sa -P 'P@ssw0rd' -Q "CREATE DATABASE ApplicationDB"
```

### 2. Configure Connection Strings

The API reads its connection string from `src/api/GeekVault.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=ApplicationDB;User Id=sa;Password=P@ssw0rd;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "GeekVault-SuperSecret-JWT-Key-That-Is-Long-Enough-For-256-Bits!",
    "Issuer": "GeekVault.Api",
    "Audience": "GeekVault.Client",
    "ExpiresInMinutes": 60
  }
}
```

You can override any setting with environment variables using `__` as the hierarchy separator:

```bash
export ConnectionStrings__DefaultConnection="Server=myserver,1433;Database=ApplicationDB;User Id=sa;Password=MyPassword;TrustServerCertificate=True"
export Jwt__Key="my-production-secret-key-at-least-256-bits-long"
```

### 3. Run Database Migrations

The project uses EF Core with SQL Server. To create or update the database schema:

```bash
cd src/api/GeekVault.Api

# Create a migration (if models have changed)
dotnet ef migrations add <MigrationName>

# Apply migrations to the database
dotnet ef database update
```

> **Note:** If no migrations exist yet, you need to create the initial migration first with `dotnet ef migrations add InitialCreate`, then apply it.

### 4. Run the Backend API

```bash
cd src/api/GeekVault.Api
dotnet run
```

The API starts on `http://localhost:5000`. Swagger UI is available at `http://localhost:5000/swagger` in development mode.

### 5. Run the Frontend

```bash
cd src/web
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies all `/api` requests to `http://localhost:5000`.

## Running with Docker Compose (Production)

The `docker-compose.prod.yml` file runs the full stack: SQL Server, API, and frontend (nginx).

### Quick Start

```bash
docker compose -f docker-compose.prod.yml up --build
```

The app is available at `http://localhost` (port 80).

### Custom Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SA_PASSWORD` | `P@ssw0rd` | SQL Server `sa` password |
| `JWT_KEY` | `GeekVault-SuperSecret-JWT-Key-That-Is-Long-Enough-For-256-Bits!` | JWT signing key (min 256 bits) |

```bash
SA_PASSWORD="StrongProd!Pass123" JWT_KEY="my-secure-production-jwt-key-that-is-long-enough" \
  docker compose -f docker-compose.prod.yml up --build
```

### Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `db` | `mcr.microsoft.com/mssql/server:2019-latest` | 1433 | SQL Server with persistent volume |
| `api` | Built from `src/api/Dockerfile` | 5000 (internal) | .NET 8.0 API |
| `web` | Built from `src/web/Dockerfile` | 80 | nginx serving React SPA, proxying `/api` to backend |

### Architecture

```
Browser :80 → nginx (web) → /api/* → API :5000 → SQL Server :1433
                           → /*    → React SPA
```

## Running with Dev Container

Open the project in VS Code and select **Reopen in Container**. This gives you a fully configured environment with:

- .NET 8.0 SDK + Node.js LTS
- SQL Server running at `localhost:1433`
- Database `ApplicationDB` auto-created on startup
- Default credentials: `sa` / `P@ssw0rd`

## Build & Test

### Backend

```bash
cd src/api/GeekVault.Api
dotnet build                    # Build
dotnet run                      # Run

cd ../GeekVault.Api.Tests
dotnet test                     # Run tests
```

### Frontend

```bash
cd src/web
npm run build                   # Typecheck + production build
npm run dev                     # Dev server with HMR
npm test                        # Run tests (Vitest)
npm run test:coverage           # Run tests with coverage report
npx tsc -b                     # Typecheck only
```

## CI/CD

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci-backend.yml` | PR to main (changes in `src/api/`) | Build + test + 90% coverage gate |
| `ci-frontend.yml` | PR to main (changes in `src/web/`) | Typecheck + test + 90% coverage gate |
| `release.yml` | Push to main | Semantic version, test, Docker build + push, git tag |

Releases publish Docker images to Docker Hub as `<DOCKERHUB_USERNAME>/geekvault-api` and `<DOCKERHUB_USERNAME>/geekvault-web`.

## Tech Stack

- **Backend:** .NET 8.0, EF Core, ASP.NET Identity, JWT authentication, Swagger
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui, React Router, react-i18next, Recharts
- **Database:** MS SQL Server 2019
- **Testing:** xUnit (.NET), Vitest + Testing Library (React)
- **CI/CD:** GitHub Actions, Docker Hub
