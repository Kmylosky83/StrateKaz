# INSTRUCCIONES - Implementación Semana 24

## 🎯 OBJETIVO
Implementar las 4 apps adicionales del módulo Analytics con código completo y funcional.

---

## ✅ ARCHIVOS CREADOS

1. **`SEMANA-24-ANALYTICS-CODIGO-COMPLETO.md`** → Código fuente completo de todas las apps
2. **`SEMANA-24-RESUMEN-IMPLEMENTACION.md`** → Resumen ejecutivo de lo implementado
3. **`apps/analytics/urls.py`** → ✅ YA ACTUALIZADO con las nuevas rutas

---

## 📋 PASOS PARA IMPLEMENTAR

### Opción 1: Implementación Manual (Recomendada)

#### Paso 1: Abrir el archivo de código completo
```bash
# Abrir en tu editor
code backend/SEMANA-24-ANALYTICS-CODIGO-COMPLETO.md
```

#### Paso 2: Copiar código de cada app

**ANALISIS_TENDENCIAS:**
- Copiar sección "1. ANALISIS_TENDENCIAS" del MD
- Pegar en: `apps/analytics/analisis_tendencias/models.py`
- Pegar en: `apps/analytics/analisis_tendencias/serializers.py`
- Pegar en: `apps/analytics/analisis_tendencias/views.py`
- Pegar en: `apps/analytics/analisis_tendencias/urls.py`
- Pegar en: `apps/analytics/analisis_tendencias/admin.py`

**GENERADOR_INFORMES:**
- Copiar sección "2. GENERADOR_INFORMES" del MD
- Pegar en: `apps/analytics/generador_informes/models.py`
- Pegar en: `apps/analytics/generador_informes/serializers.py`
- Pegar en: `apps/analytics/generador_informes/views.py`
- Pegar en: `apps/analytics/generador_informes/urls.py`
- Pegar en: `apps/analytics/generador_informes/admin.py`

**ACCIONES_INDICADOR:**
- Copiar sección "3. ACCIONES_INDICADOR" del MD
- Pegar en: `apps/analytics/acciones_indicador/models.py`
- Pegar en: `apps/analytics/acciones_indicador/serializers.py`
- Pegar en: `apps/analytics/acciones_indicador/views.py`
- Pegar en: `apps/analytics/acciones_indicador/urls.py`
- Pegar en: `apps/analytics/acciones_indicador/admin.py`

**EXPORTACION:**
- Copiar sección "4. EXPORTACION" del MD
- Pegar en: `apps/analytics/exportacion/models.py`
- Pegar en: `apps/analytics/exportacion/serializers.py`
- Pegar en: `apps/analytics/exportacion/views.py`
- Pegar en: `apps/analytics/exportacion/urls.py`
- Pegar en: `apps/analytics/exportacion/admin.py`

#### Paso 3: Verificar sintaxis
```bash
# Verificar que no haya errores de importación
cd backend
python manage.py check
```

Si hay errores de importación, ajustar:
- Rutas de imports
- Nombres de modelos referenciados
- ForeignKeys a otros módulos

---

### Opción 2: Script Automático

#### Crear script de implementación

```python
# backend/implementar_semana_24.py
import os
import re

# Leer el archivo con todo el código
with open('SEMANA-24-ANALYTICS-CODIGO-COMPLETO.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Función para extraer bloques de código
def extract_code_block(content, app_name, file_type):
    """
    Extrae un bloque de código del markdown
    """
    pattern = rf"### `{app_name}/{file_type}`\n\n```python\n(.*?)\n```"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1)
    return None

# Apps a procesar
apps = ['analisis_tendencias', 'generador_informes', 'acciones_indicador', 'exportacion']
files = ['models.py', 'serializers.py', 'views.py', 'urls.py', 'admin.py']

# Procesar cada app
for app in apps:
    print(f"\nProcesando {app}...")
    for file_type in files:
        code = extract_code_block(content, app, file_type)
        if code:
            file_path = f'apps/analytics/{app}/{file_type}'
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(code)
            print(f"  ✅ {file_type} actualizado")
        else:
            print(f"  ⚠️  {file_type} no encontrado en MD")

print("\n✅ Implementación completada!")
```

#### Ejecutar script
```bash
cd backend
python implementar_semana_24.py
```

---

## 🔍 VERIFICACIÓN POST-IMPLEMENTACIÓN

### 1. Check de Django
```bash
python manage.py check
# Debe retornar: System check identified no issues (0 silenced).
```

### 2. Crear migraciones
```bash
python manage.py makemigrations analytics
```

**Output esperado:**
```
Migrations for 'analisis_tendencias':
  apps/analytics/analisis_tendencias/migrations/0001_initial.py
    - Create model AnalisisKPI
    - Create model TendenciaKPI
    - Create model AnomaliaDetectada
Migrations for 'generador_informes':
  apps/analytics/generador_informes/migrations/0001_initial.py
    - Create model PlantillaInforme
    - Create model InformeDinamico
    - Create model ProgramacionInforme
    - Create model HistorialInforme
Migrations for 'acciones_indicador':
  apps/analytics/acciones_indicador/migrations/0001_initial.py
    - Create model PlanAccionKPI
    - Create model ActividadPlanKPI
    - Create model SeguimientoPlanKPI
    - Create model IntegracionAccionCorrectiva
Migrations for 'exportacion':
  apps/analytics/exportacion/migrations/0001_initial.py
    - Create model ConfiguracionExportacion
    - Create model LogExportacion
```

### 3. Revisar migraciones
```bash
# Ver las migraciones creadas
ls apps/analytics/*/migrations/

# Revisar contenido de una migración
cat apps/analytics/analisis_tendencias/migrations/0001_initial.py
```

### 4. Aplicar migraciones
```bash
python manage.py migrate
```

**Output esperado:**
```
Running migrations:
  Applying analisis_tendencias.0001_initial... OK
  Applying generador_informes.0001_initial... OK
  Applying acciones_indicador.0001_initial... OK
  Applying exportacion.0001_initial... OK
```

### 5. Verificar en Django Admin
```bash
python manage.py runserver
```

Visitar: `http://localhost:8000/admin`

Deberías ver nuevas secciones:
- **ANALISIS_TENDENCIAS**
  - Análisis KPIs
  - Tendencias de KPIs
  - Anomalías Detectadas
- **GENERADOR_INFORMES**
  - Plantillas de Informes
  - Informes Dinámicos
  - Programaciones de Informes
  - Historial de Informes
- **ACCIONES_INDICADOR**
  - Planes de Acción KPI
  - Actividades de Planes KPI
  - Seguimientos de Planes KPI
  - Integraciones Acciones Correctivas
- **EXPORTACION**
  - Configuraciones de Exportación
  - Logs de Exportación

### 6. Probar endpoints
```bash
# Usando curl
curl -X GET http://localhost:8000/api/analytics/analisis/analisis-kpi/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Usando httpie
http GET http://localhost:8000/api/analytics/informes/plantillas/ \
  "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⚠️ POSIBLES PROBLEMAS Y SOLUCIONES

### Problema 1: Error de importación
```
ImportError: cannot import name 'CatalogoKPI' from 'apps.analytics.config_indicadores.models'
```

**Solución**: Verificar que las apps de Semana 23 estén implementadas:
- `config_indicadores`
- `indicadores_area`
- `dashboard_gerencial`

### Problema 2: ForeignKey no encontrada
```
FieldError: Cannot resolve keyword 'talent_hub' into field
```

**Solución**: Verificar que el módulo `talent_hub` esté implementado y tiene el modelo `Colaborador`.

Alternativa temporal:
```python
# En models.py, cambiar:
responsable = models.ForeignKey('talent_hub.Colaborador', ...)

# Por:
responsable = models.ForeignKey('core.User', ...)
```

### Problema 3: Migración con dependencias faltantes
```
django.db.migrations.exceptions.NodeNotFoundError
```

**Solución**: Ejecutar migraciones de dependencias primero:
```bash
python manage.py migrate config_indicadores
python manage.py migrate indicadores_area
python manage.py migrate talent_hub
python manage.py migrate hseq_management
```

---

## 📊 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Copiar código de `SEMANA-24-ANALYTICS-CODIGO-COMPLETO.md`
- [ ] Actualizar los 5 archivos de `analisis_tendencias`
- [ ] Actualizar los 5 archivos de `generador_informes`
- [ ] Actualizar los 5 archivos de `acciones_indicador`
- [ ] Actualizar los 5 archivos de `exportacion`
- [ ] Ejecutar `python manage.py check` (sin errores)
- [ ] Ejecutar `python manage.py makemigrations analytics`
- [ ] Revisar migraciones generadas
- [ ] Ejecutar `python manage.py migrate`
- [ ] Verificar en Django Admin
- [ ] Crear datos de prueba en Admin
- [ ] Probar endpoints con Postman/curl
- [ ] Documentar endpoints en Postman Collection

---

## 🎉 SIGUIENTE PASO

Una vez verificado todo, proceder con:
- **Frontend**: Implementar componentes React para las nuevas funcionalidades
- **Tests**: Crear tests unitarios para los nuevos modelos y endpoints
- **Documentación**: Actualizar documentación de API

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar `SEMANA-24-RESUMEN-IMPLEMENTACION.md` para contexto
2. Verificar que `SEMANA-24-ANALYTICS-CODIGO-COMPLETO.md` tiene el código completo
3. Revisar los logs de Django para detalles de errores
4. Ejecutar `python manage.py check --deploy` para verificación completa

---

**Última actualización**: 2025-12-29
**Versión**: 1.0
**Estado**: ✅ Listo para implementar
