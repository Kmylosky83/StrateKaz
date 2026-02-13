/**
 * ConfiguracionTab - Gestión de configuración anual de nómina
 */
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Settings, Pencil } from 'lucide-react';
import { useConfiguracionesNomina } from '../../hooks/useNomina';
import type { ConfiguracionNominaList } from '../../types';
import { ConfiguracionFormModal } from './ConfiguracionFormModal';

const formatCurrency = (value: number | undefined) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number | undefined) => {
  if (!value && value !== 0) return '-';
  return `${value.toFixed(2)}%`;
};

export const ConfiguracionTab = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfiguracionNominaList | null>(null);

  const { data: configuraciones, isLoading } = useConfiguracionesNomina();

  const handleCreate = () => {
    setSelectedConfig(null);
    setIsFormOpen(true);
  };

  const handleEdit = (config: ConfiguracionNominaList) => {
    setSelectedConfig(config);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando configuraciones...</span>
        </div>
      </Card>
    );
  }

  if (!configuraciones || configuraciones.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          icon={<Settings className="h-12 w-12 text-gray-400" />}
          title="No hay configuraciones de nómina"
          description="Crea la primera configuración para empezar a gestionar nóminas."
          action={
            <Button onClick={handleCreate} className="mt-4">
              <Plus size={16} className="mr-2" />
              Nueva Configuración
            </Button>
          }
        />
        <ConfiguracionFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          configuracion={selectedConfig}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Configuración de Nómina"
        description="Parámetros anuales de nómina (SMLV, seguridad social, prestaciones)"
      >
        <Button onClick={handleCreate}>
          <Plus size={16} className="mr-2" />
          Nueva Configuración
        </Button>
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4">
        {configuraciones.map((config) => (
          <Card key={config.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Año {config.anio}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Creado el {new Date(config.created_at).toLocaleDateString('es-CO')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                <Pencil size={14} className="mr-1" />
                Editar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Valores Básicos
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Salario Mínimo:</span>
                    <span className="font-medium">{formatCurrency(config.salario_minimo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Aux. Transporte:</span>
                    <span className="font-medium">{formatCurrency(config.auxilio_transporte)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Seguridad Social
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Empleado:</span>
                    <span className="font-medium">
                      {formatPercentage(config.total_seguridad_social_empleado)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Empresa:</span>
                    <span className="font-medium">
                      {formatPercentage(config.total_seguridad_social_empresa)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Parafiscales
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-medium">
                      {formatPercentage(config.total_parafiscales)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfiguracionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        configuracion={selectedConfig}
      />
    </div>
  );
};
