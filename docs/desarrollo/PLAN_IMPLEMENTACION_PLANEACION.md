# 🚀 Plan de Implementación: Planeación Estratégica

**Versión:** 1.0
**Fecha:** 2026-01-23
**Duración estimada:** 8 semanas (2 meses)
**Equipo:** 1 desarrollador full-stack + Claude Code

---

## 📊 Roadmap General

```
Semana 1-2: Sprint 1 → Stakeholders + DOFA
Semana 3:   Sprint 2 → PESTEL + Porter
Semana 4:   Sprint 3 → Matriz TOWS
Semana 5:   Sprint 4 → Objetivos + KPIs
Semana 6-7: Sprint 5 → Mapa Estratégico (React Flow)
Semana 8:   Sprint 6 → Gestión del Cambio
```

---

## 🎯 Sprint 1: Stakeholders + DOFA (Semana 1-2)

### Objetivo
Implementar la identificación de partes interesadas y análisis DOFA completo.

### Backend Tasks

#### 1. Reestructurar Partes Interesadas

```bash
# Mover archivos
backend/apps/motor_cumplimiento/partes_interesadas/
  → backend/apps/gestion_estrategica/planeacion/stakeholders/
```

**Archivos a modificar:**

```python
# backend/apps/gestion_estrategica/planeacion/stakeholders/__init__.py
default_app_config = 'apps.gestion_estrategica.planeacion.stakeholders.apps'

# backend/apps/gestion_estrategica/planeacion/stakeholders/apps.py
from django.apps import AppConfig

class StakeholdersConfig(AppConfig):
    name = 'apps.gestion_estrategica.planeacion.stakeholders'
    verbose_name = 'Partes Interesadas'
```

**Actualizar settings.py:**

```python
# backend/config/settings.py
INSTALLED_APPS = [
    # ...
    'apps.gestion_estrategica.planeacion',
    'apps.gestion_estrategica.planeacion.stakeholders',  # NUEVO
    'apps.gestion_estrategica.planeacion.contexto',      # YA EXISTE
    # ...
    # REMOVER: 'apps.motor_cumplimiento.partes_interesadas',
]
```

**Migración de datos:**

```python
# backend/apps/gestion_estrategica/planeacion/stakeholders/migrations/0001_move_from_cumplimiento.py
from django.db import migrations

def move_data(apps, schema_editor):
    """
    No es necesario mover datos porque los modelos están en la misma BD.
    Solo cambiar app_label en django_content_type si es necesario.
    """
    ContentType = apps.get_model('contenttypes', 'ContentType')

    # Actualizar app_label de los modelos movidos
    ContentType.objects.filter(
        app_label='partes_interesadas'
    ).update(
        app_label='stakeholders'
    )

class Migration(migrations.Migration):
    dependencies = [
        ('stakeholders', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(move_data),
    ]
```

#### 2. Crear Serializers DOFA

```python
# backend/apps/gestion_estrategica/planeacion/contexto/serializers.py
from rest_framework import serializers
from .models import AnalisisDOFA, FactorDOFA, EstrategiaTOWS
from apps.gestion_estrategica.organizacion.models import Area

class AreaLightSerializer(serializers.ModelSerializer):
    """Serializer ligero para Area (evitar N+1)"""
    class Meta:
        model = Area
        fields = ['id', 'codigo', 'nombre', 'nivel']

class FactorDOFASerializer(serializers.ModelSerializer):
    area = AreaLightSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.filter(is_active=True),
        source='area',
        write_only=True,
        required=False
    )

    class Meta:
        model = FactorDOFA
        fields = [
            'id', 'tipo', 'descripcion', 'area', 'area_id',
            'area_afectada', 'impacto', 'evidencias',
            'fuente', 'votos_fortaleza', 'votos_debilidad',
            'orden', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'votos_fortaleza', 'votos_debilidad']

class AnalisisDOFASerializer(serializers.ModelSerializer):
    factores = FactorDOFASerializer(many=True, read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)

    # Contadores por tipo
    total_fortalezas = serializers.SerializerMethodField()
    total_debilidades = serializers.SerializerMethodField()
    total_oportunidades = serializers.SerializerMethodField()
    total_amenazas = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisDOFA
        fields = [
            'id', 'nombre', 'fecha_analisis', 'periodo',
            'responsable', 'responsable_nombre',
            'estado', 'observaciones',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'factores',
            'total_fortalezas', 'total_debilidades',
            'total_oportunidades', 'total_amenazas',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_total_fortalezas(self, obj):
        return obj.factores.filter(tipo='fortaleza', is_active=True).count()

    def get_total_debilidades(self, obj):
        return obj.factores.filter(tipo='debilidad', is_active=True).count()

    def get_total_oportunidades(self, obj):
        return obj.factores.filter(tipo='oportunidad', is_active=True).count()

    def get_total_amenazas(self, obj):
        return obj.factores.filter(tipo='amenaza', is_active=True).count()

class EstrategiaTOWSSerializer(serializers.ModelSerializer):
    area_responsable = AreaLightSerializer(read_only=True)
    area_responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.filter(is_active=True),
        source='area_responsable',
        write_only=True,
        required=False
    )
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    objetivo_estrategico_code = serializers.CharField(
        source='objetivo_estrategico.code',
        read_only=True
    )

    class Meta:
        model = EstrategiaTOWS
        fields = [
            'id', 'analisis', 'tipo', 'descripcion', 'objetivo',
            'responsable', 'responsable_nombre',
            'area_responsable', 'area_responsable_id',
            'objetivo_estrategico', 'objetivo_estrategico_code',
            'fecha_implementacion', 'fecha_limite',
            'prioridad', 'estado',
            'recursos_necesarios', 'indicadores_exito',
            'progreso_porcentaje',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
```

#### 3. Crear ViewSets con Filtros

```python
# backend/apps/gestion_estrategica/planeacion/contexto/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from apps.core.permissions import RBACPermission
from .models import AnalisisDOFA, FactorDOFA, EstrategiaTOWS
from .serializers import (
    AnalisisDOFASerializer,
    FactorDOFASerializer,
    EstrategiaTOWSSerializer
)

class FactorDOFAFilter(filters.FilterSet):
    """Filtros avanzados para FactorDOFA"""
    tipo = filters.ChoiceFilter(choices=FactorDOFA.TipoFactor.choices)
    impacto = filters.ChoiceFilter(choices=FactorDOFA.NivelImpacto.choices)
    area = filters.NumberFilter(field_name='area__id')
    fuente = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = FactorDOFA
        fields = ['tipo', 'impacto', 'area', 'fuente']

class AnalisisDOFAViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Análisis DOFA

    Permisos:
    - list: planeacion.view_analisis_dofa
    - retrieve: planeacion.view_analisis_dofa
    - create: planeacion.add_analisis_dofa
    - update: planeacion.change_analisis_dofa
    - destroy: planeacion.delete_analisis_dofa
    """
    queryset = AnalisisDOFA.objects.all()
    serializer_class = AnalisisDOFASerializer
    permission_classes = [RBACPermission]
    filterset_fields = ['estado', 'periodo']
    search_fields = ['nombre', 'observaciones']
    ordering_fields = ['fecha_analisis', 'created_at']
    ordering = ['-fecha_analisis']

    def get_queryset(self):
        """Filtrar por empresa del usuario"""
        user = self.request.user
        if hasattr(user, 'empresa_config'):
            return self.queryset.filter(empresa=user.empresa_config.empresa)
        return self.queryset.none()

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar análisis DOFA"""
        analisis = self.get_object()

        if analisis.estado != 'EN_REVISION':
            return Response(
                {'error': 'Solo se pueden aprobar análisis en estado EN_REVISION'},
                status=status.HTTP_400_BAD_REQUEST
            )

        analisis.estado = 'APROBADO'
        analisis.aprobado_por = request.user
        analisis.fecha_aprobacion = timezone.now().date()
        analisis.save()

        serializer = self.get_serializer(analisis)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        """Estadísticas del análisis DOFA"""
        analisis = self.get_object()
        factores = analisis.factores.filter(is_active=True)

        stats = {
            'total_factores': factores.count(),
            'por_tipo': {
                'fortalezas': factores.filter(tipo='fortaleza').count(),
                'debilidades': factores.filter(tipo='debilidad').count(),
                'oportunidades': factores.filter(tipo='oportunidad').count(),
                'amenazas': factores.filter(tipo='amenaza').count(),
            },
            'por_impacto': {
                'alto': factores.filter(impacto='alto').count(),
                'medio': factores.filter(impacto='medio').count(),
                'bajo': factores.filter(impacto='bajo').count(),
            },
            'factores_internos': factores.filter(tipo__in=['fortaleza', 'debilidad']).count(),
            'factores_externos': factores.filter(tipo__in=['oportunidad', 'amenaza']).count(),
        }

        return Response(stats)

class FactorDOFAViewSet(viewsets.ModelViewSet):
    """ViewSet para Factores DOFA"""
    queryset = FactorDOFA.objects.all()
    serializer_class = FactorDOFASerializer
    permission_classes = [RBACPermission]
    filterset_class = FactorDOFAFilter
    search_fields = ['descripcion', 'evidencias']
    ordering_fields = ['tipo', 'impacto', 'orden']
    ordering = ['tipo', 'orden']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'empresa_config'):
            return self.queryset.filter(empresa=user.empresa_config.empresa)
        return self.queryset.none()

    @action(detail=False, methods=['post'])
    def reordenar(self, request):
        """Reordenar factores (drag & drop)"""
        orden_nuevo = request.data.get('orden', [])  # Lista de IDs en orden

        for index, factor_id in enumerate(orden_nuevo):
            FactorDOFA.objects.filter(id=factor_id).update(orden=index)

        return Response({'status': 'ok'})

class EstrategiaTOWSViewSet(viewsets.ModelViewSet):
    """ViewSet para Estrategias TOWS"""
    queryset = EstrategiaTOWS.objects.all()
    serializer_class = EstrategiaTOWSSerializer
    permission_classes = [RBACPermission]
    filterset_fields = ['tipo', 'estado', 'prioridad']
    search_fields = ['descripcion', 'objetivo']
    ordering_fields = ['prioridad', 'fecha_limite', 'created_at']
    ordering = ['-prioridad', 'fecha_limite']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'empresa_config'):
            return self.queryset.filter(empresa=user.empresa_config.empresa)
        return self.queryset.none()

    @action(detail=True, methods=['post'])
    def convertir_objetivo(self, request, pk=None):
        """Convertir estrategia TOWS en objetivo estratégico"""
        from apps.gestion_estrategica.planeacion.models import StrategicObjective, StrategicPlan

        estrategia = self.get_object()

        if estrategia.objetivo_estrategico:
            return Response(
                {'error': 'Esta estrategia ya fue convertida en objetivo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener plan activo
        plan_activo = StrategicPlan.get_active()
        if not plan_activo:
            return Response(
                {'error': 'No hay un plan estratégico activo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear objetivo estratégico
        objetivo_data = request.data.get('objetivo', {})

        objetivo = StrategicObjective.objects.create(
            plan=plan_activo,
            code=objetivo_data.get('code'),
            name=objetivo_data.get('name', estrategia.descripcion[:300]),
            description=estrategia.descripcion,
            bsc_perspective=objetivo_data.get('bsc_perspective', 'PROCESOS'),
            responsible=estrategia.responsable,
            target_value=objetivo_data.get('target_value'),
            unit=objetivo_data.get('unit', '%'),
            status='PENDIENTE',
            created_by=request.user,
            updated_by=request.user
        )

        # Vincular área responsable
        if estrategia.area_responsable:
            objetivo.areas_responsables.add(estrategia.area_responsable)

        # Vincular estrategia con objetivo
        estrategia.objetivo_estrategico = objetivo
        estrategia.save()

        return Response({
            'objetivo_id': objetivo.id,
            'objetivo_code': objetivo.code,
            'message': 'Objetivo creado exitosamente'
        }, status=status.HTTP_201_CREATED)
```

#### 4. Crear URLs

```python
# backend/apps/gestion_estrategica/planeacion/contexto/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'dofa', views.AnalisisDOFAViewSet, basename='dofa')
router.register(r'factores-dofa', views.FactorDOFAViewSet, basename='factores-dofa')
router.register(r'tows', views.EstrategiaTOWSViewSet, basename='tows')

urlpatterns = [
    path('', include(router.urls)),
]

# backend/apps/gestion_estrategica/planeacion/urls.py
from django.urls import path, include

urlpatterns = [
    path('contexto/', include('apps.gestion_estrategica.planeacion.contexto.urls')),
    path('stakeholders/', include('apps.gestion_estrategica.planeacion.stakeholders.urls')),
    # ... otros módulos
]

# backend/apps/gestion_estrategica/urls.py
from django.urls import path, include

urlpatterns = [
    path('planeacion/', include('apps.gestion_estrategica.planeacion.urls')),
    # ... otros módulos
]
```

### Frontend Tasks

#### 1. Instalar Dependencias

```bash
cd frontend

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Tablas avanzadas
npm install @tanstack/react-table

# Gráficos
npm install recharts

# Verificar que ya estén instaladas:
# - react-hook-form
# - zod
# - @tanstack/react-query
# - zustand
# - framer-motion
```

#### 2. Crear API Client para Contexto

```typescript
// frontend/src/features/gestion-estrategica/api/contextoApi.ts
import { apiClient } from '@/lib/apiClient'
import type {
  AnalisisDofa,
  FactorDofa,
  EstrategiaTows,
  DofaStats
} from '../types/contexto.types'

const BASE_URL = '/gestion-estrategica/planeacion/contexto'

export const contextoApi = {
  // ========== DOFA ==========
  dofa: {
    getAll: (params?: { estado?: string; periodo?: string }) =>
      apiClient.get<AnalisisDofa[]>(`${BASE_URL}/dofa/`, { params }),

    getById: (id: string) =>
      apiClient.get<AnalisisDofa>(`${BASE_URL}/dofa/${id}/`),

    create: (data: Partial<AnalisisDofa>) =>
      apiClient.post<AnalisisDofa>(`${BASE_URL}/dofa/`, data),

    update: (id: string, data: Partial<AnalisisDofa>) =>
      apiClient.patch<AnalisisDofa>(`${BASE_URL}/dofa/${id}/`, data),

    delete: (id: string) =>
      apiClient.delete(`${BASE_URL}/dofa/${id}/`),

    aprobar: (id: string) =>
      apiClient.post<AnalisisDofa>(`${BASE_URL}/dofa/${id}/aprobar/`),

    getEstadisticas: (id: string) =>
      apiClient.get<DofaStats>(`${BASE_URL}/dofa/${id}/estadisticas/`)
  },

  // ========== Factores DOFA ==========
  factores: {
    getAll: (params?: {
      analisis?: string
      tipo?: 'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza'
      impacto?: 'alto' | 'medio' | 'bajo'
      area?: string
    }) =>
      apiClient.get<FactorDofa[]>(`${BASE_URL}/factores-dofa/`, { params }),

    getById: (id: string) =>
      apiClient.get<FactorDofa>(`${BASE_URL}/factores-dofa/${id}/`),

    create: (data: Partial<FactorDofa>) =>
      apiClient.post<FactorDofa>(`${BASE_URL}/factores-dofa/`, data),

    update: (id: string, data: Partial<FactorDofa>) =>
      apiClient.patch<FactorDofa>(`${BASE_URL}/factores-dofa/${id}/`, data),

    delete: (id: string) =>
      apiClient.delete(`${BASE_URL}/factores-dofa/${id}/`),

    reordenar: (orden: string[]) =>
      apiClient.post(`${BASE_URL}/factores-dofa/reordenar/`, { orden })
  },

  // ========== TOWS ==========
  tows: {
    getAll: (params?: {
      analisis?: string
      tipo?: 'fo' | 'fa' | 'do' | 'da'
      estado?: string
      prioridad?: string
    }) =>
      apiClient.get<EstrategiaTows[]>(`${BASE_URL}/tows/`, { params }),

    getById: (id: string) =>
      apiClient.get<EstrategiaTows>(`${BASE_URL}/tows/${id}/`),

    create: (data: Partial<EstrategiaTows>) =>
      apiClient.post<EstrategiaTows>(`${BASE_URL}/tows/`, data),

    update: (id: string, data: Partial<EstrategiaTows>) =>
      apiClient.patch<EstrategiaTows>(`${BASE_URL}/tows/${id}/`, data),

    delete: (id: string) =>
      apiClient.delete(`${BASE_URL}/tows/${id}/`),

    convertirObjetivo: (id: string, objetivoData: {
      code: string
      name: string
      bsc_perspective: string
      target_value?: number
      unit?: string
    }) =>
      apiClient.post(`${BASE_URL}/tows/${id}/convertir_objetivo/`, {
        objetivo: objetivoData
      })
  }
}
```

#### 3. Crear Types

```typescript
// frontend/src/features/gestion-estrategica/types/contexto.types.ts
export interface AnalisisDofa {
  id: string
  nombre: string
  fecha_analisis: string
  periodo: string
  responsable: string
  responsable_nombre: string
  estado: 'borrador' | 'en_revision' | 'aprobado' | 'vigente' | 'archivado'
  observaciones: string
  aprobado_por?: string
  aprobado_por_nombre?: string
  fecha_aprobacion?: string
  factores: FactorDofa[]
  total_fortalezas: number
  total_debilidades: number
  total_oportunidades: number
  total_amenazas: number
  created_at: string
  updated_at: string
}

export interface FactorDofa {
  id: string
  analisis: string
  tipo: 'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza'
  descripcion: string
  area?: {
    id: string
    codigo: string
    nombre: string
    nivel: number
  }
  area_id?: string
  area_afectada: string
  impacto: 'alto' | 'medio' | 'bajo'
  evidencias: string
  fuente: string
  votos_fortaleza: number
  votos_debilidad: number
  orden: number
  created_at: string
  updated_at: string
}

export interface EstrategiaTows {
  id: string
  analisis: string
  tipo: 'fo' | 'fa' | 'do' | 'da'
  descripcion: string
  objetivo: string
  responsable?: string
  responsable_nombre?: string
  area_responsable?: {
    id: string
    codigo: string
    nombre: string
  }
  area_responsable_id?: string
  objetivo_estrategico?: string
  objetivo_estrategico_code?: string
  fecha_implementacion?: string
  fecha_limite?: string
  prioridad: 'alta' | 'media' | 'baja'
  estado: 'propuesta' | 'aprobada' | 'en_ejecucion' | 'completada' | 'cancelada' | 'suspendida'
  recursos_necesarios: string
  indicadores_exito: string
  progreso_porcentaje: number
  created_at: string
  updated_at: string
}

export interface DofaStats {
  total_factores: number
  por_tipo: {
    fortalezas: number
    debilidades: number
    oportunidades: number
    amenazas: number
  }
  por_impacto: {
    alto: number
    medio: number
    bajo: number
  }
  factores_internos: number
  factores_externos: number
}
```

#### 4. Crear Hook useContexto

```typescript
// frontend/src/features/gestion-estrategica/hooks/useContexto.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contextoApi } from '../api/contextoApi'
import type { AnalisisDofa, FactorDofa, EstrategiaTows } from '../types/contexto.types'

// Query Keys
export const contextoKeys = {
  all: ['contexto'] as const,
  dofa: () => [...contextoKeys.all, 'dofa'] as const,
  dofaDetail: (id: string) => [...contextoKeys.dofa(), id] as const,
  dofaStats: (id: string) => [...contextoKeys.dofaDetail(id), 'stats'] as const,
  factores: (filters?: any) => [...contextoKeys.all, 'factores', filters] as const,
  tows: (filters?: any) => [...contextoKeys.all, 'tows', filters] as const,
}

export const useContexto = () => {
  const queryClient = useQueryClient()

  // ========== DOFA Queries ==========
  const useAnalisisDofa = (params?: { estado?: string; periodo?: string }) =>
    useQuery({
      queryKey: [...contextoKeys.dofa(), params],
      queryFn: () => contextoApi.dofa.getAll(params)
    })

  const useDofaDetail = (id: string) =>
    useQuery({
      queryKey: contextoKeys.dofaDetail(id),
      queryFn: () => contextoApi.dofa.getById(id),
      enabled: !!id
    })

  const useDofaStats = (id: string) =>
    useQuery({
      queryKey: contextoKeys.dofaStats(id),
      queryFn: () => contextoApi.dofa.getEstadisticas(id),
      enabled: !!id
    })

  // ========== DOFA Mutations ==========
  const createDofa = useMutation({
    mutationFn: (data: Partial<AnalisisDofa>) => contextoApi.dofa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.dofa() })
      toast.success('Análisis DOFA creado')
    },
    onError: () => {
      toast.error('Error al crear análisis DOFA')
    }
  })

  const updateDofa = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnalisisDofa> }) =>
      contextoApi.dofa.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.dofaDetail(id) })
      queryClient.invalidateQueries({ queryKey: contextoKeys.dofa() })
      toast.success('Análisis DOFA actualizado')
    }
  })

  const aprobarDofa = useMutation({
    mutationFn: (id: string) => contextoApi.dofa.aprobar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.dofaDetail(id) })
      toast.success('Análisis DOFA aprobado')
    }
  })

  // ========== Factores Queries ==========
  const useFactoresDofa = (params?: any) =>
    useQuery({
      queryKey: contextoKeys.factores(params),
      queryFn: () => contextoApi.factores.getAll(params)
    })

  // ========== Factores Mutations ==========
  const createFactor = useMutation({
    mutationFn: (data: Partial<FactorDofa>) => contextoApi.factores.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.factores() })
      toast.success('Factor agregado')
    }
  })

  const updateFactor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FactorDofa> }) =>
      contextoApi.factores.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.factores() })
      toast.success('Factor actualizado')
    }
  })

  const reordenarFactores = useMutation({
    mutationFn: (orden: string[]) => contextoApi.factores.reordenar(orden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.factores() })
    }
  })

  // ========== TOWS Queries ==========
  const useEstrategiasTows = (params?: any) =>
    useQuery({
      queryKey: contextoKeys.tows(params),
      queryFn: () => contextoApi.tows.getAll(params)
    })

  // ========== TOWS Mutations ==========
  const createEstrategia = useMutation({
    mutationFn: (data: Partial<EstrategiaTows>) => contextoApi.tows.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.tows() })
      toast.success('Estrategia creada')
    }
  })

  const convertirObjetivo = useMutation({
    mutationFn: ({ id, objetivoData }: { id: string; objetivoData: any }) =>
      contextoApi.tows.convertirObjetivo(id, objetivoData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextoKeys.tows() })
      queryClient.invalidateQueries({ queryKey: ['strategic', 'objectives'] })
      toast.success('Estrategia convertida en objetivo estratégico')
    }
  })

  return {
    // Queries
    useAnalisisDofa,
    useDofaDetail,
    useDofaStats,
    useFactoresDofa,
    useEstrategiasTows,

    // Mutations
    createDofa,
    updateDofa,
    aprobarDofa,
    createFactor,
    updateFactor,
    reordenarFactores,
    createEstrategia,
    convertirObjetivo
  }
}
```

#### 5. Crear Componente DOFAMatrix

```typescript
// frontend/src/features/gestion-estrategica/components/contexto/DOFAMatrix.tsx
import { useMemo } from 'react'
import { DataCard } from '@/components/data-display'
import type { FactorDofa } from '../../types/contexto.types'

interface DOFAMatrixProps {
  factores: FactorDofa[]
  onFactorClick?: (factor: FactorDofa) => void
}

export const DOFAMatrix = ({ factores, onFactorClick }: DOFAMatrixProps) => {
  const { fortalezas, debilidades, oportunidades, amenazas } = useMemo(() => {
    return {
      fortalezas: factores.filter(f => f.tipo === 'fortaleza'),
      debilidades: factores.filter(f => f.tipo === 'debilidad'),
      oportunidades: factores.filter(f => f.tipo === 'oportunidad'),
      amenazas: factores.filter(f => f.tipo === 'amenaza')
    }
  }, [factores])

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Fortalezas */}
      <DataCard
        title="Fortalezas"
        description="Factores internos positivos"
        className="border-green-200 dark:border-green-800"
      >
        <div className="space-y-2">
          {fortalezas.map((factor, index) => (
            <FactorItem
              key={factor.id}
              factor={factor}
              index={index + 1}
              color="green"
              onClick={() => onFactorClick?.(factor)}
            />
          ))}
          {fortalezas.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No hay fortalezas identificadas
            </p>
          )}
        </div>
      </DataCard>

      {/* Oportunidades */}
      <DataCard
        title="Oportunidades"
        description="Factores externos positivos"
        className="border-blue-200 dark:border-blue-800"
      >
        <div className="space-y-2">
          {oportunidades.map((factor, index) => (
            <FactorItem
              key={factor.id}
              factor={factor}
              index={index + 1}
              color="blue"
              onClick={() => onFactorClick?.(factor)}
            />
          ))}
          {oportunidades.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No hay oportunidades identificadas
            </p>
          )}
        </div>
      </DataCard>

      {/* Debilidades */}
      <DataCard
        title="Debilidades"
        description="Factores internos negativos"
        className="border-yellow-200 dark:border-yellow-800"
      >
        <div className="space-y-2">
          {debilidades.map((factor, index) => (
            <FactorItem
              key={factor.id}
              factor={factor}
              index={index + 1}
              color="yellow"
              onClick={() => onFactorClick?.(factor)}
            />
          ))}
          {debilidades.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No hay debilidades identificadas
            </p>
          )}
        </div>
      </DataCard>

      {/* Amenazas */}
      <DataCard
        title="Amenazas"
        description="Factores externos negativos"
        className="border-red-200 dark:border-red-800"
      >
        <div className="space-y-2">
          {amenazas.map((factor, index) => (
            <FactorItem
              key={factor.id}
              factor={factor}
              index={index + 1}
              color="red"
              onClick={() => onFactorClick?.(factor)}
            />
          ))}
          {amenazas.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No hay amenazas identificadas
            </p>
          )}
        </div>
      </DataCard>
    </div>
  )
}

interface FactorItemProps {
  factor: FactorDofa
  index: number
  color: 'green' | 'blue' | 'yellow' | 'red'
  onClick: () => void
}

const FactorItem = ({ factor, index, color, onClick }: FactorItemProps) => {
  const colorClasses = {
    green: 'bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800',
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800',
    yellow: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-800',
    red: 'bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800'
  }

  const impactoColors = {
    alto: 'text-red-600 dark:text-red-400',
    medio: 'text-yellow-600 dark:text-yellow-400',
    bajo: 'text-green-600 dark:text-green-400'
  }

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${colorClasses[color]}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="font-semibold text-gray-600 dark:text-gray-400">
          {index}.
        </span>
        <div className="flex-1">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {factor.descripcion}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            {factor.area && (
              <span className="text-gray-600 dark:text-gray-400">
                {factor.area.nombre}
              </span>
            )}
            <span className={`font-medium ${impactoColors[factor.impacto]}`}>
              Impacto {factor.impacto.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Deliverables Sprint 1

- [x] Partes Interesadas movidas a `planeacion/stakeholders/`
- [ ] Backend DOFA: Serializers, Views, URLs
- [ ] Frontend DOFA: API client, Hook, Types
- [ ] Componente `DOFAMatrix` funcional
- [ ] Tests básicos backend
- [ ] Documentación API (drf-spectacular)

---

## 📝 Notas Finales

Este es el plan detallado del **Sprint 1**. Los siguientes sprints seguirán la misma estructura:

- **Sprint 2:** PESTEL + Porter (gráficos Recharts)
- **Sprint 3:** Matriz TOWS interactiva
- **Sprint 4:** Objetivos + KPIs con semáforos
- **Sprint 5:** Mapa Estratégico con React Flow
- **Sprint 6:** Gestión del Cambio

¿Quieres que continúe con los detalles de los siguientes sprints o empezamos a implementar el Sprint 1?

---

**Preparado por:** Claude Sonnet 4.5
**Fecha:** 2026-01-23
**Versión:** 1.0
