/**
 * Modal para crear/editar Requisitos de Empresa
 *
 * Formulario completo con:
 * - Selección de requisito legal (catálogo)
 * - Número de documento y fechas
 * - Estado del requisito
 * - Responsable
 * - Upload de documento soporte
 * - Observaciones
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Alert } from '@/components/common/Alert';
import { Upload } from 'lucide-react';
import {
  useCreateEmpresaRequisitoWithFile,
  useUpdateEmpresaRequisitoWithFile,
  useRequisitosLegales,
} from '../../hooks/useRequisitos';
import type { EmpresaRequisito, EmpresaRequisitoCreate, EstadoRequisito } from '../../types/requisitosLegales';

interface RequisitoFormModalProps {
  requisito: EmpresaRequisito | null;
  isOpen: boolean;
  onClose: () => void;
  empresaId: number;
}

export const RequisitoFormModal = ({
  requisito,
  isOpen,
  onClose,
  empresaId,
}: RequisitoFormModalProps) => {
  const isEditing = requisito !== null;

  const [formData, setFormData] = useState<EmpresaRequisitoCreate>({
    empresa_id: empresaId,
    requisito: 0,
    numero_documento: '',
    fecha_expedicion: null,
    fecha_vencimiento: null,
    estado: 'en_tramite',
    documento_soporte: null,
    responsable: null,
    observaciones: '',
    justificacion_no_aplica: '',
    requisito_anterior: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: requisitosData } = useRequisitosLegales();
  const createMutation = useCreateEmpresaRequisitoWithFile();
  const updateMutation = useUpdateEmpresaRequisitoWithFile();

  const requisitosLegales = requisitosData?.results || [];

  useEffect(() => {
    if (requisito) {
      setFormData({
        empresa_id: requisito.empresa_id,
        requisito: requisito.requisito,
        numero_documento: requisito.numero_documento || '',
        fecha_expedicion: requisito.fecha_expedicion || null,
        fecha_vencimiento: requisito.fecha_vencimiento || null,
        estado: requisito.estado,
        documento_soporte: null, // No enviamos el existente, solo si se actualiza
        responsable: requisito.responsable || null,
        observaciones: requisito.observaciones || '',
        justificacion_no_aplica: requisito.justificacion_no_aplica || '',
        requisito_anterior: requisito.requisito_anterior || null,
      });
    } else {
      setFormData({
        empresa_id: empresaId,
        requisito: requisitosLegales[0]?.id || 0,
        numero_documento: '',
        fecha_expedicion: null,
        fecha_vencimiento: null,
        estado: 'en_tramite',
        documento_soporte: null,
        responsable: null,
        observaciones: '',
        justificacion_no_aplica: '',
        requisito_anterior: null,
      });
    }
    setErrors({});
    setSelectedFile(null);
  }, [requisito, empresaId, requisitosLegales, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.requisito) {
      newErrors.requisito = 'El requisito legal es requerido';
    }

    if (formData.estado === 'no_aplica' && !formData.justificacion_no_aplica?.trim()) {
      newErrors.justificacion_no_aplica =
        'Debe justificar por qué el requisito no aplica';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData({ ...formData, documento_soporte: file as any });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const submitData = { ...formData };
      if (selectedFile) {
        submitData.documento_soporte = selectedFile as any;
      }

      if (isEditing && requisito) {
        await updateMutation.mutateAsync({ id: requisito.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onClose();
    } catch (error: any) {
      console.error('Error al guardar requisito:', error);
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
        {isEditing ? 'Guardar Cambios' : 'Crear Requisito'}
      </Button>
    </>
  );

  const showNoAplicaFields = formData.estado === 'no_aplica';
  const showDocumentFields = !showNoAplicaFields;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Requisito de Empresa' : 'Nuevo Requisito de Empresa'}
      subtitle={
        isEditing
          ? `Editando ${requisito?.requisito_nombre}`
          : 'Registrar cumplimiento de requisito legal'
      }
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Requisito Legal */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Requisito Legal
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Requisito *
            </label>
            <select
              value={formData.requisito}
              onChange={(e) =>
                setFormData({ ...formData, requisito: parseInt(e.target.value) })
              }
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              required
              disabled={isEditing}
            >
              <option value="">Seleccionar requisito</option>
              {requisitosLegales.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.codigo} - {req.nombre}
                </option>
              ))}
            </select>
            {errors.requisito && (
              <p className="mt-1 text-sm text-danger-600">{errors.requisito}</p>
            )}
          </div>
        </div>

        {/* Estado */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Estado del Requisito
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado *
            </label>
            <select
              value={formData.estado}
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value as EstadoRequisito })
              }
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              required
            >
              <option value="vigente">Vigente</option>
              <option value="proximo_vencer">Próximo a Vencer</option>
              <option value="vencido">Vencido</option>
              <option value="en_tramite">En Trámite</option>
              <option value="renovando">En Renovación</option>
              <option value="no_aplica">No Aplica</option>
            </select>
          </div>
        </div>

        {/* Campos de documento (solo si no es "No Aplica") */}
        {showDocumentFields && (
          <>
            {/* Información del Documento */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                Información del Documento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Número de Documento"
                  value={formData.numero_documento || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_documento: e.target.value })
                  }
                  placeholder="Ej: RUT-123456789"
                />

                <Input
                  label="Fecha Expedición"
                  type="date"
                  value={formData.fecha_expedicion || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_expedicion: e.target.value || null })
                  }
                />

                <Input
                  label="Fecha Vencimiento"
                  type="date"
                  value={formData.fecha_vencimiento || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_vencimiento: e.target.value || null })
                  }
                  helperText="Dejar vacío si no vence"
                />
              </div>
            </div>

            {/* Upload de Documento */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                Documento Soporte
              </h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm text-primary-600 hover:text-primary-500"
                  >
                    <span>Click para subir archivo</span>
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </label>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Archivo seleccionado: {selectedFile.name}
                    </p>
                  )}
                  {isEditing && requisito?.documento_soporte && !selectedFile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Documento actual: {requisito.documento_soporte.split('/').pop()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG (Máx. 10MB)
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Campos para "No Aplica" */}
        {showNoAplicaFields && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Justificación de No Aplicabilidad
            </h3>
            <Alert
              variant="warning"
              message="Debe justificar por qué este requisito no aplica para la empresa"
              className="mb-4"
            />
            <Textarea
              label="Justificación *"
              value={formData.justificacion_no_aplica || ''}
              onChange={(e) =>
                setFormData({ ...formData, justificacion_no_aplica: e.target.value })
              }
              placeholder="Explique por qué este requisito no es aplicable para su empresa..."
              rows={4}
              error={errors.justificacion_no_aplica}
              required
            />
          </div>
        )}

        {/* Observaciones */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Observaciones Adicionales
          </h3>
          <Textarea
            label="Observaciones"
            value={formData.observaciones || ''}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            placeholder="Información adicional sobre el requisito..."
            rows={3}
            helperText="Opcional"
          />
        </div>
      </form>
    </BaseModal>
  );
};
