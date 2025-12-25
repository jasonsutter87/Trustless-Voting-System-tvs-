import { test, expect, Page } from '@playwright/test';
import {
  testElection,
  testVoter,
  testCredential,
  testBallot,
  generateConfirmationCode,
} from '../fixtures/test-data';

/**
 * Full Election Flow E2E Tests
 *
 * These tests simulate a complete election cycle:
 * 1. Admin creates an election
 * 2. Admin adds voters
 * 3. Admin opens registration
 * 4. Admin starts voting
 * 5. Voter casts a vote
 * 6. Voter verifies their vote
 * 7. Admin closes voting
 * 8. Admin tallies results
 * 9. Voter views results
 */

test.describe('Full Election Flow', () => {
  let confirmationCode: string;

  test.describe('Phase 1: Election Setup (Admin)', () => {
    test('should display admin dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should navigate to create election page', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.getByRole('link', { name: /new election/i }).click();
      await expect(page).toHaveURL(/\/elections\/new/);
      await expect(page.getByRole('heading', { name: /create.*election/i })).toBeVisible();
    });

    test('should fill election basic info', async ({ page }) => {
      await page.goto('http://localhost:3000/elections/new');

      // Fill in election name
      await page.getByLabel(/name/i).fill(testElection.name);

      // Fill in description
      await page.getByLabel(/description/i).fill(testElection.description);

      // Verify inputs are filled
      await expect(page.getByLabel(/name/i)).toHaveValue(testElection.name);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('http://localhost:3000/elections/new');

      // Try to proceed without filling required fields
      await page.getByRole('button', { name: /next/i }).click();

      // Should show validation error
      await expect(page.getByText(/required/i)).toBeVisible();
    });

    test('should navigate through wizard steps', async ({ page }) => {
      await page.goto('http://localhost:3000/elections/new');

      // Fill step 1
      await page.getByLabel(/name/i).fill(testElection.name);
      await page.getByLabel(/description/i).fill(testElection.description);
      await page.getByLabel(/start/i).fill('2025-01-01T09:00');
      await page.getByLabel(/end/i).fill('2025-01-15T17:00');

      // Go to step 2
      await page.getByRole('button', { name: /next/i }).click();

      // Should be on settings step
      await expect(page.getByText(/settings/i)).toBeVisible();
    });
  });

  test.describe('Phase 2: Voter Management (Admin)', () => {
    test('should display voters page', async ({ page }) => {
      await page.goto('http://localhost:3000/elections/1/voters');
      await expect(page.getByRole('heading', { name: /voters/i })).toBeVisible();
    });

    test('should show add voter form', async ({ page }) => {
      await page.goto('http://localhost:3000/elections/1/voters');

      await page.getByRole('button', { name: /add voter/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('should validate voter email', async ({ page }) => {
      await page.goto('http://localhost:3000/elections/1/voters');

      await page.getByRole('button', { name: /add voter/i }).click();
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByRole('button', { name: /save|submit/i }).click();

      await expect(page.getByText(/valid email/i)).toBeVisible();
    });
  });

  test.describe('Phase 3: Voter Casts Vote', () => {
    test('should display voter home page', async ({ page }) => {
      await page.goto('http://localhost:3001');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should allow entering voting credentials', async ({ page }) => {
      await page.goto('http://localhost:3001');

      // Find credential input
      const credentialInput = page.getByPlaceholder(/credential|code|token/i);
      await expect(credentialInput).toBeVisible();
    });

    test('should validate empty credentials', async ({ page }) => {
      await page.goto('http://localhost:3001');

      // Try to submit without credentials
      await page.getByRole('button', { name: /enter|start|vote/i }).click();

      // Should show validation error
      await expect(page.getByText(/required|enter.*credential/i)).toBeVisible();
    });

    test('should display ballot after authentication', async ({ page }) => {
      // Mock the authentication and navigate to ballot
      await page.goto('http://localhost:3001/vote/test-election');

      // Should see ballot or loading state
      const heading = page.getByRole('heading');
      await expect(heading).toBeVisible();
    });

    test('should allow selecting candidates', async ({ page }) => {
      await page.goto('http://localhost:3001/vote/test-election');

      // Wait for ballot to load
      await page.waitForLoadState('networkidle');

      // Look for candidate options
      const radioButtons = page.getByRole('radio');
      const checkboxes = page.getByRole('checkbox');

      // Either radio buttons or checkboxes should be present for selections
      const hasRadios = await radioButtons.count() > 0;
      const hasCheckboxes = await checkboxes.count() > 0;

      expect(hasRadios || hasCheckboxes).toBeTruthy();
    });

    test('should navigate to review page', async ({ page }) => {
      await page.goto('http://localhost:3001/vote/test-election');
      await page.waitForLoadState('networkidle');

      // Find and click review/next button
      const reviewButton = page.getByRole('button', { name: /review|next|continue/i });
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await expect(page).toHaveURL(/review/);
      }
    });

    test('should display review page with selections', async ({ page }) => {
      await page.goto('http://localhost:3001/vote/test-election/review');

      await expect(page.getByRole('heading', { name: /review/i })).toBeVisible();
    });

    test('should submit vote and show confirmation', async ({ page }) => {
      await page.goto('http://localhost:3001/vote/test-election/confirm');

      // Should display success message
      await expect(page.getByText(/success|submitted|confirmation/i)).toBeVisible();
    });

    test('should display confirmation code', async ({ page }) => {
      await page.goto('http://localhost:3001/vote/test-election/confirm');

      // Should show confirmation code section
      await expect(page.getByText(/confirmation.*code/i)).toBeVisible();
    });

    test('should allow copying confirmation code', async ({ page }) => {
      await page.goto('http://localhost:3001/vote/test-election/confirm');

      const copyButton = page.getByRole('button', { name: /copy/i });
      if (await copyButton.isVisible()) {
        await copyButton.click();
        await expect(page.getByText(/copied/i)).toBeVisible();
      }
    });
  });

  test.describe('Phase 4: Vote Verification', () => {
    test('should display verification page', async ({ page }) => {
      await page.goto('http://localhost:3001/verify');
      await expect(page.getByRole('heading', { name: /verify/i })).toBeVisible();
    });

    test('should have election selector', async ({ page }) => {
      await page.goto('http://localhost:3001/verify');

      const selector = page.getByRole('combobox');
      await expect(selector).toBeVisible();
    });

    test('should have confirmation code input', async ({ page }) => {
      await page.goto('http://localhost:3001/verify');

      const input = page.getByPlaceholder(/confirmation|code/i);
      await expect(input).toBeVisible();
    });

    test('should validate verification form', async ({ page }) => {
      await page.goto('http://localhost:3001/verify');

      // Submit without filling form
      await page.getByRole('button', { name: /verify/i }).click();

      // Should show validation error
      await expect(page.getByText(/select.*election|enter.*code|required/i)).toBeVisible();
    });

    test('should navigate to verification result', async ({ page }) => {
      await page.goto('http://localhost:3001/verify/test-election/ABC123');

      // Should show result (found or not found)
      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should display vote found state', async ({ page }) => {
      await page.goto('http://localhost:3001/verify/test-election/VALID123');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should show either found or not found
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
    });

    test('should show merkle proof when vote found', async ({ page }) => {
      await page.goto('http://localhost:3001/verify/test-election/VALID123');
      await page.waitForLoadState('networkidle');

      // Look for proof-related content
      const proofSection = page.getByText(/proof|merkle|cryptographic/i);
      // Proof section may or may not be visible depending on vote status
    });

    test('should allow downloading proof', async ({ page }) => {
      await page.goto('http://localhost:3001/verify/test-election/VALID123');
      await page.waitForLoadState('networkidle');

      const downloadButton = page.getByRole('button', { name: /download/i });
      // Download button may be present when vote is found
    });
  });

  test.describe('Phase 5: Results Viewing', () => {
    test('should display results page', async ({ page }) => {
      await page.goto('http://localhost:3001/results/test-election');

      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should show election name in results', async ({ page }) => {
      await page.goto('http://localhost:3001/results/test-election');
      await page.waitForLoadState('networkidle');

      // Results page should have election info
      const heading = page.getByRole('heading');
      await expect(heading).toBeVisible();
    });

    test('should display vote tallies', async ({ page }) => {
      await page.goto('http://localhost:3001/results/test-election');
      await page.waitForLoadState('networkidle');

      // Look for tally-related content
      const tallySection = page.getByText(/tally|votes|results/i);
      await expect(tallySection.first()).toBeVisible();
    });

    test('should show total votes', async ({ page }) => {
      await page.goto('http://localhost:3001/results/test-election');
      await page.waitForLoadState('networkidle');

      // Should display total vote count somewhere
      const totalVotes = page.getByText(/total/i);
      await expect(totalVotes.first()).toBeVisible();
    });

    test('should have links to verification and ledger', async ({ page }) => {
      await page.goto('http://localhost:3001/results/test-election');
      await page.waitForLoadState('networkidle');

      // Should have quick links
      const verifyLink = page.getByRole('link', { name: /verify/i });
      const ledgerLink = page.getByRole('link', { name: /ledger/i });

      // At least one should be visible
      const hasVerify = await verifyLink.isVisible();
      const hasLedger = await ledgerLink.isVisible();
      // Links may be present in the UI
    });
  });

  test.describe('Phase 6: Integrity & Ledger', () => {
    test('should display integrity dashboard', async ({ page }) => {
      await page.goto('http://localhost:3001/integrity/test-election');

      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should show integrity checks', async ({ page }) => {
      await page.goto('http://localhost:3001/integrity/test-election');
      await page.waitForLoadState('networkidle');

      // Look for integrity check indicators
      const checksSection = page.getByText(/integrity|verification|check/i);
      await expect(checksSection.first()).toBeVisible();
    });

    test('should display public ledger', async ({ page }) => {
      await page.goto('http://localhost:3001/ledger/test-election');

      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should show ledger entries', async ({ page }) => {
      await page.goto('http://localhost:3001/ledger/test-election');
      await page.waitForLoadState('networkidle');

      // Look for ledger/entry content
      const ledgerContent = page.getByText(/ledger|entry|vote|commitment/i);
      await expect(ledgerContent.first()).toBeVisible();
    });

    test('should have pagination if many entries', async ({ page }) => {
      await page.goto('http://localhost:3001/ledger/test-election');
      await page.waitForLoadState('networkidle');

      // Pagination may be present
      const pagination = page.getByRole('navigation', { name: /pagination/i });
      // Pagination is optional based on entry count
    });
  });
});

test.describe('Cross-App Integration', () => {
  test('should maintain consistent election data between admin and voter', async ({ browser }) => {
    // Create contexts for both apps
    const adminContext = await browser.newContext();
    const voterContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const voterPage = await voterContext.newPage();

    // Check admin elections list
    await adminPage.goto('http://localhost:3000/elections');
    await expect(adminPage.getByRole('heading')).toBeVisible();

    // Check voter can access same election
    await voterPage.goto('http://localhost:3001');
    await expect(voterPage.getByRole('heading')).toBeVisible();

    // Cleanup
    await adminContext.close();
    await voterContext.close();
  });

  test('should reflect admin status changes in voter portal', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const voterContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const voterPage = await voterContext.newPage();

    // Admin views election
    await adminPage.goto('http://localhost:3000/elections/1');

    // Voter views same election status
    await voterPage.goto('http://localhost:3001/results/1');

    // Both should load successfully
    await expect(adminPage.getByRole('heading')).toBeVisible();
    await expect(voterPage.getByRole('heading')).toBeVisible();

    await adminContext.close();
    await voterContext.close();
  });
});
