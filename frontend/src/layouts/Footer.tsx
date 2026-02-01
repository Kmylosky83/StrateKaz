/**
 * Footer - Enterprise Level Responsive
 *
 * Footer con soporte completo para mobile/tablet/desktop.
 * Se adapta automáticamente al viewport.
 *
 * BRANDING FIJO desde constants/brand.ts (Single Source of Truth):
 * - Powered by StrateKaz (identidad de marca del software)
 * - Copyright Kmylosky (propietario)
 * - www.stratekaz.com (enlace oficial)
 */
import { Rocket } from 'lucide-react';
import { BRAND } from '@/constants/brand';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          {/* Copyright - FIJO Kmylosky */}
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            © {currentYear} {BRAND.copyright}. Todos los derechos reservados.
          </div>

          {/* Powered by - FIJO StrateKaz con enlace */}
          <div className="flex items-center justify-center sm:justify-end space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <span className="hidden sm:inline">Powered by</span>
            <a
              href={BRAND.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1 transition-colors"
            >
              <span>{BRAND.name}</span>
              <Rocket className="h-3 w-3 fill-current" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
