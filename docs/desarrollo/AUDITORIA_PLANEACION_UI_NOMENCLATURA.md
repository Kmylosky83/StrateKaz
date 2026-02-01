# 📊 AUDITORÍA DE UI Y NOMENCLATURA - PLANEACIÓN ESTRATÉGICA

**Versión:** 1.0
**Fecha:** 2026-01-24
**Estado:** 🔴 **REQUIERE CORRECCIONES**

---

## 🎯 RESUMEN EJECUTIVO

### Hallazgos Principales

| Aspecto | Estado | Problema Encontrado |
|---------|--------|---------------------|
| **Nomenclatura de Secciones** | ❌ **INCORRECTO** | Nombres multi-palabra: "Análisis DOFA", "Encuestas DOFA", "Estrategias TOWS" |
| **Uso de SectionHeader** | ✅ **CORRECTO** | `title` y `description` bien implementados |
| **Tipos de Vista** | ✅ **BUENO** | Siguiendo Vista 2 (Lista CRUD) y Vista 2B (Con Filtros) |
| **Falta Stakeholders** | ❌ **PENDIENTE** | Módulo no implementado (0%) |
| **Falta Timeline** | ❌ **PENDIENTE** | Vista Timeline de Cambios no existe |

---

## 📋 1. CATÁLOGO DE VISTAS UI - VALIDACIÓN

### Vistas Documentadas en Catálogo

Según [CATALOGO_VISTAS_UI.md](CATALOGO_VISTAS_UI.md):

| Vista | Propósito | Componentes Clave |
|-------|-----------|-------------------|
| **Vista 1** | Cards de Información | `PageHeader`, `StatsGrid`, `DataSection`, `DataCard` |
| **Vista 2** | Lista CRUD | `PageHeader`, `StatsGrid`, `SectionHeader`, `DataTableCard` |
| **Vista 2B** | Lista CRUD con Filtros | `PageHeader`, `SectionHeader`, `Input`, `Select`, `DataTableCard` |

### Vistas Utilizadas en Planeación

| Sección | Vista Usada | ✓ Cumple Catálogo | Observaciones |
|---------|-------------|-------------------|---------------|
| **Análisis DOFA** | Vista 2B | ✅ SÍ | StatsGrid + SectionHeader + Filtros en línea + Tabla |
| **Encuestas DOFA** | Vista 2B | ✅ SÍ | StatsGrid + SectionHeader + Filtros + Tabla |
| **Análisis PESTEL** | Vista 2B | ✅ SÍ | StatsGrid + SectionHeader + Filtros + Tabla |
| **Fuerzas Porter** | Vista 2 | ✅ SÍ | SectionHeader + Tabla + Tarjetas Porter |
| **Estrategias TOWS** | Vista 2B | ✅ SÍ | StatsGrid + SectionHeader + Filtros + Tabla |
| **Gestión del Cambio** | Vista 2B | ✅ SÍ | SectionHeader + StatsGrid + Filtros + Tabla |
| **Mapa Estratégico** | **Custom** | ⚠️ PERSONALIZADA | React Flow Canvas (válido, es única) |
| **KPIs Dashboard** | **Custom** | ⚠️ PERSONALIZADA | 6 engines de visualización (válido, es enterprise) |

**Conclusión:** ✅ Todas las secciones siguen patrones del catálogo correctamente.

---

## 🔤 2. NOMENCLATURA - ANÁLISIS CRÍTICO

### Regla del Usuario

> "Los nombres de categorías de planeación deben ser de **UNA PALABRA**"

### Análisis de Nombres Actuales

#### ❌ CONTEXTO - Nombres INCORRECTOS (Multi-palabra)

| Sección Actual | Code (BD) | Título SectionHeader | ❌ Problema |
|----------------|-----------|----------------------|-------------|
| Encuestas DOFA | `encuestas_dofa` | "Encuestas DOFA" | 2 palabras |
| Análisis DOFA | `analisis_dofa` | "Analisis DOFA" | 2 palabras |
| Análisis PESTEL | `analisis_pestel` | "Analisis PESTEL" | 2 palabras |
| Fuerzas Porter | `fuerzas_porter` | "Análisis de Porter" | 3 palabras |
| Estrategias TOWS | `estrategias_tows` | "Estrategias TOWS" | 2 palabras |

#### ❌ PLANEACIÓN - Nombres INCORRECTOS (Multi-palabra)

| Sección Actual | Título Probable | ❌ Problema |
|----------------|-----------------|-------------|
| Mapa Estratégico Visual | "Mapa Estratégico" | 2 palabras |
| Objetivos Estratégicos | "Objetivos Estratégicos" | 2 palabras |
| KPIs y Mediciones | "KPIs y Mediciones" | 3 palabras |
| Gestión del Cambio | "Gestión del Cambio" | 3 palabras |

---

### ✅ PROPUESTA DE CORRECCIÓN

#### Contexto Tab

| ❌ Nombre Actual | ✅ Propuesta | Descripción (se mantiene larga) |
|------------------|-------------|----------------------------------|
| Encuestas DOFA | **Encuestas** | Recopila opiniones de colaboradores sobre fortalezas y debilidades |
| Análisis DOFA | **DOFA** | Identifica Fortalezas, Oportunidades, Debilidades y Amenazas |
| Análisis PESTEL | **PESTEL** | Analiza factores Políticos, Económicos, Sociales, Tecnológicos, Ecológicos y Legales |
| Análisis de Porter | **Porter** | Evalúa las 5 fuerzas competitivas que determinan la intensidad de la competencia |
| Estrategias TOWS | **TOWS** | Define estrategias cruzando Fortalezas, Oportunidades, Debilidades y Amenazas |

#### Planeación Tab

| ❌ Nombre Actual | ✅ Propuesta | Descripción (se mantiene larga) |
|------------------|-------------|----------------------------------|
| Planes Estratégicos | **Planes** | Planes estratégicos organizacionales con horizonte temporal |
| Objetivos Estratégicos | **Objetivos** | Objetivos por perspectiva BSC vinculados al plan estratégico |
| Mapa Estratégico Visual | **Mapa** | Visualización interactiva de objetivos y relaciones causa-efecto |
| KPIs y Mediciones | **KPIs** | Indicadores de desempeño con metas y semáforos de seguimiento |
| Gestión del Cambio | **Cambios** | Registro y seguimiento de cambios estratégicos, organizacionales y tecnológicos |

---

## 🧩 3. COMPONENTES DE HEADER - ANÁLISIS

### 3.1 PageHeader vs SectionHeader

**CONFUSIÓN DETECTADA:** No existe `PageHeader` como componente individual, se usa `HeaderTabs` (ahora renombrado a `PageTabs`).

### Estructura Correcta de Headers

```tsx
// 1. PageTabs - Navegación de secciones (nivel superior)
<PageTabs
  tabs={sections.map(s => ({ id: s.code, label: s.name }))}
  activeTab={activeSection}
  onTabChange={setActiveSection}
  variant="pills"  // Estilo moderno
  moduleColor="purple"  // Color del módulo
/>

// 2. SectionHeader - Título de cada sección (dentro del tab)
<SectionHeader
  title="DOFA"  // ← UNA PALABRA
  description="Identifica Fortalezas, Oportunidades, Debilidades y Amenazas"
  actions={<Button>Crear Análisis</Button>}
  icon={<FileSearch />}
  variant="default"
/>
```

### 3.2 SectionHeader - Props Encontrados

| Prop | Tipo | Uso Actual | ✓ Correcto |
|------|------|------------|------------|
| `title` | string | "Análisis DOFA" | ❌ Multi-palabra |
| `description` | string | "Identifica Fortalezas..." | ✅ Largo OK |
| `actions` | ReactNode | `<Button>Crear</Button>` | ✅ OK |
| `icon` | ReactNode | `<FileSearch />` envuelto en div con color | ✅ OK |
| `variant` | 'default' \| 'compact' \| 'large' | 'compact' | ✅ OK |

**Conclusión:** ✅ Implementación de `SectionHeader` es **correcta**, solo falta ajustar `title` a una palabra.

---

## 🎨 4. TIPOS DE VISTA FALTANTES

### 4.1 Vista Timeline (NO EXISTE)

**Necesaria para:** Gestión del Cambio

**Componente a crear:**
```tsx
// frontend/src/features/gestion-estrategica/components/gestion-cambio/CambioTimeline.tsx
import { Timeline } from '@/components/data-display'; // ← Componente a crear

export function CambioTimeline({ cambios }: { cambios: GestionCambio[] }) {
  const timelineItems = cambios.map(cambio => ({
    id: cambio.id,
    date: cambio.fecha_implementacion,
    title: cambio.titulo,
    description: cambio.descripcion,
    status: cambio.estado,
    icon: getIconByTipo(cambio.tipo),
  }));

  return <Timeline items={timelineItems} variant="vertical" />;
}
```

**Librería recomendada:**
- `react-chrono` (timeline horizontal/vertical)
- O crear componente custom con Framer Motion

### 4.2 Vista Kanban (PARCIAL)

**Necesaria para:** Gestión del Cambio, Objetivos

**Ya existe:** `CambioKanban.tsx` (mencionado en arquitectura)
**Estado:** ⚠️ No encontrado en grep, probablemente no implementado

---

## 📊 5. COMPARACIÓN CON OTROS MÓDULOS

### Módulos Bien Implementados

#### ✅ Cumplimiento Normativo

```tsx
// frontend/src/features/cumplimiento/pages/MatrizLegalPage.tsx
<PageTabs tabs={sections} activeTab={activeSection} onTabChange={setActiveSection} />

// Secciones: "Normas", "Evaluación" (✓ UNA PALABRA cada una)
```

#### ✅ Configuración

```tsx
// frontend/src/features/configuracion/components/EmpresaSection.tsx
<SectionHeader
  title="Datos Fiscales y Legales"  // ← Dentro de Card, no es nombre de sección
  description="Información registrada de la empresa"
/>
```

**Nota:** En Configuración, los `SectionHeader` están **dentro de secciones de cards**, no son nombres de pestañas. Diferente caso de uso.

---

## ✅ 6. CHECKLIST DE CORRECCIONES

### 🔴 Prioridad Alta (Nomenclatura)

- [ ] **Contexto Tab - Renombrar Secciones**
  - [ ] `EncuestasDofaSection.tsx` → `title="Encuestas"`
  - [ ] `AnalisisDofaSection.tsx` → `title="DOFA"`
  - [ ] `AnalisisPestelSection.tsx` → `title="PESTEL"`
  - [ ] `FuerzasPorterSection.tsx` → `title="Porter"`
  - [ ] `EstrategiasTowsSection.tsx` → `title="TOWS"`

- [ ] **Planeación Tab - Renombrar Secciones**
  - [ ] `PlaneacionTab.tsx` → Ajustar títulos de secciones internas
  - [ ] Planes: `title="Planes"`
  - [ ] Objetivos: `title="Objetivos"`
  - [ ] Mapa: `title="Mapa"`
  - [ ] KPIs: `title="KPIs"`
  - [ ] Cambios: `title="Cambios"`

- [ ] **Backend - Actualizar TabSection.name en BD**
  - [ ] Ejecutar migración/seed para actualizar nombres en `core_tabsection`
  - [ ] Asegurar que `TabSection.name` sea de una palabra

### 🟡 Prioridad Media (Componentes Faltantes)

- [ ] **Implementar Stakeholders Module (0%)**
  - [ ] Backend: `backend/apps/gestion_estrategica/planeacion/stakeholders/`
  - [ ] Models: `ParteInteresada`, `MatrizInfluencia`
  - [ ] Serializers, ViewSets, URLs
  - [ ] Frontend: `StakeholdersSection.tsx`
  - [ ] Hook: `useStakeholders.ts`
  - [ ] API: `stakeholdersApi.ts`
  - [ ] Modal: `StakeholderFormModal.tsx`
  - [ ] Componente: `StakeholderMatrix.tsx` (matriz Influencia/Interés)

- [ ] **Implementar Timeline de Cambios**
  - [ ] Componente: `CambioTimeline.tsx`
  - [ ] Integrar en `GestionCambioTab.tsx`
  - [ ] Agregar toggle: Vista Tabla ↔ Vista Timeline

### 🟢 Prioridad Baja (Mejoras UX)

- [ ] **Vista Kanban para Objetivos**
  - [ ] Componente: `ObjetiveKanban.tsx`
  - [ ] Por estado: PENDIENTE → EN_PROGRESO → COMPLETADO

- [ ] **Agregar `PageHeader` global**
  - [ ] Título de página: "Planeación Estratégica"
  - [ ] Descripción dinámica según sección activa

---

## 📝 7. CÓDIGO DE CORRECCIÓN

### 7.1 Ejemplo: AnalisisDofaSection.tsx

**Antes:**
```tsx
<SectionHeader
  title="Analisis DOFA"  // ❌ 2 palabras
  description="Identifica Fortalezas, Oportunidades, Debilidades y Amenazas"
  ...
/>
```

**Después:**
```tsx
<SectionHeader
  title="DOFA"  // ✅ 1 palabra
  description="Identifica Fortalezas, Oportunidades, Debilidades y Amenazas"
  ...
/>
```

### 7.2 Migración de BD (Seed)

```python
# backend/apps/core/management/commands/seed_estructura_final.py

# ANTES
{
    'code': 'analisis_dofa',
    'name': 'Análisis DOFA',  # ❌ 2 palabras
    'description': 'Identifica Fortalezas...',
    ...
}

# DESPUÉS
{
    'code': 'analisis_dofa',
    'name': 'DOFA',  # ✅ 1 palabra
    'description': 'Identifica Fortalezas, Oportunidades, Debilidades y Amenazas',
    ...
}
```

### 7.3 Script de Corrección Masiva

```bash
# Renombrar títulos en todos los archivos SectionHeader

# 1. Contexto
sed -i 's/title="Encuestas DOFA"/title="Encuestas"/' frontend/src/features/gestion-estrategica/components/contexto/EncuestasDofaSection.tsx
sed -i 's/title="Analisis DOFA"/title="DOFA"/' frontend/src/features/gestion-estrategica/components/contexto/AnalisisDofaSection.tsx
sed -i 's/title="Analisis PESTEL"/title="PESTEL"/' frontend/src/features/gestion-estrategica/components/contexto/AnalisisPestelSection.tsx
sed -i 's/title="Análisis de Porter"/title="Porter"/' frontend/src/features/gestion-estrategica/components/contexto/FuerzasPorterSection.tsx
sed -i 's/title="Estrategias TOWS"/title="TOWS"/' frontend/src/features/gestion-estrategica/components/contexto/EstrategiasTowsSection.tsx

# 2. Gestión del Cambio
sed -i 's/title="Gestión del Cambio"/title="Cambios"/' frontend/src/features/gestion-estrategica/components/GestionCambioTab.tsx
```

---

## 🎯 8. PLAN DE IMPLEMENTACIÓN

### Fase 1: Correcciones de Nomenclatura (1 día)

**Día 1 - Mañana:**
1. Actualizar BD (seed): Renombrar `TabSection.name` a una palabra
2. Ejecutar seed: `python manage.py seed_estructura_final`

**Día 1 - Tarde:**
3. Renombrar títulos en frontend (script sed o manualmente)
4. Verificar que labels de `PageTabs` se actualicen automáticamente
5. Commit: `refactor(ui): Renombrar secciones a una palabra según estándar`

### Fase 2: Stakeholders Module (3-5 días)

**Ver plan detallado en:** [PLAN_IMPLEMENTACION_PLANEACION.md](PLAN_IMPLEMENTACION_PLANEACION.md#sprint-1)

### Fase 3: Timeline de Cambios (1-2 días)

**Ver plan detallado en:** Sección siguiente

---

## 🚀 9. STAKEHOLDERS MODULE - PLAN DETALLADO

### Backend (Día 1-2)

#### 1. Crear App Django

```bash
cd backend/apps/gestion_estrategica/planeacion
mkdir stakeholders
touch stakeholders/__init__.py stakeholders/models.py stakeholders/serializers.py
touch stakeholders/views.py stakeholders/urls.py stakeholders/admin.py
```

#### 2. Models

```python
# backend/apps/gestion_estrategica/planeacion/stakeholders/models.py

from django.db import models
from apps.core.models import BaseCompanyModel

class ParteInteresada(BaseCompanyModel):
    """
    Partes interesadas (stakeholders) del plan estratégico

    Clasificación según ISO 9001:2015 Cláusula 4.2
    """

    TIPO_CHOICES = [
        ('INTERNA', 'Interna'),
        ('EXTERNA', 'Externa'),
    ]

    CATEGORIA_CHOICES = [
        ('CLIENTE', 'Cliente'),
        ('PROVEEDOR', 'Proveedor'),
        ('EMPLEADO', 'Empleado'),
        ('ACCIONISTA', 'Accionista'),
        ('REGULADOR', 'Regulador'),
        ('COMUNIDAD', 'Comunidad'),
        ('COMPETIDOR', 'Competidor'),
        ('OTRO', 'Otro'),
    ]

    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    categoria = models.CharField(max_length=15, choices=CATEGORIA_CHOICES)

    # Matriz Poder/Interés
    nivel_poder = models.IntegerField(
        default=5,
        help_text='Nivel de poder/influencia (1-10)'
    )
    nivel_interes = models.IntegerField(
        default=5,
        help_text='Nivel de interés (1-10)'
    )

    # Información adicional
    necesidades_expectativas = models.TextField(blank=True)
    estrategia_gestion = models.TextField(blank=True)
    contacto_principal = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)

    # Vinculación con objetivos
    objetivos_relacionados = models.ManyToManyField(
        'planeacion.StrategicObjective',
        blank=True,
        related_name='stakeholders'
    )

    class Meta:
        db_table = 'gestion_estrategica_parte_interesada'
        verbose_name = 'Parte Interesada'
        verbose_name_plural = 'Partes Interesadas'
        ordering = ['-nivel_poder', '-nivel_interes', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()})"

    @property
    def cuadrante_matriz(self):
        """
        Determina el cuadrante de la matriz Poder/Interés:
        - Q1 (Alto Poder, Alto Interés): Gestionar de cerca
        - Q2 (Alto Poder, Bajo Interés): Mantener satisfecho
        - Q3 (Bajo Poder, Alto Interés): Mantener informado
        - Q4 (Bajo Poder, Bajo Interés): Monitorear
        """
        if self.nivel_poder >= 6 and self.nivel_interes >= 6:
            return 'Q1_GESTIONAR'
        elif self.nivel_poder >= 6 and self.nivel_interes < 6:
            return 'Q2_SATISFACER'
        elif self.nivel_poder < 6 and self.nivel_interes >= 6:
            return 'Q3_INFORMAR'
        else:
            return 'Q4_MONITOREAR'
```

#### 3. Serializers

```python
# backend/apps/gestion_estrategica/planeacion/stakeholders/serializers.py

from rest_framework import serializers
from .models import ParteInteresada

class ParteInteresadaSerializer(serializers.ModelSerializer):
    objetivos_relacionados_display = serializers.SerializerMethodField()
    cuadrante_matriz = serializers.ReadOnlyField()

    class Meta:
        model = ParteInteresada
        fields = [
            'id', 'nombre', 'tipo', 'categoria',
            'nivel_poder', 'nivel_interes', 'cuadrante_matriz',
            'necesidades_expectativas', 'estrategia_gestion',
            'contacto_principal', 'email',
            'objetivos_relacionados', 'objetivos_relacionados_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'cuadrante_matriz']

    def get_objetivos_relacionados_display(self, obj):
        return [
            {'id': o.id, 'code': o.code, 'name': o.name}
            for o in obj.objetivos_relacionados.all()
        ]
```

#### 4. ViewSets

```python
# backend/apps/gestion_estrategica/planeacion/stakeholders/views.py

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ParteInteresada
from .serializers import ParteInteresadaSerializer

class ParteInteresadaViewSet(viewsets.ModelViewSet):
    queryset = ParteInteresada.objects.all()
    serializer_class = ParteInteresadaSerializer
    filterset_fields = ['tipo', 'categoria']
    search_fields = ['nombre', 'necesidades_expectativas']
    ordering = ['-nivel_poder', '-nivel_interes']

    @action(detail=False, methods=['get'])
    def matriz(self, request):
        """Datos para matriz Poder/Interés"""
        stakeholders = self.get_queryset()

        matriz_data = {
            'Q1_GESTIONAR': [],
            'Q2_SATISFACER': [],
            'Q3_INFORMAR': [],
            'Q4_MONITOREAR': [],
        }

        for sh in stakeholders:
            matriz_data[sh.cuadrante_matriz].append({
                'id': sh.id,
                'nombre': sh.nombre,
                'nivel_poder': sh.nivel_poder,
                'nivel_interes': sh.nivel_interes,
                'categoria': sh.categoria,
            })

        return Response(matriz_data)
```

### Frontend (Día 3-5)

#### 1. Types

```typescript
// frontend/src/features/gestion-estrategica/types/stakeholders.types.ts

export interface ParteInteresada {
  id: string;
  nombre: string;
  tipo: 'INTERNA' | 'EXTERNA';
  categoria: 'CLIENTE' | 'PROVEEDOR' | 'EMPLEADO' | 'ACCIONISTA' | 'REGULADOR' | 'COMUNIDAD' | 'COMPETIDOR' | 'OTRO';
  nivel_poder: number; // 1-10
  nivel_interes: number; // 1-10
  cuadrante_matriz: 'Q1_GESTIONAR' | 'Q2_SATISFACER' | 'Q3_INFORMAR' | 'Q4_MONITOREAR';
  necesidades_expectativas: string;
  estrategia_gestion: string;
  contacto_principal?: string;
  email?: string;
  objetivos_relacionados: string[];
  objetivos_relacionados_display: { id: string; code: string; name: string }[];
  created_at: string;
  updated_at: string;
}

export interface StakeholderMatrizData {
  Q1_GESTIONAR: ParteInteresada[];
  Q2_SATISFACER: ParteInteresada[];
  Q3_INFORMAR: ParteInteresada[];
  Q4_MONITOREAR: ParteInteresada[];
}
```

#### 2. API Client

```typescript
// frontend/src/features/gestion-estrategica/api/stakeholdersApi.ts

import { apiClient } from '@/lib/apiClient';
import type { ParteInteresada, StakeholderMatrizData } from '../types/stakeholders.types';

const BASE_URL = '/gestion-estrategica/planeacion/stakeholders';

export const stakeholdersApi = {
  getAll: (params?: { tipo?: string; categoria?: string }) =>
    apiClient.get<ParteInteresada[]>(`${BASE_URL}/`, { params }),

  getById: (id: string) =>
    apiClient.get<ParteInteresada>(`${BASE_URL}/${id}/`),

  create: (data: Partial<ParteInteresada>) =>
    apiClient.post<ParteInteresada>(`${BASE_URL}/`, data),

  update: (id: string, data: Partial<ParteInteresada>) =>
    apiClient.patch<ParteInteresada>(`${BASE_URL}/${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`${BASE_URL}/${id}/`),

  getMatriz: () =>
    apiClient.get<StakeholderMatrizData>(`${BASE_URL}/matriz/`),
};
```

#### 3. Hook

```typescript
// frontend/src/features/gestion-estrategica/hooks/useStakeholders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { stakeholdersApi } from '../api/stakeholdersApi';

export const stakeholdersKeys = {
  all: ['stakeholders'] as const,
  list: (filters?: any) => [...stakeholdersKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stakeholdersKeys.all, 'detail', id] as const,
  matriz: () => [...stakeholdersKeys.all, 'matriz'] as const,
};

export const useStakeholders = () => {
  const queryClient = useQueryClient();

  const useStakeholdersList = (filters?: any) =>
    useQuery({
      queryKey: stakeholdersKeys.list(filters),
      queryFn: () => stakeholdersApi.getAll(filters),
    });

  const useStakeholderDetail = (id: string) =>
    useQuery({
      queryKey: stakeholdersKeys.detail(id),
      queryFn: () => stakeholdersApi.getById(id),
      enabled: !!id,
    });

  const useStakeholderMatriz = () =>
    useQuery({
      queryKey: stakeholdersKeys.matriz(),
      queryFn: () => stakeholdersApi.getMatriz(),
    });

  const createStakeholder = useMutation({
    mutationFn: stakeholdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stakeholdersKeys.all });
      toast.success('Parte interesada creada');
    },
  });

  const updateStakeholder = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ParteInteresada> }) =>
      stakeholdersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stakeholdersKeys.all });
      toast.success('Parte interesada actualizada');
    },
  });

  const deleteStakeholder = useMutation({
    mutationFn: stakeholdersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stakeholdersKeys.all });
      toast.success('Parte interesada eliminada');
    },
  });

  return {
    useStakeholdersList,
    useStakeholderDetail,
    useStakeholderMatriz,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
  };
};
```

#### 4. StakeholdersSection.tsx

```typescript
// frontend/src/features/gestion-estrategica/components/stakeholders/StakeholdersSection.tsx

import { useState } from 'react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Button, Card, Badge } from '@/components/common';
import { StatsGrid } from '@/components/layout';
import { Users, Plus } from 'lucide-react';
import { useStakeholders } from '../../hooks/useStakeholders';
import { StakeholderMatrix } from './StakeholderMatrix';
import { StakeholderFormModal } from '../modals/StakeholderFormModal';
import { DataTableCard } from '@/components/layout';

export function StakeholdersSection() {
  const { useStakeholdersList, deleteStakeholder } = useStakeholders();
  const { data: stakeholders = [], isLoading } = useStakeholdersList();
  const [view, setView] = useState<'table' | 'matrix'>('table');
  const [modalOpen, setModalOpen] = useState(false);

  const stats = [
    {
      label: 'Total',
      value: stakeholders.length.toString(),
      icon: Users,
      iconColor: 'primary',
    },
    {
      label: 'Gestionar de Cerca (Q1)',
      value: stakeholders.filter(s => s.cuadrante_matriz === 'Q1_GESTIONAR').length.toString(),
      icon: Users,
      iconColor: 'danger',
      description: 'Alto Poder, Alto Interés',
    },
    {
      label: 'Mantener Informado (Q3)',
      value: stakeholders.filter(s => s.cuadrante_matriz === 'Q3_INFORMAR').length.toString(),
      icon: Users,
      iconColor: 'info',
      description: 'Bajo Poder, Alto Interés',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Stakeholders"
        description="Identifica y gestiona las partes interesadas clave de la organización"
        actions={
          <div className="flex gap-2">
            <Button
              variant={view === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('table')}
            >
              Tabla
            </Button>
            <Button
              variant={view === 'matrix' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('matrix')}
            >
              Matriz
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Stakeholder
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <StatsGrid stats={stats} columns={3} moduleColor="purple" />

      {/* Content */}
      {view === 'table' ? (
        <DataTableCard
          // ... tabla con columnas
        />
      ) : (
        <StakeholderMatrix />
      )}

      {/* Modal */}
      <StakeholderFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
```

#### 5. StakeholderMatrix.tsx

```typescript
// frontend/src/features/gestion-estrategica/components/stakeholders/StakeholderMatrix.tsx

import { Card } from '@/components/common';
import { useStakeholders } from '../../hooks/useStakeholders';

export function StakeholderMatrix() {
  const { useStakeholderMatriz } = useStakeholders();
  const { data: matriz, isLoading } = useStakeholderMatriz();

  if (isLoading) return <div>Cargando matriz...</div>;
  if (!matriz) return null;

  const quadrants = [
    {
      key: 'Q1_GESTIONAR',
      title: 'Gestionar de Cerca',
      description: 'Alto Poder, Alto Interés',
      color: 'border-red-500 bg-red-50 dark:bg-red-900/10',
      position: 'top-right',
    },
    {
      key: 'Q2_SATISFACER',
      title: 'Mantener Satisfecho',
      description: 'Alto Poder, Bajo Interés',
      color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
      position: 'top-left',
    },
    {
      key: 'Q3_INFORMAR',
      title: 'Mantener Informado',
      description: 'Bajo Poder, Alto Interés',
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
      position: 'bottom-right',
    },
    {
      key: 'Q4_MONITOREAR',
      title: 'Monitorear',
      description: 'Bajo Poder, Bajo Interés',
      color: 'border-gray-400 bg-gray-50 dark:bg-gray-800/10',
      position: 'bottom-left',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {quadrants.map((quad) => (
        <Card
          key={quad.key}
          className={`border-2 ${quad.color} p-6`}
        >
          <h3 className="font-semibold text-lg mb-1">{quad.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {quad.description}
          </p>

          <div className="space-y-2">
            {matriz[quad.key as keyof typeof matriz]?.map((sh) => (
              <div
                key={sh.id}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="font-medium">{sh.nombre}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Poder: {sh.nivel_poder}/10 | Interés: {sh.nivel_interes}/10
                </div>
              </div>
            ))}

            {matriz[quad.key as keyof typeof matriz]?.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                No hay stakeholders en este cuadrante
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

## 📈 10. MÉTRICAS DE COMPLETITUD POST-CORRECCIÓN

### Antes de Correcciones

| Aspecto | Completitud |
|---------|-------------|
| Nomenclatura | 0% ❌ |
| Stakeholders | 0% ❌ |
| Timeline | 0% ❌ |
| **TOTAL** | **70%** |

### Después de Correcciones

| Aspecto | Completitud |
|---------|-------------|
| Nomenclatura | 100% ✅ |
| Stakeholders | 100% ✅ |
| Timeline | 100% ✅ |
| **TOTAL** | **100%** 🎉 |

---

## 📚 REFERENCIAS

- [CATALOGO_VISTAS_UI.md](CATALOGO_VISTAS_UI.md) - Catálogo completo de vistas
- [PLAN_IMPLEMENTACION_PLANEACION.md](PLAN_IMPLEMENTACION_PLANEACION.md) - Plan de 8 sprints
- [SectionHeader.tsx](../../frontend/src/components/common/SectionHeader.tsx) - Componente de headers
- [PageTabs.tsx](../../frontend/src/components/layout/PageTabs.tsx) - Tabs de navegación

---

**FIN DEL DOCUMENTO**
