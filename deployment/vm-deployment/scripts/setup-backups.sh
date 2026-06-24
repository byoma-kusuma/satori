#!/usr/bin/env bash
#
# setup-backups.sh - Setup automated database backups
#
# This script sets up automated daily database backups by:
# 1. Creating backup directory structure
# 2. Installing backup script
# 3. Setting up cron job for daily backups
# 4. Configuring backup retention policy
#
# Usage: ./setup-backups.sh <environment>
# Example: ./setup-backups.sh qa

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
BACKUP_DIR="/apps/backups"
BACKUP_RETENTION_DAYS=30

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
        echo "Usage: $0 <environment>"
        echo "Example: $0 qa"
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

    log_info "Setting up backups for environment: $ENVIRONMENT"
}

verify_prerequisites() {
    log_info "Verifying prerequisites..."

    # Test SSH connection
    if ! ssh -o ConnectTimeout=5 "$SSH_HOST" "echo 'SSH connection successful'" &>/dev/null; then
        log_error "Cannot connect to $SSH_HOST"
        exit 1
    fi

    # Check if database container is running
    if ! ssh "$SSH_HOST" "cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml ps db --format json" | grep -q '"State":"running"'; then
        log_error "Database container is not running on $SSH_HOST"
        exit 1
    fi

    log_info "Prerequisites verified ✓"
}

create_backup_directory() {
    log_info "Creating backup directory structure..."

    ssh "$SSH_HOST" "sudo mkdir -p $BACKUP_DIR/db && sudo chown -R <VM_USER>:<VM_USER> $BACKUP_DIR"

    log_info "Backup directory created: $BACKUP_DIR ✓"
}

create_backup_script() {
    log_info "Creating backup script..."

    # Create backup script
    cat > /tmp/db-backup.sh << 'EOF'
#!/usr/bin/env bash
#
# db-backup.sh - Database backup script
#
# This script creates a compressed backup of the PostgreSQL database
# and manages backup retention.

set -euo pipefail

# Configuration
BACKUP_DIR="/apps/backups/db"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
LOG_FILE="$BACKUP_DIR/backup.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start backup
log "Starting database backup..."

# Get database credentials from environment
cd /apps/satori/deployment/server
DB_USER=$(grep '^DB_USER=' .env | cut -d'=' -f2)
DB_NAME=$(grep '^DB_NAME=' .env | cut -d'=' -f2)

# Create backup using pg_dump
log "Creating backup: $BACKUP_FILE"
sudo docker compose -f docker-compose.traefik.yml exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [[ -f "$BACKUP_FILE" ]]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f | wc -l)
log "Cleanup complete. Remaining backups: $REMAINING_BACKUPS"

log "Backup process completed successfully"
EOF

    # Upload backup script to VM
    scp /tmp/db-backup.sh "$SSH_HOST:/tmp/db-backup.sh"
    ssh "$SSH_HOST" "sudo mv /tmp/db-backup.sh $BACKUP_DIR/db-backup.sh && sudo chmod +x $BACKUP_DIR/db-backup.sh"
    rm /tmp/db-backup.sh

    log_info "Backup script installed ✓"
}

setup_cron_job() {
    log_info "Setting up daily cron job..."

    # Create cron job that runs at 2 AM daily
    ssh "$SSH_HOST" << 'ENDSSH'
# Add cron job if it doesn't exist
CRON_JOB="0 2 * * * /apps/backups/db-backup.sh >> /apps/backups/db/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "db-backup.sh"; echo "$CRON_JOB") | crontab -
ENDSSH

    log_info "Cron job configured (runs daily at 2 AM) ✓"
}

test_backup() {
    log_info "Running test backup..."

    ssh "$SSH_HOST" "$BACKUP_DIR/db-backup.sh"

    log_info "Test backup completed ✓"
}

verify_setup() {
    log_info "Verifying backup setup..."

    # Check if backup directory exists
    if ! ssh "$SSH_HOST" "test -d $BACKUP_DIR"; then
        log_error "Backup directory not found"
        exit 1
    fi

    # Check if backup script exists and is executable
    if ! ssh "$SSH_HOST" "test -x $BACKUP_DIR/db-backup.sh"; then
        log_error "Backup script not found or not executable"
        exit 1
    fi

    # Check if cron job exists
    if ! ssh "$SSH_HOST" "crontab -l | grep -q db-backup.sh"; then
        log_error "Cron job not found"
        exit 1
    fi

    # Check if test backup was created
    if ! ssh "$SSH_HOST" "ls $BACKUP_DIR/db/db_backup_*.sql.gz" &>/dev/null; then
        log_error "Test backup not found"
        exit 1
    fi

    log_info "Backup setup verification complete ✓"
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "Backup Setup Complete for $ENVIRONMENT"
    echo "=========================================="
    echo ""
    echo "Backup configuration:"
    echo "  - Backup directory: $BACKUP_DIR"
    echo "  - Backup schedule: Daily at 2:00 AM"
    echo "  - Retention period: $BACKUP_RETENTION_DAYS days"
    echo ""
    echo "Useful commands:"
    echo "  # Run manual backup"
    echo "  ssh $SSH_HOST '$BACKUP_DIR/db-backup.sh'"
    echo ""
    echo "  # List backups"
    echo "  ssh $SSH_HOST 'ls -lh $BACKUP_DIR/db/'"
    echo ""
    echo "  # View backup log"
    echo "  ssh $SSH_HOST 'tail -f $BACKUP_DIR/db/backup.log'"
    echo ""
    echo "  # Check cron job"
    echo "  ssh $SSH_HOST 'crontab -l | grep backup'"
    echo ""
    echo "  # Download backup"
    echo "  scp $SSH_HOST:$BACKUP_DIR/db/db_backup_YYYY-MM-DD_HH-MM-SS.sql.gz ."
    echo ""
}

# Main execution
main() {
    log_info "Starting backup setup"
    echo ""

    check_arguments
    verify_prerequisites
    create_backup_directory
    create_backup_script
    setup_cron_job
    test_backup
    verify_setup
    print_summary

    log_info "Backup setup completed successfully! ✓"
}

main "$@"
