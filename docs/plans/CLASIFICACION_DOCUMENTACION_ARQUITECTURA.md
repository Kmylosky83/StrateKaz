# Clasificacion de Documentacion - Carpeta Arquitectura

**Fecha de Analisis:** 2026-01-15
**Objetivo:** Identificar documentos vigentes vs legacy para organizar la documentacion

---

## RESUMEN EJECUTIVO

| Categoria | Cantidad | Accion |
|-----------|----------|--------|
| **VIGENTES** | 4 | Mantener y actualizar |
| **LEGACY/HISTORICO** | 4 | Mover a carpeta `legacy/` |
| **OBSOLETOS** | 3 | Eliminar o archivar |

---

## DOCUMENTOS VIGENTES (Mantener)

### 1. CATALOGO-MODULOS.md
- **Estado:** VIGENTE
- **Ultima actualizacion:** Refleja arquitectura actual v3.3.0
- **Contenido:** Catalogo de 6 niveles, 14 modulos con estados de desarrollo
- **Relevancia:** Alta - Describe la estructura modular actual del sistema
- **Accion:** MANTENER - Sincronizar con documentos generados en esta auditoria

### 2. DATABASE-ARCHITECTURE.md
- **Estado:** VIGENTE (con actualizaciones pendientes)
- **Fecha interna:** 2024-12-22
- **Contenido:** Arquitectura de 154 tablas MySQL, estrategia multi-tenant
- **Relevancia:** Alta - Documentacion de referencia para la base de datos
- **Accion:** MANTENER - Actualizar con tablas nuevas del RBAC unificado

### 3. ESTRUCTURA-6-NIVELES-ERP.md
- **Estado:** VIGENTE
- **Fecha interna:** 2024-12-23
- **Contenido:** Descripcion jerarquica del sidebar y modulos por nivel
- **Relevancia:** Alta - Define la navegacion del sistema
- **Accion:** MANTENER - Referencia para desarrollo frontend

### 4. DIAGRAMA-ER.md
- **Estado:** VIGENTE
- **Fecha interna:** 2025-12-23, Version 1.0
- **Contenido:** Diagramas ER en Mermaid por modulo
- **Relevancia:** Media-Alta - Util para visualizar relaciones
- **Accion:** MANTENER - Complementa DATABASE-ARCHITECTURE.md

---

## DOCUMENTOS LEGACY/HISTORICO (Mover a legacy/)

### 5. ANALISIS-SAAS-ARQUITECTURA.md
- **Estado:** LEGACY/HISTORICO
- **Fecha interna:** 17 Diciembre 2025
- **Contenido:** Analisis de conversion a SaaS multi-tenant
- **Problema:** Documento de planificacion, no de arquitectura implementada
- **Relevancia:** Baja para desarrollo actual, util como referencia futura
- **Accion:** MOVER a `docs/legacy/analisis-saas/` - No aplica al modelo actual de deployment multi-instancia

### 6. PLAN-MIGRACION-INCREMENTAL.md
- **Estado:** LEGACY/OBSOLETO
- **Tamano:** 2548 lineas (excesivo)
- **Contenido:** Plan de migracion de 32 dias desde 81 apps a 14 apps
- **Problema:**
  - Referencias a proyecto "grasas_huesos_db" (proyecto anterior)
  - Plan ya ejecutado o desactualizado
  - Muy largo para ser util como referencia
- **Relevancia:** Nula para desarrollo actual
- **Accion:** MOVER a `docs/legacy/migraciones/` o ELIMINAR

### 7. SISTEMA-UNIDADES-MEDIDA.md
- **Estado:** LEGACY/PROYECTO ANTERIOR
- **Contenido:** Sistema dinamico de unidades de medida
- **Problema:**
  - Referencia rutas incorrectas: `c:\Proyectos\Grasas y Huesos del Norte\`
  - Pertenece a proyecto anterior, no a StrateKaz actual
- **Relevancia:** Nula
- **Accion:** ELIMINAR - No corresponde a este proyecto

### 8. INTEGRACIONES-ARQUITECTURA.md
- **Estado:** PARCIALMENTE VIGENTE / EN PROGRESO
- **Contenido:** Arquitectura de integraciones externas frontend
- **Problema:**
  - Indica "Backend Django (pendiente)" - incompleto
  - Solo describe frontend, falta backend
- **Relevancia:** Media - Util pero incompleto
- **Accion:** MOVER a `docs/desarrollo/` y completar

---

## ARCHIVOS OBSOLETOS (Eliminar o Archivar)

### 9. Diagrama de Bases de Datos.txt
- **Estado:** OBSOLETO
- **Formato:** JSON en archivo .txt
- **Fecha interna:** 2024-12-22
- **Contenido:** Schema de base de datos en formato JSON
- **Problema:**
  - Formato inadecuado (.txt con JSON, deberia ser .json)
  - Duplica informacion de DATABASE-ARCHITECTURE.md
- **Relevancia:** Nula - Ya existe version mejor documentada
- **Accion:** ELIMINAR - Reemplazado por DATABASE-ARCHITECTURE.md

### 10. stack.txt
- **Estado:** OBSOLETO/REFERENCIA
- **Formato:** JSON en archivo .txt
- **Fecha interna:** 2024-12-22
- **Contenido:** Lista exhaustiva de librerias recomendadas (1019 lineas)
- **Problema:**
  - Formato inadecuado
  - Lista de deseos, no stack implementado
  - Muchas librerias listadas no se usan
- **Relevancia:** Baja - Solo como referencia de opciones
- **Accion:** MOVER a `docs/legacy/` o ELIMINAR

### 11. Estructura Final 22.txt
- **Estado:** OBSOLETO
- **Formato:** JSON en archivo .txt (archivo muy grande)
- **Contenido:** Estructura de modulos/tabs/subtabs
- **Problema:**
  - Formato JSON en .txt
  - Duplica informacion de otros documentos
  - Nombre generico "Final 22" sin contexto
- **Relevancia:** Nula
- **Accion:** ELIMINAR - Reemplazado por CATALOGO-MODULOS.md y ESTRUCTURA-6-NIVELES-ERP.md

---

## PLAN DE REORGANIZACION

### Estructura Propuesta

```
docs/
├── arquitectura/           # Documentos vigentes
│   ├── CATALOGO-MODULOS.md
│   ├── DATABASE-ARCHITECTURE.md
│   ├── ESTRUCTURA-6-NIVELES-ERP.md
│   └── DIAGRAMA-ER.md
│
├── desarrollo/             # Documentos de trabajo
│   ├── INTEGRACIONES-ARQUITECTURA.md  (completar)
│   ├── ARQUITECTURA-DINAMICA.md
│   └── ANALISIS_DOCKER_Y_LANZAMIENTO.md
│
├── legacy/                 # Documentos historicos
│   ├── analisis-saas/
│   │   └── ANALISIS-SAAS-ARQUITECTURA.md
│   ├── migraciones/
│   │   └── PLAN-MIGRACION-INCREMENTAL.md
│   └── referencias/
│       └── stack.txt (si se conserva)
│
├── plans/                  # Planes activos (generados esta sesion)
│   ├── AUDITORIA_FUNCIONAL_STRATEKAZ.md
│   └── PLAN_INTERVENCION_BRECHAS.md
│
└── guides/                 # Guias de uso
    └── GUIA-MULTI-INSTANCIA.md
```

### Archivos a Eliminar

1. `Diagrama de Bases de Datos.txt` - Duplicado en formato inferior
2. `Estructura Final 22.txt` - Duplicado sin contexto
3. `SISTEMA-UNIDADES-MEDIDA.md` - Proyecto incorrecto

---

## COMANDOS DE EJECUCION

### Para reorganizar (PowerShell):

```powershell
# Crear estructura de carpetas
mkdir -Force "docs/legacy/analisis-saas"
mkdir -Force "docs/legacy/migraciones"
mkdir -Force "docs/legacy/referencias"

# Mover documentos legacy
Move-Item "docs/arquitectura/ANALISIS-SAAS-ARQUITECTURA.md" "docs/legacy/analisis-saas/"
Move-Item "docs/arquitectura/PLAN-MIGRACION-INCREMENTAL.md" "docs/legacy/migraciones/"
Move-Item "docs/arquitectura/stack.txt" "docs/legacy/referencias/"

# Mover a desarrollo
Move-Item "docs/arquitectura/INTEGRACIONES-ARQUITECTURA.md" "docs/desarrollo/"

# Eliminar obsoletos
Remove-Item "docs/arquitectura/Diagrama de Bases de Datos.txt"
Remove-Item "docs/arquitectura/Estructura Final 22.txt"
Remove-Item "docs/arquitectura/SISTEMA-UNIDADES-MEDIDA.md"
```

---

## DOCUMENTOS NUEVOS GENERADOS (Esta Sesion)

Estos documentos reemplazan/complementan la documentacion existente:

| Documento | Ubicacion | Proposito |
|-----------|-----------|-----------|
| AUDITORIA_FUNCIONAL_STRATEKAZ.md | docs/plans/ | Mapeo completo de estructura actual |
| PLAN_INTERVENCION_BRECHAS.md | docs/plans/ | Plan de trabajo para cerrar brechas |
| CLASIFICACION_DOCUMENTACION_ARQUITECTURA.md | docs/ | Este documento |

---

## RECOMENDACIONES

1. **Prioridad Alta:** Eliminar archivos .txt con JSON - formato incorrecto
2. **Prioridad Alta:** Eliminar SISTEMA-UNIDADES-MEDIDA.md - proyecto incorrecto
3. **Prioridad Media:** Crear carpeta legacy/ para documentos historicos
4. **Prioridad Media:** Actualizar DATABASE-ARCHITECTURE.md con cambios RBAC
5. **Prioridad Baja:** Completar INTEGRACIONES-ARQUITECTURA.md

---

## MATRIZ DE DECISION

| Archivo | Lineas | Vigente | Duplicado | Proyecto Correcto | Decision |
|---------|--------|---------|-----------|-------------------|----------|
| CATALOGO-MODULOS.md | 296 | Si | No | Si | MANTENER |
| DATABASE-ARCHITECTURE.md | 1846 | Si | No | Si | MANTENER |
| ESTRUCTURA-6-NIVELES-ERP.md | 806 | Si | No | Si | MANTENER |
| DIAGRAMA-ER.md | 544 | Si | No | Si | MANTENER |
| ANALISIS-SAAS-ARQUITECTURA.md | 2550 | Parcial | No | Si | LEGACY |
| PLAN-MIGRACION-INCREMENTAL.md | 2548 | No | No | Parcial | ELIMINAR |
| SISTEMA-UNIDADES-MEDIDA.md | 555 | No | No | NO | ELIMINAR |
| INTEGRACIONES-ARQUITECTURA.md | 395 | Parcial | No | Si | DESARROLLAR |
| Diagrama de Bases de Datos.txt | 2500+ | No | SI | Si | ELIMINAR |
| stack.txt | 1019 | No | No | Si | LEGACY |
| Estructura Final 22.txt | 1100+ | No | SI | Si | ELIMINAR |

---

**Conclusion:** De 11 archivos en `docs/arquitectura/`, solo 4 son realmente vigentes y utiles.
Se recomienda ejecutar la reorganizacion propuesta para mantener la documentacion limpia y funcional.
