# Reporte de Ejecución de Migraciones - Supply Chain

**Fecha:** 2025-12-27
**Módulo:** apps.supply_chain.gestion_proveedores
**Estado:** ❌ BLOQUEADO - Conflictos de Modelo

---

## 1. Problema Identificado

### Error Principal
El contenedor backend está crasheando constantemente debido a conflictos de `related_name` en modelos Django duplicados.

### Apps en Conflicto
```python
# En settings.py - INSTALLED_APPS
'apps.proveedores',                        # LEGACY (línea 28)
'apps.supply_chain.gestion_proveedores',  # NUEVA (línea 30)
```

Ambas apps están instaladas simultáneamente, causando colisiones en los reverse accessors de ForeignKey.

---

## 2. Errores Detallados

### 2.1. Conflictos de Related Names

```
gestion_proveedores.Proveedor.created_by: (fields.E304)
Reverse accessor 'User.proveedores_creados' clashes with
'proveedores.Proveedor.created_by'
```

**Modelos afectados:**
- ✗ `Proveedor.created_by`
- ✗ `CondicionComercialProveedor.created_by`
- ✗ `PrecioMateriaPrima.modificado_por`
- ✗ `HistorialPrecioProveedor.modificado_por`
- ✗ `PruebaAcidez.realizado_por`
- ✗ `UnidadNegocio.responsable`

### 2.2. Error Adicional - Mejora Continua

```
mejora_continua.EvaluacionCumplimiento.requisito_legal: (fields.E300)
Field defines a relation with model 'motor_cumplimiento.RequisitoLegal',
which is either not installed, or is abstract.
```

**Causa:** La app `motor_cumplimiento` no está en INSTALLED_APPS pero hay referencias a ella.

---

## 3. Estado de Migraciones

### App Legacy: apps.proveedores
**Migraciones aplicadas:** 17
**Última migración:** 0017_add_origen_proveedor_externo_standby.py

```
0001_initial.py
0002_alter_proveedor_departamento_and_more.py
0003_fix_subtipo_materia_data.py
0004_remove_proveedor_proveedores_subtipo_9348ba_idx_and_more.py
0005_remove_geolocation_simplify_payment_methods.py
0006_preciomateriaprima_and_more.py
0007_fix_subtipo_materia_to_json.py
0008_convert_subtipo_to_json.py
0009_remove_proveedor_proveedores_subtipo_9348ba_idx_and_more.py
0010_fix_schema_sync.py
0011_remove_proveedor_proveedores_subtipo_9348ba_idx_and_more.py
0012_update_tipo_materia_codes.py
0013_create_prueba_acidez.py
0014_aumentar_max_length_tipo_materia.py
0015_add_codigo_interno.py
0016_update_codigo_interno_prefixes.py
0017_add_origen_proveedor_externo_standby.py
```

**Implicación:** Existen datos en producción que deben ser migrados.

### App Nueva: apps.supply_chain.gestion_proveedores
**Migraciones aplicadas:** 0
**Estado:** No se pueden crear ni aplicar migraciones por los conflictos.

---

## 4. Análisis de Impacto

### Tablas en Base de Datos (app legacy)
```
proveedores_proveedor
proveedores_unidadnegocio
proveedores_condicioncomercialproveedor
proveedores_preciomateriaprima
proveedores_historialprecioproveedor
proveedores_pruebaacidez
```

### Riesgo
🔴 **ALTO** - No se puede proceder sin resolver duplicación de apps

---

## 5. Soluciones Propuestas

### Opción 1: Migración de Datos (RECOMENDADA)
1. Crear migración de datos desde `proveedores` → `gestion_proveedores`
2. Eliminar app legacy de INSTALLED_APPS
3. Ejecutar migraciones de la nueva app
4. Verificar integridad de datos

**Ventajas:**
- Mantiene todos los datos históricos
- Limpia arquitectura duplicada
- Permite avanzar con supply_chain

**Desventajas:**
- Requiere script de migración cuidadoso
- Downtime durante migración

### Opción 2: Mantener Solo Legacy
1. Eliminar `apps.supply_chain.gestion_proveedores` de INSTALLED_APPS
2. Continuar usando `apps.proveedores`
3. Mover nuevas funcionalidades a app legacy

**Ventajas:**
- No requiere migración de datos
- Cero downtime

**Desventajas:**
- Mantiene arquitectura legacy
- No sigue nueva estructura modular

### Opción 3: Renombrar Related Names
1. Agregar `related_name` únicos a uno de los dos apps
2. Mantener ambas apps temporalmente

**Ventajas:**
- Solución rápida para desarrollo

**Desventajas:**
- No resuelve duplicación fundamental
- Confusión en el código

---

## 6. Plan de Acción Recomendado

### Fase 1: Preparación (1 hora)
```bash
# 1. Backup de base de datos
docker-compose exec db mysqldump -u root -p grasas_huesos_db > backup_pre_migracion.sql

# 2. Exportar datos de app legacy
docker-compose exec backend python manage.py dumpdata proveedores --indent 2 > proveedores_data.json
```

### Fase 2: Crear Migración de Datos (2 horas)
```python
# backend/apps/supply_chain/gestion_proveedores/migrations/0001_migrate_from_legacy.py

from django.db import migrations

def migrate_proveedores_data(apps, schema_editor):
    # Código de migración
    OldProveedor = apps.get_model('proveedores', 'Proveedor')
    NewProveedor = apps.get_model('gestion_proveedores', 'Proveedor')

    for old_obj in OldProveedor.objects.all():
        NewProveedor.objects.create(
            # Mapear campos
        )

class Migration(migrations.Migration):
    dependencies = [
        ('proveedores', '0017_add_origen_proveedor_externo_standby'),
        ('gestion_proveedores', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_proveedores_data),
    ]
```

### Fase 3: Ejecución (30 min)
```bash
# 1. Comentar app legacy en settings.py
# 'apps.proveedores',  # LEGACY - DESHABILITADO

# 2. Reiniciar contenedor
docker-compose restart backend

# 3. Crear migraciones nueva app
docker-compose exec backend python manage.py makemigrations gestion_proveedores

# 4. Aplicar migraciones
docker-compose exec backend python manage.py migrate

# 5. Verificar
docker-compose exec backend python manage.py showmigrations
```

### Fase 4: Validación (1 hora)
- Comparar conteo de registros
- Verificar relaciones FK
- Probar endpoints API
- Ejecutar tests

---

## 7. Comandos Intentados

```bash
# Estado de contenedores
docker-compose ps
# ✓ Ejecutado - Backend en crash loop

# Logs del backend
docker-compose logs --tail=50 backend
# ✓ Ejecutado - Mostró errores de conflicto

# Intento de makemigrations (FALLÓ)
docker-compose exec -T backend python manage.py makemigrations gestion_proveedores
# ✗ No ejecutado - Backend no arranca por errores de sistema
```

---

## 8. Próximos Pasos Inmediatos

### Para Continuar Desarrollo
1. **DECIDIR** cuál opción tomar (1, 2 o 3)
2. **COMUNICAR** decisión al equipo
3. **PLANIFICAR** ventana de mantenimiento si se elige Opción 1
4. **EJECUTAR** plan aprobado

### Prioridad
🔴 **CRÍTICA** - Bloquea todo desarrollo en Supply Chain

---

## 9. Archivos Relevantes

```
backend/config/settings.py (línea 28-30)
backend/apps/proveedores/ (legacy)
backend/apps/supply_chain/gestion_proveedores/ (nueva)
backend/apps/proveedores/migrations/ (17 archivos)
backend/apps/supply_chain/gestion_proveedores/migrations/ (solo __init__.py)
```

---

## 10. Recomendación Final

**Opción 1: Migración de Datos** es la mejor estrategia a largo plazo porque:

1. Mantiene coherencia con nueva arquitectura modular
2. Elimina deuda técnica
3. Facilita mantenimiento futuro
4. Sigue convenciones de Django estándar

**Tiempo estimado total:** 4-5 horas
**Riesgo:** Medio (mitigable con backups y validaciones)

---

## Contacto
Para ejecutar este plan, coordinar con:
- Arquitecto de Software (diseño de migración)
- DBA (backup y restauración)
- DevOps (ventana de mantenimiento)
