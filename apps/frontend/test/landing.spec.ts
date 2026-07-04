import { test, expect } from '@playwright/test';

test.describe('EdgeTalent UI Landing and Auth Verification', () => {
  test('should load landing page successfully and navigate to auth page', async ({ page }) => {
    // 1. Navigate to home page
    await page.goto('/');

    // 2. Check document title
    await expect(page).toHaveTitle(/EdgeTalent/);

    // 3. Verify main header elements exist
    const badge = page.locator('.badge', { hasText: 'EdgeTalent Ecosystem' });
    await expect(badge).toBeVisible();

    const title = page.locator('h1', { hasText: 'Bridging Talent Development & Industrial Demand' });
    await expect(title).toBeVisible();

    // 4. Verify CTA exists and click it
    const getStartedBtn = page.locator('button.btn-primary', { hasText: 'Get Started' });
    await expect(getStartedBtn).toBeVisible();

    // Click to navigate
    await getStartedBtn.click();

    // 5. Verify Hash URL navigation
    await expect(page).toHaveURL(/#\/auth/);

    // 6. Verify Auth page card is rendered
    const authHeader = page.locator('h2', { hasText: 'Welcome Back' });
    await expect(authHeader).toBeVisible();
  });
});
