# Grasas y Huesos del Norte - Frontend

Sistema Integrado de Gestión ERP para recolección de ACU (Aceite de Cocina Usado).

## Stack Tecnológico

- React 18.2.0 + TypeScript 5.3.0
- Vite 5.0.0 (Build tool, puerto 3010)
- Tailwind CSS 3.4.0 (Estilos con Design System)
- Zustand 4.4.7 (State management)
- React Router DOM 6.21.0 (Routing)
- TanStack Query 5.14.0 (Data fetching)

## Instalación

```bash
npm install
npm run dev  # Puerto 3010
```

## Estructura Creada

✅ 27 archivos TypeScript/TSX  
✅ Design System completo (Button, Card, Badge, Input, Spinner)  
✅ Layouts (Sidebar colapsable, Header, Footer)  
✅ Routing con rutas protegidas  
✅ State management (Auth, Theme)  
✅ API client con refresh token automático  
✅ Páginas iniciales (Login, Dashboard, 404)  
✅ Dark mode funcional  

## Componentes Principales

- **Sidebar:** Colapsable con tooltips, filtrado por roles
- **Header:** Toggle sidebar, notificaciones, tema, perfil
- **LoginPage:** Formulario con validación Zod
- **DashboardPage:** Vista general con estadísticas

## Próximos Pasos

Implementar módulos de:
1. Proveedores
2. Recolecciones
3. Lotes de Planta
4. Liquidaciones
5. Certificados
6. Reportes

© 2025 Grasas y Huesos del Norte S.A.S. | Powered by StrateKaz
