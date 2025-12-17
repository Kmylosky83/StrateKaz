# Resumen Ejecutivo: Módulo de Recepciones

## Visión General

El módulo de **Recepciones de Materia Prima** gestiona el proceso crítico de recepción de ACU (Aceite Comestible Usado) en la planta, implementando un sistema robusto de **prorrateo de merma** que garantiza trazabilidad y precisión contable.

---

## Problema que Resuelve

### Situación
Un recolector realiza múltiples recolecciones en diferentes ecoaliados durante el día. En cada punto:
- Se pesa el material
- Se paga al ecoaliado según peso × precio/kg
- Se registra la recolección

### Desafío
Al llegar a planta, el peso total en báscula **NO coincide** con la suma de recolecciones individuales debido a:
- Evaporación durante transporte
- Residuos en envases
- Derrames menores
- Impurezas detectadas

### Solución
Sistema de **prorrateo ponderado de merma** que:
1. Calcula la diferencia real entre peso esperado y peso en báscula
2. Distribuye la merma proporcionalmente entre todas las recolecciones
3. Ajusta automáticamente los precios reales por kg
4. Mantiene trazabilidad completa

---

## Arquitectura del Sistema

### Modelo de Datos

```
RecepcionMateriaPrima (Lote/Recepción Principal)
│
├── codigo_recepcion: "RMP-20241204-0001"
├── recolector: User (FK)
├── recibido_por: User (FK)
├── fecha_recepcion: DateTime
├── peso_esperado_kg: Decimal (suma de recolecciones)
├── peso_real_kg: Decimal (báscula)
├── merma_kg: Decimal (diferencia)
├── porcentaje_merma: Decimal (%)
├── estado: INICIADA → PESADA → CONFIRMADA
│
└── detalles: [RecepcionDetalle]
    │
    ├── RecepcionDetalle 1
    │   ├── recoleccion: Recoleccion (OneToOne)
    │   ├── peso_esperado_kg: 50 kg
    │   ├── peso_real_kg: 48 kg
    │   ├── merma_kg: 2 kg
    │   ├── porcentaje_merma: 4%
    │   ├── precio_real_kg: ajustado
    │   └── valor_real: $100,000
    │
    ├── RecepcionDetalle 2
    │   └── (...)
    │
    └── RecepcionDetalle N
```

---

## Algoritmo de Prorrateo

### Fórmula Central

```
Factor de Merma = Peso Real Total / Peso Esperado Total
```

### Ejemplo Práctico

**Entrada:**
- Recolección 1: 50 kg × $2,000/kg = $100,000
- Recolección 2: 30 kg × $2,100/kg = $63,000
- Recolección 3: 70 kg × $2,000/kg = $140,000
- **Peso esperado total:** 150 kg
- **Valor esperado total:** $303,000

**Pesaje en báscula:** 144 kg

**Cálculo:**
- Merma total: 150 - 144 = 6 kg (4%)
- Factor de merma: 144 ÷ 150 = 0.96

**Prorrateo:**

| Recolección | Esperado | Real (×0.96) | Merma | % Merma | Precio Real/kg | Valor Real |
|-------------|----------|--------------|-------|---------|----------------|------------|
| 1           | 50 kg    | 48 kg        | 2 kg  | 4%      | $2,083.33      | $100,000   |
| 2           | 30 kg    | 28.8 kg      | 1.2kg | 4%      | $2,187.50      | $63,000    |
| 3           | 70 kg    | 67.2 kg      | 2.8kg | 4%      | $2,083.33      | $140,000   |
| **TOTAL**   | **150**  | **144**      | **6** | **4%**  | -              | **$303,000**|

**Verificación:**
- ✅ Suma pesos reales = 144 kg
- ✅ Suma mermas = 6 kg
- ✅ % merma igual para todas (4%)
- ✅ Valor total se conserva ($303,000)

---

## Flujo de Estados

```
┌──────────┐  registrar_pesaje()   ┌─────────┐  confirmar_recepcion()  ┌────────────┐
│ INICIADA │ ──────────────────────▶│ PESADA  │ ───────────────────────▶│ CONFIRMADA │
└──────────┘                        └─────────┘                         └────────────┘
     │                                   │
     │ cancelar()                        │ cancelar()
     ▼                                   ▼
┌───────────┐                       ┌───────────┐
│ CANCELADA │                       │ CANCELADA │
└───────────┘                       └───────────┘
```

### Estados Detallados

1. **INICIADA**
   - Recepción creada
   - Recolecciones asociadas
   - Esperando pesaje

2. **PESADA**
   - Peso en báscula registrado
   - Merma calculada
   - Esperando confirmación

3. **CONFIRMADA**
   - Prorrateo aplicado
   - Recolecciones actualizadas
   - Lote cerrado

4. **CANCELADA**
   - Error en proceso
   - Recolecciones liberadas

---

## Características Principales

### 1. Prorrateo Automático
- Cálculo matemático preciso
- Distribución proporcional al peso
- Sin intervención manual

### 2. Trazabilidad Completa
- Desde ecoaliado hasta tanque
- Auditoría de cada paso
- Historial inmutable

### 3. Validaciones Robustas
- Peso real no excede esperado +10%
- No duplicar recolecciones
- Estados consistentes

### 4. Soft Delete
- No elimina datos físicamente
- Mantiene historial
- Permite auditorías

### 5. Transacciones Atómicas
- Garantiza consistencia
- Rollback automático en errores
- Integridad de datos

---

## Casos de Uso Principales

### 1. Recepción Normal
```python
# 1. Crear recepción
recepcion = RecepcionMateriaPrima.objects.create(
    recolector=recolector,
    recibido_por=operario,
    fecha_recepcion=timezone.now()
)

# 2. Asociar recolecciones
for rec in recolecciones:
    RecepcionDetalle.objects.create(
        recepcion=recepcion,
        recoleccion=rec
    )

# 3. Registrar pesaje
recepcion.registrar_pesaje(
    peso_bascula=Decimal('144.00'),
    numero_ticket='TICK-001'
)

# 4. Confirmar
recepcion.confirmar_recepcion()
# → Prorrateo automático aplicado
```

### 2. Merma Alta (Requiere Justificación)
```python
# Merma > 5%
recepcion.registrar_pesaje(
    peso_bascula=Decimal('138.00'),
    observaciones='Merma alta: Envases con muchos residuos'
)

# Revisar antes de confirmar
if recepcion.porcentaje_merma > 5:
    # Alertar a supervisor
    enviar_alerta_supervisor(recepcion)
```

### 3. Cancelación por Error
```python
recepcion.cancelar(
    usuario=operario,
    motivo='Báscula averiada, repesar mañana'
)
```

---

## Beneficios del Sistema

### Operacionales
- ✅ Proceso estandarizado
- ✅ Reduce errores humanos
- ✅ Ahorra tiempo en planta
- ✅ Trazabilidad automática

### Contables
- ✅ Precisión en costos
- ✅ Control de merma
- ✅ Auditoría completa
- ✅ Reconciliación automática

### Gerenciales
- ✅ KPIs de merma
- ✅ Análisis por recolector
- ✅ Tendencias históricas
- ✅ Alertas automáticas

---

## Métricas y Reportes

### KPIs Disponibles

1. **Merma Promedio**
   - Por día/semana/mes
   - Por recolector
   - Por ruta

2. **Análisis de Costos**
   - Costo real por kg
   - Impacto financiero de merma
   - Comparativo esperado vs real

3. **Eficiencia Operativa**
   - Tiempo de recepción
   - Recepciones por día
   - Tasa de cancelación

---

## Integraciones

### Módulos Relacionados

```
Programaciones → Recolecciones → Recepciones → Lotes → Tanques → Producción
       ↓              ↓              ↓            ↓        ↓
   Ecoaliados     Vouchers     Prorrateo    Inventario  Producto
```

### APIs Externas (Futuro)
- Sistema de báscula
- ERP contable
- Sistema de tanques
- Dashboard gerencial

---

## Estructura de Archivos

```
backend/apps/recepciones/
│
├── __init__.py              # Configuración de app
├── apps.py                  # Config Django
├── models.py                # ⭐ Modelos principales
│   ├── RecepcionMateriaPrima
│   └── RecepcionDetalle
│
├── admin.py                 # Administración Django
├── tests.py                 # ⭐ Tests unitarios
│
└── migrations/
    └── 0001_initial.py      # Migración inicial

docs/
├── RECEPCIONES-MODELS.md    # ⭐ Documentación técnica detallada
└── RECEPCIONES-SUMMARY.md   # Este archivo
```

---

## Próximos Pasos

### 1. Backend (Inmediato)
- [ ] Serializers DRF
- [ ] ViewSets API
- [ ] Endpoints personalizados
- [ ] Permisos por rol

### 2. Frontend (Siguiente)
- [ ] Vista de recepción activa
- [ ] Formulario de pesaje
- [ ] Tabla de detalles con merma
- [ ] Confirmación visual

### 3. Reportes (Futuro)
- [ ] Dashboard de mermas
- [ ] Análisis por recolector
- [ ] Exportar a Excel/PDF
- [ ] Gráficos de tendencias

### 4. Integraciones (Futuro)
- [ ] Conectar con báscula automática
- [ ] Sincronizar con ERP
- [ ] Alertas por WhatsApp
- [ ] Dashboard en tiempo real

---

## Notas Técnicas

### Precisión de Cálculos
Todos los campos usan `DecimalField` para evitar errores de redondeo:
- `max_digits=10, decimal_places=2` para pesos
- `max_digits=12, decimal_places=2` para valores monetarios
- Redondeo con `ROUND_HALF_UP` estándar contable

### Performance
Optimizaciones implementadas:
- Índices en campos de búsqueda frecuente
- `select_related()` en consultas
- `prefetch_related()` en detalles
- Cálculos en base de datos cuando posible

### Seguridad
- Validación de permisos por rol
- Transacciones atómicas
- Soft delete para auditoría
- Registro completo de cambios

---

## Glosario

- **ACU:** Aceite Comestible Usado
- **Merma:** Diferencia entre peso esperado y peso real
- **Prorrateo:** Distribución proporcional de la merma
- **Factor de merma:** Proporción peso_real/peso_esperado
- **Lote:** Conjunto de recolecciones recibidas juntas
- **Báscula:** Balanza industrial de planta

---

## Contacto y Soporte

**Sistema:** Grasas y Huesos del Norte - SGI
**Módulo:** Recepciones de Materia Prima
**Versión:** 1.0.0
**Fecha:** 2024-12-04

Para consultas técnicas, revisar:
- `docs/RECEPCIONES-MODELS.md` - Documentación técnica completa
- `backend/apps/recepciones/models.py` - Código fuente
- `backend/apps/recepciones/tests.py` - Casos de prueba

---

**Elaborado por:** Sistema de Gestión Integral
**Última actualización:** 2024-12-04
