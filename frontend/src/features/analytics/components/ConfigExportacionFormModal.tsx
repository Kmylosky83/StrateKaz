/**
 * Modal: ConfigExportacionFormModal
 *
 * Formulario para crear configuraciones de exportación
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { useCreateConfigExportacion } from '../hooks/useAnalytics';
import type { ConfiguracionExportacion } from '../types';

interface ConfigExportacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  configuracion?: ConfiguracionExportacion | null;
}

export const ConfigExportacionFormModal = ({
  isOpen,
  onClose,
  configuracion,
}: ConfigExportacionFormModalProps) => {
  const isEditing = Boolean(configuracion);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_exportacion: 'excel' as 'excel' | 'pdf' | 'power_bi' | 'api_externa' | 'webhook',
    formato_fecha: 'YYYY-MM-DD',
    incluir_graficos: false,
    incluir_analisis: false,
    activa: true,
  });

  const createMutation = useCreateConfigExportacion();

  useEffect(() => {
    if (configuracion) {
      setFormData({
        nombre: configuracion.nombre || '',
        descripcion: configuracion.descripcion || '',
        tipo_exportacion: configuracion.tipo_exportacion || 'excel',
        formato_fecha: configuracion.formato_fecha || 'YYYY-MM-DD',
        incluir_graficos: configuracion.incluir_graficos ?? false,
        incluir_analisis: configuracion.incluir_analisis ?? false,
        activa: configuracion.activa ?? true,
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        tipo_exportacion: 'excel',
        formato_fecha: 'YYYY-MM-DD',
        incluir_graficos: false,
        incluir_analisis: false,
        activa: true,
      });
    }
  }, [configuracion, isOpen]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Configuración de Exportación' : 'Nueva Configuración de Exportación'}
      subtitle={isEditing ? `Editando configuración` : 'Crear una nueva configuración para exportación de datos'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Configuración'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Nombre *"
          placeholder="Exportación Excel KPIs SST"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          disabled={isLoading}
        />

        <Textarea
          label="Descripción"
          placeholder="Descripción de la configuración..."
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          rows={3}
          disabled={isLoading}
        />

        <Select
          label="Tipo de Exportación *"
          value={formData.tipo_exportacion}
          onChange={(e) => handleChange('tipo_exportacion', e.target.value)}
          disabled={isLoading}
        >
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
          <option value="power_bi">Power BI</option>
          <option value="api_externa">API Externa</option>
          <option value="webhook">Webhook</option>
        </Select>

        <Input
          label="Formato de Fecha"
          placeholder="YYYY-MM-DD"
          value={formData.formato_fecha}
          onChange={(e) => handleChange('formato_fecha', e.target.value)}
          disabled={isLoading}
          helpText="Formato para las fechas en la exportación"
        />

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="incluir_graficos"
              checked={formData.incluir_graficos}
              onChange={(e) => handleChange('incluir_graficos', e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label htmlFor="incluir_graficos" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Incluir Gráficos
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="incluir_analisis"
              checked={formData.incluir_analisis}
              onChange={(e) => handleChange('incluir_analisis', e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label htmlFor="incluir_analisis" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Incluir Análisis
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activa"
              checked={formData.activa}
              onChange={(e) => handleChange('activa', e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label htmlFor="activa" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Configuración Activa
            </label>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
