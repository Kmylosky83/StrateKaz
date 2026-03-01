/**
 * IniciarFlujoModal - Modal para iniciar una nueva instancia de flujo
 *
 * Campos: plantilla_id, titulo, descripcion, prioridad, fecha_limite,
 * responsable_actual_id (select de usuarios del sistema).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useIniciarFlujo, usePlantillasActivas } from '../hooks/useWorkflows';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type { Prioridad } from '../types/workflow.types';

interface IniciarFlujoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Preseleccionar una plantilla específica */
  preselectedPlantillaId?: number;
}

interface FormState {
  plantilla_id: number;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  fecha_limite: string;
  responsable_actual_id: number;
}

const INITIAL_FORM: FormState = {
  plantilla_id: 0,
  titulo: '',
  descripcion: '',
  prioridad: 'NORMAL',
  fecha_limite: '',
  responsable_actual_id: 0,
};

const PRIORIDAD_OPTIONS = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

export default function IniciarFlujoModal({
  isOpen,
  onClose,
  preselectedPlantillaId,
}: IniciarFlujoModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

  const iniciarFlujoMutation = useIniciarFlujo();
  const { data: plantillasActivas } = usePlantillasActivas();
  const { data: usuarios = [] } = useSelectUsers();

  const plantillas = Array.isArray(plantillasActivas) ? plantillasActivas : [];

  const isLoading = iniciarFlujoMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...INITIAL_FORM,
        plantilla_id: preselectedPlantillaId || 0,
      });
    }
  }, [isOpen, preselectedPlantillaId]);

  const handleChange = (field: keyof FormState, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlantillaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const plantillaId = Number(e.target.value);
    const plantilla = plantillas.find((p) => p.id === plantillaId);
    setFormData((prev) => ({
      ...prev,
      plantilla_id: plantillaId,
      titulo: plantilla
        ? `${plantilla.nombre} - ${new Date().toLocaleDateString('es-CO')}`
        : prev.titulo,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plantilla_id || !formData.titulo.trim()) return;

    const payload: Record<string, unknown> = {
      plantilla_id: formData.plantilla_id,
      titulo: formData.titulo.trim(),
      prioridad: formData.prioridad,
    };

    if (formData.descripcion.trim()) {
      payload.descripcion = formData.descripcion.trim();
    }

    // datos_iniciales para campos extra
    const datosIniciales: Record<string, unknown> = {};
    if (formData.fecha_limite) {
      datosIniciales.fecha_limite = formData.fecha_limite;
    }
    if (formData.responsable_actual_id) {
      datosIniciales.responsable_actual_id = formData.responsable_actual_id;
    }
    if (Object.keys(datosIniciales).length > 0) {
      payload.datos_iniciales = datosIniciales;
    }

    iniciarFlujoMutation.mutate(payload as Parameters<typeof iniciarFlujoMutation.mutate>[0], {
      onSuccess: onClose,
    });
  };

  const plantillasOptions = plantillas.map((p) => ({
    value: String(p.id),
    label: `${p.nombre} (v${p.version})`,
  }));

  const usuariosOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.label,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Iniciar Nuevo Flujo de Trabajo" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plantilla */}
        <Select
          label="Plantilla de Flujo *"
          value={String(formData.plantilla_id || '')}
          onChange={handlePlantillaChange}
          required
        >
          <option value="">Seleccione una plantilla...</option>
          {plantillasOptions.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </Select>

        {/* Título */}
        <Input
          label="Título *"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Título de la instancia del flujo"
          required
        />

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción o contexto adicional del flujo..."
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prioridad */}
          <Select
            label="Prioridad"
            value={formData.prioridad}
            onChange={(e) => handleChange('prioridad', e.target.value)}
            options={PRIORIDAD_OPTIONS}
          />

          {/* Fecha Límite */}
          <Input
            label="Fecha Límite"
            type="date"
            value={formData.fecha_limite}
            onChange={(e) => handleChange('fecha_limite', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Responsable */}
        <Select
          label="Responsable Inicial"
          value={String(formData.responsable_actual_id || '')}
          onChange={(e) =>
            handleChange('responsable_actual_id', e.target.value ? Number(e.target.value) : 0)
          }
          helperText="Persona responsable de dar seguimiento al flujo"
        >
          <option value="">Asignación automática</option>
          {usuariosOptions.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </Select>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.plantilla_id || !formData.titulo.trim()}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Iniciando...
              </>
            ) : (
              'Iniciar Flujo'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
