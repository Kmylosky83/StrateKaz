# AUDITORÍA COMPLETA - SECCIÓN BRANDING (Frontend)

**Fecha**: 2026-01-18
**Sistema**: StrateKaz - Sistema Integrado de Gestión
**Módulo**: Gestión Estratégica > Configuración > Branding
**Versión**: 2.0.0

---

## RESUMEN EJECUTIVO

La sección de **Branding** del módulo de Configuración está implementada con arquitectura moderna y siguiendo las mejores prácticas del Design System de StrateKaz. El componente permite configurar la identidad visual completa del sistema de forma dinámica, incluyendo logos, colores, favicon y características PWA.

### ✅ Fortalezas Identificadas

1. **RBAC Granular Implementado**: Control de permisos por acción (view, edit) usando `canDo` y `Sections.BRANDING`
2. **React Query Optimizado**: Hooks con caché inteligente y invalidación correcta
3. **Design System**: Uso consistente de componentes reutilizables
4. **Tipado TypeScript Completo**: Sin uso de `any`, tipos bien definidos
5. **PWA Ready**: Configuración de Vite PWA con manifest dinámico
6. **Subida de Archivos Robusta**: Manejo de FormData con soporte para limpiar archivos

### ⚠️ Oportunidades de Mejora

1. **PWA Manifest Estático**: El manifest.json NO se genera dinámicamente desde branding
2. **Falta Hook de Permisos Granulares**: No existe `useGranularPermissions` específico para branding
3. **Sin Validación de Colores**: No valida formato HEX en el formulario
4. **Actualización de Favicon**: Requiere recarga de página para ver cambios

---

## 1. COMPONENTE BrandingSection

### 📍 Ubicación
```
frontend/src/features/gestion-estrategica/components/ConfiguracionTab.tsx
Líneas: 132-294
```

### 📋 Estructura del Componente

```typescript
const BrandingSection = () => {
  const { canDo } = usePermissions();
  const { data: branding, isLoading } = useActiveBranding();
  const [showModal, setShowModal] = useState(false);

  // ... renderizado
};
```

### 🎨 Campos Mostrados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `company_name` | string | Nombre completo de la empresa |
| `company_short_name` | string | Nombre corto para documentos |
| `company_slogan` | string (opcional) | Eslogan empresarial |
| `primary_color` | HEX color | Color primario (#ec268f) |
| `secondary_color` | HEX color | Color secundario (#000000) |
| `accent_color` | HEX color | Color de acento (#f4ec25) |
| `logo` | image URL | Logo principal (fondo claro) |
| `logo_white` | image URL | Logo blanco (fondo oscuro) |
| `favicon` | image URL | Icono del navegador (32x32) |
| `login_background` | image URL | Fondo de página de login |

### 🎯 Integración con Design System

**Componentes Utilizados:**
- ✅ `Card` - Contenedor principal
- ✅ `Badge` - Estados y etiquetas
- ✅ `Button` - Acciones (variant="secondary", size="sm")
- ✅ `Alert` - Mensajes informativos (no usado en esta sección)

**Estados de Carga:**
- ✅ Loading skeleton con animación pulse
- ✅ Grid responsive (md:grid-cols-2)
- ✅ Dark mode support completo

### 📊 Renderizado Condicional

```typescript
// Muestra logos solo si existen
{(branding?.logo || branding?.logo_white || branding?.favicon) && (
  <div className="md:col-span-2">
    {/* Grid de logos */}
  </div>
)}
```

### 🎨 Preview de Colores

El componente muestra una vista previa visual de los 3 colores con:
- Cuadrados de color con estilos dinámicos
- Código HEX en fuente monoespaciada
- Etiquetas descriptivas
- Fallback a gray-300 si no hay color configurado

---

## 2. MODAL DE EDICIÓN - BrandingFormModal

### 📍 Ubicación
```
frontend/src/features/gestion-estrategica/components/modals/BrandingFormModal.tsx
Líneas: 1-578 (archivo completo)
```

### 📋 Props del Modal

```typescript
interface BrandingFormModalProps {
  branding: BrandingConfig | null;
  isOpen: boolean;
  onClose: () => void;
}
```

### 🔧 Campos del Formulario

#### **1. Información de la Empresa** (Líneas 353-385)

```typescript
- company_name: Input (requerido)
- company_short_name: Input (requerido)
- company_slogan: Input (opcional)
```

#### **2. Logos e Imágenes** (Líneas 387-443)

Componente personalizado `ImageUpload` con:

```typescript
- logo: File upload (PNG, JPG, SVG)
- logo_white: File upload (PNG, SVG) - preview en fondo oscuro
- favicon: File upload (PNG, ICO) - 32x32 o 64x64
- login_background: File upload (PNG, JPG, WEBP) - 1920x1080
```

**Características del ImageUpload:**
- ✅ Preview instantáneo con `URL.createObjectURL`
- ✅ Botón "X" para eliminar
- ✅ Soporte para marcar archivos como "a eliminar" del servidor
- ✅ Estados `isCleared` y `onClear` callback
- ✅ Hints descriptivos para cada tipo de imagen

#### **3. Paleta de Colores** (Líneas 445-540)

```typescript
- primary_color: Color picker + Input HEX
- secondary_color: Color picker + Input HEX
- accent_color: Color picker + Input HEX
```

**Vista Previa Dinámica:**
- Grid con 3 columnas
- Cuadrados de color con altura fija (h-12)
- Actualización en tiempo real al cambiar colores

#### **4. Configuración del Sistema** (Líneas 542-558)

```typescript
- app_version: Input (ej: "2.0.0")
- is_active: Switch (solo en modo edición)
```

### 🔐 Validaciones

```typescript
// Campos requeridos
disabled={isLoading || !formData.company_name || !formData.company_short_name}
```

**⚠️ FALTA:**
- Validación de formato HEX para colores
- Validación de tamaño de archivos (máx. 2MB recomendado)
- Validación de dimensiones de imágenes
- Validación de formatos de archivo permitidos

### 📤 Manejo de Subida de Archivos

```typescript
// Líneas 236-285: Construcción de FormData
const formDataToSend = new FormData();

// Campos de texto
formDataToSend.append('company_name', formData.company_name);
formDataToSend.append('company_short_name', formData.company_short_name);

// Archivos nuevos
if (logoFile) {
  formDataToSend.append('logo', logoFile);
}

// Campos a limpiar (eliminar del servidor)
if (clearLogo && !logoFile) {
  formDataToSend.append('logo_clear', 'true');
}
```

**Lógica Inteligente:**
- ✅ Si hay cambios de archivos → usa FormData
- ✅ Si solo cambios de texto → usa JSON (más eficiente)
- ✅ Diferencia entre "nuevo archivo" y "eliminar archivo existente"
- ✅ Si se sube archivo nuevo, NO se marca como cleared

### 🎭 Mutations

```typescript
const createMutation = useCreateBranding();
const updateMutation = useUpdateBranding();

// Línea 286-319: Lógica de submit
if (isEditing && branding && branding.id) {
  if (!hasFileChanges) {
    await updateMutation.mutateAsync({ id: branding.id, data: updateData });
  } else {
    await updateMutation.mutateAsync({ id: branding.id, data: formDataToSend });
  }
} else {
  // Crear nuevo
  await createMutation.mutateAsync(createData);
}
```

---

## 3. RBAC - CONTROL GRANULAR

### 📍 Implementación Actual

#### **En BrandingSection** (ConfiguracionTab.tsx - Línea 159)

```typescript
const { canDo } = usePermissions();

// Control de visibilidad del botón Editar
{canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'edit') && (
  <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
    <Edit className="h-4 w-4 mr-2" />
    Editar
  </Button>
)}
```

### 🔑 Permisos Validados

| Acción | Código de Permiso | Uso |
|--------|-------------------|-----|
| **View** | `gestion_estrategica.branding.view` | ❌ **NO SE VALIDA** - La sección siempre es visible |
| **Edit** | `gestion_estrategica.branding.edit` | ✅ Controla botón "Editar" |
| **Create** | `gestion_estrategica.branding.create` | ❌ NO USADO (create/edit usan mismo modal) |
| **Delete** | `gestion_estrategica.branding.delete` | ❌ NO USADO (no hay funcionalidad delete en UI) |

### 📊 Secciones en permissions.ts

```typescript
// frontend/src/constants/permissions.ts - Línea 54
export const Sections = {
  // ...
  BRANDING: 'branding',  // ✅ DEFINIDO
  MODULOS: 'modulos',
  // ...
}
```

### 🎯 Hook usePermissions

**Archivo:** `frontend/src/hooks/usePermissions.ts`

#### Método Principal: `canDo`

```typescript
// Línea 181-187
const canDo = useCallback(
  (modulo: string, seccion: string, accion: 'view' | 'create' | 'edit' | 'delete' | string): boolean => {
    const code = `${modulo}.${seccion}.${accion}`;
    return hasPermission(code);
  },
  [hasPermission]
);
```

#### Contexto del Usuario (authStore)

```typescript
// Línea 105-128
const user = useAuthStore((state) => state.user);
const isSuperAdmin = user?.is_superuser ?? false;
const cargoCode = user?.cargo_code ?? null;
const cargoLevel = user?.cargo_level ?? null;
const sectionIds = user?.section_ids ?? null;
const permissionCodes = user?.permission_codes ?? null;
```

**Fuente de Permisos:**
- ✅ `permission_codes`: Array de strings del backend (ej: `["gestion_estrategica.branding.edit"]`)
- ✅ Superadmin siempre retorna `true` para cualquier permiso
- ✅ Si `permission_codes` incluye `'*'` → acceso total

### ⚠️ BRECHAS IDENTIFICADAS

#### 1. **NO existe validación de permiso VIEW**

```typescript
// ❌ FALTA ESTO en ConfiguracionTab.tsx
const canViewBranding = canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'view');

if (!canViewBranding) {
  return <AccessDenied message="No tienes permisos para ver la configuración de marca" />;
}
```

**Recomendación:**
- Validar permiso `view` antes de renderizar `<BrandingSection />`
- Usar componente `<ProtectedSection>` del design system

#### 2. **NO existe hook useGranularPermissions específico**

El hook `usePermissions` es genérico, pero NO hay uno específico para branding como:

```typescript
// ❌ NO EXISTE
export const useBrandingPermissions = () => {
  const { canDo } = usePermissions();

  return {
    canView: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'view'),
    canEdit: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'edit'),
    canCreate: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'create'),
    canDelete: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'delete'),
  };
};
```

#### 3. **Modal NO valida permisos internamente**

```typescript
// ❌ BrandingFormModal NO verifica permisos
// El padre (BrandingSection) controla apertura, pero el modal no tiene protección interna
```

**Riesgo:** Si alguien llama al modal directamente sin pasar por BrandingSection, podría editar sin permisos.

---

## 4. HOOKS DE REACT QUERY

### 📍 Ubicación
```
frontend/src/features/gestion-estrategica/hooks/useStrategic.ts
Líneas: 568-640
```

### 🔍 useActiveBranding

```typescript
// Línea 577-585
export const useActiveBranding = () => {
  return useQuery({
    queryKey: strategicKeys.activeBranding,
    queryFn: brandingApi.getActive,
    retry: 1, // Un reintento en caso de error temporal
    staleTime: 5 * 60 * 1000, // 5 minutos - evitar refetch excesivo
  });
};
```

**Características:**
- ✅ Query key: `['branding', 'active']`
- ✅ Caché de 5 minutos (staleTime)
- ✅ Endpoint público (AllowAny en backend)
- ✅ Se usa en login para branding dinámico
- ✅ Retorna `null` si no hay branding activo (404)

### 🛠️ useCreateBranding

```typescript
// Línea 595-608
export const useCreateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBrandingConfigDTO | FormData) => brandingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.brandings });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Configuración de marca creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la configuración de marca');
    },
  });
};
```

**Invalidación de Caché:**
- ✅ `strategicKeys.brandings` - Lista completa
- ✅ `strategicKeys.activeBranding` - Branding activo

### 🔄 useUpdateBranding

```typescript
// Línea 610-625
export const useUpdateBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBrandingConfigDTO | FormData }) =>
      brandingApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.brandings });
      queryClient.invalidateQueries({ queryKey: strategicKeys.branding(id) });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Configuración de marca actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar la configuración de marca');
    },
  });
};
```

**Invalidación de Caché:**
- ✅ `strategicKeys.brandings` - Lista completa
- ✅ `strategicKeys.branding(id)` - Branding específico
- ✅ `strategicKeys.activeBranding` - ⭐ **CRÍTICO** para actualizar logo/colores en toda la app

### 🗑️ useDeleteBranding

```typescript
// Línea 627-640
export const useDeleteBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => brandingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategicKeys.brandings });
      queryClient.invalidateQueries({ queryKey: strategicKeys.activeBranding });
      toast.success('Configuración de marca eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar la configuración de marca');
    },
  });
};
```

**⚠️ NO USADO en UI** - No hay botón de eliminación implementado.

### 📡 API Client - brandingApi

**Archivo:** `frontend/src/features/gestion-estrategica/api/strategicApi.ts` (Líneas 341-389)

```typescript
export const brandingApi = {
  getAll: async (): Promise<PaginatedResponse<BrandingConfig>> => {
    const response = await axiosInstance.get(`${CORE_URL}/branding/`);
    return response.data;
  },

  getActive: async (): Promise<BrandingConfig | null> => {
    try {
      const response = await axiosInstance.get(`${CORE_URL}/branding/active/`);
      return response.data;
    } catch (error: unknown) {
      // 404 significa que no hay branding activo, retornar null
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  create: async (data: CreateBrandingConfigDTO | FormData): Promise<BrandingConfig> => {
    const isFormData = data instanceof FormData;
    const response = await axiosInstance.post(`${CORE_URL}/branding/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  update: async (id: number, data: UpdateBrandingConfigDTO | FormData): Promise<BrandingConfig> => {
    const isFormData = data instanceof FormData;
    const response = await axiosInstance.patch(`${CORE_URL}/branding/${id}/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${CORE_URL}/branding/${id}/`);
  },
};
```

**Endpoints Backend:**
- `GET /core/branding/` - Lista todas las configuraciones
- `GET /core/branding/active/` - Obtiene configuración activa
- `POST /core/branding/` - Crea nueva configuración
- `PATCH /core/branding/{id}/` - Actualiza configuración
- `DELETE /core/branding/{id}/` - Elimina configuración

---

## 5. PWA RELATED - CAPACIDADES PROGRESIVAS

### 🔧 Configuración de Vite PWA

**Archivo:** `frontend/vite.config.ts` (Líneas 11-117)

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'logo-dark.png', 'logo-light.png', 'pwa-icon.svg'],
  manifest: {
    name: 'StrateKaz - Sistema de Gestión Integral',
    short_name: 'StrateKaz',
    description: 'ERP de Consultoría 4.0 - SST, PESV, ISO, Calidad',
    theme_color: '#ec268f',  // ⚠️ ESTÁTICO - NO viene de branding
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: 'pwa-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: 'pwa-icon.svg', sizes: 'any' }]
      }
    ]
  }
})
```

### ❌ LIMITACIÓN CRÍTICA: Manifest Estático

**Problema:**
El archivo `manifest.json` se genera en **tiempo de build** con valores estáticos, NO puede cambiar dinámicamente según el branding configurado en la base de datos.

**Valores Estáticos:**
- `name`: "StrateKaz - Sistema de Gestión Integral"
- `short_name`: "StrateKaz"
- `theme_color`: "#ec268f" (rosa de StrateKaz)
- `icons`: Archivos fijos en `/public`

**Impacto:**
- ⚠️ Si un cliente cambia `company_name` a "EcoNorte", el manifest seguirá diciendo "StrateKaz"
- ⚠️ Si cambia `primary_color` a "#16A34A" (verde), la barra de navegación móvil seguirá rosa
- ⚠️ Los iconos PWA no se actualizan dinámicamente

### ✅ Favicon Dinámico (SÍ funciona)

**Archivo:** `frontend/index.html` (Línea 5)

```html
<link rel="icon" id="dynamic-favicon" type="image/png" href="/logo-dark.png" />
```

**Hook:** `frontend/src/hooks/useDynamicTheme.ts` (Líneas 96-127)

```typescript
useEffect(() => {
  if (isLoading) return;

  // Aplicar favicon - usa 'favicon' del hook que ya incluye fallback
  if (favicon && favicon.trim() !== '') {
    const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (faviconLink) {
      // Agregar timestamp para evitar cache del navegador
      const faviconWithCache = favicon.includes('?')
        ? `${favicon}&_t=${Date.now()}`
        : `${favicon}?_t=${Date.now()}`;
      faviconLink.href = faviconWithCache;

      // Actualizar el type según la extensión del archivo
      if (favicon.endsWith('.png')) {
        faviconLink.type = 'image/png';
      } else if (favicon.endsWith('.svg')) {
        faviconLink.type = 'image/svg+xml';
      } else {
        faviconLink.type = 'image/x-icon';
      }
    }
  }

  // Aplicar título
  if (companyName && companyName.trim() !== '') {
    document.title = companyName;
  }
}, [favicon, companyName, isLoading]);
```

**✅ Funcionalidades que SÍ funcionan:**
- Favicon se actualiza dinámicamente (requiere F5 para ver cambio)
- Título de la pestaña (`document.title`) se actualiza
- Cache busting con timestamp para evitar caché del navegador
- Detección automática del tipo de archivo (PNG, SVG, ICO)

### 🎨 Colores Dinámicos (CSS Variables)

**Hook:** `frontend/src/hooks/useDynamicTheme.ts` (Líneas 129-173)

```typescript
useEffect(() => {
  if (isLoading || isError || !branding) return;

  const root = document.documentElement;

  // Generar y aplicar variantes del color primario
  const primaryVariants = generateColorVariants(primaryColor);
  if (primaryVariants) {
    Object.entries(primaryVariants).forEach(([shade, { r, g, b }]) => {
      root.style.setProperty(`--color-primary-${shade}`, `${r} ${g} ${b}`);
    });
    root.style.setProperty('--color-primary', hexToRgb(primaryColor));
  }

  // Idem para secondary y accent
}, [primaryColor, secondaryColor, accentColor, isLoading, isError, branding]);
```

**Generación de Variantes:**
- ✅ 50, 100, 200, 300, 400, 500 (base), 600, 700, 800, 900, 950
- ✅ Algoritmo de ajuste de brillo (lighten/darken)
- ✅ Se aplican como CSS variables en `:root`
- ✅ Tailwind puede usar estas variables: `bg-primary-500`, `text-primary-600`, etc.

**Función de Conversión HEX → RGB:**

```typescript
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '236 38 143'; // Default rosa StrateKaz #ec268f
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}
```

### 📊 Uso del Branding en la Aplicación

#### **App.tsx** (Líneas 10, 15)

```typescript
const { isLoading: isBrandingLoading } = useBrandingConfig();
useDynamicTheme(); // Aplica colores y favicon
```

#### **LoginPage.tsx** (Línea 36)

```typescript
const {
  logo,
  logoWhite,
  companyName,
  companySlogan,
  loginBackground,
  getLogoForTheme,
} = useBrandingConfig();

// Usa login_background como imagen de fondo
// Muestra logo según tema actual (light/dark)
```

#### **Header.tsx** (Línea 33)

```typescript
const { companyName, companySlogan, getLogoForTheme } = useBrandingConfig();
const logoUrl = getLogoForTheme(theme);

// Logo cambia automáticamente al hacer toggle de dark mode
```

#### **Sidebar.tsx** (Línea 447)

```typescript
const { appVersion } = useBrandingConfig();

// Muestra versión en el footer del sidebar
```

### 🔄 Actualización en Tiempo Real

**Flujo al guardar branding:**

1. Usuario edita y guarda en `BrandingFormModal`
2. `useUpdateBranding` ejecuta mutation
3. `onSuccess` invalida `strategicKeys.activeBranding`
4. React Query refetch automático
5. `useBrandingConfig` obtiene nuevos valores
6. `useDynamicTheme` detecta cambio y actualiza CSS variables
7. ✅ Los colores cambian instantáneamente en toda la app
8. ⚠️ Favicon y título requieren **F5 para actualizar** (limitación del navegador)

---

## 6. TIPOS TYPESCRIPT

### 📍 Ubicación
```
frontend/src/features/gestion-estrategica/types/strategic.types.ts
Líneas: 305-348
```

### 🏗️ BrandingConfig (Líneas 307-323)

```typescript
export interface BrandingConfig {
  id: number;
  company_name: string;
  company_short_name: string;
  company_slogan?: string | null;
  logo?: string | null;
  logo_white?: string | null;
  favicon?: string | null;
  login_background?: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  app_version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Campos Opcionales:**
- ✅ `company_slogan` puede ser null
- ✅ Todos los campos de imagen pueden ser null
- ✅ Colores son requeridos (string)

**Campos de Auditoría:**
- ✅ `created_at` - ISO 8601 string
- ✅ `updated_at` - ISO 8601 string
- ❌ **FALTA**: `created_by`, `updated_by` (no están en el tipo ni en el backend)

### 🆕 CreateBrandingConfigDTO (Líneas 325-335)

```typescript
export interface CreateBrandingConfigDTO {
  company_name: string;
  company_short_name: string;
  company_slogan?: string;
  login_background?: File;  // ⚠️ Solo login_background, no logo/logo_white/favicon
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  app_version?: string;
  is_active?: boolean;
}
```

**⚠️ INCONSISTENCIA DETECTADA:**

El tipo DTO solo define `login_background` como File, pero en el modal se suben 4 archivos:
- `logo`
- `logo_white`
- `favicon`
- `login_background`

**Solución:** El modal usa `FormData` que acepta cualquier campo, pero el tipo debería incluir:

```typescript
export interface CreateBrandingConfigDTO {
  company_name: string;
  company_short_name: string;
  company_slogan?: string;
  logo?: File;              // ⚠️ FALTA
  logo_white?: File;        // ⚠️ FALTA
  favicon?: File;           // ⚠️ FALTA
  login_background?: File;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  app_version?: string;
  is_active?: boolean;
}
```

### 🔄 UpdateBrandingConfigDTO (Líneas 337-348)

```typescript
export interface UpdateBrandingConfigDTO {
  company_name?: string;
  company_short_name?: string;
  company_slogan?: string;
  login_background?: File;
  login_background_clear?: boolean;  // ✅ Para eliminar archivo
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  app_version?: string;
  is_active?: boolean;
}
```

**⚠️ MISMA INCONSISTENCIA:**

Debería incluir todos los campos de imagen con sus respectivos `_clear`:

```typescript
export interface UpdateBrandingConfigDTO {
  company_name?: string;
  company_short_name?: string;
  company_slogan?: string;
  logo?: File;                    // ⚠️ FALTA
  logo_clear?: boolean;           // ⚠️ FALTA
  logo_white?: File;              // ⚠️ FALTA
  logo_white_clear?: boolean;     // ⚠️ FALTA
  favicon?: File;                 // ⚠️ FALTA
  favicon_clear?: boolean;        // ⚠️ FALTA
  login_background?: File;
  login_background_clear?: boolean;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  app_version?: string;
  is_active?: boolean;
}
```

### 🔍 TenantUISettings (Líneas 444-449)

```typescript
export interface TenantUISettings {
  // Sidebar
  sidebar_collapsed_default: boolean;
  show_module_badges: boolean;
  // Temas
  dark_mode_enabled: boolean;
  custom_theme_enabled: boolean; // ⚠️ Línea 449 cortada
}
```

**Uso:** En `ConfiguracionTab.tsx` (Líneas 444-595) para configurar preferencias de UI.

**⚠️ NO está relacionado con Branding**, pero se renderiza en la misma pestaña de Configuración.

### 📦 Wrapper Hook - useBrandingConfig

**Archivo:** `frontend/src/hooks/useBrandingConfig.ts`

```typescript
export interface UseBrandingConfigReturn {
  // Data completa
  branding: BrandingConfig | null;
  isLoading: boolean;
  isError: boolean;

  // Helpers para acceso rápido
  companyName: string;
  companyShortName: string;
  companySlogan: string;

  // Logos con fallback a defaults
  logo: string;
  logoWhite: string;
  favicon: string;
  loginBackground: string | null;

  // Colores
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Versión de la app
  appVersion: string;

  // Función para obtener logo según tema
  getLogoForTheme: (theme: 'light' | 'dark') => string;
}
```

**Valores por Defecto:**

```typescript
const DEFAULT_BRANDING: Partial<BrandingConfig> = {
  company_name: 'StrateKaz | Consultoría 4.0',
  company_short_name: 'StrateKaz',
  company_slogan: 'Sistema Integrado de Gestión',
  logo: '/logo-dark.png',
  logo_white: '/logo-light.png',
  favicon: '/logo-dark.png',
  login_background: null,
  primary_color: '#ec268f',  // Rosa StrateKaz
  secondary_color: '#000000', // Negro
  accent_color: '#f4ec25',    // Amarillo
  app_version: '2.0.0',
};
```

**✅ Ventajas:**
- Siempre retorna valores válidos (nunca null/undefined)
- Fallback automático a valores de StrateKaz
- Helper `getLogoForTheme(theme)` para cambio automático
- Tipado completo sin necesidad de opcional chaining

---

## RECOMENDACIONES DE MEJORA

### 🔥 PRIORIDAD ALTA

#### 1. **Agregar Validación de Permiso VIEW**

```typescript
// ConfiguracionTab.tsx - Antes de renderizar BrandingSection
const canViewBranding = canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'view');

if (!canViewBranding) {
  return (
    <Alert variant="warning" title="Acceso Denegado">
      No tienes permisos para ver la configuración de marca.
    </Alert>
  );
}
```

#### 2. **Validar Formato de Colores en el Formulario**

```typescript
// BrandingFormModal.tsx
const isValidHex = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

// En el submit
if (!isValidHex(formData.primary_color)) {
  toast.error('Color primario inválido. Debe ser formato HEX (#RRGGBB)');
  return;
}
```

#### 3. **Corregir Tipos TypeScript de DTOs**

```typescript
// strategic.types.ts
export interface CreateBrandingConfigDTO {
  company_name: string;
  company_short_name: string;
  company_slogan?: string;
  logo?: File;                    // AGREGAR
  logo_white?: File;              // AGREGAR
  favicon?: File;                 // AGREGAR
  login_background?: File;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  app_version?: string;
  is_active?: boolean;
}

export interface UpdateBrandingConfigDTO {
  company_name?: string;
  company_short_name?: string;
  company_slogan?: string;
  logo?: File;                    // AGREGAR
  logo_clear?: boolean;           // AGREGAR
  logo_white?: File;              // AGREGAR
  logo_white_clear?: boolean;     // AGREGAR
  favicon?: File;                 // AGREGAR
  favicon_clear?: boolean;        // AGREGAR
  login_background?: File;
  login_background_clear?: boolean;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  app_version?: string;
  is_active?: boolean;
}
```

### ⚙️ PRIORIDAD MEDIA

#### 4. **Crear Hook Específico de Permisos de Branding**

```typescript
// frontend/src/features/gestion-estrategica/hooks/useBrandingPermissions.ts
import { usePermissions } from '@/hooks/usePermissions';
import { Modules, Sections } from '@/constants/permissions';

export const useBrandingPermissions = () => {
  const { canDo } = usePermissions();

  return {
    canView: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'view'),
    canEdit: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'edit'),
    canCreate: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'create'),
    canDelete: canDo(Modules.GESTION_ESTRATEGICA, Sections.BRANDING, 'delete'),
  };
};
```

#### 5. **Validar Permisos en BrandingFormModal**

```typescript
// BrandingFormModal.tsx - Al inicio del componente
const { canEdit, canCreate } = useBrandingPermissions();

if (isEditing && !canEdit) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Acceso Denegado">
      <Alert variant="warning">No tienes permisos para editar la marca.</Alert>
    </BaseModal>
  );
}

if (!isEditing && !canCreate) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Acceso Denegado">
      <Alert variant="warning">No tienes permisos para crear configuración de marca.</Alert>
    </BaseModal>
  );
}
```

#### 6. **Agregar Validación de Tamaño de Archivos**

```typescript
// ImageUpload component
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] || null;

  if (file && file.size > MAX_FILE_SIZE) {
    toast.error(`El archivo es demasiado grande. Máximo: 2MB`);
    return;
  }

  onChange(file);
};
```

### 🔮 PRIORIDAD BAJA (Future Enhancements)

#### 7. **PWA Manifest Dinámico (Investigar Solución)**

**Problema:** Vite PWA genera manifest estático en build time.

**Opciones:**

**Opción A: Service Worker Personalizado**
```typescript
// sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('/manifest.json')) {
    event.respondWith(
      fetch('/api/branding/manifest').then(response => response.json())
    );
  }
});
```

**Opción B: Endpoint Backend que Genera Manifest**
```python
# backend/core/views.py
@api_view(['GET'])
@permission_classes([AllowAny])
def dynamic_manifest(request):
    branding = BrandingConfig.objects.filter(is_active=True).first()
    manifest = {
        "name": branding.company_name if branding else "StrateKaz",
        "short_name": branding.company_short_name if branding else "StrateKaz",
        "theme_color": branding.primary_color if branding else "#ec268f",
        # ...
    }
    return Response(manifest)
```

**Opción C: Web App Manifest Link Dinámico**
```html
<!-- index.html -->
<link rel="manifest" href="/api/branding/manifest">
```

#### 8. **Preview en Vivo de Colores**

Agregar un componente de preview completo que muestre:
- Botones con los colores aplicados
- Cards de ejemplo
- Sidebar mock
- Header mock

```typescript
// BrandingFormModal.tsx
<ColorPreview
  primary={formData.primary_color}
  secondary={formData.secondary_color}
  accent={formData.accent_color}
/>
```

#### 9. **Historial de Cambios de Branding**

Implementar versionado de branding con tabla de auditoría:

```typescript
export interface BrandingHistory {
  id: number;
  branding_id: number;
  changed_by: User;
  changed_at: string;
  changes: Record<string, { old: any; new: any }>;
}
```

---

## CONCLUSIÓN

### ✅ Aspectos Sobresalientes

1. **Arquitectura Sólida**: Separación clara de responsabilidades (componentes, hooks, API, tipos)
2. **React Query Bien Implementado**: Caché inteligente e invalidación correcta
3. **Design System Consistente**: Uso de componentes reutilizables
4. **Tipado TypeScript**: Sin uso de `any`, tipos bien definidos (con pequeñas correcciones necesarias)
5. **Favicon Dinámico Funcional**: Se actualiza correctamente (con F5)
6. **Colores Dinámicos**: CSS variables generadas automáticamente

### ⚠️ Brechas Críticas a Resolver

1. **PWA Manifest Estático**: NO se actualiza con branding de BD
2. **Falta Validación de Permiso VIEW**: La sección es visible para todos
3. **Tipos DTO Incompletos**: Falta `logo`, `logo_white`, `favicon` y sus `_clear`
4. **Sin Validación de Formato**: Colores HEX no se validan
5. **Modal Sin Protección Interna**: No valida permisos por sí mismo

### 📊 Puntuación General

| Aspecto | Puntuación | Comentarios |
|---------|-----------|-------------|
| **Estructura de Componentes** | 9/10 | Excelente separación de responsabilidades |
| **RBAC Granular** | 6/10 | Falta validación VIEW y hook específico |
| **React Query** | 10/10 | Implementación perfecta |
| **Tipos TypeScript** | 7/10 | Falta completar DTOs de archivos |
| **PWA Capabilities** | 5/10 | Favicon ✅, Manifest ❌ |
| **Design System** | 10/10 | Uso consistente y correcto |
| **Validaciones** | 4/10 | Faltan validaciones de formato y tamaño |

**Puntuación Total: 7.3/10** - Buena base, necesita correcciones menores

---

## ANEXOS

### A. Archivos Relacionados

```
COMPONENTES:
├── frontend/src/features/gestion-estrategica/components/ConfiguracionTab.tsx (BrandingSection)
├── frontend/src/features/gestion-estrategica/components/modals/BrandingFormModal.tsx
└── frontend/src/components/common/ImageUpload.tsx (dentro de BrandingFormModal)

HOOKS:
├── frontend/src/hooks/useBrandingConfig.ts (wrapper con defaults)
├── frontend/src/hooks/useDynamicTheme.ts (aplica colores y favicon)
├── frontend/src/hooks/usePermissions.ts (RBAC genérico)
└── frontend/src/features/gestion-estrategica/hooks/useStrategic.ts (React Query)

TIPOS:
├── frontend/src/features/gestion-estrategica/types/strategic.types.ts
└── frontend/src/constants/permissions.ts (Sections.BRANDING)

API:
└── frontend/src/features/gestion-estrategica/api/strategicApi.ts (brandingApi)

CONFIGURACIÓN:
├── frontend/vite.config.ts (VitePWA)
├── frontend/index.html (dynamic-favicon)
└── frontend/public/ (logos, favicon, iconos PWA)
```

### B. Códigos de Permisos RBAC

```typescript
// Formato: "modulo.seccion.accion"
const BRANDING_PERMISSIONS = {
  VIEW: 'gestion_estrategica.branding.view',
  CREATE: 'gestion_estrategica.branding.create',
  EDIT: 'gestion_estrategica.branding.edit',
  DELETE: 'gestion_estrategica.branding.delete',
};
```

### C. Endpoints Backend

```
GET    /core/branding/          - Lista todas las configuraciones
GET    /core/branding/active/   - Obtiene configuración activa (AllowAny)
GET    /core/branding/{id}/     - Obtiene configuración específica
POST   /core/branding/          - Crea nueva configuración
PATCH  /core/branding/{id}/     - Actualiza configuración (soporta FormData)
DELETE /core/branding/{id}/     - Elimina configuración
```

---

**Elaborado por**: Claude AI (Sonnet 4.5)
**Revisado**: Pendiente
**Próxima Revisión**: Después de implementar correcciones prioritarias
