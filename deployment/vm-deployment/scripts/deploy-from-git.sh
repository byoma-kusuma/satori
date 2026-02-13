#!/usr/bin/env bash
#
# deploy-from-git.sh - Deploy application from Git repository
#
# This script deploys the application by:
# 1. Switching to the specified Git branch
# 2. Pulling the latest changes
# 3. Rebuilding and redeploying the application
#
# Usage: ./deploy-from-git.sh <environment> <branch>
# Example: ./deploy-from-git.sh qa qa

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
BRANCH="${2:-}"
SATORI_DIR="/apps/satori"
DEPLOYMENT_DIR="$SATORI_DIR/deployment/server"

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

check_arguments() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment not specified"
        echo "Usage: $0 <environment> <branch>"
        echo "Example: $0 qa qa"
        exit 1
    fi

    if [[ -z "$BRANCH" ]]; then
        log_error "Branch not specified"
        echo "Usage: $0 <environment> <branch>"
        echo "Example: $0 qa qa"
        exit 1
    fi

    # Determine SSH host based on environment
    case "$ENVIRONMENT" in
        qa)
            SSH_HOST="${QA_SSH_ALIAS:-<QA_SSH_ALIAS>}"
            ;;
        prod)
            SSH_HOST="${PROD_SSH_ALIAS:-<PROD_SSH_ALIAS>}"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT (must be 'qa' or 'prod')"
            exit 1
            ;;
    esac

    log_info "Deploying to $ENVIRONMENT from branch: $BRANCH"
    log_info "SSH Host: $SSH_HOST"
}

verify_prerequisites() {
    log_step "Verifying prerequisites..."

    # Test SSH connection
    if ! ssh -o ConnectTimeout=5 "$SSH_HOST" "echo 'SSH connection successful'" &>/dev/null; then
        log_error "Cannot connect to $SSH_HOST"
        exit 1
    fi

    # Check if repository exists
    if ! ssh "$SSH_HOST" "test -d $SATORI_DIR"; then
        log_error "Repository not found at $SATORI_DIR"
        log_error "Run initial deployment first"
        exit 1
    fi

    log_info "Prerequisites verified ✓"
}

initialize_git_repo() {
    log_step "Initializing Git repository..."

    # Check if it's already a git repo
    if ssh "$SSH_HOST" "cd $SATORI_DIR && git rev-parse --git-dir" &>/dev/null; then
        log_info "Git repository already initialized"
    else
        log_info "Initializing Git repository..."
        ssh "$SSH_HOST" << 'ENDSSH'
cd /apps/satori
git init
git remote add origin https://github.com/byomakusuma/satori.git || git remote set-url origin https://github.com/byomakusuma/satori.git
ENDSSH
        log_info "Git repository initialized ✓"
    fi
}

switch_branch() {
    log_step "Switching to branch: $BRANCH"

    ssh "$SSH_HOST" << ENDSSH
cd $SATORI_DIR

# Fetch all branches
echo "Fetching branches..."
git fetch origin

# Check if branch exists locally
if git show-ref --verify --quiet refs/heads/$BRANCH; then
    echo "Branch $BRANCH exists locally, switching..."
    git checkout $BRANCH
else
    echo "Branch $BRANCH doesn't exist locally, checking out from remote..."
    git checkout -b $BRANCH origin/$BRANCH || git checkout -t origin/$BRANCH
fi

echo "Current branch: \$(git branch --show-current)"
ENDSSH

    log_info "Switched to branch: $BRANCH ✓"
}

pull_latest_changes() {
    log_step "Pulling latest changes..."

    ssh "$SSH_HOST" << ENDSSH
cd $SATORI_DIR

# Stash any local changes
if [[ -n \$(git status --porcelain) ]]; then
    echo "Stashing local changes..."
    git stash
fi

# Pull latest changes
echo "Pulling from origin/$BRANCH..."
git pull origin $BRANCH

# Show current commit
echo ""
echo "Current commit:"
git log -1 --oneline
ENDSSH

    log_info "Latest changes pulled ✓"
}

rebuild_application() {
    log_step "Rebuilding application..."

    ssh "$SSH_HOST" << ENDSSH
cd $DEPLOYMENT_DIR

echo "Stopping application..."
sudo docker compose -f docker-compose.traefik.yml stop app

echo "Rebuilding Docker images..."
sudo docker compose -f docker-compose.traefik.yml build --pull

echo "Build complete!"
ENDSSH

    log_info "Application rebuilt ✓"
}

run_migrations() {
    log_step "Running database migrations..."

    ssh "$SSH_HOST" << ENDSSH
cd $DEPLOYMENT_DIR

echo "Running migrations..."
sudo docker compose -f docker-compose.traefik.yml up migrate

echo "Migrations complete!"
ENDSSH

    log_info "Database migrations complete ✓"
}

restart_application() {
    log_step "Restarting application..."

    ssh "$SSH_HOST" << ENDSSH
cd $DEPLOYMENT_DIR

echo "Starting application..."
sudo docker compose -f docker-compose.traefik.yml up -d app

echo "Waiting for application to start..."
sleep 10

echo "Checking application status..."
sudo docker compose -f docker-compose.traefik.yml ps app
ENDSSH

    log_info "Application restarted ✓"
}

verify_deployment() {
    log_step "Verifying deployment..."

    # Get API URL based on environment
    case "$ENVIRONMENT" in
        qa)
            API_URL="https://api.qa.portal.byomakusuma.com"
            ;;
        prod)
            API_URL="https://api.portal.byomakusuma.com"
            ;;
    esac

    log_info "Testing API endpoint: $API_URL"
    
    sleep 5
    
    if curl -k -s -o /dev/null -w "%{http_code}" "$API_URL" | grep -q "200\|301\|302\|404"; then
        log_info "API endpoint is responding ✓"
    else
        log_warn "API endpoint may not be responding correctly"
        log_warn "Check logs: ssh $SSH_HOST 'cd $DEPLOYMENT_DIR && sudo docker compose -f docker-compose.traefik.yml logs -f app'"
    fi

    log_info "Deployment verification complete ✓"
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "Deployment Complete"
    echo "=========================================="
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Branch: $BRANCH"
    echo ""
    
    case "$ENVIRONMENT" in
        qa)
            echo "API URL: https://api.qa.portal.byomakusuma.com"
            ;;
        prod)
            echo "API URL: https://api.portal.byomakusuma.com"
            ;;
    esac
    
    echo ""
    echo "Useful commands:"
    echo "  # View logs"
    echo "  ssh $SSH_HOST 'cd $DEPLOYMENT_DIR && sudo docker compose -f docker-compose.traefik.yml logs -f app'"
    echo ""
    echo "  # Check status"
    echo "  ssh $SSH_HOST 'cd $DEPLOYMENT_DIR && sudo docker compose -f docker-compose.traefik.yml ps'"
    echo ""
    echo "  # Check current branch and commit"
    echo "  ssh $SSH_HOST 'cd $SATORI_DIR && git branch --show-current && git log -1 --oneline'"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "Git-based Deployment"
    echo "=========================================="
    echo ""

    check_arguments
    verify_prerequisites
    initialize_git_repo
    switch_branch
    pull_latest_changes
    rebuild_application
    run_migrations
    restart_application
    verify_deployment
    print_summary

    log_info "Deployment completed successfully! ✓"
}

main "$@"
