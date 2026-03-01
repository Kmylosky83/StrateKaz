/**
 * MapaToolbar - Barra de herramientas para Mapa Estratégico
 * Sistema de Gestión StrateKaz
 *
 * Toolbar flotante con controles para el canvas de React Flow:
 * - Zoom in/out
 * - Fit view
 * - Reset layout
 * - Guardar posiciones
 * - Export PNG/PDF
 * - Toggle grid
 * - Toggle minimap
 *
 * Posicionado en la esquina superior derecha del canvas
 */

import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Save,
  Image,
  FileText,
  Grid3x3,
  Map,
  Link2,
} from 'lucide-react';
import { Card, Button, Tooltip } from '@/components/common';
import type { MapaToolbarActions } from '../../types/mapa-estrategico.types';
import { cn } from '@/utils/cn';

// ============================================================================
// TIPOS
// ============================================================================

interface MapaToolbarProps {
  actions: MapaToolbarActions;
  showGrid?: boolean;
  showMinimap?: boolean;
  isSaving?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const MapaToolbar = ({
  actions,
  showGrid = true,
  showMinimap = true,
  isSaving = false,
  className,
}: MapaToolbarProps) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const toolbarButtons = [
    // Zoom
    {
      label: 'Acercar',
      icon: ZoomIn,
      onClick: actions.onZoomIn,
      group: 'zoom',
    },
    {
      label: 'Alejar',
      icon: ZoomOut,
      onClick: actions.onZoomOut,
      group: 'zoom',
    },
    {
      label: 'Ajustar vista',
      icon: Maximize2,
      onClick: actions.onFitView,
      group: 'zoom',
    },
    // Layout
    {
      label: 'Restablecer diseño',
      icon: RotateCcw,
      onClick: actions.onResetLayout,
      group: 'layout',
    },
    {
      label: 'Guardar posiciones',
      icon: Save,
      onClick: actions.onSavePositions,
      group: 'layout',
      loading: isSaving,
    },
    // View
    {
      label: showGrid ? 'Ocultar cuadrícula' : 'Mostrar cuadrícula',
      icon: Grid3x3,
      onClick: actions.onToggleGrid,
      group: 'view',
      active: showGrid,
    },
    {
      label: showMinimap ? 'Ocultar minimapa' : 'Mostrar minimapa',
      icon: Map,
      onClick: actions.onToggleMinimap,
      group: 'view',
      active: showMinimap,
    },
    // Actions
    {
      label: 'Agregar relación',
      icon: Link2,
      onClick: actions.onAddRelation,
      group: 'actions',
    },
  ];

  return (
    <Card
      className={cn(
        'absolute top-4 right-4 z-10 shadow-lg border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex flex-col gap-1 p-2">
        {/* Zoom controls */}
        <div className="flex flex-col gap-1 pb-1 border-b border-gray-200 dark:border-gray-700">
          {toolbarButtons
            .filter((btn) => btn.group === 'zoom')
            .map((button) => (
              <ToolbarButton key={button.label} {...button} />
            ))}
        </div>

        {/* Layout controls */}
        <div className="flex flex-col gap-1 pb-1 border-b border-gray-200 dark:border-gray-700">
          {toolbarButtons
            .filter((btn) => btn.group === 'layout')
            .map((button) => (
              <ToolbarButton key={button.label} {...button} />
            ))}
        </div>

        {/* View controls */}
        <div className="flex flex-col gap-1 pb-1 border-b border-gray-200 dark:border-gray-700">
          {toolbarButtons
            .filter((btn) => btn.group === 'view')
            .map((button) => (
              <ToolbarButton key={button.label} {...button} />
            ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 pb-1 border-b border-gray-200 dark:border-gray-700">
          {toolbarButtons
            .filter((btn) => btn.group === 'actions')
            .map((button) => (
              <ToolbarButton key={button.label} {...button} />
            ))}
        </div>

        {/* Export menu */}
        <div className="flex flex-col gap-1 relative">
          <Tooltip content="Exportar">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </Button>
          </Tooltip>

          {/* Export dropdown */}
          {isExportMenuOpen && (
            <div className="absolute right-full mr-2 top-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  actions.onExportPNG();
                  setIsExportMenuOpen(false);
                }}
                className="w-full !justify-start !px-3 !py-2 !min-h-0 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Exportar como PNG
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  actions.onExportPDF();
                  setIsExportMenuOpen(false);
                }}
                className="w-full !justify-start !px-3 !py-2 !min-h-0 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Exportar como PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// TOOLBAR BUTTON
// ============================================================================

interface ToolbarButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  loading?: boolean;
}

const ToolbarButton = ({
  label,
  icon: Icon,
  onClick,
  active,
  loading,
}: ToolbarButtonProps) => {
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={loading}
        className={cn(
          'w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700',
          active && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </Button>
    </Tooltip>
  );
};
