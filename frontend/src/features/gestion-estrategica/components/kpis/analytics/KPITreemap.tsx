/**
 * KPITreemap - Jerarquía Interactiva con ECharts
 * Sistema de Gestión StrateKaz - Analytics Pro Edition
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { cn } from '@/utils/cn';
import type { StrategicObjective } from '../../../types/strategic.types';
import type { KPIObjetivo } from '../../../types/kpi.types';
import { SEMAFORO_COLORS, getBSCColor, formatValue } from '../../../types/kpi.types';

export interface KPITreemapProps {
  objectives: StrategicObjective[];
  kpis: KPIObjetivo[];
  colorBy?: 'progress' | 'semaforo' | 'bsc_perspective';
  height?: number;
  className?: string;
}

interface TreeNode {
  name: string;
  value: number;
  children?: TreeNode[];
  itemStyle?: {
    color?: string;
  };
  label?: {
    formatter?: string;
  };
}

export function KPITreemap({
  objectives,
  kpis,
  colorBy = 'semaforo',
  height = 600,
  className,
}: KPITreemapProps) {
  const treeData = useMemo(() => {
    if (objectives.length === 0 || kpis.length === 0) return [];

    // Agrupar por perspectiva BSC
    const bscGroups: Record<string, StrategicObjective[]> = {};

    objectives.forEach((obj) => {
      if (!bscGroups[obj.bsc_perspective]) {
        bscGroups[obj.bsc_perspective] = [];
      }
      bscGroups[obj.bsc_perspective].push(obj);
    });

    // Construir jerarquía: BSC → Objetivo → KPI
    const rootNodes: TreeNode[] = Object.entries(bscGroups).map(([perspective, objs]) => {
      const perspectiveKPIs = kpis.filter((kpi) => objs.some((obj) => obj.id === kpi.objective));

      const children: TreeNode[] = objs.map((obj) => {
        const objectiveKPIs = kpis.filter((kpi) => kpi.objective === obj.id);

        const kpiNodes: TreeNode[] = objectiveKPIs.map((kpi) => {
          const progress =
            kpi.last_value !== null && kpi.last_value !== undefined
              ? ((kpi.last_value || 0) / kpi.target_value) * 100
              : 0;

          let color: string;
          if (colorBy === 'progress') {
            // Color gradient según progreso
            if (progress >= 100) color = SEMAFORO_COLORS.VERDE;
            else if (progress >= 75)
              color = '#84cc16'; // verde claro
            else if (progress >= 50) color = SEMAFORO_COLORS.AMARILLO;
            else if (progress >= 25)
              color = '#f97316'; // naranja
            else color = SEMAFORO_COLORS.ROJO;
          } else if (colorBy === 'semaforo') {
            color = SEMAFORO_COLORS[kpi.status_semaforo];
          } else {
            color = getBSCColor(obj.bsc_perspective);
          }

          return {
            name: kpi.name,
            value: kpi.target_value,
            itemStyle: { color },
            label: {
              formatter: `{b}\n${formatValue(kpi.last_value, kpi.unit)}`,
            },
          };
        });

        return {
          name: `${obj.code} - ${obj.name}`,
          value: objectiveKPIs.reduce((sum, kpi) => sum + kpi.target_value, 0),
          children: kpiNodes,
          itemStyle: {
            color: getBSCColor(obj.bsc_perspective),
          },
        };
      });

      const bscLabels: Record<string, string> = {
        FINANCIERA: 'Perspectiva Financiera',
        CLIENTES: 'Perspectiva de Clientes',
        PROCESOS: 'Perspectiva de Procesos',
        APRENDIZAJE: 'Perspectiva de Aprendizaje',
      };

      return {
        name: bscLabels[perspective] || perspective,
        value: perspectiveKPIs.reduce((sum, kpi) => sum + kpi.target_value, 0),
        children,
        itemStyle: {
          color: getBSCColor(perspective),
        },
      };
    });

    return rootNodes;
  }, [objectives, kpis, colorBy]);

  const option = useMemo(() => {
    return {
      tooltip: {
        formatter: (info: { data: TreeNode }) => {
          return `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${info.data.name}</div>
            <div>Importancia: ${info.data.value.toFixed(0)}</div>
          </div>`;
        },
      },
      series: [
        {
          name: 'KPIs',
          type: 'treemap',
          visibleMin: 300,
          label: {
            show: true,
            formatter: '{b}',
          },
          upperLabel: {
            show: true,
            height: 30,
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            {
              itemStyle: {
                borderColor: '#777',
                borderWidth: 0,
                gapWidth: 1,
              },
              upperLabel: {
                show: false,
              },
            },
            {
              itemStyle: {
                borderColor: '#555',
                borderWidth: 4,
                gapWidth: 1,
              },
              emphasis: {
                itemStyle: {
                  borderColor: '#ddd',
                },
              },
            },
            {
              colorSaturation: [0.35, 0.5],
              itemStyle: {
                borderWidth: 5,
                gapWidth: 1,
                borderColorSaturation: 0.6,
              },
            },
          ],
          data: treeData,
        },
      ],
    };
  }, [treeData]);

  if (treeData.length === 0) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos disponibles para visualizar la jerarquía
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
    </Card>
  );
}
