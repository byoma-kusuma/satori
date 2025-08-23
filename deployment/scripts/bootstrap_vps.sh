#!/usr/bin/env bash
set -euo pipefail

#####################################################################################################################
# Update & install Docker
sudo apt-get update -y
sudo apt-get upgrade -y

sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    git

sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

### Testing
docker --version
docker compose version

#####################################################################################################################
# Enable docker on boot
sudo systemctl enable docker

# Firewall
sudo ufw default deny incoming || true # reset to default deny
sudo ufw default allow outgoing || true # reset to default allow
sudo ufw allow 22/tcp || true # SSH
sudo ufw allow 80/tcp || true # HTTP
sudo ufw allow 8080/tcp || true # Traefik dashboard
sudo ufw allow 443/tcp || true # HTTPS

yes | sudo ufw enable || true

# Folders
sudo mkdir -p /apps/traefik/acme
sudo mkdir -p /apps
sudo chown -R $USER:$USER /apps

echo "Bootstrap complete.
Next:
  1) Put Cloudflare creds in /apps/traefik/.env
  2) Start Traefik:  cd /apps/traefik && sudo docker compose up -d
  3) Place your app repo in /apps (with Dockerfile)
  4) Configure /apps/.env and run: sudo docker compose up -d --build"
