#!/usr/bin/env bash
#
# deploy-prod-local.sh - Deploy to Production using local repository upload
#
# This script deploys the Satori application to the Production VM by:
# 1. Uploading the local repository to the VM
# 2. Running setup scripts on the VM
# 3. Deploying Traefik and the application
#
# Usage: ./deploy-prod-local.sh
#
# ⚠️  WARNING: This deploys to PRODUCTION! ⚠️
# Only use this for initial deployment or testing.
# For regular deployments, use deploy-prod.sh (Git-based)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="prod"
SSH_HOST="<PROD_SSH_ALIAS>"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"

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
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "Satori PRODUCTION Deployment (Local Upload)"
    echo "=========================================="
    echo ""
}

confirm_production_deployment() {
    log_warn "⚠️  WARNING: You are about to deploy to PRODUCTION!"
    log_warn "This will affect the live production environment."
    echo ""
    read -p "Are you absolutely sure you want to continue? (type 'yes' to proceed): " -r
    echo ""
    
    if [[ ! $REPLY == "yes" ]]; then
        log_info "Production deployment cancelled"
        exit 0
    fi
    
    log_info "Production deployment confirmed"
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if config files exist
    if [[ ! -f "$CONFIG_DIR/traefik.env.prod" ]]; then
        log_error "Production Traefik config not found: $CONFIG_DIR/traefik.env.prod"
        exit 1
    fi
    
    if [[ ! -f "$CONFIG_DIR/app.env.prod" ]]; then
        log_error "Production app config not found: $CONFIG_DIR/app.env.prod"
        exit 1
    fi
    
    # Check for placeholder values in config files
    if grep -q "CHANGE_THIS" "$CONFIG_DIR/traefik.env.prod" "$CONFIG_DIR/app.env.prod"; then
        log_error "Configuration files contain placeholder values (CHANGE_THIS)"
        log_error "Please fill in all configuration values before deploying"
        exit 1
    fi
    
    # Test SSH connection
    log_info "Testing SSH connection to Production VM..."
    if ! ssh -o ConnectTimeout=5 "$SSH_HOST" "echo 'SSH connection successful'" &>/dev/null; then
        log_error "Cannot connect to $SSH_HOST"
        log_error "Ensure SSH is configured correctly"
        exit 1
    fi
    
    log_info "Prerequisites check complete ✓"
}

upload_repository() {
    log_step "Uploading Satori repository to Production VM..."
    
    # Backup .env file if it exists
    log_info "Backing up .env file..."
    ssh "$SSH_HOST" "if [ -f /apps/satori/deployment/server/.env ]; then sudo cp /apps/satori/deployment/server/.env /tmp/satori-backup.env; fi" || true
    
    # Clean up old deployment
    log_info "Cleaning up old deployment..."
    ssh "$SSH_HOST" "sudo rm -rf /apps/satori" || true
    
    # Create archive of repository (excluding node_modules, .git, etc.)
    log_info "Creating repository archive (excluding node_modules, .git, etc.)..."
    local temp_archive="/tmp/satori-$RANDOM.tar.gz"
    
    cd "$PROJECT_ROOT"
    tar -czf "$temp_archive" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='.next' \
        --exclude='build' \
        --exclude='.turbo' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        .
    
    local archive_size=$(du -h "$temp_archive" | cut -f1)
    log_info "Archive created: $temp_archive ($archive_size)"
    
    # Upload to VM
    log_info "Uploading to VM..."
    scp "$temp_archive" "$SSH_HOST:/tmp/"
    
    # Extract on VM
    log_info "Extracting on VM..."
    ssh "$SSH_HOST" "sudo mkdir -p /apps/satori && sudo tar -xzf /tmp/$(basename $temp_archive) -C /apps/satori && sudo rm /tmp/$(basename $temp_archive)"
    
    # Restore .env file if it was backed up
    log_info "Restoring .env file..."
    ssh "$SSH_HOST" "if [ -f /tmp/satori-backup.env ]; then sudo cp /tmp/satori-backup.env /apps/satori/deployment/server/.env && sudo rm /tmp/satori-backup.env; fi" || true
    
    # Clean up local archive
    rm "$temp_archive"
    
    log_info "Repository uploaded successfully ✓"
}

upload_deployment_scripts() {
    log_step "Copying deployment scripts to Production VM..."
    
    # Create remote scripts directory
    ssh "$SSH_HOST" "mkdir -p ~/deployment-scripts"
    
    # Copy scripts
    scp "$SCRIPT_DIR/setup-vm.sh" "$SSH_HOST:~/deployment-scripts/"
    scp "$SCRIPT_DIR/setup-traefik.sh" "$SSH_HOST:~/deployment-scripts/"
    scp "$SCRIPT_DIR/setup-app.sh" "$SSH_HOST:~/deployment-scripts/"
    
    # Copy config files
    scp "$CONFIG_DIR/traefik.env.prod" "$SSH_HOST:~/deployment-scripts/traefik.env.prod"
    scp "$CONFIG_DIR/app.env.prod" "$SSH_HOST:~/deployment-scripts/app.env.prod"
    
    # Make scripts executable
    ssh "$SSH_HOST" "chmod +x ~/deployment-scripts/*.sh"
    
    log_info "Scripts copied to VM ✓"
}

run_vm_setup() {
    log_step "Running VM setup..."
    ssh "$SSH_HOST" "cd ~/deployment-scripts && ./setup-vm.sh $ENVIRONMENT"
    log_info "VM setup complete ✓"
}

run_traefik_setup() {
    log_step "Running Traefik setup..."
    ssh "$SSH_HOST" "cd ~/deployment-scripts && ./setup-traefik.sh $ENVIRONMENT traefik.env.prod"
    log_info "Traefik setup complete ✓"
}

run_app_setup() {
    log_step "Running application setup..."
    ssh "$SSH_HOST" "cd ~/deployment-scripts && ./setup-app.sh $ENVIRONMENT app.env.prod"
    log_info "Application setup complete ✓"
}

verify_deployment() {
    log_step "Verifying deployment..."
    
    log_info "Checking container status..."
    ssh "$SSH_HOST" "sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
    
    log_info "Testing API endpoint..."
    local api_url="https://api.portal.byomakusuma.com"
    log_info "Testing: $api_url"
    
    sleep 5
    
    if curl -k -s -o /dev/null -w "%{http_code}" "$api_url" | grep -q "200\|301\|302\|404"; then
        log_info "API endpoint is responding ✓"
    else
        log_warn "API endpoint may not be responding correctly"
        log_warn "This could be normal if the app is still starting up"
    fi
    
    log_info "Deployment verification complete ✓"
}

cleanup() {
    log_step "Cleaning up temporary files..."
    ssh "$SSH_HOST" "rm -rf ~/deployment-scripts" || true
    log_info "Cleanup complete ✓"
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "Production Deployment Complete"
    echo "=========================================="
    echo ""
    echo "Environment: PRODUCTION"
    echo "API Endpoint: https://api.portal.byomakusuma.com"
    echo ""
    echo "Next steps:"
    echo "  1. Test the API endpoint thoroughly"
    echo "  2. Verify authentication flows"
    echo "  3. Test email functionality"
    echo "  4. Monitor logs for any issues"
    echo ""
    echo "Useful commands:"
    echo "  # View logs"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml logs -f app'"
    echo ""
    echo "  # Check status"
    echo "  ssh $SSH_HOST 'sudo docker ps'"
    echo ""
    echo "⚠️  Remember to push vm-deployment to Git for future deployments!"
    echo ""
}

# Main execution
main() {
    print_header
    confirm_production_deployment
    check_prerequisites
    upload_repository
    upload_deployment_scripts
    run_vm_setup
    run_traefik_setup
    run_app_setup
    verify_deployment
    cleanup
    print_summary
    
    log_info "Production deployment completed successfully! ✓"
}

main "$@"
