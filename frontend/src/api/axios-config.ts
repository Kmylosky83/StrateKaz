import axios from 'axios';
import { API_URL } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor para agregar token JWT y tenant ID a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // En desarrollo, agregar X-Tenant-ID si hay un tenant seleccionado
    const tenantId = localStorage.getItem('current_tenant_id');
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    // Impersonación: informar al backend cuál es el usuario efectivo
    // Los endpoints de portal (mi-empresa, mi-portal) usan esto para
    // devolver datos del usuario impersonado en vez del superadmin
    const impersonatedUserId = localStorage.getItem('impersonated_user_id');
    if (impersonatedUserId && config.headers) {
      config.headers['X-Impersonated-User-ID'] = impersonatedUserId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Refresh Token Queue ─────────────────────────────────────────────────────
// Previene race conditions cuando múltiples requests obtienen 401 simultáneamente.
// Solo el PRIMER 401 dispara el refresh; los demás esperan el resultado.
// Cross-tab: escucha cambios en localStorage para sincronizar tokens entre pestañas.
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// ── Cross-Tab Token Sync ────────────────────────────────────────────────────
// Cuando otra pestaña refresca el token, actualiza el token en memoria sin logout.
// Cuando otra pestaña hace logout, sincroniza el logout en todas las pestañas.
window.addEventListener('storage', (event) => {
  if (event.key === 'access_token' && event.newValue === null) {
    // Otra pestaña hizo logout → sincronizar
    useAuthStore.getState().forceLogout();
  }
});

// ── Proactive Token Refresh ──────────────────────────────────────────────────
// Renueva el access token ANTES de que expire, evitando 401s por inactividad.
// Se programa cada vez que se obtiene un nuevo token (login, refresh).
// Refresca 5 minutos antes de la expiración (o a la mitad si es < 10 min).
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function getTokenExpirationMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      return payload.exp * 1000 - Date.now();
    }
  } catch {
    // Token malformado — no programar refresh
  }
  return null;
}

function scheduleProactiveRefresh(): void {
  // Limpiar timer anterior
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  const token = localStorage.getItem('access_token');
  if (!token) return;

  const msUntilExpiry = getTokenExpirationMs(token);
  if (!msUntilExpiry || msUntilExpiry <= 0) return;

  // Refrescar 5 minutos antes de expirar, o a la mitad del tiempo restante si queda poco
  const refreshBeforeMs = Math.min(5 * 60 * 1000, msUntilExpiry / 2);
  const refreshInMs = Math.max(msUntilExpiry - refreshBeforeMs, 10_000); // Mínimo 10 segundos

  proactiveRefreshTimer = setTimeout(async () => {
    // Solo refrescar si aún hay token y no estamos en página pública
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) return;

    const publicPaths = ['/login', '/setup-password', '/reset-password', '/forgot-password'];
    const isPublicPage = publicPaths.some((p) => window.location.pathname.startsWith(p));
    if (isPublicPage) return;

    try {
      await doRefreshToken();
      // Programar siguiente refresh proactivo con el nuevo token
      scheduleProactiveRefresh();
    } catch {
      // Si falla, no hacer logout — el interceptor de 401 se encargará cuando
      // el usuario haga su próxima acción. Reintentar en 60 segundos.
      proactiveRefreshTimer = setTimeout(scheduleProactiveRefresh, 60_000);
    }
  }, refreshInMs);
}

// Programar refresh proactivo al cargar si ya hay sesión activa
scheduleProactiveRefresh();

function doRefreshToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token available'));
  }

  return axios
    .post(`${API_URL}/tenant/auth/refresh/`, { refresh: refreshToken })
    .then((response) => {
      const { access, refresh: newRefreshToken } = response.data;
      localStorage.setItem('access_token', access);

      // Guardar nuevo refresh token (sliding expiration)
      // Con ROTATE_REFRESH_TOKENS=True, el servidor envía un nuevo refresh token
      // que extiende la sesión otros 7 días desde este momento
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }

      // Reprogramar refresh proactivo con el nuevo token
      scheduleProactiveRefresh();

      return access;
    });
}

// Interceptor para refresh token automático con cola serializada
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos reintentado aún
    // IMPORTANTE: No intentar refresh en páginas públicas (evita loops/logouts inesperados)
    const publicPaths = ['/login', '/setup-password', '/reset-password', '/forgot-password'];
    const isPublicPage = publicPaths.some((p) => window.location.pathname.startsWith(p));

    // Proteger contra 401 espúreos durante recarga de página (SW update, F5).
    // Si no hay token en localStorage, es un request que salió antes de que
    // Zustand rehidratara — no hacer refresh ni logout, dejar que ProtectedRoute maneje.
    const hasTokenInStorage = !!localStorage.getItem('access_token');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicPage &&
      hasTokenInStorage
    ) {
      originalRequest._retry = true;

      try {
        // Si ya hay un refresh en curso, esperar su resultado en vez de disparar otro
        if (isRefreshing && refreshPromise) {
          const newToken = await refreshPromise;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosInstance(originalRequest);
        }

        // Cross-tab: verificar si otra pestaña ya refrescó el token
        // Si el token en localStorage es diferente al que causó el 401,
        // otra pestaña ya lo actualizó → usar ese token sin hacer refresh
        const currentStoredToken = localStorage.getItem('access_token');
        const failedToken = originalRequest.headers?.Authorization?.replace('Bearer ', '');
        if (currentStoredToken && failedToken && currentStoredToken !== failedToken) {
          // Otra pestaña ya refrescó → reintentar con el token actualizado
          originalRequest.headers.Authorization = `Bearer ${currentStoredToken}`;
          return axiosInstance(originalRequest);
        }

        // Primer request que detecta 401 → iniciar refresh
        isRefreshing = true;
        refreshPromise = doRefreshToken();

        const newToken = await refreshPromise;

        // Reintentar la petición original con el nuevo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Solo hacer logout si el refresh REALMENTE falló (no error de red transitorio)
        const refreshStatus = (refreshError as { response?: { status?: number } })?.response
          ?.status;

        if (refreshStatus === 401 || refreshStatus === 400) {
          // Antes de logout, verificar una vez más si otra pestaña ya refrescó
          const latestToken = localStorage.getItem('access_token');
          const failedToken = originalRequest.headers?.Authorization?.replace('Bearer ', '');
          if (latestToken && failedToken && latestToken !== failedToken) {
            // Otra pestaña refrescó durante nuestro intento → reintentar
            originalRequest.headers.Authorization = `Bearer ${latestToken}`;
            return axiosInstance(originalRequest);
          }

          // Token realmente inválido → logout
          // forceLogout limpia localStorage + Zustand + RQ cache.
          // ProtectedRoute detecta ausencia de tokens y redirige a /login via React Router.
          // NO usar window.location.href: causa hard reload que borra estado y hace loop.
          useAuthStore.getState().forceLogout();
        }
        // Para otros errores (network, 5xx), no hacer logout — el usuario puede reintentar
        return Promise.reject(refreshError);
      } finally {
        // Liberar la cola para que futuros 401 puedan reintentar
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
