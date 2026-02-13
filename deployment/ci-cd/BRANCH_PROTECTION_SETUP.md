# Branch Protection Rules Setup

This guide explains how to configure branch protection rules for safe deployments.

## Overview

Branch protection ensures code quality and prevents accidental deployments:
- **main** (Production): Requires PR review and approval
- **qa**: Requires passing checks, auto-deploys

## Step 1: Navigate to Branch Settings

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Branches** (left sidebar under "Code and automation")

## Step 2: Protect Main Branch (Production)

### Add Branch Protection Rule

1. Click **Add branch protection rule**
2. Branch name pattern: `main`

### Configure Protection Settings

#### Require Pull Request Reviews
- ✅ Check "Require a pull request before merging"
- ✅ Check "Require approvals"
- Set required approvals: **1**
- ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
- ✅ Check "Require review from Code Owners" (if you have CODEOWNERS file)

#### Require Status Checks
- ✅ Check "Require status checks to pass before merging"
- ✅ Check "Require branches to be up to date before merging"
- Add status checks (after first workflow run):
  - `Deploy to Cloudflare Pages (Production)`
  - Any other checks you want to require

#### Additional Settings
- ✅ Check "Require conversation resolution before merging"
- ✅ Check "Require signed commits" (optional, recommended)
- ✅ Check "Require linear history" (optional, keeps history clean)
- ✅ Check "Include administrators" (applies rules to admins too)
- ⚠️ Leave "Allow force pushes" UNCHECKED
- ⚠️ Leave "Allow deletions" UNCHECKED

### Save Protection Rule

Click **Create** at the bottom

## Step 3: Protect QA Branch

### Add Branch Protection Rule

1. Click **Add branch protection rule**
2. Branch name pattern: `qa`

### Configure Protection Settings

#### Require Status Checks
- ✅ Check "Require status checks to pass before merging"
- ✅ Check "Require branches to be up to date before merging"
- Add status checks:
  - `Deploy to Cloudflare Pages (QA)`

#### Additional Settings
- ✅ Check "Require conversation resolution before merging"
- ⚠️ Do NOT require pull request reviews (allows direct push for quick iterations)
- ⚠️ Leave "Allow force pushes" UNCHECKED
- ⚠️ Leave "Allow deletions" UNCHECKED

### Save Protection Rule

Click **Create** at the bottom

## Step 4: Configure Environment Protection (Production)

This adds an extra approval layer for production deployments.

1. Go to **Settings** → **Environments**
2. Click on **production** environment
3. Under "Deployment protection rules":
   - ✅ Check "Required reviewers"
   - Add reviewers (yourself and/or team members)
   - Set wait timer: **0 minutes** (or add delay if needed)
4. Click **Save protection rules**

## Deployment Flow After Setup

### QA Deployment (Direct Push)
```bash
# Make changes
git checkout qa
git add .
git commit -m "feat: new feature"
git push origin qa

# ✅ Workflow runs automatically
# ✅ Deploys to QA if checks pass
```

### Production Deployment (PR + Approval)
```bash
# Create PR from qa to main
git checkout qa
git push origin qa

# On GitHub:
# 1. Create Pull Request: qa → main
# 2. Wait for checks to pass
# 3. Request review from team member
# 4. Reviewer approves PR
# 5. Merge PR
# 6. Workflow triggers
# 7. Deployment waits for environment approval
# 8. Designated reviewer approves deployment
# 9. Deploys to Production
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Feature Dev  │
                    │  (local/dev)  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Push to QA   │
                    └───────┬───────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  QA Branch Protected  │
                │  • Status checks      │
                │  • Auto-deploy        │
                └───────┬───────────────┘
                        │
                        ▼
                ┌───────────────┐
                │  QA Testing   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │  Create PR    │
                │  qa → main    │
                └───────┬───────┘
                        │
                        ▼
            ┌───────────────────────────┐
            │  Main Branch Protected    │
            │  • PR required            │
            │  • 1 approval required    │
            │  • Status checks          │
            │  • Up to date required    │
            └───────┬───────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  PR Approved  │
            │  & Merged     │
            └───────┬───────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │  Production Environment   │
        │  • Deployment approval    │
        │  • Designated reviewers   │
        └───────┬───────────────────┘
                │
                ▼
        ┌───────────────┐
        │  Deploy Prod  │
        └───────────────┘
```

## Testing the Setup

### Test QA Protection

Try to push directly to qa with failing code:
```bash
git checkout qa
# Make a syntax error
git add .
git commit -m "test: intentional error"
git push origin qa
```

Expected: Workflow runs but fails, preventing deployment

### Test Main Protection

Try to push directly to main:
```bash
git checkout main
git add .
git commit -m "test: direct push"
git push origin main
```

Expected: Push is rejected with message about requiring pull request

### Test PR Approval

1. Create PR from qa to main
2. Try to merge without approval
3. Expected: Merge button is disabled until approved

## Troubleshooting

### Can't push to protected branch
- This is expected! Use pull requests instead
- For qa: Create PR or ask admin to temporarily disable protection

### Status checks not appearing
- Run the workflow at least once
- Status check names must match exactly
- Wait a few minutes for GitHub to register them

### Can't merge PR even with approval
- Check all required status checks have passed
- Ensure branch is up to date with base branch
- Verify all conversations are resolved

## Best Practices

1. ✅ Always test in QA before merging to main
2. ✅ Keep PRs small and focused
3. ✅ Write descriptive commit messages
4. ✅ Review your own PR before requesting review
5. ✅ Respond to review comments promptly
6. ✅ Use draft PRs for work in progress
7. ✅ Delete branches after merging

## Next Steps

- [ ] Set up branch protection rules
- [ ] Test QA deployment flow
- [ ] Test production deployment flow with approval
- [ ] Document any custom rules for your team
- [ ] Train team members on the workflow

## Reference

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Pull Request Reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)
