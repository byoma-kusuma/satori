# CI/CD Setup Checklist

Follow this checklist to set up the complete CI/CD pipeline.

## Phase 1: Frontend CI/CD (Current)

### 1. Push Code to GitHub
- [ ] Push the `qa` branch with new workflows
  ```bash
  git push origin qa
  ```

### 2. Set Up GitHub Secrets
Follow: [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

- [ ] Get Cloudflare API Token
- [ ] Get Cloudflare Account ID
- [ ] Add `CLOUDFLARE_API_TOKEN` to GitHub Secrets
- [ ] Add `CLOUDFLARE_ACCOUNT_ID` to GitHub Secrets

### 3. Verify Cloudflare Pages Projects
- [ ] Confirm `portal-qa` project exists in Cloudflare
- [ ] Confirm `portal` project exists in Cloudflare
- [ ] If missing, create them:
  ```bash
  cd apps/admin
  npx wrangler pages project create portal-qa
  npx wrangler pages project create portal
  ```

### 4. Set Up GitHub Environments
- [ ] Create `production` environment in GitHub
- [ ] Add yourself as required reviewer for production
- [ ] Optionally create `qa` environment

### 5. Configure Branch Protection
Follow: [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md)

- [ ] Protect `main` branch:
  - [ ] Require pull request reviews (1 approval)
  - [ ] Require status checks to pass
  - [ ] Require branches to be up to date
  - [ ] Require conversation resolution
- [ ] Protect `qa` branch:
  - [ ] Require status checks to pass
  - [ ] No PR required (allow direct push)

### 6. Test QA Deployment
- [ ] Make a small change to `apps/admin/`
- [ ] Push to `qa` branch
- [ ] Watch GitHub Actions workflow
- [ ] Verify deployment at https://qa.portal.byomakusuma.com
- [ ] Check API connection works

### 7. Test Production Deployment
- [ ] Create PR from `qa` to `main`
- [ ] Get PR approved
- [ ] Merge PR
- [ ] Approve deployment in GitHub Actions
- [ ] Verify deployment at https://portal.byomakusuma.com
- [ ] Check API connection works

## Phase 2: Backend CI/CD (Next)

### 1. Add SSH Secrets
- [ ] Add `QA_SSH_HOST` secret
- [ ] Add `QA_SSH_USER` secret
- [ ] Add `QA_SSH_KEY` secret (private key)
- [ ] Add `PROD_SSH_HOST` secret
- [ ] Add `PROD_SSH_USER` secret
- [ ] Add `PROD_SSH_KEY` secret (private key)

### 2. Add Application Secrets
- [ ] Add `QA_DB_PASSWORD` secret
- [ ] Add `QA_BETTER_AUTH_SECRET` secret
- [ ] Add `QA_AZURE_COMM_STRING` secret
- [ ] Add `PROD_DB_PASSWORD` secret
- [ ] Add `PROD_BETTER_AUTH_SECRET` secret
- [ ] Add `PROD_AZURE_COMM_STRING` secret

### 3. Create Backend Workflows
- [ ] Create `deploy-backend-qa.yml`
- [ ] Create `deploy-backend-prod.yml`
- [ ] Test QA backend deployment
- [ ] Test production backend deployment

## Phase 3: Database Backups (Future)

### 1. Azure Blob Storage Setup
- [ ] Create Azure Storage Account
- [ ] Create blob container for backups
- [ ] Get storage account connection string
- [ ] Add to GitHub Secrets

### 2. Create Backup Workflow
- [ ] Create `backup-database.yml` (scheduled)
- [ ] Test backup workflow
- [ ] Verify backups in Azure Blob Storage

### 3. Create Restore Documentation
- [ ] Document restore procedures
- [ ] Test restore from backup
- [ ] Create disaster recovery runbook

## Phase 4: Monitoring & Alerts (Future)

### 1. Health Checks
- [ ] Add health check endpoint to backend
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### 2. Deployment Notifications
- [ ] Set up Slack notifications (optional)
- [ ] Set up email notifications
- [ ] Configure failure alerts

## Current Status

- ✅ Frontend CI/CD workflows created
- ✅ Documentation complete
- ⏳ Waiting for GitHub Secrets setup
- ⏳ Waiting for branch protection setup
- ⏳ Waiting for testing

## Next Immediate Steps

1. **Push code to GitHub**
   ```bash
   git push origin qa
   ```

2. **Set up Cloudflare secrets** (5 minutes)
   - Follow GITHUB_SECRETS_SETUP.md

3. **Configure branch protection** (5 minutes)
   - Follow BRANCH_PROTECTION_SETUP.md

4. **Test QA deployment** (10 minutes)
   - Make a test change
   - Push and verify

5. **Test production deployment** (10 minutes)
   - Create PR
   - Approve and verify

Total time: ~30 minutes

## Questions or Issues?

- Check troubleshooting sections in setup guides
- Review GitHub Actions logs for errors
- Verify all secrets are set correctly
- Ensure Cloudflare projects exist

## Success Criteria

- [ ] QA deploys automatically on push to `qa` branch
- [ ] Production requires PR approval before merge
- [ ] Production requires deployment approval before deploy
- [ ] Both environments deploy successfully
- [ ] Frontend connects to correct API for each environment
- [ ] No secrets are committed to repository
