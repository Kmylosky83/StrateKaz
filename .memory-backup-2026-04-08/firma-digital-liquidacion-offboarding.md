# Firma Digital — Liquidación Laboral y Off-boarding
**Módulo:** Talent Hub → off_boarding
**Estado:** PENDIENTE (aún no implementado, se activa en L40 aprox.)
**Fecha documentación:** 2026-03-26

---

## Contexto Legal Colombia

### ¿Por qué la firma del empleado es crítica?
- El **empleado** firma "recibido a satisfacción" / "paz y salvo"
- El empleador ya tiene la obligación de pagar (no necesita firmarse a sí mismo)
- Sin firma del empleado → el empleado puede demandar que nunca recibió la liquidación
- **Art. 65 CST:** Si el empleador no prueba pago, debe salarios caídos
- La firma protege al **empleador** ante un juzgado laboral

### ¿Se necesita Certicámara para el empleado?
**NO.** La liquidación laboral NO es un acto jurídico solemne.

Bajo **Ley 527/1999** y **Decreto 2364/2012**, una firma electrónica es válida con:
1. **Atribuibilidad** → puede probarse que esa persona específica firmó
2. **Integridad** → el documento no cambió después de firmar
3. **No repudio** → el firmante no puede negar razonablemente haber firmado

**Cédula + OTP al celular/email personal = firma electrónica robusta válida.**

Certicámara solo es necesaria para: escrituras notariales, poderes ante el Estado,
contratos con entidades públicas, actos solemnes. No aplica a liquidaciones laborales.

---

## El Problema Arquitectónico

Al momento de firmar la liquidación, el empleado está siendo **desvinculado**:
- Su acceso a StrateKaz puede estar revocado
- Su email corporativo puede estar inactivo
- Su cuenta TOTP puede no estar disponible

→ **No se puede usar el flujo de firma normal (JWT + TOTP)**
→ Se necesita un flujo especial de **enlace temporal sin sesión**

---

## Flujo Diseñado (a implementar)

```
DATOS REQUERIDOS del Colaborador (ya existen en BD):
  → InfoPersonal.email_personal
  → Colaborador.telefono_celular
  → Colaborador.numero_documento (cédula)

FLUJO OFF-BOARDING FIRMA:

  1. RRHH genera la liquidación desde StrateKaz
     → Sistema calcula valores: cesantías, prima, vacaciones, indemnización
     → Estado documento: BORRADOR → EN_FIRMA_OFFBOARDING

  2. Sistema genera token temporal
     → UUID + expiración 72 horas
     → URL: https://app.stratekaz.com/firma-liquidacion/{token}
     → Enviado a: email_personal + SMS a telefono_celular

  3. Empleado abre enlace (NO necesita login)
     → Pantalla pública con branding del tenant
     → Muestra resumen de liquidación (solo lectura)

  4. Empleado ingresa su cédula (factor 1 — algo que SABE)
     → Validación: debe coincidir con Colaborador.numero_documento

  5. Sistema envía OTP de 6 dígitos al celular personal (factor 2 — algo que TIENE)
     → Expira en 10 minutos
     → Propósito: 'FIRMA_LIQUIDACION'

  6. Empleado dibuja firma manuscrita en canvas

  7. Sistema genera FirmaDigital con:
     → usuario = colaborador.user (aunque esté desactivado, la FK existe)
     → documento_hash = SHA-256(contenido liquidación)
     → firma_hash = SHA-256(usuario_id + rol + fecha + doc_hash + trazo[:100])
     → hash_verificacion = SHA-256(trazo[:200] | OTP | doc_id | version | timestamp_utc | cédula)
     → ip_address, user_agent capturados del request
     → metadatos: { 'metodo': 'offboarding_token', 'cedula_verificada': True }

  8. Token expira inmediatamente (single-use)

  9. Liquidación → estado FIRMADA_POR_EMPLEADO
     → Notificación a RRHH
     → PDF generado con firma incrustada
     → Desvinculación formal puede proceder
```

---

## Modelos a Crear (cuando se implemente)

```python
class TokenFirmaOffboarding(TenantModel):
    """Token temporal para firma de liquidación sin sesión activa"""
    colaborador = models.ForeignKey('colaboradores.Colaborador', on_delete=models.CASCADE)
    documento_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    documento_object_id = models.UUIDField()
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField()  # created_at + 72 horas
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    ip_used = models.GenericIPAddressField(null=True, blank=True)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
```

---

## Capas de Seguridad en Este Flujo

| Capa | Mecanismo | Qué prueba |
|------|-----------|------------|
| 1 | Token UUID single-use (72h) | Solo quien recibió el enlace puede acceder |
| 2 | Cédula coincide con expediente | Es el empleado correcto |
| 3 | OTP al celular personal del contrato | Tenía el dispositivo físico en ese momento |
| 4 | Trazo manuscrito canvas | Biometría visual de la firma |
| 5 | documento_hash SHA-256 | Integridad: firmó ESE documento específico |
| 6 | hash_verificacion | OTP quemado matemáticamente en la firma |
| 7 | IP + user_agent + timestamp | Contexto forense |
| 8 | HistorialFirma inmutable | Auditoría completa del proceso |

---

## Archivos a Crear Cuando Se Implemente

```
backend/apps/talent_hub/off_boarding/
  ├── services/
  │   ├── liquidacion_service.py      # Cálculo de valores
  │   └── firma_offboarding_service.py # Gestión token + OTP
  ├── views/
  │   └── firma_publica_views.py       # Endpoint sin auth (token-based)
  └── serializers/
      └── firma_offboarding_serializers.py

frontend/src/features/firma-liquidacion/   # Ruta pública /firma-liquidacion/:token
  ├── FirmaLiquidacionPage.tsx
  ├── LiquidacionResumen.tsx
  ├── VerificacionCedulaStep.tsx
  ├── OtpVerificacionStep.tsx
  └── CanvasFirmaStep.tsx
```

---

## Notas Importantes

- **El User del empleado puede estar desactivado** al momento de firmar — el flujo funciona
  igual porque usa el token, no JWT. La FK en FirmaDigital apunta al User (que existe en BD).
- **El PDF final** debe ser generado por WeasyPrint con la imagen de firma incrustada + metadata
  de verificación visible (hash_verificacion parcial + timestamp + IP).
- **Certicámara NO se necesita** para este caso de uso. Si en el futuro se necesita para
  contratos con terceros, se integraría como capa adicional, no como reemplazo.
- **Rate limiting:** máximo 3 intentos de OTP por token. Al 4to, el token se invalida y se
  notifica a RRHH.
