/**
 * CaracterizacionFormModal — Modal SIPOC profesional
 * REORG-B6: Consume items_* relacionales con lookups de PI y Cargo.
 */
import { useState, useEffect, useMemo } from 'react';
import { Button, Spinner, Tabs, Badge } from '@/components/common';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input, Select, Textarea } from '@/components/forms';
import { useSelectAreas, useSelectCargos, useSelectIndicadores } from '@/hooks/useSelectLists';
import { Plus, Trash2, Search, X } from 'lucide-react';
import {
  useCaracterizacion,
  useCreateCaracterizacion,
  useUpdateCaracterizacion,
} from '../hooks/useCaracterizaciones';
import { useAreas } from '../hooks/useAreas';
import { usePartesInteresadas } from '../hooks/usePartesInteresadas';
import type {
  CaracterizacionProcesoList,
  CaracterizacionProceso,
  CreateCaracterizacionDTO,
  ProveedorItem,
  EntradaItem,
  ActividadItem,
  SalidaItem,
  ClienteItem,
  RecursoItem,
  IndicadorItem,
  RiesgoItem,
  DocumentoItem,
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
  items_proveedores: [],
  items_entradas: [],
  items_actividades: [],
  items_salidas: [],
  items_clientes: [],
  items_recursos: [],
  items_indicadores: [],
  items_riesgos: [],
  items_documentos: [],
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
    update: (field: string, value: unknown) => void
  ) => React.ReactNode;
  createEmpty: () => T;
}) {
  const addItem = () => onChange([...items, createEmpty()]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: unknown) => {
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

// ==================== PI LOOKUP SELECTOR ====================

function PILookupSelect({
  value,
  piNombre,
  onSelect,
  piList,
}: {
  value: number | null | undefined;
  piNombre: string | undefined;
  onSelect: (piId: number | null, piNombre: string) => void;
  piList: { id: number; nombre: string }[];
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return piList.slice(0, 20);
    const lower = search.toLowerCase();
    return piList.filter((pi) => pi.nombre.toLowerCase().includes(lower)).slice(0, 20);
  }, [piList, search]);

  const handleSelect = (pi: { id: number; nombre: string }) => {
    onSelect(pi.id, pi.nombre);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelect(null, '');
    setSearch('');
  };

  if (value && piNombre) {
    return (
      <div className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 px-2 py-1.5 text-sm">
        <span className="truncate flex-1 text-blue-700 dark:text-blue-300">{piNombre}</span>
        <button type="button" onClick={handleClear} className="text-blue-500 hover:text-blue-700">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar PI..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-40 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-600">
          {filtered.map((pi) => (
            <li
              key={pi.id}
              onMouseDown={() => handleSelect(pi)}
              className="cursor-pointer px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300"
            >
              {pi.nombre}
            </li>
          ))}
        </ul>
      )}
      {isOpen && filtered.length === 0 && search && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-500 dark:bg-gray-800 dark:border-gray-600">
          Sin resultados
        </div>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export function CaracterizacionFormModal({ item, isOpen, onClose }: CaracterizacionFormModalProps) {
  const [formData, setFormData] = useState<CreateCaracterizacionDTO>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('general');

  const createMutation = useCreateCaracterizacion();
  const updateMutation = useUpdateCaracterizacion();
  // lider_proceso es Cargo (ISO 9001 §4.4), no User
  const { data: areasSelect = [] } = useSelectAreas();
  const { data: cargos = [] } = useSelectCargos();
  const { data: indicadoresCatalogo = [] } = useSelectIndicadores();

  // Full areas data para pre-fill de objetivo y responsable
  const { data: areasFullData } = useAreas({ is_active: true });
  const areasFull = areasFullData?.results || [];

  // PI list para lookups en Proveedores y Clientes
  const { data: piList } = usePartesInteresadas();
  const piOptions = useMemo(() => piList.map((pi) => ({ id: pi.id, nombre: pi.nombre })), [piList]);

  // Fetch detalle completo al editar
  const { data: fullDetail, isLoading: isLoadingDetail } = useCaracterizacion(
    isOpen && item ? item.id : undefined
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Poblar formulario con detalle completo o reset al crear
  useEffect(() => {
    if (!isOpen) return;

    if (item && fullDetail) {
      const detail = fullDetail as unknown as CaracterizacionProceso;
      setFormData({
        area: detail.area,
        estado: detail.estado,
        objetivo: detail.objetivo || '',
        alcance: detail.alcance || '',
        lider_proceso: detail.lider_proceso,
        version: detail.version,
        items_proveedores: detail.items_proveedores || [],
        items_entradas: detail.items_entradas || [],
        items_actividades: detail.items_actividades || [],
        items_salidas: detail.items_salidas || [],
        items_clientes: detail.items_clientes || [],
        items_recursos: detail.items_recursos || [],
        items_indicadores: detail.items_indicadores || [],
        items_riesgos: detail.items_riesgos || [],
        items_documentos: detail.items_documentos || [],
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

  // Pre-fill objetivo y líder al seleccionar un proceso (solo al crear)
  const handleAreaSelect = (areaId: number) => {
    handleChange('area', areaId);
    if (!item && areaId) {
      const selectedArea = areasFull.find((a) => a.id === areaId);
      if (selectedArea) {
        setFormData((prev) => ({
          ...prev,
          area: areaId,
          objetivo: prev.objetivo || selectedArea.objetivo || '',
          lider_proceso: prev.lider_proceso || selectedArea.manager || null,
        }));
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'sipoc', label: 'SIPOC' },
    { id: 'referencias', label: 'Referencias' },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Caracterización' : 'Nueva Caracterización de Proceso'}
      subtitle="Defina el SIPOC, recursos, indicadores y documentos del proceso"
      size="4xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || (!!item && isLoadingDetail)}
            isLoading={isLoading}
          >
            {item ? 'Actualizar' : 'Crear'} Caracterización
          </Button>
        </>
      }
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
                  onChange={(e) => handleAreaSelect(parseInt(e.target.value))}
                  required
                  disabled={!!item}
                >
                  <option value={0}>Seleccionar proceso...</option>
                  {areasSelect.map((a) => (
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
                  label="Cargo Líder del Proceso"
                  value={formData.lider_proceso ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleChange('lider_proceso', val || null);
                  }}
                  helperText="Cargo responsable del proceso (ISO 9001 §4.4)"
                >
                  <option value={0}>Seleccionar cargo...</option>
                  {cargos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
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
                {/* Proveedores (S) — con lookup PI */}
                <DynamicArraySection<ProveedorItem>
                  title="Proveedores (S)"
                  items={(formData.items_proveedores ?? []) as ProveedorItem[]}
                  onChange={(items) => handleChange('items_proveedores', items)}
                  createEmpty={() => ({
                    nombre: '',
                    tipo: 'externo' as const,
                    parte_interesada_id: null,
                    parte_interesada_nombre: '',
                  })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Nombre del proveedor"
                        value={item.nombre}
                        onChange={(e) => update('nombre', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <select
                          className="w-24 shrink-0 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
                          value={item.tipo}
                          onChange={(e) => update('tipo', e.target.value)}
                        >
                          <option value="interno">Interno</option>
                          <option value="externo">Externo</option>
                        </select>
                        <PILookupSelect
                          value={item.parte_interesada_id}
                          piNombre={item.parte_interesada_nombre}
                          piList={piOptions}
                          onSelect={(piId, piNombre) => {
                            update('parte_interesada_id', piId);
                            update('parte_interesada_nombre', piNombre);
                          }}
                        />
                      </div>
                    </>
                  )}
                />

                {/* Entradas (I) */}
                <DynamicArraySection<EntradaItem>
                  title="Entradas (I)"
                  items={(formData.items_entradas ?? []) as EntradaItem[]}
                  onChange={(items) => handleChange('items_entradas', items)}
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

                {/* Actividades (P) — con lookup Cargo */}
                <DynamicArraySection<ActividadItem>
                  title="Actividades Clave (P)"
                  items={(formData.items_actividades ?? []) as ActividadItem[]}
                  onChange={(items) => handleChange('items_actividades', items)}
                  createEmpty={() => ({
                    descripcion: '',
                    responsable: '',
                    responsable_cargo_id: null,
                    responsable_cargo_nombre: '',
                  })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Descripción de la actividad"
                        value={item.descripcion}
                        onChange={(e) => update('descripcion', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Responsable (texto)"
                          value={item.responsable}
                          onChange={(e) => update('responsable', e.target.value)}
                          className="flex-1"
                        />
                        <select
                          className="w-36 shrink-0 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
                          value={item.responsable_cargo_id ?? ''}
                          onChange={(e) => {
                            const cargoId = parseInt(e.target.value) || null;
                            const cargo = cargos.find((c) => c.id === cargoId);
                            update('responsable_cargo_id', cargoId);
                            update('responsable_cargo_nombre', cargo?.label ?? '');
                          }}
                        >
                          <option value="">Cargo...</option>
                          {cargos.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                />

                {/* Salidas (O) */}
                <DynamicArraySection<SalidaItem>
                  title="Salidas (O)"
                  items={(formData.items_salidas ?? []) as SalidaItem[]}
                  onChange={(items) => handleChange('items_salidas', items)}
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

                {/* Clientes (C) — con lookup PI */}
                <DynamicArraySection<ClienteItem>
                  title="Clientes (C)"
                  items={(formData.items_clientes ?? []) as ClienteItem[]}
                  onChange={(items) => handleChange('items_clientes', items)}
                  createEmpty={() => ({
                    nombre: '',
                    tipo: 'externo' as const,
                    parte_interesada_id: null,
                    parte_interesada_nombre: '',
                  })}
                  renderRow={(item, _, update) => (
                    <>
                      <Input
                        placeholder="Nombre del cliente"
                        value={item.nombre}
                        onChange={(e) => update('nombre', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <select
                          className="w-24 shrink-0 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
                          value={item.tipo}
                          onChange={(e) => update('tipo', e.target.value)}
                        >
                          <option value="interno">Interno</option>
                          <option value="externo">Externo</option>
                        </select>
                        <PILookupSelect
                          value={item.parte_interesada_id}
                          piNombre={item.parte_interesada_nombre}
                          piList={piOptions}
                          onSelect={(piId, piNombre) => {
                            update('parte_interesada_id', piId);
                            update('parte_interesada_nombre', piNombre);
                          }}
                        />
                      </div>
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
                  items={(formData.items_recursos ?? []) as RecursoItem[]}
                  onChange={(items) => handleChange('items_recursos', items)}
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

                <DynamicArraySection<IndicadorItem>
                  title="Indicadores Vinculados"
                  items={(formData.items_indicadores ?? []) as IndicadorItem[]}
                  onChange={(items) => handleChange('items_indicadores', items)}
                  createEmpty={() => ({ nombre: '', formula: '', meta: '', indicador_id: null })}
                  renderRow={(item, _, update) => (
                    <>
                      <div className="col-span-2 flex gap-2">
                        <select
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                          value={item.indicador_id ?? ''}
                          onChange={(e) => {
                            const id = parseInt(e.target.value) || null;
                            const ind = indicadoresCatalogo.find((i) => i.id === id);
                            update('indicador_id', id);
                            if (ind) {
                              update('nombre', ind.label);
                            }
                          }}
                        >
                          <option value="">Seleccionar del catálogo...</option>
                          {indicadoresCatalogo.map((ind) => (
                            <option key={ind.id} value={ind.id}>
                              {ind.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          placeholder="Meta"
                          value={item.meta}
                          onChange={(e) => update('meta', e.target.value)}
                          className="w-32 shrink-0"
                        />
                      </div>
                    </>
                  )}
                />

                <DynamicArraySection<RiesgoItem>
                  title="Riesgos Asociados"
                  items={(formData.items_riesgos ?? []) as RiesgoItem[]}
                  onChange={(items) => handleChange('items_riesgos', items)}
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

                <DynamicArraySection<DocumentoItem>
                  title="Documentos de Referencia"
                  items={(formData.items_documentos ?? []) as DocumentoItem[]}
                  onChange={(items) => handleChange('items_documentos', items)}
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
      </form>
    </BaseModal>
  );
}
