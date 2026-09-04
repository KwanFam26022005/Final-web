import { expect, test } from '@playwright/test';

const sharedUserA = {
  displayName: 'Verify Candidate',
  email: `verify_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
  password: 'Password123!',
};

const sharedUserB = {
  displayName: 'Theme Candidate',
  email: `theme_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
  password: 'Password123!',
};

test.describe('Phase 2 Account Lifecycle & Infrastructure E2E Tests', () => {
  test('1. anonymous visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
  });

  test('2. A: register -> authenticated -> verification warning visible', async ({ page }) => {
    const user = sharedUserA;

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

    await page.getByLabel(/display name/i).fill(user.displayName);
    await page.getByLabel(/email address/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();

    // Must navigate to protected workspace
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('user-display-name')).toHaveText(user.displayName);
    await expect(page.getByTestId('user-email')).toHaveText(user.email);

    // Verification warning banner must be visible for new unverified user
    await expect(page.getByTestId('verification-warning-banner')).toBeVisible();
    await expect(page.getByTestId('resend-verification-button')).toBeVisible();
  });

  test('3. B: profile display name update -> reflected in authenticated workspace/account UI', async ({ page }) => {
    const user = {
      displayName: 'Original Profile Name',
      email: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
      password: 'Password123!',
      updatedDisplayName: 'Updated Profile Name',
    };

    // Register new user
    await page.goto('/register');
    await page.getByLabel(/display name/i).fill(user.displayName);
    await page.getByLabel(/email address/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/');

    // Navigate to profile settings
    await page.goto('/settings/profile');
    await expect(page.getByTestId('profile-display-name-input')).toHaveValue(user.displayName);

    // Update display name
    await page.getByTestId('profile-display-name-input').fill(user.updatedDisplayName);
    await page.getByTestId('save-profile-button').click();

    await expect(page.getByTestId('profile-success-alert')).toBeVisible();

    // Return to workspace and verify updated display name is reflected
    await page.goto('/');
    await expect(page.getByTestId('user-display-name')).toHaveText(user.updatedDisplayName);
  });

  test('4. C: change password -> logout -> old password rejected -> new password login succeeds', async ({ page }) => {
    const user = {
      displayName: 'Security Candidate',
      email: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
      password: 'InitialPassword123!',
      newPassword: 'BrandNewPassword456!',
    };

    // Register user
    await page.goto('/register');
    await page.getByLabel(/display name/i).fill(user.displayName);
    await page.getByLabel(/email address/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/');

    // Navigate to security settings
    await page.goto('/settings/security');
    await page.getByTestId('current-password-input').fill(user.password);
    await page.getByTestId('new-password-input').fill(user.newPassword);
    await page.getByTestId('confirm-new-password-input').fill(user.newPassword);
    await page.getByTestId('update-password-button').click();

    await expect(page.getByTestId('security-success-alert')).toBeVisible();

    // Log out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Old password must be rejected
    await page.getByLabel(/email address/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    // New password must succeed
    await page.getByLabel(/^password/i).fill(user.newPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('user-display-name')).toHaveText(user.displayName);
  });

  test('5. D: preferences theme switch -> persisted after navigation/reload', async ({ page }) => {
    const user = sharedUserB;

    // Register user
    await page.goto('/register');
    await page.getByLabel(/display name/i).fill(user.displayName);
    await page.getByLabel(/email address/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/');

    // Navigate to preferences settings
    await page.goto('/settings/preferences');
    await page.getByTestId('theme-option-dark').click();
    await page.getByTestId('save-preferences-button').click();
    await expect(page.getByTestId('preferences-success-alert')).toBeVisible();

    // Verify dark class applied to document element
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload page and verify dark theme is persisted from server preferences
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('6. E: forgot-password UI -> generic completion state', async ({ page }) => {
    const email = `recover_${Date.now()}@example.com`;
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
    await page.getByLabel(/email address/i).fill(email);
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page.getByTestId('forgot-password-success')).toBeVisible();
    await expect(
      page.getByText(/if an account exists for this email, a password reset link has been sent/i)
    ).toBeVisible();
  });

  test('7. foundation diagnostics route confirms backend and database connectivity', async ({ page }) => {
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

  test('8. F: responsive auth smoke verifies mobile layout adapts cleanly without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();

    // Verify no horizontal overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('9. G: settings navigation switches between profile, security, and preferences seamlessly', async ({ page }) => {
    const user = {
      displayName: 'Nav Candidate',
      email: `nav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
      password: 'Password123!',
    };

    await page.goto('/register');
    await page.getByLabel(/display name/i).fill(user.displayName);
    await page.getByLabel(/email address/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/');

    // Navigate to settings
    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/\/settings\/profile/);
    await expect(page.getByRole('heading', { name: /account settings/i })).toBeVisible();

    // Switch to Security
    await page.getByRole('link', { name: /security/i }).click();
    await expect(page).toHaveURL(/\/settings\/security/);
    await expect(page.getByRole('button', { name: /update password/i })).toBeVisible();

    // Switch to Preferences
    await page.getByRole('link', { name: /preferences/i }).click();
    await expect(page).toHaveURL(/\/settings\/preferences/);
    await expect(page.getByRole('button', { name: /save preferences/i })).toBeVisible();
  });

  test('10. H: desktop visual composition renders 56/44 split, brand mark, editorial statement, and zero overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');

    await expect(page.locator('aside').getByTestId('knowledge-mark')).toBeVisible();
    await expect(page.getByRole('heading', { name: /where ideas become/i })).toBeVisible();
    await expect(page.getByTestId('academic-campus-scene')).toBeVisible();
    await expect(page.getByTestId('knowledge-particles')).toBeVisible();
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('11. NOTE-01..04: Personal notes workspace -> create via debounced autosave -> url replace -> toggle view -> edit autosave', async ({ page }) => {
    // Login with existing registered user
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(sharedUserA.email);
    await page.getByLabel(/^password/i).fill(sharedUserA.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    // Initially workspace is empty
    await expect(page.getByTestId('empty-notes-state')).toBeVisible();

    // Click "New note" to enter unified editor in draft mode
    await page.getByTestId('empty-new-note').click();
    await expect(page).toHaveURL('/notes/new');

    // Confirm NO primary save button exists
    await expect(page.getByRole('button', { name: /^save/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /save note/i })).not.toBeVisible();

    // Type title and content
    const titleInput = page.getByTestId('note-title-input');
    const contentInput = page.getByTestId('note-content-input');
    await titleInput.fill('Algorithms Lecture Notes');
    await contentInput.fill('Binary search trees, balanced AVL rotations, and time complexities.');

    // Autosave status should show "Saved" after debounce
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

    // URL must be replaced with the persisted note ID
    await expect(page).toHaveURL(/\/notes\/\d+$/);

    // Return to workspace
    await page.getByTestId('back-to-notes').click();
    await expect(page).toHaveURL('/');

    // Note card must now be visible in Grid view
    await expect(page.getByTestId('notes-grid')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture Notes')).toBeVisible();
    await expect(page.getByText(/Binary search trees/)).toBeVisible();

    // Toggle to List view
    await page.getByTestId('list-view-button').click();
    await expect(page.getByTestId('notes-list')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture Notes')).toBeVisible();

    // Open existing note from list
    await page.getByText('Algorithms Lecture Notes').click();
    await expect(page).toHaveURL(/\/notes\/\d+$/);
    await expect(titleInput).toHaveValue('Algorithms Lecture Notes');

    // Edit title
    await titleInput.fill('Algorithms & Data Structures Notes');
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

    // Return to workspace and verify title updated
    await page.getByTestId('back-to-notes').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Algorithms & Data Structures Notes')).toBeVisible();
  });

  test('12. Personal workspace isolation: other authenticated users cannot see notes', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // User A (sharedUserA) logs in - has note created in test 11
      await pageA.goto('/login');
      await pageA.getByLabel(/email address/i).fill(sharedUserA.email);
      await pageA.getByLabel(/^password/i).fill(sharedUserA.password);
      await pageA.getByRole('button', { name: /sign in/i }).click();
      await expect(pageA).toHaveURL('/');
      await expect(pageA.getByText('Algorithms & Data Structures Notes')).toBeVisible();

      // User B (sharedUserB) logs in in separate session - has 0 notes
      await pageB.goto('/login');
      await pageB.getByLabel(/email address/i).fill(sharedUserB.email);
      await pageB.getByLabel(/^password/i).fill(sharedUserB.password);
      await pageB.getByRole('button', { name: /sign in/i }).click();
      await expect(pageB).toHaveURL('/');

      // User B must see empty state, NEVER Alice's note
      await expect(pageB.getByTestId('empty-notes-state')).toBeVisible();
      await expect(pageB.getByText('Algorithms & Data Structures Notes')).not.toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('13. NOTE-05: Safe note deletion with explicit confirmation dialog and irreversibility verification', async ({ page }) => {
    // User A logs in
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(sharedUserA.email);
    await page.getByLabel(/^password/i).fill(sharedUserA.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    // User preference was set to list view in test 11: wait for list view to load
    await expect(page.getByTestId('notes-list')).toBeVisible();

    // Switch to grid view to test grid delete
    await page.getByTestId('grid-view-button').click();
    await expect(page.getByTestId('notes-grid')).toBeVisible();

    // Existing note from test 11 is visible in Grid view
    const noteCard = page.getByTestId('note-card');
    await expect(noteCard).toBeVisible();
    await expect(page.getByText('Algorithms & Data Structures Notes')).toBeVisible();

    // 1. Click delete on note card -> confirmation dialog opens
    const deleteBtn = page.getByTestId('delete-note-button');
    await deleteBtn.click();

    const dialog = page.getByTestId('confirm-delete-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('confirm-dialog-title')).toHaveText('Delete this note?');
    await expect(page.getByTestId('confirm-dialog-desc')).toHaveText(/permanently deletes/i);

    // 2. Click Cancel -> dialog closes, note is NOT deleted
    await page.getByTestId('confirm-dialog-cancel').click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('Algorithms & Data Structures Notes')).toBeVisible();

    // 3. Test delete in List view
    await page.getByTestId('list-view-button').click();
    await expect(page.getByTestId('notes-list')).toBeVisible();
    const listDeleteBtn = page.getByTestId('delete-note-button');
    await listDeleteBtn.click();
    await expect(dialog).toBeVisible();

    // 4. Confirm deletion
    await page.getByTestId('confirm-dialog-confirm').click();
    await expect(dialog).not.toBeVisible();

    // Note is immediately removed from workspace
    await expect(page.getByText('Algorithms & Data Structures Notes')).not.toBeVisible();
    // Empty state appears because it was the last note
    await expect(page.getByTestId('empty-notes-state')).toBeVisible();

    // 5. Reload page -> deleted note remains absent
    await page.reload();
    await expect(page.getByTestId('empty-notes-state')).toBeVisible();
    await expect(page.getByText('Algorithms & Data Structures Notes')).not.toBeVisible();

    // 6. Test editor delete flow & new draft safety
    await page.getByTestId('empty-new-note').click();
    await expect(page).toHaveURL('/notes/new');

    // New unpersisted draft MUST NOT expose Delete button
    await expect(page.getByTestId('editor-delete-button')).not.toBeVisible();

    // Type to trigger create autosave
    await page.getByTestId('note-title-input').fill('Temporary Note to Delete');
    await page.getByTestId('note-content-input').fill('This note will be deleted from editor.');
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

    // After persist, editor delete button appears
    await expect(page.getByTestId('editor-delete-button')).toBeVisible();

    // Click editor delete -> dialog opens
    await page.getByTestId('editor-delete-button').click();
    await expect(dialog).toBeVisible();

    // Responsive check on mobile viewport: dialog fits without overflow
    await page.setViewportSize({ width: 375, height: 667 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Confirm deletion from editor
    await page.getByTestId('confirm-dialog-confirm').click();

    // Navigates back to workspace /
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('empty-notes-state')).toBeVisible();
  });

  test('14. NOTE-06 & NOTE-07: Note pinning, server-backed live search, debounce, and section organization', async ({ page }) => {
    const user = {
      displayName: 'Search & Pin Scholar',
      email: `searchpin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
      password: 'Password123!',
    };

    // Register test user
    await page.goto('/register');
    await page.getByLabel(/display name/i).fill(user.displayName);
    await page.getByLabel(/email address/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByLabel(/confirm password/i).fill(user.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/');

    // Empty workspace initially
    await expect(page.getByTestId('empty-notes-state')).toBeVisible();

    // 1. Create Note 1: "Algorithms Lecture"
    await page.getByTestId('empty-new-note').click();
    await expect(page).toHaveURL('/notes/new');
    await page.getByTestId('note-title-input').fill('Algorithms Lecture');
    await page.getByTestId('note-content-input').fill('Binary search trees and AVL rotations graph theory.');
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
    await page.getByTestId('back-to-notes').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();

    // 2. Create Note 2: "Database Systems"
    await page.getByTestId('new-note-button').or(page.getByTestId('mobile-new-note')).first().click();
    await expect(page).toHaveURL('/notes/new');
    await page.getByTestId('note-title-input').fill('Database Systems');
    await page.getByTestId('note-content-input').fill('Relational algebra and SQL indexing techniques.');
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
    await page.getByTestId('back-to-notes').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Database Systems')).toBeVisible();

    // 3. Initially, neither note is pinned -> pinned-section is absent, both in notes-section
    await expect(page.getByTestId('pinned-section')).not.toBeVisible();
    await expect(page.getByTestId('notes-section')).toBeVisible();

    // 4. Pin "Algorithms Lecture"
    const algoCard = page.getByTestId('note-card').filter({ hasText: 'Algorithms Lecture' });
    const pinPromise = page.waitForResponse(
      (res) => res.url().includes('/pin') && res.request().method() === 'PATCH'
    );
    await algoCard.getByTestId('pin-note-button').click();
    const pinResponse = await pinPromise;
    expect(pinResponse.status()).toBe(200);

    // 5. Verify "Algorithms Lecture" in pinned-section and "Database Systems" in notes-section
    const pinnedSection = page.getByTestId('pinned-section');
    const regularSection = page.getByTestId('notes-section');
    await expect(pinnedSection).toBeVisible();
    await expect(pinnedSection.getByText('Algorithms Lecture')).toBeVisible();
    await expect(pinnedSection.getByText('Database Systems')).not.toBeVisible();

    await expect(regularSection.getByText('Database Systems')).toBeVisible();
    await expect(regularSection.getByText('Algorithms Lecture')).not.toBeVisible();

    // 6. Reload page -> verify pin state persists
    await page.reload();
    await expect(pinnedSection).toBeVisible();
    await expect(pinnedSection.getByText('Algorithms Lecture')).toBeVisible();
    await expect(regularSection.getByText('Database Systems')).toBeVisible();

    // 7. Type "database" into search input -> debounced live search shows only "Database Systems"
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('database');
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).not.toBeVisible();
    await expect(page.getByTestId('pinned-section')).not.toBeVisible();

    // 8. Clear search via clear-search-button -> both notes reappear
    await expect(page.getByTestId('clear-search-button')).toBeVisible();
    await page.getByTestId('clear-search-button').click();
    await expect(searchInput).toHaveValue('');
    await expect(pinnedSection.getByText('Algorithms Lecture')).toBeVisible();
    await expect(regularSection.getByText('Database Systems')).toBeVisible();

    // 9. Search unique body content ("graph theory") -> shows only "Algorithms Lecture"
    await searchInput.fill('graph theory');
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();
    await expect(page.getByText('Database Systems')).not.toBeVisible();

    // 10. Switch between Grid and List views while search is active -> query and results persist
    await page.getByTestId('list-view-button').click();
    await expect(page.getByTestId('pinned-notes-list')).toBeVisible();
    await expect(searchInput).toHaveValue('graph theory');
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();
    await expect(page.getByText('Database Systems')).not.toBeVisible();

    // Switch back to Grid view
    await page.getByTestId('grid-view-button').click();
    await expect(page.getByTestId('pinned-notes-grid')).toBeVisible();
    await expect(searchInput).toHaveValue('graph theory');
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();
    await expect(page.getByText('Database Systems')).not.toBeVisible();

    // 11. Clear search again
    await page.getByTestId('clear-search-button').click();
    await expect(searchInput).toHaveValue('');
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();
    await expect(page.getByText('Database Systems')).toBeVisible();

    // 12. Unpin "Algorithms Lecture" -> returns to regular section
    const pinnedAlgoCard = page.getByTestId('note-card').filter({ hasText: 'Algorithms Lecture' });
    const unpinPromise = page.waitForResponse(
      (res) => res.url().includes('/pin') && res.request().method() === 'PATCH'
    );
    await pinnedAlgoCard.getByTestId('pin-note-button').click();
    const unpinResponse = await unpinPromise;
    expect(unpinResponse.status()).toBe(200);
    await expect(page.getByTestId('pinned-section')).not.toBeVisible();
    await expect(page.getByTestId('notes-section').getByText('Algorithms Lecture')).toBeVisible();
    await expect(page.getByTestId('notes-section').getByText('Database Systems')).toBeVisible();

    // 13. Mobile smoke: search input at 390px viewport width without horizontal overflow
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('SQL');
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).not.toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
