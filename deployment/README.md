# Satori Server Deployment — Traefik + Docker on a single VPS

This bundle sets up **Traefik** for TLS (Cloudflare DNS-01) and deploys your app and Postgres
on the same VPS using **Docker Compose**, without any external container registries.

**Domain:** `api.satori.byomakusuma.com`  
**Server compose path:** `/apps/satori/deployment/server`  
**Reverse proxy compose path:** `/apps/satori/deployment/traefik`  

---

## 0) What you need

- A DigitalOcean VPS (Ubuntu recommended), public IP: `xx.yy.zz`
- Cloudflare account managing the zone that contains `byomakusuma.com`
- A GitHub repo with your app (Dockerfile present)
- SSH access to the VPS
- Cloudflare **API token** with Zone.DNS Edit for `byomakusuma.com`

---

## 1) Cloudflare DNS

1. Create **A record**:  
   - Name: `api.satori`  
   - Content: `xx.yy.zz`  
   - Proxy: Proxied (orange) or DNS-only (gray). DNS-01 works with both.
2. SSL/TLS → **Full (strict)** recommended.
3. Create an **API token** with *Zone.DNS:Edit* permission for `byomakusuma.com`.
   - Save token as `CF_DNS_API_TOKEN`
   - Your Cloudflare email as `CF_API_EMAIL`

---

## 2) Bootstrap the VPS

Clone the satori repo to the server and run the bootstrap script.
You can also copy-paste commands if you prefer.

```bash
# On the server:
cd /apps
sudo git clone https://github.com/byoma-kusuma/satori
chmod +x /apps/satori/deployment/scripts/bootstrap_vps.sh
/apps/satori/deployment/scripts/bootstrap_vps.sh
```

This will:
- Install Docker & docker compose plugin
- Configure UFW to allow 22, 80, 443
- Create necessary directories

---

## 3) Set up Traefik (TLS with Cloudflare DNS-01)

1. Set up the Traefik files:
```bash
sudo mkdir -p /apps/traefik/acme
sudo cp /apps/satori/deployment/traefik/docker-compose.yml /apps/traefik/docker-compose.yml
sudo cp /apps/satori/deployment/traefik/.env.example /apps/traefik/.env
sudo touch /apps/traefik/acme/acme.json
sudo chmod 600 /apps/traefik/acme/acme.json
```

1. Edit `/apps/traefik/.env` and fill in:
```
CF_API_EMAIL=you@example.com
CF_DNS_API_TOKEN=cf_*******************
```

1. Start Traefik:
```bash
cd /apps/traefik
sudo docker compose up -d
```

---

## 4) Prepare the app code

The satori repo is already cloned at `/apps/satori` from step 2.

Edit `/apps/satori/deployment/server/.env` — set your real DB credentials and app env vars.
Make sure:
```
SERVER_URL=api.satori.byomakusuma.com
ORIGIN=https://api.satori.byomakusuma.com
```

---

## 5) First deploy

```bash
cd /apps/satori/deployment/server
sudo docker compose -f docker-compose.traefik.yml build --pull
sudo docker compose -f docker-compose.traefik.yml up -d
```

- The `db` service will start privately (no public ports)
- The `migrate` service runs once
- The `app` service starts and is exposed only through Traefik
- Traefik will obtain/renew TLS certs automatically via Cloudflare DNS-01

Check:
```bash
curl -I https://api.satori.byomakusuma.com
```

---

## 6) CI/CD via GitHub Actions (SSH to VPS)

1. On the **server**, ensure your user has an SSH key in `~/.ssh/authorized_keys`.
2. In your GitHub repo, add **Secrets**:
   - `SSH_HOST=xx.yy.zz`
   - `SSH_USER=<your_vps_user>`
   - `SSH_KEY=<private_key_contents>` (PEM; the matching public key is on the server)

3. The workflow is already in the repo:
   - `.github/workflows/deploy.yml` is already present

On push to `main`, it will SSH into the server and run:
- `git pull` in `/apps/satori`
- `cd /apps/satori/deployment/server`
- `docker compose -f docker-compose.traefik.yml build --pull`
- `docker compose -f docker-compose.traefik.yml up -d --remove-orphans`
- `docker image prune -f`

---

## 7) Rollback

SSH to the VPS:
```bash
cd /apps/satori
git checkout <previous_commit_or_tag>
cd deployment/server
sudo docker compose -f docker-compose.traefik.yml build
sudo docker compose -f docker-compose.traefik.yml up -d
```

---

## 8) Notes & Tips

- DB isn’t publicly exposed. Access from the app only.
- If your app listens on a different internal port, update the Traefik label
  `traefik.http.services.apiapp.loadbalancer.server.port` in `/apps/satori/deployment/server/docker-compose.traefik.yml`.
- For Traefik dashboard, expose port 8080 and protect with BasicAuth (optional).
- Backups: schedule `pg_dump` nightly (cron) from the `db` container.
