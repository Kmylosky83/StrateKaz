# Resumen Ejecutivo: Migración Gestor Documental N3 → N1

**Proyecto:** StrateKaz - Sistema de Gestión Empresarial
**Fecha:** 2026-01-17
**Elaborado por:** Claude (BPM_SPECIALIST)
**Versión:** 1.0

---

## Objetivo

Migrar el módulo **Sistema Documental** desde el nivel arquitectónico N3 (HSEQ Management) al nivel N1 (Gestión Estratégica), reconociendo su naturaleza transversal a toda la organización.

---

## Justificación

### Problema Actual
El Gestor Documental está ubicado en `apps/hseq_management/sistema_documental/`, dando la impresión de que es exclusivo para HSEQ, cuando en realidad:

- Es transversal a toda la organización
- Gestiona documentos de todos los departamentos
- Tiene integración directa con Identidad Corporativa (N1)
- No depende de funcionalidades específicas de HSEQ

### Beneficios de la Migración

1. **Arquitectura Coherente:** El gestor documental estará en el nivel correcto (N1)
2. **Acceso Universal:** Todos los módulos pueden usarlo sin dependencia cruzada
3. **Mejor Governance:** Control documental centralizado a nivel estratégico
4. **Escalabilidad:** Preparado para crecer con la organización
5. **Eliminación de Duplicidad:** Consolidar firmas digitales en un único sistema

---

## Alcance

### Componentes a Migrar

**Backend (6 modelos):**
- ✅ TipoDocumento
- ✅ PlantillaDocumento
- ✅ Documento
- ✅ VersionDocumento
- ✅ CampoFormulario
- ✅ ControlDocumental
- ❌ FirmaDocumento (eliminar, usar FirmaDigital)

**Frontend (4 archivos):**
- API client
- Custom hooks
- TypeScript types
- Página principal

**Base de Datos:**
- 6 tablas (mantener nombres `documental_*`)
- 1 tabla a eliminar (`documental_firma_documento`)

### Fuera de Alcance

- Migración de archivos PDF/documentos adjuntos (se mantienen en misma ubicación)
- Cambios en lógica de negocio
- Nuevas funcionalidades

---

## Impacto

### Cambios BREAKING

1. **URLs API cambian:**
   - Antes: `/api/v1/hseq/sistema-documental/`
   - Después: `/api/v1/gestion-estrategica/gestion-documental/`

2. **Imports en código:**
   - Antes: `from apps.hseq_management.sistema_documental.models import Documento`
   - Después: `from apps.gestion_estrategica.gestion_documental.models import Documento`

3. **Modelo eliminado:**
   - `FirmaDocumento` → Reemplazado por `FirmaDigital` (workflow_engine)

### Componentes Afectados

| Componente | Tipo de Cambio | Criticidad |
|------------|----------------|------------|
| Identidad Service | Actualizar imports | Alta |
| URLs Backend | Actualizar rutas | Alta |
| Frontend Routes | Actualizar paths | Media |
| Menú Navegación | Mover sección | Baja |
| Tests | Actualizar imports | Media |

---

## Recursos

### Archivos Generados

1. **Plan Detallado:** `docs/PLAN_MIGRACION_GESTOR_DOCUMENTAL.md` (40+ páginas)
2. **Checklist:** `docs/CHECKLIST_MIGRACION_GESTOR_DOCUMENTAL.md` (verificación paso a paso)
3. **Script de Migración:** `scripts/migrate_gestor_documental.sh` (automatización)
4. **Script de Rollback:** `scripts/rollback_gestor_documental.sh` (plan B)
5. **Script de Verificación:** `scripts/verify_gestor_documental_migration.py` (8 checks)
6. **Resumen Ejecutivo:** Este documento

### Tiempo Estimado

| Fase | Duración | Descripción |
|------|----------|-------------|
| Preparación | 30 min | Backups y setup |
| Backend | 1h 30min | Copiar archivos, actualizar imports, configurar |
| Base de Datos | 30 min | Migraciones y verificación |
| Frontend | 45 min | Copiar y actualizar archivos TypeScript/React |
| Testing | 30 min | Pruebas automatizadas y manuales |
| Limpieza | 15 min | Eliminar archivos antiguos |
| **TOTAL** | **4 horas** | Migración completa |

---

## Ejecución

### Pasos de Alto Nivel

1. **Ejecutar script automatizado:**
   ```bash
   ./scripts/migrate_gestor_documental.sh
   ```

2. **Completar pasos manuales (indicados por el script):**
   - Actualizar `INSTALLED_APPS`
   - Actualizar URLs
   - Actualizar rutas frontend
   - Actualizar menú de navegación

3. **Ejecutar migraciones:**
   ```bash
   python manage.py makemigrations gestion_documental
   python manage.py migrate gestion_documental
   ```

4. **Verificar migración:**
   ```bash
   python scripts/verify_gestor_documental_migration.py
   ```

5. **Testing completo:**
   - Tests backend
   - Tests frontend
   - Pruebas manuales
   - Integración con Identidad

6. **Commit y PR:**
   ```bash
   git add .
   git commit -m "feat: Migrate Gestor Documental N3→N1"
   git push origin feature/migrate-gestor-documental-to-n1
   ```

---

## Riesgos y Mitigación

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos | Baja | Alto | Backups múltiples antes de migrar |
| Integración rota con Identidad | Media | Alto | Tests de integración exhaustivos |
| URLs rotas en producción | Media | Medio | Verificación de endpoints antes de deploy |
| Imports incorrectos | Baja | Medio | Script automatizado + verificación |
| Firmas existentes perdidas | Media | Alto | Migración de FirmaDocumento a FirmaDigital |

### Plan de Rollback

Si la migración falla:

```bash
# 1. Ejecutar script de rollback
./scripts/rollback_gestor_documental.sh <timestamp>

# 2. Revertir commit
git revert HEAD

# 3. Restaurar configuración manual
# - INSTALLED_APPS
# - URLs
# - Rutas frontend
```

**Tiempo de rollback estimado:** 15-30 minutos

---

## Criterios de Éxito

### Verificaciones Obligatorias

- [ ] **8/8 checks pasan** en script de verificación
- [ ] **0 errores** en migraciones
- [ ] **Tests backend pasan** (100%)
- [ ] **Tests frontend pasan** (100%)
- [ ] **Integración con Identidad funciona** (crear y enviar política)
- [ ] **Endpoints responden** en nueva ruta
- [ ] **Endpoints antiguos retornan 404**
- [ ] **Menú actualizado** en frontend
- [ ] **Documentos existentes** accesibles
- [ ] **Sin pérdida de datos** (counts iguales)

### Métricas de Validación

```python
# Backend
from apps.gestion_estrategica.gestion_documental.models import *

assert TipoDocumento.objects.count() == <count_antes>
assert Documento.objects.count() == <count_antes>
assert PlantillaDocumento.objects.count() == <count_antes>

# Integración
from apps.gestion_estrategica.identidad.services import GestorDocumentalService
assert GestorDocumentalService.is_documental_available() == True
```

---

## Entregables

### Documentación

- [x] Plan detallado de migración (40+ páginas)
- [x] Checklist paso a paso
- [x] Scripts de automatización
- [x] Script de verificación
- [x] Script de rollback
- [x] Resumen ejecutivo

### Código

- [ ] Módulo migrado en N1
- [ ] Migraciones de BD
- [ ] Tests actualizados
- [ ] Frontend migrado
- [ ] Integración con Identidad actualizada

### Validación

- [ ] Reporte de verificación (8 checks)
- [ ] Capturas de pantalla (antes/después)
- [ ] Logs de migración
- [ ] Confirmación de integridad de datos

---

## Próximos Pasos

### Inmediato (Post-Migración)

1. Ejecutar en ambiente de desarrollo
2. Verificar con script de validación
3. Pruebas exhaustivas
4. Crear Pull Request
5. Code review

### Corto Plazo

1. Deploy a staging
2. Pruebas con usuarios
3. Ajustes según feedback
4. Deploy a producción
5. Monitoreo 24h

### Mediano Plazo

1. Documentar nuevas rutas en API docs
2. Actualizar tutoriales de usuario
3. Capacitación a equipo
4. Optimizaciones identificadas

---

## Contacto

**Responsable técnico:** [Nombre del Tech Lead]
**Email:** [email@ejemplo.com]
**Slack:** #proyecto-stratekaz

**Soporte durante migración:**
- Horario: [Definir horario de soporte]
- Canal: [Canal de comunicación]

---

## Conclusión

La migración del Gestor Documental de N3 a N1 es una mejora arquitectónica significativa que:

✅ Corrige la ubicación del módulo según su naturaleza transversal
✅ Elimina duplicidad de firmas digitales
✅ Mejora la coherencia del sistema
✅ Facilita el crecimiento futuro
✅ Mantiene compatibilidad de datos

**Riesgo general:** Medio (con mitigaciones implementadas)
**Complejidad:** Media (automatización reduce riesgo)
**Impacto en usuarios:** Bajo (cambios transparentes)
**ROI:** Alto (arquitectura más limpia y mantenible)

**Recomendación:** PROCEDER con la migración siguiendo el plan establecido.

---

## Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Tech Lead | _____________ | _______ | ___/___/___ |
| DevOps | _____________ | _______ | ___/___/___ |
| Product Owner | _____________ | _______ | ___/___/___ |
| QA Lead | _____________ | _______ | ___/___/___ |

---

**Versión:** 1.0
**Última actualización:** 2026-01-17
**Siguiente revisión:** [Después de ejecución]
