import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/auth.types';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should update user when setUser is called', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
    } as unknown as User;

    act(() => {
      result.current.setUser(mockUser);
    });

    // Verify from the store directly since renderHook might not update immediately
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('should clear user on logout', () => {
    const { result } = renderHook(() => useAuthStore());

    // First, set a user
    useAuthStore.setState({
      user: {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      } as unknown,
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      isAuthenticated: true,
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    // Verify from the store directly
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
