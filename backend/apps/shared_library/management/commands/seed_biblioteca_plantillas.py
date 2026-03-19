"""
Seed: Biblioteca Maestra de Plantillas StrateKaz (schema public).

Puebla la tabla shared_biblioteca_plantilla con las plantillas oficiales
StrateKaz para todos los tenants. Este seed corre UNA SOLA VEZ en public
(no es multi-tenant). Los tenants consumen estas plantillas via:
  - seed_plantillas_sgi (copia automática al crear/actualizar tenant)
  - endpoint importar-a-tenant (importación manual por el usuario)

Idempotente — usa update_or_create con codigo (unique).

PLANTILLAS ACTIVAS:
  1. POL-SGI-DEFAULT  → Política (FORMULARIO dinámico, 15 campos)

Las demás plantillas se irán agregando una por una conforme se definan.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.shared_library.models import BibliotecaPlantilla


# ============================================================================
# PLANTILLA: POLÍTICA (tipo FORMULARIO)
# ============================================================================
# Los campos se definen como JSON y se crean como CampoFormulario en cada tenant.
# Campos AUTO (empresa, código, versión, firmas) NO van aquí — los maneja el sistema.

POLITICA_CAMPOS = [
    # ── SECCIÓN: INFORMACIÓN GENERAL ──
    {
        'nombre_campo': 'seccion_info_general',
        'etiqueta': 'Información General',
        'tipo_campo': 'SECCION',
        'orden': 1,
        'ancho_columna': 12,
    },
    {
        'nombre_campo': 'marco_normativo',
        'etiqueta': 'Marco Normativo Aplicable',
        'tipo_campo': 'MULTISELECT',
        'opciones': [
            {'value': 'ISO9001', 'label': 'ISO 9001 — Calidad'},
            {'value': 'ISO14001', 'label': 'ISO 14001 — Medio Ambiente'},
            {'value': 'ISO45001', 'label': 'ISO 45001 — Seguridad y Salud en el Trabajo'},
            {'value': 'ISO27001', 'label': 'ISO 27001 — Seguridad de la Información'},
            {'value': 'D1072', 'label': 'Decreto 1072 — SG-SST'},
            {'value': 'RES0312', 'label': 'Resolución 0312 — Estándares Mínimos'},
        ],
        'es_obligatorio': True,
        'orden': 2,
        'ancho_columna': 12,
        'descripcion': 'Seleccione las normas que aplican a esta política.',
    },
    {
        'nombre_campo': 'frecuencia_revision',
        'etiqueta': 'Frecuencia de Revisión',
        'tipo_campo': 'SELECT',
        'opciones': [
            {'value': 'ANUAL', 'label': 'Anual'},
            {'value': 'SEMESTRAL', 'label': 'Semestral'},
            {'value': 'POR_CAMBIOS', 'label': 'Cuando haya cambios significativos'},
        ],
        'valor_por_defecto': 'ANUAL',
        'es_obligatorio': True,
        'orden': 3,
        'ancho_columna': 6,
        'descripcion': 'Periodicidad con la que se revisa y actualiza esta política.',
    },
    # ── SECCIÓN: CONTENIDO DE LA POLÍTICA ──
    {
        'nombre_campo': 'seccion_contenido',
        'etiqueta': 'Contenido de la Política',
        'tipo_campo': 'SECCION',
        'orden': 10,
        'ancho_columna': 12,
    },
    {
        'nombre_campo': 'objetivo',
        'etiqueta': 'Objetivo',
        'tipo_campo': 'TEXTAREA',
        'placeholder': 'Describa el propósito de esta política...',
        'es_obligatorio': True,
        'orden': 11,
        'ancho_columna': 12,
        'descripcion': 'Para qué existe esta política y qué propósito cumple dentro del SGI.',
    },
    {
        'nombre_campo': 'alcance',
        'etiqueta': 'Alcance',
        'tipo_campo': 'TEXTAREA',
        'placeholder': 'Aplica a todos los procesos, sedes y colaboradores de la organización...',
        'es_obligatorio': True,
        'orden': 12,
        'ancho_columna': 12,
        'descripcion': (
            'A quién aplica, qué procesos y sedes cubre. '
            'Se sugiere incluir la información de la empresa registrada en Fundación.'
        ),
    },
    {
        'nombre_campo': 'declaracion',
        'etiqueta': 'Declaración de la Política',
        'tipo_campo': 'TEXTAREA',
        'placeholder': 'La alta dirección de [empresa] se compromete a...',
        'es_obligatorio': True,
        'orden': 13,
        'ancho_columna': 12,
        'descripcion': (
            'El texto central de la política. Compromiso formal de la alta dirección. '
            'Es el corazón del documento.'
        ),
    },
    {
        'nombre_campo': 'compromisos',
        'etiqueta': 'Compromisos Específicos',
        'tipo_campo': 'TABLA',
        'orden': 14,
        'ancho_columna': 12,
        'descripcion': (
            'Lista de compromisos concretos de la organización. '
            'Cada uno asociado a la norma o requisito que cumple.'
        ),
        'columnas_tabla': [
            {'nombre_campo': 'compromiso', 'etiqueta': 'Compromiso', 'tipo_campo': 'TEXTAREA'},
            {
                'nombre_campo': 'norma_asociada',
                'etiqueta': 'Norma Asociada',
                'tipo_campo': 'SELECT',
                'opciones': [
                    {'value': 'ISO9001', 'label': 'ISO 9001'},
                    {'value': 'ISO14001', 'label': 'ISO 14001'},
                    {'value': 'ISO45001', 'label': 'ISO 45001'},
                    {'value': 'ISO27001', 'label': 'ISO 27001'},
                    {'value': 'D1072', 'label': 'Decreto 1072'},
                    {'value': 'GENERAL', 'label': 'General'},
                ],
            },
        ],
    },
    {
        'nombre_campo': 'comunicacion',
        'etiqueta': 'Comunicación y Disponibilidad',
        'tipo_campo': 'TEXTAREA',
        'valor_por_defecto': (
            'Esta política será comunicada a todos los niveles de la organización, '
            'estará disponible para las partes interesadas que lo requieran y '
            'será publicada en los medios internos de comunicación.'
        ),
        'es_obligatorio': True,
        'orden': 15,
        'ancho_columna': 12,
        'descripcion': 'Cómo se comunica la política y dónde estará disponible.',
    },
    # ── SECCIÓN: FIRMAS ──
    {
        'nombre_campo': 'seccion_firmas',
        'etiqueta': 'Responsables del Documento',
        'tipo_campo': 'SECCION',
        'orden': 20,
        'ancho_columna': 12,
    },
    {
        'nombre_campo': 'elaboro_nombre',
        'etiqueta': 'Elaboró — Nombre',
        'tipo_campo': 'TEXT',
        'placeholder': 'Nombre del responsable que elaboró',
        'es_obligatorio': True,
        'orden': 21,
        'ancho_columna': 6,
        'descripcion': 'Persona que redactó la política.',
    },
    {
        'nombre_campo': 'elaboro_cargo',
        'etiqueta': 'Elaboró — Cargo',
        'tipo_campo': 'TEXT',
        'placeholder': 'Cargo del responsable',
        'es_obligatorio': True,
        'orden': 22,
        'ancho_columna': 6,
    },
    {
        'nombre_campo': 'reviso_nombre',
        'etiqueta': 'Revisó — Nombre',
        'tipo_campo': 'TEXT',
        'placeholder': 'Nombre del responsable que revisó',
        'es_obligatorio': True,
        'orden': 23,
        'ancho_columna': 6,
        'descripcion': 'Persona que revisó y validó el contenido.',
    },
    {
        'nombre_campo': 'reviso_cargo',
        'etiqueta': 'Revisó — Cargo',
        'tipo_campo': 'TEXT',
        'placeholder': 'Cargo del responsable',
        'es_obligatorio': True,
        'orden': 24,
        'ancho_columna': 6,
    },
]

VARIABLES_POLITICA = [
    'marco_normativo', 'frecuencia_revision',
    'objetivo', 'alcance', 'declaracion', 'compromisos',
    'comunicacion', 'elaboro_nombre', 'elaboro_cargo',
    'reviso_nombre', 'reviso_cargo',
]


# ============================================================================
# CATÁLOGO DE PLANTILLAS — FUENTE ÚNICA DE VERDAD (SSOT)
# ============================================================================

BIBLIOTECA_PLANTILLAS = [
    {
        'codigo': 'POL-SGI-DEFAULT',
        'nombre': 'Política',
        'descripcion': (
            'Formulario para crear políticas del Sistema de Gestión. '
            'El usuario llena los campos (objetivo, alcance, declaración, '
            'compromisos) y el sistema genera el documento con encabezado, firmas '
            'y formato profesional. Requisito ISO 9001/14001/45001/27001 §5.2.'
        ),
        'tipo_documento_codigo': 'POL',
        'tipo_plantilla': 'FORMULARIO',
        'contenido_plantilla': '',
        'variables_disponibles': VARIABLES_POLITICA,
        'campos_formulario': POLITICA_CAMPOS,
        'categoria': 'POLITICA',
        'norma_iso_codigo': 'ISO9001',
        'orden': 1,
    },
]


class Command(BaseCommand):
    help = (
        'Puebla la Biblioteca Maestra (schema public) con las plantillas '
        'oficiales StrateKaz. SSOT para todos los tenants.'
    )

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        # Códigos obsoletos (plantillas que ya no existen en SSOT)
        codigos_activos = [p['codigo'] for p in BIBLIOTECA_PLANTILLAS]
        obsoletas = BibliotecaPlantilla.objects.filter(
            is_active=True,
        ).exclude(codigo__in=codigos_activos)
        if obsoletas.exists():
            count = obsoletas.update(is_active=False)
            self.stdout.write(self.style.WARNING(
                f'    ⚠ {count} plantillas obsoletas desactivadas'
            ))

        with transaction.atomic():
            for data in BIBLIOTECA_PLANTILLAS:
                _, was_created = BibliotecaPlantilla.objects.update_or_create(
                    codigo=data['codigo'],
                    defaults={
                        'nombre': data['nombre'],
                        'descripcion': data['descripcion'],
                        'tipo_documento_codigo': data['tipo_documento_codigo'],
                        'tipo_plantilla': data.get('tipo_plantilla', 'HTML'),
                        'contenido_plantilla': data['contenido_plantilla'],
                        'variables_disponibles': data['variables_disponibles'],
                        'campos_formulario': data.get('campos_formulario', []),
                        'categoria': data['categoria'],
                        'industria': 'GENERAL',
                        'norma_iso_codigo': data['norma_iso_codigo'],
                        'version': '1.0',
                        'is_active': True,
                        'orden': data['orden'],
                    },
                )

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Biblioteca Maestra: {created_count} creadas, '
            f'{updated_count} actualizadas (total: {len(BIBLIOTECA_PLANTILLAS)})'
        ))
