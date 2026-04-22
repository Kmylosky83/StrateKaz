/**
 * Constantes para los tabs del TenantFormModal.
 */
import {
  Landmark,
  Target,
  FileText,
  Users,
  ShieldCheck,
  Factory,
  Building2,
  BrainCircuit,
  HeartPulse,
  Workflow,
  Settings,
  Package,
} from 'lucide-react';
import { createElement } from 'react';

export const TIER_OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'small', label: 'Pequena' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
  { value: 'enterprise', label: 'Enterprise' },
];

export const ZONA_HORARIA_OPTIONS = [
  { value: 'America/Bogota', label: 'Colombia (America/Bogota)' },
  { value: 'America/New_York', label: 'Este EEUU (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'Pacifico EEUU (America/Los_Angeles)' },
  { value: 'America/Mexico_City', label: 'Mexico (America/Mexico_City)' },
  { value: 'Europe/Madrid', label: 'Espana (Europe/Madrid)' },
  { value: 'UTC', label: 'UTC' },
];

export const FORMATO_FECHA_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' },
];

export const MONEDA_OPTIONS = [
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'USD', label: 'Dolar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

/**
 * Etiquetas de categoría alineadas con ModuleCategory (modules.ts) y SIDEBAR_LAYERS V2.1.
 * El orden aquí determina el orden visual en el Tab Módulos de Admin Global.
 */
export const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  NIVEL_FUNDACION: {
    label: 'Fundación',
    icon: createElement(Landmark, { className: 'h-4 w-4 text-blue-500' }),
  },
  NIVEL_INFRAESTRUCTURA: {
    label: 'Gestión Documental',
    icon: createElement(FileText, { className: 'h-4 w-4 text-cyan-500' }),
  },
  NIVEL_CATALOGOS_MAESTROS: {
    label: 'Catálogos Maestros',
    icon: createElement(Package, { className: 'h-4 w-4 text-indigo-500' }),
  },
  NIVEL_EQUIPO: {
    label: 'Mi Equipo',
    icon: createElement(Users, { className: 'h-4 w-4 text-teal-500' }),
  },
  NIVEL_PLANIFICACION: {
    label: 'Planificación',
    icon: createElement(Target, { className: 'h-4 w-4 text-indigo-500' }),
  },
  NIVEL_PROTECCION: {
    label: 'Protección y Cumplimiento',
    icon: createElement(ShieldCheck, { className: 'h-4 w-4 text-sky-500' }),
  },
  NIVEL_HSEQ: {
    label: 'Gestión Integral HSEQ',
    icon: createElement(HeartPulse, { className: 'h-4 w-4 text-red-500' }),
  },
  NIVEL_CADENA: {
    label: 'Cadena de Valor',
    icon: createElement(Factory, { className: 'h-4 w-4 text-emerald-500' }),
  },
  NIVEL_TALENTO: {
    label: 'Gestión del Talento',
    icon: createElement(Building2, { className: 'h-4 w-4 text-amber-500' }),
  },
  NIVEL_SOPORTE: {
    label: 'Soporte Administrativo',
    icon: createElement(Building2, { className: 'h-4 w-4 text-orange-500' }),
  },
  NIVEL_INTELIGENCIA: {
    label: 'Inteligencia y Mejora',
    icon: createElement(BrainCircuit, { className: 'h-4 w-4 text-violet-500' }),
  },
  NIVEL_WORKFLOWS: {
    label: 'Flujos de Trabajo',
    icon: createElement(Workflow, { className: 'h-4 w-4 text-cyan-600' }),
  },
  NIVEL_CONFIG: {
    label: 'Configuración',
    icon: createElement(Settings, { className: 'h-4 w-4 text-gray-500' }),
  },
};
