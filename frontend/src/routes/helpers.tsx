/**
 * Helpers compartidos para rutas del sistema.
 * Envuelven componentes lazy con Suspense y/o ModuleGuard.
 *
 * ARCHIVO PROTEGIDO: No modificar en sprints de modulo.
 */
import { Suspense, ComponentType } from 'react';
import { ModuleGuard } from './ModuleGuard';
import { PageLoader } from '@/components/common/PageLoader';

/** Envuelve un componente lazy con Suspense */
export const withSuspense = (Component: ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

/** Envuelve con Suspense + ModuleGuard (doble proteccion frontend) */
export const withModuleGuard = (Component: ComponentType, moduleCode: string) => (
  <ModuleGuard moduleCode={moduleCode}>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ModuleGuard>
);
