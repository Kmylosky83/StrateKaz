#!/usr/bin/env python
"""
Script de Verificación: Migración Gestor Documental N3 → N1
Autor: Claude (BPM_SPECIALIST)
Fecha: 2026-01-17

Verifica que la migración se haya completado correctamente.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.apps import apps
from django.conf import settings
from django.db import connection


class Colors:
    """Colores para output en terminal"""
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'


def print_section(title):
    """Imprime sección con formato"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}{title}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}")


def check_installed_apps():
    """Verifica configuración de INSTALLED_APPS"""
    print_section("1. Verificar INSTALLED_APPS")

    new_app = 'apps.gestion_estrategica.gestion_documental'
    old_app = 'apps.hseq_management.sistema_documental'

    if new_app in settings.INSTALLED_APPS:
        print(f"{Colors.GREEN}✓ {new_app} está instalado{Colors.NC}")
    else:
        print(f"{Colors.RED}✗ {new_app} NO está instalado{Colors.NC}")
        return False

    if old_app in settings.INSTALLED_APPS:
        print(f"{Colors.YELLOW}⚠ {old_app} todavía está instalado (debe eliminarse){Colors.NC}")
    else:
        print(f"{Colors.GREEN}✓ {old_app} fue eliminado correctamente{Colors.NC}")

    return True


def check_models():
    """Verifica que los modelos existen"""
    print_section("2. Verificar Modelos")

    expected_models = [
        'TipoDocumento',
        'PlantillaDocumento',
        'Documento',
        'VersionDocumento',
        'CampoFormulario',
        'ControlDocumental',
    ]

    eliminated_models = ['FirmaDocumento']

    all_ok = True

    # Verificar modelos esperados
    for model_name in expected_models:
        try:
            model = apps.get_model('gestion_documental', model_name)
            print(f"{Colors.GREEN}✓ {model_name} existe{Colors.NC}")
        except LookupError:
            print(f"{Colors.RED}✗ {model_name} NO existe{Colors.NC}")
            all_ok = False

    # Verificar modelos eliminados
    for model_name in eliminated_models:
        try:
            model = apps.get_model('gestion_documental', model_name)
            print(f"{Colors.YELLOW}⚠ {model_name} todavía existe (debe eliminarse){Colors.NC}")
            all_ok = False
        except LookupError:
            print(f"{Colors.GREEN}✓ {model_name} fue eliminado correctamente{Colors.NC}")

    return all_ok


def check_database_tables():
    """Verifica que las tablas de BD existen"""
    print_section("3. Verificar Tablas de Base de Datos")

    expected_tables = [
        'documental_tipo_documento',
        'documental_plantilla_documento',
        'documental_documento',
        'documental_version_documento',
        'documental_campo_formulario',
        'documental_control_documental',
    ]

    with connection.cursor() as cursor:
        # Obtener lista de tablas
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name LIKE 'documental_%'
        """)
        existing_tables = [row[0] for row in cursor.fetchall()]

    all_ok = True

    for table_name in expected_tables:
        if table_name in existing_tables:
            # Contar registros
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
            print(f"{Colors.GREEN}✓ {table_name} existe ({count} registros){Colors.NC}")
        else:
            print(f"{Colors.RED}✗ {table_name} NO existe{Colors.NC}")
            all_ok = False

    # Verificar si existe tabla de FirmaDocumento
    if 'documental_firma_documento' in existing_tables:
        print(f"{Colors.YELLOW}⚠ documental_firma_documento todavía existe (puede eliminarse){Colors.NC}")
    else:
        print(f"{Colors.GREEN}✓ documental_firma_documento fue eliminada{Colors.NC}")

    return all_ok


def check_migrations():
    """Verifica estado de migraciones"""
    print_section("4. Verificar Migraciones")

    from django.db.migrations.executor import MigrationExecutor
    from django.db import connection

    executor = MigrationExecutor(connection)
    plan = executor.migration_plan([('gestion_documental', None)])

    if plan:
        print(f"{Colors.YELLOW}⚠ Hay {len(plan)} migraciones pendientes:{Colors.NC}")
        for migration, backwards in plan:
            print(f"  - {migration.app_label}.{migration.name}")
        return False
    else:
        print(f"{Colors.GREEN}✓ Todas las migraciones están aplicadas{Colors.NC}")
        return True


def check_identidad_integration():
    """Verifica integración con módulo Identidad"""
    print_section("5. Verificar Integración con Identidad")

    try:
        from apps.gestion_estrategica.identidad.services import GestorDocumentalService

        # Verificar que el servicio puede encontrar el módulo
        if GestorDocumentalService.is_documental_available():
            print(f"{Colors.GREEN}✓ GestorDocumentalService puede acceder al módulo{Colors.NC}")

            # Verificar que usa el app name correcto
            import inspect
            source = inspect.getsource(GestorDocumentalService.is_documental_available)

            if 'gestion_documental' in source:
                print(f"{Colors.GREEN}✓ Service usa 'gestion_documental' (correcto){Colors.NC}")
                return True
            elif 'sistema_documental' in source:
                print(f"{Colors.RED}✗ Service todavía usa 'sistema_documental' (debe actualizarse){Colors.NC}")
                return False
        else:
            print(f"{Colors.RED}✗ GestorDocumentalService NO puede acceder al módulo{Colors.NC}")
            return False

    except ImportError as e:
        print(f"{Colors.RED}✗ Error al importar GestorDocumentalService: {e}{Colors.NC}")
        return False


def check_urls():
    """Verifica configuración de URLs"""
    print_section("6. Verificar URLs")

    from django.urls import get_resolver

    resolver = get_resolver()

    # Buscar patrón de gestion-documental
    found_new = False
    found_old = False

    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'pattern'):
            pattern_str = str(pattern.pattern)

            if 'gestion-estrategica' in pattern_str or 'gestion_documental' in pattern_str:
                found_new = True
                print(f"{Colors.GREEN}✓ Encontrado patrón: {pattern_str}{Colors.NC}")

            if 'sistema-documental' in pattern_str or 'sistema_documental' in pattern_str:
                found_old = True
                print(f"{Colors.YELLOW}⚠ Encontrado patrón antiguo: {pattern_str}{Colors.NC}")

    if found_new and not found_old:
        print(f"{Colors.GREEN}✓ URLs configuradas correctamente{Colors.NC}")
        return True
    elif found_new and found_old:
        print(f"{Colors.YELLOW}⚠ URLs nuevas y antiguas coexisten (eliminar antiguas){Colors.NC}")
        return False
    else:
        print(f"{Colors.RED}✗ URLs no configuradas{Colors.NC}")
        return False


def check_frontend_files():
    """Verifica archivos frontend"""
    print_section("7. Verificar Archivos Frontend")

    frontend_base = os.path.join(
        os.path.dirname(__file__), '..', 'frontend', 'src', 'features'
    )

    new_files = [
        'gestion-estrategica/api/gestionDocumentalApi.ts',
        'gestion-estrategica/hooks/useGestionDocumental.ts',
        'gestion-estrategica/types/gestion-documental.types.ts',
        'gestion-estrategica/pages/GestionDocumentalPage.tsx',
    ]

    old_files = [
        'hseq/api/sistemaDocumentalApi.ts',
        'hseq/hooks/useSistemaDocumental.ts',
        'hseq/types/sistema-documental.types.ts',
        'hseq/pages/SistemaDocumentalPage.tsx',
    ]

    all_ok = True

    # Verificar archivos nuevos
    for file_path in new_files:
        full_path = os.path.join(frontend_base, file_path)
        if os.path.exists(full_path):
            print(f"{Colors.GREEN}✓ {file_path} existe{Colors.NC}")
        else:
            print(f"{Colors.RED}✗ {file_path} NO existe{Colors.NC}")
            all_ok = False

    # Verificar archivos antiguos (no deberían existir)
    for file_path in old_files:
        full_path = os.path.join(frontend_base, file_path)
        if os.path.exists(full_path):
            print(f"{Colors.YELLOW}⚠ {file_path} todavía existe (debe eliminarse){Colors.NC}")
        else:
            print(f"{Colors.GREEN}✓ {file_path} fue eliminado{Colors.NC}")

    return all_ok


def check_data_integrity():
    """Verifica integridad de datos"""
    print_section("8. Verificar Integridad de Datos")

    try:
        from apps.gestion_estrategica.gestion_documental.models import (
            TipoDocumento, Documento, PlantillaDocumento
        )

        # Contar registros
        tipo_count = TipoDocumento.objects.count()
        doc_count = Documento.objects.count()
        plantilla_count = PlantillaDocumento.objects.count()

        print(f"  → {tipo_count} Tipos de Documento")
        print(f"  → {doc_count} Documentos")
        print(f"  → {plantilla_count} Plantillas")

        # Verificar relaciones
        if doc_count > 0:
            # Verificar que documentos tienen tipo
            docs_sin_tipo = Documento.objects.filter(tipo_documento__isnull=True).count()
            if docs_sin_tipo > 0:
                print(f"{Colors.RED}✗ {docs_sin_tipo} documentos sin tipo{Colors.NC}")
                return False

        print(f"{Colors.GREEN}✓ Datos íntegros{Colors.NC}")
        return True

    except Exception as e:
        print(f"{Colors.RED}✗ Error verificando datos: {e}{Colors.NC}")
        return False


def main():
    """Ejecuta todas las verificaciones"""
    print(f"\n{Colors.GREEN}{'='*60}{Colors.NC}")
    print(f"{Colors.GREEN}Verificación de Migración: Gestor Documental N3 → N1{Colors.NC}")
    print(f"{Colors.GREEN}{'='*60}{Colors.NC}")

    checks = [
        ("INSTALLED_APPS", check_installed_apps),
        ("Modelos", check_models),
        ("Tablas de BD", check_database_tables),
        ("Migraciones", check_migrations),
        ("Integración Identidad", check_identidad_integration),
        ("URLs", check_urls),
        ("Archivos Frontend", check_frontend_files),
        ("Integridad de Datos", check_data_integrity),
    ]

    results = {}

    for check_name, check_func in checks:
        try:
            results[check_name] = check_func()
        except Exception as e:
            print(f"{Colors.RED}✗ Error en verificación '{check_name}': {e}{Colors.NC}")
            results[check_name] = False

    # Resumen
    print_section("RESUMEN DE VERIFICACIÓN")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for check_name, result in results.items():
        status = f"{Colors.GREEN}✓ PASS{Colors.NC}" if result else f"{Colors.RED}✗ FAIL{Colors.NC}"
        print(f"{status} - {check_name}")

    print(f"\n{Colors.BLUE}Resultado: {passed}/{total} verificaciones exitosas{Colors.NC}")

    if passed == total:
        print(f"\n{Colors.GREEN}{'='*60}{Colors.NC}")
        print(f"{Colors.GREEN}¡Migración completada exitosamente!{Colors.NC}")
        print(f"{Colors.GREEN}{'='*60}{Colors.NC}")
        return 0
    else:
        print(f"\n{Colors.YELLOW}{'='*60}{Colors.NC}")
        print(f"{Colors.YELLOW}Migración incompleta. Revise los errores arriba.{Colors.NC}")
        print(f"{Colors.YELLOW}{'='*60}{Colors.NC}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
