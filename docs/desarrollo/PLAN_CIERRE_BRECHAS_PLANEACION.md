# Plan de Intervención: Cierre de Brechas en Planeación Estratégica

**Fecha:** 2026-01-25
**Módulo:** Dirección Estratégica / Planeación Estratégica
**Objetivo:** Cerrar brechas identificadas y habilitar conversión Cambio → Proyecto

---

## 1. Resumen Ejecutivo

### Brechas Identificadas

| # | Brecha | Impacto | Prioridad |
|---|--------|---------|-----------|
| B1 | GestionCambio sin campo `progress` | No se puede medir avance del cambio | 🔴 Alta |
| B2 | Sin validación de ciclos en CausaEfecto | Relaciones circulares en mapa BSC | 🟡 Media |
| B3 | Sin índices en BD para consultas frecuentes | Rendimiento degradado | 🟡 Media |
| B4 | Falta modal "Convertir Cambio a Proyecto" en Frontend | Flujo incompleto | 🔴 Alta |
| B5 | Validaciones de integridad referencial faltantes | Datos huérfanos posibles | 🟡 Media |
| B6 | Sin dashboard de trazabilidad end-to-end | Auditoría ISO difícil | 🟢 Baja |
| B7 | Sincronización estados Cambio ↔ Proyecto | Estados inconsistentes | 🔴 Alta |

### Flujo Objetivo Final

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO ESTRATÉGICO COMPLETO                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [CONTEXTO]         [ESTRATEGIA]        [PLANEACIÓN]                   │
│  AnalisisDOFA   →   EstrategiaTOWS  →   StrategicObjective            │
│  AnalisisPESTEL     (FO/FA/DO/DA)       (4 Perspectivas BSC)          │
│  FuerzasPorter                          │                              │
│                                         ├─→ KPIs + Mediciones          │
│                                         │   (Semáforo automático)      │
│                                         │                              │
│                                         ├─→ MapaEstrategico            │
│                                         │   (Canvas React Flow)        │
│                                         │                              │
│                                         └─→ GestionCambio              │
│                                             │                          │
│                                             │ [CONVERTIR A PROYECTO]   │
│                                             ▼                          │
│  [EJECUCIÓN]                           Proyecto (PMI)                  │
│  - Iniciación: ProjectCharter          - tipo_origen: CAMBIO          │
│  - Planificación: Fases, WBS           - origen_cambio: FK            │
│  - Ejecución: Seguimiento              - origen_objetivo: FK          │
│  - Monitoreo: EVM (SPI, CPI)                                          │
│  - Cierre: Actas, Lecciones                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Plan de Intervención por Brecha

---

### B1: Campo `progress` en GestionCambio

**Estado actual:** GestionCambio no tiene campo de progreso (a diferencia de StrategicObjective)

**Impacto:** No se puede visualizar el avance porcentual del cambio antes de convertirlo en proyecto

#### Solución Backend

**Archivo:** `backend/apps/gestion_estrategica/planeacion/models.py`

```python
class GestionCambio(AuditModel, SoftDeleteModel):
    # ... campos existentes ...

    # NUEVO: Campo de progreso
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Progreso (%)",
        help_text="Porcentaje de avance del cambio (0-100)"
    )

    # NUEVO: Método para actualizar progreso automático según estado
    def update_progress_from_status(self):
        """Actualiza el progreso basado en el estado actual"""
        status_progress_map = {
            'IDENTIFICADO': 10,
            'ANALISIS': 30,
            'PLANIFICADO': 50,
            'EN_EJECUCION': 70,
            'COMPLETADO': 100,
            'CANCELADO': 0,
        }
        self.progress = status_progress_map.get(self.status, 0)

    def transition_status(self, new_status, user=None):
        # ... lógica existente de transición ...
        self.update_progress_from_status()
        self.save()
```

**Migración requerida:**
```bash
python manage.py makemigrations planeacion --name add_progress_to_gestioncambio
python manage.py migrate
```

#### Solución Frontend

**Archivo:** `frontend/src/features/gestion-estrategica/types/gestion-cambio.types.ts`

```typescript
export interface GestionCambio {
  // ... campos existentes ...
  progress: number; // NUEVO: 0-100
}
```

**Archivo:** `frontend/src/features/gestion-estrategica/components/GestionCambioTab.tsx`

```tsx
// Agregar barra de progreso en las tarjetas del Kanban
<Progress value={cambio.progress} className="h-2" />
```

---

### B2: Validación de Ciclos en CausaEfecto

**Estado actual:** Se pueden crear relaciones circulares A→B→C→A en el mapa estratégico

**Impacto:** Inconsistencia lógica en el modelo causa-efecto BSC

#### Solución Backend

**Archivo:** `backend/apps/gestion_estrategica/planeacion/models.py`

```python
from django.core.exceptions import ValidationError
from collections import deque

class CausaEfecto(TimestampedModel):
    # ... campos existentes ...

    def clean(self):
        super().clean()

        # Validación 1: No auto-referencia
        if self.source_objective_id == self.target_objective_id:
            raise ValidationError({
                'target_objective': 'Un objetivo no puede ser causa y efecto de sí mismo.'
            })

        # Validación 2: No ciclos (BFS)
        if self._creates_cycle():
            raise ValidationError({
                'target_objective': 'Esta relación crearía un ciclo en el mapa estratégico.'
            })

    def _creates_cycle(self):
        """Detecta si agregar esta relación crea un ciclo usando BFS"""
        if not self.mapa_id:
            return False

        # Obtener todas las relaciones del mapa (excluyendo la actual si es edición)
        relations = CausaEfecto.objects.filter(mapa_id=self.mapa_id)
        if self.pk:
            relations = relations.exclude(pk=self.pk)

        # Construir grafo de adyacencia
        graph = {}
        for rel in relations:
            if rel.source_objective_id not in graph:
                graph[rel.source_objective_id] = []
            graph[rel.source_objective_id].append(rel.target_objective_id)

        # Agregar la nueva relación propuesta
        if self.source_objective_id not in graph:
            graph[self.source_objective_id] = []
        graph[self.source_objective_id].append(self.target_objective_id)

        # BFS para detectar ciclo desde target hacia source
        visited = set()
        queue = deque([self.target_objective_id])

        while queue:
            current = queue.popleft()
            if current == self.source_objective_id:
                return True  # ¡Ciclo detectado!

            if current in visited:
                continue
            visited.add(current)

            for neighbor in graph.get(current, []):
                queue.append(neighbor)

        return False

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
```

---

### B3: Índices en Base de Datos

**Estado actual:** Consultas frecuentes sin índices optimizados

#### Migración de Índices

**Archivo:** `backend/apps/gestion_estrategica/planeacion/migrations/XXXX_add_performance_indexes.py`

```python
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('planeacion', 'XXXX_previous'),
    ]

    operations = [
        # Índice compuesto para listados de objetivos por perspectiva
        migrations.AddIndex(
            model_name='strategicobjective',
            index=models.Index(
                fields=['plan', 'bsc_perspective', 'is_active'],
                name='idx_obj_plan_persp_active'
            ),
        ),

        # Índice para objetivos retrasados
        migrations.AddIndex(
            model_name='strategicobjective',
            index=models.Index(
                fields=['due_date', 'status'],
                name='idx_obj_due_status'
            ),
        ),

        # Índice para KPIs por estado semáforo
        migrations.AddIndex(
            model_name='kpiobjetivo',
            index=models.Index(
                fields=['objective', 'is_active'],
                name='idx_kpi_obj_active'
            ),
        ),

        # Índice para cambios por estado y prioridad
        migrations.AddIndex(
            model_name='gestioncambio',
            index=models.Index(
                fields=['status', 'priority', 'is_active'],
                name='idx_cambio_status_prio'
            ),
        ),

        # Índice para proyectos por origen
        migrations.AddIndex(
            model_name='proyecto',
            index=models.Index(
                fields=['tipo_origen', 'origen_cambio'],
                name='idx_proy_origen_cambio'
            ),
        ),
    ]
```

---

### B4: Modal "Convertir Cambio a Proyecto" (CRÍTICO)

**Estado actual:** Existe `crear_desde_cambio` en backend pero NO hay modal en frontend

#### Solución Frontend

**Nuevo archivo:** `frontend/src/features/gestion-estrategica/components/modals/ConvertirCambioProyectoModal.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/common/Button';
import { Input, Select, Textarea, DatePicker } from '@/components/forms';
import { AlertTriangle, Rocket, ArrowRight } from 'lucide-react';
import { proyectosApi } from '../../api/proyectosApi';
import { GestionCambio } from '../../types/gestion-cambio.types';
import { toast } from 'sonner';

// Schema de validación
const convertirCambioSchema = z.object({
  nombre: z.string().min(10, 'El nombre debe tener al menos 10 caracteres'),
  descripcion: z.string().optional(),
  tipo: z.enum(['mejora', 'implementacion', 'desarrollo', 'infraestructura', 'normativo', 'otro']),
  prioridad: z.enum(['alta', 'media', 'baja']),
  gerente_proyecto: z.number().optional(),
  fecha_inicio_plan: z.string().optional(),
  fecha_fin_plan: z.string().optional(),
  presupuesto_estimado: z.number().optional(),
  justificacion: z.string().optional(),
});

type ConvertirCambioFormData = z.infer<typeof convertirCambioSchema>;

interface ConvertirCambioProyectoModalProps {
  cambio: GestionCambio | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (proyectoId: number) => void;
}

// Mapeo automático de tipo de cambio a tipo de proyecto
const mapTipoCambioToProyecto = (tipoCambio: string): string => {
  const mapping: Record<string, string> = {
    'ESTRATEGICO': 'mejora',
    'TECNOLOGICO': 'desarrollo',
    'ORGANIZACIONAL': 'implementacion',
    'PROCESO': 'mejora',
    'NORMATIVO': 'normativo',
    'INFRAESTRUCTURA': 'infraestructura',
  };
  return mapping[tipoCambio] || 'otro';
};

// Mapeo de prioridad
const mapPrioridad = (priority: string): string => {
  if (['CRITICA', 'ALTA'].includes(priority)) return 'alta';
  if (priority === 'MEDIA') return 'media';
  return 'baja';
};

export const ConvertirCambioProyectoModal: React.FC<ConvertirCambioProyectoModalProps> = ({
  cambio,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [yaConvertido, setYaConvertido] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConvertirCambioFormData>({
    resolver: zodResolver(convertirCambioSchema),
  });

  // Pre-llenar formulario con datos del cambio
  useEffect(() => {
    if (cambio && isOpen) {
      // Verificar si ya tiene proyecto asociado
      if (cambio.proyecto_generado) {
        setYaConvertido(true);
      } else {
        setYaConvertido(false);
        reset({
          nombre: `Proyecto: ${cambio.title}`,
          descripcion: cambio.description || '',
          tipo: mapTipoCambioToProyecto(cambio.tipo_cambio_nombre || '') as any,
          prioridad: mapPrioridad(cambio.priority) as any,
          justificacion: `Originado desde cambio organizacional ${cambio.code}.\n\nAnálisis de impacto: ${cambio.impact_analysis || 'N/A'}\n\nPlan de acción: ${cambio.action_plan || 'N/A'}`,
        });
      }
    }
  }, [cambio, isOpen, reset]);

  // Mutation para crear proyecto
  const crearProyectoMutation = useMutation({
    mutationFn: (data: ConvertirCambioFormData) =>
      proyectosApi.crearDesdeCAMBIO(cambio!.id, data),
    onSuccess: (response) => {
      toast.success('Proyecto creado exitosamente', {
        description: `Código: ${response.codigo}`,
      });
      queryClient.invalidateQueries({ queryKey: ['gestion-cambio'] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      onSuccess?.(response.id);
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear el proyecto';
      toast.error('Error', { description: message });
    },
  });

  const onSubmit = (data: ConvertirCambioFormData) => {
    crearProyectoMutation.mutate(data);
  };

  if (!cambio) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Convertir Cambio en Proyecto</h2>
            <p className="text-sm text-muted-foreground">
              {cambio.code} - {cambio.title}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {yaConvertido ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Este cambio ya fue convertido en proyecto
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Código del proyecto: <strong>{cambio.proyecto_generado?.codigo}</strong>
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2 text-amber-700"
                  onClick={() => {
                    // Navegar al proyecto
                    window.location.href = `/gestion-estrategica/proyectos/${cambio.proyecto_generado?.id}`;
                  }}
                >
                  Ver proyecto <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form id="convertir-cambio-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información del cambio origen */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Datos del Cambio Origen</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Estado:</span>{' '}
                  <span className="font-medium">{cambio.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioridad:</span>{' '}
                  <span className="font-medium">{cambio.priority}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium">{cambio.tipo_cambio_nombre}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Objetivos vinculados:</span>{' '}
                  <span className="font-medium">{cambio.related_objectives?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Campos del proyecto */}
            <div className="space-y-4">
              <Input
                label="Nombre del Proyecto *"
                placeholder="Nombre descriptivo del proyecto"
                error={errors.nombre?.message}
                {...register('nombre')}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tipo de Proyecto *"
                  error={errors.tipo?.message}
                  {...register('tipo')}
                >
                  <option value="mejora">Mejora</option>
                  <option value="implementacion">Implementación</option>
                  <option value="desarrollo">Desarrollo</option>
                  <option value="infraestructura">Infraestructura</option>
                  <option value="normativo">Normativo</option>
                  <option value="otro">Otro</option>
                </Select>

                <Select
                  label="Prioridad *"
                  error={errors.prioridad?.message}
                  {...register('prioridad')}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Fecha Inicio Planificada"
                  {...register('fecha_inicio_plan')}
                />
                <Input
                  type="date"
                  label="Fecha Fin Planificada"
                  {...register('fecha_fin_plan')}
                />
              </div>

              <Input
                type="number"
                label="Presupuesto Estimado"
                placeholder="0.00"
                {...register('presupuesto_estimado', { valueAsNumber: true })}
              />

              <Textarea
                label="Justificación"
                placeholder="Razón de ser del proyecto..."
                rows={4}
                {...register('justificacion')}
              />
            </div>

            {/* Nota informativa */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <strong>Nota:</strong> Al convertir este cambio en proyecto:
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Se creará un nuevo proyecto con código automático (PRY-XXXX)</li>
                <li>El campo <code>origen_cambio</code> vinculará el proyecto al cambio</li>
                <li>Los objetivos relacionados al cambio se vincularán automáticamente</li>
                <li>El cambio mantendrá su estado actual (recomendado: PLANIFICADO o superior)</li>
              </ul>
            </div>
          </form>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        {!yaConvertido && (
          <Button
            type="submit"
            form="convertir-cambio-form"
            isLoading={isSubmitting || crearProyectoMutation.isPending}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Crear Proyecto
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ConvertirCambioProyectoModal;
```

**Actualizar API:** `frontend/src/features/gestion-estrategica/api/proyectosApi.ts`

```typescript
// Agregar método para crear proyecto desde cambio
export const proyectosApi = {
  // ... métodos existentes ...

  crearDesdeCambio: async (cambioId: number, data: any) => {
    const response = await axiosInstance.post(
      `/gestion-estrategica/proyectos/crear_desde_cambio/`,
      { cambio_id: cambioId, ...data }
    );
    return response.data;
  },
};
```

**Integrar en GestionCambioTab:**

```tsx
// En GestionCambioTab.tsx, agregar botón en cada tarjeta de cambio
import { ConvertirCambioProyectoModal } from './modals/ConvertirCambioProyectoModal';

// Dentro del componente:
const [cambioAConvertir, setCambioAConvertir] = useState<GestionCambio | null>(null);

// En el render de cada tarjeta:
{cambio.status === 'PLANIFICADO' && !cambio.proyecto_generado && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => setCambioAConvertir(cambio)}
  >
    <Rocket className="w-4 h-4 mr-1" />
    Convertir a Proyecto
  </Button>
)}

// Modal
<ConvertirCambioProyectoModal
  cambio={cambioAConvertir}
  isOpen={!!cambioAConvertir}
  onClose={() => setCambioAConvertir(null)}
/>
```

---

### B5: Validaciones de Integridad Referencial

**Archivo:** `backend/apps/gestion_estrategica/gestion_proyectos/models.py`

```python
from django.core.exceptions import ValidationError

class Proyecto(BaseCompanyModel):
    # ... campos existentes ...

    def clean(self):
        super().clean()

        # Validación 1: Si tipo_origen es CAMBIO, origen_cambio debe existir
        if self.tipo_origen == 'CAMBIO' and not self.origen_cambio:
            raise ValidationError({
                'origen_cambio': 'Debe especificar el cambio de origen cuando tipo_origen es CAMBIO.'
            })

        # Validación 2: Si tipo_origen es OBJETIVO, origen_objetivo debe existir
        if self.tipo_origen == 'OBJETIVO' and not self.origen_objetivo:
            raise ValidationError({
                'origen_objetivo': 'Debe especificar el objetivo de origen cuando tipo_origen es OBJETIVO.'
            })

        # Validación 3: No duplicar proyectos por cambio
        if self.origen_cambio:
            existing = Proyecto.objects.filter(
                origen_cambio=self.origen_cambio,
                is_active=True
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError({
                    'origen_cambio': f'Ya existe un proyecto activo para este cambio: {existing.first().codigo}'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
```

---

### B6: Dashboard de Trazabilidad (Mejora Futura)

**Descripción:** Vista que muestre el flujo completo Contexto → Proyecto

**Prioridad:** Baja (implementar después de cerrar B1-B5)

**Ubicación sugerida:** Nueva pestaña en PlaneacionPage o dashboard separado

```
┌─────────────────────────────────────────────────────────────────┐
│  TRAZABILIDAD ESTRATÉGICA                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AnalisisDOFA-001        EstrategiaTOWS-FO-001                 │
│  ┌─────────────┐    →    ┌─────────────────┐                   │
│  │ Fortaleza A │         │ Aprovechar F+O  │                   │
│  └─────────────┘         └────────┬────────┘                   │
│                                   ↓                             │
│                          ┌─────────────────┐                   │
│                          │ OE-FO-001       │                   │
│                          │ Objetivo BSC    │                   │
│                          └────────┬────────┘                   │
│                                   ↓                             │
│                 ┌─────────────────┴─────────────────┐          │
│                 ↓                                   ↓          │
│        ┌─────────────────┐               ┌─────────────────┐   │
│        │ KPI-001         │               │ GC-001          │   │
│        │ Semáforo: 🟢    │               │ Cambio Org.     │   │
│        └─────────────────┘               └────────┬────────┘   │
│                                                   ↓            │
│                                          ┌─────────────────┐   │
│                                          │ PRY-0001        │   │
│                                          │ Proyecto PMI    │   │
│                                          │ Avance: 45%     │   │
│                                          └─────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### B7: Sincronización Estados Cambio ↔ Proyecto

**Problema:** Cuando un cambio genera un proyecto, los estados no se sincronizan

**Solución:** Signals de Django para sincronización automática

**Archivo:** `backend/apps/gestion_estrategica/planeacion/signals.py`

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import GestionCambio
from apps.gestion_estrategica.gestion_proyectos.models import Proyecto

@receiver(post_save, sender=GestionCambio)
def sync_cambio_to_proyecto(sender, instance, **kwargs):
    """
    Sincroniza el estado del cambio con su proyecto asociado (si existe)
    """
    # Buscar proyecto originado de este cambio
    proyecto = Proyecto.objects.filter(
        origen_cambio=instance,
        is_active=True
    ).first()

    if not proyecto:
        return

    # Mapeo de estados Cambio → Proyecto
    status_mapping = {
        'EN_EJECUCION': 'EJECUCION',
        'COMPLETADO': 'COMPLETADO',
        'CANCELADO': 'CANCELADO',
    }

    new_status = status_mapping.get(instance.status)

    if new_status and proyecto.estado != new_status:
        # Solo actualizar si el proyecto está en un estado anterior
        allowed_transitions = {
            'PROPUESTO': ['INICIACION', 'CANCELADO'],
            'INICIACION': ['PLANIFICACION', 'CANCELADO'],
            'PLANIFICACION': ['EJECUCION', 'CANCELADO'],
            'EJECUCION': ['MONITOREO', 'COMPLETADO', 'CANCELADO'],
            'MONITOREO': ['CIERRE', 'COMPLETADO', 'CANCELADO'],
            'CIERRE': ['COMPLETADO', 'CANCELADO'],
        }

        if new_status in allowed_transitions.get(proyecto.estado, []):
            proyecto.estado = new_status
            proyecto.save(update_fields=['estado', 'updated_at'])


@receiver(post_save, sender=Proyecto)
def sync_proyecto_to_cambio(sender, instance, **kwargs):
    """
    Sincroniza el estado del proyecto de vuelta al cambio (bidireccional)
    """
    if not instance.origen_cambio:
        return

    cambio = instance.origen_cambio

    # Mapeo inverso Proyecto → Cambio
    status_mapping = {
        'COMPLETADO': 'COMPLETADO',
        'CANCELADO': 'CANCELADO',
    }

    new_status = status_mapping.get(instance.estado)

    if new_status and cambio.status != new_status:
        cambio.status = new_status
        cambio.save(update_fields=['status', 'updated_at'])
```

**Registrar signals en apps.py:**

```python
# backend/apps/gestion_estrategica/planeacion/apps.py
class PlaneacionConfig(AppConfig):
    name = 'apps.gestion_estrategica.planeacion'

    def ready(self):
        import apps.gestion_estrategica.planeacion.signals  # noqa
```

---

## 3. Cronograma de Implementación

| Fase | Brechas | Estimación | Dependencias |
|------|---------|------------|--------------|
| **Fase 1** | B1 (progress), B5 (validaciones) | 1 día | Ninguna |
| **Fase 2** | B4 (Modal Convertir) | 2 días | B1 |
| **Fase 3** | B7 (Sincronización estados) | 1 día | B4 |
| **Fase 4** | B2 (Ciclos), B3 (Índices) | 1 día | Ninguna |
| **Fase 5** | B6 (Dashboard trazabilidad) | 3 días | Todas las anteriores |

**Total estimado:** 8 días de desarrollo

---

## 4. Checklist de Implementación

### Fase 1: Modelo y Validaciones
- [ ] Agregar campo `progress` a GestionCambio
- [ ] Crear migración para `progress`
- [ ] Implementar `update_progress_from_status()`
- [ ] Agregar validaciones de integridad en Proyecto
- [ ] Actualizar tipos TypeScript

### Fase 2: Modal de Conversión
- [ ] Crear `ConvertirCambioProyectoModal.tsx`
- [ ] Agregar método `crearDesdeCambio` en API
- [ ] Integrar modal en `GestionCambioTab`
- [ ] Agregar botón condicionalmente (estado PLANIFICADO+)
- [ ] Manejar caso "ya convertido"

### Fase 3: Sincronización
- [ ] Crear archivo `signals.py`
- [ ] Implementar signal `sync_cambio_to_proyecto`
- [ ] Implementar signal `sync_proyecto_to_cambio`
- [ ] Registrar signals en `apps.py`
- [ ] Tests de sincronización

### Fase 4: Optimización
- [ ] Implementar validación de ciclos en `CausaEfecto`
- [ ] Crear migración de índices
- [ ] Ejecutar migraciones en staging

### Fase 5: Dashboard (Opcional)
- [ ] Diseñar UI de trazabilidad
- [ ] Implementar endpoint de trazabilidad
- [ ] Crear componente visual con flujo

---

## 5. Notas Importantes

### Reglas de Negocio Clave

1. **Un cambio solo puede generar UN proyecto** (validación única)
2. **La conversión debe hacerse en estado PLANIFICADO o posterior** (recomendado)
3. **Los objetivos vinculados al cambio se heredan al proyecto** (automático)
4. **El progreso del cambio se actualiza con las transiciones de estado** (automático)
5. **Estados terminales (COMPLETADO/CANCELADO) se sincronizan bidireccionalmente**

### Impacto en ISO 9001:2015

Esta estructura soporta:
- **Cláusula 6.1**: Acciones para abordar riesgos y oportunidades (Cambios → Proyectos)
- **Cláusula 6.2**: Objetivos de calidad y planificación (Objetivos BSC)
- **Cláusula 6.3**: Planificación de los cambios (GestionCambio workflow)
- **Cláusula 9.1**: Seguimiento, medición, análisis y evaluación (KPIs)

---

## 6. Archivos a Crear/Modificar

### Backend
| Archivo | Acción |
|---------|--------|
| `planeacion/models.py` | Modificar (progress, ciclos) |
| `planeacion/migrations/XXXX_*.py` | Crear (3 migraciones) |
| `planeacion/signals.py` | Crear |
| `planeacion/apps.py` | Modificar |
| `gestion_proyectos/models.py` | Modificar (validaciones) |

### Frontend
| Archivo | Acción |
|---------|--------|
| `types/gestion-cambio.types.ts` | Modificar |
| `api/proyectosApi.ts` | Modificar |
| `components/modals/ConvertirCambioProyectoModal.tsx` | Crear |
| `components/modals/index.ts` | Modificar (export) |
| `components/GestionCambioTab.tsx` | Modificar |

---

**Documento creado por:** Claude Code
**Versión:** 1.0
**Fecha:** 2026-01-25
