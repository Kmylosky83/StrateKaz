/**
 * Tipos TypeScript para Gestión del Cambio
 * Sistema de Gestión StrateKaz
 *
 * ZERO HARDCODING - Todas las configuraciones centralizadas
 */

import type { LucideIcon } from 'lucide-react';
import type { PaginatedResponse } from '@/types';

// Re-export para uso en API
export type { PaginatedResponse };

// ==================== ENUMS ====================

export type ChangePriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type ChangeStatus =
  | 'IDENTIFICADO'
  | 'ANALISIS'
  | 'PLANIFICADO'
  | 'EN_EJECUCION'
  | 'COMPLETADO'
  | 'CANCELADO';

export type ChangeType =
  | 'ESTRATEGICO'
  | 'ORGANIZACIONAL'
  | 'PROCESO'
  | 'TECNOLOGICO'
  | 'CULTURAL'
  | 'NORMATIVO'
  | 'OTRO';

// ==================== CONFIGURACIONES ====================

interface PriorityConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

interface TypeConfig {
  label: string;
  color: string;
  icon: string;
}

export const PRIORITY_CONFIG: Record<ChangePriority, PriorityConfig> = {
  BAJA: {
    label: 'Baja',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'ArrowDown',
  },
  MEDIA: {
    label: 'Media',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-600',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: 'Minus',
  },
  ALTA: {
    label: 'Alta',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300 dark:border-amber-600',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: 'ArrowUp',
  },
  CRITICA: {
    label: 'Crítica',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-600',
    textColor: 'text-red-700 dark:text-red-300',
    icon: 'AlertTriangle',
  },
};

export const STATUS_CONFIG: Record<ChangeStatus, StatusConfig> = {
  IDENTIFICADO: {
    label: 'Identificado',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'FileText',
  },
  ANALISIS: {
    label: 'En Análisis',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-600',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: 'Search',
  },
  PLANIFICADO: {
    label: 'Planificado',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-600',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: 'Calendar',
  },
  EN_EJECUCION: {
    label: 'En Ejecución',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300 dark:border-amber-600',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: 'Play',
  },
  COMPLETADO: {
    label: 'Completado',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-600',
    textColor: 'text-green-700 dark:text-green-300',
    icon: 'CheckCircle2',
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-600',
    textColor: 'text-red-700 dark:text-red-300',
    icon: 'XCircle',
  },
};

export const TYPE_CONFIG: Record<ChangeType, TypeConfig> = {
  ESTRATEGICO: {
    label: 'Estratégico',
    color: 'purple',
    icon: 'Target',
  },
  ORGANIZACIONAL: {
    label: 'Organizacional',
    color: 'blue',
    icon: 'Building2',
  },
  PROCESO: {
    label: 'Proceso',
    color: 'green',
    icon: 'GitBranch',
  },
  TECNOLOGICO: {
    label: 'Tecnológico',
    color: 'cyan',
    icon: 'Cpu',
  },
  CULTURAL: {
    label: 'Cultural',
    color: 'pink',
    icon: 'Users',
  },
  NORMATIVO: {
    label: 'Normativo',
    color: 'amber',
    icon: 'Scale',
  },
  OTRO: {
    label: 'Otro',
    color: 'gray',
    icon: 'Circle',
  },
};

// ==================== INTERFACES ====================

export interface GestionCambio {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  change_type: ChangeType;
  change_type_display?: string;
  priority: ChangePriority;
  priority_display?: string;
  status: ChangeStatus;
  status_display?: string;
  impact_analysis?: string | null;
  risk_assessment?: string | null;
  action_plan?: string | null;
  resources_required?: string | null;
  responsible?: number | null;
  responsible_name?: string | null;
  responsible_cargo?: number | null;
  responsible_cargo_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  related_objectives?: number[];
  related_objectives_details?: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  lessons_learned?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGestionCambioDTO {
  code: string;
  title: string;
  description?: string;
  change_type: ChangeType;
  priority: ChangePriority;
  status?: ChangeStatus;
  impact_analysis?: string;
  risk_assessment?: string;
  action_plan?: string;
  resources_required?: string;
  responsible?: number;
  responsible_cargo?: number;
  start_date?: string;
  due_date?: string;
  related_objectives?: number[];
  is_active?: boolean;
}

export interface UpdateGestionCambioDTO {
  title?: string;
  description?: string;
  change_type?: ChangeType;
  priority?: ChangePriority;
  status?: ChangeStatus;
  impact_analysis?: string;
  risk_assessment?: string;
  action_plan?: string;
  resources_required?: string;
  responsible?: number;
  responsible_cargo?: number;
  start_date?: string;
  due_date?: string;
  related_objectives?: number[];
  lessons_learned?: string;
  is_active?: boolean;
}

export interface TransitionStatusDTO {
  new_status: ChangeStatus;
}

export interface GestionCambioFilters {
  change_type?: ChangeType;
  priority?: ChangePriority;
  status?: ChangeStatus;
  responsible?: number;
  is_active?: boolean;
  search?: string;
}

// ==================== STATS ====================

export interface GestionCambioStats {
  total: number;
  by_priority: {
    baja: number;
    media: number;
    alta: number;
    critica: number;
  };
  by_status: {
    identificado: number;
    analisis: number;
    planificado: number;
    en_ejecucion: number;
    completado: number;
    cancelado: number;
  };
  by_type: Record<ChangeType, number>;
}
