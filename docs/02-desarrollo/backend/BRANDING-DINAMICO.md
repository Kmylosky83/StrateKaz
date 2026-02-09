# Sistema de Branding Dinámico e Identidad Corporativa

**Sistema:** StrateKaz - Sistema de Gestión Integral
**Fecha:** 2026-02-06
**Versión:** 3.0 (Consolidado)

---

## ÍNDICE

1. [Visión General](#visión-general)
2. [Arquitectura Multi-Tenant](#arquitectura-multi-tenant)
3. [Modelos Backend](#modelos-backend)
4. [API Endpoints](#api-endpoints)
5. [Implementación Frontend](#implementación-frontend)
6. [Identidad Corporativa](#identidad-corporativa)
7. [Gestión de Políticas](#gestión-de-políticas)
8. [Configuración de Usuario](#configuración-de-usuario)
9. [Personalización por Tenant](#personalización-por-tenant)
10. [Guía de Implementación](#guía-de-implementación)

---

## VISIÓN GENERAL

El sistema de **Branding Dinámico e Identidad Corporativa** permite personalizar completamente la apariencia visual y la identidad organizacional de cada tenant sin necesidad de recompilar la aplicación. Este sistema integra:

- **Branding Visual:** Logos, colores corporativos, favicon y nombre de empresa
- **Identidad Corporativa:** Misión, visión, valores corporativos
- **Políticas del Sistema:** Gestión completa con versionamiento y firma digital
- **Alcances ISO:** Certificaciones y alcance de sistemas de gestión
- **Multi-tenant:** Configuración independiente por empresa/organización

### Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Logos dinámicos** | Logo claro y oscuro configurables desde BD |
| **Colores de marca** | Primary, Secondary, Accent con variantes automáticas (50-900) |
| **Nombre de empresa** | Configurable en Header, Sidebar, Login, Vouchers |
| **Favicon personalizado** | Ícono de la aplicación configurable |
| **Tiempo real** | Cambios se aplican sin recargar la página |
| **Identidad corporativa** | Misión, visión, valores con firma digital |
| **Políticas versionadas** | Workflow de aprobación BORRADOR → EN_REVISION → VIGENTE |
| **Multi-tenant seguro** | Aislamiento completo por schema (django-tenants) |

---

## ARQUITECTURA MULTI-TENANT

El sistema utiliza **django-tenants** para proporcionar aislamiento completo de datos por tenant mediante schemas de PostgreSQL.

### Flujo de Autenticación y Branding

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
│              GET /api/tenant/branding/                       │
│              (Tenant determinado por subdominio)             │
└─────────────────────────────────────────────────────────────┘
```

### Modelo de Tenant

El branding está integrado en el modelo `Tenant` para simplificar la arquitectura:

```python
from django_tenants.models import TenantMixin, DomainMixin
from django.db import models

class Tenant(TenantMixin):
    """
    Tenant con configuración de branding integrada.
    Cada tenant tiene su propio schema PostgreSQL aislado.
    """
    # Identificación
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    # Branding
    company_name = models.CharField(max_length=200)
    company_short_name = models.CharField(max_length=50, blank=True)
    slogan = models.CharField(max_length=200, blank=True)

    # Logos (almacenados en public schema, accesibles por URL)
    logo = models.ImageField(upload_to='tenant_logos/', blank=True)
    logo_white = models.ImageField(upload_to='tenant_logos/', blank=True)
    favicon = models.ImageField(upload_to='tenant_favicons/', blank=True)

    # Colores corporativos
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#6366F1')
    accent_color = models.CharField(max_length=7, default='#10B981')

    # Estado del schema
    schema_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pendiente de creación'),
            ('CREATING', 'Creando schema'),
            ('READY', 'Listo para usar'),
            ('ERROR', 'Error en creación'),
        ],
        default='PENDING'
    )

    # Metadata
    created_on = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

class Domain(DomainMixin):
    """Dominios asociados a cada tenant"""
    pass
```

### Ventajas de la Integración

1. **Simplificación:** Un solo modelo en lugar de dos (Tenant + BrandingConfig)
2. **Performance:** Una consulta menos por request
3. **Consistencia:** El branding es parte integral del tenant
4. **Migración simplificada:** Campos de branding migrados desde `core.BrandingConfig`

---

## MODELOS BACKEND

### Modelo Principal: Tenant (con Branding)

**Ubicación:** `backend/apps/tenant/models.py`

El tenant incluye toda la configuración de branding:

```python
class Tenant(TenantMixin):
    """
    Tenant con branding integrado.
    Cada tenant tiene:
    - Schema PostgreSQL propio
    - Configuración de branding (logos, colores, nombre)
    - Dominios asociados
    """

    # Campos de TenantMixin (heredados)
    schema_name = models.CharField(max_length=63, unique=True)

    # Identificación
    name = models.CharField(max_length=100)  # Nombre interno
    slug = models.SlugField(unique=True)  # URL-friendly

    # Branding - Información de la empresa
    company_name = models.CharField(max_length=200)
    company_short_name = models.CharField(max_length=50, blank=True)
    slogan = models.CharField(max_length=200, blank=True)

    # Branding - Logos
    logo = models.ImageField(upload_to='tenant_logos/', blank=True, null=True)
    logo_white = models.ImageField(upload_to='tenant_logos/', blank=True, null=True)
    favicon = models.ImageField(upload_to='tenant_favicons/', blank=True, null=True)

    # Branding - Colores corporativos (HEX)
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#6366F1')
    accent_color = models.CharField(max_length=7, default='#10B981')

    # Estado y metadata
    schema_status = models.CharField(max_length=20, default='PENDING')
    created_on = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    # Configuración automática
    auto_create_schema = True

    class Meta:
        db_table = 'public.tenant'  # Tabla en public schema
```

### Serializers

**Ubicación:** `backend/apps/tenant/serializers.py`

```python
class TenantBrandingSerializer(serializers.ModelSerializer):
    """
    Serializer público de branding (solo lectura).
    Usado en endpoint público /api/tenant/branding/
    """
    logo_url = serializers.SerializerMethodField()
    logo_white_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id',
            'company_name',
            'company_short_name',
            'slogan',
            'logo',
            'logo_white',
            'favicon',
            'logo_url',
            'logo_white_url',
            'favicon_url',
            'primary_color',
            'secondary_color',
            'accent_color',
        ]
        read_only_fields = '__all__'

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
        return None

    def get_logo_white_url(self, obj):
        if obj.logo_white:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.logo_white.url) if request else obj.logo_white.url
        return None

    def get_favicon_url(self, obj):
        if obj.favicon:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.favicon.url) if request else obj.favicon.url
        return None

class TenantSerializer(serializers.ModelSerializer):
    """
    Serializer completo para administración de tenants.
    Incluye campos sensibles - solo para superusuarios.
    """
    branding = TenantBrandingSerializer(source='*', read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id',
            'schema_name',
            'name',
            'slug',
            'company_name',
            'company_short_name',
            'slogan',
            'logo',
            'logo_white',
            'favicon',
            'primary_color',
            'secondary_color',
            'accent_color',
            'schema_status',
            'created_on',
            'is_active',
            'branding',
        ]
```

---

## API ENDPOINTS

### Endpoints de Branding

**Base URL:** `/api/tenant/`

| Método | Endpoint | Descripción | Permisos | Uso |
|--------|----------|-------------|----------|-----|
| GET | `/branding/` | Obtener branding del tenant actual | **AllowAny** | Login page, antes de auth |
| GET | `/tenants/` | Listar todos los tenants | IsSuperUser | Admin global |
| POST | `/tenants/` | Crear nuevo tenant | IsSuperUser | Admin global |
| GET | `/tenants/{id}/` | Detalle de tenant | IsSuperUser | Admin global |
| PATCH | `/tenants/{id}/` | Actualizar tenant/branding | IsSuperUser | Admin global |
| DELETE | `/tenants/{id}/` | Eliminar tenant | IsSuperUser | Admin global |

### Endpoint Público: Branding

**GET `/api/tenant/branding/`**

Este endpoint es **público** (AllowAny) porque se usa en:
- Página de login (antes de autenticación)
- Favicon dinámico en `<head>`
- Splash screen inicial

**Funcionamiento:**
1. Detecta el tenant actual por el dominio del request
2. Retorna solo campos de branding (sin info sensible)
3. Incluye URLs absolutas para logos/favicon

**Request:**
```http
GET /api/tenant/branding/ HTTP/1.1
Host: empresa1.stratekaz.com
```

**Response:**
```json
{
  "id": 1,
  "company_name": "Empresa Ejemplo S.A.S.",
  "company_short_name": "EE",
  "slogan": "Innovación y calidad desde 1990",
  "logo": "tenant_logos/empresa1_logo.png",
  "logo_white": "tenant_logos/empresa1_logo_white.png",
  "favicon": "tenant_favicons/empresa1_favicon.ico",
  "logo_url": "https://empresa1.stratekaz.com/media/tenant_logos/empresa1_logo.png",
  "logo_white_url": "https://empresa1.stratekaz.com/media/tenant_logos/empresa1_logo_white.png",
  "favicon_url": "https://empresa1.stratekaz.com/media/tenant_favicons/empresa1_favicon.ico",
  "primary_color": "#1E40AF",
  "secondary_color": "#7C3AED",
  "accent_color": "#059669"
}
```

### Eliminación de Logos (PATCH)

Para eliminar un logo específico sin eliminar los demás:

**Request:**
```http
PATCH /api/tenant/tenants/1/ HTTP/1.1
Content-Type: application/json

{
  "logo_clear": true,
  "logo_white_clear": true,
  "favicon_clear": true
}
```

**Lógica en ViewSet:**
```python
def perform_update(self, serializer):
    # Manejo de eliminación de archivos
    if self.request.data.get('logo_clear'):
        serializer.instance.logo.delete(save=False)
        serializer.validated_data['logo'] = None

    if self.request.data.get('logo_white_clear'):
        serializer.instance.logo_white.delete(save=False)
        serializer.validated_data['logo_white'] = None

    if self.request.data.get('favicon_clear'):
        serializer.instance.favicon.delete(save=False)
        serializer.validated_data['favicon'] = None

    serializer.save()
```

---

## IMPLEMENTACIÓN FRONTEND

### Hook Principal: `useBrandingConfig`

**Ubicación:** `frontend/src/hooks/useBrandingConfig.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/axios-config';

interface BrandingConfig {
  id: number;
  company_name: string;
  company_short_name: string;
  slogan: string;
  logo: string | null;
  logo_white: string | null;
  favicon: string | null;
  logo_url: string | null;
  logo_white_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  id: 0,
  company_name: 'StrateKaz',
  company_short_name: 'SK',
  slogan: '',
  logo: null,
  logo_white: null,
  favicon: null,
  logo_url: null,
  logo_white_url: null,
  favicon_url: null,
  primary_color: '#3B82F6',
  secondary_color: '#6366F1',
  accent_color: '#10B981',
};

export function useBrandingConfig() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['branding', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tenant/branding/');
      return response.data as BrandingConfig;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: false, // No reintentar en 404
  });

  const branding = data || DEFAULT_BRANDING;

  const getLogoForTheme = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      return branding.logo_white_url || branding.logo_white || branding.logo_url || branding.logo;
    }
    return branding.logo_url || branding.logo;
  };

  return {
    ...branding,
    getLogoForTheme,
    isLoading,
    error,
  };
}
```

### Hook de Tema Dinámico

**Ubicación:** `frontend/src/hooks/useDynamicTheme.ts`

```typescript
import { useEffect } from 'react';
import { useBrandingConfig } from './useBrandingConfig';
import { generateColorScale } from '@/lib/colors';

export function useDynamicTheme() {
  const { primary_color, secondary_color, accent_color } = useBrandingConfig();

  useEffect(() => {
    const root = document.documentElement;

    // Generar escalas de color (50-900) usando algoritmo HSL
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

    // Actualizar favicon dinámicamente
    const { favicon_url } = useBrandingConfig();
    if (favicon_url) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = favicon_url;
      }
    }
  }, [primary_color, secondary_color, accent_color]);
}
```

### Generación de Escalas de Color

**Ubicación:** `frontend/src/lib/colors.ts`

```typescript
/**
 * Genera una escala de colores de 50 a 900 a partir de un color base.
 * Utiliza conversión a HSL para ajustar luminosidad.
 */
export function generateColorScale(baseColor: string): Record<string, string> {
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Convertir RGB a HSL
  const hsl = rgbToHsl(r, g, b);

  // Generar tonos
  const scale: Record<string, string> = {};
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const lightnessMap = [0.95, 0.90, 0.80, 0.65, 0.55, 0.50, 0.45, 0.35, 0.25, 0.15];

  shades.forEach((shade, index) => {
    const l = lightnessMap[index];
    const [r2, g2, b2] = hslToRgb(hsl.h, hsl.s, l);
    scale[shade] = `${r2} ${g2} ${b2}`; // Formato Tailwind CSS
  });

  return scale;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
```

### Uso en Componentes

**Header Component:**
```tsx
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useTheme } from '@/hooks/useTheme';

function Header() {
  const { company_name, getLogoForTheme, isLoading } = useBrandingConfig();
  const { theme } = useTheme(); // 'light' | 'dark'

  if (isLoading) {
    return <div className="h-16 animate-pulse bg-gray-200" />;
  }

  const logoSrc = getLogoForTheme(theme);

  return (
    <header className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-900">
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={company_name}
          className="h-10 w-auto object-contain"
        />
      ) : (
        <span className="text-xl font-bold text-primary-600">
          {company_name}
        </span>
      )}
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {company_name}
      </span>
    </header>
  );
}
```

### CSS Variables

Los colores se inyectan como CSS variables en `:root`:

```css
/* Generadas automáticamente por useDynamicTheme */
:root {
  /* Primary color scale */
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

  /* Secondary color scale */
  --color-secondary-50: 245 243 255;
  --color-secondary-100: 237 233 254;
  /* ... */

  /* Accent color scale */
  --color-accent-50: 236 253 245;
  /* ... */
}
```

### Configuración Tailwind

**Archivo:** `tailwind.config.js`

```javascript
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        secondary: {
          50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
        },
        accent: {
          50: 'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
```

---

## IDENTIDAD CORPORATIVA

La identidad corporativa extiende el branding visual con elementos estratégicos de la organización.

### Modelo: CorporateIdentity

**Ubicación:** `backend/apps/gestion_estrategica/identidad/models.py`

```python
from django.db import models
from apps.core.models import AuditModel, SoftDeleteModel

class CorporateIdentity(AuditModel, SoftDeleteModel):
    """
    Identidad Corporativa - Misión, Visión, Política Integral.
    Una por tenant (relación OneToOne con EmpresaConfig).
    """

    # Multi-tenancy (ya filtrado por schema)
    empresa = models.OneToOneField(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='corporate_identity'
    )

    # Contenido (HTML desde editor TipTap)
    mission = models.TextField(help_text='Declaración de misión (HTML)')
    vision = models.TextField(help_text='Declaración de visión (HTML)')
    integral_policy = models.TextField(help_text='Política integral del sistema (HTML)')

    # Firma digital de la política
    policy_signed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='signed_policies'
    )
    policy_signed_at = models.DateTimeField(null=True, blank=True)
    policy_signature_hash = models.CharField(max_length=255, blank=True)

    # Versionamiento
    effective_date = models.DateField(help_text='Fecha desde la cual está vigente')
    version = models.CharField(max_length=20, default='1.0')

    # Heredados de AuditModel
    # created_at, updated_at, created_by, updated_by

    # Heredados de SoftDeleteModel
    # is_active, deleted_at

    class Meta:
        db_table = 'identidad_corporate_identity'
        verbose_name = 'Identidad Corporativa'
        verbose_name_plural = 'Identidades Corporativas'

    @property
    def is_signed(self):
        """Indica si la política está firmada digitalmente"""
        return bool(self.policy_signature_hash)

    def sign_policy(self, user):
        """Firma digitalmente la política integral"""
        import hashlib
        from django.utils import timezone

        content = f"{self.integral_policy}|{user.id}|{timezone.now().isoformat()}"
        self.policy_signature_hash = hashlib.sha256(content.encode()).hexdigest()
        self.policy_signed_by = user
        self.policy_signed_at = timezone.now()
        self.save(update_fields=[
            'policy_signature_hash',
            'policy_signed_by',
            'policy_signed_at',
            'updated_at'
        ])
```

### Modelo: CorporateValue

```python
class CorporateValue(TimestampedModel, SoftDeleteModel, OrderedModel):
    """
    Valores Corporativos con orden y iconos dinámicos.
    Soporta drag & drop para reordenamiento.
    """

    identity = models.ForeignKey(
        CorporateIdentity,
        on_delete=models.CASCADE,
        related_name='values'
    )
    name = models.CharField(max_length=100, help_text='Nombre del valor')
    description = models.TextField(help_text='Descripción detallada')
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='Nombre del icono de Lucide (ej: Heart, Shield)'
    )

    # Heredado de OrderedModel
    orden = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        db_table = 'identidad_corporate_value'
        ordering = ['orden', 'name']
        verbose_name = 'Valor Corporativo'
        verbose_name_plural = 'Valores Corporativos'
```

### Endpoints de Identidad

**Base URL:** `/api/identidad/`

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/identidad/` | Lista de identidades | IsAuthenticated |
| POST | `/identidad/` | Crear identidad | IsAuthenticated |
| GET | `/identidad/{id}/` | Detalle de identidad | IsAuthenticated |
| PATCH | `/identidad/{id}/` | Actualizar identidad | IsAuthenticated |
| DELETE | `/identidad/{id}/` | Eliminar identidad | IsAuthenticated |
| GET | `/identidad/active/` | Obtener identidad activa | **AllowAny** |
| POST | `/identidad/{id}/sign/` | Firmar política | IsAuthenticated |
| GET | `/valores/` | Lista de valores | IsAuthenticated |
| POST | `/valores/` | Crear valor | IsAuthenticated |
| POST | `/valores/reorder/` | Reordenar valores | IsAuthenticated |

---

## GESTIÓN DE POLÍTICAS

Sistema completo de gestión de políticas con versionamiento y workflow de aprobación.

### Modelo: PoliticaIntegral

```python
class PoliticaIntegral(AuditModel, SoftDeleteModel, OrderedModel):
    """
    Política Integral con versionamiento y firma digital.
    Workflow: BORRADOR → EN_REVISION → VIGENTE → OBSOLETO
    """

    identity = models.ForeignKey(
        CorporateIdentity,
        on_delete=models.CASCADE,
        related_name='politicas_integrales'
    )

    # Contenido
    version = models.CharField(max_length=20)
    title = models.CharField(
        max_length=200,
        default='Política Integral del Sistema de Gestión'
    )
    content = models.TextField(help_text='Contenido HTML')

    # Estado y workflow
    status = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('EN_REVISION', 'En Revisión'),
            ('VIGENTE', 'Vigente'),
            ('OBSOLETO', 'Obsoleto'),
        ],
        default='BORRADOR',
        db_index=True
    )
    effective_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    review_date = models.DateField(blank=True, null=True)

    # Firma digital
    signed_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    signed_at = models.DateTimeField(null=True, blank=True)
    signature_hash = models.CharField(max_length=255, blank=True, null=True)

    # Normas aplicables (dinámico, no hardcoded)
    applicable_standards = models.JSONField(
        default=list,
        help_text='Lista de IDs de NormaISO aplicables'
    )

    # Documentación
    document_file = models.FileField(upload_to='policies/integral/', blank=True)
    change_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'identidad_politica_integral'
        ordering = ['-version']
        verbose_name = 'Política Integral'
        verbose_name_plural = 'Políticas Integrales'

    def sign(self, user):
        """Firma digitalmente la política"""
        import hashlib
        from django.utils import timezone

        content = f"{self.content}|{user.id}|{timezone.now().isoformat()}"
        self.signature_hash = hashlib.sha256(content.encode()).hexdigest()
        self.signed_by = user
        self.signed_at = timezone.now()
        self.save(update_fields=['signature_hash', 'signed_by', 'signed_at'])

    def publish(self, user):
        """Publica la política (cambia a VIGENTE y obsoleta las anteriores)"""
        from django.db import transaction

        if self.status not in ['BORRADOR', 'EN_REVISION']:
            raise ValueError("Solo se pueden publicar políticas en borrador o en revisión")

        with transaction.atomic():
            # Obsoleta las políticas vigentes anteriores
            PoliticaIntegral.objects.filter(
                identity=self.identity,
                status='VIGENTE'
            ).update(status='OBSOLETO')

            # Publica esta política
            self.status = 'VIGENTE'
            self.effective_date = timezone.now().date()
            self.updated_by = user
            self.save()

    @classmethod
    def get_current(cls, identity):
        """Obtiene la política vigente actual"""
        return cls.objects.filter(
            identity=identity,
            status='VIGENTE',
            is_active=True
        ).first()
```

### Modelo: PoliticaEspecifica

```python
class PoliticaEspecifica(AuditModel, SoftDeleteModel, OrderedModel):
    """
    Políticas Específicas por área o norma ISO.
    Más ligeras que PoliticaIntegral, sin firma digital.
    """

    identity = models.ForeignKey(
        CorporateIdentity,
        on_delete=models.CASCADE,
        related_name='politicas_especificas'
    )

    # Norma ISO (dinámico desde BD, no hardcoded)
    norma_iso = models.ForeignKey(
        'configuracion.NormaISO',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='politicas_especificas'
    )

    # Identificación
    code = models.CharField(max_length=20, help_text='Código único (ej: POL-SST-001)')
    title = models.CharField(max_length=200)
    content = models.TextField()
    version = models.CharField(max_length=20, default='1.0')

    # Estado y fechas
    status = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('EN_REVISION', 'En Revisión'),
            ('VIGENTE', 'Vigente'),
            ('OBSOLETO', 'Obsoleto'),
        ],
        default='BORRADOR'
    )
    effective_date = models.DateField(blank=True, null=True)
    review_date = models.DateField(blank=True, null=True)

    # Responsables
    area = models.ForeignKey('organizacion.Area', on_delete=models.PROTECT)
    responsible = models.ForeignKey('auth.User', on_delete=models.PROTECT)
    responsible_cargo = models.ForeignKey('core.Cargo', on_delete=models.PROTECT)

    # Aprobación (sin firma digital)
    approved_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_policies'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # Extras
    document_file = models.FileField(upload_to='policies/specific/', blank=True)
    keywords = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'identidad_politica_especifica'
        ordering = ['norma_iso', 'orden', 'code']
        verbose_name = 'Política Específica'
        verbose_name_plural = 'Políticas Específicas'
        unique_together = [['identity', 'code']]

    def approve(self, user):
        """Aprueba la política"""
        from django.utils import timezone

        self.approved_by = user
        self.approved_at = timezone.now()
        self.status = 'VIGENTE'
        self.effective_date = timezone.now().date()
        self.updated_by = user
        self.save()

    @property
    def needs_review(self):
        """Indica si la política necesita revisión"""
        from django.utils import timezone
        if not self.review_date:
            return False
        return self.review_date <= timezone.now().date()
```

### Workflow de Políticas

```
┌─────────────────────────────────────────────────────────┐
│                  WORKFLOW DE POLÍTICAS                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  BORRADOR                                               │
│    │                                                     │
│    ├─► Edición libre                                    │
│    └─► Enviar a Revisión                               │
│         │                                                │
│         ▼                                                │
│  EN_REVISION                                            │
│    │                                                     │
│    ├─► Devolver a Borrador (correcciones)              │
│    ├─► Firmar Digitalmente (solo PoliticaIntegral)     │
│    └─► Publicar/Aprobar                                │
│         │                                                │
│         ▼                                                │
│  VIGENTE                                                │
│    │                                                     │
│    ├─► Revisión periódica (review_date)                 │
│    └─► Nueva versión → Obsoleta esta → Nueva BORRADOR  │
│                                                          │
│  OBSOLETO                                               │
│    └─► Solo lectura (historial)                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## CONFIGURACIÓN DE USUARIO

Guía para configurar el branding desde el frontend como usuario administrador.

### Acceso

**Ruta Frontend:** Admin Global → Tenants → [Seleccionar Tenant] → Tab "Branding"

**Permisos requeridos:** Superusuario global

### Elementos Configurables

#### 1. Logos

| Tipo | Uso | Especificaciones |
|------|-----|------------------|
| **Logo Principal** | Header, Login, Reportes | 400×120 px, PNG transparente |
| **Logo Blanco** | Header en modo oscuro | 400×120 px, PNG transparente |
| **Favicon** | Pestaña del navegador | 32×32 px, ICO o PNG |

**Subir Logo:**
1. Click en el área de upload o arrastre el archivo
2. Formatos soportados: PNG, JPG, SVG
3. Peso máximo: 500KB
4. Vista previa inmediata

**Eliminar Logo:**
1. Click en el botón X sobre el logo
2. El cambio se aplica al guardar

**Reemplazar Logo:**
1. Eliminar el logo actual (X)
2. Subir el nuevo archivo
3. Click en "Guardar"

#### 2. Colores Corporativos

| Color | Uso | Ejemplo |
|-------|-----|---------|
| **Primario** | Botones principales, links, marca | Azul corporativo |
| **Secundario** | Elementos secundarios, badges | Morado |
| **Acento** | Destacados, alertas, notificaciones | Verde |

**Cambiar Color:**
1. Click en el cuadro de color
2. Seleccionar con el picker o ingresar código HEX (#3B82F6)
3. Ver preview en tiempo real
4. Click en "Guardar"

**Generación automática de variantes:**
- El sistema genera automáticamente 10 tonos (50-900) para cada color
- Las variantes se usan en hover, disabled, backgrounds, etc.

#### 3. Nombre de Empresa

| Campo | Uso | Ejemplo |
|-------|-----|---------|
| **Nombre Completo** | Header, Reportes, Documentos | "Empresa Ejemplo S.A.S." |
| **Nombre Corto** | Sidebar, Espacios reducidos | "EE" |
| **Eslogan** | Login, Pie de página | "Innovación y calidad desde 1990" |

### Dónde se Aplican los Cambios

| Ubicación | Qué se muestra |
|-----------|----------------|
| **Header** | Logo (según tema claro/oscuro) + Nombre corto |
| **Sidebar** | Nombre corto |
| **Login** | Logo principal + Nombre completo + Eslogan |
| **Reportes PDF** | Logo principal + Nombre completo |
| **Vouchers** | Logo principal + Datos empresa |
| **Favicon** | Icono en pestaña del navegador |
| **Emails** | Logo principal en templates |

### Recomendaciones de Diseño

#### Logos

- **Fondo transparente:** Permite adaptarse a cualquier fondo
- **Horizontal:** Aspect ratio 3:1 o 4:1 funciona mejor
- **Legible:** El texto debe ser legible a 40px de altura
- **Dos versiones:** Una para fondos claros, otra para oscuros
- **Vectorial preferido:** SVG para mejor calidad en todas las resoluciones

#### Colores

- **Contraste:** El color primario debe tener buen contraste con blanco
- **Consistencia:** Usar los mismos colores de su marca existente
- **Accesibilidad:** Evitar colores muy claros para elementos interactivos
- **Prueba en ambos temas:** Verificar que funcionen en light y dark mode

### Preguntas Frecuentes

**¿Los cambios son inmediatos?**

Sí, los cambios se aplican inmediatamente en toda la aplicación sin necesidad de recargar. El sistema usa React Query con invalidación automática de caché.

**¿Puedo tener múltiples configuraciones?**

No, el branding está integrado directamente en el tenant. Para cambios estacionales, guarde las imágenes y colores previos antes de actualizarlos.

**¿Qué pasa si no subo logos?**

El sistema mostrará el nombre de la empresa en texto. Se recomienda siempre subir al menos el logo principal.

**¿Afecta el rendimiento subir logos grandes?**

Los logos se optimizan automáticamente en el backend, pero se recomienda no exceder 500KB. Logos más ligeros cargan más rápido.

---

## PERSONALIZACIÓN POR TENANT

Cada tenant tiene su propia configuración de branding completamente aislada.

### Arquitectura de Schemas

```
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  public schema (compartido)                             │
│  ├─ tenant (tabla de tenants con branding)              │
│  ├─ domain (dominios de cada tenant)                    │
│  └─ media/tenant_logos/ (archivos públicos)             │
│                                                          │
│  tenant1 schema (aislado)                               │
│  ├─ corporate_identity                                  │
│  ├─ corporate_value                                     │
│  ├─ politica_integral                                   │
│  └─ ... (todos los modelos de apps)                     │
│                                                          │
│  tenant2 schema (aislado)                               │
│  ├─ corporate_identity                                  │
│  ├─ corporate_value                                     │
│  └─ ...                                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Detección Automática de Tenant

**Middleware:** `TenantMiddleware` (django-tenants)

```python
# backend/apps/tenant/middleware.py

from django_tenants.middleware import TenantMainMiddleware

class TenantMiddleware(TenantMainMiddleware):
    """
    Middleware que detecta el tenant por el dominio del request.

    Flujo:
    1. Extrae hostname del request
    2. Busca Domain en public.domain
    3. Obtiene Tenant asociado
    4. Cambia search_path a schema del tenant
    5. Todas las queries posteriores usan ese schema
    """
    pass
```

**Ejemplo de request:**

```http
GET /api/tenant/branding/ HTTP/1.1
Host: empresa1.stratekaz.com
```

1. Middleware detecta `empresa1.stratekaz.com`
2. Busca en `public.domain` → encuentra `tenant_id=1`
3. Busca en `public.tenant` → `schema_name='tenant1'`
4. Ejecuta `SET search_path TO tenant1, public`
5. Endpoint retorna branding del tenant1

### Aislamiento de Datos

**Archivos de medios:**
- Los logos se almacenan en `media/tenant_logos/`
- Cada archivo incluye el schema_name en el nombre: `tenant1_logo.png`
- Los archivos son públicamente accesibles (sin filtro de tenant)

**Datos de BD:**
- Cada tenant tiene su propio schema PostgreSQL
- Las queries automáticamente filtran por schema actual
- No es posible acceder a datos de otro tenant sin cambiar schema manualmente

**Sesiones y autenticación:**
- JWT tokens incluyen información del tenant
- El middleware verifica que el token corresponda al tenant del dominio

---

## GUÍA DE IMPLEMENTACIÓN

### Setup Inicial (Backend)

**1. Migración a Modelo Integrado:**

El branding ahora está integrado en el modelo `Tenant`. Si tiene datos en `core.BrandingConfig`, migre:

```python
# Migration
from django.db import migrations

def migrate_branding_to_tenant(apps, schema_editor):
    Tenant = apps.get_model('tenant', 'Tenant')
    BrandingConfig = apps.get_model('core', 'BrandingConfig')

    for tenant in Tenant.objects.all():
        try:
            branding = BrandingConfig.objects.get(empresa__tenant=tenant, is_active=True)
            tenant.company_name = branding.company_name
            tenant.company_short_name = branding.company_short_name
            tenant.slogan = branding.slogan
            tenant.logo = branding.logo
            tenant.logo_white = branding.logo_white
            tenant.favicon = branding.favicon
            tenant.primary_color = branding.primary_color
            tenant.secondary_color = branding.secondary_color
            tenant.accent_color = branding.accent_color
            tenant.save()
        except BrandingConfig.DoesNotExist:
            pass

class Migration(migrations.Migration):
    dependencies = [
        ('tenant', '0003_tenant_extended_config_and_branding'),
    ]

    operations = [
        migrations.RunPython(migrate_branding_to_tenant),
    ]
```

**2. Configurar django-tenants:**

```python
# settings.py

INSTALLED_APPS = [
    'django_tenants',  # Debe estar primero
    'apps.tenant',
    # ... otras apps
]

MIDDLEWARE = [
    'apps.tenant.middleware.TenantMiddleware',  # Debe estar primero
    'django.middleware.security.SecurityMiddleware',
    # ... otros middlewares
]

TENANT_MODEL = 'tenant.Tenant'
TENANT_DOMAIN_MODEL = 'tenant.Domain'

# Apps compartidas (public schema)
SHARED_APPS = [
    'django_tenants',
    'apps.tenant',
    'django.contrib.contenttypes',
    'django.contrib.auth',
]

# Apps por tenant (cada schema)
TENANT_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'apps.gestion_estrategica.identidad',
    'apps.gestion_estrategica.configuracion',
    # ... todas las apps de negocio
]

DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']
```

**3. Crear Tenant Inicial:**

```bash
python manage.py create_initial_setup \
    --name "Empresa Demo" \
    --slug "demo" \
    --domain "demo.stratekaz.com" \
    --username "admin" \
    --email "admin@demo.com"
```

### Setup Inicial (Frontend)

**1. Configurar API Client:**

```typescript
// src/api/axios-config.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**2. Configurar React Query:**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});
```

**3. Inicializar en App.tsx:**

```tsx
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

function App() {
  // Aplicar tema dinámico
  useDynamicTheme();

  return (
    <QueryClientProvider client={queryClient}>
      {/* ... resto de la app */}
    </QueryClientProvider>
  );
}
```

### Testing

**Test de Branding Endpoint:**

```python
# tests/test_branding.py
from django.test import TestCase
from apps.tenant.models import Tenant, Domain

class BrandingAPITestCase(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            schema_name='test',
            name='Test Tenant',
            company_name='Test Company',
            primary_color='#FF0000'
        )
        Domain.objects.create(
            domain='test.localhost',
            tenant=self.tenant,
            is_primary=True
        )

    def test_get_branding(self):
        response = self.client.get(
            '/api/tenant/branding/',
            HTTP_HOST='test.localhost'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['company_name'], 'Test Company')
        self.assertEqual(response.json()['primary_color'], '#FF0000')
```

### Deployment

**Producción con múltiples subdominios:**

```nginx
# nginx.conf
server {
    listen 80;
    server_name *.stratekaz.com;

    location /media/ {
        alias /var/www/stratekaz/media/;
    }

    location /static/ {
        alias /var/www/stratekaz/static/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## RESUMEN TÉCNICO

### Stack Tecnológico

**Backend:**
- Django 4.x + Django REST Framework
- django-tenants (multi-tenancy)
- PostgreSQL (schemas)
- Pillow (procesamiento de imágenes)

**Frontend:**
- React 18 + TypeScript 5
- TanStack Query v5 (estado del servidor)
- Tailwind CSS (estilos)
- Vite (bundler)

### Convenciones

**Archivos:**
- Backend: `snake_case.py`
- Frontend: `PascalCase.tsx` (componentes), `camelCase.ts` (utils)

**Nomenclatura:**
- Modelos: `PascalCase`
- Campos DB: `snake_case`
- Props/Hooks: `camelCase`
- Tipos TS: `PascalCase`

### Estructura de Archivos

```
backend/
├── apps/
│   ├── tenant/
│   │   ├── models.py           # Tenant con branding integrado
│   │   ├── serializers.py      # TenantBrandingSerializer
│   │   ├── views.py            # TenantViewSet
│   │   └── middleware.py       # TenantMiddleware
│   └── gestion_estrategica/
│       └── identidad/
│           ├── models.py       # CorporateIdentity, Políticas
│           ├── serializers.py
│           └── views.py

frontend/
├── src/
│   ├── hooks/
│   │   ├── useBrandingConfig.ts
│   │   └── useDynamicTheme.ts
│   ├── lib/
│   │   └── colors.ts           # generateColorScale
│   └── features/
│       └── gestion-estrategica/
│           ├── components/
│           │   ├── IdentidadTab.tsx
│           │   └── PoliticasManager.tsx
│           └── hooks/
│               └── useStrategic.ts
```

---

## CONCLUSIONES

El **Sistema de Branding Dinámico e Identidad Corporativa** proporciona una solución completa y escalable para:

1. **Personalización visual por tenant:** Logos, colores, nombres
2. **Identidad organizacional:** Misión, visión, valores
3. **Gestión de políticas:** Versionamiento, workflow, firma digital
4. **Multi-tenancy seguro:** Aislamiento completo mediante schemas
5. **UX moderna:** Cambios en tiempo real, preview inmediato
6. **Cumplimiento normativo:** ISO 9001, 14001, 45001

**Ventajas clave:**
- Sin recompilación para cambios de branding
- Escalable a miles de tenants
- Código reutilizable y mantenible
- Performance optimizado con React Query
- Accesibilidad y responsive design

---

**Documento generado:** 2026-02-06
**Versión:** 3.0 (Consolidado)
**Sistema:** StrateKaz - Sistema de Gestión Integral
