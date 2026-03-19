"""
Seed: Tipos de Documento estándar del SGI (Sistema de Gestión Integral).

Crea en cada tenant los 12 tipos de documento base alineados con ISO 9001/14001/45001/27001.
Jerarquía documental:
  - ESTRATÉGICO: Políticas, Manuales, Planes, Reglamentos
  - TÁCTICO: Procedimientos, Guías, Programas
  - OPERATIVO: Instructivos, Formatos
  - SOPORTE: Actas, Registros, Base de Conocimiento

Idempotente — usa update_or_create con unique_together (empresa_id, codigo).
NO incluye CONTRATO_LABORAL (vive en seed_tipos_documento_th de Talent Hub).
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps


# ============================================================================
# CATÁLOGO DE TIPOS DE DOCUMENTO SGI
# ============================================================================

TIPOS_DOCUMENTO_SGI = [
    # ── NIVEL ESTRATÉGICO ─────────────────────────────────────
    {
        'codigo': 'POL',
        'nombre': 'Política',
        'descripcion': (
            'Declaraciones de intención y dirección de la alta dirección. '
            'Incluye política integral SGI, política de calidad, ambiental, '
            'SST, seguridad de la información y prevención de LAFT. '
            'Requisito ISO 9001 §5.2, ISO 14001 §5.2, ISO 45001 §5.2.'
        ),
        'nivel_documento': 'ESTRATEGICO',
        'prefijo_codigo': 'POL-',
        'requiere_aprobacion': True,
        'requiere_firma': True,
        'tiempo_retencion_años': 10,
        'color_identificacion': '#DC2626',
        'orden': 1,
    },
    {
        'codigo': 'MA',
        'nombre': 'Manual',
        'descripcion': (
            'Documento que describe el sistema de gestión de la organización. '
            'Incluye manual del SGI, manual de funciones y responsabilidades, '
            'manual de procesos. Referencia ISO 9001 §7.5, ISO 27001 §7.5.'
        ),
        'nivel_documento': 'ESTRATEGICO',
        'prefijo_codigo': 'MA-',
        'requiere_aprobacion': True,
        'requiere_firma': True,
        'tiempo_retencion_años': 10,
        'color_identificacion': '#7C3AED',
        'orden': 2,
    },
    {
        'codigo': 'PL',
        'nombre': 'Plan',
        'descripcion': (
            'Documento que establece objetivos, recursos y cronograma para '
            'alcanzar metas específicas. Incluye plan estratégico, plan de SST '
            '(Decreto 1072), plan de emergencias, plan de auditorías, plan de '
            'capacitación, plan ambiental. Requisito ISO 45001 §6.2, Res. 0312.'
        ),
        'nivel_documento': 'ESTRATEGICO',
        'prefijo_codigo': 'PL-',
        'requiere_aprobacion': True,
        'requiere_firma': True,
        'tiempo_retencion_años': 5,
        'color_identificacion': '#2563EB',
        'orden': 3,
    },
    {
        'codigo': 'RE',
        'nombre': 'Reglamento',
        'descripcion': (
            'Conjunto de normas internas de obligatorio cumplimiento. '
            'Incluye Reglamento Interno de Trabajo (CST Art. 104-125), '
            'Reglamento de Higiene y Seguridad Industrial (Ley 9/1979), '
            'reglamentos disciplinarios. Aprobación obligatoria por dirección.'
        ),
        'nivel_documento': 'ESTRATEGICO',
        'prefijo_codigo': 'RE-',
        'requiere_aprobacion': True,
        'requiere_firma': True,
        'tiempo_retencion_años': 10,
        'color_identificacion': '#B91C1C',
        'orden': 4,
    },
    # ── NIVEL TÁCTICO ─────────────────────────────────────────
    {
        'codigo': 'PR',
        'nombre': 'Procedimiento',
        'descripcion': (
            'Forma especificada de llevar a cabo una actividad o proceso. '
            'Describe el qué, quién, cuándo y cómo de los procesos del SGI. '
            'Requisito ISO 9001 §4.4.2, ISO 45001 §8.1. Estructura estándar: '
            'objetivo, alcance, responsables, descripción, registros asociados.'
        ),
        'nivel_documento': 'TACTICO',
        'prefijo_codigo': 'PR-',
        'requiere_aprobacion': True,
        'requiere_firma': True,
        'tiempo_retencion_años': 7,
        'color_identificacion': '#0891B2',
        'orden': 5,
    },
    {
        'codigo': 'GU',
        'nombre': 'Guía',
        'descripcion': (
            'Documento orientativo que proporciona recomendaciones o buenas '
            'prácticas. A diferencia del procedimiento, su cumplimiento no es '
            'obligatorio. Útil para estandarizar criterios sin rigidez normativa.'
        ),
        'nivel_documento': 'TACTICO',
        'prefijo_codigo': 'GU-',
        'requiere_aprobacion': True,
        'requiere_firma': False,
        'tiempo_retencion_años': 5,
        'color_identificacion': '#0D9488',
        'orden': 6,
    },
    {
        'codigo': 'PG',
        'nombre': 'Programa',
        'descripcion': (
            'Conjunto planificado de actividades con objetivos, metas, '
            'responsables y cronograma. Incluye programas de SST (Decreto 1072 '
            '§2.2.4.6.8), programa de capacitación, programa ambiental, '
            'programa de auditorías, programa PESV (Res. 40595). '
            'Requisito ISO 45001 §8.1, Res. 0312 §2.'
        ),
        'nivel_documento': 'TACTICO',
        'prefijo_codigo': 'PG-',
        'requiere_aprobacion': True,
        'requiere_firma': True,
        'tiempo_retencion_años': 5,
        'color_identificacion': '#7C3AED',
        'orden': 7,
    },
    # ── NIVEL OPERATIVO ───────────────────────────────────────
    {
        'codigo': 'IN',
        'nombre': 'Instructivo',
        'descripcion': (
            'Descripción detallada paso a paso de cómo realizar una tarea '
            'específica. Más granular que un procedimiento, enfocado en la '
            'operación directa. Incluye precauciones de seguridad, EPP '
            'requerido y criterios de aceptación.'
        ),
        'nivel_documento': 'OPERATIVO',
        'prefijo_codigo': 'IN-',
        'requiere_aprobacion': True,
        'requiere_firma': False,
        'tiempo_retencion_años': 5,
        'color_identificacion': '#059669',
        'orden': 8,
    },
    {
        'codigo': 'FT',
        'nombre': 'Formato',
        'descripcion': (
            'Plantilla estandarizada para recopilar información o registrar '
            'datos. El formato vacío es el documento controlado; una vez '
            'diligenciado se convierte en un registro (RG). Incluye listas '
            'de verificación, formularios de inspección, check-lists.'
        ),
        'nivel_documento': 'OPERATIVO',
        'prefijo_codigo': 'FT-',
        'requiere_aprobacion': False,
        'requiere_firma': False,
        'tiempo_retencion_años': 3,
        'color_identificacion': '#D97706',
        'orden': 9,
    },
    # ── NIVEL SOPORTE ─────────────────────────────────────────
    {
        'codigo': 'AC',
        'nombre': 'Acta',
        'descripcion': (
            'Documento que registra los temas tratados, decisiones tomadas '
            'y compromisos adquiridos en reuniones. Incluye actas de comités '
            '(COPASST, Comité de Convivencia, Revisión por la Dirección), '
            'actas de capacitación y actas de entrega. Requisito ISO 9001 §9.3.'
        ),
        'nivel_documento': 'SOPORTE',
        'prefijo_codigo': 'AC-',
        'requiere_aprobacion': False,
        'requiere_firma': True,
        'tiempo_retencion_años': 5,
        'color_identificacion': '#6B7280',
        'orden': 10,
    },
    {
        'codigo': 'RG',
        'nombre': 'Registro',
        'descripcion': (
            'Documento que presenta resultados obtenidos o proporciona '
            'evidencia de actividades realizadas. Es un formato (FT) '
            'diligenciado. Los registros son evidencia del SGI y no deben '
            'modificarse una vez aprobados. Requisito ISO 9001 §7.5.3.'
        ),
        'nivel_documento': 'SOPORTE',
        'prefijo_codigo': 'RG-',
        'requiere_aprobacion': False,
        'requiere_firma': False,
        'tiempo_retencion_años': 3,
        'color_identificacion': '#78716C',
        'orden': 11,
    },
    {
        'codigo': 'KB',
        'nombre': 'Base de Conocimiento',
        'descripcion': (
            'Documentación interna del sistema StrateKaz. Guías de usuario, '
            'tutoriales paso a paso, preguntas frecuentes y mejores prácticas '
            'para el uso de la plataforma. Generados automáticamente por el '
            'sistema con derechos de autor StrateKaz.'
        ),
        'nivel_documento': 'SOPORTE',
        'prefijo_codigo': 'KB-',
        'requiere_aprobacion': False,
        'requiere_firma': False,
        'tiempo_retencion_años': 3,
        'color_identificacion': '#6366F1',
        'orden': 12,
    },
]


class Command(BaseCommand):
    help = 'Crea los 12 Tipos de Documento estándar del SGI (ISO 9001/14001/45001/27001)'

    def handle(self, *args, **options):
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa(auto_create=True)
        if not empresa:
            self.stdout.write(self.style.WARNING(
                '  No se encontró empresa en el tenant actual'
            ))
            return

        TipoDocumento = apps.get_model('gestion_documental', 'TipoDocumento')

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for tipo_data in TIPOS_DOCUMENTO_SGI:
                codigo = tipo_data['codigo']
                defaults = {k: v for k, v in tipo_data.items() if k != 'codigo'}
                defaults['is_active'] = True

                _, was_created = TipoDocumento.objects.update_or_create(
                    empresa_id=empresa.id,
                    codigo=codigo,
                    defaults=defaults,
                )

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Tipos de Documento SGI: {created_count} creados, '
            f'{updated_count} actualizados (total: {len(TIPOS_DOCUMENTO_SGI)})'
        ))
