import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import { useSessionStore } from './useSessionStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div>login form</div>
            </PublicRoute>
          }
        />
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicRoute', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('renders SplashScreen while initializing', () => {
    renderAt('/login');
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('login form')).not.toBeInTheDocument();
  });

  it('redirects to / when authenticated', () => {
    useSessionStore.setState({ user: { uid: 'u1' } as any, status: 'authenticated' });
    renderAt('/login');
    expect(screen.getByText('home page')).toBeInTheDocument();
    expect(screen.queryByText('login form')).not.toBeInTheDocument();
  });

  it('renders children when unauthenticated', () => {
    useSessionStore.setState({ user: null, status: 'unauthenticated' });
    renderAt('/login');
    expect(screen.getByText('login form')).toBeInTheDocument();
  });
});
