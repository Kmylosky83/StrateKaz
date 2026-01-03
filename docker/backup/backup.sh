#!/bin/bash
# ═══════════════════════════════════════════════════
# AUTOMATED BACKUP SCRIPT
# StrateKaz
# ═══════════════════════════════════════════════════

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_DIR=$(date +%Y-%m-%d)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# MySQL Configuration
MYSQL_HOST=${MYSQL_HOST:-db}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directories
mkdir -p "${BACKUP_DIR}/mysql/${DATE_DIR}"
mkdir -p "${BACKUP_DIR}/media/${DATE_DIR}"

# ═══════════════════════════════════════════════════
# MYSQL DATABASE BACKUP
# ═══════════════════════════════════════════════════
backup_mysql() {
    log "Starting MySQL database backup..."

    MYSQL_BACKUP_FILE="${BACKUP_DIR}/mysql/${DATE_DIR}/db_backup_${TIMESTAMP}.sql.gz"

    if mysqldump -h "${MYSQL_HOST}" \
                 -u "${MYSQL_USER}" \
                 -p"${MYSQL_PASSWORD}" \
                 --single-transaction \
                 --routines \
                 --triggers \
                 --events \
                 --quick \
                 --lock-tables=false \
                 "${MYSQL_DATABASE}" | gzip > "${MYSQL_BACKUP_FILE}"; then

        BACKUP_SIZE=$(du -h "${MYSQL_BACKUP_FILE}" | cut -f1)
        log "MySQL backup completed successfully: ${MYSQL_BACKUP_FILE} (${BACKUP_SIZE})"

        # Create latest symlink
        ln -sf "${MYSQL_BACKUP_FILE}" "${BACKUP_DIR}/mysql/latest.sql.gz"

        return 0
    else
        error "MySQL backup failed"
        return 1
    fi
}

# ═══════════════════════════════════════════════════
# MEDIA FILES BACKUP
# ═══════════════════════════════════════════════════
backup_media() {
    log "Starting media files backup..."

    if [ -d "/media" ]; then
        MEDIA_BACKUP_FILE="${BACKUP_DIR}/media/${DATE_DIR}/media_backup_${TIMESTAMP}.tar.gz"

        # Count files
        FILE_COUNT=$(find /media -type f | wc -l)

        if [ "$FILE_COUNT" -gt 0 ]; then
            if tar -czf "${MEDIA_BACKUP_FILE}" -C /media .; then
                BACKUP_SIZE=$(du -h "${MEDIA_BACKUP_FILE}" | cut -f1)
                log "Media backup completed successfully: ${MEDIA_BACKUP_FILE} (${BACKUP_SIZE}, ${FILE_COUNT} files)"

                # Create latest symlink
                ln -sf "${MEDIA_BACKUP_FILE}" "${BACKUP_DIR}/media/latest.tar.gz"

                return 0
            else
                error "Media backup failed"
                return 1
            fi
        else
            warning "No media files to backup"
            return 0
        fi
    else
        warning "Media directory not found, skipping media backup"
        return 0
    fi
}

# ═══════════════════════════════════════════════════
# CLEANUP OLD BACKUPS
# ═══════════════════════════════════════════════════
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."

    # Cleanup MySQL backups
    if [ -d "${BACKUP_DIR}/mysql" ]; then
        find "${BACKUP_DIR}/mysql" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
        find "${BACKUP_DIR}/mysql" -type d -empty -delete
        MYSQL_REMOVED=$(find "${BACKUP_DIR}/mysql" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l)
        log "Removed ${MYSQL_REMOVED} old MySQL backup(s)"
    fi

    # Cleanup media backups
    if [ -d "${BACKUP_DIR}/media" ]; then
        find "${BACKUP_DIR}/media" -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete
        find "${BACKUP_DIR}/media" -type d -empty -delete
        MEDIA_REMOVED=$(find "${BACKUP_DIR}/media" -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l)
        log "Removed ${MEDIA_REMOVED} old media backup(s)"
    fi
}

# ═══════════════════════════════════════════════════
# BACKUP VERIFICATION
# ═══════════════════════════════════════════════════
verify_backup() {
    local file=$1

    if [ -f "$file" ]; then
        # Check if file is not empty
        if [ -s "$file" ]; then
            # Verify gzip integrity
            if gzip -t "$file" 2>/dev/null; then
                log "Backup verification passed: $file"
                return 0
            else
                error "Backup verification failed (corrupted): $file"
                return 1
            fi
        else
            error "Backup verification failed (empty file): $file"
            return 1
        fi
    else
        error "Backup file not found: $file"
        return 1
    fi
}

# ═══════════════════════════════════════════════════
# BACKUP REPORT
# ═══════════════════════════════════════════════════
generate_report() {
    log "═══════════════════════════════════════════════════"
    log "BACKUP REPORT - $(date +'%Y-%m-%d %H:%M:%S')"
    log "═══════════════════════════════════════════════════"

    # MySQL backups
    if [ -d "${BACKUP_DIR}/mysql" ]; then
        MYSQL_COUNT=$(find "${BACKUP_DIR}/mysql" -name "*.sql.gz" -type f | wc -l)
        MYSQL_SIZE=$(du -sh "${BACKUP_DIR}/mysql" 2>/dev/null | cut -f1)
        log "MySQL Backups: ${MYSQL_COUNT} files (${MYSQL_SIZE})"
    fi

    # Media backups
    if [ -d "${BACKUP_DIR}/media" ]; then
        MEDIA_COUNT=$(find "${BACKUP_DIR}/media" -name "*.tar.gz" -type f | wc -l)
        MEDIA_SIZE=$(du -sh "${BACKUP_DIR}/media" 2>/dev/null | cut -f1)
        log "Media Backups: ${MEDIA_COUNT} files (${MEDIA_SIZE})"
    fi

    # Total disk usage
    TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    log "Total Backup Size: ${TOTAL_SIZE}"
    log "Retention Policy: ${RETENTION_DAYS} days"
    log "═══════════════════════════════════════════════════"
}

# ═══════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════
main() {
    log "Starting backup process..."

    # Check required variables
    if [ -z "$MYSQL_DATABASE" ] || [ -z "$MYSQL_USER" ] || [ -z "$MYSQL_PASSWORD" ]; then
        error "Required environment variables not set"
        exit 1
    fi

    # Perform backups
    MYSQL_SUCCESS=0
    MEDIA_SUCCESS=0

    if backup_mysql; then
        MYSQL_SUCCESS=1
    fi

    if backup_media; then
        MEDIA_SUCCESS=1
    fi

    # Cleanup old backups
    cleanup_old_backups

    # Generate report
    generate_report

    # Exit status
    if [ $MYSQL_SUCCESS -eq 1 ]; then
        log "Backup process completed successfully"
        exit 0
    else
        error "Backup process completed with errors"
        exit 1
    fi
}

# Run main function
main
