import { useState, type FormEvent } from 'react';
import { useAuth } from './useAuth';
import styles from './LoginScreen.module.css';

type Status = 'idle' | 'submitting' | 'error';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (trimmedEmail === '' || password === '') {
      setStatus('error');
      setError('Completa email y contraseña');
      return;
    }
    setStatus('submitting');
    setError(null);
    const result = await signIn(trimmedEmail, password);
    if (result.ok) {
      setStatus('idle');
    } else {
      setStatus('error');
      setError(result.error);
    }
  };

  return (
    <div className={styles.root}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>Nalhuitad</h1>
        <p className={styles.subtitle}>Ingresa a tu cuenta</p>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            disabled={status === 'submitting'}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            disabled={status === 'submitting'}
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.button} disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
