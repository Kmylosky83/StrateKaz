# Source of Truth — Modelos de Identidad

> **Principio universal:** Colaborador es el Source of Truth para TODOS los datos de empleado. User solo contiene datos de identidad digital.

---

## Cadena de Modelos

```
TenantUser (public schema)
  └─► User (tenant schema)
        └─► Colaborador (tenant schema)
              ├─► InfoPersonal (datos sensibles)
              └─► HojaVida (educación, experiencia)
```

Otros modelos de "persona" (Candidato, Cliente, ContactoCliente, Proveedor) son independientes y NO participan en esta cadena.

---

## Tabla de Source of Truth por Campo

### TenantUser (schema public)

| Campo | Source of Truth | Notas |
|-------|----------------|-------|
| email | **TenantUser** | Email de login, compartido con User |
| password | **TenantUser** | Hash de contraseña |
| is_superadmin | **TenantUser** | Flag cross-tenant |
| tenants (M2M) | **TenantUser** | Relación con schemas |

### User (schema tenant)

| Campo | Source of Truth | Dirección sync | Notas |
|-------|----------------|----------------|-------|
| email (corporativo) | **User** | — | Email dentro del tenant |
| password | **User** | — | Delegado desde TenantUser |
| foto/photo | **User** | User → Colaborador | User es master de foto |
| firma | **User** | — | Solo existe en User |
| nivel_firma | **User** | — | Solo existe en User |
| is_superuser | **User** | — | Flag Django |
| proveedor_id_ext | **User** | — | IntegerField (NO FK) — ID de referencia al proveedor |
| cliente_id_ext | **User** | — | IntegerField (NO FK) — ID de referencia al cliente |

### Colaborador (schema tenant)

| Campo | Source of Truth | Dirección sync | Notas |
|-------|----------------|----------------|-------|
| primer_nombre | **Colaborador** | Colaborador → User | Signal activo |
| segundo_nombre | **Colaborador** | Colaborador → User | Signal activo |
| primer_apellido | **Colaborador** | Colaborador → User | Signal activo |
| segundo_apellido | **Colaborador** | Colaborador → User | Signal activo |
| tipo_documento | **Colaborador** | Colaborador → User | Signal activo |
| numero_documento | **Colaborador** | Colaborador → User | Signal activo |
| telefono | **Colaborador** | Colaborador → User | Signal activo |
| cargo | **Colaborador** | Pendiente sync | Nuevo signal requerido |
| area | **Colaborador** | — | Solo en Colaborador |
| fecha_ingreso | **Colaborador** | Pendiente sync | Nuevo signal requerido |
| tipo_contrato | **Colaborador** | Pendiente sync | Nuevo signal requerido |
| salario_base | **Colaborador** | Pendiente sync | Nuevo signal requerido |
| estado_empleado | **Colaborador** | Pendiente sync | Nuevo signal requerido |
| email_personal | **Colaborador** | — | Solo en Colaborador |

### InfoPersonal (schema tenant)

| Campo | Source of Truth | Dirección sync | Notas |
|-------|----------------|----------------|-------|
| tipo_sangre | **InfoPersonal** | Pendiente deprecar en User | Dato de salud |
| eps | **InfoPersonal** | Pendiente deprecar en User | Seguridad social |
| arl | **InfoPersonal** | Pendiente deprecar en User | Riesgos laborales |
| fondo_pensiones | **InfoPersonal** | Pendiente deprecar en User | Seguridad social |
| caja_compensacion | **InfoPersonal** | Pendiente deprecar en User | Dato laboral |
| datos_bancarios | **InfoPersonal** | — | Solo en InfoPersonal |
| contacto_emergencia | **InfoPersonal** | — | Solo en InfoPersonal |
| dirección | **InfoPersonal** | — | Solo en InfoPersonal |
| tallas | **InfoPersonal** | — | Solo en InfoPersonal |

### HojaVida (schema tenant)

| Campo | Source of Truth | Notas |
|-------|----------------|-------|
| educación | **HojaVida** | Títulos, instituciones |
| certificaciones | **HojaVida** | Certificados profesionales |
| experiencia_previa | **HojaVida** | Historial laboral externo |
| idiomas | **HojaVida** | Competencias lingüísticas |

---

## Excepcion: Superadmin (is_superuser=True, cargo=None)

El superadmin es una **identidad de plataforma**, no un empleado. No participa en la cadena User > Colaborador > InfoPersonal.

| Aspecto | Comportamiento |
|---------|----------------|
| Colaborador | **NUNCA se crea** — signal `auto_create_colaborador` no aplica |
| Firma digital | **No requerida** — no participa en workflows documentales |
| Profile completion | Solo 3 campos: foto (25%), nombre (25%), documento (25%), firma (25%) |
| Emergencia | **No aplica** — no tiene InfoPersonal |
| Cargo | Internamente `ADMIN_GENERAL` pero UI muestra "Administrador del Sistema" |
| Impersonacion | Requiere 2FA via `ImpersonateVerifyModal` |
| Mi Portal | Muestra `AdminPortalView` con stats, no tabs de empleado |

### Creacion de User (POST /api/core/users/)

La creacion de User desde `/usuarios` crea **SOLO** User + TenantUser. **NO** crea Colaborador.

| Flujo | Crea User | Crea Colaborador | Crea TenantUser |
|-------|:---------:|:----------------:|:---------------:|
| `/api/core/users/` (Usuarios) | SI | NO | SI (signal) |
| Mi Equipo > Colaboradores | SI | SI | SI (signal) |
| Supply Chain > Proveedores | SI | NO | SI (signal) |
| Sales CRM > Clientes | SI | NO | SI (signal) |
| Superadmin entra a tenant | SI (auto) | SI (signal, con cargo ADMIN) | SI |

---

## Signals de Sincronizacion

### Activos (4)

| Signal | Dirección | Campos |
|--------|-----------|--------|
| `sync_nombre` | Colaborador → User | primer_nombre, segundo_nombre, primer_apellido, segundo_apellido |
| `sync_documento` | Colaborador → User | tipo_documento, numero_documento |
| `sync_telefono` | Colaborador → User | telefono |
| `sync_foto` | User → Colaborador | foto/photo |

### Pendientes (10 nuevos)

| Signal | Dirección | Campos | Prioridad |
|--------|-----------|--------|-----------|
| `sync_cargo` | Colaborador → User | cargo | Alta — afecta onboarding |
| `sync_salario` | Colaborador → User | salario_base | Media |
| `sync_fecha_ingreso` | Colaborador → User | fecha_ingreso | Media |
| `sync_tipo_contrato` | Colaborador → User | tipo_contrato | Media |
| `sync_estado` | Colaborador → User | estado_empleado | Alta — afecta acceso |

Los 5 campos de salud (tipo_sangre, eps, arl, fondo_pensiones, caja_compensacion) se deprecarán en User en lugar de crear signals — ver Plan de Deprecación.

---

## Reglas para Developers

### Cuándo leer de cada modelo

| Necesitas... | Lee de | Ejemplo |
|-------------|--------|---------|
| Autenticar usuario | TenantUser / User | Login, JWT, permisos |
| Mostrar nombre en UI | User (tiene copia sync) | Header, avatar, sidebar |
| Editar datos de empleado | **Colaborador** | Formularios RRHH, onboarding |
| Consultar cargo/área | **Colaborador** | Asignaciones, reportes |
| Datos de salud/bancarios | **InfoPersonal** | Nómina, HSEQ, emergencias |
| CV / experiencia | **HojaVida** | Selección, formación |
| Firma digital | User | Workflows, documentos |
| Determinar tipo onboarding | **Colaborador.cargo** | SmartOnboarding |

### Reglas de escritura

1. **NUNCA escribir datos de empleado directamente en User** — siempre escribir en Colaborador y dejar que el signal sincronice.
2. **NUNCA escribir datos de salud en User** — siempre escribir en InfoPersonal.
3. **Foto es la excepción** — se edita en User (perfil) y el signal la copia a Colaborador.
4. **Email corporativo se edita en User** — no se sincroniza a Colaborador (Colaborador tiene email_personal).

### Reglas de lectura en APIs

```python
# CORRECTO — leer cargo desde Colaborador
colaborador = user.colaborador
cargo = colaborador.cargo

# INCORRECTO — leer cargo desde User (dato puede estar desactualizado)
cargo = user.cargo  # NO usar hasta que exista signal sync_cargo
```

---

## Plan de Deprecación (L60+)

### Campos a remover de User

| Campo | Mover a | Estado actual |
|-------|---------|---------------|
| salario_base | Colaborador (ya existe) | Duplicado sin sync |
| fecha_ingreso | Colaborador (ya existe) | Duplicado sin sync |
| tipo_contrato | Colaborador (ya existe) | Duplicado sin sync |
| estado_empleado | Colaborador (ya existe) | Duplicado sin sync |
| tipo_sangre | InfoPersonal (ya existe) | Duplicado sin sync |
| eps | InfoPersonal (ya existe) | Duplicado sin sync |
| arl | InfoPersonal (ya existe) | Duplicado sin sync |
| fondo_pensiones | InfoPersonal (ya existe) | Duplicado sin sync |
| caja_compensacion | InfoPersonal (ya existe) | Duplicado sin sync |

### Pasos de migración

1. **Fase 1 (L25-L50):** Crear signals para los 5 campos laborales (Colaborador → User). Mantener campos en User como read-only cache.
2. **Fase 2 (L50-L60):** Migrar toda lectura de FE/BE a Colaborador/InfoPersonal. Marcar campos en User como `deprecated`.
3. **Fase 3 (L60+):** Crear migración Django para eliminar campos de User. User queda como modelo de identidad digital puro.

### User final (post-deprecación)

```
User (identidad digital):
  - email
  - password
  - foto
  - firma
  - nivel_firma
  - cargo (FK read-only a Cargo, sync desde Colaborador)
  - is_superuser
  - proveedor_id_ext
  - cliente_id_ext
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-03-23 | Documento creado — Hallazgo C12, Bloque 1 remediación seguridad |
