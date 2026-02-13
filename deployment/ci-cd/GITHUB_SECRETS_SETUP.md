# GitHub Secrets Setup Guide

This guide walks you through setting up all required secrets for the CI/CD pipeline.

## Prerequisites

- Admin access to the GitHub repository
- Cloudflare account with API token
- Access to Azure VMs (for backend deployment)

## Step 1: Navigate to Secrets Settings

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

## Step 2: Create Environments (Recommended)

Creating environments allows for better organization and approval workflows.

### Create Production Environment

1. In Settings, click **Environments** (left sidebar)
2. Click **New environment**
3. Name it `production`
4. Configure protection rules:
   - ✅ Check "Required reviewers"
   - Add yourself or team members as reviewers
   - Set wait timer: 0 minutes (or as needed)
5. Click **Save protection rules**

### Create QA Environment (Optional)

1. Click **New environment**
2. Name it `qa`
3. No protection rules needed (auto-deploy)
4. Click **Create environment**

## Step 3: Add Cloudflare Secrets

### Get Cloudflare API Token

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use template: **Edit Cloudflare Workers**
5. Permissions needed:
   - Account → Cloudflare Pages → Edit
6. Copy the token (you'll only see it once!)

### Get Cloudflare Account ID

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click on any project
3. On the right side, you'll see **Account ID**
4. Copy the Account ID

### Add to GitHub

Go to **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**

Click **New repository secret** for each:

```
Name: CLOUDFLARE_API_TOKEN
Value: <paste your Cloudflare API token>

Name: CLOUDFLARE_ACCOUNT_ID
Value: <paste your Cloudflare account ID>
```

## Step 4: Verify Cloudflare Pages Projects

Make sure you have two Cloudflare Pages projects:

1. **portal-qa** - For QA environment
2. **portal** - For Production environment

If they don't exist, create them:
```bash
# From apps/admin directory
npx wrangler pages project create portal-qa
npx wrangler pages project create portal
```

## Step 5: Test the Setup

### Test QA Deployment

1. Make a small change to `apps/admin/` (e.g., update a comment)
2. Commit and push to `qa` branch:
   ```bash
   git checkout qa
   git add .
   git commit -m "test: CI/CD setup"
   git push origin qa
   ```
3. Go to **Actions** tab in GitHub
4. Watch the "Deploy Frontend to QA" workflow run
5. Verify deployment at https://qa.portal.byomakusuma.com

### Test Production Deployment (with Approval)

1. Merge `qa` to `main`:
   ```bash
   git checkout main
   git merge qa
   git push origin main
   ```
2. Go to **Actions** tab in GitHub
3. The workflow will wait for approval
4. Click on the workflow run
5. Click **Review deployments**
6. Select **production** and click **Approve and deploy**
7. Watch the deployment complete
8. Verify at https://portal.byomakusuma.com

## Troubleshooting

### Error: "Cloudflare API token is invalid"
- Verify the token has correct permissions
- Check if token has expired
- Regenerate token if needed

### Error: "Project not found"
- Verify project names match in workflow files
- Check Cloudflare account has the projects
- Create projects if missing

### Error: "Account ID is invalid"
- Double-check the Account ID from Cloudflare
- Ensure no extra spaces in the secret value

### Workflow doesn't trigger
- Check the branch name matches (`qa` or `main`)
- Verify file paths in workflow trigger match changed files
- Check workflow file syntax is valid YAML

## Security Best Practices

1. ✅ Never commit secrets to the repository
2. ✅ Use environment-specific secrets when possible
3. ✅ Rotate API tokens regularly (every 90 days)
4. ✅ Limit token permissions to minimum required
5. ✅ Use separate tokens for QA and Production (optional)
6. ✅ Enable audit logging for secret access

## Next Steps

After frontend CI/CD is working:
- [ ] Set up backend deployment workflows
- [ ] Add SSH secrets for VM access
- [ ] Configure database backup workflows
- [ ] Set up monitoring and alerts

## Reference

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
