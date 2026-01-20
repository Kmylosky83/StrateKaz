# StrateKaz - Sistema de Gestion Integral

Sistema integral de gestion empresarial para empresas colombianas con cumplimiento normativo (SG-SST, PESV, ISO 9001/14001/45001).

| Info | Valor |
|------|-------|
| **Nombre del Software** | StrateKaz |
| **Version** | 3.6.0 |
| **Ultima Actualizacion** | 20 Enero 2026 |
| **Estado** | MVP Ready - PWA Enterprise + 2FA + Centro de Notificaciones |
| **Modelo Deployment** | Multi-Instancia (1 BD por empresa) |
| **Propietario** | StrateKaz S.A.S. |

---

## Stack Tecnologico

| Capa | Tecnologia | Version | Estado |
|------|------------|---------|--------|
| **Python** | Python | 3.11+ | OK |
| **Backend** | Django + DRF | 5.0.9 | OK |
| **Base de Datos** | MySQL | 8.0+ | OK |
| **Node.js** | Node.js | 22.14.0 LTS | OK |
| **Frontend** | React + TypeScript | 18.3 + 5.3 | OK |
| **Build Tool** | Vite | 5.4.21 | OK |
| **Estilos** | Tailwind CSS | 3.4.x | OK |
| **Estado** | Zustand + TanStack Query v5 | 4.5 + 5.90 | OK |
| **PWA** | Vite PWA Plugin | 1.2.0 | OK |
| **Formularios** | React Hook Form + Zod | 7.66 + 3.22 | OK |
| **Animaciones** | Framer Motion | 11.x | OK |

### Estadisticas del Proyecto

| Metrica | Backend | Frontend |
|---------|---------|----------|
| **Archivos** | 818 .py | 542 .ts/.tsx |
| **Apps/Features** | 103 apps | 20 features |
| **Modelos** | 240 | - |
| **Componentes** | - | 30+ reutilizables |
| **Lineas de codigo** | ~50,000 | ~154,000 |

---

## Arquitectura del Sistema

### Estructura de 6 Niveles (14 Modulos, 81+ Apps)

```
NIVEL 0: CORE BASE
└── core/ (Usuarios, RBAC, Menu, Configuracion)

NIVEL 1: ESTRATEGICO (9 apps) - CONSOLIDADO
└── gestion_estrategica/
    ├── configuracion/        # EmpresaConfig, SedeEmpresa, NormaISO, UnidadMedida
    ├── organizacion/         # Areas, Cargos, Organigrama, Control de Acceso
    ├── identidad/            # Mision, Vision, Valores, Politicas
    ├── planeacion/           # Objetivos BSC, Estrategias, KPIs
    │   └── contexto/         # DOFA, PESTEL, Porter (inputs estrategicos)
    ├── gestion_documental/   # Sistema documental ISO (migrado desde HSEQ)
    ├── planificacion_sistema/# Planes anuales, programas (migrado desde HSEQ)
    ├── gestion_proyectos/    # Portafolios, Programas, Proyectos PMI
    └── revision_direccion/   # Revision gerencial ISO 9.3

NIVEL 2: CUMPLIMIENTO (14 apps)
├── motor_cumplimiento/   # Matriz Legal, Requisitos, Partes Interesadas
├── motor_riesgos/        # IPEVR, ISO 31000, Aspectos Ambientales, PESV
└── workflow_engine/      # Motor BPMN

NIVEL 3: TORRE DE CONTROL (9 apps)
└── hseq_management/      # Calidad, SST, Ambiental, Comites, Emergencias

NIVEL 4: CADENA DE VALOR (18 apps)
├── supply_chain/         # Proveedores, Compras, Almacen
├── production_ops/       # Recepcion, Procesamiento, Mantenimiento
├── logistics_fleet/      # Flota, Transporte
└── sales_crm/            # Clientes, Ventas, Facturacion

NIVEL 5: HABILITADORES (19 apps)
├── talent_hub/           # RRHH completo (11 apps)
├── admin_finance/        # Tesoreria, Presupuesto, Activos
└── accounting/           # Contabilidad (opcional)

NIVEL 6: INTELIGENCIA (11 apps)
├── analytics/            # KPIs, Dashboards, Informes
└── audit_system/         # Logs, Notificaciones, Alertas
```

---

## Inicio Rapido

### Requisitos

- **Python** 3.11+ (usar venv incluido)
- **MySQL** 8.0+
- **Node.js** 20+
- **npm** 10+

### Backend

```powershell
cd backend

# Activar entorno virtual (Python 3.11)
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos MySQL
# Crear BD: grasas_huesos_db

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Poblar datos iniciales
python manage.py seed_empresa
python manage.py seed_organizacion
python manage.py seed_identidad
python manage.py init_rbac

# Iniciar servidor
python manage.py runserver
```

### Frontend

```powershell
cd frontend

# Instalar dependencias
npm install

# Desarrollo (puerto 3010)
npm run dev

# Build para produccion
npm run build:cpanel
```

### Accesos Desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3010 |
| Backend API | http://localhost:8000/api |
| Admin Django | http://localhost:8000/admin |
| API Docs | http://localhost:8000/api/docs/ |

---

## Sistema RBAC (3 Tipos de Roles)

El sistema implementa un modelo RBAC hibrido con clara diferenciacion:

| Tipo | Descripcion | Ejemplo |
|------|-------------|---------|
| **Cargo** | Posicion en organigrama, permisos base automaticos | Operario, Supervisor, Gerente |
| **Rol Funcional** | Permisos RBAC adicionales, asignables | Aprobador, Auditor, Analista |
| **Especialidad Certificada** | Roles legales con certificacion | COPASST, Brigadista, Vigia SST |

### Asignacion

- **Cargo**: Se asigna al crear/editar usuario
- **Roles Funcionales**: Multi-seleccion en formulario de usuario
- **Especialidades**: Se gestionan en modulo Organizacion > Especialidades Certificadas

---

## Estructura del Proyecto

```
StrateKaz/
├── backend/
│   ├── apps/                 # 81 aplicaciones Django
│   │   ├── core/             # Usuarios, RBAC, Menu
│   │   ├── gestion_estrategica/
│   │   └── ...
│   ├── config/               # Settings Django
│   ├── venv/                 # Entorno virtual Python 3.11
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/       # Design System
│       ├── features/         # Modulos por funcionalidad
│       ├── hooks/            # Custom hooks (useMediaQuery, useBrandingConfig...)
│       ├── layouts/          # DashboardLayout responsive
│       └── store/            # Zustand stores
├── docs/                     # Documentacion
│   ├── INDEX-DOCUMENTACION.md
│   ├── desarrollo/          # Guias tecnicas
│   └── plans/               # Planes de trabajo
└── deploy/                   # Scripts de despliegue cPanel
```

---

## Documentacion

> **Indice maestro:** [docs/INDEX-DOCUMENTACION.md](docs/INDEX-DOCUMENTACION.md)

### Guias por Objetivo

| Objetivo | Documento | Descripcion |
|----------|-----------|-------------|
| **Continuar desarrollo** | [PLAN_CIERRE_BRECHAS.md](docs/plans/PLAN_CIERRE_BRECHAS.md) | Plan maestro de mejoras (aplicar despues de auditorias N1) |
| **Entender arquitectura** | [ESTRUCTURA-6-NIVELES-ERP.md](docs/arquitectura/ESTRUCTURA-6-NIVELES-ERP.md) | 6 niveles del sistema |
| **Referencia tecnica** | [GUIA-DESPLIEGUE-CPANEL.md](docs/devops/GUIA-DESPLIEGUE-CPANEL.md) | Deploy tecnico completo |
| **Sistema de modulos** | [INDEX_MODULOS_FEATURES.md](docs/INDEX_MODULOS_FEATURES.md) | Como agregar modulos dinamicos |
| **Gestionar versiones** | [GUIA-VERSIONAMIENTO.md](docs/desarrollo/GUIA-VERSIONAMIENTO.md) | Como cambiar version del software |
| **Patrones UI** | [CATALOGO_VISTAS_UI.md](docs/desarrollo/CATALOGO_VISTAS_UI.md) | 6 patrones estandarizados de vistas |

---

## Comandos Utiles

### Backend

```powershell
# Activar entorno (SIEMPRE usar este)
.\venv\Scripts\activate

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Seeds de datos
python manage.py seed_empresa
python manage.py seed_organizacion
python manage.py seed_identidad
python manage.py seed_configuracion_sistema

# Tests
python manage.py test apps.core
```

### Frontend

```powershell
# Desarrollo
npm run dev

# Build produccion cPanel
npm run build:cpanel

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Configuracion

### Variables de Entorno (.env)

```env
# Django
SECRET_KEY=tu-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos
DB_NAME=grasas_huesos_db
DB_USER=root
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=3306

# JWT (7 dias refresh token)
JWT_REFRESH_TOKEN_LIFETIME=10080

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3010

# Frontend
VITE_API_URL=http://localhost:8000/api
```

---

## Changelog Reciente

### v3.6.0 (20 Enero 2026)

- **Autenticación de Dos Factores (2FA) Completa**:
  - Modelo `TwoFactorAuth` con soporte TOTP (Time-based One-Time Password)
  - Integración con Google Authenticator, Authy, Microsoft Authenticator
  - Generación de QR codes para configuración rápida
  - Sistema de códigos de backup (10 códigos hasheados)
  - Endpoints completos: `/api/core/2fa/status/`, `/setup/`, `/enable/`, `/disable/`, `/verify/`, `/regenerate-backup-codes/`
  - UI completa en Perfil → Seguridad con flujo de 4 pasos
  - Componentes: `TwoFactorModal`, `Disable2FAModal`
  - Hook `use2FA` con todas las operaciones
  - Logging de auditoría específico: `log_2fa_enabled()`, `log_2fa_disabled()`, `log_2fa_verified()`, `log_backup_code_used()`
  - Rate limiting en todos los endpoints sensibles
  - Integración con login flow para verificación durante autenticación

- **Normas y Sistemas de Gestión (Catálogo Dinámico)**:
  - Sección "Normas" agregada al tab de Configuración
  - Componente `NormasISOSection` con Vista 2 (Lista CRUD)
  - Modal `NormaISOFormModal` para creación/edición
  - Hook `useNormasISO` con 7 operaciones (list, get, choices, by-category, create, update, delete)
  - Soporte para ISO, PESV, SG-SST y otras normativas aplicables
  - Selector de 10 iconos Lucide
  - Selector de 10 colores predefinidos
  - Protección de normas del sistema (es_sistema=true)
  - Soft delete implementado
  - Migración de datos: `0016_add_normas_iso_section.py`

- **Módulo de Perfil - Análisis y Validación**:
  - ✅ **PerfilPage** (Vista 4): Avatar con iniciales, edición modal, info personal/laboral
  - ✅ **SeguridadPage** (Vista 6): Cambio contraseña, sesiones activas, 2FA
  - ⚠️ **PreferenciasPage** (Vista 6): Parcial - idioma y formato sin persistencia
  - ✅ **EditProfileModal**: Edición de first_name, last_name, email, phone con validación Zod
  - ✅ **ChangePasswordModal**: Requisitos visuales, validación en tiempo real
  - ✅ **ActiveSessionsCard**: Lista de dispositivos, cierre remoto, renombrado inline
  - ❌ **Avatar real**: Modelo User.photo existe pero no hay carga de archivos (solo iniciales)
  - Estado general: 80% funcional

- **Correcciones y Mejoras**:
  - Reemplazado `antd` por `sonner` en `use2FA.ts` (sistema de notificaciones consistente)
  - Todas las funciones de logging 2FA implementadas en `audit_logging.py`
  - Exports de vistas 2FA agregados a `views/__init__.py`
  - Comentarios JSDoc actualizados en `strategic.types.ts` para reflejar alcance universal (ISO, PESV, SG-SST)

### v3.5.6 (20 Enero 2026)

- **NotificationService - Infraestructura de Notificaciones**:
  - Service layer completo en `backend/apps/audit_system/centro_notificaciones/services.py`
  - Métodos para envío individual: `send_notification()`
  - Métodos para envío masivo: `send_bulk_notification()`
  - Métodos especializados: `send_notification_by_role()`, `send_notification_by_area()`
  - Renderizado de plantillas con variables: `render_template()`
  - Respeto de preferencias de usuario (horarios, canales)
  - Soporte multi-canal: App, Email, Push (pendiente), SMS (pendiente)
  - Utilidades: `mark_as_read()`, `mark_all_as_read()`, `get_unread_count()`

- **Documentación API Completa**:
  - Guía de integración en `docs/desarrollo/API_NOTIFICACIONES.md`
  - Ejemplos de uso por módulo (Planeación, HSEQ, Workflow, Talent Hub)
  - API Reference con todos los parámetros
  - Mejores prácticas y patrones de uso
  - Configuración de email y testing

- **Seed de Tipos Iniciales**:
  - Command: `python manage.py seed_notification_types`
  - 27 tipos de notificación predefinidos:
    - **Planeación**: NUEVA_TAREA, TAREA_VENCIDA, TAREA_COMPLETADA, OBJETIVO_PROXIMO_VENCER
    - **Workflow**: SOLICITUD_APROBACION, APROBACION_CONCEDIDA, APROBACION_RECHAZADA
    - **HSEQ**: INCIDENTE_SST, CAPACITACION_PROXIMA, INSPECCION_PENDIENTE, AUDITORIA_PROGRAMADA, NO_CONFORMIDAD_ASIGNADA
    - **Talent Hub**: BIENVENIDA, EVALUACION_PENDIENTE, VACACIONES_APROBADAS, DOCUMENTO_VENCIDO
    - **Sistema**: ACTUALIZACION_SISTEMA, MANTENIMIENTO_PROGRAMADO, CAMBIO_CONTRASENA, NUEVO_MENSAJE
    - **Supply Chain**: ORDEN_COMPRA_APROBADA, STOCK_BAJO, MANTENIMIENTO_EQUIPO
    - **Gestión Documental**: DOCUMENTO_REVISION, DOCUMENTO_APROBADO
  - Cada tipo con plantillas, colores, iconos, y canales configurados

- **Listo para Integración**:
  - Otros módulos pueden consumir el servicio inmediatamente
  - Importar: `from apps.audit_system.centro_notificaciones.services import NotificationService`
  - Ejemplo: `NotificationService.send_notification(tipo=tipo, usuario=user, titulo="...", mensaje="...")`

### v3.5.5 (20 Enero 2026)

- **Fix: PreferenciasTab - Toast Notifications Corregido**:
  - Callbacks `onSettled` con timeout para permitir que el toast del hook se muestre
  - Flag `isSaving` reseteado correctamente después de mutación
  - Toast de éxito/error ahora se muestran del hook `useUpdatePreferencia`

- **Fix: MasivasTab - Select Tipo de Notificación**:
  - Estado `tiposLoading` agregado para mostrar loading state
  - Mensaje dinámico en option vacío: "Cargando tipos..." vs "Seleccione un tipo"
  - Advertencia cuando no hay tipos disponibles con link a pestaña Tipos
  - Console log para debugging de tipos cargados

- **Mejora UX: Usuarios Específicos - Checkboxes en lugar de Multi-Select**:
  - Reemplazado `<select multiple>` por lista de checkboxes con scroll
  - Contador de usuarios seleccionados en el label
  - Highlight visual de usuarios seleccionados (bg-primary-50)
  - Cada checkbox muestra: nombre completo + email
  - Scroll vertical con max-height para listas largas
  - Mensaje de error si no se selecciona ningún usuario
  - Mejor accesibilidad y UX sin necesidad de Ctrl/Cmd

- **Validaciones Mejoradas en MasivasTab**:
  - Validación de cargo cuando destinatarios_tipo === 'rol'
  - Validación de área cuando destinatarios_tipo === 'area'
  - Validación de usuarios cuando destinatarios_tipo === 'usuarios_especificos'
  - Mensajes de error específicos con toast

### v3.5.4 (20 Enero 2026)

- **Fix: Notificaciones Masivas - Payload Backend Correcto**:
  - Corregido payload para coincidir con modelo backend `NotificacionMasiva`
  - Campo `tipo` (ForeignKey a TipoNotificacion) agregado y requerido
  - `destinatarios_tipo` actualizado a valores correctos: 'todos', 'rol', 'area', 'usuarios_especificos'
  - ManyToMany fields: `roles` (array de IDs), `areas` (array de IDs), `usuarios` (array de IDs)
  - Removidos campos inexistentes en backend: `prioridad`, `enviar_email`, `enviar_push`, `enviar_sms`
  - Select de Tipo de Notificación agregado al formulario
  - Vista Previa simplificada (sin prioridad ni canales)

- **Fix: Preferencias de Notificación - Persistencia Corregida**:
  - Flag `isSaving` para evitar re-sincronización después de guardar
  - Toast notifications visibles en guardar y restaurar
  - useEffect actualizado para no sobrescribir cambios guardados
  - Callbacks `onSuccess`/`onError` implementados correctamente

- **Mejoras en MasivasTab**:
  - Hooks `useTiposNotificacion`, `useCargos`, `useAreas`, `useUsers` correctamente integrados
  - Opciones de destinatarios alineadas con backend: 'todos', 'rol', 'area', 'usuarios_especificos'
  - Validación de tipo de notificación antes de enviar
  - Toast de éxito al enviar notificación masiva

### v3.5.3 (20 Enero 2026)

- **Centro de Notificaciones Completamente Funcional**:
  - **BandejaTab**: Lista de notificaciones con marcar como leída, archivar, filtros
  - **TiposTab**: CRUD completo de tipos de notificación con modal de creación/edición
    - Modal `TipoNotificacionModal` con validación React Hook Form + Zod
    - Campos: código, nombre, categoría, color, plantillas de título/mensaje, canales
    - Hooks conectados: `useCreateTipoNotificacion`, `useUpdateTipoNotificacion`, `useDeleteTipoNotificacion`
  - **PreferenciasTab**: Configuración de canales y horarios de notificaciones
    - Toggles funcionales para canales (app, email, push)
    - Inputs de horario controlados con estado
    - Guardar y restaurar preferencias con `useUpdatePreferencia`
  - **MasivasTab**: Envío de notificaciones masivas con destinatarios dinámicos
    - Selección dinámica de cargos con `useCargos` (desde users)
    - Selección dinámica de áreas con `useAreas` (desde gestion-estrategica)
    - Formulario controlado con validación
    - Canales configurables (email, push, SMS)
    - Prioridad y plantillas personalizadas
  - **Campanita Funcional**: Bell icon en Header con contador de no leídas
  - Backend completo con ViewSets: `TipoNotificacionViewSet`, `NotificacionViewSet`, `PreferenciaNotificacionViewSet`, `NotificacionMasivaViewSet`
  - Todos los hooks React Query implementados en `useNotificaciones.ts`

### v3.5.2 (20 Enero 2026)

- **Edición de Perfil Implementada**: Funcionalidad completa de actualización de datos personales
  - Endpoint backend `PUT /api/core/users/update_profile/` en UserViewSet
  - Hook `useUpdateProfile` con TanStack Query y actualización automática de authStore
  - Componente `EditProfileModal` con validación React Hook Form + Zod
  - Campos editables: nombre, apellido, email, teléfono
  - Botón "Editar Perfil" en PageHeader de PerfilPage (Vista 1)
  - Logging de auditoría con `log_user_updated()`
  - Permisos self-service (usuario edita su propio perfil)
- **Análisis Completo del Módulo Avatar/Perfil**:
  - Documentado flujo de datos: authStore → `/api/core/users/me/` → PerfilPage
  - Identificada arquitectura: Vista 1 (Cards de Información) con edición via modal
  - Validada persistencia en localStorage via Zustand
  - Confirmado funcionamiento de cambio de contraseña y sesiones activas

### v3.5.1 (20 Enero 2026)

- **Catalogo de Vistas UI Estandarizado**: 6 patrones documentados
  - Vista 1: Tarjetas de Informacion (Cards de datos)
  - Vista 2: Lista CRUD (Tabla + acciones)
  - Vista 3: Panel de Activacion (Toggles + configuracion)
  - Vista 4: Maestro-Detalle (Lista + panel lateral)
  - Vista 5: Formulario de Accion (Form sencillo con submit)
  - Vista 6: Panel de Configuracion con Acciones (Settings)
  - Ver [CATALOGO_VISTAS_UI.md](docs/desarrollo/CATALOGO_VISTAS_UI.md)
- **Modales Mejorados**: Sistema de scroll funcional
  - BaseModal con `flex-1 overflow-y-auto` + `minHeight: 0`
  - Indicadores de sombra sticky para scroll
  - Modal size `2xl` para formularios extensos
- **Branding PWA Completo**: Configuracion end-to-end
  - Campos PWA agregados al modal de Branding
  - Seccion "Configuracion PWA" con iconos 192x192, 512x512, maskable
  - Colores PWA: theme_color y background_color
  - app_version movido a solo-lectura (gestionado centralizadamente)
  - Vista expandida: 6 cards en grid (3 columnas)
- **Perfil Estandarizado con Vista 6**:
  - SeguridadPage: Action Cards (Cambiar Contrasena, Sesiones, 2FA)
  - PreferenciasPage: Action Cards (Idioma, Formato Fecha/Hora)
- **Centro Notificaciones Estandarizado**:
  - BandejaTab: Vista 4 (Maestro-Detalle)
  - TiposTab: Vista 2 (Lista CRUD)
  - PreferenciasTab: Vista 3 (Panel Activacion)
  - MasivasTab: Vista 5 (Formulario Accion)
- **Limpieza de Codigo**:
  - Archivos de analisis temporal movidos a `docs/archive/analisis_temporal/`
  - 7 documentos de auditoria archivados

### v3.5.0 (19 Enero 2026)

- **Branding Dinamico PWA**: Todo el branding desde BD
  - Manifest PWA dinamico desde `/api/core/branding/manifest/`
  - Meta tags actualizados dinamicamente (theme-color, og:title, etc)
  - SplashScreen con logo FIJO StrateKaz (identidad de marca)
  - Footer con branding fijo: "Powered by StrateKaz"
- **Sesiones de Usuario (MS-002-A)**: Gestion completa de sesiones
  - Tracking de dispositivos (SO, navegador, IP)
  - Cierre remoto de sesiones
  - Creacion automatica en login, invalidacion en logout
  - UI en Perfil > Seguridad
- **Sprint 4 Completo**: Catalogos y Polish
  - UI Unidades de Medida con CRUD
  - UI Consecutivos con formatos configurables
- **Versionamiento Centralizado**: Single Source of Truth
  - Version desde `package.json` inyectada en build time
  - Constantes de marca en `constants/brand.ts`
  - Ver [GUIA-VERSIONAMIENTO.md](docs/desarrollo/GUIA-VERSIONAMIENTO.md)

### v3.4.0 (17 Enero 2026)

- **Responsive PWA Enterprise**: Layout mobile-first completo
  - useMediaQuery hook para breakpoints
  - Sidebar drawer en mobile con overlay
  - Header con animacion hamburger/X
  - Footer responsive
- **Splash Screen**: Logo StrateKaz mientras carga branding
- **JWT 7 dias**: Sesion extendida para mejor UX
- **Consolidacion N1**:
  - Gestion Documental migrado de HSEQ a N1
  - Planificacion Sistema migrado de HSEQ a N1
  - Rutas frontend actualizadas
- **Limpieza docs**: 25+ archivos legacy eliminados
- **Auditoria funcional N1**: Sin redundancias criticas

### v3.3.0 (15 Enero 2026)

- **RBAC v4.0 Unificado**: Sistema de permisos simplificado
  - CargoSectionAccess con acciones CRUD por seccion
  - Eliminados componentes legacy de matriz de permisos
- **Auditoria Tecnica Completa**: 7 agentes especializados
  - Puntuacion global: 7.6/10
- **Modelo Multi-Instancia**: 1 instalacion Django + 1 BD por empresa

### v3.2.0 (11 Enero 2026)

- **Testing Frontend**: 219 tests para Design System
- **Optimizacion de Iconos**: Centralizacion via DynamicIcon

### v3.1.0 (11 Enero 2026)

- **Workflow de Firmas Digitales**: Flujo de 5 estados para politicas
- **UI de Politicas Actualizada**: Botones contextuales por estado

> Ver historial completo en docs/plans/PLAN_CIERRE_BRECHAS.md

---

## Licencia

Copyright (c) 2024-2026 StrateKaz S.A.S. Todos los derechos reservados.

## Contacto

- **Web:** https://stratekaz.com
- **Email:** soporte@stratekaz.com

---

**Ultima actualizacion:** 20 Enero 2026
