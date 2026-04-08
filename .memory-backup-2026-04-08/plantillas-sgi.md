---
name: plantillas-sgi
description: Arquitectura de plantillas SGI — BibliotecaPlantilla (public) → PlantillaDocumento (tenant), protección de personalización, tipos FORMULARIO, firmantes por defecto
type: project
---

## Arquitectura Plantillas SGI

### Flujo public → tenant
1. `seed_biblioteca_plantillas` → puebla `shared_biblioteca_plantilla` en schema **public**
2. `seed_plantillas_sgi` → lee public, copia a cada tenant como `PlantillaDocumento`
3. Ambos corren via `deploy_seeds_all_tenants`
4. `seed_plantillas_sgi` ahora limpia campos firma TEXT obsoletos al re-sincronizar

### Protección de personalización
- Cada PlantillaDocumento tiene `es_personalizada` (bool, default False)
- Si el tenant edita una plantilla → `es_personalizada = True`
- El seed **NUNCA** sobreescribe plantillas con `es_personalizada = True`
- Plantillas eliminadas del SSOT → se marcan `is_active=False` / `estado=OBSOLETA`

### Tipos de plantilla
- **HTML**: template con variables Mustache `{{variable}}`
- **MARKDOWN**: template Markdown
- **FORMULARIO**: JSON con campos tipados → DynamicFormRenderer en frontend

### Plantilla tipo FORMULARIO
- Campos definidos en `campos_formulario` (JSONField en BibliotecaPlantilla)
- Se crean como `CampoFormulario` en el tenant via `seed_plantillas_sgi`
- Tipos soportados: TEXT, TEXTAREA, NUMBER, EMAIL, PHONE, URL, DATE, DATETIME, SELECT, MULTISELECT, RADIO, CHECKBOX, FILE, SIGNATURE (deprecated), TABLA, SECCION
- `ancho_columna` (1-12) para grid responsive
- `SECCION` = separador visual (NO colapsable), no campo de datos
- `SIGNATURE` = DEPRECATED para documentos formales → usar FirmaDigital workflow

### Firmantes por Defecto (NUEVO 2026-03-20)
- `firmantes_por_defecto` JSONField en BibliotecaPlantilla Y PlantillaDocumento
- Schema: `[{"rol_firma": "ELABORO", "cargo_code": "COORD_HSEQ", "orden": 1, "es_requerido": true}]`
- Usa `cargo_code` (estable entre tenants, definido en seed_cargos_base.py)
- **Elimina campos TEXT manuales**: `seccion_firmas`, `elaboro_nombre/cargo`, `reviso_nombre/cargo`
- **Auto-crea FirmaDigital** al crear documento desde plantilla (ver firma-digital-integration.md)
- **UI pendiente**: No hay componente en PlantillaFormModal para editar esto aún

### Modal Crear Documento
- Si plantilla es FORMULARIO: solo muestra Título + Tipo + Plantilla + Clasificación + Formulario dinámico
- Si es HTML/MARKDOWN: muestra todos los campos genéricos (resumen, contenido, fechas, observaciones)
- Al crear: si plantilla tiene firmantes_por_defecto → auto-asigna + toast éxito/warning
- El título del documento ES el título — no se duplica en el formulario

### PlantillaFormModal — Fix Crítico
- Bug `_id` vs `id` corregido (commit `97f01c58`)
- Reordenar endpoint acepta formato frontend `{campos: [{id, orden}]}`
- Update/delete/reorder de campos ahora funciona correctamente

### Estado actual
- **Plantilla activa**: Política (10 campos FORMULARIO + 3 firmantes por defecto)
- **Pendientes**: Procedimiento, Instructivo, Formato, Manual (se crean una por una con el usuario)
- **Contrato Laboral eliminado** de la biblioteca (se definirá cuando se active Mi Equipo completo)
