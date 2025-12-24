# Reorganización del Frontend según Estructura de 6 Niveles

**Fecha:** 2025-12-23
**Estado:** Completado

## Objetivo

Reorganizar el sistema de rutas del frontend para alinearlo con la estructura de 6 niveles definida en "Estructura Final 22.txt", manteniendo compatibilidad con módulos legacy.

## Cambios Realizados

### 1. Archivo de Rutas Actualizado

**Archivo:** `frontend/src/routes/index.tsx`

Se reorganizó completamente el archivo de rutas siguiendo la estructura de 6 niveles:

#### NIVEL 1 - ESTRATÉGICO
- **Módulo:** Dirección Estratégica (`Gestion_Estrategica`)
- **Ruta base:** `/gestion-estrategica`
- **Tabs implementados:**
  - ✅ Configuración (`/gestion-estrategica/configuracion`)
  - ✅ Organización (`/gestion-estrategica/organizacion`)
  - ✅ Identidad Corporativa (`/gestion-estrategica/identidad`)
  - ✅ Planeación Estratégica (`/gestion-estrategica/planeacion`)
  - 🔜 Gestión de Proyectos PMI (`/gestion-estrategica/proyectos`)
  - 🔜 Revisión por Dirección (`/gestion-estrategica/revision-direccion`)
- **Módulo transversal:** Usuarios (`/usuarios`)

#### NIVEL 2 - CUMPLIMIENTO
- **Módulo 1:** Motor de Cumplimiento (`motor_cumplimiento`) - 🔜 Próximamente
  - Rutas preparadas: `/cumplimiento/*`
- **Módulo 2:** Motor de Riesgos (`motor_riesgos`) - ✅ Implementado
  - Ruta base: `/riesgos`
  - Tabs: Contexto, Procesos, IPEVR, Ambientales, Viales, SAGRILAFT, Seguridad Info
- **Módulo 3:** Workflows Engine (`workflow_engine`) - ✅ Implementado
  - Ruta base: `/workflows`
  - Tabs: Diseñador, Ejecución, Monitoreo

#### NIVEL 3 - TORRE DE CONTROL (HSEQ)
- **Módulo:** Gestión HSEQ (`hseq_management`) - ✅ Implementado
- **Ruta base:** `/hseq`
- **11 Tabs implementados:**
  1. Dashboard
  2. Sistema Documental
  3. Planificación Sistema
  4. Calidad
  5. Medicina Laboral
  6. Seguridad Industrial
  7. Higiene Industrial
  8. Gestión de Comités
  9. Accidentalidad (ATEL)
  10. Emergencias
  11. Gestión Ambiental
  12. Mejora Continua

#### NIVEL 4 - CADENA DE VALOR
- **Módulo 1:** Cadena de Suministro (`supply_chain`) - ⚠️ Legacy (refactor pendiente)
  - Rutas actuales: `/proveedores/*`, `/econorte/*`
  - Features: `proveedores`, `econorte`, `ecoaliados`
- **Módulo 2:** Operaciones de Producción (`production_ops`) - ⚠️ Legacy (refactor pendiente)
  - Rutas actuales: `/planta/*`
  - Features: `recepciones`, `lotes`
- **Módulo 3:** Logística y Flota (`logistics_fleet`) - 🔜 Próximamente
  - Ruta preparada: `/logistica`
- **Módulo 4:** Ventas y CRM (`sales_crm`) - 🔜 Próximamente
  - Ruta preparada: `/ventas`

#### NIVEL 5 - HABILITADORES
- **Módulo 1:** Centro de Talento (`talent_hub`) - 🔜 Próximamente
  - Ruta preparada: `/talento`
- **Módulo 2:** Administración y Finanzas (`admin_finance`) - 🔜 Próximamente
  - Ruta preparada: `/finanzas`
- **Módulo 3:** Contabilidad (`accounting`) - 🔜 Próximamente
  - Ruta preparada: `/contabilidad`

#### NIVEL 6 - INTELIGENCIA
- **Módulo 1:** Analítica (`analytics`) - 🔜 Próximamente
  - Ruta preparada: `/analitica`
- **Módulo 2:** Sistema de Auditoría (`audit_system`) - 🔜 Próximamente
  - Ruta preparada: `/auditoria`

### 2. Rutas Legacy Deprecadas

Se mantienen temporalmente para compatibilidad, pero redirigen a las nuevas ubicaciones:

```typescript
// Redirigir rutas antiguas a nuevas ubicaciones
/motor-operaciones/* → /proveedores
/gestion-integral/* → /hseq
/cadena-valor/* → /proveedores
/procesos-apoyo/* → /talento
/inteligencia/* → /analitica
/sst/* → /hseq
/reportes → /analitica
```

### 3. Módulos a Eliminar en Futuro

Estos módulos/features serán eliminados en futuras iteraciones una vez refactorizados:

- ❌ `certificados` - Se eliminó del backend, mantener solo feature frontend temporal
- ❌ `liquidaciones` - Se eliminó del backend, mantener solo feature frontend temporal
- ❌ `lotes` - Se eliminó del backend, mantener solo feature frontend temporal
- ❌ `unidades` - Se eliminó del backend, se configurará dinámicamente
- ⚠️ `motor-operaciones` - Será refactorizado a `supply_chain`
- ⚠️ `gestion-integral` - Será refactorizado a `hseq_management`
- ⚠️ `cadena-valor` - Será refactorizado a múltiples módulos nivel 4
- ⚠️ `procesos-apoyo` - Será refactorizado a múltiples módulos nivel 5
- ⚠️ `inteligencia-negocios` - Será refactorizado a `analytics`

### 4. Features Existentes en Frontend

Estado actual de las features en `frontend/src/features/`:

```
✅ Activos (Implementados):
- auth
- gestion-estrategica
- hseq (11 tabs)
- riesgos (7 tabs)
- workflows (3 tabs)
- users

⚠️ Legacy (Refactor pendiente):
- proveedores (→ supply_chain)
- econorte (→ supply_chain/programacion_abastecimiento)
- ecoaliados (→ supply_chain/proveedores)
- recepciones (→ production_ops/recepcion)
- lotes (→ production_ops)
- programaciones (→ supply_chain/programacion_abastecimiento)
- recolecciones (→ supply_chain/programacion_abastecimiento)
- liquidaciones (→ supply_chain/programacion_abastecimiento)

❌ Obsoletos (Eliminar después de refactor):
- certificados (eliminado del backend)
- motor-operaciones (será supply_chain)
- gestion-integral (será hseq_management)
- cadena-valor (será múltiples módulos)
- procesos-apoyo (será talent_hub, admin_finance)
- inteligencia-negocios (será analytics)
- reportes (será analytics/generador_informes)

🔜 Próximamente:
- cumplimiento (motor_cumplimiento)
- supply_chain (refactor de proveedores + econorte)
- production_ops (refactor de recepciones + lotes)
- logistics_fleet
- sales_crm
- talent_hub
- admin_finance
- accounting
- analytics
- audit_system
```

## Sidebar Dinámico

**Archivo:** `frontend/src/layouts/Sidebar.tsx`

El sidebar está correctamente configurado y NO requiere cambios porque:

1. **Es 100% dinámico:** Carga módulos, tabs y secciones desde la API
2. **Iconos dinámicos:** Usa Lucide React con lookup dinámico
3. **Colores por macroproceso:** Ya soporta los 6 niveles:
   - Nivel 1 (Estratégico): `purple`
   - Nivel 2 (Cumplimiento): `blue`
   - Nivel 3 (HSEQ): `green`
   - Nivel 4 (Cadena Valor): `orange`
   - Nivel 5 (Habilitadores): `gray`
   - Nivel 6 (Inteligencia): `indigo`

4. **Control granular:** Si un módulo/tab se desactiva desde `ConfiguracionTab`, desaparece automáticamente del sidebar

## Próximos Pasos

### Fase 1: Refactorizar Supply Chain (4-6 semanas)
1. Crear estructura `backend/apps/supply_chain/`
2. Migrar lógica de proveedores + econorte
3. Crear feature `frontend/src/features/supply-chain/`
4. Eliminar features legacy: `proveedores`, `econorte`, `ecoaliados`

### Fase 2: Refactorizar Production Ops (3-4 semanas)
1. Crear estructura `backend/apps/production_ops/`
2. Migrar lógica de recepciones + lotes
3. Crear feature `frontend/src/features/production-ops/`
4. Eliminar features legacy: `recepciones`, `lotes`

### Fase 3: Implementar Módulos Nivel 5 (8-10 semanas)
1. `talent_hub` (Centro de Talento) - 11 tabs
2. `admin_finance` (Administración y Finanzas) - 4 tabs
3. `accounting` (Contabilidad - activable) - 4 tabs

### Fase 4: Implementar Módulos Nivel 6 (6-8 semanas)
1. `analytics` (Analítica) - 7 tabs
2. `audit_system` (Sistema de Auditoría) - 4 tabs

### Fase 5: Implementar Motor de Cumplimiento (4-6 semanas)
1. `motor_cumplimiento` - 4 tabs
2. Integración con web scraping para matriz legal

### Fase 6: Implementar Módulos Nivel 4 Faltantes (6-8 semanas)
1. `logistics_fleet` (Logística y Flota) - 4 tabs
2. `sales_crm` (Ventas y CRM) - 4 tabs

## Archivos Modificados

1. ✅ `frontend/src/routes/index.tsx` - Reorganizado completamente
2. ✅ `REORGANIZACION_FRONTEND.md` - Documentación creada

## Archivos Verificados (Sin cambios)

1. ✅ `frontend/src/layouts/Sidebar.tsx` - Ya dinámico, no requiere cambios
2. ✅ `frontend/src/utils/constants.ts` - Constantes de materia prima OK
3. ✅ `frontend/src/constants/permissions.ts` - Permisos RBAC OK

## Compatibilidad

- ✅ Rutas legacy redirigidas automáticamente
- ✅ Features existentes mantienen funcionalidad
- ✅ Sidebar carga dinámicamente desde BD
- ✅ Sistema RBAC preservado
- ✅ Smart Redirect funcional

## Conclusión

El frontend ha sido reorganizado exitosamente según la estructura de 6 niveles. El sidebar es dinámico y se auto-actualiza según la configuración de base de datos. Las rutas legacy se mantienen temporalmente con redirecciones para garantizar compatibilidad durante la migración incremental.

**Estado:** ✅ Reorganización completada
**Próxima acción:** Refactorizar módulos legacy a estructura de 6 niveles (ver cronograma)
