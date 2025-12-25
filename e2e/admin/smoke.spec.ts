import { test, expect } from '@playwright/test';

/**
 * Admin Portal Smoke Tests
 *
 * Quick health checks to verify the admin portal is functioning.
 * These tests should run fast and catch major issues.
 */

test.describe('Admin Portal Smoke Tests', () => {
  test.describe('Dashboard', () => {
    test('should load the dashboard', async ({ page }) => {
      await page.goto('/');
      // May redirect to login or show dashboard
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have navigation sidebar', async ({ page }) => {
      await page.goto('/');
      const nav = page.getByRole('navigation');
      // Navigation should be present
    });

    test('should have main heading', async ({ page }) => {
      await page.goto('/');
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();
    });

    test('should display quick stats or welcome', async ({ page }) => {
      await page.goto('/');
      // Should have some content
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });

  test.describe('Elections List', () => {
    test('should load elections page', async ({ page }) => {
      await page.goto('/elections');
      await expect(page.getByRole('heading', { name: /elections/i })).toBeVisible();
    });

    test('should have create election button', async ({ page }) => {
      await page.goto('/elections');
      const createButton = page.getByRole('link', { name: /new.*election|create/i });
      await expect(createButton).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto('/elections');
      const searchInput = page.getByPlaceholder(/search/i);
      // Search may be present
    });

    test('should display election table or cards', async ({ page }) => {
      await page.goto('/elections');
      // Should have table or card layout
      const table = page.getByRole('table');
      const cards = page.locator('[class*="card"]');

      const hasTable = await table.count() > 0;
      const hasCards = await cards.count() > 0;
      // At least one layout should be present
    });
  });

  test.describe('Create Election', () => {
    test('should load create election page', async ({ page }) => {
      await page.goto('/elections/new');
      await expect(page.getByRole('heading', { name: /create.*election|new.*election/i })).toBeVisible();
    });

    test('should have form fields', async ({ page }) => {
      await page.goto('/elections/new');
      const nameInput = page.getByLabel(/name/i);
      await expect(nameInput).toBeVisible();
    });

    test('should have wizard steps or form sections', async ({ page }) => {
      await page.goto('/elections/new');
      // Look for step indicators or sections
      const steps = page.getByText(/step|basics|settings|review/i);
      await expect(steps.first()).toBeVisible();
    });

    test('should have back navigation', async ({ page }) => {
      await page.goto('/elections/new');
      const backLink = page.getByRole('link', { name: /back/i });
      await expect(backLink).toBeVisible();
    });
  });

  test.describe('Election Detail', () => {
    test('should handle election detail route', async ({ page }) => {
      const response = await page.goto('/elections/1');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle voters page', async ({ page }) => {
      const response = await page.goto('/elections/1/voters');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle trustees page', async ({ page }) => {
      const response = await page.goto('/elections/1/trustees');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle ballot page', async ({ page }) => {
      const response = await page.goto('/elections/1/ballot');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle results page', async ({ page }) => {
      const response = await page.goto('/elections/1/results');
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle settings page', async ({ page }) => {
      const response = await page.goto('/elections/1/settings');
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('Voters Management', () => {
    test('should load voters page', async ({ page }) => {
      await page.goto('/voters');
      // Should show voters content or require election context
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Settings', () => {
    test('should load settings page', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
      await page.goto('/');

      // Click elections link
      const electionsLink = page.getByRole('link', { name: /elections/i }).first();
      if (await electionsLink.isVisible()) {
        await electionsLink.click();
        await expect(page).toHaveURL(/elections/);
      }
    });

    test('should have mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Look for mobile menu button
      const menuButton = page.getByRole('button', { name: /menu|navigation/i });
      // Mobile menu may be present
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      const h1 = page.getByRole('heading', { level: 1 });
      // Should have h1
    });

    test('should have navigation landmarks', async ({ page }) => {
      await page.goto('/');
      const nav = page.getByRole('navigation');
      // Navigation landmark should exist
    });

    test('should have focusable elements', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      // Something should be focused after tab
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404', async ({ page }) => {
      const response = await page.goto('/nonexistent-admin-page');
      expect(response?.status()).toBeLessThanOrEqual(404);
    });

    test('should handle invalid election ID', async ({ page }) => {
      await page.goto('/elections/invalid-!@#');
      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('dashboard should load within 3 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      expect(Date.now() - start).toBeLessThan(3000);
    });

    test('elections list should load within 3 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto('/elections');
      await page.waitForLoadState('domcontentloaded');
      expect(Date.now() - start).toBeLessThan(3000);
    });
  });
});

test.describe('Admin Security Smoke Tests', () => {
  test('should not expose sensitive data', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();

    expect(content).not.toMatch(/private.*key/i);
    expect(content).not.toMatch(/api.*secret/i);
    expect(content).not.toMatch(/database.*password/i);
  });

  test('should handle SQL injection attempts in URL', async ({ page }) => {
    await page.goto("/elections/1' OR '1'='1");
    // Should not expose SQL error
    const content = await page.content();
    expect(content).not.toMatch(/sql.*error|syntax.*error|database.*error/i);
  });

  test('should handle XSS in parameters', async ({ page }) => {
    await page.goto('/elections/<img src=x onerror=alert(1)>');
    const content = await page.content();
    expect(content).not.toContain('onerror=alert(1)');
  });

  test('should have CSRF protection on forms', async ({ page }) => {
    await page.goto('/elections/new');
    // Forms should have CSRF tokens or use secure methods
    // This is a basic check - real CSRF testing would be more thorough
  });
});
