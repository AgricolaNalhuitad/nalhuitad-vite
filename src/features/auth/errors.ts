const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/invalid-email': 'Email inválido',
  'auth/user-disabled': 'Esta cuenta está deshabilitada',
  'auth/user-not-found': 'Email o contraseña incorrectos',
  'auth/wrong-password': 'Email o contraseña incorrectos',
  'auth/network-request-failed': 'Sin conexión. Revisa tu red.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
};

const FALLBACK = 'Error de autenticación. Reintenta.';

export function mapAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && code in MESSAGES) {
      return MESSAGES[code];
    }
  }
  return FALLBACK;
}
