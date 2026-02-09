import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@utils/cn';

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: 'square' | '4/3' | '16/9' | '21/9' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

interface ImageState {
  isLoaded: boolean;
  isError: boolean;
  isIntersecting: boolean;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  className,
  priority = false,
  aspectRatio = 'auto',
  objectFit = 'cover',
  onLoad,
  onError,
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    isLoaded: false,
    isError: false,
    isIntersecting: false,
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setImageState(prev => ({ ...prev, isIntersecting: true }));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageState(prev => ({ ...prev, isIntersecting: true }));
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Generate responsive sources
  const generateSources = () => {
    const basePath = src.replace(/\.[^/.]+$/, ''); // Remove extension

    return [
      {
        media: '(min-width: 1536px)',
        srcSet: `${basePath}-xl.webp`,
        type: 'image/webp',
      },
      {
        media: '(min-width: 1280px)',
        srcSet: `${basePath}-lg.webp`,
        type: 'image/webp',
      },
      {
        media: '(min-width: 768px)',
        srcSet: `${basePath}-md.webp`,
        type: 'image/webp',
      },
      {
        media: '(min-width: 640px)',
        srcSet: `${basePath}-sm.webp`,
        type: 'image/webp',
      },
      {
        media: '(max-width: 639px)',
        srcSet: `${basePath}-xs.webp`,
        type: 'image/webp',
      },
    ];
  };

  // Get aspect ratio classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case '4/3':
        return 'aspect-4/3';
      case '16/9':
        return 'aspect-video';
      case '21/9':
        return 'aspect-[21/9]';
      default:
        return '';
    }
  };

  // Get object fit classes
  const getObjectFitClass = () => {
    switch (objectFit) {
      case 'cover':
        return 'object-cover';
      case 'contain':
        return 'object-contain';
      case 'fill':
        return 'object-fill';
      case 'none':
        return 'object-none';
      case 'scale-down':
        return 'object-scale-down';
      default:
        return 'object-cover';
    }
  };

  // Handle image load
  const handleLoad = () => {
    setImageState(prev => ({ ...prev, isLoaded: true }));
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setImageState(prev => ({ ...prev, isError: true }));
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-black-card',
        getAspectRatioClass(),
        className
      )}
    >
      {/* Placeholder */}
      {!imageState.isLoaded && (
        <div className='absolute inset-0 animate-pulse bg-black-card' />
      )}

      {/* Loading spinner */}
      {imageState.isIntersecting &&
        !imageState.isLoaded &&
        !imageState.isError && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent' />
          </div>
        )}

      {/* Error state */}
      {imageState.isError && (
        <div className='absolute inset-0 flex items-center justify-center bg-black-hover'>
          <div className='text-center text-white-muted'>
            <svg
              className='mx-auto h-12 w-12 mb-2'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            <p className='text-sm'>Error loading image</p>
          </div>
        </div>
      )}

      {/* Responsive Image */}
      {imageState.isIntersecting && !imageState.isError && (
        <picture>
          {generateSources().map((source, index) => (
            <source
              key={index}
              media={source.media}
              srcSet={source.srcSet}
              type={source.type}
            />
          ))}
          <img
            ref={imgRef}
            src={`${src.replace(/\.[^/.]+$/, '')}.jpg`}
            alt={alt}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            className={cn(
              'w-full h-full transition-opacity duration-300',
              getObjectFitClass(),
              imageState.isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      )}

      {/* Overlay for loaded state */}
      {imageState.isLoaded && (
        <div className='absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black-deep/20 pointer-events-none' />
      )}
    </div>
  );
};

// Utility component for hero backgrounds
export const HeroImage: React.FC<
  Omit<ResponsiveImageProps, 'aspectRatio' | 'objectFit'>
> = props => (
  <ResponsiveImage
    {...props}
    aspectRatio='auto'
    objectFit='cover'
    priority={true}
    className={cn('absolute inset-0', props.className)}
  />
);

// Utility component for feature cards
export const FeatureImage: React.FC<
  Omit<ResponsiveImageProps, 'aspectRatio'>
> = props => (
  <ResponsiveImage
    {...props}
    aspectRatio='16/9'
    className={cn('rounded-lg', props.className)}
  />
);

// Utility component for product showcases
export const ProductImage: React.FC<
  Omit<ResponsiveImageProps, 'aspectRatio'>
> = props => (
  <ResponsiveImage
    {...props}
    aspectRatio='4/3'
    className={cn('rounded-xl', props.className)}
  />
);
