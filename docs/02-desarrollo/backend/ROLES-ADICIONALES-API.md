# Roles Adicionales — API Reference

## Descripción

Los Roles Adicionales son roles transversales que **no son cargos organizacionales**.
Complementan los permisos del cargo con responsabilidades adicionales.

**Ejemplos:** COPASST, Brigadista, Auditor ISO, Aprobador de Compras, Vigía SST, PESV.

## Tipos de Rol

| Tipo | Código | Descripción |
|------|--------|-------------|
| Legal Obligatorio | `LEGAL_OBLIGATORIO` | Exigidos por ley colombiana (COPASST, Vigía SST, Comité Convivencia) |
| Sistema de Gestión | `SISTEMA_GESTION` | Roles ISO (Auditor Interno, Líder de Proceso, Representante Dirección) |
| Operativo | `OPERATIVO` | Roles funcionales (Aprobador Compras, Custodio Activos, Brigadista) |
| Custom | `CUSTOM` | Roles creados por el tenant según su necesidad |

## Base URL

```
/api/core/roles-adicionales/
```

## Endpoints CRUD

### Listar roles adicionales
```
GET /api/core/roles-adicionales/
```
**Query params:** `tipo`, `is_system`, `is_active`, `requiere_certificacion`, `search`, `include_inactive`

**Response:** Array de `RolAdicionalList`
```json
[
  {
    "id": 1,
    "code": "COPASST",
    "nombre": "Miembro COPASST",
    "descripcion": "Comité Paritario de Seguridad y Salud en el Trabajo",
    "tipo": "LEGAL_OBLIGATORIO",
    "tipo_display": "Legal Obligatorio",
    "justificacion_legal": "Resolución 2013 de 1986, Decreto 1072 de 2015",
    "requiere_certificacion": true,
    "certificacion_requerida": "Curso 50h SG-SST",
    "is_system": true,
    "is_active": true,
    "permisos_count": 5,
    "usuarios_count": 3,
    "created_by_nombre": "Admin",
    "created_at": "2026-03-20T...",
    "updated_at": "2026-03-20T..."
  }
]
```

### Detalle de rol
```
GET /api/core/roles-adicionales/{id}/
```
**Response:** `RolAdicionalDetail` (incluye `permisos[]` y `usuarios_asignados[]`)

### Crear rol
```
POST /api/core/roles-adicionales/
```
**Body:**
```json
{
  "code": "AUDITOR_ISO",
  "nombre": "Auditor Interno ISO",
  "descripcion": "Auditor calificado para auditorías internas del SGI",
  "tipo": "SISTEMA_GESTION",
  "justificacion_legal": "ISO 19011:2018",
  "requiere_certificacion": true,
  "certificacion_requerida": "Certificación Auditor Interno ISO",
  "permisos_ids": [1, 2, 3]
}
```

### Actualizar rol
```
PATCH /api/core/roles-adicionales/{id}/
```
**Body:** Campos parciales de `CreateRolAdicionalDTO`

### Eliminar rol (soft delete)
```
DELETE /api/core/roles-adicionales/{id}/
```

## Endpoints Especiales

### Tipos disponibles
```
GET /api/core/roles-adicionales/tipos/
```
**Response:** `[{ "value": "LEGAL_OBLIGATORIO", "label": "Legal Obligatorio" }, ...]`

### Plantillas sugeridas
```
GET /api/core/roles-adicionales/sugeridos/
```
**Response:** Catálogo de roles predefinidos con `ya_existe: bool` para cada uno.

### Crear desde plantilla
```
POST /api/core/roles-adicionales/crear-desde-plantilla/
Body: { "code": "COPASST" }
```

### Usuarios asignados a un rol
```
GET /api/core/roles-adicionales/{id}/usuarios/
```

## Asignación y Revocación

### Asignar rol a usuario
```
POST /api/core/roles-adicionales/asignar/
```
**Body:**
```json
{
  "user_id": 5,
  "rol_adicional_id": 1,
  "expires_at": "2027-03-20T00:00:00Z",
  "justificacion": "Elegido en asamblea de trabajadores",
  "fecha_certificacion": "2026-01-15",
  "certificacion_expira": "2028-01-15"
}
```

### Revocar rol de usuario
```
POST /api/core/roles-adicionales/revocar/
```
**Body:**
```json
{
  "user_id": 5,
  "rol_adicional_id": 1
}
```

## Endpoints por Usuario

### Roles de un usuario específico
```
GET /api/core/users/{user_id}/roles-adicionales/
```

### Permisos efectivos (cargo + roles adicionales)
```
GET /api/core/users/{user_id}/permisos-efectivos/
```
**Response:**
```json
{
  "user_id": 5,
  "user_nombre": "Juan Pérez",
  "cargo": "Coordinador HSEQ",
  "permisos_cargo": [...],
  "permisos_roles_adicionales": [
    {
      "rol_code": "COPASST",
      "rol_nombre": "Miembro COPASST",
      "permisos": [...]
    }
  ],
  "permisos_efectivos": [...],
  "total_permisos": 42
}
```

### Certificaciones por vencer
```
GET /api/core/users/{user_id}/certificaciones-por-vencer/?dias=30
```

## Permisos RBAC

Todos los endpoints requieren `GranularActionPermission` con `section_code='roles_adicionales'`.

| Acción | Permiso |
|--------|---------|
| Listar, ver detalle, tipos, sugeridos | `can_view` |
| Crear, crear desde plantilla | `can_create` |
| Actualizar | `can_edit` |
| Eliminar | `can_delete` |
| Asignar, revocar | `can_edit` |

## API Client Frontend

```typescript
import { rolesAdicionalesApi, userRolesAdicionalesApi } from '@/features/gestion-estrategica/api/rolesAdicionalesApi';

// CRUD
const roles = await rolesAdicionalesApi.getAll({ tipo: 'LEGAL_OBLIGATORIO' });
const detalle = await rolesAdicionalesApi.getById(1);
const nuevo = await rolesAdicionalesApi.create({ code: 'VIGIA_SST', ... });
await rolesAdicionalesApi.update(1, { nombre: 'Nuevo nombre' });
await rolesAdicionalesApi.delete(1);

// Plantillas
const plantillas = await rolesAdicionalesApi.getSugeridos();
await rolesAdicionalesApi.crearDesdePlantilla('COPASST');

// Asignación
await rolesAdicionalesApi.asignar({ user_id: 5, rol_adicional_id: 1 });
await rolesAdicionalesApi.revocar({ user_id: 5, rol_adicional_id: 1 });

// Por usuario
const rolesUsuario = await userRolesAdicionalesApi.getRolesDeUsuario(5);
const efectivos = await userRolesAdicionalesApi.getPermisosEfectivos(5);
const porVencer = await userRolesAdicionalesApi.getCertificacionesPorVencer(5, 30);
```

## Módulo donde se consume

La UI de gestión de Roles Adicionales se construirá dentro del módulo de **Cargos RBAC**
(`/cargos` → tab "Roles Adicionales") o como sección independiente en **Estructura Organizacional**.

El API client ya existe en `frontend/src/features/gestion-estrategica/api/rolesAdicionalesApi.ts`
con tipos completos exportados.
