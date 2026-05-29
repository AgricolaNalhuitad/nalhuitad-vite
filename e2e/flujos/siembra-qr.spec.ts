import { test, expect } from '@playwright/test';
import { E2E_USER } from '../fixtures/seed';

// SC-001: sembrar 6 bandejas Milena → aparece en el listado → QR imprimible visible.
test('siembra Milena: crea, navega al QR imprimible y aparece en el listado', async ({ page }) => {
  // --- Login contra el Auth Emulator (usuario sembrado con role=owner) ---
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(E2E_USER.email);
  await page.getByLabel(/contraseña/i).fill(E2E_USER.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/lotes$/);

  // --- Crear siembra ---
  await page.goto('/trazabilidad/siembra');
  await expect(page.getByLabel(/variedad/i)).toHaveValue('Milena');
  await page.getByLabel(/bandejas/i).fill('6');
  await page.getByRole('button', { name: /sembrar/i }).click();

  // --- Tras sembrar: vista imprimible del QR de la UP ---
  await expect(page).toHaveURL(/\/up\/[^/]+\/qr$/);
  await expect(page.getByRole('img', { name: /QR de Milena/i })).toBeVisible();
  await expect(page.getByText('Milena', { exact: true })).toBeVisible();

  // --- Volver al listado: el lote aparece con su acción de QR ---
  await page.getByRole('button', { name: /volver/i }).click();
  await expect(page).toHaveURL(/\/trazabilidad$/);
  await expect(page.getByText(/Milena/).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /imprimir qr/i }).first()).toBeVisible();
});
