# Diagramas del Módulo de Recepciones

## Índice
1. [Diagrama de Flujo Completo](#diagrama-de-flujo-completo)
2. [Modelo de Datos ERD](#modelo-de-datos-erd)
3. [Diagrama de Estados](#diagrama-de-estados)
4. [Flujo de Prorrateo](#flujo-de-prorrateo)
5. [Diagrama de Secuencia](#diagrama-de-secuencia)

---

## Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INICIO DEL PROCESO                               │
│                 Recolector regresa a planta con ACU                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PASO 1: CREAR RECEPCIÓN (Estado: INICIADA)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  • Operario de planta crea nueva recepción                             │
│  • Selecciona recolector que entrega                                   │
│  • Se genera código: RMP-YYYYMMDD-XXXX                                 │
│                                                                         │
│  Datos iniciales:                                                       │
│    - Recolector: Juan Pérez                                            │
│    - Recibido por: María López (Operaria)                              │
│    - Fecha/Hora: 2024-12-04 14:30                                      │
│    - Estado: INICIADA                                                   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PASO 2: ASOCIAR RECOLECCIONES DEL DÍA                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Sistema busca todas las recolecciones del recolector no recibidas     │
│  Operario selecciona cuáles incluir en esta recepción                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │ ☑ REC-20241204-0001 │ ECO-0001 │ 50 kg  │ $2,000 │ $100,000│      │
│  │ ☑ REC-20241204-0002 │ ECO-0003 │ 30 kg  │ $2,100 │ $63,000 │      │
│  │ ☑ REC-20241204-0003 │ ECO-0005 │ 70 kg  │ $2,000 │ $140,000│      │
│  └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  Se crean RecepcionDetalle para cada una:                              │
│    • Peso esperado total: 150 kg                                       │
│    • Valor esperado total: $303,000                                    │
│    • Cantidad de recolecciones: 3                                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PASO 3: PESAJE EN BÁSCULA (Estado: INICIADA → PESADA)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│      ┌──────────────────────┐                                          │
│      │                      │                                          │
│      │    ⚖️ BÁSCULA        │                                          │
│      │                      │                                          │
│      │     144.00 KG        │                                          │
│      │                      │                                          │
│      └──────────────────────┘                                          │
│                                                                         │
│  Operario registra:                                                     │
│    • Peso real: 144 kg                                                 │
│    • Ticket báscula: TICK-20241204-001                                 │
│    • Observaciones: "Pesaje normal"                                    │
│                                                                         │
│  Sistema calcula automáticamente:                                      │
│    • Merma: 150 - 144 = 6 kg                                           │
│    • % Merma: (6 / 150) × 100 = 4.00%                                  │
│    • Factor merma: 144 / 150 = 0.96                                    │
│    • Estado: PESADA                                                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  VALIDACIÓN: ¿Merma aceptable?                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SI: Merma ≤ 5%  ────────────────────────────────────────┐             │
│      → Continuar con confirmación                         │             │
│                                                            │             │
│  NO: Merma > 5%  ──────────────────────────────┐          │             │
│      → Alerta a supervisor                      │          │             │
│      → Requiere justificación                   │          │             │
│      → Supervisor aprueba o cancela             │          │             │
│                                                 │          │             │
│                            [CANCELAR] ──────────┼──────────┼──┐          │
│                                                 │          │  │          │
│                            [APROBAR] ───────────┘          │  │          │
│                                                            │  │          │
└────────────────────────────────────────────────────────────┼──┼──────────┘
                                                             │  │
                                     ┌───────────────────────┘  │
                                     │                          │
                                     ▼                          ▼
┌─────────────────────────────────────────────────────┐  ┌──────────────────┐
│  PASO 4: CONFIRMAR RECEPCIÓN                        │  │   CANCELADA      │
│         (Estado: PESADA → CONFIRMADA)               │  │                  │
├─────────────────────────────────────────────────────┤  │  Motivo:         │
│                                                     │  │  Báscula         │
│  🔄 PRORRATEO AUTOMÁTICO DE MERMA                   │  │  averiada        │
│                                                     │  │                  │
│  Para cada recolección:                             │  │  Recolecciones   │
│                                                     │  │  quedan          │
│  1. Peso real = Peso esperado × 0.96               │  │  disponibles     │
│  2. Merma = Peso esperado - Peso real              │  │                  │
│  3. % Merma = 4% (igual para todas)                │  └──────────────────┘
│  4. Precio real/kg = Valor / Peso real             │
│  5. Valor real = Valor esperado (se mantiene)      │
│                                                     │
│  Resultados:                                        │
│  ┌──────────────────────────────────────────────┐  │
│  │ REC-0001 │ 48.00 kg │ 2.00 kg │ $2,083.33/kg│  │
│  │ REC-0002 │ 28.80 kg │ 1.20 kg │ $2,187.50/kg│  │
│  │ REC-0003 │ 67.20 kg │ 2.80 kg │ $2,083.33/kg│  │
│  │ TOTAL    │ 144.0 kg │ 6.00 kg │ $303,000    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ✅ Verificaciones automáticas:                     │
│     • Suma pesos = 144 kg ✓                        │
│     • Suma mermas = 6 kg ✓                         │
│     • Valor total = $303,000 ✓                     │
│                                                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PASO 5: POST-CONFIRMACIÓN                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Sistema ejecuta automáticamente:                                      │
│                                                                         │
│  1. ✅ Marcar recolecciones como RECIBIDAS                              │
│     • REC-20241204-0001 → RECIBIDA                                     │
│     • REC-20241204-0002 → RECIBIDA                                     │
│     • REC-20241204-0003 → RECIBIDA                                     │
│                                                                         │
│  2. 📦 Crear LOTE de producción                                        │
│     • Lote: LOTE-20241204-001                                          │
│     • Peso neto: 144 kg                                                │
│     • Origen: RMP-20241204-0001                                        │
│                                                                         │
│  3. 🛢️ Actualizar inventario tanque                                     │
│     • Tanque ACU Principal                                             │
│     • + 144 kg                                                         │
│     • Nivel actual: 2,344 kg                                           │
│                                                                         │
│  4. 📊 Actualizar estadísticas                                         │
│     • Merma día: 4%                                                    │
│     • Merma mes: 3.8%                                                  │
│     • Recepciones día: 3                                               │
│                                                                         │
│  5. 📧 Notificaciones                                                  │
│     • Email a líder logística                                          │
│     • Registro en auditoría                                            │
│     • Actualización dashboard                                          │
│                                                                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIN DEL PROCESO                                 │
│              Recepción completada exitosamente                          │
│                                                                         │
│  Estado final:                                                          │
│    • Recepción: CONFIRMADA                                             │
│    • Recolecciones: RECIBIDAS                                          │
│    • Lote: CREADO                                                      │
│    • Tanque: ACTUALIZADO                                               │
│                                                                         │
│  Próximos pasos:                                                        │
│    → Proceso de liquidación a recolector                               │
│    → Proceso de producción (uso del ACU)                               │
│    → Certificación a ecoaliados                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Datos ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User (core)                                │
├─────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                            │
│ • username                                                           │
│ • cargo (FK → Cargo)                                                │
│ • is_active                                                          │
└────────────┬────────────────────────────┬──────────────────────────┘
             │                            │
             │ recolector                 │ recibido_por
             │                            │
             ▼                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│              RecepcionMateriaPrima (recepciones)                       │
├────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                              │
│ • codigo_recepcion (UNIQUE) ← "RMP-YYYYMMDD-XXXX"                    │
│ • recolector_id (FK → User) [recolector_econorte]                    │
│ • recibido_por_id (FK → User) [operario/líder]                       │
│ • fecha_recepcion (DateTime)                                           │
│ • fecha_pesaje (DateTime, NULL)                                        │
│ • fecha_confirmacion (DateTime, NULL)                                  │
│ • peso_esperado_kg (Decimal) ← Calculado                              │
│ • peso_real_kg (Decimal, NULL) ← Ingresado por usuario               │
│ • merma_kg (Decimal) ← Calculado                                      │
│ • porcentaje_merma (Decimal) ← Calculado                              │
│ • cantidad_recolecciones (Integer)                                     │
│ • valor_esperado_total (Decimal)                                       │
│ • valor_real_total (Decimal, NULL)                                     │
│ • estado (CharField) ← INICIADA|PESADA|CONFIRMADA|CANCELADA          │
│ • observaciones_recepcion (Text)                                       │
│ • observaciones_merma (Text)                                           │
│ • numero_ticket_bascula (CharField)                                    │
│ • tanque_destino (CharField)                                           │
│ • motivo_cancelacion (Text)                                            │
│ • cancelado_por_id (FK → User, NULL)                                  │
│ • fecha_cancelacion (DateTime, NULL)                                   │
│ • created_by_id (FK → User, NULL)                                     │
│ • created_at (DateTime)                                                │
│ • updated_at (DateTime)                                                │
│ • deleted_at (DateTime, NULL) ← Soft delete                           │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             │ recepcion (1:N)
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                RecepcionDetalle (recepciones)                          │
├────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                              │
│ • recepcion_id (FK → RecepcionMateriaPrima)                           │
│ • recoleccion_id (FK → Recoleccion) [OneToOne]                       │
│                                                                        │
│ --- DATOS ESPERADOS (Original) ---                                     │
│ • peso_esperado_kg (Decimal) ← De Recoleccion                         │
│ • precio_esperado_kg (Decimal) ← De Recoleccion                       │
│ • valor_esperado (Decimal) ← De Recoleccion                           │
│                                                                        │
│ --- DATOS REALES (Después de prorrateo) ---                            │
│ • peso_real_kg (Decimal, NULL) ← peso_esperado × factor_merma        │
│ • merma_kg (Decimal) ← peso_esperado - peso_real                      │
│ • porcentaje_merma (Decimal) ← (merma / peso_esperado) × 100         │
│ • precio_real_kg (Decimal, NULL) ← valor_esperado / peso_real        │
│ • valor_real (Decimal, NULL) ← valor_esperado (se mantiene)          │
│                                                                        │
│ --- CÁLCULOS ---                                                        │
│ • proporcion_lote (Decimal) ← peso_esperado / total_lote             │
│                                                                        │
│ • observaciones (Text)                                                 │
│ • created_at (DateTime)                                                │
│ • updated_at (DateTime)                                                │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             │ recoleccion (1:1)
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Recoleccion (recolecciones)                           │
├────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                              │
│ • codigo_voucher (UNIQUE) ← "REC-YYYYMMDD-XXXX"                      │
│ • programacion_id (FK → Programacion) [OneToOne]                      │
│ • ecoaliado_id (FK → Ecoaliado)                                       │
│ • recolector_id (FK → User)                                           │
│ • fecha_recoleccion (DateTime)                                         │
│ • cantidad_kg (Decimal) ← Peso recolectado                            │
│ • precio_kg (Decimal) ← Precio pactado                                │
│ • valor_total (Decimal) ← cantidad × precio                           │
│ • observaciones (Text)                                                 │
│ • created_by_id (FK → User)                                           │
│ • created_at (DateTime)                                                │
│ • updated_at (DateTime)                                                │
│ • deleted_at (DateTime, NULL)                                          │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             │ ecoaliado
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Ecoaliado (ecoaliados)                              │
├────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                              │
│ • codigo (UNIQUE) ← "ECO-XXXX"                                        │
│ • razon_social                                                         │
│ • documento_tipo                                                       │
│ • documento_numero (UNIQUE)                                            │
│ • unidad_negocio_id (FK → Proveedor)                                  │
│ • telefono                                                             │
│ • email                                                                │
│ • direccion                                                            │
│ • ciudad                                                               │
│ • departamento                                                         │
│ • latitud (Decimal, NULL)                                              │
│ • longitud (Decimal, NULL)                                             │
│ • precio_compra_kg (Decimal) ← Precio pactado                         │
│ • comercial_asignado_id (FK → User)                                   │
│ • observaciones (Text)                                                 │
│ • is_active (Boolean)                                                  │
│ • created_by_id (FK → User)                                           │
│ • created_at (DateTime)                                                │
│ • updated_at (DateTime)                                                │
│ • deleted_at (DateTime, NULL)                                          │
└────────────────────────────────────────────────────────────────────────┘


RELACIONES CLAVE:

1. RecepcionMateriaPrima ──(1:N)──> RecepcionDetalle
   Una recepción tiene múltiples detalles

2. RecepcionDetalle ──(1:1)──> Recoleccion
   Cada detalle vincula UNA recolección única

3. Recoleccion ──(N:1)──> Ecoaliado
   Múltiples recolecciones de un ecoaliado

4. RecepcionMateriaPrima ──(N:1)──> User (recolector)
   Un recolector hace múltiples recepciones

5. RecepcionMateriaPrima ──(N:1)──> User (recibido_por)
   Un operario recibe múltiples entregas
```

---

## Diagrama de Estados

```
                        ┌─────────────┐
                        │   INICIO    │
                        │ (crear obj) │
                        └──────┬──────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │          ESTADO: INICIADA                │
        ├──────────────────────────────────────────┤
        │ • Recepción creada                       │
        │ • Recolecciones asociadas                │
        │ • Peso esperado calculado                │
        │ • Esperando pesaje                       │
        │                                          │
        │ Propiedades:                             │
        │   puede_pesar = True                     │
        │   puede_confirmar = False                │
        │   puede_cancelar = True                  │
        │   es_editable = True                     │
        └────────┬──────────────┬──────────────────┘
                 │              │
                 │ registrar_   │ cancelar()
                 │ pesaje()     │
                 │              ▼
                 │         ┌────────────┐
                 │         │ CANCELADA  │
                 │         ├────────────┤
                 │         │ • Error    │
                 ▼         │ • Motivo   │
        ┌──────────────────│ • Fecha    │
        │          ESTADO: │            │
        │          PESADA  │ [TERMINAL] │
        ├────────────────  └────────────┘
        │ • Peso en báscula registrado │
        │ • Merma calculada            │
        │ • % merma calculado          │
        │ • Ticket báscula guardado    │
        │ • Esperando confirmación     │
        │                              │
        │ Propiedades:                 │
        │   puede_pesar = False        │
        │   puede_confirmar = True     │
        │   puede_cancelar = True      │
        │   es_editable = True         │
        └────────┬──────────┬──────────┘
                 │          │
                 │ confirmar│ cancelar()
                 │ _recep   │
                 │ cion()   ▼
                 │     ┌────────────┐
                 │     │ CANCELADA  │
                 │     ├────────────┤
                 ▼     │ • Error    │
        ┌──────────────│ • Motivo   │
        │          EST │            │
        │          CON │ [TERMINAL] │
        ├────────────  └────────────┘
        │ • Prorrateo aplicado      │
        │ • Recolecciones actualizadas │
        │ • Valor real calculado    │
        │ • Lote creado             │
        │ • Tanque actualizado      │
        │                           │
        │ Propiedades:              │
        │   puede_pesar = False     │
        │   puede_confirmar = False │
        │   puede_cancelar = False  │
        │   es_editable = False     │
        │                           │
        │ [ESTADO TERMINAL]         │
        └───────────────────────────┘


MATRIZ DE TRANSICIONES:

┌─────────────┬──────────┬─────────┬────────────┬──────────┐
│ Estado      │ PESADA   │ CONFIR. │ CANCELADA  │ EDITAR   │
│ Actual      │          │         │            │          │
├─────────────┼──────────┼─────────┼────────────┼──────────┤
│ INICIADA    │    ✅    │   ❌    │     ✅     │    ✅    │
├─────────────┼──────────┼─────────┼────────────┼──────────┤
│ PESADA      │    ❌    │   ✅    │     ✅     │    ✅    │
├─────────────┼──────────┼─────────┼────────────┼──────────┤
│ CONFIRMADA  │    ❌    │   ❌    │     ❌     │    ❌    │
├─────────────┼──────────┼─────────┼────────────┼──────────┤
│ CANCELADA   │    ❌    │   ❌    │     ❌     │    ❌    │
└─────────────┴──────────┴─────────┴────────────┴──────────┘

✅ = Transición permitida
❌ = Transición NO permitida
```

---

## Flujo de Prorrateo

```
ENTRADA: Datos de la Recepción
┌────────────────────────────────────────────────────┐
│ Recolección 1: 50 kg × $2,000/kg = $100,000       │
│ Recolección 2: 30 kg × $2,100/kg = $63,000        │
│ Recolección 3: 70 kg × $2,000/kg = $140,000       │
│ ─────────────────────────────────────────────────  │
│ TOTAL ESPERADO: 150 kg  →  $303,000               │
│ PESO REAL (Báscula): 144 kg                        │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ PASO 1: Calcular Factor de Merma                   │
├────────────────────────────────────────────────────┤
│                                                    │
│   Factor = Peso Real / Peso Esperado              │
│          = 144 kg / 150 kg                         │
│          = 0.96                                    │
│                                                    │
│   Merma Total = 150 - 144 = 6 kg                  │
│   % Merma = (6 / 150) × 100 = 4.00%               │
│                                                    │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ PASO 2: Aplicar Prorrateo a Cada Recolección      │
└────────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ Recolección 1    │    │ Recolección 2    │
├──────────────────┤    ├──────────────────┤
│ Esperado: 50 kg  │    │ Esperado: 30 kg  │
│                  │    │                  │
│ Real:            │    │ Real:            │
│ 50 × 0.96        │    │ 30 × 0.96        │
│ = 48 kg          │    │ = 28.8 kg        │
│                  │    │                  │
│ Merma:           │    │ Merma:           │
│ 50 - 48          │    │ 30 - 28.8        │
│ = 2 kg           │    │ = 1.2 kg         │
│                  │    │                  │
│ % Merma:         │    │ % Merma:         │
│ (2/50) × 100     │    │ (1.2/30) × 100   │
│ = 4.00%          │    │ = 4.00%          │
│                  │    │                  │
│ Precio Real/kg:  │    │ Precio Real/kg:  │
│ $100,000 / 48    │    │ $63,000 / 28.8   │
│ = $2,083.33      │    │ = $2,187.50      │
│                  │    │                  │
│ Valor Real:      │    │ Valor Real:      │
│ $100,000         │    │ $63,000          │
│ (se mantiene)    │    │ (se mantiene)    │
└──────────────────┘    └──────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │ Recolección 3    │
                    ├──────────────────┤
                    │ Esperado: 70 kg  │
                    │                  │
                    │ Real:            │
                    │ 70 × 0.96        │
                    │ = 67.2 kg        │
                    │                  │
                    │ Merma:           │
                    │ 70 - 67.2        │
                    │ = 2.8 kg         │
                    │                  │
                    │ % Merma:         │
                    │ (2.8/70) × 100   │
                    │ = 4.00%          │
                    │                  │
                    │ Precio Real/kg:  │
                    │ $140,000 / 67.2  │
                    │ = $2,083.33      │
                    │                  │
                    │ Valor Real:      │
                    │ $140,000         │
                    │ (se mantiene)    │
                    └──────────────────┘
                            ↓
┌────────────────────────────────────────────────────┐
│ PASO 3: Verificar Consistencia                     │
├────────────────────────────────────────────────────┤
│                                                    │
│ ✅ Suma pesos reales:                              │
│    48 + 28.8 + 67.2 = 144 kg ✓                    │
│                                                    │
│ ✅ Suma mermas:                                     │
│    2 + 1.2 + 2.8 = 6 kg ✓                         │
│                                                    │
│ ✅ % Merma igual para todas:                        │
│    4% = 4% = 4% ✓                                  │
│                                                    │
│ ✅ Suma valores:                                    │
│    $100,000 + $63,000 + $140,000 = $303,000 ✓     │
│                                                    │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ SALIDA: Recepción Confirmada                       │
├────────────────────────────────────────────────────┤
│                                                    │
│ Estado: CONFIRMADA                                 │
│ Peso Real Total: 144 kg                            │
│ Merma Total: 6 kg (4%)                             │
│ Valor Total: $303,000                              │
│                                                    │
│ Todas las recolecciones actualizadas con:         │
│   • Peso real ajustado                             │
│   • Merma prorrateada                              │
│   • Precio real/kg ajustado                        │
│   • Valor mantenido                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Diagrama de Secuencia

```
Actor      Frontend     API/Backend      RecepcionMP       RecepcionDet      Recoleccion
  │            │              │                │                 │                │
  │ 1. Crear   │              │                │                 │                │
  │ Recepción  │              │                │                 │                │
  ├───────────>│              │                │                 │                │
  │            │ POST /api/   │                │                 │                │
  │            │ recepciones/ │                │                 │                │
  │            ├─────────────>│                │                 │                │
  │            │              │ create()       │                 │                │
  │            │              ├───────────────>│                 │                │
  │            │              │                │ generar_codigo()│                │
  │            │              │                │<────────────────│                │
  │            │              │                │ RMP-2024...     │                │
  │            │              │<───────────────│                 │                │
  │            │              │ 201 Created    │                 │                │
  │            │<─────────────│                │                 │                │
  │            │ {recepcion}  │                │                 │                │
  │<───────────│              │                │                 │                │
  │            │              │                │                 │                │
  │ 2. Asociar │              │                │                 │                │
  │ Recolec.   │              │                │                 │                │
  ├───────────>│              │                │                 │                │
  │            │ POST /api/   │                │                 │                │
  │            │ recepciones/ │                │                 │                │
  │            │ {id}/agregar │                │                 │                │
  │            │ _recolec/    │                │                 │                │
  │            ├─────────────>│                │                 │                │
  │            │              │ for each rec:  │                 │                │
  │            │              │   create_det() │                 │                │
  │            │              ├────────────────┼────────────────>│                │
  │            │              │                │                 │ get datos      │
  │            │              │                │                 ├───────────────>│
  │            │              │                │                 │ cantidad_kg    │
  │            │              │                │                 │ precio_kg      │
  │            │              │                │                 │ valor_total    │
  │            │              │                │                 │<───────────────│
  │            │              │                │<────────────────│                │
  │            │              │                │ calc_peso_esp() │                │
  │            │              │                │ calc_valor_esp()│                │
  │            │              │<───────────────│                 │                │
  │            │              │ 200 OK         │                 │                │
  │            │<─────────────│                │                 │                │
  │            │ {detalles}   │                │                 │                │
  │<───────────│              │                │                 │                │
  │            │              │                │                 │                │
  │ 3. Pesar   │              │                │                 │                │
  │ en Báscula │              │                │                 │                │
  ├───────────>│              │                │                 │                │
  │            │ POST /api/   │                │                 │                │
  │            │ recepciones/ │                │                 │                │
  │            │ {id}/        │                │                 │                │
  │            │ registrar_   │                │                 │                │
  │            │ pesaje/      │                │                 │                │
  │            ├─────────────>│                │                 │                │
  │            │              │ registrar_     │                 │                │
  │            │              │ pesaje()       │                 │                │
  │            │              ├───────────────>│                 │                │
  │            │              │                │ peso_real = 144 │                │
  │            │              │                │ calcular_merma()│                │
  │            │              │                │ merma = 6 kg    │                │
  │            │              │                │ % = 4.00%       │                │
  │            │              │                │ estado = PESADA │                │
  │            │              │<───────────────│                 │                │
  │            │              │ 200 OK         │                 │                │
  │            │<─────────────│                │                 │                │
  │            │ {merma_calc} │                │                 │                │
  │<───────────│              │                │                 │                │
  │            │              │                │                 │                │
  │ 4. Validar │              │                │                 │                │
  │ Merma      │              │                │                 │                │
  ├───────────>│              │                │                 │                │
  │  (Frontend)│              │                │                 │                │
  │ if > 5%:   │              │                │                 │                │
  │  → alerta  │              │                │                 │                │
  │  → requiere│              │                │                 │                │
  │    aprob.  │              │                │                 │                │
  │<───────────│              │                │                 │                │
  │            │              │                │                 │                │
  │ 5. Confir- │              │                │                 │                │
  │ mar Recep. │              │                │                 │                │
  ├───────────>│              │                │                 │                │
  │            │ POST /api/   │                │                 │                │
  │            │ recepciones/ │                │                 │                │
  │            │ {id}/        │                │                 │                │
  │            │ confirmar/   │                │                 │                │
  │            ├─────────────>│                │                 │                │
  │            │              │ confirmar_     │                 │                │
  │            │              │ recepcion()    │                 │                │
  │            │              ├───────────────>│                 │                │
  │            │              │                │ @transaction.   │                │
  │            │              │                │ atomic          │                │
  │            │              │                │ _prorratear_    │                │
  │            │              │                │ merma()         │                │
  │            │              │                ├────────────────>│                │
  │            │              │                │                 │ for each det:  │
  │            │              │                │                 │ aplicar_merma()│
  │            │              │                │                 │   peso_real    │
  │            │              │                │                 │   merma_kg     │
  │            │              │                │                 │   precio_real  │
  │            │              │                │                 │   valor_real   │
  │            │              │                │                 │ save()         │
  │            │              │                │<────────────────│                │
  │            │              │                │ estado=CONFIRM. │                │
  │            │              │                │ calc valor_real │                │
  │            │              │<───────────────│                 │                │
  │            │              │ 200 OK         │                 │                │
  │            │<─────────────│                │                 │                │
  │            │ {confirmada} │                │                 │                │
  │<───────────│              │                │                 │                │
  │            │              │                │                 │                │
  │ 6. Notif.  │              │                │                 │                │
  │ y Update   │              │                │                 │                │
  │<───────────│              │                │                 │                │
  │  Email     │              │                │                 │                │
  │  Dashboard │              │                │                 │                │
  │  Lote      │              │                │                 │                │
  │  Tanque    │              │                │                 │                │
```

---

**Fecha de creación:** 2024-12-04
**Versión:** 1.0
