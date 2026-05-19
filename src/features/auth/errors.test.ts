import { describe, it, expect } from 'vitest';
import { mapAuthError } from './errors';

describe('mapAuthError', () => {
  it('maps invalid-credential to Spanish message', () => {
    expect(mapAuthError({ code: 'auth/invalid-credential' })).toBe(
      'Email o contraseña incorrectos',
    );
  });

  it('maps invalid-email', () => {
    expect(mapAuthError({ code: 'auth/invalid-email' })).toBe('Email inválido');
  });

  it('maps user-disabled', () => {
    expect(mapAuthError({ code: 'auth/user-disabled' })).toBe('Esta cuenta está deshabilitada');
  });

  it('maps network-request-failed', () => {
    expect(mapAuthError({ code: 'auth/network-request-failed' })).toBe(
      'Sin conexión. Revisa tu red.',
    );
  });

  it('maps too-many-requests', () => {
    expect(mapAuthError({ code: 'auth/too-many-requests' })).toBe(
      'Demasiados intentos. Espera unos minutos.',
    );
  });

  it('falls back to generic message for unknown code', () => {
    expect(mapAuthError({ code: 'auth/some-new-thing' })).toBe(
      'Error de autenticación. Reintenta.',
    );
  });

  it('falls back for non-object input', () => {
    expect(mapAuthError(null)).toBe('Error de autenticación. Reintenta.');
    expect(mapAuthError(undefined)).toBe('Error de autenticación. Reintenta.');
    expect(mapAuthError('string error')).toBe('Error de autenticación. Reintenta.');
  });
});
