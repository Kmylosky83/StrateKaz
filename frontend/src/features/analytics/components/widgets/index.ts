/**
 * Dashboard Widgets - Barrel Export
 *
 * All dashboard widget components for the Analytics Dashboard Builder.
 * Each widget renders inside a 12-column grid layout and consumes real
 * KPI data via TanStack Query hooks.
 *
 * Widget Types:
 * - KpiCardWidget: Single KPI card with trend and semaphore
 * - LineChartWidget: Time-series line chart
 * - BarChartWidget: Time-series bar chart
 * - PieChartWidget: Distribution pie/donut chart
 * - TableWidget: Data table with recent values
 * - GaugeWidget: Speedometer/gauge visualization
 * - HeatmapWidget: Calendar heatmap for activity
 */

export { KpiCardWidget } from './KpiCardWidget';
export type { KpiCardWidgetProps } from './KpiCardWidget';

export { LineChartWidget } from './LineChartWidget';
export type { LineChartWidgetProps } from './LineChartWidget';

export { BarChartWidget } from './BarChartWidget';
export type { BarChartWidgetProps } from './BarChartWidget';

export { PieChartWidget } from './PieChartWidget';
export type { PieChartWidgetProps } from './PieChartWidget';

export { TableWidget } from './TableWidget';
export type { TableWidgetProps } from './TableWidget';

export { GaugeWidget } from './GaugeWidget';
export type { GaugeWidgetProps } from './GaugeWidget';

export { HeatmapWidget } from './HeatmapWidget';
export type { HeatmapWidgetProps } from './HeatmapWidget';
