## Architecture

This is a TypeScript monorepo (managed with pnpm + Turborepo):

- `apps/` — application code (admin UI, backend server)
- `packages/` — shared internal packages
- `deployment/`, `nginx/`, `scripts/` — infrastructure and deployment configuration

**Stack:**
- Backend: Node.js / TypeScript, PostgreSQL
- Frontend (admin): Vite + TypeScript SPA
- Infrastructure: Docker Compose, nginx (reverse proxy + SSL via Let's Encrypt), deployed on a Digital Ocean droplet
- Frontend hosting: Cloudflare Pages
- CI/CD: Git-based deploys (`git pull` + `docker-compose up -d --build` on the server)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment runbook, including droplet setup, SSL provisioning, and database backup/restore procedures.
