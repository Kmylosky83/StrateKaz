import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';
import { usePermissions, useIsSuperAdmin, useCurrentCargo } from '@/hooks/usePermissions';
import type { User } from '@/types/auth.types';

describe('usePermissions Hook', () => {
  beforeEach(() => {
    // Reset auth store to a clean state before each test
    useAuthStore.setState({
      user: null,
      tenantUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isSuperadmin: false,
      impersonatedUserId: null,
    });
  });

  describe('Initial state (no user)', () => {
    it('should return isSuperAdmin as false when no user', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isSuperAdmin).toBe(false);
    });

    it('should return null cargoCode when no user', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.cargoCode).toBeNull();
    });

    it('should return null cargoLevel when no user', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.cargoLevel).toBeNull();
    });

    it('should return null sectionIds when no user', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.sectionIds).toBeNull();
    });

    it('should return null permissionCodes when no user', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.permissionCodes).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should return false for any permission when no user', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission('gestion_estrategica.empresa.view')).toBe(false);
    });

    it('should return true for superadmin regardless of permission', () => {
      useAuthStore.setState({
        user: { is_superuser: true } as unknown as User,
        isSuperadmin: true,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission('any.random.permission')).toBe(true);
    });

    it('should return true when user has the specific permission', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: [
            'gestion_estrategica.empresa.view',
            'gestion_estrategica.empresa.edit',
          ],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission('gestion_estrategica.empresa.view')).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['gestion_estrategica.empresa.view'],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission('gestion_estrategica.empresa.delete')).toBe(false);
    });

    it('should return true when user has wildcard "*" permission', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['*'],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasPermission('anything.goes.here')).toBe(true);
    });
  });

  describe('canDo', () => {
    it('should build permission code from module/section/action', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['proteccion_cumplimiento.matriz.create'],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDo('proteccion_cumplimiento', 'matriz', 'create')).toBe(true);
      expect(result.current.canDo('proteccion_cumplimiento', 'matriz', 'delete')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one of the listed permissions', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['hseq.calidad.view'],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAnyPermission(['hseq.calidad.view', 'hseq.calidad.edit'])).toBe(
        true
      );
    });

    it('should return false if user has none of the listed permissions', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['other.permission.view'],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAnyPermission(['hseq.calidad.view', 'hseq.calidad.edit'])).toBe(
        false
      );
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true only if user has all listed permissions', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['a.b.view', 'a.b.edit', 'a.b.delete'],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAllPermissions(['a.b.view', 'a.b.edit'])).toBe(true);
    });

    it('should return false if user is missing one permission', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['a.b.view'],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasAllPermissions(['a.b.view', 'a.b.edit'])).toBe(false);
    });
  });

  describe('hasSectionAccess', () => {
    it('should return true for superadmin', () => {
      useAuthStore.setState({
        user: { is_superuser: true } as unknown as User,
        isSuperadmin: true,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasSectionAccess(999)).toBe(true);
    });

    it('should return true when section ID is in user section_ids', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          section_ids: [1, 2, 5, 10],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasSectionAccess(5)).toBe(true);
    });

    it('should return false when section ID is not in user section_ids', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          section_ids: [1, 2, 5],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasSectionAccess(99)).toBe(false);
    });
  });

  describe('hasCargoLevel', () => {
    it('should return true when cargo level meets minimum', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          cargo_level: 3,
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasCargoLevel(2)).toBe(true);
      expect(result.current.hasCargoLevel(3)).toBe(true);
    });

    it('should return false when cargo level is below minimum', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          cargo_level: 1,
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.hasCargoLevel(2)).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('should return true for superadmin with any options', () => {
      useAuthStore.setState({
        user: { is_superuser: true } as unknown as User,
        isSuperadmin: true,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccess({ permissions: ['nonexistent.perm'] })).toBe(true);
    });

    it('should return true only for superadmin when superAdminOnly is set', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: ['*'],
          cargo_level: 3,
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccess({ superAdminOnly: true })).toBe(false);
    });

    it('should return false when no user and no superadmin', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccess({ permissions: ['a.b.view'] })).toBe(false);
    });

    it('should return false when no conditions are specified (non-superadmin)', () => {
      useAuthStore.setState({
        user: {
          is_superuser: false,
          permission_codes: [],
        } as unknown as User,
        isSuperadmin: false,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccess({})).toBe(false);
    });
  });

  describe('show (alias of canAccess)', () => {
    it('should work identically to canAccess', () => {
      useAuthStore.setState({
        user: { is_superuser: true } as unknown as User,
        isSuperadmin: true,
      });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.show({ permissions: ['a.b.view'] })).toBe(true);
    });
  });

  describe('Impersonation mode', () => {
    it('should use user.is_superuser when impersonating (not isSuperadminGlobal)', () => {
      useAuthStore.setState({
        user: { is_superuser: false, permission_codes: [] } as unknown as User,
        isSuperadmin: true, // Global superadmin
        impersonatedUserId: 42, // But currently impersonating
      });
      const { result } = renderHook(() => usePermissions());
      // When impersonating, isSuperAdmin should be based on the impersonated user, not global
      expect(result.current.isSuperAdmin).toBe(false);
    });
  });
});

describe('useIsSuperAdmin Hook', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isSuperadmin: false,
      impersonatedUserId: null,
    });
  });

  it('should return false when no user', () => {
    const { result } = renderHook(() => useIsSuperAdmin());
    expect(result.current).toBe(false);
  });

  it('should return true when isSuperadmin global is true', () => {
    useAuthStore.setState({
      user: { is_superuser: false } as unknown as User,
      isSuperadmin: true,
    });
    const { result } = renderHook(() => useIsSuperAdmin());
    expect(result.current).toBe(true);
  });

  it('should return true when user.is_superuser is true', () => {
    useAuthStore.setState({
      user: { is_superuser: true } as unknown as User,
      isSuperadmin: false,
    });
    const { result } = renderHook(() => useIsSuperAdmin());
    expect(result.current).toBe(true);
  });
});

describe('useCurrentCargo Hook', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('should return null values when no user', () => {
    const { result } = renderHook(() => useCurrentCargo());
    expect(result.current.code).toBeNull();
    expect(result.current.level).toBeNull();
    expect(result.current.cargo).toBeNull();
  });

  it('should return cargo info from user', () => {
    useAuthStore.setState({
      user: {
        cargo_code: 'GER_OPS',
        cargo_level: 3,
        cargo: 'Gerente de Operaciones',
      } as unknown as User,
    });
    const { result } = renderHook(() => useCurrentCargo());
    expect(result.current.code).toBe('GER_OPS');
    expect(result.current.level).toBe(3);
    expect(result.current.cargo).toBe('Gerente de Operaciones');
  });
});
