# PLAN DE INTERVENCIÓN ENTERPRISE - StrateKaz

## Objetivo
Llevar el proyecto StrateKaz a nivel Enterprise para soportar las siguientes aplicaciones del ecosistema de gestión integral.

## Principios Guía
- [x] Mantener frontend y backend activos para pruebas continuas
- [x] Código reutilizable, sin hardcoding
- [x] Cero dependencias circulares
- [x] Arquitectura limpia y escalable
- [x] Testing después de cada fase crítica

---

## ESTADO DE FASES

| Fase | Nombre | Estado | Progreso |
|------|--------|--------|----------|
| 1 | Arquitectura Core | ✅ COMPLETADA | 100% |
| 2 | Sistema de Permisos RBAC | ⬜ PENDIENTE | 0% |
| 3 | Sistema de Notificaciones | ⬜ PENDIENTE | 0% |
| 4 | Identidad Corporativa | ⬜ PENDIENTE | 0% |
| 5 | Firma Digital y Canvas | ⬜ PENDIENTE | 0% |
| 6 | Configuración Dinámica | ⬜ PENDIENTE | 0% |
| 7 | Showcase y Branding | ⬜ PENDIENTE | 0% |
| 8 | UI/UX y Responsive | ⬜ PENDIENTE | 0% |
| 9 | Optimización y Performance | ⬜ PENDIENTE | 0% |
| 10 | Documentación y Tests | ⬜ PENDIENTE | 0% |

---

# FASE 1: ARQUITECTURA CORE
## 🔴 PRIORIDAD: CRÍTICA | Duración: 1-2 días

### Objetivo
Eliminar dependencias circulares y restaurar arquitectura limpia.

### Tareas

#### 1.1 Mover ViewSets Estratégicos ✅ COMPLETADO
- [x] **Archivo origen**: `backend/apps/core/viewsets_strategic.py`
- [x] **Archivo destino**: `backend/apps/gestion_estrategica/viewsets_strategic.py`
- [x] Actualizar imports en el archivo movido (rutas relativas)
- [x] Crear archivo de deprecación en core con redirect

#### 1.2 Mover Serializers Estratégicos ✅ COMPLETADO
- [x] **Archivo origen**: `backend/apps/core/serializers_strategic.py`
- [x] **Archivo destino**: `backend/apps/gestion_estrategica/serializers_strategic.py`
- [x] Actualizar imports en el archivo movido
- [x] Actualizar referencias en viewsets

#### 1.3 Actualizar URLs ✅ COMPLETADO
- [x] Modificar `backend/apps/gestion_estrategica/urls.py` para incluir nuevos viewsets
- [x] Crear archivo de deprecación en core para compatibilidad
- [x] Mantener compatibilidad de endpoints existentes

#### 1.4 Refactorizar ColaboradoresSection (Frontend) ✅ YA ESTABA CORRECTO
- [x] **Archivo**: `frontend/src/features/gestion-estrategica/components/ColaboradoresSection.tsx`
- [x] El componente YA usa hooks y componentes específicos, NO importa UsersPage
- [x] Arquitectura correcta verificada

#### 1.5 Centralizar Validadores ✅ COMPLETADO
- [x] Crear `backend/apps/core/validators.py` (~30 validadores)
- [x] UniqueCodeValidator, DateRangeValidator, HexColorValidator, etc.
- [x] Funciones helper para uso rápido

#### 1.6 Centralizar Mixins de Serializers ✅ COMPLETADO
- [x] Crear `backend/apps/core/serializers_mixins.py` (~18 mixins)
- [x] UserDisplayMixin, AuditFieldsMixin, SignatureFieldsMixin, etc.
- [x] Documentación y ejemplos de uso

### Verificación
```bash
# Backend - No debe retornar resultados
grep -r "from apps.gestion_estrategica" backend/apps/core --include="*.py" | grep -v deprecated | grep -v __pycache__

# Frontend - Verificar no hay imports de páginas completas
grep -r "import.*Page" frontend/src/features/gestion-estrategica --include="*.tsx" | grep -v index
```

### Tests Post-Fase
- [ ] `python manage.py check`
- [ ] `python manage.py test apps.core`
- [ ] `python manage.py test apps.gestion_estrategica`
- [ ] Frontend: `npm run build` sin errores
- [ ] Probar endpoints en Postman/navegador

---

# FASE 2: SISTEMA DE PERMISOS RBAC
## 🔴 PRIORIDAD: CRÍTICA | Duración: 2-3 días

### Objetivo
Completar catálogo de permisos para documentos y firmas digitales.

### Tareas

#### 2.1 Expandir Catálogo de Acciones
- [ ] **Archivo**: `backend/apps/core/management/commands/init_rbac.py`
- [ ] Agregar acciones:
  ```python
  {'code': 'SIGN', 'name': 'Firmar', 'description': 'Firmar documentos digitalmente'}
  {'code': 'DELEGATE', 'name': 'Delegar', 'description': 'Delegar firma a otro usuario'}
  {'code': 'REVOKE_DELEGATION', 'name': 'Revocar Delegación', 'description': 'Revocar delegación de firma'}
  {'code': 'VERIFY_SIGNATURE', 'name': 'Verificar Firma', 'description': 'Verificar integridad de firma'}
  {'code': 'REVIEW', 'name': 'Revisar', 'description': 'Revisar documento antes de aprobar'}
  {'code': 'REQUEST_CHANGES', 'name': 'Solicitar Cambios', 'description': 'Solicitar cambios a documento'}
  ```

#### 2.2 Crear Permisos Específicos para Workflow
- [ ] Agregar permisos combinados:
  ```python
  'workflows.sign.empresa'
  'workflows.sign.area'
  'workflows.sign.own'
  'workflows.delegate.empresa'
  'workflows.configure.empresa'
  'workflows.audit.empresa'
  'politicas_integrales.sign.empresa'
  'politicas_integrales.review.empresa'
  ```

#### 2.3 Implementar Validación en ViewSets de Firma
- [ ] **Archivo**: `backend/apps/gestion_estrategica/identidad/views_workflow.py`
- [ ] Agregar `permission_classes` con permisos específicos
- [ ] Validar permiso `SIGN` antes de firmar
- [ ] Validar cargo del usuario en el flujo de firma
- [ ] Validar orden de firma en flujos secuenciales

#### 2.4 Integrar CargoSectionAccess con Permisos
- [ ] **Archivo**: `backend/apps/core/permissions.py`
- [ ] Crear clase `RequireSectionAndPermission`
- [ ] Validar acceso a sección + permiso de acción
- [ ] Aplicar en viewsets de documentos

#### 2.5 Actualizar Frontend - Matriz de Permisos
- [ ] **Archivo**: `frontend/src/features/gestion-estrategica/components/matriz-permisos/`
- [ ] Agregar pestaña "Permisos de Documentos"
- [ ] Permitir asignar permisos SIGN, DELEGATE, REVIEW por cargo
- [ ] Mostrar permisos específicos de workflow

#### 2.6 Crear Hook useDocumentPermissions
- [ ] **Archivo**: `frontend/src/features/gestion-estrategica/hooks/useDocumentPermissions.ts`
- [ ] Hook para verificar permisos del usuario actual
- [ ] Integrar con UI para mostrar/ocultar acciones

### Verificación
```bash
python manage.py shell
>>> from apps.core.models import PermisoAccion
>>> PermisoAccion.objects.filter(code__in=['SIGN', 'DELEGATE', 'VERIFY_SIGNATURE']).count()
# Debe ser 3 o más
```

### Tests Post-Fase
- [ ] Test de creación de permisos nuevos
- [ ] Test de validación de firma con permisos
- [ ] Test de delegación con permisos
- [ ] Frontend: Matriz de permisos funcional

---

# FASE 3: SISTEMA DE NOTIFICACIONES
## 🟠 PRIORIDAD: ALTA | Duración: 1-2 días

### Objetivo
Configurar y activar sistema de notificaciones por email.

### Tareas

#### 3.1 Configurar Variables de Entorno
- [ ] **Archivo**: `backend/.env`
- [ ] Configurar:
  ```env
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USE_TLS=True
  EMAIL_HOST_USER=noreply@tudominio.com
  EMAIL_HOST_PASSWORD=app_password_aqui
  DEFAULT_FROM_EMAIL=noreply@tudominio.com
  FRONTEND_URL=https://tudominio.com
  ```

#### 3.2 Agregar FRONTEND_URL a Settings
- [ ] **Archivo**: `backend/config/settings.py`
- [ ] Agregar: `FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')`

#### 3.3 Actualizar Utils de Notificaciones
- [ ] **Archivo**: `backend/apps/audit_system/centro_notificaciones/utils.py`
- [ ] Verificar uso de `settings.FRONTEND_URL`
- [ ] Agregar logging de emails fallidos
- [ ] Implementar retry logic básico

#### 3.4 Crear Templates de Email HTML
- [ ] **Carpeta**: `backend/templates/emails/`
- [ ] Crear templates:
  - [ ] `firma_requerida.html`
  - [ ] `firma_rechazada.html`
  - [ ] `firma_completada.html`
  - [ ] `revision_pendiente.html`
  - [ ] `recordatorio_firma.html`

#### 3.5 Verificar Tareas Celery
- [ ] **Archivo**: `backend/apps/gestion_estrategica/identidad/tasks_workflow.py`
- [ ] Verificar que las tareas están registradas
- [ ] Probar ejecución manual de tareas

#### 3.6 Panel de Notificaciones Frontend
- [ ] Verificar integración con centro de notificaciones
- [ ] Mostrar badge de notificaciones no leídas
- [ ] Permitir marcar como leídas

### Verificación
```python
# Django shell
from django.core.mail import send_mail
send_mail('Test', 'Mensaje de prueba', 'from@example.com', ['to@example.com'])
# Debe enviar sin error
```

### Tests Post-Fase
- [ ] Email de prueba enviado exitosamente
- [ ] Notificación in-app creada
- [ ] Tareas Celery ejecutan sin error

---

# FASE 4: IDENTIDAD CORPORATIVA
## 🟠 PRIORIDAD: ALTA | Duración: 2-3 días

### Objetivo
Resolver redundancias y mejorar workflow de políticas.

### Tareas

#### 4.1 Resolver Redundancia de Política Integral
- [ ] **Decisión**: Usar solo modelo `PoliticaIntegral`, deprecar campo legacy
- [ ] **Archivo**: `backend/apps/gestion_estrategica/identidad/models.py`
- [ ] Marcar `CorporateIdentity.integral_policy` como deprecated
- [ ] Migrar datos existentes a modelo `PoliticaIntegral`
- [ ] Actualizar serializers para usar modelo correcto

#### 4.2 Unificar Modelos de Flujo de Firma
- [ ] **Mantener**: `backend/apps/workflow_engine/firma_digital/models.py` como fuente única
- [ ] **Deprecar**: `backend/apps/gestion_estrategica/identidad/models_workflow_firmas.py`
- [ ] Actualizar referencias en identidad para usar workflow_engine
- [ ] Crear migración de datos si es necesario

#### 4.3 Mejorar Workflow de Publicación
- [ ] **Archivo**: `backend/apps/gestion_estrategica/identidad/views_workflow.py`
- [ ] Agregar validaciones:
  - [ ] No permitir firmar en estado BORRADOR (debe estar EN_REVISION)
  - [ ] Validar que todas las firmas requeridas estén completas antes de publicar
  - [ ] Obsoletizar versiones anteriores automáticamente al publicar
- [ ] Agregar confirmación antes de publicar

#### 4.4 Frontend - Mejorar UX de Políticas
- [ ] **Archivo**: `frontend/src/features/gestion-estrategica/pages/IdentidadPage.tsx`
- [ ] Eliminar tab redundante de Política Integral (unificar)
- [ ] Mostrar claramente qué requiere firma vs qué no
- [ ] Agregar confirmación modal antes de publicar
- [ ] Mostrar historial de versiones

#### 4.5 Corregir Badge "Identidad Firmada"
- [ ] El badge solo debe aparecer en sección de Políticas
- [ ] Clarificar que Misión/Visión no requieren firma
- [ ] Actualizar tooltips explicativos

#### 4.6 Invalidación de Cache Showcase
- [ ] **Archivo**: `frontend/src/features/gestion-estrategica/hooks/useIdentity.ts`
- [ ] Invalidar query de showcase después de publicar
- [ ] Agregar `refetchOnWindowFocus: true` para datos públicos

### Verificación
```bash
# Verificar que no hay campos duplicados
python manage.py shell
>>> from apps.gestion_estrategica.identidad.models import PoliticaIntegral, CorporateIdentity
>>> # Verificar migración de datos
```

### Tests Post-Fase
- [ ] Crear política → Enviar a revisión → Firmar → Publicar (flujo completo)
- [ ] Verificar que versiones anteriores se obsoletan
- [ ] Showcase actualiza después de publicar
- [ ] Sin redundancias en UI

---

# FASE 5: FIRMA DIGITAL Y CANVAS
## 🟠 PRIORIDAD: ALTA | Duración: 1-2 días

### Objetivo
Corregir problemas de alineación del canvas de firma.

### Tareas

#### 5.1 Refactorizar SignaturePad
- [ ] **Archivo**: `frontend/src/components/forms/SignaturePad.tsx`
- [ ] Implementar dimensionamiento dinámico:
  ```tsx
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 200 });

  useLayoutEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setCanvasDimensions({
        width: Math.floor(width - 2), // -2 for border
        height: height
      });
    }
  }, [height]);
  ```
- [ ] Remover `w-full h-full` del canvas (conflicto CSS vs Canvas interno)
- [ ] Separar contenedor de canvas de contenedor de botones

#### 5.2 Implementar ResizeObserver
- [ ] Agregar observer para manejar resize de ventana
- [ ] Preservar firma actual si es posible (exportar/reimportar)
- [ ] Mostrar mensaje si se limpia por resize

#### 5.3 Corregir Layout del Contenedor
- [ ] Separar área de firma de área de botones
- [ ] Usar flexbox/grid correcto
- [ ] Evitar que padding externo afecte canvas

#### 5.4 Mejorar SignatureModal
- [ ] **Archivo**: `frontend/src/components/modals/SignatureModal.tsx`
- [ ] Pasar dimensiones explícitas al SignaturePad
- [ ] Calcular width basado en modal container
- [ ] Ajustar para móvil correctamente

#### 5.5 Testing de Calibración
- [ ] Verificar que el trazo sigue exactamente el cursor/dedo
- [ ] Probar en diferentes resoluciones
- [ ] Probar en móvil (touch events)
- [ ] Probar rotación de pantalla

#### 5.6 Agregar Indicadores Visuales
- [ ] Mostrar guía "Firme aquí" centrada
- [ ] Agregar línea base opcional
- [ ] Feedback visual al limpiar

### Verificación
```
1. Abrir modal de firma
2. Dibujar en esquina superior izquierda
3. Trazo debe aparecer exactamente donde se toca
4. Repetir en centro y esquina inferior derecha
5. Probar en móvil
```

### Tests Post-Fase
- [ ] Canvas alineado correctamente
- [ ] Trazo sigue cursor/dedo exactamente
- [ ] Funciona en desktop y móvil
- [ ] Resize no rompe el canvas

---

# FASE 6: CONFIGURACIÓN DINÁMICA
## 🟡 PRIORIDAD: MEDIA | Duración: 1-2 días

### Objetivo
Eliminar hardcoding y hacer todo configurable.

### Tareas

#### 6.1 Dinamizar Colores de Niveles Jerárquicos
- [ ] **Backend**: Agregar campo `color` a modelo `NivelJerarquico`
- [ ] Crear migración
- [ ] Actualizar serializer para incluir color
- [ ] Seed con colores por defecto

#### 6.2 Centralizar Constantes de Branding Frontend
- [ ] **Crear**: `frontend/src/config/branding.ts`
- [ ] Definir colores por defecto
- [ ] Crear hook `useBranding` para consumir desde API
- [ ] Fallback a constantes si API no responde

#### 6.3 Hook useBranding
- [ ] **Archivo**: `frontend/src/hooks/useBranding.ts`
- [ ] Consumir colores desde `EmpresaConfig`
- [ ] Cachear con staleTime largo
- [ ] Proveer colores por defecto

#### 6.4 Actualizar Componentes que Usan Colores
- [ ] Buscar y reemplazar colores hardcodeados
- [ ] Usar `useBranding()` o props de branding
- [ ] Mantener dark mode compatible

#### 6.5 Configuración de PDFs/Exports
- [ ] Pasar colores de branding a generadores de PDF
- [ ] Logo de empresa en exports
- [ ] Colores corporativos en encabezados

### Verificación
```typescript
// Debe funcionar:
const { colors } = useBranding();
console.log(colors.primary); // #6366f1 o color de empresa
```

### Tests Post-Fase
- [ ] Cambiar color primario en BD → refleja en UI
- [ ] PDFs usan colores de empresa
- [ ] Dark mode sigue funcionando

---

# FASE 7: SHOWCASE Y BRANDING
## 🟡 PRIORIDAD: MEDIA | Duración: 1-2 días

### Objetivo
Profesionalizar showcase sin colores hardcodeados.

### Tareas

#### 7.1 Refactorizar IdentidadShowcase
- [ ] **Archivo**: `frontend/src/features/gestion-estrategica/components/IdentidadShowcase.tsx`
- [ ] Remover gradientes y colores hardcodeados
- [ ] Usar colores de branding de empresa
- [ ] Diseño minimalista y profesional

#### 7.2 Diseño Minimalista
- [ ] Fondo blanco/neutro (no gradientes)
- [ ] Tipografía limpia y legible
- [ ] Espaciado generoso
- [ ] Iconos sutiles
- [ ] Sin animaciones excesivas

#### 7.3 Consumir Datos Reales
- [ ] Verificar que consume de API correctamente
- [ ] Mostrar datos de `CorporateIdentity` actual
- [ ] Mostrar políticas vigentes
- [ ] Mostrar valores corporativos

#### 7.4 Tabs sin Tiempo de Visualización
- [ ] Remover auto-rotate de tabs
- [ ] Navegación manual solamente
- [ ] Mantener estado de tab seleccionado

#### 7.5 Página Pública de Showcase
- [ ] **Archivo**: `frontend/src/pages/PublicShowcasePage.tsx`
- [ ] Accesible sin autenticación
- [ ] Responsive completo
- [ ] SEO friendly

### Verificación
- [ ] Abrir showcase sin login
- [ ] Datos de empresa correctos
- [ ] Sin colores purple/blue hardcodeados
- [ ] Diseño profesional

### Tests Post-Fase
- [ ] Showcase público funciona
- [ ] Datos actualizan después de publicar
- [ ] Sin gradientes forzados
- [ ] Responsive en móvil

---

# FASE 8: UI/UX Y RESPONSIVE
## 🟡 PRIORIDAD: MEDIA | Duración: 2-3 días

### Objetivo
Mejorar experiencia en todos los dispositivos.

### Tareas

#### 8.1 Auditar Breakpoints
- [ ] Revisar todos los componentes de gestion-estrategica
- [ ] Agregar breakpoints: sm, md, lg, xl, 2xl
- [ ] Probar en dispositivos reales

#### 8.2 Componentes Críticos a Mejorar
- [ ] `IdentidadPage.tsx` - Tabs responsive
- [ ] `ValoresDragDrop.tsx` - Grid adaptativo
- [ ] `PoliticasManager.tsx` - Tabla/cards responsive
- [ ] `OrganizacionTab.tsx` - Organigrama scrollable
- [ ] Workflow Timeline - Vertical en móvil

#### 8.3 Mejorar Formularios Móviles
- [ ] Inputs de tamaño adecuado para touch
- [ ] Teclado numérico donde aplique
- [ ] Labels visibles siempre
- [ ] Validación inline

#### 8.4 Mejorar Modales
- [ ] Full-screen en móvil
- [ ] Scroll interno correcto
- [ ] Botones accesibles

#### 8.5 Mejorar Navegación
- [ ] Menú hamburguesa funcional
- [ ] Breadcrumbs responsive
- [ ] Tabs scrollables horizontalmente

#### 8.6 Accesibilidad Básica
- [ ] Labels en inputs
- [ ] Alt text en imágenes
- [ ] Contraste de colores
- [ ] Focus visible

### Verificación
```
1. Chrome DevTools → Toggle device toolbar
2. Probar: iPhone SE, iPad, Desktop
3. Verificar todos los flujos principales
```

### Tests Post-Fase
- [ ] Lighthouse accessibility score > 80
- [ ] Funciona en iPhone SE (320px)
- [ ] Funciona en iPad
- [ ] Funciona en desktop 1920px

---

# FASE 9: OPTIMIZACIÓN Y PERFORMANCE
## 🟢 PRIORIDAD: NORMAL | Duración: 1-2 días

### Objetivo
Optimizar rendimiento para nivel enterprise.

### Tareas

#### 9.1 Backend - Queries N+1
- [ ] Usar `select_related` y `prefetch_related` en viewsets
- [ ] Revisar queries en Django Debug Toolbar
- [ ] Optimizar serializers con campos anidados

#### 9.2 Backend - Indices de BD
- [ ] Verificar índices en campos frecuentemente filtrados
- [ ] Agregar índices compuestos donde aplique
- [ ] Analizar slow queries

#### 9.3 Frontend - Code Splitting
- [ ] Lazy load de páginas no críticas
- [ ] Separar chunks por feature
- [ ] Preload de rutas críticas

#### 9.4 Frontend - Caché de Queries
- [ ] Revisar staleTime de React Query
- [ ] Implementar persistencia de cache (localStorage)
- [ ] Prefetch de datos relacionados

#### 9.5 Imágenes y Assets
- [ ] Optimizar imágenes (WebP)
- [ ] Lazy loading de imágenes
- [ ] CDN para assets estáticos

### Verificación
```bash
# Backend
python manage.py shell
>>> from django.db import connection
>>> # Ejecutar query y verificar count

# Frontend
npm run build
# Verificar tamaño de chunks
```

### Tests Post-Fase
- [ ] Tiempo de carga inicial < 3s
- [ ] Time to Interactive < 5s
- [ ] No hay queries N+1 en endpoints críticos

---

# FASE 10: DOCUMENTACIÓN Y TESTS
## 🟢 PRIORIDAD: NORMAL | Duración: 2-3 días

### Objetivo
Documentar arquitectura y agregar tests críticos.

### Tareas

#### 10.1 Documentación de Arquitectura
- [ ] Actualizar `README.md` con nueva estructura
- [ ] Diagramas de arquitectura (Mermaid)
- [ ] Documentar flujos de datos

#### 10.2 Documentación de API
- [ ] Swagger/OpenAPI actualizado
- [ ] Ejemplos de requests/responses
- [ ] Documentar permisos requeridos

#### 10.3 Tests Backend Críticos
- [ ] Tests de permisos RBAC
- [ ] Tests de workflow de firma
- [ ] Tests de notificaciones

#### 10.4 Tests Frontend Críticos
- [ ] Tests de componentes de firma
- [ ] Tests de hooks principales
- [ ] Tests de integración de flujos

#### 10.5 Configurar CI/CD
- [ ] GitHub Actions para tests
- [ ] Linting automático
- [ ] Build verification

### Verificación
```bash
# Backend
python manage.py test --verbosity=2

# Frontend
npm run test
npm run lint
```

### Tests Post-Fase
- [ ] Coverage > 60% en código crítico
- [ ] CI/CD ejecuta sin errores
- [ ] Documentación accesible

---

# CHECKLIST GLOBAL DE VERIFICACIÓN

## Antes de cada fase
- [ ] Backend corriendo: `python manage.py runserver`
- [ ] Frontend corriendo: `npm run dev`
- [ ] BD backup realizado
- [ ] Git branch creado para la fase

## Después de cada fase
- [ ] `python manage.py check` sin errores
- [ ] `python manage.py test` pasa
- [ ] `npm run build` sin errores
- [ ] Pruebas manuales de flujos afectados
- [ ] Commit con mensaje descriptivo
- [ ] Marcar fase como completada en este documento

---

# NOTAS DE IMPLEMENTACIÓN

## Orden Sugerido
1. **Fase 1** → Base arquitectónica (CRÍTICO)
2. **Fase 5** → Canvas de firma (afecta UX inmediatamente)
3. **Fase 2** → Permisos (seguridad)
4. **Fase 4** → Identidad Corporativa (funcionalidad core)
5. **Fase 3** → Notificaciones (activar comunicación)
6. **Fases 6-10** → Mejoras incrementales

## Estimación Total
- **Fases Críticas (1-5)**: 8-12 días
- **Fases Medias (6-8)**: 4-7 días
- **Fases Normales (9-10)**: 3-5 días
- **Total**: 15-24 días de desarrollo

## Recursos Necesarios
- 1 desarrollador fullstack
- Acceso a servidor de pruebas
- Credenciales de email para testing
- Dispositivos móviles para testing responsive

---

# HISTORIAL DE CAMBIOS

| Fecha | Fase | Cambio | Autor |
|-------|------|--------|-------|
| 2026-01-09 | - | Creación del plan | Claude Code |

---

*Última actualización: 2026-01-09*
