# Auditoría API Sync — Frontend TS ↔ Backend DRF (2026-03-05)

## Resumen
Auditoría exhaustiva de 11 módulos. **~56 endpoints 404**, **~23 modelos con campos incompatibles**, **~20 @actions inexistentes en BE**.

---

## Patrón Sistémico #1: url_path en @action (CRÍTICO)

**Problema:** DRF genera URLs desde el nombre del método Python. `def por_vencer()` → `/por_vencer/` (snake_case). Si FE llama `/por-vencer/` (kebab-case) → 404 silencioso.

**Regla obligatoria:** TODOS los `@action` con nombre multi-palabra DEBEN tener `url_path='kebab-case'`:
```python
# ❌ MAL — genera /cambiar_estado/ pero FE llama /cambiar-estado/
@action(detail=True, methods=['post'])
def cambiar_estado(self, request, pk=None):

# ✅ BIEN — genera /cambiar-estado/ explícitamente
@action(detail=True, methods=['post'], url_path='cambiar-estado')
def cambiar_estado(self, request, pk=None):
```

**Convención proyecto:** URLs siempre kebab-case. Métodos Python siempre snake_case. El `url_path` conecta ambos.

### Módulos afectados (fixes aplicados Sprint AUDIT-SYNC)
- cumplimiento: by-sistema, vencimientos → por-vencer
- riesgos_procesos: cambiar-estado (×2), actualizar-avance
- riesgos_viales: iniciar-investigacion
- hseq/mejora_continua: iniciar-tratamiento, programar-siguiente
- hseq/accidentalidad: completar-investigacion, cerrar-investigacion, agregar-causas, divulgar-leccion, verificar-plan, completar-accion, verificar-accion
- supply_chain/compras: por-vencer, registrar-recepcion, no-conformes (EN OTRA SESIÓN)
- sales_crm: dashboard-pipeline
- analytics: (prefix fix + actions)
- gestion_estrategica/planeacion: update-progress
- gestion_estrategica/contexto: matriz-poder-interes
- gestion_estrategica/gestion_documental: 7 actions (marcar-obsoleta, enviar-revision, etc.)
- talent_hub/seleccion: cambiar-estado

---

## Patrón Sistémico #2: Tipos TS incompatibles con serializer (ALTO)

**Problema:** Frontend types definen campos que no existen en el serializer o con nombres diferentes. Causa: types escritos "a ojo" sin leer serializers.

**Regla obligatoria:** SIEMPRE leer serializer ANTES de escribir/modificar tipos TS. Verificar:
1. Nombre exacto del campo (snake_case idéntico)
2. Tipo: nested object vs integer FK vs string
3. Nullable/optional: `null` en BE = `| null` en TS
4. ReadOnly: campos que BE no acepta en create/update
5. Choice values: valores exactos del enum

### Módulos con mismatches estructurales graves
- **Riesgos Viales**: TODOS los modelos (RiesgoVial, ControlVial, IncidenteVial, InspeccionVehiculo) tienen estructura completamente diferente entre FE y BE
- **Riesgos Procesos**: TratamientoRiesgo, ControlRiesgo (ControlOperacional), Oportunidad — modelos reconceptualizados en BE pero FE no actualizado
- **Aspectos Ambientales**: ImpactoAmbiental, MonitoreoAmbiental — campos renombrados
- **Talent Hub Off-Boarding**: PazSalvo (concepto diferente), LiquidacionFinal, EntrevistaRetiro, ChecklistRetiro
- **Cumplimiento**: cumplimiento.types.ts (legacy) tiene tipos divergentes de matrizLegal.ts (actualizado)

### Campos que rompen escritura (P1)
| Módulo | FE envía | BE espera | Fix |
|--------|----------|-----------|-----|
| Cumplimiento | `empresa` | `empresa_id` | Cambiar DTO |
| Riesgos | `tipo` | `tipo_control` | Cambiar DTO |
| Riesgos Viales | `tipo_riesgo_id` | `tipo_riesgo` | Cambiar DTO |
| Riesgos Viales | `riesgo_id` | `riesgo_vial` | Cambiar DTO |
| Talent Hub | `fecha_hechos` | `fecha_falta` | Cambiar DTO |
| Talent Hub | `descargo_relacionado` | `descargo` | Cambiar DTO |
| Talent Hub | `exonerado` (enum) | `absuelto` | Cambiar enum |
| Off-Boarding | `fecha_efectiva_retiro` | `fecha_ultimo_dia_trabajo` | Cambiar DTO |
| Off-Boarding | `genera_indemnizacion` | `requiere_indemnizacion` | Cambiar DTO |

---

## Patrón Sistémico #3: @actions inexistentes en BE

**Problema:** Frontend llama endpoints que nunca se implementaron en backend.

**Regla:** Al agregar llamada API en FE, verificar que el @action existe en el ViewSet correspondiente. Al eliminar @action del BE, grep en FE para eliminar llamadas huérfanas.

### @actions fantasma por módulo
- **Cumplimiento**: renovar, export_excel, scrape, aprobar, publicar, marcar-obsoleto, reorder
- **Riesgos Viales**: cerrar_investigacion, reportar_arl, estadisticas/*, altos, sin_controles, ineficaces, puede_operar
- **HSEQ**: upload_plan, upload_informe, upload_evidencia, por_vencer (evaluaciones), aprobar (investigaciones)
- **Analytics**: aprobar, completar, seguimientos (PlanAccionKPI)
- **GE-Planeación**: measurements (CRUD completo), choices

**Decisión:** Estos se deben implementar en BE o eliminar del FE según roadmap.

---

## Patrón Sistémico #4: Router register slug ≠ FE path

**Problema:** Backend registra `router.register(r'tipos-requisito', ...)` pero FE llama `/tipos/`.

### Casos encontrados
| Módulo | FE path | BE router slug | Fix |
|--------|---------|----------------|-----|
| Cumplimiento | `/tipos/` | `tipos-requisito` | Alinear FE |
| Cumplimiento | `/tipos/` (reglamentos) | `tipos-reglamento` | Alinear FE |
| Riesgos Viales | `/tipos-riesgo/` | `factores` | Alinear FE |
| Analytics | `/acciones/planes/` | `planes-accion/planes/` | Alinear FE |

---

## Checklist pre-deploy para nuevos módulos

1. [ ] Todos los `@action` multi-palabra tienen `url_path='kebab-case'`
2. [ ] Tipos TS generados DESPUÉS de leer serializers (no antes)
3. [ ] DTOs de create/update usan nombres de campo del serializer, no del modelo
4. [ ] Router slugs coinciden con BASE_URL del FE
5. [ ] Choice/enum values son idénticos (copiar string exacto del BE)
6. [ ] Campos @property del modelo se exponen como SerializerMethodField o ReadOnlyField
7. [ ] FKs cross-module: IntegerField(source='campo_id'), NUNCA auto-generación
