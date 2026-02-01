/**
 * ClienteCard Component - Sales CRM
 * Tarjeta para mostrar información de cliente
 */
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Mail, Phone, MapPin, Eye, Edit, Star } from 'lucide-react';
import { ScoringBadge } from './ScoringBadge';
import type { ClienteList, EstadoCliente, TipoCliente } from '../types';
import { cn } from '@/utils/cn';

interface ClienteCardProps {
  cliente: ClienteList;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
}

const getEstadoVariant = (estado: EstadoCliente): 'success' | 'primary' | 'gray' | 'danger' => {
  const map: Record<EstadoCliente, 'success' | 'primary' | 'gray' | 'danger'> = {
    PROSPECTO: 'primary',
    ACTIVO: 'success',
    INACTIVO: 'gray',
    BLOQUEADO: 'danger',
  };
  return map[estado] || 'gray';
};

const getTipoLabel = (tipo: TipoCliente): string => {
  const map: Record<TipoCliente, string> = {
    CARNICERIA: 'Carnicería',
    RESTAURANTE: 'Restaurante',
    PROCESADORA: 'Procesadora',
    INDUSTRIA: 'Industria',
    EXPORTADOR: 'Exportador',
    OTRO: 'Otro',
  };
  return map[tipo] || tipo;
};

export function ClienteCard({ cliente, onView, onEdit }: ClienteCardProps) {
  return (
    <Card variant="bordered" padding="md">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {cliente.nombre_comercial}
              </h4>
              <Badge variant={getEstadoVariant(cliente.estado)} size="sm">
                {cliente.estado}
              </Badge>
            </div>
            {cliente.razon_social && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.razon_social}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {cliente.codigo_cliente} | {getTipoLabel(cliente.tipo_cliente)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {cliente.nit && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">NIT:</span>
              <span className="font-medium text-gray-900 dark:text-white">{cliente.nit}</span>
            </div>
          )}
          {cliente.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{cliente.telefono}</span>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{cliente.email}</span>
            </div>
          )}
          {cliente.ciudad && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{cliente.ciudad}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Scoring</span>
            <ScoringBadge scoring={cliente.scoring_cliente} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Compras</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${cliente.total_compras.toLocaleString()}
            </span>
          </div>
          {cliente.saldo_pendiente > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">Saldo Pendiente</span>
              <span className="text-sm font-semibold text-danger-600 dark:text-danger-400">
                ${cliente.saldo_pendiente.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {(cliente.segmento_nombre || cliente.vendedor_asignado_nombre) && (
          <div className="flex flex-wrap gap-2">
            {cliente.segmento_nombre && (
              <Badge variant="primary" size="sm">
                {cliente.segmento_nombre}
              </Badge>
            )}
            {cliente.vendedor_asignado_nombre && (
              <Badge variant="secondary" size="sm">
                Vendedor: {cliente.vendedor_asignado_nombre}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {onView && (
            <Button variant="ghost" size="sm" onClick={() => onView(cliente.id)}>
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(cliente.id)}>
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
