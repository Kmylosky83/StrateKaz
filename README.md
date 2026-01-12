# StrateKaz - Sistema de Gestion Integral

> **IMPORTANTE:** El nombre del directorio "Grasas y Huesos del Norte" es TEMPORAL.
> El software se llama **StrateKaz** y el directorio sera renombrado antes del despliegue.

Sistema integral de gestion empresarial multi-tenant para empresas colombianas con cumplimiento normativo (SG-SST, PESV, ISO 9001/14001/45001).

| Info | Valor |
|------|-------|
| **Nombre del Software** | StrateKaz |
| **Version** | 3.1.0 |
| **Ultima Actualizacion** | 11 Enero 2026 |
| **Estado** | MVP - Workflow de Firmas Digitales v3.1 |
| **Propietario** | StrateKaz S.A.S. |
| **Calificacion Backend** | 8.5/10 |
| **Calificacion Frontend** | 7.5/10 |

---

## Stack Tecnologico

| Capa | Tecnologia | Version | Estado |
|------|------------|---------|--------|
| **Python** | Python | 3.11+ | ✅ OK |
| **Backend** | Django + DRF | 5.0.9 | ✅ OK |
| **Base de Datos** | MySQL | 8.0+ | ✅ OK |
| **Node.js** | Node.js | 22.14.0 LTS | ✅ Excelente |
| **Frontend** | React + TypeScript | 18.3 + 5.3 | ✅ OK |
| **Build Tool** | Vite | 5.4.21 | ✅ OK |
| **Estilos** | Tailwind CSS | 3.4.x | ✅ OK |
| **Estado** | Zustand + TanStack Query v5 | 4.5 + 5.90 | ✅ Moderno |
| **PWA** | Vite PWA Plugin | 1.2.0 | ✅ OK |
| **Formularios** | React Hook Form + Zod | 7.66 + 3.22 | ✅ OK |

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

### Estructura de 6 Niveles (14 Modulos, 81 Apps)

```
NIVEL 0: CORE BASE
└── core/ (Usuarios, RBAC, Menu, Configuracion)

NIVEL 1: ESTRATEGICO (6 apps)
└── gestion_estrategica/
    ├── configuracion/    # EmpresaConfig, SedeEmpresa, NormaISO, UnidadMedida
    ├── organizacion/     # Areas, Cargos, Organigrama, Control de Acceso
    ├── identidad/        # Mision, Vision, Valores, Politicas
    ├── planeacion/       # Objetivos, Estrategias, KPIs
    ├── gestion_proyectos/# Portafolios, Programas, Proyectos PMI
    └── revision_direccion/

NIVEL 2: CUMPLIMIENTO (14 apps)
├── motor_cumplimiento/   # Matriz Legal, Requisitos, Partes Interesadas
├── motor_riesgos/        # DOFA, IPEVR, ISO 31000, PESV
└── workflow_engine/      # Motor BPMN

NIVEL 3: TORRE DE CONTROL (11 apps)
└── hseq_management/      # Documentos, Calidad, SST, Ambiental

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
| **Especialidad Certificada** | Roles legales con certificacion | COPASST, Brigadista, Vigía SST |

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
│       ├── hooks/            # Custom hooks
│       └── store/            # Zustand stores
├── docs/                     # Documentacion
│   ├── 00-EMPEZAR-AQUI.md   # Punto de entrada
│   ├── desarrollo/          # Guias tecnicas
│   └── arquitectura/        # Catalogo modulos
└── scripts/                  # Scripts utilidad
```

---

## Documentacion

> **Punto de entrada:** [docs/00-EMPEZAR-AQUI.md](docs/00-EMPEZAR-AQUI.md)

### Guias Principales

| Documento | Descripcion |
|-----------|-------------|
| [ARQUITECTURA-DINAMICA.md](docs/desarrollo/ARQUITECTURA-DINAMICA.md) | Sistema 100% dinamico desde BD |
| [DESIGN-SYSTEM.md](docs/desarrollo/DESIGN-SYSTEM.md) | Componentes UI y patrones |
| [SISTEMA-ICONOS-DINAMICOS.md](docs/desarrollo/SISTEMA-ICONOS-DINAMICOS.md) | Iconos dinamicos Lucide |
| [IDENTIDAD-CORPORATIVA-MODULO.md](docs/desarrollo/IDENTIDAD-CORPORATIVA-MODULO.md) | Identidad, Valores Vividos, Showcase |
| [GUIA-DESPLIEGUE-CPANEL.md](docs/GUIA-DESPLIEGUE-CPANEL.md) | Deploy en hosting compartido |

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

# Actualizar iconos de valores
python manage.py update_valores_icons

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

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3010

# Frontend
VITE_API_URL=http://localhost:8000/api
```

---

## Changelog Reciente

### v3.1.0 (11 Enero 2026)

- **Workflow de Firmas Digitales Completo**: Flujo de 5 estados para politicas
  - BORRADOR: Creacion y edicion de politicas
  - EN_REVISION: Esperando firmas de responsables
  - FIRMADO: Todas las firmas completadas
  - VIGENTE: Publicada en Gestor Documental
  - OBSOLETO: Version historica archivada
- **UI de Politicas Actualizada**:
  - Botones de accion contextuales por estado
  - "Enviar a Firma" desde BORRADOR
  - "Enviar a Documental" desde FIRMADO
  - "Nueva Version" desde VIGENTE (bloquea edicion de vigentes)
  - Indicador "Esperando firmas" en EN_REVISION
  - Indicador "Version historica" en OBSOLETO
- **Codigo de Politica Opcional**: Campo `code` ahora nullable
  - Codigo asignado por Gestor Documental al publicar
  - Formato: POL-{NORMA}-{SECUENCIAL}
  - UI muestra "Sin codigo asignado" para borradores
- **Hooks de Workflow**:
  - `useEnviarADocumental`: Transicion FIRMADO -> VIGENTE
  - `useCrearNuevaVersion`: Crea copia en BORRADOR desde VIGENTE
- **Seed de Workflows**: 7 configuraciones de workflow pobladas
- **Migracion 0008**: Campo code opcional en PoliticaEspecifica

### v3.0.0 (11 Enero 2026)

- **Sistema de Politicas Unificado v3.0**: Refactorizacion completa del modulo de politicas
  - Eliminada seccion legacy "Politica Integral" del tab Identidad
  - Renombrada "Politicas Especificas" a "Politicas"
  - Modal unificado para crear/editar politicas con RichTextEditor
  - Selector de tipo de politica con 8 categorias
- **Tipos de Politica Expandidos**:
  - Politica Integral (POL-INT)
  - Politica de SST (POL-SST)
  - Politica de Calidad (POL-CAL)
  - Politica Ambiental (POL-AMB)
  - Politica PESV (POL-PESV)
  - Politica de Sostenibilidad (POL-SOS)
  - Politica Contable (POL-CON)
  - Otras Politicas (POL-OTR)
- **Mejoras UI/UX**:
  - RichTextEditor (TipTap) para contenido de politicas
  - DynamicIcon con colores por tipo de politica
  - Fallback de tipos cuando backend no disponible

### v2.7.0 (09 Enero 2026)

- **Firma Manuscrita Integrada**: SignatureModal conectado al workflow de firmas
  - Hash SHA-256 para integridad de firma
  - Modal reutilizable en PoliticasManager
- **Showcase Publico**: URL publica para compartir identidad corporativa
  - Ruta `/showcase` accesible sin autenticacion
  - Slides de Mision, Vision, Valores, Politica, Metricas
- **Badge de Notificaciones**: Contador dinamico en header
- **Migracion empresa_id**: CorporateIdentity vinculado a EmpresaConfig

### v2.6.0 (09 Enero 2026)

- **Auditoria Identidad Corporativa**: Analisis exhaustivo de tipos, modelos y componentes
- **Refactorizacion PoliticasManager**: Componentes extraidos para mejor mantenibilidad
- **Consolidacion de tipos**: Eliminacion de duplicados PaginatedResponse y SelectOption
- **Correcciones backend**: Multi-tenancy, hash idempotente, transacciones atomicas
- **Limpieza legacy**: Eliminacion de codigo Docker y app proveedores migrada

### v2.5.0 (08 Enero 2026)

- **Valores Vividos (BI)**: Sistema de conexion valor-accion con GenericForeignKey
  - Vincular valores corporativos a proyectos, acciones correctivas, etc.
  - Endpoints de metricas para Business Intelligence
  - Widget reutilizable `ValorVinculadorWidget`
- **Vista Showcase**: Presentacion fullscreen de identidad corporativa
  - Slideshow automatico (Mision, Vision, Valores, Politica, Metricas)
  - Navegacion por teclado y pantalla completa
  - Graficos de valores vividos conectados con BI
- **Exportacion de Documentos**: PDF (WeasyPrint) y DOCX (python-docx)
  - Politicas integrales y especificas
  - Identidad corporativa completa
- **Documentacion**: Nueva guia [IDENTIDAD-CORPORATIVA-MODULO.md](docs/desarrollo/IDENTIDAD-CORPORATIVA-MODULO.md)

### v2.4.0 (08 Enero 2026)

- **Limpieza de Organizacion**: Eliminados Consecutivos y Tipos de Documento del modulo Organizacion (se reimplementaran en Gestion Documental)
- **Consolidacion RBAC**: MatrizPermisos consolidado dentro de RolesPermisosWrapper con 4 subtabs:
  - Acceso a Secciones (visibilidad de modulos/tabs/secciones)
  - Permisos de Acciones (68 permisos CRUD)
  - Roles Adicionales
  - Catalogo de Permisos
- **Seed mejorado**: `seed_estructura_final` ahora elimina secciones obsoletas automaticamente
- **Backend cleanup**: Eliminados modelos, serializers, views y URLs de consecutivos/tipos documento
- **Frontend cleanup**: Eliminados componentes, hooks, tipos y APIs relacionados

### v2.3.1 (08 Enero 2026)

- **Fix permissions_count**: Corregido conteo de permisos en tabla de cargos
- **Nivel EXTERNO agregado**: Nuevo nivel jerarquico para contratistas/consultores
- **Iconos dinamicos en organigrama**: AreaNode usa DynamicIcon desde BD
- **StatsGrid en Matriz de Permisos**: Estadisticas y exportacion Excel

### v2.3.0 (07 Enero 2026)

- Sistema de iconos dinamicos con Lucide React
- Normas ISO dinamicas desde base de datos
- Claridad de roles en UI (Cargo vs Rol RBAC vs Especialidad)
- PWA support con offline indicator
- Build optimizado para cPanel

### v2.2.0 (05 Enero 2026)

- Refactorizacion completa de migraciones
- Eliminacion de dependencias circulares
- Sistema RBAC hibrido implementado

---

## Licencia

Copyright (c) 2024-2026 StrateKaz S.A.S. Todos los derechos reservados.

## Contacto

- **Web:** https://stratekaz.com
- **Email:** soporte@stratekaz.com

---

**Ultima actualizacion:** 11 Enero 2026
