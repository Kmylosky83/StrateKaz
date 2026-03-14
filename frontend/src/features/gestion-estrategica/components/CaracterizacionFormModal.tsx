import { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Tabs, Badge } from '@/components/common';
import { Input, Select, Textarea } from '@/components/forms';
import { useSelectUsers, useSelectAreas } from '@/hooks/useSelectLists';
import { Plus, Trash2 } from 'lucide-react';
import {
  useCaracterizacion,
  useCreateCaracterizacion,
  useUpdateCaracterizacion,
} from '../hooks/useCaracterizaciones';
import type {
  CaracterizacionProcesoList,
  CaracterizacionProceso,
  CreateCaracterizacionDTO,
  SIPOCProveedor,
  SIPOCEntrada,
  SIPOCActividad,
  SIPOCSalida,
  SIPOCCliente,
  RecursoItem,
  IndicadorVinculado,
  RiesgoAsociado,
  DocumentoReferencia,
} from '../types/caracterizacion.types';

interface CaracterizacionFormModalProps {
  item: CaracterizacionProcesoList | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_FORM: CreateCaracterizacionDTO = {
  area: 0,
  estado: 'BORRADOR',
  objetivo: '',
  alcance: '',
  lider_proceso: null,
  proveedores: [],
  entradas: [],
  actividades_clave: [],
  salidas: [],
  clientes: [],
  recursos: [],
  indicadores_vinculados: [],
  riesgos_asociados: [],
  documentos_referencia: [],
  requisitos_normativos: '',
  observaciones: '',
};

const ESTADO_OPTIONS = [
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'OBSOLETO', label: 'Obsoleto' },
];

const TIPO_RECURSO_OPTIONS = [
  { value: 'humano', label: 'Humano' },
  { value: 'tecnologico', label: 'Tecnológico' },
  { value: 'fisico', label: 'Físico' },
  { value: 'financiero', label: 'Financiero' },
];

// ==================== DYNAMIC ARRAY SECTION ====================

function DynamicArraySection<T extends Record<string, unknown>>({
  title,
  items,
  onChange,
  renderRow,
  createEmpty,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderRow: (
    item: T,
    index: number,
    update: (field: string, value: string) => void
  ) => React.ReactNode;
  createEmpty: () => T;
}) {
  const addItem = () => onChange([...items, createEmpty()]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}{' '}
          <Badge variant="gray" size="sm">
            {items.length}
          </Badge>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1 grid grid-cols-2 gap-2">
            {renderRow(item, index, (field, value) => updateItem(index, field, value))}
          </div>
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="mt-1 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export function CaracterizacionFormModal({ item, isOpen, onClose }: CaracterizacionFormModalProps) {
  const [formData, setFormData] = useState<CreateCaracterizacionDTO>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('general');

  const createMutation = useCreateCaracterizacion();
  const updateMutation = useUpdateCaracterizacion();
  const { data: usuarios = [] } = useSelectUsers();
  const { data: areas = [] } = useSelectAreas();

  // Fetch detalle completo al editar (el listado NO trae SIPOC)
  const { data: fullDetail, isLoading: isLoadingDetail } = useCaracterizacion(
    isOpen && item ? item.id : undefined
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Poblar formulario con detalle completo o reset al crear
  useEffect(() => {
    if (!isOpen) return;

    if (item && fullDetail) {
      // El detalle completo incluye todos los campos SIPOC
      const detail = fullDetail as unknown as CaracterizacionProceso;
      setFormData({
        area: detail.area,
        estado: detail.estado,
        objetivo: detail.objetivo || '',
        alcance: detail.alcance || '',
        lider_proceso: detail.lider_proceso,
        version: detail.version,
        proveedores: detail.proveedores || [],
        entradas: detail.entradas || [],
        actividades_clave: detail.actividades_clave || [],
        salidas: detail.salidas || [],
        clientes: detail.clientes || [],
        recursos: detail.recursos || [],
        indicadores_vinculados: detail.indicadores_vinculados || [],
        riesgos_asociados: detail.riesgos_asociados || [],
        documentos_referencia: detail.documentos_referencia || [],
        requisitos_normativos: detail.requisitos_normativos || '',
        observaciones: detail.observaciones || '',
      });
    } else if (!item) {
      setFormData(INITIAL_FORM);
      setActiveTab('general');
    }
  }, [item, isOpen, fullDetail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateMutation.mutate({ id: item.id, data: formData }, { onSuccess: onClose });
    } else {
      createMutation.mutate(formData, { onSuccess: onClose });
    }
  };

  const handleChange = (field: keyof CreateCaracterizacionDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'sipoc', label: 'SIPOC' },
    { id: 'referencias', label: 'Referencias' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Caracterización' : 'Nueva Caracterización de Proceso'}
      size="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        {/* Estado de carga al editar */}
        {item && isLoadingDetail ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Spinner size="md" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cargando datos de la caracterización...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* TAB: General */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Proceso / Área *"
                  value={formData.area}
                  onChange={(e) => handleChange('area', parseInt(e.target.value))}
                  required
                  disabled={!!item}
                >
                  <option value={0}>Seleccionar proceso...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Estado"
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                >
                  {ESTADO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>

                <div className="md:col-span-2">
                  <Textarea
                    label="Objetivo del Proceso *"
                    value={formData.objetivo ?? ''}
                    onChange={(e) => handleChange('objetivo', e.target.value)}
                    placeholder="Propósito y razón de ser del proceso..."
                    rows={3}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Alcance"
                    value={formData.alcance ?? ''}
                    onChange={(e) => handleChange('alcance', e.target.value)}
                    placeholder="Dónde inicia y termina el proceso..."
                    rows={2}
                  />
                </div>

                <Select
                  label="Líder del Proceso"
                  value={formData.lider_proceso ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleChange('lider_proceso', val || null);
                  }}
                >
                  <option value={0}>Seleccionar líder...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Versión"
                  type="number"
                  value={formData.version ?? 1}
                  onChange={(e) => handleChange('version', parseInt(e.target.value))}
                  min={1}
                />
              </div>
            )}

            {/* TAB: SIPOC */}
            {activeTab === 'sipoc' && (
              <div className="space-y-6">
                <DynamicArraySection<SIPOCProveedor>
                  title="Proveedores (S)"
                  items={(formData.proveedores ?? []) as SIPOCProveedor[]}
                  onChange={(items) => handleChange('proveedores', items)}
                  createEmpty={() => ({ nombre: '', tipo: 'interno' as const })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Nombre del proveedor"
                        value={item.nombre}
                        onChange={(e) => update('nombre', e.target.value)}
                      />
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                        value={item.tipo}
                        onChange={(e) => update('tipo', e.target.value)}
                      >
                        <option value="interno">Interno</option>
                        <option value="externo">Externo</option>
                      </select>
                    </>
                  )}
                />

                <DynamicArraySection<SIPOCEntrada>
                  title="Entradas (I)"
                  items={(formData.entradas ?? []) as SIPOCEntrada[]}
                  onChange={(items) => handleChange('entradas', items)}
                  createEmpty={() => ({ descripcion: '', origen: '' })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Descripción"
                        value={item.descripcion}
                        onChange={(e) => update('descripcion', e.target.value)}
                      />
                      <Input
                        placeholder="Origen"
                        value={item.origen}
                        onChange={(e) => update('origen', e.target.value)}
                      />
                    </>
                  )}
                />

                <DynamicArraySection<SIPOCActividad>
                  title="Actividades Clave (P)"
                  items={(formData.actividades_clave ?? []) as SIPOCActividad[]}
                  onChange={(items) => handleChange('actividades_clave', items)}
                  createEmpty={() => ({ descripcion: '', responsable: '' })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Descripción"
                        value={item.descripcion}
                        onChange={(e) => update('descripcion', e.target.value)}
                      />
                      <Input
                        placeholder="Responsable"
                        value={item.responsable}
                        onChange={(e) => update('responsable', e.target.value)}
                      />
                    </>
                  )}
                />

                <DynamicArraySection<SIPOCSalida>
                  title="Salidas (O)"
                  items={(formData.salidas ?? []) as SIPOCSalida[]}
                  onChange={(items) => handleChange('salidas', items)}
                  createEmpty={() => ({ descripcion: '', destino: '' })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Descripción"
                        value={item.descripcion}
                        onChange={(e) => update('descripcion', e.target.value)}
                      />
                      <Input
                        placeholder="Destino"
                        value={item.destino}
                        onChange={(e) => update('destino', e.target.value)}
                      />
                    </>
                  )}
                />

                <DynamicArraySection<SIPOCCliente>
                  title="Clientes (C)"
                  items={(formData.clientes ?? []) as SIPOCCliente[]}
                  onChange={(items) => handleChange('clientes', items)}
                  createEmpty={() => ({ nombre: '', tipo: 'interno' as const })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Nombre del cliente"
                        value={item.nombre}
                        onChange={(e) => update('nombre', e.target.value)}
                      />
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                        value={item.tipo}
                        onChange={(e) => update('tipo', e.target.value)}
                      >
                        <option value="interno">Interno</option>
                        <option value="externo">Externo</option>
                      </select>
                    </>
                  )}
                />
              </div>
            )}

            {/* TAB: Referencias */}
            {activeTab === 'referencias' && (
              <div className="space-y-6">
                <DynamicArraySection<RecursoItem>
                  title="Recursos"
                  items={(formData.recursos ?? []) as RecursoItem[]}
                  onChange={(items) => handleChange('recursos', items)}
                  createEmpty={() => ({ tipo: 'humano' as const, descripcion: '' })}
                  renderRow={(item, _, update) => (
                    <>
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                        value={item.tipo}
                        onChange={(e) => update('tipo', e.target.value)}
                      >
                        {TIPO_RECURSO_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Descripción"
                        value={item.descripcion}
                        onChange={(e) => update('descripcion', e.target.value)}
                      />
                    </>
                  )}
                />

                <DynamicArraySection<IndicadorVinculado>
                  title="Indicadores Vinculados"
                  items={(formData.indicadores_vinculados ?? []) as IndicadorVinculado[]}
                  onChange={(items) => handleChange('indicadores_vinculados', items)}
                  createEmpty={() => ({ nombre: '', formula: '', meta: '' })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Nombre"
                        value={item.nombre}
                        onChange={(e) => update('nombre', e.target.value)}
                      />
                      <Input
                        placeholder="Meta"
                        value={item.meta}
                        onChange={(e) => update('meta', e.target.value)}
                      />
                    </>
                  )}
                />

                <DynamicArraySection<RiesgoAsociado>
                  title="Riesgos Asociados"
                  items={(formData.riesgos_asociados ?? []) as RiesgoAsociado[]}
                  onChange={(items) => handleChange('riesgos_asociados', items)}
                  createEmpty={() => ({
                    descripcion: '',
                    nivel: 'medio' as const,
                    tratamiento: '',
                  })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Descripción"
                        value={item.descripcion}
                        onChange={(e) => update('descripcion', e.target.value)}
                      />
                      <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                        value={item.nivel}
                        onChange={(e) => update('nivel', e.target.value)}
                      >
                        <option value="alto">Alto</option>
                        <option value="medio">Medio</option>
                        <option value="bajo">Bajo</option>
                      </select>
                    </>
                  )}
                />

                <DynamicArraySection<DocumentoReferencia>
                  title="Documentos de Referencia"
                  items={(formData.documentos_referencia ?? []) as DocumentoReferencia[]}
                  onChange={(items) => handleChange('documentos_referencia', items)}
                  createEmpty={() => ({ codigo: '', nombre: '' })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Código"
                        value={item.codigo}
                        onChange={(e) => update('codigo', e.target.value)}
                      />
                      <Input
                        placeholder="Nombre"
                        value={item.nombre}
                        onChange={(e) => update('nombre', e.target.value)}
                      />
                    </>
                  )}
                />

                <Textarea
                  label="Requisitos Normativos"
                  value={formData.requisitos_normativos ?? ''}
                  onChange={(e) => handleChange('requisitos_normativos', e.target.value)}
                  placeholder="ISO 9001 §4.4, ISO 45001 §6.1..."
                  rows={2}
                />

                <Textarea
                  label="Observaciones"
                  value={formData.observaciones ?? ''}
                  onChange={(e) => handleChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || (!!item && isLoadingDetail)}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>{item ? 'Actualizar' : 'Crear'} Caracterización</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
