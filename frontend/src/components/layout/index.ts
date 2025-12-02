/**
 * Layout Components
 *
 * Componentes reutilizables para estructurar páginas de manera consistente.
 *
 * Uso típico:
 *
 * ```tsx
 * import { PageHeader, FilterCard, FilterGrid, StatsGrid, DataTableCard, PageTabs } from '@/components/layout';
 *
 * function MyPage() {
 *   return (
 *     <div className="space-y-6">
 *       <PageHeader
 *         title="Mi Página"
 *         description="Descripción de la página"
 *         badges={[{ label: '10 items', variant: 'primary' }]}
 *         actions={<Button>Nueva Acción</Button>}
 *         tabs={<PageTabs tabs={[...]} activeTab={...} onTabChange={...} />}
 *       />
 *
 *       <StatsGrid
 *         stats={[
 *           { label: 'Total', value: 100, icon: Package, iconColor: 'primary' },
 *           // ...
 *         ]}
 *       />
 *
 *       <FilterCard
 *         collapsible
 *         searchValue={search}
 *         onSearchChange={setSearch}
 *         activeFiltersCount={3}
 *         hasActiveFilters={true}
 *         onClearFilters={handleClear}
 *       >
 *         <FilterGrid columns={4}>
 *           <Select ... />
 *           <Input ... />
 *         </FilterGrid>
 *       </FilterCard>
 *
 *       <DataTableCard
 *         pagination={{
 *           currentPage: 1,
 *           pageSize: 10,
 *           totalItems: 100,
 *           hasNext: true,
 *           hasPrevious: false,
 *           onPageChange: setPage,
 *         }}
 *       >
 *         <MyTable data={data} />
 *       </DataTableCard>
 *     </div>
 *   );
 * }
 * ```
 */

export { PageHeader } from './PageHeader';
export type { PageHeaderProps, PageHeaderBadge } from './PageHeader';

export { FilterCard, FilterGrid } from './FilterCard';
export type { FilterCardProps, FilterGridProps } from './FilterCard';

export { StatsGrid, StatCardSkeleton, StatsGridSkeleton } from './StatsGrid';
export type { StatsGridProps, StatItem } from './StatsGrid';

export { DataTableCard, TableSkeleton } from './DataTableCard';
export type { DataTableCardProps, PaginationInfo } from './DataTableCard';

export { PageTabs } from './PageTabs';
export type { PageTabsProps, TabItem } from './PageTabs';
