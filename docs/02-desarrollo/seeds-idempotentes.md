---
name: seeds-idempotentes
description: Seeds de cargos y procesos son idempotentes (create-only), validación DNS/MX en creación de usuarios, is_system protege eliminación
type: project
---

## Seeds Idempotentes (2026-03-24)

Los seeds de cargos y procesos usan patrón **create-only** (no update_or_create):
- Si el `code` ya existe (activo o eliminado) → skip
- NUNCA sobrescriben ediciones del admin
- NUNCA recrean registros eliminados por el admin
- Marcan registros seed como `is_system=True`
- Backfill: marcan existentes + asignan área a cargos sin una

**Why:** El patrón anterior (update_or_create) sobrescribía ediciones del admin y recreaba cargos eliminados al re-ejecutar seeds en deploy.

**How to apply:** Al agregar nuevos cargos/procesos al catálogo seed, solo agregarlos al array. El seed los creará en la próxima ejecución sin afectar los existentes.

### CARGO_AREA_MAPPING
Cada cargo seed tiene un proceso por defecto:
- GER_GENERAL→DIR, DIR_CALIDAD→GCA, COORD_HSEQ→SST, COORD_RRHH→GTH
- COORD_ADMIN→GFI, COORD_COMERCIAL→CML, COORD_LOGISTICA→LOG, CONTADOR→GFI
- ASIST_ADMIN→DIR, ASIST_CONTABLE→GFI, RECEPCIONISTA→DIR, MENSAJERO→LOG, SERV_GENERALES→DIR

### Area.is_system
- Nuevo campo BooleanField en modelo Area (migración 0002)
- Procesos del sistema no se pueden eliminar (solo desactivar)
- AreaViewSet.destroy bloquea con 400 si is_system=True

### Validación DNS/MX de Email
- Validador centralizado: `apps.core.utils.validators.validate_email_domain`
- Dependencia: `dnspython>=2.6.1`
- 4 puntos protegidos: Colaboradores, Proveedores, Clientes, UserUpdate
- Fail-open: error de red/timeout NO bloquea (solo NXDOMAIN bloquea)

### Puntos de creación de usuarios (producción)
1. Colaboradores → `mi_equipo/colaboradores/serializers.py`
2. Proveedores → `supply_chain/gestion_proveedores/serializers.py`
3. Clientes → `sales_crm/gestion_clientes/serializers.py`
4. TenantAuth (auto-login) → No aplica DNS/MX (email ya validado)
5. Bootstrap (management cmd) → No aplica DNS/MX (admin manual)

### Roles Adicionales
- Backend API completa en `/api/core/roles-adicionales/`
- API client FE en `features/gestion-estrategica/api/rolesAdicionalesApi.ts`
- Documentación en `docs/02-desarrollo/backend/ROLES-ADICIONALES-API.md`
- **UI no construida aún** — pendiente para L25
