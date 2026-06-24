# Quick Start Guide - Satori VM Deployment

This guide will get you up and running with Satori on your VMs in under 30 minutes.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] VMs provisioned via `bk-portal-iac` (QA and Prod)
- [ ] SSH access configured (`~/.ssh/<SSH_KEY_NAME>`)
- [ ] Cloudflare API token with DNS edit permissions
- [ ] Azure Communication Services connection string
- [ ] Database credentials prepared

## Step 1: Configure Deployment Settings (2 minutes)

```bash
cd satori/deployment/vm-deployment

# Copy and configure deployment environment
cp .env.template .env
vim .env
```

Set your values:
- `QA_SSH_ALIAS` and `PROD_SSH_ALIAS` - SSH aliases or hostnames
- `QA_VM_IP` and `PROD_VM_IP` - Your VM IP addresses
- `BASE_DOMAIN` - Your domain (e.g., `example.com`)
- `GIT_REPO_URL` - Your Git repository URL

**Optional**: Add SSH config entries in `~/.ssh/config` for easier access:
```
Host your-qa-alias
   HostName <your-qa-ip>
   User azureuser
   IdentityFile ~/.ssh/id_rsa
```

Load the environment:
```bash
source .env
```

## Step 2: Configure QA Environment (5 minutes)

```bash
# Copy configuration templates
cp config/traefik.env.template config/traefik.env.qa
cp config/app.env.qa.template config/app.env.qa

# Edit configuration files
vim config/traefik.env.qa
vim config/app.env.qa
```

### Required Values for traefik.env.qa:
- `CF_API_EMAIL` - Your Cloudflare email
- `CF_DNS_API_TOKEN` - Cloudflare API token
- `TRAEFIK_USERNAME` - Dashboard username (e.g., "admin")
- `TRAEFIK_PASSWORD` - Strong password

### Required Values for app.env.qa:
- `DB_PASS` - Strong database password
- `BETTER_AUTH_SECRET` - Random secret (generate with: `openssl rand -base64 32`)
- `AZURE_COMMUNICATION_CONNECTION_STRING` - From Azure Portal or IaC outputs
- `AZURE_COMMUNICATION_FROM_EMAIL` - e.g., `noreply@qa.mail.example.com`

## Step 3: Deploy to QA (10 minutes)

```bash
# Run the deployment script
./scripts/deploy-qa.sh
```

The script will:
1. ✓ Verify prerequisites
2. ✓ Copy scripts to VM
3. ✓ Set up VM environment
4. ✓ Configure Traefik
5. ✓ Deploy application
6. ✓ Run verification tests

## Step 3: Validate QA (10 minutes)

```bash
# Test API endpoint
curl -I https://api.qa.portal.byomakusuma.com

# Check container status
ssh <QA_SSH_ALIAS> "docker ps"

# View application logs
ssh <QA_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose logs -f app"

# Access Traefik dashboard
open https://traefik.byomakusuma.com

# Access Portainer
open https://portainer.byomakusuma.com
```

### QA Validation Checklist:
- [ ] API endpoint responds with 200 OK
- [ ] All containers are running
- [ ] No errors in application logs
- [ ] Traefik dashboard accessible
- [ ] SSL certificate valid
- [ ] User registration works
- [ ] User login works
- [ ] Email sending works

## Step 4: Configure Production (5 minutes)

**⚠️ Only proceed after QA is fully validated!**

```bash
# Copy configuration templates
cp config/traefik.env.template config/traefik.env.prod
cp config/app.env.prod.template config/app.env.prod

# Edit configuration files with DIFFERENT values from QA
vim config/traefik.env.prod
vim config/app.env.prod
```

**CRITICAL**: Use different passwords and secrets from QA!

## Step 5: Deploy to Production (10 minutes)

```bash
# Run the production deployment script
./scripts/deploy-prod.sh
```

You will be prompted to confirm the production deployment.

## Step 6: Validate Production (5 minutes)

```bash
# Test API endpoint
curl -I https://api.prod.portal.byomakusuma.com

# Check container status
ssh <PROD_SSH_ALIAS> "docker ps"

# View application logs
ssh <PROD_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose logs -f app"
```

## Common Commands

### View Logs
```bash
# QA
ssh <QA_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose logs -f app"

# Production
ssh <PROD_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose logs -f app"
```

### Restart Application
```bash
# QA
ssh <QA_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose restart app"

# Production
ssh <PROD_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose restart app"
```

### Check Container Status
```bash
# QA
ssh <QA_SSH_ALIAS> "docker ps"

# Production
ssh <PROD_SSH_ALIAS> "docker ps"
```

### Update Application
```bash
# QA
ssh <QA_SSH_ALIAS> "cd /apps/satori && git pull && cd deployment/server && docker compose build && docker compose up -d"

# Production
ssh <PROD_SSH_ALIAS> "cd /apps/satori && git pull && cd deployment/server && docker compose build && docker compose up -d"
```

## Troubleshooting

### Issue: SSL Certificate Not Working

**Solution**:
1. Verify DNS points to VM IP (not Cloudflare proxy)
2. Ensure Cloudflare proxy is disabled (gray cloud)
3. Restart Traefik: `ssh <QA_SSH_ALIAS> "cd /apps/traefik && docker compose restart"`
4. Wait 30-60 seconds

### Issue: Application Not Starting

**Solution**:
1. Check logs: `docker compose logs app`
2. Verify database is running: `docker compose ps db`
3. Check environment variables: `docker compose config`

### Issue: Database Connection Failed

**Solution**:
1. Verify database is running: `docker compose ps db`
2. Check database logs: `docker compose logs db`
3. Test connection: `docker compose exec db psql -U postgres -d satori`

## Rollback Procedure

If you need to rollback to a previous version:

```bash
# SSH to the VM
ssh <QA_SSH_ALIAS>  # or <PROD_SSH_ALIAS>

# Find previous commit
cd /apps/satori
git log --oneline -10

# Rollback
git checkout <commit-hash>
cd deployment/server
docker compose build
docker compose up -d
```

Or use the rollback script:
```bash
# Copy rollback script to VM
scp scripts/rollback.sh <QA_SSH_ALIAS>:/tmp/

# Run rollback
ssh <QA_SSH_ALIAS> "bash /tmp/rollback.sh qa <commit-hash>"
```

## Next Steps

After successful deployment:

1. **Set up monitoring** - Configure log aggregation and alerting
2. **Configure backups** - Set up automated database backups
3. **Run integration tests** - Verify all functionality
4. **Update documentation** - Document any environment-specific configurations
5. **Train team** - Ensure team knows how to deploy and troubleshoot

## Support

For issues or questions:
- Check `README.md` for detailed documentation
- Review `DEPLOYMENT_CHECKLIST.md` for step-by-step instructions
- Check application logs for error messages
- Review Traefik logs for routing issues

## Useful Links

- **IaC Repository**: `bk-portal-iac`
- **Application Repository**: `satori/apps/server`
- **Deployment Documentation**: `satori/deployment/readme.md`
- **Traefik Dashboard**: `https://traefik.byomakusuma.com`
- **Portainer Dashboard**: `https://portainer.byomakusuma.com`
