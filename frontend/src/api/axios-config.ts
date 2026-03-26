import axios from 'axios';
import { API_URL } from '@/utils/constants';
import { useAuthStore, isImpersonationExpired } from '@/store/authStore';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ── Request Interceptor ──────────────────────────────────────────────────────
// Agrega Authorization, X-Tenant-ID y X-Impersonated-User-ID a cada request.
// Lee SIEMPRE desde localStorage (fuente de verdad para tokens y tenant).
axiosInstance.interceptors.request.use(
  (config) => {
    // FormData: eliminar Content-Type para que el browser genere el boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // JWT token
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Tenant ID — validar que sea un número (evita enviar "null" como string)
    const rawTenantId = localStorage.getItem('current_tenant_id');
    const tenantId = rawTenantId ? Number(rawTenantId) : null;
    if (tenantId && !isNaN(tenantId) && config.headers) {
      config.headers['X-Tenant-ID'] = String(tenantId);
    }

    // Impersonación
    const impersonatedUserId = localStorage.getItem('impersonated_user_id');
    if (impersonatedUserId && config.headers) {
      if (isImpersonationExpired()) {
        localStorage.removeItem('impersonated_user_id');
        localStorage.removeItem('impersonation_started_at');
        try {
          useAuthStore.getState().stopUserImpersonation();
        } catch {
          /* Store puede no estar inicializado aún */
        }
      } else {
        config.headers['X-Impersonated-User-ID'] = impersonatedUserId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Refresh Token Queue ─────────────────────────────────────────────────────
// Serializa refreshes: solo el PRIMER 401 dispara refresh, los demás esperan.
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// ── Cross-Tab Token Sync ────────────────────────────────────────────────────
// Cuando otra pestaña hace logout (access_token → null), sincronizar.
window.addEventListener('storage', (event) => {
  if (event.key === 'access_token' && event.newValue === null) {
    useAuthStore.getState().forceLogout();
  }
});

// ── Proactive Token Refresh ──────────────────────────────────────────────────
// Renueva el access token 5 min antes de expirar, evitando 401s por inactividad.
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function getTokenExpirationMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) return payload.exp * 1000 - Date.now();
  } catch {
    /* Token malformado */
  }
  return null;
}

function scheduleProactiveRefresh(): void {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  const token = localStorage.getItem('access_token');
  if (!token) return;

  const msUntilExpiry = getTokenExpirationMs(token);
  if (!msUntilExpiry || msUntilExpiry <= 0) return;

  const refreshBeforeMs = Math.min(5 * 60 * 1000, msUntilExpiry / 2);
  const refreshInMs = Math.max(msUntilExpiry - refreshBeforeMs, 10_000);

  proactiveRefreshTimer = setTimeout(async () => {
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) return;

    const publicPaths = ['/login', '/setup-password', '/reset-password', '/forgot-password'];
    if (publicPaths.some((p) => window.location.pathname.startsWith(p))) return;

    try {
      await doRefreshToken();
      scheduleProactiveRefresh();
    } catch {
      // No logout — el interceptor de 401 se encargará. Reintentar en 60s.
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
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
      scheduleProactiveRefresh();
      return access;
    });
}

// ── Response Interceptor ─────────────────────────────────────────────────────
// En 401: intenta refresh UNA vez. Si falla, PROPAGA el error sin hacer logout.
// El logout lo maneja AdaptiveLayout después de agotar reintentos (single gatekeeper).
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const hasTokenInStorage = !!localStorage.getItem('access_token');
    const hasRefreshToken = !!localStorage.getItem('refresh_token');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      hasTokenInStorage &&
      hasRefreshToken
    ) {
      originalRequest._retry = true;

      try {
        // Si ya hay un refresh en curso, esperar su resultado
        if (isRefreshing && refreshPromise) {
          const newToken = await refreshPromise;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosInstance(originalRequest);
        }

        // Cross-tab: si otra pestaña ya refrescó, usar ese token
        const currentStoredToken = localStorage.getItem('access_token');
        const failedToken = originalRequest.headers?.Authorization?.replace('Bearer ', '');
        if (currentStoredToken && failedToken && currentStoredToken !== failedToken) {
          originalRequest.headers.Authorization = `Bearer ${currentStoredToken}`;
          return axiosInstance(originalRequest);
        }

        // Primer 401 → iniciar refresh
        isRefreshing = true;
        refreshPromise = doRefreshToken();
        const newToken = await refreshPromise;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh falló — NO hacer forceLogout aquí.
        // Propagar el error para que el caller lo maneje.
        // AdaptiveLayout es el único gatekeeper de logout automático.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
