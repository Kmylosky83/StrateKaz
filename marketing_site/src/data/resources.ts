/**
 * Recursos Gratuitos — Biblioteca StrateKaz
 *
 * Datos de recursos organizados por categoría.
 * Los archivos se hospedan en Google Drive público.
 * Para agregar un recurso: añadir entrada al array y push.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResourceFormat = 'excel' | 'word' | 'pdf' | 'ppt';

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
  color: string;
  colorClass: string;
  bgClass: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategoryCode;
  format: ResourceFormat;
  driveUrl: string;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  requiresEmail?: boolean;
}

// ---------------------------------------------------------------------------
// Categories — IA primero como diferenciador
// ---------------------------------------------------------------------------

export const resourceCategories: ResourceCategory[] = [
  {
    code: 'digital',
    name: 'Transformacion Digital & IA',
    description: 'Prompts, guias de herramientas IA, automatizacion y productividad',
    icon: Sparkles,
    color: '#EC4899',
    colorClass: 'text-pink-500',
    bgClass: 'bg-pink-500/10',
  },
  {
    code: 'sst',
    name: 'Seguridad y Salud en el Trabajo',
    description: 'Matrices IPEVR, charlas 5 minutos, procedimientos de trabajo seguro',
    icon: ShieldCheck,
    color: '#EF4444',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
  },
  {
    code: 'calidad',
    name: 'Calidad',
    description: 'Procedimientos ISO 9001, auditoria interna, control documental',
    icon: Award,
    color: '#3B82F6',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
  },
  {
    code: 'legal',
    name: 'Legal y Cumplimiento',
    description: 'Matrices legales, Decreto 1072, Resolucion 0312, requisitos normativos',
    icon: Scale,
    color: '#8B5CF6',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
  },
  {
    code: 'ambiental',
    name: 'Medio Ambiente',
    description: 'Aspectos ambientales, planes de manejo, residuos, indicadores',
    icon: Leaf,
    color: '#10B981',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  {
    code: 'talento',
    name: 'Talento Humano',
    description: 'Seleccion, evaluacion de desempeno, induccion, capacitacion',
    icon: Users,
    color: '#F59E0B',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
  },
  {
    code: 'estrategia',
    name: 'Estrategia y Planeacion',
    description: 'DOFA, PESTEL, BSC, mapa estrategico, plan de trabajo anual',
    icon: Target,
    color: '#6366F1',
    colorClass: 'text-indigo-500',
    bgClass: 'bg-indigo-500/10',
  },
  {
    code: 'finanzas',
    name: 'Finanzas y Administracion',
    description: 'Presupuestos, control de activos fijos, plantillas contables',
    icon: Calculator,
    color: '#06B6D4',
    colorClass: 'text-cyan-500',
    bgClass: 'bg-cyan-500/10',
  },
  {
    code: 'operaciones',
    name: 'Cadena de Valor',
    description: 'Proveedores, compras, produccion, logistica, inventarios',
    icon: Truck,
    color: '#F97316',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
  },
];

// ---------------------------------------------------------------------------
// Format metadata
// ---------------------------------------------------------------------------

export const formatMeta: Record<
  ResourceFormat,
  { label: string; extension: string; colorClass: string }
> = {
  excel: { label: 'Excel', extension: '.xlsx', colorClass: 'text-green-400' },
  word: { label: 'Word', extension: '.docx', colorClass: 'text-blue-400' },
  pdf: { label: 'PDF', extension: '.pdf', colorClass: 'text-red-400' },
  ppt: { label: 'PowerPoint', extension: '.pptx', colorClass: 'text-orange-400' },
};

// ---------------------------------------------------------------------------
// Resources — Datos de ejemplo (reemplazar driveUrl con links reales)
// ---------------------------------------------------------------------------

export const resources: Resource[] = [
  // ── Transformacion Digital & IA ──────────────────────────────────────
  {
    id: 'prompts-diagnostico-iso',
    title: '50 Prompts para Diagnostico ISO',
    description:
      'Pack completo de prompts de IA para diagnosticar el estado de tu sistema de gestion. Compatible con ChatGPT, Claude y Gemini.',
    category: 'digital',
    format: 'pdf',
    driveUrl: '#',
    tags: ['IA', 'ISO 9001', 'Diagnostico', 'Prompts'],
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'guia-ia-politicas',
    title: 'Guia: Redactar Politicas con IA',
    description:
      'Aprende a usar inteligencia artificial para redactar politicas empresariales alineadas con ISO y normativa colombiana.',
    category: 'digital',
    format: 'pdf',
    driveUrl: '#',
    tags: ['IA', 'Politicas', 'Automatizacion'],
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'guia-herramientas-ia-sgi',
    title: 'Top 10 Herramientas IA para Gestion Integral',
    description:
      'Las mejores herramientas de inteligencia artificial para optimizar tu sistema de gestion. Comparativa detallada con casos de uso.',
    category: 'digital',
    format: 'pdf',
    driveUrl: '#',
    tags: ['IA', 'Herramientas', 'Productividad'],
    isNew: true,
  },
  {
    id: 'prompts-dofa-pestel',
    title: 'Prompts para Analisis DOFA y PESTEL con IA',
    description:
      'Genera analisis estrategicos completos usando prompts optimizados para inteligencia artificial.',
    category: 'digital',
    format: 'pdf',
    driveUrl: '#',
    tags: ['IA', 'DOFA', 'PESTEL', 'Estrategia'],
    requiresEmail: true,
  },
  {
    id: 'guia-transformacion-digital-pymes',
    title: 'Guia: Transformacion Digital para PYMES',
    description:
      'Hoja de ruta paso a paso para digitalizar los procesos de tu empresa. Desde lo basico hasta la automatizacion avanzada.',
    category: 'digital',
    format: 'pdf',
    driveUrl: '#',
    tags: ['Transformacion Digital', 'PYMES', 'Automatizacion'],
    requiresEmail: true,
  },

  // ── SST ──────────────────────────────────────────────────────────────
  {
    id: 'matriz-ipevr',
    title: 'Matriz IPEVR — Identificacion de Peligros',
    description:
      'Formato Excel listo para identificar peligros, evaluar y valorar riesgos segun la GTC-45. Incluye formulas automaticas.',
    category: 'sst',
    format: 'excel',
    driveUrl: '#',
    tags: ['SST', 'GTC-45', 'Decreto 1072', 'Riesgos'],
    isFeatured: true,
  },
  {
    id: 'charla-5min-epp',
    title: 'Charla 5 Minutos: Uso Correcto de EPP',
    description:
      'Presentacion lista para dictar una charla de seguridad sobre el uso correcto de elementos de proteccion personal.',
    category: 'sst',
    format: 'ppt',
    driveUrl: '#',
    tags: ['SST', 'EPP', 'Charla', 'Capacitacion'],
  },
  {
    id: 'procedimiento-alturas',
    title: 'Procedimiento Trabajo en Alturas',
    description:
      'Procedimiento completo conforme a la Resolucion 4272 de 2021 para trabajo seguro en alturas.',
    category: 'sst',
    format: 'word',
    driveUrl: '#',
    tags: ['SST', 'Alturas', 'Resolucion 4272'],
  },
  {
    id: 'plan-trabajo-anual-sst',
    title: 'Plan de Trabajo Anual SST',
    description:
      'Plantilla del plan de trabajo anual del SG-SST con cronograma, responsables e indicadores. Listo para personalizar.',
    category: 'sst',
    format: 'excel',
    driveUrl: '#',
    tags: ['SST', 'Plan Anual', 'SG-SST'],
    isFeatured: true,
  },
  {
    id: 'charla-5min-riesgo-electrico',
    title: 'Charla 5 Minutos: Riesgo Electrico',
    description:
      'Capacitacion rapida sobre prevencion de riesgos electricos en el lugar de trabajo.',
    category: 'sst',
    format: 'ppt',
    driveUrl: '#',
    tags: ['SST', 'Riesgo Electrico', 'Charla'],
  },

  // ── Calidad ──────────────────────────────────────────────────────────
  {
    id: 'checklist-auditoria-interna',
    title: 'Checklist Auditoria Interna ISO 9001',
    description:
      'Lista de verificacion completa para realizar auditorias internas conforme a ISO 19011:2018.',
    category: 'calidad',
    format: 'excel',
    driveUrl: '#',
    tags: ['ISO 9001', 'Auditoria', 'ISO 19011'],
    isFeatured: true,
  },
  {
    id: 'procedimiento-control-documental',
    title: 'Procedimiento Control de Documentos',
    description:
      'Procedimiento estandar para la gestion y control de documentos segun ISO 9001:2015 clausula 7.5.',
    category: 'calidad',
    format: 'word',
    driveUrl: '#',
    tags: ['ISO 9001', 'Documentos', 'Control'],
  },
  {
    id: 'formato-acciones-correctivas',
    title: 'Formato Acciones Correctivas y Preventivas',
    description:
      'Plantilla para documentar no conformidades, analisis de causa raiz y planes de accion.',
    category: 'calidad',
    format: 'excel',
    driveUrl: '#',
    tags: ['ISO 9001', 'No Conformidades', 'Mejora Continua'],
  },

  // ── Legal ────────────────────────────────────────────────────────────
  {
    id: 'matriz-requisitos-legales',
    title: 'Matriz de Requisitos Legales SST',
    description:
      'Matriz de identificacion de requisitos legales aplicables en SST para empresas colombianas. Actualizada 2026.',
    category: 'legal',
    format: 'excel',
    driveUrl: '#',
    tags: ['Legal', 'SST', 'Decreto 1072', 'Matriz'],
    isFeatured: true,
  },
  {
    id: 'guia-decreto-1072',
    title: 'Guia Practica Decreto 1072 de 2015',
    description:
      'Guia paso a paso para implementar el SG-SST conforme al Decreto 1072. Incluye checklist de cumplimiento.',
    category: 'legal',
    format: 'pdf',
    driveUrl: '#',
    tags: ['Decreto 1072', 'SG-SST', 'Guia'],
    requiresEmail: true,
  },
  {
    id: 'checklist-resolucion-0312',
    title: 'Checklist Resolucion 0312 de 2019',
    description:
      'Lista de verificacion de estandares minimos del SG-SST segun la Resolucion 0312.',
    category: 'legal',
    format: 'excel',
    driveUrl: '#',
    tags: ['Resolucion 0312', 'Estandares Minimos', 'SST'],
  },

  // ── Medio Ambiente ───────────────────────────────────────────────────
  {
    id: 'matriz-aspectos-ambientales',
    title: 'Matriz de Aspectos e Impactos Ambientales',
    description:
      'Formato Excel para identificar y evaluar aspectos e impactos ambientales conforme a ISO 14001:2015.',
    category: 'ambiental',
    format: 'excel',
    driveUrl: '#',
    tags: ['ISO 14001', 'Aspectos Ambientales', 'Impactos'],
    isFeatured: true,
  },
  {
    id: 'plan-manejo-residuos',
    title: 'Plan de Manejo Integral de Residuos',
    description:
      'Plantilla para elaborar el plan de gestion integral de residuos solidos y peligrosos.',
    category: 'ambiental',
    format: 'word',
    driveUrl: '#',
    tags: ['Residuos', 'PGIRS', 'Medio Ambiente'],
  },

  // ── Talento Humano ───────────────────────────────────────────────────
  {
    id: 'formato-evaluacion-desempeno',
    title: 'Formato Evaluacion de Desempeno 360',
    description:
      'Plantilla completa para evaluacion de desempeno con autoevaluacion, evaluacion de jefe y pares.',
    category: 'talento',
    format: 'excel',
    driveUrl: '#',
    tags: ['Talento Humano', 'Desempeno', 'Evaluacion 360'],
    isFeatured: true,
  },
  {
    id: 'checklist-induccion',
    title: 'Checklist de Induccion y Reinduccion',
    description:
      'Lista de verificacion para el proceso de induccion de nuevos colaboradores y reinduccion periodica.',
    category: 'talento',
    format: 'excel',
    driveUrl: '#',
    tags: ['Induccion', 'Onboarding', 'Talento Humano'],
  },
  {
    id: 'plan-capacitacion-anual',
    title: 'Plan de Capacitacion Anual',
    description:
      'Plantilla para disenar el plan anual de formacion con cronograma, presupuesto y seguimiento.',
    category: 'talento',
    format: 'excel',
    driveUrl: '#',
    tags: ['Capacitacion', 'Formacion', 'Plan Anual'],
  },

  // ── Estrategia ───────────────────────────────────────────────────────
  {
    id: 'plantilla-dofa',
    title: 'Plantilla Analisis DOFA Completo',
    description:
      'Formato Excel con matriz DOFA, cruce de estrategias TOWS y plan de accion integrado.',
    category: 'estrategia',
    format: 'excel',
    driveUrl: '#',
    tags: ['DOFA', 'TOWS', 'Estrategia', 'Planeacion'],
    isFeatured: true,
  },
  {
    id: 'plantilla-bsc',
    title: 'Plantilla Balanced Scorecard (BSC)',
    description:
      'Cuadro de mando integral con las 4 perspectivas, objetivos, indicadores y metas.',
    category: 'estrategia',
    format: 'excel',
    driveUrl: '#',
    tags: ['BSC', 'KPIs', 'Indicadores', 'Estrategia'],
    requiresEmail: true,
  },

  // ── Finanzas ─────────────────────────────────────────────────────────
  {
    id: 'plantilla-presupuesto-anual',
    title: 'Plantilla Presupuesto Anual',
    description:
      'Formato Excel para elaborar el presupuesto anual de la empresa con proyecciones mensuales.',
    category: 'finanzas',
    format: 'excel',
    driveUrl: '#',
    tags: ['Presupuesto', 'Finanzas', 'Planeacion Financiera'],
  },
  {
    id: 'control-activos-fijos',
    title: 'Formato Control de Activos Fijos',
    description:
      'Plantilla para el registro, control y depreciacion de activos fijos de la empresa.',
    category: 'finanzas',
    format: 'excel',
    driveUrl: '#',
    tags: ['Activos Fijos', 'Depreciacion', 'Contabilidad'],
  },

  // ── Cadena de Valor ──────────────────────────────────────────────────
  {
    id: 'evaluacion-proveedores',
    title: 'Formato Evaluacion y Seleccion de Proveedores',
    description:
      'Matriz para evaluar y seleccionar proveedores con criterios de calidad, precio, cumplimiento y SST.',
    category: 'operaciones',
    format: 'excel',
    driveUrl: '#',
    tags: ['Proveedores', 'Compras', 'Evaluacion'],
    isFeatured: true,
  },
  {
    id: 'control-inventarios',
    title: 'Plantilla Control de Inventarios',
    description:
      'Formato Excel para gestion de inventarios con kardex, stock minimo y alertas de reposicion.',
    category: 'operaciones',
    format: 'excel',
    driveUrl: '#',
    tags: ['Inventarios', 'Almacen', 'Kardex'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getCategoryByCode(code: ResourceCategoryCode): ResourceCategory | undefined {
  return resourceCategories.find(c => c.code === code);
}

export function getResourcesByCategory(code: ResourceCategoryCode): Resource[] {
  return resources.filter(r => r.category === code);
}

export function getFeaturedResources(): Resource[] {
  return resources.filter(r => r.isFeatured);
}

export function searchResources(query: string): Resource[] {
  const q = query.toLowerCase();
  return resources.filter(
    r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
  );
}
