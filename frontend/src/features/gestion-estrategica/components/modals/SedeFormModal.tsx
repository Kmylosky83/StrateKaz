/**
 * Modal para crear/editar Sedes de la Empresa (H-SC-10)
 *
 * Formulario dinámico por rol operacional:
 *   - OFICINA: sólo datos administrativos
 *   - PLANTA / CENTRO_ACOPIO: capacidad + switches UN/Acopio + almacenes inline
 *   - BODEGA: capacidad + almacenes inline (sin switches UN/Acopio)
 *   - OTRO: campos base opcionales
 *
 * Cambios vs versión previa:
 *   - `ciudad` es ahora FK (number) al catálogo Ciudad.
 *   - Flujo UX: primero se selecciona Departamento, luego se filtran Ciudades.
 *   - `tipo_unidad` eliminado — reemplazado por `tipo_sede.rol_operacional`.
 *   - `es_proveedor_interno` eliminado — migró a RutaRecoleccion en Supply Chain.
 *   - Almacenes se gestionan inline (antes sub-modal AlmacenesPorSedeModal).
 *
 * Usa Design System: BaseModal, Input, Select, Textarea, Switch, Button, Card, Badge.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Loader2,
  Building2,
  Navigation,
  UserCog,
  Settings2,
  Hash,
  Warehouse,
  Plus,
  Package,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Card, Badge } from '@/components/common';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { apiClient } from '@/lib/api-client';
import { useCreateSede, useUpdateSede, useSede, useSedeChoices } from '../../hooks/useStrategic';
import { useSelectCargos, useSelectCiudades, useSelectDepartamentos } from '@/hooks/useSelectLists';
import { useAlmacenes, useDeleteAlmacen } from '@/features/supply-chain/hooks';
import type { Almacen } from '@/features/supply-chain/types';
import type {
  SedeEmpresaList,
  CreateSedeEmpresaDTO,
  UpdateSedeEmpresaDTO,
  RolOperacionalSede,
  TipoSedeChoice,
} from '../../types/strategic.types';
import { AlmacenFormModal } from './AlmacenFormModal';

interface SedeFormModalProps {
  sede: SedeEmpresaList | null;
  isOpen: boolean;
  onClose: () => void;
}

// Constante para identificar la opción "Otro tipo..."
const OTHER_TIPO_SEDE_VALUE = '__OTHER__';

/** Roles que muestran la sección capacidad + switches UN/Acopio */
const ROLES_CON_CAPACIDAD: RolOperacionalSede[] = ['PLANTA', 'CENTRO_ACOPIO', 'BODEGA', 'OTRO'];

/** Roles que habilitan la sección de Almacenes inline */
const ROLES_CON_ALMACENES: RolOperacionalSede[] = ['PLANTA', 'CENTRO_ACOPIO', 'BODEGA'];

interface FormData {
  codigo: string;
  nombre: string;
  tipo_sede: string; // ID numérico como string para el select
  customTipoSede: string;
  descripcion: string;
  direccion: string;
  departamento_id: string; // ID del departamento — filtra ciudades
  ciudad: string; // ID numérico como string (FK)
  codigo_postal: string;
  latitud: string;
  longitud: string;
  responsable: string;
  telefono: string;
  email: string;
  es_sede_principal: boolean;
  fecha_apertura: string;
  fecha_cierre: string;
  capacidad_almacenamiento: string;
  unidad_capacidad: string;
  is_active: boolean;
}

const defaultFormData: FormData = {
  codigo: '',
  nombre: '',
  tipo_sede: '',
  customTipoSede: '',
  descripcion: '',
  direccion: '',
  departamento_id: '',
  ciudad: '',
  codigo_postal: '',
  latitud: '',
  longitud: '',
  responsable: '',
  telefono: '',
  email: '',
  es_sede_principal: false,
  fecha_apertura: '',
  fecha_cierre: '',
  capacidad_almacenamiento: '',
  unidad_capacidad: '',
  is_active: true,
};

/**
 * Hook local para cargar Tipos de Sede CON rol_operacional.
 * Usa el endpoint REST completo en vez de choices/ (que no trae el rol).
 */
function useTiposSedeConRol() {
  return useQuery<TipoSedeChoice[]>({
    queryKey: ['configuracion', 'tipos-sede-con-rol'],
    queryFn: async () => {
      const response = await apiClient.get('/configuracion/tipos-sede/');
      const data = response.data;
      // Normaliza paginado { results: [...] } o array simple
      const list = Array.isArray(data) ? data : data?.results || [];
      return list as TipoSedeChoice[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export const SedeFormModal = ({ sede, isOpen, onClose }: SedeFormModalProps) => {
  const isEditing = sede !== null;

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [currentSedeId, setCurrentSedeId] = useState<number | null>(sede?.id ?? null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Sub-modal de Almacén + confirm de borrado
  const [showAlmacenModal, setShowAlmacenModal] = useState(false);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<Almacen | null>(null);
  const [showDeleteAlmacenDialog, setShowDeleteAlmacenDialog] = useState(false);
  const [almacenToDelete, setAlmacenToDelete] = useState<Almacen | null>(null);

  // Queries y mutations
  const { data: sedeDetail } = useSede(currentSedeId || 0);
  const { data: choices } = useSedeChoices();
  const { data: tiposSede = [] } = useTiposSedeConRol();
  const { data: cargosData } = useSelectCargos();
  const createMutation = useCreateSede();
  const updateMutation = useUpdateSede();

  // Almacenes de la sede (sólo cuando hay id)
  const { data: almacenesData, isLoading: isLoadingAlmacenes } = useAlmacenes(
    currentSedeId ? { sede: currentSedeId } : undefined
  );
  const almacenes = Array.isArray(almacenesData) ? almacenesData : [];
  const deleteAlmacenMutation = useDeleteAlmacen();

  // Sincronizar currentSedeId cuando cambia la prop `sede`
  useEffect(() => {
    setCurrentSedeId(sede?.id ?? null);
  }, [sede?.id]);

  // Rol operacional derivado del tipo_sede actualmente seleccionado
  const rolOperacional: RolOperacionalSede | null = useMemo(() => {
    if (!formData.tipo_sede || formData.tipo_sede === OTHER_TIPO_SEDE_VALUE) return null;
    const tipoId = parseInt(formData.tipo_sede);
    const tipo = tiposSede.find((t) => t.id === tipoId);
    return tipo?.rol_operacional ?? null;
  }, [formData.tipo_sede, tiposSede]);

  const showCapacidad = !!rolOperacional && ROLES_CON_CAPACIDAD.includes(rolOperacional);
  const showAlmacenes = !!rolOperacional && ROLES_CON_ALMACENES.includes(rolOperacional);

  // Función para obtener ubicación GPS del dispositivo
  const handleGetGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitud: position.coords.latitude.toFixed(8),
          longitud: position.coords.longitude.toFixed(8),
        }));
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Permiso de ubicación denegado. Habilítalo en tu navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Ubicación no disponible');
            break;
          case error.TIMEOUT:
            setGpsError('Tiempo de espera agotado');
            break;
          default:
            setGpsError('Error al obtener ubicación');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Flujo secuencial: primero departamento, luego ciudades filtradas por depto
  const ciudadId = formData.ciudad ? parseInt(formData.ciudad) : null;
  const departamentoIdNum = formData.departamento_id
    ? parseInt(formData.departamento_id)
    : undefined;
  const { data: departamentos = [] } = useSelectDepartamentos(true);
  const { data: ciudades = [] } = useSelectCiudades(departamentoIdNum, !!departamentoIdNum);
  const ciudadSeleccionada = useMemo(
    () => ciudades.find((c) => c.id === ciudadId),
    [ciudades, ciudadId]
  );

  // EDICIÓN: cargar datos cuando sedeDetail llega
  useEffect(() => {
    if (!currentSedeId || !sedeDetail) return;
    setFormData({
      codigo: sedeDetail.codigo,
      nombre: sedeDetail.nombre,
      tipo_sede: sedeDetail.tipo_sede?.toString() || '',
      customTipoSede: '',
      descripcion: sedeDetail.descripcion || '',
      direccion: sedeDetail.direccion,
      departamento_id: sedeDetail.departamento_id?.toString() || '',
      ciudad: sedeDetail.ciudad?.toString() || '',
      codigo_postal: sedeDetail.codigo_postal || '',
      latitud: sedeDetail.latitud?.toString() || '',
      longitud: sedeDetail.longitud?.toString() || '',
      responsable: sedeDetail.responsable?.toString() || '',
      telefono: sedeDetail.telefono || '',
      email: sedeDetail.email || '',
      es_sede_principal: sedeDetail.es_sede_principal,
      fecha_apertura: sedeDetail.fecha_apertura || '',
      fecha_cierre: sedeDetail.fecha_cierre || '',
      capacidad_almacenamiento: sedeDetail.capacidad_almacenamiento?.toString() || '',
      unidad_capacidad: sedeDetail.unidad_capacidad?.toString() || '',
      is_active: sedeDetail.is_active,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeDetail?.id, isOpen]);

  // CREACIÓN: resetear a defaults cuando se abre en modo crear
  useEffect(() => {
    if (isEditing) return;
    setFormData({ ...defaultFormData });
    setCurrentSedeId(null);
  }, [isEditing, isOpen]);

  // Unidad por defecto al crear
  useEffect(() => {
    if (currentSedeId || !choices) return;
    const choicesRecord = choices as Record<string, { value?: number }> | undefined;
    const defaultUnit = choicesRecord?.unidad_capacidad_default?.value?.toString() || '';
    if (defaultUnit) {
      setFormData((prev) => ({ ...prev, unidad_capacidad: defaultUnit }));
    }
  }, [currentSedeId, choices]);

  const formRef = useRef<HTMLFormElement>(null);

  // Validar si el tipo de sede es válido
  const isTipoSedeValid =
    formData.tipo_sede !== OTHER_TIPO_SEDE_VALUE || formData.customTipoSede.trim().length > 0;

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    const camposFaltantes: string[] = [];
    if (!formData.nombre) camposFaltantes.push('Nombre');
    if (!isTipoSedeValid) camposFaltantes.push('Tipo de Sede');
    if (!formData.direccion) camposFaltantes.push('Dirección');

    if (camposFaltantes.length > 0) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      import('sonner').then(({ toast }) => {
        toast.warning(`Complete los campos requeridos: ${camposFaltantes.join(', ')}`, {
          duration: 5000,
        });
      });
      return;
    }

    const isCustomTipo = formData.tipo_sede === OTHER_TIPO_SEDE_VALUE;

    const baseData = {
      nombre: formData.nombre,
      tipo_sede: isCustomTipo
        ? undefined
        : formData.tipo_sede
          ? parseInt(formData.tipo_sede)
          : undefined,
      tipo_sede_nuevo: isCustomTipo ? formData.customTipoSede.trim() : undefined,
      descripcion: formData.descripcion || undefined,
      direccion: formData.direccion,
      ciudad: formData.ciudad ? parseInt(formData.ciudad) : null,
      codigo_postal: formData.codigo_postal || undefined,
      latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
      longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
      responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
      telefono: formData.telefono || undefined,
      email: formData.email || undefined,
      es_sede_principal: formData.es_sede_principal,
      fecha_apertura: formData.fecha_apertura || undefined,
      fecha_cierre: formData.fecha_cierre || undefined,
      capacidad_almacenamiento:
        showCapacidad && formData.capacidad_almacenamiento
          ? parseFloat(formData.capacidad_almacenamiento)
          : undefined,
      unidad_capacidad:
        showCapacidad && formData.unidad_capacidad
          ? parseInt(formData.unidad_capacidad)
          : undefined,
      is_active: formData.is_active,
    };

    try {
      if (currentSedeId) {
        await updateMutation.mutateAsync({
          id: currentSedeId,
          data: baseData as UpdateSedeEmpresaDTO,
        });
        onClose();
      } else {
        const created = await createMutation.mutateAsync(baseData as CreateSedeEmpresaDTO);
        // Si el rol soporta almacenes, NO cerramos: desbloqueamos la sección inline.
        if (created?.id && rolOperacional && ROLES_CON_ALMACENES.includes(rolOperacional)) {
          setCurrentSedeId(created.id);
          setFormData((prev) => ({ ...prev, codigo: created.codigo || prev.codigo }));
          import('sonner').then(({ toast }) => {
            toast.success('Sede creada. Ahora puede agregar almacenes.');
          });
        } else {
          onClose();
        }
      }
    } catch {
      // El hook de mutation ya muestra el toast de error.
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Opciones tipo de sede (con rol como hint en label)
  const tipoSedeOptions = [
    ...tiposSede.map((t) => ({
      value: t.id.toString(),
      label: t.name,
    })),
    { value: OTHER_TIPO_SEDE_VALUE, label: 'Otro tipo...' },
  ];

  // Unidades de capacidad dinámicas (multi-industria)
  const choicesExt = choices as
    | (typeof choices & { unidades_capacidad?: { value: number; label: string }[] })
    | undefined;
  const unidadesCapacidadOptions =
    choicesExt?.unidades_capacidad?.map((u) => ({
      value: u.value.toString(),
      label: u.label,
    })) || [];

  const cargoOptions =
    cargosData?.map((cargo) => ({
      value: cargo.id.toString(),
      label: cargo.extra?.rol ? `${cargo.label} — ${cargo.extra.rol}` : cargo.label,
    })) || [];

  const departamentoOptions = departamentos.map((d) => ({
    value: d.id.toString(),
    label: d.label,
  }));

  const ciudadOptions = ciudades.map((c) => ({
    value: c.id.toString(),
    label: c.label,
  }));

  // Campos requeridos faltantes — para feedback en footer
  const camposFaltantes = [
    !formData.nombre && 'Nombre',
    !formData.direccion && 'Dirección',
    !isTipoSedeValid && 'Tipo de Sede',
  ].filter(Boolean) as string[];

  // Almacenes handlers
  const handleAddAlmacen = () => {
    setAlmacenSeleccionado(null);
    setShowAlmacenModal(true);
  };

  const handleEditAlmacen = (almacen: Almacen) => {
    setAlmacenSeleccionado(almacen);
    setShowAlmacenModal(true);
  };

  const handleDeleteAlmacen = (almacen: Almacen) => {
    setAlmacenToDelete(almacen);
    setShowDeleteAlmacenDialog(true);
  };

  const handleConfirmDeleteAlmacen = async () => {
    if (almacenToDelete) {
      await deleteAlmacenMutation.mutateAsync(almacenToDelete.id);
      setShowDeleteAlmacenDialog(false);
      setAlmacenToDelete(null);
    }
  };

  // Sede "virtual" para pasar a AlmacenFormModal (necesita SedeEmpresaList-ish con id/nombre)
  const sedeParaAlmacen: SedeEmpresaList | null = useMemo(() => {
    if (!currentSedeId) return null;
    if (sede) return sede;
    // Sede recién creada — construir objeto mínimo
    return {
      id: currentSedeId,
      codigo: formData.codigo,
      nombre: formData.nombre,
      tipo_sede: formData.tipo_sede ? parseInt(formData.tipo_sede) : '',
      ciudad: ciudadId,
      ciudad_nombre: ciudadSeleccionada?.label ?? null,
      departamento_nombre: null,
      responsable: formData.responsable ? parseInt(formData.responsable) : null,
      es_sede_principal: formData.es_sede_principal,
      is_active: formData.is_active,
    };
  }, [currentSedeId, sede, formData, ciudadId, ciudadSeleccionada]);

  const footer = (
    <>
      {camposFaltantes.length > 0 && !isLoading && (
        <p className="flex-1 text-xs text-amber-600 dark:text-amber-400 self-center">
          Requeridos: {camposFaltantes.join(', ')}
        </p>
      )}
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        {currentSedeId && !isEditing ? 'Cerrar' : 'Cancelar'}
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        isLoading={isLoading}
      >
        {currentSedeId ? 'Guardar Cambios' : 'Crear Sede'}
      </Button>
    </>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isEditing
            ? 'Editar Sede'
            : currentSedeId
              ? 'Sede creada — agregue almacenes'
              : 'Nueva Sede'
        }
        subtitle="Configure los datos de la sede o ubicación"
        size="3xl"
        footer={footer}
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Identificación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Identificación
              </h4>
              {rolOperacional && (
                <Badge variant="info" size="sm">
                  Rol: {rolOperacional}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Código — siempre read-only, auto-generado por el sistema de consecutivos */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código
                </label>
                <div className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  {formData.codigo ? (
                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                      {formData.codigo}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                      Se asignará al crear &mdash; ej: SEDE-0001
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentSedeId
                    ? 'El código es permanente y no puede modificarse'
                    : 'Generado automáticamente por el sistema de consecutivos'}
                </p>
              </div>
              <Select
                label="Tipo de Sede *"
                value={formData.tipo_sede}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_sede: e.target.value, customTipoSede: '' })
                }
                options={[{ value: '', label: 'Seleccione...' }, ...tipoSedeOptions]}
                required
                helperText={
                  rolOperacional
                    ? `Rol operacional: ${rolOperacional}`
                    : 'Seleccione el tipo — el rol determina los campos visibles'
                }
              />
            </div>

            {formData.tipo_sede === OTHER_TIPO_SEDE_VALUE && (
              <Input
                label="Nuevo Tipo de Sede *"
                value={formData.customTipoSede}
                onChange={(e) => setFormData({ ...formData, customTipoSede: e.target.value })}
                placeholder="Ej: Centro de Distribución, Punto de Venta, Bodega"
                required
                helperText="Ingrese el nombre del nuevo tipo de sede"
              />
            )}

            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Sede Principal Bogotá"
              required
            />

            <Textarea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción detallada de la sede..."
              rows={2}
            />
          </div>

          {/* Sección: Ubicación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Ubicación
              </h4>
            </div>

            <Textarea
              label="Dirección *"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle 45 # 23-45, Zona Industrial"
              rows={2}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Departamento"
                value={formData.departamento_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    departamento_id: e.target.value,
                    ciudad: '', // resetear ciudad al cambiar depto
                  })
                }
                options={[
                  { value: '', label: 'Seleccione departamento...' },
                  ...departamentoOptions,
                ]}
              />
              <Select
                label="Ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                options={[
                  {
                    value: '',
                    label: formData.departamento_id
                      ? 'Seleccione ciudad...'
                      : 'Primero elija un departamento',
                  },
                  ...ciudadOptions,
                ]}
                disabled={!formData.departamento_id}
              />
              <Input
                label="Código Postal"
                value={formData.codigo_postal}
                onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                placeholder="080001"
              />
            </div>
          </div>

          {/* Sección: Geolocalización */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Geolocalización (Opcional)
              </h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleGetGPS}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Obteniendo...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-1" />
                    Usar mi ubicación
                  </>
                )}
              </Button>
            </div>

            {gpsError && <Alert variant="warning" message={gpsError} className="mb-3" />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Latitud"
                type="number"
                step="0.00000001"
                value={formData.latitud}
                onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                placeholder="4.60971"
                helperText="Entre -90 y 90"
              />
              <Input
                label="Longitud"
                type="number"
                step="0.00000001"
                value={formData.longitud}
                onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                placeholder="-74.08175"
                helperText="Entre -180 y 180"
              />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Proporcione ambas coordenadas o ninguna. Se usan para mapas y rutas.
            </p>
          </div>

          {/* Sección: Administración (Contacto) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Contacto
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Cargo Responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                options={[{ value: '', label: 'Sin asignar' }, ...cargoOptions]}
              />
              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+57 315 123 4567"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sede@empresa.com"
              />
            </div>
          </div>

          {/* Sección: Capacidad + Switches rol (condicional) */}
          {showCapacidad && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Warehouse className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Capacidad
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Capacidad de Almacenamiento"
                  type="number"
                  step="0.01"
                  value={formData.capacidad_almacenamiento}
                  onChange={(e) =>
                    setFormData({ ...formData, capacidad_almacenamiento: e.target.value })
                  }
                  placeholder="10000.00"
                  helperText="Cantidad numérica"
                />
                <Select
                  label="Unidad de Medida"
                  value={formData.unidad_capacidad}
                  onChange={(e) => setFormData({ ...formData, unidad_capacidad: e.target.value })}
                  options={[
                    { value: '', label: 'Seleccione unidad...' },
                    ...unidadesCapacidadOptions,
                  ]}
                  helperText="Unidad para la capacidad"
                />
              </div>
            </div>
          )}

          {/* Sección: Almacenes inline (condicional por rol) */}
          {showAlmacenes && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Warehouse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Almacenes
                </h4>
                {currentSedeId && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({almacenes.length})
                  </span>
                )}
              </div>

              {!currentSedeId ? (
                <Card>
                  <div className="text-center py-6">
                    <Warehouse className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Guarde la sede primero para agregar almacenes.
                    </p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Silos, bodegas, tanques y contenedores físicos de esta sede.
                    </p>
                    <Button type="button" variant="primary" size="sm" onClick={handleAddAlmacen}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Almacén
                    </Button>
                  </div>

                  {isLoadingAlmacenes ? (
                    <div className="py-6 text-center text-sm text-gray-500">Cargando...</div>
                  ) : almacenes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Almacén
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Tipo
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Operaciones
                            </th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Estado
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {almacenes.map((almacen) => (
                            <tr
                              key={almacen.id}
                              className="border-b border-gray-100 dark:border-gray-800"
                            >
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {almacen.nombre}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400 font-mono">
                                    {almacen.codigo}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                {almacen.tipo_almacen_nombre ? (
                                  <Badge variant="gray" size="sm">
                                    {almacen.tipo_almacen_nombre}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1">
                                  {almacen.permite_recepcion && (
                                    <Badge variant="success" size="sm">
                                      <Package className="h-3 w-3 mr-0.5" />
                                      Rec.
                                    </Badge>
                                  )}
                                  {almacen.permite_despacho && (
                                    <Badge variant="info" size="sm">
                                      <Truck className="h-3 w-3 mr-0.5" />
                                      Desp.
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant={almacen.is_active ? 'success' : 'gray'} size="sm">
                                  {almacen.is_active ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                      Activo
                                    </>
                                  ) : (
                                    'Inactivo'
                                  )}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <ActionButtons
                                  onEdit={() => handleEditAlmacen(almacen)}
                                  onDelete={() => handleDeleteAlmacen(almacen)}
                                  size="sm"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Warehouse className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        No hay almacenes configurados en esta sede.
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddAlmacen}>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Primer Almacén
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Sección: Control */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Settings2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Control
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Apertura"
                type="date"
                value={formData.fecha_apertura}
                onChange={(e) => setFormData({ ...formData, fecha_apertura: e.target.value })}
              />
              <Input
                label="Fecha de Cierre"
                type="date"
                value={formData.fecha_cierre}
                onChange={(e) => setFormData({ ...formData, fecha_cierre: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sede Principal
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Solo puede haber una sede principal
                </p>
              </div>
              <Switch
                checked={formData.es_sede_principal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, es_sede_principal: checked })
                }
              />
            </div>

            {currentSedeId && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sede Activa
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Desactive para deshabilitar esta sede
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            )}
          </div>
        </form>
      </BaseModal>

      {/* Sub-modal Almacén */}
      {sedeParaAlmacen && (
        <AlmacenFormModal
          sede={sedeParaAlmacen}
          almacen={almacenSeleccionado}
          isOpen={showAlmacenModal}
          onClose={() => {
            setShowAlmacenModal(false);
            setAlmacenSeleccionado(null);
          }}
        />
      )}

      {/* Confirmación de borrado de almacén */}
      <ConfirmDialog
        isOpen={showDeleteAlmacenDialog}
        onClose={() => setShowDeleteAlmacenDialog(false)}
        onConfirm={handleConfirmDeleteAlmacen}
        title="Eliminar almacén"
        message={`¿Está seguro de eliminar el almacén "${almacenToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </>
  );
};
