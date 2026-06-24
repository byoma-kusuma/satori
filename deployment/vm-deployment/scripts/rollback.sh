#!/usr/bin/env bash
#
# rollback.sh - Rollback Satori deployment to a previous version
#
# This script rolls back the application to a previous Git commit.
#
# Usage: ./rollback.sh <environment> <commit-hash>
# Example: ./rollback.sh qa abc123def

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
COMMIT_HASH="${2:-}"
SATORI_DIR="/apps/satori"
DEPLOYMENT_DIR="${SATORI_DIR}/deployment/server"

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

check_arguments() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment not specified"
        echo "Usage: $0 <environment> <commit-hash>"
        echo "Example: $0 qa abc123def"
        exit 1
    fi

    if [[ -z "$COMMIT_HASH" ]]; then
        log_error "Commit hash not specified"
        echo "Usage: $0 <environment> <commit-hash>"
        echo ""
        echo "To find previous commits:"
        echo "  cd $SATORI_DIR"
        echo "  git log --oneline -10"
        exit 1
    fi

    log_info "Rolling back $ENVIRONMENT to commit: $COMMIT_HASH"
}

confirm_rollback() {
    echo ""
    log_critical "⚠️  ROLLBACK WARNING ⚠️"
    echo ""
    echo "You are about to rollback the $ENVIRONMENT environment to:"
    echo "  Commit: $COMMIT_HASH"
    echo ""
    echo "This will:"
    echo "  1. Checkout the specified commit"
    echo "  2. Rebuild Docker images"
    echo "  3. Restart all services"
    echo ""
    echo "Current deployment will be replaced!"
    echo ""
    
    read -p "Are you sure you want to proceed? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Rollback cancelled"
        exit 1
    fi

    if [[ "$ENVIRONMENT" == "prod" ]]; then
        read -p "Type 'ROLLBACK PRODUCTION' to confirm: " -r
        echo
        if [[ $REPLY != "ROLLBACK PRODUCTION" ]]; then
            log_error "Production rollback cancelled"
            exit 1
        fi
    fi

    log_info "Rollback confirmed"
}

backup_current_state() {
    log_step "Backing up current state..."

    cd "$SATORI_DIR"

    # Save current commit
    local current_commit=$(git rev-parse HEAD)
    echo "$current_commit" > /tmp/rollback-previous-commit.txt
    log_info "Current commit saved: $current_commit"

    # Backup current .env file
    if [[ -f "$DEPLOYMENT_DIR/.env" ]]; then
        cp "$DEPLOYMENT_DIR/.env" /tmp/rollback-previous-env.txt
        log_info "Current .env backed up"
    fi

    log_info "Backup complete ✓"
}

verify_commit() {
    log_step "Verifying commit hash..."

    cd "$SATORI_DIR"

    # Check if commit exists
    if ! git cat-file -e "$COMMIT_HASH^{commit}" 2>/dev/null; then
        log_error "Commit hash not found: $COMMIT_HASH"
        log_info "Available recent commits:"
        git log --oneline -10
        exit 1
    fi

    # Show commit details
    log_info "Commit details:"
    git show --no-patch --format="%h - %s (%an, %ar)" "$COMMIT_HASH"

    log_info "Commit verified ✓"
}

checkout_commit() {
    log_step "Checking out commit: $COMMIT_HASH"

    cd "$SATORI_DIR"

    # Stash any local changes
    if ! git diff-index --quiet HEAD --; then
        log_warn "Local changes detected, stashing..."
        git stash
    fi

    # Checkout the commit
    git checkout "$COMMIT_HASH"

    if [[ $? -ne 0 ]]; then
        log_error "Failed to checkout commit"
        exit 1
    fi

    log_info "Checkout complete ✓"
}

rebuild_application() {
    log_step "Rebuilding application..."

    cd "$DEPLOYMENT_DIR"

    # Stop current containers
    log_info "Stopping current containers..."
    sudo docker compose -f docker-compose.traefik.yml down

    # Rebuild images
    log_info "Building Docker images..."
    sudo docker compose -f docker-compose.traefik.yml build --pull

    if [[ $? -ne 0 ]]; then
        log_error "Build failed"
        log_error "Attempting to restore previous state..."
        restore_previous_state
        exit 1
    fi

    log_info "Rebuild complete ✓"
}

restart_services() {
    log_step "Restarting services..."

    cd "$DEPLOYMENT_DIR"

    # Start services
    log_info "Starting services..."
    sudo docker compose -f docker-compose.traefik.yml up -d

    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 15

    log_info "Services restarted ✓"
}

verify_rollback() {
    log_step "Verifying rollback..."

    cd "$DEPLOYMENT_DIR"

    # Check container status
    log_info "Checking container status..."
    local app_status=$(sudo docker compose -f docker-compose.traefik.yml ps app --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "not found")
    local db_status=$(sudo docker compose -f docker-compose.traefik.yml ps db --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "not found")

    if [[ "$app_status" != "running" ]]; then
        log_error "Application container is not running (status: $app_status)"
        log_info "Checking logs..."
        sudo docker compose -f docker-compose.traefik.yml logs app
        log_error "Rollback may have failed!"
        exit 1
    fi

    if [[ "$db_status" != "running" ]]; then
        log_error "Database container is not running (status: $db_status)"
        log_info "Checking logs..."
        sudo docker compose -f docker-compose.traefik.yml logs db
        log_error "Rollback may have failed!"
        exit 1
    fi

    # Check application logs
    log_info "Checking application logs..."
    local app_logs=$(sudo docker compose -f docker-compose.traefik.yml logs --tail=20 app)
    
    if echo "$app_logs" | grep -qi "fatal\|critical"; then
        log_warn "Critical errors found in application logs:"
        echo "$app_logs" | grep -i "fatal\|critical"
    fi

    log_info "Rollback verification complete ✓"
}

restore_previous_state() {
    log_warn "Restoring previous state..."

    if [[ -f /tmp/rollback-previous-commit.txt ]]; then
        local previous_commit=$(cat /tmp/rollback-previous-commit.txt)
        cd "$SATORI_DIR"
        git checkout "$previous_commit"
        
        cd "$DEPLOYMENT_DIR"
        sudo docker compose -f docker-compose.traefik.yml build
        sudo docker compose -f docker-compose.traefik.yml up -d
        
        log_info "Previous state restored"
    else
        log_error "Cannot restore previous state - backup not found"
    fi
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "Rollback Complete"
    echo "=========================================="
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Rolled back to: $COMMIT_HASH"
    echo ""
    echo "Container status:"
    cd "$DEPLOYMENT_DIR"
    sudo docker compose -f docker-compose.traefik.yml ps
    echo ""
    echo "Useful commands:"
    echo "  # View logs"
    echo "  cd $DEPLOYMENT_DIR"
    echo "  sudo docker compose -f docker-compose.traefik.yml logs -f app"
    echo ""
    echo "  # Check status"
    echo "  sudo docker compose -f docker-compose.traefik.yml ps"
    echo ""
    echo "  # Restore to previous state (if needed)"
    if [[ -f /tmp/rollback-previous-commit.txt ]]; then
        local previous_commit=$(cat /tmp/rollback-previous-commit.txt)
        echo "  cd $SATORI_DIR"
        echo "  git checkout $previous_commit"
        echo "  cd $DEPLOYMENT_DIR"
        echo "  sudo docker compose -f docker-compose.traefik.yml build"
        echo "  sudo docker compose -f docker-compose.traefik.yml up -d"
    fi
    echo ""
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "Satori Rollback"
    echo "=========================================="
    echo ""

    check_arguments
    confirm_rollback
    backup_current_state
    verify_commit
    checkout_commit
    rebuild_application
    restart_services
    verify_rollback
    print_summary

    log_info "Rollback completed successfully! ✓"
}

main "$@"
