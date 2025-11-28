import { Link } from 'react-router-dom';
import { Heart, Rocket } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} | Kmylosky | Todos los derechos reservados.
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link
              to="/privacy"
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              Política de Privacidad
            </Link>
            <Link
              to="/terms"
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              Términos de Uso
            </Link>
          </div>

          {/* Powered by */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Powered by</span>
            <a
              href="https://stratekaz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors flex items-center space-x-1"
            >
              <span>StrateKaz</span>
              <Rocket className="h-3 w-3 fill-current" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
