/**
 * Data Display Components
 * Sistema de Gestión StrateKaz
 *
 * Componentes para mostrar datos estructurados de forma atractiva.
 *
 * Uso típico:
 * ```tsx
 * import { DataSection, DataGrid, DataCard, DataField } from '@/components/data-display';
 *
 * <DataSection
 *   title="Datos de Empresa"
 *   icon={Building2}
 *   action={<Button>Editar</Button>}
 * >
 *   <DataGrid columns={3}>
 *     <DataCard title="Identificación" icon={FileText} variant="purple">
 *       <DataField label="NIT" value="900123456-7" valueVariant="bold" />
 *       <DataField label="Razón Social" value="Mi Empresa SAS" />
 *     </DataCard>
 *     <DataCard title="Contacto" icon={Phone} variant="green">
 *       <DataField label="Teléfono" value="300 123 4567" icon={Phone} inline />
 *       <DataField label="Email" value="contacto@empresa.com" icon={Mail} inline />
 *     </DataCard>
 *   </DataGrid>
 * </DataSection>
 * ```
 */

export { DataCard } from './DataCard';
export { DataField } from './DataField';
export { DataGrid } from './DataGrid';
export { DataSection } from './DataSection';

export type { DataCardProps, DataCardVariant } from './DataCard';
export type { DataFieldProps, DataFieldValueVariant } from './DataField';
export type { DataGridProps } from './DataGrid';
export type { DataSectionProps } from './DataSection';

// KPI Gauge (compartido — usado por planeación y analytics)
export { KPIGaugeAdvanced } from './KPIGaugeAdvanced';
export type { KPIGaugeAdvancedProps, KPIGaugeData, GaugeVariant } from './KPIGaugeAdvanced';
