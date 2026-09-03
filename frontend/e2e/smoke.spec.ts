import { expect, test } from '@playwright/test';

test.describe('Infrastructure Smoke Test', () => {
  test('frontend application renders and connects to backend and database', async ({ page }) => {
    await page.goto('/');

    // 1. Heading and description render
    await expect(page.locator('h1')).toHaveText('Collaborative Intelligent Note Management');
    await expect(page.getByText('Frontend SPA')).toBeVisible();
    await expect(page.getByText('Ready')).toBeVisible();

    // 2. Connectivity states transition to Connected
    const backendRow = page.locator('div', { has: page.getByText('Backend API') });
    await expect(backendRow.getByText('Connected')).toBeVisible({ timeout: 15000 });

    const dbRow = page.locator('div', { has: page.getByText('MySQL Database') });
    await expect(dbRow.getByText('Connected')).toBeVisible({ timeout: 15000 });

    // 3. Ensure no sensitive errors or unhandled exceptions are present in the DOM
    await expect(page.locator('body')).not.toContainText('PDOException');
    await expect(page.locator('body')).not.toContainText('SQLSTATE');
    await expect(page.locator('body')).not.toContainText('Error:');
  });
});
