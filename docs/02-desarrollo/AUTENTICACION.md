# Sistema de Autenticación

El sistema implementa autenticación basada en JWT (JSON Web Tokens).

## Configuración JWT

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Access Token** | 60 minutos | Token de acceso corto |
| **Refresh Token** | 7 días | Token de renovación largo |
| **Algoritmo** | HS256 | Firma simétrica |
| **Blacklist** | Habilitado | Tokens revocados |

---

## Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login/` | POST | Login (obtener tokens) |
| `/api/auth/refresh/` | POST | Renovar access token |
| `/api/auth/logout/` | POST | Logout (blacklist token) |
| `/api/auth/me/` | GET | Usuario actual |
| `/api/auth/change-password/` | POST | Cambiar contraseña |

---

## Flujo de Autenticación

```
1. Usuario envía credenciales
   POST /api/auth/login/
   { "email": "...", "password": "..." }

2. Backend valida y retorna tokens
   {
     "access": "eyJ...",
     "refresh": "eyJ...",
     "user": { "id": 1, "email": "...", ... }
   }

3. Frontend almacena tokens
   localStorage.setItem('accessToken', access)
   localStorage.setItem('refreshToken', refresh)

4. Requests autenticados
   Authorization: Bearer eyJ...

5. Token expirado → Renovar
   POST /api/auth/refresh/
   { "refresh": "eyJ..." }

6. Logout → Blacklist
   POST /api/auth/logout/
   { "refresh": "eyJ..." }
```

---

## Configuración Django

```python
# settings.py

INSTALLED_APPS = [
    ...
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

---

## Frontend - Axios Interceptor

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Agregar token a requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Renovar token si expira
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/auth/refresh/', {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh falló, redirigir a login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
```

---

## Hook useAuth

```typescript
// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/api/client';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  cargo?: { id: number; nombre: string };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await apiClient.post('/api/auth/login/', {
          email,
          password,
        });

        const { access, refresh, user } = response.data;

        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);

        set({ user, isAuthenticated: true });
      },

      logout: async () => {
        try {
          const refresh = localStorage.getItem('refreshToken');
          await apiClient.post('/api/auth/logout/', { refresh });
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });
        }
      },

      refreshUser: async () => {
        const response = await apiClient.get('/api/auth/me/');
        set({ user: response.data });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

---

## Protección de Rutas

```tsx
// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredPermission
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## Seguridad

### Buenas Prácticas

- Tokens almacenados en localStorage (considerar httpOnly cookies para producción)
- Refresh token rotado después de cada uso
- Tokens revocados agregados a blacklist
- HTTPS obligatorio en producción

### Headers de Seguridad

```python
# settings.py (producción)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
```
