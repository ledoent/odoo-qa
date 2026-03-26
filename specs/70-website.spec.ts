import { test, expect } from "../fixtures/workflow";

test.describe("Website: Frontend Workflows", () => {
  test("homepage renders", async ({ page, odoo }) => {
    odoo.skipUnless(test, "website");
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    expect(await page.evaluate(() => document.readyState)).toBe("complete");
    await odoo.checkpoint("website-wf-01-homepage");
  });

  test("contact form submission", async ({ page, odoo }) => {
    odoo.skipUnless(test, "website");

    await page.goto("/contactus");
    await page.waitForTimeout(1000);

    // Fill contact form fields (common Odoo contact form structure)
    const nameInput = page.locator("input[name='partner_name'], input[name='name'], #partner_name");
    if (await nameInput.first().isVisible().catch(() => false)) {
      await nameInput.first().fill("E2E Test Contact");
    }

    const emailInput = page.locator("input[name='email_from'], input[name='email'], #email_from");
    if (await emailInput.first().isVisible().catch(() => false)) {
      await emailInput.first().fill("e2e@test.example.com");
    }

    const messageInput = page.locator(
      "textarea[name='description'], textarea[name='message'], #description"
    );
    if (await messageInput.first().isVisible().catch(() => false)) {
      await messageInput.first().fill("Automated E2E test submission");
    }

    await odoo.checkpoint("website-wf-02-contact-form-filled");

    // Submit (don't actually submit to avoid creating test data in production)
    // Just verify the form is fillable and the submit button exists
    const submitBtn = page.locator(
      "button[type='submit'], a.btn:has-text('Submit'), input[type='submit']"
    );
    await expect(submitBtn.first()).toBeVisible();
  });
});
