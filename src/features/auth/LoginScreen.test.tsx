import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { MemoryRouter } from 'react-router-dom';
import { LoginScreen } from './LoginScreen';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginScreen />
    </MemoryRouter>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email, password, and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('does not call signIn when fields are empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(screen.getByText(/completa email y contraseña/i)).toBeInTheDocument();
  });

  it('does not call signIn when email is whitespace only', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), '   ');
    await user.type(screen.getByLabelText(/contraseña/i), 'pw');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('calls signIn with trimmed email and password on valid submit', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'u1' },
    } as any);
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), '  a@b.cl  ');
    await user.type(screen.getByLabelText(/contraseña/i), 'pw123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.cl', 'pw123');
  });

  it('shows mapped error message on signIn failure', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@b.cl');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    let resolve!: (v: any) => void;
    vi.mocked(signInWithEmailAndPassword).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }) as any,
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@b.cl');
    await user.type(screen.getByLabelText(/contraseña/i), 'pw');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
    resolve({ user: { uid: 'u1' } });
  });
});
