/**
 * Modal para crear/editar Sedes de la Empresa
 *
 * Formulario completo para gestión de sedes con todos los campos:
 * - Identificación (código, nombre, tipo, descripción)
 * - Ubicación (dirección, ciudad, departamento)
 * - Geolocalización (latitud, longitud)
 * - Administración (responsable, teléfono, email)
 * - Control (sede principal, fechas, capacidad con unidades dinámicas)
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Select, Textarea para formulario
 * - Switch para opciones booleanas
 * - Button para acciones
 *
 * Sistema multi-industria:
 * - Unidades de capacidad dinámicas (kg, ton, m³, pallets, etc.)
 * - Sin hardcoding de unidades
 */
import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, Building2, Navigation, UserCog, Settings2 } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { useCreateSede, useUpdateSede, useSede, useSedeChoices } from '../../hooks/useStrategic';
import { useSelectUsers } from '@/hooks/useSelectLists';
import type {
  SedeEmpresaList,
  CreateSedeEmpresaDTO,
  UpdateSedeEmpresaDTO,
} from '../../types/strategic.types';

interface SedeFormModalProps {
  sede: SedeEmpresaList | null;
  isOpen: boolean;
  onClose: () => void;
}

// Constante para identificar la opción "Otro tipo..."
const OTHER_TIPO_SEDE_VALUE = '__OTHER__';

interface FormData {
  codigo: string;
  nombre: string;
  tipo_sede: string; // ID numérico como string para el select
  customTipoSede: string; // Para nuevo tipo personalizado
  descripcion: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  codigo_postal: string;
  latitud: string;
  longitud: string;
  responsable: string;
  telefono: string;
  email: string;
  es_sede_principal: boolean;
  fecha_apertura: string;
  fecha_cierre: string;
  // Sistema dinámico de unidades multi-industria
  capacidad_almacenamiento: string;
  unidad_capacidad: string;
  is_active: boolean;
}

const defaultFormData: FormData = {
  codigo: '',
  nombre: '',
  tipo_sede: '', // Se selecciona del dropdown
  customTipoSede: '', // Para nuevo tipo personalizado
  descripcion: '',
  direccion: '',
  ciudad: '',
  departamento: '',
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

export const SedeFormModal = ({ sede, isOpen, onClose }: SedeFormModalProps) => {
  const isEditing = sede !== null;

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

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

  // Queries y mutations
  const { data: sedeDetail } = useSede(sede?.id || 0);
  const { data: choices } = useSedeChoices();
  const { data: usersData } = useSelectUsers();
  const createMutation = useCreateSede();
  const updateMutation = useUpdateSede();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && sedeDetail) {
      setFormData({
        codigo: sedeDetail.codigo,
        nombre: sedeDetail.nombre,
        tipo_sede: sedeDetail.tipo_sede?.toString() || '',
        customTipoSede: '', // Al editar, siempre vacío (el tipo ya existe)
        descripcion: sedeDetail.descripcion || '',
        direccion: sedeDetail.direccion,
        ciudad: sedeDetail.ciudad,
        departamento: sedeDetail.departamento,
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
    } else if (!isEditing) {
      // Para nuevo registro, usar unidad por defecto de la empresa si existe
      const choicesRecord = choices as Record<string, { value?: number }> | undefined;
      const defaultUnit = choicesRecord?.unidad_capacidad_default?.value?.toString() || '';
      setFormData({ ...defaultFormData, unidad_capacidad: defaultUnit });
    }
  }, [sedeDetail, isEditing, choices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determinar si se usa tipo existente o nuevo
    const isCustomTipo = formData.tipo_sede === OTHER_TIPO_SEDE_VALUE;

    const baseData = {
      codigo: formData.codigo,
      nombre: formData.nombre,
      // Si es tipo personalizado, no enviar tipo_sede (ID)
      tipo_sede: isCustomTipo
        ? undefined
        : formData.tipo_sede
          ? parseInt(formData.tipo_sede)
          : undefined,
      // Si es tipo personalizado, enviar el nombre del nuevo tipo
      tipo_sede_nuevo: isCustomTipo ? formData.customTipoSede.trim() : undefined,
      descripcion: formData.descripcion || undefined,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      departamento: formData.departamento,
      codigo_postal: formData.codigo_postal || undefined,
      latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
      longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
      responsable: formData.responsable ? parseInt(formData.responsable) : undefined,
      telefono: formData.telefono || undefined,
      email: formData.email || undefined,
      es_sede_principal: formData.es_sede_principal,
      fecha_apertura: formData.fecha_apertura || undefined,
      fecha_cierre: formData.fecha_cierre || undefined,
      // Sistema dinámico de unidades
      capacidad_almacenamiento: formData.capacidad_almacenamiento
        ? parseFloat(formData.capacidad_almacenamiento)
        : undefined,
      unidad_capacidad: formData.unidad_capacidad ? parseInt(formData.unidad_capacidad) : undefined,
      is_active: formData.is_active,
    };

    if (isEditing && sede) {
      await updateMutation.mutateAsync({
        id: sede.id,
        data: baseData as UpdateSedeEmpresaDTO,
      });
    } else {
      await createMutation.mutateAsync(baseData as CreateSedeEmpresaDTO);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Opciones para selects - tipos de sede vienen como IDs numéricos del backend
  // Incluye opción "Otro tipo..." para crear nuevos tipos

  const tipoSedeOptions = [
    ...(choices?.tipos_sede?.map((t: { value: number; label: string }) => ({
      value: t.value.toString(),
      label: t.label,
    })) || []),
    { value: OTHER_TIPO_SEDE_VALUE, label: 'Otro tipo...' },
  ];

  // Validar si el tipo de sede es válido
  const isTipoSedeValid =
    formData.tipo_sede !== OTHER_TIPO_SEDE_VALUE || formData.customTipoSede.trim().length > 0;

  const departamentoOptions = choices?.departamentos || [];

  // Unidades de capacidad dinámicas (multi-industria)
  const choicesExt = choices as
    | (typeof choices & { unidades_capacidad?: { value: number; label: string }[] })
    | undefined;
  const unidadesCapacidadOptions =
    choicesExt?.unidades_capacidad?.map((u) => ({
      value: u.value.toString(),
      label: u.label,
    })) || [];

  const userOptions =
    usersData?.map((user) => ({
      value: user.id.toString(),
      label: user.extra?.cargo ? `${user.label} — ${user.extra.cargo}` : user.label,
    })) || [];

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={
          isLoading ||
          !formData.codigo ||
          !formData.nombre ||
          !formData.direccion ||
          !isTipoSedeValid
        }
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Sede'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Sede' : 'Nueva Sede'}
      subtitle="Configure los datos de la sede o ubicación"
      size="4xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Identificación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Identificación
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              placeholder="SEDE-001"
              required
              helperText="Código único de la sede"
            />
            <Select
              label="Tipo de Sede *"
              value={formData.tipo_sede}
              onChange={(e) =>
                setFormData({ ...formData, tipo_sede: e.target.value, customTipoSede: '' })
              }
              options={[{ value: '', label: 'Seleccione...' }, ...tipoSedeOptions]}
              required
            />
          </div>

          {/* Input condicional para nuevo tipo de sede */}
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
            <Input
              label="Ciudad *"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              placeholder="Bogotá"
              required
            />
            <Select
              label="Departamento *"
              value={formData.departamento}
              onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
              options={[{ value: '', label: 'Seleccione...' }, ...departamentoOptions]}
              required
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

        {/* Sección: Administración */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Administración
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Responsable"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              options={[{ value: '', label: 'Sin asignar' }, ...userOptions]}
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

          {/* Capacidad con unidades dinámicas */}
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
              options={[{ value: '', label: 'Seleccione unidad...' }, ...unidadesCapacidadOptions]}
              helperText="Unidad para la capacidad"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sede Principal</p>
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

          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sede Activa</p>
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

        <Alert
          variant="info"
          message="Las sedes pueden asignarse a usuarios, vehículos y equipos para gestión multi-sitio."
        />
      </form>
    </BaseModal>
  );
};
