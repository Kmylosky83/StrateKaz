/**
 * ClientePortalPage — Portal de clientes
 *
 * Tabs:
 * | Mi Información | Contactos | Scoring | Mi Cuenta |
 *
 * Guard: redirige a /dashboard si el usuario no tiene cliente vinculado.
 */
import { useState, useMemo, lazy, Suspense } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Hash,
  Settings,
  Key,
  Smartphone,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Star,
  BellRing,
  Swords,
} from 'lucide-react';
import { AnimatedPage, Badge, Card, Skeleton, Tabs } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useMiCliente, useMisContactos, useMiScoring } from '../hooks/useMiCliente';
import { ChangePasswordModal, TwoFactorModal, Disable2FAModal } from '@/components/common/auth';
import { use2FA } from '@/hooks/use2FA';
import { isClientePortalUser } from '@/utils/portalUtils';
import {
  useNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
} from '@/features/audit-system/hooks/useNotificaciones';
import { cn } from '@/utils/cn';
import type { ContactoCliente } from '../types';

const GameEntryCard = lazy(() =>
  import('@/features/sst-game').then((m) => ({ default: m.GameEntryCard }))
);

// ============================================================================
// HELPERS
// ============================================================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide sm:w-40 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100">{value || '—'}</span>
    </div>
  );
}

function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return '$0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });
}

// ============================================================================
// TAB — MI INFORMACIÓN
// ============================================================================

function TabInformacion() {
  const { data: cliente, isLoading } = useMiCliente();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!cliente) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No se encontró información de tu empresa.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identificación */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Identificación
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
          <InfoRow label="Razón social" value={cliente.razon_social} />
          {cliente.nombre_comercial && (
            <InfoRow label="Nombre comercial" value={cliente.nombre_comercial} />
          )}
          <InfoRow label="Tipo de documento" value={cliente.tipo_documento} />
          <InfoRow label="N.° documento" value={cliente.numero_documento} />
          <InfoRow label="Código cliente" value={cliente.codigo_cliente} />
          <InfoRow label="Tipo de cliente" value={cliente.tipo_cliente_nombre} />
          <InfoRow
            label="Estado"
            value={
              <Badge variant={cliente.estado_cliente_color === 'success' ? 'success' : 'info'}>
                {cliente.estado_cliente_nombre}
              </Badge>
            }
          />
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Contacto
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
          {cliente.direccion && (
            <InfoRow
              label="Dirección"
              value={
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {cliente.direccion}
                  {cliente.ciudad && `, ${cliente.ciudad}`}
                  {cliente.departamento && `, ${cliente.departamento}`}
                </span>
              }
            />
          )}
          {cliente.telefono && (
            <InfoRow
              label="Teléfono"
              value={
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {cliente.telefono}
                </span>
              }
            />
          )}
          {cliente.email && (
            <InfoRow
              label="Email"
              value={
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {cliente.email}
                </span>
              }
            />
          )}
        </div>
      </div>

      {/* Condiciones comerciales */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Condiciones Comerciales
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
          <InfoRow label="Plazo de pago" value={`${cliente.plazo_pago_dias} días`} />
          <InfoRow label="Cupo de crédito" value={formatCurrency(cliente.cupo_credito)} />
          <InfoRow label="Descuento comercial" value={`${cliente.descuento_comercial}%`} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB — CONTACTOS
// ============================================================================

function TabContactos() {
  const { data: contactos, isLoading } = useMisContactos();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const lista: ContactoCliente[] = contactos ?? [];

  if (lista.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay contactos registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lista.map((contacto) => (
        <Card key={contacto.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {contacto.nombre_completo}
                </h4>
                {contacto.es_principal && (
                  <Badge variant="success" className="text-[10px]">
                    Principal
                  </Badge>
                )}
              </div>
              {contacto.cargo && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{contacto.cargo}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                {contacto.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {contacto.email}
                  </span>
                )}
                {contacto.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {contacto.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// TAB — SCORING
// ============================================================================

function TabScoring() {
  const { data: scoring, isLoading } = useMiScoring();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!scoring) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aún no se ha calculado tu scoring.
        </p>
      </div>
    );
  }

  const scoringColor = (val: number) => {
    if (val >= 80) return 'text-green-600';
    if (val >= 60) return 'text-amber-500';
    if (val >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Puntuación total */}
      <Card className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-6 h-6 text-amber-400" />
          <span className={cn('text-4xl font-bold', scoringColor(scoring.puntuacion_total))}>
            {scoring.puntuacion_total}
          </span>
          <span className="text-lg text-gray-400">/100</span>
        </div>
        <Badge
          variant={
            scoring.color_nivel === 'success'
              ? 'success'
              : scoring.color_nivel === 'warning'
                ? 'warning'
                : scoring.color_nivel === 'danger'
                  ? 'error'
                  : 'info'
          }
        >
          {scoring.nivel_scoring}
        </Badge>
      </Card>

      {/* Detalle por criterio */}
      {(scoring.frecuencia_compra != null || scoring.volumen_compra != null) && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Detalle por Criterio
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
            {scoring.frecuencia_compra != null && (
              <InfoRow label="Frecuencia de compra" value={`${scoring.frecuencia_compra}%`} />
            )}
            {scoring.volumen_compra != null && (
              <InfoRow label="Volumen de compra" value={`${scoring.volumen_compra}%`} />
            )}
            {scoring.puntualidad_pago != null && (
              <InfoRow label="Puntualidad de pago" value={`${scoring.puntualidad_pago}%`} />
            )}
            {scoring.antiguedad != null && (
              <InfoRow label="Antigüedad" value={`${scoring.antiguedad}%`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB — MI CUENTA
// ============================================================================

function TabCuenta() {
  const user = useAuthStore((s) => s.user);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const {
    is2FAEnabled,
    isLoading: loading2FA,
    showSetupModal,
    setShowSetupModal,
    showDisableModal,
    setShowDisableModal,
    handleSetupSuccess,
    handleDisableSuccess,
  } = use2FA();

  return (
    <div className="space-y-6">
      {/* Datos de acceso */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Datos de Acceso
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
          <InfoRow
            label="Email"
            value={
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {user?.email}
              </span>
            }
          />
          <InfoRow label="Usuario" value={user?.username} />
        </div>
      </div>

      {/* Seguridad */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Seguridad
        </h3>
        <div className="space-y-3">
          {/* Cambiar contraseña */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Contraseña</p>
                  <p className="text-xs text-gray-500">Cambiar tu contraseña de acceso</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePassword(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Cambiar
              </button>
            </div>
          </Card>

          {/* 2FA */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Autenticación de dos factores
                  </p>
                  <p className="text-xs text-gray-500">
                    {loading2FA
                      ? 'Verificando...'
                      : is2FAEnabled
                        ? 'Activada — tu cuenta está protegida'
                        : 'Desactivada — actívala para mayor seguridad'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {is2FAEnabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <button
                      onClick={() => setShowDisableModal(true)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Desactivar
                    </button>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => setShowSetupModal(true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Activar
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modales */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <TwoFactorModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={handleSetupSuccess}
      />
      <Disable2FAModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={handleDisableSuccess}
      />
    </div>
  );
}

// ============================================================================
// TAB — NOTIFICACIONES
// ============================================================================

function TabNotificaciones() {
  const { data, isLoading } = useNotificaciones();
  const marcarLeida = useMarcarLeida();
  const marcarTodas = useMarcarTodasLeidas();

  const notificaciones = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data?.results ?? []);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (notificaciones.length === 0) {
    return (
      <div className="text-center py-12">
        <BellRing className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No tienes notificaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Marcar todas como leídas */}
      <div className="flex justify-end">
        <button
          onClick={() => marcarTodas.mutate()}
          disabled={marcarTodas.isPending}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Marcar todas como leídas
        </button>
      </div>

      {notificaciones.map((n: Record<string, unknown>) => (
        <Card
          key={n.id as number}
          className={cn(
            'p-4 cursor-pointer transition-colors',
            !(n.leida as boolean) &&
              'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
          )}
          onClick={() => {
            if (!(n.leida as boolean)) {
              marcarLeida.mutate(n.id as number);
            }
          }}
        >
          <div className="flex items-start gap-3">
            <BellRing
              className={cn(
                'w-4 h-4 flex-shrink-0 mt-0.5',
                !(n.leida as boolean) ? 'text-blue-500' : 'text-gray-400'
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {n.titulo as string}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {n.mensaje as string}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(n.created_at as string).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function ClientePortalPage() {
  const user = useAuthStore((s) => s.user);
  const { data: cliente, isLoading } = useMiCliente();
  const { primaryColor } = useBrandingConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activa desde URL
  const activeTabId = searchParams.get('tab') || 'info';
  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Tabs del portal
  const tabs = useMemo(
    () => [
      { id: 'info', label: 'Mi Información', icon: <Building2 className="w-4 h-4" /> },
      { id: 'contactos', label: 'Contactos', icon: <Users className="w-4 h-4" /> },
      { id: 'scoring', label: 'Mi Scoring', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'juego-sst', label: 'Héroes SST', icon: <Swords className="w-4 h-4" /> },
      { id: 'notificaciones', label: 'Notificaciones', icon: <BellRing className="w-4 h-4" /> },
      { id: 'cuenta', label: 'Mi Cuenta', icon: <Settings className="w-4 h-4" /> },
    ],
    []
  );

  // Header
  const clienteName =
    cliente?.nombre_comercial || cliente?.razon_social || user?.cliente_nombre || 'Mi Empresa';
  const clienteCodigo = cliente?.codigo_cliente;

  // Guard: si no tiene cliente vinculado y no es portal-only → redirect
  const hasCliente = Boolean(user?.cliente) || isClientePortalUser(user);
  if (!hasCliente) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero */}
        <div
          className="relative rounded-2xl p-6 sm:p-8 mb-6 text-white overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor || '#3b82f6'} 0%, ${primaryColor ? primaryColor + 'dd' : '#2563eb'} 100%)`,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 opacity-90" />
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-48 bg-white/20" />
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold">{clienteName}</h1>
                )}
                {clienteCodigo && (
                  <p className="text-sm opacity-80 flex items-center gap-1 mt-0.5">
                    <Hash className="w-3.5 h-3.5" />
                    {clienteCodigo}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm opacity-80 mt-2">
              Consulta tu información, contactos, scoring y configuración de cuenta.
            </p>
          </div>

          {/* Decoración */}
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTabId} onChange={setActiveTab} />

        {/* Content */}
        <div className="mt-6">
          {activeTabId === 'info' && <TabInformacion />}
          {activeTabId === 'contactos' && <TabContactos />}
          {activeTabId === 'scoring' && <TabScoring />}
          {activeTabId === 'juego-sst' && (
            <Suspense
              fallback={<div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>}
            >
              <GameEntryCard />
            </Suspense>
          )}
          {activeTabId === 'notificaciones' && <TabNotificaciones />}
          {activeTabId === 'cuenta' && <TabCuenta />}
        </div>
      </div>
    </AnimatedPage>
  );
}
