/**
 * CargoNode - Nodo de Cargo para el Organigrama
 *
 * Muestra información del cargo con indicador de nivel jerárquico
 * y avatares de los usuarios asignados
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users, ChevronDown, ChevronRight, AlertCircle, MapPin } from 'lucide-react';
import { Badge, Avatar, Button, DynamicIcon } from '@/components/common';
import type {
  CargoNodeData,
  NivelJerarquico,
  UsuarioAsignado,
} from '../../types/organigrama.types';
import { NIVEL_COLORS, NIVEL_LABELS } from '../../types/organigrama.types';

/** Iconos por nivel jerárquico */
const NIVEL_ICONS: Record<NivelJerarquico, string> = {
  ESTRATEGICO: 'Crown',
  TACTICO: 'Target',
  OPERATIVO: 'Wrench',
  APOYO: 'HeartHandshake',
  EXTERNO: 'UserCheck',
};

/** Componente para mostrar grupo de avatares */
const AvatarGroup = ({ usuarios, max = 4 }: { usuarios: UsuarioAsignado[]; max?: number }) => {
  if (!usuarios || usuarios.length === 0) return null;

  const visibles = usuarios.slice(0, max);
  const restantes = usuarios.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visibles.map((usuario) => (
        <div key={usuario.id} className="relative" title={usuario.full_name}>
          <Avatar
            src={usuario.photo_url || undefined}
            name={usuario.full_name}
            size="sm"
            className="ring-2 ring-white dark:ring-gray-900"
          />
        </div>
      ))}
      {restantes > 0 && (
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-900 text-xs font-medium text-gray-600 dark:text-gray-300">
          +{restantes}
        </div>
      )}
    </div>
  );
};

interface CargoNodeProps {
  data: CargoNodeData;
  selected?: boolean;
}

const CargoNode = memo(({ data, selected }: CargoNodeProps) => {
  const { cargo, expanded, onExpand, subordinados = [] } = data;

  const nivel = cargo.nivel_jerarquico as NivelJerarquico;
  const colors = NIVEL_COLORS[nivel] || NIVEL_COLORS.OPERATIVO;
  const hasChildren = subordinados.length > 0 || (cargo.subordinados_count ?? 0) > 0;

  // Calcular posiciones vacantes
  const posicionesVacantes = cargo.cantidad_posiciones - (cargo.usuarios_count ?? 0);

  return (
    <div
      className={`
        min-w-[260px] rounded-xl border-2 shadow-lg transition-all duration-200
        bg-white dark:bg-gray-900
        ${
          selected
            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
            : `${colors.border} ${colors.darkBorder} hover:shadow-xl`
        }
      `}
    >
      {/* Handle de entrada (arriba) */}
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 ${colors.bg} !border-2 !border-white dark:!border-gray-900`}
      />

      {/* Indicador de nivel jerárquico */}
      <div
        className={`
          h-1.5 rounded-t-xl
          ${nivel === 'ESTRATEGICO' ? 'bg-red-500' : ''}
          ${nivel === 'TACTICO' ? 'bg-blue-500' : ''}
          ${nivel === 'OPERATIVO' ? 'bg-green-500' : ''}
          ${nivel === 'APOYO' ? 'bg-purple-500' : ''}
          ${nivel === 'EXTERNO' ? 'bg-cyan-500' : ''}
        `}
      />

      {/* Header del cargo */}
      <div className={`px-4 py-3 ${colors.bgLight} ${colors.darkBg}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.bg} text-white shadow-sm`}>
            <DynamicIcon
              name={cargo.is_jefatura ? 'Crown' : NIVEL_ICONS[nivel] || 'UserCog'}
              size={20}
              className="text-white"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {cargo.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${colors.text}`}>{cargo.code}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className={`text-xs ${colors.text}`}>{NIVEL_LABELS[nivel]}</span>
            </div>
          </div>
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className={`!p-1 !min-h-0 rounded hover:bg-opacity-50 transition-colors ${colors.bgLight}`}
            >
              {expanded ? (
                <ChevronDown className={`h-4 w-4 ${colors.text}`} />
              ) : (
                <ChevronRight className={`h-4 w-4 ${colors.text}`} />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 space-y-2">
        {/* Área */}
        {cargo.area_name && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 truncate">
            <MapPin size={14} className="flex-shrink-0" />
            {cargo.area_name}
          </div>
        )}

        {/* Avatares de usuarios asignados */}
        {cargo.usuarios_asignados && cargo.usuarios_asignados.length > 0 && (
          <div className="flex items-center justify-between py-2">
            <AvatarGroup usuarios={cargo.usuarios_asignados} max={4} />
            {cargo.usuarios_asignados.length === 1 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2 max-w-[120px]">
                {cargo.usuarios_asignados[0].full_name}
              </span>
            )}
          </div>
        )}

        {/* Estadísticas */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Usuarios asignados */}
          <Badge variant={cargo.usuarios_count ? 'success' : 'gray'} size="sm">
            <Users className="h-3 w-3 mr-1" />
            {cargo.usuarios_count ?? 0}/{cargo.cantidad_posiciones}
          </Badge>

          {/* Subordinados */}
          {(cargo.subordinados_count ?? 0) > 0 && (
            <Badge variant="info" size="sm">
              {cargo.subordinados_count} reportan
            </Badge>
          )}

          {/* Indicador de jefatura */}
          {cargo.is_jefatura && (
            <Badge variant="warning" size="sm">
              <DynamicIcon name="Crown" size={12} className="mr-1" />
              Jefatura
            </Badge>
          )}

          {/* Indicador de externo */}
          {cargo.is_externo && (
            <Badge variant="info" size="sm">
              <DynamicIcon name="UserCheck" size={12} className="mr-1" />
              Externo
            </Badge>
          )}
        </div>

        {/* Alerta de vacantes */}
        {posicionesVacantes > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              {posicionesVacantes} {posicionesVacantes === 1 ? 'vacante' : 'vacantes'}
            </span>
          </div>
        )}

        {/* Estado */}
        {!cargo.is_active && (
          <Badge variant="danger" size="sm" className="w-full justify-center">
            Cargo Inactivo
          </Badge>
        )}
      </div>

      {/* Handle de salida (abajo) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 ${colors.bg} !border-2 !border-white dark:!border-gray-900`}
      />
    </div>
  );
});

CargoNode.displayName = 'CargoNode';

export default CargoNode;
