#!/usr/bin/env bash
#
# deploy-qa-local.sh - Deploy Satori to QA using local repository
#
# This script uploads the local repository to the VM instead of cloning from Git.
# Use this for testing deployment scripts before pushing to Git.
#
# Usage: ./deploy-qa-local.sh

set -euo pipefail

# Load environment variables (optional - will use defaults if not found)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../load-env.sh" ]]; then
    source "$SCRIPT_DIR/../load-env.sh" 2>/dev/null || true
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="qa"
SSH_HOST="${QA_SSH_ALIAS:-<QA_SSH_ALIAS>}"
CONFIG_DIR="$(cd "$SCRIPT_DIR/../../config" && pwd)"
SATORI_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
TRAEFIK_CONFIG="$CONFIG_DIR/traefik.env.qa"
APP_CONFIG="$CONFIG_DIR/app.env.qa"

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check if config files exist
    if [[ ! -f "$TRAEFIK_CONFIG" ]]; then
        log_error "Traefik config not found: $TRAEFIK_CONFIG"
        log_info "Copy config/traefik.env.template to config/traefik.env.qa and fill in values"
        exit 1
    fi

    if [[ ! -f "$APP_CONFIG" ]]; then
        log_error "App config not found: $APP_CONFIG"
        log_info "Copy config/app.env.qa.template to config/app.env.qa and fill in values"
        exit 1
    fi

    # Check SSH connectivity
    log_info "Testing SSH connection to QA VM..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$SSH_HOST" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Cannot connect to QA VM via SSH"
        log_info "Ensure SSH is configured correctly:"
        log_info "  ssh $SSH_HOST"
        exit 1
    fi

    log_info "Prerequisites check complete ✓"
}

upload_repository() {
    log_step "Uploading Satori repository to QA VM..."

    # Create apps directory on VM
    ssh "$SSH_HOST" "sudo mkdir -p /apps && sudo chown -R \$USER:\$USER /apps"

    # Backup .env file if it exists
    log_info "Backing up .env file..."
    ssh "$SSH_HOST" "if [ -f /apps/satori/deployment/server/.env ]; then cp /apps/satori/deployment/server/.env /tmp/satori-backup.env; fi" || true

    # Remove old satori directory if exists
    log_info "Cleaning up old deployment..."
    ssh "$SSH_HOST" "rm -rf /apps/satori" || true

    # Create temporary archive excluding unnecessary files
    log_info "Creating repository archive (excluding node_modules, .git, etc.)..."
    local temp_archive="/tmp/satori-$(date +%s).tar.gz"
    
    # Use find to exclude node_modules at any depth
    tar -czf "$temp_archive" \
        -C "$SATORI_ROOT" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.turbo' \
        --exclude='.cache' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='deployment/vm-deployment/config/*.env.qa' \
        --exclude='deployment/vm-deployment/config/*.env.prod' \
        --exclude='*.tar.gz' \
        --exclude='.next' \
        --exclude='coverage' \
        .

    log_info "Archive created: $temp_archive ($(du -h "$temp_archive" | cut -f1))"

    # Upload archive
    log_info "Uploading to VM..."
    scp "$temp_archive" "$SSH_HOST:/tmp/satori.tar.gz"

    # Extract on VM
    log_info "Extracting on VM..."
    ssh "$SSH_HOST" "mkdir -p /apps/satori && tar -xzf /tmp/satori.tar.gz -C /apps/satori && rm /tmp/satori.tar.gz"

    # Restore .env file if it was backed up
    log_info "Restoring .env file..."
    ssh "$SSH_HOST" "if [ -f /tmp/satori-backup.env ]; then cp /tmp/satori-backup.env /apps/satori/deployment/server/.env && rm /tmp/satori-backup.env; fi" || true

    # Clean up local archive
    rm "$temp_archive"

    log_info "Repository uploaded successfully ✓"
}

copy_scripts_to_vm() {
    log_step "Copying deployment scripts to QA VM..."

    # Create remote scripts directory
    ssh "$SSH_HOST" "mkdir -p /tmp/satori-deployment"

    # Copy scripts
    scp "$SCRIPT_DIR/setup-vm.sh" "$SSH_HOST:/tmp/satori-deployment/"
    scp "$SCRIPT_DIR/setup-traefik.sh" "$SSH_HOST:/tmp/satori-deployment/"
    scp "$SCRIPT_DIR/setup-app.sh" "$SSH_HOST:/tmp/satori-deployment/"

    # Copy config files
    scp "$TRAEFIK_CONFIG" "$SSH_HOST:/tmp/satori-deployment/traefik.env"
    scp "$APP_CONFIG" "$SSH_HOST:/tmp/satori-deployment/app.env"

    # Make scripts executable
    ssh "$SSH_HOST" "chmod +x /tmp/satori-deployment/*.sh"

    log_info "Scripts copied to VM ✓"
}

run_vm_setup() {
    log_step "Running VM setup..."

    ssh "$SSH_HOST" "bash /tmp/satori-deployment/setup-vm.sh $ENVIRONMENT" || {
        log_error "VM setup failed"
        exit 1
    }

    log_info "VM setup complete ✓"
}

run_traefik_setup() {
    log_step "Running Traefik setup..."

    ssh "$SSH_HOST" "bash /tmp/satori-deployment/setup-traefik.sh $ENVIRONMENT /tmp/satori-deployment/traefik.env" || {
        log_error "Traefik setup failed"
        exit 1
    }

    log_info "Traefik setup complete ✓"
}

run_app_setup() {
    log_step "Running application setup..."

    ssh "$SSH_HOST" "bash /tmp/satori-deployment/setup-app.sh $ENVIRONMENT /tmp/satori-deployment/app.env" || {
        log_error "Application setup failed"
        exit 1
    }

    log_info "Application setup complete ✓"
}

verify_deployment() {
    log_step "Verifying deployment..."

    # Check container status
    log_info "Checking container status..."
    ssh "$SSH_HOST" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

    # Test API endpoint
    log_info "Testing API endpoint..."
    
    # Get SERVER_URL from config
    local server_url=$(grep "^SERVER_URL=" "$APP_CONFIG" | cut -d'=' -f2)
    local api_url="https://${server_url}"

    log_info "Testing: $api_url"
    
    # Wait for services to fully start
    sleep 10

    local http_code=$(curl -k -s -o /dev/null -w "%{http_code}" "$api_url" || echo "000")
    
    if [[ "$http_code" =~ ^(200|301|302|404)$ ]]; then
        log_info "API endpoint is responding (HTTP $http_code) ✓"
    else
        log_warn "API endpoint returned HTTP $http_code"
        log_warn "This may be normal if the application is still starting"
    fi

    log_info "Deployment verification complete ✓"
}

print_summary() {
    local server_url=$(grep "^SERVER_URL=" "$APP_CONFIG" | cut -d'=' -f2)

    echo ""
    echo "=========================================="
    echo "QA Deployment Complete!"
    echo "=========================================="
    echo ""
    echo "Environment: QA"
    echo "VM: $SSH_HOST"
    echo "Deployment Method: Local repository upload"
    echo ""
    echo "Endpoints:"
    echo "  API: https://${server_url}"
    echo "  Traefik Dashboard: https://traefik.byomakusuma.com"
    echo "  Portainer: https://portainer.byomakusuma.com"
    echo ""
    echo "Useful commands:"
    echo "  # SSH to VM"
    echo "  ssh $SSH_HOST"
    echo ""
    echo "  # View application logs"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && docker compose -f docker-compose.traefik.yml logs -f app'"
    echo ""
    echo "  # Check container status"
    echo "  ssh $SSH_HOST 'docker ps'"
    echo ""
    echo "  # Restart application"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && docker compose -f docker-compose.traefik.yml restart app'"
    echo ""
    echo "Next steps:"
    echo "  1. Test all API endpoints"
    echo "  2. Verify authentication flows"
    echo "  3. Test email functionality"
    echo "  4. If successful, push vm-deployment to Git"
    echo "  5. Deploy to Production using Git clone method"
    echo ""
}

cleanup() {
    log_info "Cleaning up temporary files..."
    ssh "$SSH_HOST" "rm -rf /tmp/satori-deployment" || true
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "Satori QA Deployment (Local Upload)"
    echo "=========================================="
    echo ""

    check_prerequisites
    upload_repository
    copy_scripts_to_vm
    run_vm_setup
    run_traefik_setup
    run_app_setup
    verify_deployment
    cleanup
    print_summary

    log_info "QA deployment completed successfully! ✓"
}

# Trap errors and cleanup
trap cleanup EXIT

main "$@"
