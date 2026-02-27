/**
 * VacantesPublicasPage - Portal publico de vacantes de empleo
 *
 * Accesible SIN autenticacion. El tenant se detecta por subdominio.
 * Ruta: /vacantes
 *
 * Muestra las vacantes abiertas y publicadas externamente.
 * Permite filtrar por modalidad, ubicacion y busqueda de texto.
 * Cada vacante tiene un boton "Postularme" que redirige al formulario.
 *
 * Branding dinamico: logo, nombre, eslogan, primaryColor del tenant.
 * Usa design system: Card, Badge, Button, Spinner, EmptyState
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  Building2,
  Users,
  DollarSign,
  ChevronRight,
  Filter,
  Monitor,
  Home,
  Wifi,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import {
  useVacantesPublicas,
  useBrandingPublicoHelpers,
  hexToRgba,
} from '../hooks/useVacantesPublicas';

// ============================================================================
// Types
// ============================================================================

interface VacantePublica {
  id: number;
  codigo_vacante: string;
  titulo: string;
  cargo_requerido: string;
  area: string;
  descripcion: string;
  tipo_contrato_nombre: string;
  modalidad: 'presencial' | 'hibrido' | 'remoto';
  modalidad_display: string;
  ubicacion: string;
  horario: string;
  prioridad: string;
  prioridad_display: string;
  numero_posiciones: number;
  posiciones_cubiertas: number;
  fecha_apertura: string;
  rango_salarial: { minimo?: string; maximo?: string } | null;
  empresa_nombre: string;
}

// ============================================================================
// Public Layout (shared pattern) — Branded
// ============================================================================

function PublicPortalLayout({
  children,
  empresaNombre,
  empresaSlogan,
  logoUrl,
  primaryColor,
}: {
  children: React.ReactNode;
  empresaNombre: string;
  empresaSlogan: string;
  logoUrl: string | null;
  primaryColor: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header con color primario del tenant */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        {/* Accent bar */}
        <div className="h-1" style={{ backgroundColor: primaryColor }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={empresaNombre}
                className="h-10 w-auto max-w-[160px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            {/* Nombre + eslogan siempre visible */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {empresaNombre}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{empresaSlogan}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Briefcase className="w-3 h-3" />
            Vacantes
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-gray-400">
          {empresaNombre} &middot; {empresaSlogan} &middot; Powered by StrateKaz
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Modalidad Icon
// ============================================================================

function ModalidadIcon({ modalidad }: { modalidad: string }) {
  switch (modalidad) {
    case 'presencial':
      return <Building2 className="w-3.5 h-3.5" />;
    case 'remoto':
      return <Wifi className="w-3.5 h-3.5" />;
    case 'hibrido':
      return <Monitor className="w-3.5 h-3.5" />;
    default:
      return <Home className="w-3.5 h-3.5" />;
  }
}

// ============================================================================
// Salary Display
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
// Vacancy Card — Branded
// ============================================================================

function VacanteCard({ vacante, primaryColor }: { vacante: VacantePublica; primaryColor: string }) {
  const posicionesPendientes = vacante.numero_posiciones - vacante.posiciones_cubiertas;
  const fechaStr = new Date(vacante.fecha_apertura).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const prioridadVariant: Record<string, 'danger' | 'warning' | 'info' | 'gray'> = {
    urgente: 'danger',
    alta: 'warning',
    media: 'info',
    baja: 'gray',
  };

  const modalidadVariant: Record<string, 'success' | 'info' | 'primary'> = {
    presencial: 'info',
    remoto: 'success',
    hibrido: 'primary',
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300"
      style={{ '--hover-border': hexToRgba(primaryColor, 0.3) } as React.CSSProperties}
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors truncate">
              {vacante.titulo}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {vacante.cargo_requerido}
              {vacante.area && <span> &middot; {vacante.area}</span>}
            </p>
          </div>
          <Badge variant={prioridadVariant[vacante.prioridad] || 'gray'} size="sm">
            {vacante.prioridad_display}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
          {vacante.descripcion}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={modalidadVariant[vacante.modalidad] || 'gray'} size="sm">
            <ModalidadIcon modalidad={vacante.modalidad} />
            <span className="ml-1">{vacante.modalidad_display}</span>
          </Badge>
          <Badge variant="gray" size="sm">
            {vacante.tipo_contrato_nombre}
          </Badge>
          {posicionesPendientes > 1 && (
            <Badge variant="info" size="sm">
              <Users className="w-3 h-3 mr-1" />
              {posicionesPendientes} vacantes
            </Badge>
          )}
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {vacante.ubicacion}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {vacante.horario}
          </span>
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-400">Publicada el {fechaStr}</span>
          <Link to={`/vacantes/${vacante.id}/postular`}>
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Postularme
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Filter Bar — Branded
// ============================================================================

const MODALIDAD_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Remoto' },
  { value: 'hibrido', label: 'Hibrido' },
];

function FilterBar({
  search,
  onSearchChange,
  modalidad,
  onModalidadChange,
  total,
  empresaNombre,
  primaryColor,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  modalidad: string;
  onModalidadChange: (v: string) => void;
  total: number;
  empresaNombre: string;
  primaryColor: string;
}) {
  return (
    <div className="space-y-4 mb-8">
      {/* Hero section */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Oportunidades laborales
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Encuentra tu pr&oacute;xima oportunidad profesional en{' '}
          <strong style={{ color: primaryColor }}>{empresaNombre}</strong>.{' '}
          {total > 0 && `${total} vacantes disponibles.`}
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por cargo, &aacute;rea o palabra clave..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-colors outline-none"
            style={{
              // @ts-expect-error CSS custom property
              '--tw-ring-color': hexToRgba(primaryColor, 0.4),
            }}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${hexToRgba(primaryColor, 0.15)}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '';
              e.target.style.boxShadow = '';
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          {MODALIDAD_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onModalidadChange(f.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                modalidad === f.value
                  ? 'text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
              )}
              style={
                modalidad === f.value
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : undefined
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function VacantesPublicasPage() {
  const [search, setSearch] = useState('');
  const [modalidad, setModalidad] = useState('');

  const { data: vacantes, isLoading, error } = useVacantesPublicas({ search, modalidad });
  const { empresaNombre, empresaSlogan, logoUrl, primaryColor } = useBrandingPublicoHelpers();

  const vacantesList: VacantePublica[] = useMemo(() => {
    if (!vacantes) return [];
    return Array.isArray(vacantes)
      ? vacantes
      : ((vacantes as unknown as { results?: VacantePublica[] })?.results ?? []);
  }, [vacantes]);

  return (
    <PublicPortalLayout
      empresaNombre={empresaNombre}
      empresaSlogan={empresaSlogan}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        modalidad={modalidad}
        onModalidadChange={setModalidad}
        total={vacantesList.length}
        empresaNombre={empresaNombre}
        primaryColor={primaryColor}
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-gray-500">Cargando vacantes...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar vacantes
          </h3>
          <p className="text-sm text-gray-500">
            No se pudieron cargar las vacantes disponibles. Intenta nuevamente m&aacute;s tarde.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && vacantesList.length === 0 && (
        <EmptyState
          icon={<Briefcase className="w-12 h-12 text-gray-300" />}
          title="No hay vacantes disponibles"
          description={
            search || modalidad
              ? 'No se encontraron vacantes con los filtros seleccionados. Intenta con otros criterios.'
              : 'Actualmente no hay vacantes abiertas. Vuelve pronto para ver nuevas oportunidades.'
          }
        />
      )}

      {/* Results */}
      {!isLoading && !error && vacantesList.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {vacantesList.map((vacante) => (
            <VacanteCard key={vacante.id} vacante={vacante} primaryColor={primaryColor} />
          ))}
        </div>
      )}
    </PublicPortalLayout>
  );
}
