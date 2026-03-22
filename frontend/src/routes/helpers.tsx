/**
 * Helpers compartidos para rutas del sistema.
 * Envuelven componentes lazy con Suspense y/o ModuleGuard y/o SectionGuard.
 *
 * ARCHIVO PROTEGIDO: No modificar en sprints de modulo.
 */
import { Suspense, ComponentType } from 'react';
import { ModuleGuard } from './ModuleGuard';
import { SectionGuard } from './SectionGuard';
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

/** Envuelve con ModuleGuard + SectionGuard + Suspense (triple proteccion RBAC) */
export const withFullGuard = (
  Component: ComponentType,
  moduleCode: string,
  sectionCode: string
) => (
  <ModuleGuard moduleCode={moduleCode}>
    <SectionGuard moduleCode={moduleCode} sectionCode={sectionCode}>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </SectionGuard>
  </ModuleGuard>
);
