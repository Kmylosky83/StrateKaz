#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SCRIPT DE DEPLOYMENT MASIVO - cPanel Multi-Instancia
# Sistema de Gestión Integral - StrateKaz v3.3.0
# ═══════════════════════════════════════════════════════════════════════════════
#
# Este script actualiza TODAS las instancias existentes de StrateKaz.
# Útil para deployar nuevas versiones del código a múltiples clientes.
#
# USO:
#   ./deploy-all.sh [opciones]
#
# EJEMPLO:
#   ./deploy-all.sh                        # Actualizar todas las instancias
#   ./deploy-all.sh --only=acme,beta       # Solo actualizar instancias específicas
#   ./deploy-all.sh --dry-run              # Simular sin ejecutar cambios
#   ./deploy-all.sh --migrate              # Ejecutar migraciones también
#   ./deploy-all.sh --skip-frontend        # No actualizar frontend
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Detener en caso de error

# ═══════════════════════════════════════════════════
# CONFIGURACIÓN BASE
# ═══════════════════════════════════════════════════
CPANEL_USER="strat"
DOMINIO_BASE="stratekaz.com"
PYTHON_VERSION="3.11"
SHARED_CODE_PATH="/home/${CPANEL_USER}/stratekaz-base"
INSTANCES_DIR="/home/${CPANEL_USER}"
LOG_DIR="/home/${CPANEL_USER}/deploy-logs"

# ═══════════════════════════════════════════════════
# PARSEO DE ARGUMENTOS
# ═══════════════════════════════════════════════════
DRY_RUN=false
RUN_MIGRATE=false
SKIP_FRONTEND=false
ONLY_INSTANCES=""
SKIP_INSTANCES=""
COLLECTSTATIC=true
PARALLEL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --only=*)
            ONLY_INSTANCES="${1#*=}"
            shift
            ;;
        --skip=*)
            SKIP_INSTANCES="${1#*=}"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --migrate)
            RUN_MIGRATE=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --no-collectstatic)
            COLLECTSTATIC=false
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --help|-h)
            echo "Uso: $0 [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --only=inst1,inst2    Solo actualizar estas instancias"
            echo "  --skip=inst1,inst2    Omitir estas instancias"
            echo "  --dry-run             Simular sin ejecutar cambios"
            echo "  --migrate             Ejecutar migraciones"
            echo "  --skip-frontend       No actualizar frontend"
            echo "  --no-collectstatic    No ejecutar collectstatic"
            echo "  --parallel            Ejecutar en paralelo (experimental)"
            echo "  --help                Mostrar esta ayuda"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

# ═══════════════════════════════════════════════════
# COLORES Y FUNCIONES DE OUTPUT
# ═══════════════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo " $1"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY-RUN] $1"
    else
        eval "$1"
    fi
}

# ═══════════════════════════════════════════════════
# FUNCIONES PRINCIPALES
# ═══════════════════════════════════════════════════

# Obtener lista de instancias
get_instances() {
    local instances=()

    # Buscar subdominios que matchean el patrón *.stratekaz.com
    for dir in "${INSTANCES_DIR}"/*.${DOMINIO_BASE}; do
        if [ -d "$dir" ] && [ -d "${dir}/backend" ]; then
            instance_name=$(basename "$dir" | sed "s/.${DOMINIO_BASE}//")
            instances+=("$instance_name")
        fi
    done

    echo "${instances[@]}"
}

# Verificar si instancia está en lista
is_in_list() {
    local item="$1"
    local list="$2"

    if [ -z "$list" ]; then
        return 1
    fi

    IFS=',' read -ra items <<< "$list"
    for i in "${items[@]}"; do
        if [ "$i" = "$item" ]; then
            return 0
        fi
    done
    return 1
}

# Actualizar una instancia
update_instance() {
    local EMPRESA="$1"
    local DOMINIO="${EMPRESA}.${DOMINIO_BASE}"
    local APP_ROOT="${INSTANCES_DIR}/${DOMINIO}"
    local VENV_PATH="/home/${CPANEL_USER}/virtualenv/${DOMINIO}/${PYTHON_VERSION}"
    local PYTHON="${VENV_PATH}/bin/python"
    local PIP="${VENV_PATH}/bin/pip"
    local LOG_FILE="${LOG_DIR}/${EMPRESA}-$(date '+%Y%m%d-%H%M%S').log"

    echo ""
    print_step "Actualizando instancia: ${EMPRESA}"

    # Verificar que existe
    if [ ! -d "$APP_ROOT" ]; then
        print_error "Instancia no encontrada: ${APP_ROOT}"
        return 1
    fi

    # Crear directorio de logs
    run_cmd "mkdir -p ${LOG_DIR}"

    # 1. Backup de archivos críticos
    print_info "  Backup de .env..."
    run_cmd "cp ${APP_ROOT}/backend/.env ${APP_ROOT}/backend/.env.backup"

    # 2. Actualizar backend
    print_info "  Copiando backend..."
    run_cmd "rsync -av --exclude='.env' --exclude='*.pyc' --exclude='__pycache__' --exclude='logs' --exclude='media' ${SHARED_CODE_PATH}/backend/ ${APP_ROOT}/backend/"

    # 3. Actualizar frontend (si aplica)
    if [ "$SKIP_FRONTEND" = false ]; then
        print_info "  Copiando frontend..."
        run_cmd "rsync -av ${SHARED_CODE_PATH}/frontend/dist/ ${APP_ROOT}/public_html/"
    fi

    # 4. Instalar nuevas dependencias
    print_info "  Actualizando dependencias..."
    run_cmd "cd ${APP_ROOT}/backend && ${PIP} install -r requirements.txt --quiet 2>/dev/null || ${PIP} install -r requirements.txt"

    # 5. Migraciones (si se solicita)
    if [ "$RUN_MIGRATE" = true ]; then
        print_info "  Ejecutando migraciones..."
        run_cmd "cd ${APP_ROOT}/backend && ${PYTHON} manage.py migrate --noinput"
    fi

    # 6. Collectstatic
    if [ "$COLLECTSTATIC" = true ]; then
        print_info "  Recolectando estáticos..."
        run_cmd "cd ${APP_ROOT}/backend && ${PYTHON} manage.py collectstatic --noinput --clear"
    fi

    # 7. Reiniciar aplicación
    print_info "  Reiniciando aplicación..."
    run_cmd "mkdir -p ${APP_ROOT}/tmp && touch ${APP_ROOT}/tmp/restart.txt"

    # 8. Health check
    if [ "$DRY_RUN" = false ]; then
        sleep 5
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMINIO}/api/health/" 2>/dev/null || echo "000")

        if [ "$HTTP_CODE" = "200" ]; then
            print_success "  ${EMPRESA}: OK (HTTP 200)"
            return 0
        else
            print_error "  ${EMPRESA}: FALLO (HTTP ${HTTP_CODE})"
            return 1
        fi
    else
        print_success "  ${EMPRESA}: [DRY-RUN] OK"
        return 0
    fi
}

# ═══════════════════════════════════════════════════
# INICIO DEL SCRIPT
# ═══════════════════════════════════════════════════

print_header "DEPLOYMENT MASIVO - StrateKaz"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "Fecha: ${TIMESTAMP}"
echo ""

if [ "$DRY_RUN" = true ]; then
    print_info "MODO DRY-RUN: No se ejecutarán cambios reales"
    echo ""
fi

# Verificar que existe código base
if [ ! -d "${SHARED_CODE_PATH}/backend" ]; then
    print_error "No se encontró código base en: ${SHARED_CODE_PATH}"
    echo ""
    echo "Asegúrese de que el código actualizado esté en:"
    echo "  ${SHARED_CODE_PATH}/backend"
    echo "  ${SHARED_CODE_PATH}/frontend/dist"
    exit 1
fi

# Obtener lista de instancias
print_step "Detectando instancias..."
ALL_INSTANCES=($(get_instances))

if [ ${#ALL_INSTANCES[@]} -eq 0 ]; then
    print_error "No se encontraron instancias de StrateKaz"
    exit 1
fi

print_success "Encontradas ${#ALL_INSTANCES[@]} instancias"
echo ""

# Filtrar instancias según parámetros
INSTANCES_TO_UPDATE=()

for instance in "${ALL_INSTANCES[@]}"; do
    # Si hay lista --only, verificar que esté incluida
    if [ -n "$ONLY_INSTANCES" ]; then
        if is_in_list "$instance" "$ONLY_INSTANCES"; then
            INSTANCES_TO_UPDATE+=("$instance")
        fi
    # Si hay lista --skip, verificar que NO esté excluida
    elif [ -n "$SKIP_INSTANCES" ]; then
        if ! is_in_list "$instance" "$SKIP_INSTANCES"; then
            INSTANCES_TO_UPDATE+=("$instance")
        fi
    # Sin filtros, incluir todas
    else
        INSTANCES_TO_UPDATE+=("$instance")
    fi
done

# Mostrar plan
print_header "Plan de Actualización"
echo "Instancias a actualizar:"
for instance in "${INSTANCES_TO_UPDATE[@]}"; do
    echo "  - ${instance}.${DOMINIO_BASE}"
done
echo ""
echo "Opciones:"
echo "  Migraciones:   $([ "$RUN_MIGRATE" = true ] && echo 'SÍ' || echo 'NO')"
echo "  Frontend:      $([ "$SKIP_FRONTEND" = false ] && echo 'SÍ' || echo 'NO')"
echo "  Collectstatic: $([ "$COLLECTSTATIC" = true ] && echo 'SÍ' || echo 'NO')"
echo ""

# Confirmar
if [ "$DRY_RUN" = false ]; then
    read -p "¿Continuar con la actualización? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
fi

# ═══════════════════════════════════════════════════
# EJECUTAR ACTUALIZACIONES
# ═══════════════════════════════════════════════════

print_header "Ejecutando Actualizaciones"

SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_INSTANCES=()

for instance in "${INSTANCES_TO_UPDATE[@]}"; do
    if update_instance "$instance"; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
        FAILED_INSTANCES+=("$instance")
    fi
done

# ═══════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════

print_header "RESUMEN DE DEPLOYMENT"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                         RESULTADOS                                ║"
echo "╠═══════════════════════════════════════════════════════════════════╣"
printf "║  Total procesadas:   %-5s                                       ║\n" "${#INSTANCES_TO_UPDATE[@]}"
printf "║  Exitosas:           %-5s                                       ║\n" "${SUCCESS_COUNT}"
printf "║  Fallidas:           %-5s                                       ║\n" "${FAIL_COUNT}"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

if [ ${#FAILED_INSTANCES[@]} -gt 0 ]; then
    print_error "Instancias con errores:"
    for failed in "${FAILED_INSTANCES[@]}"; do
        echo "  - ${failed}"
    done
    echo ""
    print_info "Revisar logs en: ${LOG_DIR}/"
fi

if [ "$FAIL_COUNT" -eq 0 ]; then
    print_success "Deployment completado exitosamente"
else
    print_error "Deployment completado con ${FAIL_COUNT} errores"
    exit 1
fi

echo ""
