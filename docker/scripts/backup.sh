#!/bin/bash

# ===================================================================
# Script de backup automático de base de datos MySQL
# StrateKaz
# ===================================================================
#
# Características:
# - Backup completo con mysqldump
# - Compresión automática con gzip
# - Rotación de backups (últimos 7 días)
# - Logging detallado de operaciones
# - Manejo robusto de errores
# - Soporte para desarrollo y producción
#
# Uso:
#   ./backup.sh [dev|prod]
#
# ===================================================================

set -euo pipefail  # Modo estricto: exit on error, undefined vars, pipe failures

# ===================================================================
# CONFIGURACIÓN
# ===================================================================

# Colores para output
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Configuración de directorios
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
readonly BACKUP_DIR="$PROJECT_ROOT/docker/backups"
readonly LOG_DIR="$BACKUP_DIR/logs"

# Configuración de retención
readonly RETENTION_DAYS=7

# Timestamp para nombres de archivo
readonly TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
readonly DATE_HUMAN=$(date +"%Y-%m-%d %H:%M:%S")

# Archivos de backup y log
readonly BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
readonly COMPRESSED_FILE="${BACKUP_FILE}.gz"
readonly LOG_FILE="$LOG_DIR/backup_${TIMESTAMP}.log"

# ===================================================================
# FUNCIONES DE LOGGING
# ===================================================================

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Función para logging dual (consola y archivo)
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    # Escribir a archivo de log
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

    # Escribir a consola con color
    case "$level" in
        INFO)
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        *)
            echo "[INFO] $message"
            ;;
    esac
}

log_info() {
    log "INFO" "$@"
}

log_success() {
    log "SUCCESS" "$@"
}

log_warning() {
    log "WARNING" "$@"
}

log_error() {
    log "ERROR" "$@"
}

# ===================================================================
# FUNCIONES DE UTILIDAD
# ===================================================================

# Banner del script
show_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   GRASAS Y HUESOS DEL NORTE - MySQL Backup Automático   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Función para verificar que el contenedor está corriendo
check_container() {
    local container_name="$1"

    log_info "Verificando estado del contenedor: $container_name"

    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_error "El contenedor $container_name no está corriendo"
        log_error "Inicie los servicios con: docker-compose up -d"
        return 1
    fi

    log_success "Contenedor $container_name está activo"
    return 0
}

# Función para verificar salud del contenedor
check_container_health() {
    local container_name="$1"

    log_info "Verificando salud del contenedor MySQL"

    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

    if [ "$health_status" = "healthy" ]; then
        log_success "Contenedor está saludable"
        return 0
    elif [ "$health_status" = "none" ]; then
        log_warning "Contenedor no tiene health check configurado"
        return 0
    else
        log_warning "Estado de salud del contenedor: $health_status"
        return 0
    fi
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    log_info "Iniciando limpieza de backups antiguos (retención: $RETENTION_DAYS días)"

    local deleted_count=0
    local total_freed=0

    # Buscar y eliminar backups antiguos
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
            total_freed=$((total_freed + file_size))
            rm -f "$file"
            deleted_count=$((deleted_count + 1))
            log_info "Eliminado: $(basename "$file")"
        fi
    done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null)

    if [ $deleted_count -gt 0 ]; then
        local freed_mb=$((total_freed / 1024 / 1024))
        log_success "Limpieza completada: $deleted_count archivo(s) eliminado(s), $freed_mb MB liberados"
    else
        log_info "No hay backups antiguos para eliminar"
    fi

    # Limpiar logs antiguos también
    find "$LOG_DIR" -name "backup_*.log" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
}

# Función para listar backups disponibles
list_recent_backups() {
    log_info "Backups recientes disponibles:"

    local backup_count=0
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            local file_size=$(du -h "$file" | cut -f1)
            local file_date=$(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | cut -d'.' -f1)
            echo "   - $(basename "$file") ($file_size) - $file_date"
            backup_count=$((backup_count + 1))
        fi
    done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | sort -r | head -10)

    if [ $backup_count -eq 0 ]; then
        echo "   (No hay backups disponibles)"
    fi
}

# ===================================================================
# FUNCIÓN PRINCIPAL DE BACKUP
# ===================================================================

perform_backup() {
    local container_name="$1"
    local db_name="$2"
    local db_password="$3"

    log_info "═══════════════════════════════════════════════════════"
    log_info "Iniciando proceso de backup"
    log_info "═══════════════════════════════════════════════════════"
    log_info "Contenedor: $container_name"
    log_info "Base de datos: $db_name"
    log_info "Archivo destino: $(basename "$COMPRESSED_FILE")"
    log_info "Log file: $(basename "$LOG_FILE")"
    log_info "Fecha: $DATE_HUMAN"
    log_info "═══════════════════════════════════════════════════════"

    # Verificar que el directorio de backups existe
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creando directorio de backups: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi

    # Verificar contenedor
    if ! check_container "$container_name"; then
        return 1
    fi

    # Verificar salud del contenedor
    check_container_health "$container_name"

    # Realizar backup con mysqldump
    log_info "Ejecutando mysqldump..."

    if docker exec "$container_name" mysqldump \
        --user=root \
        --password="$db_password" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --routines \
        --triggers \
        --events \
        --hex-blob \
        --skip-comments \
        --default-character-set=utf8mb4 \
        "$db_name" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then

        log_success "mysqldump ejecutado exitosamente"

        # Verificar que el archivo no está vacío
        if [ ! -s "$BACKUP_FILE" ]; then
            log_error "El archivo de backup está vacío"
            rm -f "$BACKUP_FILE"
            return 1
        fi

        local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
        log_info "Tamaño del dump SQL: $backup_size"
    else
        log_error "Error al ejecutar mysqldump"
        rm -f "$BACKUP_FILE"
        return 1
    fi

    # Comprimir backup
    log_info "Comprimiendo backup con gzip..."

    if gzip -9 "$BACKUP_FILE" 2>> "$LOG_FILE"; then
        log_success "Backup comprimido exitosamente"

        local compressed_size=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log_info "Tamaño comprimido: $compressed_size"

        # Calcular ratio de compresión
        local original_size_bytes=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
        local compressed_size_bytes=$(stat -f%z "$COMPRESSED_FILE" 2>/dev/null || stat -c%s "$COMPRESSED_FILE" 2>/dev/null || echo "0")

        if [ "$original_size_bytes" -gt 0 ] && [ "$compressed_size_bytes" -gt 0 ]; then
            local ratio=$((100 - (compressed_size_bytes * 100 / original_size_bytes)))
            log_info "Ratio de compresión: ${ratio}%"
        fi
    else
        log_error "Error al comprimir el backup"
        rm -f "$BACKUP_FILE"
        return 1
    fi

    # Verificar integridad del archivo comprimido
    log_info "Verificando integridad del archivo comprimido..."

    if gzip -t "$COMPRESSED_FILE" 2>> "$LOG_FILE"; then
        log_success "Integridad verificada correctamente"
    else
        log_error "El archivo comprimido está corrupto"
        rm -f "$COMPRESSED_FILE"
        return 1
    fi

    # Establecer permisos seguros
    chmod 600 "$COMPRESSED_FILE"
    log_info "Permisos de seguridad aplicados (600)"

    return 0
}

# ===================================================================
# SCRIPT PRINCIPAL
# ===================================================================

main() {
    # Mostrar banner
    show_banner

    # Cambiar al directorio del proyecto
    cd "$PROJECT_ROOT"

    # Determinar modo de ejecución
    local mode="${1:-dev}"
    local container_name="grasas_huesos_db"
    local env_file=".env"

    if [ "$mode" = "prod" ] || [ "$mode" = "production" ]; then
        env_file=".env.production"
        log_warning "MODO PRODUCCIÓN ACTIVADO"
    else
        log_info "Modo de desarrollo activado"
    fi

    # Cargar variables de entorno
    if [ -f "$env_file" ]; then
        log_info "Cargando variables de entorno desde: $env_file"
        set -a
        source "$env_file"
        set +a
    else
        log_warning "Archivo de entorno no encontrado: $env_file"
        log_warning "Usando valores por defecto"
    fi

    # Obtener credenciales de la base de datos
    local db_name="${MYSQL_DATABASE:-grasas_huesos_db}"
    local db_password="${MYSQL_ROOT_PASSWORD:-root_password_2024}"

    # Ejecutar backup
    if perform_backup "$container_name" "$db_name" "$db_password"; then
        log_success "═══════════════════════════════════════════════════════"
        log_success "BACKUP COMPLETADO EXITOSAMENTE"
        log_success "═══════════════════════════════════════════════════════"
        log_success "Archivo: $COMPRESSED_FILE"
        log_success "Log: $LOG_FILE"
        echo ""

        # Limpiar backups antiguos
        cleanup_old_backups

        echo ""
        # Listar backups recientes
        list_recent_backups

        echo ""
        log_info "Para restaurar este backup, ejecute:"
        echo "   ./docker/scripts/restore.sh $COMPRESSED_FILE"
        echo ""

        exit 0
    else
        log_error "═══════════════════════════════════════════════════════"
        log_error "ERROR EN EL PROCESO DE BACKUP"
        log_error "═══════════════════════════════════════════════════════"
        log_error "Revise el log para más detalles: $LOG_FILE"
        echo ""

        exit 1
    fi
}

# Ejecutar función principal
main "$@"
