import { test, expect } from '@playwright/test';
import { E2E_USER } from '../fixtures/seed';

// SC-002 / FR-008..014: ralear 810 en 3 destinos (270 c/u); guardrail de suma que no cuadra.
test('raleo multidestino: bloquea cuando la suma no cuadra y divide en 3 al cuadrar', async ({
  page,
}) => {
  // Login (usuario owner sembrado en el Auth Emulator).
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(E2E_USER.email);
  await page.getByLabel(/contraseña/i).fill(E2E_USER.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/lotes$/);

  // Siembra 6 bandejas → 810 plantas.
  await page.goto('/trazabilidad/siembra');
  await page.getByLabel(/bandejas/i).fill('6');
  await page.getByRole('button', { name: /sembrar/i }).click();
  await expect(page).toHaveURL(/\/up\/[^/]+\/qr$/);
  const match = page.url().match(/\/up\/([^/]+)\/qr$/);
  const upId = match?.[1] ?? '';
  expect(upId).not.toBe('');

  // Pantalla de raleo.
  await page.goto(`/up/${upId}/ralear`);

  // Guardrail: un destino con 200 no cuadra con 810 → confirmar deshabilitado (INV-1).
  await page.getByLabel(/ubicación destino 1/i).selectOption('INV-A-P01');
  await page.getByLabel(/cantidad destino 1/i).fill('200');
  await expect(page.getByRole('button', { name: /confirmar raleo/i })).toBeDisabled();

  // Tres destinos que suman 810.
  await page.getByLabel(/cantidad destino 1/i).fill('270');
  await page.getByRole('button', { name: /agregar destino/i }).click();
  await page.getByLabel(/ubicación destino 2/i).selectOption('INV-A-P02');
  await page.getByLabel(/cantidad destino 2/i).fill('270');
  await page.getByRole('button', { name: /agregar destino/i }).click();
  await page.getByLabel(/ubicación destino 3/i).selectOption('INV-A-P03');
  await page.getByLabel(/cantidad destino 3/i).fill('270');

  const confirmar = page.getByRole('button', { name: /confirmar raleo/i });
  await expect(confirmar).toBeEnabled();
  await confirmar.click();

  // Vuelve al detalle del origen (ahora trasladado).
  await expect(page).toHaveURL(new RegExp(`/up/${upId}$`));

  // En el listado aparecen las 3 hijas en sus ubicaciones.
  await page.goto('/trazabilidad');
  await expect(page.getByText('INV-A-P01')).toBeVisible();
  await expect(page.getByText('INV-A-P02')).toBeVisible();
  await expect(page.getByText('INV-A-P03')).toBeVisible();
});
