# Identidad Corporativa - Documentación del Módulo

> **Última actualización:** 2026-01-09
> **Versión:** 3.0 (Showcase Público + Firma Manuscrita + Cards UI)

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura Backend](#arquitectura-backend)
3. [Arquitectura Frontend](#arquitectura-frontend)
4. [API Endpoints](#api-endpoints)
5. [Modelos de Datos](#modelos-de-datos)
6. [Componentes React](#componentes-react)
7. [Hooks Disponibles](#hooks-disponibles)
8. [Guía de Uso](#guía-de-uso)
9. [Showcase Publico](#showcase-publico)

---

## Descripción General

El módulo de **Identidad Corporativa** gestiona los elementos fundamentales de la cultura organizacional:

- **Misión y Visión** - Declaraciones estratégicas
- **Valores Corporativos** - Con drag & drop y vista en tarjetas
- **Políticas Integrales** - Con workflow de firma manuscrita y versionamiento
- **Políticas Específicas** - Por norma ISO/área
- **Alcances del Sistema** - Certificaciones ISO
- **Valores Vividos** - Conexión valor-acción para Business Intelligence
- **Vista Showcase** - Presentación visual (interna y pública)
- **Showcase Público** - URL compartible sin autenticación con QR code

### Características Principales

| Feature | Descripción |
|---------|-------------|
| Firma Manuscrita | Canvas con SignatureModal y hash SHA-256 |
| Workflow | BORRADOR → EN_REVISION → VIGENTE → OBSOLETO |
| Exportación | PDF (WeasyPrint) y DOCX (python-docx) |
| Valores Vividos | GenericForeignKey para conectar valores a cualquier acción |
| Vista Showcase | Slideshow fullscreen con métricas BI |
| Showcase Público | URL `/showcase` sin autenticación + QR code |
| Drag & Drop | Reordenamiento visual de valores |
| Vista Cards | Toggle list/cards para valores corporativos |
| Notificaciones | Badge dinámico en header con conteo |

---

## Arquitectura Backend

### Estructura de Archivos

```
backend/apps/gestion_estrategica/identidad/
├── __init__.py
├── admin.py
├── apps.py
├── models.py                      # Modelos principales
├── models_workflow.py             # FirmaDigital, ConfiguracionRevision
├── models_valores_vividos.py      # ValorVivido, ConfiguracionMetricaValor
├── serializers.py                 # Serializers principales
├── serializers_workflow.py        # Serializers de workflow
├── serializers_valores_vividos.py # Serializers para BI
├── views.py                       # ViewSets principales
├── views_workflow.py              # ViewSets de workflow
├── views_valores_vividos.py       # ViewSets con métricas BI
├── views_export.py                # Endpoints de exportación
├── urls.py                        # URL routing principal
├── urls_workflow.py               # URLs de workflow
├── urls_valores_vividos.py        # URLs de valores vividos
├── exporters/
│   ├── __init__.py
│   ├── pdf_generator.py           # WeasyPrint
│   └── docx_generator.py          # python-docx
└── migrations/
    ├── 0001_dynamic_models_dia6.py
    └── 0002_valores_vividos.py
```

### Dependencias

```python
# requirements.txt
WeasyPrint==60.1          # Generación PDF
python-docx==1.1.2        # Generación DOCX
Pillow==11.1.0            # Procesamiento imágenes
```

---

## Arquitectura Frontend

### Estructura de Archivos

```
frontend/src/features/gestion-estrategica/
├── api/
│   └── strategicApi.ts
├── components/
│   ├── IdentidadTab.tsx           # Tab principal
│   ├── IdentidadShowcase.tsx      # Vista showcase fullscreen
│   ├── ValoresDragDrop.tsx        # Valores con drag & drop
│   ├── ValorVinculadorWidget.tsx  # Widget para vincular valores
│   ├── PoliticasManager.tsx       # Gestor de políticas
│   └── modals/
│       └── IdentityFormModal.tsx
├── hooks/
│   ├── index.ts
│   ├── useStrategic.ts            # Hooks principales
│   └── useValoresVividos.ts       # Hooks para valores vividos/BI
└── types/
    └── strategic.types.ts
```

---

## API Endpoints

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/gestion-estrategica/identidad/identidad/` | Listar identidades |
| GET | `/api/gestion-estrategica/identidad/identidad/active/` | Identidad activa |
| GET | `/api/gestion-estrategica/identidad/valores/` | Listar valores |
| POST | `/api/gestion-estrategica/identidad/valores/reorder/` | Reordenar valores |
| GET | `/api/gestion-estrategica/identidad/alcances/` | Alcances del sistema |
| GET | `/api/gestion-estrategica/identidad/politicas-integrales/` | Políticas integrales |
| GET | `/api/gestion-estrategica/identidad/politicas-especificas/` | Políticas específicas |

### Endpoints de Workflow

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/gestion-estrategica/identidad/workflow/firmas/` | Listar firmas |
| POST | `/api/gestion-estrategica/identidad/workflow/firmas/firmar/` | Firmar documento |
| GET | `/api/gestion-estrategica/identidad/workflow/revisiones/` | Configuraciones revisión |
| GET | `/api/gestion-estrategica/identidad/workflow/historial/` | Historial versiones |

### Endpoints de Exportación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/gestion-estrategica/identidad/export/politica-integral/{id}/pdf/` | Exportar política integral a PDF |
| GET | `/api/gestion-estrategica/identidad/export/politica-integral/{id}/docx/` | Exportar política integral a DOCX |
| GET | `/api/gestion-estrategica/identidad/export/politica-especifica/{id}/pdf/` | Exportar política específica a PDF |
| GET | `/api/gestion-estrategica/identidad/export/politica-especifica/{id}/docx/` | Exportar política específica a DOCX |
| GET | `/api/gestion-estrategica/identidad/export/identidad/{id}/pdf/` | Exportar identidad completa a PDF |
| GET | `/api/gestion-estrategica/identidad/export/identidad/{id}/docx/` | Exportar identidad completa a DOCX |

### Endpoints de Valores Vividos (BI)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/` | Listar vínculos valor-acción |
| POST | `/api/gestion-estrategica/identidad/bi/valores-vividos/vincular/` | Vincular valor a acción |
| POST | `/api/gestion-estrategica/identidad/bi/valores-vividos/vincular-multiples/` | Vincular múltiples valores |
| POST | `/api/gestion-estrategica/identidad/bi/valores-vividos/{id}/verificar/` | Verificar vínculo |
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/por-accion/{ct}/{id}/` | Valores de una acción |
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/por-valor/{id}/` | Acciones de un valor |
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/estadisticas/` | Estadísticas por valor |
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/tendencia/` | Tendencia mensual |
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/ranking-categorias/` | Ranking categorías |
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/subrepresentados/` | Valores con pocas acciones |
| GET | `/api/gestion-estrategica/identidad/bi/valores-vividos/resumen/` | Dashboard ejecutivo |
| GET | `/api/gestion-estrategica/identidad/bi/config-metricas/mi-configuracion/` | Config métricas empresa |

---

## Modelos de Datos

### CorporateIdentity

```python
class CorporateIdentity(AuditModel, SoftDeleteModel):
    mission = TextField()              # Misión
    vision = TextField()               # Visión
    integral_policy = TextField()      # Política integral
    effective_date = DateField()       # Fecha vigencia
    version = CharField(max_length=20) # Versión
    policy_signed_by = ForeignKey(User)
    policy_signed_at = DateTimeField()
    policy_signature_hash = CharField() # SHA-256
```

### CorporateValue

```python
class CorporateValue(AuditModel, SoftDeleteModel, OrderedModel):
    identity = ForeignKey(CorporateIdentity)
    name = CharField(max_length=100)
    description = TextField()
    icon = CharField(max_length=50)    # Lucide icon name
    orden = PositiveIntegerField()
```

### ValorVivido (Conexión Valor-Acción)

```python
class ValorVivido(AuditModel, SoftDeleteModel):
    # GenericForeignKey para cualquier modelo
    valor = ForeignKey(CorporateValue)
    content_type = ForeignKey(ContentType)
    object_id = PositiveIntegerField()
    content_object = GenericForeignKey()

    # Categorización
    categoria_accion = CharField(choices=CATEGORIA_ACCION_CHOICES)
    tipo_vinculo = CharField(choices=TIPO_VINCULO_CHOICES)
    impacto = CharField(choices=IMPACTO_CHOICES)
    puntaje = PositiveSmallIntegerField(1-10)

    # Justificación
    justificacion = TextField()
    evidencia = TextField(optional)
    archivo_evidencia = FileField(optional)

    # Seguimiento
    vinculado_por = ForeignKey(User)
    verificado = BooleanField()
    verificado_por = ForeignKey(User)
```

### Categorías de Acción Disponibles

```python
CATEGORIA_ACCION_CHOICES = [
    ('PROYECTO', 'Proyecto'),
    ('OBJETIVO', 'Objetivo Estratégico'),
    ('INICIATIVA', 'Iniciativa'),
    ('ACCION_CORRECTIVA', 'Acción Correctiva'),
    ('ACCION_PREVENTIVA', 'Acción Preventiva'),
    ('ACCION_MEJORA', 'Acción de Mejora'),
    ('OPORTUNIDAD_MEJORA', 'Oportunidad de Mejora'),
    ('GESTION_CAMBIO', 'Gestión del Cambio'),
    ('INVESTIGACION_INCIDENTE', 'Investigación de Incidente'),
    ('INSPECCION', 'Inspección'),
    ('HALLAZGO_AUDITORIA', 'Hallazgo de Auditoría'),
    ('NO_CONFORMIDAD', 'No Conformidad'),
    ('ACCION_PESV', 'Acción PESV'),
    ('OTRO', 'Otro'),
]
```

---

## Componentes React

### IdentidadShowcase

Vista fullscreen para presentaciones:

```tsx
import { IdentidadShowcase } from '@/features/gestion-estrategica/components';

// Uso básico
<IdentidadShowcase />

// Con opciones
<IdentidadShowcase
  autoPlayInterval={8000}  // ms entre slides
  autoPlay={true}          // iniciar automático
  onlyValues={false}       // solo mostrar valores
  onClose={() => {}}       // callback al cerrar
/>
```

**Atajos de teclado:**
- `←` `→` - Navegar slides
- `Espacio` - Play/Pause
- `F` - Pantalla completa
- `Escape` - Salir

### ValorVinculadorWidget

Widget reutilizable para conectar valores a cualquier entidad:

```tsx
import { ValorVinculadorWidget } from '@/features/gestion-estrategica/components';

// En un formulario de proyecto
<ValorVinculadorWidget
  contentType="planeacion.proyecto"
  objectId={proyecto.id}
  categoriaAccion="PROYECTO"
  onVinculoCreado={() => refetch()}
/>

// En una acción correctiva
<ValorVinculadorWidget
  contentType="mejora_continua.accioncorrectiva"
  objectId={accion.id}
  categoriaAccion="ACCION_CORRECTIVA"
  compact={true}  // solo badges
/>

// Solo lectura
<ValorVinculadorWidget
  contentType="planeacion.proyecto"
  objectId={123}
  categoriaAccion="PROYECTO"
  readOnly={true}
/>
```

---

## Hooks Disponibles

### Hooks Principales (useStrategic.ts)

```tsx
// Identidad
const { data: identity } = useActiveIdentity();
const signMutation = useSignPolicy();

// Valores
const { data: values } = useValues(identityId);
const createMutation = useCreateValue();
const updateMutation = useUpdateValue();
const deleteMutation = useDeleteValue();
const reorderMutation = useReorderValues();

// Políticas Integrales
const { data } = usePoliticasIntegrales({ identity: id });
const signMutation = useSignPoliticaIntegral();
const publishMutation = usePublishPoliticaIntegral();

// Políticas Específicas
const { data } = usePoliticasEspecificas({ identity: id });
const approveMutation = useApprovePoliticaEspecifica();
```

### Hooks de Valores Vividos (useValoresVividos.ts)

```tsx
// Consultas
const { data } = useValoresVividos({ categoria_accion: 'PROYECTO' });
const { data } = useValoresPorAccion('planeacion.proyecto', 123);
const { data } = useAccionesPorValor(valorId);

// Estadísticas BI
const { data } = useEstadisticasValores({ fecha_desde, fecha_hasta });
const { data } = useTendenciaValores(12); // últimos 12 meses
const { data } = useRankingCategorias(valorId);
const { data } = useValoresSubrepresentados(5); // umbral
const { data } = useResumenValoresVividos(); // dashboard

// Configuración
const { data } = useConfiguracionMetricas();

// Mutaciones
const vincularMutation = useVincularValor();
const vincularMultiplesMutation = useVincularMultiplesValores();
const verificarMutation = useVerificarValorVivido();
const updateMutation = useUpdateValorVivido();
const deleteMutation = useDeleteValorVivido();
```

---

## Guía de Uso

### 1. Vincular Valor a un Proyecto

```tsx
// En el componente de detalle del proyecto
import { ValorVinculadorWidget } from '@/features/gestion-estrategica/components';

function ProyectoDetail({ proyecto }) {
  return (
    <div>
      <h1>{proyecto.nombre}</h1>

      {/* Widget de valores */}
      <ValorVinculadorWidget
        contentType="planeacion.proyecto"
        objectId={proyecto.id}
        categoriaAccion="PROYECTO"
        titulo="Valores que refleja este proyecto"
      />
    </div>
  );
}
```

### 2. Mostrar Métricas en Dashboard BI

```tsx
import { useResumenValoresVividos, useEstadisticasValores } from '@/features/gestion-estrategica/hooks';

function DashboardBI() {
  const { data: resumen } = useResumenValoresVividos();
  const { data: estadisticas } = useEstadisticasValores();

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <h3>Total Vínculos</h3>
        <p className="text-3xl">{resumen?.total_vinculos}</p>
      </Card>
      <Card>
        <h3>Valores Activos</h3>
        <p className="text-3xl">{resumen?.total_valores_activos}</p>
      </Card>
      <Card>
        <h3>Puntaje Promedio</h3>
        <p className="text-3xl">{resumen?.puntaje_promedio}</p>
      </Card>
      <Card>
        <h3>Valores sin Acciones</h3>
        <p className="text-3xl text-red-500">{resumen?.valores_sin_acciones}</p>
      </Card>

      {/* Gráfico de estadísticas por valor */}
      <Card className="col-span-4">
        <BarChart data={estadisticas} />
      </Card>
    </div>
  );
}
```

### 3. Mostrar Vista Showcase

```tsx
import { IdentidadShowcase } from '@/features/gestion-estrategica/components';
import { useState } from 'react';

function IdentidadPage() {
  const [showShowcase, setShowShowcase] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowShowcase(true)}>
        Ver Presentación
      </Button>

      {showShowcase && (
        <IdentidadShowcase
          onClose={() => setShowShowcase(false)}
          autoPlay={true}
        />
      )}
    </div>
  );
}
```

### 4. Exportar Documentos

```tsx
// Botón de exportación
function ExportButtons({ politicaId }) {
  const handleExportPDF = () => {
    window.open(
      `/api/gestion-estrategica/identidad/export/politica-integral/${politicaId}/pdf/`,
      '_blank'
    );
  };

  const handleExportDOCX = () => {
    window.open(
      `/api/gestion-estrategica/identidad/export/politica-integral/${politicaId}/docx/`,
      '_blank'
    );
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportPDF}>
        <FileText className="w-4 h-4 mr-2" />
        Exportar PDF
      </Button>
      <Button onClick={handleExportDOCX}>
        <FileText className="w-4 h-4 mr-2" />
        Exportar DOCX
      </Button>
    </div>
  );
}
```

---

## Migraciones

Para aplicar las migraciones del módulo:

```bash
cd backend
python manage.py migrate identidad
```

Migraciones disponibles:
- `0001_dynamic_models_dia6.py` - Modelos base (Identity, Value, Alcance, Políticas)
- `0002_valores_vividos.py` - ValorVivido y ConfiguracionMetricaValor

---

## Notas Técnicas

### GenericForeignKey para Valores Vividos

El modelo `ValorVivido` usa `GenericForeignKey` para permitir vincular valores a **cualquier modelo** del sistema:

```python
# Vincular a un proyecto
valor_vivido = ValorVivido.objects.create(
    valor=valor_innovacion,
    content_type=ContentType.objects.get_for_model(Proyecto),
    object_id=proyecto.id,
    categoria_accion='PROYECTO',
    justificacion='Este proyecto ejemplifica la innovación...'
)

# Vincular a una acción correctiva
valor_vivido = ValorVivido.objects.create(
    valor=valor_responsabilidad,
    content_type=ContentType.objects.get_for_model(AccionCorrectiva),
    object_id=accion.id,
    categoria_accion='ACCION_CORRECTIVA',
    justificacion='Esta acción demuestra responsabilidad...'
)
```

### Índices para Rendimiento BI

La migración incluye índices optimizados para las consultas de BI:

```python
# Índices creados
- (content_type, object_id)     # Búsqueda por acción
- (valor, categoria_accion)     # Filtro por valor y categoría
- (fecha_vinculacion, impacto)  # Tendencias temporales
- (verificado, is_active)       # Estado de verificación
```

---

## Showcase Publico

### URL Publica

El sistema incluye una URL publica para compartir la identidad corporativa sin necesidad de autenticacion:

```text
https://tu-dominio.com/showcase
```

### Caracteristicas

- **Sin autenticacion requerida**: Accesible para visitantes externos
- **Slides dinamicos**: Mision, Vision, Valores, Politica Integral, Metricas
- **QR Code**: Generado dinamicamente para compartir facilmente
- **Navegacion por teclado**: Flechas izquierda/derecha
- **Responsive**: Adaptado a dispositivos moviles

### Configuracion de Rutas

```tsx
// frontend/src/routes/index.tsx
<Route path="/showcase" element={withSuspense(PublicShowcasePage)} />
```

### Endpoint Backend

```python
# Backend endpoint publico
@action(detail=False, methods=['get'], permission_classes=[AllowAny])
def showcase(self, request):
    """Endpoint PUBLICO para el Showcase de Identidad Corporativa."""
    # Retorna identity, values, politica_integral, metrics, empresa
```

### Componente PublicShowcasePage

```tsx
// frontend/src/pages/PublicShowcasePage.tsx
import { PublicShowcasePage } from '@/pages/PublicShowcasePage';

// Caracteristicas:
// - Fetch de datos desde /api/identidad/identidad/showcase/
// - 5 slides: Mision, Vision, Valores, Politica, Metricas
// - Modal con QR code para compartir
// - Boton de copiar enlace al portapapeles
```

---

## Changelog

### v3.0 (2026-01-09)

- **Showcase Publico**: URL `/showcase` accesible sin autenticacion
- **QR Code dinamico**: Generado via API qrserver.com para compartir
- **Firma Manuscrita**: SignatureModal integrado en PoliticasManager
- **Vista Cards para Valores**: Toggle list/cards en ValoresDragDrop
- **Badge Notificaciones**: Contador dinamico en header
- **Multi-tenancy**: CorporateIdentity vinculado a EmpresaConfig
- **Correccion URLs**: Eliminadas rutas duplicadas `/api/api/...`

### v2.0 (2026-01-08)
- Agregado sistema de Valores Vividos con GenericForeignKey
- Agregados endpoints de metricas para BI
- Agregado componente IdentidadShowcase (presentacion fullscreen)
- Agregado widget ValorVinculadorWidget reutilizable
- Agregados hooks useValoresVividos para frontend

### v1.0 (2026-01-05)
- Modelos base de identidad corporativa
- Sistema de workflow y firma digital
- Exportacion PDF/DOCX
- Valores con drag & drop
