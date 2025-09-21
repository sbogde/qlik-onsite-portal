import { test, expect } from '@playwright/test';

const waitForVisualization = async (page: import('@playwright/test').Page, objectId: string) => {
  await expect(page.getByTestId(`mock-viz-${objectId}`)).toBeVisible();
};

test.describe('Qlik Sense connection (mocked)', () => {
  test('auto-connect updates status and renders dashboard visuals', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Connected to Qlik Sense')).toBeVisible();

    await waitForVisualization(page, 'JRNGq');
    await waitForVisualization(page, 'JRVHPjJ');
  });

  test('settings page shows demo configuration and reconnect button', async ({ page }) => {
    await page.goto('/settings');

    await page.getByRole('tab', { name: 'Manual Setup' }).click();

    await expect(page.getByLabel('Host')).toHaveValue('sense-demo.qlik.com');
    await expect(page.getByLabel('App ID')).toHaveValue('372cbc85-f7fb-4db6-a620-9a5367845dce');

    await page.getByRole('button', { name: 'Disconnect' }).click();
    await expect(page.getByTestId('connection-status')).toHaveAttribute('aria-label', 'Disconnected');

    await page.getByRole('button', { name: 'Connect to Qlik Sense' }).click();
    await expect(page.getByTestId('connection-status')).toHaveAttribute('aria-label', 'Connected');
  });
});
