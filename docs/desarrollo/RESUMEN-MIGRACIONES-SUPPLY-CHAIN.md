# Resumen Ejecutivo - Migraciones Supply Chain

**Fecha:** 2025-12-27 18:58
**Tarea:** Ejecutar migraciones para módulo supply_chain
**Estado:** ❌ BLOQUEADO

---

## Resultado

**No se pudieron ejecutar las migraciones** debido a conflictos de modelos duplicados.

---

## Problemas Identificados

### 1. Conflicto Principal: Apps Duplicadas

```python
# backend/config/settings.py - INSTALLED_APPS

'apps.proveedores',                        # LEGACY - 17 migraciones
'apps.supply_chain.gestion_proveedores',  # NUEVA - 0 migraciones
```

**Impacto:**
- ✗ Backend crasheando en bucle
- ✗ No se pueden crear migraciones
- ✗ No se pueden aplicar migraciones
- ✗ Bloquea todo desarrollo en Supply Chain

**Modelos duplicados:**
- `Proveedor`
- `UnidadNegocio`
- `CondicionComercialProveedor`
- `PrecioMateriaPrima`
- `HistorialPrecioProveedor`
- `PruebaAcidez`

### 2. Error Secundario: EvaluacionCumplimiento

```python
# apps.hseq_management.mejora_continua.models.py

requisito_legal = models.ForeignKey(
    'motor_cumplimiento.RequisitoLegal',  # Error de lazy reference
    ...
)
```

**Causa:** Posible orden incorrecto de apps en INSTALLED_APPS.

---

## Errores de Django System Check

```
gestion_proveedores.Proveedor.created_by: (fields.E304)
Reverse accessor 'User.proveedores_creados' clashes with
'proveedores.Proveedor.created_by'

mejora_continua.EvaluacionCumplimiento.requisito_legal: (fields.E307)
The field was declared with a lazy reference to
'motor_cumplimiento.requisitolegal', but app 'motor_cumplimiento'
isn't installed.
```

---

## Datos en Riesgo

### App Legacy: apps.proveedores
- **17 migraciones aplicadas** (datos en producción)
- **Tablas en DB:** proveedores_*
- **Estado:** ACTIVA pero en conflicto

### App Nueva: apps.supply_chain.gestion_proveedores
- **0 migraciones aplicadas**
- **Tablas en DB:** Ninguna
- **Estado:** BLOQUEADA por conflictos

---

## Comandos Ejecutados

```bash
# 1. Verificar estado de contenedores
docker-compose ps
# ✓ Backend: Up 11 seconds (health: starting) - CRASH LOOP

# 2. Revisar logs
docker-compose logs --tail=50 backend
# ✓ Mostró errores de conflicto de related_name

# 3. Intentar makemigrations (ABORTADO)
docker-compose exec -T backend python manage.py makemigrations gestion_proveedores
# ✗ Exit code 137 - Backend no puede iniciar
```

---

## Soluciones Disponibles

### Opción 1: Migración Completa ⭐ RECOMENDADA
**Tiempo:** 4-5 horas | **Riesgo:** Medio

```bash
# 1. Backup
docker-compose exec db mysqldump -u root -p grasas_huesos_db > backup.sql

# 2. Exportar datos legacy
docker-compose exec backend python manage.py dumpdata proveedores > data.json

# 3. Comentar app legacy en settings.py
# 'apps.proveedores',  # DESHABILITADO

# 4. Crear migración de datos
# Ver REPORTE-MIGRACION-SUPPLY-CHAIN.md

# 5. Aplicar migraciones
docker-compose exec backend python manage.py makemigrations gestion_proveedores
docker-compose exec backend python manage.py migrate
```

**Ventajas:**
- ✓ Limpia arquitectura
- ✓ Elimina deuda técnica
- ✓ Mantiene datos históricos
- ✓ Sigue convenciones Django

### Opción 2: Mantener Legacy
**Tiempo:** 30 min | **Riesgo:** Bajo

```python
# backend/config/settings.py
INSTALLED_APPS = [
    # ...
    'apps.proveedores',  # MANTENER
    # 'apps.supply_chain.gestion_proveedores',  # ELIMINAR
]
```

**Ventajas:**
- ✓ Cero downtime
- ✓ No requiere migración
- ✓ Solución inmediata

**Desventajas:**
- ✗ Mantiene deuda técnica
- ✗ No sigue nueva arquitectura

### Opción 3: Related Names Únicos
**Tiempo:** 1 hora | **Riesgo:** Bajo

```python
# backend/apps/supply_chain/gestion_proveedores/models.py

class Proveedor(BaseCompanyModel):
    created_by = models.ForeignKey(
        User,
        related_name='proveedores_supply_chain_creados',  # ÚNICO
        ...
    )
```

**Ventajas:**
- ✓ Solución rápida
- ✓ Permite desarrollo paralelo

**Desventajas:**
- ✗ No resuelve duplicación
- ✗ Aumenta complejidad

---

## Archivos Creados

```
docs/desarrollo/REPORTE-MIGRACION-SUPPLY-CHAIN.md
  └─ Análisis completo con plan de migración

backend/scripts/verify_proveedores_data.py
  └─ Script para verificar datos legacy
```

---

## Próximos Pasos

### Decisión Requerida

**¿Qué opción ejecutar?**

- [ ] Opción 1: Migración completa (4-5h)
- [ ] Opción 2: Mantener legacy (30min)
- [ ] Opción 3: Related names (1h)

### Ejecución

Una vez decidido:

1. Ejecutar script de verificación de datos:
```bash
docker-compose exec backend python scripts/verify_proveedores_data.py
```

2. Seguir plan documentado en:
   `docs/desarrollo/REPORTE-MIGRACION-SUPPLY-CHAIN.md`

---

## Contacto

Para decidir y ejecutar, coordinar con:
- **Arquitecto:** Decisión de estrategia
- **DBA:** Backup y migración de datos
- **DevOps:** Ventana de mantenimiento
- **QA:** Validación post-migración

---

## Documentos Relacionados

- `docs/desarrollo/REPORTE-MIGRACION-SUPPLY-CHAIN.md` - Análisis detallado
- `backend/scripts/verify_proveedores_data.py` - Verificador de datos
- `backend/apps/proveedores/migrations/` - 17 migraciones legacy
- `backend/apps/supply_chain/gestion_proveedores/models.py` - Modelos nuevos

---

## Notas Técnicas

### Error Mejora Continua
El error de `EvaluacionCumplimiento.requisito_legal` es secundario y puede deberse a:
- Orden incorrecto de apps en INSTALLED_APPS
- Migración pendiente en motor_cumplimiento

**Solución temporal:** Mover `apps.hseq_management.mejora_continua` después de `apps.motor_cumplimiento.*` en INSTALLED_APPS.

---

**Última actualización:** 2025-12-27 19:00
**Responsable:** Sistema de Migraciones
