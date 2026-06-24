#!/usr/bin/env bash
#
# deploy-prod.sh - Deploy Satori to Production environment
#
# ⚠️  WARNING: This deploys to PRODUCTION ⚠️
#
# This script orchestrates the complete deployment of Satori to the Production environment.
# It includes additional safety checks and confirmation prompts.
#
# Prerequisites:
# - Production VM provisioned via bk-portal-iac
# - SSH access configured
# - Configuration files prepared in ../config/
# - QA environment fully validated
#
# Usage: ./deploy-prod.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="prod"
SSH_HOST="<PROD_SSH_ALIAS>"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$(cd "$SCRIPT_DIR/../config" && pwd)"
TRAEFIK_CONFIG="$CONFIG_DIR/traefik.env.prod"
APP_CONFIG="$CONFIG_DIR/app.env.prod"

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

log_critical() {
    echo -e "${MAGENTA}[CRITICAL]${NC} $1"
}

confirm_production_deployment() {
    echo ""
    log_critical "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
    echo ""
    echo "You are about to deploy to the PRODUCTION environment."
    echo "This will affect live users and services."
    echo ""
    echo "Before proceeding, ensure:"
    echo "  ✓ QA environment is fully validated"
    echo "  ✓ All tests have passed"
    echo "  ✓ Stakeholders have approved the deployment"
    echo "  ✓ You have reviewed the changes being deployed"
    echo "  ✓ Rollback procedure is understood"
    echo ""
    
    read -p "Have you completed all pre-deployment checks? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Production deployment cancelled"
        exit 1
    fi

    read -p "Type 'DEPLOY TO PRODUCTION' to confirm: " -r
    echo
    if [[ $REPLY != "DEPLOY TO PRODUCTION" ]]; then
        log_error "Production deployment cancelled"
        exit 1
    fi

    log_info "Production deployment confirmed"
}

check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check if config files exist
    if [[ ! -f "$TRAEFIK_CONFIG" ]]; then
        log_error "Traefik config not found: $TRAEFIK_CONFIG"
        log_info "Copy config/traefik.env.template to config/traefik.env.prod and fill in values"
        exit 1
    fi

    if [[ ! -f "$APP_CONFIG" ]]; then
        log_error "App config not found: $APP_CONFIG"
        log_info "Copy config/app.env.prod.template to config/app.env.prod and fill in values"
        exit 1
    fi

    # Verify production-specific values are different from QA
    log_info "Verifying production configuration..."
    
    local prod_db_pass=$(grep "^DB_PASS=" "$APP_CONFIG" | cut -d'=' -f2)
    local prod_auth_secret=$(grep "^BETTER_AUTH_SECRET=" "$APP_CONFIG" | cut -d'=' -f2)
    
    if [[ -f "$CONFIG_DIR/app.env.qa" ]]; then
        local qa_db_pass=$(grep "^DB_PASS=" "$CONFIG_DIR/app.env.qa" | cut -d'=' -f2)
        local qa_auth_secret=$(grep "^BETTER_AUTH_SECRET=" "$CONFIG_DIR/app.env.qa" | cut -d'=' -f2)
        
        if [[ "$prod_db_pass" == "$qa_db_pass" ]]; then
            log_error "Production database password is the same as QA!"
            log_error "Use different credentials for production"
            exit 1
        fi
        
        if [[ "$prod_auth_secret" == "$qa_auth_secret" ]]; then
            log_error "Production auth secret is the same as QA!"
            log_error "Use different secrets for production"
            exit 1
        fi
    fi

    # Check SSH connectivity
    log_info "Testing SSH connection to Production VM..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$SSH_HOST" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Cannot connect to Production VM via SSH"
        log_info "Ensure SSH is configured correctly:"
        log_info "  ssh $SSH_HOST"
        exit 1
    fi

    log_info "Prerequisites check complete ✓"
}

backup_existing_deployment() {
    log_step "Creating backup of existing deployment..."

    # Check if deployment exists
    if ssh "$SSH_HOST" "test -d /apps/satori"; then
        log_info "Existing deployment found, creating backup..."
        
        local backup_name="satori-backup-$(date +%Y%m%d-%H%M%S)"
        
        ssh "$SSH_HOST" "cd /apps/satori && git rev-parse HEAD > /tmp/last-commit.txt"
        ssh "$SSH_HOST" "cd /apps/satori/deployment/server && cp .env /tmp/last-env-backup.txt" || true
        
        log_info "Backup information saved"
        log_info "Last commit: $(ssh "$SSH_HOST" "cat /tmp/last-commit.txt")"
    else
        log_info "No existing deployment found, skipping backup"
    fi
}

copy_scripts_to_vm() {
    log_step "Copying deployment scripts to Production VM..."

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
        log_error "Check logs and consider rollback if needed"
        exit 1
    fi

    log_info "Application setup complete ✓"
}

verify_deployment() {
    log_step "Verifying production deployment..."

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
    sleep 15

    local http_code=$(curl -k -s -o /dev/null -w "%{http_code}" "$api_url" || echo "000")
    
    if [[ "$http_code" =~ ^(200|301|302)$ ]]; then
        log_info "API endpoint is responding (HTTP $http_code) ✓"
    else
        log_error "API endpoint returned HTTP $http_code"
        log_error "Deployment may have failed!"
        log_error "Check logs immediately: ssh $SSH_HOST 'cd /apps/satori/deployment/server && docker compose logs app'"
        exit 1
    fi

    # Additional health checks
    log_info "Running health checks..."
    
    # Check if all expected containers are running
    local expected_containers=("traefik" "portainer" "app" "db")
    for container in "${expected_containers[@]}"; do
        if ssh "$SSH_HOST" "docker ps --format '{{.Names}}'" | grep -q "$container"; then
            log_info "Container '$container' is running ✓"
        else
            log_error "Container '$container' is not running!"
            exit 1
        fi
    done

    log_info "Production deployment verification complete ✓"
}

run_smoke_tests() {
    log_step "Running smoke tests..."

    local server_url=$(grep "^SERVER_URL=" "$APP_CONFIG" | cut -d'=' -f2)
    local api_url="https://${server_url}"

    # Test 1: API responds
    log_info "Test 1: API endpoint responds"
    if curl -k -s -f "$api_url" > /dev/null; then
        log_info "✓ API endpoint is accessible"
    else
        log_warn "⚠ API endpoint test inconclusive"
    fi

    # Test 2: Database connectivity
    log_info "Test 2: Database connectivity"
    if ssh "$SSH_HOST" "cd /apps/satori/deployment/server && docker compose exec -T db psql -U postgres -d satori -c 'SELECT 1;'" &> /dev/null; then
        log_info "✓ Database is accessible"
    else
        log_error "✗ Database connectivity failed"
        exit 1
    fi

    # Test 3: No critical errors in logs
    log_info "Test 3: Checking for critical errors in logs"
    local critical_errors=$(ssh "$SSH_HOST" "cd /apps/satori/deployment/server && docker compose logs --tail=50 app" | grep -i "fatal\|critical" || true)
    if [[ -z "$critical_errors" ]]; then
        log_info "✓ No critical errors found in logs"
    else
        log_warn "⚠ Critical errors found in logs:"
        echo "$critical_errors"
    fi

    log_info "Smoke tests complete"
}

print_summary() {
    local server_url=$(grep "^SERVER_URL=" "$APP_CONFIG" | cut -d'=' -f2)

    echo ""
    echo "=========================================="
    echo "🎉 PRODUCTION DEPLOYMENT COMPLETE! 🎉"
    echo "=========================================="
    echo ""
    echo "Environment: PRODUCTION"
    echo "VM: $SSH_HOST"
    echo "Deployed at: $(date)"
    echo ""
    echo "Endpoints:"
    echo "  API: https://${server_url}"
    echo "  Traefik Dashboard: https://traefik.byomakusuma.com"
    echo "  Portainer: https://portainer.byomakusuma.com"
    echo ""
    echo "Monitoring commands:"
    echo "  # SSH to VM"
    echo "  ssh $SSH_HOST"
    echo ""
    echo "  # View application logs"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && docker compose logs -f app'"
    echo ""
    echo "  # Check container status"
    echo "  ssh $SSH_HOST 'docker ps'"
    echo ""
    echo "  # Monitor resource usage"
    echo "  ssh $SSH_HOST 'docker stats'"
    echo ""
    echo "Rollback procedure (if needed):"
    echo "  ssh $SSH_HOST"
    echo "  cd /apps/satori"
    echo "  git log --oneline -10  # Find previous commit"
    echo "  git checkout <commit-hash>"
    echo "  cd deployment/server"
    echo "  docker compose build && docker compose up -d"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor application logs for any issues"
    echo "  2. Run full integration tests"
    echo "  3. Verify all critical user flows"
    echo "  4. Monitor system resources"
    echo "  5. Set up alerts and monitoring"
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
    echo "Satori PRODUCTION Deployment"
    echo "=========================================="
    echo ""

    confirm_production_deployment
    check_prerequisites
    backup_existing_deployment
    copy_scripts_to_vm
    run_vm_setup
    run_traefik_setup
    run_app_setup
    verify_deployment
    run_smoke_tests
    cleanup
    print_summary

    log_info "Production deployment completed successfully! ✓"
}

# Trap errors and cleanup
trap cleanup EXIT

main "$@"
