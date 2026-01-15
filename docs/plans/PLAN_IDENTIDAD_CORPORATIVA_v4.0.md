# Plan de Trabajo: Identidad Corporativa v4.0
## Implementación Completada - Resumen Ejecutivo

**Fecha:** 2026-01-12
**Versión:** 4.0 (Final)
**Estado:** COMPLETADO

---

## Resumen de Implementación

Este documento resume las mejoras implementadas en el módulo de Identidad Corporativa:

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Backend - Estados, notificaciones y workflow | ✅ COMPLETADO |
| 2 | Frontend - Selección de firmantes por CARGOS | ✅ COMPLETADO |
| 3 | Campos de Alcance del SIG | ✅ COMPLETADO |
| 4 | Integración con Gestor Documental | ✅ COMPLETADO |

---

## Fase 1: Backend - Estados, Notificaciones y Workflow

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `seed_config_identidad.py` | Agregados estados: EN_APROBACION, POR_CODIFICAR, RECHAZADO |
| `centro_notificaciones/utils.py` | Nuevas funciones: `notificar_cargo()`, `notificar_cargos_multiple()` |
| `identidad/views.py` | Workflow actualizado con transiciones de estado y notificaciones por cargo |
| `identidad/serializers.py` | Soporte para `cargo_id` en FirmanteSeleccionSerializer |

### Nuevos Estados del Workflow

```
BORRADOR → EN_REVISION → EN_APROBACION → POR_CODIFICAR → VIGENTE
                ↓               ↓
            RECHAZADO ← RECHAZADO

Cuando VIGENTE se actualiza → OBSOLETO
```

### Funciones de Notificación Implementadas

```python
# Notifica a TODOS los usuarios de un cargo
notificar_cargo(cargo, tipo, asunto, mensaje, link, prioridad)

# Notifica a múltiples cargos
notificar_cargos_multiple(cargos, tipo, asunto, mensaje, link, prioridad)

# Específicas para políticas
notificar_politica_revision_pendiente(politica, cargo, proceso_firma)
notificar_politica_aprobacion_pendiente(politica, cargo, proceso_firma)
notificar_politica_rechazada(politica, motivo, rechazado_por)
notificar_politica_aprobada(politica)
notificar_politica_publicada(politica)
```

---

## Fase 2: Frontend - Selección de Firmantes por CARGOS

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `FirmantesSelectionModal.tsx` | Refactorizado para seleccionar CARGOS en lugar de usuarios |
| `usePoliticas.ts` | Nuevo tipo `CargoFirmanteSeleccion`, actualizado `useIniciarFirmaPolitica` |

### Nuevo Flujo de Selección

1. Usuario abre modal de firmantes
2. Para cada rol (Revisor Técnico, Aprobador), selecciona un **CARGO**
3. Se muestra información del cargo: nivel jerárquico, área, cantidad de usuarios
4. Al confirmar, el backend notifica a **TODOS** los usuarios del cargo seleccionado
5. **Cualquier** usuario del cargo puede firmar

### Interfaz de Usuario

```typescript
interface CargoFirmanteSeleccion {
  rol_firmante: 'REVISO_TECNICO' | 'REVISO_JURIDICO' | 'APROBO_DIRECTOR' | 'APROBO_GERENTE' | 'APROBO_REPRESENTANTE_LEGAL';
  cargo_id: number;
  cargo_nombre?: string;
}
```

---

## Fase 3: Campos de Alcance del SIG

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `identidad/models.py` | 5 nuevos campos de alcance |
| `identidad/serializers.py` | Campos incluidos con validación |
| `migrations/0011_add_alcance_sig_fields.py` | Migración de base de datos |
| `strategic.types.ts` | Tipos TypeScript actualizados |
| `IdentityFormModal.tsx` | UI con toggle y campos condicionales |

### Nuevos Campos en CorporateIdentity

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `declara_alcance` | Boolean | Toggle para mostrar/ocultar sección |
| `alcance_general` | TextField | Alcance general del SIG (requerido si declara_alcance) |
| `alcance_geografico` | TextField | Cobertura geográfica |
| `alcance_procesos` | TextField | Procesos cubiertos |
| `alcance_exclusiones` | TextField | Exclusiones generales |

### Validación Backend

```python
def validate(self, data):
    if data.get('declara_alcance') and not data.get('alcance_general'):
        raise ValidationError({
            'alcance_general': 'El alcance general es requerido cuando se declara alcance.'
        })
    return data
```

---

## Fase 4: Integración con Gestor Documental

### Archivos Existentes (Ya Implementados)

| Archivo | Funcionalidad |
|---------|---------------|
| `identidad/services.py` | `GestorDocumentalService` completo |
| `identidad/views.py` | Acción `enviar_a_documental` |
| `usePoliticas.ts` | Hook `useEnviarADocumental` |
| `PolicyDetailModal.tsx` | Botón de envío integrado |

### Flujo de Integración

```
1. Política en IDENTIDAD completa proceso de firmas
2. Usuario hace clic en "Enviar a Gestor Documental"
3. Backend:
   - Valida estado EN_REVISION con firmas COMPLETADAS
   - Crea/obtiene TipoDocumento 'POL'
   - Genera código: POL-{NORMA}-{SECUENCIAL} (ej: POL-SST-001)
   - Crea Documento con estado APROBADO
   - Registra todas las firmas como FirmaDocumento
   - Crea VersionDocumento (snapshot)
   - Publica automáticamente (estado PUBLICADO)
   - Crea ControlDocumental para distribución
   - Actualiza política en Identidad a VIGENTE
4. Frontend recibe confirmación con código asignado
```

### Endpoint

```
POST /api/gestion-estrategica/identidad/politicas-especificas/{id}/enviar-a-documental/

Body (opcional):
{
  "clasificacion": "INTERNO",  // PUBLICO | INTERNO | CONFIDENCIAL | RESTRINGIDO
  "areas_aplicacion": [1, 2, 3],
  "observaciones": "Texto libre"
}

Response:
{
  "detail": "Política enviada, codificada y publicada exitosamente",
  "politica": { "id": 1, "status": "VIGENTE", "code": "POL-SST-001" },
  "documento": { "id": 456, "codigo": "POL-SST-001", "estado": "PUBLICADO" }
}
```

---

## Arquitectura de Notificaciones

### Diagrama del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE NOTIFICACIONES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   IN_APP     │    │    EMAIL     │    │  PUSH (*)    │       │
│  │  (Campanita) │    │  (SMTP)      │    │  (Firebase)  │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  notificar_cargo()  │                      │
│                    │     utils.py     │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │                │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐         │
│  │ Notificacion │    │ EmailService │    │ PushService │         │
│  │   (modelo)   │    │  (templates) │    │  (FCM) (*)  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

(*) Push: Requiere configuración de Firebase FCM
```

### Estado de Canales

| Canal | Estado | Configuración Requerida |
|-------|--------|-------------------------|
| IN_APP (Campanita) | ✅ Funcionando | Ninguna |
| EMAIL | ✅ Funcionando | SMTP en settings + cuenta de email |
| PUSH | ⚠️ Estructura lista | Firebase FCM + API Key |
| SMS | ⚠️ Estructura lista | Twilio/AWS SNS |

---

## Configuración de Producción

### Notificaciones por Email

**Requiere:**
1. Crear cuenta de email en cPanel: `notificaciones@stratekaz.com`
2. Configurar en `settings.py`:

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.stratekaz.com'  # O el servidor SMTP de cPanel
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'notificaciones@stratekaz.com'
EMAIL_HOST_PASSWORD = 'tu_password_seguro'
DEFAULT_FROM_EMAIL = 'StrateKaz <notificaciones@stratekaz.com>'
```

**Pasos en cPanel:**
1. Ir a "Cuentas de correo electrónico"
2. Crear nueva cuenta: `notificaciones@stratekaz.com`
3. Anotar el servidor SMTP (generalmente `mail.tudominio.com`)
4. Configurar SPF, DKIM para mejorar entregabilidad

### Notificaciones Push (Firebase)

**Para activar Push en producción:**

1. **Crear proyecto en Firebase Console:**
   - Ir a https://console.firebase.google.com
   - Crear proyecto o usar existente
   - Habilitar Cloud Messaging

2. **Obtener credenciales:**
   - Project Settings > Service accounts > Generate new private key
   - Guardar el JSON como `firebase-credentials.json`

3. **Configurar en Django:**
```python
# settings.py
FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'firebase-credentials.json'

# O usar variables de entorno
FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID')
FIREBASE_PRIVATE_KEY = os.environ.get('FIREBASE_PRIVATE_KEY')
FIREBASE_CLIENT_EMAIL = os.environ.get('FIREBASE_CLIENT_EMAIL')
```

4. **Instalar dependencia:**
```bash
pip install firebase-admin
```

5. **El sistema detecta automáticamente** si Firebase está configurado y activa el canal PUSH.

### Comportamiento Automático

Una vez configuradas las credenciales:

| Prioridad | Canales Activos |
|-----------|-----------------|
| BAJA | IN_APP |
| MEDIA | EMAIL + IN_APP |
| ALTA | EMAIL + IN_APP + PUSH (si configurado) |
| CRITICA | EMAIL + SMS + IN_APP + PUSH |

**El código NO requiere cambios.** Solo configurar las credenciales.

---

## Pendientes para Futuras Versiones

1. **SMS:** Integración con Twilio o AWS SNS
2. **Webhooks:** Notificaciones a sistemas externos
3. **Digest:** Resumen diario de notificaciones no leídas
4. **Preferencias de usuario:** Cada usuario configura qué notificaciones quiere

---

## Checklist de Despliegue

### Pre-producción

- [ ] Ejecutar migraciones: `python manage.py migrate`
- [ ] Ejecutar seed: `python manage.py seed_config_identidad`
- [ ] Verificar que existen cargos con usuarios asignados
- [ ] Probar flujo completo en staging

### Configuración de Email

- [ ] Crear cuenta `notificaciones@stratekaz.com` en cPanel
- [ ] Configurar variables de entorno EMAIL_*
- [ ] Enviar email de prueba
- [ ] Verificar que no cae en spam

### Configuración de Push (Opcional)

- [ ] Crear proyecto en Firebase Console
- [ ] Descargar credenciales
- [ ] Configurar variables de entorno
- [ ] Probar notificación push desde admin

### Verificación Final

- [ ] Crear política de prueba
- [ ] Enviar a firma con cargo seleccionado
- [ ] Verificar que todos los usuarios del cargo reciben notificación (campanita + email)
- [ ] Completar firmas
- [ ] Enviar a Gestor Documental
- [ ] Verificar documento creado con código

---

## Archivos Modificados - Referencia Rápida

### Backend

```
backend/apps/
├── audit_system/centro_notificaciones/
│   └── utils.py                          # notificar_cargo(), funciones específicas
├── gestion_estrategica/identidad/
│   ├── management/commands/
│   │   └── seed_config_identidad.py      # Nuevos estados
│   ├── migrations/
│   │   └── 0011_add_alcance_sig_fields.py
│   ├── models.py                          # Campos de alcance
│   ├── serializers.py                     # cargo_id + alcance
│   ├── views.py                           # Workflow + enviar_a_documental
│   └── services.py                        # GestorDocumentalService
```

### Frontend

```
frontend/src/features/gestion-estrategica/
├── components/
│   ├── politicas/
│   │   ├── FirmantesSelectionModal.tsx   # Selección por cargo
│   │   └── PolicyDetailModal.tsx          # Estados + botón documental
│   └── modals/
│       └── IdentityFormModal.tsx          # UI de alcance
├── hooks/
│   └── usePoliticas.ts                    # CargoFirmanteSeleccion, useEnviarADocumental
└── types/
    ├── strategic.types.ts                 # CorporateIdentity con alcance
    └── policies.types.ts                  # PoliticaStatus actualizado
```

---

*Documento de implementación - Sistema de Gestión StrateKaz v4.0*
*Fecha de finalización: 2026-01-12*
