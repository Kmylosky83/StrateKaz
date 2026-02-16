# 🎯 Sprint 17: Backend COMPLETADO - Resumen

**Fecha**: 2026-02-15 (Día 2)
**Estado**: ✅ Backend 100% completado

---

## 📦 Archivos Modificados/Creados

### **Modelos** ✅
**Archivo**: `backend/apps/gestion_estrategica/contexto/models.py`

1. **Nuevo modelo**: `GrupoParteInteresada` (+60 líneas)
   - Campos: codigo, nombre, descripcion, icono, color, es_sistema
   - Hereda: TimestampedModel, SoftDeleteModel, OrderedModel
   - Índices: codigo, es_sistema+is_active

2. **Actualizado**: `TipoParteInteresada`
   - ✅ FK `grupo` → `GrupoParteInteresada` (null=True temporal)
   - ✅ Campo `es_sistema` (BooleanField)
   - ✅ `codigo` max_length 20→30
   - ✅ Ordering: `grupo__orden, orden, nombre`
   - ✅ Índices: grupo+categoria, codigo
   - ✅ `__str__`: "{grupo.nombre} → {nombre}"

3. **Actualizado**: `ParteInteresada`
   - ✅ `nivel_influencia` → `nivel_influencia_pi` (renombrado)
   - ✅ `nivel_influencia_empresa` (CharField 10) - NUEVO
   - ✅ `temas_interes_pi` (TextField) - Renombrado conceptual
   - ✅ `temas_interes_empresa` (TextField) - NUEVO
   - ✅ `responsable_empresa` (FK → Colaborador)
   - ✅ `cargo_responsable` (FK → Cargo)
   - ✅ `area_responsable` (FK → Area)
   - ✅ Property `grupo_nombre` (para serializers)
   - ✅ Método `generar_comunicacion_automatica()`
   - ✅ Índices: empresa+responsable_empresa, empresa+area_responsable

---

### **Migración** ✅
**Archivo**: `backend/apps/gestion_estrategica/contexto/migrations/0003_partes_interesadas_v2_sprint17.py`

**220 líneas**, 10 operaciones:
1. CreateModel `GrupoParteInteresada`
2. AddIndex (2 índices en GrupoParteInteresada)
3. AddField `grupo` a TipoParteInteresada (nullable temporal)
4. AddField `es_sistema` a TipoParteInteresada
5. AlterField `codigo` TipoParteInteresada (30 chars)
6. AddIndex TipoParteInteresada (2 índices)
7. RenameField `nivel_influencia` → `nivel_influencia_pi`
8. AddField 6 campos nuevos a ParteInteresada
9. AddIndex ParteInteresada (2 índices)
10. AlterField help_text campos existentes

---

### **Seed** ✅
**Archivo**: `backend/apps/gestion_estrategica/contexto/management/commands/seed_grupos_partes_interesadas.py`

**120 líneas**

Crea 10 grupos del sistema:
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

**Comando**: `python manage.py seed_grupos_partes_interesadas`

---

### **Serializers** ✅
**Archivo**: `backend/apps/gestion_estrategica/contexto/serializers.py`

**+60 líneas**

1. **Nuevo**: `GrupoParteInteresadaSerializer`
   - Campos: id, codigo, nombre, descripcion, icono, color, orden, es_sistema, is_active, timestamps

2. **Actualizado**: `TipoParteInteresadaSerializer`
   - Campos nuevos read-only: grupo_nombre, grupo_codigo, grupo_icono, grupo_color
   - Campo FK: grupo, es_sistema

3. **Actualizado**: `ParteInteresadaSerializer`
   - Campos jerarquía read-only: grupo_nombre, grupo_codigo, grupo_icono, grupo_color
   - Campos responsables: responsable_empresa, responsable_empresa_nombre, cargo_responsable, cargo_responsable_nombre, area_responsable, area_responsable_nombre
   - Campos impacto: nivel_influencia_pi, nivel_influencia_pi_display, nivel_influencia_empresa, nivel_influencia_empresa_display
   - Campos temas: temas_interes_pi, temas_interes_empresa

---

### **ViewSets** ✅
**Archivo**: `backend/apps/gestion_estrategica/contexto/views.py`

**+550 líneas**

#### **1. Nuevo ViewSet**: `GrupoParteInteresadaViewSet`
- CRUD completo
- Soft-delete protegido para grupos del sistema
- Filtros: is_active, es_sistema
- Búsqueda: codigo, nombre, descripcion
- Ordenamiento: orden, nombre

#### **2. Actualizado**: `TipoParteInteresadaViewSet`
- select_related('grupo')
- Filtros: grupo, categoria, es_sistema
- Ordenamiento jerárquico: grupo.orden → tipo.orden → nombre

#### **3. Actualizado**: `ParteInteresadaViewSet`

**Optimización queries**:
- select_related('tipo', 'tipo__grupo', 'responsable_empresa', 'cargo_responsable', 'area_responsable')

**Filtros nuevos**:
- tipo__grupo, nivel_influencia_pi, nivel_influencia_empresa
- responsable_empresa, cargo_responsable, area_responsable

**Acciones nuevas** (+450 líneas):

##### **A. export_excel()** - GET
```python
GET /partes-interesadas/export_excel/
```
- Genera Excel con 4 hojas:
  1. Identificación (GRUPO → SUBGRUPO → PI)
  2. Caracterización (Temas + Impacto bidireccional)
  3. Modelos de Relación (Responsable + Canal)
  4. Matriz Consolidada (resumen)
- Formato compatible con F-GD-04
- Estilos: headers azules, borders, alignment
- Response: archivo Excel (.xlsx)

##### **B. import_excel()** - POST multipart
```python
POST /partes-interesadas/import_excel/
Content-Type: multipart/form-data
file: <Excel>
```
- Lee hojas "Identificación" o "Matriz Consolidada"
- Mapeo columnas case-insensitive
- Crea/actualiza grupos y tipos on-demand
- Transacción atómica
- Response: {created, updated, errors}

##### **C. generar_matriz_comunicacion()** - POST
```python
POST /partes-interesadas/generar_matriz_comunicacion/
Body: {"parte_interesada_id": <int>}
```
- Genera matriz individual
- Lógica cuadrante → frecuencia:
  - gestionar_cerca → mensual
  - mantener_satisfecho → trimestral
  - mantener_informado → bimestral
  - monitorear → semestral
- Llama a `parte.generar_comunicacion_automatica()`

##### **D. generar_matriz_comunicacion_masiva()** - POST
```python
POST /partes-interesadas/generar_matriz_comunicacion_masiva/?grupo=<id>
```
- Genera matrices para todas las PIs activas
- Filtro opcional por grupo
- Response: {created, updated, errors, total}

##### **E. matriz_poder_interes()** - GET (actualizado)
- Usa `nivel_influencia_pi` en lugar de `nivel_influencia`
- Cuadrantes: gestionar_cerca, mantener_satisfecho, mantener_informado, monitorear

##### **F. estadisticas()** - GET (actualizado)
- Nuevo campo: `por_grupo`
- Nuevos campos: `por_influencia_pi`, `por_influencia_empresa`

---

### **URLs** ✅
**Archivo**: `backend/apps/gestion_estrategica/contexto/urls.py`

**+1 línea**

```python
router.register(r'grupos-parte-interesada', GrupoParteInteresadaViewSet, basename='grupo-parte-interesada')
```

**Endpoint**: `/api/gestion-estrategica/contexto/grupos-parte-interesada/`

---

## 📊 Resumen Numérico

| Componente | Líneas Agregadas/Modificadas |
|------------|------------------------------|
| Models | +180 |
| Migration | +220 |
| Seed | +120 |
| Serializers | +60 |
| ViewSets | +550 |
| URLs | +1 |
| **TOTAL Backend** | **+1131 líneas** |

---

## 🚀 Próximos Pasos (Testing Backend)

### **Opción 1: Testing Manual (Postman/cURL)**

#### **1. Aplicar Migración**
```bash
cd backend
source venv/bin/activate  # o venv\Scripts\activate en Windows
python manage.py migrate
```

#### **2. Ejecutar Seed**
```bash
python manage.py seed_grupos_partes_interesadas
```

#### **3. Testing Endpoints**

**3.1. Listar grupos pre-seeded**
```bash
curl -X GET "http://localhost:8000/api/gestion-estrategica/contexto/grupos-parte-interesada/" \
  -H "Authorization: Bearer {token}"
```

**3.2. Crear grupo custom**
```bash
curl -X POST "http://localhost:8000/api/gestion-estrategica/contexto/grupos-parte-interesada/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "ALIADOS",
    "nombre": "Aliados Estratégicos",
    "icono": "Handshake",
    "color": "teal",
    "es_sistema": false
  }'
```

**3.3. Export Excel**
```bash
curl -X GET "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/export_excel/" \
  -H "Authorization: Bearer {token}" \
  -o "Matriz_Test.xlsx"
```

**3.4. Generar matriz individual**
```bash
curl -X POST "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/generar_matriz_comunicacion/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"parte_interesada_id": 1}'
```

**3.5. Generar matriz masiva**
```bash
curl -X POST "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/generar_matriz_comunicacion_masiva/?grupo=1" \
  -H "Authorization: Bearer {token}"
```

---

### **Opción 2: Testing con Django Shell**

```bash
python manage.py shell
```

```python
from apps.gestion_estrategica.contexto.models import (
    GrupoParteInteresada,
    TipoParteInteresada,
    ParteInteresada
)

# Verificar grupos
grupos = GrupoParteInteresada.objects.all()
print(f"Total grupos: {grupos.count()}")
for g in grupos:
    print(f"  {g.codigo}: {g.nombre} (sistema: {g.es_sistema})")

# Crear tipo de prueba
grupo_personal = GrupoParteInteresada.objects.get(codigo='PERSONAL')
tipo_test = TipoParteInteresada.objects.create(
    codigo='TEST_EMPLEADOS',
    nombre='Empleados de Prueba',
    grupo=grupo_personal,
    categoria='interno'
)

# Crear parte interesada de prueba
parte_test = ParteInteresada.objects.create(
    nombre='Sindicato Test',
    tipo=tipo_test,
    nivel_influencia_pi='alta',
    nivel_influencia_empresa='media',
    nivel_interes='alto',
    temas_interes_pi='Salarios, condiciones',
    temas_interes_empresa='Productividad, clima'
)

# Probar método generar_comunicacion_automatica
comunicacion, created = parte_test.generar_comunicacion_automatica()
print(f"Comunicación creada: {created}")
print(f"Frecuencia: {comunicacion.cuando_comunicar}")
```

---

## ✅ Checklist Backend Completado

- [x] Modelo GrupoParteInteresada
- [x] Modelo TipoParteInteresada (FK grupo)
- [x] Modelo ParteInteresada (nuevos campos bidireccionales + responsables)
- [x] Migración 0003_partes_interesadas_v2_sprint17.py
- [x] Seed seed_grupos_partes_interesadas.py
- [x] Serializer GrupoParteInteresadaSerializer
- [x] Serializer TipoParteInteresadaSerializer (campos grupo)
- [x] Serializer ParteInteresadaSerializer (campos nuevos)
- [x] ViewSet GrupoParteInteresadaViewSet
- [x] ViewSet TipoParteInteresadaViewSet (filtros grupo)
- [x] ViewSet ParteInteresadaViewSet (filtros nuevos)
- [x] Acción export_excel() (4 hojas)
- [x] Acción import_excel() (mapeo columns, transacción)
- [x] Acción generar_matriz_comunicacion()
- [x] Acción generar_matriz_comunicacion_masiva()
- [x] Acción matriz_poder_interes() (actualizada)
- [x] Acción estadisticas() (por_grupo)
- [x] URL grupos-parte-interesada
- [ ] Testing endpoints (pendiente - Día 3)

---

## 🎯 Próximo: Frontend (Día 4-11)

1. **Actualizar API Client** (contextoApi.ts)
   - Agregar `gruposParteInteresadaApi`
   - Agregar métodos export/import Excel
   - Agregar métodos generar matriz
   - Tipos TypeScript actualizados

2. **Refactor Hooks** (factory pattern)
   - Migrar `usePartesInteresadas.ts` a factory
   - Hooks custom: export, import, generar matriz

3. **Actualizar UI Components**
   - ParteInteresadaFormModal (campos nuevos)
   - StakeholdersSection (botones import/export)
   - GrupoParteInteresadaManager (CRUD grupos custom)

---

**Autor**: Sistema ERP StrateKaz
**Sprint**: 17 - Partes Interesadas V2
**Última actualización**: 2026-02-15 (Día 2 - Backend 100%)
