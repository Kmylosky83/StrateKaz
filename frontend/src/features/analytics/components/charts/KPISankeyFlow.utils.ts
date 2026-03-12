/**
 * KPISankeyFlow - Utilidades y tipos de datos
 * Separado del componente para compatibilidad con react-refresh
 */
import { CHART_COLORS, BSC_COLORS as BSC_CHART_COLORS } from '@/constants/chart-colors';

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

// ==================== COLORES ====================

export const TYPE_COLORS = {
  perspective: CHART_COLORS[4], // violet-500 (#8B5CF6)
  objective: CHART_COLORS[0], // blue-500   (#3B82F6)
  kpi: CHART_COLORS[1], // emerald-500 (#10B981)
  outcome: CHART_COLORS[2], // amber-500  (#F59E0B)
};

export const BSC_COLORS: Record<string, string> = {
  FINANCIERA: BSC_CHART_COLORS.clientes,
  CLIENTES: BSC_CHART_COLORS.financiera,
  PROCESOS: BSC_CHART_COLORS.procesos,
  APRENDIZAJE: BSC_CHART_COLORS.aprendizaje,
};

// ==================== HELPER: Generar datos desde estructura BSC ====================

export function generateSankeyFromBSC(structure: BSCStructure): {
  nodes: SankeyNode[];
  links: SankeyLink[];
} {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  structure.perspectives.forEach((perspective) => {
    // Agregar nodo de perspectiva
    nodes.push({
      id: perspective.id,
      name: perspective.name,
      type: 'perspective',
      color: BSC_COLORS[perspective.id.toUpperCase()] || TYPE_COLORS.perspective,
    });

    perspective.objectives.forEach((objective) => {
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

      objective.kpis.forEach((kpi) => {
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
