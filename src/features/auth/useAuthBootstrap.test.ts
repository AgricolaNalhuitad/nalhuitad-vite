import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { onAuthStateChanged, setPersistence } from 'firebase/auth';
import { useAuthBootstrap } from './useAuthBootstrap';
import { useSessionStore } from './useSessionStore';

describe('useAuthBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('configures persistence and subscribes to auth changes', () => {
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribe);

    renderHook(() => useAuthBootstrap());

    expect(setPersistence).toHaveBeenCalled();
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
  });

  it('writes authenticated state when callback fires with user', () => {
    let captured: ((u: any) => void) | null = null;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb: any) => {
      captured = cb;
      return vi.fn();
    });

    renderHook(() => useAuthBootstrap());
    expect(captured).not.toBeNull();
    captured!({ uid: 'u1', email: 'a@b.cl' });

    const state = useSessionStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.uid).toBe('u1');
  });

  it('writes unauthenticated state when callback fires with null', () => {
    let captured: ((u: any) => void) | null = null;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb: any) => {
      captured = cb;
      return vi.fn();
    });

    renderHook(() => useAuthBootstrap());
    captured!(null);

    const state = useSessionStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
  });

  it('calls unsubscribe on cleanup', () => {
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuthBootstrap());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
