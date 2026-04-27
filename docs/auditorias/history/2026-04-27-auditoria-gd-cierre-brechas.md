# Auditoría profunda Gestión Documental — Cierre de Brechas

**Fecha**: 2026-04-27
**Módulo**: `apps/gestion_estrategica/gestion_documental` (CT, transversal, LIVE en L15)
**Estado del módulo antes de auditoría**: declarado CERRADO en `docs/03-modulos/gestion-documental/arquitectura-gestion-documental.md` v5.1
**Auditor**: Claude Code + Camilo Rubiano

---

## Resumen ejecutivo

Auditoría profunda del Gestor Documental motivada por dudas operativas concretas:
1. ¿La verificación de lectura funciona con PDFs subidos?
2. ¿PDFs externos pueden cumplir flujo de firma? ¿Mejor OCR o archivo?
3. ¿Cómo alimenta el GD al sistema?

La auditoría destapó **16 brechas** en un módulo declarado cerrado, incluyendo **3 críticas que invalidan cumplimiento ISO 7.3** para todo PDF externo. Se lanzaron **6 agentes en paralelo** con worktrees aislados para cerrar 14 brechas. 2 brechas menores quedan documentadas como deuda.

---

## Inventario LIVE confirmado

| Recurso | Cantidad |
|---------|----------|
| Modelos Django | 8 (203 campos) |
| Endpoints API | 55+ |
| Componentes React | 28 (~9000 LOC) |
| Migraciones | 23 (0001 → 0023) |
| Servicios backend | 5 (`documento_service`, `services_ocr`, `services_scoring`, `services_drive`, `pdf_sealing`) |
| Exporters | 2 (WeasyPrint PDF + python-docx DOCX) |
| Seed commands | 4 |
| Templates PDF | 7 |
| Tareas Celery | 9 con schedule |

---

## Capacidades funcionales confirmadas

- ✅ Ciclo BORRADOR → EN_REVISION → APROBADO → PUBLICADO → OBSOLETO → ARCHIVADO → ELIMINADO
- ✅ 3 niveles de seguridad de firma (manuscrita, +TOTP, +TOTP+OTP email)
- ✅ Hash extendido SHA-256(trazo + otp + doc_id + version + timestamp + cédula)
- ✅ Delegación temporal de firma
- ✅ TRD AGN con cálculo automático archivo gestión / archivo central
- ✅ Auto-generación de procedimientos desde workflows BPM
- ✅ Invalidación automática de aceptaciones al publicar nueva versión
- ✅ Búsqueda full-text PostgreSQL (sobre código, título, resumen, proceso, tipo)
- ✅ Distribución RBAC + lectura obligatoria con auto-asignación a nuevos usuarios
- ✅ Versionamiento semántico con diff y snapshots con checksum SHA-256
- ✅ 12 tipos documentales SGI estandarizados
- ✅ Sellado pyHanko X.509 con estampa visual

---

## Patrones de alimentación al sistema (CT → C2)

```
                    GESTIÓN DOCUMENTAL (CT)
                    Documento + GenericFK origen
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     A. Notario       B. Creador BPM   C. Lectura masiva
     archivar_        crear_desde_     lectura_
     registro()       modulo()         obligatoria
     ARCHIVADO        BORRADOR         AceptacionDoc
     directo          + plantilla      PENDIENTE
                      + firmas         para todos
```

| Patrón | API | Origen típico | Estado inicial |
|---|---|---|---|
| **A. Notario** | `DocumentoService.archivar_registro()` | HSEQ deposita acta de COPASST | ARCHIVADO |
| **B. Creador BPM** | `DocumentoService.crear_desde_modulo()` | Workflow se completa | BORRADOR |
| **C. Lectura masiva** | `_distribuir_lectura_obligatoria` | Política recién publicada | PENDIENTE |

**Cosechadores que solo leen**: Mi Portal (badges), Centro de Notificaciones, Dashboard analítico C3, Audit System, TRD Celery semanal.

---

## Brechas identificadas

### CRÍTICAS

| ID | Brecha | Evidencia | Impacto |
|---|---|---|---|
| **H-GD-C1** | Lectura verificada de PDFs externos es **falsa**: 100% automático sin scroll real | `DocumentoReaderModal.tsx:74-77` calcula `totalSeccionesDisplay === 0 ? 100 : ...`. PDFs externos tienen `contenido=''` → siempre 100% | ISO 7.3 incumplido para todo PDF subido |
| **H-GD-C2** | Sin visor PDF embebido — solo se renderiza HTML del campo `contenido` | `dangerouslySetInnerHTML` sobre `documento_contenido`. PDFs externos requieren descarga manual | Usuario no puede leer PDF dentro del sistema con tracking |
| **H-GD-C3** | `verificar_acceso_documento` solo en `retrieve` y exports — endpoints sensibles sin chequeo | mixin presente en `views.py:397` pero no en `subir-anexo`, `verificar-sellado`, `mis-pendientes`, `aceptar`, `rechazar` | Bypass posible — la doc dice "RESUELTO" pero la cobertura no es total |

### ALTAS

| ID | Brecha |
|---|---|
| **H-GD-A1** | `PDFSealingService` prioriza `archivo_pdf` (generado) sobre `archivo_original` (subido). En PDFs adoptados, sella el equivocado |
| **H-GD-A2** | OCR extrae texto pero **NO se indexa** en `SearchVector`. Se pierde el valor del OCR |
| **H-GD-A3** | Certificado X.509 para sellado se genera manualmente por tenant. Si no existe → ValueError, sin fallback |
| **H-GD-A4** | Form Builder con FIRMA_WORKFLOW (tipo #17): no hay handler que dispare generación de PDF al cerrar firmas (la doc lo declara) |
| **H-GD-A5** | Sin verificación de duplicados al ingestar PDF — el mismo archivo crea 2 documentos sin alerta |

### MEDIAS

| ID | Brecha |
|---|---|
| **H-GD-M1** | Endpoint `aceptar` no valida `fecha_limite >= hoy`. Si Celery aún no marcó VENCIDO, se puede aceptar a destiempo |
| **H-GD-M2** | `numero_descargas` y `numero_impresiones` son contadores INT sin trazabilidad granular (ISO 27001 §A.8.10) |
| **H-GD-M3** | OCR limitado a `MAX_PAGES = 100`. Manuales SGI largos quedan parcialmente indexados |
| **H-GD-M4** | Signal post_save de User para `lectura_obligatoria` no respeta `cargos_distribucion` para usuarios nuevos |
| **H-GD-M5** | Sin export del log de aceptaciones documentales como evidencia para auditor externo |

### MENORES

| ID | Brecha | Tratamiento |
|---|---|---|
| **H-GD-m1** | `IngestarLoteModal` no muestra progreso por archivo individual | Cierre A6 |
| **H-GD-m2** | `BibliotecaPlantilla` (schema public) referenciada por `plantilla_maestra_codigo` no aparece en la app — feature parcial | **Deuda documentada**, no se cierra ahora |
| **H-GD-m3** | Seeds (TRD, tipos_documento_sgi) solo se ejecutan manualmente | Cierre A4 |

---

## Lanzamiento de cierre — 6 agentes paralelos en worktrees

| Agente | Brechas | Foco |
|---|---|---|
| **A1** | C1, C2, M1 | Visor PDF embebido + tracking real con react-pdf, validación archivo_original y fecha_limite en `aceptar` |
| **A2** | C3, M4 | RBAC en endpoints sensibles (excepto `aceptar`/`rechazar` reservados a A1), respeto de `cargos_distribucion` para nuevos usuarios |
| **A3** | A1, A2, M3 | Sellado usa `archivo_original` cuando es externo; SearchVector incluye `texto_extraido` con confianza ≥ 0.7; MAX_PAGES configurable |
| **A4** | A3, m3 | Auto-generación de cert X.509 + seeds TRD en bootstrap del tenant; fallback graceful en sealing |
| **A5** | A4, A5 | Handler de cierre de FIRMA_WORKFLOW genera PDF; verificación de duplicados con SHA-256 |
| **A6** | M2, M5, m1 | Modelo `EventoDocumental` + endpoint export evidencia (XLSX/PDF firmado) + UX progreso por archivo en lote |

**Constraints aplicados a cada agente**:
- LIVE only (solo `apps/gestion_estrategica/gestion_documental/`)
- NO workarounds — arreglar de raíz o documentar deuda
- Tests obligatorios con `BaseTenantTestCase`
- Black 88 chars + Ruff + español es-co en mensajes UI
- Frontend: TypeScript strict, ESLint max-warnings=0, Design System
- NO commit / NO push — solo dejar cambios en worktree para revisión humana

---

## Respuestas a las preguntas operativas

### P1 ¿Verificación de lectura con PDF subido?
**Hoy**: NO funciona realmente — el sistema permite "aceptar" sin abrir el PDF (H-GD-C1).
**Después de A1**: SÍ funcionará con visor PDF embebido + tracking de páginas. Cumplimiento ISO 7.3 restablecido.

### P2 ¿PDF externo cumple flujo de firma? ¿OCR o archivo?
**Sí**, vía endpoint `POST /documentos/adoptar-pdf/` con asignación de firmantes.
**Mejor estrategia**: mantener AMBAS — el sistema ya conserva `archivo_original` (inmutable, evidencia legal), corre OCR async (`texto_extraido`) y permite sellar con X.509 (`pdf_sellado`). Falta solo cerrar A1, A2, C1, C2 para que sea robusto end-to-end.

### P3 ¿Cómo alimenta el GD al sistema?
3 patrones documentados: Notario (archivar_registro), Creador BPM (crear_desde_modulo), Lectura masiva (lectura_obligatoria). Los demás módulos solo cosechan vía endpoints (Mi Portal, Centro Notificaciones, Dashboard).

---

## Próximos pasos

1. **En curso**: 6 agentes en background completarán su trabajo. Reportarán archivos modificados, tests añadidos y pasos de browseo.
2. **Coordinación humana**: revisar cada worktree, mergear secuencialmente a `main`, resolver conflictos en `views.py`.
3. **Validación local**: levantar Docker, browseo manual de cada cierre en tenant demo (`tenant_stratekaz`).
4. **CI**: push a `main`, esperar verde.
5. **Deploy**: solo después de browseo exitoso y CI verde, ejecutar `bash scripts/deploy.sh` en VPS.

---

## Deuda documentada

- **H-GD-m2 BibliotecaPlantilla**: el campo `plantilla_maestra_codigo` referencia una tabla en schema public que no existe completamente. Feature parcial. Sprint futuro: definir si se mantiene como Biblioteca Maestra o se elimina.

---

## Archivos clave de referencia

- Modelos: `backend/apps/gestion_estrategica/gestion_documental/models.py`
- Servicios: `backend/apps/gestion_estrategica/gestion_documental/services/`
- Sellado pyHanko: `backend/apps/gestion_estrategica/gestion_documental/services/pdf_sealing.py`
- OCR: `backend/apps/gestion_estrategica/gestion_documental/services_ocr.py`
- Firma digital: `backend/apps/workflow_engine/firma_digital/models.py`
- Visor lectura: `frontend/src/features/gestion-documental/components/DocumentoReaderModal.tsx`
- Adopción PDF externo: `frontend/src/features/gestion-documental/components/AdoptarPdfModal.tsx`
- Arquitectura v5.1: `docs/03-modulos/gestion-documental/arquitectura-gestion-documental.md`
