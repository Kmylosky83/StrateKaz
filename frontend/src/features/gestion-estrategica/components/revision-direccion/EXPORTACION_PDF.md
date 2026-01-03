# Exportación de Actas de Revisión por la Dirección a PDF

Documentación completa del sistema de exportación de actas a PDF firmable con formato profesional según normas ISO.

## 📋 Características

### ✅ Formato Profesional
- Encabezado con logo de empresa y branding corporativo
- Estructura según normas ISO 9001:2015, ISO 14001:2015 e ISO 45001:2018
- Numeración automática de páginas
- Pie de página con información del documento (consecutivo, fecha, paginación)

### ✅ Secciones Completas del Acta
1. **Información General**: Fecha, hora, lugar, sistemas revisados
2. **Participantes**: Lista con checkboxes de asistencia
3. **Introducción y Orden del Día**
4. **Análisis de Temas**: Desarrollo detallado según categorías ISO
5. **Conclusiones y Decisiones**: Mejoras, cambios, recursos
6. **Evaluación del Sistema**: Estado del SG (Adecuado/Parcialmente/No Adecuado)
7. **Compromisos**: Tabla de acciones derivadas
8. **Firmas**: Espacios para Elaborado, Revisado, Aprobado

### ✅ Funcionalidades Avanzadas
- Loading state durante generación
- Preview opcional con selección de secciones
- Validación de datos antes de exportar
- Manejo de errores con mensajes descriptivos
- Múltiples variantes del botón (completo, compacto, menú)
- Control de saltos de página automático

## 📦 Archivos Creados

```
frontend/src/features/gestion-estrategica/
├── types/
│   └── revision-direccion.types.ts      # Tipos TypeScript completos
├── utils/
│   └── exportActaPDF.ts                  # Lógica de generación PDF
└── components/
    └── revision-direccion/
        ├── ExportActaButton.tsx          # Componentes de botón
        ├── ActasList.example.tsx         # Ejemplos de integración
        ├── index.ts                      # Barrel exports
        └── EXPORTACION_PDF.md            # Esta documentación
```

## 🚀 Uso Rápido

### 1. Importar el componente

```tsx
import { ExportActaButton } from '@/features/gestion-estrategica/components/revision-direccion';
import type { ActaRevisionExpandida } from '@/features/gestion-estrategica/types';
```

### 2. Usar en tu componente

```tsx
function ActaDetail({ actaId }: { actaId: number }) {
  const [acta, setActa] = useState<ActaRevisionExpandida | null>(null);

  // Cargar acta expandida desde la API
  useEffect(() => {
    fetch(`/api/.../actas/${actaId}/expandida/`)
      .then(res => res.json())
      .then(setActa);
  }, [actaId]);

  if (!acta) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Acta {acta.numero_acta}</h1>

      <ExportActaButton
        acta={acta}
        variant="primary"
        showPreview={true}
        onExportSuccess={() => console.log('PDF generado')}
        onExportError={(error) => console.error(error)}
      />
    </div>
  );
}
```

## 🎨 Variantes del Componente

### 1. Botón Estándar con Preview

```tsx
<ExportActaButton
  acta={acta}
  variant="primary"       // 'primary' | 'secondary' | 'outline'
  size="md"               // 'sm' | 'md' | 'lg'
  showPreview={true}      // Modal con opciones antes de exportar
/>
```

### 2. Botón Compacto (ideal para tablas)

```tsx
<ExportActaButtonCompact acta={acta} />
```

### 3. Botón con Menú Desplegable

```tsx
<ExportActaButtonWithMenu acta={acta} />
```

Opciones del menú:
- **Acta Completa**: Todas las secciones
- **Resumen Ejecutivo**: Sin análisis detallado
- **Solo Compromisos**: Tabla de acciones

## ⚙️ Personalización de Secciones

Controla qué secciones incluir en el PDF:

```tsx
<ExportActaButton
  acta={acta}
  includeParticipants={true}    // Lista de participantes
  includeAnalysis={true}         // Análisis de temas
  includeCommitments={true}      // Tabla de compromisos
  includeSignatures={true}       // Sección de firmas
/>
```

## 📊 Estructura de Datos Requerida

El componente espera un objeto `ActaRevisionExpandida`:

```typescript
const acta: ActaRevisionExpandida = {
  // Datos básicos
  id: 1,
  numero_acta: "RD-2025-01",
  fecha: "2025-01-15",
  hora_inicio: "09:00",
  hora_fin: "12:00",
  lugar: "Sala de Juntas Principal",

  // Contenido
  introduccion: "Texto de introducción...",
  orden_del_dia: "1. Punto uno\n2. Punto dos...",
  conclusiones_generales: "Conclusiones...",
  decisiones_mejora: "Oportunidades identificadas...",
  necesidad_cambios: "Cambios propuestos...",
  necesidad_recursos: "Recursos requeridos...",

  // Evaluación
  evaluacion_sistema: "adecuado",  // 'adecuado' | 'parcialmente_adecuado' | 'no_adecuado'
  observaciones_evaluacion: "Observaciones...",

  // Firmas
  elaborado_por_nombre: "Juan Pérez",
  fecha_elaboracion: "2025-01-16",
  revisado_por_nombre: "María González",
  fecha_revision: "2025-01-17",
  aprobado_por_nombre: "Carlos Ramírez",
  fecha_aprobacion: "2025-01-18",

  // Contexto del programa
  programa_periodo: "Primer Semestre 2025",
  programa_data: {
    anio: 2025,
    periodo: "Primer Semestre 2025",
    fecha_programada: "2025-01-15",
    lugar: "Sala Principal",
    incluye_calidad: true,
    incluye_sst: true,
    incluye_ambiental: false,
    incluye_pesv: false,
    incluye_seguridad_info: false,
  },

  // Participantes
  participantes: [
    {
      id: 1,
      usuario_nombre: "Juan Pérez",
      rol_display: "Alta Dirección",
      asistio: true,
      cargo: "Gerente General",
    },
    // ...
  ],

  // Temas analizados
  temas_analizados: [
    {
      orden: 1,
      categoria_display: "Resultados de auditorías",
      titulo: "Auditoría Interna ISO 9001",
      presentado_por_nombre: "Ana López",
      resumen_presentacion: "Se presentaron los resultados...",
      hallazgos: "Se encontraron 3 no conformidades menores...",
      decisiones: "Implementar acciones correctivas...",
    },
    // ...
  ],

  // Compromisos
  compromisos_lista: [
    {
      consecutivo: "AC-2025-001",
      tipo_display: "Acción Correctiva",
      descripcion: "Actualizar procedimiento de compras",
      responsable_nombre: "Pedro Martínez",
      fecha_compromiso: "2025-02-28",
      prioridad_display: "Alta",
      estado_display: "Pendiente",
    },
    // ...
  ],

  // Branding (opcional)
  empresa_logo: "https://...",  // URL del logo
  empresa_nombre: "StrateKaz.",
};
```

## 🔌 Endpoint de API Recomendado

Crear un endpoint específico para obtener el acta con datos expandidos:

```python
# backend/apps/gestion_estrategica/revision_direccion/views.py

from rest_framework.decorators import action
from rest_framework.response import Response

class ActaRevisionViewSet(viewsets.ModelViewSet):
    # ... código existente ...

    @action(detail=True, methods=['get'])
    def expandida(self, request, pk=None):
        """
        Retorna el acta con todos los datos expandidos necesarios para el PDF

        GET /api/gestion-estrategica/revision-direccion/actas/{id}/expandida/
        """
        acta = self.get_object()

        # Obtener branding
        branding = None
        if hasattr(request, 'tenant'):
            try:
                branding = request.tenant.branding
            except:
                pass

        # Construir respuesta expandida
        data = {
            # Datos base del acta
            **ActaRevisionSerializer(acta).data,

            # Datos del programa
            'programa_periodo': acta.programa.periodo,
            'programa_data': {
                'anio': acta.programa.anio,
                'periodo': acta.programa.periodo,
                'fecha_programada': acta.programa.fecha_programada.isoformat(),
                'fecha_realizada': acta.programa.fecha_realizada.isoformat() if acta.programa.fecha_realizada else None,
                'lugar': acta.programa.lugar,
                'incluye_calidad': acta.programa.incluye_calidad,
                'incluye_sst': acta.programa.incluye_sst,
                'incluye_ambiental': acta.programa.incluye_ambiental,
                'incluye_pesv': acta.programa.incluye_pesv,
                'incluye_seguridad_info': acta.programa.incluye_seguridad_info,
            },

            # Participantes con detalles completos
            'participantes': [
                {
                    'id': p.id,
                    'usuario_nombre': p.usuario.get_full_name(),
                    'rol_display': p.get_rol_display(),
                    'asistio': p.asistio,
                    'cargo': p.usuario.cargo.nombre if hasattr(p.usuario, 'cargo') and p.usuario.cargo else None,
                }
                for p in acta.programa.participantes.all()
            ],

            # Temas analizados
            'temas_analizados': [
                {
                    'orden': analisis.tema.orden,
                    'categoria_display': analisis.tema.get_categoria_display(),
                    'titulo': analisis.tema.titulo,
                    'presentado_por_nombre': analisis.presentado_por.get_full_name() if analisis.presentado_por else None,
                    'resumen_presentacion': analisis.resumen_presentacion,
                    'hallazgos': analisis.hallazgos,
                    'decisiones': analisis.decisiones,
                }
                for analisis in acta.analisis_temas.select_related('tema', 'presentado_por').order_by('tema__orden')
            ],

            # Compromisos
            'compromisos_lista': [
                {
                    'consecutivo': c.consecutivo,
                    'tipo_display': c.get_tipo_display(),
                    'descripcion': c.descripcion,
                    'responsable_nombre': c.responsable.get_full_name() if c.responsable else None,
                    'fecha_compromiso': c.fecha_compromiso.isoformat(),
                    'prioridad_display': c.get_prioridad_display(),
                    'estado_display': c.get_estado_display(),
                }
                for c in acta.compromisos.filter(is_active=True).select_related('responsable')
            ],

            # Branding
            'empresa_logo': branding.logo.url if branding and branding.logo else None,
            'empresa_nombre': branding.company_name if branding else (request.tenant.nombre if hasattr(request, 'tenant') else 'Empresa'),
        }

        return Response(data)
```

### Uso desde el frontend:

```typescript
// Obtener acta expandida
const response = await fetch(
  `/api/gestion-estrategica/revision-direccion/actas/${actaId}/expandida/`
);
const actaExpandida = await response.json();

// Exportar a PDF
<ExportActaButton acta={actaExpandida} />
```

## 💡 Ejemplos de Integración

### En un Listado de Actas

```tsx
function ActasList() {
  const [actas, setActas] = useState<ActaRevisionExpandida[]>([]);

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th>Número</th>
          <th>Fecha</th>
          <th>Período</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {actas.map((acta) => (
          <tr key={acta.id}>
            <td>{acta.numero_acta}</td>
            <td>{formatDate(acta.fecha)}</td>
            <td>{acta.programa_periodo}</td>
            <td>
              <ExportActaButtonCompact acta={acta} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### En el Detalle de un Acta

```tsx
function ActaDetail({ actaId }: { actaId: number }) {
  const [acta, setActa] = useState<ActaRevisionExpandida | null>(null);

  useEffect(() => {
    fetch(`/api/.../actas/${actaId}/expandida/`)
      .then(res => res.json())
      .then(setActa);
  }, [actaId]);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Acta {acta?.numero_acta}</h1>

        {acta && (
          <ExportActaButtonWithMenu acta={acta} />
        )}
      </div>

      {/* Contenido del acta */}
    </div>
  );
}
```

### Con Hook Personalizado

```tsx
function useActaExport(actaId: number) {
  const [acta, setActa] = useState<ActaRevisionExpandida | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadActa = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/.../actas/${actaId}/expandida/`);
      const data = await response.json();
      setActa(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActa();
  }, [actaId]);

  return { acta, isLoading, error, reload: loadActa };
}

// Uso
function ActaExportButton({ actaId }: { actaId: number }) {
  const { acta, isLoading } = useActaExport(actaId);

  if (isLoading) return <div>Cargando...</div>;
  if (!acta) return null;

  return <ExportActaButton acta={acta} />;
}
```

## 🎨 Personalización Avanzada

### Modificar Colores del PDF

Edita las constantes en `utils/exportActaPDF.ts`:

```typescript
const COLORS = {
  primary: '#1e40af',      // Color principal (azul)
  secondary: '#64748b',    // Color secundario (gris)
  text: '#1e293b',         // Color de texto
  textLight: '#475569',    // Texto claro
  border: '#cbd5e1',       // Bordes
  background: '#f8fafc',   // Fondo de celdas
  success: '#22c55e',      // Verde (éxito)
  warning: '#f59e0b',      // Naranja (advertencia)
  danger: '#ef4444',       // Rojo (error)
};
```

### Modificar Tamaños de Fuente

```typescript
const FONTS = {
  title: 16,       // Título principal
  subtitle: 14,    // Subtítulo
  heading: 12,     // Encabezados de sección
  body: 10,        // Texto normal
  small: 8,        // Texto pequeño
};
```

### Modificar Márgenes

```typescript
const MARGINS = {
  top: 20,      // mm
  bottom: 20,   // mm
  left: 20,     // mm
  right: 20,    // mm
};
```

## 🛠️ Solución de Problemas

### El PDF no se descarga

**Causa**: Navegador bloquea descargas automáticas

**Solución**:
- Verificar permisos del navegador
- Revisar consola para errores de seguridad

### El logo no aparece

**Causa**: URL del logo no accesible o bloqueada por CORS

**Solución**:
- Asegurar que `acta.empresa_logo` tenga una URL válida
- Verificar que la imagen sea accesible públicamente
- Revisar configuración CORS del servidor

### Faltan datos en el PDF

**Causa**: Endpoint no retorna datos expandidos completos

**Solución**:
- Verificar que el endpoint `/expandida/` retorne todos los campos
- Revisar que los datos existan en la base de datos
- Comprobar relaciones (participantes, temas, compromisos)

### El PDF se ve cortado

**Causa**: Saltos de página no calculados correctamente

**Solución**:
- Ajustar constante `requiredSpace` en función `checkPageBreak()`
- Modificar márgenes si es necesario
- Revisar que el contenido no sea demasiado largo para una sección

### Error "El acta debe tener un número..."

**Causa**: Validación falla por datos faltantes

**Solución**:
- Asegurar que `numero_acta` no sea nulo o vacío
- Verificar que `fecha` esté presente
- Revisar otros campos requeridos

## 📋 Manejo de Errores

El sistema identifica diferentes tipos de errores:

```typescript
onExportError={(error) => {
  switch (error.type) {
    case 'VALIDATION':
      // Datos del acta incompletos o inválidos
      console.error('Error de validación:', error.message);
      // Mostrar modal pidiendo completar datos
      break;

    case 'GENERATION':
      // Error al generar el PDF (problema con jsPDF)
      console.error('Error de generación:', error.message);
      // Sugerir reintentar o contactar soporte
      break;

    case 'DOWNLOAD':
      // Error al descargar el archivo
      console.error('Error de descarga:', error.message);
      // Sugerir verificar permisos del navegador
      break;

    default:
      console.error('Error desconocido:', error.message);
      // Log a servicio de monitoreo
  }
}
```

## 📚 Dependencias

El sistema utiliza las siguientes librerías (ya instaladas en el proyecto):

- **jspdf**: ^3.0.4 - Generación de PDFs
- **date-fns**: ^3.0.0 - Manejo de fechas
- **react-hot-toast**: ^2.4.1 - Notificaciones toast
- **lucide-react**: ^0.294.0 - Iconos

## 🚀 Próximas Mejoras

- [ ] Agregar watermark opcional
- [ ] Soporte para múltiples idiomas
- [ ] Generación de PDF/A para archivo legal
- [ ] Firma digital integrada con certificados
- [ ] Envío automático por email tras generación
- [ ] Historial de exportaciones
- [ ] Compresión de PDFs grandes
- [ ] Generación en background para actas muy extensas

## 📖 Referencias

- **ISO 9001:2015** - Cláusula 9.3: Revisión por la dirección
- **ISO 14001:2015** - Cláusula 9.3: Revisión por la dirección
- **ISO 45001:2018** - Cláusula 9.3: Revisión por la dirección
- **jsPDF Documentation**: https://github.com/parallax/jsPDF
- **date-fns Documentation**: https://date-fns.org/

---

**Autor**: StrateKaz Development Team
**Fecha**: Diciembre 2024
**Versión**: 1.0.0
