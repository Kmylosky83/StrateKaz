# StrateKaz - Sistema de Gestion Integral

Sistema integral de gestion empresarial para empresas colombianas con cumplimiento normativo (SG-SST, PESV, ISO 9001/14001/45001).

| Info | Valor |
|------|-------|
| **Nombre del Software** | StrateKaz |
| **Version** | 3.4.0 |
| **Ultima Actualizacion** | 17 Enero 2026 |
| **Estado** | MVP Ready - Responsive PWA Enterprise |
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
| **Desplegar a produccion** | [DESPLIEGUE-PASO-A-PASO.md](docs/DESPLIEGUE-PASO-A-PASO.md) | Guia simplificada paso a paso |
| **Continuar desarrollo** | [PLAN_CIERRE_BRECHAS.md](docs/plans/PLAN_CIERRE_BRECHAS.md) | Plan maestro de mejoras |
| **Entender arquitectura** | [ESTRUCTURA-6-NIVELES-ERP.md](docs/arquitectura/ESTRUCTURA-6-NIVELES-ERP.md) | 6 niveles del sistema |
| **Referencia tecnica** | [GUIA-DESPLIEGUE-CPANEL.md](docs/devops/GUIA-DESPLIEGUE-CPANEL.md) | Deploy tecnico completo |

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

**Ultima actualizacion:** 17 Enero 2026
