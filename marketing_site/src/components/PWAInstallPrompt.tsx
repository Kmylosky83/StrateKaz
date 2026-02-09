import React from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, installApp } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className='fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-black-card border border-brand-500 rounded-xl p-4 shadow-lg'>
      <div className='flex items-start space-x-3'>
        <div className='bg-brand-500 p-2 rounded-lg'>
          <Download className='h-5 w-5 text-white' aria-hidden='true' />
        </div>
        <div className='flex-1'>
          <h3 className='text-white-text font-semibold text-sm mb-1'>
            Instalar StrateKaz
          </h3>
          <p className='text-white-muted text-xs mb-3'>
            Instala nuestra app para acceso rápido y funcionamiento offline
          </p>
          <div className='flex space-x-2'>
            <button
              onClick={handleInstall}
              className='bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded text-xs font-medium transition-colors min-h-[44px] flex items-center'
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className='text-white-muted hover:text-white px-4 py-2 rounded text-xs transition-colors min-h-[44px] flex items-center'
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className='text-white-muted hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center'
          aria-label='Cerrar'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>
    </div>
  );
};
