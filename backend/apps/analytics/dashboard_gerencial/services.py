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
from django.db.models import Avg, Count, Max, Q, Subquery, Sum
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
        now = timezone.now()
        año = now.year

        total = cls._safe_count('colaboradores', 'Colaborador', empresa_id)
        activos = cls._safe_count('colaboradores', 'Colaborador', empresa_id, estado='ACTIVO')

        # Formacion
        capacitaciones_año = 0
        qs = cls._safe_query('formacion_reinduccion', 'Capacitacion', empresa_id,
                             fecha_programada__year=año)
        if qs is not None:
            capacitaciones_año = qs.count()

        # Novedades pendientes
        novedades_pend = cls._safe_count('novedades', 'Novedad', empresa_id, estado='PENDIENTE')

        # Desempeño
        evaluaciones_completadas = cls._safe_count(
            'desempeno', 'EvaluacionDesempeno', empresa_id, estado='COMPLETADA')
        planes_mejora_activos = cls._safe_count(
            'desempeno', 'PlanMejora', empresa_id, estado='EN_CURSO')
        promedio_calificacion = None
        qs_eval = cls._safe_query('desempeno', 'EvaluacionDesempeno', empresa_id,
                                  estado='COMPLETADA', ciclo__year=año)
        if qs_eval is not None:
            agg = qs_eval.aggregate(promedio=Avg('calificacion_final'))
            promedio_calificacion = round(float(agg['promedio']), 2) if agg['promedio'] else None

        # Control Tiempo — asistencia mes actual
        porcentaje_asistencia = None
        qs_asist = cls._safe_query('control_tiempo', 'RegistroAsistencia', empresa_id,
                                   fecha__year=año, fecha__month=now.month)
        if qs_asist is not None:
            total_registros = qs_asist.count()
            asistio = qs_asist.filter(estado='PRESENTE').count()
            porcentaje_asistencia = round((asistio / total_registros * 100), 1) if total_registros > 0 else None

        # Selección
        procesos_activos = cls._safe_count(
            'seleccion_contratacion', 'VacanteActiva', empresa_id, estado='ABIERTA')
        contrataciones_mes = cls._safe_count(
            'colaboradores', 'Colaborador', empresa_id,
            fecha_ingreso__year=año, fecha_ingreso__month=now.month)

        # Rotación 12 meses
        hace_12m = now - timedelta(days=365)
        retiros_12m = cls._safe_count(
            'off_boarding', 'ProcesoRetiro', empresa_id, fecha_retiro__gte=hace_12m)
        rotacion_12m = round((retiros_12m / activos * 100), 1) if activos > 0 else 0

        return {
            'total_colaboradores': total,
            'colaboradores_activos': activos,
            'capacitaciones_año': capacitaciones_año,
            'novedades_pendientes': novedades_pend,
            'evaluaciones_completadas': evaluaciones_completadas,
            'promedio_calificacion': promedio_calificacion,
            'planes_mejora_activos': planes_mejora_activos,
            'porcentaje_asistencia': porcentaje_asistencia,
            'procesos_seleccion_activos': procesos_activos,
            'contrataciones_mes': contrataciones_mes,
            'retiros_12m': retiros_12m,
            'rotacion_12m': rotacion_12m,
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

        # Desglose por estado (valores lowercase del TextChoices)
        propuestos = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                     estado='propuesto')
        iniciacion = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                     estado='iniciacion')
        planificacion = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                        estado='planificacion')
        en_ejecucion = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                       estado='ejecucion')
        monitoreo = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                    estado='monitoreo')
        cierre = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                 estado='cierre')
        completados = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                      estado='completado')
        cancelados = cls._safe_count('gestion_proyectos', 'Proyecto', empresa_id,
                                     estado='cancelado')

        # Métricas EVM del último seguimiento por proyecto
        spi_promedio = None
        cpi_promedio = None
        seguimientos_qs = cls._safe_query(
            'gestion_proyectos', 'SeguimientoProyecto', empresa_id
        )
        if seguimientos_qs is not None:
            try:
                # Último seguimiento por proyecto (max id por proyecto)
                latest_seguimientos = seguimientos_qs.filter(
                    id__in=Subquery(
                        seguimientos_qs.values('proyecto').annotate(
                            latest_id=Max('id')
                        ).values('latest_id')
                    )
                )
                aggs = latest_seguimientos.aggregate(
                    spi_avg=Avg('spi'),
                    cpi_avg=Avg('cpi'),
                )
                spi_promedio = round(float(aggs['spi_avg']), 2) if aggs['spi_avg'] else None
                cpi_promedio = round(float(aggs['cpi_avg']), 2) if aggs['cpi_avg'] else None
            except Exception as e:
                logger.debug(f"Error calculando EVM stats: {e}")

        # Presupuesto total vs ejecutado
        presupuesto_total = 0
        costo_total = 0
        proyectos_qs = cls._safe_query('gestion_proyectos', 'Proyecto', empresa_id)
        if proyectos_qs is not None:
            try:
                aggs = proyectos_qs.aggregate(
                    pres_total=Sum('presupuesto_aprobado'),
                    costo_total=Sum('costo_real'),
                )
                presupuesto_total = float(aggs['pres_total'] or 0)
                costo_total = float(aggs['costo_total'] or 0)
            except Exception as e:
                logger.debug(f"Error calculando presupuesto stats: {e}")

        # Riesgos alto nivel
        riesgos_alto = cls._safe_count(
            'gestion_proyectos', 'RiesgoProyecto', empresa_id,
            nivel_riesgo__gte=15
        )

        # Lecciones aprendidas
        total_lecciones = cls._safe_count(
            'gestion_proyectos', 'LeccionAprendida', empresa_id
        )

        # Seguimientos con estado rojo (crítico)
        proyectos_criticos = 0
        if seguimientos_qs is not None:
            try:
                proyectos_criticos = seguimientos_qs.filter(
                    id__in=Subquery(
                        seguimientos_qs.values('proyecto').annotate(
                            latest_id=Max('id')
                        ).values('latest_id')
                    ),
                    estado_general='rojo',
                ).count()
            except Exception:
                pass

        # Tasa de cierre
        tasa_cierre = round((completados / total) * 100, 1) if total > 0 else 0

        return {
            'total_proyectos': total,
            'por_estado': {
                'propuestos': propuestos,
                'iniciacion': iniciacion,
                'planificacion': planificacion,
                'ejecucion': en_ejecucion,
                'monitoreo': monitoreo,
                'cierre': cierre,
                'completados': completados,
                'cancelados': cancelados,
            },
            'en_ejecucion': en_ejecucion + monitoreo,
            'completados': completados,
            'tasa_cierre': tasa_cierre,
            'evm': {
                'spi_promedio': spi_promedio,
                'cpi_promedio': cpi_promedio,
            },
            'presupuesto': {
                'total_aprobado': presupuesto_total,
                'total_ejecutado': costo_total,
                'variacion': round(
                    ((costo_total - presupuesto_total) / presupuesto_total) * 100, 1
                ) if presupuesto_total > 0 else 0,
            },
            'riesgos_alto_nivel': riesgos_alto,
            'lecciones_aprendidas': total_lecciones,
            'proyectos_criticos': proyectos_criticos,
        }
