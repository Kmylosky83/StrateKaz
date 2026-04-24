# Arquitectura del módulo Perfil

> **SOT:** Un solo lugar (`/perfil`) gestiona toda la identidad y datos del
> empleado. Mi Portal queda 100% enfocado en acciones (firma, lecturas,
> encuestas, documentos). Patrón Workday / BambooHR / HiBob / GitHub.

## Principio arquitectónico

Un empleado tiene **un solo perfil**, no editores paralelos. Antes del refactor
2026-04-23 había dos flujos confusos:
- **Hero Mi Portal** → botón "Editar perfil" → `MiPerfilEditForm` (editaba Colaborador + InfoPersonal)
- **UserMenu → /perfil** → botón "Editar Perfil" → `EditProfileModal` (editaba User)

Ambos se llamaban "Editar perfil" y el usuario no sabía cuál elegir. La fusión
consolida todo en `/perfil` con secciones atómicas.

## Rutas

| Ruta | Componente | Propósito |
|---|---|---|
| `/perfil` | `PerfilPage` | Identidad + Contacto + Emergencia + Laboral + Firma |
| `/perfil/seguridad` | `SeguridadPage` | Password + 2FA + Sesiones activas |
| `/perfil/preferencias` | `PreferenciasPage` | Idioma, tema, notificaciones |

## Estructura de `/perfil` — 5 secciones

Cada sección es un `<Card>` con **edit inline atómico** (ícono ✏️ en el
encabezado abre un modal específico que sabe a qué modelo escribir).

### 1. 📇 Identidad
- **Modelo:** `User` (identidad digital) + foto
- **Lógica de edición por rol:**
  - **Empleado con Colaborador:** sección **read-only**. Badge "🔒 Gestionado por talento humano" + mensaje "Si hay errores en tu nombre, cargo o documento, contacta a talento humano". **Solo la foto es editable** (click en avatar). Razón: CLAUDE.md establece que Colaborador es master de nombre/documento/etc., y si el empleado edita `User.first_name` directamente, el próximo save del admin en Colaborador lo sobrescribe via signal.
  - **Superadmin:** sin Colaborador master → botón "Editar" habilitado → `EditIdentidadModal` → `PATCH /api/core/users/update_profile/` (first_name, last_name, email, phone + documento).
- **Foto (todos los roles):** click en Avatar → `AvatarUploadModal` → `POST /api/core/users/upload_photo/`. Signal `sync_user_photo_to_colaborador` propaga a `Colaborador.foto`.
- **Flujos legítimos de cambio de nombre/documento para empleados** (matrimonio, corrección de error admin): **NO son self-service** — son tickets a RH que dispara un workflow de aprobación. Patrón Workday/BambooHR.

### 2. 📞 Contacto personal
- **Modelos:** `Colaborador` + `InfoPersonal`
- **Endpoint:** `PUT /api/mi-portal/mi-perfil/`
- **Modal:** `EditContactoModal`
- **Campos:** `celular` (Colaborador.telefono_movil), `email_personal`, `telefono` (InfoPersonal.telefono_fijo), `direccion`, `ciudad`
- **Condicional:** solo aparece si el usuario tiene Colaborador (no superadmin puro)

### 3. 🚨 Contacto de emergencia
- **Modelo:** `InfoPersonal`
- **Endpoint:** `PUT /api/mi-portal/mi-perfil/`
- **Modal:** `EditEmergenciaModal`
- **Campos:** `contacto_emergencia_nombre`, `contacto_emergencia_parentesco`, `contacto_emergencia_telefono`
- **Empty state:** card dashed con CTA "Agregar contacto" que abre el mismo modal
- **Condicional:** solo aparece si el usuario tiene Colaborador

### 4. 💼 Información laboral (read-only)
- **Badge:** 🔒 Solo lectura
- **Campos:** Empresa, Área/Proceso, Cargo, Fecha de ingreso, Estado
- **Fuente:** master en `Colaborador`, editable desde Mi Equipo > Colaboradores (admin)
- **Mensaje:** "Estos datos los gestiona el área de talento humano desde Mi Equipo > Colaboradores."
- **Superadmin:** muestra "Rol en el sistema" con "Administrador del Sistema"

### 5. ✍️ Firma digital
- **Link:** `/mi-portal?tab=firma` (UX dedicada SignaturePad se mantiene ahí)
- **Sin edit inline** — la firma requiere canvas + validación específica
- **Condicional:** solo para empleados (no superadmin)

## Modales atómicos

Ubicación: `frontend/src/features/perfil/components/`

| Modal | Modelo | Endpoint | Size |
|---|---|---|---|
| `EditIdentidadModal` | User | `PATCH /api/core/users/update_profile/` | md |
| `EditContactoModal` | Colaborador + InfoPersonal | `PUT /api/mi-portal/mi-perfil/` | lg |
| `EditEmergenciaModal` | InfoPersonal | `PUT /api/mi-portal/mi-perfil/` | md |
| `AvatarUploadModal` | User.photo | `POST /api/core/users/upload_photo/` | (common DS) |

**Regla:** cada modal sabe exactamente a qué modelo escribir. El backend del
PUT `/mi-portal/mi-perfil/` solo actualiza los campos enviados en el body, lo
que permite separar "contacto personal" de "emergencia" sin sobrescribir el
otro set.

## Flujo de foto (centralizada)

```
Click Avatar (cualquier sitio: Hero Mi Portal, /perfil, UserMenu)
  ↓
AvatarUploadModal (components/common — ÚNICO canónico)
  ↓
useUploadPhoto hook
  ↓
POST /api/core/users/upload_photo/
  ↓
User.photo (master — identidad digital)
  ↓
Signal sync_user_photo_to_colaborador (mi_equipo/colaboradores/signals.py:186)
  ↓
Colaborador.foto (réplica sincronizada)
```

**Fuente de verdad:** `User.photo`. `Colaborador.foto` es réplica via signal.
Consistente con CLAUDE.md "User solo contiene identidad digital (email,
password, firma, **photo**, nivel_firma)".

## Mi Portal simplificado (post-refactor)

Mi Portal ya NO edita perfil. Queda enfocado 100% en **acciones del empleado**:

```
Hero (identidad vista) — botón "Ver mi perfil" → /perfil
ProfileProgressBar — link /perfil
JefePortalSection (si aplica)
Tabs (SIN "Mis datos"):
  · Mi Firma [badge]
  · Lecturas [badge]
  · Encuestas [badge]
  · Documentos
```

## Reusabilidad para Mi Equipo (futura)

Los 3 modales atómicos exponen props:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  user?: User;           // EditIdentidadModal
  perfil?: ColaboradorESS; // EditContacto + EditEmergencia
}
```

**Plan futuro (cuando se refactorice `ColaboradorFormModal`):** el admin en
Mi Equipo > Colaboradores reutiliza estos 3 modales + uno adicional para
datos laborales (cargo, salario, tipo_contrato). Zero duplicación de
formularios: los 3 modales se usan como componentes, con flag
`adminMode={true}` que desbloquea el email del sistema para escritura directa.

## Compatibilidad con User sin Colaborador

- **Superadmin** (`is_superuser=true`, sin Colaborador): ve solo Identidad + Rol
- **User sin Colaborador** (nuevo, sin perfil RH completado): ve Identidad + "Rol en el sistema" con cargo actual
- **Empleado con Colaborador**: ve las 5 secciones completas

El hook `useMiPerfil(enabled)` se disparra solo si NO es superadmin, para
evitar llamadas innecesarias.

## Historia

- **2026-04-08** — H1 detectado: Mi Portal vivía en talent_hub mezclando dato con audiencia
- **2026-04-23 (sesión A)** — Capa Portales cerrada, rediseño UX de Mi Portal, ActionBar + tab badges (ActionBar eliminado después por redundancia con badges)
- **2026-04-23 (sesión B)** — Fusión de edición de perfil en `/perfil` centralizado. Eliminados: `EditProfileModal`, `MiPerfilCard`, `MiPerfilEditForm`, tab "Mis datos" de Mi Portal. Creados: 3 modales atómicos. 5 cards en `/perfil`. `Mi Portal` Hero: "Editar perfil" → "Ver mi perfil".

## Referencias

- `docs/01-arquitectura/portales.md` — capa Portales
- `docs/01-arquitectura/source-of-truth.md` — User vs Colaborador SOT
- `docs/01-arquitectura/hallazgos-pendientes.md` — H-UX-MI-PORTAL-PERFIL-01 (cerrado en sesión B)
