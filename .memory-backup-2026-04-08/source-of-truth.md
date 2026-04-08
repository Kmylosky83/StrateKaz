---
name: source-of-truth-identity
description: Regla universal de Source of Truth para modelos de identidad — Colaborador es master de datos empleado, User solo identidad digital
type: project
---

# Source of Truth — Modelos de Identidad

## Principio
Colaborador es el Source of Truth para TODOS los datos de empleado. User solo contiene identidad digital.

## Cadena
TenantUser (public) → User (tenant) → Colaborador → InfoPersonal + HojaVida

## Responsabilidad por modelo

| Modelo | Es Source of Truth para |
|--------|------------------------|
| TenantUser | email, password, is_superadmin, tenants |
| User | email corporativo, password, firma, photo, nivel_firma, is_superuser |
| Colaborador | nombre (4 campos), documento, teléfono, cargo, área, fecha_ingreso, tipo_contrato, salario, estado |
| InfoPersonal | bancarios, salud (tipo_sangre, eps, arl, fondo_pensiones, caja), emergencia, dirección |
| HojaVida | educación, certificaciones, experiencia previa, idiomas |

## Signals activos (4)
- nombre (4 campos): Colaborador → User
- documento: Colaborador → User
- teléfono: Colaborador → User
- foto: User → Colaborador (excepción)

## Signals pendientes (5 laborales)
cargo, salario, fecha_ingreso, tipo_contrato, estado → Colaborador → User

## Deprecación (L60+)
9 campos salen de User: salario_base, fecha_ingreso, tipo_contrato, estado_empleado, tipo_sangre, eps, arl, fondo_pensiones, caja_compensacion

## Reglas clave
1. NUNCA escribir datos de empleado en User — escribir en Colaborador
2. NUNCA escribir datos de salud en User — escribir en InfoPersonal
3. Foto se edita en User (excepción)
4. Email corporativo se edita en User

## Doc completo
`docs/01-arquitectura/SOURCE_OF_TRUTH.md`
