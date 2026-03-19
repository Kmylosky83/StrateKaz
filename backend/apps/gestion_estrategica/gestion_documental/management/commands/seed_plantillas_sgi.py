"""
Seed: Distribuir plantillas de BibliotecaPlantilla (public) a cada tenant.

Lee las plantillas maestras de shared_biblioteca_plantilla (schema public)
y las copia como PlantillaDocumento locales en el tenant actual.
También crea TipoDocumento CONTRATO_LABORAL si no existe.

Flujo:
  1. Lee BibliotecaPlantilla desde schema public
  2. Para cada plantilla, busca el TipoDocumento local (ya creado por seed_tipos_documento_sgi)
  3. Crea/actualiza PlantillaDocumento con plantilla_maestra_codigo + es_personalizada=False

Idempotente — usa update_or_create con unique_together (empresa_id, codigo).
Depende de: seed_biblioteca_plantillas (public) + seed_tipos_documento_sgi (tenant).
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps
from django_tenants.utils import schema_context


# Datos para TipoDocumento CONTRATO_LABORAL (no es parte de los 12 SGI base)
CONTRATO_LABORAL_DATA = {
    'nombre': 'Contrato de Trabajo',
    'descripcion': (
        'Contratos laborales individuales de trabajo. '
        'Incluye contratos a término fijo, indefinido, obra o labor y aprendizaje.'
    ),
    'nivel_documento': 'OPERATIVO',
    'prefijo_codigo': 'CTR-',
    'requiere_aprobacion': True,
    'requiere_firma': True,
    'tiempo_retencion_años': 20,
    'color_identificacion': '#6366F1',
    'orden': 100,
}


class Command(BaseCommand):
    help = (
        'Distribuye plantillas de BibliotecaPlantilla (public) al tenant actual. '
        'Depende de seed_biblioteca_plantillas + seed_tipos_documento_sgi.'
    )

    def handle(self, *args, **options):
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa(auto_create=True)
        if not empresa:
            self.stdout.write(self.style.WARNING(
                '  No se encontró empresa en el tenant actual'
            ))
            return

        TipoDocumento = apps.get_model('gestion_documental', 'TipoDocumento')
        PlantillaDocumento = apps.get_model('gestion_documental', 'PlantillaDocumento')
        BibliotecaPlantilla = apps.get_model('shared_library', 'BibliotecaPlantilla')

        # Leer plantillas maestras desde schema public
        with schema_context('public'):
            plantillas_maestras = list(
                BibliotecaPlantilla.objects.filter(is_active=True).order_by('orden')
            )

        if not plantillas_maestras:
            self.stdout.write(self.style.WARNING(
                '    ⚠ BibliotecaPlantilla vacía — ejecute primero seed_biblioteca_plantillas'
            ))
            return

        created_count = 0
        updated_count = 0
        tipo_created = False

        with transaction.atomic():
            for maestra in plantillas_maestras:
                tipo_codigo = maestra.tipo_documento_codigo

                # Si es CONTRATO_LABORAL, crear TipoDocumento si no existe
                if tipo_codigo == 'CONTRATO_LABORAL':
                    td_defaults = CONTRATO_LABORAL_DATA.copy()
                    td_defaults['is_active'] = True
                    tipo_doc, was_created = TipoDocumento.objects.update_or_create(
                        empresa_id=empresa.id,
                        codigo=tipo_codigo,
                        defaults=td_defaults,
                    )
                    if was_created:
                        tipo_created = True
                else:
                    # Buscar TipoDocumento existente (seed_tipos_documento_sgi)
                    try:
                        tipo_doc = TipoDocumento.objects.get(
                            empresa_id=empresa.id,
                            codigo=tipo_codigo,
                        )
                    except TipoDocumento.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f'    ⚠ TipoDocumento {tipo_codigo} no encontrado — '
                            f'ejecute primero seed_tipos_documento_sgi'
                        ))
                        continue

                # Crear/actualizar PlantillaDocumento desde la maestra
                _, was_created = PlantillaDocumento.objects.update_or_create(
                    empresa_id=empresa.id,
                    codigo=maestra.codigo,
                    defaults={
                        'nombre': maestra.nombre,
                        'descripcion': maestra.descripcion,
                        'tipo_documento': tipo_doc,
                        'tipo_plantilla': 'HTML',
                        'contenido_plantilla': maestra.contenido_plantilla,
                        'variables_disponibles': maestra.variables_disponibles,
                        'estilos_css': maestra.estilos_css,
                        'encabezado': maestra.encabezado,
                        'pie_pagina': maestra.pie_pagina,
                        'version': maestra.version,
                        'estado': 'ACTIVA',
                        'es_por_defecto': True,
                        'plantilla_maestra_codigo': maestra.codigo,
                        'es_personalizada': False,
                    },
                )

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        if tipo_created:
            self.stdout.write(self.style.SUCCESS(
                '    ✓ TipoDocumento CONTRATO_LABORAL creado'
            ))

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Plantillas SGI: {created_count} creadas, '
            f'{updated_count} actualizadas (total: {len(plantillas_maestras)})'
        ))
