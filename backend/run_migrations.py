#!/usr/bin/env python3
"""
Script para ejecutar migraciones en cPanel
Sistema de Gestión Integral - StrateKaz

USO:
    python run_migrations.py [opciones]

OPCIONES:
    --check       Solo verificar migraciones pendientes (no aplicar)
    --fake        Marcar migraciones como aplicadas sin ejecutarlas
    --showplan    Mostrar plan de migraciones
    --database DB Especificar base de datos (default: default)

DESCRIPCIÓN:
    Este script ejecuta las migraciones de Django en cPanel donde
    no hay acceso SSH directo. Se puede ejecutar desde:

    1. Terminal Web de cPanel (Setup Python App > Terminal)
    2. Cron Job (para migraciones automatizadas)
    3. File Manager > Terminal (algunas versiones de cPanel)

IMPORTANTE:
    - Siempre haz un backup de la base de datos antes de migrar
    - Ejecuta primero con --check para ver qué se aplicará
    - Ejecuta con --showplan para ver el plan detallado
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime

# Configurar Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ.setdefault('USE_CPANEL', 'True')  # Modo cPanel

# Cargar .env si existe
ENV_FILE = BASE_DIR / '.env'
if ENV_FILE.exists():
    from decouple import config

# Inicializar Django
django.setup()

from django.core.management import call_command
from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

def create_log_file():
    """Crear archivo de log para las migraciones."""
    logs_dir = BASE_DIR / 'logs'
    logs_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = logs_dir / f'migration_{timestamp}.log'

    return log_file

def check_database_connection():
    """Verificar conexión a la base de datos."""
    print("🔍 Verificando conexión a la base de datos...")

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
            print(f"  ✓ Conectado a MySQL: {version}")

            # Obtener información de la base de datos
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()[0]
            print(f"  ✓ Base de datos: {db_name}")

        return True
    except Exception as e:
        print(f"  ❌ ERROR de conexión: {e}")
        print()
        print("  Verifica en tu archivo .env:")
        print("    - DB_NAME")
        print("    - DB_USER")
        print("    - DB_PASSWORD")
        print("    - DB_HOST")
        print("    - DB_PORT")
        return False

def check_pending_migrations():
    """Verificar si hay migraciones pendientes."""
    print("🔍 Verificando migraciones pendientes...")
    print()

    executor = MigrationExecutor(connection)
    targets = executor.loader.graph.leaf_nodes()
    plan = executor.migration_plan(targets)

    if not plan:
        print("  ✅ No hay migraciones pendientes")
        return False

    print(f"  📋 {len(plan)} migración(es) pendiente(s):")
    print()

    for migration, backwards in plan:
        app_label = migration.app_label
        migration_name = migration.name
        direction = "←" if backwards else "→"
        print(f"    {direction} {app_label}.{migration_name}")

    print()
    return True

def show_migration_plan():
    """Mostrar el plan de migraciones detallado."""
    print("=" * 80)
    print("PLAN DE MIGRACIONES DETALLADO")
    print("=" * 80)
    print()

    try:
        call_command('showmigrations', '--list')
        print()
    except Exception as e:
        print(f"❌ Error al mostrar plan: {e}")

def run_migrations(fake=False, database='default'):
    """Ejecutar las migraciones."""
    print("=" * 80)
    print("EJECUTANDO MIGRACIONES")
    print("=" * 80)
    print()

    log_file = create_log_file()
    print(f"📝 Log de migraciones: {log_file}")
    print()

    try:
        # Capturar output en log
        original_stdout = sys.stdout

        with open(log_file, 'w', encoding='utf-8') as f:
            # Escribir header del log
            f.write("=" * 80 + "\n")
            f.write(f"LOG DE MIGRACIONES - {datetime.now()}\n")
            f.write("=" * 80 + "\n\n")

            # Redirigir stdout al archivo y a la consola
            class Tee:
                def __init__(self, file):
                    self.file = file
                    self.terminal = original_stdout

                def write(self, data):
                    self.terminal.write(data)
                    self.file.write(data)

                def flush(self):
                    self.terminal.flush()
                    self.file.flush()

            sys.stdout = Tee(f)

            # Ejecutar migraciones
            options = {
                'verbosity': 2,
                'database': database,
            }

            if fake:
                options['fake'] = True
                print("⚠ MODO FAKE: Las migraciones se marcarán como aplicadas sin ejecutarse")
                print()

            call_command('migrate', **options)

            # Restaurar stdout
            sys.stdout = original_stdout

        print()
        print(f"✅ Migraciones completadas exitosamente")
        print(f"📝 Log guardado en: {log_file}")
        print()

        return True

    except Exception as e:
        sys.stdout = original_stdout
        print()
        print(f"❌ ERROR durante las migraciones: {e}")
        print(f"📝 Revisa el log para más detalles: {log_file}")
        print()
        return False

def create_cache_table():
    """Crear tabla de cache para cPanel (database cache)."""
    print("🔍 Verificando tabla de cache...")

    try:
        call_command('createcachetable', verbosity=2)
        print("  ✓ Tabla de cache verificada/creada")
        print()
    except Exception as e:
        print(f"  ⚠ No se pudo crear tabla de cache: {e}")
        print()

def main():
    """Función principal."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Ejecutar migraciones de Django en cPanel',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--check', action='store_true',
                       help='Solo verificar migraciones pendientes')
    parser.add_argument('--showplan', action='store_true',
                       help='Mostrar plan de migraciones')
    parser.add_argument('--fake', action='store_true',
                       help='Marcar como aplicadas sin ejecutar (usar con precaución)')
    parser.add_argument('--database', default='default',
                       help='Base de datos a usar (default: default)')
    parser.add_argument('--create-cache', action='store_true',
                       help='Crear tabla de cache (solo primera vez)')

    args = parser.parse_args()

    print()
    print("=" * 80)
    print("SISTEMA DE MIGRACIONES - cPanel")
    print("Sistema de Gestión Integral - StrateKaz")
    print("=" * 80)
    print()

    # Información del entorno
    print(f"🐍 Python: {sys.version.split()[0]}")
    print(f"⚙️  Django: {django.get_version()}")
    print(f"📁 BASE_DIR: {BASE_DIR}")
    print(f"🗄️  Database: {args.database}")
    print(f"🔧 USE_CPANEL: {os.environ.get('USE_CPANEL', 'False')}")
    print()

    # Verificar conexión a BD
    if not check_database_connection():
        print()
        print("❌ No se puede continuar sin conexión a la base de datos")
        sys.exit(1)

    print()

    # Crear tabla de cache si se solicita
    if args.create_cache:
        create_cache_table()

    # Mostrar plan si se solicita
    if args.showplan:
        show_migration_plan()

    # Verificar migraciones pendientes
    has_pending = check_pending_migrations()

    # Si solo es verificación, terminar aquí
    if args.check:
        print()
        print("=" * 80)
        print("VERIFICACIÓN COMPLETADA")
        print("=" * 80)
        sys.exit(0 if not has_pending else 1)

    # Ejecutar migraciones
    if has_pending:
        print()
        print("⚠ ADVERTENCIA: Se van a ejecutar migraciones en la base de datos")
        print("  Asegúrate de haber hecho un backup antes de continuar")
        print()

        # En cPanel no podemos pedir confirmación interactiva, así que ejecutamos directamente
        # Si quieres confirmación manual, ejecuta primero con --check
        success = run_migrations(fake=args.fake, database=args.database)

        if success:
            print("=" * 80)
            print("✅ PROCESO COMPLETADO EXITOSAMENTE")
            print("=" * 80)
            print()
            print("Próximos pasos:")
            print("1. Verifica que la aplicación funcione correctamente")
            print("2. Ejecuta python prepare_static.py si hay nuevos archivos estáticos")
            print("3. En cPanel > Setup Python App > Reinicia la aplicación")
            print()
        else:
            print("=" * 80)
            print("❌ PROCESO COMPLETADO CON ERRORES")
            print("=" * 80)
            print()
            print("Acciones recomendadas:")
            print("1. Revisa el archivo de log para más detalles")
            print("2. Restaura el backup de la base de datos si es necesario")
            print("3. Contacta al equipo de desarrollo si el error persiste")
            print()
            sys.exit(1)
    else:
        print()
        print("=" * 80)
        print("✅ BASE DE DATOS ACTUALIZADA")
        print("=" * 80)
        print("No hay migraciones pendientes. La base de datos está actualizada.")
        print()

if __name__ == '__main__':
    main()
