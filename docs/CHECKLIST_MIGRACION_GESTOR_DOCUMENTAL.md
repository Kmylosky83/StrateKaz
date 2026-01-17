# Checklist de Migración: Gestor Documental N3 → N1

**Proyecto:** StrateKaz
**Fecha inicio:** _________________
**Responsable:** _________________
**Tiempo estimado:** 4 horas

---

## Pre-Migración

### Preparación
- [ ] Leer plan completo: `docs/PLAN_MIGRACION_GESTOR_DOCUMENTAL.md`
- [ ] Crear rama git: `git checkout -b feature/migrate-gestor-documental-to-n1`
- [ ] Verificar que no hay cambios sin commit: `git status`
- [ ] Comunicar a equipo sobre migración planificada

### Backups
- [ ] Backup de base de datos completa
- [ ] Backup específico de módulo: `python manage.py dumpdata hseq_management.sistema_documental > backup.json`
- [ ] Backup de archivos del módulo
- [ ] Anotar timestamp del backup: __________________

---

## Fase 1: Migración Backend (1h 30min)

### Estructura de Directorios
- [ ] Crear `backend/apps/gestion_estrategica/gestion_documental/`
- [ ] Crear subdirectorio `migrations/`
- [ ] Crear subdirectorio `tests/`
- [ ] Crear `__init__.py` en cada directorio

### Copiar Archivos Python
- [ ] Copiar `models.py`
- [ ] Copiar `views.py`
- [ ] Copiar `serializers.py`
- [ ] Copiar `urls.py`
- [ ] Copiar `admin.py`
- [ ] Copiar `apps.py`
- [ ] Copiar `tests/__init__.py`

### Actualizar Contenido de Archivos

**apps.py:**
- [ ] Cambiar `name` a `'apps.gestion_estrategica.gestion_documental'`
- [ ] Cambiar `verbose_name` a `'Gestión Documental'`

**urls.py:**
- [ ] Cambiar `app_name` de `'sistema_documental'` a `'gestion_documental'`
- [ ] Comentar/eliminar registro de `FirmaDocumentoViewSet`
- [ ] Comentar línea: `router.register(r'firmas', FirmaDocumentoViewSet, ...)`

**views.py:**
- [ ] Comentar import de `FirmaDocumento`
- [ ] Comentar import de `FirmaDocumentoViewSet`
- [ ] Comentar clase completa `FirmaDocumentoViewSet`
- [ ] Actualizar imports internos si es necesario

**serializers.py:**
- [ ] Eliminar/comentar import de `FirmaDocumento`
- [ ] Eliminar/comentar serializers relacionados con FirmaDocumento:
  - [ ] `FirmaDocumentoListSerializer`
  - [ ] `FirmaDocumentoDetailSerializer`

**models.py:**
- [ ] **ELIMINAR COMPLETAMENTE** la clase `FirmaDocumento`
- [ ] Verificar que no haya referencias a `FirmaDocumento` en otros modelos
- [ ] Agregar método `get_firmas_digitales()` a modelo `Documento`

### Actualizar Imports Globales
- [ ] Buscar referencias: `grep -r "sistema_documental" backend/ --include="*.py"`
- [ ] Reemplazar en todos los archivos del módulo:
  ```bash
  find backend/apps/gestion_estrategica/gestion_documental -name "*.py" -exec sed -i \
    's/apps\.hseq_management\.sistema_documental/apps.gestion_estrategica.gestion_documental/g' {} +
  ```

### Actualizar INSTALLED_APPS
- [ ] Abrir `backend/config/settings.py`
- [ ] Agregar en sección N1: `'apps.gestion_estrategica.gestion_documental',`
- [ ] Comentar/eliminar: `'apps.hseq_management.sistema_documental',`

---

## Fase 2: Migración Base de Datos (30min)

### Crear Migraciones
- [ ] Ejecutar: `python manage.py makemigrations gestion_documental`
- [ ] Revisar migración generada
- [ ] Verificar que mantiene `db_table='documental_*'` en modelos

### Ejecutar Migraciones
- [ ] Ejecutar: `python manage.py migrate gestion_documental`
- [ ] Verificar sin errores

### Verificar Datos
- [ ] Entrar a shell: `python manage.py shell`
- [ ] Importar modelos:
  ```python
  from apps.gestion_estrategica.gestion_documental.models import Documento, TipoDocumento
  print(TipoDocumento.objects.count())
  print(Documento.objects.count())
  ```
- [ ] Anotar counts:
  - TipoDocumento: ______
  - Documento: ______
  - PlantillaDocumento: ______

### Limpieza de FirmaDocumento
- [ ] Crear migración de limpieza (opcional):
  ```bash
  python manage.py makemigrations gestion_documental --empty -n remove_firma_documento
  ```
- [ ] Editar migración para drop table `documental_firma_documento`
- [ ] Ejecutar: `python manage.py migrate gestion_documental`

---

## Fase 3: Actualizar URLs (15min)

### HSEQ URLs
- [ ] Abrir `backend/apps/hseq_management/urls.py`
- [ ] Comentar/eliminar línea:
  ```python
  # path('sistema-documental/', include('apps.hseq_management.sistema_documental.urls')),
  ```

### Gestión Estratégica URLs
- [ ] Abrir `backend/apps/gestion_estrategica/urls.py`
- [ ] Agregar import si es necesario
- [ ] Agregar línea:
  ```python
  path('gestion-documental/', include('apps.gestion_estrategica.gestion_documental.urls')),
  ```

### Probar Endpoints
- [ ] Iniciar servidor: `python manage.py runserver`
- [ ] Probar URL nueva:
  ```bash
  curl http://localhost:8000/api/v1/gestion-estrategica/gestion-documental/documentos/
  ```
- [ ] Verificar respuesta 200 OK
- [ ] Verificar que URL antigua retorna 404:
  ```bash
  curl http://localhost:8000/api/v1/hseq/sistema-documental/documentos/
  ```

---

## Fase 4: Actualizar Integraciones (15min)

### Identidad Service
- [ ] Abrir `backend/apps/gestion_estrategica/identidad/services.py`
- [ ] Buscar `sistema_documental`
- [ ] Reemplazar por `gestion_documental`
- [ ] Línea ~39: `apps.get_model('gestion_documental', 'Documento')`
- [ ] Verificar imports si es necesario

### Buscar Otras Referencias
- [ ] Ejecutar: `grep -r "sistema_documental" backend/ --include="*.py"`
- [ ] Actualizar referencias encontradas (anotar archivos):
  - [ ] _______________________
  - [ ] _______________________
  - [ ] _______________________

---

## Fase 5: Migración Frontend (45min)

### Crear Estructura de Directorios
- [ ] `frontend/src/features/gestion-estrategica/api/`
- [ ] `frontend/src/features/gestion-estrategica/hooks/`
- [ ] `frontend/src/features/gestion-estrategica/types/`
- [ ] `frontend/src/features/gestion-estrategica/pages/`
- [ ] `frontend/src/features/gestion-estrategica/components/gestion-documental/`

### Copiar Archivos
- [ ] Copiar API:
  ```bash
  cp frontend/src/features/hseq/api/sistemaDocumentalApi.ts \
     frontend/src/features/gestion-estrategica/api/gestionDocumentalApi.ts
  ```
- [ ] Copiar Hook:
  ```bash
  cp frontend/src/features/hseq/hooks/useSistemaDocumental.ts \
     frontend/src/features/gestion-estrategica/hooks/useGestionDocumental.ts
  ```
- [ ] Copiar Types:
  ```bash
  cp frontend/src/features/hseq/types/sistema-documental.types.ts \
     frontend/src/features/gestion-estrategica/types/gestion-documental.types.ts
  ```
- [ ] Copiar Page:
  ```bash
  cp frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx \
     frontend/src/features/gestion-estrategica/pages/GestionDocumentalPage.tsx
  ```

### Actualizar gestionDocumentalApi.ts
- [ ] Cambiar `API_BASE` a `/api/v1/gestion-estrategica/gestion-documental`
- [ ] Renombrar export: `export const gestionDocumentalApi`
- [ ] Eliminar métodos relacionados con firmas:
  - [ ] `getFirmasPendientes()`
  - [ ] `firmarDocumento()`
  - [ ] `rechazarFirma()`

### Actualizar useGestionDocumental.ts
- [ ] Cambiar import: `import { gestionDocumentalApi } from '../api/gestionDocumentalApi'`
- [ ] Renombrar hook: `export const useGestionDocumental`
- [ ] Cambiar query keys: `['gestion-documental', ...]`
- [ ] Eliminar queries/mutations de firmas

### Actualizar gestion-documental.types.ts
- [ ] **ELIMINAR INTERFACE** `FirmaDocumento`
- [ ] Remover `firmas: FirmaDocumento[]` de interface `Documento`
- [ ] Actualizar comentarios si es necesario

### Actualizar GestionDocumentalPage.tsx
- [ ] Cambiar import del hook: `import { useGestionDocumental } from '../hooks/useGestionDocumental'`
- [ ] Actualizar título de página
- [ ] Eliminar sección de firmas pendientes
- [ ] Actualizar rutas de navegación si es necesario

### Actualizar React Router
- [ ] Abrir `frontend/src/routes/index.tsx` (o archivo de rutas)
- [ ] Mover/agregar ruta:
  ```typescript
  {
    path: '/gestion-estrategica/gestion-documental',
    element: <GestionDocumentalPage />,
  }
  ```
- [ ] Eliminar/comentar ruta antigua:
  ```typescript
  // {
  //   path: '/hseq/sistema-documental',
  //   element: <SistemaDocumentalPage />,
  // }
  ```

### Actualizar Menú de Navegación
- [ ] Localizar archivo del menú (ej: `Sidebar.tsx`)
- [ ] Mover "Gestión Documental" de sección HSEQ a Gestión Estratégica
- [ ] Actualizar path: `/gestion-estrategica/gestion-documental`

---

## Fase 6: Testing (30min)

### Tests Backend
- [ ] Ejecutar tests del módulo:
  ```bash
  python manage.py test apps.gestion_estrategica.gestion_documental
  ```
- [ ] Anotar resultados: _______________

### Tests de Integración
- [ ] Probar integración con Identidad (shell Django):
  ```python
  from apps.gestion_estrategica.identidad.services import GestorDocumentalService
  print(GestorDocumentalService.is_documental_available())
  # Debe retornar: True
  ```

### Tests Frontend
- [ ] Ejecutar tests:
  ```bash
  cd frontend
  npm run test -- gestion-documental
  ```
- [ ] Anotar resultados: _______________

### Pruebas Manuales
- [ ] Iniciar desarrollo: `npm run dev`
- [ ] Navegar a `/gestion-estrategica/gestion-documental`
- [ ] Verificar carga de página
- [ ] Crear tipo de documento
- [ ] Crear documento
- [ ] Aprobar documento
- [ ] Publicar documento
- [ ] Verificar en lista maestro

### Integración Completa
- [ ] Crear política en Identidad
- [ ] Completar proceso de firmas
- [ ] Enviar a Gestor Documental
- [ ] Verificar documento creado con código POL-XXX-001
- [ ] Verificar estado VIGENTE en política

---

## Fase 7: Limpieza (15min)

### Eliminar Módulo Antiguo (Backend)
- [ ] **IMPORTANTE:** Solo después de verificar que todo funciona
- [ ] Backup adicional antes de eliminar
- [ ] Eliminar directorio:
  ```bash
  rm -rf backend/apps/hseq_management/sistema_documental/
  ```

### Eliminar Archivos Frontend Antiguos
- [ ] `rm frontend/src/features/hseq/api/sistemaDocumentalApi.ts`
- [ ] `rm frontend/src/features/hseq/hooks/useSistemaDocumental.ts`
- [ ] `rm frontend/src/features/hseq/types/sistema-documental.types.ts`
- [ ] `rm frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx`

### Limpiar Imports No Usados
- [ ] Ejecutar linter: `cd frontend && npm run lint`
- [ ] Ejecutar formatter: `npm run format`
- [ ] Corregir warnings

---

## Fase 8: Documentación y Commit (15min)

### Verificación Final
- [ ] Ejecutar script de verificación:
  ```bash
  python scripts/verify_gestor_documental_migration.py
  ```
- [ ] Todas las verificaciones pasan: SÍ / NO

### Git Operations
- [ ] Ver cambios: `git status`
- [ ] Agregar archivos nuevos:
  ```bash
  git add backend/apps/gestion_estrategica/gestion_documental/
  git add frontend/src/features/gestion-estrategica/
  ```
- [ ] Eliminar archivos antiguos:
  ```bash
  git rm -r backend/apps/hseq_management/sistema_documental/
  git rm frontend/src/features/hseq/api/sistemaDocumentalApi.ts
  git rm frontend/src/features/hseq/hooks/useSistemaDocumental.ts
  git rm frontend/src/features/hseq/types/sistema-documental.types.ts
  git rm frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx
  ```
- [ ] Commit con mensaje descriptivo:
  ```bash
  git commit -m "feat(gestion-estrategica): Migrate Gestor Documental from N3 to N1

  BREAKING CHANGE: Sistema Documental moved from HSEQ to Gestión Estratégica

  - Move TipoDocumento, PlantillaDocumento, Documento, VersionDocumento,
    CampoFormulario, ControlDocumental to gestion_documental
  - Remove FirmaDocumento (use FirmaDigital from workflow_engine)
  - Update API routes: /gestion-estrategica/gestion-documental/
  - Update frontend imports and routing
  - Update Identidad integration service

  Refs: #XXX"
  ```

### Crear Pull Request
- [ ] Push: `git push origin feature/migrate-gestor-documental-to-n1`
- [ ] Crear PR en GitHub/GitLab
- [ ] Agregar descripción detallada
- [ ] Agregar screenshots (antes/después)
- [ ] Solicitar revisión
- [ ] Link al PR: _______________________

---

## Post-Migración

### Comunicación
- [ ] Notificar a equipo de desarrollo
- [ ] Actualizar documentación de API
- [ ] Actualizar README si es necesario
- [ ] Notificar a usuarios sobre cambio de rutas

### Monitoreo
- [ ] Monitorear logs de errores 24h
- [ ] Verificar métricas de uso
- [ ] Recopilar feedback de usuarios

### Rollback Plan (Si es necesario)
- [ ] Ejecutar: `./scripts/rollback_gestor_documental.sh <timestamp>`
- [ ] Revertir commit: `git revert HEAD`
- [ ] Restaurar INSTALLED_APPS
- [ ] Restaurar URLs
- [ ] Notificar equipo

---

## Notas y Observaciones

### Problemas Encontrados
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Soluciones Aplicadas
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Mejoras Identificadas
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Firmas

**Ejecutó migración:**
- Nombre: _______________________
- Fecha: _______________________
- Firma: _______________________

**Verificó migración:**
- Nombre: _______________________
- Fecha: _______________________
- Firma: _______________________

**Aprobó para producción:**
- Nombre: _______________________
- Fecha: _______________________
- Firma: _______________________

---

## Anexo: Comandos Rápidos

### Ejecutar migración completa
```bash
./scripts/migrate_gestor_documental.sh
```

### Verificar migración
```bash
python scripts/verify_gestor_documental_migration.py
```

### Rollback
```bash
./scripts/rollback_gestor_documental.sh <timestamp>
```

### Tests rápidos
```bash
# Backend
python manage.py test apps.gestion_estrategica.gestion_documental

# Frontend
cd frontend && npm run test -- gestion-documental
```

### Verificar endpoints
```bash
# Nuevo (debe funcionar)
curl http://localhost:8000/api/v1/gestion-estrategica/gestion-documental/documentos/

# Antiguo (debe retornar 404)
curl http://localhost:8000/api/v1/hseq/sistema-documental/documentos/
```

---

**Estado Final:** ⬜ PENDIENTE | ⬜ EN PROGRESO | ⬜ COMPLETADO | ⬜ FALLIDO

**Tiempo total:** _______ horas (estimado: 4h)

**Fecha de inicio:** _________________

**Fecha de finalización:** _________________
