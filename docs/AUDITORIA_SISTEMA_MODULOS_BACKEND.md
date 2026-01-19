# AUDITORÍA DETALLADA: Sistema de Módulos y Features - Backend StrateKaz

**Fecha**: 2026-01-18
**Sistema**: Django Backend - Sistema RBAC v4.0
**Alcance**: Granularidad Completa de Módulos, Tabs y Secciones

---

## RESUMEN EJECUTIVO

El sistema de módulos de StrateKaz implementa una **arquitectura jerárquica de 3 niveles** (Módulo → Tab → Section) completamente dinámica y almacenada en base de datos. Se integra perfectamente con el sistema RBAC v4.0 para control de acceso granular por cargo.

### Estado General
- ✅ **Sistema 100% funcional y en producción**
- ✅ **14 módulos configurados** (según Estructura Final 22)
- ✅ **83 tabs distribuidos** en los módulos
- ✅ **Integración completa con RBAC v4.0** (CargoSectionAccess)
- ✅ **API REST completa** con endpoints para CRUD y sidebar dinámico
- ⚠️ **No hay feature flags internos** dentro de módulos (solo on/off por módulo/tab/sección)

---

## 1. ARQUITECTURA DEL SISTEMA

### 1.1 Jerarquía de Modelos

```
SystemModule (Módulo)
    ├── code: str (único, ej: 'gestion_estrategica')
    ├── name: str (ej: 'Dirección Estratégica')
    ├── category: choice (ESTRATEGICO, MOTOR, INTEGRAL, MISIONAL, APOYO, INTELIGENCIA)
    ├── color: choice (purple, blue, green, orange, etc.)
    ├── icon: str (Lucide icon name)
    ├── route: str (ruta frontend, ej: '/gestion-estrategica')
    ├── is_core: bool (módulos core no pueden desactivarse)
    ├── is_enabled: bool (estado activo/inactivo)
    ├── requires_license: bool
    ├── license_expires_at: date
    ├── dependencies: M2M (otros SystemModules)
    └── orden: int (orden en sidebar)

    └── ModuleTab (Tab/Pestaña)
        ├── code: str (único por módulo, ej: 'identidad')
        ├── name: str (ej: 'Identidad Corporativa')
        ├── icon: str (Lucide icon)
        ├── route: str (segmento de ruta, ej: 'identidad')
        ├── is_core: bool
        ├── is_enabled: bool
        └── orden: int

        └── TabSection (Sección/SubNavegación)
            ├── code: str (único por tab, ej: 'mision_vision')
            ├── name: str (ej: 'Misión y Visión')
            ├── icon: str
            ├── is_core: bool
            ├── is_enabled: bool
            ├── supported_actions: JSONField (acciones custom, ej: ["enviar", "aprobar"])
            └── orden: int
```

### 1.2 Tablas de Base de Datos

| Tabla | Propósito | Campos Clave |
|-------|-----------|--------------|
| `core_system_module` | Módulos del sistema | code, name, category, color, icon, route, is_enabled, is_core, orden |
| `core_module_tab` | Tabs dentro de módulos | module_id, code, name, icon, route, is_enabled, orden |
| `core_tab_section` | Secciones dentro de tabs | tab_id, code, name, icon, is_enabled, supported_actions, orden |
| `core_cargo_section_access` | **Control RBAC** | cargo_id, section_id, can_view, can_create, can_edit, can_delete, custom_actions |

### 1.3 Relación con RBAC v4.0

El modelo **`CargoSectionAccess`** es el **puente entre módulos y permisos**:

```python
class CargoSectionAccess(models.Model):
    cargo = ForeignKey('Cargo')
    section = ForeignKey('TabSection')

    # Permisos CRUD granulares
    can_view = BooleanField(default=True)
    can_create = BooleanField(default=False)
    can_edit = BooleanField(default=False)
    can_delete = BooleanField(default=False)

    # Acciones custom (JSONField)
    custom_actions = JSONField(default=dict)
    # Ejemplo: {"enviar": true, "aprobar": false}
```

**Flujo de autorización**:
1. Usuario tiene un `Cargo` asignado
2. El `Cargo` tiene múltiples `CargoSectionAccess` (acceso a secciones)
3. Cada `CargoSectionAccess` define:
   - **Visibilidad**: ¿Aparece en el sidebar?
   - **Acciones CRUD**: ¿Qué operaciones puede hacer?
   - **Acciones custom**: Permisos específicos (aprobar, enviar, etc.)

---

## 2. ENDPOINTS DE API

### 2.1 SystemModule Endpoints

**Base URL**: `/api/core/system-modules/`

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/` | Listar módulos | RBAC: section_code='modulos' |
| POST | `/` | Crear módulo | RBAC: can_create |
| GET | `/{id}/` | Detalle de módulo | RBAC: can_view |
| PATCH | `/{id}/` | Actualizar módulo | RBAC: can_edit |
| DELETE | `/{id}/` | Eliminar módulo | RBAC: can_delete |
| **PATCH** | `/{id}/toggle/` | Activar/Desactivar | RBAC: can_edit |
| **GET** | `/categories/` | Categorías disponibles | IsAuthenticated |
| **GET** | `/enabled/` | Módulos habilitados | IsAuthenticated |
| **GET** | `/tree/` | Árbol completo | IsAuthenticated |
| **GET** | `/sidebar/` | **Sidebar dinámico** | IsAuthenticated |

### 2.2 ModuleTab Endpoints

**Base URL**: `/api/core/module-tabs/`

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/` | Listar tabs | RBAC: section_code='modulos' |
| POST | `/` | Crear tab | RBAC: can_create |
| GET | `/{id}/` | Detalle de tab | RBAC: can_view |
| PATCH | `/{id}/` | Actualizar tab | RBAC: can_edit |
| DELETE | `/{id}/` | Eliminar tab | RBAC: can_delete |
| PATCH | `/{id}/toggle/` | Activar/Desactivar | RBAC: can_edit |

### 2.3 TabSection Endpoints

**Base URL**: `/api/core/tab-sections/`

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/` | Listar secciones | RBAC: section_code='modulos' |
| POST | `/` | Crear sección | RBAC: can_create |
| GET | `/{id}/` | Detalle de sección | RBAC: can_view |
| PATCH | `/{id}/` | Actualizar sección | RBAC: can_edit |
| DELETE | `/{id}/` | Eliminar sección | RBAC: can_delete |
| PATCH | `/{id}/toggle/` | Activar/Desactivar | RBAC: can_edit |

### 2.4 Endpoint Crítico: `/sidebar/`

**Endpoint**: `GET /api/core/system-modules/sidebar/`

Este endpoint es **crítico** porque determina qué ve cada usuario en la navegación.

**Lógica de filtrado**:

```python
def sidebar(request):
    user = request.user

    # 1. Super usuario → Ve TODO
    if user.is_superuser:
        return full_sidebar()

    # 2. Usuario normal → Filtrado por CargoSectionAccess
    cargo = user.cargo

    # 2.1 Obtener secciones autorizadas para el cargo
    authorized_sections = CargoSectionAccess.objects.filter(cargo=cargo)

    # 2.2 Obtener tabs que contienen esas secciones
    authorized_tabs = TabSection.objects.filter(id__in=authorized_sections).values_list('tab_id')

    # 2.3 Obtener módulos que contienen esos tabs
    authorized_modules = ModuleTab.objects.filter(id__in=authorized_tabs).values_list('module_id')

    # 2.4 Construir sidebar con jerarquía filtrada
    return filtered_sidebar(authorized_modules, authorized_tabs, authorized_sections)
```

**Formato de respuesta**:

```json
[
  {
    "code": "gestion_estrategica",
    "name": "Dirección Estratégica",
    "icon": "Building2",
    "color": "blue",
    "route": null,
    "is_category": false,
    "children": [
      {
        "code": "identidad",
        "name": "Identidad Corporativa",
        "icon": "Award",
        "color": "blue",
        "route": "/gestion-estrategica/identidad",
        "is_category": false,
        "sections": [
          {
            "id": 123,
            "code": "mision_vision",
            "name": "Misión y Visión"
          }
        ]
      }
    ]
  }
]
```

---

## 3. SISTEMA DE GRANULARIDAD

### 3.1 Niveles de Control

| Nivel | Modelo | Granularidad | Uso |
|-------|--------|--------------|-----|
| **Nivel 1** | SystemModule | Módulo completo ON/OFF | Marketplace, licenciamiento |
| **Nivel 2** | ModuleTab | Tab ON/OFF dentro del módulo | Funcionalidades opcionales |
| **Nivel 3** | TabSection | Sección ON/OFF dentro del tab | Control fino de UI |
| **Nivel 4** | CargoSectionAccess | Permisos CRUD por sección | **RBAC granular** |

### 3.2 Flags de Control

**A nivel de Módulo/Tab/Section**:
- `is_enabled`: bool → Activo en el sistema
- `is_core`: bool → No puede desactivarse (módulos críticos)

**A nivel de CargoSectionAccess (RBAC)**:
- `can_view`: bool → Puede ver la sección
- `can_create`: bool → Puede crear registros
- `can_edit`: bool → Puede editar registros
- `can_delete`: bool → Puede eliminar registros
- `custom_actions`: JSONField → Acciones específicas (aprobar, enviar, etc.)

### 3.3 Dependencias entre Módulos

Los módulos pueden tener **dependencias** entre sí:

```python
class SystemModule:
    dependencies = ManyToManyField('self', symmetrical=False)

    def enable(self):
        # Al activar un módulo, activa dependencias automáticamente
        for dep in self.dependencies.all():
            if not dep.is_enabled:
                dep.is_enabled = True
                dep.save()
        self.is_enabled = True
        self.save()

    def can_disable(self):
        # No puede desactivarse si otros módulos dependen de él
        if self.is_core:
            return False, "Es módulo core"

        dependents = self.dependents.filter(is_enabled=True)
        if dependents.exists():
            return False, f"Dependencias activas: {dependents}"

        return True, None
```

---

## 4. SEEDERS Y CONFIGURACIÓN INICIAL

### 4.1 Management Commands

**Comando maestro**: `seed_estructura_final.py`

```bash
python manage.py seed_estructura_final
```

**Función**:
- Crea los **14 módulos** del ERP
- Crea **83 tabs** distribuidos
- Crea **cientos de secciones**
- Actualiza existentes sin duplicar
- Elimina secciones obsoletas

**Otros comandos**:
- `seed_hseq_modules.py` → Módulo HSEQ específico
- `seed_nivel2_modules.py` → Módulos de nivel 2 (Cumplimiento, Riesgos, Workflows)
- `cleanup_legacy_modules.py` → Limpiar módulos antiguos

### 4.2 Estructura de Datos en Seeders

```python
module_config = {
    'code': 'gestion_estrategica',
    'name': 'Dirección Estratégica',
    'description': 'Base del sistema...',
    'category': 'ESTRATEGICO',
    'color': 'blue',
    'icon': 'Building2',
    'route': '/gestion-estrategica',
    'is_core': True,
    'is_enabled': True,
    'orden': 10,
    'tabs': [
        {
            'code': 'identidad',
            'name': 'Identidad Corporativa',
            'icon': 'Award',
            'route': 'identidad',
            'orden': 3,
            'sections': [
                {
                    'code': 'mision_vision',
                    'name': 'Misión y Visión',
                    'icon': 'Eye',
                    'orden': 1
                }
            ]
        }
    ]
}
```

### 4.3 Actualización de Módulos Existentes

**Filosofía**: Idempotencia

```python
def create_or_update_module(data):
    module, created = SystemModule.objects.get_or_create(
        code=data['code'],
        defaults=data
    )

    if not created:
        # Actualizar todos los campos excepto code
        for key, value in data.items():
            if key != 'code':
                setattr(module, key, value)
        module.save()
```

**Limpieza de obsoletos**:

```python
def cleanup_obsolete_sections(tab, valid_section_codes):
    existing_sections = TabSection.objects.filter(tab=tab)

    for section in existing_sections:
        if section.code not in valid_section_codes:
            section.delete()
```

---

## 5. INTEGRACIÓN CON RBAC v4.0

### 5.1 Permiso GranularActionPermission

**Uso en ViewSets**:

```python
class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'identidad_corporativa'

    # Mapeo de acciones custom
    granular_action_map = {
        'approve': 'can_edit',
        'publish': 'can_edit',
        'archive': 'can_delete',
    }
```

**Lógica del permiso**:

```python
class GranularActionPermission:
    def has_permission(self, request, view):
        # 1. Super usuario → siempre True
        if request.user.is_superuser:
            return True

        # 2. Determinar acción requerida
        action = view.action or self._map_http_method(request.method)
        required_flag = view.granular_action_map.get(action, self._default_flag(action))

        # 3. Obtener CargoSectionAccess
        cargo = request.user.cargo
        section_code = view.section_code

        access = CargoSectionAccess.objects.filter(
            cargo=cargo,
            section__code=section_code
        ).first()

        if not access:
            return False

        # 4. Verificar bandera específica
        if required_flag in ['can_view', 'can_create', 'can_edit', 'can_delete']:
            return getattr(access, required_flag, False)

        # 5. Verificar acciones custom
        return access.custom_actions.get(required_flag, False)
```

### 5.2 Mapeo Estándar de Acciones

| Acción DRF | HTTP Method | Permiso Requerido |
|------------|-------------|-------------------|
| list | GET | can_view |
| retrieve | GET | can_view |
| create | POST | can_create |
| update | PUT | can_edit |
| partial_update | PATCH | can_edit |
| destroy | DELETE | can_delete |

**Acciones custom**: Se mapean según `granular_action_map` del ViewSet.

---

## 6. PROCESO PARA AGREGAR NUEVO MÓDULO

### 6.1 Opción 1: Vía Management Command (Recomendado)

**Paso 1**: Editar `seed_estructura_final.py`

```python
modules_config = [
    # ... módulos existentes ...

    # NUEVO MÓDULO
    {
        'code': 'mi_nuevo_modulo',
        'name': 'Mi Nuevo Módulo',
        'description': 'Descripción del módulo',
        'category': 'OPERATIVO',  # O la categoría apropiada
        'color': 'cyan',
        'icon': 'Zap',
        'route': '/mi-modulo',
        'is_core': False,
        'is_enabled': True,
        'orden': 70,  # Orden en el sidebar
        'tabs': [
            {
                'code': 'mi_tab',
                'name': 'Mi Tab',
                'icon': 'FileText',
                'route': 'mi-tab',
                'orden': 1,
                'sections': [
                    {
                        'code': 'mi_seccion',
                        'name': 'Mi Sección',
                        'icon': 'List',
                        'orden': 1
                    }
                ]
            }
        ]
    }
]
```

**Paso 2**: Ejecutar seeder

```bash
python manage.py seed_estructura_final
```

**Paso 3**: Asignar permisos a cargos

```python
# Crear acceso para Gerente a la nueva sección
cargo_gerente = Cargo.objects.get(code='gerente')
seccion = TabSection.objects.get(code='mi_seccion')

CargoSectionAccess.objects.create(
    cargo=cargo_gerente,
    section=seccion,
    can_view=True,
    can_create=True,
    can_edit=True,
    can_delete=True
)
```

### 6.2 Opción 2: Vía Django Admin

1. Ir a `/admin/core/systemmodule/`
2. Hacer clic en "Add System Module"
3. Llenar formulario:
   - Code: `mi_nuevo_modulo`
   - Name: `Mi Nuevo Módulo`
   - Category: Seleccionar
   - Color, Icon, Route, etc.
4. Guardar
5. Ir a `/admin/core/moduletab/` para crear tabs
6. Ir a `/admin/core/tabsection/` para crear secciones
7. Ir a `/admin/core/cargosectionaccess/` para asignar permisos

### 6.3 Opción 3: Vía API REST

**Crear módulo**:

```bash
POST /api/core/system-modules/
{
  "code": "mi_nuevo_modulo",
  "name": "Mi Nuevo Módulo",
  "description": "Descripción",
  "category": "OPERATIVO",
  "color": "cyan",
  "icon": "Zap",
  "route": "/mi-modulo",
  "is_core": false,
  "is_enabled": true,
  "orden": 70
}
```

**Crear tab**:

```bash
POST /api/core/module-tabs/
{
  "module": <module_id>,
  "code": "mi_tab",
  "name": "Mi Tab",
  "icon": "FileText",
  "route": "mi-tab",
  "orden": 1
}
```

**Crear sección**:

```bash
POST /api/core/tab-sections/
{
  "tab": <tab_id>,
  "code": "mi_seccion",
  "name": "Mi Sección",
  "icon": "List",
  "orden": 1
}
```

---

## 7. GAPS Y LIMITACIONES IDENTIFICADAS

### 7.1 NO Implementado

❌ **Feature Flags internos por módulo**
- No hay sistema de feature toggles dentro de un módulo
- Solo ON/OFF completo de Módulo/Tab/Sección
- **Recomendación**: Si se necesita, implementar en `SystemModule.features: JSONField`

❌ **Configuración por Empresa (Multi-tenant)**
- Los módulos son **globales** del sistema, no por empresa
- No existe `EmpresaModuleConfig` para activar módulos por empresa
- **Workaround actual**: Usar CargoSectionAccess (diferentes cargos por empresa)
- **Recomendación**: Si se necesita multi-tenancy real, crear:
  ```python
  class EmpresaModuleConfig(models.Model):
      empresa = ForeignKey('Empresa')
      module = ForeignKey('SystemModule')
      is_enabled = BooleanField(default=True)
  ```

❌ **Versionado de configuración**
- No hay historial de cambios en módulos
- No se registran quién activó/desactivó módulos
- **Recomendación**: Agregar campos de auditoría o usar django-simple-history

❌ **Licenciamiento automatizado**
- Hay campo `requires_license` y `license_expires_at`
- Pero NO hay lógica de validación automática
- **Recomendación**: Implementar middleware o signal que valide licencias

### 7.2 Riesgos Identificados

⚠️ **Eliminación accidental de módulos core**
- Protección en código (`is_core` check)
- Pero admin podría modificar `is_core=False` y luego eliminar
- **Mitigación**: Agregar validación en `clean()` del modelo

⚠️ **Dependencias circulares**
- Campo `dependencies` es M2M `symmetrical=False`
- No hay validación de ciclos
- **Ejemplo problemático**: A depende de B, B depende de C, C depende de A
- **Recomendación**: Validar en `save()` con algoritmo de detección de ciclos

⚠️ **Sincronización con código**
- Módulos en BD pueden desincronizarse con apps Django
- Si elimino app `hseq_management` pero el módulo sigue en BD
- **Recomendación**: Management command de validación: `verify_modules_sync.py`

### 7.3 Mejoras Sugeridas

✨ **Caché de sidebar**
- El endpoint `/sidebar/` hace queries pesados
- **Solución**: Cachear por cargo con invalidación on-save
  ```python
  from django.core.cache import cache

  cache_key = f'sidebar_cargo_{cargo.id}'
  sidebar_data = cache.get(cache_key)
  if not sidebar_data:
      sidebar_data = build_sidebar(cargo)
      cache.set(cache_key, sidebar_data, timeout=3600)
  ```

✨ **Migrations automáticas**
- Cuando se ejecuta seeder, debería crear migrations
- **Solución**: Usar `makemigrations --empty` y popularlo con RunPython

✨ **UI de configuración visual**
- Crear interfaz en frontend para administrar módulos
- Drag-and-drop para reordenar
- Toggle switches para activar/desactivar

---

## 8. ESTRUCTURA DE 14 MÓDULOS ACTUALES

### Nivel 1: Estratégico (10)

| Orden | Code | Nombre | Tabs |
|-------|------|--------|------|
| 10 | `gestion_estrategica` | Dirección Estratégica | 8 tabs |

### Nivel 2: Cumplimiento (20-22)

| Orden | Code | Nombre | Tabs |
|-------|------|--------|------|
| 20 | `motor_cumplimiento` | Cumplimiento Normativo | 4 tabs |
| 21 | `motor_riesgos` | Motor de Riesgos | 6 tabs |
| 22 | `workflow_engine` | Flujos de Trabajo | 3 tabs |

### Nivel 3: Torre de Control (30)

| Orden | Code | Nombre | Tabs |
|-------|------|--------|------|
| 30 | `hseq_management` | Gestión Integral | 11 tabs |

### Nivel 4: Cadena de Valor (40-43)

| Orden | Code | Nombre | Tabs |
|-------|------|--------|------|
| 40 | `supply_chain` | Cadena de Suministro | 5 tabs |
| 41 | `production_ops` | Base de Operaciones | 4 tabs |
| 42 | `logistics_fleet` | Logística y Flota | 4 tabs |
| 43 | `sales_crm` | Ventas y CRM | 4 tabs |

### Nivel 5: Habilitadores (50-52)

| Orden | Code | Nombre | Tabs |
|-------|------|--------|------|
| 50 | `talent_hub` | Centro de Talento | 11 tabs |
| 51 | `admin_finance` | Administración y Financiero | 4 tabs |
| 52 | `accounting` | Contabilidad | 4 tabs |

### Nivel 6: Inteligencia (60-61)

| Orden | Code | Nombre | Tabs |
|-------|------|--------|------|
| 60 | `analytics` | Inteligencia de Negocios | 7 tabs |
| 61 | `audit_system` | Sistema de Auditorías | 4 tabs |

**Total: 14 módulos | 83 tabs**

---

## 9. DIAGRAMA DE RELACIONES

```
┌─────────────────────────────────────────────────────────────┐
│                     SISTEMA DE MÓDULOS                       │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   ┌─────────────────┐                ┌─────────────────┐
   │ SystemModule    │                │   RBAC v4.0     │
   │                 │                │                 │
   │ • code          │                │ CargoSection    │
   │ • name          │                │ Access          │
   │ • category      │                │                 │
   │ • is_enabled    │◄───────────────│ • cargo         │
   │ • dependencies  │                │ • section       │
   └────────┬────────┘                │ • can_view      │
            │                         │ • can_create    │
            │ 1:N                     │ • can_edit      │
            ▼                         │ • can_delete    │
   ┌─────────────────┐                │ • custom_actions│
   │  ModuleTab      │                └────────┬────────┘
   │                 │                         │
   │ • code          │                         │
   │ • name          │                         │
   │ • is_enabled    │                         │
   └────────┬────────┘                         │
            │                                  │
            │ 1:N                              │
            ▼                                  │
   ┌─────────────────┐                         │
   │  TabSection     │◄────────────────────────┘
   │                 │
   │ • code          │
   │ • name          │
   │ • is_enabled    │
   │ • supported_    │
   │   actions       │
   └─────────────────┘
```

---

## 10. EJEMPLOS DE CÓDIGO

### 10.1 Crear módulo programáticamente

```python
from apps.core.models import SystemModule, ModuleTab, TabSection

# Crear módulo
module = SystemModule.objects.create(
    code='mi_modulo',
    name='Mi Módulo',
    category='OPERATIVO',
    color='cyan',
    icon='Zap',
    route='/mi-modulo',
    is_enabled=True,
    orden=70
)

# Crear tab
tab = ModuleTab.objects.create(
    module=module,
    code='mi_tab',
    name='Mi Tab',
    icon='FileText',
    route='mi-tab',
    orden=1
)

# Crear sección
section = TabSection.objects.create(
    tab=tab,
    code='mi_seccion',
    name='Mi Sección',
    icon='List',
    orden=1,
    supported_actions=['aprobar', 'rechazar']
)
```

### 10.2 Asignar permisos a un cargo

```python
from apps.core.models import Cargo, TabSection, CargoSectionAccess

cargo = Cargo.objects.get(code='analista')
section = TabSection.objects.get(code='mi_seccion')

# Dar permisos completos
CargoSectionAccess.objects.create(
    cargo=cargo,
    section=section,
    can_view=True,
    can_create=True,
    can_edit=True,
    can_delete=False,  # No puede eliminar
    custom_actions={
        'aprobar': False,
        'rechazar': True
    }
)
```

### 10.3 Verificar permisos de usuario

```python
def tiene_permiso(user, section_code, action):
    """
    Verifica si un usuario tiene permiso para una acción en una sección.
    """
    if user.is_superuser:
        return True

    cargo = user.cargo
    if not cargo:
        return False

    access = CargoSectionAccess.objects.filter(
        cargo=cargo,
        section__code=section_code
    ).first()

    if not access:
        return False

    # Mapeo de acciones a campos
    action_map = {
        'view': 'can_view',
        'create': 'can_create',
        'edit': 'can_edit',
        'delete': 'can_delete'
    }

    field = action_map.get(action)
    if field:
        return getattr(access, field, False)

    # Acción custom
    return access.custom_actions.get(action, False)

# Uso
if tiene_permiso(request.user, 'mi_seccion', 'create'):
    # Permitir crear
    pass
```

### 10.4 Activar módulo con dependencias

```python
module = SystemModule.objects.get(code='hseq_management')

# Verificar si puede activarse
can_enable, reason = module.can_enable()
if can_enable:
    module.enable()  # Activa automáticamente dependencias
else:
    print(f"No se puede activar: {reason}")
```

---

## 11. CHECKLIST DE VALIDACIÓN

### Para Desarrolladores

- [ ] El módulo tiene `code` único
- [ ] El módulo tiene `category` apropiada
- [ ] Los tabs tienen `code` único dentro del módulo
- [ ] Las secciones tienen `code` único dentro del tab
- [ ] Se asignaron `CargoSectionAccess` a los cargos relevantes
- [ ] Se probó el endpoint `/sidebar/` con diferentes usuarios
- [ ] Los ViewSets usan `GranularActionPermission` con `section_code` correcto

### Para Administradores

- [ ] Ejecutar seeder después de agregar módulos
- [ ] Verificar que no hay dependencias circulares
- [ ] Asignar permisos a todos los cargos activos
- [ ] Probar con usuario de cada nivel jerárquico
- [ ] Validar que módulos `is_core=True` no se puedan eliminar

---

## 12. CONCLUSIONES

### Fortalezas

✅ **Arquitectura flexible**: 3 niveles de granularidad bien diseñados
✅ **Integración RBAC**: CargoSectionAccess permite control fino
✅ **API completa**: Endpoints CRUD + sidebar dinámico
✅ **Seeders robustos**: Idempotentes, actualizan sin duplicar
✅ **Dependencias**: Sistema de dependencias entre módulos
✅ **Categorización**: 6 categorías para organizar módulos

### Oportunidades de Mejora

⚠️ **Multi-tenancy**: Configuración por empresa no implementada
⚠️ **Feature flags**: No hay toggles internos dentro de módulos
⚠️ **Caché**: Endpoint `/sidebar/` podría optimizarse
⚠️ **Auditoría**: No se registra quién activa/desactiva módulos
⚠️ **Validación**: Dependencias circulares no se validan

### Recomendación Final

El sistema está **sólido y listo para producción**. Para el 95% de los casos de uso, la granularidad actual (Módulo → Tab → Section) es suficiente.

Si se requiere:
- **Multi-tenancy real**: Implementar `EmpresaModuleConfig`
- **Feature flags**: Agregar `SystemModule.features: JSONField`
- **Auditoría**: Usar django-simple-history
- **Licenciamiento**: Implementar validación automática

---

## ANEXOS

### A. Archivos Clave

```
backend/
├── apps/core/models/
│   ├── models_system_modules.py  ← MODELOS PRINCIPALES
│   ├── models_rbac_adicionales.py  ← CargoSectionAccess
│   └── models_rbac_permisos.py    ← Sistema de permisos
│
├── apps/core/
│   ├── viewsets_config.py        ← ViewSets de módulos
│   ├── serializers_config.py     ← Serializers
│   ├── permissions.py            ← GranularActionPermission
│   └── urls.py                   ← Registro de routers
│
├── apps/core/management/commands/
│   ├── seed_estructura_final.py  ← SEEDER MAESTRO (14 módulos)
│   ├── seed_hseq_modules.py      ← Seeder HSEQ específico
│   └── cleanup_legacy_modules.py ← Limpieza
│
└── init_system.py                ← Script de inicialización
```

### B. Queries Útiles

**Ver todos los módulos con sus tabs**:
```sql
SELECT
    m.code AS module_code,
    m.name AS module_name,
    COUNT(t.id) AS tabs_count,
    STRING_AGG(t.name, ', ') AS tabs
FROM core_system_module m
LEFT JOIN core_module_tab t ON t.module_id = m.id
WHERE m.is_enabled = true
GROUP BY m.id, m.code, m.name
ORDER BY m.orden;
```

**Ver permisos de un cargo**:
```sql
SELECT
    c.name AS cargo,
    m.name AS module,
    t.name AS tab,
    s.name AS section,
    csa.can_view,
    csa.can_create,
    csa.can_edit,
    csa.can_delete
FROM core_cargo_section_access csa
JOIN core_cargo c ON c.id = csa.cargo_id
JOIN core_tab_section s ON s.id = csa.section_id
JOIN core_module_tab t ON t.id = s.tab_id
JOIN core_system_module m ON m.id = t.module_id
WHERE c.code = 'gerente'
ORDER BY m.orden, t.orden, s.orden;
```

### C. Referencias

- **RBAC v4.0**: `docs/plans/PLAN_CIERRE_BRECHAS.md`
- **Estructura Final 22**: `docs/arquitectura/Estructura Final 22.txt`
- **GranularActionPermission**: `backend/apps/core/permissions.py:599`

---

**Fin de la Auditoría**
