/**
 * Modal para crear/editar Reglamentos Internos
 *
 * Formulario completo con:
 * - Tipo de reglamento (catálogo)
 * - Código, nombre y descripción
 * - Control de versiones
 * - Estado del reglamento
 * - Fechas (aprobación, vigencia, próxima revisión)
 * - Aprobador
 * - Upload de documento
 * - Sistemas aplicables (SST, Ambiental, Calidad, PESV)
 * - Observaciones
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select, Checkbox } from '@/components/forms';
import { Alert } from '@/components/common/Alert';
import { Upload, FileText } from 'lucide-react';
import {
  useCreateReglamentoWithFile,
  useUpdateReglamentoWithFile,
  useTiposReglamento,
} from '../../hooks/useReglamentos';
import type { Reglamento, CreateReglamentoDTO, EstadoReglamento } from '../../types/cumplimiento.types';

interface ReglamentoFormModalProps {
  reglamento: Reglamento | null;
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
}

export const ReglamentoFormModal = ({
  reglamento,
  isOpen,
  onClose,
  empresaId,
}: ReglamentoFormModalProps) => {
  const isEditing = reglamento !== null;

  const [formData, setFormData] = useState<CreateReglamentoDTO>({
    empresa: empresaId,
    tipo: 0,
    codigo: '',
    nombre: '',
    descripcion: '',
    estado: 'borrador',
    version_actual: '1.0',
    fecha_aprobacion: undefined,
    fecha_vigencia: undefined,
    fecha_proxima_revision: undefined,
    aprobado_por: undefined,
    documento: undefined,
    aplica_sst: false,
    aplica_ambiental: false,
    aplica_calidad: false,
    aplica_pesv: false,
    observaciones: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: tiposData } = useTiposReglamento();
  const createMutation = useCreateReglamentoWithFile();
  const updateMutation = useUpdateReglamentoWithFile();

  const tiposReglamento = tiposData?.results || [];

  useEffect(() => {
    if (reglamento) {
      setFormData({
        empresa: reglamento.empresa,
        tipo: reglamento.tipo,
        codigo: reglamento.codigo || '',
        nombre: reglamento.nombre || '',
        descripcion: reglamento.descripcion || '',
        estado: reglamento.estado,
        version_actual: reglamento.version_actual || '1.0',
        fecha_aprobacion: reglamento.fecha_aprobacion || undefined,
        fecha_vigencia: reglamento.fecha_vigencia || undefined,
        fecha_proxima_revision: reglamento.fecha_proxima_revision || undefined,
        aprobado_por: reglamento.aprobado_por || undefined,
        documento: undefined, // No enviamos el existente, solo si se actualiza
        aplica_sst: reglamento.aplica_sst,
        aplica_ambiental: reglamento.aplica_ambiental,
        aplica_calidad: reglamento.aplica_calidad,
        aplica_pesv: reglamento.aplica_pesv,
        observaciones: reglamento.observaciones || '',
      });
    } else {
      setFormData({
        empresa: empresaId,
        tipo: tiposReglamento[0]?.id || 0,
        codigo: '',
        nombre: '',
        descripcion: '',
        estado: 'borrador',
        version_actual: '1.0',
        fecha_aprobacion: undefined,
        fecha_vigencia: undefined,
        fecha_proxima_revision: undefined,
        aprobado_por: undefined,
        documento: undefined,
        aplica_sst: false,
        aplica_ambiental: false,
        aplica_calidad: false,
        aplica_pesv: false,
        observaciones: '',
      });
    }
    setErrors({});
    setSelectedFile(null);
  }, [reglamento, empresaId, tiposReglamento, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tipo) {
      newErrors.tipo = 'El tipo de reglamento es requerido';
    }

    if (!formData.codigo?.trim()) {
      newErrors.codigo = 'El código es requerido';
    }

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.version_actual?.trim()) {
      newErrors.version_actual = 'La versión es requerida';
    }

    // Validar que al menos un sistema esté seleccionado
    if (!formData.aplica_sst && !formData.aplica_ambiental && !formData.aplica_calidad && !formData.aplica_pesv) {
      newErrors.sistemas = 'Debe seleccionar al menos un sistema de gestión';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData({ ...formData, documento: file as any });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const submitData = { ...formData };
      if (selectedFile) {
        submitData.documento = selectedFile as any;
      }

      if (isEditing && reglamento) {
        await updateMutation.mutateAsync({ id: reglamento.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onClose();
    } catch (error: any) {
      console.error('Error al guardar reglamento:', error);
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
        {isEditing ? 'Guardar Cambios' : 'Crear Reglamento'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Reglamento Interno' : 'Nuevo Reglamento Interno'}
      subtitle={
        isEditing
          ? `Editando ${reglamento?.nombre}`
          : 'Crear nuevo reglamento para la empresa'
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
            <Select
              label="Tipo de Reglamento *"
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: parseInt(e.target.value) })
              }
              error={errors.tipo}
              required
            >
              <option value="">Seleccionar tipo</option>
              {tiposReglamento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.codigo} - {tipo.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Código *"
              value={formData.codigo || ''}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ej: RIT-001"
              error={errors.codigo}
              required
            />

            <div className="md:col-span-2">
              <Input
                label="Nombre del Reglamento *"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Reglamento Interno de Trabajo"
                error={errors.nombre}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Descripción"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción breve del reglamento..."
                rows={2}
                helperText="Opcional"
              />
            </div>
          </div>
        </div>

        {/* Estado y Versión */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Estado y Versión
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Estado *"
              value={formData.estado}
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value as EstadoReglamento })
              }
              required
            >
              <option value="borrador">Borrador</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobado">Aprobado</option>
              <option value="vigente">Vigente</option>
              <option value="obsoleto">Obsoleto</option>
            </Select>

            <Input
              label="Versión Actual *"
              value={formData.version_actual || ''}
              onChange={(e) => setFormData({ ...formData, version_actual: e.target.value })}
              placeholder="Ej: 1.0"
              error={errors.version_actual}
              required
            />
          </div>
        </div>

        {/* Fechas */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Fechas de Control
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha de Aprobación"
              type="date"
              value={formData.fecha_aprobacion || ''}
              onChange={(e) =>
                setFormData({ ...formData, fecha_aprobacion: e.target.value || undefined })
              }
              helperText="Opcional"
            />

            <Input
              label="Fecha de Vigencia"
              type="date"
              value={formData.fecha_vigencia || ''}
              onChange={(e) =>
                setFormData({ ...formData, fecha_vigencia: e.target.value || undefined })
              }
              helperText="Opcional"
            />

            <Input
              label="Próxima Revisión"
              type="date"
              value={formData.fecha_proxima_revision || ''}
              onChange={(e) =>
                setFormData({ ...formData, fecha_proxima_revision: e.target.value || undefined })
              }
              helperText="Opcional"
            />
          </div>
        </div>

        {/* Sistemas Aplicables */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Sistemas de Gestión Aplicables *
          </h3>
          {errors.sistemas && (
            <Alert
              variant="danger"
              message={errors.sistemas}
              className="mb-4"
            />
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Checkbox
              checked={formData.aplica_sst}
              onChange={(e) => setFormData({ ...formData, aplica_sst: e.target.checked })}
              label="SST"
            />
            <Checkbox
              checked={formData.aplica_ambiental}
              onChange={(e) => setFormData({ ...formData, aplica_ambiental: e.target.checked })}
              label="Ambiental"
            />
            <Checkbox
              checked={formData.aplica_calidad}
              onChange={(e) => setFormData({ ...formData, aplica_calidad: e.target.checked })}
              label="Calidad"
            />
            <Checkbox
              checked={formData.aplica_pesv}
              onChange={(e) => setFormData({ ...formData, aplica_pesv: e.target.checked })}
              label="PESV"
            />
          </div>
        </div>

        {/* Upload de Documento */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Documento del Reglamento
          </h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm text-primary-600 hover:text-primary-500"
              >
                <span>Click para subir documento</span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
              </label>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="h-4 w-4" />
                  <span>Archivo seleccionado: {selectedFile.name}</span>
                </div>
              )}
              {isEditing && reglamento?.documento && !selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="h-4 w-4" />
                  <span>Documento actual: {reglamento.documento.split('/').pop()}</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                PDF o DOC (Máx. 10MB)
              </p>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Observaciones Adicionales
          </h3>
          <Textarea
            label="Observaciones"
            value={formData.observaciones || ''}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            placeholder="Información adicional sobre el reglamento..."
            rows={3}
            helperText="Opcional"
          />
        </div>
      </form>
    </BaseModal>
  );
};
