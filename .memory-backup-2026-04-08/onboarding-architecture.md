---
name: Onboarding Architecture
description: Flujo completo de onboarding — SmartOnboarding por tipo, creación usuarios, setup-password, B2B2B
type: reference
---

## SmartOnboarding — 6 Tipos (implementado 2026-03-23)

| Tipo | Detección | Pasos | CASCADE |
|------|-----------|:-----:|---------|
| admin | is_superuser + sin cargo externo | 8 | L0 |
| contratista | cargo.is_externo=True + código no portal | 4 | L20 |
| jefe | cargo.is_jefatura=True | 4 | L20 |
| empleado | default (con cargo normal) | 4 | L20 |
| proveedor | proveedor_id_ext o cargo PROVEEDOR_PORTAL | 3 | L50 |
| cliente | cliente_id_ext o cargo CLIENTE_PORTAL | 2 | L53 |

**Servicio:** `core/services/onboarding_service.py` — OnboardingService
**Frontend:** `components/common/SmartOnboardingChecklist.tsx`

## Flujo de Creación de Usuarios (3 caminos)

### Path A: Configuración → Usuarios o Mi Equipo → Colaboradores (L20, LIVE)
- UserSetupFactory.create_user_with_setup() — token SHA-256
- Email de invitación con link setup-password
- Expiración: 7 días

### Path B: Sales CRM → Clientes (L53, NO desplegado)
### Path C: Supply Chain → Proveedores (L50, NO desplegado)

## Archivos Clave

**Backend — Onboarding:**
- `core/services/onboarding_service.py` — OnboardingService (_resolve_type, get_steps, compute)
- `core/models/models_onboarding.py` — UserOnboarding, TenantOnboarding
- `core/views/onboarding_views.py` — OnboardingViewSet

**Backend — User creation:**
- `core/utils/user_factory.py` — UserSetupFactory (centralizado)
- `core/views/setup_password_views.py` — SetupPasswordView + ResendView
- `core/models/models_user.py` — set_password_setup_token(), verify_password_setup_token()
- `core/signals/user_lifecycle_signals.py` — auto_create_tenant_user, auto_assign_nivel_firma

**Frontend:**
- `components/common/SmartOnboardingChecklist.tsx` — Checklist por tipo
- `components/common/ProfileProgressBar.tsx` — Barra de progreso perfil
- `components/common/UserMenu.tsx` — Badge completitud (solo si tiene cargo)
- `hooks/useOnboarding.ts` — Hook de estado onboarding
- `hooks/useProfileCompleteness.ts` — Hook de % completitud perfil
- `pages/SetupPasswordPage.tsx` — Setup password
- `pages/DashboardPage.tsx` — Integra SmartOnboardingChecklist

## Seguridad
- Token: SHA-256 hash en BD + constant_time_compare
- Rate limiting: 3/minuto (scope password_reset)
- Respuestas genéricas (no revelan si email existe)

## Reglas del Superadmin en Onboarding
- Sin cargo: ve AdminOnboarding (8 pasos empresa), NO ve badge % en avatar
- Con cargo: tipo depende de cargo (admin/contratista/jefe/empleado)
- Filtro `/usuarios`: superadmin sin cargo solo se ve a sí mismo (`~Q(pk=request.user.pk)`)
- Ver modelo B2B2B completo en `b2b2b-model.md`

## Hallazgos E2E Validados (2026-03-23)
- **Signal chain funcional:** User → TenantUser → Colaborador automático si tiene cargo
- **Nivel firma auto:** Táctico→N2 TOTP, Operativo→N1
- **Validación C6:** Cargo sin área/proceso bloquea creación de usuario (implementado B1)
- **Email siempre enviado:** No hay opción skip_email (evaluable para cuentas técnicas)
- **Emails ficticios:** Aceptados — solo valida formato + unicidad (pendiente DNS/MX check)
- **ProfileProgressBar:** Superadmin max ~50% (sin Colaborador, no puede completar campos TH)
- **Dropdown cargos:** Muestra todos sin filtrar tipo (pendiente: filtrar técnicos vs organizacionales)
- **Roles Adicionales:** Sección read-only en modal — vacía en creación (pendiente: ocultar)
- **Documento E2E:** `docs/auditorias/2026-03/AUDITORIA_E2E_ONBOARDING_IDENTIDAD.docx`
