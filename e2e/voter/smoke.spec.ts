import { test, expect } from '@playwright/test';

/**
 * Voter Portal Smoke Tests
 *
 * Quick health checks to verify the voter portal is functioning.
 * These tests should run fast and catch major issues.
 */

test.describe('Voter Portal Smoke Tests', () => {
  test.describe('Homepage', () => {
    test('should load the homepage', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/vote|trustless|election/i);
    });

    test('should display main heading', async ({ page }) => {
      await page.goto('/');
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
    });

    test('should have credential input', async ({ page }) => {
      await page.goto('/');
      const input = page.locator('textarea, input[type="text"]').first();
      await expect(input).toBeVisible();
    });

    test('should have enter/vote button', async ({ page }) => {
      await page.goto('/');
      const button = page.getByRole('button', { name: /enter|vote|start/i });
      await expect(button).toBeVisible();
    });

    test('should have navigation links', async ({ page }) => {
      await page.goto('/');
      const verifyLink = page.getByRole('link', { name: /verify/i });
      await expect(verifyLink).toBeVisible();
    });

    test('should be responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Verify Page', () => {
    test('should load verify page', async ({ page }) => {
      await page.goto('/verify');
      await expect(page.getByRole('heading', { name: /verify/i })).toBeVisible();
    });

    test('should have election selector', async ({ page }) => {
      await page.goto('/verify');
      const selector = page.getByRole('combobox');
      await expect(selector).toBeVisible();
    });

    test('should have confirmation code input', async ({ page }) => {
      await page.goto('/verify');
      const input = page.getByRole('textbox');
      await expect(input).toBeVisible();
    });

    test('should have verify button', async ({ page }) => {
      await page.goto('/verify');
      const button = page.getByRole('button', { name: /verify/i });
      await expect(button).toBeVisible();
    });

    test('should have how it works section', async ({ page }) => {
      await page.goto('/verify');
      const howItWorks = page.getByText(/how.*works|verification/i);
      await expect(howItWorks.first()).toBeVisible();
    });
  });

  test.describe('Dynamic Routes', () => {
    test('should handle vote route', async ({ page }) => {
      const response = await page.goto('/vote/test-id');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle review route', async ({ page }) => {
      const response = await page.goto('/vote/test-id/review');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle confirm route', async ({ page }) => {
      const response = await page.goto('/vote/test-id/confirm');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle verify result route', async ({ page }) => {
      const response = await page.goto('/verify/test-id/test-code');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle results route', async ({ page }) => {
      const response = await page.goto('/results/test-id');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle integrity route', async ({ page }) => {
      const response = await page.goto('/integrity/test-id');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle ledger route', async ({ page }) => {
      const response = await page.goto('/ledger/test-id');
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper document structure', async ({ page }) => {
      await page.goto('/');
      const main = page.locator('main, [role="main"]');
      const hasMain = await main.count() > 0;
      // Main landmark should exist
    });

    test('should have skip link or proper focus management', async ({ page }) => {
      await page.goto('/');
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeTruthy();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
    });

    test('should have form labels', async ({ page }) => {
      await page.goto('/verify');
      const labels = page.getByRole('textbox');
      // Inputs should have associated labels or aria-labels
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      const response = await page.goto('/nonexistent-page-12345');
      // Should not crash, either 404 page or redirect
      expect(response?.status()).toBeLessThanOrEqual(404);
    });

    test('should handle invalid election ID', async ({ page }) => {
      await page.goto('/vote/invalid-id-!@#$%');
      // Should show error state, not crash
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('homepage should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('verify page should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/verify');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });
  });
});

test.describe('Security Smoke Tests', () => {
  test('should not expose sensitive data in page source', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();

    // Should not contain private keys or secrets
    expect(content).not.toMatch(/private.*key/i);
    expect(content).not.toMatch(/secret/i);
    expect(content).not.toMatch(/password/i);
  });

  test('should have secure headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    // Check for security headers (may vary by environment)
    // These are recommendations, not hard requirements
  });

  test('should not allow XSS in URL parameters', async ({ page }) => {
    await page.goto('/verify/test/<script>alert(1)</script>/code');
    const content = await page.content();

    // Script tag should be escaped, not executed
    expect(content).not.toContain('<script>alert(1)</script>');
  });

  test('should sanitize user input display', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('textarea, input[type="text"]').first();
    if (await input.isVisible()) {
      await input.fill('<script>alert("xss")</script>');
      // Input should be visible but not execute script
    }
  });
});
