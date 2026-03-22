/**
 * MiFirmaDigital - Sección de firma guardada en Mi Portal
 *
 * Permite al usuario:
 * - Ver su firma guardada
 * - Dibujar y guardar una firma nueva
 * - Dibujar y guardar iniciales
 * - Eliminar firma/iniciales guardadas
 *
 * Similar a Adobe Sign "Adoptar firma".
 */

import { useState, useRef, useCallback } from 'react';
import { PenTool, Trash2, Save, RotateCcw, Type } from 'lucide-react';
import { Card, Button, Badge, Spinner } from '@/components/common';
import { SignaturePad } from '@/components/forms';
import type { SignaturePadRef } from '@/components/forms/SignaturePad';
import { useFirmaGuardada, useGuardarFirma } from '../api/miPortalApi';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

type DrawMode = 'firma' | 'iniciales' | null;

export function MiFirmaDigital() {
  const { primaryColor } = useBrandingConfig();
  const { data, isLoading } = useFirmaGuardada();
  const guardarMutation = useGuardarFirma();

  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const signatureRef = useRef<SignaturePadRef>(null);

  const handleSave = useCallback(() => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return;

    const dataUrl = signatureRef.current.getDataURL();

    if (drawMode === 'firma') {
      guardarMutation.mutate({ firma_guardada: dataUrl });
    } else if (drawMode === 'iniciales') {
      guardarMutation.mutate({ iniciales_guardadas: dataUrl });
    }

    setDrawMode(null);
  }, [drawMode, guardarMutation]);

  const handleDelete = useCallback(
    (type: 'firma' | 'iniciales') => {
      if (type === 'firma') {
        guardarMutation.mutate({ firma_guardada: null });
      } else {
        guardarMutation.mutate({ iniciales_guardadas: null });
      }
    },
    [guardarMutation]
  );

  const handleCancel = useCallback(() => {
    setDrawMode(null);
  }, []);

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <PenTool className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mi Firma Digital
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Guarde su firma manuscrita para agilizar la firma de documentos. Al firmar un
              documento, podr&aacute; usar su firma guardada en lugar de dibujarla cada vez.
            </p>
          </div>
        </div>
      </Card>

      {/* Drawing mode */}
      {drawMode && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                {drawMode === 'firma' ? 'Dibujar Firma' : 'Dibujar Iniciales'}
              </h4>
              <Badge variant="info" size="sm">
                {drawMode === 'firma' ? 'Firma completa' : 'Solo iniciales'}
              </Badge>
            </div>

            <SignaturePad
              ref={signatureRef}
              height={drawMode === 'iniciales' ? 120 : 180}
              placeholder={
                drawMode === 'firma'
                  ? 'Dibuje su firma aqu\u00ed'
                  : 'Dibuje sus iniciales aqu\u00ed'
              }
              showGrid
              required
            />

            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={guardarMutation.isPending}
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-4 h-4 mr-1.5" />
                Guardar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Saved Signatures Grid */}
      {!drawMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firma */}
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Firma Manuscrita
                </h4>
                {data?.firma_guardada && (
                  <Badge variant="success" size="sm">
                    Guardada
                  </Badge>
                )}
              </div>

              {data?.firma_guardada ? (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <img
                    src={data.firma_guardada}
                    alt="Firma guardada"
                    className="max-h-32 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <PenTool className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tiene firma guardada
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDrawMode('firma')}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  {data?.firma_guardada ? 'Cambiar' : 'Dibujar firma'}
                </Button>
                {data?.firma_guardada && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete('firma')}
                    loading={guardarMutation.isPending}
                    title="Eliminar firma guardada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Iniciales */}
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Iniciales</h4>
                {data?.iniciales_guardadas && (
                  <Badge variant="success" size="sm">
                    Guardadas
                  </Badge>
                )}
              </div>

              {data?.iniciales_guardadas ? (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <img
                    src={data.iniciales_guardadas}
                    alt="Iniciales guardadas"
                    className="max-h-32 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Type className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tiene iniciales guardadas
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDrawMode('iniciales')}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  {data?.iniciales_guardadas ? 'Cambiar' : 'Dibujar iniciales'}
                </Button>
                {data?.iniciales_guardadas && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete('iniciales')}
                    loading={guardarMutation.isPending}
                    title="Eliminar iniciales guardadas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
