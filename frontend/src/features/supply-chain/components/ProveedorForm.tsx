/**
 * Componente: Formulario de Proveedor (Crear/Editar)
 *
 * Formulario completo con validación y secciones organizadas.
 * Usa componentes del design system (Input, Select, Textarea).
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
  useCiudades,
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
  codigo: '',
  tipo_proveedor: 0,
  razon_social: '',
  tipo_documento: 0,
  numero_documento: '',
  digito_verificacion: '',
  nombre_comercial: '',
  tipos_materia_prima: [],
  modalidad_logistica: 0,
  unidad_negocio: 0,
  telefono: '',
  celular: '',
  email: '',
  sitio_web: '',
  departamento: 0,
  ciudad: 0,
  direccion: '',
  barrio: '',
  nombre_representante_legal: '',
  tipo_documento_representante: 0,
  documento_representante: '',
  email_representante: '',
  telefono_representante: '',
  banco: '',
  tipo_cuenta: 0,
  numero_cuenta: '',
  forma_pago_default: 0,
  dias_pago_default: 0,
  aplica_retencion_fuente: false,
  porcentaje_retencion: 0,
  estado: 'ACTIVO',
  es_proveedor_critico: false,
  observaciones: '',
  is_active: true,
};

// ==================== COMPONENTE ====================

export function ProveedorForm({ proveedor, isOpen, onClose }: ProveedorFormProps) {
  const isEdit = !!proveedor;

  const [formData, setFormData] = useState<Partial<CreateProveedorDTO>>(INITIAL_FORM);
  const [selectedDepartamento, setSelectedDepartamento] = useState<number>(0);

  // ==================== QUERIES ====================

  const { data: tiposProveedor } = useTiposProveedor({ is_active: true });
  const { data: tiposMateriaPrima } = useTiposMateriaPrima({ is_active: true });
  const { data: modalidadesLogistica } = useModalidadesLogistica({ is_active: true });
  const { data: tiposDocumento } = useTiposDocumento({ is_active: true });
  const { data: departamentos } = useDepartamentos({ is_active: true });
  const { data: ciudades } = useCiudades({
    departamento: selectedDepartamento || undefined,
    is_active: true,
  });
  const { data: formasPago } = useFormasPago({ is_active: true });
  const { data: tiposCuenta } = useTiposCuentaBancaria({ is_active: true });
  const { data: unidadesNegocio } = useUnidadesNegocio({ is_active: true });

  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (proveedor) {
      setFormData({
        codigo: proveedor.codigo,
        tipo_proveedor: proveedor.tipo_proveedor,
        unidad_negocio: proveedor.unidad_negocio || 0,
        tipos_materia_prima: proveedor.tipos_materia_prima,
        modalidad_logistica: proveedor.modalidad_logistica || 0,
        razon_social: proveedor.razon_social,
        nombre_comercial: proveedor.nombre_comercial || '',
        tipo_documento: proveedor.tipo_documento,
        numero_documento: proveedor.numero_documento,
        digito_verificacion: proveedor.digito_verificacion || '',
        telefono: proveedor.telefono || '',
        celular: proveedor.celular || '',
        email: proveedor.email || '',
        sitio_web: proveedor.sitio_web || '',
        departamento: proveedor.departamento || 0,
        ciudad: proveedor.ciudad || 0,
        direccion: proveedor.direccion || '',
        barrio: proveedor.barrio || '',
        nombre_representante_legal: proveedor.nombre_representante_legal || '',
        tipo_documento_representante: proveedor.tipo_documento_representante || 0,
        documento_representante: proveedor.documento_representante || '',
        email_representante: proveedor.email_representante || '',
        telefono_representante: proveedor.telefono_representante || '',
        banco: proveedor.banco || '',
        tipo_cuenta: proveedor.tipo_cuenta || 0,
        numero_cuenta: proveedor.numero_cuenta || '',
        forma_pago_default: proveedor.forma_pago_default || 0,
        dias_pago_default: proveedor.dias_pago_default || 0,
        aplica_retencion_fuente: proveedor.aplica_retencion_fuente,
        porcentaje_retencion: proveedor.porcentaje_retencion || 0,
        estado: proveedor.estado,
        es_proveedor_critico: proveedor.es_proveedor_critico,
        observaciones: proveedor.observaciones || '',
        is_active: proveedor.is_active,
      });
      setSelectedDepartamento(proveedor.departamento || 0);
    } else {
      setFormData(INITIAL_FORM);
      setSelectedDepartamento(0);
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

  const handleDepartamentoChange = (value: string) => {
    const numValue = value ? Number(value) : 0;
    setSelectedDepartamento(numValue);
    handleChange('departamento', numValue);
    handleChange('ciudad', 0);
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
    if (!payload.ciudad) delete payload.ciudad;
    if (!payload.tipo_documento_representante) delete payload.tipo_documento_representante;
    if (!payload.tipo_cuenta) delete payload.tipo_cuenta;
    if (!payload.forma_pago_default) delete payload.forma_pago_default;

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
  const ciudadesList = Array.isArray(ciudades) ? ciudades : [];
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
        {/* Información Básica */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código"
              value={formData.codigo || ''}
              onChange={(e) => handleChange('codigo', e.target.value)}
              placeholder="Se genera automáticamente"
            />

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
              label="Nombre Comercial"
              value={formData.nombre_comercial || ''}
              onChange={(e) => handleChange('nombre_comercial', e.target.value)}
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
              label="Dígito de Verificación"
              value={formData.digito_verificacion || ''}
              onChange={(e) => handleChange('digito_verificacion', e.target.value)}
              maxLength={1}
            />

            <Select
              label="Estado"
              value={formData.estado || 'ACTIVO'}
              onChange={(e) =>
                handleChange(
                  'estado',
                  e.target.value as 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO'
                )
              }
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </Select>

            <div className="flex items-center gap-4 pt-6">
              <Checkbox
                label="Proveedor crítico"
                checked={formData.es_proveedor_critico || false}
                onChange={(e) => handleChange('es_proveedor_critico', e.target.checked)}
              />
            </div>
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

        {/* Contacto */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              value={formData.telefono || ''}
              onChange={(e) => handleChange('telefono', e.target.value)}
            />

            <Input
              label="Celular"
              type="tel"
              value={formData.celular || ''}
              onChange={(e) => handleChange('celular', e.target.value)}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />

            <Input
              label="Sitio Web"
              type="url"
              value={formData.sitio_web || ''}
              onChange={(e) => handleChange('sitio_web', e.target.value)}
            />

            <Select
              label="Departamento"
              value={selectedDepartamento || ''}
              onChange={(e) => handleDepartamentoChange(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {departamentosList.map((depto) => (
                <option key={depto.id} value={depto.id}>
                  {depto.nombre}
                </option>
              ))}
            </Select>

            <Select
              label="Ciudad"
              value={formData.ciudad || ''}
              onChange={(e) => handleChange('ciudad', e.target.value ? Number(e.target.value) : 0)}
              disabled={!selectedDepartamento}
            >
              <option value="">Seleccionar...</option>
              {ciudadesList.map((ciudad) => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.nombre}
                </option>
              ))}
            </Select>

            <div className="md:col-span-2">
              <Input
                label="Dirección"
                value={formData.direccion || ''}
                onChange={(e) => handleChange('direccion', e.target.value)}
              />
            </div>

            <Input
              label="Barrio"
              value={formData.barrio || ''}
              onChange={(e) => handleChange('barrio', e.target.value)}
            />
          </div>
        </Card>

        {/* Representante Legal */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Representante Legal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.nombre_representante_legal || ''}
              onChange={(e) => handleChange('nombre_representante_legal', e.target.value)}
            />

            <Select
              label="Tipo de Documento"
              value={formData.tipo_documento_representante || ''}
              onChange={(e) => handleChange('tipo_documento_representante', Number(e.target.value))}
            >
              <option value="">Seleccionar...</option>
              {tiposDocumentoList.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Documento"
              value={formData.documento_representante || ''}
              onChange={(e) => handleChange('documento_representante', e.target.value)}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email_representante || ''}
              onChange={(e) => handleChange('email_representante', e.target.value)}
            />

            <Input
              label="Teléfono"
              type="tel"
              value={formData.telefono_representante || ''}
              onChange={(e) => handleChange('telefono_representante', e.target.value)}
            />
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
          </div>
        </Card>

        {/* Configuración Comercial */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Configuración Comercial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Forma de Pago"
              value={formData.forma_pago_default || ''}
              onChange={(e) => handleChange('forma_pago_default', Number(e.target.value))}
            >
              <option value="">Seleccionar...</option>
              {formasPagoList.map((fp) => (
                <option key={fp.id} value={fp.id}>
                  {fp.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Días de Pago"
              type="number"
              value={formData.dias_pago_default || ''}
              onChange={(e) => handleChange('dias_pago_default', Number(e.target.value))}
              min={0}
            />

            <div className="flex items-center gap-4 pt-6">
              <Checkbox
                label="Aplica retención en la fuente"
                checked={formData.aplica_retencion_fuente || false}
                onChange={(e) => handleChange('aplica_retencion_fuente', e.target.checked)}
              />
            </div>

            {formData.aplica_retencion_fuente && (
              <Input
                label="Porcentaje de Retención (%)"
                type="number"
                value={formData.porcentaje_retencion || ''}
                onChange={(e) => handleChange('porcentaje_retencion', Number(e.target.value))}
                min={0}
                max={100}
                step={0.01}
              />
            )}
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
