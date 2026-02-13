import axios from 'axios';
import { API_URL } from '@/utils/constants';

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

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para refresh token automático
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos reintentado aún
    // IMPORTANTE: No intentar refresh si estamos en /login (evita loops con tokens viejos)
    const isLoginPage = window.location.pathname.startsWith('/login');
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginPage) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/tenant/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access, refresh: newRefreshToken } = response.data;
        localStorage.setItem('access_token', access);

        // Guardar nuevo refresh token (sliding expiration)
        // Con ROTATE_REFRESH_TOKENS=True, el servidor envía un nuevo refresh token
        // que extiende la sesión otros 7 días desde este momento
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        // Reintentar la petición original con el nuevo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Solo redirigir si NO estamos ya en login (evitar loop)
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
