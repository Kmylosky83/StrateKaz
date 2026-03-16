/**
 * AfiliacionFormModal - Formulario para crear afiliaciones a Seguridad Social
 * Seleccionar candidato (contratado) + entidad SS + datos de solicitud
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { BaseModal } from '@/components/modals/BaseModal';
import { Shield } from 'lucide-react';
import {
  useCreateAfiliacion,
  useCandidatos,
  useEntidadesSS,
  useTiposEntidad,
} from '@/features/talent-hub/hooks/useSeleccionContratacion';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type { AfiliacionSSFormData } from '@/features/talent-hub/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AfiliacionFormModal = ({ isOpen, onClose }: Props) => {
  const createMutation = useCreateAfiliacion();

  // Catalogos
  const { data: tiposEntidad = [] } = useTiposEntidad();
  const [tipoEntidadFiltro, setTipoEntidadFiltro] = useState('');
  const { data: entidadesSS = [] } = useEntidadesSS(tipoEntidadFiltro || undefined);
  const { data: candidatosData } = useCandidatos({ estado: 'contratado', page_size: 200 });
  const { data: usersData } = useSelectUsers();

  const candidatos = candidatosData?.results || [];
  const users = usersData || [];

  const [formData, setFormData] = useState<AfiliacionSSFormData>({
    candidato: 0,
    entidad: 0,
    fecha_solicitud: new Date().toISOString().split('T')[0],
    responsable_tramite: 0,
    observaciones: '',
  });

  const handleChange = (field: keyof AfiliacionSSFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        ...formData,
        observaciones: formData.observaciones || undefined,
      },
      { onSuccess: onClose }
    );
  };

  const isValid =
    formData.candidato > 0 && formData.entidad > 0 && formData.responsable_tramite > 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Afiliacion SS"
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="afiliacion-form"
            disabled={!isValid}
            isLoading={createMutation.isPending}
          >
            <Shield size={16} className="mr-1" />
            Registrar Afiliacion
          </Button>
        </>
      }
    >
      <form id="afiliacion-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Shield size={12} />
            Registre la afiliacion del candidato contratado a una entidad de seguridad social (EPS,
            ARL, AFP, CCF).
          </p>
        </div>

        {/* Candidato */}
        <Select
          label="Candidato contratado"
          value={formData.candidato || ''}
          onChange={(e) => handleChange('candidato', Number(e.target.value))}
          required
        >
          <option value="">Seleccionar candidato...</option>
          {candidatos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre_completo} — {c.numero_identificacion}
            </option>
          ))}
        </Select>

        {/* Tipo entidad + Entidad */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de entidad"
            value={tipoEntidadFiltro}
            onChange={(e) => {
              setTipoEntidadFiltro(e.target.value);
              handleChange('entidad', 0);
            }}
          >
            <option value="">Todos los tipos</option>
            {tiposEntidad.map((tipo) => (
              <option key={tipo.id} value={tipo.codigo}>
                {tipo.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Entidad"
            value={formData.entidad || ''}
            onChange={(e) => handleChange('entidad', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar entidad...</option>
            {entidadesSS.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.nombre} ({ent.tipo_entidad_codigo})
              </option>
            ))}
          </Select>
        </div>

        {/* Fecha solicitud + Responsable */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de solicitud"
            type="date"
            value={formData.fecha_solicitud}
            onChange={(e) => handleChange('fecha_solicitud', e.target.value)}
            required
          />

          <Select
            label="Responsable del tramite"
            value={formData.responsable_tramite || ''}
            onChange={(e) => handleChange('responsable_tramite', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar responsable...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          placeholder="Notas adicionales sobre la afiliacion..."
          rows={2}
        />
      </form>
    </BaseModal>
  );
};
