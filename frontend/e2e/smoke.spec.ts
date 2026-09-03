import { expect, test } from '@playwright/test';

test.describe('Phase 2 Authentication & Infrastructure E2E Tests', () => {
  const testUser = {
    displayName: 'Playwright Tester',
    email: `e2e_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  test('A. anonymous visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
  });

  test('B. user registration auto-authenticates and navigates to protected workspace', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

    await page.getByLabel(/display name/i).fill(testUser.displayName);
    await page.getByLabel(/email address/i).fill(testUser.email);
    await page.getByLabel(/^password/i).fill(testUser.password);
    await page.getByLabel(/confirm password/i).fill(testUser.password);

    await page.getByRole('button', { name: /create account/i }).click();

    // Must navigate to protected workspace
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('user-display-name')).toHaveText(testUser.displayName);
    await expect(page.getByTestId('user-email')).toHaveText(testUser.email);

    // C. user logs out, ending session; protected route subsequently redirects to /login
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login/);

    // Verify navigating to protected route again redirects to /login
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('D. registered user can log in via /login', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email address/i).fill(testUser.email);
    await page.getByLabel(/^password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('user-display-name')).toHaveText(testUser.displayName);
    await expect(page.getByTestId('user-email')).toHaveText(testUser.email);
  });

  test('E. foundation diagnostics route confirms backend and database connectivity', async ({ page }) => {
    await page.goto('/foundation');

    await expect(page.locator('h1')).toHaveText('Collaborative Intelligent Note Management');
    await expect(page.getByText('Frontend SPA')).toBeVisible();
    await expect(page.getByText('Ready')).toBeVisible();

    await expect(
      page.getByTestId('backend-status-row').getByText('Connected', { exact: true })
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByTestId('database-status-row').getByText('Connected', { exact: true })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator('body')).not.toContainText('PDOException');
    await expect(page.locator('body')).not.toContainText('SQLSTATE');
  });
});
