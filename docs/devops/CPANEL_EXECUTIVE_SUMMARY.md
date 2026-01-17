# Resumen Ejecutivo: Infraestructura SGI

## Sistema de Gestión Integral - StrateKaz

**Fecha:** 2025-12-30
**Estado:** APROBADO PARA PRODUCCIÓN
**Modelo:** Unitenant en cPanel Corporativo

---

## Decisión de Infraestructura

### Estrategia Seleccionada: cPanel Corporativo Unitenant

Se ha decidido utilizar el **cPanel corporativo existente** (stratekaz.com) para hospedar hasta **10 empresas** bajo el modelo **unitenant con bases de datos separadas**.

| Aspecto | Especificación |
|---------|----------------|
| **Servidor** | cPanel Multi Estilo |
| **RAM** | 6 GB |
| **CPU** | 2 Cores |
| **Disco** | SSD Ilimitado |
| **MySQL** | Ilimitadas |
| **Costo** | USD $90/año |
| **Costo por empresa** | ~USD $9/año |

---

## Arquitectura Aprobada

```
┌─────────────────────────────────────────────────────────┐
│            CPANEL CORPORATIVO (6GB RAM)                  │
│               stratekaz.com                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Empresa 1  │ │ Empresa 2  │ │ Empresa N  │           │
│  │            │ │            │ │            │           │
│  │ Django     │ │ Django     │ │ Django     │           │
│  │ React      │ │ React      │ │ React      │           │
│  │ MySQL      │ │ MySQL      │ │ MySQL      │           │
│  │ (separada) │ │ (separada) │ │ (separada) │           │
│  └────────────┘ └────────────┘ └────────────┘           │
│                                                          │
│  Máximo: 10 empresas                                     │
│  Aislamiento: Total (DBs independientes)                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Adaptaciones Realizadas

### Servicios No Disponibles y Alternativas

| Servicio Original | Alternativa en cPanel | Estado |
|-------------------|----------------------|--------|
| Redis (cache) | Django Database Cache | Configurado |
| Celery (workers) | Cron Jobs + CELERY_TASK_ALWAYS_EAGER | Configurado |
| Docker | Passenger WSGI | Configurado |

### Funcionalidades Mantenidas

- Sistema de autenticación JWT
- Todos los módulos del SGI
- API REST completa
- Frontend React
- Generación de PDFs
- Envío de emails
- Backups automáticos (Jetbackups)

---

## Documentación Generada

### Documentos de Estrategia

1. **[ESTRATEGIA-CPANEL-CORPORATIVO.md](./infraestructura/ESTRATEGIA-CPANEL-CORPORATIVO.md)**
   - Visión general de infraestructura
   - Especificaciones del servidor
   - Modelo de despliegue
   - Costos y ROI

2. **[ARQUITECTURA-UNITENANT.md](./infraestructura/ARQUITECTURA-UNITENANT.md)**
   - Modelo de datos separados
   - Estructura de directorios
   - Flujo de requests
   - Seguridad y aislamiento

3. **[GESTION-MULTI-EMPRESA.md](./infraestructura/GESTION-MULTI-EMPRESA.md)**
   - Operaciones diarias
   - Agregar/eliminar empresas
   - Monitoreo y backups
   - Troubleshooting

### Documentos de Despliegue

4. **[DEPLOY-CPANEL.md](../deploy/cpanel/DEPLOY-CPANEL.md)** (Actualizado v2.0)
   - Guía paso a paso
   - Configuración por empresa
   - Scripts de automatización
   - Checklists de verificación

---

## Estado de Empresas

| # | Empresa | Subdominio | Estado |
|---|---------|------------|--------|
| 1 | StrateKaz | grasas.stratekaz.com | **GO-LIVE** |
| 2 | Demo Comercial | demo.stratekaz.com | Activo |
| 3 | Staging/QA | staging.stratekaz.com | Activo |
| 4-10 | (Disponibles) | - | Reservados |

---

## Próximos Pasos

### Inmediato (Semana 27)

- [ ] Desplegar grasas.stratekaz.com en producción
- [ ] Configurar cron jobs de mantenimiento
- [ ] Verificar backups automáticos
- [ ] Configurar monitoreo (health checks)

### Corto Plazo (Mes 1)

- [ ] Documentar procedimientos operativos
- [ ] Capacitar equipo de soporte
- [ ] Establecer SLAs por empresa
- [ ] Implementar alertas automáticas

### Mediano Plazo (Trimestre 1)

- [ ] Evaluar performance con carga real
- [ ] Onboarding de primeros clientes adicionales
- [ ] Optimizar recursos según uso
- [ ] Evaluar necesidad de migración a VPS

---

## Criterios de Escalamiento

Migrar a VPS/Cloud cuando:

| Trigger | Acción Recomendada |
|---------|-------------------|
| > 10 empresas | Segundo cPanel o VPS |
| RAM > 80% constante | Optimizar o VPS |
| Necesidad de Celery real | VPS con Docker |
| > 50 empresas | Arquitectura SaaS completa |

---

## Contacto

**DevOps:** devops@stratekaz.com
**Soporte:** soporte@stratekaz.com
**GitHub:** [Grasas-Huesos-SGI](https://github.com/Kmylosky83/Grasas-Huesos-SGI)

---

## Aprobaciones

| Rol | Estado | Fecha |
|-----|--------|-------|
| Director de Proyecto | Aprobado | 2025-12-30 |
| Arquitecto de Software | Aprobado | 2025-12-30 |
| DevOps Lead | Aprobado | 2025-12-30 |

---

*Documento actualizado: 2025-12-30*
