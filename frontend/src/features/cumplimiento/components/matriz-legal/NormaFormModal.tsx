/**
 * Modal para crear/editar Normas Legales
 *
 * Formulario completo con:
 * - Información básica (tipo, número, año, título)
 * - Entidad emisora y fechas
 * - Sistemas de gestión aplicables (SST, Ambiental, Calidad, PESV)
 * - Contenido y resumen
 * - Estado de vigencia
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select, Checkbox } from '@/components/forms';
import { Alert } from '@/components/common/Alert';
import {
  useCreateNorma,
  useUpdateNorma,
  useTiposNorma,
} from '../../hooks/useNormasLegales';
import type { NormaLegal, NormaLegalCreateUpdate } from '../../types/matrizLegal';

interface NormaFormModalProps {
  norma: NormaLegal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NormaFormModal = ({ norma, isOpen, onClose }: NormaFormModalProps) => {
  const isEditing = norma !== null;

  const [formData, setFormData] = useState<NormaLegalCreateUpdate>({
    tipo_norma: 0,
    numero: '',
    anio: new Date().getFullYear(),
    titulo: '',
    entidad_emisora: '',
    fecha_expedicion: new Date().toISOString().split('T')[0],
    fecha_vigencia: null,
    url_original: null,
    resumen: null,
    contenido: null,
    aplica_sst: false,
    aplica_ambiental: false,
    aplica_calidad: false,
    aplica_pesv: false,
    vigente: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: tiposNorma } = useTiposNorma();
  const createMutation = useCreateNorma();
  const updateMutation = useUpdateNorma();

  useEffect(() => {
    if (norma) {
      setFormData({
        tipo_norma: norma.tipo_norma.id,
        numero: norma.numero,
        anio: norma.anio,
        titulo: norma.titulo,
        entidad_emisora: norma.entidad_emisora,
        fecha_expedicion: norma.fecha_expedicion,
        fecha_vigencia: norma.fecha_vigencia || null,
        url_original: norma.url_original || null,
        resumen: norma.resumen || null,
        contenido: norma.contenido || null,
        aplica_sst: norma.aplica_sst,
        aplica_ambiental: norma.aplica_ambiental,
        aplica_calidad: norma.aplica_calidad,
        aplica_pesv: norma.aplica_pesv,
        vigente: norma.vigente,
      });
    } else {
      // Reset para nueva norma
      setFormData({
        tipo_norma: tiposNorma?.[0]?.id || 0,
        numero: '',
        anio: new Date().getFullYear(),
        titulo: '',
        entidad_emisora: '',
        fecha_expedicion: new Date().toISOString().split('T')[0],
        fecha_vigencia: null,
        url_original: null,
        resumen: null,
        contenido: null,
        aplica_sst: false,
        aplica_ambiental: false,
        aplica_calidad: false,
        aplica_pesv: false,
        vigente: true,
      });
    }
    setErrors({});
  }, [norma, tiposNorma, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tipo_norma) {
      newErrors.tipo_norma = 'El tipo de norma es requerido';
    }
    if (!formData.numero.trim()) {
      newErrors.numero = 'El número es requerido';
    }
    if (!formData.anio || formData.anio < 1900 || formData.anio > new Date().getFullYear() + 1) {
      newErrors.anio = 'El año debe estar entre 1900 y el año actual';
    }
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    }
    if (!formData.entidad_emisora.trim()) {
      newErrors.entidad_emisora = 'La entidad emisora es requerida';
    }
    if (!formData.fecha_expedicion) {
      newErrors.fecha_expedicion = 'La fecha de expedición es requerida';
    }

    // Al menos un sistema debe estar seleccionado
    if (
      !formData.aplica_sst &&
      !formData.aplica_ambiental &&
      !formData.aplica_calidad &&
      !formData.aplica_pesv
    ) {
      newErrors.sistemas = 'Debe seleccionar al menos un sistema de gestión aplicable';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && norma) {
        await updateMutation.mutateAsync({ id: norma.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error: unknown) {
      // Los errores del backend se mostrarán automáticamente
      console.error('Error al guardar norma:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Norma'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Norma Legal' : 'Nueva Norma Legal'}
      subtitle={isEditing ? `Editando ${norma?.codigo_completo}` : 'Registrar nueva normatividad'}
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Tipo de Norma *"
              value={formData.tipo_norma}
              onChange={(e) =>
                setFormData({ ...formData, tipo_norma: parseInt(e.target.value) })
              }
              error={errors.tipo_norma}
              required
            >
              <option value="">Seleccionar tipo</option>
              {tiposNorma?.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre} ({tipo.codigo})
                </option>
              ))}
            </Select>

            <Input
              label="Número *"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              placeholder="Ej: 1072"
              error={errors.numero}
              required
            />

            <Input
              label="Año *"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.anio}
              onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) })}
              error={errors.anio}
              required
            />
          </div>

          <div className="mt-4">
            <Input
              label="Título *"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Nombre descriptivo de la norma"
              error={errors.titulo}
              required
            />
          </div>
        </div>

        {/* Entidad y Fechas */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Entidad Emisora y Fechas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Entidad Emisora *"
              value={formData.entidad_emisora}
              onChange={(e) => setFormData({ ...formData, entidad_emisora: e.target.value })}
              placeholder="Ej: Ministerio del Trabajo"
              error={errors.entidad_emisora}
              required
            />

            <Input
              label="Fecha Expedición *"
              type="date"
              value={formData.fecha_expedicion}
              onChange={(e) => setFormData({ ...formData, fecha_expedicion: e.target.value })}
              error={errors.fecha_expedicion}
              required
            />

            <Input
              label="Fecha Vigencia"
              type="date"
              value={formData.fecha_vigencia || ''}
              onChange={(e) =>
                setFormData({ ...formData, fecha_vigencia: e.target.value || null })
              }
              helperText="Opcional"
            />
          </div>

          <div className="mt-4">
            <Input
              label="URL Original"
              type="url"
              value={formData.url_original || ''}
              onChange={(e) => setFormData({ ...formData, url_original: e.target.value || null })}
              placeholder="https://..."
              helperText="Link al documento oficial"
            />
          </div>
        </div>

        {/* Sistemas de Gestión Aplicables */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Sistemas de Gestión Aplicables *
          </h3>
          {errors.sistemas && (
            <Alert variant="danger" message={errors.sistemas} className="mb-3" />
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'aplica_sst', label: 'SST', color: 'orange' },
              { key: 'aplica_ambiental', label: 'Ambiental', color: 'green' },
              { key: 'aplica_calidad', label: 'Calidad', color: 'blue' },
              { key: 'aplica_pesv', label: 'PESV', color: 'purple' },
            ].map((sistema) => {
              const key = sistema.key as keyof NormaLegalCreateUpdate;
              const isChecked = formData[key] as boolean;

              return (
                <div
                  key={sistema.key}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${isChecked
                      ? `border-${sistema.color}-500 bg-${sistema.color}-50 dark:bg-${sistema.color}-900/20`
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                  onClick={() => setFormData({ ...formData, [key]: !isChecked })}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    label={sistema.label}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen y Contenido */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Resumen y Contenido
          </h3>
          <div className="space-y-4">
            <Textarea
              label="Resumen"
              value={formData.resumen || ''}
              onChange={(e) => setFormData({ ...formData, resumen: e.target.value || null })}
              placeholder="Breve resumen del contenido de la norma..."
              rows={3}
              helperText="Descripción corta para referencia rápida"
            />

            <Textarea
              label="Contenido Completo"
              value={formData.contenido || ''}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value || null })}
              placeholder="Contenido completo o artículos relevantes de la norma..."
              rows={6}
              helperText="Texto completo o extracto de artículos aplicables"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Estado</h3>
          <Checkbox
            checked={formData.vigente}
            onChange={(e) => setFormData({ ...formData, vigente: e.target.checked })}
            label="Norma vigente (activa y aplicable)"
          />
        </div>
      </form>
    </BaseModal>
  );
};
