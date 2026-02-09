/**
 * Service Colors Configuration
 * Centralized color definitions for service categories
 * Prevents hardcoding and ensures consistency
 */

export interface ServiceColor {
  name: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  benefit: string;
  description: string;
}

export const SERVICE_COLORS = {
  sst: {
    colorClass: 'text-system-red-500',
    bgClass: 'bg-system-red-500/10',
    borderClass: 'border-system-red-500/30',
  },
  calidad: {
    colorClass: 'text-system-blue-500',
    bgClass: 'bg-system-blue-500/10',
    borderClass: 'border-system-blue-500/30',
  },
  coaching: {
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
  },
  ambiental: {
    colorClass: 'text-system-yellow-500',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
  },
  pesv: {
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
  },
} as const;

export type ServiceType = keyof typeof SERVICE_COLORS;

// Helper function to get service colors
export const getServiceColors = (serviceType: ServiceType) => {
  return SERVICE_COLORS[serviceType];
};

// Export default
export default SERVICE_COLORS;
