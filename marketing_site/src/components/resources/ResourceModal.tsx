import React, { useState } from 'react';
import { X, Download, ExternalLink, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@components/ui/button';
import { cn } from '@utils/cn';
import type { Resource } from '@/data/resources';
import { getCategoryByCode, formatMeta } from '@/data/resources';

interface ResourceModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl?: string;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  resource,
  isOpen,
  onClose,
  apiBaseUrl,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !resource) return null;

  const category = getCategoryByCode(resource.category);
  const fmeta = formatMeta[resource.format];

  const handleDirectDownload = () => {
    // GA4 event tracking
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'resource_download', {
        resource_id: resource.id,
        resource_name: resource.title,
        resource_category: resource.category,
        resource_format: resource.format,
      });
    }

    window.open(resource.driveUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Try to submit to backend newsletter endpoint
      if (apiBaseUrl) {
        const response = await fetch(`${apiBaseUrl}/api/tenant/public/newsletter/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            nombre: name.trim(),
            source: 'recursos',
            categorias: [resource.category],
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          // 409 = already subscribed — treat as success
          if (response.status !== 409) {
            throw new Error(data.error || 'Error al registrar');
          }
        }
      }

      // GA4 event
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'resource_download', {
          resource_id: resource.id,
          resource_name: resource.title,
          resource_category: resource.category,
          resource_format: resource.format,
          lead_captured: true,
        });
      }

      setSubmitted(true);

      // Auto-download after short delay
      setTimeout(() => {
        window.open(resource.driveUrl, '_blank', 'noopener,noreferrer');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al procesar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black-deep/80 backdrop-blur-sm' onClick={onClose} />

      {/* Modal */}
      <div className='relative w-full max-w-md rounded-2xl border border-black-border bg-black-card shadow-2xl animate-fade-in'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-1 rounded-lg text-white-muted hover:text-white-text hover:bg-black-hover transition-colors'
        >
          <X className='h-5 w-5' />
        </button>

        <div className='p-6'>
          {/* Category Badge */}
          {category && (
            <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4', category.bgClass, category.colorClass)}>
              <category.icon className='h-3.5 w-3.5' />
              {category.name}
            </div>
          )}

          {/* Title */}
          <h3 className='font-title font-bold text-white-text text-lg mb-2'>
            {resource.title}
          </h3>

          {/* Description */}
          <p className='text-sm text-white-muted leading-relaxed mb-4'>
            {resource.description}
          </p>

          {/* Format Badge */}
          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black-hover text-xs font-medium mb-6', fmeta.colorClass)}>
            <span>Formato: {fmeta.label} ({fmeta.extension})</span>
          </div>

          {/* Direct download or email form */}
          {!resource.requiresEmail ? (
            <Button
              variant='primary'
              size='lg'
              fullWidth
              leftIcon={<Download className='h-4 w-4' />}
              onClick={handleDirectDownload}
            >
              Descargar Gratis
            </Button>
          ) : submitted ? (
            <div className='text-center py-4'>
              <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-3' />
              <p className='font-title font-semibold text-white-text mb-1'>
                Descarga iniciada
              </p>
              <p className='text-sm text-white-muted'>
                Revisa tu correo para futuras actualizaciones
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className='space-y-3'>
              <p className='text-xs text-white-muted flex items-center gap-1.5 mb-1'>
                <Mail className='h-3.5 w-3.5 text-brand-400' />
                Ingresa tu email para descargar este recurso premium
              </p>

              <input
                type='text'
                placeholder='Tu nombre (opcional)'
                value={name}
                onChange={e => setName(e.target.value)}
                className='w-full px-4 py-2.5 rounded-lg bg-black-hover border border-black-border text-white-text text-sm placeholder:text-white-muted/50 focus:outline-none focus:border-brand-500 transition-colors min-h-[44px]'
              />

              <input
                type='email'
                required
                placeholder='tu@email.com'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full px-4 py-2.5 rounded-lg bg-black-hover border border-black-border text-white-text text-sm placeholder:text-white-muted/50 focus:outline-none focus:border-brand-500 transition-colors min-h-[44px]'
              />

              {error && (
                <p className='text-xs text-red-400'>{error}</p>
              )}

              <Button
                type='submit'
                variant='primary'
                size='lg'
                fullWidth
                loading={loading}
                leftIcon={<Download className='h-4 w-4' />}
              >
                Descargar Ahora
              </Button>

              <p className='text-[10px] text-white-muted/60 text-center'>
                Usaremos tu email solo para enviarte recursos y actualizaciones. Sin spam.
              </p>
            </form>
          )}

          {/* Tags */}
          <div className='flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-black-border'>
            {resource.tags.map(tag => (
              <span
                key={tag}
                className='px-2 py-0.5 rounded-md bg-black-hover text-white-muted text-[10px]'
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceModal;
