/**
 * Página: Gestión de Comités HSEQ
 *
 * Sistema completo de gestión de comités con 5 subsecciones:
 * - Tipos de Comité
 * - Comités Activos
 * - Miembros del Comité
 * - Actas de Comité
 * - Votaciones
 */
import { useState } from 'react';
import {
  Users,
  FileText,
  UserPlus,
  CalendarDays,
  Vote,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Play,
  CheckSquare,
  Calendar,
  UserX,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { KpiCard, KpiCardGrid, SectionToolbar, StatusBadge } from '@/components/common';
import { formatStatusLabel } from '@/components/common/StatusBadge';
import {
  useTiposComite,
  useComites,
  useMiembrosComite,
  useActasReunion,
  useVotaciones,
} from '../hooks/useComites';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type {
  TipoComiteList,
  ComiteList,
  MiembroComiteList,
  ActaReunionList,
  VotacionList,
  EstadoComite,
  EstadoActa,
  EstadoVotacion,
} from '../types/comites.types';

// ==================== UTILITY FUNCTIONS ====================

const getEstadoComiteVariant = (
  estado: EstadoComite
): 'success' | 'primary' | 'warning' | 'danger' => {
  const map: Record<EstadoComite, 'success' | 'primary' | 'warning' | 'danger'> = {
    CONFORMACION: 'warning',
    ACTIVO: 'success',
    SUSPENDIDO: 'danger',
    FINALIZADO: 'primary',
  };
  return map[estado] || 'primary';
};

const getEstadoActaVariant = (
  estado: EstadoActa
): 'success' | 'primary' | 'warning' | 'danger' => {
  const map: Record<EstadoActa, 'success' | 'primary' | 'warning' | 'danger'> = {
    BORRADOR: 'warning',
    REVISION: 'primary',
    APROBADA: 'success',
    RECHAZADA: 'danger',
  };
  return map[estado] || 'primary';
};

const getEstadoVotacionVariant = (
  estado: EstadoVotacion
): 'success' | 'primary' | 'warning' | 'danger' | 'info' => {
  const map: Record<EstadoVotacion, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
    PROGRAMADA: 'info',
    EN_CURSO: 'primary',
    CERRADA: 'success',
    CANCELADA: 'danger',
  };
  return map[estado] || 'primary';
};

// ==================== TIPOS DE COMITÉ SECTION ====================

const TiposComiteSection = () => {
  const { data, isLoading } = useTiposComite();
  const tiposComite = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!tiposComite || tiposComite.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-16 h-16" />}
        title="No hay tipos de comité configurados"
        description="Configure los tipos de comités que se utilizarán en la organización"
        action={{
          label: 'Nuevo Tipo de Comité',
          onClick: () => console.log('Nuevo Tipo'),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Tipos de Comité"
        primaryAction={{ label: 'Nuevo Tipo', onClick: () => console.log('Nuevo Tipo') }}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiposComite.map((tipo) => (
          <Card key={tipo.id} variant="bordered" padding="md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tipo.codigo}</p>
                  <h4 className="font-semibold text-gray-900 dark:text-white mt-1">{tipo.nombre}</h4>
                </div>
                {tipo.activo ? (
                  <Badge variant="success" size="sm">Activo</Badge>
                ) : (
                  <Badge variant="gray" size="sm">Inactivo</Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300">{tipo.descripcion}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Periodicidad:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatStatusLabel(tipo.periodicidad_reuniones)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Min. Miembros:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{tipo.num_minimo_miembros}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Requiere Elección:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{tipo.requiere_eleccion ? 'Sí' : 'No'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Editar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== COMITÉS SECTION ====================

const ComitesSection = () => {
  const { data, isLoading } = useComites();
  const comites = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!comites || comites.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-16 h-16" />}
        title="No hay comités registrados"
        description="Comience conformando los comités de la organización"
        action={{
          label: 'Nuevo Comité',
          onClick: () => console.log('Nuevo Comité'),
        }}
      />
    );
  }

  const stats = {
    total: comites.length,
    activos: comites.filter((c) => c.estado === 'ACTIVO').length,
    vigentes: comites.filter((c) => c.esta_vigente).length,
    totalMiembros: comites.reduce((acc, c) => acc + (c.num_miembros_activos || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid>
        <KpiCard
          label="Total Comités"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Activos"
          value={stats.activos}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Vigentes"
          value={stats.vigentes}
          icon={<Clock className="w-5 h-5" />}
          color="info"
        />
        <KpiCard
          label="Total Miembros"
          value={stats.totalMiembros}
          icon={<UserPlus className="w-5 h-5" />}
          color="blue"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Comités Activos"
        onFilter={() => console.log('Filtros')}
        primaryAction={{ label: 'Nuevo Comité', onClick: () => console.log('Nuevo Comité') }}
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periodo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Miembros</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {comites.map((comite) => (
                <tr key={comite.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{comite.codigo_comite}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{comite.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{comite.tipo_comite_codigo}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{comite.tipo_comite_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{comite.periodo_descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoComiteVariant(comite.estado)} size="sm">
                      {formatStatusLabel(comite.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{comite.num_miembros_activos || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><UserPlus className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== MIEMBROS SECTION ====================

const MiembrosSection = () => {
  const { data, isLoading } = useMiembrosComite();
  const miembros = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!miembros || miembros.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus className="w-16 h-16" />}
        title="No hay miembros registrados"
        description="Agregue miembros a los comités conformados"
        action={{
          label: 'Agregar Miembro',
          onClick: () => console.log('Agregar Miembro'),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionToolbar
        title="Miembros de Comités"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{ label: 'Agregar Miembro', onClick: () => console.log('Agregar Miembro') }}
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Miembro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Representa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {miembros.map((miembro) => (
                <tr key={miembro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{miembro.comite_nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="font-medium">{miembro.empleado_nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{miembro.empleado_cargo}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{miembro.rol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{miembro.representa_a}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {miembro.es_principal ? (
                      <Badge variant="primary" size="sm">Principal</Badge>
                    ) : (
                      <Badge variant="gray" size="sm">Suplente</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {miembro.activo ? (
                      <Badge variant="success" size="sm">Activo</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><UserX className="w-4 h-4 text-danger-600" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== ACTAS SECTION ====================

const ActasSection = () => {
  const { data, isLoading } = useActasReunion();
  const actas = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!actas || actas.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No hay actas registradas"
        description="Registre las actas de las reuniones de comité"
        action={{
          label: 'Nueva Acta',
          onClick: () => console.log('Nueva Acta'),
        }}
      />
    );
  }

  const stats = {
    total: actas.length,
    aprobadas: actas.filter((a) => a.estado === 'APROBADA').length,
    revision: actas.filter((a) => a.estado === 'REVISION').length,
    totalCompromisos: actas.reduce((acc, a) => acc + (a.num_compromisos || 0), 0),
    compromisosPendientes: actas.reduce((acc, a) => acc + (a.num_compromisos_pendientes || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={5}>
        <KpiCard
          label="Total Actas"
          value={stats.total}
          icon={<FileText className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Aprobadas"
          value={stats.aprobadas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="En Revisión"
          value={stats.revision}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <KpiCard
          label="Compromisos"
          value={stats.totalCompromisos}
          icon={<CheckSquare className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          label="Pendientes"
          value={stats.compromisosPendientes}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Actas de Comité"
        onFilter={() => console.log('Filtros')}
        onExport={() => console.log('Exportar')}
        primaryAction={{ label: 'Nueva Acta', onClick: () => console.log('Nueva Acta') }}
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Reunión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aprobada Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Compromisos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {actas.map((acta) => (
                <tr key={acta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{acta.numero_acta}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{acta.comite_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {acta.fecha_reunion ? format(new Date(acta.fecha_reunion), 'dd/MM/yyyy', { locale: es }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoActaVariant(acta.estado)} size="sm">
                      {formatStatusLabel(acta.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {acta.aprobada_por_nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{acta.num_compromisos || 0}</span>
                    {acta.num_compromisos_pendientes && acta.num_compromisos_pendientes > 0 && (
                      <span className="text-danger-600 dark:text-danger-400 ml-1">({acta.num_compromisos_pendientes} pend.)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><CheckCircle className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== VOTACIONES SECTION ====================

const VotacionesSection = () => {
  const { data, isLoading } = useVotaciones();
  const votaciones = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!votaciones || votaciones.length === 0) {
    return (
      <EmptyState
        icon={<Vote className="w-16 h-16" />}
        title="No hay votaciones registradas"
        description="Registre las votaciones para elecciones y decisiones de comité"
        action={{
          label: 'Nueva Votación',
          onClick: () => console.log('Nueva Votación'),
        }}
      />
    );
  }

  const stats = {
    total: votaciones.length,
    activas: votaciones.filter((v) => v.estado === 'EN_CURSO').length,
    cerradas: votaciones.filter((v) => v.estado === 'CERRADA').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCardGrid columns={3}>
        <KpiCard
          label="Total Votaciones"
          value={stats.total}
          icon={<Vote className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="En Curso"
          value={stats.activas}
          icon={<Play className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard
          label="Cerradas"
          value={stats.cerradas}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
      </KpiCardGrid>

      <SectionToolbar
        title="Votaciones de Comité"
        onFilter={() => console.log('Filtros')}
        primaryAction={{ label: 'Nueva Votación', onClick: () => console.log('Nueva Votación') }}
      />

      {/* Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periodo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Participación</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {votaciones.map((votacion) => (
                <tr key={votacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{votacion.numero_votacion}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{votacion.titulo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatStatusLabel(votacion.tipo)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{votacion.comite_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(votacion.fecha_inicio), 'dd/MM', { locale: es })} - {format(new Date(votacion.fecha_fin), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoVotacionVariant(votacion.estado)} size="sm">
                      {formatStatusLabel(votacion.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {votacion.porcentaje_participacion || 0}% ({votacion.total_votos_emitidos} votos)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==================== MAIN PAGE COMPONENT ====================

export default function GestionComitesPage() {
  const [activeTab, setActiveTab] = useState('tipos');

  const tabs = [
    {
      id: 'tipos',
      label: 'Tipos de Comité',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'comites',
      label: 'Comités Activos',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'miembros',
      label: 'Miembros',
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      id: 'actas',
      label: 'Actas de Comité',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'votaciones',
      label: 'Votaciones',
      icon: <Vote className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestión de Comités"
        description="Gestión integral de comités HSEQ: COPASST, Convivencia, Seguridad Vial, Brigadas, actas y votaciones"
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'tipos' && <TiposComiteSection />}
        {activeTab === 'comites' && <ComitesSection />}
        {activeTab === 'miembros' && <MiembrosSection />}
        {activeTab === 'actas' && <ActasSection />}
        {activeTab === 'votaciones' && <VotacionesSection />}
      </div>
    </div>
  );
}
