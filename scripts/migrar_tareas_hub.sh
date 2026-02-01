#!/bin/bash
#
# Script de migración rápida: Gestor de Tareas → Hub N1
# Autor: BPM_SPECIALIST
# Fecha: 2026-01-17
#
# Este script automatiza los pasos iniciales de la migración
# ADVERTENCIA: Revisar y adaptar paths según tu entorno
#

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
PROJECT_ROOT="c:/Proyectos/StrateKaz"
BACKEND_ROOT="$PROJECT_ROOT/backend"
FRONTEND_ROOT="$PROJECT_ROOT/frontend"
FECHA=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     MIGRACIÓN: Gestor de Tareas → Hub Centralizado N1       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# FASE 0: Verificaciones previas
# ============================================================================

echo -e "${YELLOW}[FASE 0]${NC} Verificaciones previas..."

# Verificar que estamos en el directorio correcto
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}ERROR: Directorio del proyecto no encontrado: $PROJECT_ROOT${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# Verificar git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}ERROR: No es un repositorio git${NC}"
    exit 1
fi

# Verificar que no hay cambios sin commit
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}ADVERTENCIA: Hay cambios sin commit${NC}"
    read -p "¿Deseas continuar? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ Verificaciones previas OK${NC}"
echo ""

# ============================================================================
# FASE 1: Backup y preparación
# ============================================================================

echo -e "${YELLOW}[FASE 1]${NC} Backup y preparación..."

# Crear backup de base de datos
echo "  → Creando backup de base de datos..."
BACKUP_FILE="$PROJECT_ROOT/backups/backup_pre_migracion_tareas_${FECHA}.sql"
mkdir -p "$PROJECT_ROOT/backups"

# Descomentar y ajustar según tu configuración de BD
# pg_dump -U postgres stratekaz > "$BACKUP_FILE"
# echo -e "${GREEN}  ✓ Backup creado: $BACKUP_FILE${NC}"

echo -e "${GREEN}  ⚠ MANUAL: Crear backup de BD manualmente${NC}"

# Crear rama de feature
echo "  → Creando rama de feature..."
BRANCH_NAME="feature/hub-tareas-n1-${FECHA}"
git checkout -b "$BRANCH_NAME"
echo -e "${GREEN}  ✓ Rama creada: $BRANCH_NAME${NC}"

# Generar reporte de dependencias
echo "  → Analizando dependencias actuales..."
cd "$BACKEND_ROOT"
grep -r "tareas_recordatorios" apps/ --include="*.py" > "$PROJECT_ROOT/docs/dependencias_tareas_${FECHA}.txt" || true
echo -e "${GREEN}  ✓ Reporte de dependencias: docs/dependencias_tareas_${FECHA}.txt${NC}"

echo ""

# ============================================================================
# FASE 2: Crear estructura de directorios
# ============================================================================

echo -e "${YELLOW}[FASE 2]${NC} Creando estructura de directorios..."

cd "$BACKEND_ROOT/apps/gestion_estrategica"

# Crear directorios
echo "  → Creando directorios..."
mkdir -p gestion_tareas/{models,serializers,viewsets,signals,tests,migrations}

# Crear archivos __init__.py
echo "  → Creando archivos __init__.py..."
touch gestion_tareas/__init__.py
touch gestion_tareas/models/__init__.py
touch gestion_tareas/serializers/__init__.py
touch gestion_tareas/viewsets/__init__.py
touch gestion_tareas/signals/__init__.py
touch gestion_tareas/tests/__init__.py
touch gestion_tareas/migrations/__init__.py

echo -e "${GREEN}  ✓ Estructura creada${NC}"

# Verificar estructura
echo "  → Verificando estructura..."
tree gestion_tareas -L 2 || ls -R gestion_tareas

echo ""

# ============================================================================
# FASE 3: Crear archivos base
# ============================================================================

echo -e "${YELLOW}[FASE 3]${NC} Creando archivos base..."

# apps.py
echo "  → Creando apps.py..."
cat > gestion_tareas/apps.py << 'EOF'
"""
Configuración del módulo Gestión de Tareas (Hub Centralizado)
"""
from django.apps import AppConfig


class GestionTareasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gestion_estrategica.gestion_tareas'
    verbose_name = 'Gestión de Tareas (Hub Centralizado)'

    def ready(self):
        """Registrar signals al iniciar la aplicación"""
        import apps.gestion_estrategica.gestion_tareas.signals.sincronizacion
EOF

# admin.py
echo "  → Creando admin.py..."
cat > gestion_tareas/admin.py << 'EOF'
"""
Configuración del admin de Django para Gestión de Tareas
"""
from django.contrib import admin

# Registrar modelos aquí cuando estén creados
# from .models import Tarea, Recordatorio, EventoCalendario, ComentarioTarea
# admin.site.register(Tarea)
EOF

# urls.py
echo "  → Creando urls.py..."
cat > gestion_tareas/urls.py << 'EOF'
"""
URLs para Gestión de Tareas (Hub Centralizado)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importar viewsets cuando estén creados
# from .viewsets import (
#     TareaViewSet,
#     RecordatorioViewSet,
#     EventoCalendarioViewSet,
#     ComentarioTareaViewSet,
#     KanbanViewSet,
#     CalendarioViewSet,
# )

app_name = 'gestion_tareas'

router = DefaultRouter()
# router.register(r'tareas', TareaViewSet, basename='tareas')
# router.register(r'recordatorios', RecordatorioViewSet, basename='recordatorios')
# router.register(r'eventos', EventoCalendarioViewSet, basename='eventos')
# router.register(r'comentarios', ComentarioTareaViewSet, basename='comentarios')
# router.register(r'kanban', KanbanViewSet, basename='kanban')
# router.register(r'calendario', CalendarioViewSet, basename='calendario')

urlpatterns = [
    path('', include(router.urls)),
]
EOF

echo -e "${GREEN}  ✓ Archivos base creados${NC}"
echo ""

# ============================================================================
# FASE 4: Crear archivo de choices
# ============================================================================

echo -e "${YELLOW}[FASE 4]${NC} Creando archivo de choices..."

cat > gestion_tareas/models/choices.py << 'EOF'
"""
Choices para modelos de Gestión de Tareas
"""

TIPO_TAREA_CHOICES = [
    ('manual', 'Manual'),
    ('automatica', 'Automática'),
    ('recurrente', 'Recurrente'),
]

PRIORIDAD_TAREA_CHOICES = [
    ('baja', 'Baja'),
    ('normal', 'Normal'),
    ('alta', 'Alta'),
    ('urgente', 'Urgente'),
]

ESTADO_TAREA_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('en_progreso', 'En Progreso'),
    ('completada', 'Completada'),
    ('cancelada', 'Cancelada'),
    ('vencida', 'Vencida'),
]

ESTADO_KANBAN_CHOICES = [
    ('BACKLOG', 'Backlog'),
    ('TODO', 'Por Hacer'),
    ('IN_PROGRESS', 'En Progreso'),
    ('IN_REVIEW', 'En Revisión'),
    ('DONE', 'Completado'),
    ('CANCELLED', 'Cancelado'),
]

ORIGEN_TIPO_CHOICES = [
    # Nivel 1 - Gestión Estratégica
    ('PROYECTO', 'Proyecto'),
    ('OBJETIVO_ESTRATEGICO', 'Objetivo Estratégico'),
    ('INDICADOR', 'Indicador (KPI)'),
    ('REVISION_DIRECCION', 'Revisión por la Dirección'),

    # Nivel 2 - Gestión de Calidad (HSEQ)
    ('PLAN_HSEQ', 'Plan HSEQ'),
    ('ACCION_CORRECTIVA', 'Acción Correctiva'),
    ('ACCION_PREVENTIVA', 'Acción Preventiva'),
    ('ACCION_MEJORA', 'Acción de Mejora'),
    ('HALLAZGO_AUDITORIA', 'Hallazgo de Auditoría'),
    ('RIESGO', 'Gestión de Riesgo'),
    ('OPORTUNIDAD', 'Oportunidad de Mejora'),

    # Nivel 3 - SST
    ('CAPACITACION_SST', 'Capacitación SST'),
    ('INSPECCION_SST', 'Inspección SST'),
    ('INCIDENTE', 'Incidente/Accidente'),

    # Nivel 4 - PESV
    ('MANTENIMIENTO_VEHICULO', 'Mantenimiento Vehículo'),
    ('INSPECCION_PREOPERACIONAL', 'Inspección Preoperacional'),
    ('CAPACITACION_PESV', 'Capacitación PESV'),

    # Nivel 5 - Cumplimiento Legal
    ('REQUISITO_LEGAL', 'Requisito Legal'),
    ('EVALUACION_CUMPLIMIENTO', 'Evaluación de Cumplimiento'),

    # Nivel 6 - Sistema de Auditoría
    ('AUDITORIA_INTERNA', 'Auditoría Interna'),
    ('AUDITORIA_EXTERNA', 'Auditoría Externa'),
    ('PLAN_AUDITORIA', 'Plan de Auditoría'),

    # General
    ('MANUAL', 'Tarea Manual'),
    ('OTRO', 'Otro'),
]

REPETIR_CHOICES = [
    ('una_vez', 'Una Vez'),
    ('diario', 'Diario'),
    ('semanal', 'Semanal'),
    ('mensual', 'Mensual'),
]

TIPO_EVENTO_CHOICES = [
    ('reunion', 'Reunión'),
    ('capacitacion', 'Capacitación'),
    ('auditoria', 'Auditoría'),
    ('mantenimiento', 'Mantenimiento'),
    ('otro', 'Otro'),
]
EOF

echo -e "${GREEN}  ✓ Archivo de choices creado${NC}"
echo ""

# ============================================================================
# FASE 5: Instrucciones manuales
# ============================================================================

echo -e "${YELLOW}[FASE 5]${NC} Próximos pasos manuales..."
echo ""
echo "El script ha creado la estructura base. Ahora debes:"
echo ""
echo "1. Copiar modelos desde tareas_recordatorios y adaptarlos:"
echo "   ${GREEN}→${NC} Copiar models.py a gestion_tareas/models/tarea.py"
echo "   ${GREEN}→${NC} Agregar campos: origen_tipo, estado_kanban, origen_metadata"
echo "   ${GREEN}→${NC} Mejorar GenericForeignKey"
echo ""
echo "2. Crear modelos relacionados:"
echo "   ${GREEN}→${NC} gestion_tareas/models/recordatorio.py"
echo "   ${GREEN}→${NC} gestion_tareas/models/evento.py"
echo "   ${GREEN}→${NC} gestion_tareas/models/comentario.py"
echo ""
echo "3. Actualizar gestion_tareas/models/__init__.py con imports"
echo ""
echo "4. Registrar en INSTALLED_APPS (config/settings.py):"
echo "   ${GREEN}→${NC} 'apps.gestion_estrategica.gestion_tareas',"
echo ""
echo "5. Crear migración inicial:"
echo "   ${GREEN}→${NC} python manage.py makemigrations gestion_tareas"
echo ""
echo "6. Seguir el checklist en:"
echo "   ${GREEN}→${NC} docs/desarrollo/CHECKLIST_MIGRACION_TAREAS.md"
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================================
# Resumen
# ============================================================================

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  RESUMEN DE ACCIONES                         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} Rama creada: $BRANCH_NAME"
echo -e "  ${GREEN}✓${NC} Estructura de directorios creada"
echo -e "  ${GREEN}✓${NC} Archivos base generados"
echo -e "  ${GREEN}✓${NC} Reporte de dependencias generado"
echo ""
echo -e "${YELLOW}Archivos creados:${NC}"
echo "  - gestion_tareas/apps.py"
echo "  - gestion_tareas/admin.py"
echo "  - gestion_tareas/urls.py"
echo "  - gestion_tareas/models/choices.py"
echo ""
echo -e "${YELLOW}Siguiente fase:${NC} Crear modelos (ver checklist)"
echo ""
echo -e "${GREEN}Script completado exitosamente!${NC}"
echo ""
