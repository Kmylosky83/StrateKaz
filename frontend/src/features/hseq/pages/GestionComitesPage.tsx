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
  Plus,
  Download,
  Filter,
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

const formatEstado = (estado: string): string => {
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

// ==================== MOCK DATA ====================

const mockTiposComite: TipoComiteList[] = [
  {
    id: 1,
    codigo: 'COPASST',
    nombre: 'Comité Paritario de SST',
    descripcion: 'Comité Paritario de Seguridad y Salud en el Trabajo - Res. 2013/1986',
    periodicidad_reuniones: 'MENSUAL',
    num_minimo_miembros: 2,
    requiere_eleccion: true,
    activo: true,
    created_at: '2024-01-10',
  },
  {
    id: 2,
    codigo: 'COCOLA',
    nombre: 'Comité de Convivencia Laboral',
    descripcion: 'Comité de Convivencia Laboral - Res. 652/2012',
    periodicidad_reuniones: 'TRIMESTRAL',
    num_minimo_miembros: 4,
    requiere_eleccion: true,
    activo: true,
    created_at: '2024-01-10',
  },
  {
    id: 3,
    codigo: 'CSV',
    nombre: 'Comité de Seguridad Vial PESV',
    descripcion: 'Comité de Seguridad Vial - Res. 40595/2022',
    periodicidad_reuniones: 'BIMESTRAL',
    num_minimo_miembros: 3,
    requiere_eleccion: false,
    activo: true,
    created_at: '2024-01-10',
  },
];

const mockComites: ComiteList[] = [
  {
    id: 1,
    codigo_comite: 'COPASST-2024-01',
    nombre: 'COPASST Periodo 2024-2026',
    tipo_comite: 1,
    tipo_comite_nombre: 'Comité Paritario de SST',
    tipo_comite_codigo: 'COPASST',
    periodo_descripcion: '2024-2026',
    estado: 'ACTIVO',
    fecha_inicio: '2024-01-15',
    fecha_fin: '2026-01-15',
    num_miembros_activos: 6,
    esta_vigente: true,
    created_at: '2024-01-10',
    updated_at: '2024-01-15',
  },
  {
    id: 2,
    codigo_comite: 'COCOLA-2024-01',
    nombre: 'Comité de Convivencia Laboral 2024',
    tipo_comite: 2,
    tipo_comite_nombre: 'Comité de Convivencia Laboral',
    tipo_comite_codigo: 'COCOLA',
    periodo_descripcion: '2024-2025',
    estado: 'ACTIVO',
    fecha_inicio: '2024-01-20',
    fecha_fin: '2025-01-20',
    num_miembros_activos: 4,
    esta_vigente: true,
    created_at: '2024-01-15',
    updated_at: '2024-01-20',
  },
  {
    id: 3,
    codigo_comite: 'CSV-2024-01',
    nombre: 'Comité Seguridad Vial 2024',
    tipo_comite: 3,
    tipo_comite_nombre: 'Comité de Seguridad Vial PESV',
    tipo_comite_codigo: 'CSV',
    periodo_descripcion: '2024',
    estado: 'CONFORMACION',
    fecha_inicio: '2024-02-01',
    fecha_fin: '2024-12-31',
    num_miembros_activos: 2,
    esta_vigente: true,
    created_at: '2024-01-25',
    updated_at: '2024-02-01',
  },
];

const mockMiembros: MiembroComiteList[] = [
  {
    id: 1,
    comite: 1,
    comite_nombre: 'COPASST Periodo 2024-2026',
    empleado_nombre: 'Carlos Rodríguez',
    empleado_cargo: 'Coordinador SST',
    rol: 'Presidente',
    es_principal: true,
    representa_a: 'Empresa',
    activo: true,
    fecha_inicio: '2024-01-15',
    fecha_fin: null,
    created_at: '2024-01-15',
  },
  {
    id: 2,
    comite: 1,
    comite_nombre: 'COPASST Periodo 2024-2026',
    empleado_nombre: 'María González',
    empleado_cargo: 'Operaria Producción',
    rol: 'Secretaria',
    es_principal: true,
    representa_a: 'Trabajadores',
    activo: true,
    fecha_inicio: '2024-01-15',
    fecha_fin: null,
    created_at: '2024-01-15',
  },
  {
    id: 3,
    comite: 1,
    comite_nombre: 'COPASST Periodo 2024-2026',
    empleado_nombre: 'Ana Martínez',
    empleado_cargo: 'Jefe RRHH',
    rol: 'Miembro',
    es_principal: true,
    representa_a: 'Empresa',
    activo: true,
    fecha_inicio: '2024-01-15',
    fecha_fin: null,
    created_at: '2024-01-15',
  },
];

const mockActas: ActaReunionList[] = [
  {
    id: 1,
    numero_acta: 'ACTA-COPASST-2024-001',
    reunion: 1,
    reunion_numero: 'REUNION-001',
    comite_nombre: 'COPASST Periodo 2024-2026',
    fecha_reunion: '2024-01-25',
    estado: 'APROBADA',
    fecha_aprobacion: '2024-01-28',
    aprobada_por_nombre: 'Carlos Rodríguez',
    num_compromisos: 5,
    num_compromisos_pendientes: 2,
    created_at: '2024-01-25',
  },
  {
    id: 2,
    numero_acta: 'ACTA-COPASST-2024-002',
    reunion: 2,
    reunion_numero: 'REUNION-002',
    comite_nombre: 'COPASST Periodo 2024-2026',
    fecha_reunion: '2024-02-20',
    estado: 'REVISION',
    fecha_aprobacion: null,
    aprobada_por_nombre: '',
    num_compromisos: 3,
    num_compromisos_pendientes: 3,
    created_at: '2024-02-20',
  },
];

const mockVotaciones: VotacionList[] = [
  {
    id: 1,
    numero_votacion: 'VOT-COPASST-2024-001',
    titulo: 'Elección Presidente COPASST',
    tipo: 'ELECCION',
    comite: 1,
    comite_nombre: 'COPASST Periodo 2024-2026',
    fecha_inicio: '2024-01-10',
    fecha_fin: '2024-01-12',
    estado: 'CERRADA',
    total_votos_emitidos: 6,
    esta_activa: false,
    porcentaje_participacion: 100,
    created_at: '2024-01-10',
  },
  {
    id: 2,
    numero_votacion: 'VOT-COCOLA-2024-001',
    titulo: 'Aprobación Reglamento Interno',
    tipo: 'APROBACION',
    comite: 2,
    comite_nombre: 'Comité de Convivencia Laboral 2024',
    fecha_inicio: '2024-02-01',
    fecha_fin: '2024-02-05',
    estado: 'EN_CURSO',
    total_votos_emitidos: 2,
    esta_activa: true,
    porcentaje_participacion: 50,
    created_at: '2024-02-01',
  },
];

// ==================== TIPOS DE COMITÉ SECTION ====================

const TiposComiteSection = () => {
  const isLoading = false;
  const tiposComite = mockTiposComite;

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
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tipos de Comité</h3>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Tipo
          </Button>
        </div>
      </div>

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
                  <span className="font-medium text-gray-900 dark:text-white">{formatEstado(tipo.periodicidad_reuniones)}</span>
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
  const isLoading = false;
  const comites = mockComites;

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
          icon: <Plus className="w-4 h-4" />,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Comités</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.activos}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vigentes</p>
              <p className="text-2xl font-bold text-info-600 dark:text-info-400 mt-1">{stats.vigentes}</p>
            </div>
            <div className="w-12 h-12 bg-info-100 dark:bg-info-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-info-600 dark:text-info-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Miembros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalMiembros}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comités Activos</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Comité
          </Button>
        </div>
      </div>

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
                      {formatEstado(comite.estado)}
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
  const isLoading = false;
  const miembros = mockMiembros;

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
          icon: <Plus className="w-4 h-4" />,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Miembros de Comités</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Agregar Miembro
          </Button>
        </div>
      </div>

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
  const isLoading = false;
  const actas = mockActas;

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
          icon: <Plus className="w-4 h-4" />,
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Actas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aprobadas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.aprobadas}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Revisión</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">{stats.revision}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compromisos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalCompromisos}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{stats.compromisosPendientes}</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actas de Comité</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Acta
          </Button>
        </div>
      </div>

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
                      {formatEstado(acta.estado)}
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
  const isLoading = false;
  const votaciones = mockVotaciones;

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
          icon: <Plus className="w-4 h-4" />,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Votaciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Vote className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Curso</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{stats.activas}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cerradas</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">{stats.cerradas}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Votaciones de Comité</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Votación
          </Button>
        </div>
      </div>

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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatEstado(votacion.tipo)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{votacion.comite_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(votacion.fecha_inicio), 'dd/MM', { locale: es })} - {format(new Date(votacion.fecha_fin), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getEstadoVotacionVariant(votacion.estado)} size="sm">
                      {formatEstado(votacion.estado)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {votacion.porcentaje_participacion || 0}% ({votacion.total_votos_emitidos} votos)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      {votacion.estado === 'CERRADA' && (
                        <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                      )}
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
