/**
 * Componente: Formulario de Proveedor (Crear/Editar)
 *
 * Formulario alineado con ProveedorCreateSerializer del backend.
 * Usa componentes del design system (Input, Select, Textarea, Checkbox).
 */
import { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Card } from '@/components/common';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';

import {
  useTiposProveedor,
  useTiposMateriaPrima,
  useModalidadesLogistica,
  useTiposDocumento,
  useDepartamentos,
  useFormasPago,
  useTiposCuentaBancaria,
} from '../hooks/useCatalogos';
import {
  useCreateProveedor,
  useUpdateProveedor,
  useUnidadesNegocio,
} from '../hooks/useProveedores';
import type { Proveedor, CreateProveedorDTO, UpdateProveedorDTO } from '../types';

// ==================== TIPOS ====================

interface ProveedorFormProps {
  proveedor?: Proveedor;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: Partial<CreateProveedorDTO> = {
  tipo_proveedor: 0,
  razon_social: '',
  nombre_comercial: '',
  tipo_documento: 0,
  numero_documento: '',
  nit: '',
  tipos_materia_prima: [],
  modalidad_logistica: 0,
  unidad_negocio: 0,
  telefono: '',
  email: '',
  departamento: 0,
  ciudad: '',
  direccion: '',
  formas_pago: [],
  dias_plazo_pago: 0,
  banco: '',
  tipo_cuenta: 0,
  numero_cuenta: '',
  titular_cuenta: '',
  observaciones: '',
  is_active: true,
};

// ==================== COMPONENTE ====================

export function ProveedorForm({ proveedor, isOpen, onClose }: ProveedorFormProps) {
  const isEdit = !!proveedor;

  const [formData, setFormData] = useState<Partial<CreateProveedorDTO>>(INITIAL_FORM);

  // ==================== QUERIES ====================

  const { data: tiposProveedor } = useTiposProveedor({ is_active: true });
  const { data: tiposMateriaPrima } = useTiposMateriaPrima({ is_active: true });
  const { data: modalidadesLogistica } = useModalidadesLogistica({ is_active: true });
  const { data: tiposDocumento } = useTiposDocumento({ is_active: true });
  const { data: departamentos } = useDepartamentos({ is_active: true });
  const { data: formasPago } = useFormasPago({ is_active: true });
  const { data: tiposCuenta } = useTiposCuentaBancaria({ is_active: true });
  const { data: unidadesNegocio } = useUnidadesNegocio({ is_active: true });

  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (proveedor && isOpen) {
      setFormData({
        tipo_proveedor: proveedor.tipo_proveedor,
        unidad_negocio: proveedor.unidad_negocio || 0,
        tipos_materia_prima: proveedor.tipos_materia_prima || [],
        modalidad_logistica: proveedor.modalidad_logistica || 0,
        razon_social: proveedor.razon_social || '',
        nombre_comercial: proveedor.nombre_comercial || '',
        tipo_documento: proveedor.tipo_documento,
        numero_documento: proveedor.numero_documento || '',
        nit: proveedor.nit || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        departamento: proveedor.departamento || 0,
        ciudad: proveedor.ciudad || '',
        direccion: proveedor.direccion || '',
        formas_pago: proveedor.formas_pago || [],
        dias_plazo_pago: proveedor.dias_plazo_pago || 0,
        banco: proveedor.banco || '',
        tipo_cuenta: proveedor.tipo_cuenta || 0,
        numero_cuenta: proveedor.numero_cuenta || '',
        titular_cuenta: proveedor.titular_cuenta || '',
        observaciones: proveedor.observaciones || '',
        is_active: proveedor.is_active,
      });
    } else if (!proveedor && isOpen) {
      setFormData(INITIAL_FORM);
    }
  }, [proveedor, isOpen]);

  // ==================== HANDLERS ====================

  const handleChange = (field: keyof CreateProveedorDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectChange = (field: keyof CreateProveedorDTO, value: number) => {
    const currentValues = (formData[field] as number[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    handleChange(field, newValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData } as Record<string, unknown>;
    // Clean FK fields with value 0
    if (!payload.tipo_proveedor) delete payload.tipo_proveedor;
    if (!payload.tipo_documento) delete payload.tipo_documento;
    if (!payload.unidad_negocio) delete payload.unidad_negocio;
    if (!payload.modalidad_logistica) delete payload.modalidad_logistica;
    if (!payload.departamento) delete payload.departamento;
    if (!payload.tipo_cuenta) delete payload.tipo_cuenta;
    if (!payload.dias_plazo_pago) delete payload.dias_plazo_pago;

    try {
      if (isEdit && proveedor) {
        await updateMutation.mutateAsync({
          id: proveedor.id,
          data: payload as UpdateProveedorDTO,
        });
      } else {
        await createMutation.mutateAsync(payload as CreateProveedorDTO);
      }
      onClose();
    } catch {
      // Error handled by mutation hooks
    }
  };

  // ==================== TIPO DE PROVEEDOR SELECCIONADO ====================

  const tipoProveedorList = Array.isArray(tiposProveedor) ? tiposProveedor : [];
  const tipoProveedorSeleccionado = tipoProveedorList.find((t) => t.id === formData.tipo_proveedor);
  const requiereMateriaPrima = tipoProveedorSeleccionado?.requiere_materia_prima ?? false;
  const requiereModalidadLogistica =
    tipoProveedorSeleccionado?.requiere_modalidad_logistica ?? false;

  const tiposMateriaPrimaList = Array.isArray(tiposMateriaPrima) ? tiposMateriaPrima : [];
  const modalidadesList = Array.isArray(modalidadesLogistica) ? modalidadesLogistica : [];
  const tiposDocumentoList = Array.isArray(tiposDocumento) ? tiposDocumento : [];
  const departamentosList = Array.isArray(departamentos) ? departamentos : [];
  const formasPagoList = Array.isArray(formasPago) ? formasPago : [];
  const tiposCuentaList = Array.isArray(tiposCuenta) ? tiposCuenta : [];
  const unidadesList = Array.isArray(unidadesNegocio) ? unidadesNegocio : [];

  // ==================== RENDERIZADO ====================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Código interno (solo lectura en edición) */}
        {isEdit && proveedor?.codigo_interno && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-500 dark:text-gray-400">Código: </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {proveedor.codigo_interno}
            </span>
          </div>
        )}

        {/* Información Básica */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Proveedor *"
              value={formData.tipo_proveedor || ''}
              onChange={(e) => handleChange('tipo_proveedor', Number(e.target.value))}
              required
            >
              <option value="">Seleccionar...</option>
              {tipoProveedorList.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </Select>

            {formData.tipo_proveedor !== 0 &&
              tipoProveedorSeleccionado?.codigo === 'UNIDAD_NEGOCIO' && (
                <Select
                  label="Unidad de Negocio"
                  value={formData.unidad_negocio || ''}
                  onChange={(e) => handleChange('unidad_negocio', Number(e.target.value))}
                >
                  <option value="">Seleccionar...</option>
                  {unidadesList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </Select>
              )}

            <div className="md:col-span-2">
              <Input
                label="Razón Social *"
                value={formData.razon_social || ''}
                onChange={(e) => handleChange('razon_social', e.target.value)}
                required
              />
            </div>

            <Input
              label="Nombre Comercial *"
              value={formData.nombre_comercial || ''}
              onChange={(e) => handleChange('nombre_comercial', e.target.value)}
              required
            />

            <Select
              label="Tipo de Documento *"
              value={formData.tipo_documento || ''}
              onChange={(e) => handleChange('tipo_documento', Number(e.target.value))}
              required
            >
              <option value="">Seleccionar...</option>
              {tiposDocumentoList.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Número de Documento *"
              value={formData.numero_documento || ''}
              onChange={(e) => handleChange('numero_documento', e.target.value)}
              required
            />

            <Input
              label="NIT"
              value={formData.nit || ''}
              onChange={(e) => handleChange('nit', e.target.value)}
              placeholder="Ej: 900123456-1"
            />
          </div>
        </Card>

        {/* Materia Prima y Logística */}
        {requiereMateriaPrima && (
          <Card variant="bordered" padding="md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Materias Primas y Logística
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipos de Materia Prima *
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                  {tiposMateriaPrimaList.map((tipo) => (
                    <Checkbox
                      key={tipo.id}
                      label={tipo.nombre}
                      checked={formData.tipos_materia_prima?.includes(tipo.id) || false}
                      onChange={() => handleMultiSelectChange('tipos_materia_prima', tipo.id)}
                    />
                  ))}
                </div>
              </div>

              {requiereModalidadLogistica && (
                <Select
                  label="Modalidad Logística"
                  value={formData.modalidad_logistica || ''}
                  onChange={(e) =>
                    handleChange('modalidad_logistica', e.target.value ? Number(e.target.value) : 0)
                  }
                >
                  <option value="">Seleccionar...</option>
                  {modalidadesList.map((modalidad) => (
                    <option key={modalidad.id} value={modalidad.id}>
                      {modalidad.nombre}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </Card>
        )}

        {/* Contacto y Ubicación */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contacto y Ubicación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              value={formData.telefono || ''}
              onChange={(e) => handleChange('telefono', e.target.value)}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />

            <Select
              label="Departamento"
              value={formData.departamento || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : 0;
                handleChange('departamento', val);
              }}
            >
              <option value="">Seleccionar...</option>
              {departamentosList.map((depto) => (
                <option key={depto.id} value={depto.id}>
                  {depto.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Ciudad"
              value={formData.ciudad || ''}
              onChange={(e) => handleChange('ciudad', e.target.value)}
              placeholder="Ej: Bogotá"
            />

            <div className="md:col-span-2">
              <Input
                label="Dirección"
                value={formData.direccion || ''}
                onChange={(e) => handleChange('direccion', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Información Bancaria */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información Bancaria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Banco"
              value={formData.banco || ''}
              onChange={(e) => handleChange('banco', e.target.value)}
            />

            <Select
              label="Tipo de Cuenta"
              value={formData.tipo_cuenta || ''}
              onChange={(e) => handleChange('tipo_cuenta', Number(e.target.value))}
            >
              <option value="">Seleccionar...</option>
              {tiposCuentaList.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Número de Cuenta"
              value={formData.numero_cuenta || ''}
              onChange={(e) => handleChange('numero_cuenta', e.target.value)}
            />

            <Input
              label="Titular de la Cuenta"
              value={formData.titular_cuenta || ''}
              onChange={(e) => handleChange('titular_cuenta', e.target.value)}
            />
          </div>
        </Card>

        {/* Condiciones Comerciales */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Condiciones Comerciales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formas de Pago
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                {formasPagoList.map((fp) => (
                  <Checkbox
                    key={fp.id}
                    label={fp.nombre}
                    checked={formData.formas_pago?.includes(fp.id) || false}
                    onChange={() => handleMultiSelectChange('formas_pago', fp.id)}
                  />
                ))}
              </div>
            </div>

            <Input
              label="Días de Plazo de Pago"
              type="number"
              value={formData.dias_plazo_pago || ''}
              onChange={(e) => handleChange('dias_plazo_pago', Number(e.target.value))}
              min={0}
            />

            <div className="md:col-span-2">
              <Checkbox
                label="Activo"
                checked={formData.is_active ?? true}
                onChange={(e) => handleChange('is_active', e.target.checked)}
              />
            </div>
          </div>
        </Card>

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones || ''}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={3}
        />

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="small" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{isEdit ? 'Actualizar' : 'Crear'}</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
