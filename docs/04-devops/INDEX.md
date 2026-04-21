# Índice — DevOps
**Última actualización:** 2026-04-20

Infraestructura, CI/CD, deploy y operaciones del servidor.

---

## Documentos
| Documento | Propósito | Cuándo usarlo |
|-----------|-----------|---------------|
| [`deploy.md`](deploy.md) | **TODOS los comandos** de deploy (Docker, VPS, Git, Django, npm, systemd) | Antes de cada deploy |
| [`deploy-checklist.md`](deploy-checklist.md) | Checklist paso a paso para deploy a producción | Checklist en cada release |
| [`docker-setup.md`](docker-setup.md) | Configuración completa del entorno Docker local | Setup inicial o troubleshooting |
| [`github-actions.md`](github-actions.md) | CI/CD: jobs, triggers, secrets, ambientes | Modificar pipeline o debuggear CI |
| [`celery-redis.md`](celery-redis.md) | Tareas asíncronas: colas, beat scheduler, flower | Agregar tareas o debuggear Celery |
| [`capacity-planning.md`](capacity-planning.md) | Fórmula de carga, alertas VPS, escalado | Monitoreo mensual o antes de onboarding masivo |

---

## Ambientes
| Ambiente | Cómo acceder | Settings |
|----------|-------------|---------|
| Local (Docker) | `docker compose up` | `config.settings.development` |
| CI (GitHub Actions) | Push a main | `config.settings.testing` |
| Producción (VPS) | SSH + deploy.sh | `config.settings.production` |

---

## Regla de mantenimiento
Actualizar en el mismo PR que cambie la infra (nuevo servicio, cambio de puerto, nuevo workflow CI).
Última actualización: 2026-04-20
