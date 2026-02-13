# VM Deployment Guide for Satori API/Backend

This directory contains all scripts, configuration, and documentation for deploying the Satori API/backend application to VMs provisioned via `bk-portal-iac`.

## Overview

The deployment process configures VMs with the Satori application using Docker containers orchestrated by Docker Compose with Traefik as the reverse proxy for TLS termination.

**Important**: Docker is already installed on all VMs via cloud-init during provisioning. Do not reinstall or modify Docker.

## Architecture

### QA Environment
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE DNS                          │
│  • api.qa.portal.byomakusuma.com → QA VM IP                     │
│  • traefik.qa.byomakusuma.com → QA VM IP                        │
│  • portainer.qa.byomakusuma.com → QA VM IP                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE VM - QA (Ubuntu)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Traefik (Port 80/443)                  │  │
│  │  • TLS termination (Let's Encrypt via Cloudflare DNS-01) │  │
│  │  • Reverse proxy                                          │  │
│  │  • Dashboard: https://traefik.qa.byomakusuma.com          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Satori App Container (Port 3000)             │  │
│  │  • API: https://api.qa.portal.byomakusuma.com             │  │
│  │  • Hono API server                                        │  │
│  │  • Better Auth authentication                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Container (Port 5432)                │  │
│  │  • Private network only                                   │  │
│  │  • Persistent volume                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Portainer: https://portainer.qa.byomakusuma.com          │  │
│  │  • Container management UI                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Production Environment
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE DNS                          │
│  • api.portal.byomakusuma.com → Prod VM IP                      │
│  • traefik.portal.byomakusuma.com → Prod VM IP                  │
│  • portainer.portal.byomakusuma.com → Prod VM IP                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 AZURE VM - Production (Ubuntu)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Traefik (Port 80/443)                  │  │
│  │  • TLS termination (Let's Encrypt via Cloudflare DNS-01) │  │
│  │  • Reverse proxy                                          │  │
│  │  • Dashboard: https://traefik.portal.byomakusuma.com      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Satori App Container (Port 3000)             │  │
│  │  • API: https://api.portal.byomakusuma.com                │  │
│  │  • Hono API server                                        │  │
│  │  • Better Auth authentication                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Container (Port 5432)                │  │
│  │  • Private network only                                   │  │
│  │  • Persistent volume                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Portainer: https://portainer.portal.byomakusuma.com      │  │
│  │  • Container management UI                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Environment URLs

### QA Environment
- **Frontend**: https://qa.portal.byomakusuma.com
- **API**: https://api.qa.portal.byomakusuma.com
- **Traefik Dashboard**: https://traefik.qa.byomakusuma.com
- **Portainer**: https://portainer.qa.byomakusuma.com

### Production Environment
- **Frontend**: https://portal.byomakusuma.com
- **API**: https://api.portal.byomakusuma.com
- **Traefik Dashboard**: https://traefik.portal.byomakusuma.com
- **Portainer**: https://portainer.portal.byomakusuma.com

## Prerequisites

Before starting deployment:

1. ✅ VMs are provisioned via `bk-portal-iac` (QA and Prod)
2. ✅ Docker is installed on VMs (via cloud-init)
3. ✅ SSH access is configured with shared key
4. ✅ DNS records are created in Cloudflare
5. ⚠️ Cloudflare API token with DNS edit permissions
6. ⚠️ Environment-specific configuration values

## Directory Structure

```
vm-deployment/
├── README.md                    # This file - Overview and quick start
├── .env.template                # Deployment configuration template
├── docs/                        # Documentation
│   ├── QUICK_START.md           # 30-minute setup guide
│   ├── DEPLOYMENT_CHECKLIST.md  # Pre-deployment checklist
│   ├── SETUP_INSTRUCTIONS.md    # Detailed configuration guide
│   ├── BACKUP_GUIDE.md          # Database backup procedures
│   ├── EMAIL_SETUP_GUIDE.md     # Azure email configuration
│   └── UPDATE_TRAEFIK_DOMAINS.md # Update management domains
├── scripts/
│   ├── setup-vm.sh              # Main VM setup script
│   ├── setup-traefik.sh         # Traefik configuration
│   ├── setup-app.sh             # Application deployment
│   ├── deploy-qa.sh             # QA environment deployment
│   ├── deploy-prod.sh           # Production environment deployment
│   ├── deploy-from-git.sh       # Git-based deployment
│   ├── rollback.sh              # Rollback to previous version
│   ├── load-env.sh              # Environment variable loader
│   └── manual/                  # Manual deployment scripts
│       ├── deploy-qa-local.sh   # Upload local repo to QA
│       ├── deploy-prod-local.sh # Upload local repo to Prod
│       └── restore-db.sh        # Database restoration
└── config/
    ├── traefik.env.template     # Traefik environment template
    ├── app.env.qa.template      # QA app environment template
    └── app.env.prod.template    # Prod app environment template
```

## Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 30 minutes
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification
- **[Setup Instructions](docs/SETUP_INSTRUCTIONS.md)** - Detailed configuration guide
- **[Backup Guide](docs/BACKUP_GUIDE.md)** - Database backup and restore procedures
- **[Email Setup](docs/EMAIL_SETUP_GUIDE.md)** - Azure Communication Services configuration
- **[Update Traefik Domains](docs/UPDATE_TRAEFIK_DOMAINS.md)** - Environment-specific management URLs

## Deployment Order

**CRITICAL**: Always deploy in this order:

1. **QA Environment** - Configure and validate completely
2. **Validation** - Test all functionality in QA
3. **Production Environment** - Only after QA is fully operational

## Quick Start

### 1. Configure Deployment Settings

First, set up your deployment configuration:

```bash
# Copy the deployment environment template
cp .env.template .env

# Edit with your SSH aliases, VM IPs, and domain names
vim .env
```

The `.env` file contains:
- SSH configuration (aliases, IPs, user)
- Domain names for your environments
- Git repository and branch settings
- Remote paths on VMs

**Tip**: After configuring, load the environment:
```bash
source .env
```

This makes deployment scripts easier to use and maintain.

### 2. Configure Service Environment Variables

```bash
# Copy templates and fill in values
cp config/traefik.env.template config/traefik.env.qa
cp config/app.env.qa.template config/app.env.qa

# Edit with your values
vim config/traefik.env.qa
vim config/app.env.qa
```

### 2. Deploy to QA

```bash
# Run the QA deployment script
./scripts/deploy-qa.sh
```

### 3. Validate QA

```bash
# Test API endpoint
curl -I https://api.qa.portal.byomakusuma.com

# Check container status
ssh <QA_SSH_ALIAS> "docker ps"

# View logs
ssh <QA_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose logs -f app"
```

### 4. Deploy to Production (After QA Validation)

```bash
# Copy and configure production environment
cp config/traefik.env.template config/traefik.env.prod
cp config/app.env.prod.template config/app.env.prod

# Edit with production values
vim config/traefik.env.prod
vim config/app.env.prod

# Deploy to production
./scripts/deploy-prod.sh
```

## VM Access

### SSH Configuration

Add to `~/.ssh/config`:

```
Host <QA_SSH_ALIAS>
   HostName <QA_VM_IP>
   IdentityFile ~/.ssh/<SSH_KEY_NAME>
   User <VM_USER>
   
Host <PROD_SSH_ALIAS>
   HostName <PROD_VM_IP>
   IdentityFile ~/.ssh/<SSH_KEY_NAME>
   User <VM_USER>
```

### Quick Access

```bash
# QA
ssh <QA_SSH_ALIAS>

# Production
ssh <PROD_SSH_ALIAS>
```

## Environment Configuration

### Required Environment Variables

#### Traefik Configuration
- `CF_API_EMAIL` - Cloudflare account email
- `CF_DNS_API_TOKEN` - Cloudflare API token with DNS edit permissions
- `TRAEFIK_USERNAME` - Traefik dashboard username
- `TRAEFIK_PASSWORD` - Traefik dashboard password

#### Application Configuration
- `DB_USER`, `DB_PASS`, `DB_NAME` - PostgreSQL credentials
- `SERVER_URL` - API server URL (e.g., `api.qa.portal.byomakusuma.com`)
- `AUTH_HOST` - Authentication host
- `BETTER_AUTH_URL` - Better Auth URL
- `BETTER_AUTH_SECRET` - Better Auth secret key
- `FRONTEND_URL` - Frontend application URL
- `ORIGIN` - CORS origin
- `EMAIL_SERVICE_PROVIDER` - Email provider (`azure` or `gmail`)
- `AZURE_COMMUNICATION_CONNECTION_STRING` - Azure Communication Services connection string
- `AZURE_COMMUNICATION_FROM_EMAIL` - From email address

See `config/*.template` files for complete lists.

## Deployment Scripts

### setup-vm.sh
Main VM setup script that:
- Verifies Docker installation
- Creates necessary directories
- Sets up firewall rules
- Clones application repository

### setup-traefik.sh
Configures Traefik reverse proxy:
- Creates Traefik configuration
- Sets up Let's Encrypt certificate storage
- Deploys Traefik and Portainer containers

### setup-app.sh
Deploys the Satori application:
- Configures application environment
- Builds Docker images
- Runs database migrations
- Starts application containers

### deploy-qa.sh / deploy-prod.sh
Environment-specific deployment orchestrators that:
- Run all setup scripts in order
- Validate deployment
- Provide deployment summary

### rollback.sh
Rolls back to a previous version:
- Checks out previous Git commit
- Rebuilds containers
- Restarts services

## Troubleshooting

### SSL Certificate Issues

**Problem**: Certificate errors or HTTPS not working

**Solution**:
1. Verify DNS points to VM IP (not Cloudflare proxy)
2. Ensure Cloudflare proxy is disabled (gray cloud)
3. Restart Traefik: `ssh <QA_SSH_ALIAS> "cd /apps/traefik && docker compose restart"`
4. Wait 30-60 seconds for certificate generation

### Container Not Starting

**Problem**: Application container fails to start

**Solution**:
1. Check logs: `docker compose logs app`
2. Verify environment variables: `docker compose config`
3. Check database connectivity: `docker compose exec app nc -zv db 5432`
4. Restart containers: `docker compose restart`

### Database Connection Issues

**Problem**: Application can't connect to database

**Solution**:
1. Verify database is running: `docker compose ps db`
2. Check database logs: `docker compose logs db`
3. Test connection: `docker compose exec db psql -U postgres -d satori`
4. Verify DATABASE_URL in .env file

### Environment Variables Not Applied

**Problem**: Changes to .env not taking effect

**Solution**:
Recreate containers (restart alone won't reload env vars):
```bash
docker compose down app
docker compose up -d
```

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db

# Last 100 lines
docker compose logs --tail=100 app
```

### Container Status

```bash
# List running containers
docker compose ps

# Resource usage
docker stats
```

### Database Backup

```bash
# Manual backup
docker compose exec db pg_dump -U postgres satori > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose exec -T db psql -U postgres satori < backup_file.sql
```

### Update Application

```bash
# Pull latest code
cd /apps/satori
git pull origin main

# Rebuild and restart
cd deployment/server
docker compose build --pull
docker compose up -d --remove-orphans
docker image prune -f
```

## Security Notes

- Database is not exposed publicly (no port mapping)
- All traffic goes through Traefik with TLS
- SSH key authentication only (password auth disabled)
- Firewall configured to allow only necessary ports (22, 80, 443)
- Secrets stored in .env files (not committed to Git)

## Support and Resources

- **IaC Repository**: `bk-portal-iac`
- **Application Repository**: `satori/apps/server`
- **Deployment Documentation**: `satori/deployment/readme.md`
- **Traefik Dashboard**: `https://traefik.byomakusuma.com`
- **Portainer Dashboard**: `https://portainer.byomakusuma.com`

## Next Steps

1. Review `DEPLOYMENT_CHECKLIST.md` for detailed step-by-step instructions
2. Configure environment variables in `config/` directory
3. Run deployment scripts for QA environment
4. Validate QA deployment thoroughly
5. Deploy to Production after successful QA validation
