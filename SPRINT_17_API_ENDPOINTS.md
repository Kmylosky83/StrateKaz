# 📡 Sprint 17: Nuevos Endpoints API - Partes Interesadas V2

**Fecha**: 2026-02-15
**Base URL**: `/api/gestion-estrategica/contexto/`

---

## 🆕 NUEVO: Grupos de Partes Interesadas

### **Endpoint**: `/grupos-parte-interesada/`

#### **GET** - Listar grupos
```bash
GET /api/gestion-estrategica/contexto/grupos-parte-interesada/
```

**Query params**:
- `is_active`: true/false
- `es_sistema`: true/false (grupos pre-seeded vs custom)
- `search`: buscar por codigo, nombre, descripcion
- `ordering`: orden, nombre, codigo

**Response**:
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "codigo": "PERSONAL",
      "nombre": "Personal",
      "descripcion": "Empleados, directivos, personal de oficina...",
      "icono": "Users",
      "color": "blue",
      "orden": 1,
      "es_sistema": true,
      "is_active": true,
      "created_at": "2026-02-15T10:00:00Z",
      "updated_at": "2026-02-15T10:00:00Z"
    }
  ]
}
```

#### **POST** - Crear grupo custom
```bash
POST /api/gestion-estrategica/contexto/grupos-parte-interesada/
Content-Type: application/json

{
  "codigo": "ALIADOS_ESTRATEGICOS",
  "nombre": "Aliados Estratégicos",
  "descripcion": "Partners y colaboradores clave",
  "icono": "Handshake",
  "color": "teal",
  "orden": 11,
  "es_sistema": false
}
```

#### **PUT/PATCH** - Actualizar grupo
```bash
PATCH /api/gestion-estrategica/contexto/grupos-parte-interesada/{id}/
Content-Type: application/json

{
  "descripcion": "Nueva descripción",
  "color": "indigo"
}
```

#### **DELETE** - Eliminar grupo
```bash
DELETE /api/gestion-estrategica/contexto/grupos-parte-interesada/{id}/
```
**Nota**: Grupos del sistema (es_sistema=true) solo se desactivan (soft delete), no se eliminan físicamente.

---

## 🔄 ACTUALIZADO: Tipos de Parte Interesada (Subgrupos)

### **Endpoint**: `/tipos-parte-interesada/`

#### **GET** - Listar tipos (ahora con grupo)
```bash
GET /api/gestion-estrategica/contexto/tipos-parte-interesada/?grupo=1
```

**Query params nuevos**:
- `grupo`: filtrar por grupo_id
- `es_sistema`: true/false

**Response** (campos nuevos):
```json
{
  "results": [
    {
      "id": 1,
      "codigo": "EMPLEADOS_DIRECTOS",
      "nombre": "Empleados Directos",
      "grupo": 1,
      "grupo_nombre": "Personal",
      "grupo_codigo": "PERSONAL",
      "grupo_icono": "Users",
      "grupo_color": "blue",
      "categoria": "interno",
      "es_sistema": false,
      "orden": 1
    }
  ]
}
```

---

## 🔄 ACTUALIZADO: Partes Interesadas

### **Endpoint**: `/partes-interesadas/`

#### **GET** - Listar (campos nuevos)
```bash
GET /api/gestion-estrategica/contexto/partes-interesadas/
```

**Query params nuevos**:
- `tipo__grupo`: filtrar por grupo_id
- `nivel_influencia_pi`: alta/media/baja
- `nivel_influencia_empresa`: alta/media/baja
- `responsable_empresa`: colaborador_id
- `cargo_responsable`: cargo_id
- `area_responsable`: area_id

**Response** (campos nuevos):
```json
{
  "results": [
    {
      "id": 1,
      "nombre": "Sindicato de Trabajadores",
      "tipo": 1,
      "grupo_nombre": "Personal",
      "grupo_codigo": "PERSONAL",
      "grupo_icono": "Users",
      "grupo_color": "blue",

      // NUEVOS CAMPOS - Impacto bidireccional
      "nivel_influencia_pi": "alta",
      "nivel_influencia_pi_display": "Alta",
      "nivel_influencia_empresa": "media",
      "nivel_influencia_empresa_display": "Media",

      // NUEVOS CAMPOS - Temas bidireccionales
      "temas_interes_pi": "Condiciones laborales, salarios, beneficios",
      "temas_interes_empresa": "Productividad, clima laboral, retención",

      // NUEVOS CAMPOS - Responsables
      "responsable_empresa": 5,
      "responsable_empresa_nombre": "Juan Pérez",
      "cargo_responsable": 3,
      "cargo_responsable_nombre": "Gerente de RRHH",
      "area_responsable": 2,
      "area_responsable_nombre": "Talento Humano"
    }
  ]
}
```

---

## 🆕 NUEVO: Export Excel

### **Endpoint**: `POST /partes-interesadas/export_excel/`

#### **Descripción**
Exporta todas las partes interesadas a formato Excel F-GD-04 con 4 hojas:
1. **Identificación**: GRUPO → SUBGRUPO → PI
2. **Caracterización**: Temas de interés bidireccionales + Impacto bidireccional
3. **Modelos de Relación**: Responsable + Canal comunicación
4. **Matriz Consolidada**: Resumen completo

#### **Request**
```bash
GET /api/gestion-estrategica/contexto/partes-interesadas/export_excel/
```

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="Matriz_Partes_Interesadas.xlsx"`

#### **Ejemplo cURL**
```bash
curl -X GET \
  "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/export_excel/" \
  -H "Authorization: Bearer {token}" \
  -o "Matriz_Partes_Interesadas.xlsx"
```

---

## 🆕 NUEVO: Import Excel

### **Endpoint**: `POST /partes-interesadas/import_excel/`

#### **Descripción**
Importa partes interesadas desde archivo Excel formato F-GD-04.

**Formato esperado**:
- Hoja: "Identificación" o "Matriz Consolidada"
- Columnas mínimas: GRUPO, NOMBRE PARTE INTERESADA
- Columnas opcionales: SUBGRUPO, DESCRIPCIÓN, REPRESENTANTE, TEMAS INTERÉS PI, TEMAS INTERÉS EMPRESA

**Lógica**:
1. Busca grupo por nombre (crea si no existe)
2. Busca o crea tipo (subgrupo) dentro del grupo
3. Crea o actualiza parte interesada

#### **Request**
```bash
POST /api/gestion-estrategica/contexto/partes-interesadas/import_excel/
Content-Type: multipart/form-data

file: <Excel file>
```

#### **Response**
```json
{
  "message": "Importación completada: 25 creadas, 5 actualizadas",
  "created": 25,
  "updated": 5,
  "errors": [
    {
      "fila": 10,
      "error": "Campo NOMBRE requerido"
    }
  ],
  "total_procesadas": 30,
  "total_errores": 1
}
```

#### **Ejemplo cURL**
```bash
curl -X POST \
  "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/import_excel/" \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/Matriz_Partes_Interesadas.xlsx"
```

---

## 🆕 NUEVO: Generar Matriz de Comunicación (Individual)

### **Endpoint**: `POST /partes-interesadas/generar_matriz_comunicacion/`

#### **Descripción**
Genera la matriz de comunicaciones para UNA parte interesada específica.

**Lógica cuadrante → frecuencia**:
- `gestionar_cerca` → mensual
- `mantener_satisfecho` → trimestral
- `mantener_informado` → bimestral
- `monitorear` → semestral

#### **Request**
```bash
POST /api/gestion-estrategica/contexto/partes-interesadas/generar_matriz_comunicacion/
Content-Type: application/json

{
  "parte_interesada_id": 5
}
```

#### **Response**
```json
{
  "message": "Matriz de comunicación generada exitosamente",
  "created": true,
  "data": {
    "id": 10,
    "parte_interesada": 5,
    "que_comunicar": "Condiciones laborales, salarios, beneficios",
    "cuando_comunicar": "mensual",
    "como_comunicar": "reunion",
    "responsable": 3,
    "empresa": 1
  }
}
```

---

## 🆕 NUEVO: Generar Matriz de Comunicación (Masiva)

### **Endpoint**: `POST /partes-interesadas/generar_matriz_comunicacion_masiva/`

#### **Descripción**
Genera matrices de comunicación para TODAS las partes interesadas activas.

**Filtro opcional**: `?grupo=<id>` para generar solo para un grupo específico.

#### **Request**
```bash
# Todas las partes interesadas
POST /api/gestion-estrategica/contexto/partes-interesadas/generar_matriz_comunicacion_masiva/

# Solo un grupo
POST /api/gestion-estrategica/contexto/partes-interesadas/generar_matriz_comunicacion_masiva/?grupo=1
```

#### **Response**
```json
{
  "message": "Proceso completado: 25 creadas, 10 actualizadas",
  "created": 25,
  "updated": 10,
  "errors": [
    {
      "parte_interesada_id": 15,
      "parte_interesada_nombre": "Proveedor XYZ",
      "error": "Falta campo responsable"
    }
  ],
  "total_procesadas": 35,
  "total_errores": 1
}
```

---

## 🔄 ACTUALIZADO: Matriz Poder-Interés

### **Endpoint**: `GET /partes-interesadas/matriz_poder_interes/`

#### **Cambio**
Ahora usa `nivel_influencia_pi` (PODER de la PI sobre la empresa) en lugar de `nivel_influencia`.

#### **Request**
```bash
GET /api/gestion-estrategica/contexto/partes-interesadas/matriz_poder_interes/
```

#### **Response**
```json
{
  "gestionar_cerca": [
    {
      "id": 1,
      "nombre": "Sindicato",
      "nivel_influencia_pi": "alta",
      "nivel_interes": "alto"
    }
  ],
  "mantener_satisfecho": [...],
  "mantener_informado": [...],
  "monitorear": [...]
}
```

---

## 🔄 ACTUALIZADO: Estadísticas

### **Endpoint**: `GET /partes-interesadas/estadisticas/`

#### **Campos nuevos**
```json
{
  "total": 50,
  "por_grupo": {
    "Personal": 12,
    "Clientes": 8,
    "Proveedores": 10
  },
  "por_tipo": {...},
  "por_influencia_pi": {
    "alta": 15,
    "media": 20,
    "baja": 15
  },
  "por_influencia_empresa": {
    "alta": 10,
    "media": 25,
    "baja": 15
  },
  "por_interes": {...},
  "por_sistema": {...}
}
```

---

## 📋 Testing Checklist

### Backend (Postman/cURL)
- [ ] GET /grupos-parte-interesada/ (listar 10 grupos pre-seeded)
- [ ] POST /grupos-parte-interesada/ (crear grupo custom)
- [ ] PATCH /grupos-parte-interesada/{id}/ (actualizar grupo)
- [ ] DELETE /grupos-parte-interesada/{id}/ (soft delete sistema, hard delete custom)
- [ ] GET /tipos-parte-interesada/?grupo=1 (filtrar por grupo)
- [ ] GET /partes-interesadas/?tipo__grupo=1 (filtrar por grupo)
- [ ] GET /partes-interesadas/export_excel/ (descargar Excel)
- [ ] POST /partes-interesadas/import_excel/ (subir Excel)
- [ ] POST /partes-interesadas/generar_matriz_comunicacion/ (individual)
- [ ] POST /partes-interesadas/generar_matriz_comunicacion_masiva/ (bulk)
- [ ] GET /partes-interesadas/matriz_poder_interes/ (verificar nivel_influencia_pi)
- [ ] GET /partes-interesadas/estadisticas/ (verificar por_grupo)

### Frontend (próximo paso)
- [ ] Actualizar contextoApi.ts
- [ ] Refactor hooks con factory
- [ ] Actualizar UI components

---

**Autor**: Sistema ERP StrateKaz
**Sprint**: 17 - Partes Interesadas V2
**Última actualización**: 2026-02-15 (Día 2)
