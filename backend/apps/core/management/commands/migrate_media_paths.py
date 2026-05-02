"""
Management command: migrate_media_paths

Migra archivos del esquema de rutas antiguo (sin segregación por tenant)
al nuevo esquema con prefijo de schema (TenantFileStorage).

Flujo de migración:
    Antes: media/documentos/pdf/2026/04/archivo.pdf
    Después: media/tenant_stratekaz/documentos/pdf/2026/04/archivo.pdf

El comando actualiza la ruta en la base de datos Y mueve el archivo físico.
Usa transacciones por modelo para garantizar consistencia.

Uso:
    # Ver qué archivos se migrarían (sin mover nada):
    python manage.py migrate_media_paths --dry-run

    # Migrar un schema específico:
    python manage.py migrate_media_paths --schema tenant_stratekaz

    # Migrar todos los schemas tenant (excluye public):
    python manage.py migrate_media_paths

    # Migrar solo el módulo documental:
    python manage.py migrate_media_paths --module gestion_documental

    # Ver estadísticas de almacenamiento por tenant:
    python manage.py migrate_media_paths --stats
"""
from __future__ import annotations

import shutil
from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction


class Command(BaseCommand):
    help = (
        'Migra archivos de media al esquema segregado por tenant. '
        'Mueve archivos físicos y actualiza rutas en base de datos.'
    )

    # Mapa de modelos y sus campos FileField/ImageField a migrar.
    # Formato: 'app_label.ModelName': ['campo1', 'campo2', ...]
    # Solo modelos en schemas TENANT (no public).
    TENANT_FILE_MODELS: dict[str, list[str]] = {
        # Gestión Documental
        'infra_gestion_documental.Documento': [
            'archivo_pdf', 'archivo_original', 'pdf_sellado',
        ],
        'infra_gestion_documental.VersionDocumento': ['archivo_pdf_version'],
        'infra_gestion_documental.ControlDocumental': ['acta_destruccion'],
        # Core
        'core.User': ['photo'],
        # Mi Equipo
        'colaboradores.Colaborador': ['foto', 'cv_documento', 'certificados_estudios'],
        'seleccion_contratacion.Candidato': ['hoja_vida', 'carta_presentacion'],
        'seleccion_contratacion.Contrato': ['archivo_contrato'],
        'onboarding_induccion.EntregaEPP': ['acta_entrega'],
        'onboarding_induccion.EntregaActivos': ['acta_entrega', 'acta_devolucion'],
        'onboarding_induccion.DocumentoFirma': ['documento', 'documento_firmado'],
        # HSEQ
        'medicina_laboral.ExamenMedico': ['archivo_resultado'],
        'gestion_ambiental.GestionResiduos': ['certificado_disposicion'],
        # Workflow
        'infra_workflow_ejecucion.ArchivoProceso': ['archivo'],
        # Motor cumplimiento
        'evidencias.Evidencia': ['archivo'],
        # Analytics
        'generador_informes.InformeGenerado': ['archivo_generado'],
        'exportacion_integracion.ExportacionDatos': ['archivo_generado'],
    }

    # Modelos en schema PUBLIC (no se migran — usan prefix 'public/' via storage)
    PUBLIC_FILE_MODELS: dict[str, list[str]] = {
        'tenant.Tenant': [
            'logo', 'logo_white', 'logo_dark', 'favicon',
            'login_background', 'pwa_icon_192', 'pwa_icon_512', 'pwa_icon_maskable',
        ],
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Muestra qué se migraría sin hacer cambios reales.',
        )
        parser.add_argument(
            '--schema',
            type=str,
            default=None,
            help='Migrar solo este schema (ej: tenant_stratekaz). '
                 'Si no se especifica, migra todos los tenants.',
        )
        parser.add_argument(
            '--module',
            type=str,
            default=None,
            help='Filtrar por módulo (ej: gestion_documental, colaboradores).',
        )
        parser.add_argument(
            '--stats',
            action='store_true',
            default=False,
            help='Mostrar estadísticas de almacenamiento por tenant y salir.',
        )

    def handle(self, *args, **options):
        if options['stats']:
            self._show_stats()
            return

        dry_run: bool = options['dry_run']
        target_schema: str | None = options['schema']
        module_filter: str | None = options['module']

        if dry_run:
            self.stdout.write(self.style.WARNING('Modo DRY-RUN — no se moverán archivos.\n'))

        # Obtener schemas a migrar
        schemas = self._get_tenant_schemas(target_schema)
        if not schemas:
            raise CommandError('No se encontraron schemas de tenant para migrar.')

        self.stdout.write(f'Schemas a procesar: {", ".join(schemas)}\n')

        total_migrated = 0
        total_missing = 0
        total_skipped = 0

        for schema in schemas:
            self.stdout.write(self.style.HTTP_INFO(f'\n━━━ Schema: {schema} ━━━'))
            migrated, missing, skipped = self._migrate_schema(
                schema, dry_run, module_filter,
            )
            total_migrated += migrated
            total_missing += missing
            total_skipped += skipped

        # Resumen final
        self.stdout.write('\n' + '═' * 60)
        self.stdout.write(self.style.SUCCESS(f'✓ Migrados:  {total_migrated} archivos'))
        if total_missing:
            self.stdout.write(self.style.WARNING(f'⚠ Sin archivo físico: {total_missing}'))
        if total_skipped:
            self.stdout.write(f'  Omitidos (ya migrados): {total_skipped}')
        if dry_run:
            self.stdout.write(self.style.WARNING('\nDRY-RUN: ningún archivo fue movido.'))

    # -------------------------------------------------------------------------
    # Migración por schema
    # -------------------------------------------------------------------------

    def _migrate_schema(
        self,
        schema: str,
        dry_run: bool,
        module_filter: str | None,
    ) -> tuple[int, int, int]:
        """Migra todos los modelos configurados dentro de un schema."""
        from django_tenants.utils import schema_context

        migrated = missing = skipped = 0
        media_root = Path(settings.MEDIA_ROOT)

        models_to_process = {
            key: fields
            for key, fields in self.TENANT_FILE_MODELS.items()
            if module_filter is None or module_filter in key
        }

        with schema_context(schema):
            for model_key, field_names in models_to_process.items():
                try:
                    model = apps.get_model(*model_key.split('.'))
                except LookupError:
                    self.stdout.write(f'  [SKIP] {model_key} — app no instalada')
                    continue

                for field_name in field_names:
                    m, mi, sk = self._migrate_field(
                        model, field_name, schema,
                        media_root, dry_run,
                    )
                    migrated += m
                    missing += mi
                    skipped += sk

        return migrated, missing, skipped

    def _migrate_field(
        self,
        model,
        field_name: str,
        schema: str,
        media_root: Path,
        dry_run: bool,
    ) -> tuple[int, int, int]:
        """Migra un campo FileField específico dentro de un modelo."""
        prefix = f'{schema}/'
        migrated = missing = skipped = 0

        # Solo registros con valor en el campo y SIN el prefix ya aplicado
        filter_kwargs = {
            f'{field_name}__isnull': False,
            f'{field_name}__gt': '',
        }
        exclude_kwargs = {f'{field_name}__startswith': prefix}

        queryset = (
            model.objects
            .filter(**filter_kwargs)
            .exclude(**exclude_kwargs)
            .only('id', field_name)
        )

        count = queryset.count()
        if count == 0:
            return 0, 0, 0

        self.stdout.write(f'  {model.__name__}.{field_name}: {count} registros a migrar')

        for instance in queryset.iterator(chunk_size=200):
            old_name: str = getattr(instance, field_name).name
            new_name = f'{prefix}{old_name}'

            old_path = media_root / old_name
            new_path = media_root / new_name

            # Verificar si el archivo existe físicamente
            if not old_path.exists():
                self.stdout.write(
                    self.style.WARNING(f'    ⚠ Archivo no encontrado: {old_name}')
                )
                missing += 1
                continue

            if dry_run:
                self.stdout.write(f'    → {old_name}')
                self.stdout.write(f'      {new_name}')
                migrated += 1
                continue

            # Mover archivo y actualizar DB en una transacción
            try:
                with transaction.atomic():
                    # Crear directorio destino si no existe
                    new_path.parent.mkdir(parents=True, exist_ok=True)
                    # Mover archivo físico
                    shutil.move(str(old_path), str(new_path))
                    # Actualizar ruta en DB
                    model.objects.filter(pk=instance.pk).update(
                        **{field_name: new_name}
                    )
                migrated += 1
            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f'    ✗ Error migrando {old_name}: {exc}')
                )

        return migrated, missing, skipped

    # -------------------------------------------------------------------------
    # Estadísticas
    # -------------------------------------------------------------------------

    def _show_stats(self):
        """Muestra uso de disco por tenant."""
        from utils.storage import get_tenant_media_root
        from django_tenants.utils import schema_context

        media_root = Path(settings.MEDIA_ROOT)
        schemas = self._get_tenant_schemas(None)

        self.stdout.write('\n' + '═' * 60)
        self.stdout.write('  ALMACENAMIENTO POR TENANT')
        self.stdout.write('═' * 60)

        for schema in schemas:
            tenant_path = media_root / schema
            if tenant_path.exists():
                total = sum(f.stat().st_size for f in tenant_path.rglob('*') if f.is_file())
                files = sum(1 for f in tenant_path.rglob('*') if f.is_file())
                size_mb = total / (1024 ** 2)
                self.stdout.write(
                    f'  {schema:<35} {files:>6} archivos   {size_mb:>8.1f} MB'
                )
            else:
                self.stdout.write(f'  {schema:<35} (sin directorio)')

        self.stdout.write('═' * 60 + '\n')

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    def _get_tenant_schemas(self, target: str | None) -> list[str]:
        """Retorna lista de schemas tenant activos (excluye 'public')."""
        try:
            from apps.tenant.models import Tenant
            qs = Tenant.objects.exclude(schema_name='public').values_list(
                'schema_name', flat=True,
            )
            schemas = list(qs)
        except Exception:
            # Fallback: leer schemas directamente de PostgreSQL
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT schema_name FROM information_schema.schemata "
                    "WHERE schema_name NOT IN ('public', 'information_schema') "
                    "AND schema_name NOT LIKE 'pg_%' "
                    "ORDER BY schema_name"
                )
                schemas = [row[0] for row in cursor.fetchall()]

        if target:
            if target not in schemas:
                raise CommandError(
                    f"Schema '{target}' no encontrado. "
                    f"Disponibles: {', '.join(schemas)}"
                )
            return [target]

        return schemas
