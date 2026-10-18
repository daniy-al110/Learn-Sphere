const { test, expect } = require('@playwright/test');

// Test the Next.js Frontend
test('Next.js Frontend - Login Flow', async ({ page }) => {
  // Navigate to the Next.js app
  await page.goto('http://localhost:3001');

  // Fill in login credentials
  await page.fill('#loginEmail', 'daniyal@learnsphere.com');
  await page.fill('#loginPassword', 'd');

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for the redirect to happen
  await page.waitForURL('**/admin-dashboard*');

  // Verify that we successfully reached the dashboard
  const currentUrl = page.url();
  expect(currentUrl).toContain('admin-dashboard');
});

// Test the Old Vanilla HTML Frontend (if running on port 4000)
test('Old HTML Frontend - Login Flow', async ({ page }) => {
  // Navigate to the old vanilla frontend
  await page.goto('http://localhost:4000/login.html');

  // Fill in login credentials
  await page.fill('#loginEmail', 'daniyal@learnsphere.com');
  await page.fill('#loginPassword', 'd');

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for the redirect to happen
  await page.waitForURL('**/admin-dashboard.html*');

  // Verify that we successfully reached the dashboard
  const currentUrl = page.url();
  expect(currentUrl).toContain('admin-dashboard.html');
});
