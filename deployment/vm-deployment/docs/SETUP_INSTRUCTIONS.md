# Setup Instructions

This document explains how to configure the deployment scripts for your environment.

## Quick Setup

### 1. Configure Deployment Environment

Copy the template and configure your deployment settings:

```bash
cd deployment/vm-deployment
cp .env.template .env
```

Edit `.env` and set your values:
- SSH aliases and VM IPs
- Domain names
- Git repository URL
- Branch names

### 2. Load Environment Variables

Before running any deployment scripts, load the environment:

```bash
source .env
```

Or the scripts will automatically try to load it if available.

### 3. Configure Service Environments

Copy the template files and fill in your service-specific values:

```bash
# QA environment
cp config/app.env.qa.template config/app.env.qa
cp config/traefik.env.template config/traefik.env.qa

# Production environment
cp config/app.env.prod.template config/app.env.prod
cp config/traefik.env.template config/traefik.env.prod
```

Edit each file and replace placeholder values with your actual configuration.

## Placeholders Used in Documentation

Throughout the documentation and scripts, you'll see these placeholders that need to be replaced with your actual values:

- `<QA_VM_IP>` - IP address of your QA VM (e.g., `20.198.0.175`)
- `<PROD_VM_IP>` - IP address of your Production VM (e.g., `20.219.22.93`)
- `<QA_SSH_ALIAS>` - SSH alias for QA VM (e.g., `azure-qa-api-2026`)
- `<PROD_SSH_ALIAS>` - SSH alias for Production VM (e.g., `azure-prod-api-2026`)
- `<VM_USER>` - Username on the VMs (e.g., `azureuser`, `ubuntu`, etc.)
- `<SSH_KEY_NAME>` - Name of your SSH private key file (e.g., `id_rsa`, `azure_key`)
- `<YOUR_PASSWORD>` - Database or service passwords
- `<YOUR_DOMAIN>` - Your domain name (e.g., `example.com`)

## Initial Setup Steps

## Initial Setup Steps

### Configure SSH Access (Optional)

If you prefer SSH aliases, edit your `~/.ssh/config` file:

```bash
Host your-qa-alias
   HostName <your-qa-ip>
   User <your-user>
   IdentityFile ~/.ssh/<your-key>
   StrictHostKeyChecking no

Host your-prod-alias
   HostName <your-prod-ip>
   User <your-user>
   IdentityFile ~/.ssh/<your-key>
   StrictHostKeyChecking no
```

Then update your `.env` file with these aliases.

Test SSH connection:
```bash
ssh $QA_SSH_ALIAS
ssh $PROD_SSH_ALIAS
```

### Environment Variables Reference

The `.env` file supports these variables:

**SSH Configuration:**
- `QA_SSH_ALIAS` - SSH alias or hostname for QA VM
- `PROD_SSH_ALIAS` - SSH alias or hostname for Production VM
- `QA_VM_IP` - IP address of QA VM
- `PROD_VM_IP` - IP address of Production VM
- `VM_USER` - Username on the VMs
- `SSH_KEY_PATH` - Path to SSH private key

**Domain Configuration:**
- `BASE_DOMAIN` - Your base domain (e.g., `example.com`)
- `QA_API_DOMAIN` - QA API domain
- `PROD_API_DOMAIN` - Production API domain
- `TRAEFIK_DOMAIN` - Traefik dashboard domain
- `PORTAINER_DOMAIN` - Portainer dashboard domain

**Git Configuration:**
- `GIT_REPO_URL` - Git repository URL
- `QA_BRANCH` - Branch name for QA deployments
- `PROD_BRANCH` - Branch name for Production deployments

**Deployment Paths:**
- `REMOTE_APP_DIR` - Application directory on VMs (default: `/apps/satori`)
- `REMOTE_TRAEFIK_DIR` - Traefik directory on VMs (default: `/apps/traefik`)
- `REMOTE_BACKUP_DIR` - Backup directory on VMs (default: `/apps/backups`)

### Deploy

Follow the [QUICK_START.md](QUICK_START.md) guide to deploy your application.

## Security Notes

- Never commit actual config files (`*.env.qa`, `*.env.prod`) to git
- Keep SSH keys secure and never commit them
- Use strong passwords for all services
- Regularly rotate credentials
- Review firewall rules on your VMs

## Getting Help

- See [README.md](README.md) for detailed documentation
- Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) before deploying
- Review [BACKUP_GUIDE.md](BACKUP_GUIDE.md) for backup procedures
