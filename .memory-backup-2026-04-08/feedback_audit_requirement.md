---
name: Auditoría obligatoria antes de merge
description: SIEMPRE ejecutar auditoría profunda de cambios antes de mergear/pushear — nunca superficial
type: feedback
---

Cuando el usuario pide auditoría (o cuando se establece como requisito de la tarea), SIEMPRE ejecutar auditoría profunda ANTES de mergear/pushear. Nunca revisar superficialmente y asumir que está bien.

**Why:** El usuario pidió explícitamente "2 auditorías de revisión para asegurar mejores prácticas del mercado, UI, UX y automatización". Se hizo push sin cumplir ese requisito. El usuario corrigió: "Cuando se pide auditoría, es auditoría profunda de los cambios y la salud del código, siempre debe ser así."

**How to apply:**
- Antes de merge/push, lanzar agentes auditores que revisen:
  1. UI/UX: responsive, Design System, accesibilidad, consistencia visual
  2. Código: tipos TS, edge cases, seguridad, performance, integración BE↔FE
  3. Automatización: ¿aprovecha el motor BPM? ¿es escalable sin romper el monolito?
  4. Mejores prácticas: ¿se alinea con software de clase mundial?
- Si la auditoría encuentra issues → corregir ANTES de push
- El flujo es: desarrollo → auditoría 1 → auditoría 2 → fix issues → push
