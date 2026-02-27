/**
 * PostulacionPage - Formulario publico de postulacion a vacante
 *
 * Accesible SIN autenticacion. El tenant se detecta por subdominio.
 * Ruta: /vacantes/:id/postular
 *
 * Flujo:
 * 1. Candidato ve la vacante en el portal publico
 * 2. Hace clic en "Postularme"
 * 3. Llena el formulario con datos personales + hoja de vida
 * 4. Envia postulacion -> Se crea candidato con origen=portal_empleo
 *
 * Usa design system: Card, Badge, Button, Spinner, Alert
 */
import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import {
  CheckCircle,
  AlertCircle,
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Upload,
  FileText,
  X,
  ArrowLeft,
  Send,
  DollarSign,
  User,
  Mail,
  Phone,
  CreditCard,
  GraduationCap,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { cn } from '@/utils/cn';
import {
  useVacantePublicaDetail,
  usePostulacionPublica,
  useBrandingPublicoHelpers,
} from '../hooks/useVacantesPublicas';

// ============================================================================
// Zod Schema
// ============================================================================

const postulacionSchema = z.object({
  nombres: z.string().min(2, 'Ingresa tu nombre').max(100),
  apellidos: z.string().min(2, 'Ingresa tus apellidos').max(100),
  email: z.string().email('Email no valido'),
  telefono: z.string().min(7, 'Telefono no valido').max(20),
  tipo_documento: z.enum(['CC', 'CE', 'PA', 'TI']),
  numero_documento: z.string().min(5, 'Numero de documento no valido').max(20),
  ciudad: z.string().min(2, 'Ingresa tu ciudad').max(100),
  nivel_educativo: z.enum([
    'bachiller',
    'tecnico',
    'tecnologo',
    'profesional',
    'especializacion',
    'maestria',
    'doctorado',
  ]),
  carta_presentacion: z.string().optional(),
});

type PostulacionFormData = z.infer<typeof postulacionSchema>;

const TIPO_DOC_OPTIONS = [
  { value: 'CC', label: 'Cedula de Ciudadania' },
  { value: 'CE', label: 'Cedula de Extranjeria' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
];

const NIVEL_EDUCATIVO_OPTIONS = [
  { value: 'bachiller', label: 'Bachiller' },
  { value: 'tecnico', label: 'Tecnico' },
  { value: 'tecnologo', label: 'Tecnologo' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'especializacion', label: 'Especializacion' },
  { value: 'maestria', label: 'Maestria' },
  { value: 'doctorado', label: 'Doctorado' },
];

// ============================================================================
// Public Layout
// ============================================================================

function PublicPortalLayout({
  children,
  empresaNombre,
  logoUrl,
  primaryColor,
}: {
  children: React.ReactNode;
  empresaNombre: string;
  logoUrl: string | null;
  primaryColor: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={empresaNombre}
                className="h-10 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {empresaNombre}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Portal de empleo</p>
                </div>
              </>
            )}
          </div>
          <Link to="/vacantes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-gray-400">
          {empresaNombre} &middot; Portal de empleo &middot; Powered by StrateKaz
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Salary formatter
// ============================================================================

function formatCOP(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ============================================================================
// Vacancy Info Card
// ============================================================================

function VacanteInfoCard({
  vacante,
}: {
  vacante: {
    titulo: string;
    cargo_requerido: string;
    area: string;
    ubicacion: string;
    horario: string;
    modalidad_display: string;
    tipo_contrato_nombre: string;
    rango_salarial: { minimo?: string; maximo?: string } | null;
    requisitos_minimos?: string;
    funciones_principales?: string;
  };
}) {
  return (
    <Card className="mb-6">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {vacante.titulo}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {vacante.cargo_requerido}
              {vacante.area && <span> &middot; {vacante.area}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {vacante.ubicacion}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {vacante.horario}
          </span>
          <Badge variant="info" size="sm">
            {vacante.modalidad_display}
          </Badge>
          <Badge variant="gray" size="sm">
            {vacante.tipo_contrato_nombre}
          </Badge>
          {vacante.rango_salarial && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              {vacante.rango_salarial.minimo && vacante.rango_salarial.maximo
                ? `${formatCOP(vacante.rango_salarial.minimo)} - ${formatCOP(vacante.rango_salarial.maximo)}`
                : vacante.rango_salarial.minimo
                  ? `Desde ${formatCOP(vacante.rango_salarial.minimo)}`
                  : `Hasta ${formatCOP(vacante.rango_salarial.maximo!)}`}
            </span>
          )}
        </div>

        {/* Requirements summary */}
        {vacante.requisitos_minimos && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Requisitos minimos
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line line-clamp-4">
              {vacante.requisitos_minimos}
            </p>
          </div>
        )}

        {vacante.funciones_principales && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Funciones principales
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line line-clamp-4">
              {vacante.funciones_principales}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Form Field wrapper
// ============================================================================

function FormField({
  label,
  error,
  required,
  icon,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function PostulacionPage() {
  const { id } = useParams<{ id: string }>();
  const vacanteId = parseInt(id || '0', 10);

  const { data: vacante, isLoading, error: vacanteError } = useVacantePublicaDetail(vacanteId);
  const postulacionMutation = usePostulacionPublica();
  const { empresaNombre, logoUrl, primaryColor } = useBrandingPublicoHelpers();

  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostulacionFormData>({
    resolver: zodResolver(postulacionSchema),
    defaultValues: {
      tipo_documento: 'CC',
      nivel_educativo: 'profesional',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvError('');

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setCvError('El archivo no puede superar los 5 MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx'].includes(ext)) {
      setCvError('Solo se aceptan archivos PDF, DOC o DOCX.');
      return;
    }

    setCvFile(file);
  };

  const removeFile = () => {
    setCvFile(null);
    setCvError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: PostulacionFormData) => {
    if (!cvFile) {
      setCvError('La hoja de vida es obligatoria.');
      return;
    }

    const formData = new FormData();
    formData.append('nombres', data.nombres);
    formData.append('apellidos', data.apellidos);
    formData.append('email', data.email);
    formData.append('telefono', data.telefono);
    formData.append('tipo_documento', data.tipo_documento);
    formData.append('numero_documento', data.numero_documento);
    formData.append('ciudad', data.ciudad);
    formData.append('nivel_educativo', data.nivel_educativo);
    formData.append('hoja_vida', cvFile);
    if (data.carta_presentacion) {
      formData.append('carta_presentacion', data.carta_presentacion);
    }

    postulacionMutation.mutate(
      { vacanteId, formData },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  // Loading
  if (isLoading) {
    return (
      <PublicPortalLayout
        empresaNombre={empresaNombre}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">Cargando informacion de la vacante...</p>
        </div>
      </PublicPortalLayout>
    );
  }

  // Error / Not found
  if (vacanteError || !vacante) {
    return (
      <PublicPortalLayout
        empresaNombre={empresaNombre}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      >
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Vacante no disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Esta vacante no existe o ya no esta disponible para postulaciones.
          </p>
          <Link to="/vacantes">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ver todas las vacantes
            </Button>
          </Link>
        </div>
      </PublicPortalLayout>
    );
  }

  // Success
  if (submitted) {
    return (
      <PublicPortalLayout
        empresaNombre={empresaNombre}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      >
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Postulacion enviada exitosamente
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Tu postulacion a <strong>{vacante.titulo}</strong> ha sido registrada.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Nuestro equipo revisara tu perfil y te contactaremos pronto. Revisa tu correo
            electronico para mas informacion.
          </p>
          <Link to="/vacantes">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ver mas vacantes
            </Button>
          </Link>
        </div>
      </PublicPortalLayout>
    );
  }

  // Form
  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

  return (
    <PublicPortalLayout empresaNombre={empresaNombre} logoUrl={logoUrl} primaryColor={primaryColor}>
      {/* Vacancy info */}
      <VacanteInfoCard vacante={vacante} />

      {/* Form */}
      <Card>
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Formulario de postulacion
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Completa tus datos para postularte a esta vacante. Los campos marcados con * son
            obligatorios.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Personal info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Nombres"
                error={errors.nombres?.message}
                required
                icon={<User className="w-3.5 h-3.5" />}
              >
                <input
                  {...register('nombres')}
                  placeholder="Ej: Juan Carlos"
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Apellidos"
                error={errors.apellidos?.message}
                required
                icon={<User className="w-3.5 h-3.5" />}
              >
                <input
                  {...register('apellidos')}
                  placeholder="Ej: Garcia Lopez"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Tipo de documento"
                error={errors.tipo_documento?.message}
                required
                icon={<CreditCard className="w-3.5 h-3.5" />}
              >
                <select {...register('tipo_documento')} className={inputClass}>
                  {TIPO_DOC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Numero de documento"
                error={errors.numero_documento?.message}
                required
                icon={<CreditCard className="w-3.5 h-3.5" />}
              >
                <input
                  {...register('numero_documento')}
                  placeholder="Ej: 1234567890"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Correo electronico"
                error={errors.email?.message}
                required
                icon={<Mail className="w-3.5 h-3.5" />}
              >
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Ej: juan@email.com"
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Telefono"
                error={errors.telefono?.message}
                required
                icon={<Phone className="w-3.5 h-3.5" />}
              >
                <input
                  {...register('telefono')}
                  placeholder="Ej: 3001234567"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Ciudad"
                error={errors.ciudad?.message}
                required
                icon={<MapPin className="w-3.5 h-3.5" />}
              >
                <input {...register('ciudad')} placeholder="Ej: Bogota" className={inputClass} />
              </FormField>

              <FormField
                label="Nivel educativo"
                error={errors.nivel_educativo?.message}
                required
                icon={<GraduationCap className="w-3.5 h-3.5" />}
              >
                <select {...register('nivel_educativo')} className={inputClass}>
                  {NIVEL_EDUCATIVO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* File upload */}
            <FormField
              label="Hoja de vida (CV)"
              error={cvError}
              required
              icon={<FileText className="w-3.5 h-3.5" />}
            >
              {cvFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <FileText className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {cvFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                    cvError
                      ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-600 dark:hover:bg-blue-900/10'
                  )}
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Haz clic para seleccionar tu CV
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC o DOCX (max. 5MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </FormField>

            {/* Cover letter */}
            <FormField
              label="Carta de presentacion (opcional)"
              error={errors.carta_presentacion?.message}
            >
              <textarea
                {...register('carta_presentacion')}
                rows={4}
                placeholder="Cuentanos por que te interesa esta posicion y que te hace un buen candidato..."
                className={cn(inputClass, 'resize-y')}
              />
            </FormField>

            {/* Error alert */}
            {postulacionMutation.isError && (
              <Alert
                variant="error"
                message={
                  (
                    postulacionMutation.error as AxiosError<{
                      detail?: string;
                      non_field_errors?: string[];
                    }>
                  )?.response?.data?.detail ||
                  (postulacionMutation.error as AxiosError<{ non_field_errors?: string[] }>)
                    ?.response?.data?.non_field_errors?.[0] ||
                  'Error al enviar la postulacion. Intenta nuevamente.'
                }
              />
            )}

            {/* Submit */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                isLoading={postulacionMutation.isPending}
                disabled={postulacionMutation.isPending}
              >
                <Send className="w-5 h-5 mr-2" />
                Enviar postulacion
              </Button>
              <p className="mt-3 text-xs text-gray-400">
                Al enviar tu postulacion, autorizas el tratamiento de tus datos personales conforme
                a la politica de privacidad de la empresa.
              </p>
            </div>
          </form>
        </div>
      </Card>
    </PublicPortalLayout>
  );
}
