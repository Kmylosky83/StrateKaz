/**
 * ResumenEjecutivoCard — Resumen ejecutivo del informe consolidado
 *
 * Muestra:
 * - Score global del SIG como gauge ECharts
 * - Semáforo verde/amarillo/rojo
 * - KPIs principales en fila (NCs, IF, % Cumplimiento, % Objetivos)
 * - Radar chart por áreas del SIG
 * - Badge de módulos disponibles
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ShieldCheck, AlertTriangle, Target, Activity, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Badge, KpiCard, KpiCardGrid } from '@/components/common';
import { cn } from '@/utils/cn';
import { CHART_COLORS, SEMAFORO_COLORS, CHART_AXIS_COLORS } from '@/constants/chart-colors';
import type {
  ModulosConsolidados,
  ResumenEjecutivo,
} from '../../../../types/revision-direccion.types';

interface ResumenEjecutivoCardProps {
  modulos: ModulosConsolidados;
  resumen: ResumenEjecutivo;
  className?: string;
}

/**
 * Calcula un score global del SIG (0-100) basado en los datos de todos los módulos.
 * Ponderación:
 * - Cumplimiento legal: 15%
 * - Riesgos controlados: 15%
 * - Calidad (NCs cerradas): 15%
 * - Objetivos estratégicos: 15%
 * - Presupuesto ejecutado: 10%
 * - Formación: 10%
 * - Proveedores: 10%
 * - SST (sin accidentes graves): 10%
 */
function calcularScoreGlobal(modulos: ModulosConsolidados): number {
  let score = 0;
  let pesoTotal = 0;

  // Cumplimiento legal (15%)
  if (modulos.cumplimiento_legal.disponible) {
    const d = modulos.cumplimiento_legal.data;
    score += (d.porcentaje_cumplimiento / 100) * 15;
    pesoTotal += 15;
  }

  // Riesgos controlados (15%)
  if (modulos.riesgos_oportunidades.disponible) {
    const d = modulos.riesgos_oportunidades.data;
    const total = d.total_riesgos || 1;
    const controlados = total - d.criticos_y_altos;
    score += (controlados / total) * 15;
    pesoTotal += 15;
  }

  // Calidad (15%)
  if (modulos.calidad_no_conformidades.disponible) {
    const d = modulos.calidad_no_conformidades.data;
    const total = d.total_no_conformidades || 1;
    score += (d.cerradas / total) * 15;
    pesoTotal += 15;
  }

  // Objetivos (15%)
  if (modulos.planeacion_estrategica.disponible) {
    const d = modulos.planeacion_estrategica.data;
    score += (d.avance_global / 100) * 15;
    pesoTotal += 15;
  }

  // Presupuesto (10%)
  if (modulos.presupuesto_recursos.disponible) {
    const d = modulos.presupuesto_recursos.data;
    // Ideal: entre 80-100% ejecución
    const pct = Math.min(d.porcentaje_ejecucion, 100);
    score += (pct / 100) * 10;
    pesoTotal += 10;
  }

  // Formación (10%)
  if (modulos.formacion_capacitacion.disponible) {
    const d = modulos.formacion_capacitacion.data;
    score += (d.porcentaje_ejecucion / 100) * 10;
    pesoTotal += 10;
  }

  // Proveedores (10%)
  if (modulos.proveedores.disponible) {
    const d = modulos.proveedores.data;
    const calif = d.calificacion_promedio ?? 0;
    score += (Math.min(calif, 100) / 100) * 10;
    pesoTotal += 10;
  }

  // SST (10%)
  if (modulos.accidentalidad_sst.disponible) {
    const d = modulos.accidentalidad_sst.data;
    const graves = d.por_gravedad.graves + d.por_gravedad.mortales;
    const sst = graves === 0 ? 10 : Math.max(10 - graves * 2, 0);
    score += sst;
    pesoTotal += 10;
  }

  return pesoTotal > 0 ? Math.round((score / pesoTotal) * 100) : 0;
}

function getSemaforoState(score: number): {
  color: string;
  label: string;
  bgClass: string;
} {
  if (score >= 75) {
    return {
      color: SEMAFORO_COLORS.verde,
      label: 'Desempeño sobresaliente',
      bgClass: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
    };
  }
  if (score >= 50) {
    return {
      color: SEMAFORO_COLORS.amarillo,
      label: 'Requiere atención',
      bgClass: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
    };
  }
  return {
    color: SEMAFORO_COLORS.rojo,
    label: 'Acción inmediata requerida',
    bgClass: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
  };
}

export function ResumenEjecutivoCard({ modulos, resumen, className }: ResumenEjecutivoCardProps) {
  const scoreGlobal = useMemo(() => calcularScoreGlobal(modulos), [modulos]);
  const semaforo = useMemo(() => getSemaforoState(scoreGlobal), [scoreGlobal]);

  // Gauge ECharts option
  const gaugeOption = useMemo(() => {
    return {
      series: [
        {
          type: 'gauge',
          radius: '90%',
          center: ['50%', '55%'],
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 18,
              color: [
                [0.5, SEMAFORO_COLORS.rojo],
                [0.75, SEMAFORO_COLORS.amarillo],
                [1, SEMAFORO_COLORS.verde],
              ],
            },
          },
          pointer: {
            length: '65%',
            width: 6,
            itemStyle: { color: 'auto' },
          },
          axisTick: {
            length: 6,
            lineStyle: { color: 'auto', width: 1.5 },
          },
          splitLine: {
            length: 12,
            lineStyle: { color: 'auto', width: 2 },
          },
          axisLabel: {
            color: CHART_AXIS_COLORS.axisLabel,
            fontSize: 10,
            distance: 22,
          },
          title: {
            offsetCenter: [0, '80%'],
            fontSize: 13,
            color: CHART_AXIS_COLORS.title,
            fontWeight: 600,
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            offsetCenter: [0, '45%'],
            fontSize: 28,
            fontWeight: 'bold',
            color: semaforo.color,
          },
          data: [
            {
              value: scoreGlobal,
              name: 'Score Global SIG',
            },
          ],
        },
      ],
      animation: true,
      animationDuration: 2000,
      animationEasing: 'elasticOut',
    };
  }, [scoreGlobal, semaforo.color]);

  // Radar chart por área
  const radarOption = useMemo(() => {
    const indicators = [
      { name: 'Cumplimiento', max: 100 },
      { name: 'Riesgos', max: 100 },
      { name: 'Calidad', max: 100 },
      { name: 'SST', max: 100 },
      { name: 'Ambiental', max: 100 },
      { name: 'Objetivos', max: 100 },
      { name: 'Proveedores', max: 100 },
      { name: 'Formacion', max: 100 },
    ];

    const values: number[] = [];

    // Cumplimiento
    values.push(
      modulos.cumplimiento_legal.disponible
        ? modulos.cumplimiento_legal.data.porcentaje_cumplimiento
        : 0
    );

    // Riesgos (% controlados)
    if (modulos.riesgos_oportunidades.disponible) {
      const d = modulos.riesgos_oportunidades.data;
      const t = d.total_riesgos || 1;
      values.push(Math.round(((t - d.criticos_y_altos) / t) * 100));
    } else {
      values.push(0);
    }

    // Calidad (% NCs cerradas)
    if (modulos.calidad_no_conformidades.disponible) {
      const d = modulos.calidad_no_conformidades.data;
      const t = d.total_no_conformidades || 1;
      values.push(Math.round((d.cerradas / t) * 100));
    } else {
      values.push(0);
    }

    // SST
    if (modulos.accidentalidad_sst.disponible) {
      const d = modulos.accidentalidad_sst.data;
      const graves = d.por_gravedad.graves + d.por_gravedad.mortales;
      values.push(graves === 0 ? 100 : Math.max(100 - graves * 20, 0));
    } else {
      values.push(0);
    }

    // Ambiental
    if (modulos.gestion_ambiental.disponible) {
      values.push(modulos.gestion_ambiental.data.porcentaje_aprovechamiento);
    } else {
      values.push(0);
    }

    // Objetivos
    if (modulos.planeacion_estrategica.disponible) {
      values.push(modulos.planeacion_estrategica.data.avance_global);
    } else {
      values.push(0);
    }

    // Proveedores
    if (modulos.proveedores.disponible) {
      values.push(Math.min(modulos.proveedores.data.calificacion_promedio ?? 0, 100));
    } else {
      values.push(0);
    }

    // Formación
    if (modulos.formacion_capacitacion.disponible) {
      values.push(modulos.formacion_capacitacion.data.porcentaje_ejecucion);
    } else {
      values.push(0);
    }

    return {
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: CHART_AXIS_COLORS.axisLabel,
          fontSize: 10,
        },
        splitLine: {
          lineStyle: { color: CHART_AXIS_COLORS.splitLine },
        },
        splitArea: {
          show: true,
          areaStyle: { color: ['rgba(59,130,246,0.02)', 'rgba(59,130,246,0.05)'] },
        },
        axisLine: {
          lineStyle: { color: CHART_AXIS_COLORS.axisLine },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: 'Score SIG',
              areaStyle: {
                color: `${CHART_COLORS[0]}20`,
              },
              lineStyle: {
                color: CHART_COLORS[0],
                width: 2,
              },
              itemStyle: {
                color: CHART_COLORS[0],
              },
            },
          ],
        },
      ],
      animation: true,
    };
  }, [modulos]);

  // Quick KPIs extraídos
  const totalNCs = modulos.calidad_no_conformidades.disponible
    ? modulos.calidad_no_conformidades.data.abiertas
    : 0;
  const pctCumplimiento = modulos.cumplimiento_legal.disponible
    ? modulos.cumplimiento_legal.data.porcentaje_cumplimiento
    : 0;
  const pctObjetivos = modulos.planeacion_estrategica.disponible
    ? modulos.planeacion_estrategica.data.avance_global
    : 0;
  const totalAT = modulos.accidentalidad_sst.disponible
    ? modulos.accidentalidad_sst.data.total_accidentes
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn('overflow-hidden', className)} padding="none">
        {/* Top bar */}
        <div className={cn('px-6 py-4 border-b', semaforo.bgClass)}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6" style={{ color: semaforo.color }} />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Resumen Ejecutivo — Sistema Integrado de Gestion
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{semaforo.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={resumen.modulos_con_error > 0 ? 'warning' : 'success'} size="sm">
                <Layers className="w-3 h-3 mr-1" />
                {resumen.modulos_disponibles}/{resumen.total_modulos} modulos
              </Badge>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6">
          {/* Gauge + Radar row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gauge global */}
            <div className="flex flex-col items-center">
              <ReactECharts
                option={gaugeOption}
                style={{ height: 280, width: '100%' }}
                notMerge
                lazyUpdate
              />
            </div>

            {/* Radar chart */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Desempeno por Area del SIG
              </p>
              <ReactECharts
                option={radarOption}
                style={{ height: 260, width: '100%' }}
                notMerge
                lazyUpdate
              />
            </div>
          </div>

          {/* KPI cards row */}
          <KpiCardGrid columns={4}>
            <KpiCard
              label="NCs Abiertas"
              value={totalNCs}
              icon={<AlertTriangle className="w-5 h-5" />}
              color={totalNCs > 5 ? 'danger' : totalNCs > 0 ? 'warning' : 'success'}
              description={
                modulos.calidad_no_conformidades.disponible
                  ? `${modulos.calidad_no_conformidades.data.total_no_conformidades} total en periodo`
                  : 'Sin datos'
              }
            />
            <KpiCard
              label="Accidentes de Trabajo"
              value={totalAT}
              icon={<Activity className="w-5 h-5" />}
              color={totalAT > 0 ? 'danger' : 'success'}
              description={
                modulos.accidentalidad_sst.disponible
                  ? `${modulos.accidentalidad_sst.data.total_dias_incapacidad} dias incapacidad`
                  : 'Sin datos'
              }
            />
            <KpiCard
              label="Cumplimiento Legal"
              value={`${pctCumplimiento}%`}
              icon={<ShieldCheck className="w-5 h-5" />}
              color={
                pctCumplimiento >= 90 ? 'success' : pctCumplimiento >= 70 ? 'warning' : 'danger'
              }
              description={
                modulos.cumplimiento_legal.disponible
                  ? `${modulos.cumplimiento_legal.data.vencidos} vencidos`
                  : 'Sin datos'
              }
            />
            <KpiCard
              label="Avance Objetivos"
              value={`${pctObjetivos}%`}
              icon={<Target className="w-5 h-5" />}
              color={pctObjetivos >= 75 ? 'success' : pctObjetivos >= 50 ? 'warning' : 'danger'}
              description={
                modulos.planeacion_estrategica.disponible
                  ? `${modulos.planeacion_estrategica.data.retrasados} retrasados`
                  : 'Sin datos'
              }
            />
          </KpiCardGrid>
        </div>
      </Card>
    </motion.div>
  );
}
