# 🎨 Sprint 17 - Frontend Día 3: API Client + Hooks

**Fecha**: 2026-02-15
**Estado**: ✅ API Client y Hooks completados (70% Frontend)

---

## ✅ Completado - API Client

### **Archivo**: `frontend/src/features/gestion-estrategica/api/contextoApi.ts`

#### **1. Interfaces Actualizadas** (+100 líneas)

**GrupoParteInteresada** (NUEVO):
```typescript
export interface GrupoParteInteresada {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**TipoParteInteresada** (ACTUALIZADO):
```typescript
export interface TipoParteInteresada {
  // ... campos existentes
  // NUEVOS CAMPOS:
  grupo: number | null;
  grupo_nombre: string;
  grupo_codigo: string;
  grupo_icono: string;
  grupo_color: string;
  es_sistema: boolean;
}
```

**ParteInteresada** (ACTUALIZADO):
```typescript
export interface ParteInteresada {
  // ... campos existentes
  // NUEVOS CAMPOS - Jerarquía:
  grupo_nombre: string;
  grupo_codigo: string;
  grupo_icono: string;
  grupo_color: string;

  // RENOMBRADO:
  nivel_influencia_pi: 'alta' | 'media' | 'baja'; // antes: nivel_influencia
  nivel_influencia_pi_display: string;

  // NUEVO - Impacto bidireccional:
  nivel_influencia_empresa: 'alta' | 'media' | 'baja';
  nivel_influencia_empresa_display: string;

  // NUEVO - Temas bidireccionales:
  temas_interes_pi: string;
  temas_interes_empresa: string;

  // NUEVO - Responsables:
  responsable_empresa: number | null;
  responsable_empresa_nombre: string;
  cargo_responsable: number | null;
  cargo_responsable_nombre: string;
  area_responsable: number | null;
  area_responsable_nombre: string;
}
```

**Nuevas interfaces auxiliares**:
- `EstadisticasPartesInteresadas`
- `GenerarMatrizResponse`

#### **2. Nuevo API: gruposParteInteresadaApi** (+50 líneas)

```typescript
export const gruposParteInteresadaApi = {
  list: async (filters?) => // Listar grupos
  get: async (id) =>         // Obtener grupo
  create: async (data) =>    // Crear grupo custom
  update: async (id, data) =>// Actualizar grupo
  delete: async (id) =>      // Eliminar grupo (soft/hard según es_sistema)
}
```

#### **3. Actualizado API: tiposParteInteresadaApi**

**Cambio**: `list()` ahora acepta `filters: { grupo?, es_sistema?, is_active? }`

#### **4. Actualizado API: partesInteresadasApi** (+120 líneas)

**Métodos nuevos**:

```typescript
// Export Excel (4 hojas)
exportExcel: async (): Promise<Blob>

// Import Excel
importExcel: async (file: File): Promise<GenerarMatrizResponse>

// Generar matriz individual
generarMatrizComunicacion: async (parteInteresadaId: number): Promise<{...}>

// Generar matriz masiva
generarMatrizComunicacionMasiva: async (grupoId?: number): Promise<GenerarMatrizResponse>

// Estadísticas actualizada (ahora incluye por_grupo, por_influencia_empresa)
estadisticas: async (): Promise<EstadisticasPartesInteresadas>
```

---

## ✅ Completado - Hooks

### **Archivo**: `frontend/src/features/gestion-estrategica/hooks/usePartesInteresadas.ts`

#### **QUERY_KEYS actualizados**
```typescript
const QUERY_KEYS = {
  gruposParteInteresada: 'grupos-parte-interesada', // NUEVO
  tiposParteInteresada: 'tipos-parte-interesada',
  partesInteresadas: 'partes-interesadas',
  matrizPoderInteres: 'matriz-poder-interes',
  estadisticas: 'estadisticas-partes-interesadas',
};
```

#### **Hooks NUEVOS** (+200 líneas)

**1. Grupos de Partes Interesadas**:
```typescript
// Listar grupos
useGruposParteInteresada(filters?)
// Retorna: { data, totalCount, isLoading, error, refetch }

// Obtener grupo por ID
useGrupoParteInteresada(id)

// CRUD grupos
useGrupoParteInteresadaMutation()
// Retorna: { create, update, delete, isCreating, isUpdating, isDeleting }
```

**2. Import/Export Excel**:
```typescript
// Exportar a Excel
useExportPartesInteresadasExcel()
// Retorna: { exportar, isExporting }
// Auto-descarga el archivo al completar

// Importar desde Excel
useImportPartesInteresadasExcel()
// Retorna: { importar, isImporting, result }
// Auto-invalida queries al completar
```

**3. Generar Matriz de Comunicaciones**:
```typescript
// Individual
useGenerarMatrizComunicacion()
// Retorna: { generar, isGenerating }

// Masiva
useGenerarMatrizComunicacionMasiva()
// Retorna: { generar, isGenerating, result }
```

**Características de todos los hooks**:
- ✅ Toasts automáticos (success/error)
- ✅ Invalidación automática de queries relacionadas
- ✅ Loading states granulares
- ✅ Error handling

---

## 📊 Resumen Numérico Frontend (Día 3)

| Componente | Líneas Agregadas/Modificadas | Estado |
|------------|------------------------------|--------|
| **API Client** | +270 | ✅ 100% |
| **Hooks** | +200 | ✅ 100% |
| **UI Components** | 0/350 | ⏳ 0% |
| **TOTAL Frontend Día 3** | 470/820 | 🟡 57% |

---

## 🎯 Próximos Pasos - Día 4-5: UI Components

### **1. ParteInteresadaFormModal** (Día 4)

**Campos a agregar/actualizar**:
- ✅ Campo `tipo` (select) - Ya existe, ahora muestra grupo en read-only
- 🆕 Read-only badge mostrando `grupo_nombre` + `grupo_icono`
- 🆕 Sección "Impacto Bidireccional":
  - Campo `nivel_influencia_pi` (select: alta/media/baja) - Renombrado
  - Campo `nivel_influencia_empresa` (select: alta/media/baja) - NUEVO
- 🆕 Sección "Temas de Interés":
  - Campo `temas_interes_pi` (textarea) - Renombrado
  - Campo `temas_interes_empresa` (textarea) - NUEVO
- 🆕 Sección "Responsables en la Empresa":
  - Campo `responsable_empresa` (select Colaborador)
  - Campo `cargo_responsable` (select Cargo)
  - Campo `area_responsable` (select Área)

**Estimado**: ~100 líneas

---

### **2. StakeholdersSection** (Día 4-5)

**Funcionalidad a agregar**:
- 🆕 Toolbar con botones:
  - **Importar Excel** (file upload)
  - **Exportar Excel** (download)
  - **Generar Matriz Comunicaciones** (bulk action)
- 🆕 Filtro por grupo (select con los 10 grupos pre-seeded)
- 🆕 StatsGrid actualizado:
  - Total partes interesadas
  - Por grupo (top 3)
  - Por impacto PI→Empresa (alta/media/baja)
  - Por impacto Empresa→PI (alta/media/baja)
- 🆕 Tabla con columnas nuevas:
  - Grupo (badge con color + icono)
  - Responsable en la empresa
  - Impacto bidireccional (iconos)

**Estimado**: ~150 líneas

---

### **3. GrupoParteInteresadaManager** (Día 5)

**Modal CRUD para grupos custom**:
- Tabla con grupos custom (es_sistema=false)
- Botón "Agregar Grupo Custom"
- Modal con form:
  - Código (auto-generado en mayúsculas)
  - Nombre
  - Descripción
  - Icono (select de Lucide icons)
  - Color (select de colores semánticos)
- Acciones: Editar, Eliminar (solo custom)

**Estimado**: ~100 líneas

---

## 📝 Checklist Frontend

### API Client ✅
- [x] Interface GrupoParteInteresada
- [x] Interface TipoParteInteresada (actualizada)
- [x] Interface ParteInteresada (actualizada)
- [x] Interface EstadisticasPartesInteresadas
- [x] Interface GenerarMatrizResponse
- [x] gruposParteInteresadaApi (CRUD)
- [x] tiposParteInteresadaApi.list (filtros grupo)
- [x] partesInteresadasApi.exportExcel
- [x] partesInteresadasApi.importExcel
- [x] partesInteresadasApi.generarMatrizComunicacion
- [x] partesInteresadasApi.generarMatrizComunicacionMasiva
- [x] partesInteresadasApi.estadisticas (actualizada)

### Hooks ✅
- [x] useGruposParteInteresada
- [x] useGrupoParteInteresada
- [x] useGrupoParteInteresadaMutation
- [x] useExportPartesInteresadasExcel
- [x] useImportPartesInteresadasExcel
- [x] useGenerarMatrizComunicacion
- [x] useGenerarMatrizComunicacionMasiva

### UI Components ⏳
- [ ] ParteInteresadaFormModal (campos nuevos)
- [ ] StakeholdersSection (toolbar + filtros + stats)
- [ ] GrupoParteInteresadaManager (CRUD grupos custom)

---

## 🔥 Patrón Factory (Sprint 17 decision)

**Decisión**: Refactor a factory pattern **DESPUÉS** de completar Sprint 17.

**Razón**:
- Sprint 17 ya es extenso (backend + frontend + testing)
- Hooks actuales funcionan correctamente
- Factory es una optimización, no un blocker
- Mejor hacerlo en Sprint 18 dedicado a refactoring

**Plan futuro**:
- Sprint 18: Refactor todos los módulos de GE a factory pattern
- Migrar: Contexto, Planeación, Identidad, Comunicaciones
- Beneficio: ~40% reducción de código, mejor mantenibilidad

---

**Autor**: Sistema ERP StrateKaz
**Sprint**: 17 - Partes Interesadas V2
**Última actualización**: 2026-02-15 (Fin Día 3 - API Client + Hooks completados)
