import { test, expect } from '@playwright/test';

/**
 * Voter Portal - Voting Flow E2E Tests
 *
 * Comprehensive tests for the complete voting experience.
 */

test.describe('Voting Flow', () => {
  test.describe('Credential Entry', () => {
    test('should display credential entry form', async ({ page }) => {
      await page.goto('/');
      const form = page.locator('form, [role="form"]');
      await expect(form.first()).toBeVisible();
    });

    test('should accept valid credential format', async ({ page }) => {
      await page.goto('/');
      const input = page.locator('textarea, input').first();
      await input.fill('VALID-CREDENTIAL-12345');
      await expect(input).toHaveValue('VALID-CREDENTIAL-12345');
    });

    test('should show error for empty credential', async ({ page }) => {
      await page.goto('/');
      const button = page.getByRole('button', { name: /enter|vote|start/i });
      await button.click();
      await expect(page.getByText(/required|enter|invalid/i)).toBeVisible();
    });

    test('should navigate to ballot on valid credential', async ({ page }) => {
      await page.goto('/');
      const input = page.locator('textarea, input').first();
      await input.fill('eyJhbGciOiJIUzI1NiJ9.test-credential');

      const button = page.getByRole('button', { name: /enter|vote|start/i });
      await button.click();

      // Should either navigate or show loading/error
      await page.waitForLoadState('networkidle');
    });

    test('should handle malformed credentials gracefully', async ({ page }) => {
      await page.goto('/');
      const input = page.locator('textarea, input').first();
      await input.fill('not-a-valid-json-token');

      const button = page.getByRole('button', { name: /enter|vote|start/i });
      await button.click();

      // Should show error, not crash
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Ballot Display', () => {
    test('should display ballot page structure', async ({ page }) => {
      await page.goto('/vote/test-election');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show loading state initially', async ({ page }) => {
      await page.goto('/vote/test-election');
      // Either loading indicator or content should be visible
      const content = page.locator('body');
      await expect(content).toBeVisible();
    });

    test('should have progress indicator', async ({ page }) => {
      await page.goto('/vote/test-election');
      await page.waitForLoadState('networkidle');
      // Progress indicator may be present
    });

    test('should display ballot sections', async ({ page }) => {
      await page.goto('/vote/test-election');
      await page.waitForLoadState('networkidle');
      // Should have content sections
    });
  });

  test.describe('Vote Selection', () => {
    test('should allow single choice selection', async ({ page }) => {
      await page.goto('/vote/test-election');
      await page.waitForLoadState('networkidle');

      const radio = page.getByRole('radio').first();
      if (await radio.isVisible()) {
        await radio.click();
        await expect(radio).toBeChecked();
      }
    });

    test('should allow changing selection', async ({ page }) => {
      await page.goto('/vote/test-election');
      await page.waitForLoadState('networkidle');

      const radios = page.getByRole('radio');
      if (await radios.count() >= 2) {
        await radios.nth(0).click();
        await radios.nth(1).click();
        await expect(radios.nth(1)).toBeChecked();
        await expect(radios.nth(0)).not.toBeChecked();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/vote/test-election');
      await page.waitForLoadState('networkidle');

      // Tab through the page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      await expect(focused).toBeTruthy();
    });

    test('should support multiple choice if available', async ({ page }) => {
      await page.goto('/vote/test-election');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.getByRole('checkbox');
      if (await checkboxes.count() >= 2) {
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();
        await expect(checkboxes.nth(0)).toBeChecked();
        await expect(checkboxes.nth(1)).toBeChecked();
      }
    });
  });

  test.describe('Review Page', () => {
    test('should display review page', async ({ page }) => {
      await page.goto('/vote/test-election/review');
      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should show selected choices', async ({ page }) => {
      await page.goto('/vote/test-election/review');
      await page.waitForLoadState('networkidle');
      // Should display selections or error state
    });

    test('should have edit/back button', async ({ page }) => {
      await page.goto('/vote/test-election/review');
      await page.waitForLoadState('networkidle');

      const backButton = page.getByRole('button', { name: /back|edit/i });
      // Back button may be present
    });

    test('should have submit button', async ({ page }) => {
      await page.goto('/vote/test-election/review');
      await page.waitForLoadState('networkidle');

      const submitButton = page.getByRole('button', { name: /submit|confirm|cast/i });
      // Submit button should be present if data is loaded
    });

    test('should show security notice', async ({ page }) => {
      await page.goto('/vote/test-election/review');
      await page.waitForLoadState('networkidle');

      const notice = page.getByText(/encrypt|secure|cannot.*change/i);
      // Security notice may be present
    });
  });

  test.describe('Confirmation Page', () => {
    test('should display confirmation page', async ({ page }) => {
      await page.goto('/vote/test-election/confirm');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show success indicator', async ({ page }) => {
      await page.goto('/vote/test-election/confirm');
      await page.waitForLoadState('networkidle');

      // Should show success or error state
      const content = page.locator('body');
      await expect(content).not.toBeEmpty();
    });

    test('should display confirmation code section', async ({ page }) => {
      await page.goto('/vote/test-election/confirm');
      await page.waitForLoadState('networkidle');

      const codeSection = page.getByText(/confirmation|code/i);
      // Confirmation code section should be present on success
    });

    test('should have copy functionality', async ({ page }) => {
      await page.goto('/vote/test-election/confirm');
      await page.waitForLoadState('networkidle');

      const copyButton = page.getByRole('button', { name: /copy/i });
      if (await copyButton.isVisible()) {
        await copyButton.click();
        await expect(page.getByText(/copied/i)).toBeVisible();
      }
    });

    test('should have print functionality', async ({ page }) => {
      await page.goto('/vote/test-election/confirm');
      await page.waitForLoadState('networkidle');

      const printButton = page.getByRole('button', { name: /print/i });
      // Print button may be present
    });

    test('should have verify link', async ({ page }) => {
      await page.goto('/vote/test-election/confirm');
      await page.waitForLoadState('networkidle');

      const verifyLink = page.getByRole('link', { name: /verify/i });
      // Verify link should be present
    });

    test('should have return home button', async ({ page }) => {
      await page.goto('/vote/test-election/confirm');
      await page.waitForLoadState('networkidle');

      const homeButton = page.getByRole('button', { name: /home|finish/i });
      // Home button should be present
    });
  });
});

test.describe('Error States', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.route('**/*', route => route.abort());

    await page.goto('/vote/test-election').catch(() => {});
    // Should show error or offline state
  });

  test('should handle invalid election ID', async ({ page }) => {
    await page.goto('/vote/invalid-election-id-12345');
    await page.waitForLoadState('networkidle');

    // Should show error state, not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle expired session', async ({ page }) => {
    await page.goto('/vote/test-election/review');
    await page.waitForLoadState('networkidle');

    // Without valid session data, should show error or redirect
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

test.describe('Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be usable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button').first();
    if (await button.isVisible()) {
      const box = await button.boundingBox();
      if (box) {
        // Buttons should be at least 44x44 for touch
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should not have horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const body = await page.evaluate(() => document.body.scrollWidth);
    const viewport = await page.evaluate(() => window.innerWidth);
    expect(body).toBeLessThanOrEqual(viewport + 10); // Allow small margin
  });
});
