# Firma Digital — Auditoría E2E (2026-04-01)

## Arquitectura Clave

### nivel_firma vs nivel_jerarquico
- `nivel_firma` (1-3): Solo controla 2FA requerido al firmar, NO autoridad de aprobación
- `nivel_jerarquico` del Cargo: ESTRATEGICO, TACTICO, OPERATIVO, APOYO, EXTERNO
- NIVEL_MAP: ESTRATEGICO→3 (TOTP+OTP), TACTICO→2 (TOTP), OPERATIVO/APOYO/EXTERNO→1 (sin 2FA)
- Auto-aprobación: cuando TODAS las firmas asignadas están FIRMADO, documento se aprueba automáticamente

### GenericForeignKey — Fix Crítico
- FirmaDigital usa `content_type` + `object_id` (GenericForeignKey) para referenciar documentos
- **BUG ORIGINAL**: `object_id` era `UUIDField` pero `Documento.pk` es `AutoField` (integer)
- **FIX**: `object_id` → `CharField(max_length=50)` en: FirmaDigital, AlertaRevision, HistorialVersion
- Migración: `firma_digital/0007_object_id_uuid_to_charfield.py`

### calcular_firma_hash — Fix auto_now_add
- `fecha_firma = DateTimeField(auto_now_add=True)` → es None durante `save()` antes de DB insert
- `hasattr(self, 'fecha_firma')` siempre True (atributo existe, solo es None)
- **FIX**: `(self.fecha_firma or timezone.now()).isoformat()`

### Estado del Documento (State Machine)
```
BORRADOR → EN_REVISION → APROBADO → PUBLICADO → OBSOLETO
```
- "Enviar a Revisión": directo, valida que tenga firmantes si tipo requiere firma
- "Solicitar Firmas": asigna firmantes y transiciona a EN_REVISION
- "Devolver a Borrador": EN_REVISION → BORRADOR (nuevo endpoint)

## Seed: Política Habeas Data
- Archivo: `gestion_documental/management/commands/seed_politica_habeas_data.py`
- Crea POL con contenido interpolado desde EmpresaConfig (NIT, razón social)
- Auto-asigna firmante: primer User con `cargo__nivel_jerarquico='ESTRATEGICO'`
- Transiciona a EN_REVISION si firmante encontrado
- `lectura_obligatoria=True`

## Auto-distribución Lectura Obligatoria
- Campo: `Documento.lectura_obligatoria` (BooleanField, default=False)
- Signal: `auto_asignar_lecturas_obligatorias` en `post_save` de AUTH_USER_MODEL
- Cuando nuevo User con cargo se crea → asigna AceptacionDocumental para cada doc PUBLICADO con lectura_obligatoria
- Migración: `gestion_documental/0008_add_lectura_obligatoria.py`

## Estado (2026-04-03)
- `/firmas/{id}/firmar/` → **RESUELTO** (2026-04-03, flujo E2E completo verificado)
- Flujo E2E BORRADOR→EN_REVISION→APROBADO→PUBLICADO→DISTRIBUIDO → **VERIFICADO** ✓
- AceptacionDocumental: tiene scroll tracking, porcentaje >= 90%, forensic fields — implementado pero no testeado
- **Roles reducidos a 3** (2026-04-03 p4): solo ELABORO, REVISO, APROBO (VALIDO/AUTORIZO eliminados, migración 0008)
