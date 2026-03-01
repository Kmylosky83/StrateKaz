/**
 * Modal: PlantillaInformeFormModal
 *
 * Formulario para crear/editar plantillas de informe
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { useCreatePlantillaInforme, useUpdatePlantillaInforme } from '../hooks/useAnalytics';
import type { PlantillaInforme } from '../types';

interface PlantillaInformeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantilla?: PlantillaInforme | null;
}

export const PlantillaInformeFormModal = ({
  isOpen,
  onClose,
  plantilla,
}: PlantillaInformeFormModalProps) => {
  const isEditing = Boolean(plantilla);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_informe: 'gerencial' as 'normativo' | 'gerencial' | 'operativo' | 'personalizado',
    formato_salida: 'pdf' as 'pdf' | 'excel' | 'word' | 'html',
    pie_pagina: '',
    activa: true,
  });

  const createMutation = useCreatePlantillaInforme();
  const updateMutation = useUpdatePlantillaInforme();

  useEffect(() => {
    if (plantilla) {
      setFormData({
        codigo: plantilla.codigo || '',
        nombre: plantilla.nombre || '',
        descripcion: plantilla.descripcion || '',
        tipo_informe: plantilla.tipo_informe || 'gerencial',
        formato_salida: plantilla.formato_salida || 'pdf',
        pie_pagina: plantilla.pie_pagina || '',
        activa: plantilla.activa ?? true,
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo_informe: 'gerencial',
        formato_salida: 'pdf',
        pie_pagina: '',
        activa: true,
      });
    }
  }, [plantilla, isOpen]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && plantilla) {
        await updateMutation.mutateAsync({
          id: plantilla.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plantilla de Informe' : 'Nueva Plantilla de Informe'}
      subtitle={
        isEditing
          ? `Editando ${plantilla?.codigo}`
          : 'Crear una nueva plantilla para generación de informes'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Plantilla'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código"
            placeholder="Se genera automáticamente"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Nombre *"
            placeholder="Informe Mensual SST"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Textarea
          label="Descripción"
          placeholder="Descripción del informe..."
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          rows={3}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Informe *"
            value={formData.tipo_informe}
            onChange={(e) => handleChange('tipo_informe', e.target.value)}
            disabled={isLoading}
          >
            <option value="normativo">Normativo</option>
            <option value="gerencial">Gerencial</option>
            <option value="operativo">Operativo</option>
            <option value="personalizado">Personalizado</option>
          </Select>

          <Select
            label="Formato de Salida *"
            value={formData.formato_salida}
            onChange={(e) => handleChange('formato_salida', e.target.value)}
            disabled={isLoading}
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
            <option value="html">HTML</option>
          </Select>
        </div>

        <Textarea
          label="Pie de Página"
          placeholder="Texto del pie de página..."
          value={formData.pie_pagina}
          onChange={(e) => handleChange('pie_pagina', e.target.value)}
          rows={2}
          disabled={isLoading}
        />

        <Checkbox
          label="Plantilla Activa"
          checked={formData.activa}
          onChange={(e) => handleChange('activa', e.target.checked)}
          disabled={isLoading}
        />
      </div>
    </BaseModal>
  );
};
