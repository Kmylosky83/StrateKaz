/**
 * Modal para crear/editar Partes Interesadas
 *
 * Formulario completo con:
 * - Información básica (tipo, nombre, descripción)
 * - Representante y datos de contacto
 * - Nivel de influencia e interés (para matriz)
 * - Sistemas de gestión relacionados (SST, Ambiental, Calidad, PESV)
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Alert } from '@/components/common/Alert';
import { Badge } from '@/components/common/Badge';
import { TrendingUp, Target, Building2, User } from 'lucide-react';
import { useTiposParteInteresada } from '../../hooks/usePartesInteresadas';
import type {
  ParteInteresada,
  ParteInteresadaCreate,
  NivelInfluencia,
  NivelInteres,
} from '../../types';

interface ParteFormModalProps {
  parte: ParteInteresada | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ParteFormModal = ({ parte, isOpen, onClose }: ParteFormModalProps) => {
  const isEditing = parte !== null;

  const [formData, setFormData] = useState<ParteInteresadaCreate>({
    empresa_id: 0, // Se debe obtener del auth store
    tipo: 0,
    nombre: '',
    descripcion: '',
    representante: '',
    cargo_representante: '',
    telefono: '',
    email: '',
    direccion: '',
    nivel_influencia: 'media',
    nivel_interes: 'medio',
    relacionado_sst: false,
    relacionado_ambiental: false,
    relacionado_calidad: false,
    relacionado_pesv: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hooks
  const tiposQuery = useTiposParteInteresada();
  const { data: tiposData } = tiposQuery;
  const tipos = tiposData?.results || [];

  useEffect(() => {
    if (parte) {
      setFormData({
        empresa_id: parte.empresa_id,
        tipo: parte.tipo,
        nombre: parte.nombre,
        descripcion: parte.descripcion || '',
        representante: parte.representante || '',
        cargo_representante: parte.cargo_representante || '',
        telefono: parte.telefono || '',
        email: parte.email || '',
        direccion: parte.direccion || '',
        nivel_influencia: parte.nivel_influencia,
        nivel_interes: parte.nivel_interes,
        relacionado_sst: parte.relacionado_sst,
        relacionado_ambiental: parte.relacionado_ambiental,
        relacionado_calidad: parte.relacionado_calidad,
        relacionado_pesv: parte.relacionado_pesv,
      });
    } else {
      // Reset para nueva parte
      setFormData({
        empresa_id: 0, // TODO: Obtener del auth store
        tipo: tipos[0]?.id || 0,
        nombre: '',
        descripcion: '',
        representante: '',
        cargo_representante: '',
        telefono: '',
        email: '',
        direccion: '',
        nivel_influencia: 'media',
        nivel_interes: 'medio',
        relacionado_sst: false,
        relacionado_ambiental: false,
        relacionado_calidad: false,
        relacionado_pesv: false,
      });
    }
    setErrors({});
  }, [parte, tipos, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo de parte interesada es requerido';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // TODO: Implementar createMutation y updateMutation
      console.log('Guardar parte interesada:', formData);
      onClose();
    } catch (error: any) {
      console.error('Error al guardar parte interesada:', error);
    }
  };

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" onClick={handleSubmit}>
        {isEditing ? 'Guardar Cambios' : 'Crear Parte Interesada'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Parte Interesada' : 'Nueva Parte Interesada'}
      subtitle={
        isEditing
          ? `Editando ${parte?.nombre}`
          : 'Registrar nueva parte interesada según ISO 9001:2015 (4.2)'
      }
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Parte Interesada *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: parseInt(e.target.value) })}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                required
              >
                <option value="">Seleccionar tipo</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} ({tipo.categoria_display})
                  </option>
                ))}
              </select>
              {errors.tipo && <p className="mt-1 text-sm text-danger-600">{errors.tipo}</p>}
            </div>

            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Alcaldía Municipal, Clientes Comerciales"
              error={errors.nombre}
              required
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la parte interesada y su relación con la organización..."
              rows={3}
              helperText="Opcional: contexto adicional sobre esta parte interesada"
            />
          </div>
        </div>

        {/* Representante y Contacto */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Representante y Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Representante"
              value={formData.representante}
              onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
              placeholder="Nombre completo"
              helperText="Opcional"
            />

            <Input
              label="Cargo del Representante"
              value={formData.cargo_representante}
              onChange={(e) => setFormData({ ...formData, cargo_representante: e.target.value })}
              placeholder="Ej: Gerente General, Alcalde"
              helperText="Opcional"
            />

            <Input
              label="Correo Electrónico"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ejemplo@dominio.com"
              error={errors.email}
              helperText="Opcional"
            />

            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej: 3001234567"
              helperText="Opcional"
            />
          </div>

          <div className="mt-4">
            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección completa"
              helperText="Opcional"
            />
          </div>
        </div>

        {/* Matriz de Influencia/Interés */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            Análisis de Influencia e Interés
            <Badge variant="info" size="sm">
              Para matriz visual
            </Badge>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nivel de Influencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Nivel de Influencia</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Capacidad de la parte para afectar decisiones de la organización
              </p>
              <div className="space-y-2">
                {(['alta', 'media', 'baja'] as NivelInfluencia[]).map((nivel) => {
                  const labels = {
                    alta: { text: 'Alta', color: 'danger', desc: 'Afecta significativamente' },
                    media: { text: 'Media', color: 'warning', desc: 'Afecta moderadamente' },
                    baja: { text: 'Baja', color: 'gray', desc: 'Afecta poco' },
                  };

                  return (
                    <label
                      key={nivel}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          formData.nivel_influencia === nivel
                            ? `border-${labels[nivel].color}-500 bg-${labels[nivel].color}-50 dark:bg-${labels[nivel].color}-900/20`
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="nivel_influencia"
                        value={nivel}
                        checked={formData.nivel_influencia === nivel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nivel_influencia: e.target.value as NivelInfluencia,
                          })
                        }
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {labels[nivel].text}
                          </span>
                          <Badge variant={labels[nivel].color as any} size="sm">
                            {nivel}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {labels[nivel].desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Nivel de Interés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>Nivel de Interés</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Grado de preocupación por las actividades de la organización
              </p>
              <div className="space-y-2">
                {(['alto', 'medio', 'bajo'] as NivelInteres[]).map((nivel) => {
                  const labels = {
                    alto: { text: 'Alto', color: 'danger', desc: 'Muy interesado' },
                    medio: { text: 'Medio', color: 'warning', desc: 'Moderadamente interesado' },
                    bajo: { text: 'Bajo', color: 'gray', desc: 'Poco interesado' },
                  };

                  return (
                    <label
                      key={nivel}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          formData.nivel_interes === nivel
                            ? `border-${labels[nivel].color}-500 bg-${labels[nivel].color}-50 dark:bg-${labels[nivel].color}-900/20`
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="nivel_interes"
                        value={nivel}
                        checked={formData.nivel_interes === nivel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nivel_interes: e.target.value as NivelInteres,
                          })
                        }
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {labels[nivel].text}
                          </span>
                          <Badge variant={labels[nivel].color as any} size="sm">
                            {nivel}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {labels[nivel].desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sistemas de Gestión Relacionados */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Sistemas de Gestión Relacionados
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'relacionado_sst', label: 'SST', color: 'orange' },
              { key: 'relacionado_ambiental', label: 'Ambiental', color: 'green' },
              { key: 'relacionado_calidad', label: 'Calidad', color: 'blue' },
              { key: 'relacionado_pesv', label: 'PESV', color: 'purple' },
            ].map((sistema) => {
              const key = sistema.key as keyof ParteInteresadaCreate;
              const isChecked = formData[key] as boolean;

              return (
                <label
                  key={sistema.key}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      isChecked
                        ? `border-${sistema.color}-500 bg-${sistema.color}-50 dark:bg-${sistema.color}-900/20`
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {sistema.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
