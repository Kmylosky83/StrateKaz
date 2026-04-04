"""
Sprint 2 — Migración de códigos: formato legacy → TIPO-PROCESO-NNN.

Para cada documento con proceso FK asignado:
1. Genera nuevo código con el motor unificado
2. Verifica unicidad antes de actualizar
3. Logea cambios para trazabilidad
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Recodifica documentos existentes al formato TIPO-PROCESO-NNN'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Solo muestra qué cambiaría sin modificar la BD',
        )

    def handle(self, *args, **options):
        from apps.gestion_estrategica.gestion_documental.models import Documento
        from apps.gestion_estrategica.gestion_documental.services import DocumentoService
        from apps.core.base_models.mixins import get_tenant_empresa

        dry_run = options['dry_run']
        empresa = get_tenant_empresa(auto_create=False)
        if not empresa:
            self.stdout.write(self.style.WARNING('  No se encontró empresa en el tenant'))
            return

        docs = Documento.objects.select_related(
            'tipo_documento', 'proceso'
        ).filter(proceso__isnull=False)

        migrados = 0
        errores = 0

        for doc in docs:
            codigo_viejo = doc.codigo
            try:
                codigo_nuevo = DocumentoService.generar_codigo(
                    doc.tipo_documento, empresa.id, doc.proceso
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  Error generando código para {doc.codigo}: {e}'
                ))
                errores += 1
                continue

            # Verificar que no haya conflicto
            if Documento.objects.filter(
                empresa_id=empresa.id, codigo=codigo_nuevo
            ).exclude(pk=doc.pk).exists():
                self.stdout.write(self.style.WARNING(
                    f'  Conflicto: {codigo_viejo} → {codigo_nuevo} (ya existe)'
                ))
                errores += 1
                continue

            if dry_run:
                self.stdout.write(f'  [DRY] {codigo_viejo} → {codigo_nuevo}')
            else:
                doc.codigo = codigo_nuevo
                doc.save(update_fields=['codigo', 'updated_at'])
                self.stdout.write(f'  {codigo_viejo} → {codigo_nuevo}')
            migrados += 1

        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'  {prefix}Recodificación: {migrados} migrados, {errores} errores'
        ))
