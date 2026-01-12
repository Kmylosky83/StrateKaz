# Plan de Refactorización: Sistema Unificado de Políticas

## Resumen Ejecutivo

Refactorización completa del módulo de políticas para crear un sistema unificado, dinámico y sin código legacy que permita crear cualquier tipo de política con workflow de firmas configurable.

**Objetivos:**
- Modal unificado para todos los tipos de políticas
- Normas ISO 100% dinámicas desde base de datos
- Workflow de firmas configurable por tipo de política
- Eliminación del Showcase (migrar a módulo Informes)
- Cero hardcoding, consumo total del Design System
- Sin dependencias circulares
- Eliminación de código legacy/deprecado

---

## Fase 1: Preparación y Limpieza (Foundation)

### 1.1 Crear Tipos Unificados

**Archivo:** `frontend/src/features/gestion-estrategica/types/policies.types.ts`

```typescript
// Enumeraciones base
export type PoliticaStatus = 'BORRADOR' | 'EN_REVISION' | 'VIGENTE' | 'OBSOLETO';
export type RolFirmante = 'ELABORO' | 'REVISO_TECNICO' | 'REVISO_JURIDICO' | 'APROBO_DIRECTOR' | 'APROBO_GERENTE' | 'APROBO_REPRESENTANTE_LEGAL';
export type EstadoFirma = 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO' | 'REVOCADO';
export type TipoPolitica = 'INTEGRAL' | 'ESPECIFICA';

// Norma ISO - Dinámico desde BD
export interface NormaISO {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  description?: string;
  category?: string;
  version?: string;
  icon?: string;
  color?: string;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
}

// Política Unificada - Base para todas
export interface PoliticaBase {
  id: number;
  identity: number;
  tipo: TipoPolitica;
  code?: string;           // Auto-generado o manual
  title: string;
  content: string;
  version: string;
  status: PoliticaStatus;
  effective_date?: string;
  review_date?: string;
  normas_aplicables: number[];  // IDs de NormaISO

  // Workflow de firmas
  workflow_id?: number;
  estado_workflow?: EstadoProcesoFirma;
  firmas?: FirmaIndividual[];

  // Responsables (para específicas)
  area_id?: number;
  responsible_id?: number;
  responsible_cargo_id?: number;

  // Auditoría
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

// DTOs
export interface CreatePoliticaDTO {
  identity: number;
  tipo: TipoPolitica;
  code?: string;
  title: string;
  content: string;
  version?: string;
  effective_date?: string;
  review_date?: string;
  normas_aplicables: number[];
  workflow_id?: number;
  area_id?: number;
  responsible_id?: number;
  responsible_cargo_id?: number;
}

export interface UpdatePoliticaDTO extends Partial<Omit<CreatePoliticaDTO, 'identity' | 'tipo'>> {}

// Filtros
export interface PoliticaFilters {
  identity?: number;
  tipo?: TipoPolitica;
  norma_iso?: number;
  status?: PoliticaStatus;
  area?: number;
  needs_review?: boolean;
  search?: string;
}
```

### 1.2 Romper Dependencias Circulares

**Problema identificado:** `useWorkflowFirmas` → `SignatureModal`

**Solución:**
```typescript
// Crear: frontend/src/types/signature.types.ts
export interface SignatureData {
  signatureDataUrl: string;
  signatureHash: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
  };
}

export interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (data: SignatureData) => Promise<void>;
  title?: string;
  description?: string;
}
```

**Actualizar imports en:**
- `frontend/src/features/gestion-estrategica/hooks/useWorkflowFirmas.ts`
- `frontend/src/components/modals/SignatureModal.tsx`

### 1.3 Eliminar Hooks Legacy

**Archivo:** `frontend/src/features/gestion-estrategica/hooks/useStrategic.ts`

**Eliminar:**
```typescript
// ELIMINAR - Líneas 206-219
/**
 * @deprecated Este hook está deprecado desde v3.0.
 */
export const useSignPolicy = () => { ... }
```

**Eliminar campos legacy en backend:**
```python
# backend/apps/gestion_estrategica/identidad/models.py
# ELIMINAR de CorporateIdentity:
# - integral_policy (TextField)
# - policy_signed_by (FK)
# - policy_signed_at (DateTimeField)
# - policy_signature_hash (CharField)
```

---

## Fase 2: Backend - API Unificada

### 2.1 Crear Modelo TipoPolitica Dinámico

**Archivo:** `backend/apps/gestion_estrategica/identidad/models.py`

```python
class TipoPolitica(TimestampedModel, SoftDeleteModel):
    """Tipos de política configurables dinámicamente"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    prefijo_codigo = models.CharField(max_length=20, default='POL')

    # Configuración de workflow
    requiere_firma = models.BooleanField(default=True)
    flujo_firma_default = models.ForeignKey(
        'ConfiguracionFlujoFirma',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    # Normas asociadas por defecto
    normas_iso_default = models.ManyToManyField('NormaISO', blank=True)

    # UI
    icon = models.CharField(max_length=50, default='FileText')
    color = models.CharField(max_length=20, default='blue')
    orden = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    empresa_id = models.PositiveBigIntegerField(db_index=True)

    class Meta:
        ordering = ['orden', 'name']
        unique_together = ['empresa_id', 'code']
```

### 2.2 Refactorizar Modelo Politica (Unificado)

```python
class Politica(TimestampedModel, SoftDeleteModel, AuditModel):
    """Modelo unificado para todas las políticas"""
    identity = models.ForeignKey(
        'CorporateIdentity',
        on_delete=models.CASCADE,
        related_name='politicas'
    )
    tipo = models.ForeignKey(
        'TipoPolitica',
        on_delete=models.PROTECT,
        related_name='politicas'
    )

    # Identificación
    code = models.CharField(max_length=50)  # POL-INT-001, POL-SST-001
    title = models.CharField(max_length=200)
    content = models.TextField()
    version = models.CharField(max_length=20, default='1.0')

    # Estado y vigencia
    status = models.CharField(
        max_length=20,
        choices=POLICY_STATUS_CHOICES,
        default='BORRADOR'
    )
    effective_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    review_date = models.DateField(null=True, blank=True)

    # Normas aplicables (dinámico)
    normas_aplicables = models.ManyToManyField(
        'configuracion.NormaISO',
        blank=True,
        related_name='politicas'
    )

    # Responsables (opcional según tipo)
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='politicas_responsable'
    )
    responsible_cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    # Workflow de firmas
    proceso_firma = models.OneToOneField(
        'ProcesoFirmaPolitica',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='politica_asociada'
    )

    # Documentos
    document_file = models.FileField(
        upload_to='politicas/pdf/%Y/%m/',
        null=True, blank=True
    )
    change_reason = models.TextField(blank=True)
    keywords = models.JSONField(default=list, blank=True)

    # Control
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    empresa_id = models.PositiveBigIntegerField(db_index=True)

    class Meta:
        ordering = ['orden', '-created_at']
        unique_together = ['empresa_id', 'code']
        indexes = [
            models.Index(fields=['empresa_id', 'status']),
            models.Index(fields=['empresa_id', 'tipo']),
        ]

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._generate_code()
        super().save(*args, **kwargs)

    def _generate_code(self):
        """Genera código automático basado en tipo"""
        prefix = self.tipo.prefijo_codigo
        count = Politica.objects.filter(
            empresa_id=self.empresa_id,
            tipo=self.tipo
        ).count() + 1
        return f"{prefix}-{count:03d}"

    @property
    def needs_review(self):
        if not self.review_date:
            return False
        return self.review_date <= timezone.now().date()

    @property
    def is_signed(self):
        if not self.proceso_firma:
            return False
        return self.proceso_firma.estado == 'COMPLETADO'
```

### 2.3 Crear ViewSet Unificado

```python
# backend/apps/gestion_estrategica/identidad/views_politicas.py

class PoliticaViewSet(MultiTenantViewSet):
    """ViewSet unificado para todas las políticas"""
    queryset = Politica.objects.select_related(
        'tipo', 'identity', 'area', 'responsible', 'proceso_firma'
    ).prefetch_related('normas_aplicables')

    serializer_class = PoliticaSerializer
    filterset_class = PoliticaFilter
    search_fields = ['code', 'title', 'content', 'keywords']
    ordering_fields = ['orden', 'created_at', 'effective_date', 'status']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PoliticaCreateUpdateSerializer
        return PoliticaSerializer

    @action(detail=False, methods=['get'])
    def tipos(self, request):
        """Lista tipos de política disponibles"""
        tipos = TipoPolitica.objects.filter(
            empresa_id=self.get_empresa_id(),
            is_active=True
        )
        return Response(TipoPoliticaSerializer(tipos, many=True).data)

    @action(detail=False, methods=['get'])
    def by_tipo(self, request):
        """Agrupa políticas por tipo"""
        tipo_id = request.query_params.get('tipo')
        qs = self.get_queryset()
        if tipo_id:
            qs = qs.filter(tipo_id=tipo_id)
        return Response(PoliticaSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Solo políticas vigentes"""
        qs = self.get_queryset().filter(status='VIGENTE')
        return Response(PoliticaSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Políticas que necesitan revisión"""
        today = timezone.now().date()
        qs = self.get_queryset().filter(
            review_date__lte=today,
            status='VIGENTE'
        )
        return Response(PoliticaSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def iniciar_firma(self, request, pk=None):
        """Inicia proceso de firma para la política"""
        politica = self.get_object()
        workflow_id = request.data.get('workflow_id')

        if not workflow_id:
            workflow_id = politica.tipo.flujo_firma_default_id

        if not workflow_id:
            return Response(
                {'error': 'Debe especificar un workflow de firma'},
                status=400
            )

        proceso = ProcesoFirmaPolitica.objects.create(
            politica=politica,
            flujo_firma_id=workflow_id,
            iniciado_por=request.user
        )
        politica.proceso_firma = proceso
        politica.status = 'EN_REVISION'
        politica.save()

        return Response(ProcesoFirmaPoliticaSerializer(proceso).data)

    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        """Publica la política (requiere firmas completas si aplica)"""
        politica = self.get_object()

        if politica.tipo.requiere_firma and not politica.is_signed:
            return Response(
                {'error': 'La política requiere completar el proceso de firma'},
                status=400
            )

        politica.status = 'VIGENTE'
        politica.save()

        return Response(PoliticaSerializer(politica).data)
```

### 2.4 Migración de Datos

```python
# backend/apps/gestion_estrategica/identidad/migrations/XXXX_unify_politicas.py

def migrate_politicas(apps, schema_editor):
    """Migra políticas integrales y específicas al modelo unificado"""
    Politica = apps.get_model('identidad', 'Politica')
    TipoPolitica = apps.get_model('identidad', 'TipoPolitica')
    PoliticaIntegral = apps.get_model('identidad', 'PoliticaIntegral')
    PoliticaEspecifica = apps.get_model('identidad', 'PoliticaEspecifica')

    # Crear tipos base
    tipo_integral, _ = TipoPolitica.objects.get_or_create(
        code='INTEGRAL',
        defaults={
            'name': 'Política Integral de Gestión',
            'prefijo_codigo': 'POL-INT',
            'requiere_firma': True,
            'icon': 'Shield',
            'color': 'purple'
        }
    )

    # Migrar integrales
    for pi in PoliticaIntegral.objects.all():
        Politica.objects.create(
            identity=pi.identity,
            tipo=tipo_integral,
            code=f"POL-INT-{pi.id:03d}",
            title=pi.title or 'Política Integral',
            content=pi.content,
            version=pi.version,
            status=pi.status,
            effective_date=pi.effective_date,
            review_date=pi.review_date,
            empresa_id=pi.empresa_id,
            created_at=pi.created_at,
            updated_at=pi.updated_at
        )

    # Migrar específicas por norma
    for pe in PoliticaEspecifica.objects.all():
        tipo, _ = TipoPolitica.objects.get_or_create(
            code=f"ESPECIFICA_{pe.norma_iso.code}" if pe.norma_iso else 'ESPECIFICA',
            defaults={
                'name': f'Política de {pe.norma_iso.short_name}' if pe.norma_iso else 'Política Específica',
                'prefijo_codigo': f'POL-{pe.norma_iso.code[:3]}' if pe.norma_iso else 'POL-ESP',
                'requiere_firma': False,
                'icon': 'FileText',
                'color': pe.norma_iso.color if pe.norma_iso else 'blue'
            }
        )

        politica = Politica.objects.create(
            identity=pe.identity,
            tipo=tipo,
            code=pe.code,
            title=pe.title,
            content=pe.content,
            version=pe.version,
            status=pe.status,
            effective_date=pe.effective_date,
            review_date=pe.review_date,
            area=pe.area,
            responsible=pe.responsible,
            responsible_cargo=pe.responsible_cargo,
            empresa_id=pe.empresa_id
        )
        if pe.norma_iso:
            politica.normas_aplicables.add(pe.norma_iso)
```

---

## Fase 3: Frontend - Modal Unificado

### 3.1 Crear Hook Unificado

**Archivo:** `frontend/src/features/gestion-estrategica/hooks/usePoliticas.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { axiosInstance } from '@/lib/api';
import type {
  Politica,
  CreatePoliticaDTO,
  UpdatePoliticaDTO,
  PoliticaFilters,
  TipoPolitica,
  NormaISO
} from '../types/policies.types';

const API_BASE = '/api/gestion-estrategica/identidad/politicas';

// Query Keys
export const politicaKeys = {
  all: ['politicas'] as const,
  lists: () => [...politicaKeys.all, 'list'] as const,
  list: (filters?: PoliticaFilters) => [...politicaKeys.lists(), filters] as const,
  details: () => [...politicaKeys.all, 'detail'] as const,
  detail: (id: number) => [...politicaKeys.details(), id] as const,
  tipos: () => [...politicaKeys.all, 'tipos'] as const,
  vigentes: () => [...politicaKeys.all, 'vigentes'] as const,
  pendingReview: () => [...politicaKeys.all, 'pending-review'] as const,
};

// Queries
export const usePoliticas = (filters?: PoliticaFilters) => {
  return useQuery({
    queryKey: politicaKeys.list(filters),
    queryFn: async () => {
      const { data } = await axiosInstance.get(API_BASE, { params: filters });
      return data;
    },
    staleTime: 3 * 60 * 1000,
  });
};

export const usePolitica = (id: number) => {
  return useQuery({
    queryKey: politicaKeys.detail(id),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_BASE}/${id}/`);
      return data as Politica;
    },
    enabled: !!id,
  });
};

export const useTiposPolitica = () => {
  return useQuery({
    queryKey: politicaKeys.tipos(),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_BASE}/tipos/`);
      return data as TipoPolitica[];
    },
    staleTime: 10 * 60 * 1000, // 10 min - tipos cambian poco
  });
};

export const usePoliticasVigentes = () => {
  return useQuery({
    queryKey: politicaKeys.vigentes(),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_BASE}/vigentes/`);
      return data as Politica[];
    },
  });
};

export const usePoliticasPendingReview = () => {
  return useQuery({
    queryKey: politicaKeys.pendingReview(),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_BASE}/pending_review/`);
      return data as Politica[];
    },
  });
};

// Mutations
export const useCreatePolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePoliticaDTO) => {
      const { data } = await axiosInstance.post(API_BASE + '/', dto);
      return data as Politica;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: politicaKeys.lists() });
      toast.success('Política creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la política');
    },
  });
};

export const useUpdatePolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePoliticaDTO }) => {
      const { data: response } = await axiosInstance.patch(`${API_BASE}/${id}/`, data);
      return response as Politica;
    },
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: politicaKeys.lists() }),
        queryClient.refetchQueries({ queryKey: politicaKeys.detail(id) }),
      ]);
      toast.success('Política actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la política');
    },
  });
};

export const useDeletePolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`${API_BASE}/${id}/`);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: politicaKeys.lists() });
      toast.success('Política eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la política');
    },
  });
};

export const useIniciarFirmaPolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workflowId }: { id: number; workflowId?: number }) => {
      const { data } = await axiosInstance.post(`${API_BASE}/${id}/iniciar_firma/`, {
        workflow_id: workflowId,
      });
      return data;
    },
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: politicaKeys.lists() }),
        queryClient.refetchQueries({ queryKey: politicaKeys.detail(id) }),
      ]);
      toast.success('Proceso de firma iniciado');
    },
    onError: () => {
      toast.error('Error al iniciar el proceso de firma');
    },
  });
};

export const usePublicarPolitica = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axiosInstance.post(`${API_BASE}/${id}/publicar/`);
      return data as Politica;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: politicaKeys.lists() });
      toast.success('Política publicada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al publicar la política');
    },
  });
};
```

### 3.2 Crear Componente Modal Unificado

**Archivo:** `frontend/src/features/gestion-estrategica/components/politicas/UnifiedPolicyModal.tsx`

```typescript
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Design System imports
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/modals';
import { Button } from '@/components/common';
import { Input, Select, DatePicker, RichTextEditor } from '@/components/forms';
import { Badge } from '@/components/common';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useTiposPolitica, useNormasISO, useCreatePolitica, useUpdatePolitica } from '../hooks/usePoliticas';
import { useAreas } from '../hooks/useAreas';
import { useCargos } from '@/features/configuracion/hooks';

// Types
import type { Politica, CreatePoliticaDTO, TipoPolitica } from '../types/policies.types';

// Validation schema
const politicaSchema = z.object({
  tipo_id: z.number({ required_error: 'Seleccione un tipo de política' }),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  content: z.string().min(10, 'El contenido es requerido'),
  version: z.string().default('1.0'),
  effective_date: z.string().optional(),
  review_date: z.string().optional(),
  normas_aplicables: z.array(z.number()).default([]),
  area_id: z.number().optional().nullable(),
  responsible_id: z.number().optional().nullable(),
  responsible_cargo_id: z.number().optional().nullable(),
});

type FormData = z.infer<typeof politicaSchema>;

interface UnifiedPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  identityId: number;
  politica?: Politica | null;
  defaultTipoId?: number;
}

export function UnifiedPolicyModal({
  isOpen,
  onClose,
  identityId,
  politica,
  defaultTipoId,
}: UnifiedPolicyModalProps) {
  const { primaryColor } = useBrandingConfig();
  const isEditing = !!politica;

  // Data queries
  const { data: tiposPolitica = [], isLoading: loadingTipos } = useTiposPolitica();
  const { data: normasISO = [], isLoading: loadingNormas } = useNormasISO();
  const { data: areasData } = useAreas();
  const { data: cargosData } = useCargos();

  // Mutations
  const createMutation = useCreatePolitica();
  const updateMutation = useUpdatePolitica();

  // Form
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(politicaSchema),
    defaultValues: {
      tipo_id: defaultTipoId || politica?.tipo?.id,
      title: politica?.title || '',
      content: politica?.content || '',
      version: politica?.version || '1.0',
      effective_date: politica?.effective_date || '',
      review_date: politica?.review_date || '',
      normas_aplicables: politica?.normas_aplicables?.map(n => n.id) || [],
      area_id: politica?.area_id || null,
      responsible_id: politica?.responsible_id || null,
      responsible_cargo_id: politica?.responsible_cargo_id || null,
    },
  });

  const selectedTipoId = watch('tipo_id');
  const selectedTipo = useMemo(
    () => tiposPolitica.find(t => t.id === selectedTipoId),
    [tiposPolitica, selectedTipoId]
  );

  // Auto-set default normas when tipo changes
  useEffect(() => {
    if (selectedTipo?.normas_iso_default && !isEditing) {
      setValue('normas_aplicables', selectedTipo.normas_iso_default);
    }
  }, [selectedTipo, setValue, isEditing]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        tipo_id: defaultTipoId || politica?.tipo?.id,
        title: politica?.title || '',
        content: politica?.content || '',
        version: politica?.version || '1.0',
        effective_date: politica?.effective_date || '',
        review_date: politica?.review_date || '',
        normas_aplicables: politica?.normas_aplicables?.map(n => n.id) || [],
        area_id: politica?.area_id || null,
        responsible_id: politica?.responsible_id || null,
        responsible_cargo_id: politica?.responsible_cargo_id || null,
      });
    }
  }, [isOpen, politica, defaultTipoId, reset]);

  const onSubmit = async (data: FormData) => {
    const dto: CreatePoliticaDTO = {
      identity: identityId,
      tipo: data.tipo_id,
      title: data.title,
      content: data.content,
      version: data.version,
      effective_date: data.effective_date || undefined,
      review_date: data.review_date || undefined,
      normas_aplicables: data.normas_aplicables,
      area_id: data.area_id || undefined,
      responsible_id: data.responsible_id || undefined,
      responsible_cargo_id: data.responsible_cargo_id || undefined,
    };

    if (isEditing && politica) {
      await updateMutation.mutateAsync({ id: politica.id, data: dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    onClose();
  };

  // Transform data for selects
  const tiposOptions = tiposPolitica.map(t => ({
    value: t.id,
    label: t.name,
    icon: t.icon,
    color: t.color,
  }));

  const normasOptions = normasISO.map(n => ({
    value: n.id,
    label: `${n.code} - ${n.name}`,
    icon: n.icon,
    color: n.color,
  }));

  const areasOptions = (areasData?.results || []).map(a => ({
    value: a.id,
    label: a.nombre,
  }));

  const cargosOptions = (cargosData?.results || []).map(c => ({
    value: c.id,
    label: c.nombre,
  }));

  const showResponsableFields = selectedTipo && !selectedTipo.code.includes('INTEGRAL');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <DynamicIcon
              name={selectedTipo?.icon || 'FileText'}
              className="w-5 h-5"
              style={{ color: primaryColor }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Política' : 'Nueva Política'}
            </h2>
            {selectedTipo && (
              <Badge
                variant="outline"
                style={{ borderColor: selectedTipo.color, color: selectedTipo.color }}
              >
                {selectedTipo.name}
              </Badge>
            )}
          </div>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
          {/* Tipo de Política */}
          <Controller
            name="tipo_id"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo de Política"
                options={tiposOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.tipo_id?.message}
                isLoading={loadingTipos}
                required
                renderOption={(option) => (
                  <div className="flex items-center gap-2">
                    <DynamicIcon name={option.icon} className="w-4 h-4" style={{ color: option.color }} />
                    <span>{option.label}</span>
                  </div>
                )}
              />
            )}
          />

          {/* Título */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                label="Título de la Política"
                placeholder="Ej: Política de Seguridad y Salud en el Trabajo"
                {...field}
                error={errors.title?.message}
                required
              />
            )}
          />

          {/* Normas ISO Aplicables */}
          <Controller
            name="normas_aplicables"
            control={control}
            render={({ field }) => (
              <Select
                label="Normas Aplicables"
                options={normasOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.normas_aplicables?.message}
                isLoading={loadingNormas}
                isMulti
                renderOption={(option) => (
                  <div className="flex items-center gap-2">
                    <DynamicIcon name={option.icon} className="w-4 h-4" style={{ color: option.color }} />
                    <span>{option.label}</span>
                  </div>
                )}
              />
            )}
          />

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="version"
              control={control}
              render={({ field }) => (
                <Input
                  label="Versión"
                  placeholder="1.0"
                  {...field}
                />
              )}
            />
            <Controller
              name="effective_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Fecha de Vigencia"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="review_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Próxima Revisión"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Responsables (solo para específicas) */}
          {showResponsableFields && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Controller
                name="area_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Área Responsable"
                    options={areasOptions}
                    value={field.value}
                    onChange={field.onChange}
                    isClearable
                  />
                )}
              />
              <Controller
                name="responsible_cargo_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Cargo Responsable"
                    options={cargosOptions}
                    value={field.value}
                    onChange={field.onChange}
                    isClearable
                  />
                )}
              />
            </div>
          )}

          {/* Contenido */}
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Contenido de la Política"
                value={field.value}
                onChange={field.onChange}
                error={errors.content?.message}
                minHeight={300}
              />
            )}
          />

          {/* Indicador de Workflow */}
          {selectedTipo?.requiere_firma && (
            <div
              className="p-4 rounded-lg border-l-4 flex items-start gap-3"
              style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}
            >
              <DynamicIcon name="PenTool" className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Workflow de Firmas Requerido
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esta política requerirá aprobación mediante firma digital antes de publicarse.
                  {selectedTipo.flujo_firma_default && (
                    <span className="block mt-1">
                      Flujo: {selectedTipo.flujo_firma_default.nombre}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            style={{ backgroundColor: primaryColor }}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Política'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
```

### 3.3 Crear Componente de Lista de Políticas

**Archivo:** `frontend/src/features/gestion-estrategica/components/politicas/PoliciesList.tsx`

```typescript
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Filter, Search, Eye, Edit, Trash2,
  PenTool, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

// Design System
import { Button, Badge, Card, EmptyState, Spinner } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { useConfirm } from '@/components/modals';

// Hooks
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import {
  usePoliticas,
  useTiposPolitica,
  useDeletePolitica,
  useIniciarFirmaPolitica,
  usePublicarPolitica
} from '../hooks/usePoliticas';

// Components
import { UnifiedPolicyModal } from './UnifiedPolicyModal';
import { PolicyDetailModal } from './PolicyDetailModal';

// Types
import type { Politica, PoliticaFilters, TipoPolitica } from '../types/policies.types';

interface PoliciesListProps {
  identityId: number;
}

const statusConfig = {
  BORRADOR: { label: 'Borrador', color: 'gray', icon: FileText },
  EN_REVISION: { label: 'En Revisión', color: 'yellow', icon: Clock },
  VIGENTE: { label: 'Vigente', color: 'green', icon: CheckCircle },
  OBSOLETO: { label: 'Obsoleto', color: 'red', icon: AlertTriangle },
};

export function PoliciesList({ identityId }: PoliciesListProps) {
  const { primaryColor, secondaryColor } = useBrandingConfig();
  const confirm = useConfirm();

  // State
  const [filters, setFilters] = useState<PoliticaFilters>({ identity: identityId });
  const [selectedPolitica, setSelectedPolitica] = useState<Politica | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [defaultTipoId, setDefaultTipoId] = useState<number | undefined>();

  // Queries
  const { data: politicasData, isLoading } = usePoliticas(filters);
  const { data: tiposPolitica = [] } = useTiposPolitica();
  const politicas = politicasData?.results || [];

  // Mutations
  const deleteMutation = useDeletePolitica();
  const iniciarFirmaMutation = useIniciarFirmaPolitica();
  const publicarMutation = usePublicarPolitica();

  // Group by tipo
  const politicasByTipo = useMemo(() => {
    const grouped = new Map<number, { tipo: TipoPolitica; politicas: Politica[] }>();

    politicas.forEach(p => {
      const tipoId = p.tipo?.id;
      if (!tipoId) return;

      if (!grouped.has(tipoId)) {
        grouped.set(tipoId, { tipo: p.tipo, politicas: [] });
      }
      grouped.get(tipoId)!.politicas.push(p);
    });

    return Array.from(grouped.values());
  }, [politicas]);

  // Handlers
  const handleCreate = (tipoId?: number) => {
    setDefaultTipoId(tipoId);
    setSelectedPolitica(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (politica: Politica) => {
    setSelectedPolitica(politica);
    setIsEditModalOpen(true);
  };

  const handleView = (politica: Politica) => {
    setSelectedPolitica(politica);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (politica: Politica) => {
    const confirmed = await confirm({
      title: 'Eliminar Política',
      message: `¿Está seguro de eliminar la política "${politica.title}"?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (confirmed) {
      await deleteMutation.mutateAsync(politica.id);
    }
  };

  const handleIniciarFirma = async (politica: Politica) => {
    await iniciarFirmaMutation.mutateAsync({ id: politica.id });
  };

  const handlePublicar = async (politica: Politica) => {
    const confirmed = await confirm({
      title: 'Publicar Política',
      message: `¿Está seguro de publicar la política "${politica.title}"? Una vez publicada estará vigente.`,
      confirmText: 'Publicar',
      variant: 'primary',
    });
    if (confirmed) {
      await publicarMutation.mutateAsync(politica.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar políticas..."
              className="pl-10"
              value={filters.search || ''}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Select
            placeholder="Filtrar por tipo"
            options={tiposPolitica.map(t => ({ value: t.id, label: t.name }))}
            value={filters.tipo}
            onChange={(v) => setFilters(f => ({ ...f, tipo: v }))}
            isClearable
            className="w-48"
          />
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => handleCreate()}
          style={{ backgroundColor: primaryColor }}
        >
          Nueva Política
        </Button>
      </div>

      {/* Lista agrupada por tipo */}
      {politicasByTipo.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay políticas"
          description="Crea tu primera política para comenzar"
          action={
            <Button onClick={() => handleCreate()} style={{ backgroundColor: primaryColor }}>
              Crear Política
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {politicasByTipo.map(({ tipo, politicas: tipoPoliticas }) => (
              <motion.div
                key={tipo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Tipo Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${tipo.color}20` }}
                    >
                      <DynamicIcon
                        name={tipo.icon}
                        className="w-5 h-5"
                        style={{ color: tipo.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tipo.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {tipoPoliticas.length} política{tipoPoliticas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => handleCreate(tipo.id)}
                  >
                    Agregar
                  </Button>
                </div>

                {/* Políticas del tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tipoPoliticas.map((politica) => {
                    const status = statusConfig[politica.status];
                    return (
                      <motion.div
                        key={politica.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleView(politica)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 font-mono">
                                {politica.code}
                              </p>
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {politica.title}
                              </h4>
                            </div>
                            <Badge
                              variant={status.color as any}
                              className="ml-2 shrink-0"
                            >
                              <status.icon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>

                          {/* Normas aplicables */}
                          {politica.normas_aplicables?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {politica.normas_aplicables.slice(0, 3).map(norma => (
                                <Badge key={norma.id} variant="outline" size="sm">
                                  {norma.code}
                                </Badge>
                              ))}
                              {politica.normas_aplicables.length > 3 && (
                                <Badge variant="outline" size="sm">
                                  +{politica.normas_aplicables.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Footer con acciones */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-500">
                              v{politica.version}
                            </span>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              {politica.status === 'BORRADOR' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(politica)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  {politica.tipo?.requiere_firma && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleIniciarFirma(politica)}
                                    >
                                      <PenTool className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(politica)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                              {politica.status === 'EN_REVISION' && politica.is_signed && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handlePublicar(politica)}
                                >
                                  Publicar
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modales */}
      <UnifiedPolicyModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedPolitica(null);
          setDefaultTipoId(undefined);
        }}
        identityId={identityId}
        politica={selectedPolitica}
        defaultTipoId={defaultTipoId}
      />

      <PolicyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPolitica(null);
        }}
        politica={selectedPolitica}
        onEdit={() => {
          setIsDetailModalOpen(false);
          setIsEditModalOpen(true);
        }}
      />
    </div>
  );
}
```

---

## Fase 4: Eliminación del Showcase

### 4.1 Archivos a Eliminar

```bash
# Frontend - Showcase components
rm -rf frontend/src/features/gestion-estrategica/components/IdentidadShowcase.tsx
rm -rf frontend/src/features/gestion-estrategica/components/showcase/
rm -rf frontend/src/features/gestion-estrategica/pages/ShowcasePage.tsx
rm -rf frontend/src/pages/PublicShowcasePage.tsx
rm -rf frontend/src/components/common/ShowcaseButton.tsx

# Tests relacionados
rm -rf frontend/src/__tests__/features/gestion-estrategica/IdentidadShowcase.test.tsx
```

### 4.2 Actualizar Rutas

**Archivo:** `frontend/src/routes/index.tsx`

```typescript
// ELIMINAR estas rutas:
// { path: 'showcase', element: <ShowcasePage /> }
// { path: '/showcase', element: <PublicShowcasePage /> }
```

### 4.3 Actualizar Exports

**Archivo:** `frontend/src/features/gestion-estrategica/index.ts`

```typescript
// ELIMINAR exports:
// export { IdentidadShowcase } from './components/IdentidadShowcase';
// export { ShowcasePage } from './pages/ShowcasePage';
```

### 4.4 Migrar a Módulo Informes (Futuro)

La funcionalidad de presentación visual se implementará en:
- `frontend/src/features/informes/components/IdentidadReport.tsx`
- Generación de PDF con WeasyPrint
- Exportación a PowerPoint

---

## Fase 5: Limpieza Final

### 5.1 Eliminar Código Legacy del Backend

```python
# backend/apps/gestion_estrategica/identidad/models.py
# ELIMINAR de CorporateIdentity:
# - integral_policy
# - policy_signed_by
# - policy_signed_at
# - policy_signature_hash
# - sign_policy() method

# Crear migración para eliminar campos
python manage.py makemigrations identidad --name remove_legacy_policy_fields
```

### 5.2 Eliminar Hooks Legacy del Frontend

```typescript
// frontend/src/features/gestion-estrategica/hooks/useStrategic.ts
// ELIMINAR:
// - useSignPolicy()
// - usePoliticasIntegrales() → reemplazar por usePoliticas({ tipo: 'INTEGRAL' })
// - usePoliticasEspecificas() → reemplazar por usePoliticas({ tipo: 'ESPECIFICA' })
```

### 5.3 Actualizar Index de Hooks

**Archivo:** `frontend/src/features/gestion-estrategica/hooks/index.ts`

```typescript
// Agregar nuevos exports
export * from './usePoliticas';

// Mantener deprecados con warning
/** @deprecated Use usePoliticas({ tipo: 'INTEGRAL' }) instead */
export { usePoliticasIntegrales } from './useStrategic';
```

---

## Checklist de Validación

### Fase 1: Preparación
- [ ] Crear `types/policies.types.ts` con todos los tipos
- [ ] Crear `types/signature.types.ts` para romper circular
- [ ] Actualizar imports en `useWorkflowFirmas.ts`
- [ ] Actualizar imports en `SignatureModal.tsx`
- [ ] Eliminar `useSignPolicy()` de `useStrategic.ts`

### Fase 2: Backend
- [ ] Crear modelo `TipoPolitica`
- [ ] Crear modelo `Politica` unificado
- [ ] Crear migración de datos
- [ ] Crear `PoliticaViewSet` con acciones
- [ ] Crear serializers unificados
- [ ] Agregar URLs
- [ ] Ejecutar migraciones

### Fase 3: Frontend
- [ ] Crear `usePoliticas.ts` hook unificado
- [ ] Crear `UnifiedPolicyModal.tsx`
- [ ] Crear `PoliciesList.tsx`
- [ ] Crear `PolicyDetailModal.tsx`
- [ ] Integrar en `IdentidadTab.tsx`
- [ ] Verificar consumo del Design System

### Fase 4: Showcase
- [ ] Eliminar archivos de Showcase
- [ ] Actualizar rutas
- [ ] Actualizar exports
- [ ] Eliminar tests relacionados

### Fase 5: Limpieza
- [ ] Eliminar campos legacy de `CorporateIdentity`
- [ ] Eliminar hooks legacy
- [ ] Actualizar documentación
- [ ] Ejecutar tests
- [ ] Verificar build sin errores

---

## Estimación de Archivos

| Acción | Archivos | Líneas Aproximadas |
|--------|----------|-------------------|
| **Crear** | 8 archivos nuevos | +1,500 líneas |
| **Modificar** | 12 archivos | ~500 líneas cambios |
| **Eliminar** | 15 archivos | -2,500 líneas |
| **NETO** | | **-500 líneas** |

---

## Notas Importantes

1. **Siempre usar Design System**: Todos los componentes deben usar `Button`, `Modal`, `Card`, `Badge`, `Input`, `Select` del Design System
2. **Colores dinámicos**: Usar `useBrandingConfig()` para colores, nunca hardcodear
3. **Iconos dinámicos**: Usar `DynamicIcon` con nombres de iconos desde BD
4. **Sin código legacy**: No mantener compatibilidad con campos antiguos
5. **Tipos estrictos**: Todo debe tener tipos TypeScript definidos
6. **Queries consistentes**: Usar `refetchQueries` para actualizaciones en tiempo real
