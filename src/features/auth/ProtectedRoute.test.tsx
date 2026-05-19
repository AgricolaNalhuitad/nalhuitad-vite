import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useSessionStore } from './useSessionStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>secret</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('renders SplashScreen while initializing', () => {
    renderAt('/protected');
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    useSessionStore.setState({ user: null, status: 'unauthenticated' });
    renderAt('/protected');
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useSessionStore.setState({ user: { uid: 'u1' } as any, status: 'authenticated' });
    renderAt('/protected');
    expect(screen.getByText('secret')).toBeInTheDocument();
  });
});
