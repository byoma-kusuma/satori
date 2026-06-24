# Database Backup Guide

## Overview

Automated daily database backups are configured for both QA and Production environments. Backups are stored on the VMs and retained for 30 days.

## Backup Configuration

### Schedule
- **Frequency**: Daily
- **Time**: 2:00 AM UTC
- **Retention**: 30 days (older backups are automatically deleted)

### Backup Location
- **QA**: `/apps/backups/db/` on <QA_SSH_ALIAS> (<QA_VM_IP>)
- **Production**: `/apps/backups/db/` on <PROD_SSH_ALIAS> (<PROD_VM_IP>)

### Backup Format
- Compressed SQL dump (`.sql.gz`)
- Naming convention: `db_backup_YYYY-MM-DD_HH-MM-SS.sql.gz`
- Average size: ~5 MB (compressed)

---

## Common Operations

### List Backups

**QA:**
```bash
ssh <QA_SSH_ALIAS> 'ls -lh /apps/backups/db/'
```

**Production:**
```bash
ssh <PROD_SSH_ALIAS> 'ls -lh /apps/backups/db/'
```

### Run Manual Backup

**QA:**
```bash
ssh <QA_SSH_ALIAS> '/apps/backups/db-backup.sh'
```

**Production:**
```bash
ssh <PROD_SSH_ALIAS> '/apps/backups/db-backup.sh'
```

### Download Backup

**QA:**
```bash
scp <QA_SSH_ALIAS>:/apps/backups/db/db_backup_2026-02-09_04-46-21.sql.gz ~/Downloads/
```

**Production:**
```bash
scp <PROD_SSH_ALIAS>:/apps/backups/db/db_backup_2026-02-09_04-47-21.sql.gz ~/Downloads/
```

### View Backup Log

**QA:**
```bash
ssh <QA_SSH_ALIAS> 'tail -f /apps/backups/db/backup.log'
```

**Production:**
```bash
ssh <PROD_SSH_ALIAS> 'tail -f /apps/backups/db/backup.log'
```

### Check Cron Job

**QA:**
```bash
ssh <QA_SSH_ALIAS> 'crontab -l | grep backup'
```

**Production:**
```bash
ssh <PROD_SSH_ALIAS> 'crontab -l | grep backup'
```

---

## Restore from Backup

### Using the Restore Script

The `restore-db.sh` script can restore from any backup file:

**Restore to QA:**
```bash
cd satori/deployment/vm-deployment

# Download backup first (if needed)
scp <PROD_SSH_ALIAS>:/apps/backups/db/db_backup_2026-02-09_04-47-21.sql.gz /tmp/

# Restore
./scripts/restore-db.sh qa /tmp/db_backup_2026-02-09_04-47-21.sql.gz
```

**Restore to Production:**
```bash
cd satori/deployment/vm-deployment

# Download backup first (if needed)
scp <PROD_SSH_ALIAS>:/apps/backups/db/db_backup_2026-02-09_04-47-21.sql.gz /tmp/

# Restore
./scripts/restore-db.sh prod /tmp/db_backup_2026-02-09_04-47-21.sql.gz
```

### Manual Restore (Advanced)

If you need to restore manually:

```bash
# 1. SSH into the VM
ssh <PROD_SSH_ALIAS>

# 2. Decompress the backup
gunzip -c /apps/backups/db/db_backup_2026-02-09_04-47-21.sql.gz > /tmp/restore.sql

# 3. Stop the application
cd /apps/satori/deployment/server
sudo docker compose -f docker-compose.traefik.yml stop app

# 4. Drop and recreate database
sudo docker compose -f docker-compose.traefik.yml exec -T db psql -U postgres -d postgres -c 'DROP DATABASE IF EXISTS satori;'
sudo docker compose -f docker-compose.traefik.yml exec -T db psql -U postgres -d postgres -c 'CREATE DATABASE satori;'

# 5. Copy SQL file into container
CONTAINER_ID=$(sudo docker compose -f docker-compose.traefik.yml ps -q db)
sudo docker cp /tmp/restore.sql $CONTAINER_ID:/tmp/restore.sql

# 6. Restore the backup
sudo docker compose -f docker-compose.traefik.yml exec -T db psql -U postgres -d satori -f /tmp/restore.sql

# 7. Start the application
sudo docker compose -f docker-compose.traefik.yml start app

# 8. Clean up
sudo docker exec $CONTAINER_ID rm -f /tmp/restore.sql
rm -f /tmp/restore.sql
```

---

## Backup Monitoring

### Check Last Backup Status

```bash
# QA
ssh <QA_SSH_ALIAS> 'tail -20 /apps/backups/db/backup.log'

# Production
ssh <PROD_SSH_ALIAS> 'tail -20 /apps/backups/db/backup.log'
```

### Verify Backup Integrity

Download and test restore in a local environment:

```bash
# Download backup
scp <PROD_SSH_ALIAS>:/apps/backups/db/db_backup_2026-02-09_04-47-21.sql.gz /tmp/

# Test decompression
gunzip -t /tmp/db_backup_2026-02-09_04-47-21.sql.gz

# If successful, the file is valid
echo "Backup integrity verified ✓"
```

---

## Backup Retention Policy

- **Automatic cleanup**: Backups older than 30 days are automatically deleted
- **Storage**: Each backup is ~5 MB compressed
- **Maximum storage**: ~150 MB (30 days × 5 MB)

### Modify Retention Period

To change the retention period, edit the backup script on the VM:

```bash
ssh <PROD_SSH_ALIAS>
sudo nano /apps/backups/db-backup.sh

# Change this line:
RETENTION_DAYS=30

# To your desired value (e.g., 60 days):
RETENTION_DAYS=60
```

---

## Troubleshooting

### Backup Failed

Check the backup log for errors:
```bash
ssh <PROD_SSH_ALIAS> 'tail -50 /apps/backups/db/backup.log'
```

Common issues:
- Database container not running
- Insufficient disk space
- Permission issues

### Cron Job Not Running

Verify cron service is running:
```bash
ssh <PROD_SSH_ALIAS> 'sudo systemctl status cron'
```

Check cron logs:
```bash
ssh <PROD_SSH_ALIAS> 'sudo grep CRON /var/log/syslog | tail -20'
```

### Disk Space Issues

Check available disk space:
```bash
ssh <PROD_SSH_ALIAS> 'df -h /apps/backups'
```

Manually clean up old backups if needed:
```bash
ssh <PROD_SSH_ALIAS> 'find /apps/backups/db -name "db_backup_*.sql.gz" -type f -mtime +30 -delete'
```

---

## Setup Backups on New Environment

To set up backups on a new environment:

```bash
cd satori/deployment/vm-deployment
./scripts/setup-backups.sh <environment>
```

This will:
1. Create backup directory structure
2. Install backup script
3. Configure cron job for daily backups
4. Run a test backup
5. Verify the setup

---

## Best Practices

1. **Regular Testing**: Periodically test restore procedures to ensure backups are valid
2. **Off-site Backups**: Consider downloading critical backups to local storage or cloud storage
3. **Monitoring**: Set up alerts for backup failures (check logs daily)
4. **Documentation**: Keep this guide updated with any changes to backup procedures
5. **Access Control**: Limit access to backup files (they contain sensitive data)

---

## Backup Script Location

The backup script is located at:
- `/apps/backups/db-backup.sh` on both QA and Production VMs

To view or edit the script:
```bash
ssh <PROD_SSH_ALIAS> 'cat /apps/backups/db-backup.sh'
```

---

## Related Documentation

- [Deployment Guide](README.md)
- [Restore Database Script](scripts/restore-db.sh)
- [Setup Backups Script](scripts/setup-backups.sh)
