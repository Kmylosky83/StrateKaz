# Sub-bloque 7 — Infraestructura Transversal

**Fecha:** 2026-04-07
**Estado:** INVENTARIADO
**Alcance:** base_models, serializers_mixins, signals, tasks, validators, cache_utils, permissions, middleware (parcial), onboarding, management commands
**Inventario anterior de referencia:** `docs/inventory/L0-03-system-modules-sidebar.md`

---

## Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| LOC totales | **16,742** (producción 8,815 + seeds/commands 7,927) |
| Archivos en alcance | **42** (16 producción + 26 commands + __init__.py) |
| Modelos | **2** (UserOnboarding, UserPreferences) |
| Endpoints API | **4** (onboarding, dismiss, profile-completeness, health) |
| Tareas Celery | **16** (6 en beat schedule, 10 on-demand) |
| Signals | **11** (3 archivos: rbac_signals 5, rbac_cache_signals 5, user_lifecycle 3) |
| Management commands | **26** |
| Serializer mixins | **22** clases |
| Permission classes | **15** clases + 5 decoradores |
| Validators | **22** clases + 8 helpers |
| Tests directos | **0** |

---

## Mapa de archivos

### Producción activa (8,815 LOC)

| Archivo | LOC | Qué hace | Quién lo consume |
|---------|-----|----------|-----------------|
| `base_models/__init__.py` | 66 | Re-exporta abstract models + managers + get_tenant_empresa | Todos los módulos |
| `base_models/base.py` | 336 | 6 abstract models: Timestamped, SoftDelete, Audit, BaseCompanyModel, Hierarchical, Ordered | 57 archivos importan BaseCompanyModel |
| `base_models/managers.py` | 175 | SoftDeleteQuerySet, ActiveManager, AllObjectsManager, SoftDeleteManager | Indirecto via base models |
| `base_models/mixins.py` | 31 | `get_tenant_empresa()` — resuelve EmpresaConfig del schema actual | **68 archivos** (el más importado del codebase) |
| `serializers_mixins.py` | 1,419 | 22 mixins para serializers (audit, firma, archivos, timestamps, status) | **0 archivos externos** |
| `signals/__init__.py` | 8 | Docstring del paquete | — |
| `signals/rbac_signals.py` | 444 | 5 signals: propagar permisos al crear Section/Cargo, invalidar cache, propagar nivel_firma | RBAC (Sub-bloque 2) |
| `signals/rbac_cache_signals.py` | 187 | 5 signals: invalidar cache RBAC cuando cambia cargo/rol/grupo | RBAC (Sub-bloque 2) |
| `signals/user_lifecycle_signals.py` | 320 | 3 signals: auto-crear TenantUser, llenar vacante, enviar email bienvenida | User lifecycle |
| `tasks.py` | 1,588 | 16 tareas Celery: 6 email, 2 stubs, 2 tests, 6 periódicas | Beat schedule + signals |
| `validators.py` | 1,378 | 22 validadores + 8 helpers: unicidad, formato, colombianos, fechas, numéricos | 55 archivos (via modelo validators=[]) |
| `cache_utils.py` | 329 | Decoradores y helpers para cache Redis: generate_key, cache_queryset, invalidate | **0 archivos externos** |
| `permissions.py` | 908 | 15 clases de permiso + 5 decoradores: GranularActionPermission, RequirePermission, etc. | 29 archivos importan GranularActionPermission |
| `services/onboarding_service.py` | 653 | OnboardingService: calcula perfil, pasos, cache Redis 5min | onboarding_views, tasks |
| `views/onboarding_views.py` | 638 | 3 vistas: OnboardingView, OnboardingDismissView, ProfileCompletenessView | urls.py |
| `models/models_onboarding.py` | 210 | UserOnboarding + signal auto_create + _resolve_onboarding_type | OnboardingService |
| `models/models_user_preferences.py` | 125 | UserPreferences (idioma, timezone, formato fecha) | 2FA views, profile |

### Seeds / Management commands (7,927 LOC)

| Comando | LOC | Qué siembra | Frecuencia |
|---------|-----|-------------|------------|
| `seed_estructura_final.py` | 1,398 | SystemModule + ModuleTab + TabSection (estructura completa del sidebar) | 1 vez por tenant |
| `seed_riesgos_ocupacionales.py` | 872 | Riesgos SST por cargo (catálogo GTC 45) | 1 vez |
| `seed_permisos_rbac.py` | 505 | Permisos base del sistema RBAC | 1 vez |
| `seed_cargos_base.py` | 463 | Cargos base del organigrama | 1 vez |
| `init_roles_sugeridos.py` | 438 | Roles sugeridos con permisos predefinidos | 1 vez |
| `init_rbac.py` | 432 | Inicializa RBAC completo (cargos + permisos + templates) | 1 vez |
| `seed_nivel2_modules.py` | 363 | Módulos C2 (supply chain, HSEQ, etc.) | 1 vez |
| `migrate_media_paths.py` | 329 | Migra paths de media a nuevo esquema tenant | 1 vez (migración) |
| `seed_rbac_templates.py` | 321 | Templates de permisos RBAC | 1 vez |
| `seed_hseq_modules.py` | 227 | Módulos HSEQ específicos | 1 vez |
| `apply_permission_template.py` | 222 | Aplica un template de permisos a un cargo | N veces (admin) |
| `deploy_seeds_all_tenants.py` | 203 | Ejecuta seeds en todos los tenants | N veces (deploy) |
| `verify_hseq_modules.py` | 194 | Verifica integridad de módulos HSEQ | N veces (debug) |
| `sync_permissions.py` | 178 | Sincroniza permisos entre código y DB | N veces (deploy) |
| `bootstrap_onboarding.py` | 138 | Inicializa datos de onboarding | 1 vez |
| `fix_cargo_is_system.py` | 127 | Fix de campo is_system en cargos | 1 vez (migración) |
| `update_section_descriptions.py` | 125 | Actualiza descripciones de secciones | N veces |
| `cleanup_legacy_modules.py` | 102 | Limpia módulos legacy no usados | 1 vez |
| `setup_demo_data.py` | 93 | Datos de demostración para tenant demo | 1 vez |
| `update_hseq_icon.py` | 89 | Actualiza iconos de módulos HSEQ | 1 vez |
| `seed_org_templates.py` | 77 | Templates de estructura organizacional | 1 vez |
| `fix_cargo_codes.py` | 64 | Fix de códigos de cargo duplicados | 1 vez (migración) |
| `crear_cargos_modulos.py` | 64 | Crea cargos y vincula con módulos | 1 vez |
| `health_check.py` | 615 | Health check del sistema (DB, Redis, disk, Celery) | N veces (CLI) |
| `wait_for_db.py` | 51 | Espera a que PostgreSQL esté disponible (Docker) | N veces (boot) |
| `migrate_rbac_v4.py` | 237 | Migración de RBAC v3 a v4 | 1 vez (migración) |

---

## Componentes principales

### 1. Base models heredables

**Archivo:** `base_models/base.py` (336 LOC)

**Jerarquía de herencia:**

```
models.Model
├── TimestampedModel (created_at, updated_at)
│   └── AuditModel (+ created_by, updated_by)
│       └── BaseCompanyModel (+ empresa FK, + SoftDeleteModel)
├── SoftDeleteModel (is_active, deleted_at, soft_delete(), restore())
├── HierarchicalModel (parent, level, path, get_ancestors/descendants)
└── OrderedModel (orden, move_up/move_down)
```

**BaseCompanyModel** es el modelo base de toda la cascada. Combina:
- Timestamps automáticos (created_at, updated_at)
- Auditoría de usuario (created_by, updated_by con PROTECT)
- Soft delete (is_active, deleted_at)
- FK a EmpresaConfig (empresa, nullable para migración secuencial)
- 3 índices compuestos (empresa+is_active+created_at, empresa+updated_at, empresa+deleted_at)

**Consumidores:** 57 archivos importan BaseCompanyModel. Es el modelo base de todos los modelos C1, CT, C2.

**Managers** (`managers.py`, 175 LOC):
- `SoftDeleteQuerySet`: Override de `delete()` → soft delete, `hard_delete()` para eliminación real
- `ActiveManager`: Default manager, solo retorna registros activos
- `AllObjectsManager`: Retorna todo incluyendo eliminados
- `SoftDeleteManager`: Combina ambos con `all_with_deleted()` y `deleted_only()`

**`get_tenant_empresa()`** (`mixins.py`, 31 LOC): Resuelve EmpresaConfig del schema actual sin necesitar `request.user.empresa`. Auto-crea si no existe. **68 archivos** lo usan — es la función más importada del codebase.

### 2. Serializer mixins

**Archivo:** `serializers_mixins.py` (1,419 LOC, 22 clases)

| Mixin | Qué provee |
|-------|-----------|
| `UserDisplayMixin` | `get_user_display_name()`, `get_user_info()`, `get_user_initials()` |
| `CreatedByMixin` | `get_created_by_name()`, `get_created_by_info()` |
| `UpdatedByMixin` | `get_updated_by_name()`, `get_updated_by_info()` |
| `AuditFieldsMixin` | Combina CreatedBy + UpdatedBy |
| `SignatureFieldsMixin` | `get_signed_by_name()`, `get_firmante_name()`, `get_signature_info()` |
| `ResponsibleFieldsMixin` | `get_responsible_name()`, `get_responsible_cargo_name()` |
| `ApprovalFieldsMixin` | `get_approved_by_name()`, `get_approval_info()` |
| `DocumentReviewFieldsMixin` | `get_elaborado_por_nombre()`, `get_revisado_por_nombre()`, `get_aprobado_por_nombre()` |
| `ManagerFieldsMixin` | `get_manager_name()`, `get_gerente_name()` |
| `FileUrlMixin` | `build_absolute_url()`, `build_file_info()` |
| `AutoUserAssignMixin` | Auto-asigna created_by/updated_by en create()/update() |
| `AreaFieldsMixin` | `get_area_name()`, `get_parent_area_name()` |
| `CargoFieldsMixin` | `get_cargo_name()`, `get_cargo_info()` |
| `FullAuditMixin` | Combina Audit + Responsible + Approval |
| `CommonListFieldsMixin` | `get_is_active_display()`, `get_status_badge()` |
| `SoftDeleteMixin` | `get_is_deleted()`, `get_deleted_info()` |
| `UserListInfoMixin` | `get_users_list_info()`, `get_users_count()` para M2M |
| `NormaISOFieldsMixin` | `get_norma_iso_code()`, `get_norma_iso_name()` |
| `TimestampMixin` | `format_datetime_iso()`, `format_date_readable()`, `get_relative_time()` |
| `StatusDisplayMixin` | `get_status_with_color()` con 28 estados predefinidos |
| `EmpresaFieldsMixin` | `get_empresa_name()`, `get_empresa_id()` |
| `BaseSerializerMixin` | Combina Audit + FileUrl + Timestamp + SoftDelete + CommonList |

### 3. Signals

**3 archivos, 11 signals totales:**

#### rbac_signals.py (444 LOC, 5 signals)

| Signal | Modelo que escucha | Qué dispara |
|--------|-------------------|-------------|
| `propagate_section_to_cargos` | TabSection (post_save, created) | Crea CargoSectionAccess para todos los cargos activos con permisos según nivel jerárquico |
| `cleanup_section_accesses` | TabSection (pre_delete) | Elimina CargoSectionAccess huérfanos |
| `initialize_cargo_permissions` | Cargo (post_save, created) | Hereda permisos de plantilla o crea defaults |
| `invalidate_cache_on_access_change` | CargoSectionAccess (post_save) | Invalida cache de permisos del cargo |
| `invalidate_cache_on_access_delete` | CargoSectionAccess (post_delete) | Invalida cache de permisos del cargo |
| `propagate_nivel_firma_on_cargo_change` | Cargo (post_save, update) | Propaga nivel_firma a usuarios del cargo |

**Signal "mágico" conocido:** `propagate_section_to_cargos` — al crear una TabSection, auto-crea CargoSectionAccess para todos los cargos existentes. Documentado en Sub-bloque 3.

#### rbac_cache_signals.py (187 LOC, 5 signals)

| Signal | Modelo que escucha | Qué dispara |
|--------|-------------------|-------------|
| `invalidate_cache_on_user_cargo_change` | User (post_save, cargo change) | Invalida cache RBAC + onboarding del user |
| `invalidate_cache_on_rol_adicional_change` | UserRolAdicional (post_save/delete) | Invalida cache RBAC del user |
| `invalidate_cache_on_user_group_change` | UserGroup (post_save/delete) | Invalida cache RBAC del user |
| `invalidate_cache_on_group_section_change` | GroupSectionAccess (post_save/delete) | Invalida cache de todos los users del grupo |
| `invalidate_cache_on_rol_section_change` | RolAdicionalSectionAccess (post_save/delete) | Invalida cache de todos los users con ese rol |

#### user_lifecycle_signals.py (320 LOC, 3 signals)

| Signal | Modelo que escucha | Qué dispara |
|--------|-------------------|-------------|
| `auto_create_tenant_user` | User (post_save, created) | Crea TenantUser + TenantUserAccess en schema public |
| `auto_fill_vacancy_on_user_created` | User (post_save, created) | Incrementa posiciones_cubiertas en VacanteActiva |
| `send_welcome_email_on_user_created` | User (post_save, created) | Envía email de bienvenida vía Celery (si no tiene password_setup_token) |

**Signal cruzado con C2:** `auto_fill_vacancy_on_user_created` importa dinámicamente `VacanteActiva` de `mi_equipo.seleccion_contratacion`. Usa `try/except ImportError` para protegerse si el módulo no está instalado.

### 4. Tasks Celery (tasks.py, 1,588 LOC)

**16 tareas totales:**

#### Tareas periódicas (6, en celery beat)

| Tarea | Qué hace | Frecuencia | Cola |
|-------|----------|------------|------|
| `cleanup_temp_files` | Limpia archivos temporales >24h | Diario 2 AM | maintenance |
| `send_weekly_reports` | Envía reportes semanales a admins por tenant | Lunes 8 AM | reports |
| `backup_database` | pg_dump + limpieza backups >7 días | Cada 6h | maintenance |
| `system_health_check` | Verifica DB, Redis, disco, Celery, tenants | Cada 15 min | monitoring |
| `check_pending_activations` | Recuerda activaciones pendientes, notifica admins de tokens expirados | Cada 12h | notifications |
| `check_incomplete_profiles` | Recuerda usuarios con <80% perfil | Diario 10 AM | notifications |

#### Tareas on-demand (8, llamadas por signals/views)

| Tarea | Qué hace | Cola |
|-------|----------|------|
| `send_email_async` | Envío genérico de email (texto + HTML) | emails |
| `send_welcome_email_task` | Email de bienvenida a empleado nuevo | emails |
| `send_setup_password_email_task` | Email con link de setup de contraseña | emails |
| `send_new_access_email_task` | Email "nuevo acceso" para multi-tenant | emails |
| `notify_admin_password_sync_failure` | Alerta admin si falla sync password TenantUser | emails |
| `send_notification_email` | Email de notificación con template en contexto tenant | emails |
| `generate_report_async` | **STUB** — no genera PDF real | reports |
| `process_file_upload` | **STUB** — no procesa archivos real | files |

#### Tareas de prueba (2)

| Tarea | Qué hace |
|-------|----------|
| `example_task` | No-op de ejemplo |
| `long_running_task` | Simula tarea larga con sleep |

### 5. Validators (validators.py, 1,378 LOC)

**22 clases + 8 helpers, agrupados en 12 categorías:**

| Categoría | Validadores | Consumidores |
|-----------|-------------|-------------|
| Unicidad | `UniqueCodeValidator`, `UniqueFieldValidator` | Serializers de todos los módulos |
| Formato | `HexColorValidator`, `PhoneNumberValidator`, `NITColombiaValidator` | Modelos y serializers |
| Fecha | `DateRangeValidator`, `FutureDateValidator`, `PastDateValidator` | Serializers con rangos |
| Confirmación | `ConfirmationValidator` | Acciones críticas (firma, aprobación) |
| Password | `PasswordStrengthValidator`, `PasswordMatchValidator` | Auth flows |
| Geográfico | `CoordinatesValidator` | Sedes, ubicaciones |
| Listas | `NonEmptyListValidator`, `IDsExistValidator`, `UniqueListValidator` | Serializers con arrays |
| Texto | `NoWhitespaceValidator`, `MinMaxLengthValidator` | Campos de texto |
| Numérico | `PositiveNumberValidator`, `RangeValidator` | Campos numéricos |
| Compuesto | `DifferentFieldsValidator`, `UniqueTogetherValidator`, `ActiveRelationValidator`, `RequiredIfValidator`, `DisjointListsValidator`, `AtLeastOneRequiredValidator`, `UniquePrincipalValidator`, `SystemRoleProtectionValidator`, `NoSelfReferenceValidator` | Cross-field en serializers |
| Certificación | `CertificationValidator` | Módulos con certificaciones |

**Consumidores reales:** 55 archivos referencian `core.validators` (mayormente en `validators=[]` de campos de modelo Django, no como imports directos de Python).

### 6. Cache utils (cache_utils.py, 329 LOC)

**10 funciones/decoradores exportados:**

| Función | Qué hace |
|---------|----------|
| `generate_cache_key(prefix, *args, **kwargs)` | Genera clave Redis con hash MD5 si >250 chars |
| `cache_queryset(prefix, timeout)` | Decorador: cachea resultado de QuerySet |
| `cache_serializer_data(prefix, timeout)` | Decorador: cachea datos serializados |
| `invalidate_cache(prefix, *args, **kwargs)` | Invalida una clave específica |
| `invalidate_cache_pattern(pattern)` | Invalida claves por patrón (requiere django-redis) |
| `get_or_set_cache(key, callable, timeout)` | Get-or-compute pattern |
| `cache_catalogo(catalog_name, timeout)` | Decorador específico para catálogos (timeout 2h) |
| `cache_empresa_data(empresa_id, data_type, timeout)` | Cachea datos por empresa |
| `invalidate_empresa_cache(empresa_id, data_type)` | Invalida cache de una empresa |
| `cache_list_view(viewset_name, timeout)` | Decorador para list() de ViewSets |

**Consumidores externos: 0.** Ningún archivo fuera de cache_utils.py importa estas funciones. La invalidación de cache real se hace desde `PermissionCacheService` (Sub-bloque 2), no desde cache_utils.

### 7. Permissions (permissions.py, 908 LOC)

**15 clases de permiso:**

| Clase | Uso principal |
|-------|--------------|
| `CanManageUsers` | Nivel 2+ para CRUD de usuarios |
| `IsOwnerOrAdmin` | Propietario del objeto o admin |
| `IsActiveUser` | Usuario activo y no soft-deleted |
| `CanViewUsers` | Cualquier usuario autenticado |
| `HasModulePermission` | Permiso por código de módulo |
| `IsSuperAdmin` | Solo superadmin (TenantUser o User) |
| `CanManageCargos` | Solo superadmin para CRUD cargos |
| `CanManagePermissions` | Solo superadmin para CRUD permisos |
| `RequirePermission` | Permiso genérico por código (con permission_map por acción) |
| `RequireAnyPermission` | Al menos uno de N permisos |
| `RequireAllPermissions` | Todos los N permisos |
| `RequireRole` | Requiere rol específico |
| `RequireCargo` | Requiere cargo específico |
| `RequireGroup` | Requiere pertenencia a grupo |
| `RequireCargoLevel` | Requiere nivel jerárquico mínimo |

**Permisos RBAC avanzados (4 clases):**

| Clase | Uso principal |
|-------|--------------|
| `RequireSectionAccess` | Acceso por CargoSectionAccess (sección) |
| `RequireCRUDPermission` | CRUD por CargoPermiso (módulo.recurso.acción) |
| `RequireSectionAndCRUD` | Combina sección + CRUD |
| `GranularActionPermission` | **El más usado (29 archivos)**: can_view/create/edit/delete por sección, usa CombinedPermissionService |

**5 decoradores para vistas basadas en funciones:** `require_permission`, `require_any_permission`, `require_role`, `require_cargo`, `require_level`

### 8. Middleware del sub-bloque

**Nota:** Del directorio `middleware/`, solo `__init__.py` pertenece al sub-bloque 7 como re-exportador. Los middleware concretos pertenecen a otros sub-bloques:
- `module_access.py` → Sub-bloque 3 (ya consolidado)
- `impersonation_audit.py` → Sub-bloque 5
- `security.py` → Sub-bloque 5

El `__init__.py` (10 LOC) re-exporta: `SecurityMiddleware`, `IPBlockMiddleware`, `ModuleAccessMiddleware`, `ImpersonationAuditMiddleware`.

**En MIDDLEWARE setting de base.py:**
- Posición 14: `ImpersonationAuditMiddleware`
- Posición 15: `ModuleAccessMiddleware`

No hay middleware propio del sub-bloque 7 — solo es re-exportador.

### 9. Onboarding (service + views + modelos)

**Modelos:**

**UserOnboarding** (`models_onboarding.py`, 210 LOC):
- `user` (OneToOne → User)
- `onboarding_type` (admin/jefe/empleado/proveedor/cliente)
- Campos calculados: `has_photo`, `has_firma`, `has_emergencia`, `profile_percentage`, `steps_completed` (JSON)
- Control: `completado_at`, `dismissed`, `last_reminder_sent`
- Signal `auto_create_user_onboarding`: crea automáticamente al crear User
- `_resolve_onboarding_type()`: determina tipo según cargo/rol (admin, jefe, empleado, proveedor, cliente, contratista)

**UserPreferences** (`models_user_preferences.py`, 125 LOC):
- `user` (OneToOne → User, primary_key=True)
- `language` (es/en, default es)
- `timezone` (default America/Bogota)
- `date_format` (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- No hereda TenantModel (vive en el schema del tenant pero sin soft delete ni auditoría)

**Endpoints:**

| Endpoint | Método | Permiso | Qué hace |
|----------|--------|---------|----------|
| `/api/core/onboarding/` | GET | IsAuthenticated | Pasos + progreso del usuario autenticado |
| `/api/core/onboarding/dismiss/` | POST | IsAuthenticated | Descarta widget de onboarding |
| `/api/core/profile-completeness/` | GET | IsAuthenticated | Porcentaje de perfil + campos faltantes |

**OnboardingService** (`onboarding_service.py`, 653 LOC):
- `compute(user)`: Calcula perfil ponderado (10 campos con pesos), determina pasos según tipo, guarda en UserOnboarding, cachea 5 min
- `invalidate_cache(user_id)`: Elimina entrada Redis
- `get_steps_definition(type)`: Definición estática de pasos por tipo de onboarding
- Ponderación: foto 10%, firma 15%, emergencia 15%, email 10%, celular 10%, dirección 10%, ciudad 5%, nombre 10%, documento 15%
- Accede a modelos de C2 vía `apps.get_model()` (respeta independencia)

### 10. Seeds (management commands, 7,927 LOC)

| Tipo | Comandos | LOC | Ejecución |
|------|----------|-----|-----------|
| Estructura sidebar | `seed_estructura_final` | 1,398 | 1 vez por tenant |
| RBAC | `seed_permisos_rbac`, `init_rbac`, `seed_rbac_templates`, `init_roles_sugeridos`, `apply_permission_template`, `sync_permissions` | 2,096 | 1 vez + N veces admin |
| Cargos | `seed_cargos_base`, `fix_cargo_codes`, `fix_cargo_is_system`, `crear_cargos_modulos` | 718 | 1 vez |
| Módulos | `seed_hseq_modules`, `seed_nivel2_modules`, `update_hseq_icon`, `update_section_descriptions`, `verify_hseq_modules` | 998 | 1 vez |
| Riesgos SST | `seed_riesgos_ocupacionales` | 872 | 1 vez |
| Onboarding | `bootstrap_onboarding`, `seed_org_templates` | 215 | 1 vez |
| Deploy | `deploy_seeds_all_tenants`, `wait_for_db` | 254 | N veces |
| Migraciones | `migrate_media_paths`, `migrate_rbac_v4`, `cleanup_legacy_modules` | 668 | 1 vez |
| Health | `health_check` | 615 | N veces |
| Demo | `setup_demo_data` | 93 | 1 vez |

**Comando orquestador:** `deploy_seeds_all_tenants` itera sobre todos los tenants y ejecuta una secuencia de seeds dentro de cada schema.

---

## Dependencias

### Qué consume el sub-bloque 7 de otros sub-bloques

| De dónde | Qué importa | Para qué |
|----------|-------------|----------|
| Sub-bloque 4 (User/Cargo) | `User`, `Cargo` | Signals del lifecycle, propagar permisos, onboarding |
| Sub-bloque 2 (RBAC) | `CargoSectionAccess`, `TabSection`, `PermissionCacheService` | Signals de propagación y cache |
| L10 (Configuración) | `EmpresaConfig` | FK en BaseCompanyModel, `get_tenant_empresa()` |
| L20 (Mi Equipo) | `VacanteActiva` | Signal `auto_fill_vacancy` (import dinámico) |
| Tenant (C0) | `TenantUser`, `TenantUserAccess`, `Tenant` | Signal `auto_create_tenant_user` |

### Qué consumen otros sub-bloques del 7

| Consumidor | Qué importa | Archivos |
|------------|-------------|----------|
| **Toda la cascada** | `BaseCompanyModel` | 57 archivos |
| **Toda la cascada** | `get_tenant_empresa()` | 68 archivos |
| **Todos los ViewSets** | `GranularActionPermission` | 29 archivos |
| **55 modelos** | Validadores (via `validators=[]`) | 55 archivos |
| Signals de RBAC | `PermissionCacheService` | Cache signals |

---

## Hallazgos preliminares

### Código posiblemente muerto

1. **`serializers_mixins.py` (1,419 LOC) — 0 consumidores externos.** Ningún archivo fuera del propio módulo importa estos mixins. Grep por los nombres de clase individuales (`AuditFieldsMixin`, `UserDisplayMixin`, `FileUrlMixin`, etc.) tampoco encuentra consumidores fuera de `serializers_mixins.py`. Este es el archivo más grande del sub-bloque sin ningún consumidor.

2. **`cache_utils.py` (329 LOC) — 0 consumidores externos.** Ningún archivo importa las funciones/decoradores de cache_utils. La invalidación de cache real se hace vía `PermissionCacheService` (Sub-bloque 2) que usa `django.core.cache` directamente.

3. **`generate_report_async` task — STUB.** La tarea existe (464-) pero el body no genera ningún PDF real. Solo crea un string de filename.

4. **`process_file_upload` task — STUB.** La tarea existe (576-) pero el body es un esqueleto con comentarios describiendo lógica futura.

5. **`example_task` y `long_running_task` — tareas de prueba.** No se usan en producción. Solo servían para verificar que Celery funciona.

### Funciones gigantes (>100 líneas)

6. **`check_pending_activations` (177 líneas, tasks.py):** Itera sobre todos los tenants, busca usuarios con activación pendiente, envía email + notificación in-app, notifica admins de tokens expirados. Lógica compleja pero correcta.

7. **`check_incomplete_profiles` (156 líneas, tasks.py):** Similar patrón multi-tenant. Refresca perfil, envía recordatorio si <80%.

8. **`backup_database` (108 líneas, tasks.py):** Ejecuta pg_dump con error handling, limpia backups >7 días, alerta si falla.

9. **`health_check.py` management command (615 LOC):** El management command más grande. Verifica DB, Redis, disco, Celery, schemas tenant. Podría ser un servicio aparte.

### Code smells

10. **`except Exception` silenciosos (2 en tasks.py, 2 en base_models/base.py):** Las líneas 1189 y 1276 de tasks.py hacen `except Exception: pass` al buscar `TipoNotificacion`. Las líneas 307 y 324 de base.py hacen `except Exception: pass` en `move_up()` y `move_down()` de OrderedModel.

11. **`UserPreferences` no hereda de TenantModel.** Es el único modelo del sub-bloque que hereda de `models.Model` puro, sin soft delete ni auditoría. UserOnboarding sí hereda de TenantModel.

### Duplicaciones

12. **Patrón multi-tenant repetido en tasks.py:** `check_pending_activations` y `check_incomplete_profiles` repiten el mismo patrón de iteración sobre tenants con `schema_context`. Podría extraerse a un decorator/helper.

13. **Las clases de permiso CanManageUsers, CanManageCargos, CanManagePermissions son casi idénticas.** Solo difieren en el nivel requerido y el mensaje de error.

### Observaciones arquitecturales

14. **`serializers_mixins.py` fue construido para un futuro que no llegó.** 22 mixins listos para ser consumidos por la serializer factory (aún no implementada). Cuando la factory se implemente, este archivo será su base. Por ahora es "infraestructura sin consumidores" — no está muerto, está adelantado.

15. **`cache_utils.py` tiene el mismo problema.** Fue diseñado como framework de caching genérico, pero el caching real se implementó directamente en `PermissionCacheService`. Cuando se implemente caching en serializers/viewsets, cache_utils sería la herramienta natural.

16. **Los signals de user_lifecycle tienen una dependencia cruzada con C2 (mi_equipo).** `auto_fill_vacancy` importa dinámicamente de `seleccion_contratacion`. Está protegido con try/except ImportError, pero rompe la regla de que infraestructura transversal no debe importar de C2.

17. **validators.py se usa masivamente pero como referencia de modelo (validators=[]), no como import Python directo.** El grep por `from apps.core.validators import` encuentra 1 archivo, pero el grep por `core.validators` encuentra 55 — porque Django lo referencia como string en migraciones.

---

## Tests existentes

**0 tests directos cubren el sub-bloque 7.**

Ningún archivo en `apps/core/tests/` testea base_models, serializers_mixins, signals, tasks, validators, cache_utils, permissions, onboarding_service ni management commands.

Los tests existentes más cercanos:
- `test_sidebar.py` (Sub-bloque 3) indirectamente testea que `rbac_signals.propagate_section_to_cargos` funciona (el signal auto-crea CargoSectionAccess al crear TabSection)
- `test_base.py` (smoke test) verifica que BaseTenantTestCase funciona, no la infraestructura

**Impacto:** 8,815 LOC de producción activa sin ninguna red de seguridad automatizada. Las tareas Celery, los validators, los signals y el onboarding se validan únicamente por browseo manual.
