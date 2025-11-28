# Módulo de Programaciones

Sistema de Gestión Grasas y Huesos del Norte S.A.S

## Descripción

El módulo de **Programaciones** gestiona la programación de recolecciones de ACU (Aceite Comestible Usado) en los ecoaliados. Permite el flujo completo desde la creación por parte del comercial hasta la ejecución por el recolector.

## Flujo de Negocio

```
1. PROGRAMADA → Comercial/Líder Comercial programa recolección
2. CONFIRMADA → Líder Logística asigna recolector
3. EN_RUTA → Recolector inicia la ruta (fecha llegó o manual)
4. COMPLETADA/CANCELADA → Recolector completa o cancela
5. REPROGRAMADA → Líder Logística crea nueva desde cancelada
```

## Modelos

### Programacion

**Campos principales:**
- `ecoaliado`: Ecoaliado donde se realizará la recolección
- `programado_por`: Usuario que creó la programación (comercial)
- `tipo_programacion`: PROGRAMADA o INMEDIATA
- `fecha_programada`: Fecha programada para recolección
- `cantidad_estimada_kg`: Cantidad estimada a recolectar
- `recolector_asignado`: Recolector asignado (por líder logística)
- `estado`: PROGRAMADA, CONFIRMADA, EN_RUTA, COMPLETADA, CANCELADA, REPROGRAMADA

**Propiedades:**
- `puede_asignar_recolector`: Valida si se puede asignar recolector
- `puede_confirmar`: Valida si se puede confirmar
- `puede_iniciar_ruta`: Valida si se puede cambiar a EN_RUTA
- `puede_completar`: Valida si se puede completar
- `puede_cancelar`: Valida si se puede cancelar
- `puede_reprogramar`: Valida si se puede reprogramar

**Métodos:**
- `puede_cambiar_estado(nuevo_estado, usuario)`: Valida transiciones y permisos
- `soft_delete()`: Eliminación lógica
- `restore()`: Restaura una programación eliminada

## Endpoints API

### Lista y CRUD

```
GET    /api/programaciones/programaciones/              # Lista de programaciones
POST   /api/programaciones/programaciones/              # Crear programación
GET    /api/programaciones/programaciones/{id}/         # Detalle
PUT    /api/programaciones/programaciones/{id}/         # Actualizar completo
PATCH  /api/programaciones/programaciones/{id}/         # Actualizar parcial
DELETE /api/programaciones/programaciones/{id}/         # Soft delete
```

### Acciones Custom

```
POST /api/programaciones/programaciones/{id}/asignar-recolector/
# Asignar recolector (solo Líder Logística+)
Body: {
    "recolector_asignado": 5,
    "observaciones_logistica": "Recolector por cercanía"
}

POST /api/programaciones/programaciones/{id}/cambiar-estado/
# Cambiar estado con validaciones
Body: {
    "nuevo_estado": "EN_RUTA",
    "observaciones": "Iniciando ruta",
    "motivo_cancelacion": "Solo si nuevo_estado es CANCELADA"
}

POST /api/programaciones/programaciones/{id}/reprogramar/
# Reprogramar desde cancelada (solo Líder Logística+)
Body: {
    "fecha_programada": "2024-12-01",
    "cantidad_estimada_kg": 50.00,
    "observaciones_comercial": "Reprogramación"
}

POST /api/programaciones/programaciones/{id}/restore/
# Restaurar eliminada (Líder Comercial/Logística+)

GET /api/programaciones/programaciones/calendario/
# Vista de calendario
Query params: ?fecha_desde=2024-11-01&fecha_hasta=2024-11-30&recolector_asignado=5

GET /api/programaciones/programaciones/estadisticas/
# Estadísticas generales

GET /api/programaciones/programaciones/recolectores-disponibles/
# Lista de recolectores activos
```

## Filtros Disponibles

- `ecoaliado`: ID del ecoaliado
- `programado_por`: ID del comercial
- `recolector_asignado`: ID del recolector
- `estado`: PROGRAMADA, CONFIRMADA, EN_RUTA, etc.
- `tipo_programacion`: PROGRAMADA o INMEDIATA
- `fecha_desde`: Fecha desde (YYYY-MM-DD)
- `fecha_hasta`: Fecha hasta (YYYY-MM-DD)
- `ciudad`: Ciudad del ecoaliado (contiene)
- `departamento`: Departamento del ecoaliado (contiene)
- `ecoaliado_codigo`: Código del ecoaliado (contiene)
- `ecoaliado_razon_social`: Razón social (contiene)
- `sin_recolector`: true/false
- `pendientes`: true/false (PROGRAMADA o CONFIRMADA)
- `activas`: true/false (no finalizadas)
- `vencidas`: true/false (fecha pasada y no completadas)

**Ejemplos:**

```
GET /api/programaciones/programaciones/?estado=PROGRAMADA&sin_recolector=true
GET /api/programaciones/programaciones/?recolector_asignado=5&fecha_desde=2024-11-01
GET /api/programaciones/programaciones/?ciudad=Bogotá&pendientes=true
GET /api/programaciones/programaciones/?vencidas=true
```

## Permisos por Rol

### comercial_econorte
- **Ver**: Solo sus programaciones (programado_por=usuario)
- **Crear**: Sí
- **Editar**: Solo sus programaciones
- **Eliminar**: Solo sus programaciones
- **Asignar recolector**: No
- **Cambiar estado**: No
- **Reprogramar**: No

### lider_com_econorte
- **Ver**: Todas las programaciones
- **Crear**: Sí
- **Editar**: Todas
- **Eliminar**: Todas
- **Asignar recolector**: No
- **Cambiar estado**: Cancelar
- **Reprogramar**: No

### lider_logistica_econorte
- **Ver**: Todas las programaciones
- **Crear**: No
- **Editar**: Todas (fechas, observaciones)
- **Eliminar**: Todas
- **Asignar recolector**: Sí
- **Cambiar estado**: Todos
- **Reprogramar**: Sí

### recolector_econorte
- **Ver**: Solo asignadas a él
- **Crear**: No
- **Editar**: No
- **Eliminar**: No
- **Asignar recolector**: No
- **Cambiar estado**: EN_RUTA, COMPLETADA, CANCELADA (solo de sus asignadas)
- **Reprogramar**: No

### gerente / superadmin
- **Full access**: Todos los permisos

## Reglas de Negocio

### Validaciones Principales

1. **Una programación por ecoaliado por día**: No se pueden crear dos programaciones activas para el mismo ecoaliado en la misma fecha.

2. **Fecha programada debe ser futura**: Al crear, la fecha debe ser igual o posterior a hoy.

3. **Cantidad estimada > 0**: La cantidad debe ser mayor a cero.

4. **Ecoaliado activo**: Solo se puede programar en ecoaliados activos y no eliminados.

5. **Recolector válido**: El recolector debe tener cargo `recolector_econorte` y estar activo.

### Transiciones de Estado Válidas

```
PROGRAMADA → CONFIRMADA    # Al asignar recolector (Líder Logística)
CONFIRMADA → EN_RUTA       # Recolector inicia o fecha llegó
EN_RUTA → COMPLETADA       # Recolector completa
EN_RUTA → CANCELADA        # Recolector cancela
PROGRAMADA → CANCELADA     # Líder cancela
CONFIRMADA → CANCELADA     # Líder cancela
CANCELADA → REPROGRAMADA   # Líder Logística reprograma (crea nueva)
```

### Cambios de Fecha

- **PROGRAMADA**: Se puede cambiar fecha
- **CONFIRMADA**: No se puede cambiar fecha
- **EN_RUTA**: No se puede cambiar fecha

## Serializers

### ProgramacionListSerializer
Campos resumidos para tabla de listado

### ProgramacionDetailSerializer
Todos los campos + información relacionada del ecoaliado

### ProgramacionCreateSerializer
- Validaciones: ecoaliado activo, fecha futura, cantidad > 0, única por día
- Auto-asigna: programado_por, created_by, estado=PROGRAMADA

### ProgramacionUpdateSerializer
- Solo permite editar: fecha_programada, cantidad_estimada_kg, observaciones
- Validación: no cambiar fecha si está CONFIRMADA o EN_RUTA

### AsignarRecolectorSerializer
- Asigna recolector y cambia a CONFIRMADA
- Validaciones: recolector activo con cargo correcto, estado PROGRAMADA

### CambiarEstadoSerializer
- Valida transiciones y permisos por rol
- Requiere motivo si es CANCELADA

### ReprogramarSerializer
- Crea nueva programación desde CANCELADA
- Marca original como REPROGRAMADA
- Validaciones: fecha futura, única por día

## Instalación

1. El módulo ya está agregado a `INSTALLED_APPS` en `settings.py`
2. El módulo ya está registrado en `urls.py`
3. El módulo PROGRAMACIONES ya está en MODULE_CHOICES de core/models.py

### Ejecutar Migraciones

```bash
cd backend
python manage.py makemigrations programaciones
python manage.py migrate programaciones
```

## Uso en Frontend

### Crear Programación

```javascript
const response = await fetch('/api/programaciones/programaciones/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        ecoaliado: 5,
        tipo_programacion: 'PROGRAMADA',
        fecha_programada: '2024-11-30',
        cantidad_estimada_kg: 45.50,
        observaciones_comercial: 'Cliente solicitó recolección urgente'
    })
});
```

### Asignar Recolector (Líder Logística)

```javascript
const response = await fetch('/api/programaciones/programaciones/1/asignar-recolector/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        recolector_asignado: 8,
        observaciones_logistica: 'Asignado por cercanía'
    })
});
```

### Cambiar Estado (Recolector inicia ruta)

```javascript
const response = await fetch('/api/programaciones/programaciones/1/cambiar-estado/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        nuevo_estado: 'EN_RUTA',
        observaciones: 'Iniciando ruta hacia el ecoaliado'
    })
});
```

### Vista Calendario

```javascript
const response = await fetch(
    '/api/programaciones/programaciones/calendario/' +
    '?fecha_desde=2024-11-01&fecha_hasta=2024-11-30',
    {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }
);
```

## Testing

El módulo incluye validaciones exhaustivas que deben probarse:

1. **Validación de una programación por día**
2. **Transiciones de estado según rol**
3. **Filtrado por rol (comercial, recolector, etc.)**
4. **Reprogramación desde canceladas**
5. **Soft delete y restore**

## Consideraciones de Producción

1. **Tarea programada**: Implementar cron job/celery para cambiar automáticamente a EN_RUTA cuando llegue la fecha programada.

2. **Notificaciones**: Agregar en signals.py:
   - Email/SMS al recolector cuando se le asigna
   - Notificación al comercial cuando cambia el estado
   - Alerta de programaciones vencidas

3. **Auditoría**: Todas las acciones quedan registradas en campos de auditoría (created_by, created_at, updated_at).

4. **Performance**: Los querysets ya incluyen `select_related` y `prefetch_related` optimizados.

## Soporte

Para dudas o problemas con el módulo, contactar al equipo de desarrollo.
