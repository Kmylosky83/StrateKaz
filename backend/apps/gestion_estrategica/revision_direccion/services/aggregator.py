"""
Aggregator Service para Revisión por la Dirección.

Consolida resúmenes de TODOS los módulos C2 para generar el informe
que alimenta la Revisión por la Dirección según ISO 9001/14001/45001.

Usa apps.get_model() para evitar imports directos entre módulos C2.
Maneja módulos no instalados gracefully (disponible=False).
"""
import logging
from datetime import date, timedelta
from typing import Any

from django.apps import apps
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone

logger = logging.getLogger(__name__)


class RevisionDireccionAggregator:
    """
    Consolida resúmenes de TODOS los módulos C2 para la Revisión por la Dirección.

    Uso:
        aggregator = RevisionDireccionAggregator(fecha_desde, fecha_hasta)
        resultado = aggregator.consolidar()

    El resultado es un dict con las 15 entradas ISO para la revisión:
    1. Estado de acciones anteriores
    2. Cambios en contexto externo/interno
    3. Desempeño del SG (NCs, acciones correctivas, auditorías)
    4. Satisfacción del cliente
    5. Cumplimiento de objetivos
    6. No conformidades y acciones correctivas
    7. Resultados de auditorías
    8. Desempeño de proveedores
    9. Adecuación de recursos (presupuesto)
    10. Riesgos y oportunidades
    11. Cumplimiento legal
    12. Accidentalidad y SST
    13. Gestión ambiental
    14. Formación y competencias
    15. Talento humano
    """

    def __init__(self, fecha_desde: date = None, fecha_hasta: date = None):
        hoy = timezone.now().date()
        self.fecha_desde = fecha_desde or (hoy - timedelta(days=180))
        self.fecha_hasta = fecha_hasta or hoy

    def consolidar(self) -> dict:
        """
        Ejecuta todas las consolidaciones y retorna el informe completo.
        Cada módulo se ejecuta dentro de un try/except para
        que un fallo en un módulo no impida el resto.
        """
        periodo = {
            'fecha_desde': str(self.fecha_desde),
            'fecha_hasta': str(self.fecha_hasta),
        }

        modulos = {
            'cumplimiento_legal': self._resumen_cumplimiento,
            'riesgos_oportunidades': self._resumen_riesgos,
            'accidentalidad_sst': self._resumen_accidentalidad,
            'auditorias_mejora_continua': self._resumen_auditorias,
            'gestion_ambiental': self._resumen_ambiental,
            'calidad_no_conformidades': self._resumen_calidad,
            'gestion_comites': self._resumen_comites,
            'proveedores': self._resumen_proveedores,
            'formacion_capacitacion': self._resumen_formacion,
            'talento_humano': self._resumen_talento_humano,
            'satisfaccion_cliente': self._resumen_satisfaccion,
            'presupuesto_recursos': self._resumen_presupuesto,
            'planeacion_estrategica': self._resumen_planeacion,
            'contexto_organizacional': self._resumen_contexto,
        }

        resultado = {
            'periodo': periodo,
            'modulos': {},
            'resumen_ejecutivo': {},
        }

        modulos_disponibles = 0
        modulos_con_error = 0

        for nombre, funcion in modulos.items():
            try:
                data = funcion()
                resultado['modulos'][nombre] = {
                    'disponible': True,
                    'data': data,
                }
                modulos_disponibles += 1
            except Exception as e:
                logger.warning(
                    f'RevisionDireccionAggregator: Error en módulo {nombre}: {e}'
                )
                resultado['modulos'][nombre] = {
                    'disponible': False,
                    'data': {},
                    'error': str(e),
                }
                modulos_con_error += 1

        resultado['resumen_ejecutivo'] = {
            'total_modulos': len(modulos),
            'modulos_disponibles': modulos_disponibles,
            'modulos_con_error': modulos_con_error,
        }

        return resultado

    # =========================================================================
    # MÓDULOS INDIVIDUALES
    # =========================================================================

    def _get_model(self, app_label: str, model_name: str):
        """Obtiene un modelo usando apps.get_model (cross-module safe)."""
        return apps.get_model(app_label, model_name)

    def _resumen_cumplimiento(self) -> dict:
        """Requisitos legales y cumplimiento."""
        EmpresaRequisito = self._get_model('requisitos_legales', 'EmpresaRequisito')

        todos = EmpresaRequisito.objects.filter(is_active=True)
        total = todos.count()
        hoy = timezone.now().date()

        vigentes = todos.filter(estado='vigente').count()
        vencidos = todos.filter(
            fecha_vencimiento__lt=hoy,
            estado__in=['vigente', 'proximo_vencer', 'en_tramite']
        ).count()
        proximos_30d = todos.filter(
            fecha_vencimiento__range=[hoy, hoy + timedelta(days=30)]
        ).count()

        pct = round((vigentes / total * 100), 1) if total > 0 else 0

        por_estado = list(
            todos.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )

        nuevos = todos.filter(
            created_at__date__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        return {
            'total_requisitos': total,
            'vigentes': vigentes,
            'vencidos': vencidos,
            'proximos_vencer_30d': proximos_30d,
            'porcentaje_cumplimiento': pct,
            'por_estado': por_estado,
            'nuevos_en_periodo': nuevos,
        }

    def _resumen_riesgos(self) -> dict:
        """Riesgos de procesos y oportunidades."""
        RiesgoProceso = self._get_model('riesgos_procesos', 'RiesgoProceso')
        TratamientoRiesgo = self._get_model('riesgos_procesos', 'TratamientoRiesgo')
        Oportunidad = self._get_model('riesgos_procesos', 'Oportunidad')

        todos = RiesgoProceso.objects.all()
        total = todos.count()

        # Niveles
        niveles = {'BAJO': 0, 'MODERADO': 0, 'ALTO': 0, 'CRITICO': 0}
        for riesgo in todos:
            nivel = riesgo.interpretacion_residual
            if nivel in niveles:
                niveles[nivel] += 1

        por_estado = list(
            todos.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )

        tratamientos_activos = TratamientoRiesgo.objects.filter(
            estado__in=['pendiente', 'en_curso']
        ).count()

        nuevos = todos.filter(
            created_at__date__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        oportunidades = Oportunidad.objects.count()

        return {
            'total_riesgos': total,
            'por_nivel_residual': niveles,
            'criticos_y_altos': niveles['CRITICO'] + niveles['ALTO'],
            'por_estado': por_estado,
            'tratamientos_activos': tratamientos_activos,
            'nuevos_en_periodo': nuevos,
            'total_oportunidades': oportunidades,
        }

    def _resumen_accidentalidad(self) -> dict:
        """Accidentalidad y SST."""
        AccidenteTrabajo = self._get_model('accidentalidad', 'AccidenteTrabajo')
        IncidenteTrabajo = self._get_model('accidentalidad', 'IncidenteTrabajo')
        EnfermedadLaboral = self._get_model('accidentalidad', 'EnfermedadLaboral')

        accidentes = AccidenteTrabajo.objects.filter(
            fecha_evento__date__range=[self.fecha_desde, self.fecha_hasta]
        )
        total_at = accidentes.count()
        dias_incapacidad = accidentes.aggregate(
            total=Sum('dias_incapacidad')
        )['total'] or 0

        por_gravedad = {
            'leves': accidentes.filter(gravedad='LEVE').count(),
            'moderados': accidentes.filter(gravedad='MODERADO').count(),
            'graves': accidentes.filter(gravedad='GRAVE').count(),
            'mortales': accidentes.filter(mortal=True).count(),
        }

        incidentes = IncidenteTrabajo.objects.filter(
            fecha_evento__date__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        enfermedades = EnfermedadLaboral.objects.filter(
            fecha_diagnostico__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        return {
            'total_accidentes': total_at,
            'total_dias_incapacidad': dias_incapacidad,
            'por_gravedad': por_gravedad,
            'total_incidentes': incidentes,
            'total_enfermedades_laborales': enfermedades,
        }

    def _resumen_auditorias(self) -> dict:
        """Auditorías internas y mejora continua."""
        Auditoria = self._get_model('mejora_continua', 'Auditoria')
        Hallazgo = self._get_model('mejora_continua', 'Hallazgo')

        auditorias = Auditoria.objects.filter(
            fecha_planificada_inicio__range=[self.fecha_desde, self.fecha_hasta],
            is_active=True,
        )
        total = auditorias.count()

        por_estado = list(
            auditorias.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )
        por_tipo = list(
            auditorias.values('tipo').annotate(cantidad=Count('id')).order_by('-cantidad')
        )

        aud_ids = auditorias.values_list('id', flat=True)
        hallazgos = Hallazgo.objects.filter(auditoria_id__in=aud_ids)
        total_hallazgos = hallazgos.count()
        hallazgos_por_tipo = list(
            hallazgos.values('tipo').annotate(cantidad=Count('id')).order_by('-cantidad')
        )
        cerrados = hallazgos.filter(estado='CERRADO').count()
        pct_cierre = round((cerrados / total_hallazgos * 100), 1) if total_hallazgos > 0 else 0

        return {
            'total_auditorias': total,
            'por_estado': por_estado,
            'por_tipo': por_tipo,
            'hallazgos': {
                'total': total_hallazgos,
                'por_tipo': hallazgos_por_tipo,
                'cerrados': cerrados,
                'porcentaje_cierre': pct_cierre,
            },
        }

    def _resumen_ambiental(self) -> dict:
        """Gestión ambiental."""
        RegistroResiduo = self._get_model('gestion_ambiental', 'RegistroResiduo')
        ConsumoRecurso = self._get_model('gestion_ambiental', 'ConsumoRecurso')
        CertificadoAmbiental = self._get_model('gestion_ambiental', 'CertificadoAmbiental')

        residuos = RegistroResiduo.objects.filter(
            fecha__range=[self.fecha_desde, self.fecha_hasta]
        )
        generados = residuos.filter(tipo_movimiento='GENERACION')
        total_generado = generados.aggregate(total=Sum('cantidad'))['total'] or 0
        aprovechados = residuos.filter(tipo_movimiento='APROVECHAMIENTO')
        total_aprovechado = aprovechados.aggregate(total=Sum('cantidad'))['total'] or 0
        pct_aprovechamiento = round(
            (float(total_aprovechado) / float(total_generado) * 100), 1
        ) if total_generado > 0 else 0

        consumos = list(
            ConsumoRecurso.objects.filter(
                fecha__range=[self.fecha_desde, self.fecha_hasta]
            ).values('tipo_recurso__nombre').annotate(
                total=Sum('cantidad')
            ).order_by('-total')
        )

        certificados = CertificadoAmbiental.objects.filter(estado='VIGENTE').count()

        return {
            'residuos_generados_kg': float(total_generado),
            'residuos_aprovechados_kg': float(total_aprovechado),
            'porcentaje_aprovechamiento': pct_aprovechamiento,
            'consumos_recursos': consumos,
            'certificados_vigentes': certificados,
        }

    def _resumen_calidad(self) -> dict:
        """No conformidades y acciones correctivas."""
        NoConformidad = self._get_model('calidad', 'NoConformidad')
        AccionCorrectiva = self._get_model('calidad', 'AccionCorrectiva')

        ncs = NoConformidad.objects.filter(
            fecha_deteccion__range=[self.fecha_desde, self.fecha_hasta]
        )
        total = ncs.count()
        abiertas = ncs.exclude(estado__in=['CERRADA', 'CANCELADA']).count()
        cerradas = ncs.filter(estado='CERRADA').count()

        por_estado = list(
            ncs.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )
        por_tipo = list(
            ncs.values('tipo').annotate(cantidad=Count('id')).order_by('-cantidad')
        )
        por_severidad = list(
            ncs.values('severidad').annotate(cantidad=Count('id')).order_by('severidad')
        )

        acciones = AccionCorrectiva.objects.filter(
            fecha_planificada__range=[self.fecha_desde, self.fecha_hasta]
        )
        total_acciones = acciones.count()
        verificadas = acciones.filter(estado='VERIFICADA').count()
        pct_efect = round((verificadas / total_acciones * 100), 1) if total_acciones > 0 else 0

        return {
            'total_no_conformidades': total,
            'abiertas': abiertas,
            'cerradas': cerradas,
            'por_estado': por_estado,
            'por_tipo': por_tipo,
            'por_severidad': por_severidad,
            'acciones_correctivas': {
                'total': total_acciones,
                'verificadas': verificadas,
                'porcentaje_efectividad': pct_efect,
            },
        }

    def _resumen_comites(self) -> dict:
        """Gestión de comités."""
        Reunion = self._get_model('gestion_comites', 'Reunion')
        Compromiso = self._get_model('gestion_comites', 'Compromiso')

        reuniones = Reunion.objects.filter(
            fecha_programada__range=[self.fecha_desde, self.fecha_hasta]
        )
        total = reuniones.count()
        realizadas = reuniones.filter(estado='REALIZADA').count()
        pct = round((realizadas / total * 100), 1) if total > 0 else 0

        asistencia_prom = reuniones.filter(estado='REALIZADA').aggregate(
            promedio=Avg('num_asistentes')
        )['promedio'] or 0

        reunion_ids = reuniones.values_list('id', flat=True)
        compromisos = Compromiso.objects.filter(reunion_id__in=reunion_ids)
        total_comp = compromisos.count()
        cumplidos = compromisos.filter(estado='CUMPLIDO').count()

        return {
            'reuniones_programadas': total,
            'reuniones_realizadas': realizadas,
            'porcentaje_cumplimiento': pct,
            'asistencia_promedio': round(float(asistencia_prom), 1),
            'compromisos_total': total_comp,
            'compromisos_cumplidos': cumplidos,
        }

    def _resumen_proveedores(self) -> dict:
        """Desempeño de proveedores."""
        Proveedor = self._get_model('gestion_proveedores', 'Proveedor')
        EvaluacionProveedor = self._get_model('gestion_proveedores', 'EvaluacionProveedor')

        total_activos = Proveedor.objects.filter(
            is_active=True, deleted_at__isnull=True
        ).count()

        nuevos = Proveedor.objects.filter(
            created_at__date__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        evaluaciones = EvaluacionProveedor.objects.filter(
            fecha_evaluacion__range=[self.fecha_desde, self.fecha_hasta]
        )
        total_eval = evaluaciones.count()
        completadas = evaluaciones.filter(estado='COMPLETADA').count()
        promedio = evaluaciones.filter(
            calificacion_total__isnull=False
        ).aggregate(p=Avg('calificacion_total'))['p']

        return {
            'total_activos': total_activos,
            'nuevos_en_periodo': nuevos,
            'evaluaciones_total': total_eval,
            'evaluaciones_completadas': completadas,
            'calificacion_promedio': round(float(promedio), 1) if promedio else None,
        }

    def _resumen_formacion(self) -> dict:
        """Formación y capacitación."""
        ProgramacionCapacitacion = self._get_model(
            'formacion_reinduccion', 'ProgramacionCapacitacion'
        )
        EjecucionCapacitacion = self._get_model(
            'formacion_reinduccion', 'EjecucionCapacitacion'
        )
        Capacitacion = self._get_model('formacion_reinduccion', 'Capacitacion')

        programaciones = ProgramacionCapacitacion.objects.filter(
            fecha__range=[self.fecha_desde, self.fecha_hasta], is_active=True
        )
        total_prog = programaciones.count()
        completadas = programaciones.filter(estado='completada').count()
        pct = round((completadas / total_prog * 100), 1) if total_prog > 0 else 0

        # Total horas
        horas = Capacitacion.objects.filter(
            is_active=True,
            programaciones__fecha__range=[self.fecha_desde, self.fecha_hasta],
            programaciones__estado='completada',
        ).aggregate(total=Sum('duracion_horas'))['total'] or 0

        ejecuciones = EjecucionCapacitacion.objects.filter(
            programacion__fecha__range=[self.fecha_desde, self.fecha_hasta]
        )
        total_part = ejecuciones.count()
        asistieron = ejecuciones.filter(asistio=True).count()
        pct_asist = round((asistieron / total_part * 100), 1) if total_part > 0 else 0

        return {
            'programaciones_total': total_prog,
            'programaciones_completadas': completadas,
            'porcentaje_ejecucion': pct,
            'total_horas': horas,
            'participaciones': total_part,
            'porcentaje_asistencia': pct_asist,
        }

    def _resumen_talento_humano(self) -> dict:
        """Talento humano (colaboradores)."""
        Colaborador = self._get_model('colaboradores', 'Colaborador')

        todos = Colaborador.objects.filter(is_active=True)
        activos = todos.filter(estado='activo').count()

        nuevos = todos.filter(
            fecha_ingreso__range=[self.fecha_desde, self.fecha_hasta]
        ).count()
        retiros = Colaborador.objects.filter(
            fecha_retiro__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        promedio = (activos + activos + nuevos - retiros) / 2
        rotacion = round((retiros / promedio * 100), 1) if promedio > 0 else 0

        por_contrato = list(
            todos.filter(estado='activo').values('tipo_contrato')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')
        )

        return {
            'total_activos': activos,
            'nuevos_ingresos': nuevos,
            'retiros': retiros,
            'tasa_rotacion': rotacion,
            'por_tipo_contrato': por_contrato,
        }

    def _resumen_satisfaccion(self) -> dict:
        """Satisfacción del cliente (PQRS + encuestas)."""
        PQRS = self._get_model('servicio_cliente', 'PQRS')
        EstadoPQRS = self._get_model('servicio_cliente', 'EstadoPQRS')
        EncuestaSatisfaccion = self._get_model('servicio_cliente', 'EncuestaSatisfaccion')

        pqrs = PQRS.objects.filter(
            fecha_radicacion__date__range=[self.fecha_desde, self.fecha_hasta],
            deleted_at__isnull=True,
        )
        total = pqrs.count()

        por_tipo = list(
            pqrs.values('tipo__nombre').annotate(cantidad=Count('id')).order_by('-cantidad')
        )

        estados_finales = EstadoPQRS.objects.filter(es_final=True).values_list('id', flat=True)
        resueltas = pqrs.filter(estado_id__in=estados_finales).count()

        tiempo_prom = pqrs.filter(
            fecha_respuesta__isnull=False
        ).aggregate(p=Avg('dias_respuesta'))['p'] or 0

        encuestas = EncuestaSatisfaccion.objects.filter(
            fecha_envio__date__range=[self.fecha_desde, self.fecha_hasta]
        )
        respondidas = encuestas.filter(estado='RESPONDIDA').count()
        nps = encuestas.filter(nps_score__isnull=False).aggregate(
            p=Avg('nps_score')
        )['p']

        return {
            'total_pqrs': total,
            'por_tipo': por_tipo,
            'resueltas': resueltas,
            'tiempo_promedio_respuesta': round(float(tiempo_prom), 1),
            'encuestas_respondidas': respondidas,
            'nps_promedio': round(float(nps), 1) if nps else None,
        }

    def _resumen_presupuesto(self) -> dict:
        """Presupuesto y recursos financieros."""
        PresupuestoPorArea = self._get_model('presupuesto', 'PresupuestoPorArea')

        anio = timezone.now().year
        presupuestos = PresupuestoPorArea.objects.filter(
            anio=anio, is_active=True
        )

        totales = presupuestos.aggregate(
            asignado=Sum('monto_asignado'),
            ejecutado=Sum('monto_ejecutado'),
        )
        asignado = totales['asignado'] or 0
        ejecutado = totales['ejecutado'] or 0
        pct = round((float(ejecutado) / float(asignado) * 100), 1) if asignado > 0 else 0

        por_estado = list(
            presupuestos.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )

        return {
            'anio': anio,
            'total_asignado': float(asignado),
            'total_ejecutado': float(ejecutado),
            'saldo_disponible': float(asignado - ejecutado),
            'porcentaje_ejecucion': pct,
            'por_estado': por_estado,
        }

    def _resumen_planeacion(self) -> dict:
        """Planeación estratégica (objetivos)."""
        StrategicObjective = self._get_model('planeacion', 'StrategicObjective')
        KPIObjetivo = self._get_model('planeacion', 'KPIObjetivo')

        todos = StrategicObjective.objects.filter(is_active=True)
        total = todos.count()

        por_estado = list(
            todos.values('status').annotate(cantidad=Count('id')).order_by('status')
        )
        avance = todos.aggregate(p=Avg('progress'))['p'] or 0

        retrasados = todos.filter(status='RETRASADO').count()
        completados = todos.filter(status='COMPLETADO').count()

        por_perspectiva = list(
            todos.values('bsc_perspective').annotate(
                cantidad=Count('id'), avance=Avg('progress')
            ).order_by('bsc_perspective')
        )

        total_kpis = KPIObjetivo.objects.filter(is_active=True).count()

        return {
            'total_objetivos': total,
            'por_estado': por_estado,
            'avance_global': round(float(avance), 1),
            'retrasados': retrasados,
            'completados': completados,
            'por_perspectiva_bsc': por_perspectiva,
            'total_kpis': total_kpis,
        }

    def _resumen_contexto(self) -> dict:
        """Contexto organizacional (DOFA, PESTEL, partes interesadas)."""
        AnalisisDOFA = self._get_model('gestion_estrategica_contexto', 'AnalisisDOFA')
        FactorDOFA = self._get_model('gestion_estrategica_contexto', 'FactorDOFA')
        AnalisisPESTEL = self._get_model('gestion_estrategica_contexto', 'AnalisisPESTEL')
        ParteInteresada = self._get_model('gestion_estrategica_contexto', 'ParteInteresada')

        dofas = AnalisisDOFA.objects.filter(
            fecha_analisis__range=[self.fecha_desde, self.fecha_hasta]
        )
        total_dofa = dofas.count()

        factores = FactorDOFA.objects.filter(
            analisis__in=dofas, is_active=True
        )
        factores_por_tipo = list(
            factores.values('tipo_factor').annotate(cantidad=Count('id')).order_by('tipo_factor')
        )

        pesteles = AnalisisPESTEL.objects.filter(
            fecha_analisis__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        total_pi = ParteInteresada.objects.filter(is_active=True).count()
        nuevas_pi = ParteInteresada.objects.filter(
            created_at__date__range=[self.fecha_desde, self.fecha_hasta]
        ).count()

        return {
            'analisis_dofa': total_dofa,
            'factores_dofa': factores_por_tipo,
            'analisis_pestel': pesteles,
            'partes_interesadas_total': total_pi,
            'partes_interesadas_nuevas': nuevas_pi,
        }
