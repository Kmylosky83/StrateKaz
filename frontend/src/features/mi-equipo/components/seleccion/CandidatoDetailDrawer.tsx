/**
 * CandidatoDetailDrawer - Panel lateral de detalle del candidato
 * Seleccion y Contratacion > Candidatos > Detalle
 *
 * Slide-in drawer (derecha) con:
 * - Header con nombre, estado, score
 * - Info cards (datos personales, contacto, educacion)
 * - Timeline de actividades (entrevistas, pruebas)
 * - Acciones rapidas (editar, cambiar estado, descargar CV)
 *
 * Reutiliza design system: Dialog/Transition (headlessui), Badge, Button, Card, cn()
 */
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { cn } from '@/utils/cn';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Clock,
  Calendar,
  Pencil,
  ArrowRightLeft,
  Download,
  MessageSquare,
  ClipboardCheck,
  Star,
  DollarSign,
  Plane,
  Home,
} from 'lucide-react';
import {
  useCandidato,
  useEntrevistasPorCandidato,
  usePruebasPorCandidato,
} from '@/features/talent-hub/hooks/useSeleccionContratacion';
import type { Candidato, Entrevista, Prueba } from '@/features/talent-hub/types';
import { ESTADO_CANDIDATO_BADGE, NIVEL_EDUCATIVO_OPTIONS } from '@/features/talent-hub/types';

// ============================================================================
// Tipos
// ============================================================================

interface CandidatoDetailDrawerProps {
  candidato: Candidato | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (candidato: Candidato) => void;
  onCambiarEstado: (candidato: Candidato) => void;
}

// ============================================================================
// Sub-componentes
// ============================================================================

const InfoRow = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex items-start gap-3 py-2', className)}>
    <div className="flex-shrink-0 mt-0.5">
      <Icon size={14} className="text-gray-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{value || '-'}</p>
    </div>
  </div>
);

const TimelineItem = ({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  date,
  badge,
  badgeVariant,
}: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  subtitle?: string;
  date: string;
  badge?: string;
  badgeVariant?: 'success' | 'info' | 'warning' | 'danger' | 'gray' | 'primary';
}) => (
  <div className="flex gap-3 py-3">
    <div
      className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', iconBg)}
    >
      <Icon size={14} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{title}</p>
        {badge && (
          <Badge variant={badgeVariant || 'gray'} size="sm">
            {badge}
          </Badge>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      <p className="text-xs text-gray-400 mt-1">{date}</p>
    </div>
  </div>
);

// ============================================================================
// Componente
// ============================================================================

export const CandidatoDetailDrawer = ({
  candidato,
  isOpen,
  onClose,
  onEdit,
  onCambiarEstado,
}: CandidatoDetailDrawerProps) => {
  // Fetch detail data
  const { data: detail, isLoading: isLoadingDetail } = useCandidato(candidato?.id || 0);
  const { data: entrevistasData } = useEntrevistasPorCandidato(candidato?.id || 0);
  const { data: pruebasData } = usePruebasPorCandidato(candidato?.id || 0);

  const entrevistas = entrevistasData?.results || [];
  const pruebas = pruebasData?.results || [];

  const nivelLabel =
    NIVEL_EDUCATIVO_OPTIONS.find(
      (o) => o.value === (detail?.nivel_educativo || candidato?.nivel_educativo)
    )?.label || '-';

  // Build timeline items
  const timelineItems: {
    icon: React.ElementType;
    iconBg: string;
    title: string;
    subtitle?: string;
    date: string;
    badge?: string;
    badgeVariant?: 'success' | 'info' | 'warning' | 'danger' | 'gray' | 'primary';
    sortDate: string;
  }[] = [];

  // Add postulacion event
  if (candidato) {
    timelineItems.push({
      icon: User,
      iconBg: 'bg-primary-500',
      title: 'Postulacion registrada',
      subtitle: `Origen: ${candidato.origen_display}`,
      date: candidato.fecha_postulacion
        ? new Date(candidato.fecha_postulacion).toLocaleDateString('es-CO')
        : '-',
      badge: 'Postulacion',
      badgeVariant: 'primary',
      sortDate: candidato.fecha_postulacion || '',
    });
  }

  // Add entrevistas
  entrevistas.forEach((e: Entrevista) => {
    const estadoBadge: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'gray'> = {
      programada: 'info',
      realizada: 'success',
      cancelada: 'danger',
      reprogramada: 'warning',
    };
    timelineItems.push({
      icon: MessageSquare,
      iconBg: 'bg-info-500',
      title: `Entrevista #${e.numero_entrevista} - ${e.tipo_display}`,
      subtitle: e.calificacion_promedio
        ? `Calificacion: ${e.calificacion_promedio}% | ${e.recomendacion_display}`
        : undefined,
      date: e.fecha_programada ? new Date(e.fecha_programada).toLocaleDateString('es-CO') : '-',
      badge: e.estado_display,
      badgeVariant: estadoBadge[e.estado] || 'gray',
      sortDate: e.fecha_programada || '',
    });
  });

  // Add pruebas
  pruebas.forEach((p: Prueba) => {
    const estadoBadge: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'gray'> = {
      programada: 'info',
      realizada: 'warning',
      calificada: 'success',
      cancelada: 'danger',
    };
    timelineItems.push({
      icon: ClipboardCheck,
      iconBg: 'bg-warning-500',
      title: `Prueba: ${p.tipo_prueba_nombre}`,
      subtitle: p.calificacion
        ? `Calificacion: ${p.calificacion}${p.aprobado !== null ? (p.aprobado ? ' - Aprobada' : ' - No aprobada') : ''}`
        : undefined,
      date: p.fecha_programada ? new Date(p.fecha_programada).toLocaleDateString('es-CO') : '-',
      badge: p.estado_display,
      badgeVariant: estadoBadge[p.estado] || 'gray',
      sortDate: p.fecha_programada || '',
    });
  });

  // Sort by date descending
  timelineItems.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        {/* Drawer Panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="w-screen max-w-lg">
                  <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                    {/* Header */}
                    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Detalle del Candidato
                        </Dialog.Title>
                        <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {isLoadingDetail ? (
                        <div className="flex items-center justify-center py-16">
                          <Spinner size="lg" />
                        </div>
                      ) : candidato ? (
                        <div className="space-y-6">
                          {/* Candidato Header Card */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                  {candidato.nombre_completo}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {candidato.tipo_documento} {candidato.numero_documento}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant={ESTADO_CANDIDATO_BADGE[candidato.estado]}
                                    size="sm"
                                  >
                                    {candidato.estado_display}
                                  </Badge>
                                  {candidato.calificacion_general !== null && (
                                    <div className="flex items-center gap-1">
                                      <Star
                                        size={12}
                                        className={cn(
                                          candidato.calificacion_general >= 80
                                            ? 'text-green-500'
                                            : candidato.calificacion_general >= 60
                                              ? 'text-yellow-500'
                                              : 'text-red-500'
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          'text-sm font-bold',
                                          candidato.calificacion_general >= 80
                                            ? 'text-green-600 dark:text-green-400'
                                            : candidato.calificacion_general >= 60
                                              ? 'text-yellow-600 dark:text-yellow-400'
                                              : 'text-red-600 dark:text-red-400'
                                        )}
                                      >
                                        {candidato.calificacion_general}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quick stats */}
                            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase">Dias</p>
                                <p
                                  className={cn(
                                    'text-lg font-bold',
                                    candidato.dias_en_proceso > 30
                                      ? 'text-danger-600 dark:text-danger-400'
                                      : candidato.dias_en_proceso > 15
                                        ? 'text-warning-600 dark:text-warning-400'
                                        : 'text-gray-900 dark:text-gray-100'
                                  )}
                                >
                                  {candidato.dias_en_proceso}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase">Entrevistas</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                  {detail?.total_entrevistas ?? entrevistas.length}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase">Pruebas</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                  {detail?.total_pruebas ?? pruebas.length}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Vacante Info */}
                          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                            <div className="flex items-center gap-2">
                              <Briefcase
                                size={14}
                                className="text-primary-600 dark:text-primary-400"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-primary-800 dark:text-primary-200 truncate">
                                  {candidato.vacante_titulo}
                                </p>
                                <p className="text-xs text-primary-600 dark:text-primary-400 font-mono">
                                  {candidato.vacante_codigo}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Contacto */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Contacto
                            </h4>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              <InfoRow icon={Mail} label="Email" value={candidato.email} />
                              <InfoRow icon={Phone} label="Telefono" value={candidato.telefono} />
                              {detail?.telefono_alternativo && (
                                <InfoRow
                                  icon={Phone}
                                  label="Tel. Alternativo"
                                  value={detail.telefono_alternativo}
                                />
                              )}
                              <InfoRow icon={MapPin} label="Ciudad" value={candidato.ciudad} />
                              {detail?.direccion && (
                                <InfoRow icon={Home} label="Direccion" value={detail.direccion} />
                              )}
                            </div>
                          </div>

                          {/* Educacion y Experiencia */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Perfil Profesional
                            </h4>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              <InfoRow
                                icon={GraduationCap}
                                label="Nivel Educativo"
                                value={nivelLabel}
                              />
                              {detail?.titulo_obtenido && (
                                <InfoRow
                                  icon={GraduationCap}
                                  label="Titulo"
                                  value={detail.titulo_obtenido}
                                />
                              )}
                              <InfoRow
                                icon={Clock}
                                label="Experiencia General"
                                value={`${candidato.anos_experiencia} anos`}
                              />
                              {detail?.anos_experiencia_cargo !== undefined && (
                                <InfoRow
                                  icon={Briefcase}
                                  label="Experiencia en el Cargo"
                                  value={`${detail.anos_experiencia_cargo} anos`}
                                />
                              )}
                              <InfoRow
                                icon={Calendar}
                                label="Origen Postulacion"
                                value={candidato.origen_display}
                              />
                            </div>
                          </div>

                          {/* Disponibilidad */}
                          {detail && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Disponibilidad
                              </h4>
                              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {detail.pretension_salarial && (
                                  <InfoRow
                                    icon={DollarSign}
                                    label="Pretension Salarial"
                                    value={`$${Number(detail.pretension_salarial).toLocaleString('es-CO')}`}
                                  />
                                )}
                                {detail.fecha_disponibilidad && (
                                  <InfoRow
                                    icon={Calendar}
                                    label="Fecha Disponibilidad"
                                    value={new Date(detail.fecha_disponibilidad).toLocaleDateString(
                                      'es-CO'
                                    )}
                                  />
                                )}
                                <InfoRow
                                  icon={Home}
                                  label="Requiere Reubicacion"
                                  value={detail.requiere_reubicacion ? 'Si' : 'No'}
                                />
                                <InfoRow
                                  icon={Plane}
                                  label="Disponibilidad Viajes"
                                  value={detail.disponibilidad_viajes ? 'Si' : 'No'}
                                />
                              </div>
                            </div>
                          )}

                          {/* Fortalezas / Debilidades */}
                          {detail && (detail.fortalezas || detail.debilidades) && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Evaluacion Cualitativa
                              </h4>
                              <div className="space-y-3">
                                {detail.fortalezas && (
                                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                      Fortalezas
                                    </p>
                                    <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                                      {detail.fortalezas}
                                    </p>
                                  </div>
                                )}
                                {detail.debilidades && (
                                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                                      Areas de Mejora
                                    </p>
                                    <p className="text-sm text-orange-800 dark:text-orange-200 whitespace-pre-wrap">
                                      {detail.debilidades}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Observaciones */}
                          {detail?.observaciones && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Observaciones
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                {detail.observaciones}
                              </p>
                            </div>
                          )}

                          {/* Timeline */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                              Historial de Actividades
                            </h4>
                            {timelineItems.length > 0 ? (
                              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {timelineItems.map((item, index) => (
                                  <TimelineItem
                                    key={index}
                                    icon={item.icon}
                                    iconBg={item.iconBg}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    date={item.date}
                                    badge={item.badge}
                                    badgeVariant={item.badgeVariant}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 text-center py-4">
                                Sin actividades registradas aun.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Footer Actions */}
                    {candidato && (
                      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(candidato)}
                            className="flex-1"
                          >
                            <Pencil size={14} className="mr-1.5" />
                            Editar
                          </Button>
                          {candidato.estado !== 'contratado' &&
                            candidato.estado !== 'rechazado' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onCambiarEstado(candidato)}
                                className="flex-1"
                              >
                                <ArrowRightLeft size={14} className="mr-1.5" />
                                Cambiar Estado
                              </Button>
                            )}
                          {detail?.hoja_vida && (
                            <a
                              href={detail.hoja_vida}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Download size={14} />
                              CV
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
