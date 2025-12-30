#!/bin/bash
# ═══════════════════════════════════════════════════
# BACKUP SERVICE ENTRYPOINT
# Grasas y Huesos del Norte S.A.S
# ═══════════════════════════════════════════════════

set -e

# Default schedule: Every day at 2:00 AM
BACKUP_SCHEDULE=${BACKUP_SCHEDULE:-"0 2 * * *"}

echo "═══════════════════════════════════════════════════"
echo "Backup Service Started"
echo "═══════════════════════════════════════════════════"
echo "Schedule: ${BACKUP_SCHEDULE}"
echo "Retention: ${BACKUP_RETENTION_DAYS:-7} days"
echo "MySQL Host: ${MYSQL_HOST:-db}"
echo "MySQL Database: ${MYSQL_DATABASE}"
echo "═══════════════════════════════════════════════════"

# Create crontab
echo "${BACKUP_SCHEDULE} /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

# Run initial backup
echo "Running initial backup..."
/usr/local/bin/backup.sh

# Start cron in foreground
echo "Starting cron daemon..."
crond -f -l 2
