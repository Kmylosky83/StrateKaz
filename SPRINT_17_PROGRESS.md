# 🚀 SPRINT 17: PARTES INTERESADAS V2 - PROGRESO

**Fecha inicio**: 2026-02-15
**Estado**: 🟢 EN PROGRESO (Día 1 - Backend Models)

---

## ✅ COMPLETADO (50% - Día 1)

### **1. Backend - Modelos** ✅

#### **A. Nuevo modelo: `GrupoParteInteresada`** ✅
- **Archivo**: `backend/apps/gestion_estrategica/contexto/models.py`
- **Líneas agregadas**: ~60
- **Campos**:
  - `codigo` (CharField 30, unique)
  - `nombre` (CharField 100)
  - `descripcion` (TextField)
  - `icono` (CharField 50, default='Users')
  - `color` (CharField 20, default='blue')
  - `es_sistema` (BooleanField)
  - Hereda: `TimestampedModel`, `SoftDeleteModel`, `OrderedModel`
- **Índices**:
  - `codigo`
  - `es_sistema + is_active`

#### **B. Modelo actualizado: `TipoParteInteresada`** ✅
- **Cambios**:
  - ✅ FK `grupo` → `GrupoParteInteresada` (null=True temporal)
  - ✅ Campo `es_sistema` (BooleanField)
  - ✅ `codigo` max_length 20→30
  - ✅ Ordering actualizado: `grupo__orden, orden, nombre`
  - ✅ Índices nuevos: `grupo+categoria`, `codigo`
  - ✅ `__str__` mejorado: "{grupo.nombre} → {nombre}"

#### **C. Modelo actualizado: `ParteInteresada`** ✅
- **Campos nuevos**:
  - ✅ `responsable_empresa` (FK → Colaborador)
  - ✅ `cargo_responsable` (FK → Cargo)
  - ✅ `area_responsable` (FK → Area)
  - ✅ `nivel_influencia_empresa` (CharField 10) - NUEVO impacto bidireccional
  - ✅ `temas_interes_pi` (TextField) - Renombrado/conceptual
  - ✅ `temas_interes_empresa` (TextField) - NUEVO bidireccional
- **Campos renombrados**:
  - ✅ `nivel_influencia` → `nivel_influencia_pi`
- **Métodos nuevos**:
  - ✅ `grupo_nombre` (property) - Para serializers
  - ✅ `generar_comunicacion_automatica()` - Generación matriz
- **Índices nuevos**:
  - ✅ `empresa + responsable_empresa`
  - ✅ `empresa + area_responsable`
- **Ordenamiento actualizado**: `nivel_influencia_pi` (no `nivel_influencia`)

---

### **2. Backend - Migración** ✅

- **Archivo**: `backend/apps/gestion_estrategica/contexto/migrations/0003_partes_interesadas_v2_sprint17.py`
- **Operaciones**:
  1. ✅ CreateModel `GrupoParteInteresada`
  2. ✅ AddIndex (2 índices)
  3. ✅ AddField `grupo` a `TipoParteInteresada` (nullable temporal)
  4. ✅ AddField `es_sistema` a `TipoParteInteresada`
  5. ✅ AlterField `codigo` TipoParteInteresada (30 chars)
  6. ✅ AddIndex TipoParteInteresada (2 índices)
  7. ✅ RenameField `nivel_influencia` → `nivel_influencia_pi`
  8. ✅ AddField 6 campos nuevos a `ParteInteresada`
  9. ✅ AddIndex ParteInteresada (2 índices)
  10. ✅ AlterField help_text campos existentes

---

### **3. Backend - Seed** ✅

- **Archivo**: `backend/apps/gestion_estrategica/contexto/management/commands/seed_grupos_partes_interesadas.py`
- **Función**: Crea los 10 grupos predefinidos del sistema
- **Grupos seeded**:
  1. PERSONAL (blue, Users)
  2. PROPIEDAD (purple, Building2)
  3. CLIENTES (green, ShoppingCart)
  4. PROVEEDORES (orange, Truck)
  5. COMPETIDORES (red, Target)
  6. COMUNIDAD_LOCAL (cyan, MapPin)
  7. ADMIN_PUBLICAS (indigo, Landmark)
  8. AGENTES_SOCIALES (violet, GraduationCap)
  9. SOCIEDAD (pink, Newspaper)
  10. MEDIO_AMBIENTE (emerald, Leaf)
- **Comando**: `python manage.py seed_grupos_partes_interesadas`

---

### **4. Backend - Serializers** ✅

#### **A. Nuevo serializer: `GrupoParteInteresadaSerializer`** ✅
- **Campos**: id, codigo, nombre, descripcion, icono, color, orden, es_sistema, is_active, created_at, updated_at

#### **B. Actualizado: `TipoParteInteresadaSerializer`** ✅
- **Campos nuevos**:
  - `grupo` (FK)
  - `grupo_nombre` (read-only)
  - `grupo_codigo` (read-only)
  - `grupo_icono` (read-only)
  - `grupo_color` (read-only)
  - `es_sistema`

#### **C. Actualizado: `ParteInteresadaSerializer`** ✅
- **Campos nuevos (jerarquía)**:
  - `grupo_nombre`, `grupo_codigo`, `grupo_icono`, `grupo_color` (read-only from tipo.grupo)
- **Campos nuevos (responsables)**:
  - `responsable_empresa`, `responsable_empresa_nombre`
  - `cargo_responsable`, `cargo_responsable_nombre`
  - `area_responsable`, `area_responsable_nombre`
- **Campos nuevos (impacto bidireccional)**:
  - `nivel_influencia_empresa`, `nivel_influencia_empresa_display`
- **Campos nuevos (temas)**:
  - `temas_interes_pi`, `temas_interes_empresa`
- **Campos renombrados**:
  - `nivel_influencia` → `nivel_influencia_pi`
  - `nivel_influencia_display` → `nivel_influencia_pi_display`

---

---

### **2. Backend - ViewSets + URLs** ✅

#### **A. Nuevo ViewSet: `GrupoParteInteresadaViewSet`** ✅
- **Archivo**: `backend/apps/gestion_estrategica/contexto/views.py`
- **Funcionalidad**:
  - CRUD completo de grupos
  - Protección soft-delete para grupos del sistema (es_sistema=True)
  - Filtros: is_active, es_sistema
  - Búsqueda: codigo, nombre, descripcion
  - Ordenamiento: orden, nombre

#### **B. Actualizado: `TipoParteInteresadaViewSet`** ✅
- **Cambios**:
  - ✅ select_related('grupo') para optimización
  - ✅ Filtros: grupo, categoria, es_sistema, is_active
  - ✅ Ordenamiento jerárquico: grupo.orden → tipo.orden → nombre

#### **C. Actualizado: `ParteInteresadaViewSet`** ✅
- **Optimización queries**:
  - ✅ select_related('tipo', 'tipo__grupo', 'responsable_empresa', 'cargo_responsable', 'area_responsable')
- **Filtros nuevos**:
  - ✅ tipo__grupo, nivel_influencia_pi, nivel_influencia_empresa, responsable_empresa, cargo_responsable, area_responsable
- **Acciones implementadas**:
  - ✅ `export_excel()` - GET - Exporta 4 hojas Excel formato F-GD-04
    - Hoja 1: Identificación (GRUPO → SUBGRUPO → PI)
    - Hoja 2: Caracterización (Temas bidireccionales + Impacto bidireccional)
    - Hoja 3: Modelos de Relación (Responsable + Canal)
    - Hoja 4: Matriz Consolidada (resumen completo)
  - ✅ `import_excel()` - POST multipart/form-data - Importa desde Excel F-GD-04
    - Crea/actualiza grupos y tipos on-demand
    - Manejo de errores por fila
    - Transacción atómica
  - ✅ `generar_matriz_comunicacion()` - POST - Genera matriz individual
    - Input: {parte_interesada_id}
    - Lógica cuadrante → frecuencia
  - ✅ `generar_matriz_comunicacion_masiva()` - POST - Genera matriz bulk
    - Filtro opcional: ?grupo=<id>
    - Estadísticas: created/updated/errors
- **Acciones actualizadas**:
  - ✅ `matriz_poder_interes()` - usa nivel_influencia_pi (no nivel_influencia)
  - ✅ `estadisticas()` - incluye por_grupo, por_influencia_pi, por_influencia_empresa

#### **D. URLs actualizadas** ✅
- **Archivo**: `backend/apps/gestion_estrategica/contexto/urls.py`
- ✅ Ruta nueva: `/grupos-parte-interesada/`
- ✅ Import GrupoParteInteresadaViewSet

---

## ⏳ PENDIENTE (40% - Días 3-13)

### **Día 3-4: Backend Testing**
- [ ] Testing endpoints API
  - [ ] GET /grupos-parte-interesada/
  - [ ] GET/POST /partes-interesadas/export_excel/
  - [ ] POST /partes-interesadas/import_excel/
  - [ ] POST /partes-interesadas/generar_matriz_comunicacion/
  - [ ] POST /partes-interesadas/generar_matriz_comunicacion_masiva/
- [ ] Testing lógica cuadrantes → frecuencia

### **Día 5: Frontend - API Client**
- [ ] Actualizar `contextoApi.ts`
  - [ ] Agregar `gruposParteInteresadaApi`
  - [ ] Métodos export/import Excel
  - [ ] Método generar matriz
- [ ] Tipos TypeScript actualizados (Sprint 17 fields)

### **Día 6-7: Frontend - Refactor Hooks**
- [ ] Migrar `usePartesInteresadas.ts` a factory pattern
- [ ] Hooks custom: export, import, generar matriz
- [ ] Testing hooks refactorizados

### **Día 8-11: Frontend - UI Components**
- [ ] Actualizar `ParteInteresadaFormModal`:
  - [ ] Campo grupo (read-only from tipo)
  - [ ] Campo responsable empresa (Select Colaborador/Cargo/Área)
  - [ ] Campo impacto empresa→PI
  - [ ] Campo temas interés empresa
- [ ] Actualizar `StakeholdersSection`:
  - [ ] Botones Import/Export Excel
  - [ ] Botón "Generar Matriz Comunicación"
  - [ ] Filtro por grupo
  - [ ] StatsGrid actualizado
- [ ] Crear `GrupoParteInteresadaManager` (CRUD grupos custom)

### **Día 12-13: Testing + Deploy**
- [ ] Testing E2E flujo completo
- [ ] Seed en producción
- [ ] Migración
- [ ] Deploy

---

## 📊 MÉTRICAS

| Aspecto | Líneas Código | Estado |
|---------|---------------|--------|
| **Backend Models** | +180 | ✅ 100% |
| **Backend Migration** | +220 | ✅ 100% |
| **Backend Seed** | +120 | ✅ 100% |
| **Backend Serializers** | +60 | ✅ 100% |
| **Backend ViewSets + URLs** | +550 | ✅ 100% |
| **Backend Testing** | 0/50 | ⏳ 0% |
| **Frontend API Client** | 0/120 | ⏳ 0% |
| **Frontend Hooks** | 0/180 | ⏳ 0% |
| **Frontend UI** | 0/350 | ⏳ 0% |
| **TOTAL** | 1130/1830 | 🟢 62% |

---

## 🎯 PRÓXIMOS PASOS (Día 3)

1. ⏳ Testing endpoints backend (Postman/cURL)
2. ⏳ Frontend: Actualizar contextoApi.ts
   - Agregar gruposParteInteresadaApi
   - Agregar métodos export/import Excel
   - Agregar métodos generar matriz
3. ⏳ Frontend: Refactor hooks con factory pattern
4. ⏳ Frontend: Actualizar UI components

---

**Última actualización**: 2026-02-15 (Fin Día 2 - Backend completo)
