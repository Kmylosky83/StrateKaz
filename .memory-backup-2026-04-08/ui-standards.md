---
name: ui-standards
description: Estructura obligatoria de vistas de módulo — PageHeader, DynamicSections, secciones, componentes DS, reglas de color
type: feedback
---

# Estándar UI de Vistas — StrateKaz SGI

## Estructura de Página de Módulo (patrón canónico)

Toda página de módulo sigue esta estructura vertical:

```
┌──────────────────────────────────────────────────────────┐
│  PageHeader                                              │
│    title="Gestión Documental"                            │
│    description={activeSectionData.description}           │
├──────────────────────────────────────────────────────────┤
│  DynamicSections                                         │
│    variant="underline"                                   │
│    moduleColor={moduleColor}    ← useModuleColor()       │
│    sections={sections}          ← usePageSections()      │
│    activeSection / onChange                               │
├──────────────────────────────────────────────────────────┤
│  {activeSection &&                                       │
│    <ModuloTab                                            │
│      activeSection={activeSection}                       │
│      onCreateX / onEditX / onViewX / onFirmar / ...     │
│    />                                                    │
│  }                                                       │
├──────────────────────────────────────────────────────────┤
│  Modales globales (flotan fuera del tab):                │
│    FormModal, DetailModal, SignatureModal, ConfirmDialog  │
└──────────────────────────────────────────────────────────┘
```

**Ejemplo real (GestionDocumentalPage.tsx):**
```tsx
const { sections, activeSection, setActiveSection, activeSectionData } =
  usePageSections({ moduleCode: 'gestion_documental', tabCode: 'gestion_documental' });
const { color: moduleColor } = useModuleColor('gestion_documental');

return (
  <div className="space-y-4">
    <PageHeader title="Gestión Documental" description={activeSectionData.description} />
    <DynamicSections sections={sections} activeSection={activeSection}
      onChange={setActiveSection} variant="underline" moduleColor={moduleColor} />
    {activeSection && <GestionDocumentalTab activeSection={activeSection} ... />}
    {/* Modales globales aquí */}
  </div>
);
```

## Tab Router (patrón switch)

El componente Tab recibe `activeSection` y renderiza la sección correcta:

```tsx
// GestionDocumentalTab.tsx
switch (normalizedSection) {
  case 'dashboard':     return <DashboardDocumentalSection ... />;
  case 'repositorio':   return <RepositorioSection ... />;
  case 'en_proceso':    return <EnProcesoSection ... />;
  case 'archivo':       return <ArchivoSection ... />;
  case 'configuracion': return <TiposPlantillasSection ... />;
  default:              return <GenericSectionFallback ... />;
}
```

**Retrocompatibilidad:** `normalizeSection()` mapea códigos legacy → nuevos (para notificaciones/bookmarks existentes).

## 3 Tipos de Sección (dentro de un tab)

### Tipo A — Vista CRUD (repositorio, configuración)
```
┌─ StatsGrid (moduleColor, variant="compact", columns=4)
├─ [Opcional] Panel especial (CoberturaPanel)
├─ Filtros (Input+Select en grid sm:grid-cols-3)
├─ Toolbar (ViewToggle + botones Ingestar/Crear + ExportButton)
├─ Lista (cards o list según ViewToggle)
└─ Modales al fondo (FormModal, ConfirmDialog, IngestarModal)
```

### Tipo B — Vista workflow (en_proceso)
```
┌─ PageTabs internas (variant="underline", moduleColor)
│   sub-tabs: Firmas Pendientes | Borradores | En Revisión
├─ Lista filtrada por estado
│   Card con: título, código, estado badge, días pendiente
│   Botones: Ver, Editar, Firmar/Rechazar
└─ Sin StatsGrid (las métricas van en Dashboard)
```

### Tipo C — Vista dashboard (dashboard)
```
┌─ StatsGrid (6 métricas: total, vigentes, borradores, revisión, score, cobertura)
├─ Urgentes (firmas mi turno, revisiones vencidas)
├─ Score de cumplimiento global
├─ CoberturaPanel
└─ Accesos rápidos ("Ir a Repositorio", "Ver firmas pendientes")
```

## Componentes DS Obligatorios

| Componente | Import | Cuándo usar |
|-----------|--------|------------|
| `PageHeader` | `@/components/layout` | Siempre, primer elemento de la página |
| `DynamicSections` | `@/components/common` | Siempre, tabs de secciones (variant="underline") |
| `usePageSections()` | `@/hooks/usePageSections` | Obtener secciones desde BD |
| `useModuleColor()` | `@/hooks/useModuleColor` | Color dinámico del módulo |
| `StatsGrid` | `@/components/layout/StatsGrid` | Métricas con moduleColor |
| `PageTabs` | `@/components/layout` | Sub-tabs DENTRO de una sección |
| `ViewToggle` | `@/components/common` | Alternar cards/list |
| `BaseModal` | `@/components/modals/BaseModal` | Todo modal (sizes: xs→full) |
| `ConfirmDialog` | `@/components/common` | Toda acción destructiva |
| `EmptyState` | `@/components/common` | Listas vacías con ícono + acción |
| `Badge` | `@/components/common` | Estados (variant: success/warning/danger/info) |
| `ProtectedAction` | `@/components/common` | Envolver acciones que requieren permiso RBAC |
| `ExportButton` | `@/components/common` | Export CSV/Excel/PDF |

## Reglas Sin Excepciones

| Elemento | Correcto | Incorrecto |
|----------|----------|------------|
| Color módulo | `useModuleColor('code')` | Hex hardcodeado |
| Tabs página | `DynamicSections variant="underline"` | Tabs custom |
| Sub-tabs sección | `PageTabs variant="underline" moduleColor={mc}` | Tabs con pills hardcodeadas |
| Headers sección | `SectionToolbar` o div con título+acciones | `<h3>` suelto |
| Confirmación | `ConfirmDialog variant="danger"` | `window.confirm()` |
| Modales | `BaseModal` con `footer` prop | Modal custom o legacy |
| Formularios | `react-hook-form` + `Zod` | `FormData` o useState manual |
| Permisos UI | `<ProtectedAction permission="mod.sec.action">` | `{canDo && <Button>}` |
| Colores estado | `Badge variant="success"` | `className="bg-green-100"` |
| Branding | `bg-primary-600` (CSS var dinámico) | `bg-pink-600` (hardcodeado) |

## Flujo de Colores (3 capas)

```
CAPA 1 — Branding tenant (CSS vars dinámicas)
  bg-primary-600, text-primary-700, border-primary-300
  → Vienen de useBrandingConfig() → useDynamicTheme() → --color-primary-*

CAPA 2 — Color módulo (prop moduleColor)
  StatsGrid moduleColor="indigo"
  PageTabs moduleColor="indigo"
  ViewToggle moduleColor="blue"
  → Viene de useModuleColor('gestion_documental') → 'indigo'

CAPA 3 — Estados fijos (Tailwind estáticos, NO cambian por tenant)
  success=verde, warning=amarillo, danger=rojo, info=azul, gray=neutro
  → Se usan SOLO en Badge variant, NO en layouts
```

## Modales — Patrón

Los modales viven en la **página** (no en la sección), para que cualquier tab pueda abrirlos:

```tsx
// EN LA PÁGINA (GestionDocumentalPage.tsx):
const [documentoFormModal, setDocumentoFormModal] = useState({ isOpen: false, documentoId: undefined });

// SE PASAN COMO CALLBACKS AL TAB:
<GestionDocumentalTab
  onCreateDocumento={() => setDocumentoFormModal({ isOpen: true })}
  onEditDocumento={(id) => setDocumentoFormModal({ isOpen: true, documentoId: id })}
  onViewDocumento={(id) => setDocumentoDetailModal({ isOpen: true, documentoId: id })}
  onFirmar={handleFirmar}
/>

// Y SE RENDERIZAN FUERA DEL TAB:
<DocumentoFormModal isOpen={...} onClose={...} documentoId={...} />
<DocumentoDetailModal isOpen={...} onClose={...} documentoId={...} />
<SignatureModal isOpen={...} onClose={...} onSave={handleSignatureSave} />
```

## Navegación

- **Sidebar** = módulos (Fundación, Gestión Documental, Mi Equipo…)
- **DynamicSections** = secciones dentro del módulo (Dashboard, Repositorio, En Proceso…)
- **PageTabs** = sub-tabs dentro de una sección (solo si la sección tiene sub-contenido)
- **NUNCA** duplicar sidebar con tabs, ni DynamicSections con PageTabs del mismo nivel
