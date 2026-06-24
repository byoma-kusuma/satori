#!/usr/bin/env bash
#
# setup-traefik.sh - Configure and deploy Traefik reverse proxy
#
# This script sets up Traefik with:
# - Let's Encrypt TLS certificates via Cloudflare DNS-01
# - Reverse proxy configuration
# - Portainer for container management
#
# Usage: ./setup-traefik.sh <environment> <config-file>
# Example: ./setup-traefik.sh qa ../config/traefik.env.qa

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
CONFIG_FILE="${2:-}"
TRAEFIK_DIR="/apps/traefik"
SATORI_DIR="/apps/satori"
ACME_FILE="${TRAEFIK_DIR}/acme/acme.json"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_arguments() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment not specified"
        echo "Usage: $0 <environment> <config-file>"
        echo "Example: $0 qa ../config/traefik.env.qa"
        exit 1
    fi

    if [[ -z "$CONFIG_FILE" ]]; then
        log_error "Config file not specified"
        echo "Usage: $0 <environment> <config-file>"
        echo "Example: $0 qa ../config/traefik.env.qa"
        exit 1
    fi

    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "Config file not found: $CONFIG_FILE"
        exit 1
    fi

    log_info "Setting up Traefik for environment: $ENVIRONMENT"
}

verify_prerequisites() {
    log_info "Verifying prerequisites..."

    if [[ ! -d "$TRAEFIK_DIR" ]]; then
        log_error "Traefik directory not found: $TRAEFIK_DIR"
        log_error "Run setup-vm.sh first"
        exit 1
    fi

    if [[ ! -d "$SATORI_DIR" ]]; then
        log_error "Satori directory not found: $SATORI_DIR"
        log_error "Run setup-vm.sh first"
        exit 1
    fi

    log_info "Prerequisites verified ✓"
}

validate_config() {
    log_info "Validating configuration file..."

    # Required variables
    local required_vars=(
        "CF_API_EMAIL"
        "CF_DNS_API_TOKEN"
        "TRAEFIK_USERNAME"
        "TRAEFIK_PASSWORD"
    )

    # Source the config file
    set -a
    source "$CONFIG_FILE"
    set +a

    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required variables in config file:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi

    log_info "Configuration validated ✓"
}

setup_traefik_config() {
    log_info "Setting up Traefik configuration..."

    # Copy docker-compose file
    if [[ ! -f "$SATORI_DIR/deployment/traefik/docker-compose.yml" ]]; then
        log_error "Traefik docker-compose.yml not found in repository"
        exit 1
    fi

    sudo cp "$SATORI_DIR/deployment/traefik/docker-compose.yml" "$TRAEFIK_DIR/docker-compose.yml"
    log_info "Copied docker-compose.yml"

    # Copy environment file
    sudo cp "$CONFIG_FILE" "$TRAEFIK_DIR/.env"
    sudo chown "$USER:$USER" "$TRAEFIK_DIR/.env"
    log_info "Copied environment configuration"

    # Setup ACME file for Let's Encrypt certificates
    if [[ ! -f "$ACME_FILE" ]]; then
        sudo touch "$ACME_FILE"
        sudo chmod 600 "$ACME_FILE"
        log_info "Created ACME file for certificates"
    else
        log_info "ACME file already exists"
    fi

    log_info "Traefik configuration complete ✓"
}

deploy_traefik() {
    log_info "Deploying Traefik and Portainer..."

    cd "$TRAEFIK_DIR"

    # Pull latest images
    log_info "Pulling Docker images..."
    sudo docker compose pull

    # Start services
    log_info "Starting Traefik services..."
    sudo docker compose up -d

    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 10

    log_info "Traefik deployment complete ✓"
}

verify_deployment() {
    log_info "Verifying Traefik deployment..."

    cd "$TRAEFIK_DIR"

    # Check if containers are running
    local traefik_status=$(sudo docker compose ps traefik --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "not found")
    local portainer_status=$(sudo docker compose ps portainer --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "not found")

    if [[ "$traefik_status" != "running" ]]; then
        log_error "Traefik container is not running (status: $traefik_status)"
        log_info "Checking logs..."
        sudo docker compose logs traefik
        exit 1
    fi

    if [[ "$portainer_status" != "running" ]]; then
        log_warn "Portainer container is not running (status: $portainer_status)"
        log_info "Checking logs..."
        sudo docker compose logs portainer
    fi

    log_info "Container status:"
    sudo docker compose ps

    log_info "Traefik verification complete ✓"
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "Traefik Setup Complete for $ENVIRONMENT"
    echo "=========================================="
    echo ""
    echo "Services deployed:"
    echo "  - Traefik (reverse proxy with TLS)"
    echo "  - Portainer (container management)"
    echo ""
    echo "Traefik will automatically obtain Let's Encrypt certificates"
    echo "via Cloudflare DNS-01 challenge."
    echo ""
    echo "Access points:"
    echo "  - Traefik Dashboard: https://traefik.byomakusuma.com"
    echo "  - Portainer: https://portainer.byomakusuma.com"
    echo ""
    echo "Note: Certificate generation may take 30-60 seconds."
    echo "      Ensure DNS records are configured correctly."
    echo ""
    echo "Next step:"
    echo "  Run setup-app.sh to deploy the Satori application"
    echo ""
}

# Main execution
main() {
    log_info "Starting Traefik setup"
    echo ""

    check_arguments
    verify_prerequisites
    validate_config
    setup_traefik_config
    deploy_traefik
    verify_deployment
    print_summary

    log_info "Traefik setup completed successfully! ✓"
}

main "$@"
