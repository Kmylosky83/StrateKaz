/**
 * MisDocumentos - Tab de documentos para contratistas externos
 *
 * Permite al contratista:
 * - Ver documentos asignados para firma
 * - Consultar documentos firmados
 * - Descargar documentos de contrato
 * - Ver estado de workflows pendientes
 */

import { FolderOpen, FileSignature, Download, Clock } from 'lucide-react';
import { Card, EmptyState } from '@/components/common';

export function MisDocumentos() {
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileSignature className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pendientes de firma</p>
            <p className="text-lg font-semibold text-gray-900">0</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Documentos disponibles</p>
            <p className="text-lg font-semibold text-gray-900">0</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Workflows activos</p>
            <p className="text-lg font-semibold text-gray-900">0</p>
          </div>
        </Card>
      </div>

      {/* Lista de documentos */}
      <Card className="p-6">
        <EmptyState
          icon={<FolderOpen className="w-12 h-12" />}
          title="Sin documentos pendientes"
          description="Cuando se le asignen documentos para firmar o consultar, aparecerán aquí."
        />
      </Card>
    </div>
  );
}
