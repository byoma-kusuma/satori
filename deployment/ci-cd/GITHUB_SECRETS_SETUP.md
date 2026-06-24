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
2. Go to **My Profile** (top right) → **API Tokens**
3. Click **Create Token**
4. Click **Use template** next to **Edit Cloudflare Workers** OR create custom token

#### Option A: Use Template (Recommended)
1. Select **Edit Cloudflare Workers** template
2. This automatically includes:
   - Account → Cloudflare Pages → Edit
   - Account → Account Settings → Read
3. Under **Account Resources**, select your account
4. Under **Zone Resources**, select "All zones" or specific zones
5. Set TTL (optional): Leave blank for no expiration or set expiration date
6. Click **Continue to summary**
7. Click **Create Token**
8. **Copy the token immediately** (you'll only see it once!)

#### Option B: Create Custom Token
1. Click **Create Custom Token**
2. Token name: `GitHub Actions - Cloudflare Pages`
3. Add these permissions:

   **Account Permissions:**
   - Cloudflare Pages → **Edit**
   - Account Settings → **Read**

   **User Permissions:**
   - User Details → **Read** (required for wrangler CLI)
   - Memberships → **Read** (required for wrangler CLI)

   **Zone Permissions:** (if you need DNS management)
   - Zone → **Read**
   - DNS → **Edit**

4. **Account Resources:**
   - Include → Select your account

5. **Zone Resources:**
   - Include → All zones (or select specific zones)

6. **Client IP Address Filtering:** (optional)
   - Leave blank to allow from any IP
   - Or add GitHub Actions IP ranges for extra security

7. **TTL:** (optional)
   - Leave blank for no expiration
   - Or set expiration date (e.g., 1 year)

8. Click **Continue to summary**
9. Review permissions
10. Click **Create Token**
11. **Copy the token immediately** (you'll only see it once!)

#### Minimum Required Permissions Summary
```
Account Permissions:
  ✅ Cloudflare Pages: Edit

User Permissions (Required for Wrangler CLI):
  ✅ User Details: Read
  ✅ Memberships: Read

Optional but Recommended:
  ✅ Account Settings: Read
```

#### Save Your Token Securely
⚠️ **Important:** You can only see the token once! Save it immediately:
- Copy to password manager
- Or add directly to GitHub Secrets
- Do NOT commit to code or share publicly

### Get Cloudflare Account ID

1. In Cloudflare Dashboard, go to **Workers & Pages** (left sidebar)
2. Click on any existing project (or create a test one)
3. On the right side panel, you'll see **Account ID**
4. Click the copy icon next to the Account ID
5. Save it for the next step

**Alternative method:**
1. Go to any domain in your Cloudflare account
2. Scroll down on the Overview page
3. On the right side, under **API**, you'll see **Account ID**

### Add to GitHub

Go to **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**

Click **New repository secret** for each:

```
Name: CLOUDFLARE_API_TOKEN
Value: <paste your Cloudflare API token>
Description: API token for deploying to Cloudflare Pages

Name: CLOUDFLARE_ACCOUNT_ID
Value: <paste your Cloudflare account ID>
Description: Cloudflare account ID for Pages deployment
```

## Visual Guide: Creating Cloudflare API Token

```
Cloudflare Dashboard
├── Click Profile Icon (top right)
├── Select "My Profile"
├── Click "API Tokens" (left sidebar)
├── Click "Create Token"
│
├── Option 1: Use Template
│   ├── Find "Edit Cloudflare Workers"
│   ├── Click "Use template"
│   ├── Verify permissions:
│   │   └── Account → Cloudflare Pages → Edit ✅
│   ├── Select Account Resources
│   ├── Click "Continue to summary"
│   └── Click "Create Token"
│
└── Option 2: Custom Token
    ├── Click "Create Custom Token"
    ├── Name: "GitHub Actions - Cloudflare Pages"
    ├── Permissions:
    │   ├── Account → Cloudflare Pages → Edit ✅
    │   └── Account → Account Settings → Read ✅
    ├── Account Resources: Include → Your Account
    ├── Click "Continue to summary"
    └── Click "Create Token"

⚠️  COPY TOKEN IMMEDIATELY - You won't see it again!
```

## Token Permissions Explained

| Permission | Resource | Access | Required | Purpose |
|------------|----------|--------|----------|---------|
| Cloudflare Pages | Account | Edit | ✅ Yes | Deploy to Pages projects |
| User Details | User | Read | ✅ Yes | Wrangler CLI authentication |
| Memberships | User | Read | ✅ Yes | Wrangler CLI account access |
| Account Settings | Account | Read | ⚠️ Recommended | Read account info |
| Zone | Zone | Read | ❌ No | Only if managing DNS |
| DNS | Zone | Edit | ❌ No | Only if updating DNS records |

## Quick Fix: Update Existing Token

If you already created a token without the User permissions:

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Find your token (e.g., "GitHub Actions - Cloudflare Pages")
3. Click **Edit**
4. Scroll to **User Permissions** section
5. Add:
   - User Details → **Read**
   - Memberships → **Read**
6. Click **Continue to summary**
7. Click **Save**
8. The token remains the same (no need to update GitHub Secret)

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

### Error: "Authentication error [code: 10000]"
**Full error:** `A request to the Cloudflare API (/memberships) failed`

**Cause:** API token is missing User permissions

**Solution:**
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Edit your token
3. Add User Permissions:
   - User Details → Read
   - Memberships → Read
4. Save the token
5. Re-run the GitHub Action (no need to update the secret)

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
