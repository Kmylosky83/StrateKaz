/**
 * Gestión Documental - Sistema de Gestión
 *
 * Layout estandarizado:
 * 1. PageHeader (solo titulo y descripcion)
 * 2. DynamicSections (sub-tabs debajo del header, variante underline)
 * 3. Contenido de la sección activa
 *
 * Secciones desde BD (sistema_gestion > gestion_documental):
 * - tipos_documento: Tipos de Documento y Plantillas
 * - documentos: Constructor y Listado Maestro de Documentos
 * - control_cambios: Control de Versiones y Firmas
 * - distribucion: Distribución y Control Documental
 *
 * Reutiliza hooks y modales de gestion-estrategica/gestion-documental
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout';
import { DynamicSections, ConfirmDialog } from '@/components/common';
import { useModuleColor } from '@/hooks/useModuleColor';
import { usePageSections } from '@/hooks/usePageSections';
import { useAuthStore } from '@/store/authStore';
import { useWorkflowFirmas } from '@/features/gestion-estrategica/hooks/useWorkflowFirmas';
import type {
  TipoDocumento,
  PlantillaDocumento,
} from '@/features/gestion-estrategica/types/gestion-documental.types';
import type { SignatureData } from '@/components/modals/SignatureModal';

import { TipoDocumentoFormModal } from '@/features/gestion-estrategica/components/gestion-documental/TipoDocumentoFormModal';
import { PlantillaFormModal } from '@/features/gestion-estrategica/components/gestion-documental/PlantillaFormModal';
import { DocumentoFormModal } from '@/features/gestion-estrategica/components/gestion-documental/DocumentoFormModal';
import { DocumentoDetailModal } from '@/features/gestion-estrategica/components/gestion-documental/DocumentoDetailModal';
import { SignatureModal } from '@/components/modals/SignatureModal';
import { Textarea } from '@/components/forms';

import { GestionDocumentalTab } from '../components/gestion-documental/GestionDocumentalTab';

const MODULE_CODE = 'sistema_gestion';
const TAB_CODE = 'gestion_documental';

export const GestionDocumentalPage = () => {
  const {
    sections,
    activeSection,
    setActiveSection,
    activeSectionData,
    isLoading: sectionsLoading,
  } = usePageSections({
    moduleCode: MODULE_CODE,
    tabCode: TAB_CODE,
  });

  const { color: moduleColor } = useModuleColor('sistema_gestion');
  const user = useAuthStore((s) => s.user);
  const { firmarDocumento, rechazarFirma, isFirmando, isRechazando } = useWorkflowFirmas();

  // Modal state - documentos
  const [tipoFormModal, setTipoFormModal] = useState<{
    isOpen: boolean;
    tipo?: TipoDocumento;
  }>({ isOpen: false });
  const [plantillaFormModal, setPlantillaFormModal] = useState<{
    isOpen: boolean;
    plantilla?: PlantillaDocumento;
  }>({ isOpen: false });
  const [documentoFormModal, setDocumentoFormModal] = useState<{
    isOpen: boolean;
    documentoId?: number;
  }>({ isOpen: false });
  const [documentoDetailModal, setDocumentoDetailModal] = useState<{
    isOpen: boolean;
    documentoId: number | null;
  }>({ isOpen: false, documentoId: null });

  // Modal state - firmas
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    firmaId: number | null;
    firmaRol?: string;
  }>({ isOpen: false, firmaId: null });
  const [rechazoModal, setRechazoModal] = useState<{
    isOpen: boolean;
    firmaId: number | null;
  }>({ isOpen: false, firmaId: null });
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Handlers de firma
  const handleFirmar = useCallback((firmaId: number, rolDisplay?: string) => {
    setSignatureModal({ isOpen: true, firmaId, firmaRol: rolDisplay });
  }, []);

  const handleRechazar = useCallback((firmaId: number) => {
    setRechazoModal({ isOpen: true, firmaId });
    setMotivoRechazo('');
  }, []);

  const handleSignatureSave = useCallback(
    async (signatureData: SignatureData) => {
      if (!signatureModal.firmaId) return;
      try {
        await firmarDocumento({
          firmaId: signatureModal.firmaId,
          signatureData,
        });
        toast.success('Documento firmado exitosamente');
        setSignatureModal({ isOpen: false, firmaId: null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al firmar';
        toast.error(msg);
      }
    },
    [signatureModal.firmaId, firmarDocumento]
  );

  const handleRechazoConfirm = useCallback(async () => {
    if (!rechazoModal.firmaId || !motivoRechazo.trim()) return;
    try {
      await rechazarFirma({
        firmaId: rechazoModal.firmaId,
        motivo: motivoRechazo.trim(),
      });
      toast.success('Firma rechazada');
      setRechazoModal({ isOpen: false, firmaId: null });
      setMotivoRechazo('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al rechazar';
      toast.error(msg);
    }
  }, [rechazoModal.firmaId, motivoRechazo, rechazarFirma]);

  if (!activeSection && sectionsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse-subtle" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestión Documental"
        description={
          activeSectionData.description ||
          'Control documental ISO: tipos, documentos, versiones, firmas y distribución'
        }
      />

      <DynamicSections
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
        isLoading={sectionsLoading}
        variant="underline"
        moduleColor={moduleColor}
      />

      {activeSection && (
        <GestionDocumentalTab
          activeSection={activeSection}
          onCreateTipo={() => setTipoFormModal({ isOpen: true })}
          onEditTipo={(tipo) => setTipoFormModal({ isOpen: true, tipo })}
          onCreatePlantilla={() => setPlantillaFormModal({ isOpen: true })}
          onEditPlantilla={(plantilla) => setPlantillaFormModal({ isOpen: true, plantilla })}
          onCreateDocumento={() => setDocumentoFormModal({ isOpen: true })}
          onEditDocumento={(id) => setDocumentoFormModal({ isOpen: true, documentoId: id })}
          onViewDocumento={(id) => setDocumentoDetailModal({ isOpen: true, documentoId: id })}
          onFirmar={handleFirmar}
          onRechazar={handleRechazar}
        />
      )}

      {/* Modales - Documentos */}
      <TipoDocumentoFormModal
        isOpen={tipoFormModal.isOpen}
        onClose={() => setTipoFormModal({ isOpen: false })}
        tipo={tipoFormModal.tipo}
      />

      <PlantillaFormModal
        isOpen={plantillaFormModal.isOpen}
        onClose={() => setPlantillaFormModal({ isOpen: false })}
        plantilla={plantillaFormModal.plantilla}
      />

      <DocumentoFormModal
        isOpen={documentoFormModal.isOpen}
        onClose={() => setDocumentoFormModal({ isOpen: false })}
        documentoId={documentoFormModal.documentoId}
      />

      <DocumentoDetailModal
        isOpen={documentoDetailModal.isOpen}
        onClose={() => setDocumentoDetailModal({ isOpen: false, documentoId: null })}
        documentoId={documentoDetailModal.documentoId}
      />

      {/* Modal - Firma Digital */}
      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={() => setSignatureModal({ isOpen: false, firmaId: null })}
        onSave={handleSignatureSave}
        title={signatureModal.firmaRol ? `Firma de ${signatureModal.firmaRol}` : 'Firma Digital'}
        description="Firme el documento usando el canvas. Su firma sera registrada con hash SHA-256."
        userName={user?.full_name || user?.first_name || 'Usuario'}
        userEmail={user?.email}
        userId={user?.id}
        isLoading={isFirmando}
        calculateHash
      />

      {/* Modal - Rechazo de Firma */}
      <ConfirmDialog
        isOpen={rechazoModal.isOpen}
        onClose={() => {
          setRechazoModal({ isOpen: false, firmaId: null });
          setMotivoRechazo('');
        }}
        onConfirm={handleRechazoConfirm}
        title="Rechazar Firma"
        message={
          <div className="space-y-3">
            <p>Indique el motivo del rechazo. El documento sera devuelto al elaborador.</p>
            <Textarea
              rows={3}
              placeholder="Motivo del rechazo (minimo 5 caracteres)..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            />
          </div>
        }
        confirmText={isRechazando ? 'Rechazando...' : 'Rechazar'}
        variant="danger"
        isLoading={isRechazando}
      />
    </div>
  );
};

export default GestionDocumentalPage;
