# Satori VM Deployment Checklist

This checklist provides a step-by-step guide for deploying the Satori API/backend to VMs provisioned via `bk-portal-iac`.

## Pre-Deployment Verification

### Infrastructure Readiness

- [ ] VMs provisioned via `bk-portal-iac` (QA and Prod)
- [ ] VM IP addresses obtained from Pulumi outputs
- [ ] DNS records created and pointing to VM IPs
- [ ] SSH access configured with shared key (`~/.ssh/<SSH_KEY_NAME>`)
- [ ] SSH config entries added for easy access

### Required Information Gathered

- [ ] Cloudflare API email
- [ ] Cloudflare DNS API token
- [ ] Database credentials (user, password, database name)
- [ ] Better Auth secret key (generate if needed)
- [ ] Azure Communication Services connection string
- [ ] Azure Communication Services from email address
- [ ] Frontend URL
- [ ] Traefik dashboard credentials

### Local Setup

- [ ] `bk-portal-iac` repository cloned and configured
- [ ] `satori` repository cloned
- [ ] SSH key available at `~/.ssh/<SSH_KEY_NAME>`
- [ ] SSH config updated with VM aliases

## QA Environment Deployment

### Step 1: Verify VM Access

```bash
# Test SSH connection
ssh <QA_SSH_ALIAS>

# Verify Docker is installed
ssh <QA_SSH_ALIAS> "docker --version"
ssh <QA_SSH_ALIAS> "docker compose version"
```

- [ ] SSH connection successful
- [ ] Docker version displayed
- [ ] Docker Compose version displayed

### Step 2: Configure Environment Variables

```bash
# Copy templates
cp config/traefik.env.template config/traefik.env.qa
cp config/app.env.qa.template config/app.env.qa
```

Edit `config/traefik.env.qa`:
- [ ] Set `CF_API_EMAIL`
- [ ] Set `CF_DNS_API_TOKEN`
- [ ] Set `TRAEFIK_USERNAME`
- [ ] Set `TRAEFIK_PASSWORD`

Edit `config/app.env.qa`:
- [ ] Set database credentials (`DB_USER`, `DB_PASS`, `DB_NAME`)
- [ ] Set `SERVER_URL=api.qa.portal.byomakusuma.com`
- [ ] Set `AUTH_HOST=api.qa.portal.byomakusuma.com`
- [ ] Set `BETTER_AUTH_URL=https://api.qa.portal.byomakusuma.com`
- [ ] Set `BETTER_AUTH_SECRET` (generate strong secret)
- [ ] Set `FRONTEND_URL=https://qa.portal.byomakusuma.com`
- [ ] Set `ORIGIN=https://qa.portal.byomakusuma.com`
- [ ] Set `EMAIL_SERVICE_PROVIDER=azure`
- [ ] Set `AZURE_COMMUNICATION_CONNECTION_STRING`
- [ ] Set `AZURE_COMMUNICATION_FROM_EMAIL`

### Step 3: Run QA Deployment

```bash
# Execute deployment script
./scripts/deploy-qa.sh
```

- [ ] Script executed without errors
- [ ] All containers started successfully
- [ ] No error messages in output

### Step 4: Verify QA Deployment

#### Check Container Status

```bash
ssh <QA_SSH_ALIAS> "docker ps"
```

Expected containers:
- [ ] `traefik` - Running
- [ ] `portainer` - Running
- [ ] `satori-app` - Running
- [ ] `satori-db` - Running

#### Test API Endpoint

```bash
# Test HTTPS endpoint
curl -I https://api.qa.portal.byomakusuma.com

# Expected: HTTP/2 200 or similar success response
```

- [ ] HTTPS endpoint responds
- [ ] Valid SSL certificate
- [ ] No certificate errors

#### Check Application Logs

```bash
ssh <QA_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose logs --tail=50 app"
```

- [ ] No error messages
- [ ] Application started successfully
- [ ] Database connection established

#### Check Database

```bash
ssh <QA_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose exec db psql -U postgres -d satori -c '\dt'"
```

- [ ] Database tables created
- [ ] Migrations ran successfully

#### Test Traefik Dashboard

```bash
# Open in browser
open https://traefik.byomakusuma.com
```

- [ ] Dashboard accessible
- [ ] Login with configured credentials works
- [ ] API service shows as healthy

#### Test Portainer Dashboard

```bash
# Open in browser
open https://portainer.byomakusuma.com
```

- [ ] Portainer accessible
- [ ] Can view containers
- [ ] All containers show as running

### Step 5: Functional Testing

- [ ] Test user registration
- [ ] Test user login
- [ ] Test API endpoints
- [ ] Test email sending
- [ ] Test database operations
- [ ] Test authentication flows

### Step 6: QA Sign-Off

- [ ] All functional tests passed
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] SSL certificates valid
- [ ] All services accessible

**QA Approved By**: _________________ **Date**: _________

## Production Environment Deployment

**⚠️ CRITICAL: Only proceed after QA is fully validated and approved**

### Step 1: Verify Production VM Access

```bash
# Test SSH connection
ssh <PROD_SSH_ALIAS>

# Verify Docker is installed
ssh <PROD_SSH_ALIAS> "docker --version"
ssh <PROD_SSH_ALIAS> "docker compose version"
```

- [ ] SSH connection successful
- [ ] Docker version displayed
- [ ] Docker Compose version displayed

### Step 2: Configure Production Environment Variables

```bash
# Copy templates
cp config/traefik.env.template config/traefik.env.prod
cp config/app.env.prod.template config/app.env.prod
```

Edit `config/traefik.env.prod`:
- [ ] Set `CF_API_EMAIL`
- [ ] Set `CF_DNS_API_TOKEN`
- [ ] Set `TRAEFIK_USERNAME` (different from QA)
- [ ] Set `TRAEFIK_PASSWORD` (different from QA)

Edit `config/app.env.prod`:
- [ ] Set database credentials (different from QA)
- [ ] Set `SERVER_URL=api.prod.portal.byomakusuma.com`
- [ ] Set `AUTH_HOST=api.prod.portal.byomakusuma.com`
- [ ] Set `BETTER_AUTH_URL=https://api.prod.portal.byomakusuma.com`
- [ ] Set `BETTER_AUTH_SECRET` (different from QA)
- [ ] Set `FRONTEND_URL=https://portal.byomakusuma.com`
- [ ] Set `ORIGIN=https://portal.byomakusuma.com`
- [ ] Set `EMAIL_SERVICE_PROVIDER=azure`
- [ ] Set `AZURE_COMMUNICATION_CONNECTION_STRING` (production)
- [ ] Set `AZURE_COMMUNICATION_FROM_EMAIL` (production)

### Step 3: Run Production Deployment

```bash
# Execute deployment script
./scripts/deploy-prod.sh
```

- [ ] Script executed without errors
- [ ] All containers started successfully
- [ ] No error messages in output

### Step 4: Verify Production Deployment

#### Check Container Status

```bash
ssh <PROD_SSH_ALIAS> "docker ps"
```

Expected containers:
- [ ] `traefik` - Running
- [ ] `portainer` - Running
- [ ] `satori-app` - Running
- [ ] `satori-db` - Running

#### Test API Endpoint

```bash
# Test HTTPS endpoint
curl -I https://api.prod.portal.byomakusuma.com

# Expected: HTTP/2 200 or similar success response
```

- [ ] HTTPS endpoint responds
- [ ] Valid SSL certificate
- [ ] No certificate errors

#### Check Application Logs

```bash
ssh <PROD_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose logs --tail=50 app"
```

- [ ] No error messages
- [ ] Application started successfully
- [ ] Database connection established

#### Check Database

```bash
ssh <PROD_SSH_ALIAS> "cd /apps/satori/deployment/server && docker compose exec db psql -U postgres -d satori -c '\dt'"
```

- [ ] Database tables created
- [ ] Migrations ran successfully

### Step 5: Production Smoke Tests

- [ ] Test user registration
- [ ] Test user login
- [ ] Test critical API endpoints
- [ ] Test email sending
- [ ] Verify SSL certificates
- [ ] Check response times

### Step 6: Production Sign-Off

- [ ] All smoke tests passed
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] SSL certificates valid
- [ ] All services accessible
- [ ] Monitoring configured

**Production Approved By**: _________________ **Date**: _________

## Post-Deployment Tasks

### Documentation

- [ ] Update deployment documentation with any changes
- [ ] Document any issues encountered and resolutions
- [ ] Update runbooks if needed

### Monitoring Setup

- [ ] Configure log aggregation (if applicable)
- [ ] Set up uptime monitoring
- [ ] Configure alerting
- [ ] Set up database backup schedule

### Security

- [ ] Verify firewall rules
- [ ] Confirm SSH key-only authentication
- [ ] Review exposed ports
- [ ] Verify SSL/TLS configuration

### Backup and Recovery

- [ ] Test database backup procedure
- [ ] Test database restore procedure
- [ ] Document rollback procedure
- [ ] Verify backup retention policy

## Rollback Procedure

If issues are discovered post-deployment:

```bash
# On the VM
cd /apps/satori
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>
cd deployment/server
docker compose build
docker compose up -d
```

- [ ] Rollback procedure documented
- [ ] Rollback tested in QA
- [ ] Team trained on rollback process

## Common Issues and Solutions

### Issue: SSL Certificate Not Generated

**Symptoms**: Certificate errors, HTTPS not working

**Solution**:
1. Verify DNS points to VM IP (not Cloudflare proxy)
2. Ensure Cloudflare proxy is disabled (gray cloud)
3. Restart Traefik: `docker compose restart traefik`
4. Wait 30-60 seconds for certificate generation
5. Check Traefik logs: `docker compose logs traefik`

- [ ] Issue resolved
- [ ] Root cause identified
- [ ] Prevention steps documented

### Issue: Application Container Not Starting

**Symptoms**: Container exits immediately or restarts continuously

**Solution**:
1. Check logs: `docker compose logs app`
2. Verify environment variables: `docker compose config`
3. Check database connectivity
4. Verify Docker image built successfully

- [ ] Issue resolved
- [ ] Root cause identified
- [ ] Prevention steps documented

### Issue: Database Connection Failed

**Symptoms**: Application can't connect to database

**Solution**:
1. Verify database is running: `docker compose ps db`
2. Check database logs: `docker compose logs db`
3. Test connection: `docker compose exec db psql -U postgres`
4. Verify DATABASE_URL in .env

- [ ] Issue resolved
- [ ] Root cause identified
- [ ] Prevention steps documented

## Sign-Off

### QA Environment

- **Deployed By**: _________________
- **Date**: _________
- **Commit Hash**: _________________
- **Status**: [ ] Success [ ] Failed
- **Notes**: _________________________________________________

### Production Environment

- **Deployed By**: _________________
- **Date**: _________
- **Commit Hash**: _________________
- **Status**: [ ] Success [ ] Failed
- **Notes**: _________________________________________________

## Appendix

### Useful Commands

```bash
# View all logs
docker compose logs -f

# Restart specific service
docker compose restart app

# Rebuild and restart
docker compose up -d --build

# Check resource usage
docker stats

# Clean up unused images
docker image prune -f

# Database backup
docker compose exec db pg_dump -U postgres satori > backup.sql

# Database restore
docker compose exec -T db psql -U postgres satori < backup.sql
```

### Emergency Contacts

- **DevOps Lead**: _________________
- **Backend Lead**: __________________
- **On-Call Engineer**: _________________
