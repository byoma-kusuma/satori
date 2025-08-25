#!/usr/bin/env bash
set -euo pipefail

# Prepare Traefik
sudo touch /apps/traefik/acme/acme.json
sudo chmod 600 /apps/traefik/acme/acme.json

pushd /apps/traefik
sudo docker compose up -d
popd

# App deploy
pushd /apps
sudo docker compose build --pull
sudo docker compose up -d
popd

echo "Deployed. Test with: curl -I https://api.satori.byomakusuma.com"
