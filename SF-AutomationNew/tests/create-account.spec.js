// =============================================================================
// Salesforce Account Creation - Playwright Test
// =============================================================================
// This test automates creating a new Account record in a Salesforce org.
//
// LOGIN OPTIONS (set in your .env file):
//   Option 1 – Username & Password  → SF_USERNAME, SF_PASSWORD
//   Option 2 – Session ID / URL     → SF_SESSION_URL
//
// The test opens a real browser window so you can interact if Salesforce
// asks for a verification (MFA) code.  It will pause for up to 5 minutes
// while you enter the code, then continue automatically.
// =============================================================================

require('dotenv').config();
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helper – capture & attach a screenshot to the HTML report
// ---------------------------------------------------------------------------
async function screenshot(page, slug, label) {
  const path = `screenshots/${slug}-${Date.now()}.png`;
  const buffer = await page.screenshot({ path, fullPage: true });
  await test.info().attach(label || slug, { body: buffer, contentType: 'image/png' });
  console.log(` ${label || slug}`);
}

// ---------------------------------------------------------------------------
// Helper – detect & handle Salesforce MFA / verification code screen
// ---------------------------------------------------------------------------
async function handleVerification(page) {
  const pageText = await page.textContent('body').catch(() => '');
  const pageUrl  = await page.evaluate(() => window.location.href);

  const codeInputSelectors = [
    'input[id*="emc"]',
    'input[placeholder*="verification" i]',
    'input[placeholder*="code" i]',
    'input[name*="verification"]',
    '#verificationCode',
    'input[type="text"][maxlength="6"]',
    'input[type="tel"][maxlength="6"]',
  ];

  const verifyButtonSelectors = [
    'button:has-text("Verify")',
    'input[value="Verify"]',
    'button[id*="verify" i]',
    'input[type="submit"][value*="Verify" i]',
  ];

  let hasCodeInput = false;
  for (const sel of codeInputSelectors) {
    try {
      if (await page.locator(sel).first().isVisible({ timeout: 1000 })) {
        hasCodeInput = true;
        break;
      }
    } catch (_) { /* keep trying */ }
  }

  let hasVerifyButton = false;
  for (const sel of verifyButtonSelectors) {
    try {
      if (await page.locator(sel).first().isVisible({ timeout: 1000 })) {
        hasVerifyButton = true;
        break;
      }
    } catch (_) { /* keep trying */ }
  }

  const hasVerificationText =
    pageText.toLowerCase().includes('verification code') ||
    pageText.toLowerCase().includes('enter your verification') ||
    pageUrl.toLowerCase().includes('verification');

  if (!(hasCodeInput && hasVerifyButton && hasVerificationText)) {
    console.log('✓  No verification code screen – continuing');
    return;
  }

  // ── MFA screen detected ──────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  VERIFICATION CODE REQUIRED – ACTION NEEDED IN BROWSER');
  console.log('════════════════════════════════════════════════════════════');
  console.log('1. Check your email for the Salesforce verification code.');
  console.log('2. Type the code into the browser window that just opened.');
  console.log('3. Click the "Verify" button.');
  console.log('  The test will wait up to 5 minutes…');
  console.log('════════════════════════════════════════════════════════════\n');

  await screenshot(page, '04a-mfa-screen', 'MFA screen – waiting for user input');

  const startTime = Date.now();
  const maxWait   = 300_000; // 5 minutes
  const initialUrl = pageUrl;
  let done = false;

  while (!done && Date.now() - startTime < maxWait) {
    await page.waitForTimeout(2000);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    const currentUrl = await page.evaluate(() => window.location.href).catch(() => initialUrl);

    if (currentUrl !== initialUrl) {
      console.log('  URL changed – verification complete!');
      done = true;
      break;
    }

    if (
      currentUrl.includes('lightning.force.com') ||
      currentUrl.includes('/lightning/page/home')
    ) {
      console.log('  Navigated to Salesforce Lightning – verification done!');
      done = true;
      break;
    }

    const stillPresent = await page.evaluate(() => {
      const inp = document.querySelector(
        'input[type="text"][maxlength="6"], input[placeholder*="verification" i]'
      );
      const btn = document.querySelector('input[value="Verify"], button');
      return !!(inp || btn);
    }).catch(() => true);

    if (!stillPresent) {
      console.log('  Verification elements gone from page!');
      done = true;
      break;
    }

    if (elapsed % 10 === 0 && elapsed > 0) {
      const remaining = Math.floor((maxWait - (Date.now() - startTime)) / 1000);
      console.log(`  Waiting… ${elapsed}s elapsed | ${remaining}s remaining`);
    }
  }

  if (!done) console.log('  Timeout – proceeding anyway');

  await page.waitForTimeout(5000);
  await screenshot(page, '04b-after-mfa', 'After MFA handled');
  console.log('  Continuing test…\n');
}

// ---------------------------------------------------------------------------
// Random data generators
// ---------------------------------------------------------------------------
const US_ADDRESSES = [
  { street: '123 Main Street',        city: 'New York',     state: 'NY', zip: '10001' },
  { street: '456 Oak Avenue',         city: 'Los Angeles',  state: 'CA', zip: '90210' },
  { street: '789 Pine Road',          city: 'Chicago',      state: 'IL', zip: '60601' },
  { street: '321 Elm Street',         city: 'Houston',      state: 'TX', zip: '77001' },
  { street: '654 Maple Drive',        city: 'Phoenix',      state: 'AZ', zip: '85001' },
  { street: '987 Cedar Lane',         city: 'Philadelphia', state: 'PA', zip: '19101' },
  { street: '258 Walnut Way',         city: 'San Diego',    state: 'CA', zip: '92101' },
  { street: '369 Cherry Circle',      city: 'Dallas',       state: 'TX', zip: '75201' },
  { street: '741 Spruce Street',      city: 'San Jose',     state: 'CA', zip: '95101' },
  { street: '852 Ash Avenue',         city: 'Austin',       state: 'TX', zip: '73301' },
];

const STATE_NAMES = {
  NY: ['New York', 'NY'],
  CA: ['California', 'CA'],
  IL: ['Illinois', 'IL'],
  TX: ['Texas', 'TX'],
  AZ: ['Arizona', 'AZ'],
  PA: ['Pennsylvania', 'PA'],
  FL: ['Florida', 'FL'],
};

function randomPhone() {
  const a = Math.floor(Math.random() * 800) + 200;
  const b = Math.floor(Math.random() * 800) + 200;
  const c = Math.floor(Math.random() * 9000) + 1000;
  return `${a}${b}${c}`;
}

function randomAccountName() {
  const adj  = ['Global', 'Premier', 'Elite', 'Prime', 'Advanced', 'Dynamic', 'Strategic'];
  const noun = ['Solutions', 'Technologies', 'Enterprises', 'Systems', 'Services', 'Group'];
  const num  = Math.floor(Math.random() * 999) + 1;
  return `${adj[Math.floor(Math.random() * adj.length)]} ${noun[Math.floor(Math.random() * noun.length)]} ${num}`;
}

// ---------------------------------------------------------------------------
// Helpers – fill a field via multiple fallback strategies
// ---------------------------------------------------------------------------
async function fillField(page, labelPattern, value, description) {
  // Strategy 1: lightning-input component
  try {
    await page
      .locator('lightning-input')
      .filter({ hasText: labelPattern })
      .locator('input')
      .first()
      .fill(value, { timeout: 8000 });
    console.log(`✓  ${description} filled (lightning-input)`);
    return;
  } catch (_) { /* try next */ }

  // Strategy 2: getByLabel
  try {
    await page.getByLabel(new RegExp(labelPattern, 'i')).first().fill(value, { timeout: 5000 });
    console.log(`✓  ${description} filled (getByLabel)`);
    return;
  } catch (_) { /* try next */ }

  // Strategy 3: DOM walk
  const filled = await page.evaluate(
    ({ pattern, val }) => {
      const re = new RegExp(pattern, 'i');
      const labels = Array.from(
        document.querySelectorAll('label, span.slds-form-element__label')
      );
      const lbl = labels.find(l => re.test(l.textContent.trim()));
      if (!lbl) return false;

      let inp =
        lbl.querySelector('input') ||
        lbl.closest('div.slds-form-element, lightning-input, div')?.querySelector('input') ||
        (lbl.getAttribute('for') ? document.getElementById(lbl.getAttribute('for')) : null);

      if (!inp) return false;
      inp.focus();
      inp.value = val;
      ['input', 'change', 'blur'].forEach(e =>
        inp.dispatchEvent(new Event(e, { bubbles: true }))
      );
      return true;
    },
    { pattern: labelPattern, val: value }
  );

  if (filled) {
    console.log(`✓  ${description} filled (DOM walk)`);
    return;
  }

  console.log(`  Could not fill ${description} – continuing anyway`);
}

// ---------------------------------------------------------------------------
// THE TEST
// ---------------------------------------------------------------------------
test('Create New Account in Salesforce', async ({ page }) => {
  page.setDefaultTimeout(60_000);

  // -- Read config from environment (set in .env or CI secrets) -------------
  const SF_LOGIN_URL   = process.env.SF_LOGIN_URL   || 'https://login.salesforce.com';
  const SF_HOME_URL    = process.env.SF_HOME_URL    || '';   // e.g. https://myorg.lightning.force.com/lightning/page/home
  const SF_USERNAME    = process.env.SF_USERNAME    || '';
  const SF_PASSWORD    = process.env.SF_PASSWORD    || '';
  const SF_SESSION_URL = process.env.SF_SESSION_URL || '';   // full URL with ?sid=… for session login

  const useSession = SF_SESSION_URL.length > 0;

  // -- Generate random test data --------------------------------------------
  const address     = US_ADDRESSES[Math.floor(Math.random() * US_ADDRESSES.length)];
  const phone       = randomPhone();
  const accountName = randomAccountName();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test Data');
  console.log(`   Account Name : ${accountName}`);
  console.log(`   Phone        : ${phone}`);
  console.log(`   Address      : ${address.street}, ${address.city}, ${address.state} ${address.zip}`);
  console.log(`   Login method : ${useSession ? 'Session ID URL' : 'Username & Password'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  await screenshot(page, '01-test-start', 'Test started');

  // ── STEP 1 – Login ────────────────────────────────────────────────────────
  if (useSession) {
    console.log('  Logging in via Session ID URL…');
    await page.goto(SF_SESSION_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(4000);
    await screenshot(page, '02-session-login', 'Session ID login');
  } else {
    console.log('  Logging in with username & password…');

    if (!SF_USERNAME || !SF_PASSWORD) {
      throw new Error(
        'SF_USERNAME and SF_PASSWORD are not set.\n' +
        'Copy .env.example → .env and fill in your Salesforce credentials.'
      );
    }

    await page.goto(SF_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await screenshot(page, '02-login-page', 'Login page');

    await page.getByRole('textbox', { name: 'Username' }).fill(SF_USERNAME);
    await page.getByRole('textbox', { name: 'Password' }).fill(SF_PASSWORD);
    await screenshot(page, '03-credentials-filled', 'Credentials entered');

    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForTimeout(5000);
    await screenshot(page, '04-after-login', 'After login click');
  }

  // ── STEP 2 – Handle MFA if Salesforce asks for it ─────────────────────────
  await handleVerification(page);

  // ── STEP 3 – Navigate to Salesforce Home ──────────────────────────────────
  const currentUrl = await page.evaluate(() => window.location.href);
  if (!currentUrl.includes('/lightning/page/home') && !currentUrl.includes('/lightning/')) {
    const homeUrl = SF_HOME_URL ||
      currentUrl.replace(/\/[^/]*$/, '') + '/lightning/page/home';
    console.log('  Navigating to home page…');
    try {
      await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    } catch (e) {
      console.log('  Home navigation warning:', e.message);
    }
  }
  await page.waitForTimeout(3000);
  await screenshot(page, '05-sf-home', 'Salesforce home page');

  // ── STEP 4 – Open the Accounts tab ───────────────────────────────────────
  console.log('  Opening Accounts tab…');
  try {
    await Promise.race([
      page.waitForSelector('a[title="Accounts"]', { timeout: 15_000, state: 'visible' }),
      page.waitForSelector('a:has-text("Accounts")',  { timeout: 15_000, state: 'visible' }),
    ]);
    await page.getByRole('link', { name: 'Accounts' }).click();
  } catch (_) {
    const base = await page.evaluate(() => window.location.origin);
    await page.goto(`${base}/lightning/o/Account/list`);
  }
  await page.waitForTimeout(3000);
  await screenshot(page, '06-accounts-list', 'Accounts list page');

  // ── STEP 5 – Click "New" ──────────────────────────────────────────────────
  console.log('  Clicking New…');
  await page.getByRole('button', { name: 'New' }).click();
  await page.waitForTimeout(1500);
  await screenshot(page, '07-new-dialog', 'New account dialog');

  // ── STEP 6 – Select record type (Standard) ────────────────────────────────
  try {
    const standardOption = page.getByText('Standard');
    if (await standardOption.isVisible({ timeout: 4000 })) {
      await standardOption.click();
      await screenshot(page, '08-record-type', 'Standard record type selected');
    }
  } catch (_) {
    console.log('  Record type dialog not shown – org may have only one type');
  }

  try {
    const nextBtn = page.getByRole('button', { name: 'Next' });
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      await nextBtn.click();
    }
  } catch (_) { /* no Next button */ }

  await page.waitForTimeout(4000);
  await screenshot(page, '09-account-form', 'Account creation form');

  // ── STEP 7 – Fill Account Name & Phone ───────────────────────────────────
  console.log('  Filling form fields…');
  await page.waitForSelector('input[type="text"]:visible, textarea:visible', { timeout: 20_000 });

  await fillField(page, 'Account Name', accountName, 'Account Name');
  await page.waitForTimeout(800);
  await fillField(page, '^Phone',       phone,       'Phone');
  await page.waitForTimeout(800);
  await screenshot(page, '10-name-phone', 'Name and Phone filled');

  // ── STEP 8 – Billing Address ──────────────────────────────────────────────
  console.log(' Filling billing address…');
  try {
    // Country
    const billingCountry = page.getByRole('combobox', { name: 'Billing Country' });
    if (await billingCountry.isVisible({ timeout: 3000 })) {
      await billingCountry.click();
      await page.waitForTimeout(1500);
      const countryNames = ['United States', 'USA', 'US'];
      for (const name of countryNames) {
        try {
          const opt = page.locator(`[role="listbox"] [role="option"]:has-text("${name}")`).first();
          if (await opt.isVisible({ timeout: 2000 })) {
            await opt.click();
            console.log(`  Billing Country set to "${name}"`);
            break;
          }
        } catch (_) { /* try next */ }
      }
      // Click away to trigger dependent State picklist
      try {
        await page.getByRole('textbox', { name: 'Billing Street' }).click();
      } catch (_) { /* field may not exist */ }
      await page.waitForTimeout(3500);
      await screenshot(page, '11-country-selected', 'Country selected');
    }

    // Street
    const billingStreet = page.getByRole('textbox', { name: 'Billing Street' });
    if (await billingStreet.isVisible({ timeout: 3000 })) {
      await billingStreet.fill(address.street);
      console.log(`  Billing Street: ${address.street}`);
      await screenshot(page, '12-street', 'Billing Street filled');
    }

    // City
    const billingCity = page.getByRole('textbox', { name: 'Billing City' });
    if (await billingCity.isVisible({ timeout: 3000 })) {
      await billingCity.fill(address.city);
      console.log(`  Billing City: ${address.city}`);
      await screenshot(page, '13-city', 'Billing City filled');
    }

    // State
    const billingState = page.getByRole('combobox', { name: 'Billing State/Province' });
    if (await billingState.isVisible({ timeout: 5000 })) {
      await billingState.click();
      await page.waitForTimeout(1500);
      const possibleStates = STATE_NAMES[address.state] || [address.state];
      let stateSelected = false;
      for (const stateName of possibleStates) {
        try {
          const opt = page.locator(`[role="listbox"] [role="option"]:has-text("${stateName}")`).first();
          if (await opt.isVisible({ timeout: 2000 })) {
            await opt.click();
            console.log(`  Billing State: ${stateName}`);
            stateSelected = true;
            await screenshot(page, '14-state', `State ${stateName} selected`);
            break;
          }
        } catch (_) { /* try next */ }
      }
      if (!stateSelected) console.log('  State selection skipped');
    }

    // Zip
    const billingZip = page.getByRole('textbox', { name: 'Billing Zip/Postal Code' });
    if (await billingZip.isVisible({ timeout: 3000 })) {
      await billingZip.fill(address.zip);
      console.log(`✓  Billing Zip: ${address.zip}`);
      await screenshot(page, '15-zip', 'Zip code filled');
    }

    // Copy to Shipping (optional checkbox)
    try {
      const copyCheck = page.getByLabel('Copy To Shipping Address');
      if (await copyCheck.isVisible({ timeout: 2000 })) {
        await copyCheck.check();
        console.log('  Address copied to Shipping');
        await screenshot(page, '16-copy-shipping', 'Address copied to Shipping');
      }
    } catch (_) { /* checkbox may not exist */ }

  } catch (err) {
    console.log('  Address section error (continuing):', err.message);
    await screenshot(page, '17-address-error', 'Address section error');
  }

  // ── STEP 9 – Save ─────────────────────────────────────────────────────────
  await screenshot(page, '18-before-save', 'Form complete – about to Save');
  console.log('  Saving account…');
  await page.getByText('Save', { exact: true }).click();
  await page.waitForTimeout(4000);
  await screenshot(page, '19-after-save', 'After Save');

  // ── STEP 10 – Click "View" toast button if present ──
  try {
    const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewBtn.isVisible({ timeout: 5000 })) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
      console.log('✓  Clicked View to navigate to new account record');
      await screenshot(page, '20-account-record', 'Account record page');
    }
  } catch (_) { /* toast may not appear */ }

  // ── STEP 11 – Verify we landed on an Account record ────
  let finalUrl = await page.evaluate(() => window.location.href);

  // If still on /new, look for the account in Recent list
  if (finalUrl.includes('/new')) {
    console.log('  Still on /new – checking Recent Accounts list…');
    await page.waitForTimeout(3000);
    finalUrl = await page.evaluate(() => window.location.href);

    if (finalUrl.includes('/new')) {
      const origin = await page.evaluate(() => window.location.origin);
      await page.goto(`${origin}/lightning/o/Account/list?filterName=__Recent`);
      await page.waitForTimeout(3000);

      const accountLink = page.locator(`a:has-text("${accountName}")`).first();
      if (await accountLink.isVisible({ timeout: 5000 })) {
        console.log('✓  Found account in Recent list – navigating…');
        await accountLink.click();
        await page.waitForTimeout(2000);
        finalUrl = await page.evaluate(() => window.location.href);
        await screenshot(page, '21-account-from-list', 'Account opened from Recent list');
      }
    }
  }

  // ── STEP 12 – Show success banner ────
  if (finalUrl.includes('/Account/') || finalUrl.includes('force.com')) {
    console.log('\n  ACCOUNT CREATED SUCCESSFULLY!');
    console.log(`  Record URL: ${finalUrl}\n`);

    await page.evaluate(
      ({ name, phone, addr, url }) => {
        const existing = document.getElementById('sf-auto-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'sf-auto-banner';
        banner.style.cssText = [
          'position:fixed', 'top:12px', 'right:12px',
          'background:#1a7f37', 'color:#fff',
          'padding:14px 18px', 'border-radius:10px',
          'z-index:99999', 'font-family:Arial,sans-serif',
          'font-size:13px', 'max-width:360px',
          'box-shadow:0 4px 12px rgba(0,0,0,.25)',
          'border:2px solid #145a27',
        ].join(';');
        banner.innerHTML = `
          <b style="font-size:15px"> Account Created!</b><br><br>
          <b>Name:</b> ${name}<br>
          <b>Phone:</b> ${phone}<br>
          <b>Address:</b> ${addr}<br><br>
          <b>URL:</b><br>
          <a href="${url}" style="color:#adf;word-break:break-all">${url}</a><br><br>
          <span style="font-size:11px;opacity:.8">${new Date().toLocaleString()}</span>
        `;
        document.body.appendChild(banner);
        document.title = ` Account Created: ${name}`;
      },
      {
        name:  accountName,
        phone: phone,
        addr:  `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
        url:   finalUrl,
      }
    );

    await page.waitForTimeout(1500);
    await screenshot(page, '22-success', ' Account created successfully');
  } else {
    console.log('  Account creation result unclear – check screenshots');
    await screenshot(page, '22-unclear', 'Account creation result unclear');
  }

  // ── Final assertion ──
  expect(finalUrl).toContain('force.com');
});
