# Documentación: Modelos del Módulo de Recepciones

## Índice
1. [Contexto del Negocio](#contexto-del-negocio)
2. [Diagrama de Flujo](#diagrama-de-flujo)
3. [Modelo RecepcionMateriaPrima](#modelo-recepcionmateriapirma)
4. [Modelo RecepcionDetalle](#modelo-recepciondetalle)
5. [Algoritmo de Prorrateo de Merma](#algoritmo-de-prorrateo-de-merma)
6. [Casos de Uso](#casos-de-uso)
7. [Validaciones Implementadas](#validaciones-implementadas)
8. [Índices y Optimizaciones](#índices-y-optimizaciones)

---

## Contexto del Negocio

### Proceso de Recepción de ACU

El módulo de **Recepciones** gestiona el proceso de recepción de Aceite Comestible Usado (ACU) en la planta de Grasas y Huesos del Norte.

**Flujo operativo:**

1. Un **recolector** sale a la ruta y realiza múltiples recolecciones de ACU de diferentes ecoaliados
2. En cada recolección, se registra:
   - Cantidad en kg (pesada en el momento)
   - Precio por kg acordado con el ecoaliado
   - Valor total pagado al ecoaliado
3. El recolector regresa a la planta con todo el material recolectado
4. En la planta, se **pesa todo el lote** en báscula (peso real)
5. Se compara con el **peso esperado** (suma de todas las recolecciones)
6. La diferencia es la **MERMA**
7. La merma se **prorratean de manera ponderada** entre todas las recolecciones del lote
8. El precio real por kg se ajusta según la merma prorrateada
9. Las recolecciones quedan marcadas como **RECIBIDAS**
10. El producto pasa al tanque de almacenamiento de ACU

### ¿Por qué existe merma?

La merma es la diferencia entre el peso esperado y el peso real en báscula. Ocurre por:

- **Evaporación** durante el transporte
- **Residuos** que quedan en los envases
- **Derrames** menores durante el transporte
- **Errores de pesaje** en las recolecciones
- **Impurezas** (agua, sedimentos) que se detectan en el pesaje final

**Nota importante:** La merma es normal y esperada en este tipo de operación. Un rango típico es entre 2% y 5%.

---

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    RECOLECCIONES DEL DÍA                     │
├─────────────────────────────────────────────────────────────┤
│ Recolección 1: ECO-0001 → 50 kg × $2,000/kg = $100,000     │
│ Recolección 2: ECO-0003 → 30 kg × $2,100/kg = $63,000      │
│ Recolección 3: ECO-0005 → 70 kg × $2,000/kg = $140,000     │
├─────────────────────────────────────────────────────────────┤
│ PESO ESPERADO TOTAL: 150 kg                                  │
│ VALOR ESPERADO TOTAL: $303,000                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LLEGADA A PLANTA Y PESAJE                       │
├─────────────────────────────────────────────────────────────┤
│ Estado: INICIADA                                             │
│ → Se crea RecepcionMateriaPrima                             │
│ → Se asocian las 3 recolecciones (RecepcionDetalle)        │
│                                                              │
│ Estado: PESADA                                               │
│ → Peso en báscula: 144 kg                                   │
│ → Merma: 150 kg - 144 kg = 6 kg                            │
│ → Porcentaje de merma: (6/150) × 100 = 4.00%               │
│ → Factor de merma: 144/150 = 0.96                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PRORRATEO DE MERMA (factor: 0.96)              │
├─────────────────────────────────────────────────────────────┤
│ Recolección 1: ECO-0001                                      │
│   • Peso esperado: 50 kg                                     │
│   • Proporción: 50/150 = 33.33%                             │
│   • Peso real: 50 × 0.96 = 48 kg                           │
│   • Merma: 50 - 48 = 2 kg                                   │
│   • Precio real/kg: $100,000 / 48 = $2,083.33/kg           │
│   • Valor real: $100,000 (se mantiene)                      │
│                                                              │
│ Recolección 2: ECO-0003                                      │
│   • Peso esperado: 30 kg                                     │
│   • Proporción: 30/150 = 20.00%                             │
│   • Peso real: 30 × 0.96 = 28.8 kg                         │
│   • Merma: 30 - 28.8 = 1.2 kg                               │
│   • Precio real/kg: $63,000 / 28.8 = $2,187.50/kg          │
│   • Valor real: $63,000 (se mantiene)                       │
│                                                              │
│ Recolección 3: ECO-0005                                      │
│   • Peso esperado: 70 kg                                     │
│   • Proporción: 70/150 = 46.67%                             │
│   • Peso real: 70 × 0.96 = 67.2 kg                         │
│   • Merma: 70 - 67.2 = 2.8 kg                               │
│   • Precio real/kg: $140,000 / 67.2 = $2,083.33/kg         │
│   • Valor real: $140,000 (se mantiene)                      │
├─────────────────────────────────────────────────────────────┤
│ TOTAL PESO REAL: 144 kg ✓                                   │
│ TOTAL VALOR REAL: $303,000 ✓                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONFIRMACIÓN                               │
├─────────────────────────────────────────────────────────────┤
│ Estado: CONFIRMADA                                           │
│ → Recolecciones marcadas como "RECIBIDAS"                   │
│ → Producto va al tanque de ACU                              │
│ → Lote registrado para trazabilidad                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Modelo RecepcionMateriaPrima

### Descripción
Representa el **lote de recepción** completo. Agrupa múltiples recolecciones de un recolector y gestiona el proceso de pesaje y cálculo de merma.

### Campos Principales

#### Identificación
```python
codigo_recepcion: CharField (max_length=30, unique=True)
# Formato: RMP-YYYYMMDD-XXXX
# Ejemplo: RMP-20241204-0001
```

#### Relaciones
```python
recolector: ForeignKey(User)
# Usuario que entrega el material (debe ser recolector_econorte)

recibido_por: ForeignKey(User)
# Usuario que recibe en planta (líder logística, operario)
```

#### Fechas
```python
fecha_recepcion: DateTimeField
# Fecha y hora de inicio de la recepción

fecha_pesaje: DateTimeField (null=True)
# Fecha y hora del pesaje en báscula

fecha_confirmacion: DateTimeField (null=True)
# Fecha y hora de confirmación de la recepción
```

#### Pesos y Cálculos
```python
peso_esperado_kg: DecimalField (max_digits=10, decimal_places=2)
# Suma de todas las recolecciones incluidas
# Calculado automáticamente

peso_real_kg: DecimalField (max_digits=10, decimal_places=2, null=True)
# Peso medido en báscula de la planta
# Ingresado por el usuario

merma_kg: DecimalField (max_digits=10, decimal_places=2, default=0)
# Diferencia: peso_esperado - peso_real
# Calculado automáticamente

porcentaje_merma: DecimalField (max_digits=5, decimal_places=2, default=0)
# (merma / peso_esperado) × 100
# Calculado automáticamente
```

#### Valores Monetarios
```python
valor_esperado_total: DecimalField (max_digits=12, decimal_places=2)
# Suma de valores de todas las recolecciones

valor_real_total: DecimalField (max_digits=12, decimal_places=2, null=True)
# Valor después de aplicar merma (normalmente igual al esperado)
```

#### Estados
```python
estado: CharField (choices=ESTADO_CHOICES, default='INICIADA')
# INICIADA    → Recepción creada, en proceso de pesaje
# PESADA      → Peso en báscula registrado, merma calculada
# CONFIRMADA  → Recepción confirmada, recolecciones actualizadas
# CANCELADA   → Recepción cancelada (error en proceso)
```

### Propiedades del Modelo

```python
@property
def puede_pesar(self) -> bool:
    """Verifica si se puede registrar el peso en báscula"""
    return self.estado == 'INICIADA' and not self.is_deleted

@property
def puede_confirmar(self) -> bool:
    """Verifica si se puede confirmar la recepción"""
    return self.estado == 'PESADA' and not self.is_deleted

@property
def puede_cancelar(self) -> bool:
    """Verifica si se puede cancelar la recepción"""
    return self.estado in ['INICIADA', 'PESADA'] and not self.is_deleted
```

### Métodos Principales

#### 1. `generar_codigo_recepcion()`
```python
@classmethod
def generar_codigo_recepcion(cls) -> str:
    """
    Genera código único de recepción
    Formato: RMP-YYYYMMDD-XXXX
    Ejemplo: RMP-20241204-0001
    """
```

#### 2. `calcular_merma()`
```python
def calcular_merma(self) -> tuple[Decimal, Decimal]:
    """
    Calcula merma total del lote

    Returns:
        (merma_kg, porcentaje_merma)
    """
```

#### 3. `registrar_pesaje()`
```python
def registrar_pesaje(
    self,
    peso_bascula: Decimal,
    numero_ticket: str = None,
    observaciones: str = None
) -> bool:
    """
    Registra peso en báscula y calcula merma
    Cambia estado a PESADA
    """
```

#### 4. `confirmar_recepcion()`
```python
@transaction.atomic
def confirmar_recepcion(self) -> bool:
    """
    Confirma recepción y aplica prorrateo de merma

    Acciones:
    1. Prorratear merma entre recolecciones
    2. Actualizar detalles de recepción
    3. Cambiar estado a CONFIRMADA
    4. Calcular valor real total
    """
```

#### 5. `cancelar()`
```python
def cancelar(self, usuario: User, motivo: str) -> bool:
    """
    Cancela la recepción
    Cambia estado a CANCELADA
    """
```

---

## Modelo RecepcionDetalle

### Descripción
Representa cada **recolección individual** incluida en la recepción. Almacena los datos originales y los datos ajustados después del prorrateo de merma.

### Campos Principales

#### Relaciones
```python
recepcion: ForeignKey(RecepcionMateriaPrima, related_name='detalles')
# Recepción a la que pertenece

recoleccion: OneToOneField(Recoleccion, related_name='detalle_recepcion')
# Recolección incluida (relación 1:1)
```

#### Datos Esperados (Originales)
```python
peso_esperado_kg: DecimalField
# Peso original de la recolección

precio_esperado_kg: DecimalField
# Precio por kg registrado en la recolección

valor_esperado: DecimalField
# Valor total original (cantidad × precio)
```

#### Datos Reales (Después de Merma)
```python
peso_real_kg: DecimalField (null=True)
# Peso después de aplicar prorrateo de merma

merma_kg: DecimalField (default=0)
# Merma prorrateada para esta recolección

porcentaje_merma: DecimalField (default=0)
# Porcentaje de merma (igual para todas las recolecciones del lote)

precio_real_kg: DecimalField (null=True)
# Precio ajustado: valor_esperado / peso_real

valor_real: DecimalField (null=True)
# Valor después de ajustar por merma (normalmente igual al esperado)
```

#### Proporción en el Lote
```python
proporcion_lote: DecimalField (max_digits=5, decimal_places=4)
# Porcentaje que representa del total
# Cálculo: peso_esperado / peso_esperado_total
```

### Propiedades del Modelo

```python
@property
def tiene_merma_aplicada(self) -> bool:
    """Verifica si ya se aplicó la merma"""
    return self.peso_real_kg is not None

@property
def diferencia_valor(self) -> Decimal:
    """Calcula diferencia en valor por la merma"""
    return self.valor_esperado - self.valor_real if self.valor_real else Decimal('0.00')
```

### Métodos Principales

#### 1. `calcular_proporcion_lote()`
```python
def calcular_proporcion_lote(self) -> Decimal:
    """
    Calcula qué porcentaje representa esta recolección del lote

    Returns:
        Proporción (0.0000 a 1.0000)
    """
```

#### 2. `aplicar_merma()`
```python
def aplicar_merma(self, factor_merma: Decimal):
    """
    Aplica prorrateo de merma a esta recolección

    Args:
        factor_merma: peso_real_total / peso_esperado_total

    Cálculos:
    - Peso real = Peso esperado × Factor merma
    - Merma = Peso esperado - Peso real
    - % Merma = (Merma / Peso esperado) × 100
    - Precio real/kg = Valor esperado / Peso real
    - Valor real = Valor esperado (se mantiene)
    """
```

---

## Algoritmo de Prorrateo de Merma

### Concepto Clave

**El prorrateo es proporcional al peso esperado de cada recolección.**

Si una recolección representa el 40% del peso total esperado, recibirá el 40% de la merma total.

### Fórmulas

#### 1. Factor de Merma
```
Factor de Merma = Peso Real Total / Peso Esperado Total
```

**Ejemplo:**
- Peso esperado total: 150 kg
- Peso real total (báscula): 144 kg
- Factor de merma: 144 / 150 = 0.96

#### 2. Peso Real de Cada Recolección
```
Peso Real = Peso Esperado × Factor de Merma
```

**Ejemplo (Recolección 1):**
- Peso esperado: 50 kg
- Factor de merma: 0.96
- Peso real: 50 × 0.96 = 48 kg

#### 3. Merma de Cada Recolección
```
Merma = Peso Esperado - Peso Real
```

**Ejemplo (Recolección 1):**
- Peso esperado: 50 kg
- Peso real: 48 kg
- Merma: 50 - 48 = 2 kg

#### 4. Porcentaje de Merma
```
% Merma = (Merma / Peso Esperado) × 100
```

**Ejemplo (Recolección 1):**
- Merma: 2 kg
- Peso esperado: 50 kg
- % Merma: (2 / 50) × 100 = 4.00%

#### 5. Precio Real por Kg
```
Precio Real/kg = Valor Esperado / Peso Real
```

**Ejemplo (Recolección 1):**
- Valor esperado: $100,000
- Peso real: 48 kg
- Precio real/kg: $100,000 / 48 = $2,083.33/kg

#### 6. Valor Real
```
Valor Real = Valor Esperado (se mantiene igual)
```

**Justificación:** El ecoaliado ya recibió el pago. La merma es pérdida de la empresa.

### Implementación en Código

```python
def _prorratear_merma(self):
    """Prorrateo ponderado de merma"""

    # Calcular factor de merma
    factor_merma = self.peso_real_kg / self.peso_esperado_kg

    # Aplicar a cada detalle
    for detalle in self.detalles.all():
        # Peso real = Peso esperado × Factor
        detalle.peso_real_kg = detalle.peso_esperado_kg * factor_merma

        # Merma = Diferencia
        detalle.merma_kg = detalle.peso_esperado_kg - detalle.peso_real_kg

        # % Merma
        detalle.porcentaje_merma = (
            detalle.merma_kg / detalle.peso_esperado_kg
        ) * 100

        # Precio real/kg = Valor / Peso real
        detalle.precio_real_kg = detalle.valor_esperado / detalle.peso_real_kg

        # Valor real = Valor esperado (se mantiene)
        detalle.valor_real = detalle.valor_esperado

        detalle.save()
```

### Verificación de Consistencia

Después del prorrateo, se debe cumplir:

```python
# Suma de pesos reales = Peso real total
sum(detalle.peso_real_kg for detalle in detalles) == recepcion.peso_real_kg

# Suma de mermas = Merma total
sum(detalle.merma_kg for detalle in detalles) == recepcion.merma_kg

# Suma de valores reales = Valor esperado total
sum(detalle.valor_real for detalle in detalles) == recepcion.valor_esperado_total
```

---

## Casos de Uso

### Caso de Uso 1: Recepción Normal con Merma Estándar

**Escenario:**
- Recolector llega con 3 recolecciones
- Merma del 4% (dentro del rango normal)

**Pasos:**

1. **Crear Recepción (Estado: INICIADA)**
```python
recepcion = RecepcionMateriaPrima.objects.create(
    recolector=recolector_user,
    recibido_por=operario_user,
    fecha_recepcion=timezone.now(),
    estado='INICIADA'
)
```

2. **Asociar Recolecciones**
```python
for recoleccion in recolecciones:
    RecepcionDetalle.objects.create(
        recepcion=recepcion,
        recoleccion=recoleccion,
        peso_esperado_kg=recoleccion.cantidad_kg,
        precio_esperado_kg=recoleccion.precio_kg,
        valor_esperado=recoleccion.valor_total
    )
```

3. **Registrar Pesaje (Estado: PESADA)**
```python
recepcion.registrar_pesaje(
    peso_bascula=Decimal('144.00'),
    numero_ticket='TICK-20241204-001',
    observaciones='Pesaje normal'
)
```

4. **Confirmar Recepción (Estado: CONFIRMADA)**
```python
recepcion.confirmar_recepcion()
# Automáticamente prorratean la merma
```

### Caso de Uso 2: Recepción con Merma Alta

**Escenario:**
- Merma del 8% (superior al estándar)
- Se requiere justificación

**Pasos:**

1-3. *(Igual que Caso 1)*

4. **Registrar Pesaje con Observaciones**
```python
recepcion.registrar_pesaje(
    peso_bascula=Decimal('138.00'),  # Merma alta
    numero_ticket='TICK-20241204-002',
    observaciones='Merma superior al estándar. Causa: Envases con residuos significativos.'
)
```

5. **Revisar y Confirmar**
```python
# El líder de logística revisa
if recepcion.porcentaje_merma > 5:
    # Enviar alerta o requerir aprobación
    pass

recepcion.confirmar_recepcion()
```

### Caso de Uso 3: Cancelación de Recepción

**Escenario:**
- Error en el proceso (ej: báscula averiada)

**Pasos:**

```python
recepcion.cancelar(
    usuario=operario_user,
    motivo='Báscula averiada durante el pesaje. Se debe repesar mañana.'
)
```

---

## Validaciones Implementadas

### RecepcionMateriaPrima

#### 1. Validación de Recolector
```python
if not recolector.cargo or recolector.cargo.code != 'recolector_econorte':
    raise ValidationError('El usuario debe tener cargo de Recolector Econorte')
```

#### 2. Validación de Peso Real
```python
margen_aceptable = Decimal('0.10')  # 10%
if peso_real > peso_esperado * (1 + margen_aceptable):
    raise ValidationError('El peso real no puede exceder el esperado en más de 10%')
```

#### 3. Validación de Estado
```python
if not self.puede_pesar:
    raise ValidationError('La recepción no puede ser pesada en su estado actual')
```

### RecepcionDetalle

#### 1. Validación de Duplicados
```python
if RecepcionDetalle.objects.filter(
    recoleccion=self.recoleccion
).exclude(recepcion__estado='CANCELADA').exists():
    raise ValidationError('Esta recolección ya está incluida en otra recepción activa')
```

#### 2. Validación de Coincidencia de Datos
```python
if self.peso_esperado_kg != self.recoleccion.cantidad_kg:
    raise ValidationError('El peso esperado debe coincidir con la cantidad de la recolección')
```

#### 3. Validación de Factor de Merma
```python
if factor_merma <= 0 or factor_merma > 1:
    raise ValidationError('El factor de merma debe estar entre 0 y 1')
```

---

## Índices y Optimizaciones

### Índices de Base de Datos

#### RecepcionMateriaPrima
```python
indexes = [
    models.Index(fields=['codigo_recepcion']),           # Búsqueda por código
    models.Index(fields=['recolector', 'fecha_recepcion']),  # Historial por recolector
    models.Index(fields=['recibido_por', 'fecha_recepcion']),  # Historial por operario
    models.Index(fields=['estado', 'fecha_recepcion']),  # Filtrado por estado
    models.Index(fields=['deleted_at']),                 # Soft delete
]
```

#### RecepcionDetalle
```python
indexes = [
    models.Index(fields=['recepcion', 'recoleccion']),  # Relación principal
    models.Index(fields=['recoleccion']),               # Búsqueda por recolección
]
```

### Optimizaciones de Consultas

#### Select Related
```python
# Admin
recepcion_qs = RecepcionMateriaPrima.objects.select_related(
    'recolector',
    'recibido_por',
    'created_by',
    'cancelado_por'
)

# Detalles
detalle_qs = RecepcionDetalle.objects.select_related(
    'recepcion',
    'recoleccion',
    'recoleccion__ecoaliado'
)
```

#### Prefetch Related
```python
recepcion = RecepcionMateriaPrima.objects.prefetch_related(
    'detalles',
    'detalles__recoleccion',
    'detalles__recoleccion__ecoaliado'
).get(pk=recepcion_id)
```

---

## Consideraciones Adicionales

### 1. Transacciones Atómicas

El método `confirmar_recepcion()` usa `@transaction.atomic` para garantizar:
- Todos los detalles se actualizan correctamente
- Si falla algún detalle, se revierte todo
- Consistencia de datos garantizada

### 2. Precisión Decimal

Todos los campos monetarios y de peso usan `DecimalField` para:
- Evitar errores de redondeo
- Mantener precisión en cálculos
- Cumplir con estándares contables

### 3. Soft Delete

Ambos modelos implementan soft delete:
- No se eliminan datos físicamente
- Se mantiene historial completo
- Permite auditoría y trazabilidad

### 4. Auditoría

Campos de auditoría en todos los modelos:
- `created_by`: Usuario que creó
- `created_at`: Fecha de creación
- `updated_at`: Última actualización
- `deleted_at`: Fecha de eliminación lógica

### 5. Trazabilidad

El sistema mantiene trazabilidad completa:
- Desde ecoaliado → recolección → recepción → lote → tanque
- Permite rastrear cualquier kg de ACU hasta su origen
- Facilita auditorías y certificaciones

---

## Próximos Pasos

Para completar el módulo:

1. **Serializers** (DRF)
   - `RecepcionMateriaPrimaSerializer`
   - `RecepcionDetalleSerializer`
   - `RecepcionCreateSerializer`
   - `RecepcionPesajeSerializer`

2. **ViewSets** (API)
   - `RecepcionMateriaPrimaViewSet`
   - Endpoints personalizados:
     - `POST /recepciones/{id}/registrar_pesaje/`
     - `POST /recepciones/{id}/confirmar/`
     - `POST /recepciones/{id}/cancelar/`

3. **Frontend** (React)
   - Vista de recepción en curso
   - Formulario de pesaje
   - Tabla de detalles con merma
   - Confirmación de recepción

4. **Reportes**
   - Reporte de mermas por período
   - Análisis de merma por recolector
   - Dashboard de recepciones del día

5. **Integraciones**
   - Con módulo de Lotes
   - Con módulo de Liquidaciones
   - Con sistema de Tanques

---

**Fecha de creación:** 2024-12-04
**Autor:** Sistema de Gestión Grasas y Huesos del Norte
**Versión:** 1.0
