#!/usr/bin/env bash
#
# setup-app.sh - Deploy Satori application
#
# This script deploys the Satori API/backend application by:
# - Configuring application environment
# - Building Docker images
# - Running database migrations
# - Starting application containers
#
# Usage: ./setup-app.sh <environment> <config-file>
# Example: ./setup-app.sh qa ../config/app.env.qa

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
CONFIG_FILE="${2:-}"
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

check_arguments() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment not specified"
        echo "Usage: $0 <environment> <config-file>"
        echo "Example: $0 qa ../config/app.env.qa"
        exit 1
    fi

    if [[ -z "$CONFIG_FILE" ]]; then
        log_error "Config file not specified"
        echo "Usage: $0 <environment> <config-file>"
        echo "Example: $0 qa ../config/app.env.qa"
        exit 1
    fi

    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "Config file not found: $CONFIG_FILE"
        exit 1
    fi

    log_info "Setting up Satori application for environment: $ENVIRONMENT"
}

verify_prerequisites() {
    log_info "Verifying prerequisites..."

    if [[ ! -d "$SATORI_DIR" ]]; then
        log_error "Satori directory not found: $SATORI_DIR"
        log_error "Run setup-vm.sh first"
        exit 1
    fi

    if [[ ! -d "$DEPLOYMENT_DIR" ]]; then
        log_error "Deployment directory not found: $DEPLOYMENT_DIR"
        exit 1
    fi

    if [[ ! -f "$DEPLOYMENT_DIR/docker-compose.traefik.yml" ]]; then
        log_error "docker-compose.traefik.yml not found"
        exit 1
    fi

    # Check if Traefik is running
    if ! sudo docker ps | grep -q traefik; then
        log_error "Traefik is not running"
        log_error "Run setup-traefik.sh first"
        exit 1
    fi

    # Check if traefik-public network exists
    if ! sudo docker network ls | grep -q traefik-public; then
        log_error "traefik-public network not found"
        log_error "Traefik may not be properly configured"
        exit 1
    fi

    log_info "Prerequisites verified ✓"
}

validate_config() {
    log_info "Validating configuration file..."

    # Required variables
    local required_vars=(
        "DB_USER"
        "DB_PASS"
        "DB_NAME"
        "SERVER_URL"
        "AUTH_HOST"
        "BETTER_AUTH_URL"
        "BETTER_AUTH_SECRET"
        "FRONTEND_URL"
        "ORIGIN"
        "EMAIL_SERVICE_PROVIDER"
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

    # Validate email configuration
    if [[ "$EMAIL_SERVICE_PROVIDER" == "azure" ]]; then
        if [[ -z "${AZURE_COMMUNICATION_CONNECTION_STRING:-}" ]]; then
            log_error "AZURE_COMMUNICATION_CONNECTION_STRING required when EMAIL_SERVICE_PROVIDER=azure"
            exit 1
        fi
        if [[ -z "${AZURE_COMMUNICATION_FROM_EMAIL:-}" ]]; then
            log_error "AZURE_COMMUNICATION_FROM_EMAIL required when EMAIL_SERVICE_PROVIDER=azure"
            exit 1
        fi
    fi

    log_info "Configuration validated ✓"
}

setup_app_config() {
    log_info "Setting up application configuration..."

    # Copy environment file
    sudo cp "$CONFIG_FILE" "$DEPLOYMENT_DIR/.env"
    sudo chown "$USER:$USER" "$DEPLOYMENT_DIR/.env"
    log_info "Copied environment configuration"

    # Verify .env file
    if [[ ! -f "$DEPLOYMENT_DIR/.env" ]]; then
        log_error "Failed to create .env file"
        exit 1
    fi

    log_info "Application configuration complete ✓"
}

build_application() {
    log_info "Building application Docker image..."

    cd "$DEPLOYMENT_DIR"

    # Build with docker compose
    log_info "Running docker compose build..."
    sudo docker compose -f docker-compose.traefik.yml build --pull

    log_info "Application build complete ✓"
}

run_migrations() {
    log_info "Running database migrations..."

    cd "$DEPLOYMENT_DIR"

    # Start database first
    log_info "Starting database container..."
    sudo docker compose -f docker-compose.traefik.yml up -d db

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10

    # Run migrations
    log_info "Executing migrations..."
    sudo docker compose -f docker-compose.traefik.yml up migrate

    # Check migration status
    local migration_exit_code=$?
    if [[ $migration_exit_code -ne 0 ]]; then
        log_error "Database migrations failed"
        log_info "Checking migration logs..."
        sudo docker compose -f docker-compose.traefik.yml logs migrate
        exit 1
    fi

    log_info "Database migrations complete ✓"
}

deploy_application() {
    log_info "Deploying application containers..."

    cd "$DEPLOYMENT_DIR"

    # Start all services
    log_info "Starting application services..."
    sudo docker compose -f docker-compose.traefik.yml up -d

    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 15

    log_info "Application deployment complete ✓"
}

verify_deployment() {
    log_info "Verifying application deployment..."

    cd "$DEPLOYMENT_DIR"

    # Check container status
    log_info "Checking container status..."
    sudo docker compose -f docker-compose.traefik.yml ps

    # Check if app container is running
    local app_status=$(sudo docker compose -f docker-compose.traefik.yml ps app --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "not found")
    local db_status=$(sudo docker compose -f docker-compose.traefik.yml ps db --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "not found")

    if [[ "$app_status" != "running" ]]; then
        log_error "Application container is not running (status: $app_status)"
        log_info "Checking logs..."
        sudo docker compose -f docker-compose.traefik.yml logs app
        exit 1
    fi

    if [[ "$db_status" != "running" ]]; then
        log_error "Database container is not running (status: $db_status)"
        log_info "Checking logs..."
        sudo docker compose -f docker-compose.traefik.yml logs db
        exit 1
    fi

    # Check application logs for errors
    log_info "Checking application logs..."
    local app_logs=$(sudo docker compose -f docker-compose.traefik.yml logs --tail=20 app)
    
    if echo "$app_logs" | grep -qi "error\|fatal\|exception"; then
        log_warn "Potential errors found in application logs:"
        echo "$app_logs" | grep -i "error\|fatal\|exception"
    fi

    log_info "Application verification complete ✓"
}

test_endpoint() {
    log_info "Testing application endpoint..."

    # Source config to get SERVER_URL
    set -a
    source "$DEPLOYMENT_DIR/.env"
    set +a

    local api_url="https://${SERVER_URL}"
    
    log_info "Testing: $api_url"
    
    # Wait a bit more for the app to fully start
    sleep 5

    # Test endpoint (allow self-signed certs for initial test)
    if curl -k -s -o /dev/null -w "%{http_code}" "$api_url" | grep -q "200\|301\|302"; then
        log_info "API endpoint is responding ✓"
    else
        log_warn "API endpoint may not be responding correctly"
        log_warn "This could be normal if the app is still starting up"
        log_warn "Check logs with: docker compose logs -f app"
    fi
}

cleanup() {
    log_info "Cleaning up unused Docker resources..."
    
    cd "$DEPLOYMENT_DIR"
    sudo docker image prune -f
    
    log_info "Cleanup complete ✓"
}

print_summary() {
    # Source config to get URLs
    set -a
    source "$DEPLOYMENT_DIR/.env"
    set +a

    echo ""
    echo "=========================================="
    echo "Application Deployment Complete"
    echo "=========================================="
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo ""
    echo "Services deployed:"
    echo "  - Satori API (app)"
    echo "  - PostgreSQL (db)"
    echo ""
    echo "API Endpoint:"
    echo "  https://${SERVER_URL}"
    echo ""
    echo "Useful commands:"
    echo "  # View logs"
    echo "  cd $DEPLOYMENT_DIR"
    echo "  sudo docker compose -f docker-compose.traefik.yml logs -f app"
    echo ""
    echo "  # Check status"
    echo "  sudo docker compose -f docker-compose.traefik.yml ps"
    echo ""
    echo "  # Restart application"
    echo "  sudo docker compose -f docker-compose.traefik.yml restart app"
    echo ""
    echo "  # Access database"
    echo "  sudo docker compose -f docker-compose.traefik.yml exec db psql -U ${DB_USER} -d ${DB_NAME}"
    echo ""
    echo "Next steps:"
    echo "  1. Test the API endpoint"
    echo "  2. Verify authentication flows"
    echo "  3. Test email functionality"
    echo "  4. Monitor logs for any issues"
    echo ""
}

# Main execution
main() {
    log_info "Starting Satori application deployment"
    echo ""

    check_arguments
    verify_prerequisites
    validate_config
    setup_app_config
    build_application
    run_migrations
    deploy_application
    verify_deployment
    test_endpoint
    cleanup
    print_summary

    log_info "Application deployment completed successfully! ✓"
}

main "$@"
