# Sistema de Workflow de Firmas Digitales y Revisión Periódica

## 🎯 Resumen Ejecutivo

Sistema profesional de gestión de políticas con workflow completo de firmas digitales manuscritas y ciclo de revisión periódica automatizado, diseñado para cumplir con ISO 9001, ISO 45001, Decreto 1072/2015 Colombia.

**Ubicación de Archivos**:
```
backend/apps/gestion_estrategica/identidad/
├── models_workflow.py           ✅ Modelos de datos completos
├── serializers_workflow.py      ✅ Serializers REST API
├── views_workflow.py            ✅ ViewSets y lógica de negocio
├── urls_workflow.py             ✅ Endpoints configurados
├── tasks_workflow.py            ✅ Tareas Celery automatizadas
└── README_WORKFLOW.md           📄 Este archivo

backend/apps/audit_system/centro_notificaciones/
└── utils.py                     ✅ Sistema de notificaciones

docs/
├── WORKFLOW-FIRMAS-POLITICAS.md ✅ Documentación completa
└── WORKFLOW-FIRMAS-FRONTEND-GUIDE.md ✅ Guía frontend
```

---

## 📋 Características Implementadas

### ✅ 1. Firma Digital Múltiple
- [x] Firma manuscrita en canvas (base64)
- [x] Hash SHA-256 de verificación de integridad
- [x] Orden secuencial configurable
- [x] Orden paralelo configurable
- [x] Roles: Elaboró, Revisó, Aprobó, Validó, Autorizó
- [x] Delegación de firma con trazabilidad
- [x] Rechazo con comentarios obligatorios
- [x] Metadatos: IP, navegador, geolocalización
- [x] Historial completo de intentos

### ✅ 2. Ciclo de Revisión Periódica
- [x] Frecuencias: anual, semestral, trimestral, bianual, personalizado
- [x] Alertas automáticas configurables (30, 15, 7 días)
- [x] Renovación vs nueva versión
- [x] Versionamiento semántico (1.0 → 1.1 → 2.0)
- [x] Auto-renovación opcional
- [x] Escalamiento de políticas críticas
- [x] Dashboard de próximos vencimientos

### ✅ 3. Versionamiento y Trazabilidad
- [x] Snapshot completo de cada versión
- [x] Comparación visual entre versiones (diff)
- [x] Restauración de versiones anteriores
- [x] Historial con usuario y timestamp
- [x] Hash de verificación por versión

### ✅ 4. Notificaciones Automatizadas
- [x] Email (SMTP)
- [x] SMS (Twilio - configuración lista)
- [x] Push notifications (FCM - configuración lista)
- [x] In-app notifications
- [x] Prioridad automática según urgencia

### ✅ 5. Tareas Automatizadas (Celery)
- [x] verificar_firmas_vencidas (diario 8:00 AM)
- [x] verificar_revisiones_pendientes (diario 9:00 AM)
- [x] enviar_alertas_revision (diario 10:00 AM)
- [x] actualizar_estados_revision (diario 00:30 AM)
- [x] auto_renovar_politicas (semanal lunes 8:00 AM)

---

## 🚀 Instalación Rápida

### 1. Backend

```bash
# Aplicar migraciones
cd backend
python manage.py makemigrations
python manage.py migrate

# Iniciar Celery
celery -A config worker -l info
celery -A config beat -l info
```

### 2. Configurar URLs

En `backend/config/urls.py`:
```python
urlpatterns = [
    # ...
    path('api/gestion-estrategica/identidad/workflow/',
         include('apps.gestion_estrategica.identidad.urls_workflow')),
]
```

### 3. Configurar Celery

En `backend/config/celery_app.py`:
```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'verificar-firmas-vencidas': {
        'task': 'apps.gestion_estrategica.identidad.tasks_workflow.verificar_firmas_vencidas',
        'schedule': crontab(hour=8, minute=0),
    },
    # ... resto de tareas (ver tasks_workflow.py)
}
```

---

## 📡 Endpoints Principales

### Firmas Digitales
```http
# Mis firmas pendientes
GET /api/gestion-estrategica/identidad/workflow/firmas-digitales/mis-firmas-pendientes/

# Firmar documento
POST /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/firmar/
{
  "firma_base64": "data:image/png;base64,xxxxx",
  "observaciones": "Aprobado según criterios técnicos"
}

# Rechazar firma
POST /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/rechazar/
{
  "motivo": "No cumple con requisito ISO 45001"
}

# Delegar firma
POST /api/gestion-estrategica/identidad/workflow/firmas-digitales/{id}/delegar/
{
  "nuevo_firmante_id": 25,
  "motivo": "Vacaciones"
}
```

### Configuración de Revisión
```http
# Crear configuración
POST /api/gestion-estrategica/identidad/workflow/configuracion-revision/
{
  "content_type": 45,
  "object_id": 123,
  "frecuencia": "ANUAL",
  "alertas_dias_previos": [30, 15, 7],
  "proxima_revision": "2025-01-15"
}

# Próximos vencimientos
GET /api/gestion-estrategica/identidad/workflow/configuracion-revision/proximos-vencimientos/?dias=30

# Iniciar revisión
POST /api/gestion-estrategica/identidad/workflow/configuracion-revision/{id}/iniciar-revision/
```

### Historial de Versiones
```http
# Comparar versiones
POST /api/gestion-estrategica/identidad/workflow/historial-versiones/comparar/
{
  "version_a_id": 10,
  "version_b_id": 11
}

# Restaurar versión
POST /api/gestion-estrategica/identidad/workflow/historial-versiones/{id}/restaurar/
{
  "confirmar": true
}
```

---

## 💡 Casos de Uso Rápidos

### Caso 1: Crear Workflow y Aplicar a Política

```python
# 1. Crear configuración de workflow
POST /workflow-firmas/
{
  "nombre": "Workflow Política SST",
  "tipo_orden": "SECUENCIAL",
  "dias_para_firmar": 5,
  "roles_config": [
    {"rol": "ELABORO", "orden": 1, "cargo_id": 10},
    {"rol": "REVISO", "orden": 2, "cargo_id": 15},
    {"rol": "APROBO", "orden": 3, "usuario_id": 5}
  ]
}

# 2. Aplicar workflow a política
POST /workflow-firmas/1/aplicar/
{
  "content_type": "identidad.politicaespecifica",
  "object_id": 45
}
# → Crea 3 firmas automáticamente
# → Notifica al primer firmante
```

### Caso 2: Usuario Firma Documento

```python
# 1. Ver mis firmas pendientes
GET /firmas-digitales/mis-firmas-pendientes/

# 2. Firmar
POST /firmas-digitales/1/firmar/
{
  "firma_base64": "data:image/png;base64,iVBORw0KGgo...",
  "observaciones": "Aprobado"
}
# → Sistema valida orden
# → Genera hash SHA-256
# → Guarda metadatos
# → Notifica siguiente firmante
```

### Caso 3: Configurar Revisión Anual

```python
# Crear configuración
POST /configuracion-revision/
{
  "content_type": 45,
  "object_id": 123,
  "frecuencia": "ANUAL",
  "alertas_dias_previos": [30, 15, 7],
  "auto_renovar": false,
  "responsable_revision": 5,
  "proxima_revision": "2025-01-15"
}
# → Sistema programa alertas
# → Tareas Celery monitorean automáticamente
# → Envía emails en días configurados
```

---

## 🗄️ Modelos de Datos

### FirmaDigital
```python
class FirmaDigital(AuditModel):
    content_type = GenericForeignKey  # Aplica a cualquier documento
    object_id = PositiveIntegerField

    firmante = ForeignKey(User)
    cargo = ForeignKey(Cargo)
    rol_firma = CharField(choices=FIRMA_ROL_CHOICES)
    orden_firma = PositiveSmallIntegerField

    firma_manuscrita = TextField  # Base64
    firma_hash = CharField(max_length=64)  # SHA-256

    status = CharField(choices=FIRMA_STATUS_CHOICES)
    fecha_firma = DateTimeField
    fecha_vencimiento = DateTimeField

    delegado_por = ForeignKey(User, null=True)

    # Metadatos
    ip_address = GenericIPAddressField
    user_agent = TextField
    geolocation = JSONField
```

### ConfiguracionRevision
```python
class ConfiguracionRevision(AuditModel):
    content_type = GenericForeignKey
    object_id = PositiveIntegerField

    frecuencia = CharField(choices=FRECUENCIA_REVISION_CHOICES)
    dias_personalizados = PositiveIntegerField(null=True)

    tipo_revision = CharField(choices=TIPO_REVISION_CHOICES)
    auto_renovar = BooleanField

    responsable_revision = ForeignKey(User, null=True)
    alertas_dias_previos = JSONField  # [30, 15, 7]

    ultima_revision = DateField
    proxima_revision = DateField
    estado = CharField(choices=ESTADO_REVISION_CHOICES)
```

### HistorialVersion
```python
class HistorialVersion(TimestampedModel):
    content_type = GenericForeignKey
    object_id = PositiveIntegerField

    version_numero = CharField
    version_anterior = CharField

    snapshot_data = JSONField  # Snapshot completo
    cambios_diff = JSONField   # Diferencias

    tipo_cambio = CharField
    descripcion_cambio = TextField

    usuario = ForeignKey(User)
    version_hash = CharField(max_length=64)  # SHA-256
```

---

## 🔧 Configuración Avanzada

### Personalizar Roles de Firma

En `models_workflow.py`:
```python
FIRMA_ROL_CHOICES = [
    ('ELABORO', 'Elaboró'),
    ('REVISO', 'Revisó'),
    ('APROBO', 'Aprobó'),
    ('VALIDO', 'Validó'),
    ('AUTORIZO', 'Autorizó'),
    # Agregar más roles según necesidad
]
```

### Ajustar Frecuencias de Revisión

```python
FRECUENCIA_REVISION_CHOICES = [
    ('ANUAL', 'Anual - 12 meses'),
    ('SEMESTRAL', 'Semestral - 6 meses'),
    ('TRIMESTRAL', 'Trimestral - 3 meses'),
    ('BIANUAL', 'Bianual - 24 meses'),
    ('PERSONALIZADO', 'Personalizado'),
    # Agregar más frecuencias según necesidad
]
```

### Configurar Horarios de Tareas Celery

En `celery_app.py`:
```python
app.conf.beat_schedule = {
    'verificar-firmas-vencidas': {
        'task': '...',
        'schedule': crontab(hour=8, minute=0),  # Personalizar horario
    },
}
```

---

## 📊 Estadísticas y Reportes

### Estadísticas de Firmas
```http
GET /firmas-digitales/estadisticas/?fecha_desde=2024-01-01&fecha_hasta=2024-12-31

Response:
{
  "total_firmas": 150,
  "firmadas": 120,
  "pendientes": 20,
  "rechazadas": 5,
  "delegadas": 5,
  "porcentaje_completado": 80.0,
  "tiempo_promedio_firma_horas": 24.5
}
```

### Estadísticas de Revisiones
```http
GET /configuracion-revision/estadisticas/

Response:
{
  "total_documentos": 50,
  "vigentes": 35,
  "proximos_vencimiento": 10,
  "vencidas": 5,
  "en_revision": 0,
  "proximas_7_dias": 3,
  "proximas_30_dias": 10
}
```

---

## 🧪 Testing

### Tests Unitarios
```bash
python manage.py test apps.gestion_estrategica.identidad.tests_workflow
```

### Tests de Integración
```python
# Test: Workflow completo de firmas
def test_workflow_firma_secuencial():
    # 1. Crear workflow
    workflow = ConfiguracionWorkflowFirma.objects.create(...)

    # 2. Aplicar a política
    firmas = workflow.crear_firmas_para_documento(politica, user)

    # 3. Firmar en orden
    for firma in firmas:
        firma.firmar(firma_base64, ip, user_agent)

    # 4. Verificar estado final
    assert politica.status == 'VIGENTE'
    assert all(f.status == 'FIRMADO' for f in firmas)
```

---

## 🛡️ Seguridad

### Verificación de Integridad
```python
# Verificar que la firma no ha sido alterada
GET /firmas-digitales/{id}/verificar-integridad/

Response:
{
  "integra": true,
  "hash_almacenado": "abc123...",
  "hash_calculado": "abc123...",
  "fecha_verificacion": "2024-01-15T10:30:00Z"
}
```

### Control de Acceso
- Solo el firmante asignado puede firmar
- Delegación con trazabilidad completa
- Permisos granulares por rol (IsAuthenticated, IsStaff)
- Logs completos de todas las acciones

---

## 📚 Documentación Adicional

1. **Documentación Completa**: `/docs/WORKFLOW-FIRMAS-POLITICAS.md`
   - Diagramas de estados
   - Flujos completos
   - Cumplimiento normativo (ISO, Decreto 1072)

2. **Guía Frontend**: `/docs/WORKFLOW-FIRMAS-FRONTEND-GUIDE.md`
   - Componentes React
   - Hooks personalizados
   - Ejemplos de implementación

3. **API Reference**: `/backend/apps/gestion_estrategica/identidad/urls_workflow.py`
   - Endpoints completos
   - Ejemplos de requests/responses

---

## 🤝 Soporte

Para soporte técnico o consultas:
- Email: soporte@stratekaz.com
- Documentación: https://docs.stratekaz.com
- Issues: https://github.com/stratekaz/issues

---

## 📝 Changelog

### Version 1.0.0 (2026-01-15)
- ✅ Sistema completo de firmas digitales múltiples
- ✅ Ciclo de revisión periódica automatizado
- ✅ Versionamiento y comparación de documentos
- ✅ Notificaciones multi-canal
- ✅ Tareas Celery automatizadas
- ✅ Cumplimiento ISO 9001, ISO 45001, Decreto 1072

---

**Desarrollado por**: StrateKaz - BPM Specialist
**Licencia**: Propietario
**Cumplimiento**: ISO 9001:2015, ISO 45001:2018, Decreto 1072/2015 Colombia
