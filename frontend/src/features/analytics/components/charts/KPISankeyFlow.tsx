/**
 * KPISankeyFlow - Diagrama Sankey de Flujo Causa-Efecto
 * Visualiza relaciones entre perspectivas BSC, objetivos y KPIs
 *
 * Sistema de Gestión StrateKaz - Analytics Enterprise Edition
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { cn } from '@/utils/cn';
import { Workflow } from 'lucide-react';
import type { EChartsOption } from 'echarts';

// ==================== TIPOS ====================

export interface SankeyNode {
  id: string;
  name: string;
  type: 'perspective' | 'objective' | 'kpi' | 'outcome';
  value?: number;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

export interface KPISankeyFlowProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  title?: string;
  orientation?: 'horizontal' | 'vertical';
  height?: number;
  className?: string;
  onNodeClick?: (node: SankeyNode) => void;
}

// ==================== COLORES ====================

const TYPE_COLORS = {
  perspective: '#8b5cf6', // Violeta
  objective: '#3b82f6',   // Azul
  kpi: '#10b981',         // Verde
  outcome: '#f59e0b',     // Amarillo/Naranja
};

const BSC_COLORS: Record<string, string> = {
  FINANCIERA: '#10b981',
  CLIENTES: '#3b82f6',
  PROCESOS: '#f59e0b',
  APRENDIZAJE: '#8b5cf6',
};

// ==================== COMPONENTE ====================

export function KPISankeyFlow({
  nodes,
  links,
  title = 'Flujo Estratégico',
  orientation = 'horizontal',
  height = 500,
  className,
  onNodeClick,
}: KPISankeyFlowProps) {
  // Preparar datos para ECharts
  const option = useMemo<EChartsOption>(() => {
    // Procesar nodos
    const echartsNodes = nodes.map(node => ({
      name: node.name,
      itemStyle: {
        color: node.color || TYPE_COLORS[node.type],
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        fontSize: 11,
        color: '#374151',
      },
    }));

    // Procesar links
    const echartsLinks = links.map(link => ({
      source: link.source,
      target: link.target,
      value: link.value,
      lineStyle: {
        color: 'gradient',
        opacity: 0.4,
      },
      emphasis: {
        lineStyle: {
          opacity: 0.7,
        },
      },
    }));

    return {
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#1f2937',
        },
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const node = nodes.find(n => n.name === params.name);
            const typeLabels = {
              perspective: 'Perspectiva BSC',
              objective: 'Objetivo Estratégico',
              kpi: 'Indicador (KPI)',
              outcome: 'Resultado',
            };

            return `
              <div style="padding: 8px; min-width: 180px;">
                <div style="font-weight: bold; margin-bottom: 6px;">
                  ${params.name}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #6b7280;">Tipo:</span>
                  <span>${node ? typeLabels[node.type] : ''}</span>
                </div>
                ${node?.value !== undefined ? `
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280;">Valor:</span>
                    <strong>${node.value}</strong>
                  </div>
                ` : ''}
              </div>
            `;
          } else {
            // Es un enlace
            const link = links.find(
              l => l.source === params.data.source && l.target === params.data.target
            );

            return `
              <div style="padding: 8px; min-width: 200px;">
                <div style="font-weight: bold; margin-bottom: 8px;">
                  Relación
                </div>
                <div style="margin-bottom: 4px;">
                  <span style="color: #6b7280;">Desde:</span>
                  <span style="font-weight: 500;"> ${params.data.source}</span>
                </div>
                <div style="margin-bottom: 4px;">
                  <span style="color: #6b7280;">Hacia:</span>
                  <span style="font-weight: 500;"> ${params.data.target}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Peso:</span>
                  <strong>${params.data.value}</strong>
                </div>
                ${link?.label ? `
                  <div style="margin-top: 4px; font-size: 11px; color: #6b7280;">
                    ${link.label}
                  </div>
                ` : ''}
              </div>
            `;
          }
        },
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          orient: orientation,
          emphasis: {
            focus: 'adjacency',
          },
          nodeAlign: 'left',
          nodeGap: 15,
          nodeWidth: 20,
          layoutIterations: 32,
          data: echartsNodes,
          links: echartsLinks,
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
          },
          label: {
            show: true,
            position: orientation === 'horizontal' ? 'right' : 'bottom',
            fontSize: 11,
            color: '#374151',
            formatter: (params: any) => {
              // Truncar nombres largos
              const name = params.name;
              return name.length > 25 ? name.substring(0, 22) + '...' : name;
            },
          },
          levels: [
            {
              depth: 0,
              itemStyle: { color: TYPE_COLORS.perspective },
              lineStyle: { color: 'source', opacity: 0.4 },
            },
            {
              depth: 1,
              itemStyle: { color: TYPE_COLORS.objective },
              lineStyle: { color: 'source', opacity: 0.4 },
            },
            {
              depth: 2,
              itemStyle: { color: TYPE_COLORS.kpi },
              lineStyle: { color: 'source', opacity: 0.4 },
            },
            {
              depth: 3,
              itemStyle: { color: TYPE_COLORS.outcome },
              lineStyle: { color: 'source', opacity: 0.4 },
            },
          ],
        },
      ],
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicOut',
    };
  }, [nodes, links, title, orientation]);

  const handleChartClick = (params: any) => {
    if (params.dataType === 'node' && onNodeClick) {
      const node = nodes.find(n => n.name === params.name);
      if (node) {
        onNodeClick(node);
      }
    }
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const byType = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalFlow = links.reduce((sum, link) => sum + link.value, 0);

    return {
      perspectives: byType.perspective || 0,
      objectives: byType.objective || 0,
      kpis: byType.kpi || 0,
      outcomes: byType.outcome || 0,
      totalLinks: links.length,
      totalFlow,
    };
  }, [nodes, links]);

  if (nodes.length === 0 || links.length === 0) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          No hay datos disponibles para visualizar el flujo
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Leyenda de tipos */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        {Object.entries(TYPE_COLORS).map(([type, color]) => {
          const labels: Record<string, string> = {
            perspective: 'Perspectiva',
            objective: 'Objetivo',
            kpi: 'KPI',
            outcome: 'Resultado',
          };
          return (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {labels[type]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-purple-600">{stats.perspectives}</p>
          <p className="text-xs text-gray-500">Perspectivas</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-blue-600">{stats.objectives}</p>
          <p className="text-xs text-gray-500">Objetivos</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-green-600">{stats.kpis}</p>
          <p className="text-xs text-gray-500">KPIs</p>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-amber-600">{stats.totalLinks}</p>
          <p className="text-xs text-gray-500">Conexiones</p>
        </div>
      </div>

      {/* Chart */}
      <ReactECharts
        option={option}
        style={{ height }}
        onEvents={{ click: handleChartClick }}
        notMerge
        lazyUpdate
      />

      {/* Descripción */}
      <div className="mt-4 text-center text-xs text-gray-500">
        El grosor de las líneas representa la fuerza de la relación entre elementos
      </div>
    </Card>
  );
}

// ==================== HELPER: Generar datos desde estructura BSC ====================

export interface BSCStructure {
  perspectives: {
    id: string;
    name: string;
    objectives: {
      id: string;
      name: string;
      kpis: {
        id: string;
        name: string;
        value?: number;
      }[];
    }[];
  }[];
}

export function generateSankeyFromBSC(structure: BSCStructure): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  structure.perspectives.forEach(perspective => {
    // Agregar nodo de perspectiva
    nodes.push({
      id: perspective.id,
      name: perspective.name,
      type: 'perspective',
      color: BSC_COLORS[perspective.id.toUpperCase()] || TYPE_COLORS.perspective,
    });

    perspective.objectives.forEach(objective => {
      // Agregar nodo de objetivo
      nodes.push({
        id: objective.id,
        name: objective.name,
        type: 'objective',
      });

      // Link perspectiva -> objetivo
      links.push({
        source: perspective.name,
        target: objective.name,
        value: objective.kpis.length || 1,
      });

      objective.kpis.forEach(kpi => {
        // Agregar nodo de KPI
        nodes.push({
          id: kpi.id,
          name: kpi.name,
          type: 'kpi',
          value: kpi.value,
        });

        // Link objetivo -> KPI
        links.push({
          source: objective.name,
          target: kpi.name,
          value: kpi.value || 1,
        });
      });
    });
  });

  return { nodes, links };
}

export default KPISankeyFlow;
