/**
 * Modal de Detalle de Política
 * Sistema de Gestión StrateKaz v3.0
 *
 * Muestra el detalle completo de una política con su workflow de firmas.
 */
import { useState } from 'react';
import {
  X,
  Edit,
  Calendar,
  User,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  PenTool,
  AlertTriangle,
  Download,
  Printer,
  ExternalLink,
} from 'lucide-react';

// Design System
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { SignatureModal, SignatureData } from '@/components/modals/SignatureModal';
import { FirmantesSelectionModal } from './FirmantesSelectionModal';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useAuthStore } from '@/store/authStore';
import { useUsers } from '@/features/users/hooks/useUsers';
import {
  useIniciarFirmaPolitica,
  useFirmarPolitica,
  useProcesoFirmaPolitica,
  useEnviarADocumental,
  useCrearNuevaVersion,
  FirmanteSeleccion,
} from '../../hooks/usePoliticas';

// Types
import type { Politica, PoliticaStatus, EstadoFirma } from '../../types/policies.types';

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<PoliticaStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof FileText;
  description: string;
}> = {
  BORRADOR: {
    label: 'Borrador',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: FileText,
    description: 'Política en edición, pendiente de enviar a firma',
  },
  EN_REVISION: {
    label: 'En Firma',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock,
    description: 'Esperando que los firmantes aprueben la política',
  },
  FIRMADO: {
    label: 'Firmado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: PenTool,
    description: 'Todas las firmas completadas, listo para enviar a Gestor Documental',
  },
  VIGENTE: {
    label: 'Vigente',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Política activa y publicada con código oficial',
  },
  OBSOLETO: {
    label: 'Obsoleto',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    description: 'Versión anterior, reemplazada por una nueva versión',
  },
};

const firmaStatusConfig: Record<EstadoFirma, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
}> = {
  PENDIENTE: {
    label: 'Pendiente',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Clock,
  },
  FIRMADO: {
    label: 'Firmado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  RECHAZADO: {
    label: 'Rechazado',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  REVOCADO: {
    label: 'Revocado',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: AlertTriangle,
  },
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface PolicyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  politica: Politica | null;
  onEdit?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PolicyDetailModal({
  isOpen,
  onClose,
  politica,
  onEdit,
}: PolicyDetailModalProps) {
  const { primaryColor } = useBrandingConfig();
  const user = useAuthStore((state) => state.user);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedFirmaId, setSelectedFirmaId] = useState<number | null>(null);
  const [showFirmantesModal, setShowFirmantesModal] = useState(false);

  // Queries
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ is_active: true });
  const usuarios = usersData?.results || [];

  // Mutations
  const iniciarFirmaMutation = useIniciarFirmaPolitica();
  const firmarMutation = useFirmarPolitica();
  const enviarADocumentalMutation = useEnviarADocumental();
  const crearNuevaVersionMutation = useCrearNuevaVersion();

  // Query para obtener proceso de firma activo
  const { data: procesoFirma } = useProcesoFirmaPolitica(
    politica?.id || 0,
    !!politica && politica.status === 'EN_REVISION'
  );

  // Handlers
  const handleOpenFirmantesModal = () => {
    setShowFirmantesModal(true);
  };

  const handleIniciarFirmaConFirmantes = async (firmantes: FirmanteSeleccion[]) => {
    if (!politica) return;
    await iniciarFirmaMutation.mutateAsync({
      id: politica.id,
      firmantes,
    });
    setShowFirmantesModal(false);
  };

  const handleEnviarADocumental = async () => {
    if (!politica) return;
    await enviarADocumentalMutation.mutateAsync({ politicaId: politica.id });
  };

  const handleCrearNuevaVersion = async () => {
    if (!politica) return;
    await crearNuevaVersionMutation.mutateAsync({
      politicaId: politica.id,
      dto: { change_reason: 'Nueva versión de la política' },
    });
    onClose(); // Cerrar modal después de crear nueva versión
  };

  // Handler para abrir el modal de firma
  const handleOpenSignature = (firmaId: number) => {
    setSelectedFirmaId(firmaId);
    setShowSignatureModal(true);
  };

  // Handler para guardar la firma
  const handleSaveSignature = async (signatureData: SignatureData) => {
    if (!politica || !selectedFirmaId) return;

    await firmarMutation.mutateAsync({
      politicaId: politica.id,
      dto: {
        firma_id: selectedFirmaId,
        signature_image: signatureData.signatureDataUrl,
        confirmar: true,
      },
    });

    setShowSignatureModal(false);
    setSelectedFirmaId(null);
  };

  // Encontrar si el usuario tiene una firma pendiente
  const misFirmasPendientes = procesoFirma?.firmas?.filter(
    (f: { estado: string; cargo_id?: number }) =>
      f.estado === 'PENDIENTE' &&
      (user?.is_superuser || user?.is_staff || f.cargo_id === user?.cargo?.id)
  ) || [];

  if (!isOpen || !politica) return null;

  const status = statusConfig[politica.status];
  const StatusIcon = status.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{ backgroundColor: `${politica.tipo?.color || primaryColor}20` }}
              >
                <DynamicIcon
                  name={politica.tipo?.icon || 'FileText'}
                  className="w-6 h-6"
                  color={politica.tipo?.color || primaryColor}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-mono mb-1">
                  {politica.code || (
                    <span className="text-gray-400 italic">Sin código - Pendiente de publicación</span>
                  )}
                </p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {politica.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    className="flex items-center gap-1"
                    style={{
                      backgroundColor: `${politica.tipo?.color || primaryColor}15`,
                      color: politica.tipo?.color || primaryColor,
                    }}
                  >
                    {politica.tipo_name || 'Política'}
                  </Badge>
                  <div className={`${status.bgColor} ${status.color} px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium`} title={status.description}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{status.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  Versión
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {politica.version}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Vigencia
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(politica.effective_date)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Revisión
                </div>
                <p className={`font-semibold ${politica.needs_review ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  {formatDate(politica.review_date)}
                  {politica.needs_review && (
                    <AlertTriangle className="w-4 h-4 inline ml-1" />
                  )}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <PenTool className="w-4 h-4" />
                  Firma
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {politica.is_signed ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Firmado
                    </span>
                  ) : (
                    <span className="text-gray-500">Pendiente</span>
                  )}
                </p>
              </div>
            </div>

            {/* Normas Aplicables */}
            {politica.normas_aplicables && politica.normas_aplicables.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Normas Aplicables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {politica.normas_aplicables.map(norma => (
                    <div
                      key={norma.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: `${norma.color || primaryColor}15`,
                      }}
                    >
                      <DynamicIcon
                        name={norma.icon || 'Award'}
                        className="w-4 h-4"
                        color={norma.color || primaryColor}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: norma.color || primaryColor }}
                      >
                        {norma.code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {norma.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Responsables */}
            {(politica.area_name || politica.responsible_name) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {politica.area_name && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Building2 className="w-4 h-4" />
                      Área Responsable
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {politica.area_name}
                    </p>
                  </div>
                )}
                {politica.responsible_name && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <User className="w-4 h-4" />
                      Responsable
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {politica.responsible_name}
                      {politica.responsible_cargo_name && (
                        <span className="text-sm text-gray-500 font-normal block">
                          {politica.responsible_cargo_name}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contenido */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Contenido de la Política
              </h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-strong:text-gray-900 dark:prose-strong:text-white
                    prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                    prose-li:text-gray-700 dark:prose-li:text-gray-300
                    prose-em:text-gray-600 dark:prose-em:text-gray-400"
                  dangerouslySetInnerHTML={{ __html: politica.content }}
                />
              </div>
            </div>

            {/* Workflow de Firmas */}
            {politica.proceso_firma && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Proceso de Firmas
                  <Badge className="ml-2">
                    {politica.proceso_firma.progreso}% completado
                  </Badge>
                </h4>
                <div className="space-y-3">
                  {politica.proceso_firma.firmas.map((firma) => {
                    const firmaStatus = firmaStatusConfig[firma.estado];
                    const FirmaIcon = firmaStatus.icon;

                    return (
                      <div
                        key={firma.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${firmaStatus.bgColor}`}>
                            <FirmaIcon className={`w-4 h-4 ${firmaStatus.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {firma.rol_firmante_display || firma.rol_firmante}
                            </p>
                            {firma.firmado_por_name && (
                              <p className="text-sm text-gray-500">
                                {firma.firmado_por_name}
                                {firma.firmado_por_cargo && ` - ${firma.firmado_por_cargo}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`${firmaStatus.bgColor} ${firmaStatus.color} px-2 py-1 rounded-lg text-xs font-medium`}>
                            {firmaStatus.label}
                          </div>
                          {firma.fecha_firma && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(firma.fecha_firma)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Auditoría */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  <span>Creado por </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {politica.created_by_name || 'Sistema'}
                  </span>
                  <span> el {formatDate(politica.created_at)}</span>
                </div>
                <div>
                  <span>Última actualización: {formatDate(politica.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {politica.document_file && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(politica.document_file!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cerrar
              </Button>

              {/* BORRADOR: Editar + Enviar a Firma */}
              {politica.status === 'BORRADOR' && (
                <>
                  {onEdit && (
                    <Button
                      variant="outline"
                      onClick={onEdit}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  <Button
                    onClick={handleOpenFirmantesModal}
                    style={{ backgroundColor: primaryColor }}
                    disabled={iniciarFirmaMutation.isPending}
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    {iniciarFirmaMutation.isPending ? 'Enviando...' : 'Enviar a Firma'}
                  </Button>
                </>
              )}

              {/* EN_REVISION: Mostrar botón de firmar si tiene firmas pendientes */}
              {politica.status === 'EN_REVISION' && (
                <>
                  {misFirmasPendientes.length > 0 ? (
                    <Button
                      onClick={() => handleOpenSignature(misFirmasPendientes[0].id)}
                      style={{ backgroundColor: primaryColor }}
                      disabled={firmarMutation.isPending}
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      {firmarMutation.isPending ? 'Firmando...' : `Firmar como ${misFirmasPendientes[0].rol_firmante_display || misFirmasPendientes[0].rol_firmante}`}
                    </Button>
                  ) : (
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-pulse" />
                      Esperando firmas de otros usuarios...
                    </div>
                  )}
                </>
              )}

              {/* FIRMADO: Enviar a Documental */}
              {politica.status === 'FIRMADO' && (
                <Button
                  onClick={handleEnviarADocumental}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={enviarADocumentalMutation.isPending}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {enviarADocumentalMutation.isPending ? 'Enviando...' : 'Enviar a Gestor Documental'}
                </Button>
              )}

              {/* VIGENTE: Nueva Versión */}
              {politica.status === 'VIGENTE' && (
                <Button
                  variant="outline"
                  onClick={handleCrearNuevaVersion}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  disabled={crearNuevaVersionMutation.isPending}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {crearNuevaVersionMutation.isPending ? 'Creando...' : 'Nueva Versión'}
                </Button>
              )}

              {/* OBSOLETO: Solo información */}
              {politica.status === 'OBSOLETO' && (
                <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Versión histórica (no editable)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Firma Digital */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setSelectedFirmaId(null);
        }}
        onSave={handleSaveSignature}
        title="Firma de Política"
        description={`Está a punto de firmar la política "${politica.title}". Esta acción no se puede deshacer.`}
        userName={user?.full_name || user?.first_name || user?.username || 'Usuario'}
        userEmail={user?.email}
        userId={user?.id}
        documentType="POLITICA_ESPECIFICA"
        documentId={String(politica.id)}
      />

      {/* Modal de Selección de Firmantes */}
      <FirmantesSelectionModal
        isOpen={showFirmantesModal}
        onClose={() => setShowFirmantesModal(false)}
        onConfirm={handleIniciarFirmaConFirmantes}
        isLoading={iniciarFirmaMutation.isPending}
        usuarios={usuarios}
        isLoadingUsuarios={isLoadingUsers}
      />
    </div>
  );
}
