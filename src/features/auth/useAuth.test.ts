import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signIn returns ok: true on success', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'u1', email: 'a@b.cl' },
    } as any);

    const { result } = renderHook(() => useAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signIn('a@b.cl', 'pw');
    });
    expect(res).toEqual({ ok: true });
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.cl', 'pw');
  });

  it('signIn returns ok: false with mapped error on failure', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });

    const { result } = renderHook(() => useAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signIn('a@b.cl', 'wrong');
    });
    expect(res).toEqual({ ok: false, error: 'Email o contraseña incorrectos' });
  });

  it('signIn falls back to generic error on unknown failure', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signIn('a@b.cl', 'pw');
    });
    expect(res).toEqual({ ok: false, error: 'Error de autenticación. Reintenta.' });
  });

  it('signOut calls firebase signOut', async () => {
    vi.mocked(signOut).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signOut();
    });
    expect(signOut).toHaveBeenCalledWith({});
  });
});
