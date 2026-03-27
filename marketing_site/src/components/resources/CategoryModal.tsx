import React, { useState } from 'react';
import { X, FolderOpen, Bell, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@components/ui/button';
import { cn } from '@utils/cn';
import type { ResourceCategory } from '@/data/resources';

interface CategoryModalProps {
  category: ResourceCategory | null;
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl?: string;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  category,
  isOpen,
  onClose,
  apiBaseUrl,
}) => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [notify, setNotify] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !category) return null;

  const redirectUrl = `${apiBaseUrl || 'https://app.stratekaz.com'}/api/tenant/public/recursos/${category.code}/acceder/`;

  const openDrive = () => {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAcceder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Si el usuario llenó el email, lo guardamos
    if (email.trim()) {
      setLoading(true);
      try {
        if (apiBaseUrl) {
          const response = await fetch(`${apiBaseUrl}/api/tenant/public/newsletter/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              nombre: nombre.trim(),
              source: 'recursos',
              categorias: notify ? [category.code] : [],
            }),
          });
          // 409 = ya suscrito, tratamos como éxito
          if (!response.ok && response.status !== 409) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Error al registrar');
          }
        }

        // GA4
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'resource_category_access', {
            category_code: category.code,
            category_name: category.name,
            notify_subscribed: notify,
            lead_captured: true,
          });
        }

        setSubmitted(true);
        setTimeout(openDrive, 800);
      } catch (err: any) {
        setError(err.message || 'Error al procesar. Intenta de nuevo.');
        setLoading(false);
        return;
      }
      setLoading(false);
    } else {
      // Sin email, acceso directo
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'resource_category_access', {
          category_code: category.code,
          category_name: category.name,
          lead_captured: false,
        });
      }
      openDrive();
      onClose();
    }
  };

  const handleClose = () => {
    setEmail('');
    setNombre('');
    setNotify(false);
    setSubmitted(false);
    setError('');
    onClose();
  };

  const CategoryIcon = category.icon;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black-deep/80 backdrop-blur-sm' onClick={handleClose} />

      {/* Modal */}
      <div className='relative w-full max-w-md rounded-2xl border border-black-border bg-black-card shadow-2xl animate-fade-in'>
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className='absolute top-4 right-4 p-1.5 rounded-lg text-white-muted hover:text-white-text hover:bg-black-hover transition-colors'
        >
          <X className='h-4 w-4' />
        </button>

        <div className='p-6 sm:p-8'>
          {submitted ? (
            /* Estado de éxito */
            <div className='text-center py-4'>
              <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4', category.bgClass)}>
                <CheckCircle className={cn('h-8 w-8', category.colorClass)} />
              </div>
              <h3 className='font-title font-bold text-white-text text-lg mb-2'>
                ¡Todo listo!
              </h3>
              <p className='text-sm text-white-muted'>
                Abriendo los recursos de <span className='text-white-text font-medium'>{category.name}</span>...
              </p>
              {notify && (
                <p className='text-xs text-white-muted/70 mt-2'>
                  Te notificaremos cuando haya nuevos recursos en esta categoría.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className='flex items-start gap-4 mb-6'>
                <div className={cn('flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border', category.bgClass, category.borderClass)}>
                  <CategoryIcon className={cn('h-6 w-6', category.colorClass)} />
                </div>
                <div>
                  <h3 className='font-title font-bold text-white-text text-lg leading-tight mb-1'>
                    {category.name}
                  </h3>
                  <p className='text-sm text-white-muted leading-relaxed'>
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className='border-t border-black-border mb-6' />

              {/* Formulario */}
              <form onSubmit={handleAcceder} className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-white-text mb-1'>
                    Accede gratis
                  </p>
                  <p className='text-xs text-white-muted mb-4'>
                    Opcional: déjanos tu email para enviarte recursos nuevos cuando los publiquemos.
                  </p>
                </div>

                <input
                  type='text'
                  placeholder='Tu nombre (opcional)'
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className='w-full px-4 py-2.5 rounded-lg bg-black-hover border border-black-border text-white-text text-sm placeholder:text-white-muted/50 focus:outline-none focus:border-brand-500 transition-colors min-h-[44px]'
                />

                <input
                  type='email'
                  placeholder='tu@email.com (opcional)'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='w-full px-4 py-2.5 rounded-lg bg-black-hover border border-black-border text-white-text text-sm placeholder:text-white-muted/50 focus:outline-none focus:border-brand-500 transition-colors min-h-[44px]'
                />

                {/* Checkbox notificaciones */}
                <label className='flex items-start gap-3 cursor-pointer group'>
                  <div className='flex-shrink-0 mt-0.5'>
                    <input
                      type='checkbox'
                      checked={notify}
                      onChange={e => setNotify(e.target.checked)}
                      className='sr-only'
                    />
                    <div
                      className={cn(
                        'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                        notify
                          ? 'bg-brand-500 border-brand-500'
                          : 'bg-transparent border-black-border-soft group-hover:border-brand-500/50',
                      )}
                    >
                      {notify && (
                        <svg className='w-2.5 h-2.5 text-white' viewBox='0 0 10 10' fill='none'>
                          <path d='M2 5l2.5 2.5L8 3' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className='text-xs text-white-muted group-hover:text-white-text transition-colors leading-relaxed'>
                    <Bell className='inline h-3 w-3 mr-1 text-brand-400' />
                    Notificarme cuando haya nuevos recursos en <span className='text-white-text'>{category.name}</span>
                  </span>
                </label>

                {error && (
                  <p className='text-xs text-red-400'>{error}</p>
                )}

                <Button
                  type='submit'
                  variant='primary'
                  size='lg'
                  fullWidth
                  loading={loading}
                  rightIcon={<FolderOpen className='h-4 w-4' />}
                >
                  Acceder a los recursos
                </Button>

                {/* Acceso directo sin email */}
                <button
                  type='button'
                  onClick={() => { openDrive(); handleClose(); }}
                  className='w-full flex items-center justify-center gap-1.5 text-xs text-white-muted/60 hover:text-white-muted transition-colors py-1'
                >
                  Acceder sin registrarme
                  <ArrowRight className='h-3 w-3' />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
