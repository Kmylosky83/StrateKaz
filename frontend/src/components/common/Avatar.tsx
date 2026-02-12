import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Muestra borde de estado: 'active'=verde, 'inactive'=gris, 'external'=azul */
  status?: 'active' | 'inactive' | 'external';
  className?: string;
}

export const Avatar = ({ src, alt, name, size = 'md', status, className }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-24 w-24 text-3xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
  };

  const statusClasses = {
    active: 'ring-2 ring-green-400',
    inactive: 'ring-2 ring-gray-300',
    external: 'ring-2 ring-blue-400',
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-primary-500',
      'bg-success-500',
      'bg-warning-500',
      'bg-danger-500',
      'bg-info-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];

    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  const shouldShowImage = src && !imageError;
  const shouldShowInitials = !shouldShowImage && name;
  const shouldShowIcon = !shouldShowImage && !name;

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0',
        sizeClasses[size],
        shouldShowInitials && getBackgroundColor(name || ''),
        shouldShowIcon && 'bg-gray-200 dark:bg-gray-700',
        status && statusClasses[status],
        className
      )}
    >
      {shouldShowImage && (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {shouldShowInitials && <span className="font-semibold text-white">{getInitials(name!)}</span>}

      {shouldShowIcon && (
        <User className={cn(iconSizes[size], 'text-gray-500 dark:text-gray-400')} />
      )}
    </div>
  );
};
