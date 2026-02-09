/**
 * ExportButton - Botón dropdown reutilizable para exportar datos a CSV/Excel.
 *
 * Usa el endpoint `export/?format=csv|excel` del ViewSet con ExportMixin.
 * Descarga archivos via fetch + blob + URL.createObjectURL.
 */
import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export interface ExportButtonProps {
  /** URL base del endpoint (sin ?format=). Ej: '/api/gestion-estrategica/gestion-documental/documentos/export/' */
  endpoint: string;
  /** Nombre del archivo descargado (sin extensión) */
  filename?: string;
  /** Deshabilitar el botón */
  disabled?: boolean;
  /** Formatos disponibles */
  formats?: ('csv' | 'excel')[];
  /** Tamaño del botón */
  size?: 'sm' | 'md';
  /** Clase CSS adicional */
  className?: string;
}

const FORMAT_CONFIG = {
  csv: {
    label: 'CSV',
    icon: FileText,
    extension: '.csv',
    mime: 'text/csv',
  },
  excel: {
    label: 'Excel',
    icon: FileSpreadsheet,
    extension: '.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
} as const;

export function ExportButton({
  endpoint,
  filename = 'export',
  disabled = false,
  formats = ['csv', 'excel'],
  size = 'sm',
  className,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsOpen(false);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const empresaId = localStorage.getItem('selected_empresa_id');
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}format=${format}`;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (empresaId) headers['X-Empresa-ID'] = empresaId;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const config = FORMAT_CONFIG[format];
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${filename}${config.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exportando:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (formats.length === 1) {
    const format = formats[0];
    const config = FORMAT_CONFIG[format];
    const Icon = config.icon;
    return (
      <Button
        variant="outline"
        size={size}
        disabled={disabled || isLoading}
        onClick={() => handleExport(format)}
        leftIcon={isLoading ? undefined : <Icon className="w-4 h-4" />}
        className={className}
      >
        {isLoading ? 'Exportando...' : `Exportar ${config.label}`}
      </Button>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <Button
        variant="outline"
        size={size}
        disabled={disabled || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        leftIcon={isLoading ? undefined : <Download className="w-4 h-4" />}
        rightIcon={<ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />}
      >
        {isLoading ? 'Exportando...' : 'Exportar'}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {formats.map((format) => {
            const config = FORMAT_CONFIG[format];
            const Icon = config.icon;
            return (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                Exportar {config.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
