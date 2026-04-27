// playwright.config.js
// ---------------------------------------------------------------------------
// Global Playwright configuration for the Salesforce Account INSERT Automation.
// ---------------------------------------------------------------------------

module.exports = {
  // 7-minute overall test timeout 
  timeout: 420_000,

  use: {
    headless: false,               
    screenshot: 'on',              // Always capture screenshots
    video: {
      mode: 'on',                  // Record the whole test run
      size: { width: 1920, height: 1080 },
    },
    trace: 'retain-on-failure',    // Keep trace on failure for debugging
    actionTimeout:    30_000,
    navigationTimeout: 60_000,
    launchOptions: {
      args: ['--start-maximized'],
    },
    viewport: null,                // Honour --start-maximized (full window)
  },

  retries: 0,

  reporter: [
    // HTML report – opens automatically after the run
    ['html', { open: 'always', outputFolder: 'playwright-report' }],
    // Plain-text progress in the terminal
    ['list'],
  ],

  globalSetup: require.resolve('./global-setup.js'),

  projects: [
    {
      name: 'salesforce-account',
      use: {
        actionTimeout:    30_000,
        navigationTimeout: 60_000,
      },
    },
  ],
};
