#!/usr/bin/env bash
#
# restore-db.sh - Restore database from backup
#
# This script restores a PostgreSQL database backup to a VM.
# It handles both .sql and .sql.gz files.
#
# Usage: ./restore-db.sh <environment> <backup-file>
# Example: ./restore-db.sh qa /path/to/backup.sql.gz

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
BACKUP_FILE="${2:-}"

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
        echo "Usage: $0 <environment> <backup-file>"
        echo "Example: $0 qa /path/to/backup.sql.gz"
        exit 1
    fi

    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Backup file not specified"
        echo "Usage: $0 <environment> <backup-file>"
        echo "Example: $0 qa /path/to/backup.sql.gz"
        exit 1
    fi

    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    # Determine SSH host based on environment
    case "$ENVIRONMENT" in
        qa)
            SSH_HOST="<QA_SSH_ALIAS>"
            ;;
        prod)
            SSH_HOST="<PROD_SSH_ALIAS>"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT (must be 'qa' or 'prod')"
            exit 1
            ;;
    esac

    log_info "Restoring database for environment: $ENVIRONMENT"
    log_info "Backup file: $BACKUP_FILE"
}

verify_prerequisites() {
    log_info "Verifying prerequisites..."

    # Test SSH connection
    if ! ssh -o ConnectTimeout=5 "$SSH_HOST" "echo 'SSH connection successful'" &>/dev/null; then
        log_error "Cannot connect to $SSH_HOST"
        log_error "Ensure SSH is configured correctly"
        exit 1
    fi

    # Check if database container is running
    if ! ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml ps db --format json" | grep -q '"State":"running"'; then
        log_error "Database container is not running on $SSH_HOST"
        log_error "Deploy the application first"
        exit 1
    fi

    log_info "Prerequisites verified ✓"
}

confirm_restore() {
    echo ""
    log_warn "⚠️  WARNING: This will DROP and recreate the database!"
    log_warn "All existing data in the $ENVIRONMENT database will be lost."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Database restore cancelled"
        exit 0
    fi
}

upload_backup() {
    log_info "Uploading backup file to VM..."

    local backup_filename=$(basename "$BACKUP_FILE")
    
    # Get home directory on remote
    local remote_home=$(ssh "$SSH_HOST" "echo \$HOME")
    local remote_backup="$remote_home/$backup_filename"

    # Upload backup file
    scp "$BACKUP_FILE" "$SSH_HOST:$remote_backup"
    
    # Fix permissions
    ssh "$SSH_HOST" "chmod 644 $remote_backup"

    log_info "Backup uploaded to: $remote_backup ✓"
    echo "$remote_backup"
}

restore_database() {
    local remote_backup="$1"
    local backup_filename=$(basename "$remote_backup")

    log_info "Restoring database from backup..."

    # Get database credentials from environment
    local db_user=$(ssh "$SSH_HOST" "cd /apps/satori/deployment/server && grep '^DB_USER=' .env | cut -d'=' -f2")
    local db_name=$(ssh "$SSH_HOST" "cd /apps/satori/deployment/server && grep '^DB_NAME=' .env | cut -d'=' -f2")

    log_info "Database: $db_name"
    log_info "User: $db_user"

    # Determine if file is compressed
    local is_compressed=false
    if [[ "$backup_filename" == *.gz ]]; then
        is_compressed=true
        log_info "Detected compressed backup file"
    fi

    # Stop application container to prevent connections
    log_info "Stopping application container..."
    ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml stop app" 2>&1 | grep -v "level=warning"

    # Drop and recreate database
    log_info "Dropping existing database..."
    ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml exec -T db psql -U $db_user -d postgres -c 'DROP DATABASE IF EXISTS $db_name;'" 2>&1 | grep -v "level=warning"

    log_info "Creating fresh database..."
    ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml exec -T db psql -U $db_user -d postgres -c 'CREATE DATABASE $db_name;'" 2>&1 | grep -v "level=warning"

    # Decompress if needed
    local sql_file="$remote_backup"
    if [[ "$is_compressed" == true ]]; then
        log_info "Decompressing backup file..."
        sql_file="${remote_backup%.gz}"
        ssh "$SSH_HOST" "gunzip -f '$remote_backup'" 2>&1
    fi

    # Copy SQL file into container
    log_info "Copying backup into database container..."
    local container_name=$(ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml ps -q db" 2>&1 | grep -v "level=warning")
    ssh "$SSH_HOST" "sudo docker cp '$sql_file' $container_name:/tmp/restore.sql" 2>&1

    # Restore backup
    log_info "Restoring backup data (this may take a few minutes)..."
    ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml exec -T db psql -U $db_user -d $db_name -f /tmp/restore.sql" 2>&1 | tail -20

    # Clean up SQL file from container
    ssh "$SSH_HOST" "sudo docker exec $container_name rm -f /tmp/restore.sql" 2>&1

    # Start application container
    log_info "Starting application container..."
    ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml start app" 2>&1 | grep -v "level=warning"

    # Wait for app to start
    sleep 5

    log_info "Database restore complete ✓"
}

cleanup() {
    local remote_backup="$1"
    
    log_info "Cleaning up temporary files..."
    ssh "$SSH_HOST" "sudo rm -f $remote_backup"
    log_info "Cleanup complete ✓"
}

verify_restore() {
    log_info "Verifying database restore..."

    # Get database name
    local db_name=$(ssh "$SSH_HOST" "cd /apps/satori/deployment/server && grep '^DB_NAME=' .env | cut -d'=' -f2")
    local db_user=$(ssh "$SSH_HOST" "cd /apps/satori/deployment/server && grep '^DB_USER=' .env | cut -d'=' -f2")

    # Count tables
    local table_count=$(ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml exec -T db psql -U $db_user -d $db_name -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\"" | tr -d ' ')

    log_info "Tables in database: $table_count"

    if [[ "$table_count" -gt 0 ]]; then
        log_info "Database verification successful ✓"
    else
        log_warn "No tables found in database - restore may have failed"
    fi
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "Database Restore Complete"
    echo "=========================================="
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Backup file: $(basename "$BACKUP_FILE")"
    echo ""
    echo "The database has been restored successfully."
    echo ""
    echo "Useful commands:"
    echo "  # Check application logs"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml logs -f app'"
    echo ""
    echo "  # Access database"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml exec db psql -U postgres -d satori'"
    echo ""
    echo "  # Check container status"
    echo "  ssh $SSH_HOST 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml ps'"
    echo ""
}

# Main execution
main() {
    log_info "Starting database restore"
    echo ""

    check_arguments
    verify_prerequisites
    confirm_restore
    
    local remote_backup=$(upload_backup)
    restore_database "$remote_backup"
    verify_restore
    cleanup "$remote_backup"
    
    print_summary

    log_info "Database restore completed successfully! ✓"
}

main "$@"
