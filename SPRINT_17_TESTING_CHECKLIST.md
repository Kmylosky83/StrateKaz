# ✅ Sprint 17 - Testing Checklist

**Fecha**: 2026-02-15
**Estado**: Pendiente de ejecución en servidor

---

## 📋 Pre-requisitos Testing

### **1. Aplicar Migración**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python manage.py migrate
```

**Esperado**: Migración `0003_partes_interesadas_v2_sprint17` aplicada exitosamente.

### **2. Ejecutar Seed**
```bash
python manage.py seed_grupos_partes_interesadas
```

**Esperado**: 10 grupos del sistema creados (PERSONAL, PROPIEDAD, CLIENTES, etc.)

---

## 🧪 Testing Backend (Django Shell)

### **Test 1: Verificar Grupos Pre-seeded**
```python
python manage.py shell

from apps.gestion_estrategica.contexto.models import GrupoParteInteresada

# Listar grupos
grupos = GrupoParteInteresada.objects.all()
print(f"Total grupos: {grupos.count()}")

# Verificar grupos del sistema
for g in GrupoParteInteresada.objects.filter(es_sistema=True).order_by('orden'):
    print(f"{g.orden}. {g.codigo}: {g.nombre} ({g.icono}, {g.color})")
```

**Esperado**: Al menos 10 grupos del sistema.

---

### **Test 2: Crear Grupo Custom**
```python
grupo_custom = GrupoParteInteresada.objects.create(
    codigo='ALIADOS_ESTRATEGICOS',
    nombre='Aliados Estratégicos',
    descripcion='Partners y colaboradores clave',
    icono='Handshake',
    color='teal',
    orden=11,
    es_sistema=False
)

print(f"Grupo custom creado: {grupo_custom.nombre}")
```

**Esperado**: Grupo custom creado exitosamente, `es_sistema=False`.

---

### **Test 3: Crear Tipo con FK Grupo**
```python
from apps.gestion_estrategica.contexto.models import TipoParteInteresada

grupo_personal = GrupoParteInteresada.objects.get(codigo='PERSONAL')

tipo = TipoParteInteresada.objects.create(
    codigo='EMPLEADOS_DIRECTOS',
    nombre='Empleados Directos',
    grupo=grupo_personal,
    categoria='interno',
    descripcion='Personal contratado directamente',
    es_sistema=False
)

print(f"Tipo creado: {tipo.nombre} (Grupo: {tipo.grupo.nombre})")
```

**Esperado**: Tipo con FK `grupo` funcionando, campos read-only populados.

---

### **Test 4: Crear Parte Interesada con Campos Sprint 17**
```python
from apps.gestion_estrategica.contexto.models import ParteInteresada
from apps.core.models import EmpresaConfig

empresa = EmpresaConfig.objects.first()

parte = ParteInteresada.objects.create(
    nombre='Sindicato de Trabajadores',
    tipo=tipo,
    empresa=empresa,
    descripcion='Organización sindical',
    # Campos NUEVOS Sprint 17
    nivel_influencia_pi='alta',        # PI→Empresa (PODER)
    nivel_influencia_empresa='media',  # Empresa→PI
    nivel_interes='alto',
    temas_interes_pi='Salarios, condiciones laborales, beneficios',
    temas_interes_empresa='Productividad, clima laboral, retención',
    canal_principal='reunion'
)

print(f"Parte interesada creada: {parte.nombre}")
print(f"  - Grupo: {parte.tipo.grupo.nombre}")
print(f"  - Impacto PI→Empresa: {parte.get_nivel_influencia_pi_display()}")
print(f"  - Impacto Empresa→PI: {parte.get_nivel_influencia_empresa_display()}")
print(f"  - Cuadrante: {parte.cuadrante_matriz}")
```

**Esperado**:
- Campos bidireccionales funcionando
- `cuadrante_matriz` = 'gestionar_cerca' (alta influencia + alto interés)

---

### **Test 5: Generar Matriz de Comunicación**
```python
# Método del modelo
comunicacion, created = parte.generar_comunicacion_automatica()

print(f"Matriz creada: {created}")
print(f"  - Qué comunicar: {comunicacion.que_comunicar}")
print(f"  - Cuándo: {comunicacion.get_cuando_comunicar_display()}")
print(f"  - Cómo: {comunicacion.get_como_comunicar_display()}")
```

**Esperado**:
- Matriz creada con frecuencia basada en cuadrante:
  - `gestionar_cerca` → mensual
  - `mantener_satisfecho` → trimestral
  - `mantener_informado` → bimestral
  - `monitorear` → semestral

---

### **Test 6: Estadísticas por Grupo**
```python
from django.db.models import Count

stats = {
    'total': ParteInteresada.objects.count(),
    'por_grupo': dict(
        ParteInteresada.objects.values('tipo__grupo__nombre').annotate(
            total=Count('id')
        ).values_list('tipo__grupo__nombre', 'total')
    ),
    'por_influencia_pi': dict(
        ParteInteresada.objects.values('nivel_influencia_pi').annotate(
            total=Count('id')
        ).values_list('nivel_influencia_pi', 'total')
    ),
    'por_influencia_empresa': dict(
        ParteInteresada.objects.values('nivel_influencia_empresa').annotate(
            total=Count('id')
        ).values_list('nivel_influencia_empresa', 'total')
    ),
}

print(stats)
```

**Esperado**: Estadísticas incluyendo `por_grupo`, `por_influencia_pi`, `por_influencia_empresa`.

---

## 🌐 Testing API Endpoints (Postman/cURL)

### **Autenticación**
```bash
# Login
curl -X POST http://localhost:8000/api/tenant/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@empresa.com", "password": "contraseña"}'

# Guardar token
export TOKEN="<jwt_token>"
```

---

### **Test 1: GET /grupos-parte-interesada/**
```bash
curl -X GET "http://localhost:8000/api/gestion-estrategica/contexto/grupos-parte-interesada/" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**:
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "codigo": "PERSONAL",
      "nombre": "Personal",
      "icono": "Users",
      "color": "blue",
      "es_sistema": true,
      "orden": 1
    }
  ]
}
```

---

### **Test 2: POST /grupos-parte-interesada/ (Crear Custom)**
```bash
curl -X POST "http://localhost:8000/api/gestion-estrategica/contexto/grupos-parte-interesada/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "ALIADOS",
    "nombre": "Aliados Estratégicos",
    "descripcion": "Partners y colaboradores",
    "icono": "Handshake",
    "color": "teal",
    "es_sistema": false
  }'
```

**Esperado**: Status 201, grupo creado.

---

### **Test 3: GET /tipos-parte-interesada/?grupo=1**
```bash
curl -X GET "http://localhost:8000/api/gestion-estrategica/contexto/tipos-parte-interesada/?grupo=1" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: Lista de tipos filtrados por grupo PERSONAL.

---

### **Test 4: GET /partes-interesadas/export_excel/**
```bash
curl -X GET "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/export_excel/" \
  -H "Authorization: Bearer $TOKEN" \
  -o "Matriz_Test.xlsx"
```

**Esperado**:
- Archivo Excel descargado
- 4 hojas: Identificación, Caracterización, Modelos Relación, Matriz Consolidada
- Headers azules, datos correctos

---

### **Test 5: POST /partes-interesadas/import_excel/**
```bash
curl -X POST "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/import_excel/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@Matriz_Test.xlsx"
```

**Esperado**:
```json
{
  "message": "Importación completada: 5 creadas, 0 actualizadas",
  "created": 5,
  "updated": 0,
  "errors": [],
  "total_procesadas": 5,
  "total_errores": 0
}
```

---

### **Test 6: POST /partes-interesadas/generar_matriz_comunicacion/**
```bash
curl -X POST "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/generar_matriz_comunicacion/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parte_interesada_id": 1}'
```

**Esperado**:
```json
{
  "message": "Matriz de comunicación generada exitosamente",
  "created": true,
  "data": {
    "id": 1,
    "que_comunicar": "...",
    "cuando_comunicar": "mensual"
  }
}
```

---

### **Test 7: POST /partes-interesadas/generar_matriz_comunicacion_masiva/**
```bash
curl -X POST "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/generar_matriz_comunicacion_masiva/" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**:
```json
{
  "message": "Proceso completado: 10 creadas, 0 actualizadas",
  "created": 10,
  "updated": 0,
  "errors": [],
  "total_procesadas": 10,
  "total_errores": 0
}
```

---

### **Test 8: GET /partes-interesadas/estadisticas/**
```bash
curl -X GET "http://localhost:8000/api/gestion-estrategica/contexto/partes-interesadas/estadisticas/" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**:
```json
{
  "total": 15,
  "por_grupo": {
    "Personal": 5,
    "Clientes": 3,
    "Proveedores": 2
  },
  "por_influencia_pi": {
    "alta": 6,
    "media": 5,
    "baja": 4
  },
  "por_influencia_empresa": {
    "alta": 3,
    "media": 8,
    "baja": 4
  }
}
```

---

## ✅ Checklist de Verificación

### Backend
- [ ] Migración aplicada sin errores
- [ ] Seed ejecutado (10 grupos sistema)
- [ ] Modelo GrupoParteInteresada funciona
- [ ] Modelo TipoParteInteresada con FK grupo funciona
- [ ] Modelo ParteInteresada con campos Sprint 17 funciona
- [ ] Property `cuadrante_matriz` calculado correctamente
- [ ] Método `generar_comunicacion_automatica()` funciona
- [ ] Frecuencia basada en cuadrante es correcta

### API Endpoints
- [ ] GET /grupos-parte-interesada/ (lista 10 grupos)
- [ ] POST /grupos-parte-interesada/ (crear custom)
- [ ] GET /tipos-parte-interesada/?grupo=X (filtrar)
- [ ] GET /partes-interesadas/export_excel/ (descarga Excel)
- [ ] POST /partes-interesadas/import_excel/ (sube Excel)
- [ ] POST /generar_matriz_comunicacion/ (individual)
- [ ] POST /generar_matriz_comunicacion_masiva/ (bulk)
- [ ] GET /partes-interesadas/estadisticas/ (incluye por_grupo)

### Lógica de Negocio
- [ ] Cuadrante "gestionar_cerca" → frecuencia "mensual"
- [ ] Cuadrante "mantener_satisfecho" → frecuencia "trimestral"
- [ ] Cuadrante "mantener_informado" → frecuencia "bimestral"
- [ ] Cuadrante "monitorear" → frecuencia "semestral"
- [ ] Import Excel crea grupos/tipos on-demand
- [ ] Export Excel 4 hojas correctas
- [ ] Soft-delete en grupos sistema, hard-delete en custom

---

## 📝 Notas

**Script de testing**: `backend/test_sprint17_endpoints.py`

**Ejecución**:
```bash
cd backend
python test_sprint17_endpoints.py
```

**Postman Collection**: Importar y ejecutar todos los endpoints en orden.

**Resultado esperado**: Todos los tests en verde ✅

---

**Autor**: Sistema ERP StrateKaz
**Sprint**: 17 - Partes Interesadas V2
**Última actualización**: 2026-02-15
