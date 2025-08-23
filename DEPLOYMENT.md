# Deployment Guide

This guide will help you deploy the Satori application:
- UI (Admin) on Cloudflare Pages
- Backend (Server) and Database on Digital Ocean

## Prerequisites

- A Cloudflare account with Pages enabled
- A Digital Ocean account
- A domain name for your API
- Git installed on your local machine

## 1. Deploying the UI to Cloudflare Pages

### Step 1: Prepare the UI for deployment

The UI is prepared for deployment with the following configurations:
- Updated API URL handling via environment variables
- Added `_redirects` file for SPA routing
- Added Cloudflare Pages configuration

### Step 2: Deploy to Cloudflare Pages

1. Log in to your Cloudflare dashboard and navigate to Pages
2. Click "Create a project" > "Connect to Git"
3. Select your repository and configure the deployment settings:
   - Project name: `satori-ui` (or your preferred name)
   - Production branch: `main`
   - Build command: `NODE_OPTIONS=--max-old-space-size=8192 pnpm build`
   - Build output directory: `dist`
   - Root directory: `/apps/admin`

4. In the Environment Variables section, add:
   - For production environment: `VITE_API_URL` = `https://your-api-domain.com`
   - For preview environments: `VITE_API_URL` = `https://staging-api-domain.com` (if applicable)

5. Click "Save and Deploy"

## 2. Deploying Backend to Digital Ocean

### Step 1: Create a Droplet on Digital Ocean

1. Log in to your Digital Ocean account
2. Create a new Droplet with the following configuration:
   - Choose an image: Ubuntu 22.04 LTS
   - Size: Basic Plan with at least 2GB RAM / 1 CPU
   - Datacenter region: Choose closest to your users
   - Authentication: SSH keys (recommended)
   - Hostname: `satori-api` (or your preferred name)

### Step 2: Set Up the Droplet

1. SSH into your droplet:
   ```bash
   ssh root@your-droplet-ip
   ```

2. Update and install required packages:
   ```bash
   apt update && apt upgrade -y
   apt install -y docker.io docker-compose git curl nginx certbot python3-certbot-nginx
   ```

3. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/satori.git /opt/satori
   cd /opt/satori
   ```

4. Create the environment file:
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Update with your actual values:
   ```
   DB_NAME=satori
   DB_USER=postgres
   DB_PASS=your_secure_password
   FRONTEND_URL=https://your-frontend-domain.com
   ```

5. Update domain names in Nginx and Let's Encrypt configuration:
   ```bash
   sed -i 's/your-api-domain.com/your-actual-domain.com/g' nginx/default.conf
   sed -i 's/your-api-domain.com/your-actual-domain.com/g' scripts/init-letsencrypt.sh
   sed -i 's/your-email@example.com/your-actual-email@example.com/g' scripts/init-letsencrypt.sh
   ```

6. Make the init script executable and run it:
   ```bash
   chmod +x scripts/init-letsencrypt.sh
   ./scripts/init-letsencrypt.sh
   ```

7. Start the application:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 3. Setting Up DNS

1. In your domain registrar or DNS provider, point your domains:
   - Point your frontend domain to Cloudflare Pages (follow Cloudflare instructions)
   - Point your API domain to your Digital Ocean droplet IP

2. For the API domain, add an A record:
   ```
   Type: A
   Name: api (or @ for root domain)
   Value: [Your Droplet IP]
   TTL: Auto or 3600
   ```

## 4. Database Management

The PostgreSQL database is running in a Docker container on the Digital Ocean droplet. To manage it:

### Backup the database
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres satori > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore the database
```bash
cat backup_file.sql | docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres satori
```

### Access the database
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres satori
```

## 5. Maintenance

### Deploying updates

1. Push changes to your repository
2. On the server:
   ```bash
   cd /opt/satori
   git pull
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### Monitoring logs

```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

### Restart services

```bash
docker-compose -f docker-compose.prod.yml restart app
```

## Troubleshooting

- **CORS issues**: Ensure the `ORIGIN` environment variable in your backend matches your frontend URL
- **Database connection issues**: Check if the database container is running and that credentials are correct
- **SSL certificate issues**: Run the init-letsencrypt.sh script again
- **Application not starting**: Check logs with `docker-compose -f docker-compose.prod.yml logs app`