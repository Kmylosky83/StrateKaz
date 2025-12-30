/**
 * PageLoader Component
 *
 * Loading fallback para Suspense boundaries en lazy-loaded pages
 */
export const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Cargando módulo...</p>
      </div>
    </div>
  );
};
