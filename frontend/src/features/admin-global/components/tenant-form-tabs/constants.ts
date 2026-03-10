/**
 * Constantes para los tabs del TenantFormModal.
 */
import { Landmark, Target, ShieldCheck, Factory, Building2, BrainCircuit } from 'lucide-react';
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
 * Etiquetas de categoría alineadas con SIDEBAR_LAYERS del backend.
 * Mismos nombres, íconos y orden que el sidebar de la aplicación.
 */
export const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  NIVEL_C1: {
    label: 'Fundación',
    icon: createElement(Landmark, { className: 'h-4 w-4 text-blue-500' }),
  },
  NIVEL_PE: {
    label: 'Planeación Estratégica',
    icon: createElement(Target, { className: 'h-4 w-4 text-indigo-500' }),
  },
  NIVEL_SGI: {
    label: 'Sistema de Gestión',
    icon: createElement(ShieldCheck, { className: 'h-4 w-4 text-sky-500' }),
  },
  NIVEL_OPS: {
    label: 'Operaciones',
    icon: createElement(Factory, { className: 'h-4 w-4 text-emerald-500' }),
  },
  NIVEL_ORG: {
    label: 'Organización',
    icon: createElement(Building2, { className: 'h-4 w-4 text-amber-500' }),
  },
  NIVEL_C3: {
    label: 'Inteligencia',
    icon: createElement(BrainCircuit, { className: 'h-4 w-4 text-violet-500' }),
  },
};
