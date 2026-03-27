import React, { useState } from 'react';
import { Send, CheckCircle, Sparkles, BookOpen, Zap } from 'lucide-react';
import { Button } from '@components/ui/button';
import { cn } from '@utils/cn';

interface NewsletterSectionProps {
  apiBaseUrl?: string;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ apiBaseUrl }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      if (apiBaseUrl) {
        const response = await fetch(`${apiBaseUrl}/api/tenant/public/newsletter/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            source: 'newsletter_recursos',
            categorias: [],
          }),
        });

        if (!response.ok && response.status !== 409) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Error al suscribirse');
        }
      }

      // GA4 event
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'newsletter_subscribe', {
          source: 'recursos_page',
        });
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='py-section-sm lg:py-section-md'>
      <div className='container-responsive'>
        <div className='max-w-2xl mx-auto'>
          <div className='rounded-2xl border border-black-border bg-black-card p-6 sm:p-10'>
            {submitted ? (
              <div className='text-center py-4'>
                <CheckCircle className='h-14 w-14 text-green-500 mx-auto mb-4' />
                <h3 className='font-title font-bold text-white-text text-xl mb-2'>
                  Suscripcion exitosa
                </h3>
                <p className='text-sm text-white-muted'>
                  Recibiras nuevos recursos, guias de IA y herramientas directamente en tu correo.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className='text-center mb-8'>
                  <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4'>
                    <Sparkles className='h-3.5 w-3.5' />
                    Newsletter StrateKaz
                  </div>

                  <h2 className='font-title font-bold text-white-text text-fluid-xl lg:text-fluid-2xl mb-3'>
                    Recibe recursos y tendencias en tu correo
                  </h2>

                  <p className='text-sm text-white-muted max-w-md mx-auto'>
                    Nuevos formatos, guias completas de prompts, herramientas de IA y las mejores practicas para tu gestion empresarial. Sin spam, solo valor.
                  </p>
                </div>

                {/* Benefits */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8'>
                  {[
                    { icon: BookOpen, text: 'Recursos exclusivos' },
                    { icon: Sparkles, text: 'Guias de IA y prompts' },
                    { icon: Zap, text: 'Herramientas digitales' },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className='flex items-center gap-2 px-3 py-2 rounded-lg bg-black-hover text-xs text-white-muted'
                    >
                      <Icon className='h-3.5 w-3.5 text-brand-400 flex-shrink-0' />
                      {text}
                    </div>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-3'>
                  <input
                    type='email'
                    required
                    placeholder='tu@email.com'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-xl bg-black-hover border border-black-border',
                      'text-white-text text-sm placeholder:text-white-muted/40',
                      'focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20',
                      'transition-all min-h-[48px]'
                    )}
                  />

                  <Button
                    type='submit'
                    variant='primary'
                    size='lg'
                    loading={loading}
                    leftIcon={<Send className='h-4 w-4' />}
                    className='sm:flex-shrink-0'
                  >
                    Suscribirme
                  </Button>
                </form>

                {error && (
                  <p className='text-xs text-red-400 mt-2 text-center'>{error}</p>
                )}

                <p className='text-[10px] text-white-muted/50 text-center mt-3'>
                  Al suscribirte aceptas recibir comunicaciones de StrateKaz. Puedes cancelar en cualquier momento.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
