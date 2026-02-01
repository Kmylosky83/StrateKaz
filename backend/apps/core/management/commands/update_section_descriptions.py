"""
Comando para actualizar las descripciones de las secciones (TabSection) en la BD.

Uso:
    python manage.py update_section_descriptions
    python manage.py update_section_descriptions --dry-run  # Ver cambios sin aplicar
"""
from django.core.management.base import BaseCommand
from apps.core.models import TabSection


class Command(BaseCommand):
    help = 'Actualiza las descripciones de las secciones (TabSection) para mostrar subtítulos en el UI'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra los cambios sin aplicarlos',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        # Descripciones por código de sección (tab_code.section_code)
        DESCRIPTIONS = {
            # Organización
            'organizacion.areas': 'Estructura organizacional jerárquica',
            'organizacion.cargos': 'Puestos y niveles jerárquicos',
            'organizacion.organigrama': 'Vista gráfica de la estructura',
            'organizacion.colaboradores': 'Gestión del equipo de trabajo',
            'organizacion.consecutivos': 'Numeración automática de documentos',
            'organizacion.unidades_medida': 'Catálogo de unidades de medida',

            # Configuración
            'configuracion.empresa': 'Datos generales de la empresa',
            'configuracion.sedes': 'Ubicaciones físicas de la empresa',
            'configuracion.integraciones': 'Conexiones con sistemas externos',
            'configuracion.branding': 'Identidad visual y colores',
            'configuracion.normas-iso': 'Normas ISO y sistemas de gestión',
            'configuracion.modulos': 'Activar o desactivar funcionalidades',

            # Identidad Corporativa
            'identidad.mision_vision': 'Propósito y dirección de la organización',
            'identidad.valores': 'Principios que guían el comportamiento',
            'identidad.politicas': 'Lineamientos y directrices corporativas',

            # Planeación Estratégica
            'planeacion.plan_estrategico': 'Hoja de ruta estratégica',
            'planeacion.objetivos': 'Metas estratégicas de la organización',
            'planeacion.contexto': 'Análisis del entorno organizacional',
            'planeacion.dofa': 'Fortalezas, Debilidades, Oportunidades, Amenazas',
            'planeacion.pestel': 'Análisis del macroentorno',
            'planeacion.porter': 'Análisis competitivo del sector',

            # Gestión Documental
            'gestion_documental.tipos': 'Clasificación de documentos',
            'gestion_documental.documentos': 'Repositorio de documentos',
            'gestion_documental.plantillas': 'Formatos y modelos de documentos',
            'gestion_documental.control': 'Versionamiento y aprobaciones',

            # Planificación del Sistema
            'planificacion_sistema.plan_trabajo': 'Cronograma anual de actividades',
            'planificacion_sistema.objetivos': 'Metas del sistema de gestión',
            'planificacion_sistema.programas': 'Programas y planes de acción',
            'planificacion_sistema.seguimiento': 'Monitoreo de indicadores',
        }

        updated_count = 0
        skipped_count = 0

        for key, description in DESCRIPTIONS.items():
            tab_code, section_code = key.split('.')

            try:
                # Buscar la sección por tab_code y section_code
                sections = TabSection.objects.filter(
                    tab__code=tab_code,
                    code=section_code
                )

                if not sections.exists():
                    self.stdout.write(
                        self.style.WARNING(f'  Sección no encontrada: {key}')
                    )
                    continue

                for section in sections:
                    old_desc = section.description or '(vacío)'

                    if section.description == description:
                        skipped_count += 1
                        continue

                    if dry_run:
                        self.stdout.write(
                            f'  [DRY-RUN] {key}: "{old_desc}" -> "{description}"'
                        )
                    else:
                        section.description = description
                        section.save(update_fields=['description'])
                        self.stdout.write(
                            self.style.SUCCESS(f'  Updated {key}: "{description}"')
                        )

                    updated_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error en {key}: {e}')
                )

        # Resumen
        self.stdout.write('')
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'[DRY-RUN] Se actualizarían {updated_count} secciones')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Actualizadas {updated_count} secciones')
            )

        if skipped_count > 0:
            self.stdout.write(f'Omitidas {skipped_count} secciones (ya tenían la descripción correcta)')
