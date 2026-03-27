/**
 * Recursos Gratuitos — Biblioteca StrateKaz
 *
 * Solo define las 9 categorías con su metadata visual.
 * Las URLs de Google Drive viven en el backend (nunca en el frontend).
 * Para agregar recursos: subir archivos a la carpeta Drive correspondiente.
 */

import {
  Sparkles,
  ShieldCheck,
  Award,
  Scale,
  Leaf,
  Users,
  Target,
  Calculator,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ResourceCategoryCode =
  | 'digital'
  | 'sst'
  | 'calidad'
  | 'legal'
  | 'ambiental'
  | 'talento'
  | 'estrategia'
  | 'finanzas'
  | 'operaciones';

export interface ResourceCategory {
  code: ResourceCategoryCode;
  name: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  formats: string[];
  resourceCount: string;
}

export const resourceCategories: ResourceCategory[] = [
  {
    code: 'digital',
    name: 'Transformación Digital & IA',
    description: 'Prompts listos para usar, guías de herramientas IA, automatización de procesos y productividad empresarial.',
    icon: Sparkles,
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/20',
    formats: ['Excel', 'PDF', 'Word'],
    resourceCount: '10+',
  },
  {
    code: 'sst',
    name: 'Seguridad y Salud en el Trabajo',
    description: 'Matrices IPEVR, charlas de 5 minutos, procedimientos de trabajo seguro e implementación ISO 45001.',
    icon: ShieldCheck,
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    formats: ['Excel', 'Word', 'PDF'],
    resourceCount: '15+',
  },
  {
    code: 'calidad',
    name: 'Calidad ISO 9001',
    description: 'Plantillas de procesos, caracterizaciones, indicadores de gestión e implementación del sistema de calidad.',
    icon: Award,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    formats: ['Word', 'Excel', 'PDF'],
    resourceCount: '12+',
  },
  {
    code: 'legal',
    name: 'Legal y Cumplimiento',
    description: 'Matrices de requisitos legales, Decreto 1072, Resolución 0312, reglamentos internos y gestión normativa.',
    icon: Scale,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    formats: ['Excel', 'Word', 'PDF'],
    resourceCount: '8+',
  },
  {
    code: 'ambiental',
    name: 'Gestión Ambiental ISO 14001',
    description: 'Matrices de aspectos e impactos ambientales, planes de manejo, indicadores y documentación del SGA.',
    icon: Leaf,
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
    formats: ['Excel', 'Word', 'PDF'],
    resourceCount: '10+',
  },
  {
    code: 'talento',
    name: 'Talento Humano',
    description: 'Formatos de selección, contratos, evaluaciones de desempeño, planes de capacitación y gestión de nómina.',
    icon: Users,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/20',
    formats: ['Word', 'Excel', 'PDF'],
    resourceCount: '18+',
  },
  {
    code: 'estrategia',
    name: 'Planeación Estratégica',
    description: 'Plantillas DOFA, PESTEL, cuadros de mando, mapas estratégicos, OKRs y planes de acción empresarial.',
    icon: Target,
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
    formats: ['Excel', 'PPT', 'Word'],
    resourceCount: '12+',
  },
  {
    code: 'finanzas',
    name: 'Finanzas y Presupuesto',
    description: 'Modelos de presupuesto, flujos de caja, análisis financiero, control de gastos y reportes contables.',
    icon: Calculator,
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/20',
    formats: ['Excel', 'PDF'],
    resourceCount: '10+',
  },
  {
    code: 'operaciones',
    name: 'Operaciones y Supply Chain',
    description: 'Gestión de proveedores, control de inventarios, indicadores de producción, logística y cadena de suministro.',
    icon: Truck,
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    formats: ['Excel', 'Word', 'PDF'],
    resourceCount: '14+',
  },
];
