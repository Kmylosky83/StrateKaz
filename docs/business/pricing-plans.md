---
name: pricing-plans
description: Decisiones de pricing — COP obligatorio, SaaS $20K/usuario, consultoría por cotización, planes detallados pendientes
type: project
---

## Moneda: Pesos Colombianos (COP)
Normativa colombiana exige precios en COP (Ley 1480 de 2011).
**How to apply:** Todo precio visible al usuario debe estar en COP.

## Decisiones tomadas (2026-03-16)

### SaaS (Software puro)
- **$20.000 COP/usuario/mes**
- **Mínimo 10 usuarios** = $200.000 COP/mes mínimo
- **Todos los módulos incluidos** (SGI completo, un solo plan)
- Portales proveedores/clientes: **gratis ilimitados**
- Admin tenant incluido
- Trial: **5 días calendario**, todos los módulos

### Consultoría (Servicios)
- Se maneja por **negociación/cotización** (NO precio fijo en marketing)
- 5 enfoques:
  1. Organización, Sistematización y Automatización
  2. + Responsable SG-SST (T&C según nivel riesgo y # personas)
  3. + Responsable PESV según nivel (Res. 40595)
  4. + Responsable SIG para Certificación Trinorma ISO 9001+14001+45001
  5. Solo Responsable SST o Solo Responsable PESV
- Variables: nivel de riesgo (I-V), # trabajadores, nivel PESV
- Plataforma SGI **incluida** mientras dure el contrato
- Precios referencia (NO publicar): SST desde $600K (10 trab), PESV desde $800K

### Pendiente definir (más adelante)
- Planes escalonados (Esencial/Profesional/Enterprise) — NO por ahora
- Descuento anual
- Límites de almacenamiento por tenant
- Detalle de precios de consultoría para marketing site

## Tipos de usuario para facturación
- **Colaborador** (usuario interno) → unidad de cobro
- **Proveedor** (portal) → gratis
- **Cliente** (portal) → gratis
- **Consultor externo** → incluido en consultoría

## Versionamiento
Script `scripts/bump-version.sh <version>` actualiza 6 archivos de versión.
Versión actual: 5.2.0 (2026-03-16).
