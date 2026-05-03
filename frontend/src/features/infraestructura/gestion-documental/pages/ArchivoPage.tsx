/**
 * ArchivoPage — Tab Archivo top-level del módulo Gestión Documental.
 *
 * Muestra REGISTROS auto-archivados desde módulos C2 (vouchers SC,
 * liquidaciones, evidencias HSEQ futuro) — diferenciados de los DOCUMENTOS
 * vivos del SGI (Repositorio).
 *
 * Distinción ISO 9001 §7.5.2 (Documentos) vs §7.5.3 (Registros).
 *
 * Cierra parte de H-GD-archivo-vs-repositorio (registrado 2026-05-02).
 *
 * Patrón Anti-Corruption Layer:
 *   - GD muestra metadata propia (codigo, titulo, modulo_origen, fecha)
 *   - GenericFK referencia_origen resuelve el objeto C2 LAZY al click
 *   - GD nunca importa modelos de C2
 *
 * Filtro backend: ?seccion=archivo (es_auto_generado=True).
 */
import { useMemo, useState } from 'react';
import { Archive, ExternalLink, Search } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Card, EmptyState, Spinner, Badge } from '@/components/common';
import { Input } from '@/components/forms';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import type { ResponsiveTableColumn } from '@/components/common/ResponsiveTable';

import { useDocumentos } from '../hooks/useGestionDocumental';
import type { Documento } from '../types/gestion-documental.types';
import { DocumentoDetailModal } from '../components/DocumentoDetailModal';

const MODULO_LABELS: Record<string, string> = {
  supply_chain: 'Cadena de Suministro',
  hseq: 'HSEQ',
  talento_humano: 'Talento Humano',
  pesv: 'PESV',
  accounting: 'Contabilidad',
  sales_crm: 'Ventas / CRM',
};

function formatModuloLabel(codigo?: string): string {
  if (!codigo) return 'Sin origen';
  return MODULO_LABELS[codigo] ?? codigo;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
}

export const ArchivoPage = () => {
  const [busqueda, setBusqueda] = useState('');
  const [moduloFiltro, setModuloFiltro] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    documentoId: number | null;
  }>({ isOpen: false, documentoId: null });

  // Filtro backend: solo registros auto-archivados desde C2.
  // La búsqueda full-text se delega al backend con tsvector cuando ≥3 chars.
  const { data: documentos = [], isLoading } = useDocumentos({
    seccion: 'archivo',
    buscar: busqueda.trim().length >= 3 ? busqueda.trim() : undefined,
    ordering: '-created_at',
  });

  // Filtro local por módulo origen (más rápido que round-trip al backend).
  const filtered = useMemo<Documento[]>(() => {
    if (!moduloFiltro) return documentos;
    return documentos.filter((d) => d.modulo_origen === moduloFiltro);
  }, [documentos, moduloFiltro]);

  // Lista de módulos presentes en los datos para chips dinámicos.
  const modulosPresentes = useMemo(() => {
    const set = new Set<string>();
    documentos.forEach((d) => {
      if (d.modulo_origen) set.add(d.modulo_origen);
    });
    return Array.from(set).sort();
  }, [documentos]);

  const columns: ResponsiveTableColumn<Documento>[] = [
    {
      key: 'codigo',
      label: 'Código',
      render: (doc) => (
        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{doc.codigo}</span>
      ),
    },
    {
      key: 'titulo',
      label: 'Título',
      render: (doc) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900 dark:text-white">{doc.titulo}</div>
          {doc.tipo_documento_nombre && (
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {doc.tipo_documento_nombre}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'modulo_origen',
      label: 'Origen',
      render: (doc) => (
        <Badge variant="info" size="sm">
          <ExternalLink className="w-3 h-3 mr-1" />
          {formatModuloLabel(doc.modulo_origen)}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Archivado',
      render: (doc) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(doc.created_at)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (doc) => (
        <Badge variant={doc.estado === 'ARCHIVADO' ? 'success' : 'gray'} size="sm">
          {doc.estado}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Archivo de Registros"
        description="Registros operativos auto-archivados desde módulos del sistema. Trazabilidad por módulo origen, control de retención TRD."
      />

      <Card variant="bordered" padding="md" className="mt-4">
        {/* Toolbar: búsqueda + chips por módulo */}
        <div className="flex flex-col gap-3 mb-4">
          <Input
            type="search"
            placeholder="Buscar por código, título o contenido (≥3 caracteres)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          {modulosPresentes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setModuloFiltro(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  moduloFiltro === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Todos ({documentos.length})
              </button>
              {modulosPresentes.map((mod) => {
                const count = documentos.filter((d) => d.modulo_origen === mod).length;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setModuloFiltro(mod)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      moduloFiltro === mod
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {formatModuloLabel(mod)} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Listado */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Archive className="w-12 h-12" />}
            title="Sin registros archivados"
            description={
              busqueda || moduloFiltro
                ? 'Ningún registro coincide con los filtros aplicados.'
                : 'Cuando los módulos del sistema (Cadena de Suministro, HSEQ, etc.) generen registros operativos, aparecerán aquí automáticamente.'
            }
          />
        ) : (
          <ResponsiveTable
            data={filtered}
            columns={columns}
            keyExtractor={(doc) => doc.id}
            onRowClick={(doc) => setDetailModal({ isOpen: true, documentoId: doc.id })}
          />
        )}
      </Card>

      <DocumentoDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, documentoId: null })}
        documentoId={detailModal.documentoId}
      />
    </>
  );
};

export default ArchivoPage;
