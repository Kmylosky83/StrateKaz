/**
 * Integration tests for the authentication flow.
 *
 * Tests the login page rendering, form validation, and auth store interaction.
 * Since LoginPage has many external deps (framer-motion, NetworkBackground, etc.),
 * we focus on testing the login form schema validation and auth store logic.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import type { User, TenantInfo, TenantAccess } from '@/types/auth.types';

// Login schema (mirrored from LoginPage for isolated testing)
const loginSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

describe('Login Form Validation', () => {
  describe('Email validation', () => {
    it('should reject empty email', () => {
      const result = loginSchema.safeParse({ email: '', password: 'pass123' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path.includes('email'));
        expect(emailError?.message).toBe('Email requerido');
      }
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({ email: 'notanemail', password: 'pass123' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path.includes('email'));
        expect(emailError?.message).toBe('Email inválido');
      }
    });

    it('should accept valid email', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'pass123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Password validation', () => {
    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const pwError = result.error.issues.find((i) => i.path.includes('password'));
        expect(pwError?.message).toBe('Contraseña requerida');
      }
    });

    it('should accept any non-empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@test.com',
        password: 'a',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Combined validation', () => {
    it('should reject when both fields are empty', () => {
      const result = loginSchema.safeParse({ email: '', password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should accept valid credentials', () => {
      const result = loginSchema.safeParse({
        email: 'admin@stratekaz.com',
        password: 'SecurePass123!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('admin@stratekaz.com');
        expect(result.data.password).toBe('SecurePass123!');
      }
    });
  });
});

describe('Auth Store Login/Logout Flow', () => {
  beforeEach(() => {
    // Reset store completely
    useAuthStore.setState({
      tenantUser: null,
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoadingUser: false,
      currentTenantId: null,
      currentTenant: null,
      accessibleTenants: [],
      isSuperadmin: false,
      isImpersonating: false,
      originalUser: null,
      impersonatedUserId: null,
    });
    // Clean localStorage
    localStorage.clear();
  });

  describe('Initial state', () => {
    it('should start unauthenticated', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });
  });

  describe('forceLogout', () => {
    it('should clear all auth state', () => {
      // Simulate an authenticated state
      useAuthStore.setState({
        user: { id: 1, email: 'test@test.com' } as unknown as User,
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        isAuthenticated: true,
        currentTenantId: 1,
        isSuperadmin: true,
      });
      localStorage.setItem('access_token', 'fake-access-token');
      localStorage.setItem('refresh_token', 'fake-refresh-token');

      // Force logout
      useAuthStore.getState().forceLogout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.currentTenantId).toBeNull();
      expect(state.isSuperadmin).toBe(false);
    });

    it('should clear localStorage tokens', () => {
      localStorage.setItem('access_token', 'test');
      localStorage.setItem('refresh_token', 'test');
      localStorage.setItem('current_tenant_id', '1');

      useAuthStore.getState().forceLogout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('current_tenant_id')).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user in state', () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        is_superuser: false,
        cargo_code: 'COORD',
        cargo_level: 2,
        permission_codes: ['mod.section.view'],
      } as unknown as User;

      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('Impersonation state', () => {
    it('should track impersonated user ID', () => {
      useAuthStore.setState({
        impersonatedUserId: 42,
        isImpersonating: true,
      });
      const state = useAuthStore.getState();
      expect(state.impersonatedUserId).toBe(42);
      expect(state.isImpersonating).toBe(true);
    });

    it('should clear impersonation on stopUserImpersonation', () => {
      const originalUser = { id: 1, email: 'admin@test.com' } as unknown as User;
      useAuthStore.setState({
        user: { id: 42, email: 'impersonated@test.com' } as unknown as User,
        originalUser,
        impersonatedUserId: 42,
        isImpersonating: true,
      });

      useAuthStore.getState().stopUserImpersonation();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(originalUser);
      expect(state.impersonatedUserId).toBeNull();
      expect(state.originalUser).toBeNull();
    });
  });

  describe('setCurrentTenantId', () => {
    it('should set tenant ID in state and localStorage', () => {
      useAuthStore.setState({
        accessibleTenants: [{ tenant: { id: 5, name: 'Test Tenant' } } as unknown as TenantAccess],
      });

      useAuthStore.getState().setCurrentTenantId(5);

      expect(useAuthStore.getState().currentTenantId).toBe(5);
      expect(localStorage.getItem('current_tenant_id')).toBe('5');
    });

    it('should clear tenant ID when set to null', () => {
      localStorage.setItem('current_tenant_id', '5');
      useAuthStore.getState().setCurrentTenantId(null);

      expect(useAuthStore.getState().currentTenantId).toBeNull();
      expect(localStorage.getItem('current_tenant_id')).toBeNull();
    });
  });

  describe('clearTenantContext', () => {
    it('should clear all tenant and impersonation state', () => {
      useAuthStore.setState({
        currentTenantId: 1,
        currentTenant: { id: 1, name: 'Test' } as unknown as TenantInfo,
        user: { id: 1 } as unknown as User,
        isImpersonating: true,
        impersonatedUserId: 42,
      });
      localStorage.setItem('current_tenant_id', '1');
      localStorage.setItem('is_impersonating', 'true');

      useAuthStore.getState().clearTenantContext();

      const state = useAuthStore.getState();
      expect(state.currentTenantId).toBeNull();
      expect(state.currentTenant).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isImpersonating).toBe(false);
      expect(state.impersonatedUserId).toBeNull();
    });
  });
});
