# Branding Dinámico

El sistema soporta configuración de marca dinámica desde la base de datos, permitiendo personalizar logos, colores y nombre de empresa sin recompilar.

## Características

| Característica | Descripción |
|----------------|-------------|
| **Logos dinámicos** | Logo claro y oscuro configurables desde DB |
| **Colores de marca** | Primary, Secondary, Accent con variantes automáticas (50-900) |
| **Nombre de empresa** | Configurable en Header, Sidebar, Login, Vouchers |
| **Favicon personalizado** | Ícono de la aplicación configurable |
| **Tiempo real** | Cambios se aplican sin recargar la página |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│                    useDynamicTheme()                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  useBrandingConfig()                         │
│          (Hook global con fallbacks a defaults)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 useActiveBranding()                          │
│     (React Query - solo ejecuta si hay auth token)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              GET /api/core/branding/active/                  │
│                   (Backend Django)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Modelo de Datos

```python
# apps/core/models.py

class BrandingConfig(models.Model):
    empresa = models.ForeignKey('EmpresaConfig', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)

    # Logos
    logo = models.ImageField(upload_to='branding/logos/', blank=True)
    logo_white = models.ImageField(upload_to='branding/logos/', blank=True)
    favicon = models.ImageField(upload_to='branding/favicons/', blank=True)

    # Colores
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#6366F1')
    accent_color = models.CharField(max_length=7, default='#10B981')

    # Textos
    company_name = models.CharField(max_length=200)
    company_short_name = models.CharField(max_length=50, blank=True)
    slogan = models.CharField(max_length=200, blank=True)

    # Estado
    is_active = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['empresa'],
                condition=models.Q(is_active=True),
                name='unique_active_branding_per_empresa'
            )
        ]
```

---

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/core/branding/` | Listar configuraciones |
| POST | `/api/core/branding/` | Crear configuración (FormData) |
| PATCH | `/api/core/branding/{id}/` | Actualizar |
| GET | `/api/core/branding/active/` | Obtener configuración activa |

### Eliminar Archivos (PATCH)

```json
{
  "logo_clear": true,
  "logo_white_clear": true,
  "favicon_clear": true
}
```

---

## Uso en Frontend

### Hook Principal

```typescript
// src/hooks/useBrandingConfig.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface BrandingConfig {
  id: number;
  company_name: string;
  company_short_name: string;
  slogan: string;
  logo: string | null;
  logo_white: string | null;
  favicon: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  id: 0,
  company_name: 'Mi Empresa',
  company_short_name: 'ME',
  slogan: '',
  logo: null,
  logo_white: null,
  favicon: null,
  primary_color: '#3B82F6',
  secondary_color: '#6366F1',
  accent_color: '#10B981',
};

export function useBrandingConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['branding', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/api/core/branding/active/');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const branding = data || DEFAULT_BRANDING;

  const getLogoForTheme = (theme: 'light' | 'dark') => {
    return theme === 'dark' ? branding.logo_white : branding.logo;
  };

  return {
    ...branding,
    getLogoForTheme,
    isLoading,
  };
}
```

### Hook de Tema Dinámico

```typescript
// src/hooks/useDynamicTheme.ts
import { useEffect } from 'react';
import { useBrandingConfig } from './useBrandingConfig';
import { generateColorScale } from '@/lib/colors';

export function useDynamicTheme() {
  const { primary_color, secondary_color, accent_color } = useBrandingConfig();

  useEffect(() => {
    const root = document.documentElement;

    // Generar escalas de color (50-900)
    const primaryScale = generateColorScale(primary_color);
    const secondaryScale = generateColorScale(secondary_color);
    const accentScale = generateColorScale(accent_color);

    // Aplicar CSS variables
    Object.entries(primaryScale).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color);
    });

    Object.entries(secondaryScale).forEach(([shade, color]) => {
      root.style.setProperty(`--color-secondary-${shade}`, color);
    });

    Object.entries(accentScale).forEach(([shade, color]) => {
      root.style.setProperty(`--color-accent-${shade}`, color);
    });
  }, [primary_color, secondary_color, accent_color]);
}
```

### Uso en Componentes

```tsx
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

function Header() {
  const { company_name, getLogoForTheme, isLoading } = useBrandingConfig();
  const theme = useTheme(); // 'light' | 'dark'

  if (isLoading) return <Skeleton />;

  return (
    <header>
      <img
        src={getLogoForTheme(theme) || '/default-logo.png'}
        alt={company_name}
        className="h-10"
      />
      <span>{company_name}</span>
    </header>
  );
}
```

---

## CSS Variables

Los colores se inyectan como CSS variables en `:root`:

```css
/* Generadas automáticamente por useDynamicTheme */
:root {
  --color-primary-50: 239 246 255;
  --color-primary-100: 219 234 254;
  --color-primary-200: 191 219 254;
  --color-primary-300: 147 197 253;
  --color-primary-400: 96 165 250;
  --color-primary-500: 59 130 246;  /* Color base */
  --color-primary-600: 37 99 235;
  --color-primary-700: 29 78 216;
  --color-primary-800: 30 64 175;
  --color-primary-900: 30 58 138;
}
```

### Configuración Tailwind

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          // ... etc
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        secondary: { /* similar */ },
        accent: { /* similar */ },
      },
    },
  },
};
```

---

## Especificaciones de Logos

| Archivo | Dimensiones | Formato | Uso |
|---------|-------------|---------|-----|
| **Logo Principal** | 400×120 px | PNG transparente | Header, Login |
| **Logo Blanco** | 400×120 px | PNG transparente | Header dark mode |
| **Favicon** | 32×32 px | ICO o PNG | Tab del navegador |

### Recomendaciones

- **Aspect ratio:** Horizontal (3:1 o 4:1)
- **Altura mínima:** 120px para retina
- **Peso máximo:** 500KB
- **Fondo:** Transparente

---

## Guía de Usuario

Ver [CONFIGURACION-MARCA.md](../usuarios/CONFIGURACION-MARCA.md) para instrucciones paso a paso de configuración desde el admin.
