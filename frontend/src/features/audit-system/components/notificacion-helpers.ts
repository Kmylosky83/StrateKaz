/**
 * Utilidades compartidas para notificaciones: iconos y colores por categoría.
 */
import { Bell, Settings, CheckSquare, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export const getCategoriaIcon = (categoria: string) => {
  const icons: Record<string, typeof Bell> = {
    sistema: Settings,
    tarea: CheckSquare,
    alerta: AlertTriangle,
    recordatorio: Clock,
    aprobacion: CheckCircle,
  };
  return icons[categoria] || Bell;
};

export const getCategoriaColor = (categoria: string) => {
  const colors: Record<string, string> = {
    sistema: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    tarea: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    alerta: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    recordatorio: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    aprobacion: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
};
