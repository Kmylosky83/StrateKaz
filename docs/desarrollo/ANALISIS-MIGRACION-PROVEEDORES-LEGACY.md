# Análisis de Migración: Módulo Legacy Proveedores a Supply Chain

**Fecha:** 2025-12-27
**Sistema:** ERP StrateKaz - Grasas y Huesos del Norte
**Módulo Legacy:** apps/proveedores/
**Módulo Nuevo:** apps/supply_chain/gestion_proveedores/

---

## 1. RESUMEN EJECUTIVO

**ESTADO:** Existen DATOS LEGACY que requieren migración antes de desactivar el módulo legacy.

**Datos Encontrados:**
- 12 Proveedores registrados
- 1 Unidad de Negocio
- 14 Registros de precios de materia prima
- 21 Registros de historial de precios
- 2 Pruebas de acidez

**Recomendación:** NO desactivar el módulo legacy hasta completar la migración de datos.

---

## 2. INVENTARIO DE DATOS LEGACY

### 2.1 Tablas con Datos

| Tabla                              | Registros | Estado  | Requiere Migración |
|------------------------------------|-----------|---------|-------------------|
| proveedores_proveedor              | 12        | Activos | SÍ                |
| proveedores_unidad_negocio         | 1         | Activo  | SÍ                |
| proveedores_precio_materia_prima   | 14        | Activos | SÍ                |
| proveedores_historial_precio       | 21        | Activos | SÍ (Auditoría)    |
| proveedores_condicion_comercial    | 0         | Vacía   | NO                |
| proveedores_prueba_acidez          | 2         | Activos | SÍ                |

### 2.2 Detalle de Proveedores

```
PROVEEDORES DE PRODUCTOS/SERVICIOS (2):
- PS-0001: Botas Saga (PRODUCTO_SERVICIO)
- PS-0002: Stratekaz (PRODUCTO_SERVICIO)

PROVEEDORES DE MATERIA PRIMA EXTERNOS (8):
- MP-0003: Econorte (MATERIA_PRIMA_EXTERNO)
- MP-0001: Frigorífico El Buen Corte (MATERIA_PRIMA_EXTERNO)
- MP-0005: Pedros Hueso (MATERIA_PRIMA_EXTERNO)
- MP-0006: Prueba 2 (MATERIA_PRIMA_EXTERNO)
- MP-0007: rr (MATERIA_PRIMA_EXTERNO)
- MP-0008: Test 1 (MATERIA_PRIMA_EXTERNO)
- MP-0010: Test 3 (MATERIA_PRIMA_EXTERNO)
- MP-0009: Test2 (MATERIA_PRIMA_EXTERNO)

UNIDADES DE NEGOCIO (2):
- MP-0004: Econorte (UNIDAD_NEGOCIO)
- MP-0002: Planta Bogotá - ACU (UNIDAD_NEGOCIO)
```

### 2.3 Unidades de Negocio

```
- 1 Unidad registrada en proveedores_unidad_negocio
```

---

## 3. COMPARACIÓN DE MODELOS

### 3.1 Cambios Estructurales Principales

#### A. LEGACY: Campos Hardcoded
```python
# apps/proveedores/models.py
TIPO_PROVEEDOR_CHOICES = [
    ('MATERIA_PRIMA_EXTERNO', 'Proveedor Externo de Materia Prima'),
    ('UNIDAD_NEGOCIO', 'Unidad de Negocio Interna'),
    ('PRODUCTO_SERVICIO', 'Proveedor de Productos/Servicios'),
]

subtipo_materia = JSONField(default=list)  # Lista de códigos fijos
modalidad_logistica = CharField(choices=MODALIDAD_LOGISTICA_CHOICES)
formas_pago = JSONField(default=list)
```

#### B. NUEVO: Sistema 100% Dinámico
```python
# apps/supply_chain/gestion_proveedores/models.py
tipo_proveedor = ForeignKey(TipoProveedor)  # Catálogo dinámico
tipos_materia_prima = ManyToManyField(TipoMateriaPrima)  # Catálogo dinámico
modalidad_logistica = ForeignKey(ModalidadLogistica)  # Catálogo dinámico
formas_pago = ManyToManyField(FormaPago)  # Catálogo dinámico
```

### 3.2 Nuevos Modelos de Catálogo (No existían en Legacy)

```python
1. CategoriaMateriaPrima
2. TipoMateriaPrima (con rangos de acidez)
3. TipoProveedor
4. ModalidadLogistica
5. FormaPago
6. TipoCuentaBancaria
7. TipoDocumentoIdentidad
8. Departamento
9. Ciudad
10. CriterioEvaluacion
```

### 3.3 Nuevas Funcionalidades

```python
1. EvaluacionProveedor - NO existía en legacy
2. DetalleEvaluacion - NO existía en legacy
3. Sistema de evaluación por criterios dinámicos
4. Geolocalización por catálogos de Departamento/Ciudad
```

---

## 4. MAPEO DE CAMPOS

### 4.1 Tabla: Proveedor

| Campo Legacy              | Campo Nuevo               | Tipo Conversión | Notas |
|---------------------------|---------------------------|-----------------|-------|
| codigo_interno            | codigo_interno            | DIRECTO         | Mantener |
| tipo_proveedor            | tipo_proveedor_id         | LOOKUP          | Convertir a FK usando TipoProveedor.codigo |
| subtipo_materia (JSON)    | tipos_materia_prima (M2M) | LOOKUP MULTIPLE | Convertir códigos a FK de TipoMateriaPrima |
| modalidad_logistica       | modalidad_logistica_id    | LOOKUP          | Convertir a FK usando ModalidadLogistica.codigo |
| nombre_comercial          | nombre_comercial          | DIRECTO         | |
| razon_social              | razon_social              | DIRECTO         | |
| tipo_documento            | tipo_documento_id         | LOOKUP          | Convertir a FK usando TipoDocumentoIdentidad.codigo |
| numero_documento          | numero_documento          | DIRECTO         | |
| nit                       | nit                       | DIRECTO         | |
| telefono                  | telefono                  | DIRECTO         | |
| email                     | email                     | DIRECTO         | |
| direccion                 | direccion                 | DIRECTO         | |
| ciudad                    | ciudad (CharField)        | DIRECTO         | Mantener como texto |
| departamento (CharField)  | departamento_id           | LOOKUP          | Convertir a FK usando Departamento.codigo |
| unidad_negocio_id         | unidad_negocio_id         | FK              | Mantener referencia |
| formas_pago (JSON)        | formas_pago (M2M)         | LOOKUP MULTIPLE | Convertir a FK de FormaPago |
| dias_plazo_pago           | dias_plazo_pago           | DIRECTO         | |
| banco                     | banco                     | DIRECTO         | |
| tipo_cuenta               | tipo_cuenta_id            | LOOKUP          | Convertir a FK usando TipoCuentaBancaria.codigo |
| numero_cuenta             | numero_cuenta             | DIRECTO         | |
| titular_cuenta            | titular_cuenta            | DIRECTO         | |
| observaciones             | observaciones             | DIRECTO         | |
| is_active                 | is_active                 | DIRECTO         | |
| created_by_id             | created_by_id             | DIRECTO         | |
| created_at                | created_at                | DIRECTO         | |
| updated_at                | updated_at                | DIRECTO         | |
| deleted_at                | deleted_at                | DIRECTO         | |

### 4.2 Tabla: UnidadNegocio

| Campo Legacy      | Campo Nuevo       | Tipo Conversión | Notas |
|-------------------|-------------------|-----------------|-------|
| codigo            | codigo            | DIRECTO         | |
| nombre            | nombre            | DIRECTO         | |
| tipo_unidad       | tipo_unidad       | DIRECTO         | Mantener choices |
| direccion         | direccion         | DIRECTO         | |
| ciudad            | ciudad            | DIRECTO         | |
| departamento      | departamento_id   | LOOKUP          | Convertir a FK |
| responsable_id    | responsable_id    | DIRECTO         | |
| is_active         | is_active         | DIRECTO         | |
| created_at        | created_at        | DIRECTO         | |
| updated_at        | updated_at        | DIRECTO         | |
| deleted_at        | deleted_at        | DIRECTO         | |

### 4.3 Tabla: PrecioMateriaPrima

| Campo Legacy          | Campo Nuevo               | Tipo Conversión | Notas |
|-----------------------|---------------------------|-----------------|-------|
| proveedor_id          | proveedor_id              | FK              | |
| tipo_materia (Char)   | tipo_materia_id           | LOOKUP          | Convertir a FK de TipoMateriaPrima |
| precio_kg             | precio_kg                 | DIRECTO         | |
| modificado_por_id     | modificado_por_id         | DIRECTO         | |
| modificado_fecha      | modificado_fecha          | DIRECTO         | |
| created_at            | created_at                | DIRECTO         | |
| updated_at            | updated_at                | DIRECTO         | |

### 4.4 Tabla: HistorialPrecioProveedor

| Campo Legacy          | Campo Nuevo               | Tipo Conversión | Notas |
|-----------------------|---------------------------|-----------------|-------|
| proveedor_id          | proveedor_id              | FK              | |
| tipo_materia (Char)   | tipo_materia_id           | LOOKUP          | Convertir a FK de TipoMateriaPrima |
| precio_anterior       | precio_anterior           | DIRECTO         | |
| precio_nuevo          | precio_nuevo              | DIRECTO         | |
| modificado_por_id     | modificado_por_id         | DIRECTO         | |
| motivo                | motivo                    | DIRECTO         | |
| fecha_modificacion    | fecha_modificacion        | DIRECTO         | |
| created_at            | created_at                | DIRECTO         | |

### 4.5 Tabla: PruebaAcidez

| Campo Legacy              | Campo Nuevo               | Tipo Conversión | Notas |
|---------------------------|---------------------------|-----------------|-------|
| proveedor_id              | proveedor_id              | FK              | |
| fecha_prueba              | fecha_prueba              | DIRECTO         | |
| valor_acidez              | valor_acidez              | DIRECTO         | |
| calidad_resultante        | calidad_resultante        | DIRECTO         | |
| codigo_materia (Char)     | tipo_materia_resultante_id| LOOKUP          | Convertir a FK de TipoMateriaPrima |
| foto_prueba               | foto_prueba               | DIRECTO         | Copiar archivos |
| cantidad_kg               | cantidad_kg               | DIRECTO         | |
| precio_kg_aplicado        | precio_kg_aplicado        | DIRECTO         | |
| valor_total               | valor_total               | DIRECTO         | |
| observaciones             | observaciones             | DIRECTO         | |
| lote_numero               | lote_numero               | DIRECTO         | |
| codigo_voucher            | codigo_voucher            | DIRECTO         | |
| realizado_por_id          | realizado_por_id          | DIRECTO         | |
| created_at                | created_at                | DIRECTO         | |
| updated_at                | updated_at                | DIRECTO         | |
| deleted_at                | deleted_at                | DIRECTO         | |

---

## 5. ESTRATEGIA DE MIGRACIÓN

### 5.1 Pre-requisitos

1. Ejecutar migraciones del módulo nuevo para crear tablas
2. Poblar catálogos dinámicos con datos equivalentes al legacy
3. Validar integridad referencial

### 5.2 Orden de Migración

```
FASE 1: Catálogos Base
1. Departamento (poblar con DEPARTAMENTOS_COLOMBIA)
2. Ciudad (opcional, puede quedarse como CharField)
3. TipoDocumentoIdentidad (CC, CE, NIT, PASSPORT)
4. TipoCuentaBancaria (AHORROS, CORRIENTE)

FASE 2: Catálogos de Negocio
5. TipoProveedor (MATERIA_PRIMA_EXTERNO -> Proveedor Externo, etc.)
6. CategoriaMateriaPrima (HUESO, SEBO_CRUDO, SEBO_PROCESADO, etc.)
7. TipoMateriaPrima (todos los códigos de CODIGO_MATERIA_PRIMA_CHOICES)
8. ModalidadLogistica (ENTREGA_PLANTA, COMPRA_EN_PUNTO)
9. FormaPago (CONTADO, CHEQUE, TRANSFERENCIA, CREDITO, OTRO)

FASE 3: Datos Maestros
10. UnidadNegocio (1 registro)

FASE 4: Proveedores
11. Proveedor (12 registros) - Con M2M tipos_materia_prima y formas_pago

FASE 5: Transacciones
12. PrecioMateriaPrima (14 registros)
13. HistorialPrecioProveedor (21 registros - Auditoría)
14. PruebaAcidez (2 registros) - Copiar archivos de foto_prueba
```

### 5.3 Validaciones Post-Migración

```sql
-- Verificar conteo de registros
SELECT 'Proveedores' as tabla, COUNT(*) as legacy FROM proveedores_proveedor
UNION ALL
SELECT 'Proveedores', COUNT(*) FROM supply_chain_proveedor;

-- Verificar integridad de precios
SELECT p.codigo_interno, COUNT(pm.id) as precios_legacy
FROM proveedores_proveedor p
LEFT JOIN proveedores_precio_materia_prima pm ON pm.proveedor_id = p.id
GROUP BY p.id, p.codigo_interno
ORDER BY p.codigo_interno;

SELECT p.codigo_interno, COUNT(pm.id) as precios_nuevo
FROM supply_chain_proveedor p
LEFT JOIN supply_chain_precio_materia_prima pm ON pm.proveedor_id = p.id
GROUP BY p.id, p.codigo_interno
ORDER BY p.codigo_interno;
```

---

## 6. SCRIPT DE MIGRACIÓN

### 6.1 Estructura del Script

```python
# backend/apps/supply_chain/gestion_proveedores/management/commands/migrar_proveedores_legacy.py

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.proveedores.models import (
    Proveedor as ProveedorLegacy,
    UnidadNegocio as UnidadNegocioLegacy,
    PrecioMateriaPrima as PrecioLegacy,
    HistorialPrecioProveedor as HistorialLegacy,
    PruebaAcidez as PruebaAcidezLegacy
)
from apps.supply_chain.gestion_proveedores.models import (
    Proveedor, UnidadNegocio, PrecioMateriaPrima,
    HistorialPrecioProveedor, PruebaAcidez,
    TipoProveedor, TipoMateriaPrima, ModalidadLogistica,
    FormaPago, Departamento, TipoDocumentoIdentidad, TipoCuentaBancaria
)

class Command(BaseCommand):
    help = 'Migrar datos de módulo legacy proveedores a supply_chain'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            self.poblar_catalogos()
            self.migrar_unidades_negocio()
            self.migrar_proveedores()
            self.migrar_precios()
            self.migrar_historial()
            self.migrar_pruebas_acidez()
            self.validar_migracion()
```

### 6.2 Mapeo de Códigos Legacy a Dinámico

```python
# Mapeo de tipos de proveedor
TIPO_PROVEEDOR_MAP = {
    'MATERIA_PRIMA_EXTERNO': 'MATERIA_PRIMA_EXTERNO',
    'UNIDAD_NEGOCIO': 'UNIDAD_NEGOCIO',
    'PRODUCTO_SERVICIO': 'PRODUCTO_SERVICIO',
}

# Mapeo de códigos de materia prima
CODIGO_MATERIA_MAP = {
    'HUESO_CRUDO': 'HUESO_CRUDO',
    'HUESO_BLANDO': 'HUESO_BLANDO',
    'HUESO_DURO': 'HUESO_DURO',
    'HUESO_MIXTO': 'HUESO_MIXTO',
    'SEBO_CRUDO': 'SEBO_CRUDO',
    'SEBO_PROCESADO_A': 'SEBO_PROCESADO_A',
    'SEBO_PROCESADO_B': 'SEBO_PROCESADO_B',
    'SEBO_PROCESADO_B1': 'SEBO_PROCESADO_B1',
    'SEBO_PROCESADO_B2': 'SEBO_PROCESADO_B2',
    'SEBO_PROCESADO_B4': 'SEBO_PROCESADO_B4',
    'SEBO_PROCESADO_C': 'SEBO_PROCESADO_C',
    'CABEZAS': 'CABEZAS',
    'ACU': 'ACU',
    # Legacy codes (mantener compatibilidad)
    'SEBO': 'SEBO_CRUDO',  # Default
    'HUESO': 'HUESO_CRUDO',  # Default
}

# Mapeo de departamentos
DEPARTAMENTO_MAP = {
    'ANTIOQUIA': 'ANTIOQUIA',
    'ATLANTICO': 'ATLANTICO',
    'BOGOTA_DC': 'BOGOTA_DC',
    'BOLIVAR': 'BOLIVAR',
    'BOYACA': 'BOYACA',
    # ... resto de departamentos
}
```

---

## 7. CONSIDERACIONES ESPECIALES

### 7.1 Archivos de Pruebas de Acidez

- **Ubicación Legacy:** `media/pruebas_acidez/`
- **Acción:** Copiar archivos a la misma estructura
- **Validar:** Que las rutas en `foto_prueba` sigan siendo válidas

### 7.2 Consecutivos

- **Legacy:** Usa sistema de consecutivos de `ConsecutivoConfig`
- **Nuevo:** También usa el mismo sistema
- **Acción:** Validar que los consecutivos actuales no generen duplicados

### 7.3 Auditoría

- El historial de precios (21 registros) es crítico para auditoría
- NO eliminar bajo ninguna circunstancia
- Validar que las fechas y usuarios se preserven

### 7.4 Relaciones M2M

- `tipos_materia_prima`: Convertir JSONField legacy a ManyToManyField
- `formas_pago`: Convertir JSONField legacy a ManyToManyField

---

## 8. RIESGOS Y MITIGACIÓN

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Pérdida de datos | CRÍTICO | BAJA | Backup completo antes de migrar |
| Inconsistencia en códigos | ALTO | MEDIA | Validación exhaustiva de mapeos |
| Ruptura de referencias | ALTO | BAJA | Migración en orden jerárquico |
| Pérdida de archivos | MEDIO | BAJA | Copiar archivos antes de migrar |
| Duplicación de consecutivos | MEDIO | MEDIA | Validar ConsecutivoConfig |

---

## 9. PLAN DE ROLLBACK

### 9.1 Antes de Migrar

```bash
# 1. Backup de base de datos
docker-compose exec db mysqldump -u grasas_user -p grasas_huesos_db > backup_pre_migracion.sql

# 2. Backup de archivos media
tar -czf backup_media_pruebas_acidez.tar.gz backend/media/pruebas_acidez/

# 3. Tag en Git
git tag -a "pre-migracion-proveedores" -m "Estado antes de migrar proveedores legacy"
```

### 9.2 Proceso de Rollback

```sql
-- 1. Eliminar datos migrados
DELETE FROM supply_chain_prueba_acidez;
DELETE FROM supply_chain_historial_precio;
DELETE FROM supply_chain_precio_materia_prima;
DELETE FROM supply_chain_proveedor_tipos_materia_prima;
DELETE FROM supply_chain_proveedor_formas_pago;
DELETE FROM supply_chain_proveedor;
DELETE FROM supply_chain_unidad_negocio;

-- 2. Eliminar catálogos
DELETE FROM supply_chain_criterio_evaluacion;
DELETE FROM supply_chain_ciudad;
DELETE FROM supply_chain_departamento;
DELETE FROM supply_chain_tipo_documento_identidad;
DELETE FROM supply_chain_tipo_cuenta_bancaria;
DELETE FROM supply_chain_forma_pago;
DELETE FROM supply_chain_modalidad_logistica;
DELETE FROM supply_chain_tipo_proveedor;
DELETE FROM supply_chain_tipo_materia_prima;
DELETE FROM supply_chain_categoria_materia_prima;

-- 3. Restaurar backup
-- (ejecutar backup_pre_migracion.sql si es necesario)
```

---

## 10. CHECKLIST DE MIGRACIÓN

### Pre-Migración
- [ ] Backup de base de datos completo
- [ ] Backup de archivos media/pruebas_acidez
- [ ] Tag en Git del estado actual
- [ ] Ejecutar migraciones del módulo nuevo
- [ ] Poblar catálogos base

### Migración
- [ ] Ejecutar script de migración
- [ ] Validar conteo de registros
- [ ] Validar integridad referencial
- [ ] Validar archivos de pruebas de acidez
- [ ] Validar consecutivos

### Post-Migración
- [ ] Pruebas funcionales del módulo nuevo
- [ ] Validar frontend con datos migrados
- [ ] Desactivar módulo legacy en INSTALLED_APPS (comentar)
- [ ] Documentar cambios en CHANGELOG
- [ ] Commit de migración exitosa

### Verificación Final
- [ ] Proveedores: 12 registros migrados
- [ ] Unidades de Negocio: 1 registro migrado
- [ ] Precios: 14 registros migrados
- [ ] Historial: 21 registros migrados
- [ ] Pruebas Acidez: 2 registros migrados
- [ ] Archivos de fotos: 2 archivos copiados

---

## 11. PRÓXIMOS PASOS

1. **Crear script de migración** (archivo Python)
2. **Poblar catálogos dinámicos** con datos iniciales
3. **Ejecutar migración** en ambiente de desarrollo
4. **Validar datos** migrados
5. **Desactivar módulo legacy** (comentar en INSTALLED_APPS)
6. **NO ELIMINAR** el módulo legacy hasta validar 100% en producción

---

## 12. CONCLUSIÓN

**EL MÓDULO LEGACY NO PUEDE SER DESACTIVADO HASTA COMPLETAR LA MIGRACIÓN.**

**Datos críticos identificados:**
- 12 Proveedores activos (8 MP externos, 2 Unidades de Negocio, 2 Prod/Serv)
- 14 Precios vigentes
- 21 Registros de auditoría de precios
- 2 Pruebas de acidez con evidencia fotográfica

**Acción requerida:**
Ejecutar script de migración completo antes de desactivar el módulo legacy.

**Tiempo estimado de migración:**
- Desarrollo del script: 4 horas
- Ejecución y validación: 2 horas
- Total: 6 horas

---

**Documento generado:** 2025-12-27
**Autor:** Claude Opus 4.5 (Data Architect)
**Estado:** PENDIENTE DE MIGRACIÓN
