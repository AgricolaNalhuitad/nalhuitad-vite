import { test, expect } from '@playwright/test';
import { E2E_USER } from '../fixtures/seed';

// FR-015..019 / INV-4: cosecha total cierra la UP y auto-cierra el lote; guardrail de exceso.
test('cosecha total cierra la UP y auto-cierra el lote; bloquea el exceso (INV-4)', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(E2E_USER.email);
  await page.getByLabel(/contraseña/i).fill(E2E_USER.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/lotes$/);

  // Siembra 2 bandejas → 270 plantas.
  await page.goto('/trazabilidad/siembra');
  await page.getByLabel(/bandejas/i).fill('2');
  await page.getByRole('button', { name: /sembrar/i }).click();
  await expect(page).toHaveURL(/\/up\/[^/]+\/qr$/);
  const upId = page.url().match(/\/up\/([^/]+)\/qr$/)?.[1] ?? '';
  expect(upId).not.toBe('');

  await page.goto(`/up/${upId}/cosechar`);

  // Guardrail INV-4: 140 paquetes = 280 lechugas > 270 → confirmar deshabilitado.
  await page.getByLabel(/paquetes/i).fill('140');
  await expect(page.getByRole('button', { name: /registrar cosecha/i })).toBeDisabled();

  // Cosecha total: 135 paquetes = 270 lechugas.
  await page.getByLabel(/paquetes/i).fill('135');
  const confirmar = page.getByRole('button', { name: /registrar cosecha/i });
  await expect(confirmar).toBeEnabled();
  await confirmar.click();

  // Detalle: la UP queda cosechada y desaparecen las acciones de ciclo de vida.
  await expect(page).toHaveURL(new RegExp(`/up/${upId}$`));
  await expect(page.getByText('cosechada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cosechar' })).toHaveCount(0);

  // Auto-cierre del lote (FR-019): su nombre ya no figura en el listado de activos.
  const nombre = (await page.getByRole('heading', { level: 1 }).textContent())?.trim() ?? '';
  expect(nombre).not.toBe('');
  await page.goto('/trazabilidad');
  await expect(page.getByText(nombre, { exact: true })).toHaveCount(0);
});
