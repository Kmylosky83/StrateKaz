/**
 * Tipos para el Portal de Clientes (usuarios externos vinculados a un Cliente)
 */

// ============================================================================
// CLIENTE (Mi Cliente)
// ============================================================================

export interface ContactoCliente {
  id: number;
  nombre_completo: string;
  cargo: string;
  telefono: string;
  email: string;
  es_principal: boolean;
  notas: string;
  is_active: boolean;
  created_at: string;
}

export interface MiClienteData {
  id: number;
  codigo_cliente: string;
  tipo_documento: string;
  numero_documento: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_cliente_nombre: string;
  estado_cliente_nombre: string;
  estado_cliente_color: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  plazo_pago_dias: number;
  cupo_credito: string;
  descuento_comercial: string;
  contactos: ContactoCliente[];
  nombre_completo: string;
  is_active: boolean;
  created_at: string;
}

export interface ScoringCliente {
  puntuacion_total: number;
  frecuencia_compra?: number;
  volumen_compra?: number;
  puntualidad_pago?: number;
  antiguedad?: number;
  nivel_scoring: string;
  color_nivel: string;
  ultima_actualizacion?: string;
}
