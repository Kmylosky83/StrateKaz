/**
 * BibliotecaSection — Plantillas maestras de la biblioteca compartida (Fase 8).
 * Grid de plantillas con filtros por industria, categoría, norma ISO.
 * Botón "Importar" copia la plantilla al tenant actual.
 */
import { useState } from 'react';
import { BookOpen, Download, Search, Filter } from 'lucide-react';
import { Card, Button, Badge, Spinner, EmptyState } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { useBibliotecaPlantillas, useImportarPlantilla } from '../hooks/useGestionDocumental';
import { CATEGORIA_LABELS, INDUSTRIA_LABELS } from '../types/gestion-documental.types';
import type { CategoriaPlantilla, IndustriaPlantilla } from '../types/gestion-documental.types';

const CATEGORIA_OPTIONS = Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const INDUSTRIA_OPTIONS = Object.entries(INDUSTRIA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function BibliotecaSection() {
  const [categoria, setCategoria] = useState('');
  const [industria, setIndustria] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: plantillas = [], isLoading } = useBibliotecaPlantillas({
    categoria: categoria || undefined,
    industria: industria || undefined,
    search: searchTerm || undefined,
  });
  const importarMutation = useImportarPlantilla();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
          />
        </div>
        <Select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          options={[{ value: '', label: 'Todas las categorías' }, ...CATEGORIA_OPTIONS]}
        />
        <Select
          value={industria}
          onChange={(e) => setIndustria(e.target.value)}
          options={[{ value: '', label: 'Todas las industrias' }, ...INDUSTRIA_OPTIONS]}
        />
      </div>

      {/* Grid de plantillas */}
      {plantillas.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} />}
          title="Sin plantillas disponibles"
          description="No hay plantillas en la biblioteca que coincidan con los filtros seleccionados."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plantillas.map((plantilla) => (
            <Card key={plantilla.id} className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{plantilla.nombre}</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {plantilla.codigo} | v{plantilla.version}
                  </p>
                </div>
                <Badge variant="secondary">{plantilla.tipo_documento_codigo}</Badge>
              </div>

              {plantilla.descripcion && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {plantilla.descripcion}
                </p>
              )}

              <div className="mb-3 flex flex-wrap gap-1">
                <Badge variant="info">
                  {CATEGORIA_LABELS[plantilla.categoria as CategoriaPlantilla] ||
                    plantilla.categoria}
                </Badge>
                <Badge variant="gray">
                  {INDUSTRIA_LABELS[plantilla.industria as IndustriaPlantilla] ||
                    plantilla.industria}
                </Badge>
                {plantilla.norma_iso_codigo && (
                  <Badge variant="primary">{plantilla.norma_iso_codigo}</Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => importarMutation.mutate(plantilla.id)}
                disabled={importarMutation.isPending}
              >
                {importarMutation.isPending ? 'Importando...' : 'Importar al sistema'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
