#!/usr/bin/env python
"""
Script de migración de datos: proveedores → gestion_proveedores

ADVERTENCIA: Este script debe ejecutarse DESPUÉS de:
1. Comentar 'apps.proveedores' en INSTALLED_APPS
2. Crear migración inicial de gestion_proveedores
3. Aplicar migración inicial
4. Hacer backup de la base de datos

Uso:
    docker-compose exec backend python scripts/migrate_proveedores_to_supply_chain.py --dry-run
    docker-compose exec backend python scripts/migrate_proveedores_to_supply_chain.py --execute
"""

import django
import os
import sys
from datetime import datetime
import argparse

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction, connection
from django.core.management import call_command


class ProveedoresMigration:
    """Manejador de migración de datos de proveedores"""

    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.stats = {
            'proveedores': 0,
            'unidades_negocio': 0,
            'condiciones_comerciales': 0,
            'precios_materia_prima': 0,
            'historiales_precio': 0,
            'pruebas_acidez': 0,
        }
        self.errors = []

    def log(self, message, level='INFO'):
        """Log con timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        prefix = {
            'INFO': '✓',
            'WARNING': '⚠',
            'ERROR': '✗',
            'DEBUG': '→'
        }.get(level, '•')
        print(f"[{timestamp}] {prefix} {message}")

    def verify_preconditions(self):
        """Verificar condiciones previas"""
        self.log("Verificando condiciones previas...", 'DEBUG')

        # 1. Verificar que app legacy NO esté en INSTALLED_APPS
        from django.conf import settings
        if 'apps.proveedores' in settings.INSTALLED_APPS:
            self.log("ERROR: 'apps.proveedores' todavía está en INSTALLED_APPS", 'ERROR')
            self.log("Debe comentar la app legacy antes de ejecutar este script", 'ERROR')
            return False

        # 2. Verificar que nueva app SÍ esté en INSTALLED_APPS
        if 'apps.supply_chain.gestion_proveedores' not in settings.INSTALLED_APPS:
            self.log("ERROR: 'apps.supply_chain.gestion_proveedores' no está en INSTALLED_APPS", 'ERROR')
            return False

        # 3. Verificar que tablas legacy existan
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'proveedores_%'")
            legacy_tables = [row[0] for row in cursor.fetchall()]

        if not legacy_tables:
            self.log("ERROR: No se encontraron tablas legacy", 'ERROR')
            return False

        self.log(f"Encontradas {len(legacy_tables)} tablas legacy", 'INFO')

        # 4. Verificar que tablas nuevas existan
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'gestion_proveedores_%'")
            new_tables = [row[0] for row in cursor.fetchall()]

        if not new_tables:
            self.log("ERROR: No se encontraron tablas de gestion_proveedores", 'ERROR')
            self.log("Debe ejecutar makemigrations y migrate primero", 'ERROR')
            return False

        self.log(f"Encontradas {len(new_tables)} tablas nuevas", 'INFO')
        self.log("Todas las condiciones previas cumplidas", 'INFO')
        return True

    def count_legacy_records(self):
        """Contar registros en tablas legacy"""
        self.log("Contando registros en tablas legacy...", 'DEBUG')

        counts = {}
        tables = {
            'proveedores_proveedor': 'proveedores',
            'proveedores_unidadnegocio': 'unidades_negocio',
            'proveedores_condicioncomercialproveedor': 'condiciones_comerciales',
            'proveedores_preciomateriaprima': 'precios_materia_prima',
            'proveedores_historialprecioproveedor': 'historiales_precio',
            'proveedores_pruebaacidez': 'pruebas_acidez',
        }

        with connection.cursor() as cursor:
            for table, key in tables.items():
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    counts[key] = count
                    self.log(f"  {key}: {count:,} registros")
                except Exception as e:
                    self.log(f"  {key}: ERROR - {e}", 'ERROR')
                    counts[key] = 0

        return counts

    def migrate_data(self):
        """Ejecutar migración de datos"""
        self.log("=" * 80)
        self.log("INICIANDO MIGRACIÓN DE DATOS")
        self.log("=" * 80)

        if self.dry_run:
            self.log("MODO DRY-RUN: No se modificará la base de datos", 'WARNING')

        # Verificar precondiciones
        if not self.verify_preconditions():
            self.log("Precondiciones no cumplidas. Abortando.", 'ERROR')
            return False

        # Contar registros legacy
        legacy_counts = self.count_legacy_records()
        total_records = sum(legacy_counts.values())

        if total_records == 0:
            self.log("No hay registros para migrar", 'WARNING')
            return True

        self.log(f"\nTotal de registros a migrar: {total_records:,}", 'INFO')

        if self.dry_run:
            self.log("\nDRY-RUN completado. Use --execute para aplicar cambios.", 'WARNING')
            return True

        # Ejecutar migración con transacción
        try:
            with transaction.atomic():
                self.log("\nIniciando transacción...", 'DEBUG')

                # Migrar en orden de dependencias
                self._migrate_unidades_negocio()
                self._migrate_proveedores()
                self._migrate_condiciones_comerciales()
                self._migrate_precios_materia_prima()
                self._migrate_historiales_precio()
                self._migrate_pruebas_acidez()

                self.log("\nMigración completada exitosamente", 'INFO')
                self._print_summary()
                return True

        except Exception as e:
            self.log(f"\nERROR durante migración: {e}", 'ERROR')
            self.log("Transacción revertida", 'WARNING')
            import traceback
            traceback.print_exc()
            return False

    def _migrate_unidades_negocio(self):
        """Migrar UnidadNegocio"""
        self.log("\n→ Migrando Unidades de Negocio...", 'DEBUG')

        query = """
        INSERT INTO gestion_proveedores_unidadnegocio (
            id, empresa_id, codigo, nombre, descripcion,
            activo, responsable_id, created_at, updated_at
        )
        SELECT
            id, empresa_id, codigo, nombre, descripcion,
            activo, responsable_id, created_at, updated_at
        FROM proveedores_unidadnegocio
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            count = cursor.rowcount
            self.stats['unidades_negocio'] = count
            self.log(f"  ✓ {count} unidades de negocio migradas")

    def _migrate_proveedores(self):
        """Migrar Proveedor"""
        self.log("\n→ Migrando Proveedores...", 'DEBUG')

        query = """
        INSERT INTO gestion_proveedores_proveedor (
            id, empresa_id, unidad_negocio_id, tipo_documento, nit,
            razon_social, nombre_comercial, tipo_persona, sector,
            tipo_materia, subtipo_materia, origen, email,
            telefono_principal, ciudad, departamento, direccion,
            contacto_principal, cargo_contacto, telefono_contacto,
            email_contacto, metodo_pago, estado, observaciones,
            es_proveedor, es_externo, created_by_id,
            created_at, updated_at
        )
        SELECT
            id, empresa_id, unidad_negocio_id, tipo_documento, nit,
            razon_social, nombre_comercial, tipo_persona, sector,
            tipo_materia, subtipo_materia, origen, email,
            telefono_principal, ciudad, departamento, direccion,
            contacto_principal, cargo_contacto, telefono_contacto,
            email_contacto, metodo_pago, estado, observaciones,
            es_proveedor, es_externo, created_by_id,
            created_at, updated_at
        FROM proveedores_proveedor
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            count = cursor.rowcount
            self.stats['proveedores'] = count
            self.log(f"  ✓ {count} proveedores migrados")

    def _migrate_condiciones_comerciales(self):
        """Migrar CondicionComercialProveedor"""
        self.log("\n→ Migrando Condiciones Comerciales...", 'DEBUG')

        query = """
        INSERT INTO gestion_proveedores_condicioncomercialproveedor (
            id, proveedor_id, empresa_id, plazo_pago, descuento_pronto_pago,
            descuento_volumen, observaciones, vigente,
            fecha_inicio, fecha_fin, created_by_id,
            created_at, updated_at
        )
        SELECT
            id, proveedor_id, empresa_id, plazo_pago, descuento_pronto_pago,
            descuento_volumen, observaciones, vigente,
            fecha_inicio, fecha_fin, created_by_id,
            created_at, updated_at
        FROM proveedores_condicioncomercialproveedor
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            count = cursor.rowcount
            self.stats['condiciones_comerciales'] = count
            self.log(f"  ✓ {count} condiciones comerciales migradas")

    def _migrate_precios_materia_prima(self):
        """Migrar PrecioMateriaPrima"""
        self.log("\n→ Migrando Precios de Materia Prima...", 'DEBUG')

        query = """
        INSERT INTO gestion_proveedores_preciomateriaprima (
            id, proveedor_id, empresa_id, tipo_materia, subtipo_materia,
            precio_kg, moneda, fecha_vigencia, observaciones,
            modificado_por_id, created_at, updated_at
        )
        SELECT
            id, proveedor_id, empresa_id, tipo_materia, subtipo_materia,
            precio_kg, moneda, fecha_vigencia, observaciones,
            modificado_por_id, created_at, updated_at
        FROM proveedores_preciomateriaprima
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            count = cursor.rowcount
            self.stats['precios_materia_prima'] = count
            self.log(f"  ✓ {count} precios migrados")

    def _migrate_historiales_precio(self):
        """Migrar HistorialPrecioProveedor"""
        self.log("\n→ Migrando Historiales de Precio...", 'DEBUG')

        query = """
        INSERT INTO gestion_proveedores_historialprecioproveedor (
            id, precio_materia_prima_id, precio_anterior, precio_nuevo,
            motivo_cambio, modificado_por_id, created_at
        )
        SELECT
            id, precio_materia_prima_id, precio_anterior, precio_nuevo,
            motivo_cambio, modificado_por_id, created_at
        FROM proveedores_historialprecioproveedor
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            count = cursor.rowcount
            self.stats['historiales_precio'] = count
            self.log(f"  ✓ {count} historiales migrados")

    def _migrate_pruebas_acidez(self):
        """Migrar PruebaAcidez"""
        self.log("\n→ Migrando Pruebas de Acidez...", 'DEBUG')

        query = """
        INSERT INTO gestion_proveedores_pruebaacidez (
            id, proveedor_id, empresa_id, fecha_prueba, nivel_acidez,
            resultado, observaciones, realizado_por_id, created_at
        )
        SELECT
            id, proveedor_id, empresa_id, fecha_prueba, nivel_acidez,
            resultado, observaciones, realizado_por_id, created_at
        FROM proveedores_pruebaacidez
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            count = cursor.rowcount
            self.stats['pruebas_acidez'] = count
            self.log(f"  ✓ {count} pruebas de acidez migradas")

    def _print_summary(self):
        """Imprimir resumen de migración"""
        self.log("\n" + "=" * 80)
        self.log("RESUMEN DE MIGRACIÓN")
        self.log("=" * 80)

        total = sum(self.stats.values())

        self.log(f"\nRegistros migrados:")
        for key, count in self.stats.items():
            self.log(f"  {key}: {count:,}")

        self.log(f"\nTOTAL: {total:,} registros")

        if self.errors:
            self.log(f"\nErrores encontrados: {len(self.errors)}", 'WARNING')
            for error in self.errors:
                self.log(f"  - {error}", 'ERROR')

    def verify_migration(self):
        """Verificar que la migración fue exitosa"""
        self.log("\n" + "=" * 80)
        self.log("VERIFICANDO MIGRACIÓN")
        self.log("=" * 80)

        # Comparar conteos
        with connection.cursor() as cursor:
            # Legacy
            cursor.execute("SELECT COUNT(*) FROM proveedores_proveedor")
            legacy_count = cursor.fetchone()[0]

            # Nueva
            cursor.execute("SELECT COUNT(*) FROM gestion_proveedores_proveedor")
            new_count = cursor.fetchone()[0]

        self.log(f"\nProveedores:")
        self.log(f"  Legacy: {legacy_count:,}")
        self.log(f"  Nueva:  {new_count:,}")

        if legacy_count == new_count:
            self.log("  ✓ Conteos coinciden", 'INFO')
            return True
        else:
            self.log(f"  ✗ Diferencia: {legacy_count - new_count}", 'ERROR')
            return False


def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description='Migrar datos de proveedores a gestion_proveedores'
    )
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Ejecutar migración (por defecto: dry-run)'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Solo verificar migración existente'
    )

    args = parser.parse_args()

    migrator = ProveedoresMigration(dry_run=not args.execute)

    if args.verify:
        success = migrator.verify_migration()
    else:
        success = migrator.migrate_data()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
