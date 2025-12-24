# Motor de Riesgos - Registro Completo en Django

## Resumen de Configuración Realizada

Se ha completado el registro del módulo **Motor de Riesgos (Nivel 2)** en Django con todas sus apps y rutas.

---

## 1. Apps Registradas en `backend/config/settings.py`

Las siguientes apps ya estaban correctamente registradas en `INSTALLED_APPS` (líneas 44-50):

```python
# Motor de Riesgos (Módulo 3)
'apps.motor_riesgos.contexto_organizacional',  # TAB: Contexto DOFA/PESTEL
'apps.motor_riesgos.riesgos_procesos',         # TAB: Riesgos Procesos ISO 31000
'apps.motor_riesgos.ipevr',                    # TAB: IPEVR GTC-45 (SST)
'apps.motor_riesgos.aspectos_ambientales',     # TAB: Aspectos Ambientales ISO 14001
'apps.motor_riesgos.riesgos_viales',           # TAB: Riesgos Viales PESV
'apps.motor_riesgos.sagrilaft_ptee',           # TAB: SAGRILAFT/PTEE
'apps.motor_riesgos.seguridad_informacion',    # TAB: Seguridad Info ISO 27001
```

---

## 2. URLs Consolidadas en `backend/config/urls.py`

**ANTES** (líneas 51-57 - rutas individuales):
```python
path('api/contexto/', include('apps.motor_riesgos.contexto_organizacional.urls')),
path('api/riesgos-procesos/', include('apps.motor_riesgos.riesgos_procesos.urls')),
path('api/ipevr/', include('apps.motor_riesgos.ipevr.urls')),
path('api/aspectos-ambientales/', include('apps.motor_riesgos.aspectos_ambientales.urls')),
path('api/riesgos-viales/', include('apps.motor_riesgos.riesgos_viales.urls')),
path('api/sagrilaft/', include('apps.motor_riesgos.sagrilaft_ptee.urls')),
path('api/seguridad-info/', include('apps.motor_riesgos.seguridad_informacion.urls')),
```

**DESPUÉS** (línea 51 - ruta consolidada):
```python
# Motor de Riesgos (Módulo 3 - Nivel Riesgos)
path('api/riesgos/', include('apps.motor_riesgos.urls')),
```

---

## 3. Archivo Creado: `backend/apps/motor_riesgos/urls.py`

Se creó el archivo consolidador de URLs del módulo con la siguiente estructura:

```python
"""
URLs del Módulo Motor de Riesgos - Nivel 2
"""
from django.urls import path, include

app_name = 'motor_riesgos'

urlpatterns = [
    path('contexto/', include('apps.motor_riesgos.contexto_organizacional.urls')),
    path('riesgos-procesos/', include('apps.motor_riesgos.riesgos_procesos.urls')),
    path('ipevr/', include('apps.motor_riesgos.ipevr.urls')),
    path('aspectos-ambientales/', include('apps.motor_riesgos.aspectos_ambientales.urls')),
    path('riesgos-viales/', include('apps.motor_riesgos.riesgos_viales.urls')),
    path('sagrilaft/', include('apps.motor_riesgos.sagrilaft_ptee.urls')),
    path('seguridad-info/', include('apps.motor_riesgos.seguridad_informacion.urls')),
]
```

---

## 4. Estructura de Rutas API Resultante

Todas las rutas del módulo ahora están bajo el prefijo `/api/riesgos/`:

| Endpoint API | App Django | Descripción |
|-------------|-----------|-------------|
| `/api/riesgos/contexto/` | `contexto_organizacional` | Análisis DOFA/PESTEL |
| `/api/riesgos/riesgos-procesos/` | `riesgos_procesos` | Gestión de Riesgos ISO 31000 |
| `/api/riesgos/ipevr/` | `ipevr` | Identificación de Peligros SST (GTC-45) |
| `/api/riesgos/aspectos-ambientales/` | `aspectos_ambientales` | Aspectos Ambientales ISO 14001 |
| `/api/riesgos/riesgos-viales/` | `riesgos_viales` | Riesgos Viales PESV |
| `/api/riesgos/sagrilaft/` | `sagrilaft_ptee` | SAGRILAFT/PTEE Lavado de Activos |
| `/api/riesgos/seguridad-info/` | `seguridad_informacion` | Seguridad Información ISO 27001 |

---

## 5. Verificación de Apps.py

Todos los archivos `apps.py` de las subapps están correctamente configurados:

### ✅ `contexto_organizacional/apps.py`
```python
class ContextoOrganizacionalConfig(AppConfig):
    name = 'apps.motor_riesgos.contexto_organizacional'
    verbose_name = 'Contexto Organizacional'
```

### ✅ `riesgos_procesos/apps.py`
```python
class RiesgosProcesosConfig(AppConfig):
    name = 'apps.motor_riesgos.riesgos_procesos'
    verbose_name = 'Riesgos de Procesos'
```

### ✅ `ipevr/apps.py`
```python
class IpevrConfig(AppConfig):
    name = 'apps.motor_riesgos.ipevr'
    verbose_name = 'IPEVR - Peligros y Riesgos SST'
```

### ✅ `aspectos_ambientales/apps.py`
```python
class AspectosAmbientalesConfig(AppConfig):
    name = 'apps.motor_riesgos.aspectos_ambientales'
    verbose_name = 'Aspectos e Impactos Ambientales'
```

### ✅ `riesgos_viales/apps.py`
```python
class RiesgosVialesConfig(AppConfig):
    name = "apps.motor_riesgos.riesgos_viales"
    verbose_name = "Riesgos Viales - PESV"
```

### ✅ `sagrilaft_ptee/apps.py`
```python
class SagrilaftPteeConfig(AppConfig):
    name = 'apps.motor_riesgos.sagrilaft_ptee'
    verbose_name = 'SAGRILAFT/PTEE - Lavado de Activos'
```

### ✅ `seguridad_informacion/apps.py`
```python
class SeguridadInformacionConfig(AppConfig):
    name = 'apps.motor_riesgos.seguridad_informacion'
    verbose_name = 'Seguridad de la Información'
```

---

## 6. Archivos Existentes en Cada Subapp

Todas las subapps cuentan con:
- ✅ `__init__.py`
- ✅ `apps.py` (correctamente configurado)
- ✅ `urls.py` (con rutas definidas)
- ✅ `models.py` (con modelos definidos)
- ✅ `views.py` (con ViewSets)
- ✅ `serializers.py` (con serializers)

---

## 7. Beneficios de la Consolidación

1. **Organización mejorada**: Todas las rutas de riesgos bajo `/api/riesgos/`
2. **Mantenibilidad**: Un solo archivo `urls.py` consolidador
3. **Consistencia**: Patrón igual a otros módulos (cumplimiento, workflows, hseq)
4. **Escalabilidad**: Fácil agregar nuevas subapps al módulo
5. **Claridad**: Namespace `motor_riesgos` para evitar conflictos

---

## 8. Estado Final

✅ **Apps registradas** en `settings.py`
✅ **URLs consolidadas** en `config/urls.py`
✅ **Archivo `urls.py`** creado en módulo principal
✅ **Todos los `apps.py`** correctamente configurados
✅ **Estructura de rutas** consistente y organizada

---

## 9. Próximos Pasos Recomendados

1. Ejecutar migraciones: `python manage.py makemigrations && python manage.py migrate`
2. Probar endpoints: `python manage.py runserver`
3. Verificar permisos RBAC en cada ViewSet
4. Documentar endpoints en Swagger/OpenAPI
5. Crear tests unitarios e integración

---

**Fecha de Configuración**: 2025-12-23
**Módulo**: Motor de Riesgos (Nivel 2)
**Apps Registradas**: 7 subapps
**Estado**: ✅ COMPLETO
