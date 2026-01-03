#!/bin/bash

# ===================================================================
# Script de restauración de base de datos MySQL
# StrateKaz
# ===================================================================
#
# Características:
# - Restauración completa desde backup comprimido
# - Validación de integridad antes de restaurar
# - Backup de seguridad automático antes de restaurar
# - Logging detallado de operaciones
# - Manejo robusto de errores
# - Confirmación interactiva
#
# Uso:
#   ./restore.sh <archivo_backup> [dev|prod]
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

# Timestamp para logging
readonly TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
readonly DATE_HUMAN=$(date +"%Y-%m-%d %H:%M:%S")

# Archivo de log
readonly LOG_FILE="$LOG_DIR/restore_${TIMESTAMP}.log"

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
    echo -e "${RED}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   GRASAS Y HUESOS DEL NORTE - MySQL Database Restore    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Mostrar uso del script
show_usage() {
    echo "Uso: $0 <archivo_backup> [dev|prod]"
    echo ""
    echo "Argumentos:"
    echo "  archivo_backup    Ruta al archivo de backup (.sql.gz o .sql)"
    echo "  modo             'dev' para desarrollo, 'prod' para producción (opcional, default: dev)"
    echo ""
    echo "Ejemplos:"
    echo "  $0 docker/backups/backup_20231225_120000.sql.gz"
    echo "  $0 docker/backups/backup_20231225_120000.sql.gz prod"
    echo ""
    echo "Backups disponibles:"
    list_available_backups
}

# Listar backups disponibles
list_available_backups() {
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=0
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                local file_size=$(du -h "$file" | cut -f1)
                local file_date=$(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | cut -d'.' -f1)
                echo "   - $file ($file_size) - $file_date"
                backup_count=$((backup_count + 1))
            fi
        done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | sort -r | head -10)

        if [ $backup_count -eq 0 ]; then
            echo "   (No hay backups disponibles)"
        fi
    else
        echo "   (Directorio de backups no existe)"
    fi
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

# Función para verificar integridad del backup
verify_backup_integrity() {
    local backup_file="$1"

    log_info "Verificando integridad del archivo de backup..."

    # Si es un archivo comprimido, verificar integridad
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file" 2>> "$LOG_FILE"; then
            log_success "Integridad del archivo comprimido verificada"
            return 0
        else
            log_error "El archivo comprimido está corrupto o dañado"
            return 1
        fi
    else
        # Para archivos SQL sin comprimir, verificar que no está vacío
        if [ -s "$backup_file" ]; then
            log_success "Archivo SQL verificado"
            return 0
        else
            log_error "El archivo SQL está vacío"
            return 1
        fi
    fi
}

# Crear backup de seguridad antes de restaurar
create_safety_backup() {
    local container_name="$1"
    local db_name="$2"
    local db_password="$3"

    log_warning "Creando backup de seguridad de la base de datos actual..."

    local safety_backup="$BACKUP_DIR/pre_restore_${TIMESTAMP}.sql.gz"

    if docker exec "$container_name" mysqldump \
        --user=root \
        --password="$db_password" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --routines \
        --triggers \
        --events \
        "$db_name" 2>> "$LOG_FILE" | gzip -9 > "$safety_backup"; then

        log_success "Backup de seguridad creado: $(basename "$safety_backup")"
        local backup_size=$(du -h "$safety_backup" | cut -f1)
        log_info "Tamaño: $backup_size"
        echo "$safety_backup"
        return 0
    else
        log_error "Error al crear backup de seguridad"
        return 1
    fi
}

# ===================================================================
# FUNCIÓN PRINCIPAL DE RESTAURACIÓN
# ===================================================================

perform_restore() {
    local backup_file="$1"
    local container_name="$2"
    local db_name="$3"
    local db_password="$4"

    log_info "═══════════════════════════════════════════════════════"
    log_info "Iniciando proceso de restauración"
    log_info "═══════════════════════════════════════════════════════"
    log_info "Contenedor: $container_name"
    log_info "Base de datos: $db_name"
    log_info "Archivo origen: $backup_file"
    log_info "Log file: $(basename "$LOG_FILE")"
    log_info "Fecha: $DATE_HUMAN"
    log_info "═══════════════════════════════════════════════════════"

    # Verificar contenedor
    if ! check_container "$container_name"; then
        return 1
    fi

    # Verificar integridad del backup
    if ! verify_backup_integrity "$backup_file"; then
        return 1
    fi

    # Crear backup de seguridad
    local safety_backup=""
    if safety_backup=$(create_safety_backup "$container_name" "$db_name" "$db_password"); then
        log_info "Puede revertir los cambios usando: $0 $safety_backup"
    else
        log_warning "No se pudo crear backup de seguridad"
        log_warning "La restauración continuará, pero no hay punto de retorno"

        read -p "¿Desea continuar de todas formas? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Operación cancelada por el usuario"
            return 1
        fi
    fi

    # Preparar archivo SQL para restauración
    local sql_file=""
    local temp_file=""

    if [[ "$backup_file" == *.gz ]]; then
        log_info "Descomprimiendo archivo de backup..."
        temp_file="/tmp/restore_temp_${TIMESTAMP}.sql"

        if gunzip -c "$backup_file" > "$temp_file" 2>> "$LOG_FILE"; then
            log_success "Archivo descomprimido exitosamente"
            sql_file="$temp_file"
        else
            log_error "Error al descomprimir el archivo"
            rm -f "$temp_file"
            return 1
        fi
    else
        sql_file="$backup_file"
    fi

    # Verificar tamaño del archivo SQL
    local file_size=$(du -h "$sql_file" | cut -f1)
    log_info "Tamaño del archivo SQL: $file_size"

    # Realizar restauración
    log_warning "Iniciando restauración de la base de datos..."
    log_warning "Este proceso puede tomar varios minutos dependiendo del tamaño..."

    if docker exec -i "$container_name" mysql \
        --user=root \
        --password="$db_password" \
        "$db_name" < "$sql_file" 2>> "$LOG_FILE"; then

        log_success "Base de datos restaurada exitosamente"

        # Limpiar archivo temporal
        if [ ! -z "$temp_file" ] && [ -f "$temp_file" ]; then
            rm -f "$temp_file"
            log_info "Archivo temporal eliminado"
        fi

        return 0
    else
        log_error "Error durante la restauración de la base de datos"

        # Limpiar archivo temporal
        if [ ! -z "$temp_file" ] && [ -f "$temp_file" ]; then
            rm -f "$temp_file"
        fi

        if [ ! -z "$safety_backup" ] && [ -f "$safety_backup" ]; then
            log_error "IMPORTANTE: Puede revertir usando el backup de seguridad:"
            log_error "  $0 $safety_backup"
        fi

        return 1
    fi
}

# ===================================================================
# SCRIPT PRINCIPAL
# ===================================================================

main() {
    # Mostrar banner
    show_banner

    # Verificar argumentos
    if [ $# -lt 1 ]; then
        log_error "Error: Debe especificar un archivo de backup"
        echo ""
        show_usage
        exit 1
    fi

    local backup_file="$1"
    local mode="${2:-dev}"

    # Convertir a ruta absoluta si es relativa
    if [[ ! "$backup_file" = /* ]]; then
        backup_file="$PROJECT_ROOT/$backup_file"
    fi

    # Verificar que el archivo existe
    if [ ! -f "$backup_file" ]; then
        log_error "Error: El archivo no existe: $backup_file"
        echo ""
        show_usage
        exit 1
    fi

    # Cambiar al directorio del proyecto
    cd "$PROJECT_ROOT"

    # Configuración según el modo
    local container_name="grasas_huesos_db"
    local env_file=".env"

    if [ "$mode" = "prod" ] || [ "$mode" = "production" ]; then
        env_file=".env.production"
        log_warning "═══════════════════════════════════════════════════════"
        log_warning "MODO PRODUCCIÓN ACTIVADO"
        log_warning "═══════════════════════════════════════════════════════"
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

    # Mostrar advertencia y solicitar confirmación
    echo ""
    log_warning "═══════════════════════════════════════════════════════"
    log_warning "ADVERTENCIA: Esta operación SOBRESCRIBIRÁ la base de datos actual"
    log_warning "═══════════════════════════════════════════════════════"
    echo ""
    log_info "Base de datos que será sobrescrita: $db_name"
    log_info "Archivo de backup: $backup_file"
    echo ""

    # Solicitar confirmación
    read -p "¿Está ABSOLUTAMENTE SEGURO de que desea continuar? Escriba 'yes' para confirmar: " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Operación cancelada por el usuario"
        exit 0
    fi

    echo ""

    # Ejecutar restauración
    if perform_restore "$backup_file" "$container_name" "$db_name" "$db_password"; then
        log_success "═══════════════════════════════════════════════════════"
        log_success "RESTAURACIÓN COMPLETADA EXITOSAMENTE"
        log_success "═══════════════════════════════════════════════════════"
        log_success "Base de datos: $db_name"
        log_success "Log: $LOG_FILE"
        echo ""

        log_warning "RECOMENDACIÓN: Reinicie los servicios de la aplicación"
        echo "   docker-compose restart backend"
        echo "   docker-compose restart celery_worker"
        echo ""

        exit 0
    else
        log_error "═══════════════════════════════════════════════════════"
        log_error "ERROR EN EL PROCESO DE RESTAURACIÓN"
        log_error "═══════════════════════════════════════════════════════"
        log_error "Revise el log para más detalles: $LOG_FILE"
        echo ""

        exit 1
    fi
}

# Ejecutar función principal
main "$@"
