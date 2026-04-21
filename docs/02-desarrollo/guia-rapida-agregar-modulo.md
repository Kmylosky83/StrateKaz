# Guía Rápida: Agregar Nuevo Módulo a StrateKaz

**Tiempo estimado**: 15-30 minutos
**Prerequisito**: Acceso al servidor Django

---

## 🎯 Objetivo

Agregar un nuevo módulo funcional al sistema StrateKaz con tabs, secciones y permisos asignados.

---

## 📋 Checklist Previo

Antes de comenzar, define:

- [ ] **Código del módulo** (ej: `gestion_rrhh`, `facturacion`)
- [ ] **Nombre visible** (ej: "Gestión de RRHH", "Facturación")
- [ ] **Categoría** (ESTRATEGICO, MOTOR, INTEGRAL, MISIONAL, APOYO, INTELIGENCIA)
- [ ] **Icono Lucide** (buscar en https://lucide.dev)
- [ ] **Color** (purple, blue, green, orange, red, gray, yellow, pink, indigo, teal)
- [ ] **Orden** (número para posición en sidebar)
- [ ] **Lista de Tabs** que tendrá el módulo
- [ ] **Lista de Secciones** por cada tab

---

## 🚀 Método Recomendado: Management Command

### Paso 1: Editar el Seeder

Abre el archivo:
```
backend/apps/core/management/commands/seed_estructura_final.py
```

Localiza el array `modules_config` (línea ~78) y **agrega tu módulo al final**:

```python
# En modules_config, después del último módulo existente:

{
    'code': 'mi_nuevo_modulo',  # ⚠️ ÚNICO en el sistema
    'name': 'Mi Nuevo Módulo',
    'description': 'Descripción breve de las funcionalidades',
    'category': 'OPERATIVO',  # Elegir una de las 6 categorías
    'color': 'cyan',           # Color para el sidebar
    'icon': 'Zap',            # Icono de Lucide
    'route': '/mi-modulo',    # Ruta en el frontend
    'is_core': False,         # True solo para módulos críticos
    'is_enabled': True,       # Activado por defecto
    'orden': 70,              # Orden en el sidebar (10-100+)
    'tabs': [
        {
            'code': 'configuracion',
            'name': 'Configuración',
            'icon': 'Settings',
            'route': 'configuracion',
            'orden': 1,
            'sections': [
                {
                    'code': 'general',
                    'name': 'General',
                    'icon': 'Sliders',
                    'orden': 1
                },
                {
                    'code': 'parametros',
                    'name': 'Parámetros',
                    'icon': 'Cog',
                    'orden': 2
                }
            ]
        },
        {
            'code': 'gestion',
            'name': 'Gestión',
            'icon': 'FolderOpen',
            'route': 'gestion',
            'orden': 2,
            'sections': [
                {
                    'code': 'listado',
                    'name': 'Listado',
                    'icon': 'List',
                    'orden': 1
                },
                {
                    'code': 'reportes',
                    'name': 'Reportes',
                    'icon': 'FileText',
                    'orden': 2
                }
            ]
        }
    ]
}
```

### Paso 2: Ejecutar el Seeder

```bash
# Entrar al contenedor Docker (si aplica)
docker exec -it backend bash

# Ejecutar el comando
python manage.py seed_estructura_final
```

**Salida esperada**:
```
================================================================================
  SEED ESTRUCTURA FINAL - ERP STRATEKAZ
  14 Módulos | 83 Tabs | Secciones | 6 Niveles
================================================================================

  [OK] [70] Mi Nuevo Módulo (CREADO)

================================================================================
  ESTRUCTURA FINAL CONFIGURADA
================================================================================

  ORDEN DEL SIDEBAR:
  --------------------------------------------------
  [10] Dirección Estratégica         (8 tabs)
  [20] Cumplimiento Normativo        (4 tabs)
  ...
  [70] Mi Nuevo Módulo               (2 tabs)
  --------------------------------------------------
  TOTAL: 15 módulos | 85 tabs | XXX secciones
================================================================================
```

### Paso 3: Asignar Permisos a Cargos

**Opción A: Vía Django Shell**

```bash
python manage.py shell
```

```python
from apps.core.models import Cargo, TabSection, CargoSectionAccess

# Obtener el cargo
cargo = Cargo.objects.get(code='gerente')  # O el cargo que necesites

# Obtener las secciones del nuevo módulo
sections = TabSection.objects.filter(
    tab__module__code='mi_nuevo_modulo'
)

# Asignar permisos completos a todas las secciones
for section in sections:
    CargoSectionAccess.objects.get_or_create(
        cargo=cargo,
        section=section,
        defaults={
            'can_view': True,
            'can_create': True,
            'can_edit': True,
            'can_delete': True,
            'custom_actions': {}
        }
    )

print(f"✅ Asignados permisos a {sections.count()} secciones")
```

**Opción B: Vía Admin**

1. Ir a `/admin/core/cargosectionaccess/`
2. Click en "Add Cargo Section Access"
3. Seleccionar:
   - **Cargo**: El cargo al que quieres dar acceso
   - **Section**: La sección del nuevo módulo
   - **Permisos**: Marcar can_view, can_create, etc.
4. Guardar
5. Repetir para cada sección y cada cargo

### Paso 4: Verificar en el Frontend

1. Cerrar sesión y volver a entrar (para refrescar permisos)
2. Verificar que el nuevo módulo aparece en el sidebar
3. Hacer clic en cada tab y sección para verificar acceso

**Endpoint de verificación**:
```bash
GET /api/core/system-modules/sidebar/
```

Deberías ver tu módulo en la respuesta JSON:
```json
[
  {
    "code": "mi_nuevo_modulo",
    "name": "Mi Nuevo Módulo",
    "icon": "Zap",
    "color": "cyan",
    "route": null,
    "is_category": false,
    "children": [
      {
        "code": "configuracion",
        "name": "Configuración",
        "icon": "Settings",
        "route": "/mi-modulo/configuracion",
        "sections": [...]
      }
    ]
  }
]
```

---

## 🔧 Método Alternativo: API REST

Si prefieres no modificar código Python, puedes usar la API:

### Paso 1: Crear el Módulo

```bash
POST /api/core/system-modules/
Authorization: Bearer <token>

{
  "code": "mi_nuevo_modulo",
  "name": "Mi Nuevo Módulo",
  "description": "Descripción del módulo",
  "category": "OPERATIVO",
  "color": "cyan",
  "icon": "Zap",
  "route": "/mi-modulo",
  "is_core": false,
  "is_enabled": true,
  "orden": 70
}
```

**Respuesta**:
```json
{
  "id": 123,
  "code": "mi_nuevo_modulo",
  ...
}
```

Guardar el `id` del módulo.

### Paso 2: Crear Tabs

```bash
POST /api/core/module-tabs/
Authorization: Bearer <token>

{
  "module": 123,
  "code": "configuracion",
  "name": "Configuración",
  "icon": "Settings",
  "route": "configuracion",
  "orden": 1
}
```

**Respuesta**:
```json
{
  "id": 456,
  "code": "configuracion",
  ...
}
```

Guardar el `id` del tab.

### Paso 3: Crear Secciones

```bash
POST /api/core/tab-sections/
Authorization: Bearer <token>

{
  "tab": 456,
  "code": "general",
  "name": "General",
  "icon": "Sliders",
  "orden": 1
}
```

**Respuesta**:
```json
{
  "id": 789,
  "code": "general",
  ...
}
```

### Paso 4: Asignar Permisos

```bash
POST /api/core/rbac/cargo-section-access/
Authorization: Bearer <token>

{
  "cargo": <cargo_id>,
  "section": 789,
  "can_view": true,
  "can_create": true,
  "can_edit": true,
  "can_delete": true,
  "custom_actions": {}
}
```

---

## 📊 Códigos de Categoría

Elige la categoría apropiada para tu módulo:

| Código | Nombre | Uso |
|--------|--------|-----|
| `ESTRATEGICO` | Nivel Estratégico | Planificación, identidad corporativa |
| `MOTOR` | Motores del Sistema | Riesgos, cumplimiento, workflows |
| `INTEGRAL` | Gestión Integral | HSEQ, calidad, SST |
| `MISIONAL` | Nivel Misional | Procesos core del negocio |
| `APOYO` | Nivel de Apoyo | RRHH, finanzas, contabilidad |
| `INTELIGENCIA` | Inteligencia de Negocio | BI, analytics, auditorías |

---

## 🎨 Códigos de Color

Colores disponibles del Design System:

| Código | Color | Uso Sugerido |
|--------|-------|--------------|
| `purple` | Púrpura | Estratégico, inteligencia |
| `blue` | Azul | General, configuración |
| `teal` | Verde azulado | Sistemas, motores |
| `green` | Verde | Finanzas, apoyo |
| `orange` | Naranja | Gestión integral |
| `cyan` | Cian | Logística, transporte |
| `yellow` | Amarillo | Alertas, advertencias |
| `red` | Rojo | Crítico, seguridad |
| `pink` | Rosa | CRM, ventas |
| `indigo` | Índigo | Analytics |
| `gray` | Gris | Utilidades |

---

## 🔍 Iconos Lucide Recomendados

Busca iconos en: https://lucide.dev

**Categorías comunes**:

- **Configuración**: Settings, Sliders, Cog, Wrench
- **Gestión**: FolderOpen, Files, List, Grid
- **Reportes**: FileText, BarChart, PieChart, TrendingUp
- **Usuarios**: Users, User, UserPlus
- **Documentos**: FileText, File, FolderTree
- **Finanzas**: DollarSign, Wallet, CreditCard
- **Logística**: Truck, Package, Send
- **Calidad**: Award, CheckCircle, ShieldCheck
- **Analytics**: BarChart3, LineChart, Activity

---

## ⚠️ Errores Comunes

### Error: "code must be unique"

**Causa**: Ya existe un módulo con ese código.

**Solución**:
```python
# Verificar módulos existentes
SystemModule.objects.values_list('code', flat=True)

# Cambiar el código a uno único
'code': 'mi_nuevo_modulo_v2'
```

### Error: "Section does not exist"

**Causa**: Intentando asignar permisos a sección inexistente.

**Solución**:
```python
# Verificar que la sección existe
TabSection.objects.filter(code='mi_seccion').exists()

# Si no existe, crearla primero
```

### No aparece en el sidebar

**Causas posibles**:
1. `is_enabled=False` en módulo, tab o sección
2. Usuario no tiene `CargoSectionAccess`
3. No refrescó la sesión (cerrar/abrir sesión)

**Solución**:
```python
# Verificar estado
module = SystemModule.objects.get(code='mi_nuevo_modulo')
print(f"Module enabled: {module.is_enabled}")

# Verificar permisos
cargo = user.cargo
access = CargoSectionAccess.objects.filter(
    cargo=cargo,
    section__tab__module=module
)
print(f"Accesos: {access.count()}")
```

---

## 📝 Notas Importantes

1. **Códigos únicos**: `code` debe ser único en cada nivel (módulo, tab, sección)
2. **Rutas**: Las rutas en `route` NO deben tener espacios, usar kebab-case
3. **Orden**: Los números de `orden` NO tienen que ser consecutivos (10, 20, 30...)
4. **is_core**: Solo marcar `True` para módulos críticos del sistema
5. **Permisos**: Sin `CargoSectionAccess`, el módulo NO aparecerá al usuario

---

## 🧪 Testing

Después de crear el módulo, probar:

```bash
# 1. Verificar creación
python manage.py shell
>>> from apps.core.models import SystemModule
>>> SystemModule.objects.filter(code='mi_nuevo_modulo').exists()
True

# 2. Verificar tabs
>>> module = SystemModule.objects.get(code='mi_nuevo_modulo')
>>> module.tabs.count()
2

# 3. Verificar secciones
>>> module.tabs.first().sections.count()
2

# 4. Verificar permisos
>>> from apps.core.models import CargoSectionAccess, Cargo
>>> cargo = Cargo.objects.first()
>>> CargoSectionAccess.objects.filter(
...     cargo=cargo,
...     section__tab__module=module
... ).count()
4  # (2 tabs x 2 secciones)
```

---

## 🎓 Ejemplo Completo: Módulo de Facturación

```python
{
    'code': 'facturacion',
    'name': 'Facturación Electrónica',
    'description': 'Generación, envío y gestión de facturas electrónicas DIAN',
    'category': 'APOYO',
    'color': 'green',
    'icon': 'FileText',
    'route': '/facturacion',
    'is_core': False,
    'is_enabled': True,
    'orden': 53,
    'tabs': [
        {
            'code': 'configuracion_fe',
            'name': 'Configuración FE',
            'icon': 'Settings',
            'route': 'configuracion',
            'orden': 1,
            'sections': [
                {'code': 'certificado_digital', 'name': 'Certificado Digital', 'icon': 'ShieldCheck', 'orden': 1},
                {'code': 'resolucion_dian', 'name': 'Resolución DIAN', 'icon': 'FileCheck', 'orden': 2},
                {'code': 'numeracion', 'name': 'Numeración', 'icon': 'Hash', 'orden': 3},
            ]
        },
        {
            'code': 'emision_facturas',
            'name': 'Emisión de Facturas',
            'icon': 'Send',
            'route': 'emision',
            'orden': 2,
            'sections': [
                {'code': 'nueva_factura', 'name': 'Nueva Factura', 'icon': 'FilePlus', 'orden': 1},
                {'code': 'facturas_emitidas', 'name': 'Facturas Emitidas', 'icon': 'FileText', 'orden': 2},
                {'code': 'notas_credito', 'name': 'Notas de Crédito', 'icon': 'FileX', 'orden': 3},
            ]
        },
        {
            'code': 'reportes_fe',
            'name': 'Reportes',
            'icon': 'BarChart',
            'route': 'reportes',
            'orden': 3,
            'sections': [
                {'code': 'ventas_periodo', 'name': 'Ventas por Período', 'icon': 'TrendingUp', 'orden': 1},
                {'code': 'estado_dian', 'name': 'Estado DIAN', 'icon': 'Activity', 'orden': 2},
            ]
        }
    ]
}
```

---

## 📚 Recursos Adicionales

- **Auditoría completa**: `docs/AUDITORIA_SISTEMA_MODULOS_BACKEND.md`
- **Diagramas de flujo**: `docs/DIAGRAMA_FLUJO_MODULOS.md`
- **Modelos Django**: `backend/apps/core/models/models_system_modules.py`
- **ViewSets**: `backend/apps/core/viewsets_config.py`
- **Permisos RBAC**: `backend/apps/core/permissions.py`

---

## ✅ Checklist Final

Antes de dar por terminado:

- [ ] Módulo creado con código único
- [ ] Tabs creados con rutas correctas
- [ ] Secciones creadas con iconos apropiados
- [ ] Permisos asignados a todos los cargos relevantes
- [ ] Probado acceso con usuario de cada cargo
- [ ] Verificado que aparece en `/sidebar/`
- [ ] Frontend muestra el módulo correctamente
- [ ] Documentación actualizada (si es módulo importante)

---

**¡Listo!** Tu nuevo módulo debería estar funcionando. 🎉
