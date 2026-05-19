import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './useSessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('starts in initializing status with null user', () => {
    const state = useSessionStore.getState();
    expect(state.status).toBe('initializing');
    expect(state.user).toBeNull();
  });

  it('reflects authenticated state after setState', () => {
    const fakeUser = { uid: 'u1', email: 'a@b.cl' } as any;
    useSessionStore.setState({ user: fakeUser, status: 'authenticated' });
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().user?.uid).toBe('u1');
  });

  it('reflects unauthenticated state after setState', () => {
    useSessionStore.setState({ user: null, status: 'unauthenticated' });
    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(useSessionStore.getState().user).toBeNull();
  });
});
