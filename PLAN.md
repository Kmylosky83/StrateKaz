# Sprint 7: Mass Export + Public Forms - Plan de Implementacion

## Estado Actual
- **ExportMixin** en `core/mixins.py`: stub que retorna 501, NINGUN ViewSet lo usa
- **openpyxl** ya en `requirements/base.txt` (>=3.1,<3.2) - listo para Excel
- **jsPDF** ya instalado en frontend (usado por exportActaPDF.ts)
- **Encuestas DOFA**: Backend 100% completo (4 modelos, 15+ endpoints, acceso publico)
- **Frontend encuestas**: EncuestasDofaSection + EncuestaFormModal funcionales
- **Pagina publica de encuestas**: NO EXISTE en frontend (backend si tiene endpoint)
- **DynamicFormRenderer**: Ya existe con 12 tipos de campo

## Problema: Exportacion es stub y no hay pagina publica
1. ExportMixin retorna JSON con "pendiente de implementar" - no genera archivos reales
2. Ningun modulo tiene boton de exportar CSV/Excel funcional
3. La encuesta publica genera `enlace_publico` pero no hay pagina frontend para responder
4. Falta componente reutilizable de exportacion

## Solucion

---

## FASE 1: Backend - ExportService generico (~200 lineas)

### 1.1 Implementar ExportMixin real
**Modificar:** `backend/apps/core/mixins.py`

Reemplazar el stub con implementacion real:
- `format=csv`: Genera archivo CSV con csv.writer (stdlib, sin dependencias)
- `format=excel`: Genera archivo .xlsx con openpyxl (ya en requirements)
- Usar `export_fields` del ViewSet para determinar columnas
- Si `export_fields` vacio, usar todos los campos del serializer
- Content-Disposition header para descarga directa
- Limite de 10,000 filas para evitar OOM

### 1.2 Crear ExportService (helper centralizado)
**Archivo nuevo:** `backend/apps/core/services/export_service.py`

```python
class ExportService:
    @classmethod
    def to_csv(cls, queryset, fields, filename) -> HttpResponse

    @classmethod
    def to_excel(cls, queryset, fields, filename, sheet_name='Datos') -> HttpResponse

    @classmethod
    def get_export_fields(cls, serializer_class, custom_fields=None) -> list[dict]
```

### 1.3 Agregar ExportMixin a ViewSets clave
**Modificar** (solo agregar mixin a la clase, no cambiar logica):
- `DocumentoViewSet` (gestion_documental) - export_fields: codigo, titulo, estado, version, fecha_vigencia
- `TipoDocumentoViewSet` (gestion_documental) - export_fields: codigo, nombre, nivel_documento
- `AccidenteTrabajoViewSet` (accidentalidad) - export_fields: fecha, tipo, severidad, area
- `NoConformidadViewSet` (calidad) - export_fields: codigo, tipo, estado, responsable
- `IndicadorAreaViewSet` (indicadores_area) - export_fields: nombre, valor_actual, meta, cumplimiento

---

## FASE 2: Frontend - ExportButton + EncuestaPublicaPage (~600 lineas)

### 2.1 ExportButton component (~80 lineas)
**Archivo nuevo:** `frontend/src/components/common/ExportButton.tsx`

Boton dropdown reutilizable:
- Props: endpoint (string), filename (string), disabled?, formats? (csv|excel)
- Dropdown con opciones: "Exportar CSV", "Exportar Excel"
- Descarga via fetch + blob + URL.createObjectURL
- Estado de carga (spinner en el boton)
- Exportado desde common/index.ts

### 2.2 EncuestaPublicaPage (~350 lineas)
**Archivo nuevo:** `frontend/src/features/gestion-estrategica/pages/EncuestaPublicaPage.tsx`

Pagina publica (SIN autenticacion) para responder encuestas DOFA:
- Ruta: `/encuestas/responder/:token`
- Layout minimalista (sin sidebar/header)
- Usa useEncuestaPublica(token) para cargar datos
- Muestra titulo, descripcion, fecha_cierre
- Para cada tema: Card con titulo + descripcion + radio (Fortaleza/Debilidad)
- Si requiere_justificacion: textarea para cada respuesta
- Selector de impacto_percibido (alto/medio/bajo)
- Boton "Enviar Respuestas" -> useResponderEncuestaPublica
- Pantalla de exito post-envio
- Manejo de errores: encuesta cerrada, ya respondio, no vigente

### 2.3 Ruta publica en router
**Modificar:** `frontend/src/routes/index.tsx`
- Agregar ruta `/encuestas/responder/:token` FUERA de ProtectedRoute
- Usar React.lazy() para code splitting

---

## FASE 3: Integrar exportacion en paginas existentes (~150 lineas)

### 3.1 SistemaDocumentalPage
**Modificar:** `frontend/src/features/hseq/pages/SistemaDocumentalPage.tsx`
- Tab Listado Maestro: Agregar ExportButton con endpoint documentos/export/
- Tab Tipos: Agregar ExportButton con endpoint tipos-documento/export/

### 3.2 CalidadPage
**Modificar:** `frontend/src/features/hseq/pages/CalidadPage.tsx`
- Seccion No Conformidades: Agregar ExportButton

### 3.3 AccidentalidadPage
**Modificar:** `frontend/src/features/hseq/pages/AccidentalidadPage.tsx`
- Seccion Accidentes: Agregar ExportButton

---

## Resumen de Entregables

| # | Archivo | Tipo | Lineas Est. |
|---|---------|------|-------------|
| 1 | `core/mixins.py` | Modificar | ~60 (reemplazar stub) |
| 2 | `core/services/export_service.py` | Nuevo | ~140 |
| 3 | `gestion_documental/views.py` | Modificar | +1 (add mixin) |
| 4 | `accidentalidad/views.py` | Modificar | +1 (add mixin) |
| 5 | `calidad/views.py` | Modificar | +1 (add mixin) |
| 6 | `indicadores_area/views.py` | Modificar | +1 (add mixin) |
| 7 | `ExportButton.tsx` | Nuevo | ~80 |
| 8 | `EncuestaPublicaPage.tsx` | Nuevo | ~350 |
| 9 | `routes/index.tsx` | Modificar | +5 |
| 10 | `SistemaDocumentalPage.tsx` | Modificar | +10 |
| 11 | `CalidadPage.tsx` | Modificar | +5 |
| 12 | `AccidentalidadPage.tsx` | Modificar | +5 |
| **TOTAL** | | **3 nuevos, 9 modificados** | **~660** |

## Verificacion
1. `npx tsc --noEmit --pretty` - Zero errores TypeScript
2. `python -m py_compile` - Syntax OK para archivos Python
3. Vite build exitoso
4. ExportMixin genera CSV/Excel reales (no stub)
5. Pagina publica de encuestas accesible sin login
