/**
 * Página: Programa de Fidelización - Sales CRM
 * Gestión de puntos y recompensas para clientes
 */
import { useState } from 'react';
import {
  Gift,
  Plus,
  Filter,
  Download,
  TrendingUp,
  Award,
  Star,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { usePuntosFidelizacion } from '../hooks';
import type { PuntosFidelizacion } from '../types';

interface NivelFidelizacion {
  nombre: string;
  color: string;
  puntosMinimos: number;
  puntosMaximos: number;
  icon: unknown;
}

const NIVELES: NivelFidelizacion[] = [
  {
    nombre: 'Bronce',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    puntosMinimos: 0,
    puntosMaximos: 999,
    icon: Award,
  },
  {
    nombre: 'Plata',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    puntosMinimos: 1000,
    puntosMaximos: 4999,
    icon: Award,
  },
  {
    nombre: 'Oro',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    puntosMinimos: 5000,
    puntosMaximos: Infinity,
    icon: Award,
  },
];

function getNivel(puntos: number): NivelFidelizacion {
  return NIVELES.find((n) => puntos >= n.puntosMinimos && puntos <= n.puntosMaximos) || NIVELES[0];
}

interface ClienteFidelizacionCardProps {
  puntos: PuntosFidelizacion;
  onView: (id: number) => void;
  onAcumular: (id: number) => void;
  onCanjear: (id: number) => void;
}

function ClienteFidelizacionCard({
  puntos,
  onView,
  onAcumular,
  onCanjear,
}: ClienteFidelizacionCardProps) {
  const nivel = getNivel(puntos.puntos_disponibles);
  const NivelIcon = nivel.icon;
  const siguienteNivel = NIVELES.find((n) => n.puntosMinimos > puntos.puntos_disponibles);
  const progresoSiguienteNivel = siguienteNivel
    ? ((puntos.puntos_disponibles - nivel.puntosMinimos) /
        (siguienteNivel.puntosMinimos - nivel.puntosMinimos)) *
      100
    : 100;

  return (
    <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{puntos.cliente_nombre}</h3>
            <Badge variant="default" size="sm" className={nivel.color}>
              <NivelIcon className="w-3 h-3 mr-1" />
              {nivel.nombre}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{puntos.programa_nombre}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {puntos.puntos_disponibles.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">puntos disponibles</div>
        </div>
      </div>

      {/* Progreso al siguiente nivel */}
      {siguienteNivel && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progreso a {siguienteNivel.nombre}</span>
            <span>{progresoSiguienteNivel.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progresoSiguienteNivel}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Faltan {(siguienteNivel.puntosMinimos - puntos.puntos_disponibles).toLocaleString()}{' '}
            puntos
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-success-600 dark:text-success-400 mb-1">
            <ArrowUp className="w-4 h-4" />
            <span className="font-semibold">{puntos.puntos_acumulados_total.toLocaleString()}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Acumulados</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-danger-600 dark:text-danger-400 mb-1">
            <ArrowDown className="w-4 h-4" />
            <span className="font-semibold">{puntos.puntos_canjeados_total.toLocaleString()}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Canjeados</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
            <span className="font-semibold">{puntos.puntos_expirados.toLocaleString()}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Expirados</span>
        </div>
      </div>

      {puntos.fecha_ultimo_movimiento && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Último movimiento:{' '}
          {format(new Date(puntos.fecha_ultimo_movimiento), 'PP', { locale: es })}
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={() => onView(puntos.id)}>
          Ver Historial
        </Button>

        <Button
          variant="success"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => onAcumular(puntos.id)}
        >
          Acumular
        </Button>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Gift className="w-4 h-4" />}
          onClick={() => onCanjear(puntos.id)}
          disabled={puntos.puntos_disponibles === 0}
        >
          Canjear
        </Button>
      </div>
    </Card>
  );
}

export default function FidelizacionPage() {
  const [filters, _setFilters] = useState<unknown>({});

  const { data: puntosData, isLoading } = usePuntosFidelizacion(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const puntosList = puntosData?.results || [];

  // Calcular estadísticas
  const stats = {
    totalClientes: puntosList.length,
    clientesBronce: puntosList.filter((p) => getNivel(p.puntos_disponibles).nombre === 'Bronce')
      .length,
    clientesPlata: puntosList.filter((p) => getNivel(p.puntos_disponibles).nombre === 'Plata')
      .length,
    clientesOro: puntosList.filter((p) => getNivel(p.puntos_disponibles).nombre === 'Oro').length,
    puntosDisponiblesTotal: puntosList.reduce((sum, p) => sum + p.puntos_disponibles, 0),
    puntosAcumuladosTotal: puntosList.reduce((sum, p) => sum + p.puntos_acumulados_total, 0),
    puntosCanjeadosTotal: puntosList.reduce((sum, p) => sum + p.puntos_canjeados_total, 0),
    puntosExpiradosTotal: puntosList.reduce((sum, p) => sum + p.puntos_expirados, 0),
  };

  const handleAcumular = (_id: number) => {
    // TODO: Implementar acumulación de puntos
  };

  const handleCanjear = (_id: number) => {
    // TODO: Implementar canje de puntos
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Programa de Fidelización"
        description="Gestión de puntos y niveles de fidelización de clientes"
      />

      {/* Estadísticas por Nivel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NIVELES.map((nivel) => {
          const clientesNivel =
            nivel.nombre === 'Bronce'
              ? stats.clientesBronce
              : nivel.nombre === 'Plata'
                ? stats.clientesPlata
                : stats.clientesOro;
          const NivelIcon = nivel.icon;

          return (
            <Card key={nivel.nombre} variant="bordered" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <NivelIcon className="w-5 h-5" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Nivel {nivel.nombre}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {nivel.puntosMinimos === 0 ? '0' : nivel.puntosMinimos.toLocaleString()} -{' '}
                    {nivel.puntosMaximos === Infinity ? '∞' : nivel.puntosMaximos.toLocaleString()}{' '}
                    puntos
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {clientesNivel}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">clientes</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalClientes}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Puntos Disponibles</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {stats.puntosDisponiblesTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Acumulados</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {stats.puntosAcumuladosTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Canjeados</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {stats.puntosCanjeadosTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Resumen de puntos */}
      <Card variant="bordered" padding="md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumen del Programa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stats.puntosAcumuladosTotal.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Puntos Acumulados</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-success-600 dark:text-success-400 mb-2">
              {stats.puntosCanjeadosTotal.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Puntos Canjeados</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-warning-600 dark:text-warning-400 mb-2">
              {stats.puntosDisponiblesTotal.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Puntos Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 dark:text-gray-400 mb-2">
              {stats.puntosExpiradosTotal.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Puntos Expirados</div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Clientes Fidelizados ({puntosList.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Clientes Grid */}
      {puntosList.length === 0 ? (
        <EmptyState
          icon={<Gift className="w-16 h-16" />}
          title="No hay clientes en el programa"
          description="Los clientes se agregan automáticamente al realizar compras"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {puntosList.map((puntos) => (
            <ClienteFidelizacionCard
              key={puntos.id}
              puntos={puntos}
              onView={() => {}}
              onAcumular={handleAcumular}
              onCanjear={handleCanjear}
            />
          ))}
        </div>
      )}
    </div>
  );
}
