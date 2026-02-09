"""
CrossModuleStatsService - Servicio de estadisticas cross-module.

Agrega datos de TODOS los modulos del sistema en un unico dashboard.
Usa apps.get_model() para evitar dependencias circulares.
Este servicio es el nucleo del Sprint 2: "Romper Silos de Datos".
"""
import logging
from datetime import timedelta
from decimal import Decimal

from django.apps import apps
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

logger = logging.getLogger('analytics')


class CrossModuleStatsService:
    """
    Agrega estadisticas de todos los modulos del ERP.
    Todos los metodos son @classmethod para uso sin estado.
    """

    @classmethod
    def get_dashboard_completo(cls, empresa_id: int) -> dict:
        """
        Retorna el dashboard gerencial completo con datos de todos los modulos.
        """
        return {
            'timestamp': timezone.now().isoformat(),
            'empresa_id': empresa_id,
            'talent_hub': cls._get_talent_hub_stats(empresa_id),
            'hseq': cls._get_hseq_stats(empresa_id),
            'riesgos': cls._get_riesgos_stats(empresa_id),
            'cumplimiento': cls._get_cumplimiento_stats(empresa_id),
            'emergencias': cls._get_emergencias_stats(empresa_id),
            'workflow': cls._get_workflow_stats(empresa_id),
            'proyectos': cls._get_proyectos_stats(empresa_id),
        }

    @classmethod
    def _safe_query(cls, app_label: str, model_name: str, empresa_id: int, **filters):
        """Ejecuta una query de forma segura, retorna None si el modelo no existe."""
        try:
            Model = apps.get_model(app_label, model_name)
            return Model.objects.filter(empresa_id=empresa_id, **filters)
        except (LookupError, Exception) as e:
            logger.debug(f"Modelo {app_label}.{model_name} no disponible: {e}")
            return None

    @classmethod
    def _safe_count(cls, app_label: str, model_name: str, empresa_id: int, **filters) -> int:
        qs = cls._safe_query(app_label, model_name, empresa_id, **filters)
        return qs.count() if qs is not None else 0

    # =========================================================================
    # TALENT HUB
    # =========================================================================

    @classmethod
    def _get_talent_hub_stats(cls, empresa_id: int) -> dict:
        total = cls._safe_count('colaboradores', 'Colaborador', empresa_id)
        activos = cls._safe_count('colaboradores', 'Colaborador', empresa_id, estado='ACTIVO')

        # Formacion
        capacitaciones_año = 0
        qs = cls._safe_query('formacion_reinduccion', 'Capacitacion', empresa_id,
                             fecha_programada__year=timezone.now().year)
        if qs is not None:
            capacitaciones_año = qs.count()

        # Novedades pendientes
        novedades_pend = cls._safe_count('novedades', 'Novedad', empresa_id, estado='PENDIENTE')

        return {
            'total_colaboradores': total,
            'colaboradores_activos': activos,
            'capacitaciones_año': capacitaciones_año,
            'novedades_pendientes': novedades_pend,
        }

    # =========================================================================
    # HSEQ
    # =========================================================================

    @classmethod
    def _get_hseq_stats(cls, empresa_id: int) -> dict:
        año = timezone.now().year

        # Accidentalidad
        accidentes = cls._safe_count('accidentalidad', 'AccidenteTrabajo', empresa_id,
                                     fecha_evento__year=año)
        incidentes = cls._safe_count('accidentalidad', 'IncidenteTrabajo', empresa_id,
                                     fecha_evento__year=año)

        # Medicina Laboral
        examenes_pendientes = cls._safe_count('medicina_laboral', 'ExamenMedico', empresa_id,
                                              estado='PROGRAMADO')
        restricciones_activas = cls._safe_count('medicina_laboral', 'RestriccionMedica', empresa_id,
                                                estado='ACTIVA')

        # Calidad
        nc_abiertas = cls._safe_count('calidad', 'NoConformidad', empresa_id,
                                      estado='ABIERTA')

        # Seguridad Industrial
        inspecciones_pendientes = cls._safe_count('seguridad_industrial', 'Inspeccion', empresa_id,
                                                  estado='PROGRAMADA')

        return {
            'accidentes_año': accidentes,
            'incidentes_año': incidentes,
            'examenes_pendientes': examenes_pendientes,
            'restricciones_activas': restricciones_activas,
            'no_conformidades_abiertas': nc_abiertas,
            'inspecciones_pendientes': inspecciones_pendientes,
        }

    # =========================================================================
    # RIESGOS
    # =========================================================================

    @classmethod
    def _get_riesgos_stats(cls, empresa_id: int) -> dict:
        # IPEVR
        riesgos_altos = 0
        qs = cls._safe_query('ipevr', 'EvaluacionRiesgo', empresa_id)
        if qs is not None:
            riesgos_altos = qs.filter(
                Q(nivel_riesgo_residual='ALTO') | Q(nivel_riesgo_residual='MUY_ALTO')
            ).count()

        # Aspectos ambientales significativos
        aspectos_sig = cls._safe_count('aspectos_ambientales', 'AspectoAmbiental', empresa_id,
                                       significativo=True)

        # Riesgos procesos
        riesgos_proc_altos = 0
        qs2 = cls._safe_query('riesgos_procesos', 'RiesgoProceso', empresa_id)
        if qs2 is not None:
            riesgos_proc_altos = qs2.filter(
                Q(nivel_riesgo_residual='ALTO') | Q(nivel_riesgo_residual='MUY_ALTO')
            ).count()

        return {
            'ipevr_riesgos_altos': riesgos_altos,
            'aspectos_ambientales_significativos': aspectos_sig,
            'riesgos_procesos_altos': riesgos_proc_altos,
        }

    # =========================================================================
    # CUMPLIMIENTO
    # =========================================================================

    @classmethod
    def _get_cumplimiento_stats(cls, empresa_id: int) -> dict:
        total_requisitos = cls._safe_count('requisitos_legales', 'RequisitoLegal', empresa_id,
                                           activo=True)
        cumplidos = cls._safe_count('requisitos_legales', 'RequisitoLegal', empresa_id,
                                    activo=True, estado_cumplimiento='CUMPLE')
        porcentaje = round((cumplidos / total_requisitos * 100), 1) if total_requisitos > 0 else 0

        return {
            'total_requisitos': total_requisitos,
            'requisitos_cumplidos': cumplidos,
            'porcentaje_cumplimiento': porcentaje,
        }

    # =========================================================================
    # EMERGENCIAS
    # =========================================================================

    @classmethod
    def _get_emergencias_stats(cls, empresa_id: int) -> dict:
        año = timezone.now().year

        simulacros = cls._safe_count('emergencias', 'Simulacro', empresa_id,
                                     fecha_programada__year=año)
        simulacros_realizados = cls._safe_count('emergencias', 'Simulacro', empresa_id,
                                                fecha_programada__year=año,
                                                estado__in=['REALIZADO', 'EVALUADO'])
        brigadas_activas = cls._safe_count('emergencias', 'Brigada', empresa_id,
                                           estado='ACTIVA')
        recursos_operativos = cls._safe_count('emergencias', 'RecursoEmergencia', empresa_id,
                                              estado='OPERATIVO')

        return {
            'simulacros_programados': simulacros,
            'simulacros_realizados': simulacros_realizados,
            'brigadas_activas': brigadas_activas,
            'recursos_operativos': recursos_operativos,
        }

    # =========================================================================
    # WORKFLOW
    # =========================================================================

    @classmethod
    def _get_workflow_stats(cls, empresa_id: int) -> dict:
        qs = cls._safe_query('ejecucion', 'InstanciaFlujo', empresa_id)
        if qs is None:
            return {'total_instancias': 0, 'en_progreso': 0, 'completadas': 0}

        total = qs.count()
        en_progreso = qs.filter(estado='EN_PROGRESO').count()
        completadas = qs.filter(estado='COMPLETADO').count()

        # Tareas pendientes
        tareas_pend = cls._safe_count('ejecucion', 'TareaActiva', empresa_id,
                                      estado__in=['PENDIENTE', 'EN_PROGRESO'])

        return {
            'total_instancias': total,
            'en_progreso': en_progreso,
            'completadas': completadas,
            'tareas_pendientes': tareas_pend,
        }

    # =========================================================================
    # PROYECTOS
    # =========================================================================

    @classmethod
    def _get_proyectos_stats(cls, empresa_id: int) -> dict:
        total = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id)
        en_ejecucion = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                       estado='EN_EJECUCION')
        completados = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                      estado='COMPLETADO')

        return {
            'total_proyectos': total,
            'en_ejecucion': en_ejecucion,
            'completados': completados,
        }
