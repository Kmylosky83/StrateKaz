# SEMANA 17: PRODUCTION OPS + LOGISTICS & FLEET
**Fechas:** 13-19 Abril 2026
**Estado:** EN PROGRESO
**Inicio Real:** 27 Diciembre 2025

---

## RESUMEN EJECUTIVO

### Objetivo
Implementar los módulos de Operaciones de Producción y Logística/Flota para completar el Nivel 4 - Cadena de Valor.

### Alcance

| Módulo | Apps | Modelos Est. | Líneas Est. |
|--------|------|--------------|-------------|
| production_ops | 4 apps | ~25 modelos | ~8,000 líneas |
| logistics_fleet | 2 apps | ~15 modelos | ~5,000 líneas |
| **TOTAL** | **6 apps** | **~40 modelos** | **~13,000 líneas** |

### Dependencias
- ✅ Semana 16: Supply Chain completo (programacion, compras, almacenamiento)
- ✅ Semana 15: Gestión Proveedores + Catálogos

---

## ESTRUCTURA DE MÓDULOS

### production_ops/ (Operaciones de Producción)

```
backend/apps/production_ops/
├── __init__.py
├── recepcion/           # Recepción de materia prima
│   ├── models.py        # ~6 modelos
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── tests/
├── procesamiento/       # Procesamiento y lotes
│   ├── models.py        # ~7 modelos
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── tests/
├── mantenimiento/       # Mantenimiento de activos
│   ├── models.py        # ~8 modelos
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── tests/
└── producto_terminado/  # Stock y liberación
    ├── models.py        # ~6 modelos
    ├── serializers.py
    ├── views.py
    ├── urls.py
    ├── admin.py
    └── tests/
```

### logistics_fleet/ (Logística y Flota)

```
backend/apps/logistics_fleet/
├── __init__.py
├── gestion_flota/       # Vehículos y mantenimiento
│   ├── models.py        # ~8 modelos
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── tests/
└── gestion_transporte/  # Rutas y despachos
    ├── models.py        # ~7 modelos
    ├── serializers.py
    ├── views.py
    ├── urls.py
    ├── admin.py
    └── tests/
```

---

## MODELOS DETALLADOS

### 1. production_ops/recepcion/ (6 modelos)

| Modelo | Descripción | Campos Principales |
|--------|-------------|-------------------|
| TipoRecepcion | Catálogo tipos | nombre, codigo, requiere_pesaje, requiere_acidez |
| EstadoRecepcion | Estados del proceso | nombre, codigo, color, orden, es_final |
| PuntoRecepcion | Ubicaciones físicas | nombre, codigo, ubicacion, capacidad_kg, activo |
| Recepcion | Registro principal | fecha, proveedor, tipo, punto, estado, peso_bruto, peso_neto, tara |
| DetalleRecepcion | Líneas de recepción | recepcion, materia_prima, cantidad, unidad, acidez, observaciones |
| ControlCalidadRecepcion | Verificación calidad | recepcion, parametro, valor, cumple, observaciones |

### 2. production_ops/procesamiento/ (7 modelos)

| Modelo | Descripción | Campos Principales |
|--------|-------------|-------------------|
| TipoProceso | Catálogo procesos | nombre, codigo, descripcion, tiempo_estimado_horas |
| EstadoProceso | Estados proceso | nombre, codigo, color, orden, es_final |
| LineaProduccion | Líneas físicas | nombre, codigo, capacidad_kg_hora, activo |
| OrdenProduccion | Orden de trabajo | codigo, fecha, tipo_proceso, linea, estado, prioridad |
| LoteProduccion | Lote generado | codigo, orden, materia_prima_entrada, cantidad_entrada, cantidad_salida, merma |
| ConsumoMateriaPrima | Consumos | lote, materia_prima, cantidad, unidad, costo_unitario |
| ControlCalidadProceso | Calidad en proceso | lote, parametro, valor_minimo, valor_maximo, valor_obtenido, cumple |

### 3. production_ops/mantenimiento/ (8 modelos)

| Modelo | Descripción | Campos Principales |
|--------|-------------|-------------------|
| TipoActivo | Catálogo activos | nombre, codigo, vida_util_anios, requiere_calibracion |
| TipoMantenimiento | Tipos mtto | nombre, codigo, es_preventivo, frecuencia_dias |
| ActivoProduccion | Activos físicos | codigo, nombre, tipo, linea_produccion, fecha_adquisicion, estado |
| EquipoMedicion | Equipos calibrables | activo, marca, modelo, rango_medicion, fecha_calibracion, proxima_calibracion |
| PlanMantenimiento | Planes preventivos | activo, tipo_mantenimiento, frecuencia, ultima_ejecucion, proxima_ejecucion |
| OrdenTrabajo | Órdenes mtto | codigo, activo, tipo, prioridad, estado, fecha_programada, fecha_ejecucion |
| Calibracion | Registro calibración | equipo, fecha, certificado, resultado, observaciones, proxima |
| Parada | Paradas no programadas | activo, fecha_inicio, fecha_fin, tipo, causa, impacto_produccion |

### 4. production_ops/producto_terminado/ (6 modelos)

| Modelo | Descripción | Campos Principales |
|--------|-------------|-------------------|
| TipoProducto | Catálogo productos | nombre, codigo, unidad_medida, requiere_certificado |
| EstadoLote | Estados del lote | nombre, codigo, permite_despacho, color |
| ProductoTerminado | Productos | codigo, nombre, tipo, especificaciones, precio_base |
| StockProducto | Inventario PT | producto, almacen, cantidad, lote, fecha_vencimiento |
| Liberacion | Aprobación QA | lote, fecha, responsable, resultado, observaciones, certificado |
| CertificadoCalidad | Certificados | liberacion, parametros, valores, firma_digital, fecha_emision |

### 5. logistics_fleet/gestion_flota/ (8 modelos)

| Modelo | Descripción | Campos Principales |
|--------|-------------|-------------------|
| TipoVehiculo | Catálogo vehículos | nombre, codigo, capacidad_kg, requiere_refrigeracion |
| EstadoVehiculo | Estados | nombre, codigo, disponible_para_ruta, color |
| Vehiculo | Vehículos | placa, tipo, marca, modelo, anio, capacidad, estado, km_actual |
| DocumentoVehiculo | Documentos legales | vehiculo, tipo_documento, numero, fecha_expedicion, fecha_vencimiento |
| HojaVidaVehiculo | Historial | vehiculo, fecha, tipo_evento, descripcion, km, costo |
| MantenimientoVehiculo | Mtto vehicular | vehiculo, tipo, fecha_programada, fecha_ejecucion, km, costo, proveedor |
| CostoOperacion | Costos operativos | vehiculo, fecha, tipo_costo, valor, km_recorridos, consumo_combustible |
| VerificacionTercero | Inspecciones | vehiculo, fecha, tipo, resultado, observaciones, vigencia |

### 6. logistics_fleet/gestion_transporte/ (7 modelos)

| Modelo | Descripción | Campos Principales |
|--------|-------------|-------------------|
| TipoRuta | Catálogo rutas | nombre, codigo, es_recoleccion, es_entrega |
| EstadoDespacho | Estados despacho | nombre, codigo, en_transito, es_final, color |
| Ruta | Rutas definidas | codigo, nombre, tipo, origen, destino, distancia_km, tiempo_estimado |
| ProgramacionRuta | Programación | ruta, fecha, vehiculo, conductor, hora_salida, hora_llegada_estimada |
| Despacho | Despachos | codigo, programacion, cliente_destino, estado, peso_total, observaciones |
| DetalleDespacho | Líneas despacho | despacho, producto, cantidad, lote, peso |
| Manifiesto | Documentos transporte | despacho, numero, fecha, conductor, vehiculo, remitente, destinatario |

---

## FRONTEND

### Estructura de Archivos

```
frontend/src/features/
├── production-ops/
│   ├── types/
│   │   ├── recepcion.types.ts
│   │   ├── procesamiento.types.ts
│   │   ├── mantenimiento.types.ts
│   │   ├── producto-terminado.types.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── recepcionApi.ts
│   │   ├── procesamientoApi.ts
│   │   ├── mantenimientoApi.ts
│   │   ├── productoTerminadoApi.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useRecepcion.ts
│   │   ├── useProcesamiento.ts
│   │   ├── useMantenimiento.ts
│   │   ├── useProductoTerminado.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── RecepcionTab.tsx
│   │   ├── ProcesamientoTab.tsx
│   │   ├── MantenimientoTab.tsx
│   │   ├── ProductoTerminadoTab.tsx
│   │   └── index.ts
│   ├── pages/
│   │   └── ProductionOpsPage.tsx
│   └── index.ts
└── logistics-fleet/
    ├── types/
    │   ├── flota.types.ts
    │   ├── transporte.types.ts
    │   └── index.ts
    ├── api/
    │   ├── flotaApi.ts
    │   ├── transporteApi.ts
    │   └── index.ts
    ├── hooks/
    │   ├── useFlota.ts
    │   ├── useTransporte.ts
    │   └── index.ts
    ├── components/
    │   ├── GestionFlotaTab.tsx
    │   ├── GestionTransporteTab.tsx
    │   └── index.ts
    ├── pages/
    │   └── LogisticsFleetPage.tsx
    └── index.ts
```

### Tabs y Subtabs

#### ProductionOpsPage (4 tabs principales)

| Tab | Subtabs |
|-----|---------|
| Recepción | Recepciones, Puntos de Recepción, Control Calidad, Histórico, Reportes |
| Procesamiento | Órdenes Producción, Lotes, Líneas, Consumos, Control Calidad |
| Mantenimiento | Activos, Equipos Medición, Planes Mtto, Órdenes Trabajo, Calibraciones, Paradas |
| Producto Terminado | Stock PT, Liberaciones, Certificados, Vencimientos, Reportes |

#### LogisticsFleetPage (2 tabs principales)

| Tab | Subtabs |
|-----|---------|
| Gestión Flota | Vehículos, Documentos, Mantenimientos, Costos, Verificaciones |
| Gestión Transporte | Rutas, Programación, Despachos, Manifiestos, Tracking |

---

## PLAN DE EJECUCIÓN SECUENCIAL

### Fase 1: Estructuras Base
- [ ] Crear estructura production_ops/
- [ ] Crear estructura logistics_fleet/
- [ ] Registrar en settings.py

### Fase 2: Backend production_ops
- [ ] App recepcion (modelos, serializers, views, urls, admin)
- [ ] App procesamiento (modelos, serializers, views, urls, admin)
- [ ] App mantenimiento (modelos, serializers, views, urls, admin)
- [ ] App producto_terminado (modelos, serializers, views, urls, admin)

### Fase 3: Backend logistics_fleet
- [ ] App gestion_flota (modelos, serializers, views, urls, admin)
- [ ] App gestion_transporte (modelos, serializers, views, urls, admin)

### Fase 4: Frontend production_ops
- [ ] Types (4 archivos)
- [ ] API clients (4 archivos)
- [ ] Hooks (4 archivos)
- [ ] Components (4 tabs)
- [ ] Page principal

### Fase 5: Frontend logistics_fleet
- [ ] Types (2 archivos)
- [ ] API clients (2 archivos)
- [ ] Hooks (2 archivos)
- [ ] Components (2 tabs)
- [ ] Page principal

### Fase 6: Testing
- [ ] Tests production_ops (mínimo 25 tests)
- [ ] Tests logistics_fleet (mínimo 15 tests)

### Fase 7: Documentación Final
- [ ] Actualizar README.md
- [ ] Actualizar 00-EMPEZAR-AQUI.md
- [ ] Actualizar CRONOGRAMA-26-SEMANAS.md
- [ ] Actualizar FASE-5-SEMANAS-15-18.md
- [ ] Completar este documento

---

## PROGRESO

| Tarea | Estado | Fecha | Notas |
|-------|--------|-------|-------|
| Plan de ejecución creado | ✅ | 27/12/2025 | Este documento |
| Estructura production_ops | ⏳ | - | - |
| Estructura logistics_fleet | ⏳ | - | - |
| Backend recepcion | ⏳ | - | - |
| Backend procesamiento | ⏳ | - | - |
| Backend mantenimiento | ⏳ | - | - |
| Backend producto_terminado | ⏳ | - | - |
| Backend gestion_flota | ⏳ | - | - |
| Backend gestion_transporte | ⏳ | - | - |
| Frontend production_ops | ⏳ | - | - |
| Frontend logistics_fleet | ⏳ | - | - |
| Tests | ⏳ | - | - |
| Documentación final | ⏳ | - | - |

---

## AGENTES ESPECIALIZADOS A UTILIZAR

| Agente | Tareas |
|--------|--------|
| django-master | Modelos, Serializers, ViewSets, URLs |
| react-architect | Types, API clients, Hooks, Components |
| data-architect | Diseño de esquema, relaciones, índices |
| qa-testing-specialist | Tests unitarios y de integración |
| documentation-expert | Actualización de documentación |
| pesv-specialist | Normativa de flota vehicular |
| sst-specialist | Normativa de mantenimiento y seguridad |

---

**Documento creado:** 27 Diciembre 2025
**Última actualización:** 27 Diciembre 2025
**Estado:** EN PROGRESO
