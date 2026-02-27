"""
Seed command para crear los consecutivos del sistema.

Crea los ConsecutivoConfig base definidos en CONSECUTIVOS_SISTEMA
más los consecutivos adicionales referenciados en módulos de negocio.

Uso:
    python manage.py seed_consecutivos_sistema
"""
from django.core.management.base import BaseCommand
from django.db import transaction


# Consecutivos adicionales referenciados en módulos pero no definidos en el modelo
CONSECUTIVOS_ADICIONALES = [
    {
        'codigo': 'REQUISICION_COMPRA',
        'nombre': 'Requisición de Compra',
        'categoria': 'COMPRAS',
        'prefix': 'RC',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PROGRAMACION_ABASTECIMIENTO',
        'nombre': 'Programación de Abastecimiento',
        'categoria': 'COMPRAS',
        'prefix': 'PA',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PRUEBA_ACIDEZ',
        'nombre': 'Prueba de Acidez',
        'categoria': 'CALIDAD',
        'prefix': 'PAC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'MOVIMIENTO_INV',
        'nombre': 'Movimiento de Inventario',
        'categoria': 'INVENTARIO',
        'prefix': 'MOV',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PQRS',
        'nombre': 'PQRS',
        'categoria': 'VENTAS',
        'prefix': 'PQR',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'ENCUESTA_SATISFACCION',
        'nombre': 'Encuesta de Satisfacción',
        'categoria': 'VENTAS',
        'prefix': 'ENC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'RECEPCION_MATERIA_PRIMA',
        'nombre': 'Recepción de Materia Prima',
        'categoria': 'PRODUCCION',
        'prefix': 'RMP',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'LOTE_PRODUCCION',
        'nombre': 'Lote de Producción',
        'categoria': 'PRODUCCION',
        'prefix': 'LOT',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'ACTIVO_PRODUCCION',
        'nombre': 'Activo de Producción',
        'categoria': 'PRODUCCION',
        'prefix': 'ACT',
        'padding': 4,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'EQUIPO_MEDICION',
        'nombre': 'Equipo de Medición',
        'categoria': 'PRODUCCION',
        'prefix': 'EM',
        'padding': 4,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'ORDEN_TRABAJO',
        'nombre': 'Orden de Trabajo',
        'categoria': 'PRODUCCION',
        'prefix': 'OT',
        'padding': 5,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    # ── Talent Hub ──────────────────────────────────────────
    {
        'codigo': 'CICLO_EVALUACION',
        'nombre': 'Ciclo de Evaluación',
        'categoria': 'RRHH',
        'prefix': 'CICLO',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PLAN_MEJORA',
        'nombre': 'Plan de Mejora Individual',
        'categoria': 'RRHH',
        'prefix': 'PM',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'CAPACITACION',
        'nombre': 'Capacitación',
        'categoria': 'RRHH',
        'prefix': 'CAP',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'PLAN_FORMACION',
        'nombre': 'Plan de Formación',
        'categoria': 'RRHH',
        'prefix': 'PF',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'TURNO',
        'nombre': 'Turno Laboral',
        'categoria': 'RRHH',
        'prefix': 'TUR',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'CONCEPTO_NOMINA',
        'nombre': 'Concepto de Nómina',
        'categoria': 'RRHH',
        'prefix': 'CN',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'MODULO_INDUCCION',
        'nombre': 'Módulo de Inducción',
        'categoria': 'RRHH',
        'prefix': 'MOD',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    # ── HSEQ ────────────────────────────────────────────────
    {
        'codigo': 'PROGRAMA_AUDITORIA',
        'nombre': 'Programa de Auditoría',
        'categoria': 'CALIDAD',
        'prefix': 'PA',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'AUDITORIA',
        'nombre': 'Auditoría Interna',
        'categoria': 'CALIDAD',
        'prefix': 'AUD',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'HALLAZGO',
        'nombre': 'Hallazgo de Auditoría',
        'categoria': 'CALIDAD',
        'prefix': 'HAL',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'EVAL_CUMPLIMIENTO',
        'nombre': 'Evaluación de Cumplimiento',
        'categoria': 'CALIDAD',
        'prefix': 'EC',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'CONTROL_EXPOSICION',
        'nombre': 'Control de Exposición',
        'categoria': 'SST',
        'prefix': 'CE',
        'padding': 4,
        'include_year': True,
        'reset_yearly': True,
        'es_sistema': True,
    },
    {
        'codigo': 'TIPO_AGENTE',
        'nombre': 'Tipo de Agente',
        'categoria': 'SST',
        'prefix': 'TA',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    # ── Analytics ───────────────────────────────────────────
    {
        'codigo': 'CATALOGO_KPI',
        'nombre': 'Catálogo de KPI',
        'categoria': 'GENERAL',
        'prefix': 'KPI',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'VISTA_DASHBOARD',
        'nombre': 'Vista de Dashboard',
        'categoria': 'GENERAL',
        'prefix': 'DASH',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'PLANTILLA_INFORME',
        'nombre': 'Plantilla de Informe',
        'categoria': 'GENERAL',
        'prefix': 'INF',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    # ── Admin Finance ───────────────────────────────────────
    {
        'codigo': 'CENTRO_COSTO',
        'nombre': 'Centro de Costo',
        'categoria': 'CONTABILIDAD',
        'prefix': 'CC',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    # ── Audit System ────────────────────────────────────────
    {
        'codigo': 'TIPO_NOTIFICACION',
        'nombre': 'Tipo de Notificación',
        'categoria': 'GENERAL',
        'prefix': 'TN',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    # ── Gestión Documental (catálogos) ──────────────────────
    {
        'codigo': 'TIPO_DOCUMENTO',
        'nombre': 'Tipo de Documento',
        'categoria': 'DOCUMENTOS',
        'prefix': 'TD',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
    {
        'codigo': 'PLANTILLA_DOCUMENTO',
        'nombre': 'Plantilla de Documento',
        'categoria': 'DOCUMENTOS',
        'prefix': 'PLT',
        'padding': 3,
        'include_year': False,
        'reset_yearly': False,
        'es_sistema': True,
    },
]


class Command(BaseCommand):
    help = 'Crea los consecutivos del sistema (base + módulos de negocio)'

    def handle(self, *args, **options):
        from apps.gestion_estrategica.organizacion.models_consecutivos import (
            ConsecutivoConfig,
            CONSECUTIVOS_SISTEMA,
        )
        from apps.gestion_estrategica.configuracion.models import EmpresaConfig

        empresa = EmpresaConfig.objects.first()
        if not empresa:
            self.stderr.write(self.style.ERROR('No existe EmpresaConfig en este tenant.'))
            return

        all_consecutivos = CONSECUTIVOS_SISTEMA + CONSECUTIVOS_ADICIONALES
        created = 0
        skipped = 0

        with transaction.atomic():
            for data in all_consecutivos:
                codigo = data['codigo']
                if ConsecutivoConfig.objects.filter(codigo=codigo, empresa_id=empresa.id).exists():
                    skipped += 1
                    continue

                ConsecutivoConfig.objects.create(empresa_id=empresa.id, **data)
                self.stdout.write(self.style.SUCCESS(f'  [OK] {codigo}'))
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nConsecutivos: {created} creados, {skipped} existentes'
        ))
