/**
 * MisNotificacionesPage — Página personal de notificaciones.
 *
 * Accesible desde el avatar (/perfil/notificaciones).
 * Muestra solo contenido personal:
 *   - Bandeja: mis notificaciones (leer, archivar, marcar leídas)
 *   - Preferencias: canales y horarios de entrega
 *
 * La administración de tipos y envío masivo permanece en
 * Centro de Control (/auditoria/notificaciones).
 */
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { useHeaderContext } from '@/contexts/HeaderContext';
import { BandejaNotificaciones } from '@/features/audit-system/components/BandejaNotificaciones';
import { PreferenciasNotificaciones } from '@/features/audit-system/components/PreferenciasNotificaciones';

const PAGE_SECTIONS = [
  { code: 'bandeja', name: 'Bandeja', icon: 'Bell' },
  { code: 'preferencias', name: 'Preferencias', icon: 'Sliders' },
];

export const MisNotificacionesPage = () => {
  const { resetHeader } = useHeaderContext();
  const [activeSection, setActiveSection] = useState('bandeja');

  useEffect(() => {
    resetHeader();
  }, [resetHeader]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Notificaciones"
        description="Tu bandeja de notificaciones y preferencias de entrega"
        sections={PAGE_SECTIONS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="blue"
      />

      {activeSection === 'bandeja' && <BandejaNotificaciones />}
      {activeSection === 'preferencias' && <PreferenciasNotificaciones />}
    </div>
  );
};

export default MisNotificacionesPage;
