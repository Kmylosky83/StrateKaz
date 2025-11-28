import { Badge } from '@/components/common/Badge';
import type { TipoProveedor } from '@/types/proveedores.types';

interface TipoProveedorBadgeProps {
  tipo: TipoProveedor;
  display?: string;
}

export const TipoProveedorBadge = ({ tipo, display }: TipoProveedorBadgeProps) => {
  const getVariant = (): 'primary' | 'success' | 'warning' | 'info' => {
    switch (tipo) {
      case 'MATERIA_PRIMA_EXTERNO':
        return 'primary';
      case 'UNIDAD_NEGOCIO':
        return 'success';
      case 'PRODUCTO_SERVICIO':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getLabel = () => {
    if (display) return display;

    switch (tipo) {
      case 'MATERIA_PRIMA_EXTERNO':
        return 'Materia Prima';
      case 'UNIDAD_NEGOCIO':
        return 'Unidad Interna';
      case 'PRODUCTO_SERVICIO':
        return 'Producto/Servicio';
      default:
        return tipo;
    }
  };

  return <Badge variant={getVariant()}>{getLabel()}</Badge>;
};
