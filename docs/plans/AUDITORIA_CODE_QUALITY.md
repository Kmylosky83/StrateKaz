# REPORTE AUDITORÍA CODE QUALITY - StrateKaz

**Fecha:** 2026-01-15
**Auditor:** Claude Code (Agente Code Quality Specialist)
**Versión del Proyecto:** 3.3.0

---

## RESUMEN EJECUTIVO

| Métrica | Valor | Estado |
|---------|-------|--------|
| **URLs Hardcodeadas** | 16 | ⚠️ 5 requieren fix |
| **Credenciales Expuestas** | 6 | 🔴 CRÍTICO |
| **Valores Mágicos** | 50+ | ⚠️ Centralizar |
| **TODOs/FIXMEs** | 147 | ⚠️ Deuda técnica |
| **Código Comentado** | 10+ bloques | ⚠️ Limpiar |
| **Duplicación de Código** | ~1,500 líneas | ⚠️ Refactorizar |
| **Soporte i18n** | No existe | ⚠️ Implementar |

---

## A. HARDCODING DETECTADO

### 1. URLs Hardcodeadas

#### Resumen
| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| Bien configuradas (env vars) | 7 | ✅ OK |
| Hardcoded pero seguras | 4 | ✅ OK |
| **Requieren corrección** | **5** | **⚠️ Fix** |

#### URLs que Requieren Corrección

| Archivo | Línea | URL | Problema |
|---------|-------|-----|----------|
| `backend/config/settings.py` | 436 | CSP_CONNECT_SRC localhost URLs | Hardcoded dev URLs en CSP |
| `backend/config/settings.py` | 481 | INTERNAL_IPS | Hardcoded IPs |
| `backend/apps/core/middleware/security.py` | 56, 176 | IP whitelist | IPs hardcodeadas |
| `frontend/src/components/modals/SignatureModal.tsx` | 144 | `api.ipify.org` | Servicio externo sin fallback |
| `frontend/src/layouts/Footer.tsx` | 36 | `stratekaz.com` | URL corporativa hardcodeada |

#### URLs Correctamente Configuradas ✅
- `API_URL` - Usa `VITE_API_URL`
- `ALLOWED_HOSTS` - Usa env var
- `CORS_ALLOWED_ORIGINS` - Usa env var
- `CSRF_TRUSTED_ORIGINS` - Usa env var
- `FRONTEND_URL` - Usa env var
- `CELERY_BROKER_URL` - Usa env var
- `CELERY_RESULT_BACKEND` - Usa env var

---

### 2. 🔴 CREDENCIALES EXPUESTAS (CRÍTICO)

#### Archivos .env en Control de Versiones

| Archivo | Credenciales | Riesgo |
|---------|--------------|--------|
| `backend/.env` | DB_PASSWORD: `Airetupal99*` | 🔴 CRÍTICO |
| `backend/.env.local` | DB_PASSWORD: `GrasasUser2024!SecurePass#DB` | 🔴 CRÍTICO |
| `.env` | SECRET_KEY expuesto | 🔴 ALTO |
| `backend/.env` | SECRET_KEY expuesto | 🔴 ALTO |

#### Detalles de Exposición

```
backend/.env (LÍNEAS 11-16):
  DB_USER=root
  DB_PASSWORD=Airetupal99*  ← EXPUESTO
  DB_NAME=grasas_huesos_db
  DB_HOST=127.0.0.1

backend/.env.local (LÍNEAS 7-10):
  DATABASE_PASSWORD=GrasasUser2024!SecurePass#DB  ← EXPUESTO

.env (LÍNEA 8):
  SECRET_KEY=django-insecure-grasas-y-huesos-dev-key-2024...  ← EXPUESTO
```

#### ACCIÓN INMEDIATA REQUERIDA

```bash
# 1. Remover archivos .env del historial de Git
git rm --cached backend/.env backend/.env.local .env
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 2. Rotar TODAS las credenciales expuestas
# - Cambiar contraseña de base de datos
# - Regenerar SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(64))"

# 3. Commit cambios
git add .gitignore
git commit -m "security: Remove sensitive files from version control"
```

---

### 3. Valores Mágicos

#### Business Logic Hardcodeado (CRÍTICO)

| Archivo | Línea | Variable | Valor |
|---------|-------|----------|-------|
| `settings.py` | 484 | `PRECIO_COMPRA_ECONORTE` | 3500 |
| `settings.py` | 485 | `PRECIO_REFERENCIA_COMISION` | 3000 |
| `settings.py` | 486 | `COMISION_FIJA_POR_KILO` | 100 |

**Recomendación:** Mover a tabla de configuración en base de datos.

#### Status Strings sin Constantes

| Módulo | Archivo | Ejemplos |
|--------|---------|----------|
| workflow_engine | ejecucion/models.py | 'INICIADO', 'EN_PROCESO', 'PAUSADO' |
| talent_hub | seleccion_contratacion/models.py | 'abierta', 'en_proceso', 'cerrada' |
| accounting | movimientos/models.py | 'contabilizado', 'anulado' |

#### Magic Numbers en Código

| Archivo | Línea | Código | Problema |
|---------|-------|--------|----------|
| `permissions.py` | 33, 71 | `if user.has_cargo_level(2)` | Nivel sin constante |
| `core_views.py` | 327-339 | `if task.state == 'PENDING'` | Estados Celery sin constantes |

---

### 4. Internacionalización (i18n)

**Estado:** ❌ NO EXISTE

| Componente | Estado |
|------------|--------|
| Frontend i18n library | No instalado |
| Backend Django translation | No usado |
| Archivos de traducción | No existen |
| Strings en código | Español hardcodeado |

**Strings en español encontrados:**
- Labels de botones: 'Nuevo Análisis', 'Exportar', 'Filtrar'
- Estados: 'Pendiente', 'Aprobado', 'Rechazado'
- Mensajes de validación
- Títulos de secciones

**Recomendación:** Implementar i18next para frontend y django.utils.translation para backend.

---

## B. CÓDIGO A LIMPIAR

### 1. TODOs y FIXMEs

**Total: 147 comentarios en 81 archivos**

| Categoría | Cantidad | Archivos |
|-----------|----------|----------|
| TODO | 95 | 60 |
| FIXME | 0 | 0 |
| HACK | 0 | 0 |
| XXX | 34 | 25 |
| Otros | 18 | 15 |

#### TODOs Críticos (Bloquean Funcionalidad)

| Archivo | Cantidad | Descripción |
|---------|----------|-------------|
| `workflow_engine/firma_digital/views.py` | 7 | Workflow incompleto |
| `hseq_management/medicina_laboral/views.py` | 5 | Filtro multi-tenant faltante |
| `talent_hub/onboarding_induccion/views.py` | 3 | empresa_id=1 hardcodeado |
| `motor_cumplimiento/tasks.py` | 4 | Scraping no implementado |
| `audit_system/centro_notificaciones/utils.py` | 2 | SMS/FCM pendientes |

#### TODOs Frontend

| Archivo | Cantidad | Descripción |
|---------|----------|-------------|
| `riesgos/components/tabs/ContextoOrganizacionalTab.tsx` | 9 | API hooks no implementados |
| `riesgos/components/tabs/IPEVRTab.tsx` | 2 | Modales/Export pendientes |
| `hooks/usePermissions.ts` | 2 | Roles/Groups backend |

#### Archivos Top 10 por Deuda Técnica

| Archivo | TODOs | Prioridad |
|---------|-------|-----------|
| ContextoOrganizacionalTab.tsx | 9 | Alta |
| firma_digital/views.py | 7 | Alta |
| seed_riesgos_ocupacionales.py | 7 | Baja* |
| configuracion/models.py | 6 | Baja* |
| validators.py | 6 | Baja* |
| medicina_laboral/views.py | 5 | Alta |
| identidad/views.py | 5 | Alta |

*XXX son patrones de formato, no TODOs reales

---

### 2. Código Comentado

#### Bloques Grandes (>5 líneas)

| Archivo | Líneas | Descripción | Acción |
|---------|--------|-------------|--------|
| `motor_cumplimiento/tasks.py` | 112-130 | Scraping placeholder | Crear issue o eliminar |
| `centro_notificaciones/utils.py` | 291-298 | SMS Twilio | Crear feature branch |
| `centro_notificaciones/utils.py` | 326-336 | Firebase FCM | Crear feature branch |
| `gestion_transporte/tests/test_serializers.py` | 9-41 | Test completo | Implementar o eliminar |
| `gestion_flota/tests/test_serializers.py` | 9-40 | Test completo | Implementar o eliminar |

#### Mock Data en Frontend (DEBE REEMPLAZARSE)

| Archivo | Mock Data | Estado |
|---------|-----------|--------|
| SeguridadIndustrialPage.tsx | mockPermisosTrabajo, mockInspecciones | ⚠️ Implementar hooks |
| CalidadPage.tsx | Mock data completo | ⚠️ Implementar hooks |
| AccidentalidadPage.tsx | Mock data completo | ⚠️ Implementar hooks |
| MejoraContinuaPage.tsx | Mock data completo | ⚠️ Implementar hooks |
| GestionComitesPage.tsx | Mock data completo | ⚠️ Implementar hooks |
| EmergenciasPage.tsx | Mock data completo | ⚠️ Implementar hooks |

---

### 3. Imports No Usados

| Tipo | Estado |
|------|--------|
| Python wildcard imports | ✅ Solo en venv (OK) |
| TypeScript unused imports | ✅ Mínimo |
| ESLint disable comments | 4 ubicaciones |

#### ESLint Disables Encontrados

| Archivo | Línea | Razón |
|---------|-------|-------|
| `OrganigramaCanvas.tsx` | 46, 84, 86 | React Flow types |
| `usePoliticas.ts` | 535 | Firmantes structure |

---

### 4. Funciones/Clases Muy Largas

#### Backend (>100 líneas)

| Archivo | Clase/Función | Líneas | Recomendación |
|---------|---------------|--------|---------------|
| `core/models.py` | Archivo completo | 3,245 | Dividir en módulos |
| `configuracion/models.py` | Archivo completo | 2,689 | Dividir |
| `identidad/views.py` | CorporateIdentityViewSet | 200+ | Extraer services |

#### Frontend (>300 líneas)
Ver reporte de Frontend Architecture - 9 archivos >1000 líneas

---

## C. DUPLICACIÓN DE CÓDIGO

### Resumen de Duplicación

**Código consolidable estimado: ~1,500 líneas**

| Categoría | Líneas | Prioridad |
|-----------|--------|-----------|
| Error handling (frontend) | 500+ | Alta |
| Query string builders | 100+ | Alta |
| Query key factories | 80+ | Media |
| ViewSet patterns (backend) | 300+ | Media |
| Serializer patterns | 200+ | Media |

---

### 1. Duplicación de Manejo de Errores (CRÍTICO)

**Patrón repetido en 10+ hooks:**
```typescript
// useAreas.ts, useEmpresa.ts, useStrategic.ts, usePoliticas.ts, etc.
const getErrorMessage = (error: unknown, fieldLabels: Record<string, string>) => {
  // 25-30 líneas idénticas de parsing de errores
  // ValidationError interface definida múltiples veces
  // Field translation logic repetida
};
```

**Archivos afectados:**
- `useAreas.ts` (líneas 23-94)
- `useStrategic.ts`
- `usePoliticas.ts`
- `useColaboradores.ts`
- `useGenericCRUD.ts`

---

### 2. Duplicación de Query String Building

**Mismo patrón en 20+ archivos API:**
```typescript
// rbac.api.ts (líneas 32-42)
function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
}
```

---

### 3. Duplicación de ViewSet Patterns (Backend)

**631 ViewSets con patrones idénticos:**
```python
# Repetido en 100+ ViewSets
def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user
    if hasattr(user, 'empresa_id'):
        qs = qs.filter(empresa_id=user.empresa_id)
    return qs

def perform_create(self, serializer):
    user = self.request.user
    serializer.save(created_by=user, updated_by=user)
```

---

### 4. Oportunidades de Centralización

| Prioridad | Utilidad a Crear | Impacto |
|-----------|------------------|---------|
| 1 | `frontend/src/utils/errorHandling.ts` | -500 líneas |
| 2 | `frontend/src/utils/queryBuilder.ts` | -100 líneas |
| 3 | `frontend/src/hooks/useQueryKeyFactory.ts` | -80 líneas |
| 4 | Extender `StandardViewSetMixin` | -200 líneas |
| 5 | `backend/apps/core/serializer_mixins.py` | -150 líneas |

---

### 5. Estructura de Utilidades Actual

**Backend:**
```
backend/utils/
├── validators.py      # Validadores colombianos
├── constants.py       # Constantes sistema
├── logging.py         # Formatters JSON/Color
└── logging_examples.py
```

**Frontend:**
```
frontend/src/utils/
├── formatters.ts      # Currency, date, phone, NIT (124 líneas)
├── dateUtils.ts       # Parsing fechas
├── constants.ts       # Constantes frontend
└── cn.ts              # Class name utility
```

**Estado:** Utilidades centralizadas pero incompletas.

---

## D. PROBLEMAS DETECTADOS (PRIORIZADO)

### 🔴 CRÍTICOS (Inmediato)

1. **Credenciales en Git** (6 archivos .env)
   - Contraseñas de BD expuestas
   - SECRET_KEY expuesto
   - **Acción:** Remover de Git, rotar credenciales

2. **empresa_id=1 hardcodeado** (3 ubicaciones)
   - `onboarding_induccion/views.py` líneas 59, 72, 482
   - **Acción:** Obtener de request.user

3. **Filtro multi-tenant faltante** (5 ubicaciones)
   - `medicina_laboral/views.py`
   - **Acción:** Implementar filtro por empresa

### 🟠 ALTOS (Esta semana)

4. **Workflow firma digital incompleto** (7 TODOs)
   - Lógica de aprobación, rechazo, renovación
   - **Acción:** Implementar o documentar scope

5. **Mock data en HSEQ** (6 páginas)
   - Datos falsos en producción
   - **Acción:** Implementar hooks reales

6. **Scraping no implementado** (4 TODOs)
   - `motor_cumplimiento/tasks.py`
   - **Acción:** Implementar o crear issues

### 🟡 MEDIOS (Este mes)

7. **Duplicación de código** (~1,500 líneas)
   - Error handling, query builders
   - **Acción:** Crear utilidades centralizadas

8. **Magic values** (50+ instancias)
   - Status strings, números mágicos
   - **Acción:** Crear archivo de constantes

9. **Sin i18n** (todo el proyecto)
   - **Acción:** Implementar i18next

### 🟢 BAJOS (Backlog)

10. **Código comentado** (10+ bloques)
11. **Módulos incompletos** (despachos, pesv_operativo)
12. **Test placeholders** (2 archivos)

---

## E. MÉTRICAS DE CALIDAD

| Aspecto | Rating | Notas |
|---------|--------|-------|
| Seguridad credenciales | ⭐ | 🔴 Crítico - .env expuestos |
| Configuración URLs | ⭐⭐⭐⭐ | Mayoría usa env vars |
| Constantes/Magic values | ⭐⭐ | Muchos hardcodeados |
| Duplicación código | ⭐⭐ | ~1,500 líneas duplicadas |
| TODOs/Deuda técnica | ⭐⭐⭐ | 147 pendientes |
| i18n | ⭐ | No existe |
| Código comentado | ⭐⭐⭐ | Moderado |
| **Overall** | **⭐⭐** | **Requiere atención** |

---

## F. RECOMENDACIONES

### Semana 1 (CRÍTICO)

1. **Remover .env de Git y rotar credenciales**
   - Estimado: 2 horas
   - Impacto: Seguridad

2. **Corregir empresa_id hardcodeado**
   - Estimado: 2 horas
   - Impacto: Multi-tenancy

3. **Implementar filtro multi-tenant**
   - Estimado: 4 horas
   - Impacto: Seguridad datos

### Semana 2 (ALTO)

4. **Crear utilidad de error handling**
   - Estimado: 4 horas
   - Impacto: -500 líneas duplicadas

5. **Crear query builder centralizado**
   - Estimado: 2 horas
   - Impacto: -100 líneas duplicadas

6. **Reemplazar mock data HSEQ**
   - Estimado: 16 horas
   - Impacto: Funcionalidad real

### Semana 3-4 (MEDIO)

7. **Crear constantes.ts/constants.py**
   - Estimado: 8 horas
   - Impacto: Mantenibilidad

8. **Implementar i18n básico**
   - Estimado: 16 horas
   - Impacto: Internacionalización

9. **Limpiar código comentado**
   - Estimado: 4 horas
   - Impacto: Limpieza

---

## G. ARCHIVOS QUE REQUIEREN ATENCIÓN INMEDIATA

| Archivo | Problema | Prioridad |
|---------|----------|-----------|
| `backend/.env` | Credenciales expuestas | 🔴 CRÍTICO |
| `backend/.env.local` | Credenciales expuestas | 🔴 CRÍTICO |
| `onboarding_induccion/views.py` | empresa_id=1 | 🔴 CRÍTICO |
| `medicina_laboral/views.py` | Sin filtro empresa | 🔴 CRÍTICO |
| `SeguridadIndustrialPage.tsx` | Mock data | 🟠 ALTO |
| `firma_digital/views.py` | 7 TODOs workflow | 🟠 ALTO |
| `tasks.py` | Scraping placeholder | 🟠 ALTO |

---

## CONCLUSIÓN

**Estado General:** ⚠️ REQUIERE ATENCIÓN URGENTE

**Problemas Críticos:**
- 🔴 Credenciales de BD y SECRET_KEY expuestos en Git
- 🔴 Multi-tenancy comprometido (empresa_id hardcodeado)
- 🔴 Filtros de empresa faltantes en HSEQ

**Problemas Altos:**
- ⚠️ ~1,500 líneas de código duplicado
- ⚠️ 147 TODOs pendientes
- ⚠️ Mock data en producción
- ⚠️ Sin sistema de internacionalización

**Esfuerzo de Corrección:**
- Crítico: 8 horas
- Alto: 22 horas
- Total primera fase: ~30 horas

---

*Generado por Claude Code - Agente Code Quality Specialist*
