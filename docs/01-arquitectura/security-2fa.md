# Seguridad de la Información — 2FA por Nivel de Rol (ISO 27001)

## Estado: Mejora 2 COMPLETADA (2026-03-23)

### Mejora 2: Impersonación + 2FA (2026-03-23)
- `POST /api/core/users/{id}/impersonate-verify/` — valida TOTP/backup, genera JWT 5min
- `GET /api/core/users/{id}/impersonate-profile/` — requiere X-Impersonation-Token si 2FA activo
- `ImpersonationRateThrottle`: 10/min por usuario
- `ImpersonationAuditMiddleware`: bloquea DELETE users, change-password, 2FA durante impersonación
- `block_during_impersonation` decorator: protege endpoints destructivos
- Audit trail: `AuditImpersonation` model (superadmin, target, action, IP, metadata)
- Frontend: `UserImpersonationModal` con paso 2FA verify, banner púrpura, TTL 60min

### Mejora 1: 2FA por Nivel (2026-03-18)

---

## Niveles de Firma
| Nivel | Quién | 2FA Login | 2FA al Firmar |
|-------|-------|-----------|---------------|
| **1** | Operarios, solo lectura | Sin 2FA | Sin verificación |
| **2** | Responsable SST, coordinador PESV, auditores | TOTP obligatorio | TOTP reconfirmación |
| **3** | Alta dirección, representante legal | TOTP obligatorio | TOTP o OTP email (10 min) |

Campo: `User.nivel_firma` (IntegerField 1/2/3, default=1) + `nivel_firma_manual` (override admin).

---

## Arquitectura

### Backend (C0 — Core)
| Archivo | Contenido |
|---------|-----------|
| `utils/encryption.py` | Fernet cifrado centralizado (encrypt_value, decrypt_value, try_decrypt_value) |
| `core/models/models_two_factor.py` | TwoFactorAuth (secret cifrado Fernet) + EmailOTP (OTP 6 dígitos, 10 min TTL) |
| `core/views/two_factor_views.py` | 7 endpoints: status, setup, enable, disable, verify, regenerate, **send-email-otp** |
| `core/serializers_2fa.py` | 6 serializers existentes |
| `tenant/auth_views.py` | TenantLoginView (intercepta 2FA) + **TenantTwoFactorVerifyView** (nuevo) |
| `tenant/models.py` | TenantUser.has_2fa_enabled (mirror, sync automático) |

### Frontend
| Archivo | Contenido |
|---------|-----------|
| `store/authStore.ts` | login() detecta requires_2fa → lanza error especial |
| `pages/LoginPage.tsx` | Intercepta requires_2fa → setLoginStep('2fa') → form TOTP |
| `api/auth.api.ts` | verifyTwoFactor() → POST /tenant/auth/2fa-verify/ |
| `api/twoFactor.api.ts` | sendEmailOTP() → POST /core/2fa/send-email-otp/ |
| `components/modals/TotpVerificationStep.tsx` | Input 6 dígitos + opción OTP email (nivel 3) |
| `components/modals/SignatureModal.tsx` | Paso TOTP después del canvas si requiresTotp=true |
| `hooks/useWorkflowFirmas.ts` | FirmarDocumentoDTO incluye totp_code, email_otp_code |

### Firma Digital (C2 — workflow_engine)
| Archivo | Contenido |
|---------|-----------|
| `firma_digital/views.py` | firmar() → gate TOTP si nivel_firma >= 2 (via apps.get_model) |
| `firma_digital/models.py` | hash_verificacion CharField(64) — SHA-256 extendido |
| `firma_digital/serializers.py` | FirmarFirmaActionSerializer + totp_code, email_otp_code |

---

## Flujo Login 2FA (Multi-tenant)
```
1. User → POST /tenant/auth/login/ (email + password)
2. TenantLoginView valida credenciales
3. Si TenantUser.has_2fa_enabled:
   → Retorna {requires_2fa: true, email} SIN tokens
4. Frontend: authStore.login() lanza {requires_2fa, email}
5. LoginPage intercepta → setLoginStep('2fa') → muestra form TOTP
6. User ingresa código → POST /tenant/auth/2fa-verify/
7. TenantTwoFactorVerifyView busca TwoFactorAuth en schemas del tenant
8. Verifica TOTP/backup/email_otp → retorna tokens + tenants
9. Frontend continúa flujo normal (tenant select o auto)
```

## Flujo Firma con TOTP
```
1. Usuario dibuja firma en SignaturePad → Base64 + SHA-256
2. SignatureModal detecta requiresTotp → muestra TotpVerificationStep
3. Usuario ingresa código TOTP (o solicita OTP email si nivel 3)
4. POST /firmas/{id}/firmar/ con totp_code o email_otp_code
5. Backend gate: verifica TOTP via apps.get_model('core', 'TwoFactorAuth')
6. Calcula hash_verificacion = SHA-256(trazo[:200]|otp|doc_id|version|ts|cédula)
7. HistorialFirma registra método 2FA usado
```

## Hash de Verificación Extendido
Fórmula: `SHA-256(trazo_base64[:200] | otp_usado | documento_id | version | timestamp_utc | cedula_usuario)`
Campo: `FirmaDigital.hash_verificacion` (no modifica firma_hash existente)

## Sincronización 2FA ↔ TenantUser
Al enable/disable 2FA en core.TwoFactorAuth:
- `_sync_2fa_to_tenant_user()` actualiza `TenantUser.has_2fa_enabled` en schema público
- Via `schema_context('public')` + `apps.get_model('tenant', 'TenantUser')`

## Cifrado TOTP Secret
- Antes: secret_key en texto plano (base32)
- Ahora: cifrado con Fernet (AES-128-CBC + HMAC-SHA256)
- `try_decrypt_value()` soporta migración gradual (legacy sin cifrar)
- Clave: `ENCRYPTION_KEY` en .env (producción), DEV fallback (desarrollo)

---

## Migraciones
1. `core/0004_user_nivel_firma_email_otp.py` — User.nivel_firma + EmailOTP
2. `tenant/0002_tenantuser_has_2fa_enabled.py` — TenantUser.has_2fa_enabled
3. `firma_digital/0003_firmadigital_hash_verificacion.py` — FirmaDigital.hash_verificacion

## Dependencias
- `pyotp==2.9.0` (ya instalado)
- `qrcode==7.4.2` (ya instalado)
- `cryptography` (ya instalado, para Fernet)

---

## Pendiente: Mejoras 2 y 3

### Mejora 2 — Sellado PDF con pyHanko
- pyHanko + certificado X.509 autofirmado del servidor
- Celery task post-APROBADO → genera PDF con firmas visuales → sella con X.509
- Storage inmutable: `{tenant_slug}/{doc_tipo}/{doc_id}_v{version}_sellado.pdf`
- Campos: Documento.hash_pdf_sellado, pdf_sellado=True

### Mejora 3 — Lectura Verificada en Portales
- Modelo AceptacionDocumental (GenericFK, scroll %, tiempo lectura, método verificación)
- Componente DocumentoParaAceptar con IntersectionObserver (scroll tracking)
- Métodos: CHECKBOX (informativo), FIRMA_CANVAS (reglamento), TOTP (contractual)
- Integración en Mi Portal, Proveedor Portal, Cliente Portal
