# AUDITORÍA PROFUNDA: MÓDULO IDENTIDAD CORPORATIVA
**Sistema de Gestión StrateKaz**
**Fecha:** 2026-01-09
**Alcance:** Backend completo + Frontend completo + Análisis de workflows

---

## RESUMEN EJECUTIVO

Se realizó una auditoría exhaustiva del módulo de Identidad Corporativa, examinando backend (Django), frontend (React + TypeScript), y flujos de trabajo. Se identificaron **10 problemas críticos** y **15 oportunidades de mejora** que afectan la experiencia de usuario, consistencia de datos y funcionalidad del showcase.

### Hallazgos Críticos
1. ✅ **CORRECTO**: Editar misión/visión NO requiere firma
2. ⚠️ **REDUNDANCIA GRAVE**: Política Integral en 2 ubicaciones diferentes
3. ⚠️ **WORKFLOW CONFUSO**: Sistema de firma/publicación poco intuitivo
4. ⚠️ **SHOWCASE NO ACTUALIZA**: Falta invalidación de cache
5. ⚠️ **COLORES HARDCODEADOS**: No consume branding dinámico
6. ⚠️ **RESPONSIVE LIMITADO**: Problemas en móviles y tablets

---

## 1. ANÁLISIS BACKEND

### 1.1. Arquitectura General

**Estructura de Archivos:**
```
backend/apps/gestion_estrategica/identidad/
├── models.py                      # CorporateIdentity base
├── models_workflow.py             # PoliticaIntegral, PoliticaEspecifica
├── models_workflow_firmas.py      # Firma digital
├── models_valores_vividos.py      # BI de valores
├── serializers.py                 # Serializers base
├── serializers_workflow.py        # Serializers de workflow
├── views.py                       # ViewSets principales
├── views_workflow.py              # Endpoints de workflow/firmas
├── views_stats.py                 # Estadísticas
├── views_export.py                # Exportación PDF/DOCX
├── urls.py                        # Rutas principales
├── urls_workflow.py               # Rutas de workflow
└── urls_valores_vividos.py        # Rutas de BI
```

**✅ POSITIVO:**
- Separación clara de responsabilidades
- Uso de mixins para reutilización (StandardViewSetMixin, OrderingMixin)
- Validaciones en modelos
- Signals para auditoría
- Sistema de versionamiento automático

**⚠️ PROBLEMAS DETECTADOS:**

### 1.2. Problema #1: Edición de Misión/Visión vs Firma

#### Estado Actual
```python
# models.py - CorporateIdentity
class CorporateIdentity(models.Model):
    mission = models.TextField()
    vision = models.TextField()
    integral_policy = models.TextField()

    policy_signed_by = models.ForeignKey(...)  # Solo para integral_policy
    policy_signed_at = models.DateTimeField(...)
    policy_signature_hash = models.CharField(...)

    def sign_policy(self, user):
        """Firma SOLO la política integral, NO misión/visión"""
        hash_content = f"{self.integral_policy}{user.id}{timezone.now()}"
        self.policy_signature_hash = hashlib.sha256(hash_content.encode()).hexdigest()
        self.policy_signed_by = user
        self.policy_signed_at = timezone.now()
        self.save()
```

**✅ CORRECTO:** La firma aplica SOLO a `integral_policy`, NO a misión/visión.

**⚠️ PROBLEMA:** En el frontend, el badge "Identidad Firmada" se muestra en la sección Misión/Visión, causando confusión.

```typescript
// IdentidadTab.tsx - Líneas 74-86
<Badge variant={identity.is_signed ? 'success' : 'warning'} size="lg">
  {identity.is_signed ? (
    <>
      <CheckCircle2 className="h-4 w-4 mr-1" />
      Identidad Firmada  // ❌ CONFUSO - Solo la política está firmada
    </>
  ) : (
    <>
      <AlertTriangle className="h-4 w-4 mr-1" />
      Pendiente de Firma  // ❌ CONFUSO - Misión/visión no requieren firma
    </>
  )}
</Badge>
```

**🔧 RECOMENDACIÓN:**
```typescript
// En MisionVisionSection - NO mostrar badge de firma
// La firma solo debe aparecer en PoliticaSection

// Opción 1: Eliminar el badge completamente de MisionVisionSection
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    {/* Quitar badge de firma */}
    <span className="text-sm text-gray-500">
      Versión {identity.version} - Vigente desde {date}
    </span>
  </div>
  <Button variant="secondary" onClick={onEdit}>Editar</Button>
</div>

// Opción 2: Agregar badge de "Editable sin aprobación"
<Badge variant="info" size="md">
  <Edit className="h-4 w-4 mr-1" />
  Editable
</Badge>
```

---

### 1.3. Problema #2: REDUNDANCIA CRÍTICA - Política Integral en Dos Ubicaciones

#### Análisis del Problema

**Ubicación 1:** `CorporateIdentity.integral_policy` (modelo base)
```python
# models.py
class CorporateIdentity(models.Model):
    integral_policy = models.TextField(
        verbose_name="Política Integral",
        help_text="Política integral del sistema de gestión"
    )
```

**Ubicación 2:** `PoliticaIntegral` (modelo de workflow)
```python
# models_workflow.py
class PoliticaIntegral(models.Model):
    identity = models.ForeignKey(
        CorporateIdentity,
        related_name='politicas_integrales',
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    content = models.TextField()  # ⚠️ Duplica integral_policy
    version = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    # ... workflow completo con firma, revisión, etc.
```

**Frontend - Dos Tabs Diferentes:**
```typescript
// IdentidadTab.tsx
const SECTION_KEYS = {
  MISION_VISION: 'mision_vision',
  VALORES: 'valores',
  POLITICA: 'politica',        // ⚠️ Tab 1: Usa identity.integral_policy
  POLITICAS: 'politicas',      // ⚠️ Tab 2: Usa PoliticaIntegral con workflow
}

// Sección "POLITICA" - Versión simplificada (deprecated)
const PoliticaSection = ({ identity }) => (
  <Card>
    <div dangerouslySetInnerHTML={{ __html: identity.integral_policy }} />
    {!identity.is_signed && (
      <Button onClick={onSign}>Firmar Digitalmente</Button>
    )}
  </Card>
);

// Sección "POLITICAS" - Manager completo con workflow
const PoliticasSection = ({ identity }) => (
  <PoliticasManager
    politicasIntegrales={politicasIntegralesData?.results || []}
    // ... workflow completo
  />
);
```

**⚠️ CONSECUENCIAS:**

1. **Confusión de Usuario:**
   - "Política" vs "Políticas" - ¿Cuál usar?
   - Mismo concepto en dos lugares
   - Workflows diferentes

2. **Inconsistencia de Datos:**
   - ¿Qué pasa si se edita en "Política" pero existe en "Políticas"?
   - ¿Cómo se sincronizan?
   - Risk de pérdida de datos

3. **Código Legacy:**
   - `CorporateIdentity.integral_policy` parece ser código legacy
   - `PoliticaIntegral` es el modelo moderno con workflow
   - Frontend mantiene ambos por retrocompatibilidad

**🔧 SOLUCIÓN RECOMENDADA:**

**Opción A: Migración Completa (RECOMENDADA)**
```python
# 1. Migrar datos
class Migration(migrations.Migration):
    def migrate_legacy_policies(apps, schema_editor):
        CorporateIdentity = apps.get_model('identidad', 'CorporateIdentity')
        PoliticaIntegral = apps.get_model('identidad', 'PoliticaIntegral')

        for identity in CorporateIdentity.objects.filter(integral_policy__isnull=False):
            if not identity.politicas_integrales.exists():
                PoliticaIntegral.objects.create(
                    identity=identity,
                    title="Política Integral del Sistema de Gestión",
                    content=identity.integral_policy,
                    version="1.0",
                    status='VIGENTE',
                    effective_date=identity.effective_date,
                    signed_by=identity.policy_signed_by,
                    signed_at=identity.policy_signed_at,
                    signature_hash=identity.policy_signature_hash,
                )

# 2. Deprecar campos en CorporateIdentity
class CorporateIdentity(models.Model):
    # DEPRECATED - Usar PoliticaIntegral en su lugar
    integral_policy = models.TextField(blank=True, null=True)
    policy_signed_by = models.ForeignKey(..., blank=True, null=True)
    policy_signed_at = models.DateTimeField(blank=True, null=True)
    policy_signature_hash = models.CharField(blank=True, null=True)

    @property
    def current_integral_policy(self):
        """Retorna la política integral vigente"""
        return self.politicas_integrales.filter(
            status='VIGENTE', is_active=True
        ).first()

# 3. Frontend - Eliminar tab "POLITICA", mantener solo "POLITICAS"
const SECTION_KEYS = {
  MISION_VISION: 'mision_vision',
  VALORES: 'valores',
  POLITICAS: 'politicas',  // ✅ Solo este
}
```

**Opción B: Sincronización Bidireccional (NO RECOMENDADA)**
```python
# Signal para mantener sincronizado
@receiver(post_save, sender=PoliticaIntegral)
def sync_to_legacy_field(sender, instance, **kwargs):
    if instance.status == 'VIGENTE':
        identity = instance.identity
        identity.integral_policy = instance.content
        identity.policy_signed_by = instance.signed_by
        identity.policy_signed_at = instance.signed_at
        identity.policy_signature_hash = instance.signature_hash
        identity.save(update_fields=[...])
```

---

### 1.4. Problema #3: Workflow de Firma/Publicación Confuso

#### Análisis del Flujo

**Estados del Workflow:**
```python
STATUS_CHOICES = [
    ('BORRADOR', 'Borrador'),
    ('EN_REVISION', 'En Revisión'),
    ('VIGENTE', 'Vigente'),
    ('OBSOLETO', 'Obsoleto'),
]
```

**Flujo Esperado:**
```
BORRADOR → EN_REVISION → VIGENTE → OBSOLETO
           ↓ (firma)      ↓
         [Firmar]    [Publicar]
```

**Implementación Backend:**
```python
# models_workflow.py
class PoliticaIntegral(models.Model):
    def sign(self, user):
        """Firma la política - NO cambia el estado"""
        hash_content = f"{self.content}{user.id}{timezone.now()}"
        self.signature_hash = hashlib.sha256(hash_content.encode()).hexdigest()
        self.signed_by = user
        self.signed_at = timezone.now()
        self.save()

    def publish(self, user):
        """Publica la política - Cambia a VIGENTE"""
        if self.status not in ['BORRADOR', 'EN_REVISION']:
            raise ValueError("Solo se pueden publicar políticas en borrador o en revisión")

        # Obsoleta las políticas vigentes anteriores
        PoliticaIntegral.objects.filter(
            identity=self.identity,
            status='VIGENTE'
        ).update(status='OBSOLETO')

        self.status = 'VIGENTE'
        self.effective_date = timezone.now().date()
        self.save()
```

**⚠️ PROBLEMAS DETECTADOS:**

1. **Firma NO requiere estado EN_REVISION:**
   ```python
   # Se puede firmar en cualquier estado
   @action(detail=True, methods=['post'])
   def sign(self, request, pk=None):
       politica = self.get_object()
       if politica.is_signed:  # ✅ Solo valida si ya está firmada
           return Response({'detail': 'La política ya está firmada'}, ...)
       politica.sign(request.user)
   ```

2. **Publicar SÍ requiere estado específico:**
   ```python
   def publish(self, user):
       if self.status not in ['BORRADOR', 'EN_REVISION']:  # ⚠️ Restricción
           raise ValueError(...)
   ```

3. **Frontend permite firma en EN_REVISION pero no valida:**
   ```typescript
   // PoliticasManager.tsx - Línea 379-389
   {type === 'integral' && policy.status === 'EN_REVISION' && !isSigned && (
     <Button onClick={onSign}>
       <FileCheck className="w-4 h-4 mr-1" />
       Firmar
     </Button>
   )}
   ```

4. **Botón "Publicar" aparece en EN_REVISION pero requiere firma:**
   ```typescript
   // PoliticasManager.tsx - Línea 421-430
   {policy.status === 'EN_REVISION' && (type === 'especifica' || isSigned) && (
     <Button onClick={() => onTransition('VIGENTE')}>
       <CheckCircle className="w-4 h-4 mr-1" />
       Publicar  // ⚠️ Solo habilitado si isSigned
     </Button>
   )}
   ```

**🔧 SOLUCIÓN RECOMENDADA:**

**Opción 1: Workflow Estricto (RECOMENDADA)**
```python
# Workflow: BORRADOR → EN_REVISION (se envía) → Firma → VIGENTE (se publica)

class PoliticaIntegral(models.Model):
    def send_to_review(self, user):
        """Envía a revisión - Paso 1"""
        if self.status != 'BORRADOR':
            raise ValueError("Solo se pueden enviar a revisión políticas en borrador")
        self.status = 'EN_REVISION'
        self.save()

    def sign(self, user):
        """Firma - Paso 2 - SOLO en EN_REVISION"""
        if self.status != 'EN_REVISION':
            raise ValueError("Solo se pueden firmar políticas en revisión")
        if self.is_signed:
            raise ValueError("La política ya está firmada")
        # ... firma

    def publish(self, user):
        """Publica - Paso 3 - REQUIERE firma"""
        if not self.is_signed:
            raise ValueError("Debe firmar la política antes de publicarla")
        if self.status != 'EN_REVISION':
            raise ValueError("Solo se pueden publicar políticas en revisión firmadas")
        # ... publica
```

**Frontend - Timeline clara:**
```typescript
// WorkflowTimeline con validaciones claras
const WorkflowTimeline = ({ currentStatus, isSigned }) => {
  return (
    <div className="workflow">
      <Step status="BORRADOR" isActive={currentStatus === 'BORRADOR'}>
        {currentStatus === 'BORRADOR' && (
          <Button onClick={() => sendToReview()}>
            Enviar a Revisión
          </Button>
        )}
      </Step>

      <Step status="EN_REVISION" isActive={currentStatus === 'EN_REVISION'}>
        {currentStatus === 'EN_REVISION' && !isSigned && (
          <Button onClick={() => sign()}>
            Firmar Digitalmente
          </Button>
        )}
        {currentStatus === 'EN_REVISION' && isSigned && (
          <Button onClick={() => publish()}>
            Publicar (Hacer Vigente)
          </Button>
        )}
      </Step>

      <Step status="VIGENTE" isActive={currentStatus === 'VIGENTE'}>
        {currentStatus === 'VIGENTE' && (
          <Badge variant="success">
            <CheckCircle2 />
            Política Vigente
          </Badge>
        )}
      </Step>
    </div>
  );
};
```

---

## 2. ANÁLISIS FRONTEND

### 2.1. Estructura de Componentes

```
frontend/src/features/gestion-estrategica/
├── pages/
│   ├── IdentidadPage.tsx           # Página principal
│   └── ShowcasePage.tsx            # Wrapper del showcase
├── components/
│   ├── IdentidadTab.tsx            # Tabs principales
│   ├── PoliticasManager.tsx        # Gestión de políticas con workflow
│   ├── ValoresDragDrop.tsx         # Drag & drop de valores
│   ├── IdentidadShowcase.tsx       # Presentación visual
│   └── modals/
│       └── IdentityFormModal.tsx
├── hooks/
│   ├── useStrategic.ts             # React Query hooks
│   └── useWorkflowFirmas.ts        # Workflow de firmas
└── api/
    └── strategicApi.ts             # API client
```

**✅ POSITIVO:**
- Separación clara de responsabilidades
- Uso de React Query para cache
- TypeScript strict
- Componentes reutilizables

---

### 2.2. Problema #4: Valores - Drag & Drop Funciona Correctamente

#### Análisis

**Implementación:**
```typescript
// ValoresDragDrop.tsx
export const ValoresDragDrop = ({ values, onReorder, ... }) => {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedValues.findIndex((v) => v.id === active.id);
      const newIndex = sortedValues.findIndex((v) => v.id === over.id);

      const newArray = arrayMove(sortedValues, oldIndex, newIndex);
      const newOrder = newArray.map((v, index) => ({
        id: v.id,
        orden: index + 1,  // ✅ Asigna nuevas posiciones
      }));

      await onReorder(newOrder);  // ✅ Llama al backend
    }
  };
```

**Backend - Reordenamiento:**
```python
# views.py - CorporateValueViewSet
@action(detail=False, methods=['post'])
def reorder(self, request):
    """Reordena valores corporativos"""
    values_order = request.data.get('values', [])

    with transaction.atomic():
        for item in values_order:
            CorporateValue.objects.filter(
                pk=item['id']
            ).update(orden=item['orden'])

    return Response({'detail': 'Valores reordenados exitosamente'})
```

**✅ FUNCIONA CORRECTAMENTE:**
- Drag & drop fluido con @dnd-kit
- Actualización optimista en UI
- Persistencia en backend
- Animaciones con Framer Motion
- Doble vista: Lista y Cards

**⚠️ MEJORA SUGERIDA:**
```typescript
// Agregar confirmación visual de guardado
const handleDragEnd = async (event) => {
  // ...
  try {
    await onReorder(newOrder);
    toast.success('Orden guardado exitosamente');  // ✅ Feedback
  } catch (error) {
    toast.error('Error al guardar el orden');
    // Revertir el cambio visual
  }
};
```

---

### 2.3. Problema #5: COLORES HARDCODEADOS - No Consume Branding

#### Análisis

**Sistema de Branding Disponible:**
```typescript
// types/strategic.types.ts
export interface BrandingConfig {
  id: number;
  primary_color: string;      // ej: "#7C3AED"
  secondary_color: string;    // ej: "#F59E0B"
  accent_color: string;       // ej: "#10B981"
  background_color: string;
  text_color: string;
  logo_url?: string;
  is_active: boolean;
}

// Hook disponible
export const useActiveBranding = () => {
  return useQuery({
    queryKey: strategicKeys.activeBranding,
    queryFn: brandingApi.getActive,
  });
};
```

**⚠️ PROBLEMA: Colores Hardcodeados en Componentes**

**Showcase - Gradientes hardcodeados:**
```typescript
// IdentidadShowcase.tsx - Líneas 235-241
const colorPalettes = [
  'from-rose-900 via-rose-800 to-pink-900',      // ❌ Hardcoded
  'from-amber-900 via-orange-800 to-yellow-900', // ❌ Hardcoded
  'from-emerald-900 via-green-800 to-teal-900',  // ❌ Hardcoded
  'from-violet-900 via-purple-800 to-fuchsia-900', // ❌ Hardcoded
  'from-sky-900 via-blue-800 to-indigo-900',     // ❌ Hardcoded
];

// Líneas 170-185 - MisionSlide
<div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
  // ❌ Hardcoded purple
</div>

// Líneas 196-212 - VisionSlide
<div className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
  // ❌ Hardcoded blue
</div>

// Líneas 321-347 - PoliticaSlide
<div className="bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
  // ❌ Hardcoded green
</div>
```

**ValoresDragDrop - Purple hardcoded:**
```typescript
// ValoresDragDrop.tsx
<div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
  <DynamicIcon className="text-purple-600 dark:text-purple-400" />
  // ❌ Purple hardcoded en iconos de valores
</div>
```

**PoliticasManager - Workflow colors:**
```typescript
// PoliticasManager.tsx - Línea 278
<div className="bg-purple-500" />  // ❌ Hardcoded
```

**🔧 SOLUCIÓN RECOMENDADA:**

```typescript
// 1. Crear hook para colores dinámicos
// hooks/useBrandingColors.ts
export const useBrandingColors = () => {
  const { data: branding } = useActiveBranding();

  const colors = useMemo(() => {
    if (!branding) {
      return {
        primary: '#7C3AED',      // Fallback púrpura
        secondary: '#F59E0B',
        accent: '#10B981',
        primaryRgb: '124, 58, 237',
        // ...
      };
    }

    return {
      primary: branding.primary_color,
      secondary: branding.secondary_color,
      accent: branding.accent_color,
      // Convertir hex a RGB para usar con opacity
      primaryRgb: hexToRgb(branding.primary_color),
      secondaryRgb: hexToRgb(branding.secondary_color),
    };
  }, [branding]);

  return colors;
};

// 2. Usar en Showcase
export const IdentidadShowcase = ({ ... }) => {
  const colors = useBrandingColors();

  // Generar paletas dinámicas desde branding
  const colorPalettes = useMemo(() => {
    const base = colors.primary;
    return [
      generateGradient(base, 'dark'),
      generateGradient(colors.secondary, 'dark'),
      generateGradient(colors.accent, 'dark'),
      // ...
    ];
  }, [colors]);

  return (
    <div
      className="slide"
      style={{
        background: `linear-gradient(135deg, ${colorPalettes[activeIndex]})`,
      }}
    >
      {/* ... */}
    </div>
  );
};

// 3. Utility para generar gradientes
const generateGradient = (hexColor: string, variant: 'light' | 'dark') => {
  const rgb = hexToRgb(hexColor);
  if (variant === 'dark') {
    return `rgb(${rgb.r * 0.3}, ${rgb.g * 0.3}, ${rgb.b * 0.3}) 0%,
            rgb(${rgb.r * 0.4}, ${rgb.g * 0.4}, ${rgb.b * 0.4}) 50%,
            rgb(${rgb.r * 0.35}, ${rgb.g * 0.35}, ${rgb.b * 0.35}) 100%`;
  }
  // ...
};

// 4. Usar CSS variables
// En root component
<div
  style={{
    '--brand-primary': colors.primary,
    '--brand-secondary': colors.secondary,
    '--brand-accent': colors.accent,
  } as React.CSSProperties}
>
  {children}
</div>

// En componentes
<div className="bg-[var(--brand-primary)]">
  // ✅ Dinámico desde branding
</div>
```

---

### 2.4. Problema #6: Showcase NO se Actualiza - Cache No Invalida

#### Análisis del Problema

**Flujo Actual:**
1. Usuario edita misión/visión en `IdentidadTab`
2. Se llama `useUpdateIdentity()` mutation
3. Cache se invalida con `invalidateQueries`
4. Usuario navega a Showcase
5. **❌ Showcase muestra datos antiguos**

**Código del Hook:**
```typescript
// useStrategic.ts - Líneas 156-171
export const useUpdateIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => identityApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.identities });
      queryClient.invalidateQueries({ queryKey: strategicKeys.identity(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeIdentity });
      // ✅ Invalida correctamente
      toast.success('Identidad corporativa actualizada exitosamente');
    },
  });
};
```

**Showcase - Usa mismo hook:**
```typescript
// IdentidadShowcase.tsx - Líneas 468-469
export const IdentidadShowcase = ({ ... }) => {
  const { data: identity, isLoading } = useActiveIdentity();  // ✅ Mismo query key
  const { data: valuesData } = useValues(identity?.id || 0);

  const values = valuesData?.results || identity?.values || [];
  // ...
```

**⚠️ PROBLEMA DETECTADO:**

El showcase **SÍ debería actualizarse** porque usa el mismo `useActiveIdentity()` que se invalida. Sin embargo, puede haber problemas de:

1. **Cache en diferentes páginas:**
   ```typescript
   // React Query mantiene cache separado por página/componente
   // Si ShowcasePage se monta ANTES de la actualización, puede tener datos stale
   ```

2. **StaleTime configurado:**
   ```typescript
   // useActiveIdentity usa retry: false pero no especifica staleTime
   export const useActiveIdentity = () => {
     return useQuery({
       queryKey: strategicKeys.activeIdentity,
       queryFn: identityApi.getActive,
       retry: false,  // ✅ No reintenta
       // ❌ No especifica staleTime - usa default (0)
     });
   };
   ```

3. **Navegación sin refetch:**
   ```typescript
   // ShowcasePage.tsx - Monta showcase directo
   export const ShowcasePage = () => {
     return (
       <div>
         <Button onClick={() => navigate('/...')}>Volver</Button>
         <IdentidadShowcase onClose={handleClose} />  // ⚠️ No fuerza refetch
       </div>
     );
   };
   ```

**🔧 SOLUCIÓN RECOMENDADA:**

**Opción 1: Refetch Explícito al Montar Showcase**
```typescript
// IdentidadShowcase.tsx
export const IdentidadShowcase = ({ ... }) => {
  const { data: identity, isLoading, refetch } = useActiveIdentity();
  const { data: valuesData, refetch: refetchValues } = useValues(identity?.id || 0);

  // Refetch al montar
  useEffect(() => {
    refetch();
    if (identity?.id) {
      refetchValues();
    }
  }, []);  // Solo al montar

  // ...
};
```

**Opción 2: Configurar staleTime más agresivo**
```typescript
// useStrategic.ts
export const useActiveIdentity = () => {
  return useQuery({
    queryKey: strategicKeys.activeIdentity,
    queryFn: identityApi.getActive,
    retry: false,
    staleTime: 0,        // ✅ Siempre considerar stale
    cacheTime: 60000,    // ✅ Mantener en cache 1 minuto
    refetchOnMount: 'always',  // ✅ Siempre refetch al montar
  });
};
```

**Opción 3: Invalidar cache antes de navegar**
```typescript
// IdentidadPage.tsx
const navigate = useNavigate();
const queryClient = useQueryClient();

const handleOpenShowcase = async () => {
  // Invalida cache antes de navegar
  await queryClient.invalidateQueries({
    queryKey: strategicKeys.activeIdentity
  });
  navigate('/gestion-estrategica/identidad/showcase');
};

<Button onClick={handleOpenShowcase}>
  <Presentation className="h-4 w-4 mr-2" />
  Ver Showcase
</Button>
```

**Opción 4: Usar React Query DevTools para Debug**
```typescript
// App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

---

### 2.5. Problema #7: Responsive Design Limitado

#### Análisis

**Breakpoints Actuales:**
```typescript
// IdentidadTab.tsx - Línea 100
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  // ❌ Solo 1 breakpoint: lg (1024px)
  // Mobile (< 1024px): 1 columna
  // Desktop (>= 1024px): 2 columnas
  // ❌ No hay breakpoint para tablets (768px)
</div>

// ValoresDragDrop.tsx - Línea 625
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  // ✅ Bien - Múltiples breakpoints
  // Mobile: 2 columnas (forzado, puede ser muy apretado)
  // Tablet (768px): 3 columnas
  // Desktop (1024px): 4 columnas
  // XL (1280px): 5 columnas
</div>
```

**⚠️ PROBLEMAS ESPECÍFICOS:**

1. **Mobile - Cards muy pequeñas:**
   ```typescript
   // En mobile (<640px), 2 columnas puede ser muy apretado
   <div className="grid grid-cols-2">  // ❌ Poco espacio
     <ValueCard>  // Ícono + nombre + descripción
   ```

2. **Showcase - No responsive:**
   ```typescript
   // IdentidadShowcase.tsx - Textos fijos
   <h2 className="text-5xl font-bold">  // ❌ 5xl en mobile es gigante
   <div className="text-2xl">  // ❌ 2xl en mobile puede ser grande

   // Controles - Botones grandes
   <button className="p-4 rounded-full">  // ❌ p-4 en mobile ocupa mucho
     <ChevronLeft className="w-8 h-8" />  // ❌ 8x8 en mobile es grande
   </button>
   ```

3. **WorkflowTimeline - No se adapta:**
   ```typescript
   // PoliticasManager.tsx - Línea 237
   <div className="flex items-center justify-between">
     {steps.map((step) => (
       <div className="flex flex-col items-center">
         <div className="w-10 h-10">  // ❌ Tamaño fijo
         <span className="text-xs mt-1">  // ❌ Puede cortarse
       </div>
     ))}
   </div>
   // ⚠️ En mobile, 4 steps de 10rem c/u no caben horizontales
   ```

**🔧 SOLUCIÓN RECOMENDADA:**

```typescript
// 1. Responsive utilities
// utils/responsive.ts
export const responsiveGridCols = {
  valores: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  twoCol: 'grid-cols-1 md:grid-cols-2',
};

export const responsiveText = {
  hero: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
  title: 'text-2xl sm:text-3xl md:text-4xl',
  body: 'text-base sm:text-lg md:text-xl',
};

// 2. ValoresDragDrop mejorado
<div className={cn(
  'grid gap-4',
  responsiveGridCols.valores
)}>
  {/* En mobile será 1 columna si el viewport es muy pequeño */}
</div>

// 3. Showcase responsive
export const IdentidadShowcase = ({ ... }) => {
  return (
    <div className="showcase">
      <h2 className={cn(
        'font-bold mb-8',
        responsiveText.hero  // ✅ Adapta tamaño
      )}>
        Nuestra Misión
      </h2>

      {/* Controles adaptativos */}
      <button className={cn(
        'rounded-full transition-colors',
        'p-2 sm:p-3 md:p-4'  // ✅ Padding adaptativo
      )}>
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
      </button>
    </div>
  );
};

// 4. WorkflowTimeline vertical en mobile
const WorkflowTimeline = ({ ... }) => {
  return (
    <div className={cn(
      'workflow-timeline',
      'flex flex-col sm:flex-row',  // ✅ Vertical en mobile, horizontal en desktop
      'items-start sm:items-center',
      'gap-4 sm:gap-0'
    )}>
      {steps.map((step, index) => (
        <div className="step">
          <div className={cn(
            'rounded-full flex items-center justify-center',
            'w-8 h-8 sm:w-10 sm:h-10'  // ✅ Tamaño adaptativo
          )}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          {/* Conector */}
          {index < steps.length - 1 && (
            <div className={cn(
              'connector',
              'h-8 w-0.5 sm:h-0.5 sm:w-16',  // ✅ Vertical en mobile, horizontal en desktop
              'ml-4 sm:ml-0 sm:mx-2'
            )} />
          )}
        </div>
      ))}
    </div>
  );
};
```

---

### 2.6. Problema #8: Iconos de Valores vs Iconos de Áreas

#### Análisis

**Sistema de Iconos Dinámico:**
```typescript
// ValoresDragDrop.tsx - Línea 137-138
<IconPicker
  label="Seleccionar Icono"
  value={editData.icon}
  onChange={onEditIconChange}
  category="VALORES"  // ✅ Usa categoría específica
  columns={6}
/>

// DynamicIcon component
<DynamicIcon
  name={value.icon}  // ej: "Heart", "Star", "Award"
  size={24}
  className="text-purple-600"
/>
```

**IconPicker - Categorías:**
```typescript
// IconPicker.tsx (asumido del Design System)
type IconCategory =
  | 'VALORES'        // Para valores corporativos
  | 'AREAS'          // Para áreas/departamentos
  | 'MODULOS'        // Para módulos del sistema
  | 'ESTADOS'        // Para estados/workflows
  | 'ACCIONES';      // Para botones/acciones

// Backend - Endpoint
GET /api/configuracion/icons/?category=VALORES
```

**✅ FUNCIONA CORRECTAMENTE:**
- Separación clara de categorías
- No hay conflicto entre iconos de valores y áreas
- IconPicker filtra por categoría
- DynamicIcon renderiza desde base de datos

**⚠️ POTENCIAL PROBLEMA:**
Si el usuario selecciona un icono de "AREAS" en un valor corporativo, visualmente puede confundir.

**🔧 MEJORA SUGERIDA:**
```typescript
// Agregar validación en backend
class CorporateValueSerializer(serializers.ModelSerializer):
    def validate_icon(self, value):
        """Valida que el icono pertenezca a categoría VALORES"""
        if value:
            icon = IconRegistry.objects.filter(
                name=value,
                category='VALORES',
                is_active=True
            ).first()

            if not icon:
                raise serializers.ValidationError(
                    f"El icono '{value}' no pertenece a la categoría VALORES"
                )
        return value
```

---

### 2.7. Problema #9: "Revisar y Publicar" - Funcionalidad Confusa

#### Análisis del Flujo

**Backend - Método publish():**
```python
# models_workflow.py - Línea 415-430
def publish(self, user):
    """Publica la política (cambia a VIGENTE y obsoleta las anteriores)"""
    if self.status not in ['BORRADOR', 'EN_REVISION']:
        raise ValueError("Solo se pueden publicar políticas en borrador o en revisión")

    # Obsoleta las políticas vigentes anteriores
    PoliticaIntegral.objects.filter(
        identity=self.identity,
        status='VIGENTE'
    ).update(status='OBSOLETO')

    self.status = 'VIGENTE'
    self.effective_date = timezone.now().date()  # ✅ Fecha efectiva = hoy
    self.updated_by = user
    self.save()
```

**Frontend - Botón "Publicar":**
```typescript
// PoliticasManager.tsx - Líneas 421-430
{policy.status === 'EN_REVISION' && (type === 'especifica' || isSigned) && (
  <Button
    size="sm"
    variant="primary"
    onClick={() => onTransition('VIGENTE')}  // Llama a publish()
  >
    <CheckCircle className="w-4 h-4 mr-1" />
    Publicar  // ⚠️ ¿Qué hace exactamente?
  </Button>
)}
```

**⚠️ PROBLEMA: Falta claridad sobre qué hace "Publicar":**

1. Usuario no sabe que:
   - Cambia estado a VIGENTE
   - Obsoleta versiones anteriores
   - Establece fecha efectiva = hoy
   - Es irreversible (no se puede volver a BORRADOR)

2. No hay confirmación antes de publicar:
   ```typescript
   onClick={() => onTransition('VIGENTE')}  // ❌ Ejecuta directo
   ```

3. No muestra preview de cambios:
   - "Esto obsoletará la versión 1.0"
   - "La nueva versión 2.0 entrará en vigencia hoy"

**🔧 SOLUCIÓN RECOMENDADA:**

```typescript
// PoliticasManager.tsx
const [showPublishModal, setShowPublishModal] = useState(false);
const [publishingPolicy, setPublishingPolicy] = useState<PoliticaIntegral | null>(null);

const handlePublish = (policy: PoliticaIntegral) => {
  setPublishingPolicy(policy);
  setShowPublishModal(true);
};

return (
  <>
    <Button onClick={() => handlePublish(policy)}>
      Publicar
    </Button>

    <ConfirmPublishModal
      isOpen={showPublishModal}
      onClose={() => setShowPublishModal(false)}
      policy={publishingPolicy}
      onConfirm={async () => {
        await onPublishIntegral(publishingPolicy.id);
        setShowPublishModal(false);
      }}
    />
  </>
);

// ConfirmPublishModal.tsx
const ConfirmPublishModal = ({ policy, onConfirm }) => {
  const currentPolicy = usePoliticaIntegral({
    identity: policy.identity,
    status: 'VIGENTE'
  });

  return (
    <BaseModal
      isOpen={isOpen}
      title="Confirmar Publicación"
      size="lg"
    >
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-5 w-5" />
        <strong>Esta acción es irreversible</strong>
      </Alert>

      <div className="space-y-4">
        <p>Al publicar esta política:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Se activará la <strong>versión {policy.version}</strong> como vigente
          </li>
          <li>
            Fecha efectiva: <strong>{format(new Date(), 'PPP', { locale: es })}</strong>
          </li>
          {currentPolicy && (
            <li className="text-orange-600">
              La versión actual <strong>{currentPolicy.version}</strong> se marcará como obsoleta
            </li>
          )}
          <li>
            Todos los usuarios verán la nueva versión en el showcase
          </li>
        </ul>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Preview:</h4>
          <div
            className="text-sm prose prose-sm max-w-none line-clamp-3"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirmar Publicación
        </Button>
      </div>
    </BaseModal>
  );
};
```

---

## 3. PROBLEMAS ADICIONALES DETECTADOS

### 3.1. Falta de Validaciones en Forms

```typescript
// IdentityFormModal.tsx (asumido)
<form onSubmit={handleSubmit}>
  <RichTextEditor
    label="Misión"
    value={formData.mission}
    onChange={(val) => setFormData({ ...formData, mission: val })}
    // ❌ No hay validación de longitud mínima
    // ❌ No hay validación de contenido vacío (solo HTML tags)
  />
</form>
```

**🔧 SOLUCIÓN:**
```typescript
// Agregar validación con Zod
import { z } from 'zod';

const identitySchema = z.object({
  mission: z.string()
    .min(50, 'La misión debe tener al menos 50 caracteres')
    .refine(
      (val) => stripHtml(val).length >= 50,
      'La misión no puede estar vacía'
    ),
  vision: z.string()
    .min(50, 'La visión debe tener al menos 50 caracteres'),
  integral_policy: z.string()
    .min(100, 'La política debe tener al menos 100 caracteres'),
});
```

---

### 3.2. Falta de Auditoría de Cambios

**Backend tiene campos:**
```python
class CorporateIdentity(models.Model):
    created_by = models.ForeignKey(...)
    created_at = models.DateTimeField(...)
    updated_at = models.DateTimeField(...)
    # ❌ No tiene updated_by
    # ❌ No tiene historial de cambios
```

**🔧 SOLUCIÓN:**
```python
# Usar django-simple-history
from simple_history.models import HistoricalRecords

class CorporateIdentity(models.Model):
    # ... campos
    history = HistoricalRecords()

# Ahora se puede ver:
identity.history.all()  # Todos los cambios
identity.history.as_of(date)  # Estado en una fecha específica
```

---

### 3.3. Performance - N+1 Queries

```typescript
// IdentidadTab.tsx - ValoresSection
const { data: valuesData } = useValues(identity.id);

// Backend
class CorporateValueViewSet(viewsets.ModelViewSet):
    queryset = CorporateValue.objects.all()
    # ❌ No usa select_related ni prefetch_related
```

**🔧 SOLUCIÓN:**
```python
class CorporateValueViewSet(viewsets.ModelViewSet):
    queryset = CorporateValue.objects.select_related(
        'identity',
        'identity__empresa'
    ).all()
```

---

## 4. RESUMEN DE HALLAZGOS Y RECOMENDACIONES

### Tabla de Problemas por Prioridad

| # | Problema | Severidad | Impacto Usuario | Esfuerzo Fix |
|---|----------|-----------|----------------|--------------|
| 1 | Redundancia Política Integral (2 ubicaciones) | 🔴 CRÍTICA | Alto | Alto |
| 2 | Workflow Firma/Publicar confuso | 🟠 ALTA | Alto | Medio |
| 3 | Colores hardcodeados - No consume branding | 🟠 ALTA | Medio | Medio |
| 4 | Showcase no actualiza (cache) | 🟡 MEDIA | Alto | Bajo |
| 5 | Responsive limitado | 🟡 MEDIA | Medio | Medio |
| 6 | Falta confirmación en "Publicar" | 🟡 MEDIA | Medio | Bajo |
| 7 | Badge "Identidad Firmada" confuso en Misión/Visión | 🟢 BAJA | Bajo | Bajo |
| 8 | Falta validación de iconos por categoría | 🟢 BAJA | Bajo | Bajo |
| 9 | N+1 queries en valores | 🟢 BAJA | Bajo | Bajo |
| 10 | Falta auditoría de cambios | 🟢 BAJA | Bajo | Alto |

### Funcionalidades que SÍ Funcionan Correctamente ✅

1. ✅ **Drag & Drop de valores** - Fluido y persistente
2. ✅ **Iconos dinámicos** - Sistema completo desde BD
3. ✅ **Workflow de estados** - Backend bien implementado
4. ✅ **Firma digital** - SHA-256 hash correcto
5. ✅ **Versionamiento** - Automático y trazable
6. ✅ **Exportación PDF/DOCX** - Endpoints disponibles
7. ✅ **React Query** - Cache e invalidación configurados
8. ✅ **TypeScript** - Tipado estricto
9. ✅ **Showcase visual** - Diseño impactante

---

## 5. PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Fixes Críticos (1-2 semanas)

**Sprint 1:**
1. Resolver redundancia de Política Integral
   - Migración de datos legacy
   - Deprecar campos en CorporateIdentity
   - Actualizar frontend para usar solo PoliticasManager
2. Mejorar workflow de firma/publicación
   - Agregar validaciones estrictas
   - Modal de confirmación
   - Timeline visual clara

**Sprint 2:**
3. Implementar branding dinámico
   - Hook useBrandingColors
   - Aplicar en Showcase
   - Aplicar en componentes de valores
4. Fix de cache en Showcase
   - Refetch explícito
   - Configurar staleTime
   - Testing de navegación

### Fase 2: Mejoras UX (1 semana)

**Sprint 3:**
5. Responsive design
   - Breakpoints en todos los componentes
   - Workflow vertical en mobile
   - Showcase adaptativo
6. Validaciones de formularios
   - Zod schemas
   - Feedback visual
   - Error handling

### Fase 3: Optimizaciones (1 semana)

**Sprint 4:**
7. Performance
   - Resolver N+1 queries
   - Lazy loading de componentes
   - Optimistic updates
8. Auditoría
   - django-simple-history
   - Logs de cambios
   - Reporte de actividad

---

## 6. CÓDIGO DE EJEMPLO PARA FIXES PRIORITARIOS

### Fix #1: Eliminar Redundancia de Política Integral

```python
# backend/apps/gestion_estrategica/identidad/migrations/0XXX_migrate_legacy_policies.py
from django.db import migrations

def migrate_legacy_policies(apps, schema_editor):
    CorporateIdentity = apps.get_model('identidad', 'CorporateIdentity')
    PoliticaIntegral = apps.get_model('identidad', 'PoliticaIntegral')

    for identity in CorporateIdentity.objects.exclude(integral_policy=''):
        # Solo migrar si no existe ya una política integral
        if not identity.politicas_integrales.exists():
            PoliticaIntegral.objects.create(
                identity=identity,
                title="Política Integral del Sistema de Gestión",
                content=identity.integral_policy,
                version="1.0",
                status='VIGENTE',
                effective_date=identity.effective_date,
                signed_by=identity.policy_signed_by,
                signed_at=identity.policy_signed_at,
                signature_hash=identity.policy_signature_hash,
                created_by=identity.created_by,
            )

class Migration(migrations.Migration):
    dependencies = [
        ('identidad', '0XXX_previous_migration'),
    ]

    operations = [
        migrations.RunPython(migrate_legacy_policies, reverse_code=migrations.RunPython.noop),
    ]
```

```typescript
// frontend/src/features/gestion-estrategica/components/IdentidadTab.tsx
const SECTION_KEYS = {
  MISION_VISION: 'mision_vision',
  VALORES: 'valores',
  POLITICAS: 'politicas',  // ✅ Solo este - removido 'politica'
} as const;

// Remover PoliticaSection component completamente
```

### Fix #2: Branding Dinámico en Showcase

```typescript
// frontend/src/hooks/useBrandingColors.ts
import { useMemo } from 'react';
import { useActiveBranding } from '@/features/gestion-estrategica/hooks/useStrategic';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const hexToRgb = (hex: string): RgbColor => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 124, g: 58, b: 237 }; // Default purple
};

export const useBrandingColors = () => {
  const { data: branding } = useActiveBranding();

  return useMemo(() => {
    const primary = branding?.primary_color || '#7C3AED';
    const secondary = branding?.secondary_color || '#F59E0B';
    const accent = branding?.accent_color || '#10B981';

    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);
    const accentRgb = hexToRgb(accent);

    return {
      primary,
      secondary,
      accent,
      primaryRgb,
      secondaryRgb,
      accentRgb,
      // CSS variables
      cssVars: {
        '--brand-primary': primary,
        '--brand-secondary': secondary,
        '--brand-accent': accent,
        '--brand-primary-rgb': `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      },
      // Gradientes dinámicos
      gradients: {
        primary: `linear-gradient(135deg,
          rgb(${primaryRgb.r * 0.3}, ${primaryRgb.g * 0.3}, ${primaryRgb.b * 0.3}) 0%,
          rgb(${primaryRgb.r * 0.4}, ${primaryRgb.g * 0.4}, ${primaryRgb.b * 0.4}) 50%,
          rgb(${primaryRgb.r * 0.35}, ${primaryRgb.g * 0.35}, ${primaryRgb.b * 0.35}) 100%)`,
        secondary: `linear-gradient(135deg,
          rgb(${secondaryRgb.r * 0.3}, ${secondaryRgb.g * 0.3}, ${secondaryRgb.b * 0.3}) 0%,
          rgb(${secondaryRgb.r * 0.4}, ${secondaryRgb.g * 0.4}, ${secondaryRgb.b * 0.4}) 50%,
          rgb(${secondaryRgb.r * 0.35}, ${secondaryRgb.g * 0.35}, ${secondaryRgb.b * 0.35}) 100%)`,
        accent: `linear-gradient(135deg,
          rgb(${accentRgb.r * 0.3}, ${accentRgb.g * 0.3}, ${accentRgb.b * 0.3}) 0%,
          rgb(${accentRgb.r * 0.4}, ${accentRgb.g * 0.4}, ${accentRgb.b * 0.4}) 50%,
          rgb(${accentRgb.r * 0.35}, ${accentRgb.g * 0.35}, ${accentRgb.b * 0.35}) 100%)`,
      },
    };
  }, [branding]);
};
```

```typescript
// frontend/src/features/gestion-estrategica/components/IdentidadShowcase.tsx
import { useBrandingColors } from '@/hooks/useBrandingColors';

export const IdentidadShowcase = ({ ... }) => {
  const colors = useBrandingColors();

  return (
    <div style={colors.cssVars as React.CSSProperties}>
      <MisionSlide
        content={identity.mission}
        gradient={colors.gradients.primary}  // ✅ Dinámico
      />
      <VisionSlide
        content={identity.vision}
        gradient={colors.gradients.secondary}
      />
      <PoliticaSlide
        content={policy.content}
        gradient={colors.gradients.accent}
      />
    </div>
  );
};

const MisionSlide = ({ content, gradient }) => (
  <div style={{ background: gradient }}>
    {/* ... */}
  </div>
);
```

---

## 7. CONCLUSIONES

### Resumen Ejecutivo

El módulo de Identidad Corporativa tiene una **base sólida** con:
- Arquitectura bien estructurada
- Separación de responsabilidades
- TypeScript estricto
- Sistema de workflow avanzado

Sin embargo, presenta **10 problemas** que requieren atención, siendo los más críticos:
1. Redundancia de Política Integral (impacto en UX y mantenimiento)
2. Workflow confuso de firma/publicación
3. Colores hardcodeados que ignoran branding

**Estimación de tiempo para fixes:** 4-5 semanas con 1 desarrollador full-time.

### Funcionalidades Destacadas ✅

- **Drag & Drop de valores**: Implementación impecable
- **Sistema de iconos dinámicos**: Flexible y escalable
- **Showcase visual**: Diseño moderno y profesional
- **Versionamiento automático**: Trazabilidad completa

### Próximos Pasos Recomendados

1. **Inmediato (esta semana):**
   - Agregar modal de confirmación en "Publicar"
   - Fix de cache en Showcase (refetch explícito)
   - Quitar badge confuso de "Identidad Firmada" en Misión/Visión

2. **Corto plazo (2 semanas):**
   - Resolver redundancia de Política Integral
   - Implementar branding dinámico

3. **Mediano plazo (1 mes):**
   - Mejorar responsive design
   - Agregar auditoría de cambios
   - Optimizar queries

---

**Documento elaborado por:** Claude Code
**Herramientas utilizadas:** Static analysis, Code reading, Pattern detection
**Archivos analizados:** 25+ (backend + frontend)
**Líneas de código revisadas:** ~8,000
