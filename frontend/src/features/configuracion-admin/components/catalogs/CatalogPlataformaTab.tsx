/**
 * Sub-tab Plataforma de Catálogos Maestros (Configuración).
 *
 * Contiene catálogos universales de plataforma (C0) que vienen cargados por
 * seed DIVIPOLA del DANE:
 *   - Departamentos (33 entidades oficiales)
 *   - Ciudades / Municipios (~1,104 con filtro por departamento)
 *
 * Administración destinada al admin del tenant; casi nunca se edita
 * (los datos vienen del seed oficial). La UI existe para:
 *   (a) Activar/desactivar registros que el tenant no use
 *   (b) Corregir un nombre/tilde si hiciera falta
 *   (c) Agregar un municipio nuevo que no venga en el seed
 *
 * Creado 2026-04-22 — primera UI oficial para administrar estos catálogos.
 * Antes se editaban desde `supply-chain/CatalogosTab` (legacy, retirado V3).
 */
import { useMemo, useState } from 'react';
import { MapPin, Building2, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { PageTabs } from '@/components/layout/PageTabs';
import { SectionToolbar } from '@/components/common/SectionToolbar';
import { ResponsiveTable, type ColumnDef } from '@/components/common/ResponsiveTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { FormModal } from '@/components/modals/FormModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

import {
  useDepartamentosConfig,
  useCreateDepartamento,
  useUpdateDepartamento,
  useDeleteDepartamento,
  useCiudadesConfig,
  useCreateCiudad,
  useUpdateCiudad,
  useDeleteCiudad,
} from '../../hooks/useConfigAdmin';
import type {
  Departamento,
  Ciudad,
  CreateDepartamentoDTO,
  CreateCiudadDTO,
} from '../../types/config-admin.types';

type ModuleColor = Parameters<typeof PageTabs>[0]['moduleColor'];

interface CatalogPlataformaTabProps {
  moduleColor: ModuleColor;
}

export const CatalogPlataformaTab = ({ moduleColor }: CatalogPlataformaTabProps) => {
  const [activeTab, setActiveTab] = useState<'departamentos' | 'ciudades'>('departamentos');
  const { canDo } = usePermissions();
  const canCreate = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'create');
  const canEdit = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'edit');
  const canDelete = canDo(Modules.CONFIGURACION_PLATAFORMA, Sections.CATALOGOS, 'delete');

  // Modal state
  const [deptoModalOpen, setDeptoModalOpen] = useState(false);
  const [editDepto, setEditDepto] = useState<Departamento | null>(null);
  const [ciudadModalOpen, setCiudadModalOpen] = useState(false);
  const [editCiudad, setEditCiudad] = useState<Ciudad | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filtros ciudades
  const [ciudadFilterDepto, setCiudadFilterDepto] = useState<number | ''>('');

  // Queries
  const { data: depRaw, isLoading: loadingDeptos } = useDepartamentosConfig();
  const { data: ciuRaw, isLoading: loadingCiudades } = useCiudadesConfig();

  const departamentos = useMemo(
    () =>
      Array.isArray(depRaw) ? depRaw : ((depRaw as { results?: Departamento[] })?.results ?? []),
    [depRaw]
  );
  const ciudades = useMemo(
    () => (Array.isArray(ciuRaw) ? ciuRaw : ((ciuRaw as { results?: Ciudad[] })?.results ?? [])),
    [ciuRaw]
  );
  const ciudadesFiltradas = useMemo(
    () =>
      ciudadFilterDepto === ''
        ? ciudades
        : ciudades.filter((c) => c.departamento === ciudadFilterDepto),
    [ciudades, ciudadFilterDepto]
  );

  const deptoById = useMemo(() => {
    const map = new Map<number, Departamento>();
    departamentos.forEach((d) => map.set(d.id, d));
    return map;
  }, [departamentos]);

  // Mutations
  const createDeptoMut = useCreateDepartamento();
  const updateDeptoMut = useUpdateDepartamento();
  const deleteDeptoMut = useDeleteDepartamento();
  const createCiudadMut = useCreateCiudad();
  const updateCiudadMut = useUpdateCiudad();
  const deleteCiudadMut = useDeleteCiudad();

  // ── Form Departamento ──
  const deptoForm = useForm<CreateDepartamentoDTO>({
    defaultValues: {
      codigo: '',
      nombre: '',
      codigo_dane: '',
      orden: 0,
      is_active: true,
    },
  });

  const openCreateDepto = () => {
    setEditDepto(null);
    deptoForm.reset({
      codigo: '',
      nombre: '',
      codigo_dane: '',
      orden: 0,
      is_active: true,
    });
    setDeptoModalOpen(true);
  };

  const openEditDepto = (d: Departamento) => {
    setEditDepto(d);
    deptoForm.reset({
      codigo: d.codigo,
      nombre: d.nombre,
      codigo_dane: d.codigo_dane ?? '',
      orden: d.orden,
      is_active: d.is_active,
    });
    setDeptoModalOpen(true);
  };

  const submitDepto = (data: CreateDepartamentoDTO) => {
    const onSuccess = () => setDeptoModalOpen(false);
    if (editDepto) {
      updateDeptoMut.mutate({ id: editDepto.id, data }, { onSuccess });
    } else {
      createDeptoMut.mutate(data, { onSuccess });
    }
  };

  // ── Form Ciudad ──
  const ciudadForm = useForm<CreateCiudadDTO>({
    defaultValues: {
      codigo: '',
      nombre: '',
      departamento: 0,
      codigo_dane: '',
      es_capital: false,
      orden: 0,
      is_active: true,
    },
  });

  const openCreateCiudad = () => {
    setEditCiudad(null);
    ciudadForm.reset({
      codigo: '',
      nombre: '',
      departamento: ciudadFilterDepto === '' ? 0 : ciudadFilterDepto,
      codigo_dane: '',
      es_capital: false,
      orden: 0,
      is_active: true,
    });
    setCiudadModalOpen(true);
  };

  const openEditCiudad = (c: Ciudad) => {
    setEditCiudad(c);
    ciudadForm.reset({
      codigo: c.codigo,
      nombre: c.nombre,
      departamento: c.departamento,
      codigo_dane: c.codigo_dane ?? '',
      es_capital: c.es_capital,
      orden: c.orden,
      is_active: c.is_active,
    });
    setCiudadModalOpen(true);
  };

  const submitCiudad = (data: CreateCiudadDTO) => {
    const onSuccess = () => setCiudadModalOpen(false);
    if (editCiudad) {
      updateCiudadMut.mutate({ id: editCiudad.id, data }, { onSuccess });
    } else {
      createCiudadMut.mutate(data, { onSuccess });
    }
  };

  // ── Delete handler ──
  const handleDelete = () => {
    if (deleteId === null) return;
    const mut = activeTab === 'departamentos' ? deleteDeptoMut : deleteCiudadMut;
    mut.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  // ── Columns ──
  const deptoColumns: ColumnDef<Departamento>[] = useMemo(
    () => [
      {
        id: 'codigo',
        header: 'Código',
        accessorKey: 'codigo',
        cell: (row) => <span className="font-mono font-medium">{row.codigo}</span>,
      },
      { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
      {
        id: 'dane',
        header: 'DANE',
        accessorKey: 'codigo_dane',
        cell: (row) => (
          <span className="font-mono text-xs text-slate-500">{row.codigo_dane || '—'}</span>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'is_active',
        cell: (row) => (
          <Badge variant={row.is_active ? 'success' : 'default'} size="sm">
            {row.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'acciones',
        header: '',
        cell: (row) => (
          <div className="flex items-center gap-1 justify-end">
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => openEditDepto(row)}>
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                <Trash2 size={14} className="text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  const ciudadColumns: ColumnDef<Ciudad>[] = useMemo(
    () => [
      {
        id: 'nombre',
        header: 'Nombre',
        accessorKey: 'nombre',
        cell: (row) => (
          <span className="font-medium">
            {row.nombre}
            {row.es_capital && (
              <Badge variant="info" size="sm" className="ml-2">
                Capital
              </Badge>
            )}
          </span>
        ),
      },
      {
        id: 'departamento',
        header: 'Departamento',
        cell: (row) => deptoById.get(row.departamento)?.nombre ?? '—',
      },
      {
        id: 'dane',
        header: 'DANE',
        accessorKey: 'codigo_dane',
        cell: (row) => (
          <span className="font-mono text-xs text-slate-500">{row.codigo_dane || '—'}</span>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'is_active',
        cell: (row) => (
          <Badge variant={row.is_active ? 'success' : 'default'} size="sm">
            {row.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'acciones',
        header: '',
        cell: (row) => (
          <div className="flex items-center gap-1 justify-end">
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => openEditCiudad(row)}>
                <Pencil size={14} />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                <Trash2 size={14} className="text-red-500" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete, deptoById]
  );

  const tabs = [
    { id: 'departamentos', label: 'Departamentos' },
    { id: 'ciudades', label: 'Ciudades' },
  ];

  const isPendingDepto = createDeptoMut.isPending || updateDeptoMut.isPending;
  const isPendingCiudad = createCiudadMut.isPending || updateCiudadMut.isPending;

  return (
    <div className="space-y-4">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as 'departamentos' | 'ciudades')}
        variant="underline"
        moduleColor={moduleColor}
        size="sm"
      />

      {activeTab === 'departamentos' && (
        <>
          <SectionToolbar
            title="Departamentos de Colombia"
            subtitle="33 entidades oficiales DANE (cargados por seed DIVIPOLA)"
            count={departamentos.length}
            primaryAction={
              canCreate ? { label: 'Nuevo departamento', onClick: openCreateDepto } : undefined
            }
          />
          {loadingDeptos ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : departamentos.length > 0 ? (
            <ResponsiveTable data={departamentos} columns={deptoColumns} />
          ) : (
            <EmptyState
              icon={<Building2 size={40} />}
              title="Sin departamentos"
              description="Corre seed_geografia_colombia para cargar los 33 departamentos oficiales."
            />
          )}
        </>
      )}

      {activeTab === 'ciudades' && (
        <>
          <SectionToolbar
            title="Ciudades / Municipios"
            subtitle="~1,104 municipios DIVIPOLA. Filtra por departamento para gestionar."
            count={ciudadesFiltradas.length}
            primaryAction={
              canCreate ? { label: 'Nueva ciudad', onClick: openCreateCiudad } : undefined
            }
          />
          <div className="flex items-center gap-2 max-w-sm">
            <Select
              label="Filtrar por departamento"
              value={ciudadFilterDepto === '' ? '' : String(ciudadFilterDepto)}
              onChange={(e) =>
                setCiudadFilterDepto(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          </div>
          {loadingCiudades ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : ciudadesFiltradas.length > 0 ? (
            <ResponsiveTable data={ciudadesFiltradas} columns={ciudadColumns} />
          ) : (
            <EmptyState
              icon={<MapPin size={40} />}
              title="Sin ciudades"
              description={
                ciudadFilterDepto === ''
                  ? 'Corre seed_geografia_colombia para cargar los municipios oficiales.'
                  : 'Este departamento no tiene ciudades en el catálogo. Agrega una nueva.'
              }
            />
          )}
        </>
      )}

      {/* Modal Departamento */}
      <FormModal
        isOpen={deptoModalOpen}
        onClose={() => setDeptoModalOpen(false)}
        onSubmit={submitDepto}
        form={deptoForm}
        title={editDepto ? 'Editar departamento' : 'Nuevo departamento'}
        submitLabel={editDepto ? 'Guardar cambios' : 'Crear departamento'}
        isLoading={isPendingDepto}
      >
        <Input
          label="Código"
          required
          placeholder="Ej: 05 (DIVIPOLA)"
          {...deptoForm.register('codigo', { required: 'El código es obligatorio' })}
          error={deptoForm.formState.errors.codigo?.message}
          helperText="Código DIVIPOLA 2 dígitos (ej: 05 Antioquia, 11 Bogotá D.C.)"
        />
        <Input
          label="Nombre"
          required
          placeholder="Ej: Antioquia"
          {...deptoForm.register('nombre', { required: 'El nombre es obligatorio' })}
          error={deptoForm.formState.errors.nombre?.message}
        />
        <Input
          label="Código DANE"
          placeholder="Opcional — igual al código DIVIPOLA"
          {...deptoForm.register('codigo_dane')}
        />
        <Input
          label="Orden"
          type="number"
          {...deptoForm.register('orden', { valueAsNumber: true })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" {...deptoForm.register('is_active')} className="rounded" />
          Activo
        </label>
      </FormModal>

      {/* Modal Ciudad */}
      <FormModal
        isOpen={ciudadModalOpen}
        onClose={() => setCiudadModalOpen(false)}
        onSubmit={submitCiudad}
        form={ciudadForm}
        title={editCiudad ? 'Editar ciudad' : 'Nueva ciudad'}
        submitLabel={editCiudad ? 'Guardar cambios' : 'Crear ciudad'}
        isLoading={isPendingCiudad}
      >
        <Select
          label="Departamento"
          required
          {...ciudadForm.register('departamento', {
            required: 'Selecciona el departamento',
            valueAsNumber: true,
          })}
          error={ciudadForm.formState.errors.departamento?.message}
        >
          <option value={0}>Selecciona...</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </Select>
        <Input
          label="Código"
          required
          placeholder="Ej: 05_medellin"
          {...ciudadForm.register('codigo', { required: 'El código es obligatorio' })}
          error={ciudadForm.formState.errors.codigo?.message}
          helperText="Formato {depto}_{slug}. Ej: 05_medellin, 11_bogota."
        />
        <Input
          label="Nombre"
          required
          placeholder="Ej: Medellín"
          {...ciudadForm.register('nombre', { required: 'El nombre es obligatorio' })}
          error={ciudadForm.formState.errors.nombre?.message}
        />
        <Input
          label="Código DANE"
          placeholder="Opcional — DIVIPOLA 5 dígitos (ej: 05001)"
          {...ciudadForm.register('codigo_dane')}
        />
        <Input
          label="Orden"
          type="number"
          {...ciudadForm.register('orden', { valueAsNumber: true })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" {...ciudadForm.register('es_capital')} className="rounded" />
          Es capital del departamento
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" {...ciudadForm.register('is_active')} className="rounded" />
          Activo
        </label>
      </FormModal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Eliminar ${activeTab === 'departamentos' ? 'departamento' : 'ciudad'}`}
        message="El backend aplicará PROTECT si hay registros relacionados. Considera desactivar en lugar de eliminar."
        confirmText="Eliminar"
        variant="danger"
        isLoading={(activeTab === 'departamentos' ? deleteDeptoMut : deleteCiudadMut).isPending}
      />
    </div>
  );
};
