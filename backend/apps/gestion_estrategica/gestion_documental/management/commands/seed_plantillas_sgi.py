"""
Seed: Distribuir plantillas de BibliotecaPlantilla (public) a cada tenant.

Lee las plantillas maestras de shared_biblioteca_plantilla (schema public)
y las copia como PlantillaDocumento locales en el tenant actual.

Flujo:
  1. Lee BibliotecaPlantilla desde schema public
  2. Para cada plantilla, busca el TipoDocumento local (ya creado por seed_tipos_documento_sgi)
  3. Crea/actualiza PlantillaDocumento con plantilla_maestra_codigo + es_personalizada=False
  4. Si es FORMULARIO, crea CampoFormulario desde JSON de la maestra

Protección: si el tenant ya personalizó una plantilla (es_personalizada=True), NO se sobreescribe.
Idempotente — usa update_or_create con unique_together (empresa_id, codigo).
Depende de: seed_biblioteca_plantillas (public) + seed_tipos_documento_sgi (tenant).
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps
from django_tenants.utils import schema_context


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
        skipped_count = 0

        with transaction.atomic():
            # Desactivar plantillas en tenant que ya no están en la biblioteca
            codigos_activos = [m.codigo for m in plantillas_maestras]
            obsoletas = PlantillaDocumento.objects.filter(
                empresa_id=empresa.id,
                es_personalizada=False,
                plantilla_maestra_codigo__isnull=False,
            ).exclude(codigo__in=codigos_activos)
            if obsoletas.exists():
                count = obsoletas.update(estado='OBSOLETA')
                self.stdout.write(self.style.WARNING(
                    f'    ⚠ {count} plantillas obsoletas en tenant'
                ))

            for maestra in plantillas_maestras:
                tipo_codigo = maestra.tipo_documento_codigo

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

                # PROTECCIÓN: si el tenant ya personalizó la plantilla, NO sobreescribir
                tipo_plantilla = getattr(maestra, 'tipo_plantilla', 'HTML') or 'HTML'
                existente = PlantillaDocumento.objects.filter(
                    empresa_id=empresa.id,
                    codigo=maestra.codigo,
                ).first()

                if existente and existente.es_personalizada:
                    skipped_count += 1
                    continue

                plantilla_obj, was_created = PlantillaDocumento.objects.update_or_create(
                    empresa_id=empresa.id,
                    codigo=maestra.codigo,
                    defaults={
                        'nombre': maestra.nombre,
                        'descripcion': maestra.descripcion,
                        'tipo_documento': tipo_doc,
                        'tipo_plantilla': tipo_plantilla,
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

                # Para FORMULARIO: crear CampoFormulario desde JSON de la maestra
                campos_json = getattr(maestra, 'campos_formulario', []) or []
                if tipo_plantilla == 'FORMULARIO' and campos_json:
                    CampoFormulario = apps.get_model('gestion_documental', 'CampoFormulario')
                    campos_created = 0
                    for campo_data in campos_json:
                        defaults = {
                            'etiqueta': campo_data.get('etiqueta', ''),
                            'tipo_campo': campo_data.get('tipo_campo', 'TEXT'),
                            'descripcion': campo_data.get('descripcion', ''),
                            'placeholder': campo_data.get('placeholder', ''),
                            'valor_por_defecto': campo_data.get('valor_por_defecto', ''),
                            'opciones': campo_data.get('opciones', []),
                            'es_obligatorio': campo_data.get('es_obligatorio', False),
                            'orden': campo_data.get('orden', 0),
                            'ancho_columna': campo_data.get('ancho_columna', 12),
                            'columnas_tabla': campo_data.get('columnas_tabla', []),
                            'is_active': True,
                            'empresa_id': empresa.id,
                        }
                        _, cf_created = CampoFormulario.objects.update_or_create(
                            plantilla=plantilla_obj,
                            nombre_campo=campo_data['nombre_campo'],
                            defaults=defaults,
                        )
                        if cf_created:
                            campos_created += 1
                    if campos_created:
                        self.stdout.write(self.style.SUCCESS(
                            f'    ✓ Campos formulario {maestra.codigo}: {campos_created} creados'
                        ))

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        parts = [f'{created_count} creadas', f'{updated_count} actualizadas']
        if skipped_count:
            parts.append(f'{skipped_count} personalizadas (no tocadas)')
        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Plantillas SGI: {", ".join(parts)} (total: {len(plantillas_maestras)})'
        ))
