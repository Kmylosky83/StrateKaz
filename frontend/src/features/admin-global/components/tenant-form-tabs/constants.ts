/**
 * Constantes para los tabs del TenantFormModal.
 */
import { Scale, FileText, Building2, Database, Users, Globe } from 'lucide-react';
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

export const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  STRATEGIC: { label: 'Nivel Estrategico', icon: createElement(Scale, { className: 'h-4 w-4' }) },
  COMPLIANCE: {
    label: 'Motores de Cumplimiento',
    icon: createElement(FileText, { className: 'h-4 w-4' }),
  },
  INTEGRATED: {
    label: 'Gestion Integral',
    icon: createElement(Building2, { className: 'h-4 w-4' }),
  },
  OPERATIONAL: {
    label: 'Operaciones',
    icon: createElement(Database, { className: 'h-4 w-4' }),
  },
  SUPPORT: { label: 'Soporte', icon: createElement(Users, { className: 'h-4 w-4' }) },
  INTELLIGENCE: { label: 'Inteligencia', icon: createElement(Globe, { className: 'h-4 w-4' }) },
};
