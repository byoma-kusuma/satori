#!/usr/bin/env bash
#
# deploy-qa.sh - Deploy Satori to QA environment
#
# This script orchestrates the complete deployment of Satori to the QA environment
# by running all setup scripts in the correct order.
#
# Prerequisites:
# - QA VM provisioned via bk-portal-iac
# - SSH access configured
# - Configuration files prepared in ../config/
#
# Usage: ./deploy-qa.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="qa"
SSH_HOST="<QA_SSH_ALIAS>"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$(cd "$SCRIPT_DIR/../config" && pwd)"
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

    ssh "$SSH_HOST" "bash /tmp/satori-deployment/setup-vm.sh $ENVIRONMENT"

    if [[ $? -ne 0 ]]; then
        log_error "VM setup failed"
        exit 1
    fi

    log_info "VM setup complete ✓"
}

run_traefik_setup() {
    log_step "Running Traefik setup..."

    ssh "$SSH_HOST" "bash /tmp/satori-deployment/setup-traefik.sh $ENVIRONMENT /tmp/satori-deployment/traefik.env"

    if [[ $? -ne 0 ]]; then
        log_error "Traefik setup failed"
        exit 1
    fi

    log_info "Traefik setup complete ✓"
}

run_app_setup() {
    log_step "Running application setup..."

    ssh "$SSH_HOST" "bash /tmp/satori-deployment/setup-app.sh $ENVIRONMENT /tmp/satori-deployment/app.env"

    if [[ $? -ne 0 ]]; then
        log_error "Application setup failed"
        exit 1
    fi

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
    
    if [[ "$http_code" =~ ^(200|301|302)$ ]]; then
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
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && docker compose logs -f app'"
    echo ""
    echo "  # Check container status"
    echo "  ssh $SSH_HOST 'docker ps'"
    echo ""
    echo "  # Restart application"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && docker compose restart app'"
    echo ""
    echo "Next steps:"
    echo "  1. Test all API endpoints"
    echo "  2. Verify authentication flows"
    echo "  3. Test email functionality"
    echo "  4. Run integration tests"
    echo "  5. After validation, deploy to Production"
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
    echo "Satori QA Deployment"
    echo "=========================================="
    echo ""

    check_prerequisites
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
