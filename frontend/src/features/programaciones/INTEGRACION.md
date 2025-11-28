# Guía de Integración - Módulo Programaciones

Esta guía te ayudará a integrar el módulo de Programaciones en tu aplicación.

## 📋 Checklist de Integración

### 1. Verificar Dependencias

Todas las dependencias ya están instaladas en el proyecto. No se requiere instalar paquetes adicionales.

**Dependencias utilizadas:**
```json
{
  "@tanstack/react-query": "^5.14.0",
  "react-hook-form": "^7.49.0",
  "react-hot-toast": "^2.4.1",
  "@hookform/resolvers": "^3.3.3",
  "zod": "^3.22.4",
  "date-fns": "^3.0.0",
  "lucide-react": "^0.294.0"
}
```

### 2. Configurar Router

Agregar la ruta del módulo en tu archivo de rutas principal:

```typescript
// src/App.tsx o tu archivo de rutas
import { ProgramacionesPage } from '@/features/programaciones';

function AppRoutes() {
  return (
    <Routes>
      {/* ... otras rutas ... */}

      {/* Ruta del módulo Programaciones */}
      <Route path="/programaciones" element={<ProgramacionesPage />} />

      {/* ... más rutas ... */}
    </Routes>
  );
}
```

### 3. Agregar al Menú de Navegación

Agregar enlace en tu sidebar o menú principal:

```typescript
// Ejemplo con lucide-react icons
import { Calendar } from 'lucide-react';

const menuItems = [
  // ... otros items ...
  {
    name: 'Programaciones',
    href: '/programaciones',
    icon: Calendar,
    permission: 'ver_programaciones', // Ajustar según tu sistema de permisos
  },
];
```

### 4. Configurar Permisos (Opcional)

Si usas un sistema de permisos personalizado, ajusta la lógica en:

```typescript
// frontend/src/features/programaciones/pages/ProgramacionesPage.tsx
// Línea ~56

// CAMBIAR ESTO:
const canManage = ['lider_com_econorte', 'gerente', 'superadmin', 'coordinador_recoleccion'].includes(
  user?.cargo_code || ''
);

// POR TU LÓGICA DE PERMISOS:
const canManage = user?.permissions.includes('gestionar_programaciones');
```

### 5. Verificar Rutas del Backend

El módulo espera que el backend tenga las siguientes rutas configuradas:

```
Base URL: /programaciones/

CRUD:
- GET    /programaciones/programaciones/          # Lista con filtros
- GET    /programaciones/programaciones/:id/      # Detalle
- POST   /programaciones/programaciones/          # Crear
- PATCH  /programaciones/programaciones/:id/      # Actualizar
- DELETE /programaciones/programaciones/:id/      # Eliminar

Acciones:
- POST   /programaciones/programaciones/:id/asignar-recolector/
- POST   /programaciones/programaciones/:id/cambiar-estado/
- POST   /programaciones/programaciones/:id/reprogramar/
- POST   /programaciones/programaciones/:id/cancelar/
- POST   /programaciones/programaciones/:id/iniciar-ruta/
- POST   /programaciones/programaciones/:id/completar/

Consultas:
- GET    /programaciones/programaciones/estadisticas/
- GET    /programaciones/programaciones/:id/historial/
- GET    /programaciones/recolectores/
- GET    /programaciones/recolectores/disponibles/?fecha=YYYY-MM-DD
- GET    /proveedores/proveedores/?is_active=true
- GET    /proveedores/proveedores/unidades-negocio/
```

### 6. Verificar Axios Instance

El módulo usa `axiosInstance` de `@/api/axios-config`. Verifica que esté configurado:

```typescript
// src/api/axios-config.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // O desde tu store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
```

## 🎨 Personalización de UI

### Colores de Estados

Si quieres personalizar los colores de los badges de estado:

```typescript
// frontend/src/features/programaciones/components/ProgramacionesTable.tsx
// Línea ~45

const getEstadoBadge = (estado: string) => {
  const badgeMap = {
    PENDIENTE: { variant: 'gray', label: 'Pendiente' },
    ASIGNADA: { variant: 'info', label: 'Asignada' },
    // Modificar aquí según tu diseño
  };
  // ...
};
```

### Tamaños de Página

Para cambiar el tamaño de página predeterminado:

```typescript
// frontend/src/features/programaciones/pages/ProgramacionesPage.tsx
// Línea ~42

const [filters, setFilters] = useState<ProgramacionFilters>({
  // ...
  page_size: 20, // Cambiar aquí (10, 20, 50, 100)
});
```

## 🔧 Configuración Avanzada

### Deshabilitar Vista Calendario

Si no necesitas la vista de calendario:

```typescript
// frontend/src/features/programaciones/pages/ProgramacionesPage.tsx
// Línea ~245

// Comentar o remover el toggle de vista:
{/* <div className="flex items-center gap-1 ...">
  <Button variant={vistaActual === 'tabla' ? 'primary' : 'outline'} ...>
    <List className="h-4 w-4" />
  </Button>
  <Button variant={vistaActual === 'calendario' ? 'primary' : 'outline'} ...>
    <Calendar className="h-4 w-4" />
  </Button>
</div> */}

// Y establecer vista fija:
const [vistaActual] = useState<'tabla' | 'calendario'>('tabla');
```

### Campos Personalizados

Si tu backend tiene campos adicionales, agrégalos en los tipos:

```typescript
// frontend/src/features/programaciones/types/programacion.types.ts

export interface Programacion {
  // ... campos existentes ...

  // TUS CAMPOS PERSONALIZADOS:
  campo_personalizado?: string;
  otro_campo?: number;
}
```

## 📱 Responsive Design

El módulo está optimizado para mobile/tablet/desktop. Puntos de quiebre:

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

Para ajustar el grid de filtros:

```typescript
// Buscar clases como: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
// Cambiar a tu preferencia
```

## 🧪 Testing (Opcional)

Si usas tests, aquí un ejemplo básico:

```typescript
// src/features/programaciones/__tests__/ProgramacionesPage.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ProgramacionesPage } from '../pages/ProgramacionesPage';

const queryClient = new QueryClient();

describe('ProgramacionesPage', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ProgramacionesPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Programaciones/i)).toBeInTheDocument();
  });
});
```

## 🚀 Verificación Final

Antes de considerar completada la integración, verifica:

- [ ] La ruta `/programaciones` carga correctamente
- [ ] Los filtros funcionan
- [ ] Se pueden crear programaciones
- [ ] Se puede asignar recolector
- [ ] Se puede cambiar estado
- [ ] Se puede reprogramar
- [ ] La vista calendario funciona
- [ ] Los toasts de notificación aparecen
- [ ] Los permisos funcionan correctamente
- [ ] El diseño es responsive
- [ ] No hay errores en consola

## 🐛 Problemas Comunes

### Error: "Cannot read property 'results' of undefined"

**Causa:** El backend no está devolviendo el formato esperado.

**Solución:**
```typescript
// Verificar que el backend devuelva:
{
  "count": 100,
  "next": "...",
  "previous": "...",
  "results": [...]
}
```

### Error: "Network Error"

**Causa:** CORS o URL del backend incorrecta.

**Solución:**
```typescript
// Verificar en .env
VITE_API_URL=http://localhost:8000/api

// O configurar CORS en el backend
```

### Los badges no tienen color

**Causa:** Falta configuración de Tailwind para colores personalizados.

**Solución:** Verificar que `tailwind.config.js` tenga los colores necesarios.

### Las fechas se muestran incorrectas

**Causa:** Zona horaria del servidor diferente.

**Solución:**
```typescript
// Usar date-fns con zona horaria explícita
import { formatInTimeZone } from 'date-fns-tz';
```

## 📞 Soporte

Si encuentras algún problema:

1. Revisa esta guía
2. Revisa el README.md del módulo
3. Verifica la consola del navegador
4. Verifica la consola del backend
5. Revisa los tipos TypeScript

---

**¡Listo para usar!** 🎉

El módulo está completamente funcional y listo para producción.
