/**
 * Componente: Formulario de Proveedor (Crear/Editar)
 *
 * Características:
 * - Formulario completo con validación
 * - Secciones organizadas (info básica, contacto, bancaria, etc.)
 * - Selección dinámica de catálogos
 * - Campos condicionales según tipo de proveedor
 */
import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

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
import { useCreateProveedor, useUpdateProveedor, useUnidadesNegocio } from '../hooks/useProveedores';
import type { Proveedor, CreateProveedorDTO, UpdateProveedorDTO } from '../types';

// ==================== TIPOS ====================

interface ProveedorFormProps {
  proveedor?: Proveedor;
  isOpen: boolean;
  onClose: () => void;
}

// ==================== COMPONENTE ====================

export function ProveedorForm({ proveedor, isOpen, onClose }: ProveedorFormProps) {
  const isEdit = !!proveedor;

  // ==================== ESTADO DEL FORMULARIO ====================

  const [formData, setFormData] = useState<Partial<CreateProveedorDTO>>({
    codigo: '',
    tipo_proveedor: undefined,
    razon_social: '',
    tipo_documento: undefined,
    numero_documento: '',
    tipos_materia_prima: [],
    aplica_retencion_fuente: false,
    estado: 'ACTIVO',
    es_proveedor_critico: false,
    is_active: true,
  });

  const [selectedDepartamento, setSelectedDepartamento] = useState<number | undefined>();

  // ==================== QUERIES ====================

  const { data: tiposProveedor } = useTiposProveedor({ is_active: true });
  const { data: tiposMateriaPrima } = useTiposMateriaPrima({ is_active: true });
  const { data: modalidadesLogistica } = useModalidadesLogistica({ is_active: true });
  const { data: tiposDocumento } = useTiposDocumento({ is_active: true });
  const { data: departamentos } = useDepartamentos({ is_active: true });
  const { data: ciudades } = useCiudades({
    departamento: selectedDepartamento,
    is_active: true,
  });
  const { data: formasPago } = useFormasPago({ is_active: true });
  const { data: tiposCuenta } = useTiposCuentaBancaria({ is_active: true });
  const { data: unidadesNegocio } = useUnidadesNegocio({ is_active: true });

  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (proveedor) {
      setFormData({
        codigo: proveedor.codigo,
        tipo_proveedor: proveedor.tipo_proveedor,
        unidad_negocio: proveedor.unidad_negocio,
        tipos_materia_prima: proveedor.tipos_materia_prima,
        modalidad_logistica: proveedor.modalidad_logistica,
        razon_social: proveedor.razon_social,
        nombre_comercial: proveedor.nombre_comercial,
        tipo_documento: proveedor.tipo_documento,
        numero_documento: proveedor.numero_documento,
        digito_verificacion: proveedor.digito_verificacion,
        telefono: proveedor.telefono,
        celular: proveedor.celular,
        email: proveedor.email,
        sitio_web: proveedor.sitio_web,
        departamento: proveedor.departamento,
        ciudad: proveedor.ciudad,
        direccion: proveedor.direccion,
        barrio: proveedor.barrio,
        nombre_representante_legal: proveedor.nombre_representante_legal,
        tipo_documento_representante: proveedor.tipo_documento_representante,
        documento_representante: proveedor.documento_representante,
        email_representante: proveedor.email_representante,
        telefono_representante: proveedor.telefono_representante,
        banco: proveedor.banco,
        tipo_cuenta: proveedor.tipo_cuenta,
        numero_cuenta: proveedor.numero_cuenta,
        forma_pago_default: proveedor.forma_pago_default,
        dias_pago_default: proveedor.dias_pago_default,
        aplica_retencion_fuente: proveedor.aplica_retencion_fuente,
        porcentaje_retencion: proveedor.porcentaje_retencion,
        estado: proveedor.estado,
        es_proveedor_critico: proveedor.es_proveedor_critico,
        observaciones: proveedor.observaciones,
        is_active: proveedor.is_active,
      });
      setSelectedDepartamento(proveedor.departamento);
    }
  }, [proveedor]);

  // ==================== HANDLERS ====================

  const handleChange = (field: keyof CreateProveedorDTO, value: any) => {
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

    try {
      if (isEdit && proveedor) {
        await updateMutation.mutateAsync({
          id: proveedor.id,
          data: formData as UpdateProveedorDTO,
        });
      } else {
        await createMutation.mutateAsync(formData as CreateProveedorDTO);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
    }
  };

  const handleDepartamentoChange = (value: number | undefined) => {
    setSelectedDepartamento(value);
    handleChange('departamento', value);
    handleChange('ciudad', undefined); // Reset ciudad
  };

  // ==================== TIPO DE PROVEEDOR SELECCIONADO ====================

  const tipoProveedorSeleccionado = Array.isArray(tiposProveedor)
    ? tiposProveedor.find((t) => t.id === formData.tipo_proveedor)
    : undefined;

  const requiereMateriaPrima = tipoProveedorSeleccionado?.requiere_materia_prima ?? false;
  const requiereModalidadLogistica = tipoProveedorSeleccionado?.requiere_modalidad_logistica ?? false;

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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.codigo || ''}
                onChange={(e) => handleChange('codigo', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Proveedor *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.tipo_proveedor || ''}
                onChange={(e) => handleChange('tipo_proveedor', Number(e.target.value))}
              >
                <option value="">Seleccionar...</option>
                {Array.isArray(tiposProveedor) &&
                  tiposProveedor.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.razon_social || ''}
                onChange={(e) => handleChange('razon_social', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Comercial
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.nombre_comercial || ''}
                onChange={(e) => handleChange('nombre_comercial', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Documento *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.tipo_documento || ''}
                onChange={(e) => handleChange('tipo_documento', Number(e.target.value))}
              >
                <option value="">Seleccionar...</option>
                {Array.isArray(tiposDocumento) &&
                  tiposDocumento.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Documento *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.numero_documento || ''}
                onChange={(e) => handleChange('numero_documento', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dígito de Verificación
              </label>
              <input
                type="text"
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.digito_verificacion || ''}
                onChange={(e) => handleChange('digito_verificacion', e.target.value)}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipos de Materia Prima *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  {Array.isArray(tiposMateriaPrima) &&
                    tiposMateriaPrima.map((tipo) => (
                      <label key={tipo.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tipos_materia_prima?.includes(tipo.id)}
                          onChange={() => handleMultiSelectChange('tipos_materia_prima', tipo.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{tipo.nombre}</span>
                      </label>
                    ))}
                </div>
              </div>

              {requiereModalidadLogistica && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modalidad Logística
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={formData.modalidad_logistica || ''}
                    onChange={(e) =>
                      handleChange('modalidad_logistica', e.target.value ? Number(e.target.value) : undefined)
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {Array.isArray(modalidadesLogistica) &&
                      modalidadesLogistica.map((modalidad) => (
                        <option key={modalidad.id} value={modalidad.id}>
                          {modalidad.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Contacto */}
        <Card variant="bordered" padding="md">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.telefono || ''}
                onChange={(e) => handleChange('telefono', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Celular
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.celular || ''}
                onChange={(e) => handleChange('celular', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.sitio_web || ''}
                onChange={(e) => handleChange('sitio_web', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departamento
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={selectedDepartamento || ''}
                onChange={(e) => handleDepartamentoChange(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Seleccionar...</option>
                {Array.isArray(departamentos) &&
                  departamentos.map((depto) => (
                    <option key={depto.id} value={depto.id}>
                      {depto.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ciudad
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.ciudad || ''}
                onChange={(e) => handleChange('ciudad', e.target.value ? Number(e.target.value) : undefined)}
                disabled={!selectedDepartamento}
              >
                <option value="">Seleccionar...</option>
                {Array.isArray(ciudades) &&
                  ciudades.map((ciudad) => (
                    <option key={ciudad.id} value={ciudad.id}>
                      {ciudad.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={formData.direccion || ''}
                onChange={(e) => handleChange('direccion', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
