# Sistema de Logging Estructurado

El proyecto implementa logging estructurado en formato JSON para facilitar análisis, monitoreo y troubleshooting.

## Características

| Característica | Descripción |
|----------------|-------------|
| **Formato JSON** | Logs estructurados fáciles de parsear |
| **Niveles estándar** | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| **Contexto automático** | Usuario, timestamp, módulo, función |
| **Rotación de logs** | Archivo por día con retención configurable |
| **Performance** | Logging asíncrono sin impacto en requests |

---

## Configuración

**Ubicación:** `backend/utils/logging.py`

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'message': record.getMessage(),
        }

        # Agregar campos extra si existen
        if hasattr(record, 'extra'):
            log_data.update(record.extra)

        # Agregar exception si existe
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_data)
```

---

## Funciones de Logging

```python
from utils.logging import log_info, log_error, log_warning, log_debug

# Log de información
log_info("Proceso completado", extra={"user_id": 123, "items": 45})

# Log de error con excepción
try:
    resultado = procesar_datos()
except Exception as e:
    log_error("Error procesando datos", exc_info=e, extra={"data_id": 789})

# Log de warning
log_warning("Límite de cuota próximo", extra={"usage": "90%", "limit": 1000})

# Log de debug (solo en desarrollo)
log_debug("Variables de estado", extra={"state": current_state})
```

---

## Ubicación de Logs

| Entorno | Ubicación | Formato |
|---------|-----------|---------|
| **Desarrollo** | `backend/logs/app.log` | JSON (1 archivo/día) |
| **Producción** | `stdout` + Sentry | JSON estructurado |
| **Docker** | `docker logs <container>` | JSON |

---

## Configuración Django

```python
# settings.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'utils.logging.JSONFormatter',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'app.log',
            'when': 'midnight',
            'backupCount': 30,
            'formatter': 'json',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

---

## Rotación y Retención

- **Rotación:** Nuevo archivo cada día (`app-YYYY-MM-DD.log`)
- **Retención:** 30 días
- **Compresión:** Automática de archivos antiguos

---

## Ejemplo de Log JSON

```json
{
  "timestamp": "2025-12-24T10:30:45.123456",
  "level": "INFO",
  "module": "views",
  "function": "create",
  "line": 45,
  "message": "Área creada exitosamente",
  "user_id": 123,
  "area_id": 456,
  "area_nombre": "Producción"
}
```

---

## Buenas Prácticas

### Qué Loggear

- Operaciones CRUD exitosas (INFO)
- Errores y excepciones (ERROR)
- Límites y umbrales alcanzados (WARNING)
- Métricas de performance (INFO)
- Eventos de seguridad (WARNING/ERROR)

### Qué NO Loggear

- Datos sensibles (contraseñas, tokens, PII)
- Logs excesivos en bucles
- Debug en producción

### Contexto Útil

```python
# BIEN - Contexto útil para debugging
log_info("Recolección creada", extra={
    "recoleccion_id": recoleccion.id,
    "proveedor_id": recoleccion.proveedor_id,
    "total_kg": recoleccion.total_kg,
    "user_id": request.user.id,
})

# MAL - Sin contexto
log_info("Recolección creada")
```

---

## Integración con Sentry (Producción)

```python
# settings.py (producción)
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False,
)
```
