# Guía de Pruebas - Sesión 2026-01-11

## Servidores de Desarrollo

| Servicio | URL | Estado |
|----------|-----|--------|
| **Backend (Django)** | http://localhost:8000 | Running |
| **Frontend (Vite)** | http://localhost:3010 | Running |

---

## Nuevos Endpoints Implementados

### 1. Configuracion Dinamica de Identidad

Reemplaza los CHOICES hardcodeados por configuracion desde BD.

```bash
# Obtener toda la configuracion (requiere autenticacion)
GET http://localhost:8000/api/identidad/config/all/

# Estados de politica
GET http://localhost:8000/api/identidad/config/estados-politica/
GET http://localhost:8000/api/identidad/config/estados-politica/choices/
GET http://localhost:8000/api/identidad/config/estados-politica/initial/

# Tipos de politica
GET http://localhost:8000/api/identidad/config/tipos-politica/
GET http://localhost:8000/api/identidad/config/tipos-politica/options/

# Roles de firmante
GET http://localhost:8000/api/identidad/config/roles-firmante/
GET http://localhost:8000/api/identidad/config/roles-firmante/choices/

# Estados de firma
GET http://localhost:8000/api/identidad/config/estados-firma/
GET http://localhost:8000/api/identidad/config/estados-firma/choices/
```

### 2. Integracion Gestor Documental

Envio automatico de politicas firmadas al Gestor Documental.

```bash
# Enviar politica firmada (automatico)
POST http://localhost:8000/api/identidad/politicas-especificas/{id}/enviar-a-documental/
Content-Type: application/json

{
  "clasificacion": "INTERNO",  # PUBLICO | INTERNO | CONFIDENCIAL | RESTRINGIDO
  "areas_aplicacion": [1, 2],  # IDs de áreas
  "observaciones": "Aprobada por comité"
}

# Respuesta esperada:
{
  "detail": "Política enviada, codificada y publicada exitosamente",
  "politica": {
    "id": 1,
    "status": "VIGENTE",
    "code": "POL-SST-001",
    "effective_date": "2026-01-11"
  },
  "documento": {
    "id": 123,
    "codigo": "POL-SST-001",
    "estado": "PUBLICADO",
    "version": "1.0",
    "fecha_publicacion": "2026-01-11",
    "url": "/api/hseq/documentos/123/"
  }
}
```

### 3. Valores Vividos en Dashboard BI

Widgets de Valores Vividos integrados con Analytics.

```bash
# Resumen completo
GET http://localhost:8000/api/analytics/dashboard/vistas/valores-vividos/

# Widget específico - KPI de Índice
GET http://localhost:8000/api/analytics/dashboard/vistas/valores-vividos/widget/?tipo=kpi_indice

# Widget de tendencia mensual
GET http://localhost:8000/api/analytics/dashboard/vistas/valores-vividos/widget/?tipo=chart_tendencia&meses=6

# Top valores más vividos
GET http://localhost:8000/api/analytics/dashboard/vistas/valores-vividos/widget/?tipo=list_top&limite=5&dias=30

# Alertas de valores subrepresentados
GET http://localhost:8000/api/analytics/dashboard/vistas/valores-vividos/widget/?tipo=alert_subrepresentados&umbral=3
```

---

## Rutas Frontend Activadas

### Nivel 2: Cumplimiento (nuevas)

| Ruta | Descripción |
|------|-------------|
| `/cumplimiento` | Motor de Cumplimiento |
| `/cumplimiento/matriz-legal` | Matriz Legal |
| `/cumplimiento/requisitos-legales` | Requisitos Legales |
| `/cumplimiento/partes-interesadas` | Partes Interesadas |
| `/cumplimiento/reglamentos-internos` | Reglamentos Internos |

### Nivel 4: Cadena de Valor (nuevas)

| Ruta | Descripción |
|------|-------------|
| `/produccion` | Operaciones de Producción |
| `/logistica` | Logística y Flota |

### Sistema Documental (ya existente)

| Ruta | Descripción |
|------|-------------|
| `/hseq/sistema-documental` | Gestor Documental completo |

---

## Pruebas Recomendadas

### 1. Verificar Configuracion Dinamica

```bash
# Con curl o Postman
curl -X GET http://localhost:8000/api/identidad/config/all/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Debe retornar:
- `estados_politica`: 5 estados (BORRADOR, EN_REVISION, FIRMADO, VIGENTE, OBSOLETO)
- `tipos_politica`: 7 tipos (INTEGRAL, SST, CALIDAD, etc.)
- `roles_firmante`: 6 roles
- `estados_firma`: 6 estados

### 2. Probar Flujo Completo de Políticas

1. **Crear política** (BORRADOR)
2. **Iniciar firma** → cambia a EN_REVISION
3. **Completar firmas** → proceso COMPLETADO
4. **Enviar a Documental** → cambia a VIGENTE + código asignado

### 3. Verificar Widget de Valores Vividos

```bash
curl -X GET "http://localhost:8000/api/analytics/dashboard/vistas/valores-vividos/widget/?tipo=kpi_indice" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Debe retornar:
```json
{
  "valor": 75.5,
  "tendencia": "up",
  "variacion": 12.3,
  "color": "green",
  "descripcion": "15 acciones vinculadas este mes"
}
```

---

## Comando para Poblar Configuración

Si los endpoints de configuración retornan vacío, ejecutar:

```bash
cd C:/Proyectos/StrateKaz/backend
./venv/Scripts/python.exe manage.py seed_config_identidad
```

---

## Archivos Modificados en Esta Sesión

### Backend

| Archivo | Cambio |
|---------|--------|
| `identidad/services.py` | **NUEVO** - GestorDocumentalService |
| `identidad/models_config.py` | **NUEVO** - Modelos de configuración dinámica |
| `identidad/serializers_config.py` | **NUEVO** - Serializers de config |
| `identidad/views_config.py` | **NUEVO** - ViewSets de config |
| `identidad/views.py` | **MODIFICADO** - Integración automática con Documental |
| `identidad/urls.py` | **MODIFICADO** - Rutas de /config/ |
| `analytics/dashboard_gerencial/widgets_valores_vividos.py` | **NUEVO** - Widgets BI |
| `analytics/dashboard_gerencial/views.py` | **MODIFICADO** - Endpoints valores vividos |
| `identidad/management/commands/seed_config_identidad.py` | **NUEVO** - Seed de config |

### Frontend

| Archivo | Cambio |
|---------|--------|
| `routes/index.tsx` | **MODIFICADO** - Activadas rutas de modulos |
| `politicas/PoliciesList.tsx` | **MODIFICADO** - Consolidado STATUS_CONFIG |
| `politicas/PolicyStatusBadge.tsx` | **MODIFICADO** - Anadido estado FIRMADO |
| `hooks/usePoliticas.ts` | **MODIFICADO** - Hooks para config dinamica |
| `hooks/index.ts` | **MODIFICADO** - Exports organizados por seccion |

---

## Nuevos Hooks de Configuracion Dinamica

El hook `usePoliticas.ts` ahora incluye hooks para obtener configuracion desde el backend:

```typescript
// Obtiene toda la config en una llamada
const { data: config } = useIdentidadConfig();

// Hooks individuales
const { data: tipos } = useTiposPolitica();      // Tipos de politica
const { data: estados } = useEstadosPolitica();  // Estados de politica
const { data: roles } = useRolesFirmante();      // Roles de firmante
const { data: estadosFirma } = useEstadosFirma(); // Estados de firma
```

## Estado Actual

- [x] Migraciones ejecutadas (0009_dynamic_config_models)
- [x] Seed ejecutado (5 estados, 7 tipos, 6 roles, 6 estados_firma)
- [x] Backend corriendo en puerto 8000
- [x] Frontend corriendo en puerto 3010
- [x] Hooks actualizados para usar config dinamica

## Proximos Pasos

1. **Probar flujo completo** de politicas con Gestor Documental
2. **Verificar widgets** de Valores Vividos en dashboard
3. **Probar UI de Politicas** con la nueva configuracion dinamica

---

*Generado: 2026-01-11*
*Sesion: Refactorizacion Identidad Corporativa - Fases 1-6*
