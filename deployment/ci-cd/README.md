# CI/CD Documentation

This directory contains documentation and configuration for the Satori CI/CD pipeline.

## Overview

The CI/CD pipeline automates deployment of:
- **Frontend (Admin)**: Deployed to Cloudflare Pages
- **Backend (Server)**: Deployed to Azure VMs via Docker

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  qa branch   │              │ main branch  │            │
│  │              │              │              │            │
│  │  Push/Merge  │              │  Push/Merge  │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                             │                     │
│         │                             │ (requires approval) │
└─────────┼─────────────────────────────┼─────────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐
│   QA Environment    │       │  Prod Environment   │
│                     │       │                     │
│  Frontend (CF)      │       │  Frontend (CF)      │
│  api.qa.portal...   │       │  api.portal...      │
│                     │       │                     │
│  Backend (VM)       │       │  Backend (VM)       │
│  20.198.0.175       │       │  20.219.22.93       │
└─────────────────────┘       └─────────────────────┘
```

## Workflows

### Frontend Deployment
- **File**: `.github/workflows/deploy-frontend-qa.yml`
- **Trigger**: Push to `qa` branch
- **Target**: Cloudflare Pages (QA project)
- **Environment Variables**: `VITE_API_URL=https://api.qa.portal.byomakusuma.com`

- **File**: `.github/workflows/deploy-frontend-prod.yml`
- **Trigger**: Push to `main` branch (with approval)
- **Target**: Cloudflare Pages (Production project)
- **Environment Variables**: `VITE_API_URL=https://api.portal.byomakusuma.com`

### Backend Deployment
- **File**: `.github/workflows/deploy-backend-qa.yml`
- **Trigger**: Push to `qa` branch
- **Target**: Azure VM (QA)
- **Method**: SSH + Docker deployment

- **File**: `.github/workflows/deploy-backend-prod.yml`
- **Trigger**: Push to `main` branch (with approval)
- **Target**: Azure VM (Production)
- **Method**: SSH + Docker deployment

## GitHub Secrets Required

### Cloudflare Secrets
```
CLOUDFLARE_API_TOKEN          # Cloudflare API token for Pages deployment
CLOUDFLARE_ACCOUNT_ID         # Cloudflare account ID
```

### SSH Secrets (for Backend Deployment)
```
QA_SSH_HOST                   # QA VM hostname or IP
QA_SSH_USER                   # QA VM username
QA_SSH_KEY                    # QA VM SSH private key

PROD_SSH_HOST                 # Production VM hostname or IP
PROD_SSH_USER                 # Production VM username
PROD_SSH_KEY                  # Production VM SSH private key
```

### Application Secrets (for Backend)
```
QA_DB_PASSWORD                # QA database password
QA_BETTER_AUTH_SECRET         # QA auth secret
QA_AZURE_COMM_STRING          # QA Azure Communication Services

PROD_DB_PASSWORD              # Production database password
PROD_BETTER_AUTH_SECRET       # Production auth secret
PROD_AZURE_COMM_STRING        # Production Azure Communication Services
```

## Setting Up GitHub Secrets

### 1. Navigate to Repository Settings
```
GitHub Repo → Settings → Secrets and variables → Actions
```

### 2. Add Repository Secrets
Click "New repository secret" and add each secret listed above.

### 3. Environment-Specific Secrets (Recommended)
For better organization, create environments:
- `qa` environment with QA-specific secrets
- `production` environment with Production-specific secrets

## Branch Protection Rules

### Main Branch (Production)
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require deployment approval for production environment

### QA Branch
- ✅ Require status checks to pass
- ⚠️ No approval required (auto-deploy)

## Deployment Flow

### QA Deployment (Automatic)
```
1. Developer pushes to `qa` branch
2. GitHub Actions triggered automatically
3. Frontend deployed to Cloudflare Pages (QA)
4. Backend deployed to QA VM
5. Slack/Email notification sent
```

### Production Deployment (Manual Approval)
```
1. Developer merges PR to `main` branch
2. GitHub Actions triggered
3. Deployment waits for approval
4. Designated approver reviews and approves
5. Frontend deployed to Cloudflare Pages (Prod)
6. Backend deployed to Production VM
7. Slack/Email notification sent
```

## Monitoring & Rollback

### Health Checks
- Frontend: Cloudflare Pages built-in monitoring
- Backend: Custom health check endpoint `/api/health`

### Rollback Procedures
- **Frontend**: Redeploy previous Cloudflare Pages deployment
- **Backend**: Use `deployment/vm-deployment/scripts/rollback.sh`

## Troubleshooting

### Common Issues

**1. Cloudflare Deployment Fails**
- Check `CLOUDFLARE_API_TOKEN` is valid
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Check Cloudflare Pages project exists

**2. Backend Deployment Fails**
- Verify SSH key has correct permissions
- Check VM is accessible from GitHub Actions
- Verify Docker is running on VM

**3. Environment Variables Not Working**
- Check secrets are set in GitHub
- Verify secret names match workflow files
- Check environment-specific secrets if using environments

## Next Steps

- [ ] Set up GitHub Secrets
- [ ] Configure branch protection rules
- [ ] Test QA deployment
- [ ] Test Production deployment with approval
- [ ] Set up monitoring and alerts
- [ ] Document rollback procedures

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages Deployment](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
