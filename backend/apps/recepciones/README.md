# Módulo de Recepciones de Materia Prima

## Descripción General

Módulo que gestiona el proceso de recepción de Aceite Comestible Usado (ACU) en la planta de Grasas y Huesos del Norte. Implementa un sistema robusto de **prorrateo de merma** que distribuye de manera proporcional las diferencias entre el peso esperado (suma de recolecciones) y el peso real (medido en báscula).

## Características Principales

- **Prorrateo Automático de Merma**: Distribución proporcional al peso esperado de cada recolección
- **Trazabilidad Completa**: Desde ecoaliado → recolección → recepción → lote → tanque
- **Validaciones Robustas**: Control de estados, pesos, duplicados y consistencia
- **Transacciones Atómicas**: Garantía de integridad de datos
- **Soft Delete**: No elimina datos físicamente, mantiene historial
- **Auditoría Completa**: Registro de todos los cambios

## Modelos

### 1. RecepcionMateriaPrima
Representa el lote de recepción principal que agrupa múltiples recolecciones.

**Estados:**
- `INICIADA`: Recepción creada, esperando pesaje
- `PESADA`: Peso en báscula registrado, merma calculada
- `CONFIRMADA`: Prorrateo aplicado, recolecciones actualizadas
- `CANCELADA`: Recepción cancelada por error

**Campos clave:**
- `codigo_recepcion`: Código único (RMP-YYYYMMDD-XXXX)
- `peso_esperado_kg`: Suma de recolecciones
- `peso_real_kg`: Peso en báscula
- `merma_kg`: Diferencia entre esperado y real
- `porcentaje_merma`: (merma / esperado) × 100

### 2. RecepcionDetalle
Vincula cada recolección individual con la recepción y almacena los datos antes y después del prorrateo.

**Datos almacenados:**
- **Esperados**: Peso, precio y valor originales de la recolección
- **Reales**: Peso, precio y valor después del prorrateo
- **Cálculos**: Merma prorrateada, porcentaje, proporción del lote

## Algoritmo de Prorrateo

```python
# 1. Calcular factor de merma
factor_merma = peso_real_total / peso_esperado_total

# 2. Para cada recolección
peso_real = peso_esperado × factor_merma
merma = peso_esperado - peso_real
porcentaje_merma = (merma / peso_esperado) × 100
precio_real_kg = valor_esperado / peso_real
valor_real = valor_esperado  # Se mantiene
```

## Estructura de Archivos

```
backend/apps/recepciones/
├── __init__.py          # Configuración de la app
├── apps.py              # Config Django
├── models.py            # ⭐ Modelos principales
├── admin.py             # Administración Django
├── tests.py             # Tests unitarios
├── README.md            # Este archivo
│
└── migrations/
    └── (generadas automáticamente)
```

## Instalación

### 1. Agregar a INSTALLED_APPS

```python
# backend/config/settings.py

INSTALLED_APPS = [
    # ... otras apps
    'apps.recepciones',
    # ... más apps
]
```

### 2. Crear Migraciones

```bash
cd backend
python manage.py makemigrations recepciones
python manage.py migrate recepciones
```

### 3. Crear Superusuario (si no existe)

```bash
python manage.py createsuperuser
```

### 4. Registrar en Admin

Ya está configurado en `admin.py` - accede a:
- http://localhost:8000/admin/recepciones/recepcionmateriapirma/
- http://localhost:8000/admin/recepciones/recepciondetalle/

## Uso Básico

### Crear Recepción

```python
from apps.recepciones.models import RecepcionMateriaPrima, RecepcionDetalle
from apps.recolecciones.models import Recoleccion
from django.utils import timezone

# 1. Crear recepción
recepcion = RecepcionMateriaPrima.objects.create(
    recolector=recolector_user,
    recibido_por=operario_user,
    fecha_recepcion=timezone.now(),
    created_by=operario_user
)

# 2. Asociar recolecciones
for recoleccion in recolecciones_pendientes:
    RecepcionDetalle.objects.create(
        recepcion=recepcion,
        recoleccion=recoleccion
    )

# 3. Registrar pesaje
recepcion.registrar_pesaje(
    peso_bascula=Decimal('144.00'),
    numero_ticket='TICK-001'
)

# 4. Confirmar (aplica prorrateo automáticamente)
recepcion.confirmar_recepcion()
```

### Consultas Comunes

```python
# Recepciones del día
hoy = timezone.now().date()
recepciones_hoy = RecepcionMateriaPrima.objects.filter(
    fecha_recepcion__date=hoy,
    deleted_at__isnull=True
)

# Recepciones pendientes de confirmar
pendientes = RecepcionMateriaPrima.objects.filter(
    estado='PESADA',
    deleted_at__isnull=True
)

# Estadísticas de merma
from django.db.models import Avg, Sum
stats = RecepcionMateriaPrima.objects.filter(
    estado='CONFIRMADA'
).aggregate(
    merma_promedio=Avg('porcentaje_merma'),
    merma_total=Sum('merma_kg')
)
```

## Tests

Ejecutar tests:

```bash
cd backend
python manage.py test apps.recepciones
```

Los tests verifican:
- Generación de códigos únicos
- Cálculo de pesos y mermas
- Prorrateo correcto
- Consistencia de datos
- Validaciones de estado
- Prevención de duplicados

## Documentación Adicional

### Documentación Completa
- **`docs/RECEPCIONES-MODELS.md`**: Documentación técnica detallada
- **`docs/RECEPCIONES-SUMMARY.md`**: Resumen ejecutivo
- **`docs/RECEPCIONES-DIAGRAMS.md`**: Diagramas de flujo y ERD
- **`docs/RECEPCIONES-EXAMPLES.md`**: Ejemplos de uso en Python

### Patrones de Diseño
- **Repository Pattern**: Métodos en modelos para lógica de negocio
- **State Pattern**: Estados bien definidos con transiciones validadas
- **Transaction Script**: Operaciones atómicas con rollback
- **Soft Delete**: No eliminación física de datos

## API (Próximos Pasos)

Endpoints a implementar:

```
POST   /api/recepciones/                    # Crear recepción
GET    /api/recepciones/                    # Listar recepciones
GET    /api/recepciones/{id}/               # Detalle de recepción
POST   /api/recepciones/{id}/agregar_recolecciones/  # Asociar recolecciones
POST   /api/recepciones/{id}/registrar_pesaje/       # Registrar pesaje
POST   /api/recepciones/{id}/confirmar/              # Confirmar recepción
POST   /api/recepciones/{id}/cancelar/               # Cancelar recepción
GET    /api/recepciones/{id}/detalles/               # Detalles con prorrateo
```

## Integración con Otros Módulos

```
Ecoaliados → Programaciones → Recolecciones → RECEPCIONES → Lotes → Tanques
                                                    ↓
                                             Liquidaciones
```

## Métricas y KPIs

- Merma promedio por período
- Merma por recolector
- Recepciones por día
- Peso procesado total
- Tasa de cancelación
- Tiempo promedio de recepción

## Consideraciones Técnicas

### Precisión
- Uso de `DecimalField` para evitar errores de redondeo
- Redondeo con `ROUND_HALF_UP` estándar contable
- Validación de consistencia post-prorrateo

### Performance
- Índices en campos de búsqueda frecuente
- `select_related()` y `prefetch_related()` en consultas
- Cálculos en base de datos cuando es posible

### Seguridad
- Validación de permisos por rol
- Transacciones atómicas
- Soft delete para auditoría
- Registro completo de cambios

## Contribuir

Para modificar o extender este módulo:

1. Leer documentación completa en `docs/RECEPCIONES-MODELS.md`
2. Revisar tests existentes en `tests.py`
3. Crear tests para nuevas funcionalidades
4. Actualizar documentación

## Soporte

Para consultas técnicas:
- Revisar documentación en `docs/`
- Revisar código fuente en `models.py`
- Ejecutar tests para entender comportamiento

---

**Versión:** 1.0.0
**Fecha:** 2024-12-04
**Autor:** Sistema de Gestión Integral - Grasas y Huesos del Norte
