# Diagrama de Flujo: Sistema de Módulos y RBAC

## 1. Flujo de Autorización de Usuario

```
┌──────────────────────────────────────────────────────────────────┐
│                  USUARIO HACE LOGIN                              │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ User.is_superuser? │
         └────┬────────┬────┘
              │        │
         YES  │        │ NO
              ▼        ▼
    ┌─────────────┐  ┌──────────────┐
    │ FULL ACCESS │  │ User.cargo? │
    │             │  └──┬───────┬───┘
    │ - Todos los │     │       │
    │   módulos   │  YES│       │ NO
    │ - Todos los │     ▼       ▼
    │   tabs      │  ┌────┐  ┌──────┐
    │ - Todas las │  │ OK │  │DENIED│
    │   secciones │  └──┬─┘  └──────┘
    └─────────────┘     │
                        ▼
              ┌─────────────────────┐
              │ CargoSectionAccess  │
              │ .filter(cargo=...)  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Obtener section_ids   │
              │ autorizados           │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Construir jerarquía:  │
              │                       │
              │ Sections → Tabs       │
              │ Tabs → Modules        │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Retornar SIDEBAR     │
              │ filtrado             │
              └──────────────────────┘
```

## 2. Flujo de Verificación de Permisos en ViewSet

```
┌──────────────────────────────────────────────────────────────────┐
│  REQUEST: POST /api/gestion-estrategica/politicas/              │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ GranularActionPermission     │
    │ .has_permission()            │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ User.is_superuser?   │
    └───┬──────────────┬───┘
        │              │
    YES │              │ NO
        ▼              ▼
    ┌───────┐   ┌──────────────────┐
    │ ALLOW │   │ Obtener:         │
    └───────┘   │ - section_code   │
                │ - action (POST)  │
                └────────┬─────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Mapear action → flag:    │
              │                           │
              │ POST    → can_create      │
              │ GET     → can_view        │
              │ PATCH   → can_edit        │
              │ DELETE  → can_delete      │
              │ custom  → granular_map    │
              └────────┬─────────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │ CargoSectionAccess       │
            │ .filter(                 │
            │   cargo=user.cargo,      │
            │   section__code=...      │
            │ )                        │
            └────────┬─────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ access.exists()?  │
          └───┬──────────┬────┘
              │          │
          YES │          │ NO
              ▼          ▼
    ┌─────────────────┐  ┌───────┐
    │ Verificar flag: │  │ DENY  │
    │                 │  └───────┘
    │ if can_create:  │
    │   ALLOW         │
    │ else:           │
    │   DENY          │
    └─────────────────┘
```

## 3. Flujo de Creación de Nuevo Módulo

```
┌──────────────────────────────────────────────────────────────────┐
│              OPCIÓN A: MANAGEMENT COMMAND                        │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────┐
    │ 1. Editar                      │
    │    seed_estructura_final.py    │
    │                                │
    │    modules_config.append({     │
    │      'code': 'mi_modulo',      │
    │      'name': 'Mi Módulo',      │
    │      'tabs': [...]             │
    │    })                          │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ 2. Ejecutar comando:           │
    │                                │
    │ python manage.py               │
    │   seed_estructura_final        │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ 3. El seeder:                  │
    │                                │
    │ - Crea SystemModule            │
    │ - Crea ModuleTabs              │
    │ - Crea TabSections             │
    │ - Actualiza si ya existen      │
    │ - Elimina obsoletos            │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ 4. Asignar permisos:           │
    │                                │
    │ CargoSectionAccess.objects     │
    │   .create(                     │
    │     cargo=...,                 │
    │     section=...,               │
    │     can_view=True,             │
    │     can_create=True            │
    │   )                            │
    └────────┬───────────────────────┘
             │
             ▼
         ┌───────┐
         │ LISTO │
         └───────┘

┌──────────────────────────────────────────────────────────────────┐
│                   OPCIÓN B: VÍA API REST                         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────┐
    │ 1. POST /api/core/             │
    │       system-modules/          │
    │                                │
    │ {                              │
    │   "code": "mi_modulo",         │
    │   "name": "Mi Módulo",         │
    │   "category": "OPERATIVO",     │
    │   "is_enabled": true           │
    │ }                              │
    └────────┬───────────────────────┘
             │
             ▼ (Retorna module_id)
    ┌────────────────────────────────┐
    │ 2. POST /api/core/             │
    │       module-tabs/             │
    │                                │
    │ {                              │
    │   "module": <module_id>,       │
    │   "code": "mi_tab",            │
    │   "name": "Mi Tab"             │
    │ }                              │
    └────────┬───────────────────────┘
             │
             ▼ (Retorna tab_id)
    ┌────────────────────────────────┐
    │ 3. POST /api/core/             │
    │       tab-sections/            │
    │                                │
    │ {                              │
    │   "tab": <tab_id>,             │
    │   "code": "mi_seccion",        │
    │   "name": "Mi Sección"         │
    │ }                              │
    └────────┬───────────────────────┘
             │
             ▼ (Retorna section_id)
    ┌────────────────────────────────┐
    │ 4. POST /api/core/rbac/        │
    │       cargo-section-access/    │
    │                                │
    │ {                              │
    │   "cargo": <cargo_id>,         │
    │   "section": <section_id>,     │
    │   "can_view": true,            │
    │   "can_create": true           │
    │ }                              │
    └────────┬───────────────────────┘
             │
             ▼
         ┌───────┐
         │ LISTO │
         └───────┘
```

## 4. Arquitectura de 3 Niveles

```
                 SISTEMA DE MÓDULOS
                 ==================

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  NIVEL 1: MÓDULO                                                │
│  ────────────────                                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SystemModule                                            │   │
│  │                                                         │   │
│  │ • code: "gestion_estrategica"                           │   │
│  │ • name: "Dirección Estratégica"                         │   │
│  │ • category: ESTRATEGICO                                 │   │
│  │ • is_enabled: True                                      │   │
│  │ • is_core: True                                         │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│                       │ 1:N                                     │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │                                                         │   │
│  │  NIVEL 2: TABS                                          │   │
│  │  ──────────────                                         │   │
│  │                                                         │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────┐ │   │
│  │  │ ModuleTab     │  │ ModuleTab     │  │ ModuleTab  │ │   │
│  │  │               │  │               │  │            │ │   │
│  │  │ "configuracion"│ │ "identidad"   │  │"planeacion"│ │   │
│  │  │ Configuración │  │ Identidad     │  │Planeación  │ │   │
│  │  │               │  │ Corporativa   │  │Estratégica │ │   │
│  │  └───────┬───────┘  └───────┬───────┘  └─────┬──────┘ │   │
│  │          │                  │                 │        │   │
│  │          │ 1:N              │ 1:N             │ 1:N    │   │
│  │  ┌───────▼───────┐  ┌───────▼────────────────▼──────┐ │   │
│  │  │               │  │                               │ │   │
│  │  │  NIVEL 3:     │  │  NIVEL 3: SECTIONS            │ │   │
│  │  │  SECTIONS     │  │  ──────────────               │ │   │
│  │  │               │  │                               │ │   │
│  │  │ ┌──────────┐  │  │ ┌───────────┐ ┌────────────┐ │ │   │
│  │  │ │TabSection│  │  │ │TabSection │ │ TabSection │ │ │   │
│  │  │ │          │  │  │ │           │ │            │ │ │   │
│  │  │ │"empresa" │  │  │ │"mision_   │ │"plan_      │ │ │   │
│  │  │ │Datos     │  │  │ │vision"    │ │estrategico"│ │ │   │
│  │  │ │Empresa   │  │  │ │Misión y   │ │Plan        │ │ │   │
│  │  │ │          │  │  │ │Visión     │ │Estratégico │ │ │   │
│  │  │ └──────────┘  │  │ └───────────┘ └────────────┘ │ │   │
│  │  │               │  │                               │ │   │
│  │  │ ┌──────────┐  │  │ ┌───────────┐                │ │   │
│  │  │ │TabSection│  │  │ │TabSection │                │ │   │
│  │  │ │          │  │  │ │           │                │ │   │
│  │  │ │"sedes"   │  │  │ │"valores"  │                │ │   │
│  │  │ │Sedes     │  │  │ │Valores    │                │ │   │
│  │  │ │          │  │  │ │Corp.      │                │ │   │
│  │  │ └──────────┘  │  │ └───────────┘                │ │   │
│  │  └───────────────┘  └───────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                           ▼ INTEGRACIÓN RBAC

┌─────────────────────────────────────────────────────────────────┐
│                  CargoSectionAccess                             │
│                  ──────────────────                             │
│                                                                 │
│  Cargo: "Gerente"                                               │
│  Section: "mision_vision"                                       │
│  ────────────────────────                                       │
│  ✓ can_view    = True                                           │
│  ✓ can_create  = True                                           │
│  ✓ can_edit    = True                                           │
│  ✗ can_delete  = False                                          │
│                                                                 │
│  custom_actions: {                                              │
│    "enviar": true,                                              │
│    "aprobar": true,                                             │
│    "publicar": false                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Flujo de Datos: Usuario → Sidebar

```
   ┌─────────┐
   │ USUARIO │
   └────┬────┘
        │
        │ GET /api/core/system-modules/sidebar/
        │
        ▼
┌────────────────────┐
│ SystemModuleViewSet│
│ .sidebar()         │
└────────┬───────────┘
         │
         ▼
    ┌────────────────┐
    │ is_superuser?  │
    └────┬───────┬───┘
         │       │
     YES │       │ NO
         │       │
         ▼       ▼
  ┌──────────┐  ┌─────────────────────────────┐
  │ Retornar │  │ 1. Obtener cargo del user    │
  │ FULL     │  └────────────┬────────────────┘
  │ SIDEBAR  │               │
  └──────────┘               ▼
                  ┌──────────────────────────────┐
                  │ 2. Query CargoSectionAccess: │
                  │                              │
                  │ sections = CSA.objects       │
                  │   .filter(cargo=user.cargo)  │
                  │   .values_list('section_id') │
                  └────────────┬─────────────────┘
                               │
                               ▼
                  ┌──────────────────────────────┐
                  │ 3. Obtener tabs de sections: │
                  │                              │
                  │ tabs = TabSection.objects    │
                  │   .filter(id__in=sections)   │
                  │   .values_list('tab_id')     │
                  └────────────┬─────────────────┘
                               │
                               ▼
                  ┌──────────────────────────────┐
                  │ 4. Obtener módulos de tabs:  │
                  │                              │
                  │ modules = ModuleTab.objects  │
                  │   .filter(id__in=tabs)       │
                  │   .values_list('module_id')  │
                  └────────────┬─────────────────┘
                               │
                               ▼
                  ┌──────────────────────────────┐
                  │ 5. Construir jerarquía:      │
                  │                              │
                  │ for module in modules:       │
                  │   for tab in module.tabs:    │
                  │     for section in sections: │
                  │       build_json()           │
                  └────────────┬─────────────────┘
                               │
                               ▼
                           ┌────────┐
                           │ RETURN │
                           │  JSON  │
                           └────────┘
```

## 6. Estados de Activación

```
   MÓDULO                TAB              SECCIÓN         RESULTADO
   ──────                ───              ───────         ─────────

   ✓ Enabled      →   ✓ Enabled    →   ✓ Enabled    →   ✅ VISIBLE
   ✓ Enabled      →   ✓ Enabled    →   ✗ Disabled   →   ❌ OCULTA
   ✓ Enabled      →   ✗ Disabled   →   ✓ Enabled    →   ❌ OCULTA
   ✗ Disabled     →   ✓ Enabled    →   ✓ Enabled    →   ❌ OCULTA

   ┌───────────────────────────────────────────────────────────┐
   │ REGLA: Una sección solo es visible si:                   │
   │                                                           │
   │ 1. El MÓDULO está enabled                                │
   │ 2. El TAB está enabled                                   │
   │ 3. La SECCIÓN está enabled                               │
   │ 4. El CARGO tiene CargoSectionAccess                     │
   │ 5. CargoSectionAccess.can_view = True                    │
   └───────────────────────────────────────────────────────────┘
```

## 7. Matriz de Decisión: Activar/Desactivar Módulo

```
┌──────────────────────────────────────────────────────────────────┐
│  ACCIÓN: module.disable()                                        │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │ is_core = True?  │
        └────┬─────────┬───┘
             │         │
         YES │         │ NO
             ▼         ▼
       ┌─────────┐  ┌────────────────────┐
       │ BLOQUEAR│  │ Hay dependientes?  │
       │         │  │                    │
       │ "Es     │  │ dependents.filter( │
       │ módulo  │  │   is_enabled=True) │
       │ core"   │  └────┬──────────┬────┘
       └─────────┘       │          │
                     YES │          │ NO
                         ▼          ▼
                   ┌─────────┐  ┌──────────┐
                   │ BLOQUEAR│  │ PERMITIR │
                   │         │  │          │
                   │ "Módulo │  │ Desactivar│
                   │  X, Y   │  │ módulo   │
                   │ dependen│  └──────────┘
                   │ de este"│
                   └─────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ACCIÓN: module.enable()                                         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Tiene dependencias?  │
        └────┬─────────────┬───┘
             │             │
         YES │             │ NO
             ▼             ▼
    ┌────────────────┐  ┌─────────────┐
    │ 1. Activar     │  │ Activar     │
    │    dependencias│  │ directamente│
    │                │  └─────────────┘
    │ for dep in     │
    │   dependencies:│
    │   dep.enable() │
    │                │
    │ 2. Activar self│
    └────────────────┘
```

## 8. Ejemplo Completo: Flujo de Request

```
┌─────────────────────────────────────────────────────────────────────┐
│ CASO: Usuario "Juan" (Cargo: Analista) intenta crear una política  │
└─────────────────────────────────────────────────────────────────────┘

    POST /api/gestion-estrategica/politicas/
    {
      "nombre": "Política de Calidad",
      "contenido": "..."
    }

                          │
                          ▼
    ┌──────────────────────────────────────────┐
    │ 1. Django recibe request                 │
    │    - User: Juan                          │
    │    - Cargo: Analista                     │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ 2. PoliticaViewSet.create()              │
    │    permission_classes = [                │
    │      GranularActionPermission            │
    │    ]                                     │
    │    section_code = 'politicas'            │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ 3. GranularActionPermission              │
    │    .has_permission(request, view)        │
    │                                          │
    │    - user = Juan                         │
    │    - section_code = 'politicas'          │
    │    - action = 'create'                   │
    │    - required_flag = 'can_create'        │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ 4. Query CargoSectionAccess:             │
    │                                          │
    │ SELECT * FROM cargo_section_access      │
    │ WHERE cargo_id = (                       │
    │   SELECT id FROM cargo                   │
    │   WHERE code = 'analista'                │
    │ )                                        │
    │ AND section_id = (                       │
    │   SELECT id FROM tab_section             │
    │   WHERE code = 'politicas'               │
    │ )                                        │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ 5. Resultado:                            │
    │                                          │
    │ CargoSectionAccess {                     │
    │   cargo: Analista,                       │
    │   section: politicas,                    │
    │   can_view: True,                        │
    │   can_create: TRUE ✓,                    │
    │   can_edit: False,                       │
    │   can_delete: False                      │
    │ }                                        │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ 6. Verificación:                         │
    │                                          │
    │ access.can_create == True                │
    │                                          │
    │ ✅ PERMITIR REQUEST                      │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ 7. ViewSet.create() ejecuta:             │
    │                                          │
    │ politica = Politica.objects.create(      │
    │   nombre="Política de Calidad",          │
    │   contenido="...",                       │
    │   created_by=request.user                │
    │ )                                        │
    │                                          │
    │ return Response(201 Created)             │
    └──────────────────────────────────────────┘
```

---

**Fin del Diagrama de Flujo**
