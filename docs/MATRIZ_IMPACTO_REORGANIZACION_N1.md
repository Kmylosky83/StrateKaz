# MATRIZ DE IMPACTO - Reorganización N1

**Fecha:** 2026-01-15
**Referencia:** ANALISIS_ARQUITECTONICO_N1_REORGANIZACION.md

---

## 🎯 RESUMEN DE CAMBIOS

| Módulo | Ubicación Actual | Ubicación Nueva | Impacto |
|--------|------------------|-----------------|---------|
| Sistema Documental | N3: `hseq_management.sistema_documental` | N1: `gestion_estrategica.gestion_documental` | ⚠️ MEDIO |
| Gestor de Tareas | N6: `audit_system.tareas_recordatorios` | N1: `gestion_estrategica.gestor_tareas` | ⚠️ MEDIO-ALTO |

---

## 📊 MATRIZ DE IMPACTO POR MÓDULO

### N1 - DIRECCIÓN ESTRATÉGICA (Módulo Receptor)

| Aspecto | Antes | Después | Impacto | Mitigación |
|---------|-------|---------|---------|------------|
| **Cantidad de Apps** | 6 apps | 8 apps | 🟢 BAJO | Mejora organización |
| **Tabs UI** | 6 tabs | 8 tabs | 🟢 BAJO | UX mejorada |
| **Complejidad** | Media | Media-Alta | 🟡 MEDIO | Documentación clara |
| **Cohesión ISO** | Alta | Muy Alta | ✅ POSITIVO | Alineación perfecta |
| **Peso del Módulo** | ~15K LOC | ~18K LOC | 🟢 ACEPTABLE | Dentro de límites |
| **Tiempo de Carga** | Rápido | Rápido-Medio | 🟢 BAJO | Lazy loading |

**Beneficios:**
- ✅ Control documental centralizado desde nivel estratégico
- ✅ Seguimiento de compromisos de dirección integrado
- ✅ Alineación perfecta con ISO 9001/45001
- ✅ Reducción de navegación entre módulos

**Riesgos:**
- ⚠️ Sobrecarga de responsabilidades en N1
- ⚠️ Mayor complejidad de testing

---

### N3 - TORRE DE CONTROL HSEQ (Módulo Donador)

| Aspecto | Antes | Después | Impacto | Mitigación |
|---------|-------|---------|---------|------------|
| **Cantidad de Apps** | 11 apps | 10 apps | 🟢 BAJO | Reduce complejidad |
| **Documentación HSEQ** | Integrada | Referenciada | ⚠️ MEDIO | Links claros a N1 |
| **Cohesión Módulo** | Alta | Media-Alta | 🟡 MEDIO | Renombrar módulo |
| **Dependencias** | Autocontenido | Depende de N1 | 🟡 MEDIO | Documentar claramente |
| **Funcionalidad Core** | Mantiene | Mantiene | ✅ SIN CAMBIO | N/A |

**Beneficios:**
- ✅ Módulo más enfocado en operaciones HSEQ
- ✅ Reduce tamaño y complejidad de N3
- ✅ Elimina confusión sobre "dónde crear documentos"

**Riesgos:**
- ⚠️ Usuarios HSEQ deben ir a N1 para documentos
- ⚠️ Pérdida de cohesión aparente del módulo
- ⚠️ Curva de aprendizaje para usuarios existentes

**Acciones Requeridas:**
1. Renombrar N3 a "Torre de Control - Operaciones HSEQ"
2. Actualizar documentación de usuario
3. Crear shortcuts/links rápidos a Gestión Documental en N1
4. Capacitación a usuarios HSEQ

---

### N6 - INTELIGENCIA (Módulo Donador)

| Aspecto | Antes | Después | Impacto | Mitigación |
|---------|-------|---------|---------|------------|
| **Cantidad de Apps** | 4 apps | 3 apps | 🟢 BAJO | Más enfocado |
| **Gestor de Tareas** | Integrado | Separado | ⚠️ MEDIO-ALTO | Crear puente API |
| **Cohesión Módulo** | Media | Media | 🟢 SIN CAMBIO | N/A |
| **Analytics de Tareas** | Directo | Via API | 🟡 MEDIO | Crear vistas agregadas |
| **Funcionalidad Core** | Mantiene | Mantiene | ✅ SIN CAMBIO | N/A |

**Beneficios:**
- ✅ Módulo más enfocado en analytics y reporting
- ✅ Tareas estratégicas visibles en nivel correcto
- ✅ Reduce scope de N6

**Riesgos:**
- ⚠️ Analytics de tareas requiere queries cross-app
- ⚠️ Reportes de auditoría deben referenciar N1
- ⚠️ Posible pérdida de funcionalidad de "tareas de auditoría"

**Acciones Requeridas:**
1. Renombrar N6 a "Inteligencia - Analytics & Reporting"
2. Crear API de agregación para analytics de tareas
3. Mantener "Tareas de Auditoría" como GenericForeignKey a N1
4. Documentar patrón de uso

---

### N2 - MOTOR DE CUMPLIMIENTO

| Aspecto | Impacto | Notas |
|---------|---------|-------|
| **Documentos Legales** | 🟢 MEJORA | Ahora en N1 (nivel correcto) |
| **Requisitos Legales** | 🟢 SIN CAMBIO | Sigue en N2 |
| **Tareas de Cumplimiento** | 🟡 CAMBIO MENOR | Referenciar N1 para tareas |

**Acciones:** Actualizar documentación de integración con N1

---

### WORKFLOW ENGINE

| Aspecto | Impacto | Notas |
|---------|---------|-------|
| **Firma Digital** | 🔴 CRÍTICO | Consolidación requerida |
| **Ejecución de Workflows** | 🟢 SIN CAMBIO | GenericForeignKey mantiene flexibilidad |
| **Tareas de Workflow** | 🟢 MEJORA | Pueden usar N1 como hub central |

**Acciones:**
1. 🔴 **PRIORIDAD 1:** Decidir sistema de firmas a mantener
2. Migrar datos si es necesario
3. Actualizar referencias

---

## 🔄 IMPACTO EN INTEGRACIONES

### Backend Integrations

| Módulo de Origen | Módulo Destino | Cambio Requerido | Complejidad |
|------------------|----------------|------------------|-------------|
| `identidad` | `gestion_documental` | ✅ Mejora (N1→N1) | 🟢 SIMPLE |
| `revision_direccion` | `gestor_tareas` | ✅ Nueva (N1→N1) | 🟢 SIMPLE |
| `mejora_continua` | `gestion_documental` | ⚠️ Cambio (N3→N1) | 🟡 MEDIO |
| `workflow_engine` | `gestion_documental` | ⚠️ Cambio | 🟡 MEDIO |
| `todos_modulos` | `gestor_tareas` | ⚠️ Cambio (→N1) | 🟡 MEDIO |

### Frontend Integrations

| Componente | Impacto | Cambio Requerido |
|------------|---------|------------------|
| **Rutas** | 🟡 MEDIO | Actualizar paths de `/hseq/documentos` a `/estrategia/documentos` |
| **Permisos** | 🟡 MEDIO | Cambiar `hseq.view_documento` a `gestion_estrategica.view_documento` |
| **Menú** | 🟢 BAJO | Reorganizar estructura de menú N1 |
| **API Calls** | 🟡 MEDIO | Actualizar endpoints `/api/hseq/` a `/api/estrategia/` |
| **State Management** | 🟢 BAJO | Renombrar stores (si existen) |

### External Integrations

| Integración | Impacto | Notas |
|-------------|---------|-------|
| **Exportación de Documentos** | 🟢 TRANSPARENTE | URLs de descarga no cambian si se mantienen tablas |
| **API Externa** | 🟡 BREAKING CHANGE | Si hay APIs públicas, versionar |
| **Webhooks** | 🟡 CAMBIO MENOR | Actualizar event names |
| **Reportes** | 🟢 SIN CAMBIO | Si se mantienen nombres de tablas |

---

## 👥 IMPACTO EN USUARIOS

### Usuarios de Alta Dirección

| Aspecto | Impacto | Beneficio |
|---------|---------|-----------|
| **Acceso a Documentos** | ✅ MEJORA | Todo en módulo Dirección Estratégica |
| **Seguimiento de Tareas** | ✅ MEJORA | Visibilidad directa de compromisos |
| **Revisión por Dirección** | ✅ MEJORA | Información integrada en un solo lugar |
| **Curva de Aprendizaje** | 🟢 BAJA | Mejora UX, no complica |

### Usuarios HSEQ

| Aspecto | Impacto | Mitigación |
|---------|---------|------------|
| **Crear Documentos** | ⚠️ CAMBIO | Ir a N1 en vez de N3 |
| **Buscar Documentos** | ⚠️ CAMBIO | Nuevo ubicación en menú |
| **Workflows Documentales** | 🟢 MEJORA | Más integrados con estrategia |
| **Curva de Aprendizaje** | 🟡 MEDIA | Requiere capacitación |

**Recomendación:**
- Crear "Acceso Rápido a Documentos" en N3
- Tutorial en video de 5 minutos
- Documentación actualizada

### Usuarios de Auditoría

| Aspecto | Impacto | Mitigación |
|---------|---------|------------|
| **Crear Tareas de Auditoría** | ⚠️ CAMBIO | Ir a N1 en vez de N6 |
| **Ver Tareas Asignadas** | 🟢 MEJORA | Widget en dashboard |
| **Reportes de Tareas** | 🟡 CAMBIO | Nuevas vistas en N6 |
| **Curva de Aprendizaje** | 🟡 MEDIA | Requiere capacitación |

### Usuarios Operativos

| Aspecto | Impacto | Beneficio |
|---------|---------|-----------|
| **Consultar Documentos** | 🟢 TRANSPARENTE | No afecta lectura |
| **Recibir Tareas** | 🟢 TRANSPARENTE | Notificaciones siguen igual |
| **Completar Tareas** | 🟢 SIN CAMBIO | Interfaz mantiene |

---

## 🗄️ IMPACTO EN BASE DE DATOS

### Migraciones Requeridas

| Tabla | Cambio | Tipo de Migración | Riesgo |
|-------|--------|-------------------|--------|
| `documental_*` | `app_label` | 🟢 Meta change only | BAJO |
| `tareas_*` | `app_label` + `empresa_id` | 🟡 Schema + data | MEDIO |

### Estrategia de Migración

**CRÍTICO:** Mantener nombres de tablas para evitar migraciones de datos masivas.

```python
# CORRECTO (Meta change only)
class Documento(models.Model):
    # ... campos ...
    class Meta:
        app_label = 'gestion_documental'  # Era 'sistema_documental'
        db_table = 'documental_documento'  # ✅ MANTENER

# EVITAR (Migración de datos)
class Documento(models.Model):
    # ... campos ...
    class Meta:
        app_label = 'gestion_documental'
        db_table = 'gestion_documental_documento'  # ❌ EVITAR
```

### Volumetría Estimada

| Tabla | Registros Estimados | Impacto en Migración |
|-------|---------------------|----------------------|
| `documental_documento` | 100-1000 | 🟢 Solo metadata |
| `documental_version_documento` | 500-5000 | 🟢 Solo metadata |
| `tareas_tarea` | 1000-10000 | 🟡 Agregar `empresa_id` |
| `tareas_recordatorio` | 500-5000 | 🟡 Agregar `empresa_id` |

**Tiempo Estimado de Migración:**
- Documentos: < 1 segundo (solo Meta)
- Tareas: 10-60 segundos (agregar campo + migrar datos)

---

## 📈 IMPACTO EN PERFORMANCE

### Consultas de Base de Datos

| Escenario | Antes | Después | Impacto |
|-----------|-------|---------|---------|
| Listar Documentos | `SELECT * FROM documental_documento WHERE empresa_id=X` | Mismo query | 🟢 SIN CAMBIO |
| Crear Tarea | `INSERT INTO tareas_tarea (...)` | `INSERT INTO tareas_tarea (..., empresa_id)` | 🟢 MÍNIMO |
| Dashboard N1 | 3 queries (configuración, organización, identidad) | 5 queries (+documental, +tareas) | 🟡 +40% queries |
| Búsqueda Global | Busca en N3 y N6 | Busca en N1 | ✅ MEJORA (menos hops) |

### Caching Strategy

| Recurso | Estrategia Actual | Estrategia Nueva | Cambio |
|---------|-------------------|------------------|--------|
| Documentos Recientes | Cache en N3 | Cache en N1 | ⚠️ Reconfigurar |
| Tareas Pendientes | Cache en N6 | Cache en N1 | ⚠️ Reconfigurar |
| Plantillas Documentos | Cache 1h | Cache 1h | 🟢 SIN CAMBIO |

**Recomendaciones:**
1. Implementar cache warming para N1 al startup
2. Monitorear latencia de dashboard N1 post-migración
3. Considerar lazy loading de tabs Documental y Tareas

---

## 🔐 IMPACTO EN SEGURIDAD Y PERMISOS

### Modelo de Permisos

| Permiso Anterior | Permiso Nuevo | Impacto |
|------------------|---------------|---------|
| `hseq_management.view_documento` | `gestion_estrategica.view_documento` | 🔴 BREAKING |
| `hseq_management.add_documento` | `gestion_estrategica.add_documento` | 🔴 BREAKING |
| `audit_system.view_tarea` | `gestion_estrategica.view_tarea` | 🔴 BREAKING |
| `audit_system.add_tarea` | `gestion_estrategica.add_tarea` | 🔴 BREAKING |

**CRÍTICO:** Requiere script de migración de permisos.

### Multi-tenancy

| Aspecto | Sistema Documental | Gestor Tareas | Acción |
|---------|-------------------|---------------|--------|
| **Campo empresa_id** | ✅ Existe | ❌ Falta | Agregar |
| **Filtrado Queries** | ✅ Implementado | ⚠️ Implícito via User | Hacer explícito |
| **Seguridad** | ✅ Robusto | 🟡 Depende de User | Reforzar |

### Roles y Accesos

| Rol | Impacto | Acción Requerida |
|-----|---------|------------------|
| **Gerente General** | 🟢 MEJORA | Acceso total a N1 (ya tenía) |
| **Responsable HSEQ** | ⚠️ CAMBIO | Agregar permisos N1.gestion_documental |
| **Responsable Calidad** | ⚠️ CAMBIO | Agregar permisos N1.gestion_documental |
| **Auditor Interno** | ⚠️ CAMBIO | Agregar permisos N1.gestor_tareas |
| **Usuario Operativo** | 🟢 SIN CAMBIO | Solo lectura (no afectado) |

**Script de Migración de Permisos:**
```python
# backend/scripts/migrar_permisos_reorganizacion_n1.py

PERMISSION_MAPPING = {
    'hseq_management.view_documento': 'gestion_estrategica.view_documento',
    'hseq_management.add_documento': 'gestion_estrategica.add_documento',
    'hseq_management.change_documento': 'gestion_estrategica.change_documento',
    'hseq_management.delete_documento': 'gestion_estrategica.delete_documento',

    'audit_system.view_tarea': 'gestion_estrategica.view_tarea',
    'audit_system.add_tarea': 'gestion_estrategica.add_tarea',
    'audit_system.change_tarea': 'gestion_estrategica.change_tarea',
    'audit_system.delete_tarea': 'gestion_estrategica.delete_tarea',
}

def migrate_permissions():
    from django.contrib.auth.models import Permission, Group
    from apps.core.models import Cargo

    for old_perm, new_perm in PERMISSION_MAPPING.items():
        old_app, old_codename = old_perm.split('.')
        new_app, new_codename = new_perm.split('.')

        # Migrar permisos de Grupos
        for group in Group.objects.filter(permissions__codename=old_codename):
            new_permission = Permission.objects.get(
                content_type__app_label=new_app,
                codename=new_codename
            )
            group.permissions.add(new_permission)
            print(f"✅ Grupo '{group.name}': agregado {new_perm}")

        # Migrar permisos de Cargos (sistema RBAC)
        for cargo in Cargo.objects.filter(permissions__contains=[old_perm]):
            cargo.permissions.append(new_perm)
            cargo.save()
            print(f"✅ Cargo '{cargo.nombre}': agregado {new_perm}")
```

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Pre-Migración (Baseline)

| Métrica | Valor Actual | Método de Medición |
|---------|--------------|-------------------|
| Tiempo promedio creación documento | ? segundos | Monitorear logs |
| Tiempo promedio creación tarea | ? segundos | Monitorear logs |
| Queries por request Dashboard N1 | ? queries | Django Debug Toolbar |
| Satisfacción usuarios HSEQ | ? / 10 | Encuesta |
| Tasa de errores permisos | ? / mes | Sentry |

### KPIs Post-Migración (Target)

| Métrica | Target | Deadline | Responsable |
|---------|--------|----------|-------------|
| Tiempo creación documento | ≤ baseline + 10% | Semana 5 | Tech Lead |
| Tiempo creación tarea | ≤ baseline + 10% | Semana 5 | Tech Lead |
| Queries Dashboard N1 | ≤ 8 queries | Semana 4 | Backend Dev |
| Satisfacción usuarios HSEQ | ≥ 7/10 | Semana 6 | Product Owner |
| Tasa de errores permisos | 0 errores críticos | Semana 2 | QA Lead |
| Test Coverage | ≥ 85% | Semana 5 | QA Team |

### Criterios de Rollback

🔴 **ROLLBACK INMEDIATO SI:**
1. Pérdida de datos detectada
2. Errores críticos de permisos (data leak entre empresas)
3. Downtime > 5 minutos
4. Imposibilidad de crear/editar documentos o tareas

⚠️ **ROLLBACK CONSIDERADO SI:**
1. Performance degradation > 30%
2. Más de 10 bugs críticos reportados en 48h
3. Satisfacción usuarios < 5/10 después de 2 semanas

---

## 🎓 PLAN DE CAPACITACIÓN

### Usuarios Finales

| Grupo | Duración | Contenido | Método |
|-------|----------|-----------|--------|
| Alta Dirección | 15 min | Tour nuevo módulo N1 | Video + Demo |
| Usuarios HSEQ | 30 min | Nueva ubicación documentos, workflows | Workshop |
| Auditores | 20 min | Nueva ubicación tareas, reportes | Video + FAQ |
| Todos | 5 min | Cambios generales, dónde encontrar cosas | Email + Cheatsheet |

### Material de Capacitación

1. **Video Tutorial (5 min):** "¿Dónde quedó mi módulo? - Guía rápida"
2. **Cheat Sheet PDF:** Tabla de equivalencias antigua vs nueva ubicación
3. **FAQ Document:** Top 10 preguntas frecuentes
4. **Release Notes:** Changelog detallado para power users

---

## 📅 CRONOGRAMA DETALLADO

### Semana 1: Preparación
- Lunes: Auditoría frontend completa
- Martes: Backup DB + crear branch
- Miércoles: Decisión sistema de firmas
- Jueves: Plan de rollback
- Viernes: Kick-off con equipo

### Semana 2: Sistema Documental
- Lunes-Martes: Mover código + actualizar Meta
- Miércoles: Actualizar imports en identidad
- Jueves: Testing unitario
- Viernes: Code review

### Semana 3: Gestor de Tareas
- Lunes: Agregar campo empresa_id
- Martes: Migración de datos
- Miércoles: Mover código + actualizar Meta
- Jueves: Testing unitario
- Viernes: Code review

### Semana 4: Consolidación Firmas
- Lunes-Martes: Migración datos de firmas
- Miércoles: Eliminar código duplicado
- Jueves: Testing integración
- Viernes: Documentación

### Semana 5: Testing & QA
- Lunes-Martes: Tests de integración
- Miércoles: Testing multi-tenancy
- Jueves: Performance testing
- Viernes: Bug fixing

### Semana 6: Frontend & Deploy
- Lunes-Martes: Actualizar frontend
- Miércoles: Deploy staging
- Jueves: UAT con usuarios beta
- Viernes: Deploy producción

---

## ✅ CHECKLIST DE GO/NO-GO

### Pre-Deploy a Staging

- [ ] Todos los tests unitarios passing
- [ ] Tests de integración passing
- [ ] Verificación multi-tenancy OK
- [ ] Migraciones probadas en DB de prueba
- [ ] Backup completo de producción
- [ ] Plan de rollback documentado y ensayado
- [ ] Code review aprobado por 2+ devs
- [ ] Documentación técnica actualizada

### Pre-Deploy a Producción

- [ ] Staging funcionando sin errores críticos 72h
- [ ] UAT completado con 3+ usuarios por rol
- [ ] Performance en staging ≤ baseline + 10%
- [ ] Material de capacitación distribuido
- [ ] Equipo de soporte notificado y capacitado
- [ ] Ventana de mantenimiento coordinada
- [ ] Monitoreo en vivo configurado (Sentry, logs)
- [ ] Comunicación a usuarios enviada 48h antes

---

## 🆘 PLAN DE CONTINGENCIA

### Escenario 1: Migración de Datos Falla

**Síntomas:** Registros sin `empresa_id`, datos huérfanos

**Acción:**
1. DETENER deploy inmediatamente
2. Restaurar backup de BD
3. Analizar logs de migración
4. Corregir script de migración
5. Re-ejecutar en staging
6. Validar datos 100%
7. Re-intentar deploy

### Escenario 2: Errores de Permisos Masivos

**Síntomas:** Usuarios no pueden acceder a documentos/tareas

**Acción:**
1. Ejecutar script de migración de permisos
2. Verificar permisos de 5 cargos críticos
3. Si persiste: agregar permisos manualmente a grupos afectados
4. Documentar issue
5. Postmortem

### Escenario 3: Performance Degradada

**Síntomas:** Dashboard N1 lento, timeouts

**Acción:**
1. Activar cache agresivo temporalmente
2. Analizar queries lentos (Django Debug Toolbar)
3. Agregar índices DB si falta
4. Implementar lazy loading de tabs
5. Monitorear 24h
6. Si no mejora: rollback

### Escenario 4: Bugs Críticos en Producción

**Síntomas:** > 5 bugs críticos en 24h

**Acción:**
1. Evaluar severidad (¿afecta data integrity?)
2. Si afecta datos: rollback inmediato
3. Si solo UX: hotfix urgente
4. Comunicar a usuarios afectados
5. Postmortem

---

## 📞 CONTACTOS CLAVE

| Rol | Responsable | Contacto | Responsabilidad |
|-----|-------------|----------|-----------------|
| **Tech Lead** | TBD | email@domain.com | Decisiones técnicas finales |
| **Backend Lead** | TBD | email@domain.com | Migraciones y backend |
| **Frontend Lead** | TBD | email@domain.com | Actualización UI |
| **QA Lead** | TBD | email@domain.com | Testing y validación |
| **Product Owner** | TBD | email@domain.com | UAT y aprobación funcional |
| **DevOps** | TBD | email@domain.com | Deploy y rollback |

---

**Elaborado por:** ISO_MANAGEMENT_SYSTEMS_SPECIALIST
**Aprobado por:** [Pendiente]
**Fecha de Aprobación:** [Pendiente]
**Próxima Revisión:** Post-implementación (Semana 7)

---

**FIN DE LA MATRIZ DE IMPACTO**
