/**
 * DataGrid - Tabla de datos con toolbar integrado
 *
 * Combina SectionToolbar + Table (TanStack) en un solo componente.
 * Reemplaza el patrón repetido en 20+ secciones HSEQ/Cumplimiento/Riesgos:
 *   <div className="flex items-center justify-between">... toolbar ...</div>
 *   <Card variant="bordered" padding="none">
 *     <table>... manual HTML table ...</table>
 *   </Card>
 *
 * Uso básico:
 * ```tsx
 * <DataGrid
 *   title="Accidentes de Trabajo"
 *   data={accidentes}
 *   columns={columns}
 *   primaryAction={{ label: 'Nuevo AT', onClick: openModal }}
 *   onFilter={() => toggleFilters()}
 *   onExport={() => handleExport()}
 * />
 * ```
 *
 * Uso con búsqueda:
 * ```tsx
 * <DataGrid
 *   title="Colaboradores"
 *   data={filteredData}
 *   columns={columns}
 *   searchable
 *   searchValue={search}
 *   onSearchChange={setSearch}
 * />
 * ```
 */
import React from 'react';
import type { ColumnDef, RowSelectionState, OnChangeFn } from '@tanstack/react-table';
import { Table } from './Table';
import { SectionToolbar, type SectionToolbarAction } from './SectionToolbar';
import { cn } from '@/utils/cn';

// =============================================================================
// TYPES
// =============================================================================

export interface DataGridProps<T> {
  // -- Toolbar props --
  /** Título de la sección (se muestra en el toolbar) */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Handler para botón de filtros */
  onFilter?: () => void;
  /** Handler para botón de exportar */
  onExport?: () => void;
  /** Acción principal (botón primario) */
  primaryAction?: SectionToolbarAction;
  /** Acciones extra en el toolbar */
  extraActions?: SectionToolbarAction[];
  /** Mostrar búsqueda en el toolbar */
  searchable?: boolean;
  /** Valor del campo de búsqueda */
  searchValue?: string;
  /** Placeholder del campo de búsqueda */
  searchPlaceholder?: string;
  /** Handler para cambio en búsqueda */
  onSearchChange?: (value: string) => void;
  /** Ocultar toolbar completo */
  hideToolbar?: boolean;

  // -- Table props --
  /** Data array */
  data: T[];
  /** Column definitions (TanStack) */
  columns: ColumnDef<T, unknown>[];
  /** Enable sorting */
  sorting?: boolean;
  /** Enable pagination */
  pagination?: boolean;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** Enable row selection */
  selection?: boolean;
  /** Controlled row selection */
  rowSelection?: RowSelectionState;
  /** On selection change */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom empty state */
  emptyComponent?: React.ReactNode;
  /** Dense mode */
  dense?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Get row ID */
  getRowId?: (row: T) => string;

  // -- Container props --
  /** Container className */
  className?: string;
  /** Toolbar className */
  toolbarClassName?: string;
  /** Table className */
  tableClassName?: string;
}

// =============================================================================
// DATAGRID COMPONENT
// =============================================================================

export function DataGrid<T>({
  // Toolbar
  title,
  subtitle,
  onFilter,
  onExport,
  primaryAction,
  extraActions,
  searchable = false,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  hideToolbar = false,
  // Table
  data,
  columns,
  sorting = true,
  pagination = false,
  pageSizeOptions,
  defaultPageSize,
  selection = false,
  rowSelection,
  onRowSelectionChange,
  loading = false,
  emptyMessage,
  emptyComponent,
  dense = false,
  striped = false,
  hoverable = true,
  getRowId,
  // Container
  className,
  toolbarClassName,
  tableClassName,
}: DataGridProps<T>) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {!hideToolbar && (
        <SectionToolbar
          title={title}
          subtitle={subtitle}
          count={!loading ? data.length : undefined}
          onFilter={onFilter}
          onExport={onExport}
          primaryAction={primaryAction}
          extraActions={extraActions}
          searchable={searchable}
          searchValue={searchValue}
          searchPlaceholder={searchPlaceholder}
          onSearchChange={onSearchChange}
          className={toolbarClassName}
        />
      )}

      {/* Table */}
      <Table
        data={data}
        columns={columns}
        sorting={sorting}
        pagination={pagination}
        pageSizeOptions={pageSizeOptions}
        defaultPageSize={defaultPageSize}
        selection={selection}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        loading={loading}
        emptyMessage={emptyMessage}
        emptyComponent={emptyComponent}
        dense={dense}
        striped={striped}
        hoverable={hoverable}
        getRowId={getRowId}
        className={tableClassName}
      />
    </div>
  );
}
