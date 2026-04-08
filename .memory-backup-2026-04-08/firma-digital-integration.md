# Firma Digital — Integración con Plantillas y Auto-Asignación

## Arquitectura

### Dos Sistemas (antes desconectados, ahora integrados)
1. **FormBuilder SIGNATURE** — canvas simple en DynamicFormRenderer. DEPRECATED para documentos formales.
2. **FirmaDigital (workflow_engine)** — Sistema completo: SHA-256, TOTP, cargo, rol, historial, delegación, sellado PDF.

### Modelo FirmaDigital
- **GenericForeignKey**: `content_type` + `object_id` → puede firmar cualquier modelo
- **Roles**: ELABORO, REVISO, APROBO, VALIDO, AUTORIZO
- **Estados**: PENDIENTE, FIRMADO, RECHAZADO, DELEGADO, EXPIRADO
- **Seguridad**: `firma_hash` (SHA-256), `hash_verificacion` (extendido ISO 27001), `documento_hash`
- **Metadatos forenses**: IP, User Agent, Geolocalización, Screen Resolution
- **`configuracion_flujo`**: ahora nullable (permite auto-asignación sin flujo formal)

## Niveles de Firma (por Cargo)

| Nivel | Quién | Al firmar | Mapeo |
|-------|-------|-----------|-------|
| 1 | Operativos, apoyo, externos | Solo firma manuscrita (canvas) | OPERATIVO/APOYO/EXTERNO |
| 2 | Coordinadores, tácticos | Firma + **TOTP obligatorio** | TACTICO |
| 3 | Gerencia, directores | Firma + **TOTP o Email OTP** (10 min TTL) | ESTRATEGICO |

### Auto-computación
- **Signal `auto_assign_nivel_firma`**: User.post_save → lee `cargo.nivel_jerarquico` → asigna `nivel_firma`
- **Override manual**: `nivel_firma_manual=True` → signal no sobreescribe
- **Management command**: `sync_nivel_firma` → sincroniza todos los cargos y usuarios existentes

## firmantes_por_defecto

### Schema JSON
```json
[
  {"rol_firma": "ELABORO", "cargo_code": "COORD_HSEQ", "orden": 1, "es_requerido": true},
  {"rol_firma": "REVISO", "cargo_code": "DIR_CALIDAD", "orden": 2, "es_requerido": true},
  {"rol_firma": "APROBO", "cargo_code": "GER_GENERAL", "orden": 3, "es_requerido": true}
]
```

### Dónde vive
- `BibliotecaPlantilla.firmantes_por_defecto` (schema public, SSOT)
- `PlantillaDocumento.firmantes_por_defecto` (schema tenant, copia)
- Propagado por `seed_plantillas_sgi` al sincronizar

### Cargos de Referencia (seed_cargos_base.py)
| Code | Nombre | Nivel | Firma |
|------|--------|-------|-------|
| `GER_GENERAL` | Gerente General | ESTRATÉGICO | 3 |
| `DIR_CALIDAD` | Director de Calidad | ESTRATÉGICO | 3 |
| `COORD_HSEQ` | Coordinador HSEQ | TÁCTICO | 2 |
| `COORD_RRHH` | Coordinador TH | TÁCTICO | 2 |
| `COORD_ADMIN` | Coordinador Admin | TÁCTICO | 2 |
| `COORD_COMERCIAL` | Coordinador Comercial | TÁCTICO | 2 |
| `COORD_LOGISTICA` | Coordinador Logística | TÁCTICO | 2 |
| `CONTADOR` | Contador | TÁCTICO | 2 |

## Flujos

### Auto-asignación al crear documento
```
Documento.perform_create()
  → plantilla.firmantes_por_defecto?
  → auto_asignar_firmantes_desde_plantilla(doc, plantilla)
    → Para cada config: cargo_code → Cargo → User
    → Si user existe: FirmaDigital(PENDIENTE) + HistorialFirma + Notificación
    → Si user NO existe: warning (se retro-asigna después)
    → Si ≥1 firmante creado: doc.estado = EN_REVISION
```

### Retro-asignación al crear/actualizar usuario
```
User.post_save → retro_asignar_firmas_pendientes
  → user.cargo.code = X?
  → Buscar PlantillaDocumento con firmantes_por_defecto que referencian X
  → Buscar Documentos BORRADOR/EN_REVISION de esas plantillas
  → Verificar que no exista ya FirmaDigital para ese doc+cargo+rol
  → Crear FirmaDigital(PENDIENTE) + HistorialFirma(retro_asignado=True)
  → Enviar notificación FIRMA_PENDIENTE (prioridad alta)
  → BORRADOR → EN_REVISION si aplica
```

### Firma por el usuario
```
SignatureModal abre → canvas manuscrito
  → Si nivel_firma ≥ 2: TotpVerificationStep (6 dígitos)
  → Si nivel_firma = 3: opción Email OTP (10 min TTL)
  → POST /firmas/{id}/firmar/ con firma_base64 + firma_hash + totp_code
  → Backend: valida OTP, calcula hash_verificacion extendido
  → FirmaDigital.estado = FIRMADO
  → Si todas firmadas → notificación DOCUMENTO_TODAS_FIRMAS
```

## Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/workflows/firma-digital/firmas/asignar_firmantes/` | POST | Asignar firmantes manualmente |
| `/workflows/firma-digital/firmas/{id}/firmar/` | POST | Firmar documento |
| `/gestion-documental/plantillas/{id}/resolver-firmantes/` | GET | Preview: quién firmaría hoy |
| `/gestion-documental/documentos/content-type-id/` | GET | ContentType ID para FirmaDigital |

## Archivos Clave

| Archivo | Contenido |
|---------|-----------|
| `backend/apps/workflow_engine/firma_digital/models.py` | FirmaDigital, ConfiguracionFlujoFirma, FlowNode |
| `backend/apps/workflow_engine/firma_digital/views.py` | asignar_firmantes, firmar actions |
| `backend/apps/gestion_estrategica/gestion_documental/services/documento_service.py` | auto_asignar_firmantes_desde_plantilla() |
| `backend/apps/core/signals/user_lifecycle_signals.py` | retro_asignar_firmas_pendientes, auto_assign_nivel_firma |
| `backend/apps/core/management/commands/sync_nivel_firma.py` | Sincronizar cargos+usuarios existentes |
| `backend/apps/shared_library/.../seed_biblioteca_plantillas.py` | FIRMANTES_POLITICA, SSOT |
| `frontend/src/features/gestion-documental/components/AsignarFirmantesModal.tsx` | UI manual firmantes |
| `frontend/src/components/modals/SignatureModal.tsx` | Canvas + SHA-256 + TOTP step |
| `frontend/src/features/gestion-estrategica/hooks/useWorkflowFirmas.ts` | Hooks firma workflow |

## Pendientes
- **UI firmantes_por_defecto**: Componente en PlantillaFormModal para configurar sin tocar seeds
- **Verificación lectura automática**: Signal similar al retro-firma para AceptacionDocumental
- **Soporte usuario específico**: Extender schema para `{"rol_firma": "APROBO", "usuario_id": 5}`
