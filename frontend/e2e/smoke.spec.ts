import path from 'path';
import { fileURLToPath } from 'url';
import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const sharedUserC = {
  displayName: 'Nav Candidate',
  email: `nav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
  password: 'Password123!',
};

const sharedUserD = {
  displayName: 'Original Profile Name',
  email: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
  password: 'Password123!',
  updatedDisplayName: 'Updated Profile Name',
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
    const user = sharedUserD;

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
    const user = sharedUserC;

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
    // Log in existing user A (has empty workspace from test 13, avoiding throttle:registration limit)
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(sharedUserA.email);
    await page.getByLabel(/^password/i).fill(sharedUserA.password);
    await page.getByRole('button', { name: /sign in/i }).click();
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

    // Ensure grid view is active for subsequent note-card checks
    await page.getByTestId('grid-view-button').click();
    await expect(page.getByTestId('notes-grid')).toBeVisible();

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

  test('15. LABEL-01..03: Label lifecycle, note assignment, multi-label filtering, and composite search', async ({ page }) => {
    // Reset desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Log in existing sharedUserA
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(sharedUserA.email);
    await page.getByLabel(/^password/i).fill(sharedUserA.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    // Existing notes from test 14 should be present
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();
    await expect(page.getByText('Database Systems')).toBeVisible();

    // 1. Open Labels Modal
    await page.getByTestId('labels-nav-link').click();
    const modal = page.getByTestId('labels-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Manage Labels')).toBeVisible();

    // 2. Create Label "Computer Science"
    const labelInput = modal.getByTestId('new-label-name-input');
    await labelInput.fill('Computer Science');
    const createRes1 = page.waitForResponse(
      (res) => res.url().includes('/api/labels') && res.request().method() === 'POST'
    );
    await modal.getByTestId('create-label-button').click();
    const resp1 = await createRes1;
    expect(resp1.status()).toBe(201);
    await expect(modal.getByText('Computer Science')).toBeVisible();

    // 3. Create Label "Databases"
    await labelInput.fill('Databases');
    const createRes2 = page.waitForResponse(
      (res) => res.url().includes('/api/labels') && res.request().method() === 'POST'
    );
    await modal.getByTestId('create-label-button').click();
    const resp2 = await createRes2;
    expect(resp2.status()).toBe(201);
    await expect(modal.getByText('Databases')).toBeVisible();

    // Close modal
    await modal.getByTestId('close-labels-modal').click();
    await expect(modal).not.toBeVisible();

    // 4. Label filters bar is now visible with both label chips
    const filterBar = page.getByTestId('label-filters-bar');
    await expect(filterBar).toBeVisible();
    await expect(filterBar.getByText('Computer Science')).toBeVisible();
    await expect(filterBar.getByText('Databases')).toBeVisible();

    // 5. Assign labels to "Database Systems" (assign both CS and Databases)
    await page.getByText('Database Systems').click();
    await expect(page).toHaveURL(/\/notes\/\d+/);
    await expect(page.getByTestId('note-labels-section')).toBeVisible();

    // Add "Computer Science"
    await page.getByTestId('add-label-button').click();
    const syncRes1 = page.waitForResponse(
      (res) => res.url().includes('/labels') && res.request().method() === 'PUT'
    );
    await page.getByTestId('label-picker').getByText('Computer Science').click();
    const syncResp1 = await syncRes1;
    expect(syncResp1.status()).toBe(200);
    await expect(page.getByTestId('note-labels-section')).toContainText('Computer Science');

    // Add "Databases" (picker is still open)
    const syncRes2 = page.waitForResponse(
      (res) => res.url().includes('/labels') && res.request().method() === 'PUT'
    );
    await page.getByTestId('label-picker').getByText('Databases').click();
    const syncResp2 = await syncRes2;
    expect(syncResp2.status()).toBe(200);
    await expect(page.getByTestId('note-labels-section')).toContainText('Databases');

    // Return to workspace
    await page.getByTestId('back-to-notes').click();
    await expect(page).toHaveURL('/');

    // 6. Assign "Computer Science" to "Algorithms Lecture"
    await page.getByText('Algorithms Lecture').click();
    await expect(page).toHaveURL(/\/notes\/\d+/);
    await page.getByTestId('add-label-button').click();
    const syncRes3 = page.waitForResponse(
      (res) => res.url().includes('/labels') && res.request().method() === 'PUT'
    );
    await page.getByTestId('label-picker').getByText('Computer Science').click();
    const syncResp3 = await syncRes3;
    expect(syncResp3.status()).toBe(200);
    await expect(page.getByTestId('note-labels-section')).toContainText('Computer Science');

    // Return to workspace
    await page.getByTestId('back-to-notes').click();
    await expect(page).toHaveURL('/');

    // 7. Test Label Filtering
    // Filter by "Databases" -> only "Database Systems" visible
    const dbChip = filterBar.getByTestId('label-filter-chip').filter({ hasText: 'Databases' });
    await dbChip.click();
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).not.toBeVisible();

    // Filter by both "Databases" AND "Computer Science" -> still "Database Systems" (ALL-match)
    const csChip = filterBar.getByTestId('label-filter-chip').filter({ hasText: 'Computer Science' });
    await csChip.click();
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).not.toBeVisible();

    // Deselect "Databases" (only "Computer Science" active) -> both notes visible
    await dbChip.click();
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();

    // 8. Test Filter + Live Search composition
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('SQL');
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).not.toBeVisible();

    // Clear search
    await page.getByTestId('clear-search-button').click();
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();

    // 9. Clear label filters
    await page.getByTestId('clear-label-filters-button').click();
    await expect(page.getByTestId('clear-label-filters-button')).not.toBeVisible();

    // 10. Test Rename & Delete in Labels Modal
    await page.getByTestId('labels-nav-link').click();
    await expect(modal).toBeVisible();

    // Rename "Databases" -> "Data Systems"
    const dbItem = modal.getByTestId('label-item').filter({ hasText: 'Databases' });
    await dbItem.getByTestId('edit-label-button').click();
    const editInput = modal.getByTestId('edit-label-name-input');
    await editInput.fill('Data Systems');
    const patchRes = page.waitForResponse(
      (res) => res.url().includes('/api/labels') && res.request().method() === 'PATCH'
    );
    await modal.getByTestId('save-label-name-button').click();
    const patchResp = await patchRes;
    expect(patchResp.status()).toBe(200);
    await expect(modal.getByText('Data Systems')).toBeVisible();

    // Delete "Data Systems"
    const dsItem = modal.getByTestId('label-item').filter({ hasText: 'Data Systems' });
    await dsItem.getByTestId('delete-label-button').click();
    const confirmDialog = page.getByTestId('confirm-delete-dialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText('Delete label "Data Systems"?')).toBeVisible();

    const deleteRes = page.waitForResponse(
      (res) => res.url().includes('/api/labels') && res.request().method() === 'DELETE'
    );
    await confirmDialog.getByTestId('confirm-dialog-confirm').click();
    const deleteResp = await deleteRes;
    expect(deleteResp.status()).toBe(200);
    await expect(modal.getByText('Data Systems')).not.toBeVisible();

    await modal.getByTestId('close-labels-modal').click();
    await expect(modal).not.toBeVisible();

    // Verify note is PRESERVED even though its label was deleted
    await expect(page.getByText('Database Systems')).toBeVisible();
    await expect(page.getByText('Algorithms Lecture')).toBeVisible();

    // 11. Clean up notes for clean workspace state
    for (const noteTitle of ['Algorithms Lecture', 'Database Systems']) {
      const card = page.getByTestId('note-card').filter({ hasText: noteTitle });
      if (await card.isVisible()) {
        await card.getByTestId('delete-note-button').click();
        await page.getByTestId('confirm-dialog-confirm').click();
        await expect(card).not.toBeVisible();
      }
    }
  });

  test('16. NOTE-08 & SEC-04: Secure file attachments lifecycle, upload, stream, download, and confirmation delete', async ({ page }) => {
    const samplePdfPath = path.resolve(__dirname, 'fixtures/sample.pdf');
    const samplePngPath = path.resolve(__dirname, 'fixtures/sample.png');
    const unsupportedShPath = path.resolve(__dirname, 'fixtures/unsupported.sh');

    // 1. Log in existing sharedUserB (avoids throttle:login rate limit on sharedUserA)
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(sharedUserB.email);
    await page.getByLabel(/^password/i).fill(sharedUserB.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('empty-notes-state')).toBeVisible();

    // 2. Navigate to /notes/new
    await page.getByTestId('empty-new-note').or(page.getByTestId('new-note-button')).first().click();
    await expect(page).toHaveURL('/notes/new');

    // Unpersisted draft hides attachment controls
    await expect(page.getByTestId('attachments-section')).not.toBeVisible();

    // Fill title and content to trigger debounced autosave
    await page.getByTestId('note-title-input').fill('Thesis Methodology');
    await page.getByTestId('note-content-input').fill('Detailed experimentation plan and diagrams.');

    // Wait for autosave to persist note and replace URL to /notes/{id}
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
    await expect(page).toHaveURL(/\/notes\/\d+/);

    // Attachments section now visible
    const attachmentsSection = page.getByTestId('attachments-section');
    await expect(attachmentsSection).toBeVisible();
    await expect(page.getByText(/max 10 MB/i)).toBeVisible();

    // 3. Attempt rejected upload with unsupported.sh
    const fileInput = page.getByTestId('attachment-file-input');
    const uploadResBad = page.waitForResponse(
      (res) => res.url().includes('/attachments') && res.request().method() === 'POST'
    );
    await fileInput.setInputFiles(unsupportedShPath);
    const badResp = await uploadResBad;
    expect(badResp.status()).toBe(422);

    await expect(page.getByTestId('attachment-upload-error')).toBeVisible();

    // 4. Upload valid PDF
    const uploadResPdf = page.waitForResponse(
      (res) => res.url().includes('/attachments') && res.request().method() === 'POST'
    );
    await fileInput.setInputFiles(samplePdfPath);
    const pdfResp = await uploadResPdf;
    expect(pdfResp.status()).toBe(201);

    await expect(page.getByTestId('attachments-list')).toBeVisible();
    await expect(page.getByText('sample.pdf')).toBeVisible();

    // 5. Upload valid PNG
    const uploadResPng = page.waitForResponse(
      (res) => res.url().includes('/attachments') && res.request().method() === 'POST'
    );
    await fileInput.setInputFiles(samplePngPath);
    const pngResp = await uploadResPng;
    expect(pngResp.status()).toBe(201);

    await expect(page.getByText('sample.png')).toBeVisible();
    await expect(page.getByTestId('attachment-item')).toHaveCount(2);

    // 6. Reload editor -> both attachments remain persisted
    await page.reload();
    await expect(page.getByTestId('attachments-section')).toBeVisible();
    await expect(page.getByText('sample.pdf')).toBeVisible();
    await expect(page.getByText('sample.png')).toBeVisible();

    // 7. Verify Download endpoint succeeds
    const pdfItem = page.getByTestId('attachment-item').filter({ hasText: 'sample.pdf' });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      pdfItem.getByTestId('download-attachment-button').click(),
    ]);
    expect(download.suggestedFilename()).toBe('sample.pdf');

    // 8. Test Delete confirmation flow
    const pngItem = page.getByTestId('attachment-item').filter({ hasText: 'sample.png' });
    await pngItem.getByTestId('delete-attachment-button').click();

    // Confirmation dialog visible
    const deleteModal = page.getByTestId('confirm-delete-dialog').filter({ hasText: /Delete attachment/i });
    await expect(deleteModal).toBeVisible();
    await expect(deleteModal.getByText('Delete attachment?')).toBeVisible();

    // Cancel -> remains
    await deleteModal.getByTestId('confirm-dialog-cancel').click();
    await expect(deleteModal).not.toBeVisible();
    await expect(page.getByText('sample.png')).toBeVisible();

    // Reopen and confirm delete
    await pngItem.getByTestId('delete-attachment-button').click();
    const deleteRes = page.waitForResponse(
      (res) => res.url().includes('/attachments/') && res.request().method() === 'DELETE'
    );
    await deleteModal.getByTestId('confirm-dialog-confirm').click();
    const deleteResp = await deleteRes;
    expect(deleteResp.status()).toBe(204);

    await expect(page.getByText('sample.png')).not.toBeVisible();
    await expect(page.getByText('sample.pdf')).toBeVisible();

    // Reload -> sample.png remains absent
    await page.reload();
    await expect(page.getByText('sample.pdf')).toBeVisible();
    await expect(page.getByText('sample.png')).not.toBeVisible();

    // 9. Clean up created note
    await page.getByTestId('editor-delete-button').click();
    await page.getByTestId('confirm-dialog-confirm').click();
    await expect(page).toHaveURL('/');
  });

  test('17: Per-Note Password Protection & Server-Side Unlock Lifecycle (SHARE-01, SHARE-02)', async ({
    page,
  }) => {
    const timestamp = Date.now();

    // 1. Log in existing sharedUserB (avoids throttle:registration rate limit)
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(sharedUserB.email);
    await page.getByLabel(/^password/i).fill(sharedUserB.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('empty-notes-state')).toBeVisible();

    // 2. Create note with secret phrase
    await page.getByTestId('empty-new-note').click();
    await expect(page).toHaveURL('/notes/new');
    await expect(page.getByTestId('note-title-input')).toBeVisible();

    const secretTitle = `Top Secret Formula ${timestamp}`;
    const secretContent = `Super secret catalyst omega formula ${timestamp}`;

    await page.getByTestId('note-title-input').fill(secretTitle);
    await page.getByTestId('note-content-input').fill(secretContent);

    // Wait for autosave
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
    await expect(page).toHaveURL(/\/notes\/\d+/);

    // 3. Protect note
    const protectBtn = page.getByTestId('protect-note-button');
    await expect(protectBtn).toBeVisible();
    await protectBtn.click();

    const protectModal = page.getByTestId('protect-modal');
    await expect(protectModal).toBeVisible();

    const notePassword = 'FormulaPass2026!';
    await page.getByTestId('protect-password-input').fill(notePassword);
    await page.getByTestId('protect-password-confirm-input').fill(notePassword);

    const protectResponse = page.waitForResponse(
      (res) => res.url().includes('/protection') && res.request().method() === 'PUT'
    );
    await page.getByTestId('confirm-protect-button').click();
    const protectRes = await protectResponse;
    expect(protectRes.status()).toBe(200);

    await expect(protectModal).not.toBeVisible();
    await expect(page.getByTestId('lock-now-button')).toBeVisible();
    await expect(page.getByTestId('remove-protection-button')).toBeVisible();

    // 4. Manually lock note
    const lockResponse = page.waitForResponse(
      (res) => res.url().includes('/lock') && res.request().method() === 'POST'
    );
    await page.getByTestId('lock-now-button').click();
    const lockRes = await lockResponse;
    expect(lockRes.status()).toBe(200);

    // Textarea hidden, locked view visible
    await expect(page.getByTestId('locked-note-view')).toBeVisible();
    await expect(page.getByTestId('note-content-input')).not.toBeVisible();
    await expect(page.getByTestId('note-title-input')).toBeDisabled();
    await expect(page.getByTestId('locked-status')).toBeVisible();

    // 5. Navigate to workspace
    await page.getByTestId('back-to-notes').click();
    await expect(page).toHaveURL('/');

    // Card shows locked indicator and excerpt
    const lockedCard = page.getByTestId('note-card').filter({ hasText: secretTitle });
    await expect(lockedCard.getByTestId('locked-indicator')).toBeVisible();
    await expect(lockedCard.getByTestId('locked-note-excerpt')).toHaveText(
      /Locked note · Unlock to view content/i
    );
    await expect(page.locator(`text=${secretContent}`)).not.toBeVisible();

    // 6. Test content oracle defense: search by secret body text -> 0 results
    await page.getByTestId('search-input').fill(`omega formula ${timestamp}`);
    await expect(page.getByText(secretTitle)).not.toBeVisible();

    // Search by title -> note is found
    await page.getByTestId('search-input').fill(secretTitle);
    await expect(page.getByText(secretTitle)).toBeVisible();

    // Clear search
    await page.getByTestId('clear-search-button').click();

    // 7. Click card to open locked note
    await lockedCard.click();
    await expect(page).toHaveURL(/\/notes\/\d+/);
    await expect(page.getByTestId('locked-note-view')).toBeVisible();

    // 8. Attempt unlock with incorrect password
    await page.getByTestId('unlock-password-input').fill('WrongPassword!');
    const unlockFailResponse = page.waitForResponse(
      (res) => res.url().includes('/unlock') && res.request().method() === 'POST'
    );
    await page.getByTestId('unlock-note-button').click();
    const failRes = await unlockFailResponse;
    expect(failRes.status()).toBe(422);

    await expect(page.getByTestId('unlock-error')).toBeVisible();
    await expect(page.getByTestId('note-content-input')).not.toBeVisible();

    // 9. Unlock with correct password
    await page.getByTestId('unlock-password-input').fill(notePassword);
    const unlockSuccessResponse = page.waitForResponse(
      (res) => res.url().includes('/unlock') && res.request().method() === 'POST'
    );
    await page.getByTestId('unlock-note-button').click();
    const successRes = await unlockSuccessResponse;
    expect(successRes.status()).toBe(200);

    // Note is unlocked!
    await expect(page.getByTestId('locked-note-view')).not.toBeVisible();
    const contentInput = page.getByTestId('note-content-input');
    await expect(contentInput).toBeVisible();
    await expect(contentInput).toHaveValue(secretContent);

    // 10. Edit and verify autosave
    await contentInput.fill(`${secretContent} updated`);
    await expect(page.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

    // 11. Reload page -> unlock persists in session
    await page.reload();
    await expect(page.getByTestId('note-content-input')).toBeVisible();
    await expect(page.getByTestId('note-content-input')).toHaveValue(`${secretContent} updated`);

    // 12. Remove protection
    await page.getByTestId('remove-protection-button').click();
    const removeModal = page.getByTestId('remove-protection-modal');
    await expect(removeModal).toBeVisible();

    await page.getByTestId('remove-protection-password-input').fill(notePassword);
    const removeResponse = page.waitForResponse(
      (res) => res.url().includes('/protection') && res.request().method() === 'DELETE'
    );
    await page.getByTestId('confirm-remove-protection-button').click();
    const removeRes = await removeResponse;
    expect(removeRes.status()).toBe(200);

    await expect(removeModal).not.toBeVisible();
    await expect(page.getByTestId('protect-note-button')).toBeVisible();

    // 13. Clean up note
    await page.getByTestId('editor-delete-button').click();
    await page.getByTestId('confirm-dialog-confirm').click();
    await expect(page).toHaveURL('/');
  });

  test('18. User-to-user sharing and granular permissions lifecycle (SHARE-03, SHARE-04)', async ({ browser }) => {
    test.setTimeout(90000);
    const timestamp = Date.now();

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      // 1. Log in User A (Owner - reuse fixture sharedUserB to avoid throttle:login and throttle:registration)
      await pageA.goto('/login');
      await pageA.getByLabel(/email address/i).fill(sharedUserB.email);
      await pageA.getByLabel(/^password/i).fill(sharedUserB.password);
      await pageA.getByRole('button', { name: /sign in/i }).click();
      await expect(pageA).toHaveURL('/');

      // 2. Log in User B (Collaborator - reuse fixture sharedUserC to avoid throttle:login and throttle:registration)
      await pageB.goto('/login');
      await pageB.getByLabel(/email address/i).fill(sharedUserC.email);
      await pageB.getByLabel(/^password/i).fill(sharedUserC.password);
      await pageB.getByRole('button', { name: /sign in/i }).click();
      await expect(pageB).toHaveURL('/');

      // 3. User A creates a note
      await pageA.getByTestId('new-note-button').click();
      await expect(pageA).toHaveURL('/notes/new');

      const noteTitle = `Collaborative Strategic Plan ${timestamp}`;
      const noteContent = `Initial strategic plan draft by Alice ${timestamp}`;

      await pageA.getByTestId('note-title-input').fill(noteTitle);
      await pageA.getByTestId('note-content-input').fill(noteContent);
      await expect(pageA.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
      await expect(pageA).toHaveURL(/\/notes\/\d+/);

      const noteUrl = pageA.url();
      const noteIdMatch = noteUrl.match(/\/notes\/(\d+)/);
      expect(noteIdMatch).not.toBeNull();
      const noteId = noteIdMatch![1];

      // 4. User B attempts unauthorized direct navigation before being shared
      await pageB.goto(`/notes/${noteId}`);
      await expect(pageB.getByTestId('note-not-found-state')).toBeVisible();

      // 5. User A shares note with User B with "read" permission
      await pageA.getByTestId('share-note-button').click();
      await expect(pageA.getByTestId('share-modal')).toBeVisible();

      await pageA.getByTestId('share-email-input').fill(sharedUserC.email);
      await pageA.getByTestId('share-perm-read').check();

      const shareResponse = pageA.waitForResponse(
        (res) => res.url().includes(`/notes/${noteId}/shares`) && res.request().method() === 'POST'
      );
      await pageA.getByTestId('confirm-share-button').click();
      const shareRes = await shareResponse;
      expect(shareRes.status()).toBe(201);

      await expect(pageA.getByTestId('share-success')).toBeVisible();
      await expect(pageA.getByTestId('shares-list')).toContainText(sharedUserC.email);

      // Close share modal
      await pageA.getByTestId('close-share-modal').click();
      await expect(pageA.getByTestId('share-modal')).not.toBeVisible();

      // 6. User B navigates to shared note: verifies read-only enforcement
      await pageB.goto(`/notes/${noteId}`);
      await expect(pageB.getByTestId('note-title-input')).toBeVisible();
      await expect(pageB.getByTestId('note-title-input')).toHaveValue(noteTitle);
      await expect(pageB.getByTestId('note-content-input')).toHaveValue(noteContent);

      // Verify read-only badge and controls
      await expect(pageB.getByTestId('permission-badge')).toHaveText(/read only/i);
      await expect(pageB.getByTestId('note-title-input')).toBeDisabled();
      await expect(pageB.getByTestId('note-content-input')).toHaveAttribute('readonly');

      // Verify owner-only controls are hidden
      await expect(pageB.getByTestId('share-note-button')).not.toBeVisible();
      await expect(pageB.getByTestId('editor-pin-button')).not.toBeVisible();
      await expect(pageB.getByTestId('editor-delete-button')).not.toBeVisible();
      await expect(pageB.getByTestId('protect-note-button')).not.toBeVisible();
      await expect(pageB.getByTestId('note-labels-section')).not.toBeVisible();

      // 7. User A upgrades User B to "edit" permission
      await pageA.getByTestId('share-note-button').click();
      await expect(pageA.getByTestId('share-modal')).toBeVisible();

      const updateResponse = pageA.waitForResponse(
        (res) => res.url().includes('/note-shares/') && res.request().method() === 'PATCH'
      );
      const bobSelect = pageA.getByLabel(`Change permission for ${sharedUserC.email}`);
      await bobSelect.selectOption('edit');
      const updateRes = await updateResponse;
      expect(updateRes.status()).toBe(200);

      await pageA.getByTestId('close-share-modal').click();

      // 8. User B reloads: verifies edit capability & autosave
      await pageB.reload();
      await expect(pageB.getByTestId('permission-badge')).toHaveText(/can edit/i);
      await expect(pageB.getByTestId('note-title-input')).not.toBeDisabled();
      await expect(pageB.getByTestId('note-content-input')).not.toHaveAttribute('readonly');

      // User B makes an edit
      await pageB.getByTestId('note-content-input').fill(`${noteContent} — Bob contribution`);
      await expect(pageB.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

      // User A sees Bob's edits
      await pageA.reload();
      await expect(pageA.getByTestId('note-content-input')).toHaveValue(`${noteContent} — Bob contribution`);

      // 9. User A protects note with a password
      await pageA.getByTestId('protect-note-button').click();
      const protectPassword = 'SharePass2026!';
      await pageA.getByTestId('protect-password-input').fill(protectPassword);
      await pageA.getByTestId('protect-password-confirm-input').fill(protectPassword);
      await pageA.getByTestId('confirm-protect-button').click();
      await expect(pageA.getByTestId('protect-modal')).not.toBeVisible();

      // User A locks note locally
      await pageA.getByTestId('lock-now-button').click();
      await expect(pageA.getByTestId('locked-note-view')).toBeVisible();

      // User B reloads note: note is protected and locked!
      await pageB.reload();
      await expect(pageB.getByTestId('locked-note-view')).toBeVisible();
      await expect(pageB.getByTestId('note-content-input')).not.toBeVisible();

      // User B unlocks note with correct password
      await pageB.getByTestId('unlock-password-input').fill(protectPassword);
      await pageB.getByTestId('unlock-note-button').click();
      await expect(pageB.getByTestId('locked-note-view')).not.toBeVisible();
      await expect(pageB.getByTestId('note-content-input')).toBeVisible();

      // 10. User A revokes User B's share
      // User A unlocks note to access sharing modal
      await pageA.getByTestId('unlock-password-input').fill(protectPassword);
      await pageA.getByTestId('unlock-note-button').click();
      await expect(pageA.getByTestId('locked-note-view')).not.toBeVisible();

      await pageA.getByTestId('share-note-button').click();
      await expect(pageA.getByTestId('share-modal')).toBeVisible();

      await pageA.getByTestId('revoke-share-button').click();
      await expect(pageA.getByTestId('confirm-revoke-dialog')).toBeVisible();

      const revokeResponse = pageA.waitForResponse(
        (res) => res.url().includes('/note-shares/') && res.request().method() === 'DELETE'
      );
      await pageA.getByTestId('confirm-revoke-button').click();
      const revokeRes = await revokeResponse;
      expect(revokeRes.status()).toBe(204);

      await expect(pageA.getByTestId('confirm-revoke-dialog')).not.toBeVisible();
      await expect(pageA.getByTestId('no-shares-message')).toBeVisible();
      await expect(pageA.getByText(sharedUserC.email)).not.toBeVisible();

      // 11. User B reloads note and is immediately denied access
      await pageB.reload();
      await expect(pageB.getByTestId('note-not-found-state')).toBeVisible();

      // 12. Clean up created note by Owner
      await pageA.getByTestId('close-share-modal').click();
      await pageA.getByTestId('editor-delete-button').click();
      await pageA.getByTestId('confirm-dialog-confirm').click();
      await expect(pageA).toHaveURL('/');
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('19. Recipient shared workspace lifecycle and metadata verification (SHARE-05)', async ({ browser }) => {
    test.setTimeout(180000);
    const timestamp = Date.now();

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      // 1. Log in User A (Owner: sharedUserC) and User B (Collaborator: sharedUserD)
      await pageA.goto('/login');
      await pageA.getByLabel(/email address/i).fill(sharedUserC.email);
      await pageA.getByLabel(/^password/i).fill(sharedUserC.password);
      await pageA.getByRole('button', { name: /sign in/i }).click();
      await expect(pageA).toHaveURL('/');
      await expect(pageA.getByTestId('user-display-name')).toBeVisible();

      await pageB.goto('/login');
      await pageB.getByLabel(/email address/i).fill(sharedUserD.email);
      await pageB.getByLabel(/^password/i).fill(sharedUserD.password);
      await pageB.getByRole('button', { name: /sign in/i }).click();
      await expect(pageB).toHaveURL('/');
      await expect(pageB.getByTestId('user-display-name')).toBeVisible();

      // 2. User B navigates to /shared before any shares exist: verifies empty state and navigation links
      await pageB.goto('/shared');
      await expect(pageB).toHaveURL('/shared');
      await expect(pageB.getByTestId('shared-workspace-heading')).toBeVisible();
      await expect(pageB.getByTestId('shared-loading-state')).not.toBeVisible({ timeout: 15000 });
      await expect(pageB.getByTestId('shared-empty-state')).toBeVisible();
      await expect(pageB.getByText('No notes have been shared with you yet.')).toBeVisible();

      // Verify sidebar navigation links
      await expect(pageB.getByTestId('shared-nav-link')).toBeVisible();
      await expect(pageB.getByTestId('notes-nav-link')).toBeVisible();

      // 3. User A creates Note A (read-only target)
      await pageA.getByTestId('new-note-button').click();
      await expect(pageA).toHaveURL('/notes/new');

      const noteTitleA = `Research Paper Alpha ${timestamp}`;
      const noteContentA = `Original research findings for Alpha ${timestamp}`;
      await pageA.getByTestId('note-title-input').fill(noteTitleA);
      await pageA.getByTestId('note-content-input').fill(noteContentA);
      await expect(pageA.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
      await expect(pageA).toHaveURL(/\/notes\/\d+/);

      const noteUrlA = pageA.url();
      const noteIdMatchA = noteUrlA.match(/\/notes\/(\d+)/);
      expect(noteIdMatchA).not.toBeNull();
      const noteIdA = noteIdMatchA![1];

      // 4. User A shares Note A with User B with "read" permission
      await pageA.getByTestId('share-note-button').click();
      await expect(pageA.getByTestId('share-modal')).toBeVisible();
      await pageA.getByTestId('share-email-input').fill(sharedUserD.email);
      await pageA.getByTestId('share-perm-read').check();

      const shareResponseA = pageA.waitForResponse(
        (res) => res.url().includes(`/notes/${noteIdA}/shares`) && res.request().method() === 'POST'
      );
      await pageA.getByTestId('confirm-share-button').click();
      const shareResA = await shareResponseA;
      expect(shareResA.status()).toBe(201);
      await pageA.getByTestId('close-share-modal').click();

      // 5. User A creates Note B (edit target)
      await pageA.getByTestId('back-to-notes').click();
      await expect(pageA).toHaveURL('/');
      await pageA.getByTestId('new-note-button').click();
      await expect(pageA).toHaveURL('/notes/new');

      const noteTitleB = `Strategic Proposal Beta ${timestamp}`;
      const noteContentB = `Proposal documentation for Beta ${timestamp}`;
      await pageA.getByTestId('note-title-input').fill(noteTitleB);
      await pageA.getByTestId('note-content-input').fill(noteContentB);
      await expect(pageA.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
      await expect(pageA).toHaveURL(/\/notes\/\d+/);

      const noteUrlB = pageA.url();
      const noteIdMatchB = noteUrlB.match(/\/notes\/(\d+)/);
      expect(noteIdMatchB).not.toBeNull();
      const noteIdB = noteIdMatchB![1];

      // 6. User A shares Note B with User B with "edit" permission
      await pageA.getByTestId('share-note-button').click();
      await expect(pageA.getByTestId('share-modal')).toBeVisible();
      await pageA.getByTestId('share-email-input').fill(sharedUserD.email);
      await pageA.getByTestId('share-perm-edit').check();

      const shareResponseB = pageA.waitForResponse(
        (res) => res.url().includes(`/notes/${noteIdB}/shares`) && res.request().method() === 'POST'
      );
      await pageA.getByTestId('confirm-share-button').click();
      const shareResB = await shareResponseB;
      expect(shareResB.status()).toBe(201);
      await pageA.getByTestId('close-share-modal').click();

      // 7. User B navigates to /shared workspace and validates cards, metadata, and badges
      await pageB.goto('/shared');
      await expect(pageB.getByTestId('shared-notes-grid')).toBeVisible();

      const cardA = pageB.locator('[data-testid="shared-note-card"]').filter({ hasText: noteTitleA });
      const cardB = pageB.locator('[data-testid="shared-note-card"]').filter({ hasText: noteTitleB });

      await expect(cardA).toBeVisible();
      await expect(cardB).toBeVisible();

      // Metadata assertions for Note A
      await expect(cardA.getByTestId('note-title')).toHaveText(noteTitleA);
      await expect(cardA.getByTestId('shared-indicator')).toBeVisible();
      await expect(cardA.getByTestId('permission-badge')).toHaveText(/read only/i);
      await expect(cardA.getByTestId('sharer-name')).toContainText(sharedUserC.displayName);
      await expect(cardA.getByTestId('shared-timestamp')).toBeVisible();
      await expect(cardA.getByTestId('note-excerpt')).toHaveText(noteContentA);

      // Metadata assertions for Note B
      await expect(cardB.getByTestId('note-title')).toHaveText(noteTitleB);
      await expect(cardB.getByTestId('shared-indicator')).toBeVisible();
      await expect(cardB.getByTestId('permission-badge')).toHaveText(/can edit/i);
      await expect(cardB.getByTestId('sharer-name')).toContainText(sharedUserC.displayName);
      await expect(cardB.getByTestId('shared-timestamp')).toBeVisible();
      await expect(cardB.getByTestId('note-excerpt')).toHaveText(noteContentB);

      // Verify owner-only controls are absent from recipient cards
      await expect(cardA.getByTestId('share-note-button')).not.toBeVisible();
      await expect(cardA.getByTestId('editor-delete-button')).not.toBeVisible();

      // 8. Test list view toggle and verify display in list layout
      await pageB.getByTestId('list-view-button').click();
      await expect(pageB.getByTestId('shared-notes-list')).toBeVisible();
      await pageB.getByTestId('grid-view-button').click();
      await expect(pageB.getByTestId('shared-notes-grid')).toBeVisible();

      // 9. User B clicks Note A: opens read-only editor, verifies permission enforcement
      await cardA.click();
      await expect(pageB).toHaveURL(`/notes/${noteIdA}`);
      await expect(pageB.getByTestId('note-title-input')).toBeVisible();
      await expect(pageB.getByTestId('permission-badge')).toHaveText(/read only/i);
      await expect(pageB.getByTestId('note-title-input')).toBeDisabled();
      await expect(pageB.getByTestId('note-content-input')).toHaveAttribute('readonly');

      // 10. User B returns to /shared and opens Note B: verifies edit permission and autosave
      await pageB.goto('/shared');
      const cardBToEdit = pageB.locator('[data-testid="shared-note-card"]').filter({ hasText: noteTitleB });
      await cardBToEdit.click();
      await expect(pageB).toHaveURL(`/notes/${noteIdB}`);
      await expect(pageB.getByTestId('note-title-input')).toBeVisible();
      await expect(pageB.getByTestId('permission-badge')).toHaveText(/can edit/i);
      await expect(pageB.getByTestId('note-title-input')).not.toBeDisabled();
      await expect(pageB.getByTestId('note-content-input')).not.toHaveAttribute('readonly');

      // User B makes an edit in Note B
      const appendedBeta = ' - Collaborator Edit Verified';
      await pageB.getByTestId('note-content-input').fill(`${noteContentB}${appendedBeta}`);
      await expect(pageB.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

      // 11. User A navigates to Note A, sets password protection, and locks it
      await pageA.goto(`/notes/${noteIdA}`);
      await pageA.getByTestId('protect-note-button').click();
      const protectPassword = 'SharedWorkspacePass2026!';
      await pageA.getByTestId('protect-password-input').fill(protectPassword);
      await pageA.getByTestId('protect-password-confirm-input').fill(protectPassword);
      await pageA.getByTestId('confirm-protect-button').click();
      await expect(pageA.getByTestId('protect-modal')).not.toBeVisible();

      await pageA.getByTestId('lock-now-button').click();
      await expect(pageA.getByTestId('locked-note-view')).toBeVisible();

      // 12. User B returns to /shared: Note A shows locked-indicator and redacted excerpt
      await pageB.goto('/shared');
      const lockedCardA = pageB.locator('[data-testid="shared-note-card"]').filter({ hasText: noteTitleA });
      await expect(lockedCardA).toBeVisible();
      await expect(lockedCardA.getByTestId('locked-indicator')).toBeVisible();
      await expect(lockedCardA.getByTestId('locked-note-excerpt')).toContainText('Locked note · Unlock to view content');
      await expect(lockedCardA.getByTestId('note-excerpt')).not.toBeVisible();

      // 13. User B opens Note A from /shared, unlocks it, and verifies content
      await lockedCardA.click();
      await expect(pageB).toHaveURL(`/notes/${noteIdA}`);
      await expect(pageB.getByTestId('locked-note-view')).toBeVisible();
      await pageB.getByTestId('unlock-password-input').fill(protectPassword);
      await pageB.getByTestId('unlock-note-button').click();
      await expect(pageB.getByTestId('locked-note-view')).not.toBeVisible();
      await expect(pageB.getByTestId('note-content-input')).toBeVisible();
      await expect(pageB.getByTestId('note-content-input')).toHaveValue(noteContentA);
      await expect(pageB.getByTestId('permission-badge')).toHaveText(/read only/i);

      // 14. User A unlocks Note A and revokes User B's share
      await pageA.getByTestId('unlock-password-input').fill(protectPassword);
      await pageA.getByTestId('unlock-note-button').click();
      await expect(pageA.getByTestId('locked-note-view')).not.toBeVisible();

      await pageA.getByTestId('share-note-button').click();
      await expect(pageA.getByTestId('share-modal')).toBeVisible();
      await pageA.getByTestId('revoke-share-button').click();
      await expect(pageA.getByTestId('confirm-revoke-dialog')).toBeVisible();

      const revokeResponseA = pageA.waitForResponse(
        (res) => res.url().includes('/note-shares/') && res.request().method() === 'DELETE'
      );
      await pageA.getByTestId('confirm-revoke-button').click();
      const revokeResA = await revokeResponseA;
      expect(revokeResA.status()).toBe(204);
      await pageA.getByTestId('close-share-modal').click();

      // 15. User B reloads /shared: Note A is gone, Note B remains
      await pageB.goto('/shared');
      await expect(pageB.getByTestId('shared-notes-grid')).toBeVisible();
      await expect(pageB.locator('[data-testid="shared-note-card"]').filter({ hasText: noteTitleA })).not.toBeVisible();
      await expect(pageB.locator('[data-testid="shared-note-card"]').filter({ hasText: noteTitleB })).toBeVisible();

      // 16. Owner cleans up both notes
      await pageA.getByTestId('editor-delete-button').click();
      await pageA.getByTestId('confirm-dialog-confirm').click();
      await expect(pageA).toHaveURL('/');

      await pageA.goto(`/notes/${noteIdB}`);
      await pageA.getByTestId('editor-delete-button').click();
      await pageA.getByTestId('confirm-dialog-confirm').click();
      await expect(pageA).toHaveURL('/');

      // 17. User B refreshes /shared: empty state is restored
      await pageB.reload();
      await expect(pageB.getByTestId('shared-empty-state')).toBeVisible();
      await expect(pageB.getByText('No notes have been shared with you yet.')).toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('20. Realtime bidirectional note synchronization across isolated browser contexts (RT-01)', async ({ browser }) => {
    test.setTimeout(180000);
    const timestamp = Date.now();

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      const rtUserA = {
        name: 'Realtime Owner',
        email: `rt_owner_${timestamp}_${Math.random().toString(36).slice(2, 7)}@example.com`,
        password: 'Password123!',
      };
      const rtUserB = {
        name: 'Realtime Collab',
        email: `rt_collab_${timestamp}_${Math.random().toString(36).slice(2, 7)}@example.com`,
        password: 'Password123!',
      };

      // 1. Register User A (Owner) and User B (Collaborator)
      await pageA.goto('/register');
      await pageA.getByLabel(/display name/i).fill(rtUserA.name);
      await pageA.getByLabel(/email address/i).fill(rtUserA.email);
      await pageA.getByLabel(/^password/i).fill(rtUserA.password);
      await pageA.getByLabel(/confirm password/i).fill(rtUserA.password);
      await pageA.getByRole('button', { name: /create account/i }).click();
      await expect(pageA).toHaveURL('/');
      await expect(pageA.getByTestId('user-display-name')).toBeVisible();

      await pageB.goto('/register');
      await pageB.getByLabel(/display name/i).fill(rtUserB.name);
      await pageB.getByLabel(/email address/i).fill(rtUserB.email);
      await pageB.getByLabel(/^password/i).fill(rtUserB.password);
      await pageB.getByLabel(/confirm password/i).fill(rtUserB.password);
      await pageB.getByRole('button', { name: /create account/i }).click();
      await expect(pageB).toHaveURL('/');
      await expect(pageB.getByTestId('user-display-name')).toBeVisible();

      // 2. User A creates a collaborative note
      await pageA.getByTestId('new-note-button').click();
      await expect(pageA).toHaveURL('/notes/new');

      const initialTitle = `Realtime Collab Doc ${timestamp}`;
      const initialContent = `Initial content written by Owner ${timestamp}`;
      await pageA.getByTestId('note-title-input').fill(initialTitle);
      await pageA.getByTestId('note-content-input').fill(initialContent);
      await expect(pageA.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });
      await expect(pageA).toHaveURL(/\/notes\/\d+/);

      const noteUrl = pageA.url();
      const noteIdMatch = noteUrl.match(/\/notes\/(\d+)/);
      expect(noteIdMatch).not.toBeNull();
      const noteId = noteIdMatch![1];

      // 3. User A shares note with User B with "edit" permission
      await pageA.getByTestId('share-note-button').click();
      await expect(pageA.getByTestId('share-modal')).toBeVisible();
      await pageA.getByTestId('share-email-input').fill(rtUserB.email);
      await pageA.getByTestId('share-perm-edit').check();

      const shareResponse = pageA.waitForResponse(
        (res) => res.url().includes(`/notes/${noteId}/shares`) && res.request().method() === 'POST'
      );
      await pageA.getByTestId('confirm-share-button').click();
      const shareRes = await shareResponse;
      expect(shareRes.status()).toBe(201);
      await pageA.getByTestId('close-share-modal').click();

      // 4. User B navigates directly to the note and verifies initial state & collaborative edit permission
      await pageB.goto(`/notes/${noteId}`);
      await expect(pageB.getByTestId('note-title-input')).toHaveValue(initialTitle, { timeout: 15000 });
      await expect(pageB.getByTestId('note-content-input')).toHaveValue(initialContent);
      await expect(pageB.getByTestId('note-title-input')).not.toHaveAttribute('readonly');
      await expect(pageB.getByTestId('note-content-input')).not.toHaveAttribute('readonly');

      // 5. User A updates the content -> autosaves -> User B receives update automatically WITHOUT reload
      const remoteContentUpdate = `Realtime content update from Owner ${timestamp}`;
      await pageA.getByTestId('note-content-input').fill(remoteContentUpdate);
      await expect(pageA.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

      // User B receives the content update via WebSocket invalidation signal + refetch
      await expect(pageB.getByTestId('note-content-input')).toHaveValue(remoteContentUpdate, { timeout: 15000 });

      // 6. User B updates the title -> autosaves -> User A receives update automatically WITHOUT reload
      const remoteTitleUpdate = `Realtime Title By Collaborator ${timestamp}`;
      await pageB.getByTestId('note-title-input').fill(remoteTitleUpdate);
      await expect(pageB.getByTestId('autosave-status')).toHaveText(/saved/i, { timeout: 10000 });

      // User A receives the title update via WebSocket invalidation signal + refetch
      await expect(pageA.getByTestId('note-title-input')).toHaveValue(remoteTitleUpdate, { timeout: 15000 });

      // 7. Cleanup: User A deletes the note
      await pageA.getByTestId('editor-delete-button').click();
      await pageA.getByTestId('confirm-dialog-confirm').click();
      await expect(pageA).toHaveURL('/');
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
