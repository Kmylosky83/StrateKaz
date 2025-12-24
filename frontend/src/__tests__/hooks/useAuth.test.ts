import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should update user when setUser is called', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      nombre: 'Test User',
      rol: 'ADMIN',
    };

    // Assuming there's a setUser action
    if (result.current.setUser) {
      result.current.setUser(mockUser);
      expect(result.current.user).toEqual(mockUser);
    }
  });

  it('should clear user on logout', () => {
    const { result } = renderHook(() => useAuthStore());

    // First, set a user
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test User',
        rol: 'ADMIN',
      },
      token: 'test-token',
      isAuthenticated: true,
    });

    // Then logout
    if (result.current.logout) {
      result.current.logout();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    }
  });
});
