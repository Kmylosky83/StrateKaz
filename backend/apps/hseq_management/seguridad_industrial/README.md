# Seguridad Industrial - HSEQ Management

Módulo completo para la gestión de Seguridad Industrial con cuatro componentes principales:

## 📋 Componentes

### 1. **Permisos de Trabajo**
Gestión de permisos de trabajo para actividades de alto riesgo (altura, espacios confinados, trabajo en caliente, etc.)

**Modelos:**
- `TipoPermisoTrabajo`: Catálogo de tipos de permisos con configuración de autorizaciones y checklist
- `PermisoTrabajo`: Permisos emitidos con doble autorización (SST y Operaciones)

**Endpoints:**
- `GET/POST /tipos-permiso-trabajo/` - Gestión de tipos de permisos
- `GET/POST /permisos-trabajo/` - CRUD de permisos
- `POST /permisos-trabajo/{id}/aprobar_permiso/` - Aprobar permiso (SST u Operaciones)
- `POST /permisos-trabajo/{id}/cerrar_permiso/` - Cerrar permiso completado
- `POST /permisos-trabajo/{id}/iniciar_ejecucion/` - Iniciar ejecución
- `GET /permisos-trabajo/estadisticas/` - Estadísticas de permisos

**Flujo de Estados:**
```
BORRADOR → PENDIENTE_APROBACION → APROBADO → EN_EJECUCION → COMPLETADO
                                              ↘ CANCELADO
                                              ↘ VENCIDO
```

### 2. **Inspecciones Dinámicas**
Sistema de inspecciones configurables con plantillas personalizables por empresa.

**Modelos:**
- `TipoInspeccion`: Tipos de inspecciones configurables (equipos, EPP, vehículos, instalaciones)
- `PlantillaInspeccion`: Plantillas con items de verificación en JSON
- `Inspeccion`: Inspecciones programadas y realizadas
- `ItemInspeccion`: Resultados por item (Conforme, No Conforme, No Aplica, Observación)

**Endpoints:**
- `GET/POST /tipos-inspeccion/` - Gestión de tipos
- `GET/POST /plantillas-inspeccion/` - Gestión de plantillas
- `GET/POST /inspecciones/` - CRUD de inspecciones
- `POST /inspecciones/crear_desde_plantilla/` - Crear inspección con items desde plantilla
- `POST /inspecciones/{id}/completar_inspeccion/` - Completar con resultados
- `POST /inspecciones/{id}/generar_hallazgo/` - Generar hallazgo desde item no conforme
- `GET /inspecciones/estadisticas/` - Estadísticas de cumplimiento

**Características:**
- Plantillas versionadas
- Cálculo automático de cumplimiento
- Clasificación de resultados (Satisfactorio, Aceptable, Deficiente, Crítico)
- Generación de hallazgos desde items no conformes
- Evidencias fotográficas por item

### 3. **Control de EPP**
Gestión de entregas de Equipos de Protección Personal con control de vida útil.

**Modelos:**
- `TipoEPP`: Catálogo de EPP por categorías (cabeza, ojos, auditiva, manos, pies, etc.)
- `EntregaEPP`: Registro de entregas con fechas de reposición

**Endpoints:**
- `GET/POST /tipos-epp/` - Gestión de tipos de EPP
- `GET/POST /entregas-epp/` - CRUD de entregas
- `POST /entregas-epp/{id}/registrar_devolucion/` - Registrar devolución
- `GET /entregas-epp/proximas_reposiciones/` - EPP que requieren reposición próxima
- `GET /entregas-epp/estadisticas/` - Estadísticas de entregas

**Características:**
- Control de vida útil automático
- Alertas de reposición (30 días antes)
- Registro de capacitación sobre uso
- Firma digital del colaborador
- Control de tallas para EPP requeridos
- Estados: En Uso, Devuelto, Extraviado, Dañado, Vencido

### 4. **Programas de Seguridad**
Planificación y seguimiento de programas de seguridad industrial.

**Modelos:**
- `ProgramaSeguridad`: Programas con actividades, objetivos, indicadores y presupuesto

**Endpoints:**
- `GET/POST /programas-seguridad/` - CRUD de programas
- `POST /programas-seguridad/{id}/actualizar_avance/` - Calcular avance desde actividades
- `POST /programas-seguridad/{id}/registrar_revision/` - Registrar revisión del programa
- `GET /programas-seguridad/estadisticas/` - Estadísticas de programas

**Tipos de Programas:**
- Prevención de Riesgos
- Capacitación y Entrenamiento
- Vigilancia de la Salud
- Inspección y Mantenimiento
- Preparación para Emergencias
- Investigación de Incidentes
- Mejora Continua

## 🔐 Multi-Tenancy

Todos los modelos incluyen `empresa_id` para separación de datos por empresa:
- Permisos de Trabajo
- Inspecciones (Tipos, Plantillas, Inspecciones)
- Entregas de EPP
- Programas de Seguridad

Los catálogos globales NO tienen `empresa_id`:
- TipoPermisoTrabajo
- TipoEPP

## 📊 Campos Auto-Calculados

**Permisos de Trabajo:**
- `duracion_horas`: Calculado desde fecha_inicio/fecha_fin
- `numero_permiso`: Auto-generado formato PT-YYYY-#####
- `esta_activo`, `esta_vencido`, `puede_aprobar`: Properties

**Inspecciones:**
- `porcentaje_cumplimiento`: Calculado desde items
- `resultado_global`: Clasificado según % cumplimiento
- `numero_hallazgos`: Conteo automático
- `numero_inspeccion`: Auto-generado formato INS-CODIGO-YYYY-####

**Entregas EPP:**
- `fecha_reposicion_programada`: Calculado desde vida útil
- `numero_entrega`: Auto-generado formato EPP-YYYY-#####
- `requiere_reposicion`: Property con alerta 30 días antes

**Programas:**
- `porcentaje_avance`: Calculado desde actividades
- `esta_vigente`, `dias_restantes`: Properties

## 🔄 Integraciones

- **Colaboradores:** Relación con `talent_hub.colaboradores` para personal
- **Hallazgos:** Preparado para integrar con módulo de hallazgos/no conformidades
- **Incidentes:** Registro de incidentes en permisos de trabajo

## 📝 Admin Django

Todos los modelos registrados en Django Admin con:
- List displays configurados
- Filtros por campos clave
- Búsqueda optimizada
- Fieldsets organizados
- Inlines donde corresponde (ItemInspeccion)
- Campos readonly apropiados

## 🚀 Uso

### Crear Permiso de Trabajo
```python
POST /api/hseq/seguridad-industrial/permisos-trabajo/
{
    "empresa_id": 1,
    "tipo_permiso": 1,
    "ubicacion": "Planta 2 - Área de producción",
    "descripcion_trabajo": "Trabajo en altura para mantenimiento de techos",
    "fecha_inicio": "2024-01-15T08:00:00Z",
    "fecha_fin": "2024-01-15T17:00:00Z",
    "solicitante": 1,
    "supervisor": 2,
    "estado": "BORRADOR"
}
```

### Crear Inspección desde Plantilla
```python
POST /api/hseq/seguridad-industrial/inspecciones/crear_desde_plantilla/
{
    "empresa_id": 1,
    "tipo_inspeccion_id": 1,
    "plantilla_id": 1,
    "fecha_programada": "2024-01-20",
    "ubicacion": "Bodega 1",
    "inspector_id": 5
}
```

### Registrar Entrega EPP
```python
POST /api/hseq/seguridad-industrial/entregas-epp/
{
    "empresa_id": 1,
    "colaborador": 10,
    "tipo_epp": 3,
    "marca": "3M",
    "modelo": "Serie 6000",
    "talla": "M",
    "cantidad": 1,
    "fecha_entrega": "2024-01-10",
    "entregado_por": 5,
    "capacitacion_realizada": true
}
```

## 📦 Dependencias

- Django 4.2+
- Django REST Framework 3.14+
- `apps.core.models.BaseModel` - Modelo base con timestamps
- `apps.talent_hub.colaboradores.models.Colaborador` - Modelo de colaboradores

## 🗄️ Tablas de Base de Datos

- `hseq_tipo_permiso_trabajo`
- `hseq_permiso_trabajo`
- `hseq_tipo_inspeccion`
- `hseq_plantilla_inspeccion`
- `hseq_inspeccion`
- `hseq_item_inspeccion`
- `hseq_tipo_epp`
- `hseq_entrega_epp`
- `hseq_programa_seguridad`

## ✅ Testing

Ejecutar migraciones:
```bash
python manage.py makemigrations seguridad_industrial
python manage.py migrate
```

## 📄 Licencia

Propiedad de Grasas y Huesos del Norte
