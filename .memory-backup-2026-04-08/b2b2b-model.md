---
name: Modelo B2B2B StrateKaz
description: Arquitectura de portales, roles, superadmin, contratistas y onboarding por tipo de usuario
type: project
---

## Modelo B2B2B — Definido 2026-03-23

StrateKaz opera un modelo B2B2B: StrateKaz (consultora) → Empresa cliente → Empleados/Contratistas del cliente.

### 7 Tipos de Experiencia de Usuario

| # | Tipo | Layout | Onboarding | CASCADE |
|---|------|--------|------------|---------|
| 1 | Superadmin sin cargo | Admin Global + DashboardLayout | AdminOnboarding (8 pasos empresa) | L0 |
| 2 | Superadmin con cargo (su tenant) | DashboardLayout | AdminOnboarding | L0 |
| 3 | Superadmin con cargo externo (cliente) | DashboardLayout | ContratistaOnboarding (4 pasos) | L20 |
| 4 | Empleado directo | DashboardLayout | EmpleadoOnboarding (4 pasos) | L20 |
| 5 | Jefe de área | DashboardLayout | JefeOnboarding (4 pasos) | L20 |
| 6 | Contratista con cargo | DashboardLayout | ContratistaOnboarding (4 pasos) | L20 |
| 7 | Rep. proveedor portal | PortalLayout | ProveedorOnboarding (3 pasos) | L50 |

### Reglas del Superadmin (Opción B — validada por PO)

**Con cargo:** Opera como parte del equipo, ve Mi Portal completo, badge % completitud, aparece en lista usuarios.
**Sin cargo:** Soporte puro, NO ve badge completitud, SÍ ve AdminOnboarding (configurar empresa), SÍ aparece en `/usuarios` solo para sí mismo.

- `is_superuser` bypassa RBAC siempre
- El cargo define tipo de onboarding (si tiene cargo, cargo tiene prioridad sobre is_superuser)
- Sin cargo nunca puede llegar a 100% profile_percentage (no tiene Colaborador)

### Detección de Onboarding Type (cadena de prioridad)

```
1. Si tiene cargo → cargo define tipo:
   - cargo.is_externo + code != PROVEEDOR/CLIENTE_PORTAL → 'contratista'
   - cargo.is_jefatura → 'jefe'
   - else → 'empleado'
2. Si NO tiene cargo + is_superuser → 'admin'
3. Si proveedor_id_ext o cargo PROVEEDOR_PORTAL → 'proveedor'
4. Si cliente_id_ext o cargo CLIENTE_PORTAL → 'cliente'
5. Default → 'empleado'
```

### Impersonación — Regla Única

Todo superadmin (con o sin cargo) puede impersonar. Sin restricciones.
- Banner visible "Estás viendo como [usuario]"
- Audit trail: `impersonated_by` en todas las acciones
- Métricas excluyen registros con `impersonated_by != null`
- Implementación: L25 (audit trail completo)

### Métricas por Vinculación (normatividad colombiana)

| Métrica | Quién cuenta | Norma |
|---------|-------------|-------|
| Headcount | `is_externo=False` | Código Sustantivo del Trabajo |
| SST | Todos (internos + externos) | Decreto 1072 Art. 2.2.4.6.1 |
| Formaciones | Todos | Resolución 0312 |
| Eval. desempeño | Solo `is_externo=False` | ISO 9001 §8.4 (contratistas = proveedores) |
| Nómina | `is_externo=False` AND no prestación_servicios | Laboral |

### Tenant StrateKaz como Empresa Real

- StrateKaz tiene su propio tenant donde gestiona su operación interna
- Es un tenant NORMAL (no especial, no demo)
- Sus consultores son `tipo_contrato='prestacion_servicios'` internamente
- Cuando operan en tenant cliente: `cargo.is_externo=True` + `proveedor_origen_nombre='StrateKaz'`
- El TenantSwitcher permite cambiar entre contextos

### Badges del Avatar (implementación futura L25)

| Tipo | Badge |
|------|-------|
| Superadmin sin cargo | Púrpura "SA" (sin % completitud) |
| Con cargo en su tenant | Solo % completitud |
| Con cargo externo | Naranja "Externo" + % |
| Empleado/Jefe | Solo % |
| Rep. proveedor | Gris "Proveedor" + empresa |
| Contacto cliente | Azul "Cliente" + empresa |
