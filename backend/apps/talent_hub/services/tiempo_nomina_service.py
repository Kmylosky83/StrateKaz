"""
Servicio de Integración: Control de Tiempo → Nómina

Integra los datos de asistencia, horas extras y consolidados con el módulo de nómina.
Permite crear DetalleLiquidacion desde datos de tiempo sin acoplamiento directo entre módulos.

Uso:
    datos = TiempoNominaService.obtener_datos_tiempo_para_nomina(
        colaborador_id=1, periodo_inicio=date(2026,2,1), periodo_fin=date(2026,2,28)
    )
    TiempoNominaService.crear_detalles_nomina_desde_tiempo(liquidacion, colaborador_id=1)
"""
from django.apps import apps
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class TiempoNominaService:
    """Integra datos de Control de Tiempo con Nómina."""

    @staticmethod
    def obtener_datos_tiempo_para_nomina(colaborador_id, periodo_inicio, periodo_fin):
        """
        Retorna datos consolidados de tiempo para liquidación de nómina.

        Args:
            colaborador_id: ID del colaborador
            periodo_inicio: Fecha inicio del período (date)
            periodo_fin: Fecha fin del período (date)

        Returns:
            dict con:
            - dias_trabajados: int
            - dias_ausencia: int
            - total_minutos_tardanza: int
            - horas_extras: dict por tipo (diurna, nocturna, etc.)
            - total_horas_extras: Decimal
            - total_horas_trabajadas: Decimal
            - porcentaje_asistencia: Decimal
        """
        RegistroAsistencia = apps.get_model('control_tiempo', 'RegistroAsistencia')
        HoraExtra = apps.get_model('control_tiempo', 'HoraExtra')

        # Registros de asistencia del período
        registros = RegistroAsistencia.objects.filter(
            colaborador_id=colaborador_id,
            fecha__gte=periodo_inicio,
            fecha__lte=periodo_fin,
            is_active=True
        )

        dias_trabajados = registros.filter(estado__in=['presente', 'tardanza']).count()
        dias_ausencia = registros.filter(estado='ausente').count()
        total_registros = registros.count()
        total_minutos_tardanza = sum(r.minutos_tardanza for r in registros)

        total_horas_trabajadas = sum(
            r.horas_trabajadas for r in registros.filter(estado__in=['presente', 'tardanza'])
        ) or Decimal('0.00')

        porcentaje_asistencia = Decimal('0.00')
        if total_registros > 0:
            porcentaje_asistencia = (Decimal(dias_trabajados) / Decimal(total_registros)) * Decimal('100')
            porcentaje_asistencia = round(porcentaje_asistencia, 2)

        # Horas extras aprobadas en el período
        horas_extras_qs = HoraExtra.objects.filter(
            colaborador_id=colaborador_id,
            fecha__gte=periodo_inicio,
            fecha__lte=periodo_fin,
            estado='aprobada',
            is_active=True
        )

        horas_extras_por_tipo = {}
        total_horas_extras = Decimal('0.00')

        for he in horas_extras_qs:
            tipo = he.tipo
            if tipo not in horas_extras_por_tipo:
                horas_extras_por_tipo[tipo] = {
                    'horas': Decimal('0.00'),
                    'factor_recargo': he.factor_recargo,
                    'tipo_display': he.get_tipo_display(),
                }
            horas_extras_por_tipo[tipo]['horas'] += he.horas_trabajadas
            total_horas_extras += he.horas_trabajadas

        return {
            'colaborador_id': colaborador_id,
            'periodo_inicio': periodo_inicio,
            'periodo_fin': periodo_fin,
            'dias_trabajados': dias_trabajados,
            'dias_ausencia': dias_ausencia,
            'total_registros': total_registros,
            'total_minutos_tardanza': total_minutos_tardanza,
            'total_horas_trabajadas': total_horas_trabajadas,
            'porcentaje_asistencia': porcentaje_asistencia,
            'horas_extras': horas_extras_por_tipo,
            'total_horas_extras': total_horas_extras,
        }

    @staticmethod
    def crear_detalles_nomina_desde_tiempo(liquidacion, colaborador_id):
        """
        Crea registros DetalleLiquidacion desde los datos de tiempo del colaborador.

        Busca horas extras aprobadas en el período de la liquidación que aún no
        estén vinculadas a otra liquidación, y crea DetalleLiquidacion por cada tipo.

        Args:
            liquidacion: instancia de LiquidacionNomina
            colaborador_id: ID del colaborador

        Returns:
            list de DetalleLiquidacion creados
        """
        HoraExtra = apps.get_model('control_tiempo', 'HoraExtra')
        DetalleLiquidacion = apps.get_model('nomina', 'DetalleLiquidacion')
        ConceptoNomina = apps.get_model('nomina', 'ConceptoNomina')

        periodo = liquidacion.periodo
        empresa = liquidacion.empresa

        # Horas extras aprobadas en el período
        horas_extras = HoraExtra.objects.filter(
            colaborador_id=colaborador_id,
            fecha__gte=periodo.fecha_inicio,
            fecha__lte=periodo.fecha_fin,
            estado='aprobada',
            is_active=True
        )

        if not horas_extras.exists():
            return []

        # Agrupar por tipo de hora extra
        horas_por_tipo = {}
        for he in horas_extras:
            tipo = he.tipo
            if tipo not in horas_por_tipo:
                horas_por_tipo[tipo] = {
                    'horas': Decimal('0.00'),
                    'factor_recargo': he.factor_recargo,
                    'tipo_display': he.get_tipo_display(),
                    'ids': [],
                }
            horas_por_tipo[tipo]['horas'] += he.horas_trabajadas
            horas_por_tipo[tipo]['ids'].append(he.id)

        # Mapeo tipo hora extra → categoría concepto nómina
        tipo_a_categoria = {
            'diurna': 'hora_extra',
            'nocturna': 'hora_extra',
            'dominical_diurna': 'hora_extra',
            'dominical_nocturna': 'hora_extra',
            'festivo_diurna': 'hora_extra',
            'festivo_nocturna': 'hora_extra',
        }

        detalles_creados = []

        for tipo, datos in horas_por_tipo.items():
            # Buscar o crear concepto de nómina para este tipo
            nombre_concepto = f'HE {datos["tipo_display"]}'
            concepto = ConceptoNomina.objects.filter(
                empresa=empresa,
                categoria='hora_extra',
                nombre__icontains=datos['tipo_display'][:20],
                is_active=True
            ).first()

            if not concepto:
                # Buscar concepto genérico de hora extra
                concepto = ConceptoNomina.objects.filter(
                    empresa=empresa,
                    categoria='hora_extra',
                    is_active=True
                ).first()

            if not concepto:
                logger.warning(
                    f'TiempoNominaService: No se encontró concepto de nómina para '
                    f'hora extra tipo {tipo} en empresa {empresa}'
                )
                continue

            # Calcular valor unitario (salario/240 * factor_recargo)
            try:
                salario_base = liquidacion.salario_base
                valor_hora_base = salario_base / Decimal('240')
                valor_unitario = valor_hora_base * datos['factor_recargo']
            except Exception:
                valor_unitario = Decimal('0.00')

            # Crear detalle
            try:
                detalle = DetalleLiquidacion.objects.create(
                    empresa=empresa,
                    liquidacion=liquidacion,
                    concepto=concepto,
                    cantidad=datos['horas'],
                    valor_unitario=valor_unitario,
                    valor_total=datos['horas'] * valor_unitario,
                    es_devengado=True,
                    observaciones=f'HE {datos["tipo_display"]}: {datos["horas"]:.2f}h x factor {datos["factor_recargo"]}',
                    created_by=liquidacion.created_by,
                )
                detalles_creados.append(detalle)

            except Exception as e:
                logger.error(
                    f'TiempoNominaService.crear_detalles_nomina_desde_tiempo: '
                    f'Error creando detalle para tipo {tipo}: {e}'
                )

        return detalles_creados

    @staticmethod
    def obtener_resumen_mensual_colaborador(colaborador_id, anio, mes):
        """
        Retorna el consolidado de asistencia para el dashboard de nómina.
        Usa el ConsolidadoAsistencia si existe; si no, calcula en tiempo real.

        Args:
            colaborador_id: ID del colaborador
            anio: int
            mes: int (1-12)

        Returns:
            dict con estadísticas del mes
        """
        ConsolidadoAsistencia = apps.get_model('control_tiempo', 'ConsolidadoAsistencia')

        try:
            consolidado = ConsolidadoAsistencia.objects.get(
                colaborador_id=colaborador_id,
                anio=anio,
                mes=mes,
                is_active=True
            )
            return {
                'fuente': 'consolidado',
                'dias_trabajados': consolidado.dias_trabajados,
                'dias_ausente': consolidado.dias_ausente,
                'dias_tardanza': consolidado.dias_tardanza,
                'total_horas_trabajadas': consolidado.total_horas_trabajadas,
                'total_horas_extras': consolidado.total_horas_extras,
                'total_minutos_tardanza': consolidado.total_minutos_tardanza,
                'porcentaje_asistencia': consolidado.porcentaje_asistencia,
                'cerrado': consolidado.cerrado,
            }
        except ConsolidadoAsistencia.DoesNotExist:
            # Calcular en tiempo real
            from datetime import date
            import calendar
            _, ultimo_dia = calendar.monthrange(anio, mes)
            periodo_inicio = date(anio, mes, 1)
            periodo_fin = date(anio, mes, ultimo_dia)

            datos = TiempoNominaService.obtener_datos_tiempo_para_nomina(
                colaborador_id, periodo_inicio, periodo_fin
            )
            datos['fuente'] = 'calculado'
            datos['cerrado'] = False
            return datos
