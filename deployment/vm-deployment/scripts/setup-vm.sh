#!/usr/bin/env bash
#
# setup-vm.sh - Main VM setup script for Satori deployment
#
# This script prepares the VM for application deployment by:
# - Verifying Docker installation (DO NOT install/modify Docker)
# - Creating necessary directories
# - Configuring firewall rules
# - Cloning the application repository
#
# Usage: ./setup-vm.sh <environment>
# Example: ./setup-vm.sh qa

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
APP_DIR="/apps"
SATORI_DIR="${APP_DIR}/satori"
TRAEFIK_DIR="${APP_DIR}/traefik"
REPO_URL="https://github.com/byoma-kusuma/satori.git"

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

check_environment() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment not specified"
        echo "Usage: $0 <environment>"
        echo "Example: $0 qa"
        exit 1
    fi

    if [[ "$ENVIRONMENT" != "qa" && "$ENVIRONMENT" != "prod" ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: qa, prod"
        exit 1
    fi

    log_info "Setting up VM for environment: $ENVIRONMENT"
}

verify_docker() {
    log_info "Verifying Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed!"
        log_error "Docker should have been installed via cloud-init during VM provisioning."
        log_error "Please check the IaC configuration and VM provisioning logs."
        exit 1
    fi

    DOCKER_VERSION=$(docker --version)
    log_info "Docker found: $DOCKER_VERSION"

    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose plugin is not installed!"
        log_error "Docker Compose should have been installed via cloud-init during VM provisioning."
        exit 1
    fi

    COMPOSE_VERSION=$(docker compose version)
    log_info "Docker Compose found: $COMPOSE_VERSION"

    # Verify Docker is running
    if ! docker ps &> /dev/null; then
        log_error "Docker daemon is not running!"
        log_info "Attempting to start Docker..."
        sudo systemctl start docker
        sleep 2
        
        if ! docker ps &> /dev/null; then
            log_error "Failed to start Docker daemon"
            exit 1
        fi
    fi

    log_info "Docker verification complete ✓"
}

create_directories() {
    log_info "Creating necessary directories..."

    # Create main apps directory
    if [[ ! -d "$APP_DIR" ]]; then
        sudo mkdir -p "$APP_DIR"
        sudo chown -R "$USER:$USER" "$APP_DIR"
        log_info "Created $APP_DIR"
    else
        log_info "$APP_DIR already exists"
    fi

    # Create Traefik directories
    if [[ ! -d "$TRAEFIK_DIR" ]]; then
        sudo mkdir -p "$TRAEFIK_DIR/acme"
        sudo chown -R "$USER:$USER" "$TRAEFIK_DIR"
        log_info "Created $TRAEFIK_DIR"
    else
        log_info "$TRAEFIK_DIR already exists"
    fi

    log_info "Directory creation complete ✓"
}

configure_firewall() {
    log_info "Configuring firewall rules..."

    # Check if UFW is installed
    if ! command -v ufw &> /dev/null; then
        log_warn "UFW not installed, skipping firewall configuration"
        return
    fi

    # Configure UFW rules
    sudo ufw default deny incoming || true
    sudo ufw default allow outgoing || true
    sudo ufw allow 22/tcp comment 'SSH' || true
    sudo ufw allow 80/tcp comment 'HTTP' || true
    sudo ufw allow 443/tcp comment 'HTTPS' || true

    # Enable UFW if not already enabled
    if ! sudo ufw status | grep -q "Status: active"; then
        log_info "Enabling UFW..."
        yes | sudo ufw enable || true
    fi

    log_info "Firewall configuration complete ✓"
    sudo ufw status numbered
}

clone_repository() {
    log_info "Setting up Satori repository..."

    # Check if repository already exists
    if [[ -d "$SATORI_DIR" ]]; then
        log_info "Satori directory already exists at $SATORI_DIR"
        
        # Check if it's a git repository
        if [[ -d "$SATORI_DIR/.git" ]]; then
            log_info "Pulling latest changes..."
            cd "$SATORI_DIR"
            git pull origin main || log_warn "Failed to pull latest changes (may need manual intervention)"
        else
            log_info "Directory exists but is not a git repository (uploaded manually)"
        fi
    else
        log_info "Cloning Satori repository..."
        cd "$APP_DIR"
        git clone "$REPO_URL" satori
        log_info "Repository cloned successfully"
    fi

    # Verify repository structure
    if [[ ! -d "$SATORI_DIR/apps/server" ]]; then
        log_error "Invalid repository structure: apps/server not found"
        log_error "Contents of $SATORI_DIR:"
        ls -la "$SATORI_DIR" || true
        exit 1
    fi

    if [[ ! -f "$SATORI_DIR/apps/server/Dockerfile" ]]; then
        log_error "Dockerfile not found in apps/server"
        exit 1
    fi

    log_info "Repository setup complete ✓"
}

verify_setup() {
    log_info "Verifying VM setup..."

    local errors=0

    # Check directories
    [[ -d "$APP_DIR" ]] || { log_error "$APP_DIR not found"; ((errors++)); }
    [[ -d "$TRAEFIK_DIR" ]] || { log_error "$TRAEFIK_DIR not found"; ((errors++)); }
    [[ -d "$SATORI_DIR" ]] || { log_error "$SATORI_DIR not found"; ((errors++)); }

    # Check Docker
    docker ps &> /dev/null || { log_error "Docker not accessible"; ((errors++)); }

    # Check repository
    [[ -f "$SATORI_DIR/apps/server/Dockerfile" ]] || { log_error "Dockerfile not found"; ((errors++)); }

    if [[ $errors -gt 0 ]]; then
        log_error "Setup verification failed with $errors error(s)"
        exit 1
    fi

    log_info "Setup verification complete ✓"
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "VM Setup Complete for $ENVIRONMENT"
    echo "=========================================="
    echo ""
    echo "Directories created:"
    echo "  - $APP_DIR"
    echo "  - $TRAEFIK_DIR"
    echo "  - $SATORI_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Run setup-traefik.sh to configure Traefik"
    echo "  2. Run setup-app.sh to deploy the application"
    echo ""
    echo "Or use the environment-specific deployment script:"
    echo "  ./scripts/deploy-${ENVIRONMENT}.sh"
    echo ""
}

# Main execution
main() {
    log_info "Starting VM setup for Satori deployment"
    echo ""

    check_environment
    verify_docker
    create_directories
    configure_firewall
    clone_repository
    verify_setup
    print_summary

    log_info "VM setup completed successfully! ✓"
}

main "$@"
