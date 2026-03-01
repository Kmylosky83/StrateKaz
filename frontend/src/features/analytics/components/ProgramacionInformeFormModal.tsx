/**
 * Modal: ProgramacionInformeFormModal
 *
 * Formulario para crear/editar programaciones de informe
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input, Select, Checkbox } from '@/components/forms';
import { useCreateProgramacionInforme, usePlantillasInforme } from '../hooks/useAnalytics';
import { Spinner } from '@/components/common/Spinner';
import type { ProgramacionInforme } from '../types';

interface ProgramacionInformeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  programacion?: ProgramacionInforme | null;
}

export const ProgramacionInformeFormModal = ({
  isOpen,
  onClose,
  programacion,
}: ProgramacionInformeFormModalProps) => {
  const isEditing = Boolean(programacion);

  const [formData, setFormData] = useState({
    plantilla: 0,
    frecuencia: 'mensual' as 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual',
    dia_ejecucion: 1,
    hora_ejecucion: '08:00',
    destinatarios_email: '',
    activa: true,
  });

  const { data: plantillasData, isLoading: loadingPlantillas } = usePlantillasInforme();
  const createMutation = useCreateProgramacionInforme();

  useEffect(() => {
    if (programacion) {
      setFormData({
        plantilla: programacion.plantilla || 0,
        frecuencia: programacion.frecuencia || 'mensual',
        dia_ejecucion: programacion.dia_ejecucion || 1,
        hora_ejecucion: programacion.hora_ejecucion || '08:00',
        destinatarios_email: programacion.destinatarios_email?.join(', ') || '',
        activa: programacion.activa ?? true,
      });
    } else {
      setFormData({
        plantilla: 0,
        frecuencia: 'mensual',
        dia_ejecucion: 1,
        hora_ejecucion: '08:00',
        destinatarios_email: '',
        activa: true,
      });
    }
  }, [programacion, isOpen]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const destinatariosArray = formData.destinatarios_email
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);

      const payload = {
        plantilla: formData.plantilla,
        frecuencia: formData.frecuencia,
        dia_ejecucion: formData.dia_ejecucion,
        hora_ejecucion: formData.hora_ejecucion,
        destinatarios_email: destinatariosArray,
        activa: formData.activa,
      };

      await createMutation.mutateAsync(payload);
      onClose();
    } catch (error) {
      console.error('Error al guardar programación:', error);
    }
  };

  const isLoading = createMutation.isPending;
  const plantillas = plantillasData || [];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Programación de Informe' : 'Nueva Programación de Informe'}
      subtitle={isEditing ? `Editando programación` : 'Programar generación automática de informes'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading || !formData.plantilla}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Programación'}
          </Button>
        </>
      }
    >
      {loadingPlantillas ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          <Select
            label="Plantilla *"
            value={formData.plantilla.toString()}
            onChange={(e) => handleChange('plantilla', parseInt(e.target.value))}
            disabled={isLoading}
          >
            <option value="0">Seleccionar plantilla...</option>
            {plantillas.map((plantilla) => (
              <option key={plantilla.id} value={plantilla.id}>
                {plantilla.nombre} ({plantilla.codigo})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Frecuencia *"
              value={formData.frecuencia}
              onChange={(e) => handleChange('frecuencia', e.target.value)}
              disabled={isLoading}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </Select>

            <Input
              label="Día de Ejecución"
              type="number"
              min={1}
              max={31}
              value={formData.dia_ejecucion}
              onChange={(e) => handleChange('dia_ejecucion', parseInt(e.target.value))}
              disabled={isLoading}
              helpText={formData.frecuencia === 'mensual' ? 'Día del mes (1-31)' : undefined}
            />
          </div>

          <Input
            label="Hora de Ejecución *"
            type="time"
            value={formData.hora_ejecucion}
            onChange={(e) => handleChange('hora_ejecucion', e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Destinatarios (correos electrónicos) *"
            placeholder="email1@empresa.com, email2@empresa.com"
            value={formData.destinatarios_email}
            onChange={(e) => handleChange('destinatarios_email', e.target.value)}
            disabled={isLoading}
            helpText="Separar múltiples correos con comas"
          />

          <Checkbox
            label="Programación Activa"
            checked={formData.activa}
            onChange={(e) => handleChange('activa', e.target.checked)}
            disabled={isLoading}
          />
        </div>
      )}
    </BaseModal>
  );
};
