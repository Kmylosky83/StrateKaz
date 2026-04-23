# Capa Portales

> Landings por tipo de audiencia. Esta capa agrupa los portales (UI + API)
> orientados a distintos consumidores del tenant. Cada portal es una app
> independiente que NO modifica datos de módulos de negocio — solo los
> consume y presenta.

## Principio fundacional

Un **portal** es una capa transversal de presentación orientada por tipo
de **audiencia**, NO por tipo de dato. El error histórico fue ubicar el
portal del empleado dentro de `talent_hub` (porque las vacaciones son
datos de talent_hub). El criterio correcto: un portal se ubica según
**quién lo consume**, no según qué dato maneja.

## Portales LIVE hoy

| Portal | App | Audiencia | URL | Estado |
|---|---|---|---|---|
| Mi Portal | `apps.portales.mi_portal` | Empleado interno + Superadmin | `/api/mi-portal/` | ✅ LIVE |

## Portales pendientes (ver H-PORTAL-02)

| Portal | Audiencia | Módulo de origen | Acceso propuesto |
|---|---|---|---|
| Portal Proveedores | Vendedores externos | `supply_chain` | Magic link / subdomain |
| Portal Clientes | Compradores externos | `sales_crm` | Magic link / subdomain |
| Portal Vacantes | Candidatos (público) | `mi_equipo.seleccion_contratacion` | Público sin login |

## Estructura del directorio

```
backend/apps/portales/
├── __init__.py           ← paquete paraguas (no es una app Django)
└── mi_portal/            ← app Django (label='mi_portal')
    ├── __init__.py
    ├── apps.py           ← name='apps.portales.mi_portal', label='mi_portal'
    ├── urls.py
    ├── views.py          ← MiPerfilView (+ futuras: MisVacacionesView, etc.)
    └── serializers.py
```

Cuando se active un portal nuevo, se crea una app hermana:
- `apps/portales/portal_proveedores/`
- `apps/portales/portal_clientes/`
- `apps/portales/portal_vacantes/`

El `__init__.py` de `apps.portales` NO es una app Django — es solo un
paquete Python para agrupar. Solo las sub-apps se registran en
`INSTALLED_APPS`.

## Reglas arquitectónicas

### 1. Portal NO es módulo de negocio
Un portal NO tiene modelos propios. Consume datos via:
- Imports directos de modelos LIVE (`apps.mi_equipo.colaboradores.models`)
- `apps.get_model()` para modelos de otros C2 (anti-acoplamiento)
- Endpoints REST de módulos de negocio (cuando el frontend los consume)

### 2. Portal NO importa de otro portal
`portal_proveedores` NUNCA importa de `mi_portal` ni viceversa. Cada portal
es autocontenido en su UX y su endpoint shape.

### 3. Portales consumen CT y C2, no a la inversa
Los módulos de negocio (supply_chain, sales_crm) NUNCA importan de portales.

### 4. Cada portal decide su propio patrón de auth
- Mi Portal → JWT estándar (empleado interno tiene User LIVE)
- Portal Proveedores → Magic link con token firmado (propuesto H-PORTAL-02)
- Portal Clientes → idem
- Portal Vacantes → público sin auth

### 5. URL aliasing en migración
Cuando se reubica un portal (ej: H1 movió Mi Portal de `talent_hub` a
`apps.portales.mi_portal`), las URLs se mantienen estables. El frontend
no debe enterarse. Si cambia la URL, se crea un shim de redirect en el
lugar viejo.

## Cómo agregar un portal nuevo

1. Crear `backend/apps/portales/portal_X/` con estructura estándar
   (apps.py, urls.py, views.py, serializers.py).
2. Registrar en `config/settings/base.py` INSTALLED_APPS (bloque
   CAPA PORTALES).
3. Montar en `config/urls.py` con guard `is_app_installed()`.
4. Crear `frontend/src/features/portal-X/` con pages + api + hooks + types.
5. Registrar ruta en `routes/modules/portals.routes.tsx`.
6. Decidir el patrón de auth según audiencia (ver H-PORTAL-02).
7. Documentar en esta tabla de "Portales LIVE hoy".

## Historia

- **2026-04-08** — H1 detectado: Mi Portal vivía en `apps/talent_hub/api/ess_*`
  mezclando dato con audiencia. Decidido NO parchear — esperar refactor.
- **2026-04-16** — Movimiento parcial: alguien creó `apps.mi_portal` plano
  y montó en `/api/mi-portal/`. Dead code viejo quedó en talent_hub.
- **2026-04-23** — H1 Capa A cerrado: paraguas `apps/portales/` creado.
  `apps.mi_portal` → `apps.portales.mi_portal`. Agregado a INSTALLED_APPS
  (estaba ausente — anomalía). Eliminado ~1500 LOC de dead code (features
  proveedor-portal + cliente-portal huérfanas, PortalLayout, portalUtils,
  hooks y views dead). H-PORTAL-02 abierto para definir Capa B (patrón
  de acceso externo).

## Referencias
- `docs/01-arquitectura/hallazgos-pendientes.md` → H1, H-PORTAL-02
- `docs/01-arquitectura/capas.md` → modelo C0/C1/CT/C2/C3/Portales
- `CLAUDE.md` → reglas de independencia entre capas
