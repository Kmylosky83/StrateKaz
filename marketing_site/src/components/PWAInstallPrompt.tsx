import React from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallPrompt: React.FC = () => {
  const { shouldShow, isIOS, showIOSInstructions, installApp, dismiss } = usePWA();

  if (!shouldShow) return null;

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) dismiss();
  };

  // iOS Safari: educational banner
  if (isIOS && showIOSInstructions) {
    return (
      <div className='fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-black-card border border-brand-500/30 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-500'>
        <div className='flex items-start gap-3'>
          <div className='bg-brand-500/20 p-2 rounded-lg shrink-0'>
            <img src='/icons/pwa-64x64.png' alt='StrateKaz' className='h-8 w-8 rounded' />
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='text-white font-semibold text-sm mb-1'>
              Instalar StrateKaz
            </h3>
            <p className='text-gray-400 text-xs mb-2'>
              Toca <Share className='inline h-3.5 w-3.5 text-blue-400 mx-0.5' aria-hidden='true' /> <strong className='text-gray-300'>Compartir</strong> y luego <strong className='text-gray-300'>"Agregar a inicio"</strong>
            </p>
          </div>
          <button
            onClick={dismiss}
            className='text-gray-500 hover:text-white p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0'
            aria-label='Cerrar'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </button>
        </div>
      </div>
    );
  }

  // Android / Desktop Chrome / Edge: install button
  return (
    <div className='fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-black-card border border-brand-500/30 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-500'>
      <div className='flex items-start gap-3'>
        <div className='bg-brand-500/20 p-2 rounded-lg shrink-0'>
          <img src='/icons/pwa-64x64.png' alt='StrateKaz' className='h-8 w-8 rounded' />
        </div>
        <div className='flex-1 min-w-0'>
          <h3 className='text-white font-semibold text-sm mb-1'>
            Instalar StrateKaz
          </h3>
          <p className='text-gray-400 text-xs mb-3'>
            Acceso directo desde tu escritorio o pantalla de inicio
          </p>
          <div className='flex gap-2'>
            <button
              onClick={handleInstall}
              className='bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] flex items-center gap-1.5'
            >
              <Download className='h-3.5 w-3.5' aria-hidden='true' />
              Instalar
            </button>
            <button
              onClick={dismiss}
              className='text-gray-400 hover:text-white px-3 py-2 rounded-lg text-xs transition-colors min-h-[40px] flex items-center'
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className='text-gray-500 hover:text-white p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0'
          aria-label='Cerrar'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>
    </div>
  );
};
