# Guía de Implementación: Firma Digital Manuscrita

**Sistema de Gestión StrateKaz - Enterprise Multi-Tenant**

**Fecha:** 2026-01-08
**Versión:** 1.0.0
**Autor:** Arquitecto de Sistema

---

## 📋 Tabla de Contenidos

1. [Comparativa de Librerías React](#1-comparativa-de-librerías-react)
2. [Recomendación y Justificación](#2-recomendación-y-justificación)
3. [Implementación Frontend](#3-implementación-frontend)
4. [Implementación Backend Django](#4-implementación-backend-django)
5. [Seguridad y Almacenamiento](#5-seguridad-y-almacenamiento)
6. [Integración con Formularios](#6-integración-con-formularios)
7. [Casos de Uso Específicos](#7-casos-de-uso-específicos)
8. [Testing](#8-testing)

---

## 1. Comparativa de Librerías React

### 1.1. react-signature-canvas

**NPM:** [react-signature-canvas](https://www.npmjs.com/package/react-signature-canvas)

#### Estadísticas (Enero 2026)
- **Descargas semanales:** ~540,000
- **GitHub Stars:** ~625
- **Última actualización:** 9 meses atrás (mayo 2025)
- **Versión actual:** 1.1.0-alpha.2
- **Bundle size (minified + gzipped):** ~6.2 KB

#### Características
- ✅ Wrapper React de signature_pad (librería vanilla estable)
- ✅ TypeScript support nativo (`@types/react-signature-canvas`)
- ✅ 100% test coverage
- ✅ Soporte móvil/touch completo (hereda de signature_pad)
- ✅ Exportación PNG/JPEG/SVG/Base64
- ✅ Métodos: `clear()`, `isEmpty()`, `toDataURL()`, `fromDataURL()`
- ✅ Control de velocidad y ancho de trazo
- ⚠️ No incluye undo/redo out-of-the-box (se puede implementar)
- ⚠️ Dark mode requiere configuración manual

#### Ventajas
- Librería más popular y probada en producción
- Excelente rendimiento en móviles
- API simple y directa
- Curva de aprendizaje baja
- Mantenimiento activo de la comunidad

#### Desventajas
- Alpha version (aunque estable en producción)
- Undo/redo requiere implementación manual
- Configuración de estilos limitada

---

### 1.2. signature_pad (vanilla JS)

**NPM:** [signature_pad](https://www.npmjs.com/package/signature_pad)

#### Estadísticas
- **Descargas semanales:** ~750,000+
- **GitHub Stars:** ~3,700+
- **Bundle size:** ~4.8 KB (minified + gzipped)

#### Características
- ✅ Librería vanilla JavaScript (framework-agnostic)
- ✅ TypeScript definitions incluidas
- ✅ Algoritmo Bézier de suavizado de líneas
- ✅ Soporte móvil/touch nativo
- ✅ Pressure sensitivity en dispositivos compatibles
- ✅ API limpia y moderna

#### Ventajas
- Base sólida y madura (usada por react-signature-canvas)
- Excelente rendimiento
- Más ligera que wrappers React
- Control total sobre implementación

#### Desventajas
- Requiere más código para integración con React
- Manejo manual de refs y lifecycle

---

### 1.3. @uiw/react-signature

**NPM:** [@uiw/react-signature](https://www.npmjs.com/package/@uiw/react-signature)

#### Estadísticas
- **Descargas semanales:** ~12,000
- **GitHub Stars:** ~200+ (parte de uiw ecosystem)
- **Bundle size:** ~8.5 KB

#### Características
- ✅ TypeScript support
- ✅ Parte del ecosistema uiw (componentes React)
- ✅ Exportación PNG/SVG
- ⚠️ Menos adoptado que react-signature-canvas
- ⚠️ Documentación limitada

#### Ventajas
- Integración con otros componentes uiw
- Estilo moderno

#### Desventajas
- Menor adopción en la comunidad
- Bundle size más grande
- Menos ejemplos y recursos

---

### 1.4. react-signature-pad

**NPM:** [react-signature-pad](https://www.npmjs.com/package/react-signature-pad)

#### Estadísticas
- **Descargas semanales:** ~3,200
- **GitHub Stars:** ~163
- **Última versión:** 0.0.6 (hace 9 años)

#### Evaluación
- ❌ **OBSOLETO** - No actualizado desde 2016
- ❌ No usar en proyectos nuevos
- ❌ Sin soporte para React moderno (hooks)

---

### 1.5. Otras opciones consideradas

#### Syncfusion React Signature
- ✅ Enterprise-grade con licencia comercial
- ✅ Soporte profesional
- ❌ Requiere licencia paga (~$995/dev/año)
- ❌ Bundle size muy grande (~200KB+)
- ❌ Overkill para casos de uso simples

---

## 2. Recomendación y Justificación

### ⭐ Recomendación: **react-signature-canvas**

#### Justificación para Sistema Enterprise Multi-Tenant

1. **Adopción Masiva**
   - 540K descargas/semana demuestran confianza de la comunidad
   - Usado en producción por miles de empresas
   - Ecosystem maduro con soluciones a problemas comunes

2. **Rendimiento**
   - Bundle size óptimo (~6.2 KB)
   - Excelente performance en móviles
   - No impacta negativamente el FCP (First Contentful Paint)

3. **TypeScript Support**
   - Types nativos disponibles
   - Integración perfecta con nuestro stack TypeScript + React

4. **Mantenimiento**
   - Fork activamente mantenido de react-signature-pad
   - 100% test coverage
   - Comunidad respondiendo issues

5. **Mobile-First**
   - Touch events nativos
   - Responsive out-of-the-box
   - Funciona perfectamente en tablets para inspecciones de campo

6. **Integración con React Hook Form**
   - API simple basada en refs
   - Fácil integración con nuestro stack (RHF + Zod)

7. **Extensibilidad**
   - Permite implementar features custom (undo/redo)
   - Configuración de estilos flexible
   - Dark mode implementable

8. **Costo-Beneficio**
   - Open source (MIT License)
   - No requiere licencia
   - Comunidad grande para soporte

#### Comparación Final

| Criterio | react-signature-canvas | signature_pad | @uiw/react-signature |
|----------|------------------------|---------------|----------------------|
| Popularidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| TypeScript | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| React Integration | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Bundle Size | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Mobile Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Documentation | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Enterprise Ready | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 3. Implementación Frontend

### 3.1. Instalación

```bash
# Instalar react-signature-canvas
npm install react-signature-canvas

# Instalar types (si no incluye)
npm install --save-dev @types/react-signature-canvas
```

### 3.2. Componente Base Reutilizable

**Ubicación:** `frontend/src/components/forms/SignaturePad.tsx`

```typescript
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/Button';
import { Undo2, Trash2, Download, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SignaturePadProps {
  /**
   * Valor inicial de la firma (Base64)
   */
  value?: string | null;

  /**
   * Callback cuando cambia la firma
   */
  onChange?: (signature: string | null) => void;

  /**
   * Si la firma es requerida
   */
  required?: boolean;

  /**
   * Ancho del canvas (responsive si no se especifica)
   */
  width?: number;

  /**
   * Alto del canvas
   */
  height?: number;

  /**
   * Color de la línea de firma
   */
  penColor?: string;

  /**
   * Ancho mínimo del trazo
   */
  minWidth?: number;

  /**
   * Ancho máximo del trazo
   */
  maxWidth?: number;

  /**
   * Clase CSS adicional
   */
  className?: string;

  /**
   * Deshabilitar edición
   */
  disabled?: boolean;

  /**
   * Mostrar botón de descarga
   */
  showDownload?: boolean;

  /**
   * Label opcional
   */
  label?: string;

  /**
   * Mensaje de error
   */
  error?: string;

  /**
   * Dark mode
   */
  darkMode?: boolean;
}

export interface SignaturePadHandle {
  /**
   * Obtiene la firma como Base64
   */
  getSignature: () => string | null;

  /**
   * Limpia la firma
   */
  clear: () => void;

  /**
   * Verifica si está vacía
   */
  isEmpty: () => boolean;

  /**
   * Establece una firma desde Base64
   */
  setSignature: (dataURL: string) => void;

  /**
   * Descarga la firma como PNG
   */
  download: (filename?: string) => void;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  (
    {
      value,
      onChange,
      required = false,
      width,
      height = 200,
      penColor,
      minWidth = 0.5,
      maxWidth = 2.5,
      className,
      disabled = false,
      showDownload = false,
      label,
      error,
      darkMode = false,
    },
    ref
  ) => {
    const signatureRef = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const [hasChanged, setHasChanged] = useState(false);
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [canvasWidth, setCanvasWidth] = useState(width || 500);

    // Auto-detect container width for responsive canvas
    useEffect(() => {
      if (!width && containerRef.current) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const newWidth = entry.contentRect.width;
            if (newWidth > 0) {
              setCanvasWidth(newWidth);
            }
          }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
      }
    }, [width]);

    // Cargar firma inicial
    useEffect(() => {
      if (value && signatureRef.current && !hasChanged) {
        try {
          signatureRef.current.fromDataURL(value);
          setIsEmpty(false);
        } catch (error) {
          console.error('Error loading signature:', error);
        }
      }
    }, [value, hasChanged]);

    // Imperativo handle para controlar desde fuera
    useImperativeHandle(ref, () => ({
      getSignature: () => {
        if (!signatureRef.current || signatureRef.current.isEmpty()) {
          return null;
        }
        return signatureRef.current.toDataURL('image/png');
      },
      clear: handleClear,
      isEmpty: () => isEmpty,
      setSignature: (dataURL: string) => {
        if (signatureRef.current) {
          signatureRef.current.fromDataURL(dataURL);
          setIsEmpty(false);
          setHasChanged(true);
        }
      },
      download: handleDownload,
    }));

    const handleBegin = () => {
      // Guardar estado para undo
      if (signatureRef.current) {
        const currentData = signatureRef.current.toDataURL();
        setUndoStack((prev) => [...prev, currentData]);
        // Limitar stack a últimos 10 estados
        if (undoStack.length > 10) {
          setUndoStack((prev) => prev.slice(-10));
        }
      }
    };

    const handleEnd = () => {
      if (signatureRef.current) {
        const newIsEmpty = signatureRef.current.isEmpty();
        setIsEmpty(newIsEmpty);
        setHasChanged(true);

        if (!newIsEmpty) {
          const signature = signatureRef.current.toDataURL('image/png');
          onChange?.(signature);
        } else {
          onChange?.(null);
        }
      }
    };

    const handleClear = () => {
      if (signatureRef.current) {
        signatureRef.current.clear();
        setIsEmpty(true);
        setHasChanged(true);
        setUndoStack([]);
        onChange?.(null);
      }
    };

    const handleUndo = () => {
      if (undoStack.length > 0 && signatureRef.current) {
        const previousState = undoStack[undoStack.length - 1];
        setUndoStack((prev) => prev.slice(0, -1));

        if (previousState) {
          signatureRef.current.fromDataURL(previousState);
        } else {
          signatureRef.current.clear();
        }

        setIsEmpty(signatureRef.current.isEmpty());
        setHasChanged(true);

        const signature = signatureRef.current.isEmpty()
          ? null
          : signatureRef.current.toDataURL('image/png');
        onChange?.(signature);
      }
    };

    const handleDownload = (filename?: string) => {
      if (signatureRef.current && !isEmpty) {
        const dataURL = signatureRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename || `firma_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
      }
    };

    const effectivePenColor = penColor || (darkMode ? '#ffffff' : '#000000');
    const backgroundColor = darkMode ? '#1f2937' : '#ffffff';

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div
          ref={containerRef}
          className={cn(
            'border-2 rounded-lg overflow-hidden transition-colors',
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ backgroundColor }}
        >
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: canvasWidth,
              height: height,
              className: 'touch-none',
              style: { width: '100%', height: `${height}px` },
            }}
            penColor={effectivePenColor}
            minWidth={minWidth}
            maxWidth={maxWidth}
            onBegin={handleBegin}
            onEnd={handleEnd}
            clearOnResize={false}
            velocityFilterWeight={0.7}
            throttle={16}
            minDistance={3}
            dotSize={1}
            backgroundColor={backgroundColor}
          />
        </div>

        {/* Toolbar */}
        {!disabled && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Deshacer"
            >
              <Undo2 className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isEmpty}
              title="Limpiar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {showDownload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownload()}
                disabled={isEmpty}
                title="Descargar"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {!isEmpty && (
              <div className="flex items-center text-sm text-green-600 dark:text-green-400 ml-auto">
                <Check className="h-4 w-4 mr-1" />
                <span>Firmado</span>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {required && isEmpty && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Firma requerida. Por favor, firme en el espacio superior.
          </p>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
```

### 3.3. Modal de Firma

**Ubicación:** `frontend/src/components/forms/SignatureModal.tsx`

```typescript
import React, { useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { SignaturePad, SignaturePadHandle } from './SignaturePad';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface SignatureModalProps {
  /**
   * Estado del modal (abierto/cerrado)
   */
  isOpen: boolean;

  /**
   * Callback al cerrar
   */
  onClose: () => void;

  /**
   * Callback al confirmar firma
   */
  onConfirm: (signature: string) => void;

  /**
   * Valor inicial de la firma
   */
  initialValue?: string | null;

  /**
   * Título del modal
   */
  title?: string;

  /**
   * Descripción del modal
   */
  description?: string;

  /**
   * Metadata adicional a mostrar
   */
  metadata?: {
    document?: string;
    user?: string;
    timestamp?: string;
  };
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialValue,
  title = 'Firma Digital',
  description = 'Por favor, firme en el espacio inferior para confirmar.',
  metadata,
}) => {
  const signatureRef = useRef<SignaturePadHandle>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (signatureRef.current) {
      if (signatureRef.current.isEmpty()) {
        setError('La firma es requerida');
        return;
      }

      const signature = signatureRef.current.getSignature();
      if (signature) {
        onConfirm(signature);
        onClose();
        setError(null);
      }
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </Dialog.Description>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Metadata */}
          {metadata && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {metadata.document && (
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Documento</dt>
                    <dd className="text-gray-900 dark:text-white mt-1">{metadata.document}</dd>
                  </div>
                )}
                {metadata.user && (
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Usuario</dt>
                    <dd className="text-gray-900 dark:text-white mt-1">{metadata.user}</dd>
                  </div>
                )}
                {metadata.timestamp && (
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Fecha</dt>
                    <dd className="text-gray-900 dark:text-white mt-1">{metadata.timestamp}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Signature Pad */}
          <div className="p-6">
            <SignaturePad
              ref={signatureRef}
              value={initialValue}
              height={250}
              error={error || undefined}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Confirmar Firma
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
```

### 3.4. Integración con React Hook Form

```typescript
import React, { useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SignaturePad, SignaturePadHandle } from '@/components/forms/SignaturePad';
import { Button } from '@/components/ui/Button';

// Schema de validación
const formSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  documento: z.string().min(1, 'Documento requerido'),
  cargo: z.string().optional(),
  firma: z.string().min(1, 'La firma es requerida'),
  acepta_terminos: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar los términos y condiciones',
  }),
});

type FormData = z.infer<typeof formSchema>;

export const FormularioConFirma: React.FC = () => {
  const signatureRef = useRef<SignaturePadHandle>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      documento: '',
      cargo: '',
      firma: '',
      acepta_terminos: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log('Datos del formulario:', data);

    // Aquí enviarías los datos al backend
    // El campo firma contiene el Base64 de la imagen
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
        <input
          type="text"
          {...register('nombre')}
          className="w-full border rounded px-3 py-2"
        />
        {errors.nombre && (
          <p className="text-sm text-red-600 mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Documento *</label>
        <input
          type="text"
          {...register('documento')}
          className="w-full border rounded px-3 py-2"
        />
        {errors.documento && (
          <p className="text-sm text-red-600 mt-1">{errors.documento.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cargo</label>
        <input
          type="text"
          {...register('cargo')}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Signature Field con Controller */}
      <Controller
        name="firma"
        control={control}
        render={({ field }) => (
          <SignaturePad
            ref={signatureRef}
            label="Firma Digital"
            required
            value={field.value}
            onChange={(signature) => field.onChange(signature || '')}
            error={errors.firma?.message}
            showDownload
          />
        )}
      />

      <div className="flex items-start">
        <input
          type="checkbox"
          {...register('acepta_terminos')}
          className="mt-1 mr-2"
        />
        <label className="text-sm">
          Acepto los términos y condiciones, y certifico que la información proporcionada es
          verídica.
        </label>
      </div>
      {errors.acepta_terminos && (
        <p className="text-sm text-red-600">{errors.acepta_terminos.message}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => signatureRef.current?.clear()}>
          Limpiar Firma
        </Button>
        <Button type="submit">Enviar Formulario</Button>
      </div>
    </form>
  );
};
```

---

## 4. Implementación Backend Django

### 4.1. Modelo de Firma Digital Reutilizable

**Ubicación:** `backend/apps/core/models/signature.py`

```python
"""
Modelo de Firma Digital Reutilizable
Sistema de Gestión StrateKaz

Modelo abstracto y concreto para firmas digitales manuscritas con:
- Almacenamiento eficiente (Base64 optimizado o archivo)
- Hash SHA-256 para verificación de integridad
- Metadatos completos (usuario, IP, timestamp, dispositivo)
- Geolocalización (opcional)
- Auditoría completa
- Verificación criptográfica
"""

import hashlib
import base64
from typing import Optional, Dict, Any
from PIL import Image
from io import BytesIO
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from django.contrib.postgres.fields import JSONField  # PostgreSQL
# from django.db.models import JSONField  # Django 3.1+ (SQLite/MySQL)
from apps.core.base_models import BaseCompanyModel, AuditModel


class SignatureMetadata(models.Model):
    """
    Modelo abstracto con metadata común para firmas digitales.
    """

    # Hash de integridad (SHA-256)
    signature_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name='Hash de Firma',
        help_text='SHA-256 hash de la firma para verificación de integridad'
    )

    # Información del dispositivo
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent',
        help_text='Información del navegador/dispositivo usado para firmar'
    )
    ip_address = models.GenericIPAddressField(
        verbose_name='Dirección IP',
        help_text='IP desde donde se realizó la firma'
    )
    device_info = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Información del Dispositivo',
        help_text='Detalles adicionales del dispositivo (OS, browser, screen size, etc.)'
    )

    # Geolocalización (opcional)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        verbose_name='Latitud',
        help_text='Latitud geográfica donde se realizó la firma'
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        verbose_name='Longitud',
        help_text='Longitud geográfica donde se realizó la firma'
    )

    # Timestamps
    signed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha y Hora de Firma',
        help_text='Timestamp exacto de cuando se realizó la firma'
    )

    # Verificación
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Verificada',
        help_text='Indica si la firma ha sido verificada criptográficamente'
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación',
        help_text='Timestamp de cuando se verificó la firma'
    )

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['signature_hash', 'signed_at']),
            models.Index(fields=['ip_address', 'signed_at']),
            models.Index(fields=['is_verified', 'signed_at']),
        ]


class DigitalSignature(BaseCompanyModel, SignatureMetadata):
    """
    Modelo concreto para almacenar firmas digitales manuscritas.

    Características:
    - Multi-tenant (hereda empresa de BaseCompanyModel)
    - Auditoría completa (created_by, updated_by)
    - Soft delete (is_active, deleted_at)
    - Almacenamiento optimizado (Base64 o archivo)
    - Hash SHA-256 para integridad
    - Metadata completa
    """

    # Tipo de firma
    class SignatureType(models.TextChoices):
        DOCUMENTO = 'DOC', 'Firma de Documento'
        ACTA = 'ACT', 'Firma de Acta'
        INSPECCION = 'INS', 'Firma de Inspección'
        CAPACITACION = 'CAP', 'Firma de Capacitación'
        ASISTENCIA = 'ASI', 'Firma de Asistencia'
        REVISION = 'REV', 'Firma de Revisión'
        APROBACION = 'APR', 'Firma de Aprobación'
        ENTREGA = 'ENT', 'Firma de Entrega/Recibido'
        OTRO = 'OTR', 'Otro'

    # Identificador del recurso firmado (Generic FK simulation)
    content_type = models.CharField(
        max_length=100,
        verbose_name='Tipo de Contenido',
        help_text='Tipo de modelo firmado (ej: Incident, Document, etc.)'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID del Objeto',
        help_text='ID del registro firmado'
    )

    # Tipo de firma
    signature_type = models.CharField(
        max_length=3,
        choices=SignatureType.choices,
        default=SignatureType.OTRO,
        db_index=True,
        verbose_name='Tipo de Firma'
    )

    # Firmante (puede ser diferente de created_by)
    signer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='signatures_as_signer',
        verbose_name='Firmante',
        help_text='Usuario que realizó la firma (quien firmó el documento)'
    )
    signer_name = models.CharField(
        max_length=200,
        verbose_name='Nombre del Firmante',
        help_text='Nombre completo del firmante (cached para histórico)'
    )
    signer_document = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Documento del Firmante',
        help_text='Número de identificación del firmante'
    )
    signer_position = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Cargo del Firmante',
        help_text='Cargo o posición del firmante'
    )

    # Almacenamiento: Opción 1 - Base64 (para firmas pequeñas, <100KB)
    signature_base64 = models.TextField(
        blank=True,
        verbose_name='Firma (Base64)',
        help_text='Firma codificada en Base64 (PNG). Usar para firmas pequeñas.'
    )

    # Almacenamiento: Opción 2 - Archivo (para firmas grandes o cuando se requiere storage)
    signature_file = models.FileField(
        upload_to='signatures/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name='Archivo de Firma',
        help_text='Archivo PNG de la firma. Usar para firmas grandes o almacenamiento en S3.'
    )

    # Dimensiones de la imagen (para validación)
    image_width = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Ancho de Imagen'
    )
    image_height = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Alto de Imagen'
    )
    file_size_bytes = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Tamaño de Archivo',
        help_text='Tamaño en bytes'
    )

    # Contexto adicional
    context_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos de Contexto',
        help_text='Información adicional sobre el contexto de la firma'
    )

    # Comentarios/notas
    notes = models.TextField(
        blank=True,
        verbose_name='Notas',
        help_text='Comentarios adicionales sobre la firma'
    )

    class Meta:
        verbose_name = 'Firma Digital'
        verbose_name_plural = 'Firmas Digitales'
        ordering = ['-signed_at']
        indexes = [
            models.Index(fields=['empresa', 'content_type', 'object_id']),
            models.Index(fields=['empresa', 'signer', '-signed_at']),
            models.Index(fields=['empresa', 'signature_type', '-signed_at']),
            models.Index(fields=['signature_hash']),
        ]
        constraints = [
            # Al menos uno de los dos métodos de almacenamiento debe estar presente
            models.CheckConstraint(
                check=(
                    models.Q(signature_base64__isnull=False) |
                    models.Q(signature_file__isnull=False)
                ),
                name='signature_storage_required'
            )
        ]

    def __str__(self):
        return f"{self.signer_name} - {self.get_signature_type_display()} - {self.signed_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        """
        Override save para auto-calcular hash y metadatos.
        """
        # Auto-calcular hash si no existe
        if not self.signature_hash:
            self.signature_hash = self.calculate_hash()

        # Cachear nombre del firmante
        if self.signer and not self.signer_name:
            self.signer_name = self.signer.get_full_name() or self.signer.email

        # Obtener dimensiones si se usa Base64
        if self.signature_base64 and not self.image_width:
            self._extract_image_metadata_from_base64()

        # Obtener dimensiones si se usa archivo
        if self.signature_file and not self.image_width:
            self._extract_image_metadata_from_file()

        super().save(*args, **kwargs)

    def calculate_hash(self) -> str:
        """
        Calcula el hash SHA-256 de la firma.
        """
        if self.signature_base64:
            # Remover prefijo data:image si existe
            base64_data = self.signature_base64.split(',')[-1]
            image_bytes = base64.b64decode(base64_data)
        elif self.signature_file:
            self.signature_file.seek(0)
            image_bytes = self.signature_file.read()
        else:
            raise ValueError("No signature data available to hash")

        return hashlib.sha256(image_bytes).hexdigest()

    def verify_integrity(self) -> bool:
        """
        Verifica la integridad de la firma comparando el hash almacenado
        con un hash recalculado.

        Returns:
            bool: True si la firma es íntegra, False si ha sido modificada
        """
        try:
            current_hash = self.calculate_hash()
            is_valid = current_hash == self.signature_hash

            if is_valid:
                self.is_verified = True
                self.verified_at = timezone.now()
                self.save(update_fields=['is_verified', 'verified_at'])

            return is_valid
        except Exception as e:
            print(f"Error verifying signature integrity: {e}")
            return False

    def _extract_image_metadata_from_base64(self):
        """
        Extrae metadata (dimensiones, tamaño) de la imagen Base64.
        """
        try:
            # Remover prefijo data:image
            base64_data = self.signature_base64.split(',')[-1]
            image_bytes = base64.b64decode(base64_data)

            # Abrir con PIL
            image = Image.open(BytesIO(image_bytes))
            self.image_width, self.image_height = image.size
            self.file_size_bytes = len(image_bytes)
        except Exception as e:
            print(f"Error extracting image metadata: {e}")

    def _extract_image_metadata_from_file(self):
        """
        Extrae metadata (dimensiones, tamaño) del archivo.
        """
        try:
            self.signature_file.seek(0)
            image = Image.open(self.signature_file)
            self.image_width, self.image_height = image.size
            self.file_size_bytes = self.signature_file.size
        except Exception as e:
            print(f"Error extracting file metadata: {e}")

    def get_image_data_url(self) -> Optional[str]:
        """
        Retorna la firma como data URL (data:image/png;base64,...).
        Útil para renderizar en HTML/PDF.
        """
        if self.signature_base64:
            # Ya está en Base64
            if self.signature_base64.startswith('data:image'):
                return self.signature_base64
            return f"data:image/png;base64,{self.signature_base64}"

        if self.signature_file:
            # Leer archivo y convertir a Base64
            try:
                self.signature_file.seek(0)
                image_bytes = self.signature_file.read()
                base64_string = base64.b64encode(image_bytes).decode('utf-8')
                return f"data:image/png;base64,{base64_string}"
            except Exception as e:
                print(f"Error reading signature file: {e}")
                return None

        return None

    def get_signature_info(self) -> Dict[str, Any]:
        """
        Retorna información completa de la firma para auditoría.
        """
        return {
            'id': self.id,
            'signer': {
                'name': self.signer_name,
                'document': self.signer_document,
                'position': self.signer_position,
            },
            'signed_at': self.signed_at.isoformat(),
            'signature_type': self.get_signature_type_display(),
            'hash': self.signature_hash,
            'is_verified': self.is_verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'ip_address': self.ip_address,
            'device_info': self.device_info,
            'location': {
                'latitude': str(self.latitude) if self.latitude else None,
                'longitude': str(self.longitude) if self.longitude else None,
            },
            'dimensions': {
                'width': self.image_width,
                'height': self.image_height,
                'file_size': self.file_size_bytes,
            },
        }

    @classmethod
    def create_from_base64(
        cls,
        empresa,
        signer,
        signature_base64: str,
        content_type: str,
        object_id: int,
        signature_type: str,
        ip_address: str,
        user_agent: str = '',
        device_info: dict = None,
        latitude: float = None,
        longitude: float = None,
        context_data: dict = None,
        notes: str = '',
        created_by=None,
    ) -> 'DigitalSignature':
        """
        Factory method para crear firma desde Base64.

        Args:
            empresa: Instancia de EmpresaConfig
            signer: Usuario firmante
            signature_base64: Firma en Base64
            content_type: Tipo de modelo firmado
            object_id: ID del objeto firmado
            signature_type: Tipo de firma (ej: 'DOC', 'ACT')
            ip_address: IP del firmante
            user_agent: User agent del navegador
            device_info: Dict con info del dispositivo
            latitude: Latitud opcional
            longitude: Longitud opcional
            context_data: Datos de contexto adicionales
            notes: Notas opcionales
            created_by: Usuario que crea el registro (puede ser diferente del firmante)

        Returns:
            DigitalSignature: Instancia creada
        """
        signature = cls(
            empresa=empresa,
            signer=signer,
            signature_base64=signature_base64,
            content_type=content_type,
            object_id=object_id,
            signature_type=signature_type,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info or {},
            latitude=latitude,
            longitude=longitude,
            context_data=context_data or {},
            notes=notes,
            created_by=created_by or signer,
        )

        # Cachear info del firmante
        if hasattr(signer, 'profile'):
            signature.signer_document = signer.profile.document_number or ''
            signature.signer_position = signer.profile.position or ''

        signature.save()
        return signature

    @classmethod
    def create_from_file(
        cls,
        empresa,
        signer,
        signature_file,
        content_type: str,
        object_id: int,
        signature_type: str,
        ip_address: str,
        user_agent: str = '',
        device_info: dict = None,
        latitude: float = None,
        longitude: float = None,
        context_data: dict = None,
        notes: str = '',
        created_by=None,
    ) -> 'DigitalSignature':
        """
        Factory method para crear firma desde archivo.
        """
        signature = cls(
            empresa=empresa,
            signer=signer,
            signature_file=signature_file,
            content_type=content_type,
            object_id=object_id,
            signature_type=signature_type,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info or {},
            latitude=latitude,
            longitude=longitude,
            context_data=context_data or {},
            notes=notes,
            created_by=created_by or signer,
        )

        # Cachear info del firmante
        if hasattr(signer, 'profile'):
            signature.signer_document = signer.profile.document_number or ''
            signature.signer_position = signer.profile.position or ''

        signature.save()
        return signature


# ==================== HELPERS ====================

def get_client_ip(request):
    """
    Obtiene la IP real del cliente considerando proxies.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_device_info(request) -> dict:
    """
    Extrae información del dispositivo desde el request.
    """
    return {
        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
        'screen_width': request.data.get('screen_width'),
        'screen_height': request.data.get('screen_height'),
        'os': request.data.get('os'),
        'browser': request.data.get('browser'),
    }
```

### 4.2. Serializer

**Ubicación:** `backend/apps/core/serializers/signature.py`

```python
"""
Serializers para Firma Digital
"""

from rest_framework import serializers
from apps.core.models.signature import DigitalSignature


class DigitalSignatureSerializer(serializers.ModelSerializer):
    """
    Serializer completo para firmas digitales.
    """
    signer_display = serializers.SerializerMethodField()
    signature_data_url = serializers.SerializerMethodField()
    is_integrity_valid = serializers.SerializerMethodField()

    class Meta:
        model = DigitalSignature
        fields = [
            'id',
            'empresa',
            'content_type',
            'object_id',
            'signature_type',
            'signer',
            'signer_display',
            'signer_name',
            'signer_document',
            'signer_position',
            'signature_hash',
            'signature_data_url',
            'image_width',
            'image_height',
            'file_size_bytes',
            'signed_at',
            'ip_address',
            'user_agent',
            'device_info',
            'latitude',
            'longitude',
            'is_verified',
            'verified_at',
            'is_integrity_valid',
            'context_data',
            'notes',
            'created_at',
            'created_by',
        ]
        read_only_fields = [
            'signature_hash',
            'image_width',
            'image_height',
            'file_size_bytes',
            'signed_at',
            'is_verified',
            'verified_at',
        ]

    def get_signer_display(self, obj):
        return {
            'id': obj.signer.id,
            'name': obj.signer_name,
            'email': obj.signer.email,
            'document': obj.signer_document,
            'position': obj.signer_position,
        }

    def get_signature_data_url(self, obj):
        """
        Retorna la firma como data URL para renderizado.
        """
        return obj.get_image_data_url()

    def get_is_integrity_valid(self, obj):
        """
        Verifica integridad en cada serialización.
        """
        return obj.verify_integrity()


class CreateSignatureSerializer(serializers.Serializer):
    """
    Serializer para crear firmas digitales desde el frontend.
    """
    content_type = serializers.CharField(max_length=100)
    object_id = serializers.IntegerField()
    signature_type = serializers.ChoiceField(choices=DigitalSignature.SignatureType.choices)
    signature_base64 = serializers.CharField(
        required=True,
        help_text='Firma en formato Base64 (data:image/png;base64,...)'
    )
    signer_document = serializers.CharField(max_length=50, required=False, allow_blank=True)
    signer_position = serializers.CharField(max_length=200, required=False, allow_blank=True)
    latitude = serializers.DecimalField(
        max_digits=10,
        decimal_places=7,
        required=False,
        allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=10,
        decimal_places=7,
        required=False,
        allow_null=True
    )
    context_data = serializers.JSONField(required=False, default=dict)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_signature_base64(self, value):
        """
        Valida que el Base64 sea válido.
        """
        import base64
        try:
            # Remover prefijo si existe
            if value.startswith('data:image'):
                value = value.split(',')[1]

            # Intentar decodificar
            base64.b64decode(value)
            return value
        except Exception:
            raise serializers.ValidationError("Base64 inválido")

    def create(self, validated_data):
        """
        Crea la firma digital.
        """
        from apps.core.models.signature import get_client_ip, get_device_info

        request = self.context.get('request')
        user = request.user
        empresa = request.user.empresa  # Ajustar según tu modelo de usuario

        # Extraer metadata del request
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        device_info = get_device_info(request)

        # Crear firma
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=validated_data['signature_base64'],
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id'],
            signature_type=validated_data['signature_type'],
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
            latitude=validated_data.get('latitude'),
            longitude=validated_data.get('longitude'),
            context_data=validated_data.get('context_data', {}),
            notes=validated_data.get('notes', ''),
            created_by=user,
        )

        # Cachear documento y posición si se proporcionaron
        if validated_data.get('signer_document'):
            signature.signer_document = validated_data['signer_document']
        if validated_data.get('signer_position'):
            signature.signer_position = validated_data['signer_position']

        signature.save()
        return signature
```

### 4.3. ViewSet

**Ubicación:** `backend/apps/core/views/signature.py`

```python
"""
ViewSet para Firmas Digitales
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as filters
from apps.core.models.signature import DigitalSignature
from apps.core.serializers.signature import (
    DigitalSignatureSerializer,
    CreateSignatureSerializer,
)


class DigitalSignatureFilter(filters.FilterSet):
    """
    Filtros para firmas digitales.
    """
    content_type = filters.CharFilter()
    object_id = filters.NumberFilter()
    signature_type = filters.ChoiceFilter(choices=DigitalSignature.SignatureType.choices)
    signer = filters.NumberFilter(field_name='signer__id')
    signed_after = filters.DateTimeFilter(field_name='signed_at', lookup_expr='gte')
    signed_before = filters.DateTimeFilter(field_name='signed_at', lookup_expr='lte')
    is_verified = filters.BooleanFilter()

    class Meta:
        model = DigitalSignature
        fields = [
            'content_type',
            'object_id',
            'signature_type',
            'signer',
            'is_verified',
        ]


class DigitalSignatureViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de firmas digitales.

    Endpoints:
    - GET /api/signatures/ - Listar firmas
    - POST /api/signatures/ - Crear firma
    - GET /api/signatures/{id}/ - Obtener firma
    - DELETE /api/signatures/{id}/ - Eliminar firma (soft delete)
    - POST /api/signatures/{id}/verify/ - Verificar integridad
    - GET /api/signatures/by-document/ - Buscar por documento
    """

    permission_classes = [IsAuthenticated]
    serializer_class = DigitalSignatureSerializer
    filterset_class = DigitalSignatureFilter
    ordering_fields = ['signed_at', 'signer_name']
    ordering = ['-signed_at']

    def get_queryset(self):
        """
        Filtra firmas por empresa del usuario (multi-tenant).
        """
        user = self.request.user
        queryset = DigitalSignature.objects.filter(
            empresa=user.empresa,
            is_active=True
        ).select_related('signer', 'empresa', 'created_by')

        return queryset

    def get_serializer_class(self):
        """
        Usa CreateSignatureSerializer para creación.
        """
        if self.action == 'create':
            return CreateSignatureSerializer
        return DigitalSignatureSerializer

    def perform_create(self, serializer):
        """
        Crea firma con empresa del usuario.
        """
        serializer.save()

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verifica la integridad de una firma.

        POST /api/signatures/{id}/verify/

        Returns:
            {
                "is_valid": true,
                "message": "Firma verificada correctamente",
                "signature_info": {...}
            }
        """
        signature = self.get_object()
        is_valid = signature.verify_integrity()

        return Response({
            'is_valid': is_valid,
            'message': 'Firma verificada correctamente' if is_valid else 'La firma ha sido modificada o es inválida',
            'signature_info': signature.get_signature_info(),
        })

    @action(detail=False, methods=['get'])
    def by_document(self, request):
        """
        Busca firmas por documento firmado.

        GET /api/signatures/by-document/?content_type=Incident&object_id=123

        Returns:
            Lista de firmas asociadas al documento
        """
        content_type = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')

        if not content_type or not object_id:
            return Response(
                {'error': 'Se requieren content_type y object_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        signatures = self.get_queryset().filter(
            content_type=content_type,
            object_id=object_id
        )

        serializer = self.get_serializer(signatures, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_signatures(self, request):
        """
        Obtiene todas las firmas del usuario autenticado.

        GET /api/signatures/my-signatures/
        """
        signatures = self.get_queryset().filter(signer=request.user)
        serializer = self.get_serializer(signatures, many=True)
        return Response(serializer.data)
```

### 4.4. URLs

**Ubicación:** `backend/apps/core/urls.py` (agregar)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views.signature import DigitalSignatureViewSet

router = DefaultRouter()
router.register(r'signatures', DigitalSignatureViewSet, basename='signature')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

---

## 5. Seguridad y Almacenamiento

### 5.1. Comparación: Base64 vs File Storage

| Criterio | Base64 en BD | Archivo en Storage |
|----------|--------------|-------------------|
| **Performance** | ⚠️ Consultas más lentas | ✅ Consultas rápidas |
| **Tamaño BD** | ❌ Aumenta significativamente | ✅ BD ligera |
| **Backup** | ✅ Incluido en backup de BD | ⚠️ Requiere backup separado |
| **CDN/Caching** | ❌ No cacheable | ✅ Cacheable en CDN |
| **Portabilidad** | ✅ Todo en un lugar | ⚠️ Dependencias externas |
| **Límite de tamaño** | ⚠️ ~100KB recomendado | ✅ Sin límite práctico |
| **S3/Cloud Storage** | ❌ No aplica | ✅ Compatible |

### 5.2. Recomendación para Enterprise Multi-Tenant

**Estrategia Híbrida:**

1. **Firmas pequeñas (<50KB):** Base64 en BD
   - Casos: Firmas simples de formularios
   - Ventaja: Simplicidad, sin dependencias externas
   - Desventaja: Aumenta tamaño de BD

2. **Firmas grandes (>50KB):** File Storage (S3/Local)
   - Casos: Firmas de alta resolución, múltiples firmantes
   - Ventaja: Escalabilidad, CDN, performance
   - Desventaja: Complejidad en backups

3. **Hash SHA-256 siempre en BD**
   - Verificación de integridad
   - Detección de manipulación
   - Auditoría forense

### 5.3. Implementación de Verificación de Integridad

```python
# En el modelo DigitalSignature (ya implementado arriba)

def verify_integrity(self) -> bool:
    """
    Verifica que la firma no ha sido modificada.

    Compara el hash almacenado con un hash recalculado de la imagen actual.
    """
    try:
        current_hash = self.calculate_hash()
        is_valid = current_hash == self.signature_hash

        if is_valid:
            self.is_verified = True
            self.verified_at = timezone.now()
            self.save(update_fields=['is_verified', 'verified_at'])

        return is_valid
    except Exception as e:
        logger.error(f"Error verifying signature {self.id}: {e}")
        return False
```

### 5.4. Configuración S3 (Opcional)

**En `settings.py`:**

```python
# Storage configuration
if not DEBUG:
    # AWS S3 Configuration for production
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',  # 1 día
    }
    AWS_DEFAULT_ACL = 'private'  # Firmas privadas
    AWS_S3_ENCRYPTION = True

    # Usar S3 para media files
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

### 5.5. Metadata de Seguridad

El modelo incluye campos para auditoría completa:

```python
{
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "device_info": {
        "os": "Windows 10",
        "browser": "Chrome 120",
        "screen_width": 1920,
        "screen_height": 1080
    },
    "latitude": 4.7110,
    "longitude": -74.0721,
    "signed_at": "2026-01-08T10:30:00Z",
    "signature_hash": "a1b2c3d4...",
    "is_verified": true
}
```

---

## 6. Integración con Formularios

### 6.1. Ejemplo: Firma en Acta de Capacitación

**Frontend:**

```typescript
// frontend/src/features/hseq/components/ActaCapacitacion.tsx

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SignatureModal } from '@/components/forms/SignatureModal';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { toast } from 'sonner';

const schema = z.object({
  tema: z.string().min(1, 'Tema requerido'),
  fecha: z.string(),
  duracion_horas: z.number().min(1),
  instructor: z.string().min(1),
  asistentes: z.array(z.object({
    id: z.number(),
    nombre: z.string(),
    documento: z.string(),
    cargo: z.string(),
    firma: z.string().optional(),
  })),
});

type FormData = z.infer<typeof schema>;

export const ActaCapacitacionForm: React.FC = () => {
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentAsistenteIndex, setCurrentAsistenteIndex] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const asistentes = watch('asistentes') || [];

  const handleOpenSignature = (index: number) => {
    setCurrentAsistenteIndex(index);
    setShowSignatureModal(true);
  };

  const handleConfirmSignature = (signature: string) => {
    if (currentAsistenteIndex !== null) {
      setValue(`asistentes.${currentAsistenteIndex}.firma`, signature);
      toast.success('Firma capturada correctamente');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Crear acta
      const actaResponse = await api.post('/api/capacitaciones/actas/', {
        tema: data.tema,
        fecha: data.fecha,
        duracion_horas: data.duracion_horas,
        instructor: data.instructor,
      });

      const actaId = actaResponse.data.id;

      // 2. Crear firmas para cada asistente
      for (const asistente of data.asistentes) {
        if (asistente.firma) {
          await api.post('/api/signatures/', {
            content_type: 'ActaCapacitacion',
            object_id: actaId,
            signature_type: 'CAP',
            signature_base64: asistente.firma,
            signer_document: asistente.documento,
            signer_position: asistente.cargo,
            context_data: {
              asistente_id: asistente.id,
              tema: data.tema,
            },
          });
        }
      }

      toast.success('Acta guardada con firmas');
    } catch (error) {
      toast.error('Error al guardar el acta');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campos del acta */}
      <div>
        <label>Tema de Capacitación *</label>
        <input {...register('tema')} className="w-full border rounded px-3 py-2" />
        {errors.tema && <p className="text-red-600 text-sm">{errors.tema.message}</p>}
      </div>

      {/* Lista de asistentes */}
      <div>
        <h3 className="font-semibold mb-3">Asistentes</h3>
        {asistentes.map((asistente, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded mb-2">
            <div>
              <p className="font-medium">{asistente.nombre}</p>
              <p className="text-sm text-gray-600">{asistente.cargo}</p>
            </div>
            <div className="flex items-center gap-3">
              {asistente.firma ? (
                <>
                  <span className="text-green-600 text-sm">✓ Firmado</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSignature(index)}
                  >
                    Refirmar
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleOpenSignature(index)}
                >
                  Firmar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button type="submit">Guardar Acta</Button>

      {/* Modal de firma */}
      {currentAsistenteIndex !== null && (
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onConfirm={handleConfirmSignature}
          title="Firma de Asistente"
          description="Por favor, firme para confirmar su asistencia a la capacitación"
          metadata={{
            document: data.tema,
            user: asistentes[currentAsistenteIndex]?.nombre,
            timestamp: new Date().toLocaleString('es-CO'),
          }}
        />
      )}
    </form>
  );
};
```

---

## 7. Casos de Uso Específicos

### 7.1. Firma de Inspección SST (Móvil)

**Frontend móvil optimizado:**

```typescript
// Touch-optimized signature for mobile field inspections

import { SignaturePad } from '@/components/forms/SignaturePad';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const InspeccionSST: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <SignaturePad
      height={isMobile ? 300 : 200}
      penColor="#000000"
      minWidth={isMobile ? 1.5 : 0.5}  // Trazo más grueso en móvil
      maxWidth={isMobile ? 4 : 2.5}
      label="Firma del Inspector"
      required
    />
  );
};
```

### 7.2. Múltiples Firmantes (Revisión de Dirección)

```python
# Backend: Modelo específico para revisión de dirección

class RevisionDireccionFirma(models.Model):
    """
    Firmas de revisión de dirección (múltiples roles).
    """
    class RolFirmante(models.TextChoices):
        GERENTE_GENERAL = 'GG', 'Gerente General'
        COORDINADOR_SST = 'CS', 'Coordinador SST'
        COORDINADOR_CALIDAD = 'CC', 'Coordinador Calidad'
        AUDITOR = 'AU', 'Auditor'

    revision = models.ForeignKey('RevisionDireccion', on_delete=models.CASCADE)
    rol = models.CharField(max_length=2, choices=RolFirmante.choices)
    firma_digital = models.OneToOneField(DigitalSignature, on_delete=models.PROTECT)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden']
        unique_together = [['revision', 'rol']]
```

### 7.3. Firma con Geolocalización (Inspecciones de Campo)

**Frontend:**

```typescript
import { useState, useEffect } from 'react';

export const FirmaConUbicacion: React.FC = () => {
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        }
      );
    }
  }, []);

  const handleSubmit = async (firma: string) => {
    await api.post('/api/signatures/', {
      signature_base64: firma,
      latitude: location?.lat,
      longitude: location?.lng,
      // ... otros campos
    });
  };

  return (
    <div>
      {location && (
        <p className="text-sm text-gray-600 mb-2">
          📍 Ubicación: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </p>
      )}
      <SignaturePad onChange={handleSubmit} />
    </div>
  );
};
```

---

## 8. Testing

### 8.1. Tests Frontend (Vitest)

```typescript
// frontend/src/components/forms/__tests__/SignaturePad.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignaturePad } from '../SignaturePad';

describe('SignaturePad', () => {
  it('renders signature pad correctly', () => {
    render(<SignaturePad label="Test Signature" />);
    expect(screen.getByText('Test Signature')).toBeInTheDocument();
  });

  it('calls onChange when signature is drawn', async () => {
    const handleChange = vi.fn();
    render(<SignaturePad onChange={handleChange} />);

    // Simular dibujo (requiere mock de canvas)
    const canvas = screen.getByRole('img'); // Canvas actúa como img
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });
  });

  it('clears signature when clear button is clicked', async () => {
    const handleChange = vi.fn();
    const { container } = render(<SignaturePad onChange={handleChange} />);

    // Dibujar algo
    const canvas = container.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(canvas);

    // Limpiar
    const clearButton = screen.getByTitle('Limpiar');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(null);
    });
  });

  it('shows error message when provided', () => {
    render(<SignaturePad error="Firma requerida" />);
    expect(screen.getByText('Firma requerida')).toBeInTheDocument();
  });

  it('disables interaction when disabled prop is true', () => {
    render(<SignaturePad disabled />);
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass('opacity-50');
  });
});
```

### 8.2. Tests Backend (pytest-django)

```python
# backend/apps/core/tests/test_signature.py

import pytest
import base64
from io import BytesIO
from PIL import Image
from django.contrib.auth import get_user_model
from apps.core.models.signature import DigitalSignature
from apps.gestion_estrategica.configuracion.models import EmpresaConfig

User = get_user_model()


@pytest.fixture
def empresa(db):
    """Fixture de empresa de prueba."""
    return EmpresaConfig.objects.create(
        razon_social='Test Company',
        nit='900123456-7',
        nombre_comercial='Test Co.'
    )


@pytest.fixture
def user(db, empresa):
    """Fixture de usuario de prueba."""
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        empresa=empresa
    )


@pytest.fixture
def signature_base64():
    """Genera firma Base64 de prueba."""
    # Crear imagen simple
    img = Image.new('RGB', (400, 200), color='white')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    # Convertir a Base64
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


@pytest.mark.django_db
class TestDigitalSignature:

    def test_create_signature_from_base64(self, empresa, user, signature_base64):
        """Test creación de firma desde Base64."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            created_by=user
        )

        assert signature.id is not None
        assert signature.signer == user
        assert signature.signature_hash is not None
        assert len(signature.signature_hash) == 64  # SHA-256
        assert signature.ip_address == '127.0.0.1'

    def test_signature_hash_calculation(self, empresa, user, signature_base64):
        """Test cálculo de hash SHA-256."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        # Hash debe ser consistente
        original_hash = signature.signature_hash
        recalculated_hash = signature.calculate_hash()
        assert original_hash == recalculated_hash

    def test_signature_integrity_verification(self, empresa, user, signature_base64):
        """Test verificación de integridad."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        # Verificar integridad
        is_valid = signature.verify_integrity()
        assert is_valid is True
        assert signature.is_verified is True
        assert signature.verified_at is not None

    def test_signature_integrity_fails_on_modification(self, empresa, user, signature_base64):
        """Test que la verificación falla si se modifica la firma."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        # Modificar firma (simular manipulación)
        signature.signature_base64 = "modified_data"

        # Verificación debe fallar
        is_valid = signature.verify_integrity()
        assert is_valid is False

    def test_get_image_data_url(self, empresa, user, signature_base64):
        """Test obtención de data URL."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        data_url = signature.get_image_data_url()
        assert data_url is not None
        assert data_url.startswith('data:image/png;base64,')

    def test_signature_info_retrieval(self, empresa, user, signature_base64):
        """Test obtención de información completa de firma."""
        signature = DigitalSignature.create_from_base64(
            empresa=empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            user_agent='Mozilla/5.0...',
            device_info={'os': 'Windows', 'browser': 'Chrome'},
            created_by=user
        )

        info = signature.get_signature_info()
        assert info['signer']['name'] is not None
        assert info['hash'] == signature.signature_hash
        assert info['ip_address'] == '127.0.0.1'
        assert info['device_info']['os'] == 'Windows'

    def test_multi_tenant_isolation(self, db, user, signature_base64):
        """Test aislamiento multi-tenant."""
        # Crear segunda empresa
        empresa2 = EmpresaConfig.objects.create(
            razon_social='Company 2',
            nit='900123457-7',
            nombre_comercial='Company 2'
        )

        # Crear firma en empresa 1
        sig1 = DigitalSignature.create_from_base64(
            empresa=user.empresa,
            signer=user,
            signature_base64=signature_base64,
            content_type='TestDocument',
            object_id=1,
            signature_type='DOC',
            ip_address='127.0.0.1',
            created_by=user
        )

        # Verificar que firma pertenece solo a empresa 1
        assert sig1.empresa == user.empresa
        assert sig1.empresa != empresa2

        # Query por empresa debe filtrar correctamente
        empresa1_signatures = DigitalSignature.objects.filter(empresa=user.empresa)
        empresa2_signatures = DigitalSignature.objects.filter(empresa=empresa2)

        assert empresa1_signatures.count() == 1
        assert empresa2_signatures.count() == 0
```

---

## 📚 Referencias

### Librerías y Documentación

- [react-signature-canvas - NPM](https://www.npmjs.com/package/react-signature-canvas)
- [signature_pad - NPM](https://www.npmjs.com/package/signature_pad)
- [react-signature-canvas vs alternatives - npm trends](https://npmtrends.com/react-signature-canvas-vs-react-signature-pad-vs-react-signature-pad-wrapper)
- [Understanding Digital Signatures](https://bitsofcyber.substack.com/p/understanding-digital-signatures-more-than-just-a-hash)
- [Digital Signature with Hash Function](https://andsilvadrcc.medium.com/digital-signature-with-hash-function-how-it-works-f4eed52267f5)
- [Role of Hashing Algorithms in Digital Signature Security](https://www.certinal.com/blog/where-hashing-algorithms-fit-in-the-process-of-securing-digital-signatures)

### Best Practices

- **Base64 Storage:** [Wikipedia - Base64](https://en.wikipedia.org/wiki/Base64)
- **Hash Verification:** [OpenSSL: Hashes and Digital Signatures](https://opensource.com/article/19/6/cryptography-basics-openssl-part-2)
- **React Performance 2025:** [React Performance Optimization: 15 Best Practices](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)

---

## 🎯 Próximos Pasos

1. **Instalar librería:**
   ```bash
   npm install react-signature-canvas
   npm install --save-dev @types/react-signature-canvas
   ```

2. **Crear migración Django:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Implementar componentes frontend** según ejemplos en sección 3

4. **Configurar endpoints backend** según sección 4

5. **Configurar storage** (S3 o local) según sección 5

6. **Implementar casos de uso** específicos del sistema

7. **Ejecutar tests** para validar implementación

---

**Autor:** Sistema de Gestión StrateKaz
**Versión:** 1.0.0
**Fecha:** 2026-01-08
