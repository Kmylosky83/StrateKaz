# Guia de Versionamiento - StrateKaz

## Resumen

StrateKaz utiliza **Semantic Versioning (SemVer)** con una arquitectura de **Single Source of Truth** donde la version se define en un solo lugar (`package.json`) y se propaga automaticamente a toda la aplicacion.

---

## Arquitectura de Versionamiento

```
package.json (version: "3.5.1")  <-- UNICA FUENTE DE VERDAD
       |
       v (build time via Vite define)
constants/brand.ts (APP_VERSION)
       |
       +---> SplashScreen.tsx (pantalla de carga)
       +---> Sidebar.tsx (pie del menu)
       +---> LoginPage.tsx (footer del login)
       +---> PWA Manifest (via backend)
       +---> BrandingConfig.app_version (BD, solo lectura)
```

---

## Archivos Clave

| Archivo | Proposito |
|---------|-----------|
| `frontend/package.json` | **Fuente de verdad** - Definir version aqui |
| `frontend/vite.config.ts` | Inyecta version en build time |
| `frontend/src/constants/brand.ts` | Exporta `APP_VERSION` y constantes de marca |

---

## Como Cambiar la Version

### Opcion 1: Usando npm version (Recomendado)

```powershell
cd frontend

# Incrementar version patch: 3.5.0 -> 3.5.1
npm version patch

# Incrementar version minor: 3.5.0 -> 3.6.0
npm version minor

# Incrementar version major: 3.5.0 -> 4.0.0
npm version major
```

### Opcion 2: Edicion Manual

1. Abrir `frontend/package.json`
2. Cambiar el campo `"version"`:

```json
{
  "name": "stratekaz-frontend",
  "version": "3.6.0",  // <-- Cambiar aqui
  ...
}
```

3. Guardar y reconstruir la aplicacion

---

## Semantic Versioning (SemVer)

Formato: `MAJOR.MINOR.PATCH`

| Tipo | Cuando incrementar | Ejemplo |
|------|-------------------|---------|
| **MAJOR** | Cambios incompatibles con versiones anteriores | 3.0.0 -> 4.0.0 |
| **MINOR** | Nueva funcionalidad compatible hacia atras | 3.5.0 -> 3.6.0 |
| **PATCH** | Correccion de bugs compatible hacia atras | 3.5.0 -> 3.5.1 |

### Ejemplos Practicos

| Cambio | Tipo | Nueva Version |
|--------|------|---------------|
| Fix: Boton no funcionaba | PATCH | 3.5.0 -> 3.5.1 |
| Feature: Nuevo modulo de reportes | MINOR | 3.5.1 -> 3.6.0 |
| Refactor: Nueva arquitectura de BD | MAJOR | 3.6.0 -> 4.0.0 |

---

## Constantes de Marca (brand.ts)

El archivo `frontend/src/constants/brand.ts` contiene todas las constantes de identidad de marca:

```typescript
// Version (inyectada desde package.json)
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '3.5.0';

// Identidad de marca FIJA
export const BRAND = {
  name: 'StrateKaz',
  slogan: 'Sistema de Gestion Integral',
  website: 'https://www.stratekaz.com',
  copyright: 'Kmylosky',
  logos: {
    light: '/logo-dark.png',
    dark: '/logo-light.png',
  },
} as const;
```

### Uso en Componentes

```typescript
import { BRAND, APP_VERSION } from '@/constants/brand';

// En SplashScreen
<p>v{APP_VERSION}</p>

// En Footer
<a href={BRAND.website}>Powered by {BRAND.name}</a>
```

---

## Diferencia: Branding Fijo vs Dinamico

| Elemento | Tipo | Fuente |
|----------|------|--------|
| Logo en SplashScreen | **FIJO** | `constants/brand.ts` |
| Slogan en SplashScreen | **FIJO** | `constants/brand.ts` |
| Version en UI | **FIJO** | `package.json` via Vite |
| Footer "Powered by" | **FIJO** | `constants/brand.ts` |
| Logo en Header | **DINAMICO** | `useBrandingConfig()` desde BD |
| Nombre empresa | **DINAMICO** | `useBrandingConfig()` desde BD |
| Colores del tema | **DINAMICO** | `useDynamicTheme()` desde BD |

**Razon:** El branding fijo es la identidad del SOFTWARE (StrateKaz), mientras que el branding dinamico es la personalizacion del CLIENTE (logo de su empresa).

---

## Configuracion Tecnica

### vite.config.ts

```typescript
import pkg from './package.json'

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  // ...
})
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  },
  "include": ["vite.config.ts", "package.json"]
}
```

---

## Checklist para Release

- [ ] Actualizar version en `package.json`
- [ ] Actualizar `README.md` (tabla de info y changelog)
- [ ] Actualizar `PLAN_CIERRE_BRECHAS.md` si aplica
- [ ] Hacer build de produccion: `npm run build`
- [ ] Verificar que la version aparece en:
  - [ ] SplashScreen (esquina inferior)
  - [ ] Sidebar (pie del menu)
- [ ] Crear tag en Git: `git tag v3.6.0`
- [ ] Push del tag: `git push origin v3.6.0`

---

## Comandos Utiles

```powershell
# Ver version actual
npm pkg get version

# Ver todas las versiones de dependencias
npm list --depth=0

# Crear build con version visible
npm run build && echo "Build completado: v$(npm pkg get version)"
```

---

## Troubleshooting

### La version no se actualiza en la UI

1. Asegurar que `vite.config.ts` tiene el `define` correcto
2. Reiniciar el servidor de desarrollo: `npm run dev`
3. Limpiar cache del navegador (Ctrl+Shift+R)

### Error al importar package.json en vite.config.ts

Verificar que `tsconfig.node.json` incluye:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  },
  "include": ["vite.config.ts", "package.json"]
}
```

---

**Ultima actualizacion:** 19 Enero 2026

---

## IMPORTANTE: Login Page siempre usa APP_VERSION

El LoginPage debe usar APP_VERSION desde constants/brand.ts, NO desde useBrandingConfig().appVersion.
