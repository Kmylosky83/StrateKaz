/**
 * ProveedorPortalPage — Portal diferenciado por tipo de proveedor
 *
 * Tabs condicionales según tipo_proveedor:
 *
 * | Tipo               | Empresa | Precios MP | Profesionales | Contratos | Evaluaciones | Mi Cuenta |
 * |--------------------|---------|------------|---------------|-----------|-------------|-----------|
 * | MATERIA_PRIMA      |    ✓    |     ✓      |       —       |     ✓     |      ✓      |     ✓     |
 * | PRODUCTOS_SERVICIOS|    ✓    |     —      |       —       |     ✓     |      ✓      |     ✓     |
 * | UNIDAD_NEGOCIO     |    ✓    |     ✓      |       —       |     ✓     |      ✓      |     ✓     |
 * | TRANSPORTISTA      |    ✓    |     —      |       —       |     ✓     |      ✓      |     ✓     |
 * | CONSULTOR          |    ✓    |     —      |       ✓       |     ✓     |      ✓      |     ✓     |
 * | CONTRATISTA        |    ✓    |     —      |       —       |     ✓     |      ✓      |     ✓     |
 *
 * Guard: redirige a /dashboard si el usuario no tiene proveedor vinculado
 */
import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  Hash,
  Settings,
  Key,
  Smartphone,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Package,
  ShoppingBag,
  Truck,
  Building,
  Briefcase,
  Wrench,
} from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, Skeleton, Tabs } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useMiEmpresa, useMisContratos, useMisEvaluaciones } from '../hooks/useMiEmpresa';
import { ChangePasswordModal, TwoFactorModal, Disable2FAModal } from '@/components/common/auth';
import { use2FA } from '@/hooks/use2FA';
import { TabPrecios } from '../components/TabPrecios';
import { TabProfesionales } from '../components/TabProfesionales';
import { isPortalOnlyUser } from '@/utils/portalUtils';
import type { ContratoProveedor, EvaluacionProveedor, TipoProveedorCodigo } from '../types';

// ============================================================================
// CONFIGURACIÓN POR TIPO DE PROVEEDOR
// ============================================================================

interface TipoConfig {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  description: string;
}

const TIPO_CONFIG: Record<string, TipoConfig> = {
  MATERIA_PRIMA: {
    icon: Package,
    label: 'Materia Prima',
    description: 'Consulta tu información, precios de materia prima, contratos y evaluaciones.',
  },
  PRODUCTOS_SERVICIOS: {
    icon: ShoppingBag,
    label: 'Productos y Servicios',
    description: 'Consulta tu información, condiciones comerciales y evaluaciones.',
  },
  UNIDAD_NEGOCIO: {
    icon: Building,
    label: 'Unidad de Negocio',
    description: 'Consulta tu información, precios, contratos y evaluaciones.',
  },
  TRANSPORTISTA: {
    icon: Truck,
    label: 'Transportista',
    description: 'Consulta tu información, condiciones de servicio y evaluaciones.',
  },
  CONSULTOR: {
    icon: Briefcase,
    label: 'Consultoría',
    description: 'Gestiona tus profesionales, consulta contratos y evaluaciones de tu firma.',
  },
  CONTRATISTA: {
    icon: Wrench,
    label: 'Contratista',
    description: 'Consulta tu información, contratos y evaluaciones.',
  },
};

const DEFAULT_CONFIG: TipoConfig = {
  icon: Building2,
  label: 'Proveedor',
  description: 'Consulta tu información, contratos y evaluaciones.',
};

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calificacionBadge(calificacion: string | null): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info';
} {
  if (!calificacion) return { label: 'Sin calificar', variant: 'info' };
  const val = Number(calificacion);
  if (val >= 80) return { label: `${val.toFixed(1)}`, variant: 'success' };
  if (val >= 60) return { label: `${val.toFixed(1)}`, variant: 'warning' };
  return { label: `${val.toFixed(1)}`, variant: 'error' };
}

const ESTADO_MAP: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  APROBADA: 'success',
  COMPLETADA: 'info',
  EN_PROCESO: 'warning',
  BORRADOR: 'error',
};

// ============================================================================
// SUB-COMPONENTS — TAB INTERNOS (existentes)
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

function TabEmpresa() {
  const { data: empresa, isLoading } = useMiEmpresa();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!empresa) {
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
          <InfoRow label="Nombre comercial" value={empresa.nombre_comercial} />
          <InfoRow label="Razón social" value={empresa.razon_social} />
          <InfoRow label="Tipo de documento" value={empresa.tipo_documento_data?.nombre || '—'} />
          <InfoRow label="N.° documento" value={empresa.numero_documento} />
          {empresa.nit && <InfoRow label="NIT" value={empresa.nit} />}
          <InfoRow label="Tipo proveedor" value={empresa.tipo_proveedor_data?.nombre || '—'} />
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Contacto
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
          <InfoRow
            label="Dirección"
            value={
              empresa.direccion ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {empresa.direccion}, {empresa.ciudad}
                  {empresa.departamento_data && `, ${empresa.departamento_data.nombre}`}
                </span>
              ) : null
            }
          />
          <InfoRow
            label="Teléfono"
            value={
              empresa.telefono ? (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {empresa.telefono}
                </span>
              ) : null
            }
          />
          <InfoRow
            label="Email"
            value={
              empresa.email ? (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {empresa.email}
                </span>
              ) : null
            }
          />
        </div>
      </div>

      {empresa.observaciones && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Observaciones
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            {empresa.observaciones}
          </p>
        </div>
      )}
    </div>
  );
}

function TabContratos() {
  const { data: contratos, isLoading } = useMisContratos();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const lista: ContratoProveedor[] = contratos ?? [];

  if (lista.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay condiciones comerciales registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lista.map((contrato) => (
        <div
          key={contrato.id}
          className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {contrato.descripcion}
              </p>
              {contrato.forma_pago && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Forma de pago: {contrato.forma_pago}
                </p>
              )}
            </div>
            <Badge variant={contrato.esta_vigente ? 'success' : 'error'} size="sm">
              {contrato.esta_vigente ? 'Vigente' : 'Vencida'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block">Valor acordado</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {contrato.valor_acordado}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Vigencia desde</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(contrato.vigencia_desde)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Vigencia hasta</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {contrato.vigencia_hasta ? formatDate(contrato.vigencia_hasta) : 'Indefinida'}
              </span>
            </div>
          </div>
          {contrato.plazo_entrega && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Plazo de entrega: {contrato.plazo_entrega}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function TabEvaluaciones() {
  const { data: evaluaciones, isLoading } = useMisEvaluaciones();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const lista: EvaluacionProveedor[] = evaluaciones ?? [];

  if (lista.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay evaluaciones registradas aún.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lista.map((ev) => {
        const cal = calificacionBadge(ev.calificacion_total);
        return (
          <div key={ev.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Período: {ev.periodo}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDate(ev.fecha_evaluacion)} · Evaluado por: {ev.evaluado_por_nombre}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={ESTADO_MAP[ev.estado] ?? 'info'} size="sm">
                  {ev.estado_display}
                </Badge>
                <Badge variant={cal.variant} size="sm">
                  {cal.label}
                </Badge>
              </div>
            </div>
            {ev.observaciones && (
              <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                {ev.observaciones}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TabMiCuenta() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const { status, isLoadingStatus } = use2FA();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-4">
      {/* Info usuario */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
        <InfoRow label="Usuario" value={user?.username} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Cargo" value={user?.cargo_name} />
      </div>

      {/* Cambiar contraseña */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
            <Key className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Cambiar Contraseña
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Actualiza tu contraseña regularmente para mantener tu cuenta segura.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowPasswordModal(true)}
            >
              Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Card>

      {/* 2FA */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
            <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Autenticación de Dos Factores
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Añade una capa extra de seguridad a tu cuenta.
            </p>
            {!isLoadingStatus && status && (
              <div className="mt-3 flex items-center gap-3">
                {status.is_enabled ? (
                  <>
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3.5 w-3.5" /> Habilitado
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDisable2FAModal(true)}
                    >
                      Deshabilitar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <XCircle className="h-3.5 w-3.5" /> Deshabilitado
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setShow2FAModal(true)}>
                      Habilitar
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modals */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <TwoFactorModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} />
      <Disable2FAModal isOpen={showDisable2FAModal} onClose={() => setShowDisable2FAModal(false)} />
    </div>
  );
}

// ============================================================================
// TABS BUILDER — Construye tabs según tipo de proveedor
// ============================================================================

interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

function buildTabs(
  tipoCodigo: TipoProveedorCodigo | string,
  requiereMP: boolean,
  esRepresentanteFirma: boolean
): TabDef[] {
  const tabs: TabDef[] = [
    { id: 'empresa', label: 'Mi Empresa', icon: <Building2 className="w-4 h-4" /> },
  ];

  // Precios MP: para tipos que manejan materia prima
  if (requiereMP) {
    tabs.push({
      id: 'precios',
      label: 'Precios MP',
      icon: <DollarSign className="w-4 h-4" />,
    });
  }

  // Mis Profesionales: solo para REPRESENTANTES de firma consultora
  // (portal-only + tipo CONSULTOR). Profesionales colocados con cargo real NO ven este tab.
  if (tipoCodigo === 'CONSULTOR' && esRepresentanteFirma) {
    tabs.push({
      id: 'profesionales',
      label: 'Mis Profesionales',
      icon: <Users className="w-4 h-4" />,
    });
  }

  // Tabs comunes
  tabs.push(
    { id: 'contratos', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'mi-cuenta', label: 'Mi Cuenta', icon: <Settings className="w-4 h-4" /> }
  );

  return tabs;
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProveedorPortalPage() {
  const [activeTab, setActiveTab] = useState('empresa');
  const user = useAuthStore((s) => s.user);
  const isLoadingUser = useAuthStore((s) => s.isLoadingUser);
  const { primaryColor } = useBrandingConfig();
  const { data: empresa, isLoading } = useMiEmpresa();

  // Derivar tipo y configuración
  const tipoCodigo = empresa?.tipo_proveedor_data?.codigo || '';
  const requiereMP = empresa?.tipo_proveedor_data?.requiere_materia_prima ?? false;
  const tipoConfig = TIPO_CONFIG[tipoCodigo] || DEFAULT_CONFIG;
  const HeroIcon = tipoConfig.icon;

  // Determinar si es representante de firma (portal-only) o profesional colocado
  const esRepresentanteFirma = isPortalOnlyUser(user);

  // Tabs dinámicos según tipo + perfil
  const tabs = useMemo(
    () => buildTabs(tipoCodigo, requiereMP, esRepresentanteFirma),
    [tipoCodigo, requiereMP, esRepresentanteFirma]
  );

  // Guard: esperar a que el perfil del User se cargue antes de decidir
  if (isLoadingUser || !user) {
    return (
      <AnimatedPage>
        <div className="space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </AnimatedPage>
    );
  }

  // Guard: sin proveedor vinculado → dashboard
  // Usar isPortalOnlyUser (cargo.code) como check primario + user.proveedor como secundario
  if (!user.proveedor && !isPortalOnlyUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const proveedorNombre = empresa?.nombre_comercial || user.proveedor_nombre || 'Mi Empresa';

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* ================================================================
            HERO HEADER — diferenciado por tipo
            ================================================================ */}
        <Card padding="none" className="overflow-hidden">
          {/* Gradient bar */}
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)` }}
          />
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Icon — cambia según tipo */}
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                {isLoading ? (
                  <Skeleton className="h-7 w-7 rounded" />
                ) : (
                  <HeroIcon className="w-7 h-7" style={{ color: primaryColor }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-48 mb-1" />
                    <Skeleton className="h-4 w-64" />
                  </>
                ) : (
                  <>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {proveedorNombre}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {empresa?.tipo_documento_data && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          {empresa.tipo_documento_data.codigo}: {empresa.numero_documento}
                        </span>
                      )}
                      {empresa?.tipo_proveedor_data && (
                        <Badge variant="info" size="sm">
                          {empresa.tipo_proveedor_data.nombre}
                        </Badge>
                      )}
                    </div>
                    {/* Descripción contextual */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {tipoConfig.description}
                    </p>
                  </>
                )}
              </div>

              {/* Status badge */}
              {!isLoading && empresa && (
                <Badge variant={empresa.is_active ? 'success' : 'error'} size="sm">
                  {empresa.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* ================================================================
            TABS — dinámicos según tipo de proveedor
            ================================================================ */}
        {isLoading ? (
          <Skeleton className="h-10 w-full rounded-lg" />
        ) : (
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            variant="underline"
          />
        )}

        {/* ================================================================
            TAB CONTENT
            ================================================================ */}
        <div>
          {activeTab === 'empresa' && <TabEmpresa />}
          {activeTab === 'precios' && <TabPrecios />}
          {activeTab === 'profesionales' && <TabProfesionales />}
          {activeTab === 'contratos' && <TabContratos />}
          {activeTab === 'evaluaciones' && <TabEvaluaciones />}
          {activeTab === 'mi-cuenta' && <TabMiCuenta />}
        </div>
      </div>
    </AnimatedPage>
  );
}
