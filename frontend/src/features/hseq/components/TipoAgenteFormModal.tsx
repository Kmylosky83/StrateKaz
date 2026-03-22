/**
 * Modal CRUD: Tipo de Agente de Riesgo (Higiene Industrial - Sprint 9)
 * Connected to useCreateTipoAgente/useUpdateTipoAgente hooks
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useCreateTipoAgente, useUpdateTipoAgente } from '../hooks/useHigieneIndustrial';
import type {
  TipoAgenteList,
  CreateTipoAgenteDTO,
  CategoriaAgente,
} from '../types/higiene-industrial.types';

interface TipoAgenteFormModalProps {
  item: TipoAgenteList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateTipoAgenteDTO = {
  codigo: '',
  nombre: '',
  categoria: 'FISICO',
  descripcion: '',
  normativa_aplicable: '',
};

export default function TipoAgenteFormModal({ item, isOpen, onClose }: TipoAgenteFormModalProps) {
  const [formData, setFormData] = useState<CreateTipoAgenteDTO>(INITIAL_FORM);
  const createMutation = useCreateTipoAgente();
  const updateMutation = useUpdateTipoAgente();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setFormData({
        codigo: item.codigo,
        nombre: item.nombre,
        categoria: item.categoria,
        descripcion: '',
        normativa_aplicable: item.normativa_aplicable || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item]);

  const handleChange = (field: keyof CreateTipoAgenteDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: item.id, datos: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar tipo de agente:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tipo de Agente' : 'Nuevo Tipo de Agente'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            placeholder="Se genera automáticamente"
          />

          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            required
            placeholder="Ej: Ruido"
          />

          <Select
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value as CategoriaAgente)}
            required
          >
            <option value="FISICO">Físico</option>
            <option value="QUIMICO">Químico</option>
            <option value="BIOLOGICO">Biológico</option>
            <option value="ERGONOMICO">Ergonómico</option>
            <option value="PSICOSOCIAL">Psicosocial</option>
          </Select>
        </div>

        <Textarea
          label="Descripción"
          value={formData.descripcion || ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          rows={3}
          placeholder="Descripción del tipo de agente de riesgo"
        />

        <Textarea
          label="Normativa Aplicable"
          value={formData.normativa_aplicable || ''}
          onChange={(e) => handleChange('normativa_aplicable', e.target.value)}
          rows={3}
          placeholder="Resoluciones, decretos o normativas colombianas aplicables"
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{isEditing ? 'Actualizar' : 'Crear'} Tipo de Agente</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
