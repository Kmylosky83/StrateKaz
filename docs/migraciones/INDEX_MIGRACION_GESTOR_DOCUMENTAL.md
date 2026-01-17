# Índice: Migración Gestor Documental N3 → N1

**Proyecto:** StrateKaz
**Migración:** Sistema Documental (HSEQ → Gestión Estratégica)
**Versión de Documentación:** 1.0
**Fecha:** 2026-01-17

---

## Documentación Disponible

### 📋 Documentos Principales

1. **[Resumen Ejecutivo](../RESUMEN_MIGRACION_GESTOR_DOCUMENTAL.md)**
   - Descripción: Visión de alto nivel, objetivos, impacto y criterios de éxito
   - Audiencia: Product Owners, Tech Leads, Management
   - Tiempo de lectura: 5-10 minutos

2. **[Plan Detallado de Migración](../PLAN_MIGRACION_GESTOR_DOCUMENTAL.md)**
   - Descripción: Especificación técnica completa con todos los pasos
   - Audiencia: Desarrolladores, DevOps
   - Tiempo de lectura: 30-45 minutos
   - Secciones:
     - Inventario de archivos
     - Análisis de dependencias
     - Migración de base de datos
     - Actualización de imports
     - Migración frontend
     - Eliminación de FirmaDocumento

3. **[Checklist de Migración](../CHECKLIST_MIGRACION_GESTOR_DOCUMENTAL.md)**
   - Descripción: Lista de verificación paso a paso
   - Audiencia: Persona ejecutando la migración
   - Uso: Imprimir y marcar durante ejecución
   - Fases: 8 fases, ~100 items

---

## 🛠️ Scripts y Herramientas

### Scripts de Automatización

1. **`scripts/migrate_gestor_documental.sh`**
   - **Propósito:** Automatiza la migración completa
   - **Uso:**
     ```bash
     cd /path/to/StrateKaz
     ./scripts/migrate_gestor_documental.sh
     ```
   - **Duración:** ~2 minutos (automatiza ~2h de trabajo manual)
   - **Salida:** Archivos copiados, imports actualizados, backups creados
   - **Pasos manuales restantes:** 10 items (indicados al final)

2. **`scripts/rollback_gestor_documental.sh`**
   - **Propósito:** Revierte la migración en caso de error
   - **Uso:**
     ```bash
     ./scripts/rollback_gestor_documental.sh <timestamp>
     ```
   - **Duración:** ~1 minuto
   - **Requiere:** Timestamp del backup creado

3. **`scripts/verify_gestor_documental_migration.py`**
   - **Propósito:** Verifica que la migración fue exitosa
   - **Uso:**
     ```bash
     python scripts/verify_gestor_documental_migration.py
     ```
   - **Duración:** ~30 segundos
   - **Verificaciones:**
     - INSTALLED_APPS
     - Modelos
     - Tablas de BD
     - Migraciones
     - Integración con Identidad
     - URLs
     - Archivos frontend
     - Integridad de datos
   - **Salida:** Reporte con ✓/✗ para cada check

---

## 📊 Estructura de la Migración

### Origen → Destino

```
ORIGEN (N3 - HSEQ):
  backend/apps/hseq_management/sistema_documental/
  frontend/src/features/hseq/

DESTINO (N1 - Gestión Estratégica):
  backend/apps/gestion_estrategica/gestion_documental/
  frontend/src/features/gestion-estrategica/
```

### Componentes

| Componente | Archivos | Líneas de Código | Complejidad |
|------------|----------|------------------|-------------|
| Backend Models | 1 | ~1,125 | Media |
| Backend Views | 1 | ~981 | Alta |
| Backend Serializers | 1 | ~500 est. | Media |
| Backend URLs | 1 | ~32 | Baja |
| Frontend API | 1 | ~200 est. | Baja |
| Frontend Hooks | 1 | ~150 est. | Media |
| Frontend Types | 1 | ~200 est. | Baja |
| Frontend Page | 1 | ~300 est. | Media |
| **TOTAL** | **8** | **~3,488** | **Media** |

---

## 🗺️ Roadmap de Ejecución

### Fase Previa (Antes de ejecutar)

- [ ] Leer Resumen Ejecutivo
- [ ] Revisar Plan Detallado (al menos secciones 1-3, 9)
- [ ] Imprimir Checklist
- [ ] Coordinar con equipo (comunicar migración)
- [ ] Definir ventana de tiempo

### Fase 1: Preparación (30 min)

- [ ] Crear rama git
- [ ] Crear backups
- [ ] Ejecutar script de migración automatizado
- [ ] Revisar output del script

### Fase 2: Pasos Manuales (1h 30min)

- [ ] Actualizar INSTALLED_APPS
- [ ] Actualizar URLs backend
- [ ] Actualizar rutas frontend
- [ ] Actualizar menú de navegación
- [ ] Eliminar referencias a FirmaDocumento

### Fase 3: Migraciones BD (30 min)

- [ ] Ejecutar makemigrations
- [ ] Revisar migración generada
- [ ] Ejecutar migrate
- [ ] Verificar datos

### Fase 4: Testing (30 min)

- [ ] Ejecutar script de verificación
- [ ] Tests backend
- [ ] Tests frontend
- [ ] Pruebas manuales
- [ ] Integración con Identidad

### Fase 5: Finalización (30 min)

- [ ] Limpieza de archivos antiguos
- [ ] Commit
- [ ] Push
- [ ] Crear Pull Request
- [ ] Code Review

**TIEMPO TOTAL ESTIMADO:** 4 horas

---

## 📝 Cambios Clave

### URLs API

```
ANTES:
  /api/v1/hseq/sistema-documental/documentos/
  /api/v1/hseq/sistema-documental/tipos-documento/
  /api/v1/hseq/sistema-documental/firmas/

DESPUÉS:
  /api/v1/gestion-estrategica/gestion-documental/documentos/
  /api/v1/gestion-estrategica/gestion-documental/tipos-documento/
  (firmas eliminado - usar FirmaDigital)
```

### Imports Python

```python
# ANTES
from apps.hseq_management.sistema_documental.models import Documento
from apps.hseq_management.sistema_documental.views import DocumentoViewSet

# DESPUÉS
from apps.gestion_estrategica.gestion_documental.models import Documento
from apps.gestion_estrategica.gestion_documental.views import DocumentoViewSet
```

### Imports TypeScript

```typescript
// ANTES
import { sistemaDocumentalApi } from '@/features/hseq/api/sistemaDocumentalApi';

// DESPUÉS
import { gestionDocumentalApi } from '@/features/gestion-estrategica/api/gestionDocumentalApi';
```

### Rutas Frontend

```typescript
// ANTES
{ path: '/hseq/sistema-documental', element: <SistemaDocumentalPage /> }

// DESPUÉS
{ path: '/gestion-estrategica/gestion-documental', element: <GestionDocumentalPage /> }
```

---

## ⚠️ Puntos Críticos

### ELIMINAR COMPLETAMENTE

1. **Modelo FirmaDocumento** en `models.py`
   - Clase completa
   - Imports relacionados
   - Métodos que lo usen

2. **ViewSet FirmaDocumento** en `views.py`
   - Clase completa
   - Imports relacionados
   - Registro en router (urls.py)

3. **Serializers de FirmaDocumento** en `serializers.py`
   - Ambos serializers (List y Detail)
   - Imports relacionados

4. **Interface FirmaDocumento** en tipos TypeScript
   - Interface completa
   - Propiedades `firmas` en Documento

### REEMPLAZAR CON

```python
# Usar FirmaDigital de workflow_engine
from apps.gestion_estrategica.identidad.models import FirmaDigital
from django.contrib.contenttypes.models import ContentType

# Para obtener firmas de un documento:
content_type = ContentType.objects.get_for_model(Documento)
firmas = FirmaDigital.objects.filter(
    content_type=content_type,
    object_id=documento.id
)
```

---

## 🔍 Verificación Post-Migración

### Comandos de Verificación Rápida

```bash
# 1. Verificación automatizada completa
python scripts/verify_gestor_documental_migration.py

# 2. Verificar endpoints (deben funcionar)
curl http://localhost:8000/api/v1/gestion-estrategica/gestion-documental/documentos/
curl http://localhost:8000/api/v1/gestion-estrategica/gestion-documental/tipos-documento/

# 3. Verificar endpoints antiguos (deben retornar 404)
curl http://localhost:8000/api/v1/hseq/sistema-documental/documentos/

# 4. Verificar datos
python manage.py shell
>>> from apps.gestion_estrategica.gestion_documental.models import *
>>> print(f"Tipos: {TipoDocumento.objects.count()}")
>>> print(f"Docs: {Documento.objects.count()}")

# 5. Tests
python manage.py test apps.gestion_estrategica.gestion_documental
cd frontend && npm run test -- gestion-documental
```

### Checklist Visual

Navegar en navegador a:
- [ ] `http://localhost:3000/gestion-estrategica/gestion-documental`
- [ ] Verificar carga de página
- [ ] Verificar lista de documentos
- [ ] Crear documento de prueba
- [ ] Verificar menú actualizado (sección Gestión Estratégica)

---

## 🆘 Troubleshooting

### Problema: Migración falla con error de tabla no existe

**Solución:**
```bash
# Verificar que las tablas existen
python manage.py dbshell
SHOW TABLES LIKE 'documental_%';

# Si no existen, restaurar desde backup
python manage.py loaddata backups/sistema_documental_<timestamp>.json
```

### Problema: Imports rotos después de migración

**Solución:**
```bash
# Buscar todos los imports antiguos
grep -r "hseq_management.sistema_documental" backend/ --include="*.py"

# Reemplazar automáticamente
find backend/ -name "*.py" -exec sed -i \
  's/hseq_management\.sistema_documental/gestion_estrategica.gestion_documental/g' {} +
```

### Problema: Integración con Identidad no funciona

**Solución:**
```bash
# Verificar que services.py usa el app correcto
grep "sistema_documental\|gestion_documental" \
  backend/apps/gestion_estrategica/identidad/services.py

# Debe mostrar solo "gestion_documental"
# Si muestra "sistema_documental", actualizar manualmente
```

### Problema: Frontend no encuentra módulo

**Solución:**
```typescript
// Verificar que los imports usan las rutas correctas:
// ✓ Correcto:
import { gestionDocumentalApi } from '@/features/gestion-estrategica/api/gestionDocumentalApi';

// ✗ Incorrecto:
import { sistemaDocumentalApi } from '@/features/hseq/api/sistemaDocumentalApi';
```

---

## 📚 Referencias Adicionales

### Documentación Técnica

- [Arquitectura N1-N2-N3](../arquitectura/ANALISIS-SAAS-ARQUITECTURA.md)
- [Workflow Engine (FirmaDigital)](../desarrollo/WORKFLOW-FIRMAS-FRONTEND-GUIDE.md)
- [Identidad Corporativa](../desarrollo/IDENTIDAD-CORPORATIVA-DOCUMENTACION-COMPLETA.md)

### Issues Relacionados

- [#XXX] Reorganización modular N1
- [#XXX] Eliminación de duplicidad de firmas
- [#XXX] Consolidación de Gestor Documental

### Pull Requests

- [#XXX] Migración Gestor Documental N3 → N1 (este PR)

---

## 📞 Soporte

### Contactos

**Tech Lead:**
- Nombre: [Completar]
- Email: [Completar]
- Slack: [Completar]

**DevOps:**
- Nombre: [Completar]
- Email: [Completar]
- Slack: [Completar]

### Canales de Comunicación

- **Slack:** #proyecto-stratekaz
- **Email:** dev-team@stratekaz.com
- **Jira:** [Ticket de migración]

---

## 📅 Historial de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-01-17 | Claude (BPM_SPECIALIST) | Documentación inicial completa |

---

## ✅ Quick Start

**Para ejecutar la migración:**

```bash
# 1. Leer resumen ejecutivo (5 min)
cat docs/RESUMEN_MIGRACION_GESTOR_DOCUMENTAL.md

# 2. Ejecutar migración automatizada (2 min)
./scripts/migrate_gestor_documental.sh

# 3. Completar pasos manuales indicados (1h 30min)
# - Ver output del script para lista de tareas

# 4. Verificar (30 seg)
python scripts/verify_gestor_documental_migration.py

# 5. Testing (30 min)
python manage.py test apps.gestion_estrategica.gestion_documental
cd frontend && npm run test -- gestion-documental

# 6. Commit y PR (15 min)
git add .
git commit -m "feat: Migrate Gestor Documental N3→N1"
git push origin feature/migrate-gestor-documental-to-n1
```

---

**Última actualización:** 2026-01-17
**Próxima revisión:** Después de ejecución
