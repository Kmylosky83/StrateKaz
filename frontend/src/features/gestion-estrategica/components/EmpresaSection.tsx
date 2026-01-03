/**
 * Seccion de Datos de la Empresa
 *
 * Muestra y permite editar los datos fiscales, legales y regionales
 * de la empresa. Usa el modelo Singleton EmpresaConfig.
 *
 * Usa Design System:
 * - DataCard, DataField, DataGrid para visualización mejorada
 * - Card para contenedores
 * - Button para acciones
 * - Alert para mensajes
 * - Formularios con inputs del design system
 */
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Building2,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Loader2,
  User,
} from 'lucide-react';
import { Card, Button, Alert } from '@/components/common';
import { DataCard, DataField, DataGrid, DataSection } from '@/components/data-display';
import { Input, Select } from '@/components/forms';
import {
  useEmpresaConfig,
  useUpdateEmpresa,
  useCreateEmpresa,
  useEmpresaChoices,
} from '../hooks/useEmpresa';
import {
  TIPOS_SOCIEDAD,
  REGIMENES_TRIBUTARIOS,
  FORMATOS_FECHA,
  MONEDAS,
  ZONAS_HORARIAS,
} from '../types/empresa.types';
import type { EmpresaConfigFormData } from '../types/empresa.types';

// Lista de departamentos de Colombia (fallback)
const DEPARTAMENTOS_COLOMBIA = [
  { value: 'AMAZONAS', label: 'Amazonas' },
  { value: 'ANTIOQUIA', label: 'Antioquia' },
  { value: 'ARAUCA', label: 'Arauca' },
  { value: 'ATLANTICO', label: 'Atlántico' },
  { value: 'BOLIVAR', label: 'Bolívar' },
  { value: 'BOYACA', label: 'Boyacá' },
  { value: 'CALDAS', label: 'Caldas' },
  { value: 'CAQUETA', label: 'Caquetá' },
  { value: 'CASANARE', label: 'Casanare' },
  { value: 'CAUCA', label: 'Cauca' },
  { value: 'CESAR', label: 'Cesar' },
  { value: 'CHOCO', label: 'Chocó' },
  { value: 'CORDOBA', label: 'Córdoba' },
  { value: 'CUNDINAMARCA', label: 'Cundinamarca' },
  { value: 'GUAINIA', label: 'Guainía' },
  { value: 'GUAVIARE', label: 'Guaviare' },
  { value: 'HUILA', label: 'Huila' },
  { value: 'LA_GUAJIRA', label: 'La Guajira' },
  { value: 'MAGDALENA', label: 'Magdalena' },
  { value: 'META', label: 'Meta' },
  { value: 'NARINO', label: 'Nariño' },
  { value: 'NORTE_DE_SANTANDER', label: 'Norte de Santander' },
  { value: 'PUTUMAYO', label: 'Putumayo' },
  { value: 'QUINDIO', label: 'Quindío' },
  { value: 'RISARALDA', label: 'Risaralda' },
  { value: 'SAN_ANDRES', label: 'San Andrés y Providencia' },
  { value: 'SANTANDER', label: 'Santander' },
  { value: 'SUCRE', label: 'Sucre' },
  { value: 'TOLIMA', label: 'Tolima' },
  { value: 'VALLE_DEL_CAUCA', label: 'Valle del Cauca' },
  { value: 'VAUPES', label: 'Vaupés' },
  { value: 'VICHADA', label: 'Vichada' },
];

/**
 * Componente de vista (solo lectura) de la información de la empresa
 * Usa DataCard, DataField, DataGrid para mejor visualización
 */
const EmpresaView = ({
  empresa,
  onEdit,
}: {
  empresa: any;
  onEdit: () => void;
}) => {
  return (
    <DataSection
      title="Datos Fiscales y Legales"
      description="Información registrada de la empresa"
      icon={Building2}
      iconVariant="purple"
      action={
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      }
    >
      <DataGrid columns={3} gap="md">
        {/* Identificación Fiscal - Card destacada */}
        <DataCard
          title="Identificación Fiscal"
          icon={FileText}
          variant="purple"
          elevated
          accentBorder
        >
          <DataField label="NIT" value={empresa.nit} valueVariant="bold" copyable />
          <DataField label="Razón Social" value={empresa.razon_social} valueVariant="bold" />
          <DataField label="Nombre Comercial" value={empresa.nombre_comercial} emptyText="No registrado" />
          <DataField label="Tipo de Sociedad" value={empresa.tipo_sociedad_display} />
          <DataField label="Régimen Tributario" value={empresa.regimen_tributario_display} />
        </DataCard>

        {/* Representante Legal */}
        <DataCard
          title="Representante Legal"
          icon={User}
          variant="blue"
          accentBorder
        >
          <DataField label="Nombre Completo" value={empresa.representante_legal} valueVariant="bold" />
          <DataField label="Cédula" value={empresa.cedula_representante} copyable />
          <DataField label="Actividad Económica (CIIU)" value={empresa.actividad_economica} emptyText="No especificada" />
        </DataCard>

        {/* Contacto */}
        <DataCard
          title="Información de Contacto"
          icon={Phone}
          variant="green"
          accentBorder
        >
          <DataField label="Teléfono Principal" value={empresa.telefono_principal} icon={Phone} inline copyable />
          <DataField label="Teléfono Secundario" value={empresa.telefono_secundario} icon={Phone} inline />
          <DataField label="Email Corporativo" value={empresa.email_corporativo} icon={Mail} inline copyable truncate />
          <DataField
            label="Sitio Web"
            value={
              empresa.sitio_web ? (
                <a
                  href={empresa.sitio_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {empresa.sitio_web}
                </a>
              ) : null
            }
            icon={Globe}
            inline
          />
        </DataCard>

        {/* Ubicación */}
        <DataCard
          title="Ubicación"
          icon={MapPin}
          variant="orange"
          accentBorder
        >
          <DataField label="Dirección Fiscal" value={empresa.direccion_fiscal} />
          <DataField
            label="Ciudad"
            value={empresa.ciudad && empresa.departamento_display ? `${empresa.ciudad}, ${empresa.departamento_display}` : empresa.ciudad}
          />
          <DataField label="País" value={empresa.pais} />
          <DataField label="Código Postal" value={empresa.codigo_postal} />
        </DataCard>

        {/* Registro Mercantil */}
        <DataCard
          title="Registro Mercantil"
          icon={Calendar}
          variant="teal"
          accentBorder
        >
          <DataField label="Matrícula Mercantil" value={empresa.matricula_mercantil} />
          <DataField label="Cámara de Comercio" value={empresa.camara_comercio} />
          <DataField label="Fecha de Constitución" value={empresa.fecha_constitucion} />
          <DataField label="Fecha de Inscripción" value={empresa.fecha_inscripcion_registro} />
        </DataCard>

        {/* Configuración Regional */}
        <DataCard
          title="Configuración Regional"
          icon={Clock}
          variant="gray"
          accentBorder
        >
          <DataField label="Zona Horaria" value={empresa.zona_horaria_display} />
          <DataField label="Formato de Fecha" value={empresa.formato_fecha_display} />
          <DataField
            label="Moneda"
            value={empresa.moneda_display ? `${empresa.moneda_display} (${empresa.simbolo_moneda})` : null}
            icon={DollarSign}
            inline
          />
        </DataCard>
      </DataGrid>

      {/* Última actualización */}
      {empresa.updated_at && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-right pt-4">
          Última actualización: {new Date(empresa.updated_at).toLocaleString('es-CO')}
          {empresa.updated_by_name && ` por ${empresa.updated_by_name}`}
        </div>
      )}
    </DataSection>
  );
};

/**
 * Componente de formulario de edición
 */
const EmpresaForm = ({
  empresa,
  onCancel,
  onSuccess,
}: {
  empresa: any | null;
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const { data: choices } = useEmpresaChoices();
  const createMutation = useCreateEmpresa();
  const updateMutation = useUpdateEmpresa();

  const isEditing = !!empresa;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmpresaConfigFormData>({
    defaultValues: empresa
      ? {
          nit: empresa.nit,
          razon_social: empresa.razon_social,
          nombre_comercial: empresa.nombre_comercial || '',
          representante_legal: empresa.representante_legal,
          cedula_representante: empresa.cedula_representante || '',
          tipo_sociedad: empresa.tipo_sociedad,
          actividad_economica: empresa.actividad_economica || '',
          descripcion_actividad: empresa.descripcion_actividad || '',
          regimen_tributario: empresa.regimen_tributario,
          direccion_fiscal: empresa.direccion_fiscal,
          ciudad: empresa.ciudad,
          departamento: empresa.departamento,
          pais: empresa.pais || 'Colombia',
          codigo_postal: empresa.codigo_postal || '',
          telefono_principal: empresa.telefono_principal,
          telefono_secundario: empresa.telefono_secundario || '',
          email_corporativo: empresa.email_corporativo,
          sitio_web: empresa.sitio_web || '',
          matricula_mercantil: empresa.matricula_mercantil || '',
          camara_comercio: empresa.camara_comercio || '',
          fecha_constitucion: empresa.fecha_constitucion || '',
          fecha_inscripcion_registro: empresa.fecha_inscripcion_registro || '',
          zona_horaria: empresa.zona_horaria,
          formato_fecha: empresa.formato_fecha,
          moneda: empresa.moneda,
          simbolo_moneda: empresa.simbolo_moneda || '$',
          separador_miles: empresa.separador_miles || '.',
          separador_decimales: empresa.separador_decimales || ',',
        }
      : {
          tipo_sociedad: 'SAS',
          regimen_tributario: 'COMUN',
          pais: 'Colombia',
          zona_horaria: 'America/Bogota',
          formato_fecha: 'DD/MM/YYYY',
          moneda: 'COP',
          simbolo_moneda: '$',
          separador_miles: '.',
          separador_decimales: ',',
        },
  });

  const onSubmit = async (data: EmpresaConfigFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  // Usar opciones del API o fallback a constantes locales
  const tiposSociedad = choices?.tipos_sociedad || TIPOS_SOCIEDAD;
  const regimenes = choices?.regimenes_tributarios || REGIMENES_TRIBUTARIOS;
  const departamentos = choices?.departamentos || DEPARTAMENTOS_COLOMBIA;
  const formatosFecha = choices?.formatos_fecha || FORMATOS_FECHA;
  const monedas = choices?.monedas || MONEDAS;
  const zonasHorarias = choices?.zonas_horarias || ZONAS_HORARIAS;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header - Patrón Design System (igual a BrandingSection) */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Editar Datos de la Empresa' : 'Configurar Datos de la Empresa'}
        </h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Secciones del formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identificación Fiscal */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Identificación Fiscal
          </h4>
          <div className="space-y-4">
            <Input
              label="NIT"
              placeholder="900123456-7"
              {...register('nit', {
                required: 'El NIT es requerido',
                pattern: {
                  value: /^\d{9}-?\d$/,
                  message: 'Formato inválido. Use: 900123456-7',
                },
              })}
              error={errors.nit?.message}
            />
            <Input
              label="Razón Social"
              placeholder="Nombre legal de la empresa"
              {...register('razon_social', { required: 'La razón social es requerida' })}
              error={errors.razon_social?.message}
            />
            <Input
              label="Nombre Comercial (opcional)"
              placeholder="Nombre comercial o de fantasía"
              {...register('nombre_comercial')}
            />
            <Controller
              name="tipo_sociedad"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo de Sociedad"
                  options={tiposSociedad}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="regimen_tributario"
              control={control}
              render={({ field }) => (
                <Select
                  label="Régimen Tributario"
                  options={regimenes}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Input
              label="Actividad Económica (CIIU)"
              placeholder="Código CIIU"
              {...register('actividad_economica')}
            />
          </div>
        </Card>

        {/* Representante Legal */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Representante Legal
          </h4>
          <div className="space-y-4">
            <Input
              label="Nombre del Representante Legal"
              placeholder="Nombre completo"
              {...register('representante_legal', { required: 'El representante legal es requerido' })}
              error={errors.representante_legal?.message}
            />
            <Input
              label="Cédula del Representante"
              placeholder="Número de cédula"
              {...register('cedula_representante')}
            />
          </div>
        </Card>

        {/* Contacto */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contacto
          </h4>
          <div className="space-y-4">
            <Input
              label="Teléfono Principal"
              placeholder="300 123 4567"
              {...register('telefono_principal', { required: 'El teléfono principal es requerido' })}
              error={errors.telefono_principal?.message}
            />
            <Input
              label="Teléfono Secundario"
              placeholder="(opcional)"
              {...register('telefono_secundario')}
            />
            <Input
              label="Email Corporativo"
              type="email"
              placeholder="contacto@empresa.com"
              {...register('email_corporativo', {
                required: 'El email corporativo es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido',
                },
              })}
              error={errors.email_corporativo?.message}
            />
            <Input
              label="Sitio Web"
              type="url"
              placeholder="https://www.empresa.com"
              {...register('sitio_web')}
            />
          </div>
        </Card>

        {/* Ubicación */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ubicación
          </h4>
          <div className="space-y-4">
            <Input
              label="Dirección Fiscal"
              placeholder="Dirección completa"
              {...register('direccion_fiscal', { required: 'La dirección fiscal es requerida' })}
              error={errors.direccion_fiscal?.message}
            />
            <Input
              label="Ciudad"
              placeholder="Ciudad"
              {...register('ciudad', { required: 'La ciudad es requerida' })}
              error={errors.ciudad?.message}
            />
            <Controller
              name="departamento"
              control={control}
              rules={{ required: 'El departamento es requerido' }}
              render={({ field }) => (
                <Select
                  label="Departamento"
                  options={departamentos}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.departamento?.message}
                />
              )}
            />
            <Input
              label="Código Postal"
              placeholder="(opcional)"
              {...register('codigo_postal')}
            />
          </div>
        </Card>

        {/* Registro Mercantil */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Registro Mercantil
          </h4>
          <div className="space-y-4">
            <Input
              label="Matrícula Mercantil"
              placeholder="Número de matrícula"
              {...register('matricula_mercantil')}
            />
            <Input
              label="Cámara de Comercio"
              placeholder="Nombre de la Cámara"
              {...register('camara_comercio')}
            />
            <Input
              label="Fecha de Constitución"
              type="date"
              {...register('fecha_constitucion')}
            />
            <Input
              label="Fecha de Inscripción en Registro"
              type="date"
              {...register('fecha_inscripcion_registro')}
            />
          </div>
        </Card>

        {/* Configuración Regional */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Configuración Regional
          </h4>
          <div className="space-y-4">
            <Controller
              name="zona_horaria"
              control={control}
              render={({ field }) => (
                <Select
                  label="Zona Horaria"
                  options={zonasHorarias}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="formato_fecha"
              control={control}
              render={({ field }) => (
                <Select
                  label="Formato de Fecha"
                  options={formatosFecha}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="moneda"
              control={control}
              render={({ field }) => (
                <Select
                  label="Moneda"
                  options={monedas}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Símbolo"
                placeholder="$"
                {...register('simbolo_moneda')}
              />
              <Input
                label="Sep. Miles"
                placeholder="."
                maxLength={1}
                {...register('separador_miles')}
              />
              <Input
                label="Sep. Decimales"
                placeholder=","
                maxLength={1}
                {...register('separador_decimales')}
              />
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
};

/**
 * Componente principal de la sección Empresa
 */
export const EmpresaSection = () => {
  const { empresa, isLoading, isConfigured } = useEmpresaConfig();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Si no está configurada, mostrar mensaje con header estándar y botón de acción
  if (!isConfigured && !isEditing) {
    return (
      <Card>
        <div className="p-6">
          {/* Header - Patrón Design System (igual a BrandingSection) */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Datos Fiscales y Legales
            </h3>
            <Button onClick={() => setIsEditing(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              Configurar Empresa
            </Button>
          </div>

          <Alert
            variant="warning"
            message="No se ha configurado la información de la empresa. Configure los datos fiscales para generar documentos oficiales."
          />
        </div>
      </Card>
    );
  }

  // Mostrar formulario o vista
  if (isEditing) {
    return (
      <Card>
        <div className="p-6">
          <EmpresaForm
            empresa={empresa}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </div>
      </Card>
    );
  }

  return <EmpresaView empresa={empresa} onEdit={() => setIsEditing(true)} />;
};
